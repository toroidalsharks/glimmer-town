// ============================================================
// DOWNTOWN: the city district north of the apartments
// ============================================================
let clockHands = [], trolley = null, trolleyA = 0, pigeons = [];
function placeDT(g, key) { gfxContact(g); const b = DT_BLD[key]; const [x, z] = polarDT(b.a, b.r); g.position.set(x, 0, z); g.rotation.y = Math.atan2(DT.x - x, DT.z - z); scene.add(g); return g; }
function dtShop(key, wall, roof, awA, awB, sgBg, sgFg, extra) {
  const g = new T3.Group();
  const body = mesh(box(9, 6.4, 8), wallMat(wall), 0, 3.2, 0); gfxShopDeco(g, 9, 8, wall); body.userData.tap = { kind: 'shop', shop: key }; tappables.push(body); g.add(body);
  const r = roofPrism(9.6, 8.8, 3, toon(roof)); r.position.y = 6.4; g.add(r);
  const door = mesh(box(2.1, 3.3, 0.25), toon('#6b4a3a'), 0, 1.65, 4.05); door.userData.tap = { kind: 'shop', shop: key }; tappables.push(door); g.add(door);
  for (const s of [-1, 1]) { g.add(mesh(box(2.2, 1.8, 0.18), toon('#bfe8ff'), s * 3.0, 2.6, 4.05)); gfxWindowBox(g, s * 3.0, 2.6, 4.05); }
  g.add(awning(9.4, awA, awB, 4.5, 4.6));
  const sg = sign(SHOPS[key].name, sgBg, sgFg, 6.2); sg.position.set(0, 5.9, 4.1); g.add(sg);
  if (extra) extra(g);
  return placeDT(g, key);
}
function dtApartment(key, color, trim, startRoom, label) {
  const g = new T3.Group();
  g.add(mesh(box(14, 12, 8), gfxOn() ? detailMat('plaster', color, gfxTextures().plaster, [3, 3]) : toon(color), 0, 6, 0));
  g.add(mesh(box(14.8, 0.6, 8.8), toon(trim), 0, 12.3, 0));
  g.add(mesh(box(14.4, 0.35, 8.4), toon(trim), 0, 4.4, 0));
  g.add(mesh(box(2.4, 3.3, 0.3), toon('#6b4a5a'), 0, 1.65, 4.02));
  g.add(mesh(box(3.4, 0.25, 1.8), toon(trim), 0, 3.6, 4.8));
  const sg = sign(label, '#fffaf2', '#6b4a5a', 5.6); sg.position.set(0, 4.1, 4.08); g.add(sg);
  const xs = [-4.5, 0, 4.5], ys = [6.5, 10];
  for (let f = 0; f < 2; f++) for (let c = 0; c < 3; c++) {
    const i = startRoom + f * 3 + c;
    const m = makeToon({ color: '#3a3f66', gradientMap: gradMap, emissive: new T3.Color('#000000') });
    windowMats.push(m);
    g.add(mesh(box(2.5, 2.2, 0.14), toon('#fffaf2'), xs[c], ys[f], 4.0, false));
    const w = mesh(box(2.1, 1.8, 0.16), m, xs[c], ys[f], 4.03, false); w.userData.tap = { kind: 'room', room: i }; tappables.push(w); g.add(w);
    g.add(mesh(box(2.8, 0.18, 0.9), toon(trim), xs[c], ys[f] - 1.3, 4.4));
    const plate = sign(String(i + 1), trim, '#ffffff', 1.1); plate.position.set(xs[c], ys[f] + 1.4, 4.03); g.add(plate);
  }
  for (const s of [-1, 1]) g.add(mesh(box(1.6, 2.1, 0.15), toon('#bfe8ff'), s * 4.5, 1.8, 4.02, false));
  g.add(mesh(box(1.2, 1.2, 1.2), toon(trim), 4.5, 13.2, -1.5));
  return placeDT(g, key);
}
function buildDowntown() {
  // land
  if (gfxOn()) scene.add(islandPiece(DT.x, DT.z, DT.R, grassMat(true), { dy: -0.006 }));
  else {
    scene.add(mesh(cyl(DT.R, DT.R - 1.5, 2.4, 72), [toon('#c9a27a'), toon(ISL.grass), toon('#8a6a4e')], DT.x, -1.2, DT.z, false));
    scene.add(mesh(cyl(DT.R + 1.4, DT.R + 1.8, 0.4, 72), toon('#f3dfb0'), DT.x, -0.35, DT.z, false));
    { const f = mesh(new T3.RingGeometry(DT.R + 1.4, DT.R + 2.8, 72), new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }), DT.x, -0.84, DT.z, false); f.rotation.x = -Math.PI / 2; scene.add(f); }
  }
  const pave = gfxOn() ? worldMat('pave', '#efe6da', gfxTextures().cobble, 0.3, 0.74, 1.06, 0.05) : toon('#e8e0d4'), road = gfxOn() ? worldMat('road', '#7c7686', gfxTextures().sand, 0.6, 0.86, 1.1, 0.05) : toon('#6e6a7a'), white = toon('#ffffff');
  // path from the main island
  { const pts = [[polar(20, 11.4)], DT_GATE, [DT_HUB]].flat(); for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1]; const len = Math.hypot(bx - ax, bz - az), m = mesh(box(2.6, 0.07, len + 1), pathMat(), (ax + bx) / 2, 0.035, (az + bz) / 2, false); m.rotation.y = Math.atan2(bx - ax, bz - az); scene.add(m); } }
  // sidewalk, ring road, dashes, center square
  scene.add(mesh(cyl(18.5, 18.5, 0.07, 72), pave, DT.x, 0.035, DT.z, false));
  { const ring = mesh(new T3.RingGeometry(10.5, 15, 72), road, DT.x, 0.08, DT.z, false); ring.rotation.x = -Math.PI / 2; scene.add(ring); }
  for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; const d = mesh(box(0.25, 0.02, 1.1), toon('#ffe98a'), DT.x + Math.cos(a) * 12.75, 0.09, DT.z + Math.sin(a) * 12.75, false); d.rotation.y = -a; scene.add(d); }
  scene.add(mesh(cyl(10.5, 10.5, 0.09, 64), gfxOn() ? worldMat('square', '#f6efe4', gfxTextures().cobble, 0.42, 0.72, 1.06, 0.05) : toon('#f2ebe0'), DT.x, 0.045, DT.z, false));
  // radial walks and crosswalks to each building
  for (const k of Object.keys(DT_BLD)) {
    const b = DT_BLD[k], [x1, z1] = polarDT(b.a, 10), [x2, z2] = polarDT(b.a, b.r - 4);
    const len = Math.hypot(x2 - x1, z2 - z1), m = mesh(box(2.4, 0.075, len), pave, (x1 + x2) / 2, 0.04, (z1 + z2) / 2, false); m.rotation.y = Math.atan2(x2 - x1, z2 - z1); scene.add(m);
    for (let s = -2; s <= 2; s++) { const [cx, cz] = polarDT(b.a, 12.75), a = b.a * Math.PI / 180; const st = mesh(box(0.35, 0.02, 3.8), white, cx + Math.cos(a) * s * 0.55, 0.095, cz + Math.sin(a) * s * 0.55, false); st.rotation.y = -a + Math.PI / 2 + Math.PI / 2; st.rotation.y = Math.atan2(Math.sin(a), -Math.cos(a)) + Math.PI / 2; scene.add(st); }
  }
  // clock tower
  {
    const g = new T3.Group();
    g.add(mesh(box(3.2, 1, 3.2), toon('#d4cbe0'), 0, 0.5, 0));
    g.add(mesh(box(2.4, 8, 2.4), toon('#fff4dc'), 0, 5, 0));
    const roof = mesh(new T3.ConeGeometry(2.1, 2.6, 4), toon('#6f73c9'), 0, 10.3, 0); roof.rotation.y = Math.PI / 4; g.add(roof);
    g.add(mesh(sph(0.3, 10, 8), toon('#ffd36b'), 0, 11.8, 0));
    clockHands = [];
    for (let k = 0; k < 4; k++) {
      const face = new T3.Group(); face.rotation.y = k * Math.PI / 2;
      face.add(mesh(new T3.CircleGeometry(0.95, 24), toon('#ffffff'), 0, 7.6, 1.22, false));
      face.add(mesh(new T3.RingGeometry(0.9, 1.02, 24), toon('#6f73c9'), 0, 7.6, 1.23, false));
      const hh = new T3.Group(); hh.position.set(0, 7.6, 1.25); hh.add(mesh(box(0.1, 0.5, 0.03), toon('#2a2238'), 0, 0.22, 0, false)); face.add(hh);
      const mh = new T3.Group(); mh.position.set(0, 7.6, 1.26); mh.add(mesh(box(0.06, 0.78, 0.03), toon('#2a2238'), 0, 0.36, 0, false)); face.add(mh);
      clockHands.push([hh, mh]); g.add(face);
    }
    g.position.set(DT.x, 0, DT.z); scene.add(g);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3; const pl = new T3.Group(); pl.add(mesh(box(1.4, 0.6, 1.4), toon('#c49a6c'), 0, 0.3, 0)); for (let k = 0; k < 4; k++) pl.add(mesh(sph(0.22, 8, 6), toon(['#ff9fbf', '#ffe98a', '#c9b3ff', '#ffffff'][k]), (k % 2 - 0.5) * 0.6, 0.75, (Math.floor(k / 2) - 0.5) * 0.6, false)); pl.position.set(DT.x + Math.cos(a) * 6.5, 0, DT.z + Math.sin(a) * 6.5); scene.add(pl); }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; const b = new T3.Group(); b.add(mesh(box(2.2, 0.16, 0.7), toon('#c49a6c'), 0, 0.55, 0)); b.add(mesh(box(2.2, 0.55, 0.12), toon('#c49a6c'), 0, 0.95, -0.32)); for (const s of [-0.9, 0.9]) b.add(mesh(box(0.12, 0.55, 0.55), toon('#5a5470'), s, 0.27, 0)); b.position.set(DT.x + Math.cos(a) * 8.6, 0, DT.z + Math.sin(a) * 8.6); b.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); scene.add(b); }
  }
  // streetlights around the ring
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.26, x = DT.x + Math.cos(a) * 16.3, z = DT.z + Math.sin(a) * 16.3; scene.add(mesh(cyl(0.09, 0.12, 4.2, 8), toon('#3d4f86'), x, 2.1, z)); const lm = makeToon({ color: '#fff4c4', gradientMap: gradMap, emissive: new T3.Color('#000') }); lampMats.push(lm); scene.add(mesh(sph(0.38, 12, 8), lm, x, 4.35, z, false)); }
  // buildings
  dtApartment('home2', '#d8ecff', '#6f9fd8', 9, 'Bluebell Court');
  {
    const g = new T3.Group(), stone = toon('#f4ecdc'), trim = toon('#b7a6d8'), pale = toon('#d4cbe0');
    g.add(mesh(box(10.4, 0.5, 8.8), pale, 0, 0.25, 0)); g.add(mesh(box(10.8, 0.25, 1.2), pale, 0, 0.12, 4.9));
    g.add(mesh(box(9, 6, 7), stone, 0, 3.5, -0.6));
    for (const x of [-3.6, -1.2, 1.2, 3.6]) g.add(mesh(cyl(0.34, 0.4, 5.6, 12), toon('#fffaf2'), x, 3.3, 3.6));
    g.add(mesh(box(9.6, 0.7, 1.8), trim, 0, 6.4, 3.3));
    const r = roofPrism(9.8, 9, 2.2, trim); r.position.set(0, 6.75, -0.2); g.add(r);
    g.add(mesh(box(2.1, 3.4, 0.2), toon('#6b4a3a'), 0, 2.2, 2.95));
    for (const s of [-1, 1]) g.add(mesh(box(1.4, 1.8, 0.15), toon('#bfe8ff'), s * 2.6, 3.3, 2.95));
    const sg = sign('⚖ Glimmer Hall', '#fffaf2', '#6b4a3a', 5.2); sg.position.set(0, 6.4, 4.22); g.add(sg);
    g.traverse((o) => { if (o.isMesh) { o.userData.tap = { kind: 'hall' }; tappables.push(o); } });
    placeDT(g, 'hall');
  }
  buildLabs(); buildClinic();
  dtApartment('home3', '#fff0c8', '#e2a24a', 15, 'Sunny Heights');
  dtShop('bakery', '#ffe8cc', '#c9925e', '#ffffff', '#f3b67a', '#b86b3a', '#fff6ee', (g) => { g.add(mesh(cyl(0.5, 0.5, 1.4, 12), toon('#ffffff'), 3, 7.6, 0)); for (let i = 0; i < 3; i++) g.add(mesh(sph(0.3, 10, 8), toon('#e8b878'), -3.4 + i * 0.35, 0.95, 5.1)); g.add(mesh(box(1.4, 0.8, 0.8), toon('#c49a6c'), -3.1, 0.4, 5.1)); });
  dtShop('books', '#e8dcc8', '#5f4a6b', '#ffffff', '#9a8ab8', '#5f4a6b', '#fff6ee', (g) => { g.add(mesh(box(1.6, 1.2, 0.8), toon('#8a6a4e'), 3.2, 0.6, 5.1)); for (let i = 0; i < 5; i++) g.add(mesh(box(0.22, 0.45, 0.6), toon(['#ff6f5e', '#9fd3ff', '#ffe98a', '#8fae6a', '#c9b3ff'][i]), 2.7 + i * 0.25, 1.42, 5.1)); });
  dtShop('arcade', '#3a2f63', '#ff6fb0', '#ff6fb0', '#6fe3ff', '#ff6fb0', '#1a1030', (g) => { const neon = glow('#6fe3ff', 0.9); g.add(mesh(box(8.6, 0.18, 0.18), neon, 0, 6.2, 4.1, false)); g.add(mesh(box(0.18, 5.8, 0.18), glow('#ff6fb0', 0.9), -4.4, 3.2, 4.1, false)); g.add(mesh(box(0.18, 5.8, 0.18), glow('#ff6fb0', 0.9), 4.4, 3.2, 4.1, false)); });
  dtShop('icecream', '#ffe0ee', '#ff9fbf', '#ffffff', '#ff9fbf', '#ff6f9c', '#ffffff', (g) => { const cone = mesh(new T3.ConeGeometry(0.7, 2, 12), toon('#e8b878'), 0, 8, 0); cone.rotation.x = Math.PI; g.add(cone); g.add(mesh(sph(0.85, 14, 10), toon('#ffb3c7'), 0, 9.3, 0)); g.add(mesh(sph(0.2, 8, 6), toon('#ff4f6f'), 0, 10.2, 0)); });
  // bus stop, vending machine, mailbox-y bits near the gate
  { const [x, z] = [DT_HUB[0] + 6.2, DT_HUB[1] + 6.5]; const g = new T3.Group(); for (const s of [-1.2, 1.2]) g.add(mesh(cyl(0.07, 0.07, 2.6, 6), toon('#3d4f86'), s, 1.3, 0)); g.add(mesh(box(3, 0.15, 1.4), toon('#9fd3ff'), 0, 2.65, 0)); g.add(mesh(box(2.2, 0.14, 0.5), toon('#c49a6c'), 0, 0.6, -0.3)); g.add(mesh(cyl(0.06, 0.06, 3, 6), toon('#5a5470'), 2, 1.5, 0.5)); const bs = sign('BUS', '#3d4f86', '#ffffff', 1.2); bs.position.set(2, 3.2, 0.52); g.add(bs); g.position.set(x, 0, z); g.rotation.y = -0.6; scene.add(g); }
  { const [x, z] = [DT_HUB[0] - 5.5, DT_HUB[1] + 1.5]; const g = new T3.Group(); g.add(mesh(box(1.4, 2.4, 1), toon('#ff6f5e'), 0, 1.2, 0)); g.add(mesh(box(1.1, 1.3, 0.05), glow('#dff4ff', 0.6), 0, 1.5, 0.52, false)); for (let i = 0; i < 6; i++) g.add(mesh(cyl(0.08, 0.08, 0.25, 8), toon(['#ff9fbf', '#9fe3c4', '#ffe98a'][i % 3]), -0.35 + (i % 3) * 0.35, 1.2 + Math.floor(i / 3) * 0.45, 0.5)); g.position.set(x, 0, z); g.rotation.y = 0.5; scene.add(g); }
  // trees around the edge
  if (gfxOn()) for (const a of [35, 80, 135, 175, 225, 275, 325]) { const [x, z] = polarDT(a, 28); scene.add(gfxTree(x, z, 1, a % 2 ? '#8fd48a' : '#f7b6c8')); const [cx, cz] = polarDT(a + 22, 28.6); if (freeDT(cx, cz, -1)) scene.add(gfxTree(cx, cz, 0.85, '#5fae5a', 'cedar')); }
  else for (const a of [35, 80, 135, 175, 225, 275, 325]) { const [x, z] = polarDT(a, 28); const g = new T3.Group(); g.add(mesh(cyl(0.3, 0.4, 2.4, 8), toon('#9a6f4e'), 0, 1.2, 0)); g.add(mesh(new T3.IcosahedronGeometry(1.8, 0), toon(a % 2 ? '#8fd48a' : '#f7b6c8'), 0, 3.3, 0)); g.position.set(x, 0, z); scene.add(g); }
  // a little trolley that loops the ring road
  { trolley = new T3.Group(); trolley.add(mesh(box(2.2, 1.7, 4.2), toon('#ff9fbf'), 0, 1.3, 0)); trolley.add(mesh(box(2.3, 0.3, 4.3), toon('#ffffff'), 0, 2.25, 0)); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) trolley.add(mesh(box(0.05, 0.6, 0.8), toon('#bfe8ff'), s * 1.12, 1.55, -1.2 + i * 1.2, false)); for (const s of [-1, 1]) for (const k of [-1.3, 1.3]) { const w = mesh(cyl(0.35, 0.35, 0.2, 10), toon('#2a2238'), s * 1.05, 0.35, k); w.rotation.z = Math.PI / 2; trolley.add(w); } trolley.add(mesh(cyl(0.03, 0.03, 1.4, 4), toon('#5a5470'), 0, 3.1, 0)); scene.add(trolley); }
  // pigeons!
  for (let i = 0; i < 6; i++) { const g = new T3.Group(); g.add(mesh(sph(0.22, 8, 6), toon('#a9a3c2'), 0, 0.25, 0)); g.add(mesh(sph(0.13, 8, 6), toon('#8a84a8'), 0, 0.45, 0.16)); { const bk = mesh(new T3.ConeGeometry(0.04, 0.1, 4), toon('#ffb347'), 0, 0.44, 0.3); bk.rotation.x = Math.PI / 2; g.add(bk); } const a = rand() * 6.28, r = 4 + rand() * 5; g.position.set(DT.x + Math.cos(a) * r, 0, DT.z + Math.sin(a) * r); g.userData = { hop: rand() * 6, a: rand() * 6 }; scene.add(g); pigeons.push(g); }
}
function downtownFrame(dt) {
  if (!trolley) return;
  const h = ((6 + W.t * 24) % 24);
  for (const [hh, mh] of clockHands) { hh.rotation.z = -((h % 12) / 12) * Math.PI * 2; mh.rotation.z = -((h % 1)) * Math.PI * 2; }
  trolleyA += dt * 0.12;
  trolley.position.set(DT.x + Math.cos(trolleyA) * 12.75, 0, DT.z + Math.sin(trolleyA) * 12.75);
  trolley.rotation.y = -trolleyA;
  for (const g of pigeons) { const u = g.userData; u.hop += dt; if (u.hop > 1.2 + rand()) { u.hop = 0; u.a += (rand() - 0.5) * 1.5; const nx = g.position.x + Math.cos(u.a) * 0.6, nz = g.position.z + Math.sin(u.a) * 0.6; if (Math.hypot(nx - DT.x, nz - DT.z) < 9.5 && Math.hypot(nx - DT.x, nz - DT.z) > 3.5) { g.position.x = nx; g.position.z = nz; } g.rotation.y = -u.a + Math.PI / 2; } g.position.y = u.hop < 0.25 ? Math.sin(u.hop / 0.25 * Math.PI) * 0.15 : 0; }
}
// interiors for the downtown shops
function buildShopExtra(shop, S, clerk, stock) {
  if (shop === 'arcade') {
    shell(S, '#3a2f63', null, { checker: ['#2a2148', '#3a2f63'], wainscot: '#ff6fb0', pattern: 'dots' });
    S.add(new T3.PointLight(0xff6fb0, 0.6, 12).translateX(-2).translateY(3.5));
    S.add(new T3.PointLight(0x6fe3ff, 0.6, 12).translateX(3).translateY(3.5));
    const cols = ['#ff6fb0', '#6fe3ff', '#ffd36b', '#9fe3a0', '#c9b3ff'];
    cols.forEach((c, i) => {
      const g = new T3.Group();
      g.add(mesh(box(1.2, 2.3, 1), toon(c), 0, 1.15, 0));
      const scr = mesh(box(0.9, 0.7, 0.05), glow(['#2a6fff', '#ff4f9a', '#35d07f', '#ffb020', '#8a5cff'][i], 0.9), 0, 1.75, 0.52, false); g.add(scr);
      g.add(mesh(box(1.1, 0.12, 0.5), toon('#2a2238'), 0, 1.1, 0.6)); g.add(mesh(cyl(0.05, 0.05, 0.25, 6), toon('#2a2238'), -0.25, 1.28, 0.65)); g.add(mesh(sph(0.08, 8, 6), toon('#ff4f4f'), -0.25, 1.42, 0.65));
      g.add(mesh(box(1.2, 0.3, 1), glow(c, 0.5), 0, 2.45, 0, false));
      g.position.set(-3.2 + i * 1.45, 0, -3.2);
      g.traverse((o) => (o.userData.tap = { kind: 'arcade' })); S.add(g);
    });
    S.add(mesh(box(2.4, 1.1, 1.2), toon('#ff6fb0'), 2.9, 0.55, 1.8)); S.add(mesh(box(2.5, 0.1, 1.3), toon('#ffffff'), 2.9, 1.12, 1.8));
    for (let i = 0; i < 4; i++) S.add(mesh(sph(0.2, 10, 8), toon(['#ffb3c7', '#9fd3ff', '#ffe98a', '#c9b3ff'][i]), 2.3 + i * 0.4, 1.35, 1.8));
    if (clerk) addPerson(S, clerk, 2.9, 2.8, Math.PI);
    return 'Tap a cabinet to play. Residents come here to spend a coin on games.';
  }
  if (shop === 'books') {
    shell(S, '#e8dcc8', '#8a6a4e', { wainscot: '#5f4a6b' });
    for (let i = 0; i < 4; i++) { const sh = decorMesh({ id: 'shelf', color: ['lilac', 'moss', 'navy', 'peach'][i], uid: 'b' + i }); sh.scale.set(1.2, 1.6, 1.2); sh.position.set(-3.2 + i * 1.9, 0, -3.6); const sj = ['space', 'computers', 'animals', 'stories'][i]; sh.traverse((o) => (o.userData.tap = { kind: 'shelf', subj: sj })); S.add(sh); { const lb = sign(`${SUBJECTS[sj].icon} ${SUBJECTS[sj].name}`, '#fffaf2', '#5f4a6b', 1.6); lb.position.set(-3.2 + i * 1.9, 3.3, -3.3); lb.traverse((o) => (o.userData.tap = { kind: 'shelf', subj: sj })); S.add(lb); } }
    { const ch = new T3.Group(); ch.add(mesh(box(1.3, 0.5, 1.2), toon('#b86b5a'), 0, 0.45, 0)); ch.add(mesh(box(1.3, 1.1, 0.3), toon('#b86b5a'), 0, 0.95, -0.5)); ch.position.set(-3, 0, 2.4); ch.rotation.y = 0.6; S.add(ch); }
    const slots = [[-1.2, -0.8], [0.4, -0.8], [2, -0.8], [-1.2, 1.2], [0.4, 1.2], [2, 1.2]];
    stock.slice(0, slots.length).forEach((it, i) => { const [x, z] = slots[i]; S.add(mesh(box(1.3, 0.8, 1.1), toon('#c49a6c'), x, 0.4, z)); const m = decorMesh(it); m.scale.setScalar(0.8); m.position.set(x, 0.8, z); tapBuy(m, shop, it); S.add(m); addPrice(m, `${itemPrice(it)} ✦${it.makerName ? ' · ' + it.makerName : ''}`, 1.5); });
    S.add(mesh(box(1.2, 1.1, 2.4), toon('#5f4a6b'), 3.4, 0.55, 2.6)); S.add(mesh(box(1.3, 0.1, 2.5), toon('#fff6ee'), 3.4, 1.12, 2.6));
    if (clerk) addPerson(S, clerk, 4.1, 2.6, -Math.PI / 2);
    return (clerk ? `${clerk.name} is minding the shelves.` : 'Nobody at the counter.') + ' Tap a shelf to shop by subject, or tap a book on the tables.';
  }
  // bakery and ice cream parlor share a café-style layout
  const theme = shop === 'bakery' ? { wall: '#ffe8cc', floor: '#c9925e', counter: '#b86b3a', seat: '#f3b67a', pattern: 'dots' } : { wall: '#e8f6ff', floor: null, checker: ['#ffffff', '#ffd6e6'], counter: '#ff9fbf', seat: '#9fd3ff', pattern: 'stripes' };
  shell(S, theme.wall, theme.floor, { checker: theme.checker, pattern: theme.pattern, wainscot: theme.counter });
  S.add(mesh(box(5.5, 1.1, 1.1), toon(theme.counter), 0.6, 0.55, -2.2)); S.add(mesh(box(5.6, 0.1, 1.2), toon('#fff4dc'), 0.6, 1.12, -2.2));
  S.add(mesh(box(4.8, 0.7, 0.9), new T3.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.25 }), 0.6, 1.5, -2.2, false));
  FOODS.filter((f) => f.shop === shop).forEach((f, i) => { const it = { uid: 'menu-' + f.id, kind: 'food', id: f.id }; const m = foodMesh(f.id); m.scale.setScalar(1.5); m.position.set(-1.3 + i * 1.0, 1.18, -2.2); tapBuy(m, shop, it); S.add(m); addPrice(m, `${f.price} ✦`, 0.7); });
  for (const [tx, tz] of [[-2.6, 1.6], [1.6, 2.4]]) { S.add(mesh(cyl(0.75, 0.75, 0.08, 16), toon('#fff4dc'), tx, 0.95, tz)); S.add(mesh(cyl(0.08, 0.1, 0.95, 8), toon('#5a3a2e'), tx, 0.47, tz)); for (const s of [-1, 1]) S.add(mesh(cyl(0.35, 0.35, 0.5, 12), toon(theme.seat), tx + s * 1.1, 0.25, tz)); }
  if (clerk) addPerson(S, clerk, 0.6, -3.0, 0);
  return null;
}
function makePreset(o) {
  const p = birth();
  p.name = W.people.some((q) => q.name === o.name) ? o.name + '2' : o.name;
  Object.assign(p.body, o.body || {});
  if (o.shirt) { p.outfit.shirt = o.shirt; p.wardrobe.shirts = [o.shirt]; p.likes[o.shirt] = 0.7; }
  if (o.hat) { p.outfit.hat = o.hat; p.wardrobe.hats = [o.hat]; p.likes['hat:' + o.hat.id] = 0.8; }
  Object.assign(p, { style: o.style, interests: o.interests, lines: o.lines, selfNote: o.selfNote, want: { text: o.want }, custom: true });
  if (o.job) p.job = o.job;
  if (o.tastes) p.tastes = o.tastes;
  return p;
}
const PRESETS = {
  tim: () => makePreset({
    name: 'Tim', shirt: 'moss', hat: { id: 'cap', color: 'navy' }, job: 'books',
    body: { hue: 150, ears: 'round', size: 1.0, speed: 1.0, eyeGap: 0.36, openness: 0.6, voice: { base: 150, spread: 0.28, wave: 'square', len: 0.06 } },
    style: 'Somewhat reserved and a little awkward, but pretty direct when he does talk. Relaxed about most things. Every so often he gets suddenly, weirdly expressive. His humor and personality are offbeat and a bit strange, and he knows it.',
    interests: 'odd little observations, deadpan bits, and whatever weird thing just caught his attention',
    lines: ['…Hi.', "I'm just gonna say it.", "That's weird. I like it.", 'Cool. Cool cool cool.', 'Why is that pigeon looking at me.', 'Okay, honestly? No.', "I don't know, I think it's funny.", 'WAIT. Okay. Never mind.'],
    selfNote: "Uhh, I'm somewhat reserved. Awkward, expressive at times. Pretty direct, pretty relaxed. I think I'm weird, with my humor and personality. That's fine.",
    want: 'to find people who get his weird sense of humor',
  }),
};
function addPresetIfMissing(key) {
  if (ISLE !== 'isle1' || (W.added && W.added[key])) return;
  if (freeRoom() < 0) { toast(`${cap(key)} wants to move in, but every room is full.`); return; }
  const p = PRESETS[key](); p.inside = false; p.task = null; p.at = 'pier'; p.x = 0; p.z = 39.5;
  W.people.push(p); buildKin(p);
  W.added = { ...(W.added || {}), [key]: true };
  remember(p, `I just moved into room ${p.room + 1}.`, 3, 'arrived');
  diary(`<b>${esc(p.name)}</b> stepped off the ferry and moved into room ${p.room + 1}.`);
  for (const q of W.people) if (q !== p && rand() < 0.5) remember(q, `Someone new moved in. Their name is ${p.name}.`, 1, 'newcomer', p.name);
  ferryAnim = { kind: 'arrive', start: now }; Sound.horn();
  markDirty();
}

