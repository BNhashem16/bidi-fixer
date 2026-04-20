#!/usr/bin/env bash
#
# Build packaged extension zips for Chrome and Firefox.
#
# Usage:
#   ./build.sh              # builds both
#   ./build.sh chrome       # chrome only
#   ./build.sh firefox      # firefox only
#
# Output: dist/bidi-fixer-<target>.zip

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
DIST="$ROOT/dist"
mkdir -p "$DIST"

VERSION=$(node -pe "require('./manifest.json').version" 2>/dev/null || grep '"version"' "$ROOT/manifest.json" | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')

COMMON_FILES=(
  background.js
  content.js
  styles.css
  popup.html popup.css popup.js
  options.html options.css options.js
  icons
  _locales
  LICENSE
  PRIVACY.md
  README.md
)

build_one() {
  local target="$1"
  local manifest="$2"
  local out="$DIST/bidi-fixer-$target-$VERSION.zip"
  local staging
  staging=$(mktemp -d)

  cp "$ROOT/$manifest" "$staging/manifest.json"
  for f in "${COMMON_FILES[@]}"; do
    cp -r "$ROOT/$f" "$staging/$f"
  done

  (cd "$staging" && zip -rq "$out" .)
  rm -rf "$staging"

  echo "Built: $out"
}

target="${1:-both}"

case "$target" in
  chrome)
    build_one chrome manifest.json
    ;;
  firefox)
    build_one firefox manifest.firefox.json
    ;;
  both|"")
    build_one chrome manifest.json
    build_one firefox manifest.firefox.json
    ;;
  *)
    echo "Unknown target: $target (expected: chrome | firefox | both)"
    exit 1
    ;;
esac
