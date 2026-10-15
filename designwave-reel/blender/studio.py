"""Studio product photographs of the FORM & OAK range.

  python blender/studio.py <shot> [preview]

shots: chair_hero (9:16, the film's product shot and the website hero),
       chair, stool, table (4:5 product tiles), chair_box (product with packaging)
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import common as C  # noqa: E402
import furniture as F  # noqa: E402

BACKDROP = "#e2dacd"


def studio(key_power=1100.0, exposure=-1.05):
    sc = C.reset()
    sc.view_settings.exposure = exposure
    C.cove(mat=C.matte_material("Backdrop", BACKDROP, rough=0.92, noise=0.015, noise_scale=420.0),
           width=10, depth=8, height=6, radius=1.5, y_wall=2.6)
    # big soft key from the left, a wide fill from the right, a rim from behind
    C.sphere_light("Key", (-2.6, -1.5, 2.7), 0.6, key_power * 1.6, "#ffeeda")
    C.area_light("Fill", (2.8, -1.8, 1.3), (0, 0, 0.4), 3.0, key_power * 0.10, "#f2efea")
    C.sphere_light("Rim", (1.5, 1.2, 1.9), 0.4, key_power * 0.30, "#fff6ea")
    return sc


def main():
    shot = sys.argv[1]
    preview = len(sys.argv) > 2 and sys.argv[2] == "preview"
    scale = 0.3 if preview else 1.0
    samples = 48 if preview else 200
    out = os.path.join(C.RENDERS, f"{shot}{'_preview' if preview else ''}.png")

    if shot == "chair_hero":
        studio()
        F.arc_chair(rot_z=math.radians(0))
        C.camera("Cam", (-1.84, -3.08, 1.08), (0.07, 0.02, 0.43), lens=72, fstop=4.0,
                 focus=3.45)
        w, h = 1296, 2304
    elif shot == "chair_box":
        studio()
        F.arc_chair(rot_z=math.radians(-8))
        box = C.slab("Box", [(0.1, 0.07), (-0.1, 0.07), (-0.1, -0.07), (0.1, -0.07)], 0.055,
                     bevel=0.0008, bevel_seg=2)
        C.assign(box, C.matte_material("Box board", "#c8bcaa", rough=0.9, noise=0.03))
        lid = C.uv_panel("Box sleeve", 0.200, 0.140, 0.0, z=0.05505)
        C.assign(lid, C.image_material("Sleeve print", os.path.join(C.TEX, "sleeve.png"),
                                       rough=0.85))
        lid.parent = box
        C.place(box, 0.17, -0.56, 24)
        cam = C.camera("Cam", (-1.15, -2.25, 1.05), (0.08, -0.06, 0.33), lens=72, fstop=4.5,
                       focus=2.6)
        w, h = 1200, 1500
        # where the sleeve's printed wordmark lands in the photo (for the film's
        # connecting lines); sleeve artwork is 1000 x 700, mark centre at 98, 104
        import bpy
        from mathutils import Vector
        sc = bpy.context.scene
        sc.render.resolution_x, sc.render.resolution_y = int(w * scale), int(h * scale)
        bpy.context.view_layer.update()
        u, v = 98 / 1000, 104 / 700
        p = box.matrix_world @ Vector(((u - 0.5) * 0.2, (0.5 - v) * 0.14, 0.0551))
        corners = [box.matrix_world @ Vector((x * 0.1, y * 0.07, 0.0551))
                   for x, y in ((-1, 1), (1, 1), (1, -1), (-1, -1))]
        import json
        with open(os.path.join(C.RENDERS, f"chair_box{'_preview' if preview else ''}.json"), "w") as fp:
            json.dump({"size": [int(w * scale), int(h * scale)],
                       "sleeve_mark": C.project(cam, [p])[0],
                       "box_top": C.project(cam, corners)}, fp, indent=1)
    elif shot == "chair":
        studio()
        F.arc_chair(rot_z=math.radians(-8))
        C.camera("Cam", (-1.25, -2.35, 1.0), (0.0, 0.02, 0.37), lens=72, fstop=4.0, focus=2.75)
        w, h = 1200, 1500
    elif shot == "stool":
        studio()
        F.ring_stool(rot_z=math.radians(12))
        C.camera("Cam", (-1.25, -2.35, 0.95), (0.0, 0.0, 0.30), lens=85, fstop=4.0, focus=2.7)
        w, h = 1200, 1500
    elif shot == "table":
        studio()
        F.side_table(rot_z=math.radians(8))
        C.camera("Cam", (-1.25, -2.35, 1.05), (0.0, 0.0, 0.32), lens=85, fstop=4.0, focus=2.7)
        w, h = 1200, 1500
    else:
        raise SystemExit(f"unknown shot {shot}")

    C.render(out, int(w * scale), int(h * scale), samples=samples)
    print("wrote", out)


if __name__ == "__main__":
    main()
