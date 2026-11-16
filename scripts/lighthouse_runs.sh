#!/usr/bin/env bash
# Run Lighthouse repeatedly against the configured production URL and an optional preview.
# Reports are written locally; this script never deploys or modifies either site.
#
# Requirements: Node.js/npm, Chrome or Chromium, Python 3.
# Usage:
#   bash scripts/lighthouse_runs.sh
#   bash scripts/lighthouse_runs.sh <url_produccion> [url_preview]
#   RUNS=5 bash scripts/lighthouse_runs.sh
set -euo pipefail

PRODUCTION_URL="${1:-https://legion-multiversal.pages.dev/}"
PREVIEW_URL="${2:-}"
RUNS="${RUNS:-3}"
OUT_DIR="${OUT_DIR:-reports/lighthouse}"

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

mkdir -p "$OUT_DIR"

run_environment() {
  local name="$1" url="$2" preset="$3" i
  local -a preset_args=()
  if [[ "$preset" == "desktop" ]]; then
    preset_args+=(--preset=desktop)
  fi
  mkdir -p "$OUT_DIR/$name"
  for ((i = 1; i <= RUNS; i++)); do
    echo ">>> Corrida $i/$RUNS · $name · $url"
    npx --yes lighthouse "$url" \
      --quiet \
      --chrome-flags="--headless=new --no-sandbox" \
      --only-categories=performance,accessibility,best-practices,seo \
      "${preset_args[@]}" \
      --output=json --output=html \
      --output-path="$OUT_DIR/$name/run$i"
  done
}

# Lighthouse usa móvil por defecto; escritorio se mide con el preset oficial desktop.
run_environment "production-mobile" "$PRODUCTION_URL" "mobile"
run_environment "production-desktop" "$PRODUCTION_URL" "desktop"
if [[ -n "$PREVIEW_URL" ]]; then
  run_environment "preview-mobile" "$PREVIEW_URL" "mobile"
  run_environment "preview-desktop" "$PREVIEW_URL" "desktop"
fi
python3 "$(dirname "$0")/summarize_lighthouse.py" "$OUT_DIR"
