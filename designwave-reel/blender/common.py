"""Shared Blender helpers: scene reset, colour, materials, studio, render settings.

Run every Blender script with the venv's Python (bpy is installed as a module):
  /root/venvs/reel/bin/python blender/<script>.py
"""
import math
import os

import bpy  # noqa: I001 - bpy must load first, it provides bmesh and mathutils
import bmesh
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RENDERS = os.path.join(ROOT, "assets", "renders")
TEX = os.path.join(ROOT, "assets", "tex")


def srgb(hexstr, alpha=1.0):
    """'#RRGGBB' to a linear RGBA tuple for shader inputs."""
    h = hexstr.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, alpha)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Base Contrast"
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = "OPENIMAGEDENOISE"
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.015
    sc.cycles.max_bounces = 8
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.cycles.sample_clamp_indirect = 4.0
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_depth = "16"
    world = bpy.data.worlds.new("World")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = srgb("#3a352f")
    bg.inputs["Strength"].default_value = 0.35
    return sc


def render(path, w, h, samples=192, transparent=False, rgba=False):
    sc = bpy.context.scene
    sc.render.resolution_x = w
    sc.render.resolution_y = h
    sc.render.resolution_percentage = 100
    sc.cycles.samples = samples
    sc.render.film_transparent = transparent
    sc.render.image_settings.color_mode = "RGBA" if (transparent or rgba) else "RGB"
    sc.render.filepath = path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.render.render(write_still=True)


# ---------------------------------------------------------------- materials

def _nodes(mat):
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    return nt, nt.nodes, nt.links


