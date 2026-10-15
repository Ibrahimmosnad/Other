"""Overhead flat-lay of FORM & OAK touchpoints on a stone surface.

  python blender/flatlay.py <shot> [preview]

shots:
  flatlay      the whole arrangement, 9:16 with room to move (scene 3, 6c, 7)
  phone_close  the same phone from closer, display left transparent so the
               live website can sit under it (scene 4)
Writes assets/renders/<shot>.png and <shot>.json (projected outlines).
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import common as C  # noqa: E402
import devices as D  # noqa: E402

FRAME_W = 0.520                      # metres across the full flat-lay frame
FRAME_H = FRAME_W * 16 / 9
TEX = C.TEX


def fx(x_mm):
    return x_mm / 1000 - FRAME_W / 2


def fy(y_mm):
    return FRAME_H / 2 - y_mm / 1000


# frame position (mm from the top-left), clockwise rotation in degrees
LAYOUT = {
    "poster": (180, 500, 2.0),
    "phone": (405, 392, -3.5),
    "tag": (455, 560, 6.0),
    "box": (385, 722, -2.5),
    "oak": (118, 792, 8.0),
}


def surface():
    mat = C.matte_material("Stone", "#cdc4b7", rough=0.93, noise=0.05, noise_scale=260.0)
    nt = mat.node_tree
    N, L = nt.nodes, nt.links
    bsdf = N["Principled BSDF"]
    # soft plaster mottling
    tc = N.new("ShaderNodeTexCoord")
    mott = N.new("ShaderNodeTexNoise")
    mott.inputs["Scale"].default_value = 3.5
    mott.inputs["Detail"].default_value = 3.0
    L.new(tc.outputs["Object"], mott.inputs["Vector"])
    mix = N.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MIX"
    mix.inputs["A"].default_value = C.srgb("#d1c8bb")
    mix.inputs["B"].default_value = C.srgb("#c6bcae")
    L.new(mott.outputs["Fac"], mix.inputs["Factor"])
    L.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    plane = C.uv_panel("Surface", 14.0, 14.0)
    C.assign(plane, mat)
    return plane


def linen_material():
    mat = C.matte_material("Linen", "#cfc5b6", rough=0.96, noise=0.0)
    nt = mat.node_tree
    N, L = nt.nodes, nt.links
    bsdf = N["Principled BSDF"]
    bsdf.inputs["Sheen Weight"].default_value = 0.5
    tc = N.new("ShaderNodeTexCoord")
    w1 = N.new("ShaderNodeTexWave")
    w1.wave_type = "BANDS"
    w1.bands_direction = "X"
    w1.inputs["Scale"].default_value = 1400.0
    w1.inputs["Distortion"].default_value = 1.2
    w2 = N.new("ShaderNodeTexWave")
    w2.wave_type = "BANDS"
    w2.bands_direction = "Y"
    w2.inputs["Scale"].default_value = 1400.0
    w2.inputs["Distortion"].default_value = 1.2
    L.new(tc.outputs["Object"], w1.inputs["Vector"])
    L.new(tc.outputs["Object"], w2.inputs["Vector"])
    add = N.new("ShaderNodeMath")
    add.operation = "ADD"
    L.new(w1.outputs["Fac"], add.inputs[0])
    L.new(w2.outputs["Fac"], add.inputs[1])
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.35
    bump.inputs["Distance"].default_value = 0.0003
    L.new(add.outputs["Value"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def build(phone_holdout=False):
    sc = C.reset()
    sc.view_settings.exposure = -1.35
    sc.view_settings.look = "AgX - Medium High Contrast"
    surface()

    x, y, r = LAYOUT["poster"]
    poster = C.printed_sheet("Poster", 0.297, 0.420, 0.0003, os.path.join(TEX, "poster.png"))
    C.place(poster, fx(x), fy(y), -r)

    x, y, r = LAYOUT["tag"]
    tag = C.printed_sheet("Tag", 0.054, 0.096, 0.0006, os.path.join(TEX, "tag.png"), r=0.0)
    C.place(tag, fx(x), fy(y), -r)

    x, y, r = LAYOUT["box"]
    box = C.slab("Box", [(0.1, 0.07), (-0.1, 0.07), (-0.1, -0.07), (0.1, -0.07)], 0.055,
                 bevel=0.0008, bevel_seg=2)
    C.assign(box, C.matte_material("Box board", "#c8bcaa", rough=0.9, noise=0.03))
    lid = C.uv_panel("Box sleeve", 0.200, 0.140, 0.0, z=0.05505)
    C.assign(lid, C.image_material("Sleeve print", os.path.join(TEX, "sleeve.png"), rough=0.85))
    lid.parent = box
    C.place(box, fx(x), fy(y), -r)

    x, y, r = LAYOUT["oak"]
    oak = C.slab("Oak sample", C.rounded_rect_outline(0.090, 0.060, 0.003, 4), 0.020,
                 bevel=0.0015, bevel_seg=3)
    C.assign(oak, C.oak_material("Oak sample", rot=(math.pi / 2 + 0.06, 0.03, 0), pith=(0.03, 0.12),
                                 ring_freq=190, seed=4.2))
    C.place(oak, fx(x), fy(y), -r)

    x, y, r = LAYOUT["phone"]
    phone, screen = D.phone(os.path.join(TEX, "phone_feed.png"), holdout=phone_holdout,
                            emission=2.8)
    C.place(phone, fx(x), fy(y), -r)

    # window-like key from the upper left, soft overhead fill
    C.sphere_light("Key", (-0.75, 0.95, 1.35), 0.32, 520.0, "#ffefdc")
    C.area_light("Fill", (0.2, -0.3, 2.2), (0, 0, 0), 2.6, 120.0, "#f3f1ec")
    return sc, {"poster": poster, "tag": tag, "box": box, "phone": phone, "screen": screen}


def outline(obj, w, h, z):
    import bpy
    from mathutils import Vector
    bpy.context.view_layer.update()
    m = obj.matrix_world
    pts = [(-w / 2, h / 2, z), (w / 2, h / 2, z), (w / 2, -h / 2, z), (-w / 2, -h / 2, z)]
    return [tuple(m @ Vector(p)) for p in pts]


def main():
    shot = sys.argv[1]
    preview = len(sys.argv) > 2 and sys.argv[2] == "preview"
    scale = 0.3 if preview else 1.0
    samples = 40 if preview else 160
    sc, objs = build(phone_holdout=(shot == "phone_close"))

    if shot == "flatlay":
        cam = C.camera("Cam", (0, 0, 2.0), (0, 0, 0), ortho=FRAME_W)
        w, h = 1620, 2880
    elif shot == "phone_close":
        x, y, _ = LAYOUT["phone"]
        cam = C.camera("Cam", (fx(x), fy(y), 2.0), (fx(x), fy(y), 0), ortho=0.150)
        w, h = 1296, 2304
    else:
        raise SystemExit(f"unknown shot {shot}")
    cam.data.sensor_fit = "HORIZONTAL"
    cam.rotation_mode = "XYZ"
    cam.rotation_euler = (0, 0, 0)

    w, h = int(w * scale), int(h * scale)
    sc.render.resolution_x, sc.render.resolution_y = w, h
    proj = {
        "size": [w, h],
        "screen": C.project(cam, D.screen_corners_world(objs["screen"])),
        "phone": C.project(cam, outline(objs["phone"], D.PHONE_W, D.PHONE_H, D.PHONE_T)),
        "tag": C.project(cam, outline(objs["tag"], 0.054, 0.096, 0.0006)),
        "box": C.project(cam, outline(objs["box"], 0.200, 0.140, 0.055)),
        "poster": C.project(cam, outline(objs["poster"], 0.297, 0.420, 0.0003)),
    }
    name = f"{shot}{'_preview' if preview else ''}"
    with open(os.path.join(C.RENDERS, name + ".json"), "w") as fp:
        json.dump(proj, fp, indent=1)
    # phone_close keeps alpha: the holdout display stays transparent
    C.render(os.path.join(C.RENDERS, name + ".png"), w, h, samples=samples,
             rgba=(shot == "phone_close"))
    print("wrote", name)


if __name__ == "__main__":
    main()
