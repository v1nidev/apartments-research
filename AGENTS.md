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
