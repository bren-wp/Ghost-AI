import importlib.util
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "build_update_manifest.py"
spec = importlib.util.spec_from_file_location("build_update_manifest", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class ManifestTests(unittest.TestCase):
    def test_signed_windows_manifest(self):
        with tempfile.TemporaryDirectory() as td:
            folder=Path(td)
            (folder/"Ghost-AI-v0.1.1-x64-setup.nsis.zip").write_bytes(b"binary")
            (folder/"Ghost-AI-v0.1.1-x64-setup.nsis.zip.sig").write_text("base64signature")
            obj=mod.build_manifest("0.1.1",folder,{"windows-x86_64":"Ghost-AI-v0.1.1-x64-setup.nsis.zip"})
            self.assertEqual(obj["version"],"0.1.1")
            self.assertTrue(obj["platforms"]["windows-x86_64"]["url"].startswith("https://brendigo.com/"))
    def test_reject_unsigned(self):
        with tempfile.TemporaryDirectory() as td:
            folder=Path(td)
            (folder/"a.nsis.zip").write_bytes(b"binary")
            with self.assertRaises(FileNotFoundError):
                mod.build_manifest("0.1.1",folder,{"windows-x86_64":"a.nsis.zip"})
    def test_reject_path_traversal(self):
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaises(ValueError):
                mod.build_manifest("0.1.1",Path(td),{"windows-x86_64":"../a.nsis.zip"})

if __name__ == "__main__":
    unittest.main()
