// ============================================================
// INTERIORS: apartments and shops you can look inside
// ============================================================
let interior = null, ilabels = [];
const itags = $('#itags');
function disposeTree(o) {
  const cached = new Set(matCache.values());
  o.traverse((c) => { if (c.geometry) c.geometry.dispose(); if (c.material) (Array.isArray(c.material) ? c.material : [c.material]).forEach((m) => { if (!cached.has(m)) { if (m.map) m.map.dispose(); m.dispose(); } }); });
}
function decorMesh(it) {
  if (DECOR[it.id]?.parts) return partsMesh(DECOR[it.id].parts);
  if (it.kind === 'book') return bookMesh(it);
  if (it.id === 'laptop') return laptopMesh(COLORS[it.color]);
  const c = COLORS[it.color] || '#ffffff', g = new T3.Group();
  switch (it.id) {
    case 'lamp': g.add(mesh(cyl(0.3, 0.35, 0.12, 12), toon('#5a5470'), 0, 0.06, 0)); g.add(mesh(cyl(0.05, 0.05, 1.6, 8), toon('#5a5470'), 0, 0.85, 0)); g.add(mesh(new T3.ConeGeometry(0.45, 0.5, 14, 1, true), toon(c), 0, 1.75, 0)); g.userData.lamp = c; break;
    case 'rug': { g.add(mesh(cyl(1.4, 1.4, 0.04, 28), toon(c), 0, 0.03, 0, false)); const ring = mesh(new T3.TorusGeometry(1.1, 0.05, 4, 28), toon('#ffffff'), 0, 0.06, 0, false); ring.rotation.x = Math.PI / 2; g.add(ring); break; }
    case 'plant': g.add(mesh(cyl(0.3, 0.22, 0.45, 12), toon(c), 0, 0.22, 0)); g.add(mesh(new T3.IcosahedronGeometry(0.45, 0), toon('#6fbf6a'), 0, 0.75, 0)); break;
    case 'bouquet': g.add(mesh(cyl(0.12, 0.16, 0.35, 10), toon(c), 0, 0.17, 0)); for (let i = 0; i < 5; i++) g.add(mesh(sph(0.1, 8, 6), toon(['#ff9fbf', '#ffe98a', '#ffffff', c, '#c9b3ff'][i]), Math.cos(i * 1.3) * 0.12, 0.45 + (i % 2) * 0.08, Math.sin(i * 1.3) * 0.12)); break;
    case 'beanbag': { const b = mesh(sph(0.6, 16, 12), toon(c), 0, 0.38, 0); b.scale.set(1, 0.65, 1); g.add(b); break; }
    case 'shelf': g.add(mesh(box(1.4, 1.8, 0.08), toon(c), 0, 0.9, -0.2)); for (const x of [-0.66, 0.66]) g.add(mesh(box(0.08, 1.8, 0.48), toon(c), x, 0.9, 0)); for (let r = 0; r < 4; r++) g.add(mesh(box(1.3, 0.07, 0.46), toon(c), 0, 0.12 + r * 0.55, 0)); for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) g.add(mesh(box(0.16, 0.38, 0.3), toon(['#ff6f5e', '#9fd3ff', '#ffe98a', '#8fae6a', '#c9b3ff'][(r + k) % 5]), -0.45 + k * 0.22, 0.35 + r * 0.55, 0.02)); break;
    case 'quilt': { const q = mesh(box(1.2, 0.12, 0.9), toon(c), 0, 0.1, 0); q.rotation.y = 0.2; g.add(q); g.add(mesh(box(1.0, 0.1, 0.8), toon(c), 0.05, 0.2, 0.02)); break; }
    case 'poster': g.add(mesh(box(1.0, 1.3, 0.04), toon(c), 0, 0, 0, false)); g.add(mesh(new T3.OctahedronGeometry(0.25, 0), toon('#ffffff'), 0, 0.1, 0.05, false)); break;
    case 'painting': { g.add(mesh(box(1.3, 1.0, 0.08), toon('#c49a6c'), 0, 0, 0, false)); const seed = it.uid.charCodeAt(0); for (let i = 0; i < 3; i++) g.add(mesh(box(1.1, 0.26, 0.02), toon([c, '#ffffff', Object.values(COLORS)[(seed + i * 3) % 11]][i]), 0, 0.3 - i * 0.28, 0.05, false)); break; }
    case 'fishbowl': g.add(mesh(sph(0.35, 16, 12), new T3.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.35 }), 0, 0.35, 0, false)); g.add(mesh(sph(0.09, 8, 6), toon('#ff9a3c'), 0.05, 0.33, 0, false)); g.add(mesh(cyl(0.2, 0.25, 0.08, 12), toon(c), 0, 0.04, 0)); break;
    case 'plush': g.add(mesh(sph(0.3, 12, 10), toon(c), 0, 0.3, 0)); g.add(mesh(sph(0.22, 12, 10), toon(c), 0, 0.72, 0)); for (const s of [-1, 1]) { const e = mesh(new T3.CapsuleGeometry(0.06, 0.25, 4, 6), toon(c), s * 0.1, 1.0, 0); e.rotation.z = -s * 0.2; g.add(e); } break;
    case 'musicbox': g.add(mesh(box(0.5, 0.3, 0.35), toon(c), 0, 0.15, 0)); g.add(mesh(new T3.ConeGeometry(0.08, 0.25, 8), toon('#ffffff'), 0, 0.42, 0)); break;
    case 'globe': g.add(mesh(cyl(0.2, 0.24, 0.12, 12), toon(c), 0, 0.06, 0)); g.add(mesh(sph(0.22, 14, 10), new T3.MeshBasicMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0.45 }), 0, 0.32, 0, false)); g.add(mesh(new T3.ConeGeometry(0.08, 0.2, 6), toon('#6fbf6a'), 0, 0.28, 0, false)); break;
    case 'books': for (let i = 0; i < 4; i++) { const b = mesh(box(0.55 - i * 0.05, 0.12, 0.4), toon([c, '#ff6f5e', '#9fd3ff', '#ffe98a'][i]), 0, 0.06 + i * 0.12, 0); b.rotation.y = i * 0.2; g.add(b); } break;
    case 'records': g.add(mesh(box(0.9, 0.35, 0.7), toon(c), 0, 0.5, 0)); g.add(mesh(cyl(0.3, 0.3, 0.03, 20), toon('#222222'), -0.1, 0.69, 0)); g.add(mesh(box(0.05, 0.05, 0.4), toon('#ffffff'), 0.28, 0.72, 0)); g.add(mesh(box(0.8, 0.32, 0.6), toon('#8a6a4e'), 0, 0.16, 0)); break;
  }
  return g;
}
function foodMesh(id) {
  const g = new T3.Group(), plate = () => g.add(mesh(cyl(0.34, 0.3, 0.05, 16), toon('#ffffff'), 0, 0.03, 0));
  const bowl = (col) => { g.add(mesh(new T3.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon('#f4efe6'), 0, 0.3, 0)); g.add(mesh(cyl(0.27, 0.27, 0.03, 16), toon(col), 0, 0.28, 0, false)); };
  const cup = (col) => { g.add(mesh(cyl(0.17, 0.14, 0.34, 14), toon('#ffffff'), 0, 0.17, 0)); g.add(mesh(cyl(0.155, 0.155, 0.02, 14), toon(col), 0, 0.34, 0, false)); const h = mesh(new T3.TorusGeometry(0.08, 0.025, 6, 10), toon('#ffffff'), 0.19, 0.18, 0); g.add(h); };
  { const mf = FOODS.find((f) => f.id === id && f.mod); if (mf) { plate(); if (mf.parts) g.add(partsMesh(mf.parts)); else g.add(mesh(sph(0.18, 12, 9), toon(mf.color), 0, 0.2, 0)); return g; } }
  switch (id) {
    case 'onigiri': { plate(); const o = mesh(new T3.ConeGeometry(0.24, 0.34, 3), toon('#ffffff'), 0, 0.22, 0); o.rotation.x = 0.25; g.add(o); g.add(mesh(box(0.2, 0.12, 0.03), toon('#2c3a2a'), 0, 0.14, 0.1)); break; }
    case 'tart': plate(); g.add(mesh(cyl(0.24, 0.2, 0.12, 16), toon('#e8b878'), 0, 0.11, 0)); for (let i = 0; i < 5; i++) g.add(mesh(sph(0.06, 8, 6), toon('#e2466b'), Math.cos(i * 1.25) * 0.12, 0.2, Math.sin(i * 1.25) * 0.12)); break;
    case 'curry': bowl('#b8792e'); g.add(mesh(sph(0.1, 8, 6), toon('#ffffff'), 0.08, 0.32, 0)); break;
    case 'miso': bowl('#caa06a'); break;
    case 'mochi': plate(); for (let i = 0; i < 3; i++) g.add(mesh(sph(0.1, 10, 8), toon(['#ffffff', '#ffb3c7', '#b8e39a'][i]), -0.12 + i * 0.12, 0.12, 0)); break;
    case 'fish': { plate(); const f = mesh(new T3.CapsuleGeometry(0.08, 0.3, 4, 8), toon('#e8a060'), 0, 0.12, 0); f.rotation.z = Math.PI / 2; g.add(f); break; }
    case 'noodles': bowl('#f2d36b'); g.add(mesh(sph(0.05, 6, 4), toon('#e2466b'), -0.1, 0.32, 0)); break;
    case 'croissant': { plate(); const c = mesh(new T3.TorusGeometry(0.14, 0.07, 6, 10, Math.PI * 1.3), toon('#e8b060'), 0, 0.1, 0); c.rotation.x = Math.PI / 2; g.add(c); break; }
    case 'shortcake': plate(); g.add(mesh(cyl(0.2, 0.2, 0.22, 16), toon('#fff4dc'), 0, 0.14, 0)); g.add(mesh(cyl(0.2, 0.2, 0.04, 16), toon('#ff9fbf'), 0, 0.2, 0)); g.add(mesh(sph(0.07, 8, 6), toon('#e2466b'), 0, 0.3, 0)); break;
    case 'cinnamon': plate(); g.add(mesh(cyl(0.2, 0.22, 0.14, 16), toon('#c9864a'), 0, 0.1, 0)); g.add(mesh(new T3.TorusGeometry(0.1, 0.03, 6, 12), toon('#fff4dc'), 0, 0.18, 0)).rotation; break;
    case 'baguette': { plate(); const b = mesh(new T3.CapsuleGeometry(0.07, 0.5, 4, 8), toon('#e0a860'), 0, 0.1, 0); b.rotation.z = Math.PI / 2; g.add(b); break; }
    case 'vanilla': case 'matchaice': case 'chilimango': { const cone = mesh(new T3.ConeGeometry(0.12, 0.35, 10), toon('#e8b878'), 0, 0.18, 0); cone.rotation.x = Math.PI; g.add(cone); g.add(mesh(sph(0.14, 10, 8), toon(id === 'vanilla' ? '#fff8e8' : id === 'matchaice' ? '#a8d88a' : '#ffb347'), 0, 0.42, 0)); break; }
    case 'sundae': g.add(mesh(cyl(0.18, 0.1, 0.2, 12), new T3.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.5 }), 0, 0.1, 0, false)); g.add(mesh(sph(0.15, 10, 8), toon('#ffb3c7'), 0, 0.28, 0)); g.add(mesh(sph(0.05, 6, 4), toon('#e2466b'), 0, 0.44, 0)); break;
    case 'apple': plate(); for (const [x, c] of [[-0.12, '#ff5a4a'], [0.12, '#ffb347']]) { g.add(mesh(sph(0.15, 12, 9), toon(c), x, 0.17, 0)); g.add(mesh(cyl(0.015, 0.015, 0.08, 4), toon('#6b4a3a'), x, 0.34, 0)); } break;
    case 'strawberry': plate(); for (let i = 0; i < 4; i++) { g.add(mesh(new T3.ConeGeometry(0.09, 0.16, 7), toon('#ff4f6a'), Math.cos(i * 1.6) * 0.12, 0.11, Math.sin(i * 1.6) * 0.12).rotateX(Math.PI)); } break;
    case 'carrot': plate(); for (let i = 0; i < 3; i++) { const c = mesh(new T3.ConeGeometry(0.05, 0.4, 6), toon('#ff9a3c'), -0.1 + i * 0.1, 0.08, 0); c.rotation.z = Math.PI / 2; g.add(c); } break;
    case 'tomato': plate(); g.add(mesh(sph(0.16, 12, 9), toon('#ff5a4a'), -0.08, 0.17, 0)); g.add(mesh(sph(0.13, 12, 9), toon('#ff5a4a'), 0.13, 0.15, 0.05)); break;
    case 'pumpkin': g.add(mesh(sph(0.28, 14, 10).scale(1, 0.75, 1), toon('#ff8a2a'), 0, 0.21, 0)); g.add(mesh(cyl(0.03, 0.04, 0.12, 5), toon('#6fbf6a'), 0, 0.46, 0)); break;
    case 'cabbage': g.add(mesh(new T3.IcosahedronGeometry(0.24, 1), toon('#9fd67e'), 0, 0.24, 0)); break;
    case 'pizza': { plate(); const sl = mesh(new T3.CylinderGeometry(0.3, 0.3, 0.05, 3, 1, false, 0, 0.9), toon('#f3c96b'), 0, 0.08, 0); g.add(sl); for (let i = 0; i < 3; i++) g.add(mesh(cyl(0.04, 0.04, 0.02, 8), toon('#d9463a'), 0.08 + i * 0.05, 0.12, 0.05 - i * 0.03)); break; }
    case 'taco': { plate(); const sh = mesh(new T3.TorusGeometry(0.16, 0.05, 6, 12, Math.PI), toon('#f2c04a'), 0, 0.2, 0); g.add(sh); g.add(mesh(sph(0.1, 8, 6), toon('#7cc86a'), 0, 0.12, 0)); break; }
    case 'nachos': plate(); for (let i = 0; i < 6; i++) { const c = mesh(new T3.ConeGeometry(0.09, 0.02, 3), toon('#f2c04a'), Math.cos(i) * 0.14, 0.08 + (i % 2) * 0.03, Math.sin(i) * 0.14); c.rotation.x = Math.PI / 2; g.add(c); } g.add(mesh(sph(0.1, 8, 6), toon('#ffb020'), 0, 0.12, 0)); break;
    case 'melonpan': plate(); g.add(mesh(new T3.SphereGeometry(0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon('#f3d77a'), 0, 0.05, 0)); break;
    case 'latte': cup('#d9b48a'); break;
    case 'matcha': cup('#8fc06a'); break;
    case 'cocoa': cup('#6b3f2a'); break;
    case 'chai': cup('#c89066'); break;
    case 'cheesecake': { plate(); const s = mesh(new T3.CylinderGeometry(0.24, 0.24, 0.16, 12, 1, false, 0, 1.1), toon('#fff1c9'), 0, 0.13, 0); g.add(s); break; }
  }
  return g;
}
// walls, floor and light shared by every interior
function shell(S, wall, floor, opts = {}) {
  const night = W.t >= 0.6 || W.t < 0.02;
  S.background = new T3.Color(cfg.boxMode ? '#000000' : '#1a1530');
  S.add(new T3.HemisphereLight(0xfff6ee, 0x7a6a98, night ? 0.46 : 0.62));
  S.add(new T3.AmbientLight(0xffffff, night ? 0.1 : 0.16));
  const sl = new T3.DirectionalLight(0xfff1d8, night ? 0.2 : 0.45); sl.position.set(5, 9, 7); sl.castShadow = true; sl.shadow.mapSize.set(1024, 1024);
  Object.assign(sl.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); S.add(sl);
  if (night) { const pl = new T3.PointLight(0xffd9a0, 0.55, 12); pl.position.set(0.5, 4.3, 0.5); S.add(pl); }
  const wc = new T3.Color(wall), dark = wc.clone().multiplyScalar(0.86), side = wc.clone().multiplyScalar(0.94);
  if (opts.checker) { for (let x = 0; x < 9; x++) for (let z = 0; z < 8; z++) S.add(mesh(box(1, 0.3, 1), toon((x + z) % 2 ? opts.checker[0] : opts.checker[1]), -4 + x, -0.15, -3.5 + z, false)); }
  else { S.add(mesh(box(9, 0.3, 8), toon(floor), 0, -0.15, 0, false)); const line = new T3.Color(floor).multiplyScalar(0.84); for (let i = -3; i <= 3; i++) S.add(mesh(box(9, 0.012, 0.06), toon('#' + line.getHexString()), 0, 0.006, i + 0.5, false)); }
  S.add(mesh(box(9, 5, 0.3), toon('#' + wc.getHexString()), 0, 2.5, -4.15, false));
  S.add(mesh(box(0.3, 5, 8), toon('#' + side.getHexString()), -4.65, 2.5, 0, false));
  const pat = opts.pattern || 'stripes';
  if (pat === 'stripes') { for (let i = 0; i < 9; i++) S.add(mesh(box(0.34, 3.9, 0.02), toon('#' + dark.getHexString()), -4 + i + 0.5, 3.0, -3.99, false)); for (let i = 0; i < 8; i++) S.add(mesh(box(0.02, 3.9, 0.34), toon('#' + dark.getHexString()), -4.49, 3.0, -3.5 + i + 0.5, false)); }
  else if (pat === 'dots') { for (let x = 0; x < 9; x++) for (let y = 0; y < 4; y++) S.add(mesh(new T3.CircleGeometry(0.1, 10), toon('#' + dark.getHexString()), -4 + x + (y % 2) * 0.5, 1.6 + y * 0.9, -3.99, false)); for (let z = 0; z < 8; z++) for (let y = 0; y < 4; y++) { const d = mesh(new T3.CircleGeometry(0.1, 10), toon('#' + dark.getHexString()), -4.49, 1.6 + y * 0.9, -3.5 + z + (y % 2) * 0.5, false); d.rotation.y = Math.PI / 2; S.add(d); } }
  S.add(mesh(box(9, 1.05, 0.06), toon(opts.wainscot || '#ffffff'), 0, 0.52, -3.98, false));
  S.add(mesh(box(0.06, 1.05, 8), toon(opts.wainscot || '#ffffff'), -4.48, 0.52, 0, false));
  S.add(mesh(box(9, 0.1, 0.1), toon('#ffffff'), 0, 1.07, -3.95, false));
  S.add(mesh(box(0.1, 0.1, 8), toon('#ffffff'), -4.45, 1.07, 0, false));
  gfxShell(S, night);
  return night;
}
function addPerson(S, p, x, z, faceY, opts = {}) {
  const f = makeFigure(p);
  if (p.health) healthLook(p, f);
  f.fig.scale.setScalar(1.05 * p.body.size * (0.6 + 0.4 * p.grow));
  f.fig.position.set(x, opts.y || 0, z); f.fig.rotation.y = faceY;
  if (opts.lying) { f.fig.rotation.set(-Math.PI / 2, 0, 0); f.eyes.forEach((e) => (e.scale.y = 0.2)); }
  f.fig.traverse((o) => { o.userData.tap = { kind: 'person', pid: p.id }; if (o.isMesh) o.castShadow = true; });
  if (gfxOn() && !opts.lying) { const bs = blobShadow(1.4, 1.4, 0.26); bs.position.y = 0.02 - (opts.y || 0) / f.fig.scale.x; f.fig.add(bs); }
  S.add(f.fig);
  const el = document.createElement('div'); el.className = 'tag';
  el.innerHTML = '<div class="thought" hidden></div><div class="emo"></div><div class="bub" hidden></div><div class="nm"></div>';
  el.children[3].innerHTML = esc(p.name) + (p.npc ? '' : ` <span class="lv">Lv ${p.level || 1}</span>`);
  itags.appendChild(el);
  ilabels.push({ kind: 'person', pid: p.id, obj: f.fig, el, h: opts.lying ? 1.2 : 2.6 * f.fig.scale.x, parts: f });
}
function addPrice(obj, text, h = 1) {
  const el = document.createElement('div'); el.className = 'ptag'; el.textContent = text;
  itags.appendChild(el); ilabels.push({ kind: 'price', obj, el, h });
}
function tapBuy(obj, shop, it) { obj.traverse((o) => (o.userData.tap = { kind: 'buy', shop, uid: it.uid, food: it.kind === 'food' ? it.id : null })); }
function onDuty(shop) { return W.people.find((p) => p.job === SHOPS[shop].job && p.task?.kind === 'work' && p.task.phase === 'do' && !p.path.length); }
function customers(shop) { return W.people.filter((p) => p.inside && p.at === shop && ['eat', 'shop', 'arcade'].includes(p.task?.kind)); }
function interiorKey() {
  if (!interior) return '';
  if (interior.kind === 'room') { const p = person(interior.id); if (!p) return ''; const night = W.t >= 0.6 || W.t < 0.02; return ['r', W.people.filter((q) => q.inside && q.task?.kind === 'hangout' && q.task.host === p.id).map((q) => q.id).join(','), p.inside && p.task?.kind, night, p.decor.map((d) => d.uid).join(','), p.outfit.shirt, p.outfit.hat?.id, Object.values(p.feelings).filter((f) => f.score >= 4).length, cfg.boxMode].join('|'); }
  if (interior.kind === 'hall') return hallKey();
  if (interior.kind === 'labs') return labsKey();
  if (interior.kind === 'clinic') return clinicKey();
  const s = interior.shop;
  return ['s', s, (W.stock[s] || []).map((i) => i.uid).join(','), onDuty(s)?.id, customers(s).map((p) => p.id).join(','), W.t >= 0.6, cfg.boxMode].join('|');
}
function buildInterior() {
  const S = roomScene;
  while (S.children.length) { const c = S.children[0]; S.remove(c); disposeTree(c); }
  itags.innerHTML = ''; ilabels = []; $('#rcBtns').innerHTML = '';
  interior.key = interiorKey(); interior.built = now; interior.dirty = false;
  if (interior.kind === 'room') buildRoom(person(interior.id)); else if (interior.kind === 'hall') buildHall(); else if (interior.kind === 'labs') buildLabsRoom(); else if (interior.kind === 'clinic') buildClinicRoom(); else buildShop(interior.shop);
}
function buildRoom(p) {
  const S = roomScene;
  const fav = topColors(p, 1)[0] || p.outfit.shirt;
  const wall = new T3.Color(COLORS[fav]).lerp(new T3.Color('#ffffff'), 0.3);
  const night = shell(S, '#' + wall.getHexString(), '#a8764f', { pattern: p.body.hue > 180 ? 'dots' : 'stripes', wainscot: '#' + new T3.Color(COLORS[fav]).multiplyScalar(0.8).getHexString() });
  // window on the side wall
  S.add(mesh(box(0.1, 1.9, 2.3), toon('#ffffff'), -4.45, 2.9, 1.3, false));
  S.add(mesh(box(0.12, 1.6, 2.0), new T3.MeshBasicMaterial({ color: night ? '#2a3570' : '#aee0ff' }), -4.43, 2.9, 1.3, false));
  S.add(mesh(box(0.14, 0.08, 2.0), toon('#ffffff'), -4.4, 2.9, 1.3, false));
  // bed
  const quilt = [...p.decor].reverse().find((d) => d.id === 'quilt');
  const bed = new T3.Group();
  bed.add(mesh(box(1.9, 0.5, 3.0), toon('#c49a6c'), 0, 0.25, 0));
  bed.add(mesh(box(1.8, 0.28, 2.9), toon('#f4efe6'), 0, 0.62, 0));
  bed.add(mesh(box(1.86, 0.14, 2.0), toon(quilt ? COLORS[quilt.color] : '#d9d2ea'), 0, 0.8, 0.45));
  bed.add(mesh(box(1.2, 0.25, 0.55), toon('#ffffff'), 0, 0.85, -1.05));
  bed.add(mesh(box(1.9, 1.3, 0.2), toon('#a8764f'), 0, 0.65, -1.5));
  bed.position.set(-3.2, 0, -2.4); S.add(bed);
  S.add(mesh(cyl(0.6, 0.6, 0.08, 16), toon('#f4efe6'), 1.8, 0.85, 0.6)); S.add(mesh(cyl(0.08, 0.1, 0.85, 8), toon('#a8764f'), 1.8, 0.42, 0.6));
  // friends on the wall
  Object.entries(p.feelings).filter(([, f]) => f.score >= 4).slice(0, 4).forEach(([id], i) => { const q = person(id); if (!q) return; S.add(mesh(box(0.6, 0.6, 0.05), toon('#ffffff'), -1.3 + i * 0.8, 4.15, -3.97, false)); S.add(mesh(new T3.CircleGeometry(0.2, 14), toon(`hsl(${Math.round(q.body.hue)}, 70%, 72%)`), -1.3 + i * 0.8, 4.15, -3.93, false)); });
  const floor = [[3.2, -3.0], [0.2, -3.2], [3.4, 2.7], [0.8, 3.0], [3.3, -0.4], [-2.4, 2.9]];
  const wallS = [[0.9, 2.6], [2.7, 2.8], [-0.8, 2.6]], side = [-0.8, 3.2], table = [[1.55, 0.45], [2.05, 0.75], [1.8, 0.25]];
  let fi = 0, wi = 0, si = 0, ti = 0;
  for (const it of p.decor) {
    if (it.id === 'quilt') continue;
    const m = decorMesh(it);
    if (it.id === 'rug') m.position.set(0.6, 0, 0.8);
    else if (it.id === 'poster' || it.id === 'painting') { if (wi < wallS.length) { m.position.set(wallS[wi][0], wallS[wi][1], -3.97); wi++; } else if (si < side.length) { m.position.set(-4.47, 2.6, side[si]); m.rotation.y = Math.PI / 2; si++; } else continue; }
    else if (['bouquet', 'fishbowl', 'musicbox', 'globe', 'laptop'].includes(it.id) && ti < table.length) { m.position.set(table[ti][0], 0.9, table[ti][1]); ti++; }
    else if (fi < floor.length) { m.position.set(floor[fi][0], 0, floor[fi][1]); m.rotation.y = ((it.uid.charCodeAt(1) % 7) - 3) * 0.1; fi++; }
    else continue;
    m.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    S.add(m);
    if (night && m.userData.lamp) { const pl = new T3.PointLight(new T3.Color(m.userData.lamp).lerp(new T3.Color('#ffe8c0'), 0.5), 0.7, 7); pl.position.set(m.position.x, 1.8, m.position.z); S.add(pl); }
  }
  const home = p.inside && (p.task?.kind === 'home' || p.task?.kind === 'hangout' || p.task?.kind === 'rest');
  if (home) { if ((night && p.task?.kind === 'home') || p.task?.kind === 'rest') addPerson(S, p, -3.2, -2.85, 0, { lying: true, y: 1.0 }); else addPerson(S, p, 0.4, 1.0, 0.6); }
  W.people.filter((q) => q !== p && q.inside && q.task?.kind === 'hangout' && q.task.host === p.id).forEach((q, i) => addPerson(S, q, -1.5 - i * 1.1, 1.9, 0.9));
  if (isMili(p)) { const c = catMesh(1.4); c.position.set(2.3, 0, 2.3); c.rotation.y = -0.8; S.add(c); }
  $('#rcTitle').textContent = `Room ${p.room + 1} · ${p.name}`;
  const made = p.decor.filter((d) => d.makerName).length;
  $('#rcSub').textContent = `${home ? (night ? 'Asleep. Tap to wake them.' : 'At home. Tap them to chat.') : `Out right now (${doing(p)}).`} ${p.decor.length ? `${plural(p.decor.length, 'thing')} in here${made ? `, ${made} made by neighbors` : ''}.` : 'The room is still bare.'}`;
}
let extraSub = null;
function buildShop(shop) {
  extraSub = null;
  const S = roomScene, stock = W.stock[shop] || [];
  const clerk = onDuty(shop), cust = customers(shop);
  const closed = W.t >= 0.6;
  if (shop === 'mart') {
    shell(S, '#fff1c9', null, { checker: ['#f7efe0', '#f4c9bf'], wainscot: '#e2766b' });
    const shelf = new T3.Group();
    shelf.add(mesh(box(5.2, 2.8, 0.9), toon('#c49a6c'), 0, 1.4, 0)); for (const y of [0.95, 1.9]) shelf.add(mesh(box(5.0, 0.08, 0.95), toon('#e8d0a8'), 0, y, 0.06));
    shelf.position.set(-1.5, 0, -3.5); S.add(shelf);
    FOODS.filter((f) => f.shop === 'mart').forEach((f, i) => { const it = { uid: 'menu-' + f.id, kind: 'food', id: f.id }; const m = foodMesh(f.id); m.scale.setScalar(1.7); m.position.set(-3.5 + (i % 4) * 1.35, [1.0, 1.95, 2.85][Math.floor(i / 4)] ?? 2.85, -3.1); tapBuy(m, shop, it); S.add(m); addPrice(m, `${f.price} ✦`, 0.7); });
    S.add(mesh(box(3.2, 1.1, 1.2), toon('#e2566b'), 2.8, 0.55, -1.2)); S.add(mesh(box(3.3, 0.1, 1.3), toon('#fff6ee'), 2.8, 1.12, -1.2));
    S.add(mesh(box(0.6, 0.4, 0.5), toon('#5a5470'), 3.6, 1.37, -1.2));
    for (let i = 0; i < 3; i++) { S.add(mesh(box(1.1, 0.7, 0.9), toon('#c49a6c'), -3.2 + i * 1.3, 0.35, 2.6)); for (let k = 0; k < 4; k++) S.add(mesh(sph(0.2, 8, 6), toon(['#ff6f5e', '#ffd36b', '#9fe3a0'][i]), -3.5 + i * 1.3 + (k % 2) * 0.5, 0.82, 2.4 + Math.floor(k / 2) * 0.4)); }
    if (clerk) addPerson(S, clerk, 2.8, -2.4, 0);
  } else if (shop === 'cafe') {
    shell(S, '#f6c7a6', '#7d5238', { pattern: 'dots', wainscot: '#9b5c4a' });
    S.add(mesh(box(5.5, 1.1, 1.1), toon('#9b5c4a'), 0.6, 0.55, -2.2)); S.add(mesh(box(5.6, 0.1, 1.2), toon('#fff4dc'), 0.6, 1.12, -2.2));
    S.add(mesh(box(4.8, 0.7, 0.9), new T3.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.25 }), 0.6, 1.5, -2.2, false));
    S.add(mesh(box(4, 1.2, 0.8), toon('#7d5238'), 0.6, 0.6, -3.55)); S.add(mesh(box(1.1, 1.0, 0.7), toon('#c0c4cc'), 2.2, 1.7, -3.55)); S.add(mesh(cyl(0.12, 0.12, 0.3, 10), toon('#5a5470'), 2.2, 1.1, -3.3));
    FOODS.filter((f) => f.shop === 'cafe').forEach((f, i) => { const it = { uid: 'menu-' + f.id, kind: 'food', id: f.id }; const m = foodMesh(f.id); m.scale.setScalar(1.5); m.position.set(-1.3 + i * 0.95, 1.18, -2.2); tapBuy(m, shop, it); S.add(m); addPrice(m, `${f.price} ✦`, 0.7); });
    for (const [tx, tz] of [[-2.6, 1.6], [1.6, 2.4]]) { S.add(mesh(cyl(0.75, 0.75, 0.08, 16), toon('#fff4dc'), tx, 0.95, tz)); S.add(mesh(cyl(0.08, 0.1, 0.95, 8), toon('#5a3a2e'), tx, 0.47, tz)); for (const s of [-1, 1]) S.add(mesh(cyl(0.35, 0.35, 0.5, 12), toon('#c9b3ff'), tx + s * 1.1, 0.25, tz)); }
    if (clerk) addPerson(S, clerk, 0.6, -3.0, 0);
  } else if (shop === 'clothes') {
    shell(S, '#e4dcff', '#efe8e0', { wainscot: '#6f73c9' });
    const hats = stock.filter((i) => i.kind === 'hat'), shirts = stock.filter((i) => i.kind === 'shirt');
    hats.slice(0, 6).forEach((it, i) => {
      const g = new T3.Group(), x = -3.3 + i * 1.25;
      g.add(mesh(cyl(0.25, 0.32, 1.0, 12), toon('#ffffff'), 0, 0.5, 0)); g.add(mesh(sph(0.5, 16, 12), toon('#f4efe6'), 0, 1.45, 0));
      const h = hatMesh({ id: it.id, color: it.color }); h.scale.setScalar(0.85); h.position.y = 1.45 + 0.15; g.add(h);
      g.position.set(x, 0, -3.2); tapBuy(g, shop, it); S.add(g); addPrice(g, `${itemPrice(it)} ✦${it.makerName ? ' · ' + it.makerName : ''}`, 2.4);
    });
    const rail = mesh(cyl(0.05, 0.05, 4.4, 8), toon('#5a5470'), -3.6, 2.4, 0.2); rail.rotation.x = Math.PI / 2; S.add(rail);
    for (const z of [-2, 2.4]) S.add(mesh(cyl(0.05, 0.05, 2.4, 8), toon('#5a5470'), -3.6, 1.2, z));
    shirts.slice(0, 5).forEach((it, i) => {
      const g = new T3.Group();
      g.add(mesh(box(0.14, 1.1, 0.95), toon(COLORS[it.color]), 0, 0, 0)); g.add(mesh(box(0.14, 0.35, 1.5), toon(COLORS[it.color]), 0, 0.35, 0));
      g.add(mesh(new T3.TorusGeometry(0.1, 0.02, 4, 8, Math.PI), toon('#5a5470'), 0, 0.68, 0));
      g.position.set(-3.6, 1.6, -1.4 + i * 0.85); tapBuy(g, shop, it); S.add(g); addPrice(g, `${itemPrice(it)} ✦`, 1.0);
    });
    S.add(mesh(box(1.2, 1.1, 2.6), toon('#6f73c9'), 2.9, 0.55, 1.2)); S.add(mesh(box(1.3, 0.1, 2.7), toon('#ffffff'), 2.9, 1.12, 1.2));
    S.add(mesh(box(0.1, 3, 1.4), new T3.MeshBasicMaterial({ color: 0xdfe8ff }), 1.2, 1.6, -3.8, false));
    if (clerk) addPerson(S, clerk, 3.8, 1.2, -Math.PI / 2);
  } else if (['bakery', 'icecream', 'books', 'arcade'].includes(shop)) {
    extraSub = buildShopExtra(shop, S, clerk, stock);
  } else {
    shell(S, '#d8f0d0', '#b98a5e', { wainscot: '#5f7f4a' });
    const slots = [[-3.1, -2.9], [-1.4, -2.9], [0.3, -2.9], [2.0, -2.9], [-3.1, -0.6], [-1.4, -0.6], [0.3, -0.6], [2.0, -0.6], [-3.1, 1.7], [-1.4, 1.7]];
    const wallSlots = [[3.5, 2.7], [-2.2, 2.8]];
    let si = 0, wi = 0;
    for (const it of stock) {
      const m = decorMesh(it); let h = 1.8;
      if (it.id === 'poster' || it.id === 'painting') { if (wi >= wallSlots.length) continue; m.position.set(wallSlots[wi][0], wallSlots[wi][1], -3.97); wi++; h = 0.9; }
      else { if (si >= slots.length) continue; const [x, z] = slots[si++]; S.add(mesh(box(1.4, 0.25, 1.4), toon('#efe2cc'), x, 0.12, z)); m.position.set(x, 0.25, z); h = it.id === 'rug' ? 0.6 : it.id === 'lamp' || it.id === 'shelf' ? 2.3 : 1.4; if (it.id === 'rug') m.scale.setScalar(0.45); }
      tapBuy(m, shop, it); m.traverse((o) => { if (o.isMesh) o.castShadow = true; }); S.add(m);
      addPrice(m, `${itemPrice(it)} ✦${it.makerName ? ' · ' + it.makerName : ''}`, h);
    }
    S.add(mesh(box(2.6, 1.1, 1.2), toon('#5f7f4a'), 2.6, 0.55, 2.4)); S.add(mesh(box(2.7, 0.1, 1.3), toon('#fffbe8'), 2.6, 1.12, 2.4));
    if (clerk) addPerson(S, clerk, 2.6, 3.3, Math.PI);
  }
  cust.forEach((p, i) => addPerson(S, p, -0.6 + i * 1.2, 1.4 + (i % 2) * 0.6, Math.PI * 0.85));
  $('#rcTitle').textContent = SHOPS[shop].name;
  $('#rcSub').textContent = closed ? 'Closed for the night. You can still look around.' : extraSub ? extraSub : clerk ? `${clerk.name} is working. Tap anything to buy it.` : 'Nobody is at the counter right now. Tap anything to buy it.';
}
function openInterior(spec) {
  if (MODE !== 'host') return;
  if (spec.kind === 'shop' && crimeClosed(spec.shop)) { toast(`${TOWN[spec.shop]?.name || 'The shop'} is closed for repairs after the fire.`); return; }
  if (spec.kind === 'room' && !person(spec.id)) return;
  releaseDlg(); Sound.door();
  interior = { ...spec, key: '', built: -99 };
  controls.enabled = false; roomControls.enabled = true;
  roomCam.position.set(7.5, 7.2, 9.5); roomControls.target.set(0, 1.4, 0);
  $('#roomcard').hidden = false; $('#tags').style.visibility = 'hidden'; $('#hud').style.visibility = 'hidden';
  buildInterior();
  if (spec.kind === 'shop') { const c = onDuty(spec.shop); if (c) setTimeout(() => { if (interior?.shop === spec.shop) openInteract(c.id, { text: pick([`Welcome to ${SHOPS[spec.shop].name}!`, `Oh! The Creator, in ${SHOPS[spec.shop].name}!`, 'Welcome! Take a look around.']) }); }, 500); }
}
function closeInterior() {
  releaseDlg();
  interior = null; controls.enabled = true; roomControls.enabled = false;
  const S = roomScene; while (S.children.length) { const c = S.children[0]; S.remove(c); disposeTree(c); }
  itags.innerHTML = ''; ilabels = [];
  $('#roomcard').hidden = true; $('#tags').style.visibility = ''; $('#hud').style.visibility = '';
}
$('#rcClose').addEventListener('click', () => send({ t: 'room', id: null }));
$('#rcBtns').addEventListener('click', (e) => { const b = e.target.closest('[data-wing]'); if (b) send({ t: 'labsview', wing: b.dataset.wing }); });
$('#placeCancel').addEventListener('click', () => cancelPlacing());
function interiorFrame() {
  if (interior.dirty || (now - interior.built > 1.5 && interiorKey() !== interior.key)) buildInterior();
  const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
  for (const L of ilabels) {
    L.obj.getWorldPosition(vec); vec.y += L.h; vec.project(roomCam);
    if (vec.z > 1) { L.el.style.display = 'none'; continue; }
    L.el.style.display = '';
    L.el.style.transform = `translate(${(vec.x * 0.5 + 0.5) * w}px, ${(-vec.y * 0.5 + 0.5) * h}px) translate(-50%, -100%)`;
    if (L.kind === 'person') {
      const p = person(L.pid); if (!p) continue;
      const b = p.bubble && p.bubble.until > now ? p.bubble.text : '';
      const bub = L.el.children[2]; if (bub.textContent !== b) bub.textContent = b; bub.hidden = !b; bub.classList.toggle('sky', !!(b && p.bubble.sky));
      const pr = !b && problemOf(p), th = L.el.children[0], icon = pr ? PROB_ICON[pr.kind] : '';
      if (th.textContent !== icon) th.textContent = icon; th.hidden = !icon;
      const e = p.emote && p.emote.until > now ? p.emote.ch : ''; if (L.el.children[1].textContent !== e) L.el.children[1].textContent = e;
      const blink = ((now + p.room * 1.3) % 3.7) < 0.12;
      if (!L.parts.fig.rotation.x) { L.parts.eyes.forEach((ey) => (ey.scale.y = blink ? 0.2 : 1.45)); faceUpdate(p, L.parts, blink); }
      L.parts.fig.position.y = (L.parts.fig.rotation.x ? L.parts.fig.position.y : Math.abs(Math.sin(now * 1.6 + p.room)) * 0.04);
    }
  }
}

