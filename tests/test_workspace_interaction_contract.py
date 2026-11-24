"""Source wiring guard; runtime dialog and navigation tests remain required."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class WorkspaceInteractionContract(unittest.TestCase):
    def test_chat_page_owns_global_interaction_dialogs(self):
        page = (ROOT / "src/pages/chat-page.tsx").read_text(encoding="utf-8")
        self.assertIn("<ChatView showInteractionDialogs={false} documentMode={documentMode} />", page)
        for dialog in ("PermissionApprovalDialog", "McpElicitationDialog", "AskUserDialog"):
            self.assertEqual(page.count(f"<{dialog} />"), 1)
            self.assertGreater(page.index(f"<{dialog} />"), page.index("</SidebarProvider>"))

    def test_reference_workspaces_keep_existing_conversation_view(self):
        page = (ROOT / "src/pages/chat-page.tsx").read_text(encoding="utf-8")
        for component in ("AgentsWorkspace", "DocumentsWorkspace", "ProvidersWorkspace", "SettingsWorkspace"):
            self.assertIn(f"<{component}", page)
        self.assertIn("<ChatView showInteractionDialogs={false} documentMode={documentMode} />", page)

    def test_reference_capture_uses_real_accessible_navigation(self):
        script = (ROOT / "scripts/ghost-ai-capture-screenshot.ps1").read_text(encoding="utf-8")
        nav = (ROOT / "src/components/sidebar/sidebar-navigation.tsx").read_text(encoding="utf-8")
        workflow = (ROOT / ".github/workflows/ghost-ai-checks.yml").read_text(encoding="utf-8")
        self.assertIn("ghost-ai-nav-${item.id}", nav)
        self.assertIn("InvokePattern", script)
        self.assertIn("ControlType]::Button", script)
        self.assertIn("-NavigationButton", script)
        self.assertIn("Automation]::Compare($button, $focused)", script)
        self.assertIn("GetForegroundWindow() -ne $Window", script)
        self.assertIn("visible.Count -eq 1", script)
        self.assertIn("expected visible $Surface content was not found", script)
        self.assertIn("@('home', 'conversations', 'agents', 'documents', 'providers', 'settings')", workflow)
        self.assertIn("Ghost-AI-PR-Reference-Screens", workflow)
