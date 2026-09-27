// ============================================================
// STARLINE: the busy city quarter across a bridge east of downtown
// ============================================================
// It opens once the town is big enough (STARLINE_OPEN), adds Starline Tower
// with the last four rooms (the town tops out at POP_CAP residents), five new
// jobs, a cinema, a radio station, food trucks, a dance studio, a monorail
// and traffic. Everything is built from local coordinates around SL.
const SL = { x: 81, z: -58, R: 30 };
const POP_CAP = 25;
const STARLINE_OPEN = { people: 15, day: 40 };
const slw = (x, z) => [SL.x + x, SL.z + z];
const SL_WALK = [polarDT(83, 11), polarDT(83, 31)];
const SL_HUB = slw(-13, 0);
const SL_LINK = [...SL_WALK, slw(-30, 0), SL_HUB];
const SL_PLACES = {
  tower: { name: 'Starline Tower', spot: [-13, -7.8], via: [] },
  cinema: { name: 'Starlight Cinema', spot: [12, -8.3], via: [[-11, -8.3]] },
  studio: { name: 'Beat Box Studio', spot: [0, -16.5], via: [[-11, -8.3], [0, -8.8]] },
  station: { name: 'Starline Station', spot: [15.6, 1.8], via: [[-6, 2.6], [6, 2.6]] },
  trucks: { name: 'the Starline food trucks', spot: [-16, 4.3], via: [[-15, 2.6]] },
  radio: { name: 'Glimmer FM', spot: [10, 9.2], via: [[-6, 2.6], [2, 8.8]] },
  city: { name: 'Starline', spot: [0, 3.6], via: [[-6, 2.6]] },
};
for (const [k, P] of Object.entries(SL_PLACES)) {
  const local = [SL_HUB, ...P.via.map(([x, z]) => slw(x, z))];
  TOWN[k] = { name: P.name, spot: slw(...P.spot), entry: [...DT_GATE, DT_HUB, ...SL_WALK, slw(-30, 0), ...local], local, fromDT: [...SL_WALK, slw(-30, 0), ...local], zone: 'city' };
}
Object.assign(JOBS, {
  conductor: { short: 'Starline conductor', title: 'conductor on the Starline monorail', place: 'station', pay: 4, collar: 'blue', indoor: true, until: 0.58, city: true },
  trucks: { short: 'food truck cook', title: 'cook at the Starline food trucks', place: 'trucks', pay: 3, collar: 'service', until: 0.58, city: true },
  projection: { short: 'projectionist', title: 'projectionist at Starlight Cinema', place: 'cinema', pay: 3, collar: 'service', indoor: true, until: 0.58, city: true },
  radio: { short: 'radio host', title: 'radio host at Glimmer FM', place: 'radio', pay: 4, collar: 'service', indoor: true, until: 0.3, city: true },
  dance: { short: 'dance teacher', title: 'dance teacher at Beat Box Studio', place: 'studio', pay: 3, collar: 'service', until: 0.5, city: true },
});
const SL_FOODS = [
  { id: 'dumplings', shop: 'trucks', name: 'dumplings', price: 3, fill: 0.4, fl: { sweet: 0.1, salty: 0.7, spicy: 0.15 }, mod: true, color: '#f6efe0' },
  { id: 'takoyaki', shop: 'trucks', name: 'takoyaki', price: 3, fill: 0.35, fl: { sweet: 0.2, salty: 0.6, spicy: 0.05 }, mod: true, color: '#c98a4a' },
  { id: 'skewers', shop: 'trucks', name: 'grilled skewers', price: 4, fill: 0.5, fl: { sweet: 0.2, salty: 0.6, spicy: 0.5 }, mod: true, color: '#b8573a' },
  { id: 'bao', shop: 'trucks', name: 'bao buns', price: 3, fill: 0.4, fl: { sweet: 0.4, salty: 0.4, spicy: 0.1 }, mod: true, color: '#fff8ee' },
  { id: 'crepes', shop: 'trucks', name: 'strawberry crepes', price: 2, fill: 0.25, fl: { sweet: 0.9, salty: 0.05, spicy: 0 }, mod: true, color: '#ffc4d6' },
];
const SL_FILMS = ['Moonlight Pancakes', 'The Pigeon Who Knew Too Much', 'Starfall 2: Falling Harder', 'Love at First Byte', 'Attack of the Giant Berries', 'Grandma Owl Goes to Space', 'The Great Seashell Heist', 'Fourteen Umbrellas', 'Night Bus to Glimmer', 'The Ferry That Never Came', 'Frog Prince, Esq.', 'Snowman Summer'];
const SL_SONGS = ['Moonbean Morning', 'Ferry Lights', 'Pigeon Waltz', 'Sundae Drive', 'Starline Nights', 'Low Tide Lullaby', 'Berry Mart Blues', 'Lanterns Over the Plaza'];
const SL_TASKS = ['movie', 'streetfood', 'dance'];
OBSTACLES.push([SL.x, SL.z, 2.1]);

// ---------- state ----------
function cityOpen() { return !!(W && W.city && W.city.open); }
function jobOpen(k) { return !!JOBS[k] && (!JOBS[k].city || cityOpen()); }
function roomCount() { return cityOpen() ? POP_CAP : MAX_POP; }
function residentCount() { return W.people.filter((p) => !p.visitor).length; }
function cityDue() { return residentCount() >= STARLINE_OPEN.people || W.day >= STARLINE_OPEN.day; }
const cityFilm = () => SL_FILMS[((W.city?.film ?? W.day) % SL_FILMS.length + SL_FILMS.length) % SL_FILMS.length];
const slFree = (p) => p && p.grow >= 1 && !p.visitor && !p.away && !(typeof jailed === 'function' && jailed(p));
const slWorking = (job) => W.people.find((p) => p.job === job && slFree(p) && p.task?.kind === 'work' && p.task.phase === 'do');
const slStaff = (job) => W.people.find((p) => p.job === job && slFree(p));
function cityShopOn() {
  if (!SHOPS.trucks) SHOPS.trucks = { name: 'Starline Food Trucks', job: 'trucks', blurb: 'Street food from three trucks in Starline, cooked by whoever has the grill today.' };
  for (const f of SL_FOODS) if (!FOODS.some((x) => x.id === f.id)) FOODS.push({ ...f });
}

