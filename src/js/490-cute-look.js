// ============================================================
// CUTE LOOK: hair, faces that react, hands, shoes, grass and flowers
// ============================================================
const HAIR_STYLES = { short: 'Short', pixie: 'Pixie', bob: 'Bob', long: 'Long', spiky: 'Spiky', bun: 'Bun', twintails: 'Pigtails', curly: 'Curly', buzz: 'Buzz', none: 'None' };
const HAIR_COLORS = { cocoa: '#5a3a2e', chestnut: '#8a5a3a', ink: '#2a2230', honey: '#e0b060', ginger: '#c8643a', ash: '#9a98a6', snow: '#f1ede6', bubblegum: '#ff9fc4', ocean: '#7fb3ff', lavender: '#b9a3f0', mint: '#8fdcc0' };
const SHOE_COLORS = ['#ff6f5e', '#3d4f86', '#fffaf2', '#ffb347', '#8a84a8', '#5a3a2e', '#ff9fbf', '#6fbf6a', '#2e2a36'];
const cuteOn = () => cfg.cute !== false;
function hashStr(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0); }
function hairOf(p) {
  if (!p.body) return { style: 'short', color: 'cocoa' };
  if (!p.body.hair || !HAIR_STYLES[p.body.hair.style]) {
    const h = hashStr(p.id + (p.name || ''));
    const natural = ['cocoa', 'cocoa', 'chestnut', 'ink', 'ink', 'honey', 'ginger', 'ash'], fun = Object.keys(HAIR_COLORS);
    const styles = ['short', 'short', 'bob', 'long', 'spiky', 'bun', 'twintails', 'curly', 'buzz', 'bob'];
    p.body.hair = { style: styles[h % styles.length], color: (h >> 8) % 4 === 0 ? fun[(h >> 12) % fun.length] : natural[(h >> 12) % natural.length], shoe: SHOE_COLORS[(h >> 16) % SHOE_COLORS.length] };
    if (typeof isMili === 'function' && isMili(p)) p.body.hair = { style: 'pixie', color: 'ink', shoe: '#fffaf2' };
    if (p.lovesMili) p.body.hair = { style: 'short', color: 'ink', shoe: '#ff6f5e' };
  }
  return p.body.hair;
}
function hairMesh(style, color) {
  const g = new T3.Group(), c = vinyl(HAIR_COLORS[color] || color || HAIR_COLORS.cocoa);
  const cap = (r = 0.668, th = 0.45, tilt = -0.36) => { const m = mesh(new T3.SphereGeometry(r, 22, 12, 0, Math.PI * 2, 0, Math.PI * th), c, 0, 0, 0); m.rotation.x = tilt; g.add(m); return m; };
  const bangs = (w = 1.7) => { const b = mesh(sph(0.2, 12, 8), c, 0, 0.36, 0.5); b.scale.set(w, 0.55, 0.7); b.rotation.x = 0.5; g.add(b); };
  switch (style) {
    case 'none': break;
    case 'buzz': cap(0.64, 0.42, -0.3); break;
    case 'short': cap(); bangs(1.3); { const t = mesh(sph(0.14, 10, 8), c, 0.22, 0.44, 0.42); t.scale.set(1.2, 0.6, 0.8); g.add(t); } break;
    case 'bob': cap(); bangs(); for (const s of [-1, 1]) { const sd = mesh(new T3.CapsuleGeometry(0.17, 0.32, 4, 10), c, s * 0.56, -0.08, -0.04); sd.scale.set(0.9, 1, 1.35); g.add(sd); } break;
    case 'long': cap(0.668, 0.47); bangs(); { const bk = mesh(new T3.CapsuleGeometry(0.4, 0.62, 6, 12), c, 0, -0.42, -0.36); bk.scale.set(1.4, 1, 0.5); g.add(bk); } for (const s of [-1, 1]) { const sd = mesh(new T3.CapsuleGeometry(0.13, 0.55, 4, 10), c, s * 0.55, -0.25, 0.05); g.add(sd); } break;
    case 'spiky': cap(0.66, 0.42, -0.3); for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, sp = mesh(new T3.ConeGeometry(0.13, 0.36, 6), c, Math.sin(a) * 0.36, 0.56, Math.cos(a) * 0.36 - 0.05); sp.rotation.set(Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7); g.add(sp); } break;
    case 'bun': cap(); bangs(1.4); g.add(mesh(sph(0.24, 14, 10), c, 0, 0.64, -0.24)); break;
    case 'twintails': cap(); bangs(); for (const s of [-1, 1]) { g.add(mesh(sph(0.13, 10, 8), toon('#ff9fbf'), s * 0.55, 0.28, -0.2)); const tl = mesh(new T3.CapsuleGeometry(0.15, 0.5, 4, 10), c, s * 0.7, -0.08, -0.22); tl.rotation.z = s * 0.25; g.add(tl); } break;
    case 'pixie': {
      // wispy, medium-length layered pixie: soft crown, a side-swept fringe from a left part,
      // tapered layers over the ears and at the nape
      cap(0.672, 0.47, -0.3);
      for (const [x, y, z, k] of [[-0.2, 0.53, -0.06, 1], [0.17, 0.54, -0.12, 0.9], [0, 0.5, -0.32, 1.05]]) { const t = mesh(sph(0.21, 10, 8), c, x, y, z); t.scale.set(1.2 * k, 0.38 * k, 1.05 * k); g.add(t); }
      const lock = (len, rad, x, y, z, rx, rz, flat = 0.5) => { const m = mesh(new T3.ConeGeometry(rad, len, 7), c, x, y, z); m.rotation.set(rx, 0, rz); m.scale.z = flat; g.add(m); return m; };
      for (let i = 0; i < 6; i++) { const x = -0.34 + i * 0.11, y = 0.37 - i * 0.03; lock(0.34 - Math.abs(i - 2) * 0.025, 0.09, x, y, Math.sqrt(Math.max(0.02, 0.62 * 0.62 - x * x - y * y)) + 0.03, -0.5, -1.9 + i * 0.06, 0.4); }
      for (const sd of [-1, 1]) for (let j = 0; j < 3; j++) lock(0.44 - j * 0.04, 0.085, sd * (0.6 - j * 0.03), 0.02 - j * 0.03, 0.2 - j * 0.2, 0.15, Math.PI + sd * (0.18 + j * 0.05));
      for (let k = 0; k < 5; k++) lock(0.38, 0.09, -0.3 + k * 0.15, -0.06 - Math.abs(k - 2) * 0.02, -0.52 + Math.abs(k - 2) * 0.05, 0.35, Math.PI + (k - 2) * 0.12);
      break;
    }
    case 'curly': for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2, y = 0.38 + (i % 2) * 0.12; g.add(mesh(sph(0.2, 10, 8), c, Math.sin(a) * 0.5, y, Math.cos(a) * 0.5 - 0.08)); } g.add(mesh(sph(0.42, 14, 10), c, 0, 0.42, -0.08)); break;
    default: cap();
  }
  return g;
}
function cuteFigure(p, f) {
  if (!cuteOn() || !p.body) return f;
  const B = p.body, head = f.head, gap = 0.12 + B.eyeGap * 0.45, hair = hairOf(p);
  const surf = (x, y, r = 0.62) => Math.sqrt(Math.max(0.01, r * r - x * x - y * y));
  f.shines = [-1, 1].map((s) => { const m = mesh(sph(0.024, 8, 6), toon('#ffffff', { emissive: new T3.Color('#ffffff') }), s * gap + 0.024, 0.1, surf(s * gap, 0.1) + 0.045, false); head.add(m); return m; });
  const browC = toon(new T3.Color(HAIR_COLORS[hair.color] || '#5a3a2e').multiplyScalar(0.7).getStyle());
  f.brows = [-1, 1].map((s) => { const b = mesh(box(0.13, 0.03, 0.03), browC, s * gap, 0.25, surf(s * gap, 0.25) + 0.01, false); b.userData.s = s; head.add(b); return b; });
  const dark = toon('#5a2a3a');
  f.mouthOpen = mesh(sph(0.07, 12, 8), dark, 0, -0.14, surf(0, -0.14) - 0.01, false); f.mouthOpen.scale.set(1, 0.75, 0.45); head.add(f.mouthOpen);
  f.mouthFrown = mesh(new T3.TorusGeometry(0.055, 0.017, 6, 12, Math.PI), f.mouth.material, 0, -0.17, surf(0, -0.17) + 0.005, false); head.add(f.mouthFrown);
  f.mouthO = mesh(new T3.TorusGeometry(0.04, 0.016, 6, 14), f.mouth.material, 0, -0.14, surf(0, -0.14) + 0.005, false); head.add(f.mouthO);
  f.happyEyes = [-1, 1].map((s) => { const a = mesh(new T3.TorusGeometry(0.055, 0.018, 6, 10, Math.PI), f.mouth.material, s * gap, 0.04, surf(s * gap, 0.04) + 0.01, false); head.add(a); return a; });
  f.hairG = hairMesh(hair.style, hair.color); head.add(f.hairG);
  const skin = f.skin || f.body.material;
  f.hands = f.arms.map((a) => { const h = mesh(sph(0.1, 10, 8), skin, 0, -0.21, 0); a.add(h); return h; });
  const shoe = vinyl(hair.shoe || '#fffaf2');
  f.shoes = f.legs.map((l) => { const s = mesh(sph(0.13, 10, 8), shoe, 0, -0.2, 0.05); s.scale.set(1, 0.62, 1.35); l.add(s); return s; });
  [f.mouthOpen, f.mouthFrown, f.mouthO, ...f.happyEyes].forEach((m) => (m.visible = false));
  if (typeof dressLook === 'function') dressLook(p, f);
  return f;
}
function restyleHair(p) {
  const m = typeof meshes !== 'undefined' && meshes.get(p.id); if (!m || !m.head) return;
  if (m.hairG) { m.head.remove(m.hairG); disposeTree(m.hairG); }
  const hair = hairOf(p); m.hairG = hairMesh(hair.style, hair.color); m.head.add(m.hairG);
  if (m.shoes) m.shoes.forEach((s) => (s.material = vinyl(hair.shoe || '#fffaf2')));
}
const EXPR_EMO = { angry: /💢|😤|⚡|✊/, surprised: /😮|😱|❗|👀|🔄|!/, sad: /💧|🌧|☁|🤒|🤢|😷|🤕|🤧|🥵/, happy: /♥|💕|✨|😂|✿|★|✦|🎉|💻|🎁|🍲|🌐/ };
function faceExpr(p) {
  const e = p.emote && p.emote.until > now ? p.emote.ch : '';
  const po = p.pose && p.pose.until > now ? p.pose.kind : '';
  if (EXPR_EMO.angry.test(e) || po === 'fight' || po === 'defend' || po === 'jealous') return 'angry';
  if (EXPR_EMO.surprised.test(e)) return 'surprised';
  if (EXPR_EMO.sad.test(e) || p.health?.low || (p.health?.ill && ILLS[p.health.ill.id]?.sev >= 2) || p.hunger > 0.88) return 'sad';
  if (/😂/.test(e) || ['hug', 'cuddle', 'highfive', 'look'].includes(po)) return 'laugh';
  if (EXPR_EMO.happy.test(e) || po === 'patted' || po === 'snicker' || (p.task?.kind === 'event' && p.task.phase === 'do')) return 'happy';
  if (p.task?.kind === 'crowd' && W.scene?.kind === 'uproar' && W.scene.live) return 'angry';
  if (p.task?.kind === 'picket') return 'angry';
  return (p.joy || 0) > 55 ? 'happy' : 'neutral';
}
function faceUpdate(p, m, blink) {
  if (!m.brows) return;
  const expr = faceExpr(p), talking = p.bubble && p.bubble.until > now && p.bubble.text !== '…';
  const laugh = expr === 'laugh' && !blink;
  m.eyes.forEach((e) => { e.visible = !laugh; e.scale.y = (blink ? 0.2 : expr === 'sad' ? 1.05 : expr === 'surprised' ? 1.7 : expr === 'angry' ? 1.2 : 1.45) * (e.userData.ky || 1); });
  m.happyEyes.forEach((a) => (a.visible = laugh));
  m.shines.forEach((s) => (s.visible = !blink && !laugh));
  const tilt = expr === 'angry' ? 0.38 : expr === 'sad' ? -0.32 : 0;
  m.brows.forEach((b) => { b.rotation.z = b.userData.s * (tilt + (b.userData.base || 0)); b.position.y = expr === 'surprised' ? 0.3 : expr === 'sad' ? 0.24 : 0.25; });
  const talkK = talking ? Math.abs(Math.sin(now * 14 + (p.room || 0))) : 0;
  const shape = talking ? (talkK > 0.35 ? 'open' : expr === 'sad' || expr === 'angry' ? 'frown' : 'smile') : expr === 'surprised' ? 'o' : expr === 'sad' || expr === 'angry' ? 'frown' : expr === 'laugh' ? 'open' : 'smile';
  const catSmile = !!m.mouthCat && shape === 'smile' && expr !== 'happy';
  if (m.mouthCat) m.mouthCat.visible = catSmile;
  if (m.mouthExtra) m.mouthExtra.visible = shape === 'smile';
  m.mouth.visible = shape === 'smile' && !catSmile; m.mouthFrown.visible = shape === 'frown'; m.mouthO.visible = shape === 'o'; m.mouthOpen.visible = shape === 'open';
  if (shape === 'open') m.mouthOpen.scale.y = talking ? 0.45 + talkK * 0.55 : 0.8;
  if (shape === 'smile') { const rs = expr === 'happy' ? null : m.mouth.userData.rest; m.mouth.scale.set((expr === 'happy' ? 1.25 : 1) * (rs?.sx || 1), (expr === 'happy' ? 1.2 : 1) * (rs?.sy || 1), 1); m.mouth.rotation.z = Math.PI + (rs?.rot || 0); m.mouth.position.x = rs?.x || 0; }
}

