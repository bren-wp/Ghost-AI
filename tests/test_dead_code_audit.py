"""Regression fixtures for the conservative static candidate inventory."""
import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("dead_code_audit", ROOT / "scripts/ghost-ai-dead-code-audit.py")
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class DeadCodeAuditTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.patcher = patch.object(audit, "ROOT", self.root)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)

    def put(self, name, content):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def test_setup_and_existing_asset_are_not_false_positive_candidates(self):
        self.put("src/main.tsx", "import './style.css'; import './missing';")
        self.put("src/style.css", "body {}")
        self.put("src/test/setup.ts", "export const setup = true")
        self.put("src/unused.ts", "export const unused = true")
        self.put("vitest.config.ts", "export default { test: { setupFiles: ['./src/test/setup.ts'] } }")
        total, candidates, unresolved = audit.ts_candidates()
        self.assertEqual(total, 2)
        self.assertEqual(candidates, ["src/unused.ts"])
        self.assertEqual(unresolved, 1)

    def test_cargo_explicit_and_implicit_binary_entrypoints(self):
        self.put("src-tauri/Cargo.toml", '[package]\nname="test"\nversion="0.1.0"\n[[bin]]\nname="other"\npath="src/other.rs"\n')
        for name in ("lib.rs", "other.rs", "bin/tool.rs", "bin/another/main.rs", "unused.rs"):
            self.put("src-tauri/src/" + name, "fn main() {}")
        total, candidates = audit.rust_candidates()
        self.assertEqual(total, 5)
        self.assertEqual(candidates, ["src-tauri/src/unused.rs"])

    def test_duplicate_groups_exclude_generated_types_and_tiny_files(self):
        text = "export const data = " + repr("x" * 120)
        for name in ("src/a.ts", "src/b.ts", "src/types/generated/c.ts"):
            self.put(name, text)
        self.put("src/x.ts", "tiny")
        self.put("src/y.ts", "tiny")
        self.assertEqual(audit.exact_duplicates(), [["src/a.ts", "src/b.ts"]])


    def test_structural_clones_detect_renamed_identifiers_and_literals(self):
        first = """function processInvoice(items) {
            const result = [];
            for (const item of items) {
                if (item.enabled === true) {
                    const total = item.price * item.quantity + 10;
                    result.push({ name: item.name, total: total });
                } else {
                    result.push({ name: item.name, total: 0 });
                }
            }
            return result;
        }"""
        second = (first.replace("processInvoice", "prepareOrders")
                  .replace("items", "orders").replace("item", "order")
                  .replace("result", "output").replace("price", "cost")
                  .replace("quantity", "units").replace("10", "20"))
        self.put("src/first.ts", first)
        self.put("src/second.ts", second)
        self.put("src/types/generated/third.ts", first)
        self.put("src/__tests__/copy.test.ts", first)
        count, groups, skipped = audit.structural_clone_candidates()
        self.assertEqual(count, 2)
        self.assertEqual(skipped, 0)
        self.assertTrue(any({entry[0] for entry in group} == {"src/first.ts", "src/second.ts"} for group in groups))

    def test_clone_tokenization_retains_control_flow_and_operator_differences(self):
        first = audit.clone_tokens("if (user.allowed) { return 1; }")
        second = audit.clone_tokens("if (admin.enabled) { return 2; }")
        third = audit.clone_tokens("if (!admin.enabled) { return 2; }")
        self.assertEqual(first, second)
        self.assertNotEqual(second, third)

    def test_clone_fingerprints_are_bounded_for_repeated_boilerplate(self):
        source = "\n".join(["if (allowed) { return value; }"] * 30)
        for index in range(audit.CLONE_MAX_OCCURRENCES + 1):
            self.put(f"src/file{index}.ts", source)
        count, groups, skipped = audit.structural_clone_candidates()
        self.assertEqual(count, audit.CLONE_MAX_OCCURRENCES + 1)
        self.assertGreater(skipped, 0)
        self.assertEqual(groups, [])

    def test_cycle_inventory_distinguishes_components_from_one_way_edges(self):
        graph = {"a": {"b"}, "b": {"a", "c"}, "c": {"d"}, "d": set(), "e": {"e"}}
        self.assertEqual(audit.cyclic_components(graph), [["a", "b"], ["e"]])

    def test_complete_inventory_preserves_all_seed_groups(self):
        self.put("src/main.ts", "import './a';")
        self.put("src/a.ts", "import './main';")
        groups = [[("src/a.ts", i, i+3), ("src/main.ts", i, i+3)] for i in range(230)]
        with patch.object(audit, "structural_clone_candidates", return_value=(2, groups, 0)):
            output = self.root / "reports" / "audit.md"
            result = audit.report(output)
        import json
        complete = json.loads(output.with_name("ghost-ai-clone-inventory.json").read_text(encoding="utf-8"))
        self.assertEqual(len(complete["structural_clone_seed_groups"]), 230)
        self.assertEqual(result["typescript_cycle_candidates"], 1)
        self.assertEqual(complete["typescript_cycle_candidates"], [["src/a.ts", "src/main.ts"]])

    def test_legal_raw_imports_resolve_outside_src(self):
        self.put("src/main.ts", "import notice from '../legal/NOTICE.md?raw';")
        self.put("legal/NOTICE.md", "Legal notice")
        _, _, unresolved = audit.ts_candidates()
        self.assertEqual(unresolved, 0)
