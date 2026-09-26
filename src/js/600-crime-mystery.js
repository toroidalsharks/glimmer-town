// ============================================================
// CRIME & MYSTERY: petty theft up to a murder once a year. Every
// serious crime leaves clues that fit real residents. A detective digs,
// the Creator can search, question and accuse, and it all ends in court.
// ============================================================
function crimeState() {
  W.crime = W.crime || { list: [], deceased: [], memorials: [], murderYear: {}, detective: null, lastPetty: -9, lastSerious: -9, seq: 0 };
  return W.crime;
}
const isRealish = (p) => !!(p && ((typeof isMili === 'function' && isMili(p)) || p.lovesMili || p.custom || p.isClaude));
const jailed = (p) => !!(p && p.jail && (p.jail.untilReal ? Date.now() < p.jail.untilReal : W.day < p.jail.until));
const jailedPeople = () => W.people.filter(jailed);
const adult = (p) => p && p.grow >= 1 && !p.away && !p.visitor;
const crimeAble = (p) => adult(p) && !jailed(p) && !isRealish(p);
const victimAble = (p, violent) => adult(p) && !jailed(p) && (!violent || !isRealish(p));
const openCrimes = () => crimeState().list.filter((C) => ['open', 'charged'].includes(C.status));
const crimeById = (id) => crimeState().list.find((C) => C.id === id);
const SHOE_NAMES = { '#2e2a36': 'black', '#ff6f5e': 'red', '#3d4f86': 'navy', '#fffaf2': 'white', '#ffb347': 'orange', '#8a84a8': 'gray', '#5a3a2e': 'brown', '#ff9fbf': 'pink', '#6fbf6a': 'green' };
function traitsOf(p) {
  const h = typeof hairOf === 'function' ? hairOf(p) : { color: 'cocoa', shoe: '#fffaf2' };
  return { shirt: typeof visibleTop === 'function' ? visibleTop(p) : p.outfit?.shirt || 'cream', hair: h.color, shoe: SHOE_NAMES[h.shoe] || 'white', build: p.body.size >= 1.07 ? 'tall' : p.body.size <= 0.95 ? 'small' : 'medium', ears: p.body.ears || 'none', job: p.job || null, laptop: hasLaptop(p) };
}
const TRAIT_WORD = {
  shirt: (v) => `${v}-colored`, hair: (v) => `${v} hair`, shoe: (v) => `${v} shoes`, build: (v) => (v === 'tall' ? 'someone tall' : v === 'small' ? 'someone small' : 'someone of medium height'),
  ears: (v) => (v === 'none' ? 'no ears poking up' : `${v} ears`),
};
const PLACE_BITS = ['near the back door', 'by the window', 'on the railing', 'next to the flower bed', 'on the doorstep', 'under the bench', 'by the lamp post'];
const HOURS = ['around 11 at night', 'just after midnight', 'around 1 in the morning', 'a little before 2 a.m.', 'right before dawn'];

// ---------- the crimes ----------
const CRIME_TYPES = {
  shoplift: { tier: 1, icon: '🛍', label: 'Shoplifting', days: 0, fine: 6 },
  graffiti: { tier: 1, icon: '🎨', label: 'Vandalism', days: 0, fine: 5 },
  garden: { tier: 1, icon: '🥕', label: 'Garden theft', days: 0, fine: 4 },
  pickpocket: { tier: 1, icon: '👛', label: 'Pickpocketing', days: 1, fine: 6 },
  burglary: { tier: 2, icon: '🚪', label: 'Burglary', days: 4, fine: 10 },
  embezzle: { tier: 2, icon: '📒', label: 'Embezzlement', days: 5, fine: 10 },
  fraud: { tier: 2, icon: '📈', label: 'Fraud', days: 5, fine: 8 },
  forgery: { tier: 2, icon: '✉️', label: 'Forgery', days: 3, fine: 6 },
  blackmail: { tier: 2, icon: '📨', label: 'Blackmail', days: 4, fine: 8 },
  arson: { tier: 2, icon: '🔥', label: 'Arson', days: 7, fine: 15 },
  poison: { tier: 2, icon: '🧪', label: 'Poisoning', days: 6, fine: 10 },
  heist: { tier: 2, icon: '💎', label: 'Heist', days: 6, fine: 12 },
  hack: { tier: 2, icon: '💻', label: 'Account hijacking', days: 3, fine: 6 },
  assault: { tier: 2, icon: '🌙', label: 'Assault', days: 5, fine: 8 },
  murder: { tier: 3, icon: '🔪', label: 'Murder', days: 28, fine: 0 },
  admirer: { tier: 0, icon: '💌', label: 'Secret admirer', days: 0, fine: 0 },
};
const SHOP_KEYS = () => ['mart', 'clothes', 'nook', 'cafe', 'bakery', 'books', 'arcade', 'icecream'].filter((k) => TOWN[k]);
function spotOf(key) { if (key === 'plaza') return [0, FOUNTAIN_R + 1.6]; const t = TOWN[key]; return t ? [t.spot[0], t.spot[1] + 1.2] : [0, 6]; }
// how badly does p want to do this? returns { w, victim, why }
function crimeMotive(type, p) {
  const others = W.people.filter((q) => q !== p && adult(q));
  const worst = others.map((q) => [q, fscore(p, q)]).sort((a, b) => a[1] - b[1])[0];
  const broke = p.coins < 4, envy = (p.today || []).concat(p.past || []).some((m) => /jealous|envy/i.test(m.tag || '') || /jealous/i.test(m.text || ''));
  const bold = (p.body.openness ?? 0) > 0.3, grim = (p.joy || 0) < 25;
  const rival = (vio) => { const c = others.filter((q) => victimAble(q, vio) && fscore(p, q) <= -2).sort((a, b) => fscore(p, a) - fscore(p, b)); return c[0] || null; };
  const rich = (vio) => others.filter((q) => victimAble(q, vio)).sort((a, b) => b.coins - a.coins)[0] || null;
  const loveRival = () => { for (const q of others) { if (!victimAble(q, true) || !q.partner) continue; const pr = person(q.partner); if (pr && pr !== p && fscore(p, pr) >= 5 && fscore(p, q) < 0) return q; } return null; };
  switch (type) {
    case 'shoplift': return { w: (broke ? 2 : 0.3) + (grim ? 0.5 : 0), why: broke ? 'was broke and hungry' : 'wanted something they could not afford' };
    case 'graffiti': { const v = rival(false); return { w: v ? 1 + (bold ? 0.8 : 0) : 0.2, victim: v, why: v ? `wanted to get back at ${v.name}` : 'was bored and angry at everything' }; }
    case 'garden': return { w: broke ? 1.5 : 0.2, why: 'was hungry and the garden was right there' };
    case 'pickpocket': { const v = rich(false); return { w: broke ? 1.4 : 0.2, victim: v, why: 'needed coins, fast' }; }
    case 'burglary': { const v = rival(false) || rich(false); return { w: (broke ? 1.2 : 0.2) + (envy ? 1 : 0) + (v && fscore(p, v) < -3 ? 1 : 0), victim: v, why: v && fscore(p, v) < -2 ? `resents ${v.name}` : `envied what ${v?.name || 'others'} had` }; }
    case 'embezzle': return { w: p.job && SHOPS?.[p.job] ? (broke ? 1.4 : 0.5) : 0, why: 'figured nobody checks the till' };
    case 'fraud': return { w: bold ? 1.2 + (broke ? 0.6 : 0) : 0.2, why: 'thought they were smarter than everyone else' };
    case 'forgery': return { w: (p.cr?.score ?? 0) < -2 ? 1.4 : 0.2, why: 'is angry at the Creator and wanted to cause chaos' };
    case 'blackmail': { const v = rival(false); return { w: v ? 1 + (broke ? 0.8 : 0) : 0, victim: v, why: v ? `knew a secret about ${v.name} and wanted to use it` : '' }; }
    case 'arson': { const v = rival(false); const shop = v && SHOP_KEYS().find((k) => W.keeper?.[k] === v.id); return { w: v && shop && fscore(p, v) <= -5 ? 1.2 : 0, victim: v, shop, why: v ? `hated ${v.name} and wanted to hurt their shop` : '' }; }
    case 'poison': { const v = loveRival() || rival(true); return { w: v && fscore(p, v) <= -5 ? 1.2 : 0, victim: v, why: v ? `wanted ${v.name} out of the way` : '' }; }
    case 'heist': return { w: bold && (broke || envy) ? 1.3 : 0.2, why: 'wanted one big score' };
    case 'hack': { const v = rival(false); return { w: v && hasLaptop(p) ? 1.3 : 0, victim: v, why: v ? `wanted to humiliate ${v.name}` : '' }; }
    case 'assault': { const v = rival(true); return { w: v && fscore(p, v) <= -6 ? 1.3 : 0, victim: v, why: v ? `finally snapped at ${v.name}` : '' }; }
    case 'admirer': { if (p.partner) return { w: 0 }; const crush = others.filter((q) => fscore(p, q) >= 4 && !q.partner && q.grow >= 1).sort((a, b) => fscore(p, b) - fscore(p, a))[0]; return { w: crush ? 1 : 0, victim: crush, why: crush ? `has a crush on ${crush.name} and is too shy to say it` : '' }; }
    case 'murder': {
      const lr = loveRival(), rv = rival(true), rc = others.filter((q) => victimAble(q, true)).sort((a, b) => b.coins - a.coins)[0];
      const v = lr || rv || (broke && rc) || null; const f = v ? fscore(p, v) : 0;
      const why = lr ? `was in love with ${person(lr.partner)?.name} and wanted ${lr.name} gone` : rv ? `hated ${rv.name} more than anyone knew` : v ? `wanted ${v.name}'s money` : '';
      return { w: v ? 0.4 + Math.max(0, -f) * 0.25 + (lr ? 1.5 : 0) + (grim ? 0.4 : 0) : 0, victim: v, why };
    }
  }
  return { w: 0 };
}
function pickCulprit(type) {
  const pool = W.people.filter(crimeAble).map((p) => ({ p, m: crimeMotive(type, p) })).filter((x) => x.m.w > 0.05);
  const repeat = crimeState().list.filter((C) => C.status === 'cold' || (C.status === 'closed' && C.wrong)).map((C) => C.culprit);
  pool.forEach((x) => { if (repeat.includes(x.p.id)) x.m.w *= 1.8; });
  const tot = pool.reduce((s, x) => s + x.m.w, 0); if (!tot) return null;
  let r = rand() * tot; for (const x of pool) { r -= x.m.w; if (r <= 0) return x; } return pool[0];
}

