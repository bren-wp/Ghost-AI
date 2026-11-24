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
