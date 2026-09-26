// ============================================================
// TOWN LIFE: rumors that bend as they travel, regulars and
// neighbors, favors and debts, moods that spread, anniversaries
// and traditions, and a storyteller that paces the drama
// ============================================================
// W.rumors   = [{ id, about, aboutName, origin, originName, tone, base, adds: [], day, knowers: { pid: { v, from, day, believes } }, told }]
// W.favors   = [{ id, from, to, what, day, repaid, sour }]          from did a favor for to
// W.familiar = { 'p1|p2': n }                                      how often two people end up near each other
// W.traditions = [{ id, name, yd, since, origin, count, last }]    yd is the day of the year it falls on
// W.story    = { mode: 'calm' | 'brewing' | 'breather', since, lastBig }
// p.mood is -1..1 (today's mood, drifts back to 0), p.haunts counts where someone spends time.
// Real people (Mili, Red, Tim, invited residents) are never the subject of a rumor the game tracks.
const HAUNT_KEYS = ['cafe', 'garden', 'park', 'pier', 'plaza', 'beach', 'downtown'];
const RUMOR_OPENERS = ['', 'Apparently ', 'I heard ', 'Everyone is saying ', "Don't repeat this, but "];
const RUMOR_ADDS = { '-1': [' And it wasn\'t the first time.', ' In front of everyone.', ' And they laughed about it after.', ' Supposedly they aren\'t even sorry.'], 1: [' Honestly, it was really sweet.', ' Everyone was talking about it.', ' People are calling it the nicest thing all year.'] };
const RUMOR_CLAIMS = { '-1': ['#s has been talking about people behind their backs', '#s thinks they are better than everyone here', '#s skipped out when people needed help', '#s has been acting really strange lately', '#s took credit for something they didn\'t do'], 1: ['#s quietly helped someone who was having a hard time', '#s has been secretly practicing something amazing', '#s stood up for somebody when nobody else would'] };
const GOOD_TAGS = new Set(['gotKind', 'compliment', 'newFriend', 'gotApology', 'couple', 'engaged', 'married', 'wonCase', 'wedding', 'kindness', 'admirerRevealed', 'levelUp', 'thawed']);
const BAD_TAGS = new Set(['gotMean', 'heartbreak', 'lostCase', 'frozenOut', 'coldShoulder', 'grief', 'murderNews', 'convicted', 'laughedAt', 'textMean', 'subtweeted', 'breakup', 'paroleDenied']);
const TRADITION_NAMES = {
  'stacking pebbles on the beach': 'Pebble Day', 'counting birds from the pier': 'Bird Count Day', 'writing tiny poems on napkins': 'Napkin Poem Day', 'collecting sea glass': 'Sea Glass Day',
  'competitive cloud watching': 'Cloud Cup', 'journaling at the café': 'Quiet Pages Day', 'sunrise walks': 'the Sunrise Walk', 'knitting little hats for no one': 'Little Hat Day',
  'a petition for more benches by the fountain': 'Bench Day', 'boycotting the café until prices come down': 'Fair Price Day', 'a campaign to give the island a flag': 'Flag Day',
  'a push for a weekly town picnic': 'the Big Picnic', 'a campaign to keep the lamps on all night': 'Lantern Night', "a petition to name the island's cat": "the Cat's Birthday",
};
const pairKey = (a, b) => [a.id, b.id].sort().join('|');
function lifeState() {
  W.rumors = W.rumors || []; W.favors = W.favors || []; W.familiar = W.familiar || {}; W.traditions = W.traditions || [];
  W.story = W.story || { mode: 'calm', since: W.day, lastBig: W.day };
  return W;
}

