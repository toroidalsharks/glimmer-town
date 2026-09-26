// ============================================================
// v24 WORLD: Blender-made trees and props, flower meadows,
// butterflies, bees, fish in the shallows, fireflies and little ghosts
// ============================================================
function gfxRenderer() {
  GFX.wasClassic = !gfxOn();
  if (!gfxOn()) return;
  { const want = cfg.gfx || 'auto'; let st = null; try { st = localStorage.getItem('glimmer-gfx-auto'); } catch (e) {} GFX.cheap = want === 'lite' || (want === 'auto' && (st === 'lite' || st === 'min')); }
  renderer.outputEncoding = T3.sRGBEncoding;
  renderer.toneMapping = T3.LinearToneMapping;
  renderer.toneMappingExposure = 1.0;
  gfxTextures(); gfxEnv();
}
// trees: the Blender crowns, tinted per tree so seasons can recolor them
function treeParts(g, s, col, kind) {
  const k = kind || (hashStr(`${Math.round(g.position.x * 10)}|${Math.round(g.position.z * 10)}|${col}`) % 2 ? 'treeA' : 'treeB');
  const pg = prop(k, { leaf: col });
  for (const c of [...pg.children]) { c.scale.setScalar(s * 0.92); g.add(c); }
  keepShared(g);
  return g;
}
function gfxTree(x, z, s, col, kind) { const g = new T3.Group(); g.position.set(x, 0, z); treeParts(g, s, col, kind); g.rotation.y = rand() * 6.28; return g; }
function propAt(name, tints, x, z, s = 1, ry = mrand() * 6.28, y = 0) { const g = keepShared(prop(name, tints)); g.position.set(x, y, z); g.scale.setScalar(s); g.rotation.y = ry; return g; }

// ---------- clouds ----------
function gfxClouds() {
  const m = makeToon({ color: '#ffffff', vertexColors: true, roughness: 1, emissive: new T3.Color('#8a94b8'), transparent: true, opacity: 0.95 });
  matCache.set('cloudMat', m);
  for (let i = 0; i < 7; i++) {
    const g = new T3.Group(), c = new T3.Mesh(assetParts(i % 2 ? 'cloudA' : 'cloudB')[0].geo, m);
    c.castShadow = false; c.scale.setScalar(1.4 + rand() * 0.9); c.raycast = () => {}; g.add(c);
    g.userData = { r: 80 + rand() * 50, a: rand() * 6.28, s: 0.006 + rand() * 0.01, y: 34 + rand() * 14, m };
    scene.add(g); clouds.push(g);
  }
}

// ---------- where things may grow ----------
const MAIN_PATHS = () => ['home', 'clothes', 'nook', 'cafe', 'mart', 'garden', 'park'].map((k) => [[0, 0], TOWN[k].spot]).concat([[[0, 0], [0, 31]], [polar(229, 11.4), polar(229, 30)]]);
function segDist(px, pz, [ax, az], [bx, bz]) { const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1; let t = ((px - ax) * dx + (pz - az) * dz) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - ax - t * dx, pz - az - t * dz); }
function freeMain(x, z, pad = 0) {
  const r = Math.hypot(x, z); if (r < 13.2 + pad || r > 28.8) return false;
  for (const s of MAIN_PATHS()) if (segDist(x, z, s[0], s[1]) < 2.1 + pad) return false;
  for (const b of Object.values(BLD)) { const [bx, bz] = polar(b.a, b.r); if (Math.hypot(x - bx, z - bz) < b.d * 0.72 + 1.6 + pad) return false; }
  if (Math.hypot(x - PLOT_AT[0], z - PLOT_AT[1]) < 4.2 + pad) return false;
  const [gx, gz] = polar(158, 22); if (Math.hypot(x - gx, z - gz) < 6.6 + pad) return false;
  const [px, pz] = polar(252, 23.5); if (Math.hypot(x - px, z - pz) < 3.2 + pad) return false;
  for (const [cx, cz] of CAFE_SEATS) if (Math.hypot(x - cx, z - cz) < 2.4) return false;
  if (z > 24 && Math.abs(x) < 3.5) return false;
  for (const pl of W?.placed || []) if (Math.hypot(x - pl.x, z - pl.z) < 3.2 + pad) return false;
  return true;
}
function freeDT(x, z, pad = 0) {
  const dx = x - DT.x, dz = z - DT.z, r = Math.hypot(dx, dz);
  if (r < 19 + pad || r > DT.R - 1.4) return false;
  if (Math.hypot(x, z) < 31) return false;
  for (const b of Object.values(DT_BLD)) { const [bx, bz] = polarDT(b.a, b.r); if (Math.hypot(x - bx, z - bz) < b.d * 0.75 + 1.4 + pad) return false; if (segDist(x, z, polarDT(b.a, 10), polarDT(b.a, b.r)) < 2 + pad) return false; }
  const gate = [polar(20, 11.4), ...DT_GATE, DT_HUB]; for (let i = 0; i < gate.length - 1; i++) if (segDist(x, z, gate[i], gate[i + 1]) < 2.2 + pad) return false;
  return true;
}
function freeLobe(x, z, pad = 0) {
  for (const k of W?.lobes || []) {
    const L = LOBES[k]; if (!L || L.kind === 'star') continue;
    const [cx, cz] = lobeCenter(k), R = lobeR(k), D = L.d || LOBE_D;
    if (Math.hypot(x - cx, z - cz) > R - 1.3) continue;
    if (Math.hypot(x, z) < 31) return false;
    if (segDist(x, z, polar(L.a, 12.2), polar(L.a, D - 2)) < 2.1 + pad) return false;
    for (const [px, pz, r] of lobeProps(k)) if (Math.hypot(x - cx - px, z - cz - pz) < (r || 1.5) + 0.8 + pad) return false;
    return true;
  }
  return false;
}
const onLobes = () => () => { const ks = (W?.lobes || []).filter((k) => LOBES[k] && LOBES[k].kind !== 'star'); if (!ks.length) return null; const k = ks[Math.floor(mrand() * ks.length)], [cx, cz] = lobeCenter(k), R = lobeR(k), a = mrand() * 6.28, r = Math.sqrt(mrand()) * (R - 1.3), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; return freeLobe(x, z) ? [x, z] : null; };
function scatter(n, tries, pick2) { const out = []; for (let i = 0; i < tries && out.length < n; i++) { const p = pick2(); if (p) out.push(p); } return out; }
const onMain = (rMin = 13, rMax = 28.6) => () => { const a = mrand() * 6.28, r = rMin + Math.sqrt(mrand()) * (rMax - rMin), x = Math.sin(a) * r, z = -Math.cos(a) * r; return freeMain(x, z) ? [x, z] : null; };
const onDT = () => () => { const a = mrand() * 6.28, r = 19 + Math.sqrt(mrand()) * (DT.R - 20.5), x = DT.x + Math.sin(a) * r, z = DT.z - Math.cos(a) * r; return freeDT(x, z) ? [x, z] : null; };