def oak_material(name="Oak", rot=(0.0, 0.0, 0.0), pith=(0.42, -0.30), ring_freq=260.0,
                 seed=0.0):
    """White oak, oiled. Growth rings around the object's local Z axis.

    rot turns the grain axis (radians), pith offsets the log's centre from
    the part so faces cut the rings at an angle (flat-sawn cathedrals).
    """
    mat = bpy.data.materials.new(name)
    nt, N, L = _nodes(mat)
    out = N.new("ShaderNodeOutputMaterial")
    bsdf = N.new("ShaderNodeBsdfPrincipled")
    L.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    tc = N.new("ShaderNodeTexCoord")
    mp = N.new("ShaderNodeMapping")
    mp.inputs["Rotation"].default_value = rot
    mp.inputs["Location"].default_value = (pith[0], pith[1], seed)
    L.new(tc.outputs["Object"], mp.inputs["Vector"])

    # slow distortion of the rings
    warp = N.new("ShaderNodeTexNoise")
    warp.inputs["Scale"].default_value = 2.2
    warp.inputs["Detail"].default_value = 4.0
    warp.inputs["Roughness"].default_value = 0.55
    warp_map = N.new("ShaderNodeMapping")
    warp_map.inputs["Scale"].default_value = (3.0, 3.0, 0.35)
    L.new(mp.outputs["Vector"], warp_map.inputs["Vector"])
    L.new(warp_map.outputs["Vector"], warp.inputs["Vector"])

    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(mp.outputs["Vector"], sep.inputs["Vector"])
    comb = N.new("ShaderNodeCombineXYZ")
    L.new(sep.outputs["X"], comb.inputs["X"])
    L.new(sep.outputs["Y"], comb.inputs["Y"])
    radius = N.new("ShaderNodeVectorMath")
    radius.operation = "LENGTH"
    L.new(comb.outputs["Vector"], radius.inputs[0])

    wobble = N.new("ShaderNodeMath")
    wobble.operation = "MULTIPLY_ADD"
    wobble.inputs[1].default_value = 0.018
    L.new(warp.outputs["Fac"], wobble.inputs[0])
    L.new(radius.outputs["Value"], wobble.inputs[2])

    freq = N.new("ShaderNodeMath")
    freq.operation = "MULTIPLY"
    freq.inputs[1].default_value = ring_freq
    L.new(wobble.outputs["Value"], freq.inputs[0])
    ring = N.new("ShaderNodeMath")
    ring.operation = "FRACT"
    L.new(freq.outputs["Value"], ring.inputs[0])

    ring_ramp = N.new("ShaderNodeValToRGB")
    cr = ring_ramp.color_ramp
    cr.interpolation = "B_SPLINE"
    cr.elements[0].position = 0.0
    cr.elements[0].color = srgb("#d0ad7c")
    cr.elements[1].position = 0.62
    cr.elements[1].color = srgb("#c19a6a")
    e = cr.elements.new(0.80)
    e.color = srgb("#8a6539")
    e = cr.elements.new(0.97)
    e.color = srgb("#caa271")
    L.new(ring.outputs["Value"], ring_ramp.inputs["Fac"])

    # pores and fine streaks along the grain
    pores = N.new("ShaderNodeTexNoise")
    pores.inputs["Scale"].default_value = 1.0
    pores.inputs["Detail"].default_value = 2.0
    pore_map = N.new("ShaderNodeMapping")
    pore_map.inputs["Scale"].default_value = (520.0, 520.0, 9.0)
    L.new(mp.outputs["Vector"], pore_map.inputs["Vector"])
    L.new(pore_map.outputs["Vector"], pores.inputs["Vector"])
    pore_ramp = N.new("ShaderNodeValToRGB")
    pore_ramp.color_ramp.elements[0].position = 0.52
    pore_ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    pore_ramp.color_ramp.elements[1].position = 0.70
    pore_ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
    L.new(pores.outputs["Fac"], pore_ramp.inputs["Fac"])

    # board-to-board tone variation
    tone = N.new("ShaderNodeTexNoise")
    tone.inputs["Scale"].default_value = 1.6
    tone.inputs["Detail"].default_value = 1.0
    L.new(mp.outputs["Vector"], tone.inputs["Vector"])
    tone_mix = N.new("ShaderNodeMix")
    tone_mix.data_type = "RGBA"
    tone_mix.blend_type = "MULTIPLY"
    tone_mix.inputs["Factor"].default_value = 0.18
    L.new(ring_ramp.outputs["Color"], tone_mix.inputs["A"])
    L.new(tone.outputs["Color"], tone_mix.inputs["B"])

    darken = N.new("ShaderNodeMix")
    darken.data_type = "RGBA"
    darken.blend_type = "MIX"
    darken.inputs["B"].default_value = srgb("#6e4f2c")
    pore_amt = N.new("ShaderNodeMath")
    pore_amt.operation = "MULTIPLY"
    pore_amt.inputs[1].default_value = 0.35
    L.new(pore_ramp.outputs["Color"], pore_amt.inputs[0])
    L.new(pore_amt.outputs["Value"], darken.inputs["Factor"])
    L.new(tone_mix.outputs["Result"], darken.inputs["A"])
    L.new(darken.outputs["Result"], bsdf.inputs["Base Color"])

    rough = N.new("ShaderNodeMapRange")
    rough.inputs["To Min"].default_value = 0.46
    rough.inputs["To Max"].default_value = 0.62
    L.new(pore_ramp.outputs["Color"], rough.inputs["Value"])
    L.new(rough.outputs["Result"], bsdf.inputs["Roughness"])
    bsdf.inputs["Specular IOR Level"].default_value = 0.42
    bsdf.inputs["Coat Weight"].default_value = 0.06
    bsdf.inputs["Coat Roughness"].default_value = 0.35

    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12
    bump.inputs["Distance"].default_value = 0.0006
    hmix = N.new("ShaderNodeMath")
    hmix.operation = "SUBTRACT"
    hmix.inputs[0].default_value = 1.0
    L.new(pore_ramp.outputs["Color"], hmix.inputs[1])
    L.new(hmix.outputs["Value"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def matte_material(name, hexcolor, rough=0.85, noise=0.03, noise_scale=900.0, sheen=0.0):
    """Paper, card, painted surfaces: diffuse with a faint fibre texture."""
    mat = bpy.data.materials.new(name)
    nt, N, L = _nodes(mat)
    out = N.new("ShaderNodeOutputMaterial")
    bsdf = N.new("ShaderNodeBsdfPrincipled")
    L.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = srgb(hexcolor)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Specular IOR Level"].default_value = 0.3
    if sheen:
        bsdf.inputs["Sheen Weight"].default_value = sheen
    if noise:
        tex = N.new("ShaderNodeTexNoise")
        tex.inputs["Scale"].default_value = noise_scale
        tex.inputs["Detail"].default_value = 6.0
        tc = N.new("ShaderNodeTexCoord")
        L.new(tc.outputs["Object"], tex.inputs["Vector"])
        bump = N.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = noise
        bump.inputs["Distance"].default_value = 0.0004
        L.new(tex.outputs["Fac"], bump.inputs["Height"])
        L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def image_material(name, image_path, rough=0.8, noise=0.02, coat=0.0, emission=0.0):
    """A printed surface (or a lit screen when emission > 0) from a PNG."""
    mat = bpy.data.materials.new(name)
    nt, N, L = _nodes(mat)
    out = N.new("ShaderNodeOutputMaterial")
    bsdf = N.new("ShaderNodeBsdfPrincipled")
    L.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    img = bpy.data.images.load(image_path)
    tex = N.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Cubic"
    tc = N.new("ShaderNodeTexCoord")
    L.new(tc.outputs["UV"], tex.inputs["Vector"])
    L.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Specular IOR Level"].default_value = 0.3
    if coat:
        bsdf.inputs["Coat Weight"].default_value = coat
        bsdf.inputs["Coat Roughness"].default_value = 0.2
    if emission:
        L.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = emission
    if noise:
        ntex = N.new("ShaderNodeTexNoise")
        ntex.inputs["Scale"].default_value = 900.0
        ntex.inputs["Detail"].default_value = 6.0
        L.new(tc.outputs["Object"], ntex.inputs["Vector"])
        bump = N.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = noise
        bump.inputs["Distance"].default_value = 0.0004
        L.new(ntex.outputs["Fac"], bump.inputs["Height"])
        L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def metal_material(name, hexcolor, rough=0.32, aniso=0.0):
    mat = bpy.data.materials.new(name)
    nt, N, L = _nodes(mat)
    out = N.new("ShaderNodeOutputMaterial")
    bsdf = N.new("ShaderNodeBsdfPrincipled")
    L.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = srgb(hexcolor)
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = rough
    if aniso:
        bsdf.inputs["Anisotropic"].default_value = aniso
    return mat


def glass_black_material(name="ScreenGlass"):
    """Switched-off display glass: near black, glossy."""
    mat = bpy.data.materials.new(name)
    nt, N, L = _nodes(mat)
    out = N.new("ShaderNodeOutputMaterial")
    bsdf = N.new("ShaderNodeBsdfPrincipled")
    L.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = srgb("#08090a")
    bsdf.inputs["Roughness"].default_value = 0.06
    bsdf.inputs["Specular IOR Level"].default_value = 0.6
    return mat


def holdout_material(name="Holdout"):
    """Cuts a transparent hole in the render (for compositing screens)."""
    mat = bpy.data.materials.new(name)
    nt, N, L = _nodes(mat)
    out = N.new("ShaderNodeOutputMaterial")
    h = N.new("ShaderNodeHoldout")
    L.new(h.outputs["Holdout"], out.inputs["Surface"])
    return mat


# ---------------------------------------------------------------- geometry

def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def mesh_object(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return link(bpy.data.objects.new(name, me))


def rounded_rect_outline(w, d, r, seg=10):
    pts = []
    corners = [(w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90),
               (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)]
    for cx, cy, a0 in corners:
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def circle_outline(radius, seg=96):
    return [(radius * math.cos(2 * math.pi * i / seg), radius * math.sin(2 * math.pi * i / seg))
            for i in range(seg)]


def slab(name, outline, thickness, z0=0.0, bevel=0.004, bevel_seg=4):
    """Extrude a 2D outline into a slab; softens the top and bottom edges."""
    bm = bmesh.new()
    verts = [bm.verts.new((x, y, z0)) for x, y in outline]
    face = bm.faces.new(verts)
    res = bmesh.ops.extrude_face_region(bm, geom=[face])
    top = [g for g in res["geom"] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, thickness), verts=top)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = mesh_object(name, bm)
    if bevel:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = bevel_seg
        mod.limit_method = "ANGLE"
        mod.angle_limit = math.radians(50)
        mod.harden_normals = False
    smooth(obj)
    return obj


def smooth(obj, angle=35):
    for p in obj.data.polygons:
        p.use_smooth = True
    try:
        mod = obj.modifiers.new("Smooth", "SMOOTH_BY_ANGLE")
        mod["Input_1"] = math.radians(angle)
    except Exception:
        pass


def tapered_rod(name, p0, p1, r0, r1, seg=40, cap_bevel=0.002):
    """Round tapered rod from p0 (radius r0) to p1 (radius r1), local Z along the rod."""
    p0, p1 = Vector(p0), Vector(p1)
    length = (p1 - p0).length
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg,
                          radius1=r0, radius2=r1, depth=length)
    bmesh.ops.translate(bm, vec=(0, 0, length / 2), verts=bm.verts)
    obj = mesh_object(name, bm)
    obj.location = p0
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference((p1 - p0).normalized())
    if cap_bevel:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width = cap_bevel
        mod.segments = 3
        mod.limit_method = "ANGLE"
        mod.angle_limit = math.radians(60)
    smooth(obj, 60)
    return obj


def assign(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def cove(name="Cove", width=8.0, depth=6.0, height=5.0, radius=1.2, y_wall=2.2, mat=None):
    """Seamless studio backdrop: floor curving up into a back wall."""
    bm = bmesh.new()
    prof = [(-depth, 0.0)]
    steps = 24
    cy, cz = y_wall - radius, radius
    for i in range(steps + 1):
        a = math.radians(-90 + 90 * i / steps)
        prof.append((cy + radius * math.cos(a), cz + radius * math.sin(a)))
    prof.append((y_wall, height))
    rows = []
    for x in (-width / 2, width / 2):
        rows.append([bm.verts.new((x, y, z)) for y, z in prof])
    for i in range(len(prof) - 1):
        bm.faces.new((rows[0][i], rows[1][i], rows[1][i + 1], rows[0][i + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = mesh_object(name, bm)
    for p in obj.data.polygons:
        p.use_smooth = True
    if mat:
        assign(obj, mat)
    return obj


def area_light(name, loc, target, size, power, kelvin_hex="#fff3e4", size_y=None):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = srgb(kelvin_hex)[:3]
    if size_y:
        data.shape = "RECTANGLE"
        data.size = size
        data.size_y = size_y
    else:
        data.size = size
    obj = link(bpy.data.objects.new(name, data))
    obj.location = loc
    look_at(obj, target)
    return obj


def sphere_light(name, loc, radius, power, hexcolor="#fff3e4"):
    """Large soft source without an area light's one-sided cut-off."""
    data = bpy.data.lights.new(name, "POINT")
    data.energy = power
    data.color = srgb(hexcolor)[:3]
    data.shadow_soft_size = radius
    obj = link(bpy.data.objects.new(name, data))
    obj.location = loc
    return obj


def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = d.to_track_quat("-Z", "Y")


def camera(name, loc, target, lens=70.0, fstop=0.0, focus=None, ortho=None):
    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.sensor_width = 36.0
    data.sensor_fit = "AUTO"
    if ortho:
        data.type = "ORTHO"
        data.ortho_scale = ortho
    if fstop:
        data.dof.use_dof = True
        data.dof.aperture_fstop = fstop
        data.dof.focus_distance = focus or (Vector(target) - Vector(loc)).length
    obj = link(bpy.data.objects.new(name, data))
    obj.location = loc
    look_at(obj, target)
    bpy.context.scene.camera = obj
    return obj


def project(cam_obj, world_points):
    """World points to pixel coordinates (top-left origin) in the current render size."""
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    w, h = sc.render.resolution_x, sc.render.resolution_y
    out = []
    for p in world_points:
        v = world_to_camera_view(sc, cam_obj, Vector(p))
        out.append([round(v.x * w, 2), round((1 - v.y) * h, 2)])
    return out


def uv_panel(name, w, h, r=0.0, z=0.0, seg=10, flip_v=False):
    """Flat rounded-rect face with UVs spanning its bounding box (for print/screens)."""
    outline = rounded_rect_outline(w, h, r, seg) if r > 0 else [(w / 2, h / 2), (-w / 2, h / 2), (-w / 2, -h / 2), (w / 2, -h / 2)]
    bm = bmesh.new()
    verts = [bm.verts.new((x, y, z)) for x, y in outline]
    face = bm.faces.new(verts)
    uv = bm.loops.layers.uv.new("UVMap")
    for loop in face.loops:
        x, y = loop.vert.co.x, loop.vert.co.y
        loop[uv].uv = (x / w + 0.5, (0.5 - y / h) if flip_v else (y / h + 0.5))
    face.normal_update()
    if face.normal.z < 0:
        face.normal_flip()
    return mesh_object(name, bm)


def printed_sheet(name, w, h, t, image_path, edge_hex="#efe9df", r=0.0, rough=0.82, coat=0.0):
    """A card or sheet: printed top face over a thin paper body."""
    body = slab(name + " body", rounded_rect_outline(w, h, r) if r > 0 else
                [(w / 2, h / 2), (-w / 2, h / 2), (-w / 2, -h / 2), (w / 2, -h / 2)],
                t, z0=0.0, bevel=min(t * 0.4, 0.0006), bevel_seg=2)
    assign(body, matte_material(name + " edge", edge_hex, rough=0.9, noise=0.0))
    top = uv_panel(name + " print", w, h, r, z=t + 0.00005)
    assign(top, image_material(name + " ink", image_path, rough=rough, coat=coat))
    top.parent = body
    return body


def place(obj, x, y, rot_deg=0.0, z=0.0):
    obj.location = (x, y, z)
    obj.rotation_mode = "XYZ"
    obj.rotation_euler = (0.0, 0.0, math.radians(rot_deg))
    return obj