// ---------- the one-time opening, and every boot after ----------
function cityBoot() {
  if (cityOpen()) { cityShopOn(); if (MODE === 'host') buildCity(); return; }
  if (cityDue()) cityUnlock();
}
function cityUnlock() {
  if (cityOpen()) return;
  W.city = { open: true, day: W.day, film: W.day, market: false };
  W.added = W.added || {};
  cityShopOn();
  if (MODE === 'host' && typeof scene !== 'undefined' && scene) buildCity();
  const hired = cityHire(3);
  diary(`🌃 <b>Starline</b> opened across the new bridge east of downtown: Starline Tower, Starlight Cinema, Glimmer FM, the food trucks, Beat Box Studio and a monorail over the avenue.${hired.length ? ` ${andList(hired.map((p) => `<b>${esc(p.name)}</b> (${JOBS[p.job].short})`))} took the first jobs there.` : ''}`);
  for (const p of W.people) if (!p.visitor && rand() < 0.6) remember(p, 'A whole new city quarter called Starline opened across the bridge east of downtown. There is a cinema, a radio station, food trucks and a monorail.', 2, 'starline');
  if (!W.added.starline) {
    W.added.starline = true;
    if (typeof logUpdate === 'function') logUpdate('build', `Built Starline, a busy city quarter east of downtown. It has Starline Tower with rooms 22 to 25, a cinema, a radio station, food trucks, a dance studio, a monorail and traffic. Five new jobs came with it. The town now holds at most ${POP_CAP} residents.`, 'Starline');
  }
  if (MODE === 'host') { toast('🌃 Starline is open! Take the bridge east of downtown.'); if (typeof Sound !== 'undefined') Sound.levelup(); if (typeof controls !== 'undefined' && controls && !interior) camGoal = { x: SL.x, z: SL.z + 4, r: 62 }; }
  markDirty();
}
// fill the new jobs from people nobody would miss at their old one; real people keep their jobs
function cityHire(max) {
  const out = [], count = (j) => W.people.filter((q) => q.job === j).length;
  const cand = () => W.people.filter((p) => slFree(p) && p.job && !JOBS[p.job].city && !isRealish(p) && !p.style && !p.lovesMili && !p.custom && collarOf(p) !== 'white' && count(p.job) >= 2).sort((a, b) => count(b.job) - count(a.job) || rand() - 0.5)[0];
  for (const job of ['conductor', 'trucks', 'projection', 'radio', 'dance']) {
    if (out.length >= max) break;
    if (count(job)) continue;
    const p = cand(); if (!p) break;
    const old = p.job; p.job = job; p.jobDays = 0; p.jobMood = 0.3;
    if (typeof dressMesh === 'function' && typeof meshes !== 'undefined' && meshes.get(p.id)) dressMesh(p);
    remember(p, `I left my job as a ${JOBS[old].short} to become the ${JOBS[job].short} in Starline. New city, new me.`, 3, 'hired');
    out.push(p);
  }
  return out;
}

// ---------- every morning ----------
function cityDaily() {
  if (!cityOpen()) { if (cityDue()) cityUnlock(); return; }
  W.city.film = W.day; W.city.market = W.day % 3 === 0; W.city.marketSaid = false;
  if (rand() < 0.3) { const empty = ['conductor', 'trucks', 'projection', 'radio', 'dance'].filter((j) => !W.people.some((q) => q.job === j)); if (empty.length) { const h = cityHire(1)[0]; if (h) diary(`💼 <b>${esc(h.name)}</b> took a job in Starline as the ${JOBS[h.job].short}.`); } }
  radioShow();
}
function radioShow() {
  const host = slStaff('radio'); if (!host) return;
  const love = (W.records || []).filter((r) => r.day >= W.day - 1 && ['dating', 'engaged', 'married'].includes(r.kind)).map((r) => (r.who || []).map(person).filter(Boolean)).filter((L) => L.length >= 2).slice(-1)[0];
  let line, plain;
  if (love && rand() < 0.7) {
    const names = love.slice(0, 2).map((q) => q.name);
    line = `sent congratulations to ${andList(names.map((n) => `<b>${esc(n)}</b>`))} on air.`; plain = `sent congratulations to ${andList(names)} on air.`;
    for (const q of love) remember(q, `${host.name} congratulated us on Glimmer FM this morning.`, 1, 'radio', host.name);
  } else {
    const pairs = [];
    for (const a of W.people) for (const b of W.people) if (a !== b && !a.visitor && !b.visitor && a !== host && (b.feelings[a.id]?.score || 0) >= 4) pairs.push([a, b]);
    if (pairs.length && rand() < 0.65) {
      const [a, b] = pick(pairs), song = pick(SL_SONGS);
      line = `played "${song}" for <b>${esc(a.name)}</b>, from <b>${esc(b.name)}</b>.`; plain = `played "${song}" for ${a.name}, from ${b.name}.`;
      remember(a, `${b.name} asked Glimmer FM to play "${song}" for me.`, 2, 'radio', b.name); feel(a, b, 0.3, true);
    } else {
      const song = pick(SL_SONGS), wx = { clear: 'clear skies', rain: 'rain', storm: 'a storm', snow: 'snow', cloudy: 'clouds', fog: 'fog' }[W.weather] || W.weather;
      line = `played "${song}" and called ${esc(wx)} for today.`; plain = `played "${song}" and called ${wx} for today.`;
    }
  }
  diary(`📻 <b>Glimmer FM</b>: ${esc(host.name)} ${line}`);
  remember(host, `Hosted the morning show on Glimmer FM and ${plain}`, 1, 'radio');
}