function instanced(geo, mat, list, setup) {
  const im = new T3.InstancedMesh(geo, mat, Math.max(1, list.length));
  const M = new T3.Matrix4(), q = new T3.Quaternion(), s = new T3.Vector3(), v = new T3.Vector3(), up = new T3.Vector3(0, 1, 0), col = new T3.Color();
  list.forEach((it, i) => { const o = setup(it, i); q.setFromAxisAngle(up, o.ry ?? mrand() * 6.28); s.setScalar(o.s ?? 1); if (o.sy) s.y *= o.sy; M.compose(v.set(o.x, o.y || 0, o.z), q, s); im.setMatrixAt(i, M); if (o.c) im.setColorAt(i, col.set(o.c)); });
  im.count = list.length; im.receiveShadow = true; im.castShadow = false; im.raycast = () => {};
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  return im;
}
let meadowGroup = null, flowerSpots = [];
const FLOWER_COLS = { tulip: ['#ff5a6e', '#ffd23f', '#ffffff', '#ff9ec7', '#b98cff', '#ff8a3d'], cosmos: ['#ff9ec7', '#ffffff', '#ffb3d9', '#ff6fa3', '#ffe38a'], pansy: ['#9b7bff', '#ffd23f', '#ff7a8a', '#ffffff', '#7fa8ff'] };
let mrand = Math.random;
function gfxMeadow() {
  if (meadowGroup) { scene.remove(meadowGroup); meadowGroup = null; }
  mrand = mulberry(4242); const rand = mrand, pick = (a) => a[Math.floor(mrand() * a.length)];
  const G = meadowGroup = new T3.Group(); scene.add(G);
  // grass tufts
  const nl = (W?.lobes || []).length;
  const tufts = scatter(950, 6000, onMain(12.8, 29)).concat(scatter(260, 2500, onDT()), nl ? scatter(110 * nl, 900 * nl, onLobes()) : []);
  const tuftP = assetParts('tuft')[0], greens = ['#6cc15a', '#7fcf66', '#5db552', '#8ad870', '#74c860'];
  G.add(instanced(tuftP.geo, bakedMat('tuftMat', { side: T3.DoubleSide }), tufts, ([x, z]) => ({ x, z, s: 1.1 + rand() * 0.9, sy: 0.8 + rand() * 0.6, c: pick(greens) })));
  // flower patches: a handful of one kind and color growing together
  flowerSpots = [];
  const centers = scatter(34, 2000, onMain(13.5, 28)).concat(scatter(9, 900, onDT()), nl ? scatter(4 * nl, 300 * nl, onLobes()) : []);
  const byKind = { tulip: [], cosmos: [], pansy: [] };
  for (const [cx, cz] of centers) {
    const kind = pick(Object.keys(byKind)), col = pick(FLOWER_COLS[kind]), n = 4 + Math.floor(rand() * 6);
    flowerSpots.push([cx, cz]);
    for (let i = 0; i < n; i++) { const a = rand() * 6.28, r = Math.sqrt(rand()) * 1.2, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (freeMain(x, z) || freeDT(x, z) || freeLobe(x, z)) byKind[kind].push({ x, z, col }); }
  }
  for (const kind of Object.keys(byKind)) {
    const [head, base] = assetParts(kind), L = byKind[kind];
    if (!L.length) continue;
    const sz = L.map(() => 1.5 + rand() * 0.5), ry = L.map(() => rand() * 6.28);
    G.add(instanced(head.geo, bakedMat('petal', { side: T3.DoubleSide, roughness: 0.6 }), L, (f, i) => ({ x: f.x, z: f.z, s: sz[i], ry: ry[i], c: f.col })));
    G.add(instanced(base.geo, bakedMat('flowerBase', { side: T3.DoubleSide }), L, (f, i) => ({ x: f.x, z: f.z, s: sz[i], ry: ry[i] })));
  }
  // mushrooms by the tree roots, rocks and stumps near the shore
  const shrooms = scatter(16, 900, () => { const a = rand() * 6.28, r = 25.5 + rand() * 3, x = Math.sin(a) * r, z = -Math.cos(a) * r; return freeMain(x, z) ? [x, z] : null; });
  for (const P of assetParts('mushroom')) G.add(instanced(P.geo, bakedMat('mushroom'), shrooms, ([x, z], i) => ({ x, z, s: 0.9 + ((i * 37) % 10) / 10, ry: i })));
  const rocks = scatter(14, 900, () => { const a = rand() * 6.28, r = 27 + rand() * 2.2, x = Math.sin(a) * r, z = -Math.cos(a) * r; return freeMain(x, z) ? [x, z] : null; }).concat(scatter(6, 600, onDT()));
  ['rockA', 'rockB', 'rockC'].forEach((k, j) => { const L = rocks.filter((_, i) => i % 3 === j); if (L.length) G.add(instanced(assetParts(k)[0].geo, bakedMat('rock', { flatShading: true, roughness: 0.95 }), L, ([x, z]) => ({ x, y: -0.12, z, s: 0.45 + rand() * 0.55, c: pick(['#c9c2d6', '#b8b0c8', '#d6cfc0', '#bfc6cf']) }))); });
  for (const [x, z] of scatter(3, 400, onMain(22, 28.5))) G.add(propAt('stump', {}, x, z, 1.1));
  // the beach: palm trees, starfish and shells
  const [bx, bz] = BEACH;
  for (const [a, r, s] of [[0.5, 6.2, 1.1], [2.2, 7.4, 0.95], [4.6, 6.8, 1.2]]) { const px = bx + Math.cos(a) * r, pz = bz + Math.sin(a) * r; const pm = propAt('palm', {}, px, pz, s, a + Math.PI); pm.traverse((o) => { if (o.isMesh) o.castShadow = true; }); G.add(pm); }
  for (let i = 0; i < 9; i++) { const a = rand() * 6.28, r = 2 + rand() * 6, k = i % 3 ? 'shell' : 'starfish'; G.add(propAt(k, {}, bx + Math.cos(a) * r, bz + Math.sin(a) * r, 0.9 + rand() * 0.6, rand() * 6.28, 0.06)); }
  G.traverse((o) => { if (o.isMesh && !o.isInstancedMesh) o.raycast = () => {}; });
}

