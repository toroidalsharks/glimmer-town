// ============================================================
// SEASONS (a year is 28 days: 7 of each)
// ============================================================
const SEASONS = [
  { id: 'spring', name: 'Spring', icon: '🌸' },
  { id: 'summer', name: 'Summer', icon: '☀️' },
  { id: 'autumn', name: 'Autumn', icon: '🍁' },
  { id: 'winter', name: 'Winter', icon: '❄️' },
];
const YEAR = 28;
const seasonOf = (day = W.day) => SEASONS[Math.floor(((day - 1) % YEAR) / 7)];
const seasonDay = (day = W.day) => ((day - 1) % 7) + 1;
const yearDay = (day = W.day) => ((day - 1) % YEAR) + 1;
const dateText = (yd) => `${SEASONS[Math.floor((yd - 1) / 7)].name} ${((yd - 1) % 7) + 1}`;
const FOLIAGE = ['#7cc86a', '#8fd48a', '#b8e39a', '#9fe3a0', '#5fae5a', '#6fbf6a', '#f7b6c8', '#ffc9d6'];
const SEASON_TINT = {
  spring: { '#8fd48a': '#a6e08c', '#b8e39a': '#c8ec9e', '#f7b6c8': '#ffb3cf', '#ffc9d6': '#ffd3e2' },
  summer: { '#8fd48a': '#78c46c', '#b8e39a': '#9fd67e', '#7cc86a': '#62b556', '#f7b6c8': '#9fd67e', '#ffc9d6': '#b0dc8a' },
  autumn: { '#7cc86a': '#e07b3c', '#8fd48a': '#f0a04b', '#b8e39a': '#f4c05a', '#9fe3a0': '#e8b25a', '#5fae5a': '#c9723a', '#6fbf6a': '#b59a4a', '#f7b6c8': '#e8835a', '#ffc9d6': '#f2a05a', grass: 0.35 },
  winter: { '#7cc86a': '#e3edf7', '#8fd48a': '#edf3fa', '#b8e39a': '#f2f6fb', '#9fe3a0': '#e3edf7', '#5fae5a': '#d6e2ef', '#6fbf6a': '#dfe8f2', '#f7b6c8': '#eef2f9', '#ffc9d6': '#f4f6fb', grass: 0.85 },
};
let seasonShown = null;
function applySeason(force) {
  const S = seasonOf();
  if (!force && seasonShown === S.id) return;
  seasonShown = S.id;
  const T = SEASON_TINT[S.id];
  for (const k of FOLIAGE) { const m = matCache.get(k); if (m) m.color.set(T[k] || k); }
  const g = matCache.get(ISL.grass);
  if (g) { g.color.set(ISL.grass); if (S.id === 'autumn') g.color.lerp(new T3.Color('#c9b36a'), T.grass); if (S.id === 'winter') g.color.lerp(new T3.Color('#fbfdff'), T.grass); }
  gfxSeason(S, T);
  buildSnowmen();
}
function pickWeather(r) {
  const s = seasonOf().id;
  if (s === 'winter') return r < 0.08 ? 'storm' : r < 0.42 ? 'snow' : 'clear';
  if (s === 'summer') return r < 0.08 ? 'storm' : r < 0.16 ? 'rain' : 'clear';
  return r < 0.1 ? 'storm' : r < 0.3 ? 'rain' : 'clear';
}
const wetToday = () => W.weather === 'rain' || W.weather === 'storm';

