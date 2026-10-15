#!/usr/bin/env bash
# Full asset build, in dependency order:
#   product photos -> JPEGs for the pages -> printed/screen textures -> scenes
# that use those textures. Usage: tools/render_assets.sh [--skip-studio]
set -euo pipefail
cd "$(dirname "$0")/.."
PY=/root/venvs/reel/bin/python

if [[ "${1:-}" != "--skip-studio" ]]; then
  for shot in chair_hero chair stool table; do
    $PY blender/studio.py "$shot" 2>&1 | grep -E "Saved|Traceback|Error" || true
  done
fi
$PY tools/prep_images.py
node tools/snap.mjs | tail -1
$PY blender/studio.py chair_box 2>&1 | grep -E "Saved|Traceback|Error" || true
$PY blender/flatlay.py flatlay 2>&1 | grep -E "Saved|Traceback|Error" || true
$PY blender/flatlay.py phone_close 2>&1 | grep -E "Saved|Traceback|Error" || true
$PY blender/desk.py 2>&1 | grep -E "Saved|Traceback|Error" || true
echo "assets done"