// ---------- critters ----------
const CRIT = { bf: null, bfList: [], bees: null, beeWings: null, beeList: [], fish: null, fishList: [], ff: null, ffSeed: [], motes: null, ghosts: [] };
function wingGeo() {
  const s = new T3.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.12, 0.2, 0.34, 0.26, 0.3, 0.06); s.bezierCurveTo(0.28, -0.02, 0.3, -0.12, 0.2, -0.2); s.bezierCurveTo(0.12, -0.24, 0.04, -0.12, 0, 0);
  const g = new T3.ShapeGeometry(s, 6); g.rotateX(-Math.PI / 2); return g;
}
function gfxCritters() {
  // butterflies: two instanced wings each
  const bfN = 8, wing = wingGeo();
  CRIT.bf = new T3.InstancedMesh(wing, makeToon({ color: '#ffffff', side: T3.DoubleSide, roughness: 0.5, emissive: new T3.Color('#302030') }), bfN * 2);
  CRIT.bf.frustumCulled = false; CRIT.bf.raycast = () => {};
  const bcols = ['#ffd23f', '#9fd3ff', '#ff9ec7', '#ffffff', '#ffb347', '#c9b3ff', '#8fe0b0', '#ff7a8a'];
  for (let i = 0; i < bfN; i++) { const c = new T3.Color(bcols[i % bcols.length]); CRIT.bf.setColorAt(i * 2, c); CRIT.bf.setColorAt(i * 2 + 1, c); CRIT.bfList.push({ home: null, ph: rand() * 6.28, sp: 0.5 + rand() * 0.4, r: 1.2 + rand() * 1.8, perch: 0, x: 0, y: 1, z: 0 }); }
  scene.add(CRIT.bf);
  // bees
  const [bb, bw] = assetParts('bee'), beeN = 5;
  CRIT.bees = new T3.InstancedMesh(bb.geo, bakedMat('bee'), beeN); CRIT.beeWings = new T3.InstancedMesh(bw.geo, makeToon({ color: '#ffffff', transparent: true, opacity: 0.7, side: T3.DoubleSide, roughness: 0.2 }), beeN);
  for (const o of [CRIT.bees, CRIT.beeWings]) { o.frustumCulled = false; o.raycast = () => {}; scene.add(o); }
  for (let i = 0; i < beeN; i++) CRIT.beeList.push({ ph: rand() * 6.28, home: null, sp: 1.6 + rand() });
  // fish shadows in the shallows
  const fishN = 7;
  CRIT.fish = new T3.InstancedMesh(new T3.PlaneGeometry(0.7, 1.5).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({ color: 0x14314a, alphaMap: gfxTextures().blob, transparent: true, opacity: 0.45, depthWrite: false }), fishN);
  CRIT.fish.renderOrder = 3; CRIT.fish.frustumCulled = false; CRIT.fish.raycast = () => {}; scene.add(CRIT.fish);
  for (let i = 0; i < fishN; i++) CRIT.fishList.push({ r: 33.8 + rand() * 6, a: rand() * 6.28, sp: (rand() < 0.5 ? -1 : 1) * (0.03 + rand() * 0.04), s: 0.6 + rand() * 0.7, dart: 0 });
  // fireflies and sunny dust motes (glow points)
  const ffN = 70, ffg = new T3.BufferGeometry(); ffg.setAttribute('position', new T3.Float32BufferAttribute(new Float32Array(ffN * 3), 3));
  CRIT.ff = new T3.Points(ffg, new T3.PointsMaterial({ color: '#e8ff9a', size: 0.55, map: gfxTextures().glow, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false }));
  CRIT.ff.frustumCulled = false; scene.add(CRIT.ff);
  const spots = [...flowerSpots, ...BUSHES, PLOT_AT, polar(252, 23.5), polar(158, 22)];
  for (let i = 0; i < ffN; i++) { const [x, z] = pick(spots); CRIT.ffSeed.push({ x: x + (rand() - 0.5) * 5, z: z + (rand() - 0.5) * 5, ph: rand() * 6.28, h: 0.5 + rand() * 1.8 }); }
  const mN = 50, mg = new T3.BufferGeometry(); mg.setAttribute('position', new T3.Float32BufferAttribute(new Float32Array(mN * 3), 3));
  CRIT.motes = new T3.Points(mg, new T3.PointsMaterial({ color: '#fff3d0', size: 0.16, map: gfxTextures().glow, transparent: true, opacity: 0.8, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false }));
  CRIT.motes.frustumCulled = false; CRIT.motes.userData.seed = Array.from({ length: mN }, () => [rand() * 30 - 15, rand() * 6, rand() * 30 - 15, rand() * 6.28]); scene.add(CRIT.motes);
  buildGhosts(); buildSkyFx();
}
const _M = new T3.Matrix4(), _Q = new T3.Quaternion(), _E = new T3.Euler(), _V = new T3.Vector3(), _S = new T3.Vector3(1, 1, 1);
function crittersFrame(dt) {
  if (!CRIT.bf) return;
  const L = daylight(), S = seasonOf().id, clear = W.weather === 'clear', warm = S !== 'winter';
  // butterflies
  const bfOn = L > 0.6 && clear && warm && !interior;
  CRIT.bf.visible = bfOn;
  if (bfOn) {
    CRIT.bfList.forEach((b, i) => {
      if (!b.home || rand() < dt * 0.02) { b.home = pick(flowerSpots) || [0, 14]; }
      b.ph += dt * b.sp;
      const tx = b.home[0] + Math.cos(b.ph) * b.r + Math.sin(b.ph * 2.3) * 0.5, tz = b.home[1] + Math.sin(b.ph * 1.3) * b.r, ty = 0.9 + Math.sin(b.ph * 3.1) * 0.45 + Math.max(0, Math.sin(b.ph * 0.7)) * 0.6;
      const yaw = Math.atan2(tx - b.x, tz - b.z); b.x += (tx - b.x) * Math.min(1, dt * 2); b.y += (ty - b.y) * Math.min(1, dt * 2); b.z += (tz - b.z) * Math.min(1, dt * 2);
      const flap = Math.sin(now * 16 + i * 1.7) * 0.9 + 0.35;
      for (const side of [0, 1]) {
        _E.set(0, yaw, (side ? -1 : 1) * flap, 'YXZ'); _Q.setFromEuler(_E); _S.set(side ? -0.9 : 0.9, 0.9, 0.9);
        _M.compose(_V.set(b.x, b.y, b.z), _Q, _S); CRIT.bf.setMatrixAt(i * 2 + side, _M);
      }
    });
    CRIT.bf.instanceMatrix.needsUpdate = true;
  }
  // bees: quick loops near the flowers and the garden
  const beeOn = L > 0.6 && clear && (S === 'spring' || S === 'summer') && !interior;
  CRIT.bees.visible = CRIT.beeWings.visible = beeOn;
  if (beeOn) {
    CRIT.beeList.forEach((b, i) => {
      if (!b.home || rand() < dt * 0.03) b.home = rand() < 0.4 ? polar(158, 22) : pick(flowerSpots) || [0, 12];
      b.ph += dt * b.sp;
      const x = b.home[0] + Math.cos(b.ph * 1.7) * 0.9 + Math.sin(b.ph * 4.1) * 0.25, z = b.home[1] + Math.sin(b.ph * 2.3) * 0.9, y = 0.8 + Math.sin(b.ph * 5) * 0.2;
      const yaw = Math.atan2(-Math.sin(b.ph * 1.7) * 1.7, Math.cos(b.ph * 2.3) * 2.3);
      _E.set(0, yaw, 0); _Q.setFromEuler(_E); _S.setScalar(1.6); _M.compose(_V.set(x, y, z), _Q, _S); CRIT.bees.setMatrixAt(i, _M);
      _S.set(1.6, 1.6 * (0.6 + Math.abs(Math.sin(now * 40 + i)) * 0.4), 1.6); _M.compose(_V, _Q, _S); CRIT.beeWings.setMatrixAt(i, _M);
    });
    CRIT.bees.instanceMatrix.needsUpdate = CRIT.beeWings.instanceMatrix.needsUpdate = true;
  }
  // fish
  CRIT.fish.visible = !interior && !cfg.boxMode;
  if (CRIT.fish.visible) {
    CRIT.fishList.forEach((f, i) => {
      if (f.dart > 0) f.dart -= dt; else if (rand() < dt * 0.05) f.dart = 1.2;
      f.a += f.sp * dt * (f.dart > 0 ? 4 : 1) * (30 / f.r);
      const x = Math.sin(f.a) * f.r, z = -Math.cos(f.a) * f.r + Math.sin(now * 0.3 + i) * 0.6;
      _E.set(0, -f.a + (f.sp > 0 ? Math.PI / 2 : -Math.PI / 2), 0); _Q.setFromEuler(_E); _S.setScalar(f.s * (1 + Math.sin(now * 6 + i) * 0.04));
      _M.compose(_V.set(x, -0.86, z), _Q, _S); CRIT.fish.setMatrixAt(i, _M);
    });
    CRIT.fish.instanceMatrix.needsUpdate = true;
  }
  // fireflies at night (not in winter or rain)
  const ffOn = L < 0.55 && warm && !wetToday() && !interior;
  CRIT.ff.visible = ffOn;
  if (ffOn) {
    const a = CRIT.ff.geometry.attributes.position.array;
    CRIT.ffSeed.forEach((s, i) => { a[i * 3] = s.x + Math.sin(now * 0.4 + s.ph) * 1.4; a[i * 3 + 1] = s.h + Math.sin(now * 0.9 + s.ph * 3) * 0.4; a[i * 3 + 2] = s.z + Math.cos(now * 0.33 + s.ph) * 1.4; });
    CRIT.ff.geometry.attributes.position.needsUpdate = true;
    CRIT.ff.material.opacity = (1 - L / 0.55) * (0.6 + Math.sin(now * 2.1) * 0.2);
    CRIT.ff.material.size = 0.5 + Math.sin(now * 3.3) * 0.08;
  }
  // dust motes drifting in the sun around wherever you are looking
  const mOn = GFX.level === 'pretty' && L > 0.7 && clear && !interior && !cfg.boxMode;
  CRIT.motes.visible = mOn;
  if (mOn) {
    const a = CRIT.motes.geometry.attributes.position.array, cx = controls.target.x, cz = controls.target.z;
    CRIT.motes.userData.seed.forEach((s, i) => { a[i * 3] = cx + s[0] + Math.sin(now * 0.2 + s[3]) * 2; a[i * 3 + 1] = 0.8 + ((s[1] + now * 0.15) % 6); a[i * 3 + 2] = cz + s[2] + Math.cos(now * 0.17 + s[3]) * 2; });
    CRIT.motes.geometry.attributes.position.needsUpdate = true;
  }
  ghostsFrame(dt, L);
}

