// ============================================================
// ART STYLE: the low-poly diorama town (flat facets, chunky trees and rocks)
// and the town looks (sky, light, water, menu colors), picked in Settings
// ============================================================
// each look: sky day/dusk/night, sun, hemisphere light, rim light on the
// residents, water and fountain, grass/leaf/tuft/sand colors, light strength,
// the final color grade, and menu accents. facets: false builds the town smooth,
// as before. lowSun squashes the sun's height for long evening shadows, and fog
// pulls the haze in closer.
// The rim light only touches residents, so the low-poly looks keep v24's, and
// Meadow keeps v24's near-white sun and color grade so everyone's own colors stay
// true: its warmth lives in the sky, the bounce light, the grass and the leaves,
// and a stronger sky light keeps shadows soft.
const MOODS = {
  meadow: {
    name: 'Meadow', blurb: 'The low-poly diorama: a soft meadow in warm afternoon light.', facets: true,
    top: ['#7fbcec', '#b98ac4', '#141238'], hor: ['#fff1dc', '#ffb68c', '#2c2860'], duskK: [0.5, 0.9], lowSun: 0.72,
    sun: ['#fff2d8', '#ffbe8a', '#a8b0ff'], hemi: ['#fff1dc', '#d6c2e6', '#7078d8'], ground: ['#b0a860', '#3c3468'],
    rim: ['#fff0f6', '#ffc0a0', '#9fb8ff'], rimK: 0, light: [1, 1.15],
    water: ['#9ae6d0', '#5ec8c6', '#3fa6bc'], waterBox: '#0c3c6e', fountain: '#86d0cc',
    grass: ['#d3d98c', 0.75], leaf: ['#bcc44c', 0.86], tuft: '#ffffff',
    sat: 1.12, lift: [0.97, 0.98, 1.04], gain: [1.03, 1.0, 0.96],
    ui: { accent: '#d8e48a', accent2: '#ffb48a', glow: '210, 170, 90', bg: '#15120f', panel: '30, 25, 21' },
  },
  golden: {
    name: 'Golden hour', blurb: 'Peach skies, lavender water and honey-colored trees.', facets: true,
    top: ['#d98f6a', '#c27a88', '#1a1238'], hor: ['#f0bf96', '#ff9c78', '#2c2050'], duskK: [0.45, 0.9], fog: [140, 460], lowSun: 0.5,
    sun: ['#ffdcb0', '#ff9058', '#a0a8ff'], hemi: ['#f0dcd0', '#ffb094', '#6a68d0'], ground: ['#b8a888', '#3a3060'],
    rim: ['#fff0f6', '#ffc0a0', '#9fb8ff'], rimK: 0, light: [1, 1.1],
    water: ['#a88ab8', '#9a80b6', '#8a6cac'], waterBox: '#2a1e5a', fountain: '#d6bce0',
    grass: ['#dcd694', 0.75], leaf: ['#d4bc48', 0.85], tuft: '#ffe2a0', sand: '#d6bc8a',
    sat: 1.06, lift: [1.0, 0.98, 0.99], gain: [1.02, 0.99, 0.96],
    ui: { accent: '#ffcf8a', accent2: '#c9a8f0', glow: '230, 150, 110', bg: '#170f14', panel: '32, 22, 26' },
  },
  candy: {
    name: 'Candy', blurb: 'Cotton-candy skies and minty water.', facets: true,
    top: ['#8fc8ff', '#b08ae0', '#1a1440'], hor: ['#ffe6f4', '#ffb3d0', '#3a2a6a'], duskK: [0.5, 0.85],
    sun: ['#fff4ec', '#ffa6c0', '#c0b0ff'], hemi: ['#f0e6ff', '#ffc0e0', '#8a80e8'], ground: ['#d8e8b0', '#4a3a78'],
    rim: ['#fff0f6', '#ffc0a0', '#9fb8ff'], rimK: 0, light: [1, 1.1],
    water: ['#8ff5e8', '#6fd0f5', '#6a9af0'], waterBox: '#2a4a8a', fountain: null,
    grass: ['#c0f0a8', 0.4], leaf: null, tuft: null,
    sat: 1.1, lift: [1.0, 0.98, 1.03], gain: [1.04, 1.0, 1.0],
    ui: { accent: '#ffb3d6', accent2: '#9fe3d4', glow: '230, 120, 180', bg: '#1a0f26', panel: '30, 18, 40' },
  },
  hologram: {
    name: 'Hologram', blurb: 'Bright cyan and magenta with glowing edges. Made for the box.', facets: true,
    top: ['#3a8cff', '#6a3ad0', '#080a28'], hor: ['#c8f0ff', '#ff6ab0', '#1a1650'], duskK: [0.55, 0.9],
    sun: ['#f4f8ff', '#ff70a0', '#70a0ff'], hemi: ['#c8e8ff', '#ff90d0', '#5a60ff'], ground: ['#a8d0a0', '#2a2060'],
    rim: ['#a0f0ff', '#ff90e0', '#80a0ff'], rimK: 0.2, light: [1, 1],
    water: ['#40ffe8', '#20c0ff', '#2a5ae0'], waterBox: '#0a4a8a', fountain: null,
    grass: ['#80f0a0', 0.2], leaf: null, tuft: null,
    sat: 1.22, lift: [0.96, 0.97, 1.06], gain: [1.03, 1.0, 1.02],
    ui: { accent: '#7ff0ff', accent2: '#ff7ad8', glow: '60, 200, 255', bg: '#060a1e', panel: '10, 14, 34' },
  },
  storybook: {
    name: 'Storybook', blurb: 'The smooth look from before this update. The box reloads to switch.', facets: false,
    top: ['#4aa8ff', '#7a6ab8', '#0b1233'], hor: ['#dff3ff', '#ffb99a', '#1d2a5a'], duskK: [0.45, 0.85],
    sun: ['#fff3dc', '#ffa468', '#9fb4ff'], hemi: ['#cfe8ff', '#ffb0c8', '#6a78d8'], ground: ['#b9cf95', '#3a3668'],
    rim: ['#fff0f6', '#ffc0a0', '#9fb8ff'], rimK: 0, light: [1, 1],
    water: ['#5ff0e2', '#34bfe9', '#2c7ddb'], waterBox: '#0c3c6e', fountain: null,
    grass: null, leaf: null, tuft: null,
    sat: 1.12, lift: [0.97, 0.98, 1.04], gain: [1.03, 1.0, 0.96],
    ui: { accent: '#bba8ff', accent2: '#ff8fb6', glow: '110, 90, 200', bg: '#0d1330', panel: '17, 14, 28' },
  },
};
const moodOf = () => MOODS[cfg.mood] || MOODS.meadow;
// the lawn color for this look, before seasons change it
function moodGrass() {
  const M = moodOf(), c = new T3.Color(ISL.grass);
  if (M.grass) c.lerp(new T3.Color(M.grass[0]), M.grass[1]);
  return c;
}
// green leaves lean toward the look's leaf color (pink blossoms and autumn colors
// stay), keeping how light or dark they were, so pines and light trees stand apart
function moodLeaf(c) {
  const L = moodOf().leaf;
  if (!L || !(c.g > c.r * 1.05 && c.g > c.b)) return c;
  const l = c.r * 0.3 + c.g * 0.59 + c.b * 0.11;
  return c.lerp(new T3.Color(L[0]), L[1]).multiplyScalar(Math.min(1.12, Math.max(0.7, Math.pow(l / 0.66, 1.3))));
}
// menus pick up the look's accents on every device (the remote uses its own pref)
function moodMenus() {
  const U = moodOf().ui, R = document.documentElement.style;
  R.setProperty('--lilac', U.accent); R.setProperty('--accent', U.accent); R.setProperty('--accent2', U.accent2);
  R.setProperty('--glow', U.glow); R.setProperty('--bg', U.bg); R.setProperty('--panel', U.panel);
  document.body.dataset.mood = cfg.mood && MOODS[cfg.mood] ? cfg.mood : 'meadow';
}
function setMood(k) {
  if (!MOODS[k]) return;
  cfg.mood = k; savePrefs(); moodMenus();
  if (MODE !== 'host' || typeof scene === 'undefined' || !scene) return;
  // smooth and faceted shapes are built once, so switching between them reloads
  if (gfxOn() && FACET.on !== (MOODS[k].facets !== false)) { toast('Reloading to change the look…'); setTimeout(() => location.reload(), 700); return; }
  if (typeof applySeason === 'function') applySeason(true);
}
function moodSettingsHtml() {
  const cur = MOODS[cfg.mood] ? cfg.mood : 'meadow';
  return `<p class="label">Town look</p><div class="moods" role="group" aria-label="Town look">${Object.entries(MOODS).map(([k, M]) => `<button class="mood" type="button" data-mood="${k}" aria-pressed="${cur === k}"><i style="background:linear-gradient(160deg, ${M.top[0]}, ${M.hor[0]} 55%, ${M.water[0]} 56%, ${M.water[2]})"></i><b>${esc(M.name)}</b><span>${esc(M.blurb)}</span></button>`).join('')}</div>`;
}
function wireMoodSettings() {
  const box = $('#moodBox'); if (!box) return;
  box.innerHTML = moodSettingsHtml();
  box.querySelectorAll('[data-mood]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.mood;
    if (MODE === 'remote') send({ t: 'set', key: 'mood', value: k });
    setMood(k); wireMoodSettings();
  }));
}
function moodBoot() {
  W.added = W.added || {};
  if (W.added.moods1) return; W.added.moods1 = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'The town is a little diorama now: the trees are stacked low-poly tiers, bushes, rocks and clouds are chunky facets, the grass is a soft meadow and the light is warm. Everyone still looks exactly like themselves. Settings has a Town look picker: Meadow (the new look), Golden hour (peach haze, lavender water and honey trees), Candy, Hologram for the box, and Storybook, the smooth look from before. The Look studio has new styles, haircuts and accessories too.', 'a low-poly town');
}

