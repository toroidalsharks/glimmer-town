# Glimmer Town v24 props, modeled in Blender (bpy) and exported as compact vertex data.
# Each asset is a list of parts. A part is either "tint" (grayscale shading the game colors
# per instance or per season) or "color" (baked colors). Ambient occlusion is ray-traced
# against the asset itself plus the ground and baked into the vertex colors.
import bpy, bmesh, math, random, json, struct, base64, sys
from mathutils import Vector, Matrix, noise
from mathutils.bvhtree import BVHTree

import os
# writes straight into the game's source; run `npm run assets` (or python3 tools/blender/assets.py)
OUT = sys.argv[-1] if sys.argv[-1].endswith('.js') else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'js', '560-assets.gen.js')
random.seed(7)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def link(me, name):
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    return o

def bm_to_obj(bm, name):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    return link(me, name)

def ico(r=1, sub=2, loc=(0, 0, 0), scale=(1, 1, 1)):
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    for v in bm.verts:
        v.co = Vector((v.co.x * scale[0], v.co.y * scale[1], v.co.z * scale[2])) + Vector(loc)
    return bm

def merge_bms(bms):
    out = bmesh.new()
    for b in bms:
        me = bpy.data.meshes.new('tmp'); b.to_mesh(me); b.free(); out.from_mesh(me); bpy.data.meshes.remove(me)
    return out

def evaluated_copy(o, name):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    bpy.data.objects.remove(o)
    return link(me, name)

def remesh(o, voxel, smooth_iter=0, faces=None, disp=None, flat=False):
    m = o.modifiers.new('rm', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = voxel
    if smooth_iter:
        s = o.modifiers.new('sm', 'SMOOTH'); s.iterations = smooth_iter; s.factor = 0.6
    if disp:
        tex = bpy.data.textures.new('tx', disp.get('type', 'CLOUDS'))
        if disp.get('type', 'CLOUDS') == 'CLOUDS': tex.noise_scale = disp.get('size', 0.5); tex.noise_depth = 1
        else: tex.noise_scale = disp.get('size', 0.5); tex.distance_metric = 'DISTANCE'
        d = o.modifiers.new('dp', 'DISPLACE'); d.texture = tex; d.strength = disp.get('strength', 0.1); d.mid_level = 0.5; d.texture_coords = 'OBJECT' if False else 'LOCAL'
    name = o.name
    o = evaluated_copy(o, name)
    if faces:
        n = len(o.data.polygons)
        if n > faces:
            dm = o.modifiers.new('dc', 'DECIMATE'); dm.ratio = faces / n
            o = evaluated_copy(o, name)
    return o

def tri(o):
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bm.to_mesh(o.data); bm.free()
    return o

def cyl_bm(r1, r2, h, seg=8, z0=0.0, caps=True):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=caps, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=h)
    bmesh.ops.translate(bm, vec=Vector((0, 0, z0 + h / 2)), verts=bm.verts)
    return bm

# ---------- ambient occlusion + color ----------
def hemi_dirs(n=48, seed=3):
    rnd = random.Random(seed); out = []
    for i in range(n):
        u, v = rnd.random(), rnd.random()
        r = math.sqrt(u); th = 2 * math.pi * v
        out.append((r * math.cos(th), r * math.sin(th), math.sqrt(max(0, 1 - u))))
    return out
DIRS = hemi_dirs()

def basis(nrm):
    n = Vector(nrm).normalized()
    a = Vector((1, 0, 0)) if abs(n.x) < 0.9 else Vector((0, 1, 0))
    t = n.cross(a).normalized(); b = n.cross(t)
    return t, b, n

def build_bvh(objs, ground):
    bm = bmesh.new()
    for o in objs:
        tmp = bmesh.new(); tmp.from_mesh(o.data); tmp.transform(o.matrix_world)
        me = bpy.data.meshes.new('t'); tmp.to_mesh(me); tmp.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
    if ground is not None:
        s = 30
        vs = [bm.verts.new((x, y, ground)) for x, y in ((-s, -s), (s, -s), (s, s), (-s, s))]
        bm.faces.new(vs)
    bm.verts.ensure_lookup_table()
    return BVHTree.FromBMesh(bm)

def ao_at(bvh, co, nrm, dist):
    t, b, n = basis(nrm); hit = 0
    o = Vector(co) + n * 0.012
    for (x, y, z) in DIRS:
        d = (t * x + b * y + n * z)
        loc, _, _, _ = bvh.ray_cast(o, d, dist)
        if loc is not None: hit += 1
    return 1 - hit / len(DIRS)

# ---------- export ----------
ASSETS = {}
BLOB = bytearray()

def pad4():
    while len(BLOB) % 4: BLOB.append(0)

def add_bytes(fmt, vals):
    pad4(); off = len(BLOB); BLOB.extend(struct.pack('<%d%s' % (len(vals), fmt), *vals)); return off