// ---------- little ghosts that come out at night ----------
const GHOST_TINTS = ['#bfe7ff', '#e6d4ff', '#ffd6ec'];
function buildGhosts() {
  const P = assetParts('ghost')[0];
  for (let i = 0; i < 3; i++) {
    const g = new T3.Group(), tint = GHOST_TINTS[i];
    const mat = makeToon({ color: '#ffffff', vertexColors: true, emissive: new T3.Color(tint), emissiveIntensity: 0.75, roughness: 0.45, transparent: true, opacity: 0.9 });
    const body = new T3.Mesh(P.geo, mat); body.castShadow = false; g.add(body);
    const eyeM = makeToon({ color: '#1e1830', roughness: 0.2 });
    for (const s of [-1, 1]) { const e = mesh(sph(0.075, 10, 8), eyeM, s * 0.17, 0.86, 0.43, false); e.scale.set(0.9, 1.25, 0.5); g.add(e); const b = mesh(new T3.CircleGeometry(0.06, 10), new T3.MeshBasicMaterial({ color: 0xff9ec7, transparent: true, opacity: 0.7 }), s * 0.27, 0.72, 0.445, false); b.rotation.y = s * 0.3; g.add(b); }
    const halo = glowSprite(tint, 3.2, 0.5); halo.position.y = 0.7; g.add(halo);
    g.traverse((o) => (o.userData.tap = { kind: 'ghost', id: i }));
    g.visible = false; scene.add(g); tappables.push(body);
    CRIT.ghosts.push({ g, mat, halo, x: 0, z: 10, tx: 0, tz: 10, ph: rand() * 6.28, zoom: 0, seen: {} });
  }
}
function ghostTarget(gh) { for (let k = 0; k < 20; k++) { const a = rand() * 6.28, r = 6 + rand() * 20, x = Math.sin(a) * r, z = -Math.cos(a) * r; if (Math.hypot(x - gh.x, z - gh.z) > 6) { gh.tx = x; gh.tz = z; return; } } }
function ghostsFrame(dt, L) {
  const night = Math.max(0, Math.min(1, (0.45 - L) / 0.2));
  for (const gh of CRIT.ghosts) {
    gh.g.visible = night > 0.01 && !interior;
    if (!gh.g.visible) continue;
    gh.mat.opacity = 0.9 * night; gh.halo.material.opacity = 0.5 * night;
    gh.g.children.forEach((c) => { if (c.material && c !== gh.halo && c.material !== gh.mat) { c.material.transparent = true; c.material.opacity = (c.material.color.r > 0.5 ? 0.7 : 1) * night; } });
    const d = Math.hypot(gh.tx - gh.x, gh.tz - gh.z); if (d < 1) ghostTarget(gh);
    const sp = (gh.zoom > 0 ? 7 : 1.1) * dt; if (gh.zoom > 0) gh.zoom -= dt;
    gh.x += ((gh.tx - gh.x) / (d || 1)) * Math.min(d, sp); gh.z += ((gh.tz - gh.z) / (d || 1)) * Math.min(d, sp);
    gh.ph += dt;
    gh.g.position.set(gh.x, 1.3 + Math.sin(gh.ph * 1.6) * 0.25, gh.z);
    const yaw = Math.atan2(gh.tx - gh.x, gh.tz - gh.z); let dy = yaw - gh.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); gh.g.rotation.y += dy * Math.min(1, dt * 2);
    gh.g.rotation.z = Math.sin(gh.ph * 1.1) * 0.12;
  }
  // now and then a resident notices one
  if (MODE !== 'host' || offlineSim || night < 0.5 || now < (CRIT.nextBoo || 0)) return;
  CRIT.nextBoo = now + 1.5;
  for (const gh of CRIT.ghosts) for (const p of W.people) {
    if (p.inside || p.state !== 'free' || p.grow < 0.6 || Math.hypot(p.x - gh.x, p.z - gh.z) > 2.6 || rand() > 0.12) continue;
    const brave = (p.body.openness ?? 0) > 0.2;
    bubble(p, pick(brave ? ['Aww, hi little ghost!', 'It waved at me!', 'Boo to you too.', 'Are you lost, little guy?'] : ['EEP!', 'G-g-ghost!', "Nope. Nope nope nope.", 'Did that ghost just wink at me?']), 2.8);
    emote(p, brave ? '✨' : '😱', 2.5);
    if (!gh.seen[p.id] || gh.seen[p.id] < W.day) { gh.seen[p.id] = W.day; remember(p, brave ? 'A little glowing ghost floated past me tonight. It had tiny arms. Cute.' : 'A GHOST floated right past me tonight. A small one, but still.', 1, 'ghost'); }
    return;
  }
}
function ghostTap(i) {
  const gh = CRIT.ghosts[i]; if (!gh) return;
  spawnBurst(gh.x, 1.5, gh.z, [GHOST_TINTS[i], '#ffffff', '#fff2b0'], 36, 2.2, 0.3); Sound.sparkle?.();
  toast(pick(['The little ghost giggled and zipped away.', 'Boo! (It is mostly shy.)', 'The ghost blushed and hid behind a tree.', 'It spun around twice. That means hello, probably.']));
  gh.zoom = 1.8; ghostTarget(gh);
}

