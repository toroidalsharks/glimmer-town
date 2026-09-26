// ============================================================
// BUILDING: decorations you place, and new land
// ============================================================
const BUILDS = {
  bench: { name: 'bench', price: 8 }, lamp: { name: 'lamp post', price: 8 }, flowers: { name: 'flower bed', price: 10 },
  tree: { name: 'cherry tree', price: 12 }, picnic: { name: 'picnic table', price: 15 }, campfire: { name: 'campfire', price: 20 },
  arch: { name: 'flower arch', price: 25 }, pond: { name: 'lily pond', price: 30 }, swings: { name: 'swing set', price: 35 },
  planter: { name: 'planter box', price: 9 }, birdbath: { name: 'birdbath', price: 12 }, umbrella: { name: 'beach umbrella', price: 10 }, pumpkins: { name: 'pumpkin pile', price: 8 }, lights: { name: 'string lights', price: 14 },
  gazebo: { name: 'gazebo', price: 45 },
  carousel: { name: 'carousel', price: 700, size: 3, big: true, blurb: 'Kids and grown-ups ride it for a happy boost.' },
  onsen: { name: 'hot spring', price: 1100, size: 3.5, big: true, blurb: 'Residents soak here and come out relaxed.' },
  clinic: { name: 'hospital wing', price: 1400, size: 3.5, big: true, blurb: 'A proper hospital. Sick and hurt residents heal faster, and the really sick get round-the-clock care.' },
  observatory: { name: 'observatory', price: 1800, size: 3.5, big: true, blurb: 'Residents stargaze here in the evening.' },
  museum: { name: 'museum', price: 2600, size: 4.5, big: true, blurb: 'Donate rare fish and handmade things. Visitors buy tickets.' },
  ferris: { name: 'ferris wheel', price: 3800, size: 4.5, big: true, blurb: 'The biggest thing on the island. Everyone wants a ride.' }, fountain2: { name: 'little fountain', price: 60 }, windmill: { name: 'windmill', price: 70 },
};
const LOBES = {
  west: { name: 'West meadow', price: 300, a: 270, blurb: 'A grassy meadow to the west.' }, east: { name: 'East meadow', price: 500, a: 88, blurb: 'A grassy meadow to the east.' }, north: { name: 'North hill', price: 800, a: 330, blurb: 'A breezy hill up north.' },
  orchard: { name: 'Sunrise Orchard', price: 1200, a: 135, kind: 'orchard', blurb: 'Fruit trees. Tap them for wood and apples.' },
  peak: { name: 'Glimmer Peak', price: 2500, a: 245, d: 62, r: 13, bridge: true, kind: 'peak', blurb: 'A little mountain island across a bridge. Boulders full of stone, and a lookout at the top.' },
  starlight: { name: 'Starlight Isle', price: 4500, a: 108, d: 64, r: 12, bridge: true, kind: 'star', blurb: 'A glowing island of crystals. Tap them for rare finds. Best stargazing on the island.' },
};
const lobeR = (k) => LOBES[k].r || LOBE_R;
function lobeProps(k) {
  const L = LOBES[k], out = [];
  if (L.kind === 'orchard') for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28 + 0.3, rr = 5 + (i % 2) * 3; out.push([Math.cos(a) * rr, Math.sin(a) * rr, 1.8]); }
  if (L.kind === 'peak') { out.push([0, 0, 5.5]); for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.28; out.push([Math.cos(a) * 8.5, Math.sin(a) * 8.5, 1.4]); } }
  if (L.kind === 'star') for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.28, rr = 8.4 + (i % 2) * 1.2; out.push([Math.cos(a) * rr, Math.sin(a) * rr, 1.2]); }
  return out;
}
const LOBE_R = 12.5, LOBE_D = 37;
let placing = null, placedGroup = null, landGroup = null;
function lobeCenter(k) { return polar(LOBES[k].a, LOBES[k].d || LOBE_D); }
function spotProblem(x, z, size = 0) {
  const r = Math.hypot(x, z);
  let onLand = r < 28.5 - size || Math.hypot(x - DT.x, z - DT.z) < DT.R - 1.5 - size || Math.hypot(x - BEACH[0], z - BEACH[1]) < BEACH_R - 1.5 - size;
  if (Math.hypot(x - DT.x, z - DT.z) < 16) return "That's the downtown square and road.";
  for (const b of Object.values(DT_BLD)) { const [bx, bz] = polarDT(b.a, b.r); if (Math.hypot(x - bx, z - bz) < 8 + size) return "That's too close to a building."; }
  for (const k of W.lobes || []) { const [cx, cz] = lobeCenter(k); if (Math.hypot(x - cx, z - cz) < lobeR(k) - 1.2 - size) onLand = true; for (const [px, pz, pr] of lobeProps(k)) if (Math.hypot(x - cx - px, z - cz - pz) < pr + 1 + size) return LOBES[k].kind === 'peak' ? 'That is the mountain.' : LOBES[k].kind === 'star' ? 'The crystals are there.' : 'A fruit tree is there.'; }
  if (!onLand) return 'Pick a spot on land.';
  if (r < 6.8 + size) return "That's too close to the fountain.";
  for (const b of Object.values(BLD)) { const [bx, bz] = polar(b.a, b.r); if (Math.hypot(x - bx, z - bz) < 7.8 + size) return "That's too close to a building."; }
  const [gx, gz] = polar(158, 22); if (Math.hypot(x - gx, z - gz) < 6.5) return "That's the garden.";
  const [px, pz] = polar(252, 23.5); if (Math.hypot(x - px, z - pz) < 4) return "The big tree is there.";
  if (Math.abs(x) < 3.2 + size && z > 11) return 'That would block the path to the pier.';
  if (Math.hypot(x - PLOT_AT[0], z - PLOT_AT[1]) < 3.5 + size) return "That's your garden plot.";
  for (const pl of W.placed || []) if (Math.hypot(x - pl.x, z - pl.z) < 3 + size + (BUILDS[pl.type]?.size || 0)) return 'Something is already there.';
  return null;
}
function autoSpot(size = 0) {
  const areas = [[0, 0, 27], [DT.x, DT.z, 29]].concat((W.lobes || []).map((k) => [...lobeCenter(k), lobeR(k) - 2]));
  for (let i = 0; i < 500; i++) { const [cx, cz, R] = pick(areas); const a = rand() * 6.28, r = Math.sqrt(rand()) * R; const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (!spotProblem(x, z, size)) return [x, z]; }
  return null;
}
function buildLand() {
  if (!landGroup) { landGroup = new T3.Group(); scene.add(landGroup); }
  while (landGroup.children.length) { const c = landGroup.children[0]; landGroup.remove(c); disposeTree(c); }
  for (const k of W.lobes || []) {
    const [x, z] = lobeCenter(k), R = lobeR(k), L = LOBES[k], D = L.d || LOBE_D;
    const grass = L.kind === 'star' ? toon('#9fb8ff') : toon(ISL.grass);
    if (gfxOn()) landGroup.add(islandPiece(x, z, R, L.kind === 'star' ? worldMat('starGrass', '#9fb8ff', gfxTextures().grass, 0.3, 0.84, 1.1, 0.12) : grassMat(true), L.kind === 'star' ? { sand: '#ece8ff', wet: '#c9c2ee', dy: -0.03 } : { dy: -0.012 }));
    else {
    landGroup.add(mesh(cyl(R, R - 1.4, 2.4, 48), [toon('#c9a27a'), grass, toon('#8a6a4e')], x, -1.2, z, false));
    landGroup.add(mesh(cyl(R + 1.3, R + 1.7, 0.4, 48), toon(L.kind === 'star' ? '#e8e4ff' : '#f3dfb0'), x, -0.35, z, false));
    const f = mesh(new T3.RingGeometry(R + 1.4, R + 2.6, 48), new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }), x, -0.84, z, false); f.rotation.x = -Math.PI / 2; landGroup.add(f); }
    const seg = (r1, r2, mat, y = 0.036, w = 2.4) => { const [ax, az] = polar(L.a, r1), [bx, bz] = polar(L.a, r2); const len = Math.hypot(bx - ax, bz - az), m = mesh(box(w, 0.07, len), mat, (ax + bx) / 2, y, (az + bz) / 2, false); m.rotation.y = Math.atan2(bx - ax, bz - az); landGroup.add(m); };
    if (L.bridge) {
      seg(12.2, 29, pathMat());
      seg(28.5, D - R + 1.5, toon('#c49a6c'), 0.12, 2.6);
      for (let r = 30; r < D - R + 1; r += 3) for (const s of [-1, 1]) { const [px, pz] = polar(L.a, r), a2 = (L.a * Math.PI) / 180; const ox = Math.cos(a2) * 1.35 * s, oz = Math.sin(a2) * 1.35 * s; landGroup.add(mesh(cyl(0.12, 0.12, 2.2, 6), toon('#8a6a4e'), px + ox, -0.4, pz + oz)); landGroup.add(mesh(sph(0.14, 6, 5), toon('#8a6a4e'), px + ox, 0.75, pz + oz)); }
      seg(D - R + 1, D - 2, pathMat());
    } else seg(12.2, D - 4, pathMat());
    const deco = new T3.Group(); deco.position.set(x, 0, z); landGroup.add(deco);
    if (L.kind === 'orchard') lobeProps(k).forEach(([tx, tz], i) => {
      const t = new T3.Group();
      if (gfxOn()) treeParts(t, 0.8, '#6fbf6a', 'treeB'); else { t.add(mesh(cyl(0.25, 0.35, 2, 8), toon('#9a6f4e'), 0, 1, 0)); t.add(mesh(sph(1.5, 12, 9), toon('#6fbf6a'), 0, 2.8, 0)); }
      for (let j = 0; j < 6; j++) { const b2 = j * 1.05; t.add(mesh(sph(0.2, 8, 6), toon(j % 2 ? '#ff5a4a' : '#ffb347'), Math.cos(b2) * (gfxOn() ? 1.45 : 1.3), (gfxOn() ? 2.3 : 2.5) + (j % 3) * 0.35, Math.sin(b2) * (gfxOn() ? 1.45 : 1.3))); }
      t.position.set(tx, 0, tz); const id = `orch${i}`; t.traverse((o) => { o.userData.tap = { kind: 'orchard', id, x: x + tx, z: z + tz }; }); t.children.forEach((c) => tappables.push(c)); deco.add(t);
    });
    if (L.kind === 'peak') {
      deco.add(mesh(new T3.ConeGeometry(5.2, 7, 10), toon('#8fae6a'), 0, 3.5, 0));
      const cap = mesh(new T3.ConeGeometry(2.2, 2.9, 10), toon(seasonOf().id === 'winter' ? '#ffffff' : '#a9a3c2'), 0, 5.6, 0); deco.add(cap);
      deco.add(mesh(box(1.4, 0.15, 0.5), toon('#c49a6c'), 0, 7.1, 0));
      for (let i = 0; i < 5; i++) { const a3 = (i / 5) * 6.28, id = `rock${i}`, bx = Math.cos(a3) * 8.5, bz = Math.sin(a3) * 8.5; const r3 = mesh(new T3.DodecahedronGeometry(0.9 + (i % 2) * 0.4, 0), toon('#a9a3c2'), bx, 0.7, bz); r3.userData.tap = { kind: 'boulder', id, x: x + bx, z: z + bz }; tappables.push(r3); deco.add(r3); }
    }
    if (L.kind === 'star') lobeProps(k).forEach(([cx2, cz2], i) => {
      const c = ['#7fb8ff', '#b39bff', '#ff9ad8'][i % 3];
      const cr = mesh(new T3.OctahedronGeometry(0.6 + (i % 3) * 0.25, 0), crystalGem(c), cx2, 1 + (i % 3) * 0.3, cz2); cr.scale.y = 1.8; cr.userData.tap = { kind: 'crystal', id: `cry${i}`, x: x + cx2, z: z + cz2 }; cr.userData.spinY = true; tappables.push(cr); deco.add(cr);
    });
  }
  if (gfxOn()) { waterIsles(); if (meadowGroup) setTimeout(gfxMeadow, 0); }
}