def export_part(o, colorfn, flat=False, bvh=None, aodist=1.5, aok=0.75):
    """colorfn(co, nrm, ao) -> (r,g,b) in 0..1. Coordinates are blender (z up)."""
    tri(o)
    me = o.data; mw = o.matrix_world
    pos, nor, col, idx = [], [], [], []
    if flat:
        for f in me.polygons:
            n = (mw.to_3x3() @ f.normal).normalized()
            c = mw @ f.center
            ao = ao_at(bvh, c, n, aodist) if bvh else 1
            for vi in f.vertices:
                co = mw @ me.vertices[vi].co
                rgb = colorfn(co, n, 1 - (1 - ao) * aok, f)
                pos.append(co); nor.append(n); col.append(rgb)
        idx = None
    else:
        me.calc_loop_triangles() if hasattr(me, 'calc_loop_triangles') else None
        vn = [(mw.to_3x3() @ v.normal).normalized() for v in me.vertices]
        for i, v in enumerate(me.vertices):
            co = mw @ v.co; n = vn[i]
            ao = ao_at(bvh, co, n, aodist) if bvh else 1
            pos.append(co); nor.append(n); col.append(colorfn(co, n, 1 - (1 - ao) * aok, None))
        for f in me.polygons: idx.extend(f.vertices)
    # blender z-up -> three y-up: (x, y, z) -> (x, z, -y)
    P = [(p.x, p.z, -p.y) for p in pos]; N = [(n.x, n.z, -n.y) for n in nor]
    mn = [min(p[k] for p in P) for k in range(3)]; mx = [max(p[k] for p in P) for k in range(3)]
    q = []
    for p in P:
        for k in range(3):
            span = (mx[k] - mn[k]) or 1
            q.append(int(round((p[k] - mn[k]) / span * 65535)) - 32768)
    part = {'vc': len(P), 'min': [round(v, 5) for v in mn], 'max': [round(v, 5) for v in mx]}
    part['p'] = add_bytes('h', q)
    part['n'] = add_bytes('b', [max(-127, min(127, int(round(c * 127)))) for n in N for c in n])
    part['c'] = add_bytes('B', [max(0, min(255, int(round(c * 255)))) for rgb in col for c in rgb])
    if idx is not None:
        part['ic'] = len(idx); part['i'] = add_bytes('H', idx)
    part['tris'] = (len(idx) if idx is not None else len(P)) // 3
    return part

def asset(name, parts, **meta):
    ASSETS[name] = {'parts': parts, **meta}
    print('%-14s' % name, ' + '.join('%d' % p['tris'] for p in parts), 'tris')

def lerp(a, b, t): return a + (b - a) * t
def mix3(a, b, t): return tuple(lerp(a[i], b[i], t) for i in range(3))
def hexc(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
def srgb2lin(c): return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)
# vertex colors are read by three as linear values, so bake colors in linear space
def H(h): return srgb2lin(hexc(h))
def shade(c, k): return tuple(x * k for x in c)
def smoothstep(a, b, x):
    t = max(0, min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t)

# =====================================================================
# ROUND TREE (hardwood): lumpy canopy + bent trunk with root flare
# =====================================================================
def canopy_round(seed, R=1.9):
    rnd = random.Random(seed)
    bms = [ico(R, 3, (0, 0, 0), (1, 1, 0.86))]
    for i in range(7):
        a = i / 7 * 6.283 + rnd.random() * 0.5; el = rnd.uniform(-0.25, 0.75)
        rr = R * rnd.uniform(0.46, 0.62)
        d = R * 0.78
        bms.append(ico(rr, 2, (math.cos(a) * d * math.cos(el), math.sin(a) * d * math.cos(el), math.sin(el) * d * 0.85 - 0.05)))
    bms.append(ico(R * 0.62, 2, (0.1, -0.1, R * 0.72)))
    o = bm_to_obj(merge_bms(bms), 'canopy')
    o = remesh(o, 0.11, smooth_iter=2, faces=520, disp={'type': 'VORONOI', 'size': 0.55, 'strength': 0.22})
    for p in o.data.polygons: p.use_smooth = True
    return o

def trunk_round(h=2.9, r=0.32, seed=1):
    rnd = random.Random(seed)
    bm = bmesh.new(); seg = 9; rings = 7; prev = None; first = None
    for k in range(rings):
        t = k / (rings - 1); z = t * h
        rr = r * (1.0 - 0.35 * t) * (1 + 0.9 * max(0, 0.18 - t) / 0.18 * 0.6)
        ox = math.sin(t * 2.2) * 0.16; oy = math.cos(t * 1.7) * 0.06
        ring = []
        for s in range(seg):
            a = s / seg * 6.283
            flare = 1 + (0.45 if k == 0 and s % 3 == 0 else 0.15 if k == 0 else 0)
            ring.append(bm.verts.new((ox + math.cos(a) * rr * flare, oy + math.sin(a) * rr * flare, z)))
        if prev:
            for s in range(seg):
                bm.faces.new((prev[s], prev[(s + 1) % seg], ring[(s + 1) % seg], ring[s]))
        else: first = ring
        prev = ring
    bm.faces.new(list(reversed(first))); bm.faces.new(prev)
    # two branch stubs reaching into the crown
    for (a, zz, L) in ((0.6, 0.72, 0.9), (3.6, 0.8, 0.75)):
        b2 = cyl_bm(0.12, 0.06, L, 6)
        rot = Matrix.Rotation(0.9, 4, 'Y') @ Matrix.Identity(4)
        bmesh.ops.transform(b2, matrix=Matrix.Rotation(a, 4, 'Z') @ rot, verts=b2.verts)
        bmesh.ops.translate(b2, vec=Vector((0, 0, h * zz)), verts=b2.verts)
        me = bpy.data.meshes.new('b'); b2.to_mesh(me); b2.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
    o = bm_to_obj(bm, 'trunk')
    for p in o.data.polygons: p.use_smooth = True
    return o

def make_round_tree(name, seed):
    reset()
    tr = trunk_round(seed=seed)
    cn = canopy_round(seed); cn.location = (0.18, 0.02, 3.45); bpy.context.view_layer.update()
    cn.data.transform(cn.matrix_world); cn.matrix_world = Matrix.Identity(4)
    bvh = build_bvh([tr, cn], 0)
    bark = H('#8d5f3c')
    def ccol(co, n, ao, f):
        g = 0.62 + 0.38 * smoothstep(1.6, 5.2, co.z)          # darker underneath, bright on top
        g *= 0.9 + 0.1 * max(0, n.z)
        return (g * ao,) * 3
    def tcol(co, n, ao, f):
        k = 0.8 + 0.2 * smoothstep(0, 2.5, co.z)
        return shade(bark, k * ao)
    asset(name, [export_part(cn, ccol, bvh=bvh, aodist=2.2, aok=0.85) | {'tint': 'leaf'},
                 export_part(tr, tcol, bvh=bvh, aodist=1.6, aok=0.8)])

