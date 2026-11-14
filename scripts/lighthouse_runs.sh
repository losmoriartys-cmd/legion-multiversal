#!/usr/bin/env bash
# Run Lighthouse repeatedly against production GitHub Pages and Cloudflare preview.
# Reports are written locally; this script never deploys or modifies either site.
#
# Requirements: Node.js/npm, Chrome or Chromium, Python 3.
# Usage:
#   bash scripts/lighthouse_runs.sh
#   bash scripts/lighthouse_runs.sh <url_github_pages> <url_preview>
#   RUNS=5 bash scripts/lighthouse_runs.sh
set -euo pipefail

GH_URL="\${1:-https://losmoriartys-cmd.github.io/legion-multiversal/}"
PREVIEW_URL="\${2:-https://auditoria-ux.legion-multiversal.pages.dev/}"
RUNS="\${RUNS:-3}"
OUT_DIR="\${OUT_DIR:-reports/lighthouse}"

if ! [[ "$RUNS" =~ ^[1-9][0-9]*$ ]]; then
  echo "RUNS debe ser un entero positivo (recibido: $RUNS)." >&2
  exit 2
fi
for command in npx python3; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "Falta el comando requerido: $command" >&2
    exit 2
  }
done

mkdir -p "$OUT_DIR/github-pages" "$OUT_DIR/preview"

run_environment() {
  local name="$1" url="$2" i
  for ((i = 1; i <= RUNS; i++)); do
    echo ">>> Corrida $i/$RUNS · $name · $url"
    npx --yes lighthouse "$url" \
      --quiet \
      --chrome-flags="--headless=new --no-sandbox" \
      --only-categories=performance,accessibility,best-practices,seo \
      --output=json --output=html \
      --output-path="$OUT_DIR/$name/run$i"
  done
}

run_environment "github-pages" "$GH_URL"
run_environment "preview" "$PREVIEW_URL"
python3 "$(dirname "$0")/summarize_lighthouse.py" "$OUT_DIR"
