"""Laptop and phone on the stone surface, both showing the FORM & OAK site.

  python blender/desk.py [preview]
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import common as C  # noqa: E402
import devices as D  # noqa: E402
import flatlay as FL  # noqa: E402


def main():
    preview = len(sys.argv) > 1 and sys.argv[1] == "preview"
    scale = 0.3 if preview else 1.0
    sc = C.reset()
    sc.view_settings.exposure = -1.25
    sc.view_settings.look = "AgX - Medium High Contrast"
    FL.surface()
    bg = sc.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = C.srgb("#d8d0c4")
    bg.inputs["Strength"].default_value = 0.55
    lap, _ = D.laptop(os.path.join(C.TEX, "site_desktop.png"), open_deg=108, emission=2.6)
    C.place(lap, 0.0, 0.055, -6)
    ph, _ = D.phone(os.path.join(C.TEX, "site_mobile_screen.png"), emission=2.1)
    C.place(ph, 0.04, -0.168, 9)
    C.sphere_light("Key", (-0.9, -0.2, 1.3), 0.35, 520.0, "#ffefdc")
    C.area_light("Fill", (0.6, -1.2, 1.0), (0, 0, 0.1), 2.0, 90.0, "#f3f1ec")
    C.sphere_light("Rim", (0.5, 1.1, 0.9), 0.3, 160.0, "#fff6ea")
    C.camera("Cam", (-0.20, -0.98, 0.60), (0.0, -0.045, 0.085), lens=47, fstop=5.6,
             focus=1.12)
    out = os.path.join(C.RENDERS, f"desk{'_preview' if preview else ''}.png")
    C.render(out, int(1296 * scale), int(2304 * scale), samples=40 if preview else 160)
    print("wrote", out)


if __name__ == "__main__":
    main()
