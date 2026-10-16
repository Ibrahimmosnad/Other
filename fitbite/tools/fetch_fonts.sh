#!/usr/bin/env bash
# Download the static font files the logo and document builds need into fonts/.
# Nunito (wordmark, headings) and Inter (document body), both SIL Open Font License.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p fonts
fetch() { # family, axis spec, output file
  local url
  url=$(curl -sS "https://fonts.googleapis.com/css2?family=$1:$2" -A curl | grep -oE 'https://[^)]+\.ttf' | head -1)
  curl -sS -o "fonts/$3" "$url"
  echo "fonts/$3"
}
for w in 600 700 800 900; do fetch Nunito "wght@$w" "Nunito-$w.ttf"; done
for w in 400 500 600 700; do fetch Inter "ital,wght@0,$w" "Inter-0-$w.ttf"; done
fetch Inter "ital,wght@1,400" "Inter-1-400.ttf"