// drifting things: petals, fireflies, leaves, snow
const DRIFT_N = 360;
let drift = null, driftGeo = null, driftSeed = [];
function buildDrift() {
  driftGeo = new T3.BufferGeometry(); driftGeo.setAttribute('position', new T3.Float32BufferAttribute(new Float32Array(DRIFT_N * 3), 3));
  const a = driftGeo.attributes.position.array;
  for (let i = 0; i < DRIFT_N; i++) { a[i * 3] = (rand() - 0.5) * 90; a[i * 3 + 1] = rand() * 30; a[i * 3 + 2] = (rand() - 0.5) * 90 - 16; driftSeed.push(rand() * 6.28); }
  drift = new T3.Points(driftGeo, softPoints({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.9, depthWrite: false }));
  drift.frustumCulled = false; scene.add(drift);
}
function seasonFrame(dt) {
  if (!drift) return;
  const S = seasonOf().id, L = daylight();
  let mode = null;
  if (S === 'winter') mode = 'snow';
  else if (S === 'spring' && W.weather === 'clear' && L > 0.5) mode = 'petal';
  else if (S === 'autumn' && W.weather !== 'storm' && L > 0.5) mode = 'leaf';
  else if (S === 'summer' && L < 0.6 && !wetToday()) mode = 'firefly';
  drift.visible = !!mode && !interior && !cfg.boxMode;
  if (!drift.visible) return;
  const M = drift.material, count = mode === 'snow' ? (W.weather === 'snow' || W.weather === 'storm' ? DRIFT_N : 140) : mode === 'firefly' ? 90 : 110;
  M.color.set(mode === 'snow' ? '#ffffff' : mode === 'petal' ? '#ffb3cf' : mode === 'leaf' ? '#f0953c' : '#e8ff8a');
  M.size = mode === 'snow' ? 0.32 : mode === 'firefly' ? 0.3 + Math.sin(now * 3) * 0.06 : 0.42;
  M.opacity = mode === 'firefly' ? 0.55 + Math.sin(now * 2.3) * 0.35 : 0.9;
  driftGeo.setDrawRange(0, count);
  const a = driftGeo.attributes.position.array, cx = controls.target.x, cz = controls.target.z;
  const fall = mode === 'snow' ? 2.2 : mode === 'firefly' ? 0 : 1.4;
  for (let i = 0; i < count; i++) {
    const s = driftSeed[i];
    if (mode === 'firefly') { a[i * 3] += Math.sin(now * 0.7 + s) * dt * 0.8; a[i * 3 + 1] = 0.8 + Math.sin(now * 0.9 + s * 3) * 0.7 + (s % 1.5); a[i * 3 + 2] += Math.cos(now * 0.6 + s) * dt * 0.8; }
    else { a[i * 3 + 1] -= fall * dt * (0.7 + (s % 1) * 0.6); a[i * 3] += Math.sin(now * 1.3 + s) * dt * (mode === 'snow' ? 0.5 : 1.4) + dt * 0.4; a[i * 3 + 2] += Math.cos(now * 1.1 + s) * dt * 0.6; }
    const far = Math.abs(a[i * 3] - cx) > 45 || Math.abs(a[i * 3 + 2] - cz) > 45;
    if (a[i * 3 + 1] < 0 || far) { a[i * 3] = cx + (rand() - 0.5) * 90; a[i * 3 + 2] = cz + (rand() - 0.5) * 90; a[i * 3 + 1] = mode === 'firefly' ? 1 : 12 + rand() * 18; }
  }
  driftGeo.attributes.position.needsUpdate = true;
  const ev = W.event && W.event.day === W.day && W.event.id === 'snowball' && W.t >= EVENTS.snowball.t0 && W.t < EVENTS.snowball.t1;
  if (ev && rand() < dt * 1.6) { const q = pick(W.people.filter((p) => p.task?.kind === 'event' && p.task.phase === 'do')); if (q) { spawnBurst(q.x, 1.4, q.z, ['#ffffff', '#e8f2ff'], 14, 1.8, 0.25); if (rand() < 0.4) bubble(q, pick(['Got you!', 'Snow in my collar!', 'Truce! TRUCE!', 'Hehe.', 'Right in the face!']), 2); } }
}

// snowmen
let snowGroup = null;
function buildSnowmen() {
  if (snowGroup) { scene.remove(snowGroup); snowGroup = null; }
  if (!W.snowmen || !W.snowmen.length) return;
  snowGroup = new T3.Group();
  const snow = toon('#fbfdff'), coal = toon('#2a2733'), carrot = toon('#ff9a3c');
  for (const s of W.snowmen) {
    const g = new T3.Group();
    g.add(mesh(sph(0.62, 14, 10), snow, 0, 0.55, 0)); g.add(mesh(sph(0.44, 14, 10), snow, 0, 1.38, 0)); g.add(mesh(sph(0.3, 12, 9), snow, 0, 1.98, 0));
    for (const e of [-0.1, 0.1]) g.add(mesh(sph(0.045, 6, 5), coal, e, 2.04, 0.27, false));
    const n = mesh(new T3.ConeGeometry(0.06, 0.3, 6), carrot, 0, 1.97, 0.4, false); n.rotation.x = Math.PI / 2; g.add(n);
    g.add(mesh(new T3.TorusGeometry(0.3, 0.07, 6, 14), toon(COLORS[s.scarf] || '#ff6f5e'), 0, 1.72, 0).rotateX(Math.PI / 2));
    for (const sd of [-1, 1]) { const arm = mesh(cyl(0.03, 0.03, 0.8, 5), toon('#8a6a4e'), sd * 0.6, 1.5, 0); arm.rotation.z = sd * 1.0; g.add(arm); }
    g.position.set(s.x, 0, s.z); g.rotation.y = s.face || 0;
    g.traverse((o) => (o.userData.tap = { kind: 'snowman', by: s.by, day: s.day }));
    snowGroup.add(g);
  }
  scene.add(snowGroup);
}
function meltSnowmen() { if (seasonOf().id !== 'winter' && W.snowmen?.length) { diary(`The last snowmen melted into puddles. ${pick(['Spring is here.', 'Bye, snowmen.'])}`); W.snowmen = []; buildSnowmen(); } }

