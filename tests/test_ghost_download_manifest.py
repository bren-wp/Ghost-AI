# Ghost AI by Brendigo
import hashlib
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from ghost_download_manifest import generate


class GhostDownloadManifestTests(unittest.TestCase):
    def test_only_verified_ghost_ai_packages_appear(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            payload = b"ghost-ai-by-brendigo" * 70000
            package = root / "Ghost-AI-v0.1.1-Setup.exe"
            package.write_bytes(payload)
            (root / "unrelated-app.exe").write_bytes(payload)
            result = generate(root)
            self.assertEqual(len(result["files"]), 1)
            self.assertEqual(result["files"][0]["name"], package.name)
            self.assertEqual(result["files"][0]["sha256"], hashlib.sha256(payload).hexdigest())

    def test_rejects_suspiciously_small_release_package(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "Ghost-AI-v0.1.1-Update.exe").write_bytes(b"not-a-valid-package")
            with self.assertRaises(ValueError):
                generate(root)


if __name__ == "__main__":
    unittest.main()
