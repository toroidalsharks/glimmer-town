// ============================================================
// SOCIAL CURRENTS: crowds, fads, causes and freeze-outs. The
// group-level life of a small town that one-on-one chats miss.
// ============================================================
// W.social = {
//   cliques: [{ id, name, members: [ids], leader, since }],   rebuilt each night from mutual feelings
//   trends:  [{ id, kind, text, say, origin, day, adopters: { pid: day }, dropped: { pid: day }, peak, over }]
//   freezes: [{ id, target, clique, leader, members: [ids], why, day, until, breakers: [ids], reply }]
//   seq }
// How it works, loosely after the research on small groups:
// - crowds form where friendship is mutual and closes into triangles; the best-liked member sets the tone
// - a friend's enemy slowly becomes your enemy too, and a friend's friend a friend (balance)
// - fads spread by thresholds: you pick one up once enough of your friends have, sooner if your
//   crowd's leader did; contrarians drop it once it's everywhere, and everyone gets bored of it
// - a crowd can freeze someone out; not everyone goes along, anyone can break ranks and pay for it,
//   and the one left out tries to win them back, pulls away, or lashes out
// Real people (Mili, Red, Tim, invited residents) can join crowds and fads but are never frozen out.
const CROWD_NAMES = ['the Fountain Crowd', 'the Night Owls', 'the Café Regulars', 'the Pier Kids', 'the Garden Gang', 'the Bench Club', 'the Lamp Post Lot', 'the Sunny Side', 'the Early Birds', 'the Back Row'];
const FADS = {
  phrase: ['"it\'s giving fountain"', '"big hoot energy"', '"absolutely glimmering"', '"that\'s so ferry"', '"tide\'s out" (meaning: nope)', '"certified cozy"', '"not the pier again"', '"low-key starfall"'],
  hobby: ['stacking pebbles on the beach', 'counting birds from the pier', 'writing tiny poems on napkins', 'collecting sea glass', 'competitive cloud watching', 'journaling at the café', 'sunrise walks', 'knitting little hats for no one'],
  cause: ['a petition for more benches by the fountain', 'boycotting the café until prices come down', 'a campaign to give the island a flag', 'a push for a weekly town picnic', 'a campaign to keep the lamps on all night', 'a petition to name the island\'s cat'],
};
const FAD_WORD = { phrase: 'saying', hobby: 'into', cause: 'backing' };
function socialState() { W.social = W.social || { cliques: [], trends: [], freezes: [], seq: 0 }; return W.social; }
const socialFolk = () => W.people.filter((p) => p.grow >= 0.8 && !p.visitor && !p.away && !(typeof jailed === 'function' && jailed(p)));
const mutualFeel = (a, b) => Math.min(fscore(a, b), fscore(b, a));
const townLikes = (p) => W.people.reduce((s, q) => s + (q === p ? 0 : clamp(fscore(q, p), -5, 8)), 0);
const cliqueOf = (p) => (W.social?.cliques || []).find((c) => c.members.includes(p.id)) || null;
const liveFreezes = () => (W.social?.freezes || []).filter((f) => !f.over);
const frozenBy = (member, target) => liveFreezes().find((f) => f.target === target.id && f.members.includes(member.id) && !f.breakers.includes(member.id)) || null;
// the sim keeps crowd members away from whoever they're freezing out, most of the time
const socialAvoids = (a, b) => !!(frozenBy(a, b) || frozenBy(b, a));

