"""Convert 16-bit Blender renders to 8-bit JPEGs for the pages.

  python tools/prep_images.py [--preview]
"""
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "renders")
DST = os.path.join(ROOT, "assets", "img")


def main():
    preview = "--preview" in sys.argv
    os.makedirs(DST, exist_ok=True)
    for key in ("chair_hero", "chair", "stool", "table", "chair_box", "flatlay", "desk",
                "phone_close"):
        name = f"{key}_preview.png" if preview else f"{key}.png"
        path = os.path.join(SRC, name)
        if not os.path.exists(path):
            continue
        im = Image.open(path)
        if im.mode.startswith("I;16") or im.mode == "I":
            im = im.point(lambda v: v / 257).convert("L")
        if key == "phone_close":
            # the display is a transparent hole: keep alpha
            out = os.path.join(DST, f"{key}.png")
            im.convert("RGBA").save(out, optimize=True)
        else:
            out = os.path.join(DST, f"{key}.jpg")
            im.convert("RGB").save(out, quality=93, subsampling=0, optimize=True)
        print("wrote", out, im.size)


if __name__ == "__main__":
    main()