// ---------- 1. rumors ----------
function rumorStart(teller, hearer, subject, text, tone) {
  if (!teller || !hearer || !subject || subject === teller || subject === hearer || isRealish(subject)) return null;
  lifeState();
  tone = tone < 0 ? -1 : 1;
  let base = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  if (!base || !base.includes(subject.name)) base = pick(RUMOR_CLAIMS[tone]).replace('#s', subject.name);
  base = base.replace(/[.!?]*$/, '.');
  const old = W.rumors.find((r) => r.about === subject.id && r.base === base); if (old) return old;
  const R = { id: 'm' + uid(), about: subject.id, aboutName: subject.name, origin: teller.id, originName: teller.name, tone, base, adds: [], day: W.day, knowers: { [teller.id]: { v: 0, from: null, day: W.day, believes: true }, [hearer.id]: { v: 0, from: teller.id, day: W.day, believes: fscore(hearer, subject) < 4 } }, told: null };
  W.rumors.push(R); if (W.rumors.length > 20) W.rumors.splice(0, W.rumors.length - 20);
  return R;
}
// version v of a rumor: the same story, with a bit more added each time it gets retold
function rumorText(R, v) {
  while (R.adds.length < v) { const pool = RUMOR_ADDS[R.tone].filter((x) => !R.adds.includes(x)); R.adds.push(pool.length ? pick(pool) : ''); }
  return `${RUMOR_OPENERS[Math.min(v, RUMOR_OPENERS.length - 1)]}${v ? R.base.charAt(0).toLowerCase() + R.base.slice(1) : R.base}${R.adds.slice(0, v).join('')}`.replace(/^(\w)/, (c) => c.toUpperCase());
}
const liveRumors = () => (W.rumors || []).filter((R) => W.day - R.day <= 12 && person(R.about));
function rumorAfterChat(a, b) {
  for (const [x, y] of [[a, b], [b, a]]) {
    for (const R of liveRumors()) {
      const k = R.knowers[x.id]; if (!k || !k.believes) continue;
      const S = person(R.about);
      // a friend of the subject tells them what people are saying
      if (y === S) {
        if (R.told || fscore(x, S) < 3 || rand() > 0.5) continue;
        R.told = W.day;
        const knowsOrigin = k.from === R.origin || x.id === R.origin || rand() < 0.3;
        remember(S, `${x.name} told me people are saying: "${rumorText(R, k.v)}"${knowsOrigin && x.id !== R.origin ? ` It started with ${R.originName}.` : ''}`, 3, R.tone < 0 ? 'rumorAboutMe' : 'kindness', x.name);
        feel(S, x, 0.5, true);
        const O = person(R.origin);
        if (R.tone < 0 && knowsOrigin && O && O !== x) { feel(S, O, -1.5, true); if (!isRealish(S) && !S.confront) S.confront = O.id; }
        if (R.tone < 0) addMood(S, -0.4);
        markDirty(); return;
      }
      if (R.knowers[y.id] || y.id === R.about) continue;
      if (R.tone > 0 ? rand() > 0.15 : fscore(x, S) >= 3 || rand() > 0.3) continue;
      const v = Math.min(4, k.v + (rand() < 0.45 ? 1 : 0)), text = rumorText(R, v);
      const believes = fscore(y, x) >= -1 && fscore(y, S) < 4;
      R.knowers[y.id] = { v, from: x.id, day: W.day, believes };
      if (believes) { feel(y, S, R.tone * 0.4 * (1 + v * 0.25), true); remember(y, `${x.name} told me: "${text}"`, 2, 'rumor', S.name); }
      else { feel(y, x, -0.4, true); remember(y, `${x.name} was spreading stuff about ${S.name}. I don't buy it.`, 2, 'rumorDoubted', x.name); }
      markDirty(); return;
    }
  }
}

// ---------- 2. regulars and neighbors ----------
let nextLifeSample = 12;
function lifeSample() {
  const out = W.people.filter((p) => !p.inside && !p.away && p.state !== 'sleep' && !p.path?.length);
  for (const p of out) if (HAUNT_KEYS.includes(p.at)) { p.haunts = p.haunts || {}; p.haunts[p.at] = Math.min(200, (p.haunts[p.at] || 0) + 1); }
  lifeState();
  for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
    const a = out[i], b = out[j]; if (Math.hypot(a.x - b.x, a.z - b.z) > 6) continue;
    const k = pairKey(a, b); W.familiar[k] = Math.min(100, (W.familiar[k] || 0) + 1);
  }
}
const hauntOf = (p) => { const h = Object.entries(p.haunts || {}).sort((x, y) => y[1] - x[1])[0]; return h && h[1] >= 6 ? h[0] : null; };
// residents go back to their usual spot about half the time they'd otherwise wander
function routineStroll(p) {
  const h = hauntOf(p); if (!h || !TOWN[h] || rand() > 0.5) return false;
  setTask(p, 'stroll', h, jitter(TOWN[h].spot, h === 'plaza' ? 9 : 4));
  return true;
}
const regularsWith = (p) => { const h = hauntOf(p); return h ? W.people.filter((q) => q !== p && hauntOf(q) === h && (W.familiar?.[pairKey(p, q)] || 0) >= 8) : []; };
function familiarNight() {
  lifeState();
  for (const [k, n] of Object.entries(W.familiar)) {
    const [a, b] = k.split('|').map(person); if (!a || !b) { delete W.familiar[k]; continue; }
    // seeing a face often makes it friendlier, unless there's real bad blood
    if (n >= 8) for (const [x, y] of [[a, b], [b, a]]) { const s = fscore(x, y); if (s > -2 && s < 5) feel(x, y, Math.min(0.25, n / 200), true); }
    W.familiar[k] = Math.floor(n * 0.85);
  }
  // next-door neighbors in the same building bump into each other on the stairs
  for (const a of W.people) for (const b of W.people) if (a.id < b.id && homeKey(a) === homeKey(b) && Math.abs(a.room - b.room) === 1) { const k = pairKey(a, b); W.familiar[k] = Math.min(100, (W.familiar[k] || 0) + 3); }
}