// ---------- what residents do there ----------
function cityPlan(p) {
  if (!cityOpen() || p.visitor || p.grow < 0.6) return false;
  const t = W.t, money = !p.saving && purse(p) >= 2;
  if (t > 0.42 && t < 0.57 && money && slWorking('projection') && rand() < 0.1) { setTask(p, 'movie', 'cinema', jitter(TOWN.cinema.spot, 1.2)); return true; }
  if (t > 0.26 && t < 0.5 && slWorking('dance') && rand() < 0.08) { setTask(p, 'dance', 'studio', jitter([TOWN.studio.spot[0], TOWN.studio.spot[1] + 1.8], 4)); return true; }
  if (W.city.market && t > 0.45 && t < 0.58 && money && slWorking('trucks') && rand() < 0.25) { setTask(p, 'streetfood', 'trucks', jitter(TOWN.trucks.spot, 3)); return true; }
  return false;
}
function cityEatPlan(p) {
  if (!cityOpen() || p.saving || purse(p) < 3 || !slWorking('trucks') || rand() > 0.22) return false;
  setTask(p, 'streetfood', 'trucks', jitter(TOWN.trucks.spot, 3)); return true;
}
function cityStroll() {
  if (!cityOpen() || rand() > 0.16) return null;
  const r = rand();
  if (r < 0.45) { const a = rand() * 6.28, rr = 2.4 + rand() * 4.5; return ['city', slw(Math.cos(a) * rr, Math.sin(a) * rr * 0.7)]; }
  if (r < 0.7) return ['city', slw(-4 + rand() * 8, 19 + rand() * 4)];
  return ['trucks', jitter(TOWN.trucks.spot, 4)];
}
function cityStart(p, k) {
  if (!SL_TASKS.includes(k)) return false;
  if (k === 'movie') { p.inside = true; p.busyUntil = now + 7 * ts(); return true; }
  if (k === 'streetfood') { p.busyUntil = now + 3 * ts(); p.face = Math.PI; const c = slWorking('trucks'); if (c) W.keeper.trucks = c.id; return true; }
  p.busyUntil = now + 5 * ts(); p.face = 0; emote(p, '🎵', 4); bubble(p, pick(['Five, six, seven, eight!', 'Left, right, spin!', 'My feet have a mind of their own.', "I'm getting it. I'm getting it!"]), 2.6);
  return true;
}
function cityFinish(p, k) {
  if (k === 'movie') {
    p.inside = false;
    if (purse(p) < 2) { bubble(p, 'Sold out of tickets for me.', 2.2); return; }
    spend(p, 2); const film = cityFilm(), liked = rand() < 0.55 + (p.body.openness || 0) * 0.2;
    addJoy(p, liked ? 10 : 3);
    bubble(p, liked ? pick([`"${film}" was so good!`, 'I cried a little. Good crying.', 'Best movie ever.']) : pick([`"${film}"… was a movie.`, 'I fell asleep in the middle.', 'The popcorn was the best part.']), 2.8);
    remember(p, `Watched "${film}" at Starlight Cinema. ${liked ? 'Loved it.' : 'It was not for me.'}`, 1, 'movie', null, { film, liked });
    slTogether(p, 'movie', 'watched a movie with');
    const pr = slStaff('projection'); if (pr && pr !== p) earn(pr, 1);
  } else if (k === 'streetfood') {
    if (slWorking('trucks')) eatAt(p, 'trucks'); else bubble(p, 'The trucks closed up already.', 2.2);
    if (W.city.market && rand() < 0.4) remember(p, 'Went to the night market in Starline. Lights everywhere.', 1, 'market');
  } else if (k === 'dance') {
    addJoy(p, 8); emote(p, '✨', 2.4);
    const tc = slWorking('dance'); if (tc && tc !== p) { feel(p, tc, 0.2, true); remember(p, `Took a dance class with ${tc.name} at Beat Box Studio.`, 1, 'dance', tc.name); }
    slTogether(p, 'dance', 'danced next to');
  }
}
function slTogether(p, kind, how) {
  if (typeof lifeState === 'function') lifeState(); else return;
  for (const q of W.people) if (q !== p && q.task?.kind === kind && q.task.phase === 'do' && Math.hypot(q.x - p.x, q.z - p.z) < 9) { const key = pairKey(p, q); W.familiar[key] = Math.min(100, (W.familiar[key] || 0) + 4); if (rand() < 0.3) remember(p, `${cap(how)} ${q.name}.`, 1, 'familiar', q.name); }
}
const cityDoing = (k) => ({ movie: 'at the movies', streetfood: 'at the food trucks', dance: 'at dance class' })[k] || null;
function cityTap(place) {
  const staff = (job) => W.people.filter((q) => q.job === job).map((q) => q.name);
  const say = {
    tower: () => { const n = W.people.filter((q) => q.room >= MAX_POP && q.room < POP_CAP).length; return `Starline Tower: rooms ${MAX_POP + 1} to ${POP_CAP}. ${n ? `${n} of ${POP_CAP - MAX_POP} taken.` : 'All empty for now.'} The town holds ${POP_CAP} residents at most.`; },
    cinema: () => `Starlight Cinema. Now showing "${cityFilm()}". ${staff('projection').length ? `Projectionist: ${andList(staff('projection'))}.` : 'No projectionist yet, so no shows.'}`,
    station: () => `Starline Station. ${slWorking('conductor') ? `${slWorking('conductor').name} is driving the monorail.` : staff('conductor').length ? `The monorail runs while ${andList(staff('conductor'))} is on shift.` : 'The monorail needs a conductor.'}`,
    radio: () => `Glimmer FM. ${staff('radio').length ? `${andList(staff('radio'))} hosts the morning show.` : 'Dead air. Nobody hosts the show yet.'}`,
    studio: () => `Beat Box Studio. ${staff('dance').length ? `${andList(staff('dance'))} teaches dance here.` : 'No teacher yet.'} ${W.people.filter((q) => q.task?.kind === 'dance').length ? 'A class is on right now.' : ''}`,
  }[place];
  if (say) { toast(say().trim()); if (typeof Sound !== 'undefined') Sound.ui(); }
}
function cityBuildHtml() {
  const n = residentCount();
  if (cityOpen()) return `<p class="label">Starline</p><p class="hint">🌃 Open since day ${W.city.day}. Starline Tower adds rooms ${MAX_POP + 1} to ${POP_CAP}, so the town holds ${POP_CAP} residents at most (${n} now). Tap a building there to see who works in it.</p>`;
  return `<p class="label">Starline</p><p class="hint">🌃 A busy city quarter across a bridge east of downtown, with more rooms, a cinema, a radio station, food trucks, a dance studio and a monorail. It opens when ${STARLINE_OPEN.people} people live here or on day ${STARLINE_OPEN.day}, whichever comes first. Right now: ${plural(n, 'resident')}, day ${W.day}.</p>`;
}
// a visitor from the other island can't push the town past the cap; the ferry turns back
function cityTurnBack(d) {
  if (W.people.length < POP_CAP) return false;
  const q = d.person || {};
  RT.db?.collection('ferry').doc().set({ kind: 'return', to: d.from, from: ISLE, day: W.day, homeId: d.homeId, name: q.name || 'A visitor', memories: [`The ferry reached ${ISL.name} but turned back. The town already had ${POP_CAP} people.`], notes: [], selfNote: q.selfNote || '' }).catch(() => {});
  diary(`⛴ A ferry from ${esc(ISLES[d.from]?.name || 'across the sea')} turned back. ${ISL.name} already has ${POP_CAP} people.`);
  return true;
}

