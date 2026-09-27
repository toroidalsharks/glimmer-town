// ============================================================
// ART STYLE: the low-poly diorama town (flat facets, chunky trees and rocks)
// and the town looks (sky, light, water, menu colors), picked in Settings
// ============================================================
// each look: sky day/dusk/night, sun, hemisphere light, rim light on the
// residents, water, grass/leaf/tuft tints, light strength, the final color
// grade, and menu accents. facets: false builds the town smooth, as before.
// The rim light only touches residents, so the low-poly looks keep v24's, and
// Meadow keeps v24's near-white sun and color grade so everyone's own colors stay
// true: its warmth lives in the sky, the bounce light, the grass and the leaves.
const MOODS = {
  meadow: {
    name: 'Meadow', blurb: 'The low-poly diorama: a soft meadow in warm afternoon light.', facets: true,
    top: ['#7fbcec', '#b98ac4', '#141238'], hor: ['#fff1dc', '#ffb68c', '#2c2860'], duskK: [0.5, 0.9],
    sun: ['#fff2d8', '#ffae6e', '#a8b0ff'], hemi: ['#e6efff', '#ffc8a8', '#7078d8'], ground: ['#cfc690', '#3c3468'],
    rim: ['#fff0f6', '#ffc0a0', '#9fb8ff'], rimK: 0, light: [1.25, 0.68],
    water: ['#a6e6d2', '#7ccad6', '#6c9fcc'], waterBox: '#0c3c6e',
    grass: ['#d3d98c', 0.75], leaf: ['#c2cf52', 0.55], tuft: '#f6f0b8',
    sat: 1.12, lift: [0.97, 0.98, 1.04], gain: [1.03, 1.0, 0.96],
    ui: { accent: '#d8e48a', accent2: '#ffb48a', glow: '210, 170, 90', bg: '#15120f', panel: '30, 25, 21' },
  },
  golden: {
    name: 'Golden hour', blurb: 'Peach skies, lavender water and honey-colored trees.', facets: true,
    top: ['#eea07e', '#c27a98', '#1a1238'], hor: ['#ffd9b4', '#ff9c78', '#2c2050'], duskK: [0.45, 0.9],
    sun: ['#ffd9a4', '#ff9058', '#a0a8ff'], hemi: ['#ffe2cc', '#ffb094', '#6a68d0'], ground: ['#d6bc92', '#3a3060'],
    rim: ['#fff0f6', '#ffc0a0', '#9fb8ff'], rimK: 0, light: [1.08, 0.82],
    water: ['#cfb2ec', '#a78ee0', '#8472cc'], waterBox: '#2a1e5a',
    grass: ['#dcd886', 0.6], leaf: ['#e6c244', 0.55], tuft: '#fff0b0',
    sat: 1.06, lift: [1.0, 0.97, 0.98], gain: [1.07, 1.0, 0.93],
    ui: { accent: '#ffcf8a', accent2: '#c9a8f0', glow: '230, 150, 110', bg: '#170f14', panel: '32, 22, 26' },
  },
  candy: {
    name: 'Candy', blurb: 'Cotton-candy skies and minty water.', facets: true,
    top: ['#8fc8ff', '#b08ae0', '#1a1440'], hor: ['#ffe6f4', '#ffb3d0', '#3a2a6a'], duskK: [0.5, 0.85],
    sun: ['#fff4ec', '#ffa6c0', '#c0b0ff'], hemi: ['#f0e6ff', '#ffc0e0', '#8a80e8'], ground: ['#d8e8b0', '#4a3a78'],
    rim: ['#fff0f6', '#ffc0a0', '#9fb8ff'], rimK: 0, light: [1.05, 0.9],
    water: ['#8ff5e8', '#6fd0f5', '#6a9af0'], waterBox: '#2a4a8a',
    grass: ['#c0f0a8', 0.4], leaf: null, tuft: null,
    sat: 1.04, lift: [1.0, 0.98, 1.03], gain: [1.04, 1.0, 1.0],
    ui: { accent: '#ffb3d6', accent2: '#9fe3d4', glow: '230, 120, 180', bg: '#1a0f26', panel: '30, 18, 40' },
  },
  hologram: {
    name: 'Hologram', blurb: 'Bright cyan and magenta with glowing edges. Made for the box.', facets: true,
    top: ['#3a8cff', '#6a3ad0', '#080a28'], hor: ['#c8f0ff', '#ff6ab0', '#1a1650'], duskK: [0.55, 0.9],
    sun: ['#f4f8ff', '#ff70a0', '#70a0ff'], hemi: ['#c8e8ff', '#ff90d0', '#5a60ff'], ground: ['#a8d0a0', '#2a2060'],
    rim: ['#a0f0ff', '#ff90e0', '#80a0ff'], rimK: 0.2, light: [1, 1],
    water: ['#40ffe8', '#20c0ff', '#2a5ae0'], waterBox: '#0a4a8a',
    grass: ['#80f0a0', 0.2], leaf: null, tuft: null,
    sat: 1.22, lift: [0.96, 0.97, 1.06], gain: [1.03, 1.0, 1.02],
    ui: { accent: '#7ff0ff', accent2: '#ff7ad8', glow: '60, 200, 255', bg: '#060a1e', panel: '10, 14, 34' },
  },
  storybook: {
    name: 'Storybook', blurb: 'The smooth look from before this update. The box reloads to switch.', facets: false,
    top: ['#4aa8ff', '#7a6ab8', '#0b1233'], hor: ['#dff3ff', '#ffb99a', '#1d2a5a'], duskK: [0.45, 0.85],
    sun: ['#fff3dc', '#ffa468', '#9fb4ff'], hemi: ['#cfe8ff', '#ffb0c8', '#6a78d8'], ground: ['#b9cf95', '#3a3668'],
    rim: ['#fff0f6', '#ffc0a0', '#9fb8ff'], rimK: 0, light: [1, 1],
    water: ['#5ff0e2', '#34bfe9', '#2c7ddb'], waterBox: '#0c3c6e',
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
  if (typeof logUpdate === 'function') logUpdate('build', 'The town is a little diorama now: trees, bushes, rocks and clouds are chunky low-poly shapes, the grass is a soft meadow and the light is warm. Everyone still looks exactly like themselves. Settings has a Town look picker: Meadow (the new look), Golden hour (peach sky and lavender water), Candy, Hologram for the box, and Storybook, the smooth look from before. The Look studio has new styles, haircuts and accessories too.', 'a low-poly town');
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

// Blender parts that get chunky: the grid cell each one is snapped to
const FACET_CELL = { treeA: [1.1], treeB: [1.1], bushA: [0.55], rockA: [0.65], rockB: [0.65], rockC: [0.65], cloudA: [0.9], cloudB: [0.9] };
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
