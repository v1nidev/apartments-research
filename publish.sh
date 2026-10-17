#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 build.py
python3 -m unittest discover -s tests
if [[ "${1:-}" == "--check" ]]; then
  echo "Build and data checks passed; nothing pushed."
  exit 0
fi
git add index.html template.html styles.css app.js build.py import_snapshot.py data tests README.md AGENTS.md .gitignore .nojekyll publish.sh
if ! git diff --cached --quiet; then
  git commit -m "Update apartment ledger: $(date +%Y-%m-%d)"
fi
git push origin main
echo "Published -> https://v1nidev.github.io/apartments-research/"
