# Ghost AI by Brendigo
"""Regression checks for security-sensitive packaging and capability boundaries.

Static checks complement dependency audits and runtime testing; they do not
establish that the application or its third-party integrations are vulnerability-free.
"""
from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class SecurityBoundaryTests(unittest.TestCase):
    def test_production_csp_blocks_script_eval_and_untrusted_frames(self):
        config = json.loads((ROOT / "src-tauri/tauri.conf.json").read_text(encoding="utf-8"))
        csp = config["app"]["security"]["csp"]
        self.assertEqual(csp["default-src"], "'self'")
        self.assertEqual(csp["script-src"], "'self'")
        self.assertEqual(csp["object-src"], "'none'")
        self.assertEqual(csp["frame-src"], "'none'")
        self.assertEqual(csp["form-action"], "'none'")
        self.assertNotIn("unsafe-eval", str(csp))
        self.assertNotIn("unsafe-inline", csp["script-src"])

    def test_window_capabilities_do_not_grant_broad_shell_or_home_access(self):
        capability = json.loads((ROOT / "src-tauri/capabilities/default.json").read_text(encoding="utf-8"))
        self.assertEqual(capability["windows"], ["main"])
        perms = set(capability["permissions"])
        forbidden = {
            "shell:allow-execute", "shell:allow-spawn", "shell:default",
            "fs:allow-home-read-recursive", "fs:allow-home-write-recursive",
            "fs:allow-root-read-recursive", "fs:allow-root-write-recursive",
        }
        self.assertFalse(perms & forbidden, perms & forbidden)
        self.assertIn("fs:allow-appdata-read-recursive", perms)
        self.assertIn("fs:allow-appdata-write-recursive", perms)

    def test_ui_automation_is_debug_only(self):
        rust = (ROOT / "src-tauri/src/lib.rs").read_text(encoding="utf-8")
        self.assertIn('#[cfg(debug_assertions)]\nmod ui_automation;', rust)
        self.assertIn('#[cfg(debug_assertions)]\n            ui_automation::start(app.handle());', rust)

    def test_mock_keyring_is_not_compiled_into_production(self):
        source = (ROOT / "src-tauri/src/keychain.rs").read_text(encoding="utf-8")
        # Keep both the backend installation and environment switch gated.
        self.assertIn(
            "#[cfg(any(test, debug_assertions))]\n    MOCK_KEYRING_INSTALL.call_once",
            source,
        )
        self.assertIn(
            "#[cfg(any(test, debug_assertions))]\n    if cfg!(test) || std::env::var_os(MOCK_KEYRING_ENV).is_some()",
            source,
        )

    def test_updater_requires_trusted_key(self):
        rust = (ROOT / "src-tauri/src/lib.rs").read_text(encoding="utf-8")
        self.assertIn('option_env!("GHOST_AI_UPDATER_PUBLIC_KEY")', rust)
        self.assertIn('tauri_plugin_updater::Builder::new().build()', rust)
        script = (ROOT / "scripts/configure_updater.py").read_text(encoding="utf-8")
        self.assertIn("GHOST_AI_UPDATER_PUBLIC_KEY", script)

    def test_release_requires_dependency_audits_and_platform_packages(self):
        workflow = (ROOT / ".github/workflows/ghost-ai-release.yml").read_text(encoding="utf-8")
        for required in (
            "pnpm audit --audit-level low",
            "cargo audit --file src-tauri/Cargo.lock",
            "cargo audit --file vendor/agent/Cargo.lock",
            "Ghost-AI-$tag-macOS-Portable.zip",
            "Linux.AppImage", "Linux.deb", "macOS.dmg",
            "Setup.exe", "Portable.exe", "Update.exe",
            "needs.windows.result == 'success'",
            "needs.linux.result == 'success'",
            "needs.macos.result == 'success'",
        ):
            with self.subTest(required=required):
                self.assertIn(required, workflow)


if __name__ == "__main__":
    unittest.main()