# =====================================================================
# CEDAR: droopy scalloped tiers
# =====================================================================
def make_cedar():
    reset()
    bm = bmesh.new()
    tiers = [(1.95, 0.0, 1.9), (1.55, 1.15, 1.7), (1.1, 2.2, 1.5), (0.62, 3.1, 1.2)]
    for (R, z0, hgt) in tiers:
        seg = 14; bottom = [];
        for s in range(seg):
            a = s / seg * 6.283
            rr = R * (1.0 if s % 2 == 0 else 0.78)
            dz = -0.22 if s % 2 == 0 else 0.0
            bottom.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr, z0 + dz)))
        mid = [bm.verts.new((math.cos(s / seg * 6.283 + 0.1) * R * 0.55, math.sin(s / seg * 6.283 + 0.1) * R * 0.55, z0 + hgt * 0.45)) for s in range(seg)]
        tip = bm.verts.new((0, 0, z0 + hgt))
        under = bm.verts.new((0, 0, z0 + 0.15))
        for s in range(seg):
            s2 = (s + 1) % seg
            bm.faces.new((bottom[s], bottom[s2], mid[s2], mid[s]))
            bm.faces.new((mid[s], mid[s2], tip))
            bm.faces.new((bottom[s2], bottom[s], under))
    o = bm_to_obj(bm, 'cedar')
    for p in o.data.polygons: p.use_smooth = True
    o.location = (0, 0, 1.25); bpy.context.view_layer.update(); o.data.transform(o.matrix_world); o.matrix_world = Matrix.Identity(4)
    tr = bm_to_obj(cyl_bm(0.3, 0.22, 1.6, 8), 'ctrunk')
    for p in tr.data.polygons: p.use_smooth = True
    bvh = build_bvh([o, tr], 0)
    def ccol(co, n, ao, f):
        g = 0.6 + 0.4 * smoothstep(0.8, 5, co.z); g *= 0.85 + 0.15 * max(0, n.z)
        return (g * ao,) * 3
    bark = H('#7a5236')
    asset('cedar', [export_part(o, ccol, bvh=bvh, aodist=1.4, aok=0.8) | {'tint': 'leaf'},
                    export_part(tr, lambda co, n, ao, f: shade(bark, ao), bvh=bvh)])

# =====================================================================
# PALM: ringed curved trunk + serrated drooping fronds + coconuts
# =====================================================================
def make_palm():
    reset()
    bm = bmesh.new(); seg = 8; prev = None; H0 = 4.6; rings = 16; first = None
    path = []
    for k in range(rings + 1):
        t = k / rings; x = 0.9 * t * t; z = t * H0; path.append(Vector((x, 0, z)))
        rr = 0.26 * (1 - 0.3 * t) * (1.12 if k % 2 == 0 else 0.96)
        ring = [bm.verts.new((x + math.cos(s / seg * 6.283) * rr, math.sin(s / seg * 6.283) * rr, z)) for s in range(seg)]
        if prev:
            for s in range(seg): bm.faces.new((prev[s], prev[(s + 1) % seg], ring[(s + 1) % seg], ring[s]))
        else: first = ring
        prev = ring
    bm.faces.new(list(reversed(first))); bm.faces.new(prev)
    trunk = bm_to_obj(bm, 'ptrunk')
    for p in trunk.data.polygons: p.use_smooth = True
    top = path[-1]
    fb = bmesh.new()
    nf = 8
    for i in range(nf):
        a = i / nf * 6.283 + 0.3
        L = 2.5 + (i % 3) * 0.3; steps = 7; left = []; right = []; spine = []
        for k in range(steps + 1):
            t = k / steps
            dist = L * t; droop = -1.6 * t * t + 0.55 * t
            c = top + Vector((math.cos(a) * dist, math.sin(a) * dist, droop + 0.1))
            w = 0.55 * math.sin(math.pi * min(1, t * 1.15)) + 0.04
            zig = 0.12 if k % 2 else 0
            side = Vector((-math.sin(a), math.cos(a), 0))
            spine.append(fb.verts.new(c + Vector((0, 0, 0.1 * (1 - t)))))
            left.append(fb.verts.new(c + side * (w + zig) + Vector((0, 0, -0.18 * w))))
            right.append(fb.verts.new(c - side * (w + zig) + Vector((0, 0, -0.18 * w))))
        for k in range(steps):
            fb.faces.new((spine[k], left[k], left[k + 1], spine[k + 1]))
            fb.faces.new((spine[k], spine[k + 1], right[k + 1], right[k]))
    fr = bm_to_obj(fb, 'fronds')
    for p in fr.data.polygons: p.use_smooth = True
    nuts = merge_bms([ico(0.2, 1, top + Vector((math.cos(a) * 0.24, math.sin(a) * 0.24, -0.22))) for a in (0.4, 2.5, 4.4)])
    nt = bm_to_obj(nuts, 'nuts')
    for p in nt.data.polygons: p.use_smooth = True
    bvh = build_bvh([trunk, fr, nt], 0)
    bark, bark2, leaf, nut = H('#c99a62'), H('#9a7048'), H('#4fb85a'), H('#6e4a2c')
    def tcol(co, n, ao, f):
        # bands where the trunk rings are
        t = co.z / H0 * rings; band = 0.5 + 0.5 * math.cos(t * math.pi)
        return shade(mix3(bark, bark2, band * 0.6), ao)
    def fcol(co, n, ao, f):
        d = (Vector((co.x, co.y, 0)) - Vector((top.x, top.y, 0))).length
        c = mix3(H('#2f8f4a'), H('#8fe07a'), smoothstep(0.2, 2.6, d))
        return shade(c, 0.55 + 0.45 * ao)
    asset('palm', [export_part(trunk, tcol, bvh=bvh, aodist=1.2),
                   export_part(fr, fcol, bvh=bvh, aodist=1.0, aok=0.6) | {'double': True},
                   export_part(nt, lambda co, n, ao, f: shade(nut, 0.5 + 0.5 * ao), bvh=bvh)])

