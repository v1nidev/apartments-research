# Dubrava ledger

A manually curated, read-only apartment shortlist near KB Dubrava, Zagreb.

**Page:** https://v1nidev.github.io/apartments-research/

Inspired by the Vozni car ledger: sage paper, rust accents, compact comparisons and explicit evidence. No scraper, framework, backend, database, npm dependencies, analytics or browser storage. GitHub Pages serves the generated, self-contained `index.html` from `main` at `/`.

## Update and publish

1. Edit `data/listings.json` for curated listing details, favourites and notes.
2. Put verified corrections and findings in `data/research.json`, keyed by listing ID. Research overrides snapshot fields; the page retains an expandable copy of the original row.
3. Run `./publish.sh --check` to build and validate without pushing.
4. Run `./publish.sh` to build, test, commit the page and its sources, and push.

Only Python 3, Bash and Git are required. Git pushes use SSH as `v1nidev`, independently of the active `gh` account. Changes and notes are published for every viewer; there are deliberately no misleading local-only save controls.

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
