"""Guard Ghost AI's TypeScript and Rust provider lists against silent drift."""

import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
UI = ROOT / "src/components/provider-settings-dialog/constants.ts"
REGISTRY = ROOT / "vendor/agent/crates/ghost-ai-agent-core/src/provider_registry.rs"
CATALOG = ROOT / "vendor/agent/crates/ghost-ai-agent-core/src/provider_catalog.rs"


def between(source: str, start: str, end: str) -> str:
    if start not in source or end not in source:
        raise AssertionError(f"Required provider table marker missing: {start} / {end}")
    return source.split(start, 1)[1].split(end, 1)[0]


class ProviderCatalogAlignmentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.ui = UI.read_text(encoding="utf-8")
        cls.registry = REGISTRY.read_text(encoding="utf-8")
        cls.catalog = CATALOG.read_text(encoding="utf-8")

    def test_every_visible_provider_is_registered_and_routable(self) -> None:
        ui_table = between(self.ui, "export const BUILTIN_PROVIDERS", "export const LLM_PROVIDERS")
        registry_table = between(
            self.registry, "pub fn builtin_providers()", "pub fn is_supported_fetch_provider"
        )
        catalog_table = self.catalog.split("/// Local catch-all endpoints", 1)[0]
        ui_ids = set(re.findall(r"\bid:\s*'([^']+)'", ui_table))
        registry_ids = set(re.findall(r'\bid:\s*"([^"]+)"', registry_table))
        route_ids = set(re.findall(r'\(\s*"([^"]+)"\s*,', catalog_table))
        self.assertGreaterEqual(len(ui_ids), 40)
        self.assertEqual(ui_ids, registry_ids, "Desktop and core visible providers differ")
        self.assertFalse(ui_ids - route_ids, f"Visible providers missing Rust chat routes: {ui_ids-route_ids}")

    def test_frontend_and_native_discovery_agree(self) -> None:
        ui = between(self.ui, "const FETCH_SUPPORTED_PROVIDERS = new Set([", "])")
        registry = between(
            self.registry, "pub fn is_supported_fetch_provider", "pub fn requires_api_key_for_model_fetch"
        )
        ui_ids = set(re.findall(r"'([^']+)'", ui))
        native_ids = set(re.findall(r'"([^"]+)"', registry))
        self.assertEqual(ui_ids, native_ids, "Model discovery capability flags disagree")
        for provider in ("ollama", "openai", "anthropic", "custom_anthropic", "zenmux", "zai", "tokenhub"):
            self.assertIn(provider, ui_ids)

    def test_native_local_auth_matches_desktop(self) -> None:
        native = between(
            self.registry, "pub fn requires_api_key_for_model_fetch", "#[cfg(test)]"
        )
        ui = between(self.ui, "const NO_KEY_FETCH_PROVIDERS = new Set([", "])")
        native_ids = set(re.findall(r'"([^"]+)"', native))
        ui_ids = set(re.findall(r"'([^']+)'", ui))
        self.assertEqual(native_ids, ui_ids)
        self.assertEqual(ui_ids, {"ollama", "lmstudio", "gpustack", "ovms"})


if __name__ == "__main__":
    unittest.main()
