#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-backup-output}"
mkdir -p "$OUT_DIR"
BUNDLE="$OUT_DIR/legion-multiversal.bundle"
SNAPSHOT="$OUT_DIR/legion-multiversal-source.tar.gz"

git bundle create "$BUNDLE" --all
git bundle verify "$BUNDLE"
tar --exclude='./.git' --exclude="./$OUT_DIR" -czf "$SNAPSHOT" .
tar -tzf "$SNAPSHOT" >/dev/null

{
  printf 'repository=%s\n' "${GITHUB_REPOSITORY:-losmoriartys-cmd/legion-multiversal}"
  printf 'commit=%s\n' "$(git rev-parse HEAD)"
  printf 'created_utc=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf 'bundle=%s\n' "$(basename "$BUNDLE")"
  printf 'snapshot=%s\n' "$(basename "$SNAPSHOT")"
} > "$OUT_DIR/backup-manifest.txt"

(
  cd "$OUT_DIR"
  sha256sum "$(basename "$BUNDLE")" "$(basename "$SNAPSHOT")" backup-manifest.txt > SHA256SUMS
  sha256sum -c SHA256SUMS
)

echo "BACKUP_LOCAL_VERIFIED: $OUT_DIR"
