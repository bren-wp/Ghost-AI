"""Regression checks for reviewed dynamic SQL under SQLx 0.9."""

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src-tauri" / "src"

# New constructed SQL requires a deliberate call-site safety review. Static
# SQL string literals passed directly to sqlx::query* are unaffected.
UNREVIEWED = re.compile(
    r"sqlx::(?:query|query_as|query_scalar)(?:::\s*<[^>]+>)?\s*\(\s*"
    r"(?:&\s*(?:format!|crate::db::soft_delete::tombstone_update|query\b|sql\b)|"
    r"(?:format!|crate::db::soft_delete::tombstone_update)\s*\()"
)


class Sqlx09SafetyTest(unittest.TestCase):
    def test_dynamic_queries_are_explicitly_reviewed(self):
        offenders = []
        for path in ROOT.rglob("*.rs"):
            source = path.read_text(encoding="utf-8")
            for match in UNREVIEWED.finditer(source):
                line = source.count("\n", 0, match.start()) + 1
                offenders.append(f"{path.relative_to(ROOT)}:{line}")
        self.assertEqual(offenders, [], "Use reviewed SQL and sqlx::AssertSqlSafe")

    def test_soft_delete_identifiers_are_whitelisted(self):
        source = (ROOT / "db" / "soft_delete.rs").read_text(encoding="utf-8")
        self.assertIn("wipe_fragment(table).unwrap_or_else(", source)
        self.assertIn("_ => return None,", source)
        self.assertIn("sqlx::AssertSqlSafe(sql.as_str())", source)


if __name__ == "__main__":
    unittest.main()