function placedMesh(pl) {
  if (BUILDS[pl.type]?.parts) { const g = partsMesh(BUILDS[pl.type].parts); g.position.set(pl.x, 0, pl.z); g.rotation.y = pl.rot || 0; g.traverse((o) => { if (o.isMesh) o.userData.tap = { kind: 'placed', id: pl.id }; }); return g; }
  const g = new T3.Group(), W8 = toon('#c49a6c'), D8 = toon('#8a6a4e');
  switch (pl.type) {
    case 'carousel': { g.add(mesh(cyl(3, 3.1, 0.4, 24), toon('#fff4dc'), 0, 0.2, 0)); const top = new T3.Group(); top.userData.spinY = true; top.add(mesh(new T3.ConeGeometry(3.3, 1.6, 16), toon('#ff9fbf'), 0, 4.2, 0)); top.add(mesh(cyl(0.25, 0.25, 3.6, 8), toon('#ffd36b'), 0, 2.2, 0)); for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28; top.add(mesh(cyl(0.05, 0.05, 3.2, 5), toon('#ffd36b'), Math.cos(a) * 2.2, 2.1, Math.sin(a) * 2.2)); const horse = mesh(box(0.35, 0.5, 0.9), toon(['#ffffff', '#c9b3ff', '#9fd3ff'][i % 3]), Math.cos(a) * 2.2, 1.3 + (i % 2) * 0.3, Math.sin(a) * 2.2); horse.rotation.y = -a; top.add(horse); } top.position.y = 0.3; g.add(top); break; }
    case 'onsen': { g.add(mesh(cyl(3.2, 3.3, 0.5, 20), toon('#a9a3c2'), 0, 0.25, 0)); g.add(mesh(cyl(2.7, 2.7, 0.08, 20), toon('#9fd8e8', { emissive: new T3.Color('#1a4a56') }), 0, 0.46, 0, false)); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; g.add(mesh(new T3.DodecahedronGeometry(0.45, 0), toon('#8a84a8'), Math.cos(a) * 3.1, 0.5, Math.sin(a) * 3.1)); } for (let i = 0; i < 6; i++) { const s = mesh(sph(0.5, 8, 6), new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false }), (rand() - 0.5) * 3, 1, (rand() - 0.5) * 3, false); s.userData.steam = i / 6; g.add(s); } const sg = mesh(box(1.4, 0.8, 0.08), toon('#fff4dc'), 0, 1.3, 3.4); g.add(sg); g.add(mesh(cyl(0.05, 0.05, 1.2, 5), toon('#8a6a4e'), 0, 0.6, 3.38)); break; }
    case 'clinic': { g.add(mesh(box(5.4, 3.6, 4.4), toon('#ffffff'), 0, 1.8, 0)); const r = roofPrism(5.8, 4.8, 1.3, toon('#9fd3ff')); r.position.y = 3.6; g.add(r); g.add(mesh(box(1.4, 2.2, 0.15), toon('#9fd3ff'), 0, 1.1, 2.22)); g.add(mesh(box(1.2, 0.35, 0.1), toon('#ff6f5e'), 0, 3.0, 2.25)); g.add(mesh(box(0.35, 1.2, 0.1), toon('#ff6f5e'), 0, 3.0, 2.25)); for (const s of [-1.8, 1.8]) g.add(mesh(box(1, 1, 0.12), toon('#bfe8ff'), s, 2, 2.22)); break; }
    case 'observatory': { g.add(mesh(cyl(2.6, 2.8, 3.2, 20), toon('#fff4dc'), 0, 1.6, 0)); g.add(mesh(new T3.SphereGeometry(2.6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon('#c9b3ff'), 0, 3.2, 0)); g.add(mesh(box(0.7, 2.4, 5.4), toon('#3d4f86'), 0, 4.2, 0, false)); const sc = mesh(cyl(0.3, 0.45, 2.4, 10), toon('#ffd36b'), 0, 5, 1.2); sc.rotation.x = -0.9; g.add(sc); g.add(mesh(box(1.2, 2, 0.15), toon('#6b4a3a'), 0, 1, 2.75)); break; }
    case 'museum': { g.add(mesh(box(8, 0.5, 6.4), toon('#d4cbe0'), 0, 0.25, 0)); g.add(mesh(box(7, 4, 5), toon('#f4ecdc'), 0, 2.5, -0.4)); for (const x of [-2.7, -0.9, 0.9, 2.7]) g.add(mesh(cyl(0.28, 0.32, 3.8, 10), toon('#fffaf2'), x, 2.4, 2.6)); g.add(mesh(box(7.6, 0.6, 1.4), toon('#b7a6d8'), 0, 4.6, 2.3)); const r = roofPrism(7.8, 6.6, 1.8, toon('#b7a6d8')); r.position.set(0, 4.9, -0.2); g.add(r); const sg = sign('Museum', '#fffaf2', '#6b4a3a', 3.6); sg.position.set(0, 4.6, 3.02); g.add(sg); g.add(mesh(box(1.6, 2.6, 0.15), toon('#6b4a3a'), 0, 1.8, 2.12)); break; }
    case 'ferris': { g.add(mesh(box(6, 0.4, 3), toon('#d4cbe0'), 0, 0.2, 0)); for (const s of [-1, 1]) for (const k of [-1, 1]) { const leg = mesh(cyl(0.12, 0.15, 7.6, 6), toon('#fff4dc'), k * 1.6, 3.6, s * 0.9); leg.rotation.z = k * 0.22; g.add(leg); } const wheel = new T3.Group(); wheel.position.y = 7.2; wheel.userData.spin = true; wheel.add(mesh(new T3.TorusGeometry(5, 0.14, 6, 40), toon('#ff9fbf'), 0, 0, 0)); wheel.add(mesh(new T3.TorusGeometry(3.2, 0.08, 6, 30), toon('#ffd36b'), 0, 0, 0)); for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28; const sp = mesh(box(0.08, 5, 0.08), toon('#fff4dc'), Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0, false); sp.rotation.z = a - Math.PI / 2; wheel.add(sp); wheel.add(mesh(box(0.9, 0.8, 0.9), toon(['#9fd3ff', '#c9b3ff', '#ffe98a', '#9fe3c4', '#ffb3c7'][i % 5]), Math.cos(a) * 5, Math.sin(a) * 5 - 0.5, 0)); } g.add(wheel); break; }
    case 'planter': g.add(mesh(box(1.8, 0.5, 0.7), W8, 0, 0.25, 0)); for (let i = 0; i < 6; i++) { const x = -0.7 + i * 0.28; g.add(mesh(cyl(0.02, 0.02, 0.4, 4), toon('#6fbf6a'), x, 0.65, 0, false)); g.add(mesh(sph(0.12, 8, 6), toon(['#ff9fbf', '#ffe98a', '#c9b3ff', '#ffffff', '#ff9fbf', '#9fd3ff'][i]), x, 0.88, 0)); } break;
    case 'birdbath': { g.add(mesh(cyl(0.18, 0.3, 1.0, 10), toon('#d4cbe0'), 0, 0.5, 0)); g.add(mesh(cyl(0.7, 0.4, 0.25, 16), toon('#d4cbe0'), 0, 1.1, 0)); g.add(mesh(cyl(0.6, 0.6, 0.04, 16), toon('#8fd8ff', { emissive: new T3.Color('#1a4a66') }), 0, 1.22, 0, false)); const bird = new T3.Group(); bird.add(mesh(sph(0.13, 8, 6), toon('#9fd3ff'), 0, 0, 0)); bird.add(mesh(new T3.ConeGeometry(0.04, 0.1, 4), toon('#ffb347'), 0, 0.02, 0.15, false).rotateX(Math.PI / 2)); bird.position.set(0.55, 1.36, 0); g.add(bird); break; }
    case 'umbrella': { g.add(mesh(cyl(0.05, 0.05, 2.6, 6), toon('#fff4dc'), 0, 1.3, 0)); const top = mesh(new T3.ConeGeometry(1.5, 0.6, 12), toon(pick(['#ff9fbf', '#9fd3ff', '#ffe98a'])), 0, 2.7, 0); g.add(top); g.add(mesh(box(1.1, 0.04, 1.9), toon('#ffffff'), 1.1, 0.03, 0, false)); break; }
    case 'pumpkins': for (const [x, z, s] of [[0, 0, 0.45], [0.6, 0.25, 0.32], [-0.5, 0.3, 0.28], [0.1, -0.5, 0.25]]) { g.add(mesh(sph(s, 12, 8).scale(1, 0.75, 1), toon('#ff8a2a'), x, s * 0.7, z)); g.add(mesh(cyl(0.03, 0.04, 0.12, 5), toon('#6fbf6a'), x, s * 1.45, z)); } break;
    case 'lights': { for (const s of [-1.6, 1.6]) g.add(mesh(cyl(0.07, 0.09, 3.2, 6), toon('#5a5470'), s, 1.6, 0)); for (let i = 0; i <= 10; i++) { const x = -1.6 + i * 0.32, y = 3.05 - Math.sin((i / 10) * Math.PI) * 0.45; const c = ['#ffb3c7', '#ffe29a', '#c9b3ff', '#9fe3c4', '#ffd36b'][i % 5]; g.add(mesh(sph(0.08, 6, 5), toon(c, { emissive: new T3.Color(c).multiplyScalar(0.7) }), x, y, 0, false)); } break; }
    case 'bench': g.add(mesh(box(2.2, 0.16, 0.7), W8, 0, 0.55, 0)); g.add(mesh(box(2.2, 0.55, 0.12), W8, 0, 0.95, -0.32)); for (const s of [-0.9, 0.9]) g.add(mesh(box(0.12, 0.55, 0.55), D8, s, 0.27, 0)); break;
    case 'lamp': { g.add(mesh(cyl(0.09, 0.12, 3.8, 8), toon('#5a5470'), 0, 1.9, 0)); const lm = makeToon({ color: '#fff4c4', gradientMap: gradMap, emissive: new T3.Color('#000') }); lampMats.push(lm); g.add(mesh(sph(0.36, 12, 8), lm, 0, 3.95, 0, false)); break; }
    case 'flowers': g.add(mesh(box(2.4, 0.4, 1.3), D8, 0, 0.2, 0)); for (let i = 0; i < 10; i++) g.add(mesh(sph(0.2, 8, 6), toon(['#ff9fbf', '#ffe98a', '#c9b3ff', '#ffffff', '#ff6f5e'][i % 5]), -0.95 + (i % 5) * 0.47, 0.55, -0.3 + Math.floor(i / 5) * 0.6, false)); break;
    case 'tree': g.add(mesh(cyl(0.3, 0.4, 2.4, 8), toon('#9a6f4e'), 0, 1.2, 0)); g.add(mesh(new T3.IcosahedronGeometry(1.8, 0), toon('#f7b6c8'), 0, 3.3, 0)); g.add(mesh(new T3.IcosahedronGeometry(1.2, 0), toon('#ffc9d6'), 0.7, 4.3, 0.3)); break;
    case 'picnic': g.add(mesh(box(2.2, 0.12, 1.1), W8, 0, 0.9, 0)); for (const s of [-0.9, 0.9]) { g.add(mesh(box(0.12, 0.9, 0.9), D8, s, 0.45, 0)); } for (const s of [-1, 1]) g.add(mesh(box(2.2, 0.1, 0.4), W8, 0, 0.5, s * 0.9)); g.add(mesh(box(1.9, 0.02, 0.9), toon('#ff9fbf'), 0, 0.97, 0)); break;
    case 'campfire': for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; g.add(mesh(sph(0.22, 6, 5), toon('#a9a3c2'), Math.cos(a) * 0.7, 0.12, Math.sin(a) * 0.7)); } for (const r of [0.5, -0.5]) { const l = mesh(cyl(0.1, 0.1, 1.2, 6), D8, 0, 0.15, 0); l.rotation.z = Math.PI / 2; l.rotation.y = r * 2; g.add(l); } { const fl = mesh(new T3.ConeGeometry(0.35, 0.9, 7), glow('#ffb347', 0.9), 0, 0.6, 0, false); fl.userData.flame = true; g.add(fl); } break;
    case 'arch': { const t = mesh(new T3.TorusGeometry(1.5, 0.12, 6, 20, Math.PI), toon('#8fd48a'), 0, 0.1, 0); g.add(t); for (let i = 0; i < 9; i++) { const a = (i / 8) * Math.PI; g.add(mesh(sph(0.18, 8, 6), toon(['#ff9fbf', '#ffffff', '#ffe98a'][i % 3]), Math.cos(a) * 1.5, 0.1 + Math.sin(a) * 1.5, 0.1, false)); } break; }
    case 'pond': { const w = mesh(cyl(2.2, 2.2, 0.08, 24), toon('#8fd8ff', { emissive: new T3.Color('#1a4a66') }), 0, 0.05, 0, false); w.scale.set(1, 1, 0.7); g.add(w); for (let i = 0; i < 4; i++) g.add(mesh(new T3.CircleGeometry(0.3, 10), toon('#6fbf6a'), -1 + i * 0.6, 0.1, (i % 2) * 0.5 - 0.2, false).rotateX(-Math.PI / 2)); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; g.add(mesh(sph(0.3, 6, 5), toon('#a9a3c2'), Math.cos(a) * 2.3, 0.1, Math.sin(a) * 1.65)); } break; }
    case 'swings': for (const s of [-1.5, 1.5]) for (const k of [-0.5, 0.5]) { const leg = mesh(cyl(0.07, 0.07, 3, 6), toon('#ff6f5e'), s, 1.4, k * 0.6); leg.rotation.x = k * 0.35; g.add(leg); } { const top = mesh(cyl(0.08, 0.08, 3.2, 6), toon('#ff6f5e'), 0, 2.8, 0); top.rotation.z = Math.PI / 2; g.add(top); for (const s of [-0.7, 0.7]) { for (const k of [-0.3, 0.3]) g.add(mesh(cyl(0.02, 0.02, 2, 4), toon('#fff4dc'), s + k, 1.8, 0, false)); g.add(mesh(box(0.8, 0.08, 0.35), toon('#ffd36b'), s, 0.8, 0)); } } break;
    case 'gazebo': g.add(mesh(cyl(2.4, 2.4, 0.3, 8), toon('#fff4dc'), 0, 0.15, 0)); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; g.add(mesh(cyl(0.1, 0.1, 2.6, 6), toon('#ffffff'), Math.cos(a) * 2.1, 1.6, Math.sin(a) * 2.1)); } g.add(mesh(new T3.ConeGeometry(2.8, 1.5, 8), toon('#c9b3ff'), 0, 3.6, 0)); break;
    case 'fountain2': g.add(mesh(cyl(1.6, 1.7, 0.5, 18), toon('#d4cbe0'), 0, 0.25, 0)); g.add(mesh(cyl(1.4, 1.4, 0.08, 18), toon('#8fd8ff', { emissive: new T3.Color('#1a4a66') }), 0, 0.5, 0, false)); g.add(mesh(cyl(0.2, 0.25, 1.2, 8), toon('#d4cbe0'), 0, 1.0, 0)); g.add(mesh(sph(0.35, 10, 8), toon('#9fd3ff'), 0, 1.75, 0)); break;
    case 'windmill': { g.add(mesh(cyl(0.8, 1.3, 5, 8), toon('#fff4dc'), 0, 2.5, 0)); g.add(mesh(new T3.ConeGeometry(1.1, 1.2, 8), toon('#e2766b'), 0, 5.6, 0)); const blades = new T3.Group(); for (let i = 0; i < 4; i++) { const bl = mesh(box(0.35, 2.4, 0.06), toon('#ffffff'), 0, 1.2, 0); const arm = new T3.Group(); arm.add(bl); arm.rotation.z = (i / 4) * 6.28; blades.add(arm); } blades.position.set(0, 4.6, 1.05); blades.userData.spin = true; g.add(blades); break; }
  }
  g.position.set(pl.x, 0, pl.z); g.rotation.y = pl.rot || 0;
  g.traverse((o) => { if (o.isMesh) o.userData.tap = o.userData.tap || { kind: 'placed', id: pl.id }; });
  return g;
}
function buildPlaced() {
  if (gfxOn() && meadowGroup) setTimeout(gfxMeadow, 0);
  if (!placedGroup) { placedGroup = new T3.Group(); scene.add(placedGroup); }
  while (placedGroup.children.length) { const c = placedGroup.children[0]; placedGroup.remove(c); disposeTree(c); }
  for (const pl of W.placed || []) placedGroup.add(placedMesh(pl));
}
function reactToBuild(name) {
  const nearby = [...W.people].filter((p) => !p.inside && !p.visitor).sort(() => rand() - 0.5).slice(0, 3);
  for (const p of nearby) {
    const s = p.cr.score;
    const line = s >= 4 ? pick([`The Creator made us ${a_an(name)}!`, `${cap(a_an(name))}! It's perfect.`]) : s <= -4 ? pick([`${cap(a_an(name))}? Nobody asked for that.`, "Hmph. Whatever."]) : pick([`Ooh, ${a_an(name)}.`, `Where did that ${name} come from?`, `I might sit by the new ${name} later.`]);
    bubble(p, line, 3.2); remember(p, `${cap(a_an(name))} appeared in town. ${line}`, 1, 'build');
  }
}
function placeStrollSpot() {
  const pl = pick(W.placed || []); if (!pl) return null;
  const a = rand() * 6.28, r = BUILDS[pl.type]?.size ? BUILDS[pl.type].size + 1.6 : pl.type === 'gazebo' || pl.type === 'pond' ? 3 : 1.8;
  return { spot: [pl.x + Math.cos(a) * r, pl.z + Math.sin(a) * r], name: BUILDS[pl.type].name };
}
function cancelPlacing() { placing = null; $('#placeBar').hidden = true; }