# =====================================================================
# BUSH, ROCKS, MUSHROOM, STUMP
# =====================================================================
def make_bush(name, seed, faces=260):
    reset(); rnd = random.Random(seed)
    bms = [ico(1.0, 2, (0, 0, 0.55), (1.15, 1.0, 0.8))]
    for i in range(5):
        a = i / 5 * 6.283 + rnd.random()
        bms.append(ico(rnd.uniform(0.5, 0.65), 2, (math.cos(a) * 0.75, math.sin(a) * 0.65, rnd.uniform(0.35, 0.8))))
    o = bm_to_obj(merge_bms(bms), 'bush')
    o = remesh(o, 0.08, smooth_iter=2, faces=faces, disp={'type': 'VORONOI', 'size': 0.35, 'strength': 0.14})
    bm = bmesh.new(); bm.from_mesh(o.data)
    for v in bm.verts:
        if v.co.z < 0.02: v.co.z = 0.02
    bm.to_mesh(o.data); bm.free()
    for p in o.data.polygons: p.use_smooth = True
    bvh = build_bvh([o], 0)
    def col(co, n, ao, f):
        g = 0.62 + 0.38 * smoothstep(0.1, 1.4, co.z)
        return (g * ao,) * 3
    asset(name, [export_part(o, col, bvh=bvh, aodist=1.0, aok=0.8) | {'tint': 'leaf'}])

def make_rock(name, seed, sx, sy, sz):
    reset(); rnd = random.Random(seed)
    bm = ico(1.0, 2)
    for v in bm.verts:
        v.co *= rnd.uniform(0.86, 1.08)
        v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz + 0.35 * sz))
    o = bm_to_obj(bm, name)
    bvh = build_bvh([o], 0)
    def col(co, n, ao, f):
        g = 0.72 + 0.28 * max(0, n.z) + 0.06 * ((hash(f.index) % 5) / 4 - 0.5) if f else 0.8
        return (g * ao,) * 3
    asset(name, [export_part(o, col, flat=True, bvh=bvh, aodist=1.2, aok=0.6) | {'tint': 'rock'}])

def make_mushroom():
    reset()
    stem = bmesh.new()
    bmesh.ops.create_cone(stem, cap_ends=True, segments=10, radius1=0.16, radius2=0.12, depth=0.5)
    bmesh.ops.translate(stem, vec=Vector((0, 0, 0.25)), verts=stem.verts)
    for v in stem.verts:
        t = v.co.z / 0.5; k = 1 + 0.25 * math.sin(t * math.pi)
        v.co.x *= k; v.co.y *= k
    so = bm_to_obj(stem, 'stem')
    for p in so.data.polygons: p.use_smooth = True
    cap = bmesh.new(); bmesh.ops.create_uvsphere(cap, u_segments=18, v_segments=10, radius=0.42)
    for v in cap.verts:
        if v.co.z < -0.02: v.co.z = -0.02 + (v.co.z + 0.02) * 0.25
        v.co.z *= 0.8
    bmesh.ops.translate(cap, vec=Vector((0, 0, 0.5)), verts=cap.verts)
    co = bm_to_obj(cap, 'cap')
    for p in co.data.polygons: p.use_smooth = True
    spots = []
    rnd = random.Random(5)
    for i in range(7):
        a = rnd.random() * 6.283; el = rnd.uniform(0.35, 1.25) if i else 1.5
        d = Vector((math.cos(a) * math.cos(el), math.sin(a) * math.cos(el), math.sin(el) * 0.8)).normalized()
        c = Vector((0, 0, 0.5)) + Vector((d.x * 0.42, d.y * 0.42, d.z * 0.42 * 0.8 / max(0.3, 1)))
        sb = ico(rnd.uniform(0.06, 0.1), 1, (0, 0, 0), (1, 1, 0.35))
        rot = d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        bmesh.ops.transform(sb, matrix=rot, verts=sb.verts); bmesh.ops.translate(sb, vec=c, verts=sb.verts)
        spots.append(sb)
    sp = bm_to_obj(merge_bms(spots), 'spots')
    for p in sp.data.polygons: p.use_smooth = True
    bvh = build_bvh([so, co], 0)
    red, cream = H('#e8413a'), H('#fff3df')
    def capc(c, n, ao, f):
        under = n.z < -0.3
        return shade(H('#f3dcc0') if under else mix3(H('#b8262a'), red, smoothstep(0.35, 0.9, c.z)), 0.5 + 0.5 * ao)
    asset('mushroom', [export_part(so, lambda c, n, ao, f: shade(cream, 0.6 + 0.4 * ao), bvh=bvh, aodist=0.5),
                       export_part(co, capc, bvh=bvh, aodist=0.5),
                       export_part(sp, lambda c, n, ao, f: cream)])

def make_stump():
    reset()
    bm = cyl_bm(0.55, 0.42, 0.55, 12)
    for v in bm.verts:
        if v.co.z < 0.05: v.co.x *= 1.25; v.co.y *= 1.25
    o = bm_to_obj(bm, 'stump')
    bvh = build_bvh([o], 0)
    bark, ring = H('#8d5f3c'), H('#e8c48e')
    def col(co, n, ao, f):
        if n.z > 0.7:
            r = math.hypot(co.x, co.y); band = 0.5 + 0.5 * math.cos(r * 40)
            return shade(mix3(ring, H('#c99a62'), band * 0.5), 1)
        return shade(bark, 0.6 + 0.4 * ao)
    asset('stump', [export_part(o, col, flat=True, bvh=bvh, aodist=0.6)])

# =====================================================================
# FLOWERS (head is tinted per instance, base is stem + leaves + center)
# =====================================================================
def petal_ring(n, r_in, r_out, width, z, cup=0.0, seg=5):
    bm = bmesh.new()
    for i in range(n):
        a = i / n * 6.283; d = Vector((math.cos(a), math.sin(a), 0)); side = Vector((-d.y, d.x, 0))
        rows = []
        for k in range(seg + 1):
            t = k / seg; rr = lerp(r_in, r_out, t); w = width * math.sin(math.pi * (0.15 + 0.85 * t)) * (1.1 - 0.3 * t)
            zz = z + cup * t * t
            rows.append((bm.verts.new(d * rr + side * w + Vector((0, 0, zz))), bm.verts.new(d * rr - side * w + Vector((0, 0, zz)))))
        for k in range(seg):
            bm.faces.new((rows[k][0], rows[k + 1][0], rows[k + 1][1], rows[k][1]))
    return bm

