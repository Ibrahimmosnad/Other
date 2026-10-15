"""A generic smartphone and laptop (no brand marks), modelled in metres."""
import math

import bpy

import common as C

PHONE_W, PHONE_H, PHONE_T = 0.0715, 0.147, 0.0078
SCREEN_W, SCREEN_H, SCREEN_R = 0.0668, 0.1425, 0.0088


def _parent(children, parent):
    for c in children:
        c.parent = parent


def phone(screen_image=None, holdout=False, frame_hex="#cfccc6", emission=1.0):
    """Phone lying on its back, screen facing +Z, top of the phone towards +Y.

    screen_image: PNG shown on the display (lit), or holdout=True to leave the
    display transparent for compositing a live page underneath.
    """
    body = C.slab("Phone body", C.rounded_rect_outline(PHONE_W, PHONE_H, 0.0105, 14), PHONE_T,
                  bevel=0.0011, bevel_seg=5)
    C.assign(body, C.metal_material("Phone frame", frame_hex, rough=0.34))
    glass = C.slab("Phone glass", C.rounded_rect_outline(PHONE_W - 0.0012, PHONE_H - 0.0012, 0.0099, 14),
                   0.0004, z0=PHONE_T, bevel=0.0002, bevel_seg=2)
    C.assign(glass, C.glass_black_material())
    scr = C.uv_panel("Phone screen", SCREEN_W, SCREEN_H, SCREEN_R, z=PHONE_T + 0.00042, seg=12)
    if holdout:
        C.assign(scr, C.holdout_material())
    else:
        C.assign(scr, C.image_material("Phone display", screen_image, rough=0.12, noise=0.0,
                                       emission=emission))
    island = C.slab("Phone island", C.rounded_rect_outline(0.0205, 0.0062, 0.0031, 10), 0.00005,
                    z0=PHONE_T + 0.00044, bevel=0)
    island.location.y = SCREEN_H / 2 - 0.0058
    C.assign(island, C.glass_black_material("Island"))
    _parent([glass, scr, island], body)
    return body, scr


def screen_corners_world(screen_obj, w=SCREEN_W, h=SCREEN_H):
    """Display corners (TL, TR, BR, BL as seen from the front) in world space."""
    bpy.context.view_layer.update()
    m = screen_obj.matrix_world
    z = 0.0
    loc = [(-w / 2, h / 2, z), (w / 2, h / 2, z), (w / 2, -h / 2, z), (-w / 2, -h / 2, z)]
    from mathutils import Vector
    return [tuple(m @ Vector(p)) for p in loc]


LAP_W, LAP_D, LAP_T = 0.304, 0.214, 0.0105
LID_T = 0.0055
DISP_W, DISP_H = 0.2846, 0.1779


def laptop(screen_image, open_deg=112.0, alu_hex="#c9c7c3", emission=1.0):
    """Laptop on the XY plane, hinge along the back edge (+Y), keyboard facing +Z."""
    parts = []
    alu = C.metal_material("Laptop aluminium", alu_hex, rough=0.46)
    base = C.slab("Laptop base", C.rounded_rect_outline(LAP_W, LAP_D, 0.010, 10), LAP_T,
                  bevel=0.0018, bevel_seg=4)
    C.assign(base, alu)
    parts.append(base)
    # keyboard well and keys
    well = C.slab("Keyboard well", C.rounded_rect_outline(0.272, 0.112, 0.004, 6), 0.0004,
                  z0=LAP_T - 0.0002, bevel=0)
    well.location.y = 0.038
    C.assign(well, C.matte_material("Well", "#1d1d1f", rough=0.6, noise=0.0))
    parts.append(well)
    key_mat = C.matte_material("Keys", "#232325", rough=0.55, noise=0.0)
    rows = [14, 14, 14, 13, 12]
    pitch = 0.0189
    for r, count in enumerate(rows):
        y = 0.040 + 0.040 - r * pitch
        width = (0.272 - 0.008) / count - 0.0028
        for k in range(count):
            x = -0.132 + (k + 0.5) * ((0.272 - 0.008) / count)
            key = C.slab(f"Key {r}-{k}", C.rounded_rect_outline(width, 0.0158, 0.0022, 4),
                         0.0009, z0=LAP_T + 0.0001, bevel=0.0003, bevel_seg=2)
            key.location = (x, y, 0)
            C.assign(key, key_mat)
            parts.append(key)
    space = C.slab("Space", C.rounded_rect_outline(0.090, 0.0158, 0.0022, 4), 0.0009,
                   z0=LAP_T + 0.0001, bevel=0.0003, bevel_seg=2)
    space.location = (0, 0.040 + 0.040 - 5 * pitch, 0)
    C.assign(space, key_mat)
    parts.append(space)
    pad = C.slab("Trackpad", C.rounded_rect_outline(0.128, 0.070, 0.006, 8), 0.0002,
                 z0=LAP_T - 0.0001, bevel=0)
    pad.location.y = -0.062
    C.assign(pad, C.metal_material("Pad", "#c2c0bb", rough=0.42))
    parts.append(pad)

    # Lid: built closed (display facing down onto the keys), then swung open
    # about the hinge line. Rotating by -open_deg about X lifts the front edge
    # up and back, which turns the display towards -Y (the viewer).
    lid = C.slab("Lid", C.rounded_rect_outline(LAP_W, LAP_D - 0.002, 0.010, 10), LID_T,
                 bevel=0.0012, bevel_seg=4)
    C.assign(lid, alu)
    bezel = C.slab("Bezel", C.rounded_rect_outline(LAP_W - 0.003, LAP_D - 0.005, 0.009, 10), 0.0003,
                   z0=-0.0003, bevel=0)
    C.assign(bezel, C.glass_black_material("Bezel glass"))
    disp = C.uv_panel("Display", DISP_W, DISP_H, 0.0, z=-0.00036, flip_v=True)
    for p in disp.data.polygons:
        p.flip()
    disp.location.y = 0.0015
    C.assign(disp, C.image_material("Laptop display", screen_image, rough=0.15, noise=0.0,
                                    emission=emission))
    bezel.parent = lid
    disp.parent = lid
    hinge = bpy.data.objects.new("Hinge", None)
    C.link(hinge)
    hinge.location = (0, LAP_D / 2 - 0.003, LAP_T)
    lid.parent = hinge
    lid.location = (0, -(LAP_D / 2 - 0.003), 0.0002)
    hinge.rotation_euler = (-math.radians(open_deg), 0, 0)
    _parent([p for p in parts if p is not base], base)
    hinge.parent = base
    return base, disp