// ---------- per frame: sky, water, fog, lights ----------
const _skyTop = new T3.Color(), _skyHor = new T3.Color(), _c1 = new T3.Color();
function gfxFrame(dt) {
  if (!gfxOn()) { renderer.setRenderTarget(null); return; }
  gfxWatch(dt);
  const L = daylight(), t = W.t, dusk = t > 0.5 && t < 0.66 ? Math.sin(((t - 0.5) / 0.16) * Math.PI) : t < 0.04 ? Math.sin((t / 0.04) * Math.PI) * 0.6 : 0;
  const clear = W.weather === 'clear', box = cfg.boxMode;
  // sky: the old background color becomes the top of a gradient dome
  if (skyDome) {
    skyDome.visible = !box;
    _skyTop.set('#0b1233').lerp(_c1.set('#4aa8ff'), L).lerp(_c1.set('#7a6ab8'), dusk * 0.45);
    _skyHor.set('#1d2a5a').lerp(_c1.set('#dff3ff'), L).lerp(_c1.set('#ffb99a'), dusk * 0.85);
    if (!clear) { _skyTop.lerp(_c1.set('#8f9bb5'), 0.55 * L); _skyHor.lerp(_c1.set('#c9d0dc'), 0.5 * L); }
    if (flash > 0) { _skyTop.lerp(_c1.set('#ffffff'), flash * 0.5); _skyHor.lerp(_c1.set('#ffffff'), flash * 0.5); }
    SKY.top.copy(_skyTop); SKY.hor.copy(_skyHor);
    SKY.sun.copy(sun.position).normalize();
    SKY.glow.set('#fff2cf').lerp(_c1.set('#ffb07a'), dusk);
    skyDome.material.uniforms.uGlowK.value = clear ? (0.25 + dusk * 0.9) * Math.max(0.15, L) : 0.1;
    skyDome.position.copy(camera.position);
  }
  // fog: a soft haze toward the horizon
  if (!box) { if (!scene.fog) scene.fog = new T3.Fog(_skyHor.getHex(), 150, 420); scene.fog.color.copy(_skyHor); } else scene.fog = null;
  // lights for the new materials: warm sun by day, a cool moon at night
  const N = Math.max(0, Math.min(1, (0.62 - L) / 0.37)), wet = clear ? 1 : 0.6;
  const nb = box ? 1.7 : 1;
  sun.intensity = (GFX.sunK ?? 0.8) * L * wet * (1 - N) + 0.16 * N * nb;
  sun.color.set('#fff3dc').lerp(_c1.set('#ffa468'), dusk * 0.75).lerp(_c1.set('#9fb4ff'), N);
  GFX.dusk = dusk * (1 - N);
  hemi.intensity = ((GFX.hemiK ?? 0.3) + 0.12 * L) * (1 - N) + 0.16 * N * nb;
  hemi.color.set('#cfe8ff').lerp(_c1.set('#ffb0c8'), dusk * 0.45).lerp(_c1.set('#6a78d8'), N);
  hemi.groundColor.set('#b9cf95').lerp(_c1.set('#3a3668'), N);
  nightLight.intensity = 0.06 * N;
  if (fillLight) { fillLight.intensity = (0.06 + 0.08 * L) * (1 - N); fillLight.color.set('#d8e4ff'); }
  RIM.color.value.set('#fff0f6').lerp(_c1.set('#ffc0a0'), dusk * 0.6).lerp(_c1.set('#9fb8ff'), N); RIM.k.value = box ? 0.6 : 0.28 + N * 0.3;
  lampPools(N);
  // water
  if (waterMesh) {
    const U = waterMesh.material.uniforms;
    U.uT.value = now % 3000; U.uL.value = Math.max(0.12, L * (1 - N * 0.7)); U.uBox.value = box ? 1 : 0;
    U.uSunDir.value.copy(sun.position).normalize(); U.uSunC.value.set('#fff4dc').lerp(_c1.set('#ffb07a'), dusk);
    U.uFogC.value.copy(_skyHor);
    U.uShallow.value.set(clear ? '#5ff0e2' : '#7cc9c4'); U.uMid.value.set(clear ? '#34bfe9' : '#5a9fbf'); U.uDeep.value.set(box ? '#0c3c6e' : clear ? '#2c7ddb' : '#3d6a9a');
    if (seabed) seabed.visible = !box;
  }
  crittersFrame(dt); claudeCatFrame(); skyFxFrame(dt); gemsFrame();
}
// warm pools of light under every street lamp at night, and a moon
let pools = null, moon = null;
function lampPools(N) {
  if (!pools) {
    const pts = []; scene.updateMatrixWorld(true);
    scene.traverse((o) => { if (o.isMesh && lampMats.includes(o.material)) { const v = new T3.Vector3(); o.getWorldPosition(v); if (v.y > 2) pts.push([v.x, v.z]); } });
    pools = new T3.InstancedMesh(new T3.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T3.MeshBasicMaterial({ color: '#ffb866', alphaMap: gfxTextures().glow, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false }), Math.max(1, pts.length));
    const M = new T3.Matrix4(); pts.forEach(([x, z], i) => { M.makeScale(6.5, 1, 6.5).setPosition(x, 0.12, z); pools.setMatrixAt(i, M); }); pools.count = pts.length;
    pools.renderOrder = 2; pools.raycast = () => {}; pools.frustumCulled = false; scene.add(pools);
    moon = glowSprite('#dfe6ff', 22, 0.9); const disc = new T3.Sprite(new T3.SpriteMaterial({ map: gfxTextures().dot, color: '#f4f6ff', transparent: true, depthWrite: false, toneMapped: false, fog: false })); disc.scale.set(0.3, 0.3, 1); moon.add(disc); moon.material.fog = false; scene.add(moon);
  }
  pools.visible = N > 0.05 && !interior; pools.material.opacity = 0.42 * N;
  moon.visible = N > 0.05 && !cfg.boxMode && !interior; moon.material.opacity = 0.55 * N; moon.children[0].material.opacity = N;
  camera.getWorldDirection(_V); _V.y = 0; _V.normalize(); moon.position.set(camera.position.x + _V.x * 300 - _V.z * 90, camera.position.y + 150, camera.position.z + _V.z * 300 + _V.x * 90);
}
// seasons recolor the Blender crowns and the lawn too
function gfxSeason(S, T) {
  if (!gfxOn()) return;
  for (const k of FOLIAGE) { const m = matCache.get('leaf:' + k); if (m) m.color.set(T[k] || k); }
  const base = new T3.Color(ISL.grass);
  if (S.id === 'autumn') base.lerp(new T3.Color('#c9b36a'), T.grass);
  if (S.id === 'winter') base.lerp(new T3.Color('#f4f8ff'), T.grass);
  for (const key of ['world:grass', 'world:grassLobe']) { const g = matCache.get(key); if (g) g.color.copy(base); }
  const tm = matCache.get('baked:tuftMat'); if (tm) tm.color.set(S.id === 'winter' ? '#e8eef8' : S.id === 'autumn' ? '#d8c890' : '#ffffff');
  if (CRIT.ff) CRIT.ff.material.color.set(S.id === 'summer' ? '#e8ff9a' : '#fff0b0');
}