// ---------- crowds ----------
function formCliques() {
  const S = socialState(), folk = socialFolk().sort((x, y) => townLikes(y) - townLikes(x)), used = new Set(), out = [];
  for (const seed of folk) {
    if (used.has(seed.id)) continue;
    const g = [seed];
    const cands = folk.filter((q) => q !== seed && !used.has(q.id) && mutualFeel(seed, q) >= 3).sort((x, y) => mutualFeel(seed, y) - mutualFeel(seed, x));
    for (const q of cands) if (g.length < 5 && g.every((m) => mutualFeel(m, q) >= 1.5)) g.push(q);
    if (g.length < 3) continue;
    g.forEach((m) => used.add(m.id));
    const ids = g.map((m) => m.id), inner = (m) => g.reduce((s, o) => s + (o === m ? 0 : fscore(o, m)), 0);
    const leader = g.slice().sort((x, y) => inner(y) - inner(x))[0].id;
    const prev = (S.cliques || []).map((c) => [c, c.members.filter((id) => ids.includes(id)).length / new Set([...c.members, ...ids]).size]).sort((x, y) => y[1] - x[1])[0];
    if (prev && prev[1] >= 0.5) out.push({ ...prev[0], members: ids, leader });
    else {
      const taken = new Set([...out, ...(S.cliques || [])].map((c) => c.name));
      const name = CROWD_NAMES.find((n) => !taken.has(n)) || `${person(leader).name}'s crowd`;
      out.push({ id: 'c' + (++S.seq), name, members: ids, leader, since: W.day });
      if (W.day > 1) diary(`👥 <b>${esc(person(leader).name)}</b>, ${g.filter((m) => m.id !== leader).map((m) => esc(m.name)).join(', ')} have become a crowd. People are calling them ${esc(name)}.`);
    }
  }
  S.cliques = out;
  return out;
}
// a friend's enemy, a friend's friend
function balanceNight() {
  const folk = socialFolk(); let n = 0;
  for (const a of folk) for (const b of folk) {
    if (a === b || fscore(a, b) < 5) continue;
    for (const c of folk) {
      if (c === a || c === b || n > 40) continue;
      const bc = fscore(b, c), ac = fscore(a, c);
      if (bc <= -4 && ac > -3 && ac < 4) { feel(a, c, -0.15, true); n++; }
      else if (bc >= 5 && ac > -1 && ac < 2 && rand() < 0.3) { feel(a, c, 0.12, true); n++; }
    }
  }
}
function standingText(p) {
  const folk = socialFolk(); if (folk.length < 5) return '';
  const ranked = folk.slice().sort((x, y) => townLikes(y) - townLikes(x)), i = ranked.indexOf(p); if (i < 0) return '';
  return i < Math.max(1, Math.round(folk.length * 0.2)) ? 'In town, you are one of the best-liked people, and you know it.' : i >= folk.length - Math.max(1, Math.round(folk.length * 0.2)) ? 'In town, people mostly overlook you. You notice who does and doesn\'t say hi.' : '';
}

