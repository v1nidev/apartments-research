import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / "data/listings.json").read_text())
        self.rows = self.data["listings"]
        self.research = json.loads((ROOT / "data/research.json").read_text())

    def test_import_complete(self):
        self.assertEqual(len(self.rows), 24)
        self.assertEqual(sum(len(row["links"]) for row in self.rows), 29)
        self.assertEqual(sum(row["favourite"] for row in self.rows), 8)
        self.assertEqual(len({row["id"] for row in self.rows}), 24)
        self.assertTrue(all(not row["notes"] for row in self.rows))

    def test_research_has_sources(self):
        self.assertEqual(len(self.research), 10)
        self.assertTrue(set(self.research).issubset({row["id"] for row in self.rows}))
        self.assertEqual(sum(row["verification"] == "inactive" for row in self.research.values()), 1)
        for row in self.research.values():
            self.assertEqual(row["verified_at"], "2026-10-17")
            self.assertTrue(row["findings"])

    def test_cost_corrections(self):
        original = {row["id"]: row for row in self.rows}
        trnava = original["I:7633964"] | self.research["I:7633964"]
        garage = original["I:7156303"] | self.research["I:7156303"]
        self.assertEqual(trnava["rent"], 800)
        self.assertEqual(trnava["original_rent"], 700)
        self.assertEqual(garage["rent"] + garage["mandatory_parking"], 850)
        self.assertIsNone(garage["utilities"])

    def test_build_embeds_data_safely(self):
        spec = importlib.util.spec_from_file_location("build", ROOT / "build.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        module.build()
        html = (ROOT / "index.html").read_text()
        self.assertNotIn("{{DATA}}", html)
        self.assertNotIn("{{SCRIPT}}", html)
        self.assertIn('"snapshot":', html)
        self.assertNotIn("localStorage", html)
        self.assertNotIn("window.storage", html)


if __name__ == "__main__":
    unittest.main()