def stem_bm(h, leaves=True):
    bm = cyl_bm(0.025, 0.02, h, 5, 0, caps=False)
    if leaves:
        for (a, z) in ((0.4, 0.08), (3.4, 0.14)):
            lf = bmesh.new(); L = 0.22; w = 0.06; vs = []
            for k in range(5):
                t = k / 4
                vs.append((lf.verts.new((t * L, w * math.sin(math.pi * t), t * t * 0.1)), lf.verts.new((t * L, -w * math.sin(math.pi * t), t * t * 0.1))))
            for k in range(4): lf.faces.new((vs[k][0], vs[k + 1][0], vs[k + 1][1], vs[k][1]))
            bmesh.ops.transform(lf, matrix=Matrix.Rotation(a, 4, 'Z'), verts=lf.verts)
            bmesh.ops.translate(lf, vec=Vector((0, 0, z)), verts=lf.verts)
            me = bpy.data.meshes.new('l'); lf.to_mesh(me); lf.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
    return bm

def make_flower(name, kind):
    reset()
    H0 = 0.34
    if kind == 'tulip':
        head = bmesh.new()
        for i in range(3):
            for j, (rin, rout, w) in enumerate(((0.0, 0.16, 0.085),)):
                pass
        # cup of 6 upright petals
        head = bmesh.new()
        for i in range(6):
            a = i / 6 * 6.283 + (0.5 if i % 2 else 0); d = Vector((math.cos(a), math.sin(a), 0)); side = Vector((-d.y, d.x, 0))
            rr = 0.07 if i % 2 else 0.065; rows = []
            for k in range(5):
                t = k / 4
                pos = d * (rr + 0.05 * math.sin(math.pi * t * 0.9)) + Vector((0, 0, t * 0.2))
                w = 0.06 * math.sin(math.pi * (0.2 + 0.8 * t)) + 0.01
                rows.append((head.verts.new(pos + side * w), head.verts.new(pos - side * w)))
            for k in range(4): head.faces.new((rows[k][0], rows[k + 1][0], rows[k + 1][1], rows[k][1]))
        bmesh.ops.translate(head, vec=Vector((0, 0, H0)), verts=head.verts)
        center = None
    elif kind == 'cosmos':
        head = petal_ring(8, 0.03, 0.17, 0.05, 0, cup=0.04)
        bmesh.ops.translate(head, vec=Vector((0, 0, H0)), verts=head.verts)
        center = ico(0.045, 1, (0, 0, H0 + 0.01), (1, 1, 0.6))
    else:  # pansy: 5 round petals, bigger
        head = petal_ring(5, 0.02, 0.15, 0.08, 0, cup=0.05)
        bmesh.ops.transform(head, matrix=Matrix.Rotation(0.5, 4, 'X'), verts=head.verts)
        bmesh.ops.translate(head, vec=Vector((0, 0, H0 - 0.04)), verts=head.verts)
        center = ico(0.035, 1, (0, -0.02, H0 - 0.02))
    ho = bm_to_obj(head, 'head')
    for p in ho.data.polygons: p.use_smooth = True
    base = stem_bm(H0 if kind != 'pansy' else H0 - 0.05)
    parts = [base] + ([center] if center else [])
    bo = bm_to_obj(merge_bms(parts), 'base')
    for p in bo.data.polygons: p.use_smooth = True
    green, yellow = H('#4fae4a'), H('#ffc93a')
    def hcol(co, n, ao, f):
        k = 0.7 + 0.3 * smoothstep(H0 - 0.02, H0 + 0.2, co.z) if kind == 'tulip' else 0.78 + 0.22 * smoothstep(0.02, 0.15, math.hypot(co.x, co.y))
        return (k,) * 3
    def bcol(co, n, ao, f):
        if co.z > H0 - 0.08 and math.hypot(co.x, co.y) < 0.06 and kind != 'tulip': return yellow if kind == 'cosmos' else H('#3a2a4a')
        return shade(green, 0.7 + 0.3 * smoothstep(0, H0, co.z))
    asset(name, [export_part(ho, hcol) | {'tint': 'petal', 'double': True}, export_part(bo, bcol) | {'double': True}])

def make_tuft():
    reset(); bm = bmesh.new(); rnd = random.Random(4)
    for i in range(5):
        a = i / 5 * 6.283 + rnd.random() * 0.6; h = rnd.uniform(0.22, 0.36); lean = rnd.uniform(0.08, 0.16)
        d = Vector((math.cos(a), math.sin(a), 0)); side = Vector((-d.y, d.x, 0))
        base = d * 0.035
        v1 = bm.verts.new(base + side * 0.035); v2 = bm.verts.new(base - side * 0.035)
        v3 = bm.verts.new(base + d * lean * 0.5 + side * 0.02 + Vector((0, 0, h * 0.55))); v4 = bm.verts.new(base + d * lean * 0.5 - side * 0.02 + Vector((0, 0, h * 0.55)))
        tip = bm.verts.new(base + d * lean + Vector((0, 0, h)))
        bm.faces.new((v1, v2, v4, v3)); bm.faces.new((v3, v4, tip))
    o = bm_to_obj(bm, 'tuft')
    for p in o.data.polygons: p.use_smooth = True
    def col(co, n, ao, f): return ((0.55 + 0.45 * smoothstep(0, 0.32, co.z)),) * 3
    asset('tuft', [export_part(o, col) | {'tint': 'grass', 'double': True}])

