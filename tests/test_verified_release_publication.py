import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from publish_verified_release import SUFFIXES, inventory, missing_assets, owned_release


class PublicationTests(unittest.TestCase):
    def test_inventory_requires_all_packages(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            with self.assertRaises(ValueError):
                inventory(folder, "v1.2.3")
            for suffix in SUFFIXES:
                (folder / f"Ghost-AI-v1.2.3-{suffix}").write_bytes(b"fixture")
            (folder / "test.sig").write_bytes(b"fixture")
            self.assertEqual(len(inventory(folder, "v1.2.3")), 10)
            self.assertIn("test.sig", (folder / "SHA256SUMS.txt").read_text())

    def test_resume_rejects_bad_digests_and_unexpected_assets(self):
        expected = {"a": (1, "abc"), "b": (2, "def")}
        uploaded = {"name": "a", "state": "uploaded", "size": 1, "digest": "sha256:abc"}
        self.assertEqual(missing_assets([uploaded], expected), ["b"])
        for bad in [{**uploaded, "digest": None}, {**uploaded, "digest": "sha256:bad"},
                    {**uploaded, "state": "starter"}, {**uploaded, "name": "unknown"}]:
            with self.subTest(asset=bad), self.assertRaises(ValueError):
                missing_assets([bad], expected)
        with self.assertRaises(ValueError):
            missing_assets([uploaded, uploaded], expected)

    def test_unrelated_release_cannot_be_resumed(self):
        release = {"tag_name": "v1.2.3", "body": "marker"}
        self.assertEqual(owned_release([release], "v1.2.3", "marker"), release)
        self.assertIsNone(owned_release([], "v1.2.3", "marker"))
        with self.assertRaises(ValueError):
            owned_release([release], "v1.2.3", "other")
