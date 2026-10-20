import importlib.util
import json
import shutil
import subprocess
import unittest
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / "data/listings.json").read_text())
        self.rows = self.data["listings"]
        self.research = json.loads((ROOT / "data/research.json").read_text())
        self.pending = json.loads((ROOT / "data/pending.json").read_text())

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

    def test_pending_cohort_complete_and_separate(self):
        expected = {"I:7581070", "I:7629165", "I:7372164", "I:6606919", "I:6304518", "I:6318029", "I:7636265", "I:7608454", "I:6606812", "I:7447190"}
        self.assertEqual(len(self.pending), 10)
        self.assertEqual({row["id"] for row in self.pending}, expected)
        self.assertTrue(expected.isdisjoint(row["id"] for row in self.rows))
        original_links = {link["url"] for row in self.rows for link in row["links"]}
        new_links = [link["url"] for row in self.pending for link in row["links"]]
        self.assertEqual(len(new_links), 11)
        self.assertEqual(len(set(new_links)), 11)
        self.assertTrue(original_links.isdisjoint(new_links))
        for row in self.pending:
            self.assertTrue(set(self.rows[0]).issubset(row))
            self.assertEqual(row["cohort"], "pending")
            self.assertFalse(row["favourite"])
            self.assertIn(row["verified_at"], {"2026-10-17", "2026-10-20"})
            self.assertEqual(row["verification"], "readable")
            self.assertIsNone(row["drive_minutes"])
            if row["available_from"] is not None:
                self.assertLessEqual(row["available_from"], "2026-11-08")
            self.assertLessEqual(row["rent"], 800)
            self.assertGreaterEqual(row["area"], 45)
            if row["building_year"] is not None:
                self.assertGreaterEqual(row["building_year"], 1985)
            self.assertGreaterEqual(len(row["findings"]), 4)
            self.assertTrue(row["facts_source"])
            self.assertTrue(all(link["url"].startswith("https://") for link in row["links"]))

    def test_pending_evidence_and_cost_caveats(self):
        pending = {row["id"]: row for row in self.pending}
        for identifier in ["I:7636265", "I:7608454"]:
            self.assertEqual(pending[identifier]["condition"], "No info")
            self.assertIn("pending", pending[identifier]["condition_note"])
        self.assertEqual(sum(row["condition"] == "New/renovated" for row in self.pending), 7)
        included = pending["I:6304518"]
        self.assertEqual(included["utilities"], 0)
        self.assertTrue(included["utilities_included"])
        self.assertIn("Wi-Fi", included["utilities_note"])
        granesina = pending["I:7372164"]
        self.assertIsNone(granesina["utilities"])
        self.assertIn("€150 or €200", granesina["utilities_note"])
        self.assertEqual(granesina["advertised_available_from"], "2026-06-01")
        self.assertEqual(granesina["rooms"], 4)
        self.assertEqual(pending["I:7629165"]["rooms"], 2)
        self.assertIn("search-index", pending["I:6606919"]["links"][1]["label"])
        self.assertEqual(pending["I:6304518"]["posted"], "2024-09-06")
        self.assertEqual(pending["I:6606919"]["posted"], "2025-02-04")
        new_build = pending["I:6606812"]
        self.assertEqual(new_build["floor"], 4)
        self.assertIsNone(new_build["lift"])
        self.assertEqual(new_build["building_year"], 2024)
        svetice = pending["I:7447190"]
        self.assertEqual(svetice["rent"], 700)
        self.assertIsNone(svetice["building_year"])
        self.assertEqual(svetice["condition"], "No info")
        self.assertTrue(svetice["long_term"])
        self.assertEqual(svetice["available_from"], "2026-10-20")

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

    def test_photo_evidence_covers_all_rows(self):
        photos = json.loads((ROOT / "data/photos.json").read_text())
        self.assertEqual(set(photos), {row["id"] for row in self.rows + self.pending})
        for photo in photos.values():
            self.assertTrue(photo["source"].startswith("https://"))
            self.assertTrue(photo["note"])
            date.fromisoformat(photo["checked_at"])
            self.assertIn(photo["checked_at"], {"2026-10-18", "2026-10-20"})
            self.assertTrue(photo["url"] is None or photo["url"].startswith("https://"))

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
        payload = html.split('<script id="listing-data" type="application/json">', 1)[1].split('</script>', 1)[0]
        data = json.loads(payload)
        originals = [row for row in data["listings"] if row["cohort"] == "original"]
        pending = [row for row in data["listings"] if row["cohort"] == "pending"]
        self.assertEqual(len(originals), 24)
        self.assertEqual(len(pending), len(self.pending))
        self.assertEqual(data["reviewed_at"], "2026-10-20")
        self.assertEqual(data["source_count"], 24)
        self.assertEqual(data["source_link_count"], 29)
        self.assertEqual([row["snapshot"] for row in originals], self.rows)
        self.assertTrue(all("snapshot" not in row for row in pending))
        self.assertEqual(len({row["id"] for row in data["listings"]}), len(self.rows) + len(self.pending))
        self.assertIn('>PENDING REVIEW <span>', html)

    @unittest.skipUnless(shutil.which("node"), "Node.js optional UI logic check")
    def test_pending_view_and_filters(self):
        script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const seed = JSON.parse(fs.readFileSync('data/listings.json'));
