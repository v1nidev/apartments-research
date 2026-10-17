#!/usr/bin/env python3
import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path


class Snapshot(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self.row = None
        self.cell = None
        self.anchor = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "tr":
            self.row = {"cells": [], "links": [], "favourite": "st-fav" in attrs.get("class", "")}
        elif tag == "td" and self.row is not None:
            self.cell = []
        elif tag == "select" and self.row is not None and attrs.get("data-k"):
            self.row["id"] = attrs["data-k"]
        elif tag == "a" and self.cell is not None:
            self.anchor = {"url": attrs["href"], "label": ""}
        elif tag in ("small", "span") and self.cell is not None:
            self.cell.append(" ")

    def handle_data(self, text):
        if self.cell is not None:
            self.cell.append(text)
        if self.anchor is not None:
            self.anchor["label"] += text

    def handle_endtag(self, tag):
        if tag == "a" and self.anchor is not None:
            self.row["links"].append(self.anchor)
            self.anchor = None
        elif tag == "td" and self.cell is not None:
            self.row["cells"].append(" ".join("".join(self.cell).split()))
            self.cell = None
        elif tag == "tr" and self.row is not None:
            if self.row["cells"]:
                self.rows.append(self.row)
            self.row = None


def convert(path):
    html = subprocess.check_output(["textutil", "-convert", "txt", "-stdout", str(path)], text=True) if path.suffix == ".rtf" else path.read_text()
    parser = Snapshot()
    parser.feed(html)
    listings = []
    for row in parser.rows:
        c = row["cells"]
        price = re.search(r"€(\d+)", c[1])
        bills = re.search(r"~€(\d+)", c[1])
        distance = next(d for d in ("Close", "Medium", "Further") if c[4].endswith(d))
        condition = next(d for d in ("New/renovated", "Probably refurbished", "No info") if c[6].startswith(d))
        listings.append({
            "id": row["id"], "favourite": row["favourite"],
            "posted": "2026-" + c[0][3:5] + "-" + c[0][:2],
            "new_in_snapshot": "NEW" in c[0],
            "rent": int(price[1]), "original_rent": int(price[1]),
            "utilities": int(bills[1]) if bills else None,
            "area": float(c[2]), "rooms": int(c[3]),
            "neighbourhood": c[4].removesuffix(distance).strip(), "distance": distance,
            "title": c[5].split("Listing no longer active")[0],
            "condition": condition, "condition_note": c[6].removeprefix(condition).strip(),
            "furnished": c[7] if c[7] != "—" else "Not stated", "parking": c[8],
            "move_in": c[9], "links": row["links"], "notes": c[11].split("Rejected", 1)[-1].strip(),
            "verification": "unchecked", "findings": [], "deposit": None,
            "mandatory_parking": 0, "agency_fee": None,
        })
    return {"snapshot_at": "2026-10-15 20:45", "reviewed_at": "2026-10-17", "listings": listings}


if __name__ == "__main__":
    print(json.dumps(convert(Path(sys.argv[1])), ensure_ascii=False, indent=2))
