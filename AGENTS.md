# Apartment research

This is a manually curated, static GitHub Pages site. No scraper or automated listing checks are wanted.

- Preserve all imported rows, source links, favourites and notes. Do not fabricate the hidden rows mentioned by the original artifact header.
- `data/listings.json` is the editable snapshot. `data/research.json` adds evidence-backed overrides. Edit these, not generated `index.html`.
- Preserve conflicting source facts and explain which field is used. Blocks, timeouts and access challenges never establish unavailability. Only an explicit inactive marker warrants inactive status.
- Readable listing pages are not landlord-confirmed availability. Keep review dates and source links. Do not imply that photos or routes were checked when they were not.
- Keep mandatory parking in monthly minimums; unknown utilities are not zero. Do not silently change the brief or remove over-budget rows.
- The public page is read-only. Do not add browser-local edits disguised as shared saves.
- No private sellers’ identities, contact details, credentials or sensitive personal notes in this public repository.
- `./publish.sh --check` builds and runs offline checks without pushing. `./publish.sh` builds, tests, commits and pushes to `v1nidev/apartments-research` over SSH; GitHub Pages serves `main` at `/`.
- New UI should follow the car ledger’s sage/rust editorial style and work at mobile widths. Keep the site dependency-free.
- The current user-approved brief lives in `data/criteria.json`: rent ≤€800 (existing named €850 exception), ≥45 m², existing areas, newer/refurbished, driving to KB Dubrava ≤45 min (prefer ≤30), move-in by 2026-11-08, long-term only, no basement/semi-basement, built ≥1985, lift from floor 3. Room count/separate bedroom are no longer requirements. Dishwasher is informational only.
- Structured evidence lives in `data/facts.json`. Never invent commute times or infer construction year from renovation year. Unknown criteria stay pending, not passing. Known mismatches are hidden by default but retained and inspectable. Criterion checkboxes are explicitly temporary filters, not shared edits.
