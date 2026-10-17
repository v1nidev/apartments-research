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

    def test_facts_are_not_invented(self):
        facts = json.loads((ROOT / "data/facts.json").read_text())
        self.assertTrue(set(facts).issubset({row["id"] for row in self.rows}))
        self.assertEqual(sum(row.get("dishwasher") is True for row in facts.values()), 4)
        self.assertEqual(facts["I:7631451"]["available_from"], "2026-12-15")
        self.assertEqual(facts["I:7103578"]["building_year"], 1940)
        self.assertTrue(all("drive_minutes" not in row for row in facts.values()))

    def test_published_criteria(self):
        criteria = json.loads((ROOT / "data/criteria.json").read_text())
        self.assertEqual(criteria["move_in_by"], "2026-11-08")
        self.assertEqual(criteria["min_area"], 45)
        self.assertEqual(criteria["min_building_year"], 1985)
        self.assertEqual(criteria["lift_from_floor"], 3)
        self.assertEqual(criteria["max_drive_minutes"], 45)
        self.assertEqual(criteria["preferred_drive_minutes"], 30)

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
