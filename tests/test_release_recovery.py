# Ghost AI by Brendigo
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from verify_release_version import verify


class ReleaseRecoveryTests(unittest.TestCase):
    def test_repository_versions_agree(self):
        verify(json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"])

    def test_mismatched_cargo_lock_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "src-tauri").mkdir()
            (root / "package.json").write_text('{"version":"1.2.3"}')
            (root / "src-tauri/tauri.conf.json").write_text('{"version":"1.2.3"}')
            (root / "src-tauri/Cargo.toml").write_text('[package]\nversion = "1.2.3"\n')
            lock = root / "src-tauri/Cargo.lock"
            lock.write_text('[[package]]\nname = "ghost-ai-desktop"\nversion = "1.2.2"\n')
            with self.assertRaisesRegex(ValueError, "Cargo.lock"):
                verify("1.2.3", root)
            lock.write_text('[[package]]\nname = "ghost-ai-desktop"\nversion = "1.2.3"\n')
            verify("1.2.3", root)

    def test_release_branch_runs_required_quality_gates(self):
        quality = (ROOT / ".github/workflows/ghost-ai-checks.yml").read_text()
        release = (ROOT / ".github/workflows/ghost-ai-release.yml").read_text()
        self.assertIn("      - 'release/v*'", quality.split("  pull_request:")[0])
        self.assertIn("branches: ['release/v*']", release)
        self.assertNotIn("tags: ['v*']", release)
        self.assertIn(".head_sha == $sha and .head_branch == $branch", release)
        self.assertIn("scripts/verify_release_version.py", release)
        self.assertIn('Existing tag points to another commit', release)
        self.assertIn('Release branch moved after validation', release)

    def test_stable_publication_without_weakening_update_security(self):
        release = (ROOT / ".github/workflows/ghost-ai-release.yml").read_text()
        self.assertIn("prerelease: false", release)
        self.assertIn("draft: false", release)
        self.assertIn("group: ghost-ai-release-publication", release)
        self.assertIn("scripts/publish_verified_release.py", release)
        publication = (ROOT / "scripts/publish_verified_release.py").read_text()
        self.assertIn('"draft": False, "prerelease": False', publication)
        self.assertIn("Refuse to overwrite an already-published version", publication)
        self.assertIn("No unsigned auto-updater fallback", (ROOT / "scripts/configure_updater.py").read_text())


if __name__ == "__main__":
    unittest.main()