# =====================================================================
# CLOUD, GHOST, CAT, SHELL/STARFISH
# =====================================================================
def make_cloud(name, seed):
    reset(); rnd = random.Random(seed)
    bms = []
    for i in range(6):
        x = (i - 2.5) * 1.25 + rnd.uniform(-0.3, 0.3); r = rnd.uniform(1.1, 1.8) * (1.25 if 1 <= i <= 4 else 0.85)
        bms.append(ico(r, 2, (x, rnd.uniform(-0.5, 0.5), r * 0.35)))
    for i in range(3): bms.append(ico(rnd.uniform(1.0, 1.4), 2, ((i - 1) * 1.6, rnd.uniform(-0.2, 0.2), 1.6)))
    o = bm_to_obj(merge_bms(bms), 'cloud')
    o = remesh(o, 0.22, smooth_iter=4, faces=320)
    bm = bmesh.new(); bm.from_mesh(o.data)
    for v in bm.verts:
        if v.co.z < 0.1: v.co.z = 0.1 + (v.co.z - 0.1) * 0.15
    bm.to_mesh(o.data); bm.free()
    for p in o.data.polygons: p.use_smooth = True
    def col(co, n, ao, f):
        return ((0.78 + 0.22 * smoothstep(0.0, 2.6, co.z)) * (0.92 + 0.08 * max(0, n.z)),) * 3
    asset(name, [export_part(o, col) | {'tint': 'cloud'}])

def make_ghost():
    reset()
    # lathe profile: round head flowing down to a wavy skirt
    prof = [(0.0, 1.25), (0.22, 1.22), (0.4, 1.12), (0.5, 0.95), (0.52, 0.72), (0.54, 0.5), (0.6, 0.28), (0.68, 0.1)]
    seg = 24; bm = bmesh.new(); rings = []
    for (r, z) in prof:
        ring = []
        for s in range(seg):
            a = s / seg * 6.283
            zz = z; rr = r
            if z < 0.15: zz = z + 0.1 * math.cos(a * 5)   # scalloped hem
            ring.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr * 0.92, zz)))
        rings.append(ring)
    for k in range(len(rings) - 1):
        for s in range(seg):
            a, b = rings[k], rings[k + 1]
            if k == 0: pass
            bm.faces.new((a[s], a[(s + 1) % seg], b[(s + 1) % seg], b[s]))
    top = bm.verts.new((0, 0, 1.26))
    for s in range(seg): bm.faces.new((rings[0][(s + 1) % seg], rings[0][s], top))
    # little arm nubs
    for sgn in (-1, 1):
        nub = ico(0.14, 2, (sgn * 0.52, -0.05, 0.62), (1.0, 0.8, 1.3))
        me = bpy.data.meshes.new('n'); nub.to_mesh(me); nub.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.001)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = bm_to_obj(bm, 'ghost')
    for p in o.data.polygons: p.use_smooth = True
    def col(co, n, ao, f): return ((0.82 + 0.18 * smoothstep(0.1, 1.2, co.z)),) * 3
    asset('ghost', [export_part(o, col) | {'tint': 'ghost', 'double': True}])

def make_cat():
    reset()
    body = ico(0.26, 3, (0, -0.02, 0.24), (1.0, 1.35, 0.95))
    head = ico(0.2, 3, (0, 0.27, 0.46), (1.08, 0.95, 0.92))
    cheeks = [ico(0.09, 2, (s * 0.08, 0.36, 0.4), (1, 0.8, 0.8)) for s in (-1, 1)]
    ears = []
    for s in (-1, 1):
        e = bmesh.new(); bmesh.ops.create_cone(e, cap_ends=True, segments=4, radius1=0.085, radius2=0.0, depth=0.16)
        bmesh.ops.transform(e, matrix=Matrix.Rotation(-s * 0.35, 4, 'Y') @ Matrix.Rotation(0.785, 4, 'Z'), verts=e.verts)
        bmesh.ops.translate(e, vec=Vector((s * 0.11, 0.26, 0.64)), verts=e.verts); ears.append(e)
    paws = [ico(0.07, 2, (x, y, 0.05), (1, 1.3, 0.7)) for (x, y) in ((-0.1, 0.18), (0.1, 0.18), (-0.13, -0.2), (0.13, -0.2))]
    tail = bmesh.new(); prev = None; seg = 6
    for k in range(9):
        t = k / 8; c = Vector((0, -0.32 - 0.12 * math.sin(t * 2), 0.12 + t * 0.42)) + Vector((0.12 * math.sin(t * 3), 0, 0))
        r = 0.045 * (1 - 0.3 * t)
        ring = [tail.verts.new(c + Vector((math.cos(s / seg * 6.283) * r, math.sin(s / seg * 6.283) * r, 0))) for s in range(seg)]
        if prev:
            for s in range(seg): tail.faces.new((prev[s], prev[(s + 1) % seg], ring[(s + 1) % seg], ring[s]))
        prev = ring
    tail_o = bm_to_obj(tail, 'tail')
    o = bm_to_obj(merge_bms([body, head] + cheeks + paws), 'catbody')
    o = remesh(o, 0.022, smooth_iter=3, faces=900)
    eo = bm_to_obj(merge_bms(ears), 'ears')
    for x in (o, tail_o):
        for p in x.data.polygons: p.use_smooth = True
    bvh = build_bvh([o, eo, tail_o], 0)
    def col(co, n, ao, f): return ((0.55 + 0.45 * ao) * (0.9 + 0.1 * smoothstep(0, 0.6, co.z)),) * 3
    asset('cat', [export_part(o, col, bvh=bvh, aodist=0.3, aok=0.7) | {'tint': 'fur'},
                  export_part(eo, lambda c, n, ao, f: (0.9, 0.9, 0.9), flat=True) | {'tint': 'fur'},
                  export_part(tail_o, col, bvh=bvh, aodist=0.3) | {'tint': 'fur2'}], eyes=[[-0.075, 0.47, 0.44], [0.075, 0.47, 0.44]])

