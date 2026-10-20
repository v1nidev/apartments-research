#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def build():
    data = json.loads((ROOT / "data/listings.json").read_text())
    research = json.loads((ROOT / "data/research.json").read_text())
    facts = json.loads((ROOT / "data/facts.json").read_text())
    data["criteria"] = json.loads((ROOT / "data/criteria.json").read_text())
    data["source_count"] = len(data["listings"])
    data["source_link_count"] = sum(len(row["links"]) for row in data["listings"])
    for row in data["listings"]:
        row["snapshot"] = dict(row)
        row["cohort"] = "original"
        row.update(research.get(row["id"], {}))
        row.update(facts.get(row["id"], {}))
    pending = json.loads((ROOT / "data/pending.json").read_text())
    if any(row.get("cohort") != "pending" or row.get("favourite") for row in pending):
        raise ValueError("Pending candidates must stay separate and unfavourited")
    data["listings"].extend(pending)
    data["reviewed_at"] = max(row.get("verified_at", data["reviewed_at"]) for row in data["listings"])
    photos = json.loads((ROOT / "data/photos.json").read_text())
    for row in data["listings"]:
        row["photo"] = photos.get(row["id"])
    ids = [row["id"] for row in data["listings"]]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate listing IDs")
    if (set(research) | set(facts) | set(photos)) - set(ids):
        raise ValueError("Research/facts/photos reference an unknown listing")
    for photo in photos.values():
        if photo.get("url") and not photo["url"].startswith("https://"):
            raise ValueError("Photo URLs must use HTTPS")
    for row in data["listings"]:
        if not row["links"] or any(not link["url"].startswith("https://") for link in row["links"]):
            raise ValueError(f"Invalid listing links: {row['id']}")
    payload = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c")
    page = (ROOT / "template.html").read_text()
    for marker, value in {
        "{{STYLE}}": (ROOT / "styles.css").read_text(),
        "{{DATA}}": payload,
        "{{RULES}}": (ROOT / "rules.js").read_text(),
        "{{PHOTOS}}": (ROOT / "photos.js").read_text(),
        "{{SCRIPT}}": (ROOT / "app.js").read_text(),
    }.items():
        if page.count(marker) != 1:
            raise ValueError(f"Expected exactly one {marker}")
        page = page.replace(marker, value)
    (ROOT / "index.html").write_text(page)
    print(f"Built index.html: {data['source_count']} original apartments + {len(pending)} pending review")


if __name__ == "__main__":
    build()