// ---------- interiors: a warm dollhouse on a little stage ----------
function gfxShell(S, night) {
  if (!gfxOn()) return;
  S.traverse((o) => { if (o.isHemisphereLight) { o.intensity = night ? 0.5 : 0.85; o.color.set('#fff3e6'); o.groundColor.set('#8a6a88'); } if (o.isAmbientLight) o.intensity = night ? 0.12 : 0.18; if (o.isDirectionalLight) o.intensity = night ? 0.35 : 0.95; if (o.isPointLight) { o.intensity = 1.1; o.distance = 14; } });
  const warm = new T3.PointLight(night ? 0xffb38a : 0xffe6c8, night ? 0.8 : 0.35, 16); warm.position.set(-2.5, 3.8, 2.5); S.add(warm);
  const baseMat = makeToon({ color: cfg.boxMode ? '#2a2238' : '#5a4a6a', roughness: 0.7 });
  const base = mesh(roundedBoxGeo(9.8, 0.9, 8.8, 0.3), baseMat, 0, -0.75, 0, false); S.add(base);
  const trim = mesh(roundedBoxGeo(10.0, 0.14, 9.0, 0.06), makeToon({ color: '#ffd9a8', roughness: 0.5, emissive: new T3.Color(night ? '#5a3a20' : '#000000') }), 0, -0.32, 0, false); S.add(trim);
  if (!cfg.boxMode) S.background = new T3.Color(night ? '#140f24' : '#241a38');
  gfxRoomTouch(S);
}

// ---------- settings: the look picker ----------
function gfxSettingsHtml() {
  return `<div class="field"><label for="gfxLevel">Graphics</label><select id="gfxLevel">${Object.entries(GFX_LEVELS).map(([k, n]) => `<option value="${k}"${(cfg.gfx || 'auto') === k ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
    <p class="hint" id="gfxHint">${gfxOn() ? `Right now: ${GFX_LEVELS[GFX.level] || GFX.level}${GFX.noShadow ? ', shadows off' : ''}. Auto starts at Pretty and steps down if the box gets slow. Balanced and Lite run at 30 frames a second, which keeps an old phone cooler.` : 'The flat v23 look.'}</p>`;
}
function wireGfxSettings() {
  const box = $('#gfxBox'); if (!box) return;
  box.innerHTML = gfxSettingsHtml();
  $('#gfxLevel').addEventListener('change', (e) => { if (MODE === 'remote') { send({ t: 'set', key: 'gfx', value: e.target.value }); return; } gfxSetting(e.target.value); wireGfxSettings(); });
}

