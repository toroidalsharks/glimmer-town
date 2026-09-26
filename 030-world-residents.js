// ============================================================
// WORLD & RESIDENTS
// ============================================================
let W = null, now = 0, MODE = 'host';
const person = (id) => W.people.find((p) => p.id === id);
function uniqueName() {
  for (let i = 0; i < 60; i++) { const name = cap(pick(SYL) + pick(SYL) + (rand() < 0.3 ? pick(SYL) : '')); if (!W.people.some((p) => p.name === name)) return name; }
  return 'Kin' + W.nextId;
}
function mixHue(a, b) { const d = ((b - a + 540) % 360) - 180; return (a + d / 2 + 360) % 360; }
function freeRoom() { for (let i = 0; i < MAX_POP; i++) if (!W.people.some((p) => p.room === i)) return i; return -1; }
for (const [k, c] of Object.entries({ nook: 'blue', garden: 'blue', pier: 'blue' })) JOBS[k].collar = c;
for (const J of Object.values(JOBS)) J.collar = J.collar || 'service';
const randomJob = () => pick(Object.keys(JOBS).filter((k) => JOBS[k].collar !== 'white'));
const randAff = (keys) => Object.fromEntries(keys.map((k) => [k, rand() * 2 - 1]));

function birth(a, b) {
  const mix = (x, y, m) => (x + y) / 2 + (rand() - 0.5) * m;
  const mixObj = (A, B, m) => Object.fromEntries(Object.keys(A).map((k) => [k, clamp(mix(A[k], B[k] ?? 0, m), -1, 1)]));
  let body;
  if (a && b) {
    body = {
      hue: (mixHue(a.body.hue, b.body.hue) + (rand() - 0.5) * 50 + 360) % 360,
      size: clamp(mix(a.body.size, b.body.size, 0.14), 0.85, 1.2),
      ears: rand() < 0.12 ? pick(EARS) : (rand() < 0.5 ? a : b).body.ears,
      hungerRate: +clamp(mix(a.body.hungerRate, b.body.hungerRate, 0.24), 0.6, 1.4).toFixed(2),
      speed: +clamp(mix(a.body.speed, b.body.speed, 0.24), 0.6, 1.4).toFixed(2),
      eyeGap: clamp(mix(a.body.eyeGap, b.body.eyeGap, 0.12), 0.2, 0.45),
      palate: mixObj(a.body.palate, b.body.palate, 0.6),
      jobAff: mixObj(a.body.jobAff, b.body.jobAff, 0.8),
      decorAff: mixObj(a.body.decorAff, b.body.decorAff, 0.8),
      faith: clamp(mix(a.body.faith, b.body.faith, 0.8), -1, 1), openness: clamp(mix(a.body.openness ?? 0, b.body.openness ?? 0, 0.8), -1, 1),
      stormBorn: W.weather === 'storm',
    };
  } else {
    body = {
      hue: rand() * 360, size: 0.9 + rand() * 0.25, ears: pick(EARS),
      hungerRate: +(0.65 + rand() * 0.7).toFixed(2), speed: +(0.7 + rand() * 0.6).toFixed(2),
      eyeGap: 0.22 + rand() * 0.2,
      palate: { sweet: rand() * 2 - 1, salty: rand() * 2 - 1, spicy: rand() * 2 - 1 },
      jobAff: randAff(Object.keys(JOBS)), decorAff: randAff(Object.keys(DECOR)),
      faith: rand() * 2 - 1, openness: rand() * 2 - 1, stormBorn: W.weather === 'storm',
    };
  }
  const shirt = pick(Object.keys(COLORS));
  const p = {
    id: 'k' + (W.nextId++), name: uniqueName(), bornDay: W.day,
    gen: a ? Math.max(a.gen, b.gen) + 1 : 1, parents: a ? [a.name, b.name] : [],
    body, grow: a ? 0.55 : 1, hunger: 0.3, coins: a ? 1 : 5 + Math.floor(rand() * 5),
    room: freeRoom(), job: a ? null : randomJob(), jobDays: 0, jobMood: 0, workedToday: false,
    tastes: {}, likes: { [shirt]: 0.4 },
    wardrobe: { hats: [], shirts: [shirt] }, outfit: { hat: null, shirt }, decor: [],
    cr: { score: 0, beliefs: {}, wish: null, talks: 0, gifts: 0 },
    selfNote: a ? "I'm new. Everything here is so big." : "I just moved in. I don't know who I am yet.",
    today: [], past: [], feelings: {},
    x: TOWN.home.spot[0] + (rand() - 0.5) * 2, z: TOWN.home.spot[1] + 0.6, face: 0,
    at: 'home', path: [], task: null, busyUntil: 0, inside: true, state: 'free', lastBaby: -99, want: null, model: null, joy: 0, level: 1, pendingGift: false, makeup: null, befriend: null,
  };
  p.want = newWant(p); modelOf(p); { const hs = TOWN[homeKey(p)].spot; p.x = hs[0] + (rand() - 0.5) * 2; p.z = hs[1] + 0.6; p.at = homeKey(p); }
  if (a) {
    remember(p, `I was born. ${a.name} and ${b.name} were there.`, 3, 'born');
    p.feelings[a.id] = { name: a.name, score: 4, note: 'My parent.' };
    p.feelings[b.id] = { name: b.name, score: 4, note: 'My parent.' };
    p.cr.score = (a.cr.score + b.cr.score) / 4;
    for (const par of [a, b]) {
      par.feelings[p.id] = { name: p.name, score: 5, note: 'My little one.' };
      par.lastBaby = W.day;
      remember(par, `${p.name} was born. ${a.name} and ${b.name} are the parents.`, 3, 'born');
    }
  }
  return p;
}
function bodyFacts(p, you = true) {
  const B = p.body, f = [];
  f.push(B.hungerRate > 1.1 ? (you ? 'Your stomach empties fast.' : 'gets hungry fast') : B.hungerRate < 0.8 ? (you ? 'You can go a long time without eating.' : 'rarely hungry') : (you ? 'Your appetite is ordinary.' : 'ordinary appetite'));
  f.push(B.speed > 1.1 ? (you ? 'You move quickly.' : 'quick on their feet') : B.speed < 0.85 ? (you ? 'You walk slowly.' : 'walks slowly') : (you ? 'You walk at an ordinary pace.' : 'ordinary pace'));
  if (B.stormBorn) f.push(you ? 'You were born during a storm.' : 'born in a storm');
  if (B.ailments?.length) f.push(you ? cap(B.ailments.join(', and ').replace(/\bhis\b|\bher\b|\btheir\b/g, 'your').replace(/\bhe feels\b|\bshe feels\b|\bthey feel\b/g, 'you feel')) + '.' : B.ailments.join(', '));
  return you ? f.join(' ') : f.join(', ');
}
function favoriteFood(p) { const e = Object.entries(p.tastes).sort((x, y) => y[1] - x[1])[0]; return e && e[1] > 0.25 ? foodById(e[0]).name : null; }
const hatText = (h) => `${h.color} ${HATS[h.id].name}`;
function outfitText(p) { return `${a_an(p.outfit.shirt)} shirt${p.outfit.hat ? ` and ${a_an(hatText(p.outfit.hat))}` : ''}`; }
function topColors(p, n = 3) { return Object.entries(p.likes).filter(([k, v]) => COLORS[k] && v > 0.3).sort((x, y) => y[1] - x[1]).slice(0, n).map((x) => x[0]); }
function attitude(p) {
  const s = p.cr.score;
  return s >= 6 ? ['Devoted', 'adores the Creator', 'good'] : s >= 2 ? ['Fond', 'likes the Creator', 'good'] : s > -2 ? ['Unsure', 'is unsure about the Creator', ''] : s > -6 ? ['Resentful', 'resents the Creator', 'bad'] : ['Defiant', 'wants nothing to do with the Creator', 'bad'];
}
function beliefText(p) {
  const b = Object.entries(p.cr.beliefs).sort((x, y) => y[1] - x[1]);
  const color = b.find(([k]) => COLORS[k]);
  const thing = b.find(([k]) => !COLORS[k]);
  const fav = creatorFavorite();
  const parts = [];
  if (color) parts.push(`the Creator loves ${color[0]}`);
  if (thing) parts.push(`the Creator is into ${thing[0]}`);
  if (fav && fav.id !== p.id && (W.creator.gifts[fav.id] || 0) >= 2) parts.push(`${fav.name} is the Creator's favorite`);
  if (fav && fav.id === p.id && (W.creator.gifts[p.id] || 0) >= 2) parts.push("they're the Creator's favorite");
  return parts.length ? `Thinks ${parts.join(', and ')}.` : 'Has no idea what the Creator is like yet.';
}
function creatorFavorite() {
  const e = Object.entries(W.creator.gifts).sort((x, y) => y[1] - x[1])[0];
  return e ? person(e[0]) : null;
}
function wishText(w) {
  if (!w) return '';
  if (w.kind === 'book') return `a book about ${SUBJECTS[w.subj]?.name.toLowerCase() || 'anything'}`;
  if (w.kind === 'coins') return 'a few coins';
  if (w.kind === 'food') return foodById(w.id).name;
  if (w.kind === 'hat') return `${a_an(w.color + ' ' + HATS[w.id].name)}`;
  return a_an(`${w.color} ${DECOR[w.id].name}`);
}

