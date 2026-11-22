"""Ghost AI by Brendigo: regression guard for the Windows dark-first startup.

This checks source-level wiring, not actual GPU/WebView frame delivery.
The Windows first-paint CI job is responsible for runtime evidence.
"""

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class DarkStartupContractTests(unittest.TestCase):
    def test_main_window_does_not_show_before_webview_is_ready(self):
        config = json.loads((ROOT / "src-tauri/tauri.conf.json").read_text(encoding="utf-8"))
        window = config["app"]["windows"][0]
        self.assertIs(window["visible"], False)
        self.assertEqual(window["backgroundColor"].lower(), "#080f1a")
        self.assertEqual(window["theme"].lower(), "dark")

    def test_renderer_has_first_commit_and_native_fallback(self):
        frontend = (ROOT / "src/main.tsx").read_text(encoding="utf-8")
        rust = (ROOT / "src-tauri/src/lib.rs").read_text(encoding="utf-8")
        self.assertIn("MutationObserver", frontend)
        self.assertIn("getCurrentWindow().show()", frontend)
        self.assertIn("querySelector('#splash')", frontend)
        self.assertIn('app.get_webview_window("main")', rust)
        self.assertIn("window.is_visible()", rust)
        self.assertIn("window.show()", rust)

    def test_dark_html_prepaint_and_permission(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        capability = json.loads(
            (ROOT / "src-tauri/capabilities/default.json").read_text(encoding="utf-8")
        )
        self.assertIn('content="dark"', html)
        self.assertIn("background-color: #080f1a", html)
        self.assertIn('id="splash"', html)
        self.assertIn("core:window:allow-show", capability["permissions"])

    def test_first_paint_is_a_required_windows_gate(self):
        workflow = (ROOT / ".github/workflows/ghost-ai-checks.yml").read_text(
            encoding="utf-8"
        )
        self.assertIn("ghost-ai-first-paint.ps1", workflow)
        self.assertIn("steps.first_paint.outcome != 'success'", workflow)
        self.assertIn("coverage-report.txt", workflow)


if __name__ == "__main__":
    unittest.main()
