// ============================================================
// 3D ENGINE
// ============================================================
const T3 = window.THREE;
if (!T3) { $('#loading').textContent = "Couldn't load the 3D engine. Check your connection and reload."; return; }
{ let gp = null; try { gp = JSON.parse(localStorage.getItem(SAVE_KEY + '-prefs') || '{}').gfx; } catch (e) {}
  if (gp !== 'classic') { T3.ColorManagement.legacyMode = false; const CT = T3.CanvasTexture; T3.CanvasTexture = class extends CT { constructor(...a) { super(...a); this.encoding = T3.sRGBEncoding; } }; } }
const stage = $('#stage');
let renderer, scene, camera, controls, roomScene, roomCam, roomControls;
const gradMap = new T3.DataTexture(new Uint8Array([126, 126, 126, 255, 192, 192, 192, 255, 240, 240, 240, 255]), 3, 1, T3.RGBAFormat);
gradMap.minFilter = gradMap.magFilter = T3.NearestFilter; gradMap.needsUpdate = true;
const matCache = new Map();
function toon(color, extra) {
  if (!extra && matCache.has(color)) return matCache.get(color);
  const m = makeToon({ color, gradientMap: gradMap, ...(extra || {}) });
  if (!extra) matCache.set(color, m);
  return m;
}
function mesh(geo, mat, x = 0, y = 0, z = 0, cast = true) { const m = new T3.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; return m; }
const box = (w, h, d) => roundBox(w, h, d);
const cyl = (rt, rb, h, s = 24) => new T3.CylinderGeometry(rt, rb, h, s);
const sph = (r, w = 20, h = 14) => new T3.SphereGeometry(r, w, h);
const glow = (color, strength = 0.9) => makeToon({ color, gradientMap: gradMap, emissive: new T3.Color(color).multiplyScalar(strength) });

function signTexture(text, bg, fg) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.beginPath(); g.moveTo(50, 0); g.arcTo(640, 0, 640, 160, 50); g.arcTo(640, 160, 0, 160, 50); g.arcTo(0, 160, 0, 0, 50); g.arcTo(0, 0, 640, 0, 50); g.fill();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = 78; const setF = () => (g.font = `${fs}px "Mochiy Pop One", "Arial Rounded MT Bold", sans-serif`); setF();
  while (g.measureText(text).width > 580 && fs > 24) { fs -= 4; setF(); }
  g.fillText(text, 320, 86);
  const t = new T3.CanvasTexture(c); t.anisotropy = 4; return t;
}
function sign(text, bg, fg, w = 5) { return mesh(new T3.PlaneGeometry(w, w / 4), new T3.MeshBasicMaterial({ map: signTexture(text, bg, fg), transparent: true, toneMapped: false }), 0, 0, 0, false); }
function roofPrism(w, d, h, mat) {
  const s = new T3.Shape(); s.moveTo(-w / 2, 0); s.lineTo(0, h); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0);
  if (gfxOn()) return chunkyRoof(w, d, h, mat);
  const g = new T3.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return mesh(g, mat);
}
function awning(w, a, b, y, z) {
  const g = new T3.Group(), n = 9, sw = w / n;
  for (let i = 0; i < n; i++) { const s = mesh(box(sw, 0.1, 1.8), toon(i % 2 ? a : b), -w / 2 + sw / 2 + i * sw, 0, 0); s.rotation.x = 0.38; g.add(s); }
  g.position.set(0, y, z); return g;
}
const tappables = []; // meshes you can tap in town: windows and shops
function placeB(g, key) { gfxContact(g); const b = BLD[key]; const [x, z] = polar(b.a, b.r); g.position.set(x, 0, z); g.rotation.y = Math.atan2(-x, -z); scene.add(g); }

const windowMats = [], lampMats = [], lanternMats = [];
let mailFlag = null;
let hemi, sun, nightLight, stars, sea, foam, rain, rainGeo, jets = [], bushBerries = [], clouds = [], projectGroup;
const RAIN_N = 800;
const skyDay = new T3.Color('#9ad8ff'), skyDusk = new T3.Color('#f3b6a8'), skyNight = new T3.Color('#0d1330'), black = new T3.Color('#000000'), grey = new T3.Color('#8e9bb3'), white = new T3.Color('#ffffff');

