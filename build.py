#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def build():
    data = json.loads((ROOT / "data/listings.json").read_text())
    research = json.loads((ROOT / "data/research.json").read_text())
    facts = json.loads((ROOT / "data/facts.json").read_text())
    data["criteria"] = json.loads((ROOT / "data/criteria.json").read_text())
    for row in data["listings"]:
        row["snapshot"] = dict(row)
        row.update(research.get(row["id"], {}))
        row.update(facts.get(row["id"], {}))
    ids = [row["id"] for row in data["listings"]]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate listing IDs")
    if (set(research) | set(facts)) - set(ids):
        raise ValueError("Research/facts reference an unknown listing")
    for row in data["listings"]:
        if not row["links"] or any(not link["url"].startswith("https://") for link in row["links"]):
            raise ValueError(f"Invalid listing links: {row['id']}")
    payload = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c")
    page = (ROOT / "template.html").read_text()
    for marker, value in {
        "{{STYLE}}": (ROOT / "styles.css").read_text(),
        "{{DATA}}": payload,
        "{{RULES}}": (ROOT / "rules.js").read_text(),
        "{{SCRIPT}}": (ROOT / "app.js").read_text(),
    }.items():
        if page.count(marker) != 1:
            raise ValueError(f"Expected exactly one {marker}")
        page = page.replace(marker, value)
    (ROOT / "index.html").write_text(page)
    print(f"Built index.html: {len(ids)} apartments")


if __name__ == "__main__":
    build()