// ---------- clues: real traits, so the puzzle can actually be solved ----------
function makeClues(C) {
  const cul = person(C.culprit), T = C.traits[C.culprit];
  const sus = C.suspects.map(person).filter(Boolean), herrings = sus.filter((p) => p.id !== C.culprit);
  const attrs = ['shirt', 'hair', 'shoe', 'build', 'ears'];
  const share = (a, v) => sus.filter((p) => C.traits[p.id][a] === v).length;
  const genuineAttrs = attrs.slice().sort((a, b) => share(a, T[a]) - share(b, T[b]) + (rand() - 0.5) * 0.8).slice(0, 2);
  const place = C.where.label, clues = [];
  const add = (c) => clues.push({ id: 'c' + (clues.length + 1), found: false, ...c });
  const phys = (a, v, genuine) => {
    switch (a) {
      case 'shirt': return { kind: 'fiber', icon: '🧵', text: `A ${v} thread caught ${pick(PLACE_BITS)} at ${place}.`, attr: a, val: v, genuine };
      case 'hair': return { kind: 'hair', icon: '💇', text: `A strand of ${v} hair found at ${place}.`, attr: a, val: v, genuine };
      case 'shoe': return { kind: 'print', icon: '👣', text: `Footprints with ${v} scuff marks leading away from ${place}.`, attr: a, val: v, genuine };
      case 'build': return { kind: 'reach', icon: '📏', text: v === 'tall' ? `Whatever happened at ${place} took someone tall. The marks are way up high.` : v === 'small' ? `The footprints at ${place} are small. Someone short.` : `The footprints at ${place} are medium-sized. Not tall, not small.`, attr: a, val: v, genuine };
      case 'ears': return { kind: 'shadow', icon: '🌒', text: v === 'none' ? `A neighbor saw a silhouette slip past ${place}. A round head, no ears sticking up.` : `A neighbor saw a silhouette slip past ${place}, with ${v} ears sticking up.`, attr: a, val: v, genuine };
    }
  };
  add(phys(genuineAttrs[0], T[genuineAttrs[0]], true));
  const h1 = herrings[0], h2 = herrings[1];
  if (h1) { const ha = attrs.filter((a) => C.traits[h1.id][a] !== T[a]); const a = pick(ha.length ? ha : attrs); add(phys(a, C.traits[h1.id][a], false)); }
  // motives: everyone on the list had a reason
  for (const s of sus) add({ kind: 'motive', icon: '💭', text: C.motives[s.id] || `${s.name} had a grudge.`, pid: s.id, genuine: s.id === C.culprit, soft: true });
  // a witness
  const wit = pick(W.people.filter((q) => !C.suspects.includes(q.id) && q.id !== C.victim && adult(q))) || null;
  if (wit) { const tru = rand() < 0.7; const a = tru ? 'hair' : 'shirt'; const who = tru ? cul : (h2 || h1 || cul); const v = C.traits[who.id][a]; add({ kind: 'witness', icon: '👀', text: `${wit.name} saw someone with ${TRAIT_WORD[a](v)} heading toward ${place} ${pick(HOURS)}.`, attr: a, val: v, genuine: tru, witness: wit.id }); }
  add(phys(genuineAttrs[1], T[genuineAttrs[1]], true));
  // stolen goods turn up, sometimes planted
  if (C.item) {
    const planted = h1 && rand() < 0.3;
    add({ kind: 'item', icon: '📦', text: `${C.item} turned up hidden in ${planted ? h1.name : cul.name}'s room.`, pid: planted ? h1.id : cul.id, genuine: !planted });
    if (planted) C.planted = h1.id;
  }
  // the alibi that doesn't hold up
  add({ kind: 'alibi', icon: '🕯', text: C.alibiBreak, pid: cul.id, genuine: true, strong: true });
  if (C.planted) add({ kind: 'plant', icon: '🔓', text: `Fresh scratches on ${h1.name}'s door lock. Somebody broke IN to plant evidence.`, pid: h1.id, genuine: true, clears: true });
  // order: a physical clue first, then the rest, the alibi near the end
  const first = clues.slice(0, 2), mid = clues.slice(2).filter((c) => !['alibi', 'plant'].includes(c.kind)).sort(() => rand() - 0.5), last = clues.filter((c) => ['alibi', 'plant'].includes(c.kind));
  const all = first.concat(mid, last);
  return typeof withDebunks === 'function' ? withDebunks(C, all) : all;
}
const ALIBIS = {
  home: (p) => [`I was home in room ${p.room + 1} all night. Asleep.`, `The light in room ${p.room + 1} was off all night, and ${p.name}'s neighbor knocked at midnight. Nobody answered. ${p.name} was not home.`],
  cafe: (p) => ['I was at Moonbean Café until late, reading.', 'Moonbean Café closed at 9 that night. The door was locked. Nobody was reading there.'],
  pier: (p) => ['I was fishing on the pier. I go every night.', `The pier lamp was out that night, and nobody saw ${p.name} there. The bucket at the end was bone dry.`],
  walk: (p) => ['I took a long walk on the beach. Alone. I needed to think.', `The tide came in at 11. Any footprints on the beach were washed out. Except ${p.name}'s were found on the path toward the scene instead.`],
  friend: (p, f) => [`I was with ${f?.name || 'a friend'} all night. Ask them.`, `${f?.name || 'The friend'} says ${p.name} left their place before 11, way earlier than they claimed.`],
};
function suspectsFor(C, cul, count = 2) {
  const V = C.victim && person(C.victim);
  const det = crimeState().detective;
  const pool = W.people.filter((q) => q.id !== cul.id && crimeAble(q) && q.id !== C.victim && q.id !== det).map((q) => {
    const T0 = traitsOf(q), Tc = traitsOf(cul); let sim = 0; for (const a of ['shirt', 'hair', 'shoe', 'build', 'ears']) if (T0[a] === Tc[a]) sim++;
    const mot = V ? Math.max(0, -fscore(q, V)) : 0;
    return { q, s: sim * 0.6 + mot * 0.4 + rand() };
  }).sort((a, b) => b.s - a.s);
  return pool.slice(0, count).map((x) => x.q);
}
function motiveText(C, p) {
  const V = C.victim && person(C.victim), f = V ? fscore(p, V) : 0;
  if (p.id === C.culprit) return `${p.name} ${C.why}.`;
  if (V && f <= -3) return `${p.name} and ${V.name} can't stand each other. Everyone has seen them argue.`;
  if (V && V.partner && person(V.partner) && fscore(p, person(V.partner)) >= 4) return `${p.name} has feelings for ${person(V.partner).name}, ${V.name}'s partner.`;
  if (p.coins < 4) return `${p.name} is broke and has been asking around for coins.`;
  return pick([`${p.name} was seen near ${C.where.label} earlier that day.`, `${p.name} has been acting strange lately.`, `${p.name} once said the island "needs a shake-up".`]);
}
// ---------- committing ----------
function newCrime(type, x) {
  const S = crimeState(), K = CRIME_TYPES[type], cul = x.p;
  const C = { id: 'cr' + (++S.seq), n: S.seq, type, tier: K.tier, day: W.day, culprit: cul.id, culpritName: cul.name, victim: x.m.victim?.id || null, victimName: x.m.victim?.name || null, why: x.m.why || 'had their reasons', status: 'open', clues: [], suspects: [], traits: {}, motives: {}, alibis: {}, questioned: {}, searchDay: -1, loss: 0, headline: '', where: { x: 0, z: 6, label: 'the plaza', key: 'plaza' } };
  return C;
}
function commitCrime(type, forced) {
  const S = crimeState(), K = CRIME_TYPES[type];
  const x = forced || pickCulprit(type); if (!x) return null;
  const C = newCrime(type, x), cul = x.p, V = x.m.victim;
  const where = (key, label) => { const [sx, sz] = spotOf(key); C.where = { x: sx, z: sz, label, key }; };
  switch (type) {
    case 'shoplift': { const shop = pick(SHOP_KEYS().filter((k) => (W.stock[k] || []).length)); if (!shop) return null; const it = pick(W.stock[shop]); W.stock[shop].splice(W.stock[shop].indexOf(it), 1); C.item = `A ${itemName(it)}`; C.loss = it.price || 4; C.shop = shop; where(shop, TOWN[shop].name); C.headline = `Someone walked out of ${TOWN[shop].name} with ${a_an(itemName(it))} and didn't pay.`; cul.decor = cul.decor || []; break; }
    case 'graffiti': { const shop = pick(SHOP_KEYS()); where(shop, TOWN[shop].name); C.shop = shop; C.tag = pick(['NOBODY WATCHES THE WATCHERS', 'GLIMMER IS A LIE', V ? `${V.name.toUpperCase()} STINKS` : 'WAKE UP', 'CREATOR??', 'THE PIGEONS KNOW']); C.headline = `Someone spray-painted "${C.tag}" across the side of ${TOWN[shop].name}.`; break; }
    case 'garden': { where('garden', 'the town garden'); C.loss = 6; C.headline = 'Someone raided the town garden overnight. Half the vegetables are gone.'; W.plot && W.plot.forEach((s, i) => { if (s && rand() < 0.5) W.plot[i] = null; }); if (typeof buildPlot === 'function') try { buildPlot(); } catch (e) {} break; }
    case 'pickpocket': { if (!V) return null; const n = Math.min(V.coins, 5 + Math.floor(rand() * 8)); if (n < 2) return null; V.coins -= n; cul.coins += n; C.loss = n; where('plaza', 'the fountain'); C.headline = `${V.name}'s coin pouch was lighter by ${n} coins after the crowd at the fountain.`; break; }
    case 'burglary': { if (!V) return null; const d = (V.decor || []).filter((it) => it.id !== 'laptop'); const it = d.length ? pick(d) : null; if (it) { V.decor.splice(V.decor.indexOf(it), 1); C.stolen = it; C.item = `${V.name}'s ${itemName(it)}`; } const n = Math.min(V.coins, 6 + Math.floor(rand() * 10)); V.coins -= n; cul.coins += n; C.loss = n + (it ? 5 : 0); where(homeKey(V), `room ${V.room + 1}`); C.headline = `Someone broke into ${V.name}'s room in the night${it ? ` and took ${itemName(it)}` : ''}${n ? `, plus ${n} coins` : ''}.`; break; }
    case 'embezzle': { const n = Math.min(W.creator.coins, 25 + Math.floor(rand() * 25)); if (n < 10) return null; W.creator.coins -= n; cul.coins += n; C.loss = n; C.victimName = 'the Creator'; where(cul.job && TOWN[cul.job] ? cul.job : 'plaza', cul.job && TOWN[cul.job] ? TOWN[cul.job].name : 'the plaza'); C.headline = `${n} ✦ went missing from the Creator's coin jar. The books were cooked.`; break; }
    case 'fraud': { const marks = W.people.filter((q) => q !== cul && adult(q) && q.coins >= 6).sort(() => rand() - 0.5).slice(0, 4); if (marks.length < 2) return null; let tot = 0; for (const q of marks) { const n = Math.min(q.coins - 2, 4 + Math.floor(rand() * 6)); q.coins -= n; tot += n; remember(q, `I put ${n} coins into ${cul.name}'s "Glimmer Gold Club". They promised triple back.`, 2, 'scammed', cul.name); } cul.coins += tot; C.loss = tot; C.marks = marks.map((q) => q.id); C.victimName = marks.map((q) => q.name).join(', '); where('downtown', 'downtown'); C.headline = `The "Glimmer Gold Club" promised triple returns. ${marks.length} residents paid in ${tot} coins total. The payouts never came.`; break; }
    case 'forgery': { where('home', 'the mailboxes'); C.headline = 'A letter "from the Creator" went to every mailbox, announcing that the Starfall Festival is canceled forever. The Creator never wrote it.'; for (const q of W.people) { if (rand() < 0.5) creatorShift(q, -0.2); remember(q, 'Got a letter "from the Creator" saying the festival is canceled forever. Something feels off.', 2, 'forgery'); } break; }
    case 'blackmail': { if (!V) return null; const n = Math.min(V.coins, 8 + Math.floor(rand() * 8)); V.coins -= n; cul.coins += n; C.loss = n; where(homeKey(V), `room ${V.room + 1}`); C.headline = `${V.name} has been getting anonymous texts: "Pay up, or everyone finds out." ${V.name} paid ${n} coins.`; remember(V, 'Someone is blackmailing me with anonymous texts. I paid. I am scared.', 3, 'blackmailed'); break; }
    case 'arson': { if (!x.m.shop) return null; C.shop = x.m.shop; where(C.shop, TOWN[C.shop].name); crimeState().closed = { ...(crimeState().closed || {}), [C.shop]: W.day + 2 }; C.headline = `${TOWN[C.shop].name} caught fire in the middle of the night. Nobody was inside. The fire started at the back door, on purpose.`; if (V) remember(V, `My shop, ${TOWN[C.shop].name}, burned in the night. Someone set it on purpose.`, 4, 'arsonVictim'); break; }
    case 'poison': { if (!V) return null; if (typeof catchIll === 'function') catchIll(V, 'stomach', 'from something in their food'); where('cafe', 'Moonbean Café'); C.headline = `${V.name} got violently sick after a drink at Moonbean Café. The doctor says something was put in it.`; break; }
    case 'heist': { const n = Math.min(W.creator.coins, 30 + Math.floor(rand() * 30)); const tgt = pick(['the wishing coins in the fountain', 'the Hall of Records safe', 'the town treasury at Glimmer Hall']); cul.coins += Math.max(n, 20); if (n) W.creator.coins -= n; C.loss = Math.max(n, 20); C.victimName = 'the town'; where(/fountain/.test(tgt) ? 'plaza' : 'hall', /fountain/.test(tgt) ? 'the fountain' : 'Glimmer Hall'); C.headline = `Someone emptied ${tgt} overnight. ${C.loss} ✦ are gone.`; break; }
    case 'hack': { if (!V) return null; where(homeKey(V), 'GlimmerNet'); C.headline = `Embarrassing chirps were posted from ${V.name}'s account overnight. ${V.name} swears they did not write them.`; try { postChirp(V, pick(['I secretly think everyone on this island is boring.', 'Confession: I have never once washed my hat.', 'I cried at a pigeon video and I am not ashamed. Actually I am.', 'Hot take: the fountain is ugly.']), { hacked: C.id }); } catch (e) {} remember(V, 'Someone hacked my GlimmerNet account and posted things as me.', 3, 'hacked'); break; }
    case 'assault': { if (!V) return null; if (typeof injure === 'function') injure(V, pick(['sprain', 'broken', 'bump']), 'in an attack on the way home'); where('park', 'the park'); C.headline = `${V.name} was attacked on the dark path by the park and got hurt. They didn't see who it was.`; break; }
    case 'admirer': { if (!V) return null; where(homeKey(V), `${V.name}'s door`); C.headline = `Someone keeps leaving flowers and little unsigned notes at ${V.name}'s door. The latest one says: "${pick(['You make this island glow.', 'I like the way you laugh.', 'Have a nice day. You deserve it.', 'I saved you the good croissant. Check the mailbox.'])}"`; remember(V, 'Someone has been leaving me flowers and notes. No name. Who?!', 3, 'admirer'); break; }
    case 'murder': return null;
  }
  finishCrime(C, cul);
  return C;
}
function finishCrime(C, cul) {
  const S = crimeState();
  const sus = [cul, ...suspectsFor(C, cul, C.tier >= 3 ? 3 : C.tier >= 2 ? 2 : 1)];
  C.suspects = sus.map((p) => p.id).sort(() => rand() - 0.5);
  for (const p of sus) { C.traits[p.id] = traitsOf(p); C.motives[p.id] = C.type === 'admirer' ? pick([`${p.name} goes quiet whenever ${C.victimName} walks by.`, `${p.name} has been asking what ${C.victimName}'s favorite flower is.`, `${p.name} was seen near ${C.victimName}'s door "just passing by".`]) : motiveText(C, p); }
  const friend = W.people.find((q) => q !== cul && q.id !== C.victim && fscore(q, cul) >= 4 && adult(q));
  const kind = pick(['home', 'home', 'cafe', 'pier', 'walk', ...(friend ? ['friend'] : [])]);
  const [claim, breaks] = ALIBIS[kind](cul, friend);
  C.alibis[cul.id] = claim; C.alibiBreak = breaks;
  if (C.type === 'admirer') { C.alibis[cul.id] = pick(['Flowers? No idea. Why would I know?', "Me? Ha. No. I don't even like flowers.", '…I have to go.']); C.alibiBreak = `${cul.name} bought a small bouquet at Berry Mart at dawn, the same morning the first flowers showed up.`; }
  for (const p of sus) if (p !== cul) { const k = pick(['home', 'cafe', 'friend']); const f = W.people.find((q) => q !== p && fscore(q, p) >= 3 && adult(q)); C.alibis[p.id] = k === 'friend' && f ? `I was at ${f.name}'s place. We played cards until 1. They'll tell you.` : ALIBIS[k === 'friend' ? 'home' : k](p)[0]; }
  C.clues = C.tier >= 2 ? makeClues(C) : makeClues(C).slice(0, 4);
  S.list.push(C); if (S.list.length > 40) S.list.splice(0, S.list.length - 40);
  if (C.type === 'admirer') remember(cul, `SECRET: I've been leaving flowers and notes at ${C.victimName}'s door. Nobody knows it's me.`, 3, 'secretAdmirer');
  else remember(cul, `SECRET: I committed ${CRIME_TYPES[C.type].label.toLowerCase()} on day ${W.day}. ${C.headline} Nobody knows it was me.`, 4, 'secretCrime');
  if (C.tier >= 2) S.lastSerious = W.day; else if (C.tier === 1) S.lastPetty = W.day; else S.lastMystery = W.day;
  markDirty();
}
// the discovery happens in the morning
function crimeDiscover(C) {
  if (C.discovered) return; C.discovered = W.day;
  const K = CRIME_TYPES[C.type];
  if (C.tier === 0) { revealClue(C, null, true); diary(`💌 <b>A secret admirer</b>: ${esc(C.headline)}`); admirerFoundCut(C); markDirty(); return; }
  for (let i = 0; i < (C.tier >= 2 ? 2 : 1); i++) revealClue(C, null, true);
  diary(`${K.icon} <b>${K.label}</b>: ${esc(C.headline)}`);
  { const e = townRecord('crime', [C.victim], `${K.label}: ${C.headline}`); if (e && C.tier >= 2) e.big = true; }
  for (const q of W.people) if (adult(q) && q.id !== C.culprit && rand() < (C.tier >= 2 ? 0.8 : 0.4)) remember(q, `Heard about the ${K.label.toLowerCase()}: ${C.headline}`, C.tier >= 2 ? 2 : 1, 'crimeNews');
  if (C.tier >= 2) { notifyCreator?.('news', pick(W.people.filter((q) => adult(q) && q.id !== C.culprit)), `${K.label} on the island: ${C.headline}`, null, { key: 'crime:' + C.id }).catch?.(() => {}); crimeScene(C); discoverCut(C); }
  markDirty();
}
function revealClue(C, by, quiet) {
  const c = C.clues.find((x) => !x.found); if (!c) return null;
  c.found = true; c.day = W.day; c.by = by ? by.id : null;
  if (c.debunks) { const t = C.clues.find((x) => x.id === c.debunks); if (t) t.ruledOut = true; }
  if (!quiet) diary(`🔎 ${by ? `<b>${esc(by.name)}</b> found a clue` : 'New clue'} in the ${esc(CRIME_TYPES[C.type].label.toLowerCase())} case: ${esc(c.text)}`);
  if (C.status === 'closed' && C.wrong && c.genuine && c.pid === C.culprit) reopenWrong(C);
  markDirty(); return c;
}
// ---------- how strongly the found clues point at someone ----------
function evidenceAgainst(C, pid) {
  let s = 0; const T = C.traits[pid]; if (!T) return 0;
  for (const c of C.clues) {
    if (!c.found || c.ruledOut || c.kind === 'debunk') continue;
    if (c.clears && c.pid === pid) s -= 2.5;
    else if (c.pid) s += c.pid === pid ? (c.strong ? 2.2 : c.soft ? 0.5 : 1.4) : 0;
    else if (c.attr) s += T[c.attr] === c.val ? 1 : -0.4;
  }
  return s;
}
const fitsClue = (C, c) => (c.ruledOut || c.kind === 'debunk' ? [] : C.suspects).filter((pid) => (c.pid ? c.pid === pid && !c.clears : c.attr && C.traits[pid]?.[c.attr] === c.val));
function detectiveOf() {
  const S = crimeState();
  let d = S.detective && person(S.detective);
  if (MODE !== 'host') return d || null;
  if (!d || !adult(d) || jailed(d)) { d = W.people.filter((p) => adult(p) && !jailed(p)).sort((a, b) => (b.body.openness ?? 0) - (a.body.openness ?? 0))[0] || null; S.detective = d?.id || null; if (d) diary(`🔎 <b>${esc(d.name)}</b> is the island's detective now.`); }
  return d;
}
// ---------- the daily rhythm ----------
function crimeNight() {
  if (MODE !== 'host' && !offlineSim) return;
  const S = crimeState();
  // the yearly murder
  const yr = Math.floor((W.day - 1) / YEAR);
  if (!S.murderYear[yr]) S.murderYear[yr] = { day: yr * YEAR + 9 + Math.floor(rand() * 14), done: false };
  const MY = S.murderYear[yr];
  if (murderDue(S, MY) && W.people.filter(crimeAble).length >= 6 && !openCrimes().some((C) => C.type === 'murder')) { if (commitMurder()) murderCommitted(S, MY); }
  const ppl = W.people.filter(adult).length; if (ppl < 5) return;
  if (W.day - S.lastSerious >= 5 && rand() < 0.16) {
    const types = Object.keys(CRIME_TYPES).filter((k) => CRIME_TYPES[k].tier === 2);
    for (let i = 0; i < 4; i++) { const C = commitCrime(pick(types)); if (C) { C.pending = true; break; } }
  } else if (W.day - (S.lastMystery ?? -9) >= 6 && !openCrimes().some((C) => C.tier === 0) && rand() < 0.12) { const C = commitCrime('admirer'); if (C) C.pending = true;
  } else if (W.day - S.lastPetty >= 2 && rand() < 0.25) {
    const types = Object.keys(CRIME_TYPES).filter((k) => CRIME_TYPES[k].tier === 1);
    for (let i = 0; i < 3; i++) { const C = commitCrime(pick(types)); if (C) { C.pending = true; break; } }
  }
}
function crimeMorning() {
  const S = crimeState();
  for (const C of S.list) if (C.pending) { C.pending = false; if (C.type === 'murder') murderMorning(C); else crimeDiscover(C); }
  // the detective works every open case
  const det0 = detectiveOf();
  for (const C of openCrimes()) {
    if (C.status !== 'open' || C.discovered === W.day) continue;
    const det = caseDetective(C, det0);
    if (det && det.id === C.culprit) { if (rand() < 0.35) { const c = revealClue(C, null); if (c) remember(det, 'Someone else found a clue in my own case. I have to be careful.', 3, 'secretCrime'); } }
    else if (det) { const c = revealClue(C, det); if (c) remember(det, `Found a clue in the ${CRIME_TYPES[C.type].label.toLowerCase()} case: ${c.text}`, 2, 'clue'); }
    maybeAutoBriefing(C);
    const age = W.day - (C.discovered || C.day), found = C.clues.filter((c) => c.found).length;
    if (C.tier === 0) { if (age >= 4) admirerReveal(C, C.culprit, true); continue; }
    if (C.tier === 1 && age >= 2) { chargeCrime(C, topSuspect(C), det, false); continue; }
    if (C.tier >= 2 && (age >= (C.tier >= 3 ? 5 : 3) || found >= C.clues.length) && found >= 3) chargeCrime(C, topSuspect(C), det, false);
  }
  // wrongful convictions have a way of coming out
  for (const C of S.list) if (C.status === 'closed' && C.wrong && !C.reopened && rand() < 0.12) { const g = person(C.culprit); if (g && !jailed(g)) { remember(g, `I can't sleep. ${person(C.convicted)?.name || 'Someone'} is paying for what I did.`, 3, 'guilt'); if (rand() < 0.5) confessCut(C); else { C.clues.push({ id: 'cx', found: false, kind: 'new', icon: '🆕', text: C.alibiBreak, pid: C.culprit, genuine: true, strong: true }); revealClue(C, det); } } }
  custodyCheck(false);
  // releases
  for (const p of W.people) if (p.jail && !jailed(p)) releaseFromJail(p, 'served');
  sentenceMorning();
  // funerals
  for (const d of S.deceased) if (!d.funeral && W.day >= d.died + 1) { d.funeral = true; funeralCut(d); }
  crimeProps();
}
function topSuspect(C) { return C.suspects.map((pid) => [pid, evidenceAgainst(C, pid) + rand() * 0.3]).sort((a, b) => b[1] - a[1])[0]?.[0]; }