// ---------- fads and causes ----------
function startTrend(kind, origin, text) {
  const S = socialState();
  kind = kind || pick(['phrase', 'phrase', 'hobby', 'hobby', 'cause']);
  const live = S.trends.filter((t) => !t.over).map((t) => t.text);
  text = text || pick(FADS[kind].filter((x) => !live.includes(x) && !S.trends.slice(-8).some((t) => t.text === x))) || pick(FADS[kind]);
  if (!origin) { const folk = socialFolk(); origin = folk.sort((x, y) => (personaOf(y).edge + rand()) - (personaOf(x).edge + rand()))[0]; }
  if (!origin) return null;
  const T = { id: 't' + (++S.seq), kind, text, origin: origin.id, originName: origin.name, day: W.day, adopters: { [origin.id]: W.day }, dropped: {}, peak: 1, over: false };
  S.trends.push(T); if (S.trends.length > 12) S.trends.splice(0, S.trends.length - 12);
  remember(origin, kind === 'phrase' ? `I started saying ${text}. It's funny. It might catch on.` : kind === 'cause' ? `I started ${text}. Somebody has to.` : `I got into ${text}.`, 2, 'trend');
  if (kind === 'cause') diary(`📣 <b>${esc(origin.name)}</b> started ${esc(text)}.`);
  markDirty();
  return T;
}
// how easily someone picks things up: open, restless people early; tidy, careful people late
const fadThreshold = (p, T) => clamp(0.4 - personaOf(p).edge * 0.18 + personaOf(p).order * 0.1 + (seededRand(hashStr(p.id + T.id))() - 0.5) * 0.3, 0.08, 0.85);
function spreadTrend(T) {
  const folk = socialFolk(), has = (p) => !!T.adopters[p.id];
  const share = folk.filter(has).length / Math.max(1, folk.length);
  const joined = [], left = [];
  for (const p of folk) {
    if (has(p)) {
      const age = W.day - T.adopters[p.id], P = personaOf(p);
      const bored = age >= 4 && rand() < 0.12 * (age - 3);
      const tooMainstream = share > 0.6 && P.edge > 0.45 && rand() < 0.5;
      if ((bored || tooMainstream) && p.id !== T.origin || (p.id === T.origin && age > 9 && rand() < 0.3)) { delete T.adopters[p.id]; T.dropped[p.id] = W.day; left.push([p, tooMainstream]); }
      continue;
    }
    if (T.dropped[p.id]) continue;
    const friends = folk.filter((q) => q !== p && fscore(p, q) >= 2);
    if (!friends.length) continue;
    let x = friends.filter(has).length / friends.length;
    const c = cliqueOf(p); if (c && c.leader !== p.id && T.adopters[c.leader]) x += 0.25;
    if (T.kind === 'cause' && fscore(p, person(T.origin) || p) <= -2) x -= 0.5;
    if (x >= fadThreshold(p, T)) { T.adopters[p.id] = W.day; joined.push(p); }
  }
  for (const p of joined) remember(p, T.kind === 'phrase' ? `Everyone's saying ${T.text} lately. I caught myself saying it too.` : T.kind === 'cause' ? `I'm backing ${T.text} now. My friends are.` : `I got into ${T.text}, like my friends.`, 1, 'trend');
  for (const [p, main] of left) remember(p, main ? `Everyone's doing ${T.kind === 'phrase' ? `the ${T.text} thing` : T.text} now. It's over. I'm done with it.` : `I'm kind of over ${T.kind === 'phrase' ? T.text : T.text} now.`, 1, 'trend');
  const n = Object.keys(T.adopters).length;
  if (n >= 3 && T.peak < 3) townRecord('trend', [T.origin], T.kind === 'cause' ? `${T.originName} started ${T.text}, and people are signing on.` : T.kind === 'phrase' ? `Everyone started saying ${T.text}. ${T.originName} said it first.` : `${cap(T.text)} caught on around town. ${T.originName} started it.`);
  if (T.kind === 'cause' && n >= Math.ceil(folk.length * 0.6) && !T.won) { T.won = W.day; diary(`📣 Most of the town is now backing ${esc(T.text)}.`); townRecord('trend', Object.keys(T.adopters), `Most of the town got behind ${T.text}.`); }
  T.peak = Math.max(T.peak, n);
  if (n <= 1 && W.day - T.day >= 3) { T.over = W.day; if (T.peak >= 3) diary(`🍂 ${T.kind === 'phrase' ? `Nobody says ${esc(T.text)} anymore.` : `${esc(cap(T.text))} is over. ${T.kind === 'cause' ? 'It fizzled out.' : 'People moved on.'}`}`); }
}