// ---------- 3D ----------
let cityGroup = null, slTrain = null, slCars = [], slLoop = null, slBlink = [], slSteam = [], slMarquee = null, slMarqueeFilm = null, slBulbs = null, slDanceMat = null, slDisco = null, slOnAir = null, slBalloons = null, slStar = null, slTrainT = 0;
const SL_TRACK_Y = 6.6;
const slTrackA = () => polarDT(83, 25), slTrackB = () => slw(19, 0);
function slMerged(list, key, cast = false) { const m = mesh(mergeGeos(list), bakedMat(key, { roughness: 0.75 }), 0, 0, 0, cast); return m; }
function slTap(o, place) { o.traverse((c) => { if (c.isMesh) { c.userData.tap = place === 'trucks' ? { kind: 'shop', shop: 'trucks' } : { kind: 'city', place }; tappables.push(c); } }); }
function slGlowMat(color) { const m = makeToon({ color, gradientMap: gradMap, emissive: new T3.Color('#000000') }); lanternMats.push(m); return m; }
function buildCity() {
  if (cityGroup || typeof scene === 'undefined' || !scene) return;
  const G = cityGroup = new T3.Group(); scene.add(G);
  const L = new T3.Group(); L.position.set(SL.x, 0, SL.z); G.add(L);
  const at = (o, x, z, ry = 0) => { o.position.set(x, 0, z); o.rotation.y = ry; L.add(o); return o; };
  // land, pavement, roads
  if (gfxOn()) G.add(islandPiece(SL.x, SL.z, SL.R, grassMat(true), { dy: -0.008 }));
  else {
    G.add(mesh(cyl(SL.R, SL.R - 1.5, 2.4, 72), [toon('#c9a27a'), toon(ISL.grass), toon('#8a6a4e')], SL.x, -1.2, SL.z, false));
    G.add(mesh(cyl(SL.R + 1.4, SL.R + 1.8, 0.4, 72), toon('#f3dfb0'), SL.x, -0.35, SL.z, false));
  }
  const pave = gfxOn() ? worldMat('pave', '#efe6da', gfxTextures().cobble, 0.3, 0.74, 1.06, 0.05) : toon('#e8e0d4');
  const road = gfxOn() ? worldMat('road', '#7c7686', gfxTextures().sand, 0.6, 0.86, 1.1, 0.05) : toon('#6e6a7a');
  L.add(mesh(cyl(20, 20, 0.07, 72), pave, 0, 0.035, 0, false));
  {
    const rr = (a, b, r) => { const s = new T3.Shape(); s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.quadraticCurveTo(a, -b, a, -b + r); s.lineTo(a, b - r); s.quadraticCurveTo(a, b, a - r, b); s.lineTo(-a + r, b); s.quadraticCurveTo(-a, b, -a, b - r); s.lineTo(-a, -b + r); s.quadraticCurveTo(-a, -b, -a + r, -b); return s; };
    const ring = rr(10.3, 7.3, 4.3); ring.holes.push(rr(7.7, 4.7, 1.7));
    const flat = (geo, x, z, y = 0.08) => { geo.rotateX(-Math.PI / 2); geo.translate(x, y, z); return geo; };
    const roads = [flat(new T3.ShapeGeometry(ring, 12), 0, 0), flat(new T3.PlaneGeometry(20, 3), -20.3, 0), flat(new T3.PlaneGeometry(7.2, 3), 13.6, 0), flat(new T3.PlaneGeometry(2.8, 11), 0, -12.8), flat(new T3.PlaneGeometry(2.8, 10), 0, 12.3)];
    const rg = mergeGeos(roads.map((geo) => ({ geo })), true); rg.deleteAttribute('color'); L.add(mesh(rg, road, 0, 0, 0, false));
    const inner = flat(new T3.ShapeGeometry(rr(7.7, 4.7, 1.7), 12), 0, 0, 0.06);
    L.add(mesh(inner, gfxOn() ? worldMat('square', '#f6efe4', gfxTextures().cobble, 0.42, 0.72, 1.06, 0.05) : toon('#f2ebe0'), 0, 0, 0, false));
    // lane dashes and crosswalks
    const marks = [];
    for (let x = -29; x < -11; x += 2.2) marks.push({ geo: new T3.BoxGeometry(1.1, 0.02, 0.2), x, y: 0.1, color: '#ffe98a' });
    for (const [cx, cz, rot] of [[-11.8, 0, 0], [11.8, 0, 0], [0, -8.6, 1], [0, 8.6, 1]]) for (let s = -2; s <= 2; s++) marks.push({ geo: new T3.BoxGeometry(rot ? 0.4 : 1.8, 0.02, rot ? 1.8 : 0.4), x: cx + (rot ? s * 0.55 : 0), z: cz + (rot ? 0 : s * 0.55), y: 0.1, color: '#ffffff' });
    L.add(slMerged(marks, 'slMarks'));
  }
  // bridge from downtown, and a walk across downtown's east lawn
  {
    const [ax, az] = SL_WALK[1], [bx, bz] = slw(-30, 0), [wx, wz] = SL_WALK[0];
    const seg = (x1, z1, x2, z2, w, mat, y) => { const len = Math.hypot(x2 - x1, z2 - z1), m = mesh(box(w, 0.07, len + 0.6), mat, (x1 + x2) / 2, y, (z1 + z2) / 2, false); m.rotation.y = Math.atan2(x2 - x1, z2 - z1); G.add(m); };
    seg(wx, wz, ax, az, 2.4, pave, 0.04);
    seg(ax, az, bx, bz, 3.2, toon('#c49a6c'), 0.14);
    const len = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len, bits = [];
    for (let d = 0; d <= len; d += 2.5) for (const s of [-1, 1]) {
      const px = ax + ux * d + uz * 1.55 * s - SL.x, pz = az + uz * d - ux * 1.55 * s - SL.z;
      bits.push({ geo: new T3.CylinderGeometry(0.1, 0.1, 1.2, 6), x: px, y: 0.7, z: pz, color: '#8a6a4e' });
      if (d > 0.5 && d < len - 0.5) bits.push({ geo: new T3.CylinderGeometry(0.3, 0.36, 3.4, 8), x: px, y: -1.4, z: pz, color: '#a88a6e' });
    }
    for (const s of [-1, 1]) { const px = (ax + bx) / 2 + uz * 1.55 * s - SL.x, pz = (az + bz) / 2 - ux * 1.55 * s - SL.z; bits.push({ geo: new T3.BoxGeometry(0.12, 0.12, len), x: px, y: 1.25, z: pz, ry, color: '#c49a6c' }); }
    L.add(slMerged(bits, 'slBridge'));
  }
  // buildings
  slBuildTower(L, at); slBuildCinema(L, at); slBuildStation(L, at); slBuildRadio(L, at); slBuildStudio(L, at); slBuildMarket(L, at); slBuildSkyline(L);
  // the spire in the plaza, with a star that turns
  {
    L.add(slMerged([{ geo: new T3.CylinderGeometry(1.5, 1.8, 0.6, 8), y: 0.3, color: '#d4cbe0' }, { geo: new T3.CylinderGeometry(0.25, 0.55, 3.6, 8), y: 2.4, color: '#6f73c9' }, { geo: new T3.TorusGeometry(0.7, 0.08, 6, 20), y: 3.2, rx: Math.PI / 2, color: '#ffd36b' }], 'slSpire', true));
    const s = new T3.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.28 : 0.62, a = (i / 10) * Math.PI * 2; s[i ? 'lineTo' : 'moveTo'](Math.sin(a) * r, Math.cos(a) * r); }
    const sg = new T3.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: false }); sg.translate(0, 0, -0.09);
    slStar = mesh(sg, glow('#ffd36b', 0.8), 0, 4.6, 0, false); L.add(slStar);
  }
  // benches, planters and a balloon cart around the plaza; trees in the little south park
  {
    const bits = [];
    for (const [x, z, ry] of [[-4.5, 3.2, 0], [4.5, 3.2, 0], [-4.5, -3.2, Math.PI], [4.5, -3.2, Math.PI], [-3, 20.5, 0], [3, 20.5, 0]]) { bits.push({ geo: new T3.BoxGeometry(2.2, 0.16, 0.7), x, y: 0.55, z, ry, color: '#c49a6c' }, { geo: new T3.BoxGeometry(2.2, 0.55, 0.12), x, y: 0.95, z: z + (ry ? -0.32 : 0.32), ry, color: '#c49a6c' }); for (const s of [-0.9, 0.9]) bits.push({ geo: new T3.BoxGeometry(0.12, 0.55, 0.55), x: x + s, y: 0.27, z, color: '#5a5470' }); }
    for (const [x, z] of [[-24, -3.5], [-24, 3.5], [-19, -3.5], [-19, 3.5], [14, -3.5], [14, 3.5]]) { bits.push({ geo: new T3.BoxGeometry(1.4, 0.6, 1.4), x, y: 0.3, z, color: '#8a84a8' }); for (let k = 0; k < 4; k++) bits.push({ geo: new T3.SphereGeometry(0.24, 8, 6), x: x + (k % 2 - 0.5) * 0.6, y: 0.75, z: z + (Math.floor(k / 2) - 0.5) * 0.6, color: ['#ff9fbf', '#ffe98a', '#c9b3ff', '#9fe3c4'][k] }); }
    bits.push({ geo: new T3.BoxGeometry(1.4, 0.9, 0.9), x: 5.6, y: 0.75, z: -1.8, color: '#ff9fbf' });
    for (const s of [-0.5, 0.5]) bits.push({ geo: new T3.CylinderGeometry(0.28, 0.28, 0.12, 10), x: 5.6 + s, y: 0.28, z: -1.35, rx: Math.PI / 2, color: '#2a2238' });
    L.add(slMerged(bits, 'slProps', true));
    const bl = []; ['#ff6f9c', '#6fe3ff', '#ffd36b', '#9fe3a0', '#c9b3ff'].forEach((c, i) => { const a = i * 1.26, x = 5.6 + Math.cos(a) * 0.45, z = -1.8 + Math.sin(a) * 0.35, y = 2.9 + (i % 2) * 0.35; bl.push({ geo: new T3.SphereGeometry(0.32, 10, 8), x, y, z, color: c }, { geo: new T3.CylinderGeometry(0.01, 0.01, y - 1.2, 3), x, y: (y + 1.2) / 2, z, color: '#ffffff' }); });
    slBalloons = slMerged(bl, 'slBalloons'); L.add(slBalloons);
    for (const [x, z, s, c] of [[-6, 22, 1, '#8fd48a'], [6, 21, 0.9, '#f7b6c8'], [0, 25, 0.85, '#5fae5a'], [-27, -6, 0.8, '#8fd48a'], [-27, 6, 0.8, '#f7b6c8'], [-19, 19, 0.9, '#5fae5a'], [16, 22, 0.85, '#8fd48a'], [-5.5, -27, 0.75, '#f7b6c8'], [26, -4, 0.7, '#5fae5a']]) {
      if (gfxOn()) L.add(gfxTree(x, z, s, c));
      else { const g = new T3.Group(); g.add(mesh(cyl(0.3, 0.4, 2.4, 8), toon('#9a6f4e'), 0, 1.2, 0)); g.add(mesh(new T3.IcosahedronGeometry(1.8, 0), toon(c), 0, 3.3, 0)); g.position.set(x, 0, z); L.add(g); }
    }
  }
  // streetlights (posts in one mesh, lamps in another so they glow at night)
  {
    const posts = [], heads = [];
    const spots = [[-26, -2.4], [-16, 2.4], [-11, -8], [11, -8], [-11, 8], [11, 8], [16, -3], [3, -17], [-3, 17], [21, 6]];
    for (const [x, z] of spots) { posts.push({ geo: new T3.CylinderGeometry(0.09, 0.12, 4.2, 8), x, y: 2.1, z, color: '#3d4f86' }); heads.push({ geo: new T3.SphereGeometry(0.38, 12, 8), x, y: 4.35, z }); }
    L.add(slMerged(posts, 'slPosts'));
    const lm = makeToon({ color: '#fff4c4', gradientMap: gradMap, emissive: new T3.Color('#000') }); lampMats.push(lm);
    const hg = mergeGeos(heads); hg.deleteAttribute('color'); L.add(mesh(hg, lm, 0, 0, 0, false));
  }
  slBuildMonorail(G);
  slBuildCars(L);
  if (gfxOn() && typeof waterIsles === 'function') waterIsles();
}
function slBuildTower(L, at) {
  const g = new T3.Group(), wall = '#c9d6ff', trim = '#5b6bd8';
  const body = mesh(box(9, 22, 8), gfxOn() ? detailMat('plaster', wall, gfxTextures().plaster, [2, 5]) : toon(wall), 0, 11, 0); g.add(body);
  const bits = [{ geo: new T3.BoxGeometry(9.6, 0.5, 8.6), y: 22.2, color: trim }, { geo: new T3.BoxGeometry(2.4, 3.2, 0.3), y: 1.6, z: 4.05, color: '#3d3a6b' }, { geo: new T3.BoxGeometry(3.6, 0.25, 1.6), y: 3.5, z: 4.8, color: trim }, { geo: new T3.CylinderGeometry(1, 1, 1.8, 14), x: 2.4, y: 23.4, z: -1.5, color: '#9fd3ff' }, { geo: new T3.CylinderGeometry(0.07, 0.07, 4, 6), x: -3, y: 24.4, z: -2, color: '#5a5470' }];
  for (const y of [5, 9, 13, 17]) bits.push({ geo: new T3.BoxGeometry(9.3, 0.3, 8.3), y, color: trim });
  g.add(slMerged(bits, 'slTowerTrim', true));
  const side = [];
  for (let f = 0; f < 4; f++) {
    const y = 7 + f * 4, i = MAX_POP + f;
    const m = makeToon({ color: '#3a3f66', gradientMap: gradMap, emissive: new T3.Color('#000000') });
    while (windowMats.length < i) windowMats.push(makeToon({ color: '#3a3f66', gradientMap: gradMap, emissive: new T3.Color('#000000') }));
    windowMats[i] = m;
    g.add(mesh(box(2.6, 2.2, 0.14), toon('#fffaf2'), 0, y, 4.0, false));
    const w = mesh(box(2.2, 1.8, 0.16), m, 0, y, 4.03, false); w.userData.tap = { kind: 'room', room: i }; tappables.push(w); g.add(w);
    const plate = sign(String(i + 1), trim, '#ffffff', 1.1); plate.position.set(0, y + 1.35, 4.03); g.add(plate);
    for (const s of [-3, 3]) side.push({ geo: new T3.BoxGeometry(1.6, 1.8, 0.14), x: s, y, z: 4.03 });
    for (const z of [-2, 2]) for (const s of [-1, 1]) side.push({ geo: new T3.BoxGeometry(0.14, 1.8, 1.6), x: s * 4.53, y, z });
  }
  const sg = mergeGeos(side); sg.deleteAttribute('color'); g.add(mesh(sg, slGlowMat('#ffe7a3'), 0, 0, 0, false));
  const nm = sign('Starline Tower', '#fffaf2', trim, 5.4); nm.position.set(0, 4.1, 4.08); g.add(nm);
  const roof = sign('✦ STARLINE ✦', '#1a1030', '#ffd36b', 7); roof.position.set(0, 23.9, 3.2); g.add(roof);
  const bl = mesh(sph(0.2, 8, 6), toon('#ff6f5e', { emissive: new T3.Color('#ff2020') }), -3, 26.5, -2, false); slBlink.push(bl); g.add(bl);
  slTap(body, 'tower');
  at(g, -13, -13);
}
function slBuildCinema(L, at) {
  const g = new T3.Group();
  const body = mesh(box(12, 8.5, 8), wallMat('#7a4ad8'), 0, 4.25, 0); g.add(body);
  g.add(slMerged([{ geo: new T3.BoxGeometry(12.6, 0.5, 8.6), y: 8.7, color: '#ff6fb0' }, { geo: new T3.BoxGeometry(10.4, 1.7, 1.4), y: 5.3, z: 4.6, color: '#2a2148' }, { geo: new T3.BoxGeometry(1.8, 3, 0.2), x: -1.1, y: 1.5, z: 4.05, color: '#ffd36b' }, { geo: new T3.BoxGeometry(1.8, 3, 0.2), x: 1.1, y: 1.5, z: 4.05, color: '#ffd36b' }, { geo: new T3.BoxGeometry(1.5, 2.2, 0.12), x: -4.3, y: 2.2, z: 4.05, color: '#ff9fbf' }, { geo: new T3.BoxGeometry(1.5, 2.2, 0.12), x: 4.3, y: 2.2, z: 4.05, color: '#6fe3ff' }, { geo: new T3.BoxGeometry(1.1, 1.1, 0.8), x: 3.8, y: 0.55, z: 5.2, color: '#ff6f5e' }], 'slCinema', true));
  const bulbs = []; for (let i = 0; i < 22; i++) bulbs.push({ geo: new T3.SphereGeometry(0.12, 6, 5), x: -5 + (i / 21) * 10, y: 6.25, z: 5.32 }, { geo: new T3.SphereGeometry(0.12, 6, 5), x: -5 + (i / 21) * 10, y: 4.35, z: 5.32 });
  const bg = mergeGeos(bulbs); bg.deleteAttribute('color'); slBulbs = mesh(bg, glow('#ffe98a', 0.9), 0, 0, 0, false); g.add(slBulbs);
  const nm = sign('Starlight Cinema', '#1a1030', '#ff9fbf', 8); nm.position.set(0, 7.4, 4.06); g.add(nm);
  slMarquee = sign(`Now showing: ${cityFilm()}`, '#2a2148', '#ffe98a', 9.4); slMarquee.position.set(0, 5.3, 5.33); slMarqueeFilm = cityFilm(); g.add(slMarquee);
  slTap(body, 'cinema');
  at(g, 12, -13.5);
}
function slBuildStation(L, at) {
  const g = new T3.Group(), bits = [];
  for (const x of [-4.5, 4.5]) for (const z of [-2.2, 2.2]) bits.push({ geo: new T3.CylinderGeometry(0.3, 0.35, 6, 10), x, y: 3, z, color: '#d4cbe0' });
  bits.push({ geo: new T3.BoxGeometry(11, 0.4, 5.4), y: 6.2, color: '#efe6da' });
  for (const x of [-4.5, 4.5]) for (const z of [-2.4, 2.4]) bits.push({ geo: new T3.CylinderGeometry(0.08, 0.08, 2.6, 6), x, y: 7.7, z, color: '#5a5470' });
  bits.push({ geo: new T3.BoxGeometry(11.6, 0.3, 6), y: 9.1, color: '#ff9fbf' });
  for (let i = 0; i < 8; i++) bits.push({ geo: new T3.BoxGeometry(1.6, 0.35, 0.9), x: -6.2, y: 0.4 + i * 0.75, z: -2.4 + i * 0.62, color: '#c49a6c' });
  bits.push({ geo: new T3.BoxGeometry(4, 3, 3), x: 1.5, y: 1.5, z: 1.8, color: '#6fc3d8' }, { geo: new T3.BoxGeometry(4.3, 0.3, 3.3), x: 1.5, y: 3.1, z: 1.8, color: '#3d4f86' }, { geo: new T3.BoxGeometry(1.5, 1, 0.1), x: 1.5, y: 1.8, z: 3.32, color: '#bfe8ff' });
  const body = slMerged(bits, 'slStation', true); g.add(body);
  const nm = sign('Starline Station', '#3d4f86', '#ffffff', 4); nm.position.set(1.5, 2.6, 3.36); g.add(nm);
  const top = sign('STARLINE', '#ff9fbf', '#ffffff', 4.4); top.position.set(0, 9.9, 3.02); g.add(top);
  slTap(g, 'station');
  at(g, 20.5, 0, -Math.PI / 2);
}
function slBuildRadio(L, at) {
  const g = new T3.Group();
  const body = mesh(box(7, 6, 7), wallMat('#3d4f86'), 0, 3, 0); g.add(body);
  const bits = [{ geo: new T3.BoxGeometry(7.6, 0.4, 7.6), y: 6.2, color: '#ffd36b' }, { geo: new T3.BoxGeometry(2, 3, 0.2), y: 1.5, z: 3.55, color: '#2a2238' }, { geo: new T3.BoxGeometry(2.2, 1.4, 0.12), x: -2.2, y: 3.4, z: 3.55, color: '#bfe8ff' }, { geo: new T3.BoxGeometry(2.2, 1.4, 0.12), x: 2.2, y: 3.4, z: 3.55, color: '#bfe8ff' }];
  bits.push({ geo: new T3.CylinderGeometry(0.16, 0.42, 10.5, 8), x: 1.5, y: 6.4 + 5.25, z: -1.5, color: '#fbf8f4' });
  for (let i = 0; i < 4; i++) bits.push({ geo: new T3.CylinderGeometry(0.4 - i * 0.07, 0.42 - i * 0.07, 0.9, 8), x: 1.5, y: 8 + i * 2.4, z: -1.5, color: '#ff6f5e' });
  g.add(slMerged(bits, 'slRadio', true));
  slOnAir = mesh(box(1.8, 0.6, 0.12), toon('#5a2030', { emissive: new T3.Color('#000000') }), 0, 5.2, 3.6, false); g.add(slOnAir);
  { const oa = sign('ON AIR', '#5a2030', '#ffffff', 1.6); oa.position.set(0, 5.2, 3.68); g.add(oa); }
  const nm = sign('Glimmer FM 101.3', '#fffaf2', '#3d4f86', 5.2); nm.position.set(0, 4.5, 3.62); g.add(nm);
  { const back = sign('📻 Glimmer FM', '#ffd36b', '#3d4f86', 5.6); back.position.set(0, 3.6, -3.62); back.rotation.y = Math.PI; g.add(back); }
  const bl = mesh(sph(0.2, 8, 6), toon('#ff6f5e', { emissive: new T3.Color('#ff2020') }), 1.5, 17, -1.5, false); slBlink.push(bl); g.add(bl);
  slTap(body, 'radio');
  at(g, 10, 14, Math.PI);
}
function slBuildStudio(L, at) {
  const g = new T3.Group();
  const body = mesh(box(10, 6, 6), wallMat('#ff6fb0'), 0, 3, 0); g.add(body);
  g.add(slMerged([{ geo: new T3.BoxGeometry(10.6, 0.4, 6.6), y: 6.2, color: '#ffe98a' }, { geo: new T3.BoxGeometry(1.8, 3, 0.2), x: 3.6, y: 1.5, z: 3.05, color: '#2a2238' }, { geo: new T3.CylinderGeometry(0.05, 0.05, 1.2, 4), y: 7, color: '#5a5470' }], 'slStudio', true));
  slDanceMat = makeToon({ color: '#c9b3ff', gradientMap: gradMap, emissive: new T3.Color('#000000') });
  g.add(mesh(box(5.4, 2.8, 0.14), slDanceMat, -1.6, 2.4, 3.03, false));
  slDisco = mesh(new T3.IcosahedronGeometry(0.6, 1), makeToon({ color: '#e8e8f0', metalness: 0.6, roughness: 0.25, flatShading: true }), 0, 7.9, 0); g.add(slDisco);
  const nm = sign('Beat Box Dance', '#1a1030', '#ffe98a', 5.6); nm.position.set(0, 4.8, 3.06); g.add(nm);
  slTap(body, 'studio');
  at(g, 0, -21.5);
}
function slBuildMarket(L, at) {
  const trucks = [['#9fe3c4', '#ffffff', -20.5, 8.2], ['#ffe98a', '#ff6f5e', -15.5, 7.6], ['#ffc3a0', '#6f73c9', -10.5, 8.2]];
  for (const [col, aw, x, z] of trucks) {
    const g = new T3.Group(), bits = [{ geo: new T3.BoxGeometry(4.2, 2.6, 2.3), y: 1.75, color: col }, { geo: new T3.BoxGeometry(1.4, 1.9, 2.2), x: 2.7, y: 1.4, color: col }, { geo: new T3.BoxGeometry(0.1, 0.9, 1.8), x: 3.42, y: 1.9, color: '#bfe8ff' }, { geo: new T3.BoxGeometry(2.8, 1.1, 0.1), y: 2.2, z: 1.16, color: '#2a2238' }, { geo: new T3.BoxGeometry(3, 0.12, 0.6), y: 1.6, z: 1.45, color: '#fbf1e2' }];
    for (const wx of [-1.4, 1.4, 2.6]) for (const s of [-1, 1]) bits.push({ geo: new T3.CylinderGeometry(0.42, 0.42, 0.3, 12), x: wx, y: 0.42, z: s * 1.1, rx: Math.PI / 2, color: '#2a2238' });
    for (let i = 0; i < 6; i++) bits.push({ geo: new T3.BoxGeometry(0.52, 0.08, 1.2), x: -1.3 + i * 0.52, y: 3.05, z: 1.6, rx: 0.4, color: i % 2 ? aw : '#ffffff' });
    const m = slMerged(bits, 'slTruck', true); g.add(m); slTap(g, 'trucks');
    const st = mesh(sph(0.35, 8, 6), new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }), -1, 3.4, 0, false); st.userData.ph = rand(); slSteam.push(st); g.add(st);
    at(g, x, z, Math.PI);
  }
  const bits = [], bulbs = [];
  for (const [x, z] of [[-23.5, 4.8], [-8, 4.8], [-23.5, 13.5], [-8, 13.5]]) bits.push({ geo: new T3.CylinderGeometry(0.08, 0.1, 4.2, 6), x, y: 2.1, z, color: '#5a5470' });
  for (const [x, z] of [[-19.5, 12.4], [-14, 12.4]]) { bits.push({ geo: new T3.CylinderGeometry(0.9, 0.9, 0.1, 14), x, y: 0.95, z, color: '#fff4dc' }, { geo: new T3.CylinderGeometry(0.08, 0.1, 0.95, 6), x, y: 0.47, z, color: '#5a3a2e' }); for (const s of [-1, 1]) bits.push({ geo: new T3.CylinderGeometry(0.33, 0.33, 0.5, 10), x: x + s * 1.3, y: 0.25, z, color: s > 0 ? '#9fd3ff' : '#ff9fbf' }); }
  L.add(slMerged(bits, 'slMarket', true));
  const line = (x1, z1, x2, z2) => { for (let i = 0; i <= 14; i++) { const k = i / 14; bulbs.push({ geo: new T3.SphereGeometry(0.14, 6, 5), x: x1 + (x2 - x1) * k, y: 4 - Math.sin(k * Math.PI) * 0.7, z: z1 + (z2 - z1) * k }); } };
  line(-23.5, 4.8, -8, 4.8); line(-23.5, 13.5, -8, 13.5); line(-23.5, 4.8, -8, 13.5); line(-8, 4.8, -23.5, 13.5);
  const bg = mergeGeos(bulbs); bg.deleteAttribute('color'); L.add(mesh(bg, slGlowMat('#ffb86b'), 0, 0, 0, false));
}
function slBuildSkyline(L) {
  const blocks = [[-10.5, -23, 4.5, 16, '#b8c4e8'], [10.5, -23, 4.5, 19, '#e8c4d8'], [21, -13, 4, 14, '#c4e0d8'], [21, 13, 4, 11, '#d8d0f0'], [-24, -10, 4, 13, '#f0dcc4']];
  const bits = [], wins = [];
  for (const [x, z, w, h, c] of blocks) {
    const roofC = ['#ff9f7a', '#7fb8e8', '#9fd49a', '#f2c46b', '#c9a3e8'][hashStr(`${x}${z}`) % 5];
    bits.push({ geo: new T3.BoxGeometry(w, h, w), x, y: h / 2, z, color: c }, { geo: new T3.BoxGeometry(w + 0.12, 2.3, w + 0.12), x, y: 1.15, z, color: '#fbf1e2' }, { geo: new T3.BoxGeometry(w + 0.9, 0.18, w + 0.9), x, y: 2.5, z, color: roofC }, { geo: new T3.BoxGeometry(w + 0.5, 0.5, w + 0.5), x, y: h + 0.25, z, color: roofC }, { geo: new T3.BoxGeometry(w * 0.4, 1.2, w * 0.4), x, y: h + 1, z, color: '#8a84a8' });
    for (let y = 4; y < h - 1; y += 2.2) for (let i = -1; i <= 1; i++) for (const [dx, dz, ry] of [[0, w / 2 + 0.02, 0], [w / 2 + 0.02, 0, Math.PI / 2], [0, -w / 2 - 0.02, 0], [-w / 2 - 0.02, 0, Math.PI / 2]]) {
      if (hashStr(`${x}${z}${y}${i}${ry}${dx}`) % 5 === 0) continue;
      wins.push({ geo: new T3.BoxGeometry(0.8, 1.1, 0.06), x: x + dx + (ry ? 0 : i * 1.2), y, z: z + dz + (ry ? i * 1.2 : 0), ry });
    }
  }
  L.add(slMerged(bits, 'slSkyline', true));
  const wg = mergeGeos(wins); wg.deleteAttribute('color'); L.add(mesh(wg, slGlowMat('#ffe7a3'), 0, 0, 0, false));
}
function slBuildMonorail(G) {
  const [ax, az] = slTrackA(), [bx, bz] = slTrackB(), len = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
  const bits = [{ geo: new T3.BoxGeometry(0.9, 0.5, len + 2), x: (ax + bx) / 2, y: SL_TRACK_Y, z: (az + bz) / 2, ry, color: '#e8e0f0' }];
  for (let d = 0; d <= len; d += 9) { const x = ax + ux * d, z = az + uz * d, water = Math.hypot(x - DT.x, z - DT.z) > DT.R && Math.hypot(x - SL.x, z - SL.z) > SL.R, lo = water ? -3 : 0; bits.push({ geo: new T3.CylinderGeometry(0.28, 0.36, SL_TRACK_Y - lo, 10), x, y: (SL_TRACK_Y + lo) / 2, z, color: '#d4cbe0' }); }
  // the downtown stop: a platform over the walk, with steps
  bits.push({ geo: new T3.BoxGeometry(5, 0.35, 6), x: ax, y: SL_TRACK_Y - 0.4, z: az, ry, color: '#efe6da' });
  for (const s of [-1, 1]) bits.push({ geo: new T3.CylinderGeometry(0.2, 0.2, SL_TRACK_Y - 0.4, 8), x: ax + uz * 2.2 * s, y: (SL_TRACK_Y - 0.4) / 2, z: az - ux * 2.2 * s, color: '#d4cbe0' });
  bits.push({ geo: new T3.BoxGeometry(5.4, 0.25, 6.4), x: ax, y: SL_TRACK_Y + 2.6, z: az, ry, color: '#ff9fbf' });
  const track = mesh(mergeGeos(bits), bakedMat('slTrack', { roughness: 0.7 }), 0, 0, 0, true); G.add(track);
  const car = []; for (const k of [-1.7, 1.7]) { car.push({ geo: new T3.BoxGeometry(1.7, 1.7, 3.2), z: k, y: 0.85, color: '#ffffff' }, { geo: new T3.BoxGeometry(1.75, 0.35, 3.25), z: k, y: 0.35, color: '#ff6fb0' }, { geo: new T3.CylinderGeometry(0.85, 0.85, 0.2, 14, 1, false, 0, Math.PI), z: k, y: 1.7, rz: Math.PI / 2, ry: Math.PI / 2, color: '#6f73c9' }); }
  car.push({ geo: new T3.SphereGeometry(0.85, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), z: 3.3, y: 0.85, rx: Math.PI / 2, color: '#ffffff' }, { geo: new T3.SphereGeometry(0.85, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), z: -3.3, y: 0.85, rx: -Math.PI / 2, color: '#ffffff' });
  slTrain = new T3.Group(); slTrain.add(mesh(mergeGeos(car), bakedMat('slTrain', { roughness: 0.5 }), 0, 0, 0, true));
  const win = []; for (const k of [-1.7, 1.7]) for (const s of [-1, 1]) for (const w of [-0.8, 0.8]) win.push({ geo: new T3.BoxGeometry(0.06, 0.6, 0.9), x: s * 0.87, y: 1.1, z: k + w });
  const wg = mergeGeos(win); wg.deleteAttribute('color'); slTrain.add(mesh(wg, slGlowMat('#bfe8ff'), 0, 0, 0, false));
  slTrain.rotation.y = ry; slTrain.position.set(bx, SL_TRACK_Y + 0.25, bz); G.add(slTrain);
}
function slBuildCars(L) {
  // one loop around the plaza block, sampled once; cars follow it by distance
  const a = 9, b = 6, r = 3, off = 0.7, pts = [];
  const arc = (cx, cz, t0, t1) => { for (let i = 0; i <= 8; i++) { const t = t0 + (t1 - t0) * (i / 8); pts.push([cx + Math.cos(t) * (r + off), cz + Math.sin(t) * (r + off)]); } };
  arc(a - r, b - r, Math.PI / 2, 0); arc(a - r, -(b - r), 0, -Math.PI / 2); arc(-(a - r), -(b - r), -Math.PI / 2, -Math.PI); arc(-(a - r), b - r, Math.PI, Math.PI / 2);
  pts.push(pts[0]);
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  slLoop = { pts, cum, len: cum[cum.length - 1] };
  slCars = ['#ffd23f', '#ff9fbf', '#9fe3c4', '#9fd3ff'].map((c, i) => {
    const bits = [{ geo: new T3.BoxGeometry(1.3, 0.6, 2.4), y: 0.55, color: c }, { geo: new T3.BoxGeometry(1.15, 0.55, 1.3), y: 1.1, z: -0.15, color: c }, { geo: new T3.BoxGeometry(1.18, 0.4, 1.1), y: 1.12, z: -0.15, color: '#3a3f66' }, { geo: new T3.BoxGeometry(0.3, 0.14, 0.05), x: -0.4, y: 0.6, z: 1.21, color: '#fff4c4' }, { geo: new T3.BoxGeometry(0.3, 0.14, 0.05), x: 0.4, y: 0.6, z: 1.21, color: '#fff4c4' }];
    for (const x of [-0.62, 0.62]) for (const z of [-0.75, 0.75]) bits.push({ geo: new T3.CylinderGeometry(0.28, 0.28, 0.2, 10), x, y: 0.28, z, rz: Math.PI / 2, color: '#2a2238' });
    if (i === 0) bits.push({ geo: new T3.BoxGeometry(0.6, 0.22, 0.3), y: 1.5, z: -0.15, color: '#2a2238' });
    const g = new T3.Group(); g.add(slMerged(bits, 'slCar', true)); g.userData = { s: (i / 4) * slLoop.len, v: 2.6 + i * 0.35 }; L.add(g); return g;
  });
}
function slLoopAt(s) {
  const { pts, cum, len } = slLoop; s = ((s % len) + len) % len;
  let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
  const k = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1), [x0, z0] = pts[i - 1], [x1, z1] = pts[i];
  return [x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, Math.atan2(x1 - x0, z1 - z0)];
}
function cityFrame(dt) {
  if (!cityGroup || !cityOpen()) return;
  const night = W.t >= 0.6 || W.t < 0.03, busy = W.t >= 0.02 && W.t < 0.64;
  // traffic around the plaza, lighter at night
  for (const g of slCars) { const u = g.userData; g.visible = busy || u.v < 3.1; if (!g.visible) continue; u.s += dt * u.v * (W.weather === 'storm' ? 0.6 : 1); const [x, z, h] = slLoopAt(u.s); g.position.set(x, 0, z); g.rotation.y = h; }
  // the monorail shuttles while its conductor is on shift, and waits at each end
  if (slTrain) {
    const [ax, az] = slTrackA(), [bx, bz] = slTrackB();
    let k = 1;
    if (slWorking('conductor')) { slTrainT += dt; const run = 16, wait = 5, per = (run + wait) * 2, t = slTrainT % per; k = t < wait ? 1 : t < wait + run ? 1 - (t - wait) / run : t < wait * 2 + run ? 0 : (t - wait * 2 - run) / run; k = k * k * (3 - 2 * k); }
    slTrain.position.set(ax + (bx - ax) * k, SL_TRACK_Y + 0.25, az + (bz - az) * k);
  }
  for (const b of slBlink) b.visible = Math.floor(now * 1.5) % 2 === 0;
  if (slStar) slStar.rotation.y += dt * 0.8;
  if (slBalloons) slBalloons.position.y = Math.sin(now * 1.3) * 0.12;
  if (slBulbs) slBulbs.material.emissiveIntensity = slWorking('projection') || night ? (Math.floor(now * 3) % 2 ? 1 : 0.55) : 0.35;
  if (slOnAir) slOnAir.material.emissive.setRGB(slWorking('radio') ? 0.9 : 0, 0, 0);
  const class_ = slWorking('dance') || W.people.some((q) => q.task?.kind === 'dance');
  if (slDanceMat) { if (class_) slDanceMat.emissive.setHSL((now * 0.25) % 1, 0.9, 0.45); else slDanceMat.emissive.setRGB(0, 0, 0); }
  if (slDisco) slDisco.rotation.y += dt * (class_ ? 2 : 0.3);
  const cooking = !!slWorking('trucks');
  for (const s of slSteam) { const k = (now * 0.45 + s.userData.ph) % 1; s.position.y = 3.4 + k * 2.2; s.material.opacity = cooking ? 0.45 * (1 - k) : 0; }
  if (slMarquee && slMarqueeFilm !== cityFilm()) { slMarqueeFilm = cityFilm(); const old = slMarquee.material.map; slMarquee.material.map = signTexture(`Now showing: ${slMarqueeFilm}`, '#2a2148', '#ffe98a'); slMarquee.material.needsUpdate = true; old?.dispose(); }
  if (W.city.market && !W.city.marketSaid && W.t > 0.45 && W.t < 0.6) { W.city.marketSaid = true; diary(`🏮 Night market in <b>Starline</b> tonight. The food trucks are lit up and the whole town can smell the grill.`); }
}