// ---------- murder ----------
const MURDER_WAYS = [
  { key: 'pier', where: 'the end of the pier', how: 'in the water under the end of the pier', staged: 'looked like a slip on the wet boards' },
  { key: 'park', where: 'the big tree in the park', how: 'at the foot of the big tree in the park', staged: 'looked like a fall from the swing branch' },
  { key: 'downtown', where: 'the clock tower steps', how: 'at the bottom of the clock tower stairs', staged: 'looked like a fall down the stairs' },
  { key: 'garden', where: 'the town garden', how: 'face-down between the garden rows', staged: 'looked like they fainted' },
  { key: 'beach', where: 'Seashell Beach', how: 'on the sand at the tide line', staged: 'looked like they were swept in by the tide' },
];
function commitMurder() {
  const x = pickCulprit('murder'); if (!x || !x.m.victim) return false;
  const cul = x.p, V = x.m.victim, way = pick(MURDER_WAYS);
  const C = newCrime('murder', x);
  const [sx, sz] = way.key === 'pier' ? [0.4, 39] : way.key === 'downtown' ? [DT.x + 2.5, DT.z + 3.5] : way.key === 'beach' ? [BEACH[0] + 2, BEACH[1] + 1] : spotOf(way.key);
  C.where = { x: sx, z: sz, label: way.where, key: way.key }; C.way = way;
  C.headline = `${V.name} was found dead ${way.how}. At first it ${way.staged}. It wasn't.`;
  C.victimHue = V.body.hue; C.victimPartner = V.partner || null;
  finishCrime(C, cul);
  C.pending = true;
  // the victim is gone from tonight on
  killResident(V, C);
  { const S = crimeState(); S.lastMurderAt = Date.now(); S.nextMurderAt = Date.now() + YEAR_MS * (0.85 + rand() * 0.3); }
  return true;
}
function killResident(V, C) {
  const S = crimeState();
  S.deceased.push({ id: V.id, name: V.name, hue: V.body.hue, born: V.bornDay || 1, died: W.day + 1, cause: C ? 'murder' : 'died', crime: C?.id || null, partner: V.partner || null, x: 0, z: 0 });
  const i = W.people.indexOf(V); if (i >= 0) W.people.splice(i, 1);
  const m = meshes.get(V.id); if (m) { scene.remove(m.root); m.tag.remove(); meshes.delete(V.id); }
  if (V.partner) { const pr = person(V.partner); if (pr) { pr.partner = null; pr.married = false; pr.widowed = V.name; } }
  for (const k of Object.keys(W.keeper || {})) if (W.keeper[k] === V.id) delete W.keeper[k];
  if (W.wedding && (W.wedding.a === V.id || W.wedding.b === V.id)) W.wedding = null;
  for (const c of openCases()) if (c.p === V.id || c.d === V.id) { c.status = 'closed'; c.result = `Dismissed. ${V.name} passed away.`; }
  for (const cl of W.clubs || []) cl.members = cl.members.filter((id) => id !== V.id);
  if (W.creator?.gifts) delete W.creator.gifts[V.id];
  if (openDetail === V.id) openDetail = null;
  markDirty();
}
function griefFor(V, C) {
  for (const q of W.people) {
    const f = q.feelings[V.id]?.score || 0;
    if (q.id === C?.culprit) { remember(q, `${V.name} is dead. I did that. Nobody can ever know.`, 4, 'secretCrime'); continue; }
    if (f >= 3) { remember(q, `${V.name} was murdered. I can't believe they're gone.`, 4, 'grief', V.name); if (q.health) { q.health.low = { days: 4, why: `grieving ${V.name}`, since: W.day }; } addJoy(q, -30); }
    else remember(q, `${V.name} was found dead ${C?.way?.how || ''}. The whole island is shaken.`, 3, 'murderNews', V.name);
  }
}
function murderMorning(C) {
  C.discovered = W.day;
  const K = CRIME_TYPES.murder, dec = crimeState().deceased.find((d) => d.id === C.victim);
  if (dec) { dec.x = C.where.x; dec.z = C.where.z; }
  griefFor({ id: C.victim, name: C.victimName }, C);
  for (let i = 0; i < 2; i++) revealClue(C, null, true);
  diary(`🔪 <b>Murder.</b> ${esc(C.headline)}`);
  { const e = townRecord('crime', [C.victim, C.victimPartner], `Murder: ${C.headline}`); if (e) e.big = true; }
  const det = detectiveOf();
  notifyCreator?.('bad', det || pick(W.people), `There has been a murder on ${ISL.name}. ${C.headline}`, `${C.victimName} is dead. Someone did this. Please come to the island.`, { key: 'murder:' + C.id }).catch?.(() => {});
  crimeScene(C); discoverCut(C);
}