def make_starfish():
    reset(); bm = bmesh.new(); n = 5; pts = []
    c_top = bm.verts.new((0, 0, 0.09)); c_bot = bm.verts.new((0, 0, 0.0))
    outer = []
    for i in range(n * 2):
        a = i / (n * 2) * 6.283; r = 0.32 if i % 2 == 0 else 0.11
        outer.append(bm.verts.new((math.cos(a) * r, math.sin(a) * r, 0.015 if i % 2 == 0 else 0.04)))
    for i in range(n * 2):
        j = (i + 1) % (n * 2)
        bm.faces.new((c_top, outer[i], outer[j])); bm.faces.new((c_bot, outer[j], outer[i]))
    o = bm_to_obj(bm, 'star')
    asset('starfish', [export_part(o, lambda c, n, ao, f: shade(H('#ff8a5c'), 0.8 + 0.2 * max(0, n.z)), flat=True)])

def make_shell():
    reset(); bm = bmesh.new(); seg = 9; rows = 6; grid = []
    for k in range(rows + 1):
        t = k / rows; row = []
        for s in range(seg + 1):
            a = (s / seg - 0.5) * 2.2
            r = 0.05 + 0.2 * t
            z = 0.06 * math.sin(math.pi * t) * (1 + 0.25 * math.cos(s * math.pi))
            row.append(bm.verts.new((math.sin(a) * r, math.cos(a) * r - 0.1, z + 0.01)))
        grid.append(row)
    for k in range(rows):
        for s in range(seg): bm.faces.new((grid[k][s], grid[k][s + 1], grid[k + 1][s + 1], grid[k + 1][s]))
    o = bm_to_obj(bm, 'shell')
    for p in o.data.polygons: p.use_smooth = True
    asset('shell', [export_part(o, lambda c, n, ao, f: mix3(H('#ffd9d0'), H('#fff6ea'), smoothstep(0, 0.2, c.y + 0.1))) | {'double': True}])


def make_bee():
    reset()
    body = ico(0.1, 2, (0, 0, 0), (0.85, 1.25, 0.85))
    head = ico(0.065, 2, (0, 0.13, 0.02))
    o = bm_to_obj(merge_bms([body, head]), 'bee')
    for p in o.data.polygons: p.use_smooth = True
    wb = bmesh.new()
    for s in (-1, 1):
        vs = []
        for k in range(8):
            a = k / 8 * 6.283
            vs.append(wb.verts.new((s * (0.09 + 0.08 * (1 + math.cos(a))), -0.02 + 0.06 * math.sin(a), 0.1 + 0.02 * (1 + math.cos(a)))))
        wb.faces.new(vs if s > 0 else list(reversed(vs)))
    wo = bm_to_obj(wb, 'wings')
    yel, blk = H('#ffc62e'), H('#2a2230')
    def col(c, n, ao, f):
        if c.y > 0.08: return blk
        band = math.sin(c.y * 48) > 0.2
        return shade(blk if band else yel, 0.75 + 0.25 * max(0, n.z))
    asset('bee', [export_part(o, col), export_part(wo, lambda c, n, ao, f: (0.95, 0.97, 1.0)) | {'double': True}])


def make_crystal_cat():
    reset()
    body = ico(0.26, 3, (0, -0.02, 0.24), (1.0, 1.35, 0.95))
    head = ico(0.21, 3, (0, 0.27, 0.48), (1.1, 0.95, 0.95))
    paws = [ico(0.07, 2, (x, y, 0.05), (1, 1.3, 0.7)) for (x, y) in ((-0.1, 0.18), (0.1, 0.18), (-0.13, -0.2), (0.13, -0.2))]
    o = bm_to_obj(merge_bms([body, head] + paws), 'ccat')
    o = remesh(o, 0.03, smooth_iter=2, faces=110)
    ears = []
    for s_ in (-1, 1):
        e = bmesh.new(); bmesh.ops.create_cone(e, cap_ends=True, segments=3, radius1=0.1, radius2=0.0, depth=0.2)
        bmesh.ops.transform(e, matrix=Matrix.Rotation(-s_ * 0.3, 4, 'Y'), verts=e.verts)
        bmesh.ops.translate(e, vec=Vector((s_ * 0.12, 0.25, 0.7)), verts=e.verts); ears.append(e)
    tail = bmesh.new(); bmesh.ops.create_cone(tail, cap_ends=True, segments=4, radius1=0.05, radius2=0.015, depth=0.5)
    bmesh.ops.transform(tail, matrix=Matrix.Rotation(-0.7, 4, 'X'), verts=tail.verts); bmesh.ops.translate(tail, vec=Vector((0, -0.42, 0.36)), verts=tail.verts)
    eo = bm_to_obj(merge_bms(ears + [tail]), 'cears')
    def col(c, n, ao, f): return (0.85 + 0.15 * max(0, n.z),) * 3
    asset('crystalcat', [export_part(o, col, flat=True) | {'tint': 'crystal'}, export_part(eo, col, flat=True) | {'tint': 'crystal'}], face=[0, 0.47, 0.48])