// ---------- 3. favors and debts ----------
function favorDone(giver, taker, what) {
  if (!giver || !taker || giver === taker) return;
  lifeState();
  const back = W.favors.find((f) => !f.repaid && !f.done && f.from === taker.id && f.to === giver.id);
  if (back) {
    back.repaid = W.day;
    feel(taker, giver, back.sour ? 1.2 : 0.5, true); feel(giver, taker, 0.3, true);
    remember(giver, `I paid ${taker.name} back for when they ${back.what.replace(/\byou\b/, 'me')}.`, 2, 'repaid', taker.name);
    remember(taker, `${giver.name} paid me back for when I ${back.what.replace(/\byou\b/, 'them')}.${back.sour ? ' Took them long enough.' : ''}`, 2, 'repaid', giver.name);
  } else {
    W.favors.push({ id: 'v' + uid(), from: giver.id, to: taker.id, what, day: W.day, repaid: 0, sour: false });
    if (W.favors.length > 60) W.favors.splice(0, W.favors.length - 60);
  }
  markDirty();
}
const openFavors = () => (W.favors || []).filter((f) => !f.repaid && person(f.from) && person(f.to));
const owes = (a, b) => openFavors().some((f) => f.from === b.id && f.to === a.id);
function favorsNight() {
  for (const f of openFavors()) {
    if (f.sour || W.day - f.day < 5) continue;
    const g = person(f.from), t = person(f.to);
    f.sour = W.day; feel(g, t, -0.5, true);
    remember(g, `On day ${f.day} I ${f.what.replace(/\byou\b/, t.name)}. ${t.name} never paid me back.`, 2, 'unpaid', t.name);
  }
  W.favors = (W.favors || []).filter((f) => !f.repaid || W.day - f.repaid < 10);
}

// ---------- 4. moods that spread ----------
function addMood(p, d) { if (!p) return; p.mood = clamp((p.mood || 0) + d, -1, 1); }
function moodAfterChat(a, b) {
  for (const [x, y] of [[a, b], [b, a]]) {
    const pull = 0.2 + Math.max(0, personaOf(x).warmth) * 0.15 + (fscore(x, y) >= 3 ? 0.1 : 0);
    x.mood = clamp((x.mood || 0) + ((y.mood || 0) - (x.mood || 0)) * pull, -1, 1);
  }
}
function moodNight() {
  for (const p of W.people) {
    let d = 0; for (const m of p.today || []) d += GOOD_TAGS.has(m.tag) ? 0.12 : BAD_TAGS.has(m.tag) ? -0.15 : 0;
    p.mood = clamp((p.mood || 0) * 0.5 + clamp(d, -0.6, 0.6), -1, 1);
  }
  // a crowd shares a mood by the end of the night
  for (const c of W.social?.cliques || []) {
    const mem = c.members.map(person).filter(Boolean); if (mem.length < 2) continue;
    const avg = mem.reduce((s, m) => s + (m.mood || 0), 0) / mem.length;
    for (const m of mem) m.mood = clamp(m.mood + (avg - m.mood) * 0.3, -1, 1);
  }
}
const townMood = () => { const f = W.people.filter((p) => !p.away && !p.visitor); return f.length ? f.reduce((s, p) => s + (p.mood || 0), 0) / f.length : 0; };
const moodWord = (m) => (m >= 0.45 ? 'bright' : m >= 0.15 ? 'good' : m > -0.15 ? 'ordinary' : m > -0.45 ? 'low' : 'rotten');