function buildTown() {
  renderer = new T3.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T3.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);
  gfxRenderer();
  scene = new T3.Scene();
  camera = new T3.PerspectiveCamera(38, 1, gfxOn() ? 1 : 0.5, 500);
  controls = new T3.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 4); controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 10; controls.maxDistance = 190; controls.maxPolarAngle = 1.38; controls.minPolarAngle = 0.2;
  controls.autoRotateSpeed = 0.3; controls.enablePan = true; controls.screenSpacePanning = false; controls.panSpeed = 1.2;

  hemi = new T3.HemisphereLight(0xdff1ff, 0x9bbf7a, 0.5); scene.add(hemi);
  sun = new T3.DirectionalLight(0xfff1d8, 0.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -75, right: 75, top: 75, bottom: -75, near: 1, far: 260 }); sun.target.position.set(0, 0, -24); sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);
  nightLight = new T3.AmbientLight(0x6a78c8, 0); scene.add(nightLight);
  gfxLights();
  scene.background = skyDay.clone();
  { const pos = []; for (let i = 0; i < 600; i++) { const th = rand() * 6.28, ph = rand() * 1.2, r = 220; pos.push(Math.cos(th) * Math.sin(ph) * r, Math.cos(ph) * r * 0.9 + 10, Math.sin(th) * Math.sin(ph) * r); }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3));
    stars = new T3.Points(g, softPoints({ color: 0xffffff, size: 1.3, transparent: true, opacity: 0, depthWrite: false })); scene.add(stars); }

  if (gfxOn()) {
    sea = mesh(new T3.PlaneGeometry(1, 1), toon('#6ccff2'), 0, -60, 0, false); sea.visible = false;
    foam = mesh(new T3.PlaneGeometry(1, 1), new T3.MeshBasicMaterial({ transparent: true }), 0, -60, 0, false); foam.visible = false;
    buildSky(); buildWater(); scene.add(islandPiece(0, 0, 30, grassMat()));
  } else {
    sea = mesh(new T3.CircleGeometry(220, 64), toon('#6ccff2'), 0, -0.9, 0, false); sea.rotation.x = -Math.PI / 2; scene.add(sea);
    foam = mesh(new T3.RingGeometry(31.4, 32.8, 72), new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }), 0, -0.85, 0, false); foam.rotation.x = -Math.PI / 2; scene.add(foam);
    scene.add(mesh(cyl(30, 28.5, 2.4, 72), [toon('#c9a27a'), toon(ISL.grass), toon('#8a6a4e')], 0, -1.2, 0, false));
    scene.add(mesh(cyl(31.4, 31.8, 0.4, 72), toon('#f3dfb0'), 0, -0.35, 0, false));
  }
  const plazaMat = pathMat();
  scene.add(mesh(cyl(12.2, 12.2, 0.08, 64), plazaMat, 0, 0.04, 0, false));
  const pathTo = ([x, z]) => { const len = Math.hypot(x, z), m = mesh(box(2.8, 0.07, len), plazaMat, x / 2, 0.035, z / 2, false); m.rotation.y = Math.atan2(x, z); scene.add(m); };
  for (const k of ['home', 'clothes', 'nook', 'cafe', 'mart', 'garden', 'park']) pathTo(TOWN[k].spot);
  pathTo([0, 29]);

  // fountain
  const stone = toon('#d4cbe0'), water = toon('#8fd8ff', { emissive: new T3.Color('#1a4a66') });
  scene.add(mesh(cyl(3.2, 3.4, 0.7), stone, 0, 0.35, 0));
  scene.add(mesh(cyl(2.85, 2.85, 0.1), water, 0, 0.68, 0, false));
  scene.add(mesh(cyl(0.4, 0.5, 2.2), stone, 0, 1.6, 0));
  scene.add(mesh(cyl(1.3, 0.7, 0.4), stone, 0, 2.8, 0));
  for (let i = 0; i < 12; i++) { const d = mesh(sph(0.13, 8, 6), water, 0, 0, 0, false); scene.add(d); jets.push(d); }

  // apartments: much taller than the residents
  {
    const g = new T3.Group();
    g.add(mesh(box(16, 15.6, 9), gfxOn() ? detailMat('plaster', '#f7d9e3', gfxTextures().plaster, [3, 3]) : toon('#f7d9e3'), 0, 7.8, 0));
    g.add(mesh(box(16.8, 0.6, 9.8), toon('#b58bb6'), 0, 15.9, 0));
    g.add(mesh(box(16.4, 0.35, 9.4), toon('#e6bfd0'), 0, 4.5, 0));
    g.add(mesh(cyl(1.2, 1.2, 1.8, 16), toon('#9fd3ff'), 5, 17, -1.5));
    g.add(mesh(box(1.2, 1.4, 1.2), toon('#e6bfd0'), -5.5, 16.8, 1));
    g.add(mesh(box(2.4, 3.3, 0.3), toon('#7a5a8c'), 0, 1.65, 4.52));
    g.add(mesh(box(3.6, 0.25, 1.8), toon('#b58bb6'), 0, 3.7, 5.3));
    for (const s of [-1, 1]) g.add(mesh(box(1.6, 2.2, 0.15), toon('#bfe8ff'), s * 4.5, 1.9, 4.52, false));
    const sg = sign(ISL.apt, '#fff4f8', '#8a5a9c', 6.5); sg.position.set(0, 4.2, 4.58); g.add(sg);
    const xs = [-5, 0, 5], ys = [6.5, 10, 13.5];
    for (let f = 0; f < 3; f++) for (let c = 0; c < 3; c++) {
      const i = f * 3 + c;
      const m = makeToon({ color: '#3a3f66', gradientMap: gradMap, emissive: new T3.Color('#000000') });
      windowMats.push(m);
      g.add(mesh(box(2.6, 2.3, 0.14), toon('#fff4f8'), xs[c], ys[f], 4.5, false));
      const w = mesh(box(2.2, 1.9, 0.16), m, xs[c], ys[f], 4.53, false); w.userData.tap = { kind: 'room', room: i }; tappables.push(w); g.add(w);
      g.add(mesh(box(2.9, 0.18, 1.0), toon('#b58bb6'), xs[c], ys[f] - 1.35, 4.95));
      for (let k = -1; k <= 1; k++) g.add(mesh(box(0.08, 0.6, 0.08), toon('#b58bb6'), xs[c] + k * 1.3, ys[f] - 1.0, 5.4, false));
      const plate = sign(String(i + 1), '#8a5a9c', '#ffffff', 1.1); plate.position.set(xs[c], ys[f] + 1.45, 4.53); g.add(plate);
    }
    placeB(g, 'home');
    buildDowntown();
    const mb = new T3.Group(), [mx, mz] = polar(0, 27 - 4.5 - 1.2);
    mb.add(mesh(cyl(0.08, 0.1, 1.2, 8), toon('#5a5470'), 0, 0.6, 0));
    const bx = mesh(box(0.7, 0.55, 0.9), toon('#6f9fd8'), 0, 1.4, 0); mb.add(bx);
    { const top = mesh(new T3.CylinderGeometry(0.35, 0.35, 0.9, 12, 1, false, 0, Math.PI), toon('#6f9fd8'), 0, 1.66, 0); top.rotation.x = Math.PI / 2; top.rotation.z = Math.PI / 2; mb.add(top); }
    mailFlag = mesh(box(0.06, 0.5, 0.25), toon('#ff6f5e'), 0.4, 1.7, 0.1); mb.add(mailFlag);
    mb.traverse((o) => (o.userData.tap = { kind: 'mail' })); tappables.push(bx);
    mb.position.set(mx + 3.2, 0, mz + 0.6); mb.rotation.y = Math.PI / 2; scene.add(mb);
  }
  // shops
  const shop = (key, wall, roof, awA, awB, sgBg, sgFg, extra) => {
    const g = new T3.Group();
    const body = mesh(box(9.5, 6.6, 8), wallMat(wall), 0, 3.3, 0); gfxShopDeco(g, 9.5, 8, wall); body.userData.tap = { kind: 'shop', shop: key }; tappables.push(body); g.add(body);
    const r = roofPrism(10.2, 8.8, 3.2, toon(roof)); r.position.y = 6.6; g.add(r);
    const door = mesh(box(2.1, 3.3, 0.25), toon('#6b4a3a'), 0, 1.65, 4.05); door.userData.tap = { kind: 'shop', shop: key }; tappables.push(door); g.add(door);
    for (const s of [-1, 1]) { g.add(mesh(box(2.2, 1.8, 0.18), toon('#bfe8ff'), s * 3.1, 2.6, 4.05)); gfxWindowBox(g, s * 3.1, 2.6, 4.05); }
    g.add(awning(9.8, awA, awB, 4.55, 4.6));
    const sg = sign(SHOPS[key].name, sgBg, sgFg, 6.2); sg.position.set(0, 5.95, 4.1); g.add(sg);
    if (extra) extra(g);
    placeB(g, key);
  };
  shop('mart', '#fff1c9', '#e2766b', '#ffffff', '#ff8fa3', '#e2566b', '#fff6ee', (g) => {
    for (let i = 0; i < 4; i++) { const x = [-3.6, -2.4, 2.4, 3.6][i]; g.add(mesh(box(1.1, 0.7, 0.9), toon('#c49a6c'), x, 0.35, 5)); for (let k = 0; k < 3; k++) g.add(mesh(sph(0.2, 8, 6), toon(['#ff6f5e', '#ffd36b', '#9fe3a0', '#ff9fbf'][i]), x - 0.3 + k * 0.3, 0.82, 5, false)); }
  });
  shop('clothes', '#e4dcff', '#6f73c9', '#ffffff', '#b8a6ff', '#6f73c9', '#ffffff', (g) => {
    for (const sx of [-3.4, 3.4]) { const mq = new T3.Group(); mq.add(mesh(cyl(0.06, 0.06, 1.3, 6), toon('#6b4a3a'), 0, 0.65, 0)); mq.add(mesh(cyl(0.45, 0.55, 1.0, 12), toon(sx < 0 ? '#ff9fbf' : '#9fe3c4'), 0, 1.7, 0)); mq.add(mesh(sph(0.3, 10, 8), toon('#fff4dc'), 0, 2.45, 0)); mq.position.set(sx, 0, 5.2); g.add(mq); }
  });
  shop('nook', '#d8f0d0', '#8a6a4e', '#fff4dc', '#9fc98a', '#5f7f4a', '#fffbe8', (g) => {
    g.add(mesh(box(1, 2.4, 1), toon('#b98a6a'), 3, 8.4, -1.5));
    const rw = mesh(new T3.CircleGeometry(0.9, 20), toon('#bfe8ff'), 0, 8.1, 4.42, false); g.add(rw);
    g.add(mesh(box(1.6, 1.2, 1.2), toon('#c49a6c'), -3.6, 0.6, 5.2)); g.add(mesh(sph(0.5, 10, 8), toon('#ff9fbf'), -3.6, 1.6, 5.2));
  });
  // café with outdoor seats
  {
    const g = new T3.Group();
    const body = mesh(box(9, 6.2, 8), wallMat('#f6c7a6'), 0, 3.1, 0); gfxShopDeco(g, 9, 8, '#f6c7a6'); body.userData.tap = { kind: 'shop', shop: 'cafe' }; tappables.push(body); g.add(body);
    const r = roofPrism(9.6, 8.8, 2.8, toon('#9b5c4a')); r.position.y = 6.2; g.add(r);
    const door = mesh(box(2.1, 3.3, 0.25), toon('#5a3a2e'), 0, 1.65, 4.05); door.userData.tap = { kind: 'shop', shop: 'cafe' }; tappables.push(door); g.add(door);
    g.add(mesh(box(5, 1.6, 0.18), toon('#ffe6b0'), 0, 3.6, 4.05));
    g.add(mesh(cyl(0.45, 0.45, 1.4, 12), toon('#ffffff'), 3, 7.6, 0));
    g.add(awning(9.4, '#fff4dc', '#9b5c4a', 4.8, 4.6));
    const sg = sign('Moonbean Café', '#5a3a2e', '#ffe6b0', 6); sg.position.set(0, 6.0, 4.1); g.add(sg);
    placeB(g, 'cafe');
    for (let t = 0; t < 2; t++) {
      const [ax, az] = CAFE_SEATS[t * 2], [bx, bz] = CAFE_SEATS[t * 2 + 1];
      const tx = (ax + bx) / 2, tz = (az + bz) / 2;
      scene.add(mesh(cyl(0.8, 0.8, 0.08, 16), toon('#ffffff'), tx, 1.0, tz));
      scene.add(mesh(cyl(0.08, 0.08, 1.0, 8), toon('#9b5c4a'), tx, 0.5, tz));
      scene.add(mesh(new T3.ConeGeometry(1.8, 0.7, 8), toon(t ? '#ff9fbf' : '#9fd3ff'), tx, 3.3, tz));
      scene.add(mesh(cyl(0.05, 0.05, 2.4, 6), toon('#ffffff'), tx, 2.1, tz));
      for (const [sx, sz] of [[ax, az], [bx, bz]]) scene.add(mesh(cyl(0.38, 0.38, 0.45, 12), toon('#9b5c4a'), sx, 0.22, sz));
    }
  }
  // garden
  {
    const g = new T3.Group();
    for (let i = 0; i < 3; i++) {
      g.add(mesh(box(8, 0.35, 1.5), toon('#8a6a4e'), 0, 0.17, -2.4 + i * 2.4));
      for (let k = 0; k < 7; k++) { g.add(mesh(new T3.ConeGeometry(0.26, 0.7, 6), toon(['#7cc86a', '#9fe3a0', '#5fae5a'][i]), -3.2 + k * 1.07, 0.65, -2.4 + i * 2.4)); if (i === 1) g.add(mesh(sph(0.2, 8, 6), toon('#ff6f5e'), -3.2 + k * 1.07, 0.35, -2.1)); }
    }
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; g.add(mesh(box(0.16, 0.9, 0.16), toon('#fff4dc'), Math.cos(a) * 5.6, 0.45, Math.sin(a) * 4.8)); }
    const [x, z] = polar(158, 22); g.position.set(x, 0, z); g.rotation.y = Math.atan2(-x, -z); scene.add(g);
    g.traverse((o) => { if (o.isMesh) { o.userData.tap = { kind: 'tgarden' }; tappables.push(o); } });
  }
  // Seashell Beach
  {
    const [bx, bz] = BEACH, sand = toon('#f3dfb0'), g = new T3.Group();
    if (gfxOn()) g.add(sandPiece(0, 0, BEACH_R)); else { const disc = mesh(cyl(BEACH_R, BEACH_R + 0.8, 0.9, 40), sand, 0, -0.4, 0, false); disc.receiveShadow = true; g.add(disc); }
    const wet = mesh(new T3.RingGeometry(BEACH_R + 0.6, BEACH_R + 1.6, 40), new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }), 0, -0.82, 0, false); wet.rotation.x = -Math.PI / 2; if (!gfxOn()) g.add(wet);
    for (const [a, r, c] of [[0.4, 4.5, '#ff9fbf'], [2.1, 3.8, '#9fd3ff']]) { const tw = mesh(box(1.1, 0.04, 2), toon(c), Math.cos(a) * r, 0.07, Math.sin(a) * r, false); tw.rotation.y = a; g.add(tw); }
    g.add(mesh(cyl(0.05, 0.05, 2.6, 6), toon('#fff4dc'), 3.6, 1.3, 1.8)); g.add(mesh(new T3.ConeGeometry(1.5, 0.6, 12), toon('#ffe98a'), 3.6, 2.7, 1.8));
    const castle = new T3.Group(); castle.add(mesh(box(1.2, 0.5, 1.2), toon('#e8cf9a'), 0, 0.25, 0)); for (const [cx, cz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) { castle.add(mesh(cyl(0.2, 0.22, 0.8, 8), toon('#e8cf9a'), cx, 0.4, cz)); castle.add(mesh(new T3.ConeGeometry(0.22, 0.3, 8), toon('#e8cf9a'), cx, 0.95, cz)); } castle.add(mesh(new T3.ConeGeometry(0.06, 0.3, 4), toon('#ff6f5e'), 0.5, 1.2, 0.5)); castle.position.set(-2.5, 0, -1.5); g.add(castle);
    const log = mesh(cyl(0.25, 0.3, 2.6, 8), toon('#bfa27a'), -1, 0.25, 4.5); log.rotation.z = Math.PI / 2; log.rotation.y = 0.6; g.add(log);
    for (let i = 0; i < 5; i++) { const a = rand() * 6.28, r = BEACH_R - 1 + rand(); g.add(mesh(new T3.DodecahedronGeometry(0.35 + rand() * 0.3, 0), toon('#a9a3c2'), Math.cos(a) * r, 0.1, Math.sin(a) * r)); }
    const sign = mesh(box(1.8, 0.7, 0.08), toon('#fff4dc'), 0, 1.0, 0); const tx = document.createElement('canvas'); tx.width = 256; tx.height = 96; const c2 = tx.getContext('2d'); c2.fillStyle = '#fff4dc'; c2.fillRect(0, 0, 256, 96); c2.fillStyle = '#6b4a3a'; c2.font = '26px "Mochiy Pop One", sans-serif'; c2.textAlign = 'center'; c2.fillText('Seashell', 128, 42); c2.fillText('Beach', 128, 80);
    const face = mesh(new T3.PlaneGeometry(1.74, 0.64), new T3.MeshBasicMaterial({ map: new T3.CanvasTexture(tx) }), 0, 1.0, 0.045, false); const sg = new T3.Group(); sg.add(sign, face, mesh(cyl(0.05, 0.05, 1, 5), toon('#8a6a4e'), 0, 0.4, -0.02));
    const [sx, sz] = polar(222, 30.5); sg.position.set(sx - bx, 0, sz - bz); sg.rotation.y = Math.atan2(sx, sz) + Math.PI; g.add(sg);
    g.position.set(bx, 0, bz); scene.add(g);
  }
  // pier
  {
    const wood = gfxOn() ? worldMat('plank', '#d6ab78', gfxTextures().plank, 0.42, 0.72, 1.08, 0.04) : toon('#c49a6c'), dark = toon('#8a6a4e');
    scene.add(mesh(box(3, 0.28, 12), wood, 0, 0.14, 34.5));
    for (let i = 0; i < 7; i++) for (const s of [-1, 1]) scene.add(mesh(cyl(0.18, 0.18, 1.8, 8), dark, s * 1.45, -0.6, 29 + i * 1.9));
    const end = mesh(box(5, 0.28, 3), wood, 0, 0.14, 41); end.userData.tap = { kind: 'fish' }; tappables.push(end); scene.add(end);
    const bucket = mesh(cyl(0.32, 0.26, 0.5, 12), toon('#7fa7c9'), 1.8, 0.53, 41.9); bucket.userData.tap = { kind: 'fish' }; tappables.push(bucket); scene.add(bucket);
    const rod = mesh(cyl(0.03, 0.03, 2.6, 6), dark, 2.05, 1.4, 42.1); rod.rotation.x = 0.5; rod.userData.tap = { kind: 'fish' }; tappables.push(rod); scene.add(rod);
  }
  // park with the big tree
  {
    const [x, z] = polar(252, 23.5);
    const g = new T3.Group();
    if (gfxOn()) treeParts(g, 1.8, '#7cc86a', 'treeA');
    else { g.add(mesh(cyl(0.7, 1.0, 5, 10), toon('#9a6f4e'), 0, 2.5, 0));
    g.add(mesh(new T3.IcosahedronGeometry(3.4, 0), toon('#7cc86a'), 0, 6.4, 0));
    g.add(mesh(new T3.IcosahedronGeometry(2.4, 0), toon('#8fd48a'), 1.8, 7.8, 0.6)); }
    g.add(mesh(box(4.5, 0.3, 0.6), toon('#9a6f4e'), 1.6, 4.9, 0)); // branch for the swing
    g.position.set(x, 0, z); scene.add(g);
  }
  // trees, bushes, benches, lamps
  const tree = (x, z, s = 1, col = '#8fd48a') => {
    const g = new T3.Group();
    if (gfxOn()) treeParts(g, s, col, (Math.round(x * 7 + z * 13) & 1) ? 'treeA' : 'treeB');
    else { g.add(mesh(cyl(0.3 * s, 0.4 * s, 2.4 * s, 8), toon('#9a6f4e'), 0, 1.2 * s, 0));
    g.add(mesh(new T3.IcosahedronGeometry(1.8 * s, 0), toon(col), 0, 3.3 * s, 0));
    g.add(mesh(new T3.IcosahedronGeometry(1.2 * s, 0), toon(col), 0.7 * s, 4.3 * s, 0.3 * s)); }
    g.position.set(x, 0, z); g.rotation.y = rand() * 6; scene.add(g);
    const tid = 'tree' + Math.round(x * 10) + '_' + Math.round(z * 10); g.traverse((o) => (o.userData.tap = { kind: 'tree', id: tid, x, z })); g.children.forEach((c) => tappables.push(c));
  };
  for (const [a, r, s, c] of [[30, 27, 1.1], [90, 26.5, 1], [138, 27, 1, '#f7b6c8'], [172, 25, 0.9, '#b8e39a'], [190, 25.5, 0.9, '#b8e39a'], [235, 27, 1.1, '#f7b6c8'], [275, 26, 1], [330, 27, 1.1], [18, 20, 0.8, '#b8e39a'], [345, 20, 0.8], [265, 18, 0.9, '#f7b6c8']]) { const [x, z] = polar(a, r); tree(x, z, s, c); }
  bushBerries = BUSHES.map(([x, z]) => {
    if (gfxOn()) scene.add(propAt('bushA', { leaf: '#6fbf6a' }, x, z, 1.05, x * 3)); else scene.add(mesh(sph(1.0, 12, 8), toon('#6fbf6a'), x, 0.7, z));
    const bs = []; for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4; const b = mesh(sph(0.18, 8, 6), toon('#ff5f8f', { emissive: new T3.Color('#3a0a18') }), x + Math.cos(a) * (gfxOn() ? 1.02 : 0.75), gfxOn() ? 0.92 : 1.0, z + Math.sin(a) * (gfxOn() ? 1.02 : 0.75), false); scene.add(b); bs.push(b); }
    return bs;
  });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4, g = new T3.Group();
    g.add(mesh(box(2.2, 0.16, 0.7), toon('#c49a6c'), 0, 0.55, 0)); g.add(mesh(box(2.2, 0.55, 0.12), toon('#c49a6c'), 0, 0.95, -0.32));
    for (const s of [-0.9, 0.9]) g.add(mesh(box(0.12, 0.55, 0.55), toon('#8a6a4e'), s, 0.27, 0));
    g.position.set(Math.cos(a) * 9.3, 0, Math.sin(a) * 9.3); g.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); scene.add(g);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2, x = Math.cos(a) * 12.8, z = Math.sin(a) * 12.8;
    scene.add(mesh(cyl(0.09, 0.12, 3.8, 8), toon('#5a5470'), x, 1.9, z));
    const lm = makeToon({ color: '#fff4c4', gradientMap: gradMap, emissive: new T3.Color('#000') }); lampMats.push(lm);
    scene.add(mesh(sph(0.36, 12, 8), lm, x, 3.95, z, false));
  }
  if (gfxOn()) gfxClouds();
  else for (let i = 0; i < 6; i++) {
    const g = new T3.Group(), m = makeToon({ color: '#ffffff', gradientMap: gradMap, transparent: true, opacity: 0.95 });
    for (let k = 0; k < 4; k++) g.add(mesh(sph(1.6 + rand(), 12, 8), m, k * 1.7 - 2.5, rand() * 0.7, rand() - 0.5, false));
    g.userData = { r: 44 + rand() * 22, a: rand() * 6.28, s: 0.015 + rand() * 0.02, y: 24 + rand() * 8, m }; scene.add(g); clouds.push(g);
  }
  rainGeo = new T3.BufferGeometry(); rainGeo.setAttribute('position', new T3.Float32BufferAttribute(new Float32Array(RAIN_N * 3), 3));
  { const a = rainGeo.attributes.position.array; for (let i = 0; i < RAIN_N; i++) { a[i * 3] = (rand() - 0.5) * 80; a[i * 3 + 1] = rand() * 36; a[i * 3 + 2] = (rand() - 0.5) * 80; } }
  rain = new T3.Points(rainGeo, softPoints({ color: 0xcfe6ff, size: 0.2, transparent: true, opacity: 0.7, depthWrite: false })); scene.add(rain);
  projectGroup = new T3.Group(); scene.add(projectGroup);

  // room interior scene
  roomScene = new T3.Scene();
  roomCam = new T3.PerspectiveCamera(40, 1, 0.1, 100);
  roomCam.position.set(7.5, 7, 9);
  roomControls = new T3.OrbitControls(roomCam, renderer.domElement);
  roomControls.target.set(0, 1.4, 0); roomControls.enableDamping = true; roomControls.enablePan = false;
  roomControls.minDistance = 6; roomControls.maxDistance = 18; roomControls.maxPolarAngle = 1.35; roomControls.minAzimuthAngle = -0.2; roomControls.maxAzimuthAngle = 1.75;
  roomControls.enabled = false;
}

