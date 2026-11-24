"""Source contract for settings navigation at short desktop window heights.

This is not a browser layout test. Actual scroll reachability and screenshots
remain mandatory on real Windows, Linux and macOS displays.
"""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class SettingsViewportContractTests(unittest.TestCase):
    def test_settings_sidebar_has_a_bounded_height_and_scrollable_content(self):
        source = (ROOT / "src/components/settings-dialog.tsx").read_text(encoding="utf-8")
        self.assertIn(
            'SidebarProvider className="h-[min(84dvh,680px)] min-h-0 min-w-0 items-stretch overflow-hidden"',
            source,
        )
        self.assertIn('className="hidden h-full min-h-0 shrink-0 md:flex"', source)
        self.assertIn('SidebarContent className="overflow-y-auto overscroll-contain"', source)
        self.assertIn('main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"', source)
        self.assertIn("aria-current={item.name === activeSection ? 'true' : undefined}", source)

    def test_language_options_disclose_fallback_and_partial_resources(self):
        source = (ROOT / "src/components/settings-dialog.tsx").read_text(encoding="utf-8")
        self.assertIn("getInterfaceTranslationStatus(lang.code)", source)
        self.assertIn("t('languagePartial')", source)
        self.assertIn("t('languageFallback')", source)


if __name__ == "__main__":
    unittest.main()
