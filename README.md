# Dubrava ledger

A manually curated, read-only apartment shortlist near KB Dubrava, Zagreb.

**Page:** https://v1nidev.github.io/apartments-research/

Inspired by the Vozni car ledger: sage paper, rust accents, compact comparisons and explicit evidence. No scraper, framework, backend, database, npm dependencies, analytics or browser storage. GitHub Pages serves the generated, self-contained `index.html` from `main` at `/`.

## Update and publish

1. Edit `data/listings.json` for curated listing details, favourites and notes.
2. Put verified corrections and findings in `data/research.json`, keyed by listing ID. Research overrides snapshot fields; the page retains an expandable copy of the original row.
   Put evidence-backed structured features (dishwasher, construction year, floor, lift, availability, long-term terms, measured driving time) in `data/facts.json`. Set the research brief and default checkbox states in `data/criteria.json`.
3. Run `./publish.sh --check` to build and validate without pushing.
4. Run `./publish.sh` to build, test, commit the page and its sources, and push.

Only Python 3, Bash and Git are required. Git pushes use SSH as `v1nidev`, independently of the active `gh` account. Changes and notes are published for every viewer; there are deliberately no misleading local-only save controls.

Optional additional logic tests: `node tests/test_rules.cjs` (Node.js is not needed to build or host the page).

## Current research brief

- €800 advertised rent maximum, preserving the original named €850 exception. Show mandatory parking separately.
- Minimum 45 m²; existing search areas; newer/refurbished condition.
- Typical driving commute to KB Dubrava: maximum 45 minutes, prefer within 30. No route times have yet been verified.
- Available by **8 November 2026**; exclude explicit later dates, mark unknown availability as needing checks.
- Long-term only; no basement/semi-basement; construction year **1985 or later**; lift required from the **3rd floor** upward.
- Two rooms and separate bedroom are no longer requirements.
- Dishwasher is prominently labelled yes/no/unknown but is not a filter requirement.

The page has live checkboxes to temporarily enable/disable these criteria. This changes only the current view, never the shared data or the published brief. Known mismatches are excluded by default but remain in the dataset and can be revealed using the criteria-fit selector. Unknown facts remain visible as **needs checking**, never as confirmed matches. The generic price/size filters can narrow this further. “Reset filters” restores the published checkbox defaults too.

## Local preview

```bash
python3 build.py
python3 -m http.server 8000
```

Open http://localhost:8000. `index.html` also works directly as a local file.

## Data and provenance

- Snapshot: 15 October 2026 at 20:45, supplied as HTML inside `apartments-artifact.rtf`.
- All 24 supplied rows, 29 links and eight favourites are preserved. The original header mentioned 72 listings and 48 rejections, but their hidden rows were not supplied and are not fabricated.
- Manual review: 17 October 2026. Ten apartments have readable Index pages (nine without an inactive marker, one explicitly inactive). Njuškalo challenged automated access. Fourteen apartments therefore have no live verification beyond the snapshot.
- A readable page is **not** landlord-confirmed availability. No landlord was contacted. Photos were not independently assessed.
- `data/listings.json` is a curated seed snapshot, not scraper-owned. `data/research.json` holds subsequent evidence, cost corrections and field conflicts.
- `import_snapshot.py` is an optional, offline, one-time HTML/RTF converter. It does not visit websites. RTF conversion uses macOS `textutil`. Do not overwrite the curated data by rerunning it after manual edits; inspect its output separately first.
- Mandatory parking is included in monthly minimums. Unknown utilities are explicitly incomplete, never represented as a verified zero. Deposits and commissions remain separate.
- Hospital distances are inherited neighbourhood estimates, not measured routes. Old posting/refresh-date conflicts are explained in research notes.

## Files

`template.html`, `styles.css`, `app.js` → `build.py` + `data/*.json` → `index.html`.

`tests/` contains offline data/build checks. `publish.sh` validates and publishes this one repository; unlike the scraper-backed car project, a second deployment repository is unnecessary.

GitHub Pages and this repository are public. Do not add private contact details or sensitive personal notes.
