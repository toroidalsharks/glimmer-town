// ============================================================
// ART STYLE: the low-poly diorama town (flat facets, chunky trees and rocks)
// and the town looks (sky, light, water, menu colors), picked in Settings
// ============================================================
// each look: sky day/dusk/night, sun, hemisphere light, rim light on the
// residents, water and fountain, grass/leaf/tuft/rock colors, light strength,
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
    top: ['#7fbcec', '#b98ac4', '#141238'], hor: ['#fff1dc', '#ffb68c', '#2c2860'], duskK: [0.5, 0.9],
    sun: ['#fff2d8', '#ffbe8a', '#a8b0ff'], hemi: ['#fff1dc', '#d6c2e6', '#7078d8'], ground: ['#b0a860', '#3c3468'],
    rim: ['#fff0f6', '#ffc0a0', '#9fb8ff'], rimK: 0, light: [1, 1.15],
    water: ['#9fdcc8', '#76bcbc', '#5b98ac'], waterBox: '#0c3c6e', fountain: '#8fd0c2',
    grass: ['#d3d98c', 0.75], leaf: ['#a4ad2c', 0.72], tuft: '#ffffff',
    sat: 1.12, lift: [0.97, 0.98, 1.04], gain: [1.03, 1.0, 0.96],
    ui: { accent: '#d8e48a', accent2: '#ffb48a', glow: '210, 170, 90', bg: '#15120f', panel: '30, 25, 21' },
  },
  golden: {
    name: 'Golden hour', blurb: 'Peach skies, lavender water and honey-colored trees.', facets: true,
    top: ['#d98f6a', '#c27a88', '#1a1238'], hor: ['#f0bf96', '#ff9c78', '#2c2050'], duskK: [0.45, 0.9], fog: [80, 330], lowSun: 0.5,
    sun: ['#ffc890', '#ff9058', '#a0a8ff'], hemi: ['#ffe0c4', '#ffb094', '#6a68d0'], ground: ['#c09a70', '#3a3060'],
    rim: ['#fff0f6', '#ffc0a0', '#9fb8ff'], rimK: 0, light: [1, 1.1],
    water: ['#c4a0cc', '#9c78b0', '#86689e'], waterBox: '#2a1e5a', fountain: '#b39ad6',
    grass: ['#dcd694', 0.75], leaf: ['#dc9a2c', 0.75], tuft: '#ffe2a0',
    sat: 1.08, lift: [1.0, 0.97, 0.98], gain: [1.06, 1.0, 0.94],
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
// green leaves lean toward the look's leaf color (pink blossoms and autumn colors stay)
function moodLeaf(c) {
  const L = moodOf().leaf;
  if (L && c.g > c.r * 1.05 && c.g > c.b) c.lerp(new T3.Color(L[0]), L[1]);
  return c;
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

// the low-poly stand-in for one Blender part: tree crowns and bushes become stacked
// faceted tiers, rocks and clouds are snapped to a coarse grid, palm fronds take the
// season's leaf color, and grass tufts lose their dark roots
const FACET_SHAPE = { treeA: { tiers: 3, seed: 11 }, treeB: { tiers: 3, seed: 29 }, bushA: { tiers: 1, seed: 5, sides: 9, shoulder: 0.82 } };
const FACET_CELL = { rockA: 0.65, rockB: 0.65, rockC: 0.65, cloudA: 0.9, cloudB: 0.9 };
function facetPart(name, i, part) {
  const g = part.geo, col = g.attributes.color.array;
  if (FACET_SHAPE[name] && part.tint === 'leaf') part.geo = tierCanopy(g.boundingBox, FACET_SHAPE[name]);
  else if (FACET_CELL[name] && part.tint) part.geo = facetGeo(g, FACET_CELL[name]);
  else if (name === 'palm' && part.double) {
    let top = 0; for (let k = 0; k < col.length; k += 3) top = Math.max(top, col[k] * 0.3 + col[k + 1] * 0.59 + col[k + 2] * 0.11);
    for (let k = 0; k < col.length; k += 3) { const l = (col[k] * 0.3 + col[k + 1] * 0.59 + col[k + 2] * 0.11) / (top || 1); col[k] = col[k + 1] = col[k + 2] = 0.55 + 0.45 * l; }
    part.tint = 'leaf';
  } else if (name === 'tuft') { let top = 0; for (const v of col) top = Math.max(top, v); for (let k = 0; k < col.length; k++) col[k] = 0.74 + 0.26 * (col[k] / (top || 1)); }
  return part;
}
// a crown of stacked, slightly ragged tiers: each has a dark underside, a wide lip,
// a narrower shoulder and a peak, like the trees in a paper diorama. One shade per facet.
function tierCanopy(bb, S) {
  const r = mulberry(S.seed), lo = bb.min, hi = bb.max, cx = (lo.x + hi.x) / 2, cz = (lo.z + hi.z) / 2;
  const W = Math.min(hi.x - lo.x, hi.z - lo.z) / 2, T = S.tiers, th = (hi.y - lo.y) / (T * 0.72 + 0.28);
  const pos = [], col = [], e1 = new T3.Vector3(), e2 = new T3.Vector3(), nrm = new T3.Vector3(), out = new T3.Vector3();
  for (let t = 0; t < T; t++) {
    const f = T > 1 ? t / (T - 1) : 0, R = W * (1 - 0.45 * f), y0 = lo.y + t * th * 0.72, n = S.sides || 7 + Math.floor(r() * 3), a0 = r() * 6.2832;
    const ox = cx + (r() - 0.5) * W * 0.12, oz = cz + (r() - 0.5) * W * 0.12, mid = new T3.Vector3(ox, y0 + th * 0.45, oz), ao = 0.84 + 0.16 * f;
    const ring = (rad, y, jr, jy) => Array.from({ length: n }, (_, i) => { const a = a0 + ((i + (r() - 0.5) * 0.4) / n) * 6.2832, k = rad * (1 + (r() - 0.5) * jr); return new T3.Vector3(ox + Math.cos(a) * k, y + (r() - 0.5) * jy * th, oz + Math.sin(a) * k); });
    const lip = ring(R, y0 + th * 0.22, 0.26, 0.16), sh = ring(R * (S.shoulder || 0.7), y0 + th * 0.7, 0.28, 0.14);
    const top = new T3.Vector3(ox + (r() - 0.5) * R * 0.25, y0 + th, oz + (r() - 0.5) * R * 0.25), bot = new T3.Vector3(ox, y0, oz);
    const face = (a, b, d, k) => {
      e1.subVectors(b, a); e2.subVectors(d, a); nrm.crossVectors(e1, e2); out.copy(a).add(b).add(d).divideScalar(3).sub(mid);
      if (nrm.dot(out) < 0) [b, d] = [d, b];
      const v = k * ao * (0.94 + r() * 0.12);
      for (const q of [a, b, d]) { pos.push(q.x, q.y, q.z); col.push(v, v, v); }
    };
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      face(bot, lip[j], lip[i], 0.5); face(lip[i], lip[j], sh[j], 0.86); face(lip[i], sh[j], sh[i], 0.86); face(sh[i], sh[j], top, 1);
    }
  }
  const g = new T3.BufferGeometry();
  g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(col, 3));
  g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox();
  g.userData.keep = true;
  return g;
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
  const g = new T3.BufferGeometry();
  g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('color', new T3.BufferAttribute(col, 3));
  g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox();
  g.userData.keep = true;
  return g;
}