// ---------- 5. anniversaries and traditions ----------
function anniversaryMorning() {
  lifeState(); W.annDone = W.annDone || {};
  for (const r of W.records || []) {
    if (r.day == null || r.day >= W.day) continue;
    const key = r.id + ':' + W.day; if (W.annDone[key]) continue;
    const years = (W.day - r.day) / YEAR;
    if (!Number.isInteger(years)) continue;
    const [a, b] = r.who.map(person);
    if (r.kind === 'married' && a && b && a.partner === b.id && a.married) {
      W.annDone[key] = 1;
      for (const [x, y] of [[a, b], [b, a]]) { remember(x, `Today is our ${years === 1 ? 'first' : ordinalWord(years)} wedding anniversary, ${y.name} and me.`, 3, 'anniversary', y.name); addMood(x, 0.4); addJoy(x, 15); }
      emote(a, '💕', 5); emote(b, '💕', 5);
      diary(`💒 <b>${esc(a.name)}</b> and <b>${esc(b.name)}</b> have been married ${plural(years, 'year')} today.`);
    } else if (r.kind === 'dating' && a && b && a.partner === b.id && !a.married) {
      W.annDone[key] = 1;
      for (const [x, y] of [[a, b], [b, a]]) { remember(x, `${y.name} and I have been together ${plural(years, 'year')} today.`, 3, 'anniversary', y.name); addMood(x, 0.3); }
      diary(`💕 <b>${esc(a.name)}</b> and <b>${esc(b.name)}</b> have been together ${plural(years, 'year')}.`);
    }
  }
  // a murder is remembered on the real calendar, like the murders themselves
  for (const r of W.records || []) {
    if (r.kind !== 'crime' || !/^Murder:/.test(r.text) || !r.at) continue;
    const yrs = Math.floor((Date.now() - r.at) / YEAR_MS), key = r.id + ':y' + yrs;
    if (yrs < 1 || W.annDone[key]) continue;
    W.annDone[key] = 1;
    const dead = (W.crime?.deceased || []).find((d) => d.id === r.who[0]); const name = dead?.name || r.names?.[0] || 'them';
    for (const q of W.people) if (adult(q) && ((q.feelings[r.who[0]]?.score || 0) >= 3 || rand() < 0.3)) { remember(q, `It's been ${plural(yrs, 'year')} since ${name} died. I still think about it.`, 2, 'memorial', name); addMood(q, -0.2); }
    diary(`🕯 ${plural(yrs, 'year')} since <b>${esc(name)}</b> was killed. People left candles by the fountain.`);
    townRecord('memorial', [], `The town remembered ${name}, ${plural(yrs, 'year')} after the murder.`);
  }
}
const ordinalWord = (n) => ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'][n] || `${n}th`;
function traditionNight() {
  lifeState();
  for (const T of W.social?.trends || []) {
    if (T.tradition || T.kind === 'phrase') continue;
    const lasted = (T.over || W.day) - T.day;
    if (!(T.won || (T.peak >= 4 && lasted >= 6))) continue;
    const name = TRADITION_NAMES[T.text] || `${cap(T.text.split(' ').slice(0, 2).join(' '))} Day`;
    if (W.traditions.some((x) => x.name === name)) { T.tradition = true; continue; }
    T.tradition = true;
    W.traditions.push({ id: 'd' + uid(), name, what: T.text, yd: yearDay(T.day), since: W.day, origin: T.originName, count: 0, last: null });
    diary(`🎏 People want to do this every year now: <b>${esc(name)}</b>, on ${dateText(yearDay(T.day))}. It started with ${esc(T.originName)}.`);
    townRecord('tradition', [T.origin], `${name} became a yearly tradition on ${dateText(yearDay(T.day))}. It grew out of ${T.text}, which ${T.originName} started.`);
  }
}
function traditionMorning() {
  for (const d of W.traditions || []) {
    if (d.yd !== yearDay() || d.last === W.day || d.since === W.day) continue;
    d.last = W.day; d.count++;
    for (const q of W.people) if (!q.away) { remember(q, `Today is ${d.name}. We do it every year now.`, 1, 'tradition'); addMood(q, 0.2); }
    diary(`🎏 Today is <b>${esc(d.name)}</b>, a town tradition since year ${Math.floor((d.since - 1) / YEAR) + 1}.`);
  }
}
const todayTradition = () => (W.traditions || []).find((d) => d.yd === yearDay() && d.since !== W.day);

