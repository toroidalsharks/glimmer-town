// ============================================================
// RESIDENT MODELS
// ============================================================
const meshes = new Map();
let selRing;
const eyeMat = () => vinyl('#241a34');
function hatMesh(h) {
  const col = toon(COLORS[h.color]), g = new T3.Group();
  switch (h.id) {
    case 'beanie': g.add(mesh(new T3.SphereGeometry(0.66, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), col, 0, 0.05, 0)); g.add(mesh(cyl(0.67, 0.67, 0.16, 20), toon('#ffffff'), 0, 0.08, 0)); g.add(mesh(sph(0.16, 10, 8), toon('#ffffff'), 0, 0.72, 0)); break;
    case 'bow': for (const s of [-1, 1]) { const b = mesh(new T3.ConeGeometry(0.2, 0.36, 10), col, 0.3 + s * 0.2, 0.45, 0.1); b.rotation.z = s * Math.PI / 2; g.add(b); } g.add(mesh(sph(0.1, 8, 6), col, 0.3, 0.45, 0.1)); break;
    case 'tophat': g.add(mesh(cyl(0.62, 0.62, 0.06, 20), col, 0, 0.42, 0)); g.add(mesh(cyl(0.36, 0.38, 0.6, 20), col, 0, 0.74, 0)); g.add(mesh(cyl(0.385, 0.385, 0.1, 20), toon('#ffffff'), 0, 0.5, 0)); break;
    case 'crown': { const t = mesh(new T3.TorusGeometry(0.46, 0.06, 6, 24), toon('#6fbf6a'), 0, 0.4, 0); t.rotation.x = Math.PI / 2; g.add(t); for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; g.add(mesh(sph(0.12, 8, 6), i % 2 ? toon('#ffffff') : col, Math.cos(a) * 0.46, 0.46, Math.sin(a) * 0.46)); } break; }
    case 'cap': g.add(mesh(new T3.SphereGeometry(0.64, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), col, 0, 0.1, 0)); g.add(mesh(box(0.8, 0.06, 0.55), col, 0, 0.14, 0.62)); break;
    case 'witch': { g.add(mesh(cyl(0.85, 0.85, 0.05, 20), col, 0, 0.36, 0)); const c = mesh(new T3.ConeGeometry(0.45, 1.1, 16), col, 0.05, 0.9, 0); c.rotation.z = -0.2; g.add(c); g.add(mesh(cyl(0.46, 0.46, 0.1, 16), toon('#ffe98a'), 0, 0.43, 0)); break; }
    case 'phones': { g.add(mesh(new T3.TorusGeometry(0.64, 0.06, 6, 20, Math.PI), col)); for (const s of [-1, 1]) { const e = mesh(cyl(0.2, 0.2, 0.16, 14), col, s * 0.64, 0, 0); e.rotation.z = Math.PI / 2; g.add(e); } break; }
  }
  return g;
}
function makeFigure(p) {
  const B = p.body, fig = new T3.Group();
  const skin = vinyl(`hsl(${Math.round(B.hue)}, ${B.sat ?? 70}%, ${B.light ?? 78}%)`), shirt = vinyl(COLORS[p.outfit.shirt], { kind: 'cloth' });
  const legs = [-0.17, 0.17].map((x) => { const l = mesh(new T3.CapsuleGeometry(0.12, 0.22, 4, 8), vinyl('#4a4652', { kind: 'cloth' }), x, 0.24, 0); fig.add(l); return l; });
  const body = mesh(new T3.CapsuleGeometry(0.38, 0.3, 6, 14), shirt, 0, 0.78, 0); fig.add(body);
  const arms = [-1, 1].map((s) => { const a = mesh(new T3.CapsuleGeometry(0.1, 0.26, 4, 8), shirt, s * 0.46, 0.8, 0); a.rotation.z = s * 0.35; fig.add(a); return a; });
  const head = new T3.Group(); head.position.y = 1.55; fig.add(head);
  head.add(mesh(sph(0.62, 24, 18), skin));
  const gap = 0.12 + B.eyeGap * 0.45;
  const eyes = [-1, 1].map((s) => { const e = mesh(sph(0.075, 10, 8), eyeMat(), s * gap, 0.05, 0.57, false); e.scale.set(1, 1.45, 0.55); head.add(e); return e; });
  for (const s of [-1, 1]) { const b = mesh(new T3.CircleGeometry(0.1, 12), new T3.MeshBasicMaterial({ color: 0xff8fb0, transparent: true, opacity: 0.55 }), s * (gap + 0.14), -0.1, 0.585, false); b.rotation.y = s * 0.25; head.add(b); }
  const mouth = mesh(new T3.TorusGeometry(0.06, 0.018, 6, 12, Math.PI), eyeMat(), 0, -0.12, 0.6, false); mouth.rotation.z = Math.PI; head.add(mouth);
  switch (B.ears) {
    case 'cat': for (const s of [-1, 1]) { const e = mesh(new T3.ConeGeometry(0.2, 0.38, 4), skin, s * 0.36, 0.56, 0); e.rotation.z = -s * 0.3; e.rotation.y = Math.PI / 4; head.add(e); const inner = mesh(new T3.ConeGeometry(0.1, 0.2, 4), toon('#ffb3c7'), s * 0.35, 0.53, 0.08, false); inner.rotation.z = -s * 0.3; inner.rotation.y = Math.PI / 4; head.add(inner); } break;
    case 'sparkle': { const gm = toon('#ffb38a', { emissive: new T3.Color('#7a3418') }); const st = new T3.Group(); for (const r of [0, Math.PI / 2]) { const c = mesh(new T3.OctahedronGeometry(0.16, 0), gm, 0, 0, 0, false); c.scale.set(0.45, 1.5, 0.45); c.rotation.z = r; st.add(c); } st.position.set(0, 0.95, 0); head.add(mesh(cyl(0.02, 0.02, 0.32, 5), skin, 0, 0.74, 0)); head.add(st); break; }
    case 'round': for (const s of [-1, 1]) head.add(mesh(sph(0.2, 12, 10), skin, s * 0.42, 0.45, 0)); break;
    case 'pointy': for (const s of [-1, 1]) { const e = mesh(new T3.ConeGeometry(0.17, 0.4, 10), skin, s * 0.38, 0.58, 0); e.rotation.z = -s * 0.35; head.add(e); } break;
    case 'antenna': { head.add(mesh(cyl(0.025, 0.025, 0.45, 6), skin, 0, 0.78, 0)); const hh = Math.round((B.hue + 150) % 360); head.add(mesh(sph(0.1, 10, 8), toon(`hsl(${hh}, 90%, 70%)`, { emissive: new T3.Color(`hsl(${hh}, 90%, 30%)`) }), 0, 1.02, 0)); break; }
    case 'sprout': for (const s of [-1, 1]) { const l = mesh(sph(0.12, 8, 6), toon('#7cc86a'), s * 0.1, 0.72, 0); l.scale.set(0.6, 1.6, 0.4); l.rotation.z = -s * 0.7; head.add(l); } break;
  }
  const hat = new T3.Group(); hat.position.y = 0.2; head.add(hat);
  if (p.outfit.hat) hat.add(hatMesh(p.outfit.hat));
  return cuteFigure(p, { fig, legs, body, arms, head, eyes, mouth, hat, skin });
}
function buildKin(p) {
  if (MODE !== 'host') return;
  const root = new T3.Group(), f = makeFigure(p);
  root.add(f.fig);
  if (gfxOn()) { const bs = blobShadow(1.5, 1.5, 0.3); bs.position.y = 0.03; root.add(bs); }
  const tools = new T3.Group(); f.fig.add(tools);
  root.traverse((o) => { o.userData.pid = p.id; });
  scene.add(root);
  const tag = document.createElement('div'); tag.className = 'tag';
  tag.innerHTML = '<div class="thought" hidden></div><div class="emo"></div><div class="bub" hidden></div><div class="nm"></div>';
  $('#tags').appendChild(tag);
  const m = { root, ...f, tools, tag, tagTh: tag.children[0], tagEmo: tag.children[1], tagBub: tag.children[2], tagNm: tag.children[3], nmKey: '' };
  meshes.set(p.id, m);
  dressMesh(p); scaleMesh(p);
}
function dressMesh(p) {
  const m = meshes.get(p.id); if (!m) return;
  m.body.material = m.arms[0].material = m.arms[1].material = vinyl(COLORS[p.outfit.shirt], { kind: 'cloth' });
  while (m.hat.children.length) m.hat.remove(m.hat.children[0]);
  if (p.outfit.hat) { const h = hatMesh(p.outfit.hat); h.traverse((o) => (o.userData.pid = p.id)); m.hat.add(h); }
  while (m.tools.children.length) m.tools.remove(m.tools.children[0]);
  if (p.job === 'pier') { const rod = mesh(cyl(0.03, 0.03, 2.2, 6), toon('#8a6a4e'), 0.5, 1.4, 0.7); rod.rotation.x = 0.9; m.tools.add(rod); }
  else if (p.job === 'garden') m.tools.add(mesh(cyl(0.16, 0.2, 0.3, 10), toon('#9fd3ff'), 0.55, 0.62, 0.2));
  else if (p.job) m.tools.add(mesh(box(0.55, 0.5, 0.05), toon({ dev: '#3d4f86', ai: '#5a7fd8', lawyer: '#6b4a3a', bio: '#3d8a6a', chem: '#9fe3c4', phys: '#3d4f86', robo: '#b86b3a', civil: '#ffb347', doctor: '#ffffff', therapist: '#c9b3ff', builder: '#ffb347', janitor: '#9fd3ff', cafe: '#5a3a2e', mart: '#e2566b', clothes: '#6f73c9', nook: '#5f7f4a', bakery: '#f3b67a', icecream: '#ff9fbf', books: '#5f4a6b', arcade: '#3a2f63' }[p.job] || '#ffffff'), 0, 0.72, 0.4));
}
function scaleMesh(p) { const m = meshes.get(p.id); if (m) m.root.scale.setScalar(p.body.size * (0.6 + 0.4 * p.grow)); }
function removeAllMeshes() { for (const [, m] of meshes) { scene.remove(m.root); m.tag.remove(); } meshes.clear(); }

