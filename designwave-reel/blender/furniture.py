"""FORM & OAK product range, modelled to real dimensions (metres).

No. 01 Arc Chair   solid white oak, curved back rail, through-seat back legs
No. 02 Ring Stool  round seat, splayed legs, ring stretcher
No. 03 Side Table  round top on three splayed legs
"""
import math

from mathutils import Matrix, Vector

import common as C


def _lerp_axis(p0, p1, z):
    p0, p1 = Vector(p0), Vector(p1)
    t = (z - p0.z) / (p1.z - p0.z)
    return p0.lerp(p1, t)


def _rail(name, radius, center_y, x_half, z0, z1, thickness, seg=64):
    """A bent back rail: a band on an arc in plan, open towards the seat."""
    import bmesh
    bm = bmesh.new()
    a_half = math.asin(x_half / radius)
    rings = []
    for r in (radius - thickness / 2, radius + thickness / 2):
        row = []
        for z in (z0, z1):
            col = []
            for i in range(seg + 1):
                a = -a_half + 2 * a_half * i / seg
                col.append(bm.verts.new((r * math.sin(a), center_y + r * math.cos(a), z)))
            row.append(col)
        rings.append(row)
    (ib, it), (ob, ot) = rings
    for i in range(seg):
        bm.faces.new((ob[i], ob[i + 1], ot[i + 1], ot[i]))      # outer face
        bm.faces.new((ib[i + 1], ib[i], it[i], it[i + 1]))      # inner face
        bm.faces.new((it[i], ot[i], ot[i + 1], it[i + 1]))      # top
        bm.faces.new((ib[i + 1], ob[i + 1], ob[i], ib[i]))      # bottom
    for e in (0, seg):
        bm.faces.new((ib[e], ob[e], ot[e], it[e]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = C.mesh_object(name, bm)
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = 0.0045
    mod.segments = 4
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(50)
    C.smooth(obj)
    return obj


def _place(objs, location=(0, 0, 0), rot_z=0.0):
    m = Matrix.Translation(location) @ Matrix.Rotation(rot_z, 4, "Z")
    for o in objs:
        # matrix_basis is current as soon as location/rotation are set;
        # matrix_world only after a depsgraph update
        o.matrix_basis = m @ o.matrix_basis
    return objs


def arc_chair(location=(0, 0, 0), rot_z=0.0, seed=0.0):
    parts = []
    legs_mat = C.oak_material("Oak legs", pith=(0.09, -0.06), seed=seed)
    seat_mat = C.oak_material("Oak seat", rot=(math.pi / 2 + 0.05, 0.02, 0), pith=(0.05, 0.31),
                              ring_freq=190, seed=seed + 3.1)
    rail_mat = C.oak_material("Oak rail", rot=(0, math.pi / 2, 0), pith=(-0.21, 0.07),
                              ring_freq=240, seed=seed + 7.7)

    seat = C.slab("Chair seat", C.rounded_rect_outline(0.46, 0.43, 0.055), 0.03, z0=0.42,
                  bevel=0.0065, bevel_seg=5)
    C.assign(seat, seat_mat)
    parts.append(seat)

    front = [((sx * 0.205, -0.188, 0.0), (sx * 0.19, -0.166, 0.42)) for sx in (-1, 1)]
    back = [((sx * 0.205, 0.178, 0.0), (sx * 0.19, 0.236, 0.775)) for sx in (-1, 1)]
    for i, (a, b) in enumerate(front):
        leg = C.tapered_rod(f"Chair front leg {i}", a, b, 0.0125, 0.0172)
        C.assign(leg, legs_mat)
        parts.append(leg)
    for i, (a, b) in enumerate(back):
        leg = C.tapered_rod(f"Chair back leg {i}", a, b, 0.0125, 0.0142)
        C.assign(leg, legs_mat)
        parts.append(leg)

    # back rail through the top of the back legs
    radius = 0.40
    center_y = 0.236 - math.sqrt(radius ** 2 - 0.19 ** 2)
    rail = _rail("Chair back rail", radius, center_y, 0.236, 0.698, 0.776, 0.024)
    C.assign(rail, rail_mat)
    parts.append(rail)

    # side and back stretchers
    for sx in (0, 1):
        p = _lerp_axis(*front[sx], 0.155)
        q = _lerp_axis(*back[sx], 0.155)
        s = C.tapered_rod(f"Chair side stretcher {sx}", p, q, 0.0085, 0.0085, cap_bevel=0.0015)
        C.assign(s, legs_mat)
        parts.append(s)
    p = _lerp_axis(*back[0], 0.21)
    q = _lerp_axis(*back[1], 0.21)
    s = C.tapered_rod("Chair back stretcher", p, q, 0.0085, 0.0085, cap_bevel=0.0015)
    C.assign(s, legs_mat)
    parts.append(s)
    return _place(parts, location, rot_z)


def ring_stool(location=(0, 0, 0), rot_z=0.0, seed=11.0):
    import bpy
    parts = []
    legs_mat = C.oak_material("Stool legs", pith=(0.08, 0.07), seed=seed)
    seat_mat = C.oak_material("Stool seat", rot=(math.pi / 2 + 0.05, 0.02, 0), pith=(0.04, 0.30),
                              ring_freq=190, seed=seed + 2.0)
    seat = C.slab("Stool seat", C.circle_outline(0.172, 128), 0.036, z0=0.424, bevel=0.008,
                  bevel_seg=6)
    C.assign(seat, seat_mat)
    parts.append(seat)
    feet, tops = [], []
    for k in range(4):
        a = math.radians(45 + 90 * k)
        foot = (0.178 * math.cos(a), 0.178 * math.sin(a), 0.0)
        top = (0.112 * math.cos(a), 0.112 * math.sin(a), 0.424)
        leg = C.tapered_rod(f"Stool leg {k}", foot, top, 0.0125, 0.0165)
        C.assign(leg, legs_mat)
        parts.append(leg)
        feet.append(foot)
        tops.append(top)
    z = 0.165
    ring_r = _lerp_axis(feet[0], tops[0], z).xy.length
    bpy.ops.mesh.primitive_torus_add(major_radius=ring_r, minor_radius=0.0082,
                                     major_segments=160, minor_segments=24, location=(0, 0, z))
    ring = bpy.context.active_object
    ring.name = "Stool ring"
    C.smooth(ring, 80)
    C.assign(ring, legs_mat)
    parts.append(ring)
    return _place(parts, location, rot_z)


def side_table(location=(0, 0, 0), rot_z=0.0, seed=23.0):
    parts = []
    legs_mat = C.oak_material("Table legs", pith=(0.07, -0.08), seed=seed)
    top_mat = C.oak_material("Table top", rot=(math.pi / 2 + 0.045, 0.02, 0), pith=(0.03, 0.36),
                             ring_freq=185, seed=seed + 5.0)
    top = C.slab("Table top", C.circle_outline(0.235, 160), 0.026, z0=0.50, bevel=0.007,
                 bevel_seg=6)
    C.assign(top, top_mat)
    parts.append(top)
    for k in range(3):
        a = math.radians(90 + 120 * k)
        foot = (0.205 * math.cos(a), 0.205 * math.sin(a), 0.0)
        tp = (0.145 * math.cos(a), 0.145 * math.sin(a), 0.50)
        leg = C.tapered_rod(f"Table leg {k}", foot, tp, 0.012, 0.0175)
        C.assign(leg, legs_mat)
        parts.append(leg)
    return _place(parts, location, rot_z)