// ---------- 6. the storyteller ----------
const BIG_KINDS = new Set(['married', 'divorce', 'verdict', 'freeze', 'exonerated', 'crime', 'separated']);
function storyMorning() {
  const S = lifeState().story, D = drama();
  const bigs = (W.records || []).filter((r) => BIG_KINDS.has(r.kind) && r.day != null && (r.kind !== 'crime' || r.big));
  const last = Math.max(bigs.length ? bigs[bigs.length - 1].day : 0, D.last || 0, S.lastBig || 0);
  S.lastBig = last;
  const quiet = W.day - last, prev = S.mode;
  // right after something big, let the town breathe; after a long quiet, stir something
  S.mode = quiet <= 1 ? 'breather' : quiet >= 4 ? 'brewing' : 'calm';
  if (S.mode !== prev) S.since = W.day;
  if (S.mode === 'breather') {
    D.uproarAt = null;
    const pairs = [];
    for (const a of W.people) for (const b of W.people) if (a !== b && fscore(a, b) <= -2 && fscore(a, b) > -6 && fscore(b, a) > -6 && !isRealish(a)) pairs.push([a, b]);
    const pr = pick(pairs); if (pr && !pr[0].makeup) pr[0].makeup = pr[1].id;
  } else if (S.mode === 'brewing') {
    D.heat = Math.max(D.heat, 5.5);
    if (!D.uproarAt && rand() < 0.5) D.uproarAt = 0.26 + rand() * 0.18;
    // an old grudge becomes a rumor
    if (rand() < 0.5) {
      const folk = W.people.filter((p) => p.grow >= 1 && !p.away);
      const src = pick(folk.filter((a) => Object.values(a.feelings).some((f) => f.score <= -3)));
      const tgt = src && pick(folk.filter((q) => q !== src && fscore(src, q) <= -3 && !isRealish(q)));
      const ear = src && tgt && pick(folk.filter((q) => q !== src && q !== tgt && fscore(src, q) >= 1));
      if (ear && rumorStart(src, ear, tgt, '', -1)) remember(ear, `${src.name} told me something about ${tgt.name}.`, 2, 'rumor', tgt.name);
    }
  }
}
const storyQuiet = () => (W.story?.mode === 'breather');

// ---------- hooks ----------
function lifeNight() {
  if (MODE !== 'host') return;
  lifeState(); moodNight(); familiarNight(); favorsNight(); traditionNight();
}
function lifeMorning() {
  if (MODE !== 'host') return;
  lifeState(); storyMorning(); anniversaryMorning(); traditionMorning();
}
function lifeTick() {
  if (MODE !== 'host' || now < nextLifeSample) return;
  nextLifeSample = now + 10 * ts();
  lifeSample();
  const p = pick(W.people.filter((q) => Math.abs(q.mood || 0) >= 0.6 && canChat(q) && !q.emote));
  if (p && rand() < 0.3) emote(p, p.mood > 0 ? '☀' : '☁', 2.5);
}
function lifeAfterChat(a, b) { moodAfterChat(a, b); rumorAfterChat(a, b); }