const research = JSON.parse(fs.readFileSync('data/research.json'));
const facts = JSON.parse(fs.readFileSync('data/facts.json'));
seed.criteria = JSON.parse(fs.readFileSync('data/criteria.json'));
seed.listings = seed.listings.map(row => ({...row, snapshot: {...row}, cohort: 'original', ...research[row.id], ...facts[row.id]}));
seed.listings.push(...JSON.parse(fs.readFileSync('data/pending.json')));
const pendingCount = seed.listings.filter(row => row.cohort === 'pending').length;
const renovatedCount = seed.listings.filter(row => row.cohort === 'pending' && row.condition === 'New/renovated').length;
const checked = seed.criteria.rules.filter(rule => rule.enabled).map(rule => ({value: rule.id}));
const defaults = {'cost-basis':'rent', 'brief-fit':'eligible', sort:'favourites'};
const elements = {};
const buttons = ['all','favourites','pending','findings','brief'].map(view => ({dataset:{view},setAttribute(){},addEventListener(){}}));
function element(id) {
  return elements[id] ??= {value:defaults[id] ?? '',hidden:false,innerHTML:'',textContent:'',listeners:{},querySelectorAll(){return checked;},addEventListener(name, fn){this.listeners[name] = fn;},append(){},reset(){for(const [key, el] of Object.entries(elements)) el.value = defaults[key] ?? ''; this.listeners.reset?.();}};
}
element('listing-data').textContent = JSON.stringify(seed);
const document = {getElementById:element,createElement(){return {};},querySelectorAll(){return buttons;},querySelector(selector){return selector === '.table-wrap' ? element('table-wrap') : element(selector);}};
const context = vm.createContext({document,Intl,setTimeout:fn=>fn(),apartmentPhotoHtml:()=>'',attachPhotoFallbacks:()=>{}});
vm.runInContext(fs.readFileSync('rules.js','utf8') + '\n' + fs.readFileSync('app.js','utf8'), context);
const run = code => vm.runInContext(code,context);
assert.equal(run('viewListings().length'),24);
assert.equal(run("getVisible().some(row => row.cohort === 'pending')"),false);
run("setView('favourites')");
assert.equal(run('viewListings().length'),8);
run("setView('pending')");
assert.equal(run('getVisible().length'),pendingCount);
assert.equal(element('pending-notice').hidden,false);
assert.equal(element('listings-view').hidden,false);
assert.equal(run("getVisible().every(row => fitFor(row).status === 'pending')"),true);
assert.match(element('rows').innerHTML,/Utilities included in rent/);
assert.match(element('rows').innerHTML,/€950–€1,000/);
assert.doesNotMatch(element('rows').innerHTML,/Original snapshot<\/summary>/);
element('condition').value = 'confirmed';
assert.equal(run('getVisible().length'),renovatedCount);
element('query').value = 'nonexistent candidate';
run('render()');
assert.equal(element('empty').hidden,false);
element('empty-reset').listeners.click();
assert.equal(run('getVisible().length'),pendingCount);
assert.equal(run('view'),'pending');
run("setView('all')");
assert.equal(element('pending-notice').hidden,true);
assert.equal(run("getVisible().some(row => row.cohort === 'pending')"),false);
run("setView('findings')");
assert.equal(element('listings-view').hidden,true);
assert.equal(element('findings-view').hidden,false);
"""
        subprocess.run(["node", "-e", script], cwd=ROOT, check=True)


if __name__ == "__main__":
    unittest.main()