// ---------- the low-poly town ----------
// FACET.on is decided once at startup. While a resident (or Mochi, Judge Hoot
// or a ghost) is being built, FACET.res is up and everything stays smooth.
const FACET = { on: false, res: 0 };
const facetsOn = () => FACET.on && !FACET.res;
const lowSegs = (n, max) => (facetsOn() ? Math.min(n, max) : n);
function smoothly(fn) { return function (...a) { FACET.res++; try { return fn.apply(this, a); } finally { FACET.res--; } }; }
makeFigure = smoothly(makeFigure); dressMesh = smoothly(dressMesh); hatMesh = smoothly(hatMesh);
restyleLook = smoothly(restyleLook); restyleHair = smoothly(restyleHair); healthLook = smoothly(healthLook); poseFigure = smoothly(poseFigure);
catMesh = smoothly(catMesh); owlMesh = smoothly(owlMesh); buildGhosts = smoothly(buildGhosts);

// the low-poly stand-in for one Blender part: tree crowns become stacked rounded
// clumps, blossom trees and bushes a cluster of faceted balls, rocks and clouds are
// snapped to a coarse grid, palm fronds take the season's leaf color, and grass
// tufts lose their dark roots. treeC is the blossom tree, built from treeA's parts.
const FACET_SHAPE = {
  treeA: { tiers: 3, seed: 11 }, treeB: { tiers: 2, seed: 29 },
  treeC: { from: 'treeA', balls: 5, seed: 7 }, bushA: { balls: 3, seed: 5, low: true },
};
const FACET_CELL = { rockA: 0.65, rockB: 0.65, rockC: 0.65, cloudA: 0.9, cloudB: 0.9 };
const BLOSSOM = new Set(['#f7b6c8', '#ffc9d6']);
function facetPart(name, i, part) {
  const g = part.geo, col = g.attributes.color.array, S = FACET_SHAPE[name];
  if (S && part.tint === 'leaf') part.geo = S.balls ? ballCanopy(g.boundingBox, S) : clumpCanopy(g.boundingBox, S);
  else if (FACET_CELL[name] && part.tint) part.geo = facetGeo(g, FACET_CELL[name]);
  else if (name === 'palm' && part.double) {
    let top = 0; for (let k = 0; k < col.length; k += 3) top = Math.max(top, col[k] * 0.3 + col[k + 1] * 0.59 + col[k + 2] * 0.11);
    for (let k = 0; k < col.length; k += 3) { const l = (col[k] * 0.3 + col[k + 1] * 0.59 + col[k + 2] * 0.11) / (top || 1); col[k] = col[k + 1] = col[k + 2] = 0.55 + 0.45 * l; }
    part.tint = 'leaf';
  } else if (name === 'tuft') { let top = 0; for (const v of col) top = Math.max(top, v); for (let k = 0; k < col.length; k++) col[k] = 0.74 + 0.26 * (col[k] / (top || 1)); }
  return part;
}
function flatGeo(pos, col) {
  const g = new T3.BufferGeometry();
  g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(col, 3));
  g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox();
  g.userData.keep = true;
  return g;
}
// a crown of stacked, rounded clumps with ragged overhanging edges, widest in the
// middle, like the olive trees in a paper diorama. One shade per facet.
function clumpCanopy(bb, S) {
  const r = mulberry(S.seed), lo = bb.min, hi = bb.max, cx = (lo.x + hi.x) / 2, cz = (lo.z + hi.z) / 2;
  const W = Math.min(hi.x - lo.x, hi.z - lo.z) / 2, T = S.tiers, th = (hi.y - lo.y) / (T * 0.66 + 0.34);
  const widths = T === 3 ? [0.9, 1, 0.74] : [1, 0.8];
  const pos = [], col = [], e1 = new T3.Vector3(), e2 = new T3.Vector3(), nrm = new T3.Vector3(), out = new T3.Vector3();
  for (let t = 0; t < T; t++) {
    const f = T > 1 ? t / (T - 1) : 0, R = W * widths[t] * (0.95 + r() * 0.1), y0 = lo.y + t * th * 0.66, n = 8 + Math.floor(r() * 3), a0 = r() * 6.2832;
    const ox = cx + (r() - 0.5) * W * 0.14, oz = cz + (r() - 0.5) * W * 0.14, mid = new T3.Vector3(ox, y0 + th * 0.5, oz), ao = 0.9 + 0.1 * f;
    // the lip scallops in and out, so each tier's edge looks torn rather than turned
    const ring = (rad, y, jr, jy, sc = 0) => Array.from({ length: n }, (_, i) => { const a = a0 + ((i + (r() - 0.5) * 0.35) / n) * 6.2832, k = rad * (1 + (r() - 0.5) * jr + (i % 2 ? sc : -sc)); return new T3.Vector3(ox + Math.cos(a) * k, y + (r() - 0.5) * jy * th, oz + Math.sin(a) * k); });
    const lip = ring(R * 0.98, y0 + th * 0.12, 0.16, 0.2, 0.07), belly = ring(R, y0 + th * 0.36, 0.12, 0.1), sh = ring(R * 0.8, y0 + th * 0.7, 0.14, 0.1), crown = ring(R * 0.42, y0 + th * 0.93, 0.2, 0.06);
    const top = new T3.Vector3(ox + (r() - 0.5) * R * 0.15, y0 + th, oz + (r() - 0.5) * R * 0.15), bot = new T3.Vector3(ox, y0 + th * 0.2, oz);
    const face = (a, b, d, k) => {
      e1.subVectors(b, a); e2.subVectors(d, a); nrm.crossVectors(e1, e2); out.copy(a).add(b).add(d).divideScalar(3).sub(mid);
      if (nrm.dot(out) < 0) [b, d] = [d, b];
      const v = ao * (0.95 + r() * 0.1);
      for (const q of [a, b, d]) { pos.push(q.x, q.y, q.z); col.push(k[0] * v, k[1] * v, k[2] * v); }
    };
    const band = (A, B, k) => { for (let i = 0; i < n; i++) { const j = (i + 1) % n; face(A[i], A[j], B[j], k); face(A[i], B[j], B[i], k); } };
    // warm, dark undersides under every shelf, like the shade under a real crown
    for (let i = 0; i < n; i++) face(bot, lip[(i + 1) % n], lip[i], [0.52, 0.48, 0.36]);
    band(lip, belly, [0.95, 0.93, 0.86]); band(belly, sh, [1, 1, 1]); band(sh, crown, [1.04, 1.04, 1.02]);
    for (let i = 0; i < n; i++) face(crown[i], crown[(i + 1) % n], top, [1.08, 1.08, 1.04]);
  }
  return flatGeo(pos, col);
}
// a cloud of faceted balls, for blossom trees and bushes
function ballCanopy(bb, S) {
  const r = mulberry(S.seed), lo = bb.min, hi = bb.max, cx = (lo.x + hi.x) / 2, cz = (lo.z + hi.z) / 2;
  const W = Math.min(hi.x - lo.x, hi.z - lo.z) / 2, H = hi.y - lo.y, pos = [], col = [];
  const balls = [[0, S.low ? 0.5 : 0.52, 0, S.low ? 0.62 : 0.5]];
  for (let i = 1; i < S.balls; i++) {
    const last = i === S.balls - 1 && !S.low, a = (i / (S.balls - (S.low ? 0 : 1))) * 6.2832 + r() * 0.8, d = last ? 0.12 : 0.52 + r() * 0.1;
    balls.push([Math.cos(a) * d, last ? 0.78 : (S.low ? 0.42 : 0.4) + r() * 0.12, Math.sin(a) * d, last ? 0.34 : (S.low ? 0.46 : 0.4) + r() * 0.08]);
  }
  for (const [bx, by, bz, br] of balls) {
    const g = new T3.IcosahedronGeometry(1, 1), P = g.attributes.position.array, rad = br * W, sy = S.low ? 0.8 : 0.92;
    // nudge each corner in or out, the same amount wherever it is shared
    const bump = new Map();
    for (let k = 0; k < P.length; k += 3) {
      const key = `${P[k].toFixed(3)},${P[k + 1].toFixed(3)},${P[k + 2].toFixed(3)}`; if (!bump.has(key)) bump.set(key, 0.9 + r() * 0.2);
      const s = bump.get(key);
      pos.push(cx + bx * W + P[k] * rad * s, lo.y + by * H + P[k + 1] * rad * s * sy, cz + bz * W + P[k + 2] * rad * s);
    }
    for (let k = 0; k < P.length; k += 9) {
      const ny = (P[k + 1] + P[k + 4] + P[k + 7]) / 3, v = (ny < -0.35 ? 0.72 : ny < 0.2 ? 0.92 : 1.02) * (0.95 + r() * 0.1);
      for (let j = 0; j < 3; j++) col.push(v, v, v);
    }
    g.dispose();
  }
  return flatGeo(pos, col);
}
// snap the corners of a smooth part to a coarse grid, average each cell, drop the
// triangles that collapse, then give every facet one flat normal and one color.
// Tries a few grid offsets and keeps the first one with no holes or folds.
function facetGeo(src, h) {
  const P = src.attributes.position.array, Cs = src.attributes.color.array, n = src.attributes.position.count, I = src.index ? src.index.array : null, nt = (I ? I.length : n) / 3;
  const key = new Map(), weld = new Int32Array(n), wp = [], wc = [];
  for (let i = 0; i < n; i++) {
    const k = `${P[i * 3]},${P[i * 3 + 1]},${P[i * 3 + 2]}`; let j = key.get(k);
    if (j === undefined) { j = wp.length / 3; key.set(k, j); wp.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); wc.push(Cs[i * 3], Cs[i * 3 + 1], Cs[i * 3 + 2]); }
    weld[i] = j;
  }
  const vi = (t, c) => weld[I ? I[t * 3 + c] : t * 3 + c], nv = wp.length / 3, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], wp[i * 3 + k]); hi[k] = Math.max(hi[k], wp[i * 3 + k]); }
  const cross = (A, a, b, c) => { const ux = A[b * 3] - A[a * 3], uy = A[b * 3 + 1] - A[a * 3 + 1], uz = A[b * 3 + 2] - A[a * 3 + 2], vx = A[c * 3] - A[a * 3], vy = A[c * 3 + 1] - A[a * 3 + 1], vz = A[c * 3 + 2] - A[a * 3 + 2]; return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; };
  let best = null;
  for (let o = 0; o < 64 && !(best && best.bad === 0); o++) {
    const off = [(o & 3) / 4, ((o >> 2) & 3) / 4, ((o >> 4) & 3) / 4], cells = new Map(), cOf = new Int32Array(nv), sum = [];
    for (let i = 0; i < nv; i++) {
      const g = [0, 1, 2].map((k) => Math.floor((wp[i * 3 + k] - lo[k]) / h + off[k])).join(',');
      let c = cells.get(g); if (c === undefined) { c = sum.length / 7; cells.set(g, c); sum.push(0, 0, 0, 0, 0, 0, 0); }
      cOf[i] = c; for (let k = 0; k < 3; k++) { sum[c * 7 + k] += wp[i * 3 + k]; sum[c * 7 + 3 + k] += wc[i * 3 + k]; } sum[c * 7 + 6]++;
    }
    const nc = sum.length / 7, CP = new Float32Array(nc * 3), CC = new Float32Array(nc * 3);
    for (let c = 0; c < nc; c++) for (let k = 0; k < 3; k++) { CP[c * 3 + k] = sum[c * 7 + k] / sum[c * 7 + 6]; CC[c * 3 + k] = sum[c * 7 + 3 + k] / sum[c * 7 + 6]; }
    const seen = new Set(), tris = [], edges = new Map(); let bad = 0;
    for (let t = 0; t < nt; t++) {
      const a0 = vi(t, 0), b0 = vi(t, 1), c0 = vi(t, 2), a = cOf[a0], b = cOf[b0], c = cOf[c0];
      if (a === b || b === c || a === c) continue;
      const sk = [a, b, c].sort((x, y) => x - y).join(','); if (seen.has(sk)) continue; seen.add(sk);
      const n1 = cross(CP, a, b, c); if (Math.hypot(...n1) < 1e-6) continue;
      const n0 = cross(wp, a0, b0, c0); if (n0[0] * n1[0] + n0[1] * n1[1] + n0[2] * n1[2] < 0) bad++;
      tris.push(a, b, c);
      for (const [x, y] of [[a, b], [b, c], [c, a]]) { const ek = x < y ? x * 65536 + y : y * 65536 + x; edges.set(ek, (edges.get(ek) || 0) + 1); }
    }
    for (const v of edges.values()) if (v !== 2) bad++;
    if (!best || bad < best.bad) best = { bad, tris, CP, CC };
  }
  // put the silhouette back to its old size (averaging shrinks it a little)
  const { tris, CP, CC } = best, nlo = [1e9, 1e9, 1e9], nhi = [-1e9, -1e9, -1e9];
  for (const c of tris) for (let k = 0; k < 3; k++) { nlo[k] = Math.min(nlo[k], CP[c * 3 + k]); nhi[k] = Math.max(nhi[k], CP[c * 3 + k]); }
  const pos = new Float32Array(tris.length * 3), col = new Float32Array(tris.length * 3);
  for (let t = 0; t < tris.length; t += 3) for (let k = 0; k < 3; k++) {
    const avg = (CC[tris[t] * 3 + k] + CC[tris[t + 1] * 3 + k] + CC[tris[t + 2] * 3 + k]) / 3, s = (hi[k] - lo[k]) / Math.max(1e-6, nhi[k] - nlo[k]);
    for (let j = 0; j < 3; j++) { const v = CP[tris[t + j] * 3 + k]; pos[(t + j) * 3 + k] = (lo[k] + hi[k]) / 2 + (v - (nlo[k] + nhi[k]) / 2) * s; col[(t + j) * 3 + k] = avg; }
  }
  return flatGeo(pos, col);
}
// a garden sprout: five folded leaf blades fanned out from the middle. Both sides
// are built, so it takes the plain season-colored leaf material.
let sproutG = null;
function sproutGeo() {
  if (sproutG) return sproutG;
  const pos = [], tri = (a, b, c) => pos.push(...a, ...b, ...c, ...a, ...c, ...b);
  for (let i = 0; i < 5; i++) {
    const a = i * 1.2566 + 0.3, up = i === 4, reach = up ? 0.08 : 0.3, h = up ? 0.62 : 0.42, ca = Math.cos(a), sa = Math.sin(a);
    const tip = [ca * reach, h, sa * reach], mid = [ca * reach * 0.5, h * 0.62, sa * reach * 0.5], w = 0.11;
    const L = [mid[0] - sa * w, mid[1] - 0.03, mid[2] + ca * w], R = [mid[0] + sa * w, mid[1] - 0.03, mid[2] - ca * w], rib = [mid[0], mid[1] + 0.03, mid[2]];
    tri([0, 0, 0], L, rib); tri(L, tip, rib); tri([0, 0, 0], rib, R); tri(rib, tip, R);
  }
  sproutG = new T3.BufferGeometry(); sproutG.setAttribute('position', new T3.Float32BufferAttribute(pos, 3));
  sproutG.computeVertexNormals(); sproutG.computeBoundingSphere(); sproutG.userData.keep = true;
  return sproutG;
}