// ---------- words for the minds ----------
function lifeContext(me, them) {
  const out = [];
  if (Math.abs(me.mood || 0) >= 0.15) out.push(`MOOD: you're in a ${moodWord(me.mood)} mood today.${them && Math.abs(them.mood || 0) >= 0.3 ? ` ${them.name} seems to be in a ${moodWord(them.mood)} mood, and moods rub off.` : ''}`);
  const h = hauntOf(me), regs = regularsWith(me);
  if (h) out.push(`You're a regular at ${TOWN[h].name}.${regs.length ? ` You keep seeing ${regs.slice(0, 3).map((q) => q.name).join(', ')} there.` : ''}${them && regs.includes(them) ? ` ${them.name} is one of the familiar faces there.` : ''}`);
  if (them) {
    const iOwe = openFavors().filter((f) => f.from === them.id && f.to === me.id), theyOwe = openFavors().filter((f) => f.from === me.id && f.to === them.id);
    if (iOwe.length) out.push(`YOU OWE ${them.name}: on day ${iOwe[0].day} they ${iOwe[0].what}, and you haven't paid them back${iOwe[0].sour ? ', and they have noticed' : ''}. You could share food or give a coin to even it out.`);
    if (theyOwe.length) out.push(`${them.name} OWES YOU: on day ${theyOwe[0].day} you ${theyOwe[0].what.replace(/\byou\b/, 'them')}. ${theyOwe[0].sour ? "They never paid you back, and it bugs you." : "You haven't forgotten."}`);
  }
  const heard = liveRumors().filter((R) => R.knowers[me.id] && R.about !== me.id).sort((x, y) => (them && y.about === them.id) - (them && x.about === them.id)).slice(0, 2);
  for (const R of heard) { const k = R.knowers[me.id]; out.push(`A RUMOR you ${k.from ? `heard from ${nameOf(k.from)}` : 'started'}: "${rumorText(R, k.v)}" ${k.believes ? 'You believe it.' : "You don't believe it."}${them && R.about === them.id ? " It's about the person in front of you. You can hint at it, ask about it, or keep it to yourself." : ''}`); }
  const mine = liveRumors().filter((R) => R.about === me.id && R.told);
  if (mine.length) out.push(`PEOPLE ARE SAYING about you: "${rumorText(mine[0], 2)}" It isn't fair, and you know it's going around.`);
  const d = todayTradition(); if (d) out.push(`TODAY is ${d.name}, a town tradition (${d.what}).`);
  for (const r of W.records || []) if (r.day != null && r.day < W.day && (W.day - r.day) % YEAR === 0 && r.who.includes(me.id) && ['married', 'dating'].includes(r.kind) && me.partner && r.who.includes(me.partner)) { out.push(`TODAY is your ${r.kind === 'married' ? 'wedding' : 'dating'} anniversary with ${nameOf(me.partner)} (${plural((W.day - r.day) / YEAR, 'year')}).`); break; }
  return out.length ? `\nYOUR DAY-TO-DAY: ${out.join(' ')}` : '';
}
function lifeBoardHtml() {
  lifeState();
  const S = W.story, rum = liveRumors().slice(-4).reverse(), trad = W.traditions;
  const storyLine = S.mode === 'breather' ? 'Catching its breath after something big.' : S.mode === 'brewing' ? "It's been quiet. Too quiet. Something is brewing." : 'Ordinary days.';
  return `<p class="label">🌡 The mood and the story</p>
    <p class="note" style="margin:2px 0">Town mood: <b>${moodWord(townMood())}</b> · ${esc(storyLine)}</p>
    ${rum.length ? `<p class="label">🗣 Who knows what</p>${rum.map((R) => { const n = Object.keys(R.knowers).length, top = Math.max(...Object.values(R.knowers).map((k) => k.v)); return `<p class="note" style="margin:2px 0"><b>About ${esc(R.aboutName)}</b>, started by ${esc(R.originName)}: "${esc(R.base)}"${top > 0 ? `<br><span class="hint">Now going around as: "${esc(rumorText(R, top))}"</span>` : ''}<br><span class="hint">${n} know. ${R.told ? `${esc(R.aboutName)} knows people are talking.` : `${esc(R.aboutName)} has no idea.`}</span></p>`; }).join('')}` : ''}
    ${trad.length ? `<p class="label">🎏 Traditions</p>${trad.map((d) => `<p class="note" style="margin:2px 0">🎏 <b>${esc(d.name)}</b> on ${esc(dateText(d.yd))} <span class="hint">(${esc(d.what)}, started by ${esc(d.origin)})</span></p>`).join('')}` : ''}`;
}
function lifeBoot() {
  W.added = W.added || {}; if (W.added.life1) return; W.added.life1 = true;
  lifeState();
  if (typeof logUpdate === 'function') logUpdate('build', "Six more things that make the town feel lived in. Rumors change a little every time they're retold, and the Board tab shows who knows what, including whether the person it's about has heard yet. People who keep running into each other at the same café or on the same stairs slowly warm up to each other, and everyone has a usual spot now. People keep score of favors, and an unpaid one turns into a quiet grudge. Moods rub off on whoever you talk to and spread through a crowd. Couples celebrate their anniversaries, the town remembers the day of a murder, and a fad that lasts can become a yearly tradition. And a storyteller now paces things: after something big the town gets a breather, and after a long quiet spell something starts brewing.", 'rumors, regulars, favors, moods, traditions');
}