// the island: grass tufts, little flowers, a hazy horizon
let horizonGlow = null;
function buildCuteWorld() {
  if (MODE !== 'host' || !cuteOn() || gfxOn()) return;
  const skipAngles = [0, 20, 62, 114, 158, 180, 212, 229, 252, 298];
  const ok = (x, z) => {
    const r = Math.hypot(x, z); if (r < 12.8 || r > 29.3) return false;
    const deg = (Math.atan2(x, -z) * 180 / Math.PI + 360) % 360;
    if (skipAngles.some((a) => Math.abs(((deg - a + 540) % 360) - 180) < (r < 26 ? 5.5 : 3.5))) return false;
    for (const b of Object.values(BLD)) { const [bx, bz] = polar(b.a, b.r); if (Math.hypot(x - bx, z - bz) < 6.5) return false; }
    if (Math.hypot(x - PLOT_AT[0], z - PLOT_AT[1]) < 4) return false;
    return true;
  };
  const pts = []; for (let i = 0; i < 2600 && pts.length < 520; i++) { const a = rand() * 6.28, r = 13 + Math.sqrt(rand()) * 16.3, x = Math.sin(a) * r, z = -Math.cos(a) * r; if (ok(x, z)) pts.push([x, z]); }
  const tuftGeo = new T3.ConeGeometry(0.07, 0.32, 4); tuftGeo.translate(0, 0.16, 0);
  const tufts = new T3.InstancedMesh(tuftGeo, makeToon({ gradientMap: gradMap }), pts.length);
  const M = new T3.Matrix4(), q = new T3.Quaternion(), s = new T3.Vector3(), v = new T3.Vector3(), col = new T3.Color();
  const greens = ['#7cc86a', '#8fd48a', '#6fbf6a', '#9be38a'];
  pts.forEach(([x, z], i) => { q.setFromAxisAngle(new T3.Vector3(0, 1, 0), rand() * 6.28); const k = 0.7 + rand() * 0.7; s.set(k, k * (0.8 + rand() * 0.6), k); M.compose(v.set(x, 0, z), q, s); tufts.setMatrixAt(i, M); tufts.setColorAt(i, col.set(pick(greens))); });
  tufts.receiveShadow = true; scene.add(tufts);
  const fl = pts.filter(() => rand() < 0.3);
  const flGeo = new T3.SphereGeometry(0.09, 7, 5); flGeo.translate(0, 0.2, 0);
  const flowers = new T3.InstancedMesh(flGeo, makeToon({ gradientMap: gradMap }), fl.length);
  const petals = ['#ffffff', '#ffe98a', '#ff9fbf', '#c9b3ff', '#ffb38a'];
  fl.forEach(([x, z], i) => { M.compose(v.set(x + 0.2, 0, z + 0.15), q.identity(), s.set(1, 1, 1)); flowers.setMatrixAt(i, M); flowers.setColorAt(i, col.set(pick(petals))); });
  scene.add(flowers);
  const n = 64, geo = new T3.CylinderGeometry(300, 300, 110, n, 1, true); const cols = [];
  const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) { const top = pos.getY(i) > 0; cols.push(1, 1, 1, top ? 0 : 0.85); }
  geo.setAttribute('color', new T3.Float32BufferAttribute(cols, 4));
  horizonGlow = new T3.Mesh(geo, new T3.MeshBasicMaterial({ vertexColors: true, transparent: true, side: T3.BackSide, depthWrite: false, fog: false }));
  horizonGlow.position.y = 40; horizonGlow.renderOrder = -1; scene.add(horizonGlow);
}
function cuteFrame() {
  if (!horizonGlow) return;
  const L = daylight(), t = W.t, dusk = t > 0.5 && t < 0.66 ? Math.sin(((t - 0.5) / 0.16) * Math.PI) : 0;
  horizonGlow.visible = !cfg.boxMode;
  horizonGlow.material.opacity = 0.2 + 0.6 * L;
  horizonGlow.material.color.set('#fff6ea').lerp(new T3.Color('#ffc2a8'), dusk * 0.8).lerp(new T3.Color('#3a4a8a'), 1 - L);
}
function hairEditorHtml(p) {
  const h = hairOf(p);
  return `<details class="note"><summary>💇 ${esc(p.name)}'s look: ${esc(HAIR_STYLES[h.style])}, ${esc(h.color)} hair</summary>
    <div class="chips" style="margin-top:6px">${Object.entries(HAIR_STYLES).map(([k, n]) => `<button class="btn" type="button" data-hair="${p.id}" data-style="${k}" aria-pressed="${h.style === k}" style="padding:3px 10px;font-size:12px">${esc(n)}</button>`).join('')}</div>
    <div class="chips" style="margin-top:6px">${Object.entries(HAIR_COLORS).map(([k, c]) => `<button class="btn" type="button" data-hair="${p.id}" data-hcolor="${k}" aria-pressed="${h.color === k}" style="padding:3px 10px;font-size:12px"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c};margin-right:4px"></i>${esc(k)}</button>`).join('')}</div></details>`;
}
function setHair(pid, style, color) {
  const p = person(pid); if (!p) return '';
  const h = hairOf(p);
  if (style && HAIR_STYLES[style]) h.style = style;
  if (color && HAIR_COLORS[color]) h.color = color;
  restyleHair(p); if (interior) interior.dirty = true;
  if (!p.today.some((m) => m.tag === 'haircut')) { remember(p, `The Creator gave me a new look: ${HAIR_STYLES[h.style].toLowerCase()}, ${h.color} hair.`, 2, 'haircut'); if (!p.inside) bubble(p, pick(['Ooh! New hair!', 'Do I look okay?', 'I feel so fresh.']), 2.6); }
  markDirty(); return '';
}
function selfHaircut(p) {
  if (rand() > 0.02 || p.grow < 1 || (typeof isRealish === 'function' && isRealish(p))) return;
  const h = hairOf(p), styles = Object.keys(HAIR_STYLES).filter((k) => k !== 'none' && k !== h.style);
  h.style = pick(styles); if (rand() < 0.3) h.color = pick(Object.keys(HAIR_COLORS));
  restyleHair(p); remember(p, `Got a new haircut: ${HAIR_STYLES[h.style].toLowerCase()}.`, 2, 'haircut');
  diary(`💇 <b>${esc(p.name)}</b> got a new haircut.`);
}

