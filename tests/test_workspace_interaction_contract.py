"""Source wiring guard; runtime dialog and navigation tests remain required."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class WorkspaceInteractionContract(unittest.TestCase):
    def test_chat_page_owns_global_interaction_dialogs(self):
        page = (ROOT / "src/pages/chat-page.tsx").read_text(encoding="utf-8")
        self.assertIn("<ChatView showInteractionDialogs={false} />", page)
        for dialog in ("PermissionApprovalDialog", "McpElicitationDialog", "AskUserDialog"):
            self.assertEqual(page.count(f"<{dialog} />"), 1)
            self.assertGreater(page.index(f"<{dialog} />"), page.index("</SidebarProvider>"))

    def test_reference_workspaces_keep_existing_conversation_view(self):
        page = (ROOT / "src/pages/chat-page.tsx").read_text(encoding="utf-8")
        for component in ("AgentsWorkspace", "DocumentsWorkspace", "ProvidersWorkspace", "SettingsWorkspace"):
            self.assertIn(f"<{component}", page)
        self.assertIn("<ChatView showInteractionDialogs={false} />", page)