// ---------- freeze-outs ----------
function freezeCandidate(c) {
  const members = c.members.map(person).filter(Boolean), L = person(c.leader); if (!L || members.length < 3) return null;
  const ban = new Set(liveFreezes().map((f) => f.target));
  let best = null;
  for (const t of socialFolk()) {
    if (c.members.includes(t.id) || ban.has(t.id) || isRealish(t) || t.grow < 1) continue;
    const avg = members.reduce((s, m) => s + fscore(m, t), 0) / members.length;
    if (avg > -2.5 || fscore(L, t) > -3) continue;
    if (!best || avg < best[1]) best = [t, avg];
  }
  // someone inside the crowd who betrayed another member can get pushed out too
  for (const t of members) {
    if (t.id === c.leader || ban.has(t.id) || isRealish(t)) continue;
    const others = members.filter((m) => m !== t), avg = others.reduce((s, m) => s + fscore(m, t), 0) / others.length;
    if (avg <= -2 && fscore(L, t) <= -3 && (!best || avg < best[1])) best = [t, avg];
  }
  return best && best[0];
}
function whyFreeze(c, t) {
  const L = person(c.leader), mem = [...(L.past || []), ...(L.today || [])].filter((m) => m.who === t.name && /Mean|fight|lostCase|laughedAt|rumor|breakup|heartbreak|textMean|subtweeted/.test(m.tag || '')).slice(-1)[0];
  if (t.record?.length) return `${t.name} was convicted of ${t.record.slice(-1)[0].crime.toLowerCase()}`;
  return mem ? String(mem.text).slice(0, 120) : `${L.name} decided ${t.name} can't be trusted`;
}
function startFreeze(c, t) {
  const S = socialState(), L = person(c.leader); if (!L || !t) return null;
  const inside = c.members.includes(t.id);
  const members = [L.id];
  const holdouts = [];
  for (const id of c.members) {
    const m = person(id); if (!m || m === L || m === t) continue;
    const P = personaOf(m);
    const pull = -fscore(m, t) * 0.25 + fscore(m, L) * 0.15 + (0.3 - P.warmth * 0.3) + rand() * 0.5;
    if (fscore(m, t) >= 4 || pull < 0.9) holdouts.push(m); else members.push(m.id);
  }
  if (members.length < 2) return null;
  if (inside) c.members = c.members.filter((id) => id !== t.id);
  const P = personaOf(t);
  const reply = P.edge > 0.35 ? 'lash' : P.warmth > 0.15 ? 'winback' : 'withdraw';
  const F = { id: 'f' + (++S.seq), target: t.id, targetName: t.name, clique: c.id, cliqueName: c.name, leader: L.id, members, why: whyFreeze(c, t), day: W.day, until: W.day + 3 + Math.floor(rand() * 4), breakers: [], reply, over: false };
  S.freezes.push(F); if (S.freezes.length > 10) S.freezes.splice(0, S.freezes.length - 10);
  const names = members.map((id) => person(id).name);
  for (const id of members) remember(person(id), id === L.id ? `I told ${c.name} we're done with ${t.name}. ${F.why}.` : `${L.name} says we're not talking to ${t.name} anymore. So I'm not.`, 2, 'freezing', t.name);
  for (const m of holdouts) remember(m, `${L.name} wants ${c.name} to freeze out ${t.name}. I didn't agree to that.`, 2, 'freezeHoldout', t.name);
  remember(t, inside ? `${c.name} pushed me out. ${names.join(', ')} stopped talking to me.` : `${names.join(', ')} are freezing me out. Nobody will say why to my face.`, 4, 'frozenOut', L.name);
  addJoy(t, -25);
  if (reply === 'winback') { const w = members.map(person).sort((x, y) => fscore(t, y) - fscore(t, x))[0]; t.makeup = w.id; }
  else if (reply === 'lash') t.confront = L.id;
  else { const other = socialFolk().filter((q) => q !== t && !members.includes(q.id)).sort((x, y) => fscore(t, y) - fscore(t, x))[0]; if (other) t.befriend = other.id; }
  diary(`🧊 <b>${esc(c.name)}</b> ${inside ? 'pushed' : 'is freezing'} <b>${esc(t.name)}</b> out${inside ? ' of the group' : ''}. ${esc(L.name)} started it${holdouts.length ? `; ${holdouts.map((m) => esc(m.name)).join(' and ')} didn't go along` : ''}.`);
  townRecord('freeze', [t.id, ...members], `${c.name} (${names.join(', ')}) started freezing out ${t.name}${inside ? ' and pushed them out of the group' : ''}. ${L.name} started it.`);
  markDirty();
  return F;
}
function thawNight() {
  for (const F of liveFreezes()) {
    const t = person(F.target), L = person(F.leader);
    const holding = F.members.filter((id) => !F.breakers.includes(id) && person(id));
    const done = !t || !L || W.day >= F.until || fscore(L, t) > -1 || holding.length < 2;
    if (!done) continue;
    F.over = W.day;
    if (!t) continue;
    remember(t, holding.length < 2 ? `The freeze-out fell apart. People started talking to me again.` : `${F.cliqueName} stopped freezing me out. Nobody apologized.`, 3, 'thawed');
    for (const id of holding) { const m = person(id); if (m) remember(m, `We stopped freezing out ${t.name}.`, 1, 'thawed', t.name); }
    diary(`🌤 The freeze-out on <b>${esc(t.name)}</b> is over${F.breakers.length ? `, after ${F.breakers.map((id) => esc(nameOf(id))).join(' and ')} broke ranks` : ''}.`);
  }
}
// called after every chat: anyone who talks to the one being frozen out either keeps the freeze or breaks it
function socialAfterChat(a, b) {
  for (const [m, t] of [[a, b], [b, a]]) {
    const F = frozenBy(m, t); if (!F) continue;
    if (fscore(m, t) >= 1) {
      F.breakers.push(m.id); const L = person(F.leader);
      if (L && L !== m) { feel(L, m, -0.8, true); remember(L, `${m.name} went and talked to ${t.name} like nothing happened.`, 2, 'brokeRanks', m.name); }
      remember(m, `I talked to ${t.name} even though ${F.cliqueName} isn't. I don't care.`, 2, 'brokeRanks', t.name);
      remember(t, `${m.name} actually talked to me. Nobody else from ${F.cliqueName} will.`, 3, 'kindness', m.name); feel(t, m, 1, true);
    } else { remember(t, `${m.name} gave me the cold shoulder.`, 2, 'coldShoulder', m.name); feel(t, m, -0.5, true); }
    markDirty();
  }
}

// ---------- night and day ----------
function socialNight() {
  if (MODE !== 'host') return;
  const S = socialState();
  balanceNight();
  thawNight();
  formCliques();
  for (const T of S.trends) if (!T.over) spreadTrend(T);
  for (const c of S.cliques) if (rand() < 0.3) { const t = freezeCandidate(c); if (t) { startFreeze(c, t); break; } }
}
function socialMorning() {
  if (MODE !== 'host') return;
  const S = socialState();
  if (S.trends.filter((t) => !t.over).length < 2 && socialFolk().length >= 5 && rand() < 0.35) startTrend();
}
let nextFadBubble = 40;
function socialTick() {
  if (MODE !== 'host' || now < nextFadBubble || W.meeting || isNight()) return;
  nextFadBubble = now + (30 + rand() * 40) * ts();
  const S = W.social; if (!S) return;
  const T = pick(S.trends.filter((t) => !t.over && t.kind !== 'cause')); if (!T) return;
  const p = pick(Object.keys(T.adopters).map(person).filter((q) => q && canChat(q) && !q.bubble)); if (!p) return;
  if (T.kind === 'phrase') bubble(p, `${T.text.replace(/^"|"(?:.*)$/g, '')}!`.replace(/!!$/, '!'), 2.6);
  else { emote(p, '✨', 2.4); bubble(p, pick(['Has anyone else tried', 'I spent all morning', "Can't stop"]) + ` ${T.text.split(' ').slice(0, 3).join(' ')}…`, 2.6); }
}

// ---------- words for the minds ----------
function socialContext(me, them) {
  const S = W.social; if (!S) return '';
  const out = [], c = cliqueOf(me);
  if (c) { const L = person(c.leader), others = c.members.filter((id) => id !== me.id).map(nameOf); out.push(`YOUR CROWD: you run with ${others.join(', ')} (people call you ${c.name}).${L && L !== me ? ` ${L.name} sets the tone, and you care what they think.` : ' You set the tone, and you like it that way.'}${them && c.members.includes(them.id) ? ` ${them.name} is one of your crowd.` : them && cliqueOf(them) ? ` ${them.name} runs with a different crowd (${cliqueOf(them).name}).` : ''}`); }
  const st = standingText(me); if (st) out.push(st);
  for (const F of liveFreezes()) {
    const t = person(F.target); if (!t) continue;
    if (F.target === me.id) out.push(`YOU ARE BEING FROZEN OUT by ${F.cliqueName} (${F.members.map(nameOf).join(', ')}) since day ${F.day}. It hurts more than you let on.${F.reply === 'winback' ? ' You want back in and you are trying to make nice.' : F.reply === 'lash' ? ' You are angry and you might say something sharp about them.' : ' You act like you don\'t care and keep to yourself.'}${F.breakers.length ? ` ${F.breakers.map(nameOf).join(' and ')} still talked to you.` : ''}`);
    else if (F.members.includes(me.id) && !F.breakers.includes(me.id)) out.push(`YOUR CROWD IS FREEZING OUT ${t.name} (${F.leader === me.id ? 'your idea' : `${nameOf(F.leader)}'s idea`}: ${F.why}).${them === t ? ` Right now you're face to face with ${t.name}. Keep it short and cold, unless you decide to break ranks, and your crowd would hear about it.` : ''}`);
    else if (them === t) out.push(`${F.cliqueName} is freezing ${t.name} out. You can join in, stay out of it, or stick up for them.`);
  }
  for (const T of (S.trends || []).filter((x) => !x.over)) {
    const on = !!T.adopters[me.id], n = Object.keys(T.adopters).length;
    if (on) out.push(T.kind === 'phrase' ? `LATELY you keep saying ${T.text}. ${T.origin === me.id ? 'You started it.' : `${T.originName} started it, and it's catching on.`} Use it now and then if it fits.` : T.kind === 'cause' ? `YOU'RE BACKING ${T.text} (${T.origin === me.id ? 'you started it' : `${T.originName} started it`}). Bring it up and try to win people over.` : `LATELY you're into ${T.text}, like ${n - 1} other ${n === 2 ? 'person' : 'people'}.`);
    else if (n >= 2) out.push(T.kind === 'cause' ? `${T.originName} and ${n - 1} others are pushing ${T.text}. You ${fscore(me, person(T.origin) || me) <= -2 ? "think it's a stupid idea, mostly because of who started it" : T.dropped[me.id] ? 'lost interest in it' : "haven't signed on yet"}.` : `A lot of people are ${FAD_WORD[T.kind]} ${T.text} lately. ${T.dropped[me.id] ? "You're over it." : personaOf(me).edge > 0.45 ? 'You find it a bit much.' : "You haven't joined in yet."}`);
  }
  return out.length ? `\nTHE TOWN'S SOCIAL SCENE: ${out.join(' ')}` : '';
}
function socialBoardHtml() {
  const S = W.social; if (!S) return '';
  const cl = S.cliques || [], tr = (S.trends || []).filter((t) => !t.over), fr = liveFreezes();
  if (!cl.length && !tr.length && !fr.length) return '';
  return `<p class="label">👥 Crowds, fads and freeze-outs</p>
    ${cl.map((c) => `<p class="note" style="margin:2px 0">👥 <b>${esc(c.name)}</b>: ${c.members.map((id) => (id === c.leader ? `<b>${esc(nameOf(id))}</b>` : esc(nameOf(id)))).join(', ')} <span class="hint">since day ${c.since}</span></p>`).join('')}
    ${tr.map((t) => `<p class="note" style="margin:2px 0">${t.kind === 'cause' ? '📣' : t.kind === 'phrase' ? '💬' : '✨'} ${esc(cap(t.kind === 'phrase' ? `saying ${t.text}` : t.text))}: ${Object.keys(t.adopters).length} ${t.kind === 'cause' ? 'backing it' : 'in'} <span class="hint">(${esc(t.originName)} started it, day ${t.day})</span></p>`).join('')}
    ${fr.map((f) => `<p class="note" style="margin:2px 0">🧊 ${esc(f.cliqueName)} is freezing out <b>${esc(f.targetName)}</b> <span class="hint">since day ${f.day}${f.breakers.length ? `, ${f.breakers.map((id) => esc(nameOf(id))).join(' and ')} broke ranks` : ''}</span></p>`).join('')}`;
}
function socialBoot() {
  W.added = W.added || {}; if (W.added.social1) return; W.added.social1 = true;
  socialState();
  if (MODE === 'host') formCliques();
  if (typeof logUpdate === 'function') logUpdate('build', 'The town has a social life now, beyond one-on-one chats. Close friends form crowds, and the best-liked person in each one sets the tone. Fads catch on and die out: catchphrases, hobbies, and causes people rally behind, spreading friend to friend until the contrarians get bored of them. A crowd can freeze someone out. Not everyone goes along, anyone can break ranks, and the one left out tries to win them back, pulls away, or lashes out. Mili, Red, Tim and invited residents can join all of it but never get frozen out. It\'s all on the Board tab, and residents know where they stand when they talk.', 'crowds and fads');
}