def make_owl():
    reset()
    body = ico(0.5, 3, (0, 0, 0.55), (1.0, 0.92, 1.12))
    head = ico(0.42, 3, (0, 0.02, 1.12), (1.12, 1.0, 0.92))
    o = bm_to_obj(merge_bms([body, head]), 'owl')
    o = remesh(o, 0.035, smooth_iter=3, faces=900)
    for p in o.data.polygons: p.use_smooth = True
    tufts = []
    for s_ in (-1, 1):
        t = bmesh.new(); bmesh.ops.create_cone(t, cap_ends=True, segments=6, radius1=0.12, radius2=0.0, depth=0.28)
        bmesh.ops.transform(t, matrix=Matrix.Rotation(-s_ * 0.5, 4, 'Y'), verts=t.verts); bmesh.ops.translate(t, vec=Vector((s_ * 0.3, 0.05, 1.46)), verts=t.verts); tufts.append(t)
    wings = [ico(0.26, 2, (s_ * 0.47, -0.02, 0.62), (0.45, 0.8, 1.25)) for s_ in (-1, 1)]
    beak = bmesh.new(); bmesh.ops.create_cone(beak, cap_ends=True, segments=6, radius1=0.07, radius2=0.0, depth=0.16)
    bmesh.ops.transform(beak, matrix=Matrix.Rotation(1.9, 4, 'X'), verts=beak.verts); bmesh.ops.translate(beak, vec=Vector((0, 0.43, 1.02)), verts=beak.verts)
    feet = [ico(0.07, 1, (s_ * 0.16, 0.3, 0.04), (1.3, 1.6, 0.6)) for s_ in (-1, 1)]
    curls = [ico(0.085, 1, (math.cos(a) * 0.36, math.sin(a) * 0.3 - 0.06, 1.34 + 0.05 * math.sin(a * 2)), (1, 1, 1)) for a in [i / 9 * 6.283 for i in range(9)] if math.sin(a) < 0.55]
    curls += [ico(0.08, 1, (s_ * 0.44, -0.02, 1.02 - k * 0.14)) for s_ in (-1, 1) for k in range(3)]
    jabot = ico(0.13, 2, (0, 0.44, 0.78), (1.1, 0.5, 1.2))
    extra = bm_to_obj(merge_bms(tufts + wings + feet), 'owlx')
    for p in extra.data.polygons: p.use_smooth = True
    bo = bm_to_obj(beak, 'beak'); wig = bm_to_obj(merge_bms(curls + [jabot]), 'wig')
    for x in (bo, wig):
        for p in x.data.polygons: p.use_smooth = True
    bvh = build_bvh([o, extra, wig], 0)
    brown, belly, face, dark = H('#9a6a45'), H('#f1dcb8'), H('#f6e8cf'), H('#6e4a30')
    def col(c, n, ao, f):
        fr = n.y > 0.35
        if c.z > 0.8 and fr and abs(c.x) < 0.33: base = face
        elif c.z < 0.8 and fr and abs(c.x) < 0.3 and c.z > 0.2: base = belly
        else: base = mix3(dark, brown, smoothstep(0.2, 1.2, c.z))
        return shade(base, 0.55 + 0.45 * ao)
    asset('owl', [export_part(o, col, bvh=bvh, aodist=0.5, aok=0.8),
                  export_part(extra, lambda c, n, ao, f: shade(dark if c.z < 0.2 else mix3(dark, brown, 0.5), 0.6 + 0.4 * ao), bvh=bvh, aodist=0.4),
                  export_part(bo, lambda c, n, ao, f: H('#ffb347')),
                  export_part(wig, lambda c, n, ao, f: shade(H('#fbf7f0'), 0.72 + 0.28 * ao), bvh=bvh, aodist=0.3)])

def make_memorial():
    reset()
    bm = bmesh.new()
    prof = []
    stone = ico(0.5, 3, (0, 0, 0.62), (0.78, 0.26, 1.2))
    o = bm_to_obj(stone, 'stone')
    bm2 = bmesh.new(); bm2.from_mesh(o.data)
    for v in bm2.verts:
        if v.co.z < 0.05: v.co.z = 0.05
    bm2.to_mesh(o.data); bm2.free()
    o = remesh(o, 0.03, smooth_iter=2, faces=260)
    for p in o.data.polygons: p.use_smooth = True
    base = bm_to_obj(cyl_bm(0.62, 0.66, 0.12, 16), 'base')
    heart = bmesh.new()
    for s_ in (-1, 1):
        h = ico(0.07, 2, (s_ * 0.05, 0.14, 0.95), (1, 0.5, 1)); me = bpy.data.meshes.new('h'); h.to_mesh(me); h.free(); heart.from_mesh(me); bpy.data.meshes.remove(me)
    c = bmesh.new(); bmesh.ops.create_cone(c, cap_ends=True, segments=8, radius1=0.09, radius2=0.0, depth=0.12)
    bmesh.ops.transform(c, matrix=Matrix.Rotation(math.pi, 4, 'X'), verts=c.verts); bmesh.ops.translate(c, vec=Vector((0, 0.14, 0.87)), verts=c.verts)
    me = bpy.data.meshes.new('c'); c.to_mesh(me); c.free(); heart.from_mesh(me); bpy.data.meshes.remove(me)
    ho = bm_to_obj(heart, 'heart')
    bvh = build_bvh([o, base], 0)
    asset('memorial', [export_part(o, lambda c, n, ao, f: shade(H('#d9d3e6'), 0.6 + 0.4 * ao), bvh=bvh, aodist=0.5),
                       export_part(base, lambda c, n, ao, f: shade(H('#b7afc4'), 0.6 + 0.4 * ao), bvh=bvh, aodist=0.4),
                       export_part(ho, lambda c, n, ao, f: H('#ff9ec7'))])

# ---------- build all ----------
make_round_tree('treeA', 11)
make_round_tree('treeB', 23)
make_cedar()
make_palm()
make_bush('bushA', 3)
make_bush('bushB', 9, faces=200)
make_rock('rockA', 1, 1.0, 0.85, 0.7)
make_rock('rockB', 2, 1.2, 0.9, 0.55)
make_rock('rockC', 5, 0.8, 0.8, 0.9)
make_mushroom()
make_stump()
make_flower('tulip', 'tulip')
make_flower('cosmos', 'cosmos')
make_flower('pansy', 'pansy')
make_tuft()
make_cloud('cloudA', 4)
make_cloud('cloudB', 8)
make_ghost()
make_cat()
make_starfish()
make_shell()
make_bee()
make_crystal_cat()
make_owl()
make_memorial()

b64 = base64.b64encode(bytes(BLOB)).decode()
with open(OUT, 'w') as f:
    f.write('// generated by tools/blender/assets.py (Blender %s). Do not edit by hand.\n' % bpy.app.version_string)
    f.write('const ASSET_META = %s;\n' % json.dumps(ASSETS, separators=(',', ':')))
    f.write('const ASSET_BIN = "%s";\n\n' % b64)
print('bytes', len(BLOB), 'b64', len(b64))