// projects that the town builds together
function buildProjects() {
  if (!projectGroup) return;
  while (projectGroup.children.length) projectGroup.remove(projectGroup.children[0]);
  lanternMats.length = 0;
  const B = W.built;
  if (B.flowers) for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const z = 24 + i * 1.1; projectGroup.add(mesh(box(1.2, 0.3, 0.9), toon('#8a6a4e'), s * 2.8, 0.15, z)); for (let k = 0; k < 3; k++) projectGroup.add(mesh(sph(0.2, 8, 6), toon(pick(['#ff9fbf', '#ffe98a', '#c9b3ff', '#ffffff'])), s * 2.8 - 0.35 + k * 0.35, 0.5, z, false)); }
  if (B.swing) { const [x, z] = polar(252, 23.5); for (const s of [-0.6, 0.6]) projectGroup.add(mesh(cyl(0.03, 0.03, 3.1, 6), toon('#fff4dc'), x + 2.6 + s, 3.3, z, false)); projectGroup.add(mesh(box(1.5, 0.12, 0.6), toon('#ff9fbf'), x + 2.6, 1.75, z)); }
  if (B.lanterns) for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, m = glow(pick(['#ffb3c7', '#ffe29a', '#c9b3ff', '#9fe3c4']), 0); lanternMats.push(m); projectGroup.add(mesh(sph(0.35, 10, 8), m, Math.cos(a) * 12.4, 4.4 + Math.sin(i * 1.3) * 0.2, Math.sin(a) * 12.4, false)); }
  if (B.telescope) { projectGroup.add(mesh(cyl(0.06, 0.08, 1.4, 6), toon('#5a5470'), 1.8, 1, 41)); const t = mesh(cyl(0.18, 0.25, 1.6, 12), toon('#c9b3ff'), 1.8, 1.9, 41.2); t.rotation.x = -0.8; projectGroup.add(t); }
  if (B.lighthouse) { for (let i = 0; i < 6; i++) projectGroup.add(mesh(cyl(0.9 - i * 0.07, 0.95 - i * 0.07, 1.1, 16), toon(i % 2 ? '#ff6f5e' : '#ffffff'), -1.8, 0.7 + i * 1.1, 41.4)); const l = glow('#fff2b0', 0); lanternMats.push(l); projectGroup.add(mesh(sph(0.6, 12, 8), l, -1.8, 7.4, 41.4, false)); }
  if (B.computer) { for (let i = tappables.length - 1; i >= 0; i--) if (tappables[i].userData.tap?.kind === 'pc') tappables.splice(i, 1); projectGroup.add(pcMesh()); }
  if (B.statue) { const [x, z] = polar(252, 15.5), col = COLORS[B.statue.color] || COLORS.lemon; projectGroup.add(mesh(cyl(1.3, 1.5, 1.2, 16), toon('#d4cbe0'), x, 0.6, z)); projectGroup.add(mesh(new T3.CapsuleGeometry(0.8, 1.4, 6, 14), toon(col), x, 2.7, z)); const star = mesh(new T3.OctahedronGeometry(0.9, 0), glow(col, 0.35), x, 4.7, z); star.userData.spin = true; projectGroup.add(star); }
}