// ---------- charges, trials, verdicts ----------
function chargeCrime(C, pid, by, byCreator) {
  if (!C || !pid || !['open'].includes(C.status)) return '';
  if (C.tier === 0) return admirerReveal(C, pid, false);
  const A = person(pid); if (!A) return '';
  C.status = 'charged'; C.accused = pid; C.accusedBy = byCreator ? 'creator' : by?.id || null; C.chargedDay = W.day;
  diary(`⚖ ${esc(A.name)} was charged with <b>${esc(CRIME_TYPES[C.type].label.toLowerCase())}</b>${byCreator ? ' by the Creator' : by ? ` on ${esc(by.name)}'s evidence` : ''}. The trial is at Glimmer Hall.`);
  remember(A, `I was charged with ${CRIME_TYPES[C.type].label.toLowerCase()}. ${A.id === C.culprit ? 'They know.' : 'I did not do it!'}`, 4, 'charged');
  holdForTrial(A, C);
  if (C.tier >= 2) arrestCut(C, by);
  else crimeTrialNow(C);
  markDirty();
  return `${A.name} is charged with ${CRIME_TYPES[C.type].label.toLowerCase()}.`;
}
function lawyers(excl) { return W.people.filter((p) => p.job === 'lawyer' && adult(p) && !jailed(p) && !excl.includes(p.id)); }
// cases whose trial is already being written or waiting in the scene queue.
// Kept out of the save on purpose: after a reload the queue is gone too, and
// "Hold the trial now" has to work again.
const trialsQueued = new Set();
function crimeTrialNow(C) {
  if (trialsQueued.has(C.id)) return;
  const A = person(C.accused); if (!A) return;
  trialsQueued.add(C.id);
  const K = CRIME_TYPES[C.type], det = detectiveOf();
  const law = lawyers([A.id, C.victim]);
  const pros = (law[0] && law[0].id) || (det && det.id !== A.id ? det.id : null) || pick(W.people.filter((p) => adult(p) && p !== A))?.id;
  const counsel = (law[1] && law[1].id) || (W.people.filter((p) => adult(p) && p !== A && p.id !== pros && !jailed(p)).sort((a, b) => fscore(b, A) - fscore(a, A))[0]?.id) || null;
  const taken = [A.id, pros, counsel].filter(Boolean);
  const okW = (id) => id && person(id) && !taken.includes(id) && !jailed(person(id));
  const wit = [C.clues.find((c) => c.found && c.witness && okW(c.witness))?.witness, C.victim, ...(C.marks || []), C.finder, det?.id, ...W.people.filter((p) => adult(p) && (p.feelings[C.victim]?.score || 0) >= 3).map((p) => p.id)].find(okW) || null;
  const crowd = courtCrowd([A.id, pros, counsel, wit].filter(Boolean));
  const T = { kind: 'crime', crime: C.id, pros, counsel, def: A.id, witness: wit, jury: crowd.jury, gallery: crowd.gallery };
  const go = (body) => {
    const lines = [nline(C.type === 'murder' ? 'Every seat in Glimmer Hall was taken. People stood in the aisles.' : pick(['Glimmer Hall was packed.', 'The gallery went quiet.']))].concat(body);
    lines.push(jline('The court has heard the evidence. Creator, what is your verdict? Hoo.'));
    lines[lines.length - 1].choice = { prompt: `Is ${A.name} guilty of ${K.label.toLowerCase()}?`, options: [['guilty', 'Guilty'], ['innocent', 'Not guilty'], ['jury', 'Let the jury decide']], timeout: 30, fallback: 'jury', pick: (k) => crimeVerdict(C, T, k) };
    queueCut({ kind: 'trial', crimeId: C.id, icon: K.icon, title: `The Town v. ${A.name}`, sub: `Charge: ${K.label}${C.victimName ? `, ${C.type === 'murder' ? 'of' : 'against'} ${C.victimName}` : ''}`, music: 'trial', trial: T, lines, stage: courtStage, unstage: courtUnstage, shot: courtShot,
      onEnd: () => { if (C.status === 'charged') crimeVerdict(C, T, 'jury', true); } });
  };
  C.status = 'trial';
  if (typeof offlineSim !== 'undefined' && offlineSim) { go(crimeLines(C, T)); return; }
  Promise.race([aiCrimeLines(C, T), sleep(24000).then(() => null)]).then((ai) => { C.status = 'charged'; go(ai || crimeLines(C, T)); }).catch(() => { C.status = 'charged'; go(crimeLines(C, T)); });
}
function crimeLines(C, T, fl = {}) {
  const A = person(T.def), K = CRIME_TYPES[C.type], guilty = C.culprit === T.def;
  const found = C.clues.filter((c) => c.found), against = found.filter((c) => fitsClue(C, c).includes(T.def) && !c.clears), other = found.filter((c) => !fitsClue(C, c).includes(T.def) || c.clears);
  const pr = T.pros, co = T.counsel || T.def, w = T.witness && person(T.witness) ? T.witness : null;
  const L = [jline(`Order! Hoo. The town versus ${A.name}, on a charge of ${K.label.toLowerCase()}.`, 'gavel')];
  L.push(pline(pr, fl.prosOpen || pick([`Your honor, ${C.headline} The evidence points to one person, and they are sitting right there.`, `On day ${C.day}, ${C.headline.charAt(0).toLowerCase() + C.headline.slice(1)} I will show the court that ${A.name} did it.`])));
  L.push(pline(co, fl.defOpen || pick([`My client didn't do this. This whole case is gossip wearing a fancy hat.`, `${A.name} is innocent, and the prosecution knows its evidence is thin.`, `The real culprit is still out there, laughing at all of us.`])));
  if (fl.plea) L.push(pline(T.def, fl.plea, null, { emote: '💧' }));
  if (w) { L.push(jline('Prosecution, call your first witness.')); L.push(pline(pr, `The prosecution calls ${nameOf(w)} to the stand.`)); const wc = found.find((c) => c.witness === w); L.push(pline(w, wc ? wc.text.replace(`${nameOf(w)} saw`, 'I saw') : C.victim && w === C.victim ? `I just want the truth. It happened to ME. ${C.headline}` : w === C.finder ? `I was the one who found them. I will never forget it.` : (person(w)?.feelings[C.victim]?.score || 0) >= 3 ? `${C.victimName} was my friend. Whoever did this took them from all of us.` : pick(['I saw them arguing a few days before. Loud.', 'Everyone knew there was bad blood.', 'I only know what everyone knows. It was awful.']))); L.push(pline(co, pick(['It was the middle of the night. How can you be so sure of what you saw?', 'Did you actually see a face? Yes or no.', 'Are you sure you are not just repeating gossip?']))); L.push(pline(pr, pick(['Objection! Badgering the witness!', 'Objection! The witness already answered!']), 'objection')); L.push(jline(rand() < 0.5 ? 'Sustained. Hoo. Move along.' : 'Overruled. The witness will answer.')); L.push(pline(w, pick(['I know what I saw.', '…I think so. It was dark.', 'Yes. I am sure.']))); }
  against.slice(0, 3).forEach((c, i) => { L.push(pline(pr, `The prosecution submits Exhibit ${'ABC'[i]}: ${c.text}`, i === 0 ? 'takethat' : null)); L.push({ who: 'crowd', text: pick(['Ooooh…', '*gasp*', 'No way…']), fx: 'gasp' }); });
  if (other.length) { const c = pick(other), fitsO = fitsClue(C, c).filter((pid) => pid !== T.def); L.push(pline(co, `Objection! ${c.text} ${fitsO.length ? `That fits ${fitsO.map(nameOf).join(' and ')}, not my client!` : 'That points away from my client!'}`, 'objection')); L.push({ who: 'crowd', text: pick(['*murmuring*', 'Wait, what?', 'Ooh, plot twist.']), fx: 'gasp' }); L.push(jline(pick(['Order! Order! Hoo!', 'The court will allow it.']), 'order')); }
  L.push(pline(pr, `Then the defendant can tell us where they were that night.`));
  L.push(pline(T.def, C.alibis[T.def] || 'I was home. Asleep. Like a normal person.'));
  const broke = found.find((c) => c.kind === 'alibi' && c.pid === T.def);
  if (broke) {
    L.push(pline(pr, `HOLD IT! ${broke.text}`, 'holdit'));
    L.push({ who: 'crowd', text: '!!!', fx: 'shock' });
    if (guilty && rand() < (C.tier >= 3 ? 0.55 : 0.4)) { L.push(pline(T.def, pick(['I…', 'That is not…', 'Stop. Stop looking at me like that.']), null, { emote: '💧' })); L.push(pline(T.def, `…FINE! Yes! I did it! I ${C.why}. Are you happy now?!`, 'shock', { emote: '💢' })); L.push({ who: 'crowd', text: '*GASP*', fx: 'gasp' }); C.confessed = true; }
    else L.push(pline(T.def, guilty ? pick(['That… that proves nothing.', 'You are twisting everything.']) : pick(['I have no idea why that is! I swear!', 'That is not how it happened!']), null, { emote: '💧' }));
  } else L.push(pline(pr, pick(['A likely story.', 'And nobody can confirm that. Convenient.'])));
  L.push(pline(co, fl.defClose || pick([`Everything you heard today is a guess. You can't lock someone up for a guess.`, `If you're not sure, you have to let ${A.name} go. That is the rule.`])));
  L.push(pline(pr, fl.prosClose || pick([`The clues all point the same way. ${A.name} did this.`, `Look at the evidence, not the tears.`])));
  return L;
}
async function aiCrimeLines(C, T) {
  if (!aiReady() || aiBusy >= 3) return null;
  const A = person(T.def), K = CRIME_TYPES[C.type]; if (!A) return null;
  const allowed = [T.pros, T.counsel, T.def, T.witness, C.victim, ...C.suspects].filter(Boolean);
  const guilty = C.culprit === A.id;
  try {
    const r = await llm(`A courtroom scene in Glimmer Hall on ${ISL.name}, a tiny island town of cute villagers who are real, flawed people. ${A.name} is on trial for ${K.label.toLowerCase()}.${C.type === 'murder' ? ' Keep it non-graphic.' : ''}
PROSECUTOR: ${person(T.pros)?.name}. DEFENSE: ${T.counsel ? person(T.counsel)?.name : `${A.name}, representing themself`}.
THE DEFENDANT: ${sceneProfile(A, { members: [] })}. ${guilty ? `(Secret: ${A.name} did it. They are nervous and defensive.)` : `(Secret: ${A.name} is innocent. They are scared and angry.)`}
The game shows every piece of evidence itself. Your job is only the people: what they feel and how they argue. So you must NOT mention any evidence, clue, time, date, place, color, clothing, object, or where anyone was. Do not invent facts of any kind. The only names you may use: ${allowed.map(nameOf).join(', ')}.
Write five short lines (1 or 2 sentences each):
prosOpen: the prosecutor's opening, about justice and the town.
defOpen: the defense's opening, about doubt and fairness.
plea: the defendant speaking for themself, true to their personality.
defClose: the defense's closing.
prosClose: the prosecutor's closing.
Reply with only JSON: {"prosOpen":"...","defOpen":"...","plea":"...","defClose":"...","prosClose":"..."}`, { model: badModels.has(brainCfg.judge) ? null : brainCfg.judge, max: 500, temperature: 0.7 });
    const fl = {};
    for (const k of ['prosOpen', 'defOpen', 'plea', 'defClose', 'prosClose']) { const t = String(r?.[k] || '').replace(/\s+/g, ' ').trim().slice(0, 220); if (t && factSafe(t, allowed)) fl[k] = t; }
    return crimeLines(C, T, fl);
  } catch (e) { return null; }
}
function crimeVerdict(C, T, k, silent) {
  trialsQueued.delete(C.id);
  if (!['charged', 'trial'].includes(C.status)) return [];
  const A = person(T.def), K = CRIME_TYPES[C.type]; if (!A) return [];
  let guilty;
  if (k === 'guilty') guilty = true; else if (k === 'innocent') guilty = false;
  else { const s = evidenceAgainst(C, A.id) + (C.confessed ? 6 : 0); const jury = (T.jury || []).map(person).filter(Boolean); let yes = 0; for (const q of jury) { const lean = s - 2.2 - fscore(q, A) * 0.12 + (rand() - 0.5) * 2; if (lean > 0) yes++; } const n = jury.length || 6; guilty = yes > n / 2; C.jury = `${yes}–${n - yes}`; }
  C.verdict = guilty ? 'guilty' : 'innocent'; C.byCreator = k !== 'jury'; C.verdictDay = W.day;
  const L = [];
  if (k === 'jury') { const fp = person((T.jury || [])[0]); L.push(fp ? pline(fp.id, 'The jury has reached a verdict. We find the defendant…') : { who: 'jury', text: 'We find the defendant…' }); }
  else L.push(jline('The Creator has decided. The defendant is…'));
  L.push({ who: 'narrator', text: '', fx: guilty ? 'guilty' : 'innocent', hold: 2 });
  if (guilty) {
    const fine = Math.min(A.coins, (C.loss || 0) + K.fine);
    A.coins -= fine; if (C.victim && person(C.victim)) person(C.victim).coins += Math.min(fine, C.loss || fine); else if (C.victimName === 'the Creator' || C.victimName === 'the town') W.creator.coins = Math.min(999, W.creator.coins + Math.min(fine, C.loss || 0));
    for (const id of C.marks || []) { const q = person(id); if (q) q.coins += Math.floor(fine / (C.marks.length || 1)); }
    if (C.stolen && C.victim && person(C.victim)) person(C.victim).decor.push(C.stolen);
    C.restitution = fine;
    C.status = 'closed'; C.convicted = A.id; C.wrong = C.culprit !== A.id;
    if (C.wrong) { const g = person(C.culprit); if (g) remember(g, `${A.name} got convicted for what I did. I should feel relieved. I don't.`, 4, 'guilt'); }
    const opts = sentenceOptions(C, A);
    if (k === 'guilty' && !silent) { const Lc = jline(`Creator, what should happen to ${A.name}? Hoo.`); Lc.choice = { prompt: `Sentence for ${A.name}`, options: opts.map((o) => [o.key, o.label]), timeout: 30, fallback: opts[0].key, pick: (key) => applySentence(C, A, key) }; L.push(Lc); }
    else L.push(...applySentence(C, A, opts[0].key));
  } else {
    L.push(jline(`${A.name} is free to go. Hoo. The case stays open.`, 'gavel'));
    L.push(pline(A.id, pick(['Thank you. Thank you.', 'I TOLD you!', 'Can I go home now?']), null, { emote: '✨' }));
    C.status = C.clues.some((c) => !c.found) ? 'open' : 'cold'; C.accused = null; C.acquitted = [...(C.acquitted || []), A.id]; endRemand(A);
    remember(A, `I was found not guilty of ${K.label.toLowerCase()}. Everyone still looks at me funny.`, 3, 'acquitted');
    townRecord('acquitted', [A.id, C.victim], `${A.name} was found not guilty of ${K.label.toLowerCase()}${!C.byCreator && C.jury ? ` (jury ${C.jury})` : ' by the Creator'}. The case is still open.`);
  }
  L.push(jline('Court is adjourned!', 'gavel'));
  diary(`⚖ Verdict in <b>The Town v. ${esc(A.name)}</b> (${esc(K.label.toLowerCase())})${C.jury ? `, jury ${C.jury}` : C.byCreator ? ', ruled by the Creator' : ''}: <b>${guilty ? 'GUILTY' : 'NOT GUILTY'}</b>${guilty && C.sentence ? `. ${esc(C.sentence)}.` : '.'}`);
  notifyCreator?.('news', A, `Verdict: ${A.name} was found ${guilty ? 'GUILTY' : 'not guilty'} of ${K.label.toLowerCase()}.`, null, { key: 'verdict:' + C.id }).catch?.(() => {});
  markDirty();
  return silent ? [] : L;
}
function releaseFromJail(p, why) {
  const C = p.jail && crimeById(p.jail.crime); p.jail = null;
  if (p.task?.kind === 'jail') { p.task = null; p.state = 'free'; p.busyUntil = 0; p.inside = false; const s = TOWN.hall.spot; p.x = s[0]; p.z = s[1] + 1.5; }
  diary(`🔓 <b>${esc(p.name)}</b> ${why === 'pardon' ? 'was pardoned by the Creator' : why === 'exonerated' ? 'was set free. They were innocent all along' : why === 'parole' ? 'was released on parole' : 'finished their sentence'} and walked out of Glimmer Hall.`);
  remember(p, why === 'parole' ? 'I got parole. I am out, on probation, with an ankle monitor.' : why === 'pardon' ? 'The Creator pardoned me. I am free.' : why === 'exonerated' ? 'They finally found out it wasn\'t me. I lost days of my life for nothing.' : 'I served my time. I am out.', 3, 'released');
  if (why !== 'parole' && (why !== 'served' || (C && C.type === 'murder'))) releaseCut(p, why, C);
  markDirty();
}
function reopenWrong(C) {
  if (C.reopened) return; C.reopened = true;
  const inn = person(C.convicted); if (inn && jailed(inn)) releaseFromJail(inn, 'exonerated');
  if (inn && typeof compensateWrong === 'function') compensateWrong(inn, C);
  C.status = 'open'; C.wrong = false; C.convicted = null; C.acquitted = [...(C.acquitted || []), inn?.id].filter(Boolean);
  if (inn) townRecord('exonerated', [inn.id, C.victim], `New evidence cleared ${inn.name} of the ${CRIME_TYPES[C.type].label.toLowerCase()}. They were innocent, and the case was reopened.`);
  diary(`🆕 New evidence in the ${esc(CRIME_TYPES[C.type].label.toLowerCase())} case. <b>${esc(inn?.name || 'The convicted resident')}</b> was innocent.`);
  const g = person(C.culprit); if (g && crimeAble(g)) setTimeout(() => chargeCrime(C, g.id, detectiveOf(), false), 1500);
}
// ---------- jail upkeep: runs every tick ----------
function jailHold(p) {
  if (!jailed(p)) return false;
  const s = TOWN.hall.spot;
  p.inside = true; p.at = 'hall'; p.path = []; p.x = s[0]; p.z = s[1]; p.state = 'talk';
  if (p.task?.kind !== 'jail') p.task = { kind: 'jail', phase: 'do' };
  p.busyUntil = Infinity; p.hunger = Math.min(p.hunger, 0.45);
  return true;
}
function crimeClosed(shop) { const c = crimeState().closed || {}; return c[shop] && W.day <= c[shop]; }

