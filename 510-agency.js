// ============================================================
// AGENCY: residents pick their own goals and go after them
// ============================================================
const GOALS = {
  party: { icon: '🎉', verb: 'throw a party' },
  club: { icon: '🧩', verb: 'start a club' },
  book: { icon: '✍️', verb: 'write a book' },
  friend: { icon: '🤝', verb: 'make a new friend' },
  confront: { icon: '😤', verb: 'confront someone' },
  apologize: { icon: '🕊', verb: 'make things right with someone' },
  job: { icon: '💼', verb: 'land an office job' },
  learn: { icon: '📚', verb: 'learn about something new' },
  ask: { icon: '🙏', verb: 'ask the Creator for something' },
  suggest: { icon: '✳', verb: "leave a note in Claude's suggestion box" },
};
function goalCandidates(p) {
  const out = [], others = W.people.filter((q) => q !== p && q.grow >= 1 && !q.visitor);
  const fs = others.map((q) => [q, fscore(p, q), fscore(q, p)]);
  const friends = fs.filter((x) => x[1] >= 2).map((x) => x[0]);
  const maybe = fs.filter((x) => x[1] >= 0.5 && x[1] < 3 && x[2] > -1).map((x) => x[0]);
  const rival = fs.filter((x) => x[1] <= -5).sort((a, b) => a[1] - b[1])[0];
  const regret = fs.find((x) => x[1] >= 1 && x[2] <= -3);
  const push = (type, w, extra = {}) => { if (w > 0) out.push([{ type, ...extra }, w]); };
  if (friends.length >= 3 && p.coins >= 6) push('party', 1.2 + (p.joy || 0) / 80);
  if (friends.length >= 2 && !(W.clubs || []).some((c) => c.founder === p.id)) push('club', 0.9);
  if ((p.read || []).length >= 2 || /writ|story|stories|book|novel|poem/i.test(`${p.interests || ''} ${p.selfNote || ''}`)) push('book', 0.45 + Math.min(4, (p.read || []).length) * 0.08);
  if (maybe.length) push('friend', friends.length < 2 ? 1.6 : 0.6, { target: pick(maybe).id });
  if (rival) push('confront', 0.9 + (-rival[1] - 5) * 0.2, { target: rival[0].id });
  if (regret) push('apologize', 1.2, { target: regret[0].id });
  if (collarOf(p) !== 'white' && p.job && !p.custom && !p.style && !p.lovesMili) { const opts = Object.entries(JOBS).filter(([k, J]) => J.collar === 'white' && W.people.filter((q) => q.job === k).length < 2 && p.body.jobAff[k] > -0.3).sort((a, b) => p.body.jobAff[b[0]] - p.body.jobAff[a[0]]); if (opts.length) push('job', 0.8, { job: opts[0][0] }); }
  push('learn', 0.6, { subject: favSubject(p) });
  if (p.cr.score >= 1 && !p.cr.wish) push('ask', 0.5 + p.cr.score * 0.1);
  push('suggest', 0.5);
  return out;
}
function goalTitle(p, g) {
  const t = g.target && person(g.target), J = g.job && JOBS[g.job], S = g.subject && SUBJECTS[g.subject];
  switch (g.type) {
    case 'party': return pick(['throw a party in the park', 'throw the best party this island has ever seen', 'get everyone together for a party']);
    case 'club': return `start a ${g.clubName || 'club'}`;
    case 'book': return `write a book about ${g.topic || 'my life'}`;
    case 'friend': return `become friends with ${t?.name || 'someone new'}`;
    case 'confront': return `tell ${t?.name || 'them'} exactly what I think of them`;
    case 'apologize': return `make things right with ${t?.name || 'someone'}`;
    case 'job': return `become a ${J?.short || 'office worker'}`;
    case 'learn': return `learn everything about ${S?.name.toLowerCase() || 'something new'}`;
    case 'ask': return `ask the Creator for ${g.what || 'something'}`;
    case 'suggest': return 'ask Claude to add something to the island';
  }
  return GOALS[g.type]?.verb || 'figure out what I want';
}
function clubFor(p) {
  const fav = favSubject(p), I = `${p.interests || ''}`;
  if (/game|League/i.test(I)) return { name: 'Game Club', topic: 'video games, strategies and whose turn it is' };
  if (hasLaptop(p) && W.outsideFound && rand() < 0.5) return { name: 'Outside Watchers', topic: 'whatever is happening in the Outside this week' };
  if ((p.read || []).length >= 2 && rand() < 0.5) return { name: 'Book Club', topic: 'the books they have been reading' };
  if (/cat|animal/i.test(I + (p.selfNote || ''))) return { name: 'Cat Appreciation Society', topic: 'cats, and which cat on the island is the best cat' };
  return { name: `${SUBJECTS[fav]?.name || 'Hobby'} Club`, topic: SUBJECTS[fav]?.name.toLowerCase() || 'their favorite things' };
}
function pickGoal(p) {
  const C = goalCandidates(p); if (!C.length) return;
  let t = rand() * C.reduce((s, x) => s + x[1], 0), g = C[0][0];
  for (const [c, w] of C) { if ((t -= w) <= 0) { g = c; break; } }
  g = { ...g, since: W.day, step: 0, progress: 0 };
  if (g.type === 'club') Object.assign(g, (({ name, topic }) => ({ clubName: name, clubTopic: topic }))(clubFor(p)));
  if (g.type === 'book') g.topic = (String(p.interests || '').split(/,|\band\b/)[0] || SUBJECTS[favSubject(p)]?.name || 'my life').trim().toLowerCase().slice(0, 50);
  if (g.type === 'learn') g.base = readCount(p, [g.subject]);
  if (g.type === 'ask') { const dec = Object.entries(p.body.decorAff || {}).filter(([k]) => DECOR[k] && !DECOR[k].recipe && k !== 'laptop').sort((a, b) => b[1] - a[1])[0]; g.item = dec ? dec[0] : 'plant'; g.color = topColors(p)[0] || 'lilac'; g.what = a_an(`${g.color} ${DECOR[g.item].name}`); }
  g.title = goalTitle(p, g);
  p.goal = g;
  remember(p, `I decided something: I'm going to ${g.title}.`, 2, 'goal');
  if (aiReady() && aiBusy < 2 && rand() < 0.5) {
    llm(`You are ${p.name}, a villager in ${ISL.name}. In your own words: ${p.selfNote}\nYou just decided on a new personal goal: to ${g.title}. Say it the way you would, as one short sentence starting with "to" (under 14 words), keeping the same meaning.\nReply with only JSON: {"goal": "to ..."}`, { model: modelOf(p), max: 80, fallbackKey: 'goal' })
      .then((r) => { const s = String(r?.goal || '').replace(/^to\s+/i, '').replace(/[."]+$/, '').trim(); if (s.length > 6 && s.length < 90 && p.goal === g) g.title = s; }).catch(() => {});
  }
}
function goalDone(p, text, big = true) {
  const g = p.goal; if (!g) return;
  remember(p, text || `I did it: I managed to ${g.title}.`, 3, 'goalDone');
  addJoy(p, 25);
  if (big) diary(`${GOALS[g.type]?.icon || '🎯'} <b>${esc(p.name)}</b> did what they set out to do: <i>${esc(g.title)}</i>.`);
  W.goalsDone = W.goalsDone || []; W.goalsDone.push({ name: p.name, title: g.title, type: g.type, day: W.day }); if (W.goalsDone.length > 20) W.goalsDone.shift();
  p.goal = null; p.goalRest = W.day;
}
function goalGiveUp(p, why) { const g = p.goal; if (!g) return; remember(p, `I gave up trying to ${g.title}. ${why || 'Maybe another time.'}`, 2, 'goalLost'); p.goal = null; p.goalRest = W.day; }
function goalNight() {
  let aiLeft = 1;
  for (const p of W.people) {
    if (p.grow < 1 || p.visitor || p.away) continue;
    const g = p.goal;
    if (g && W.day - g.since > 9) { goalGiveUp(p, 'It was taking too long.'); continue; }
    if (!g && W.day - (p.goalRest ?? -9) >= 1 && rand() < 0.35) pickGoal(p);
  }
}
function goalMorning() {
  for (const p of W.people) {
    const g = p.goal; if (!g) continue;
    const t = g.target && person(g.target);
    if (g.target && !t) { goalGiveUp(p, 'They are gone.'); continue; }
    if (g.type === 'friend' && t && fscore(t, p) >= 3 && fscore(p, t) >= 3) { goalDone(p, `${t.name} and I are friends now. I made that happen.`); feel(p, t, 0.5, true); continue; }
    if (g.type === 'job' && JOBS[g.job]) {
      if (qualifies(p, g.job) && W.people.filter((q) => q.job === g.job).length < 3) { const old = p.job; p.job = g.job; p.jobDays = 0; p.jobMood = 0; dressMesh(p); diary(`💼 <b>${esc(p.name)}</b> studied for it and got hired as a <b>${JOBS[g.job].short}</b>${old ? `, leaving their job as a ${JOBS[old].short}` : ''}.`); goalDone(p, `I worked for it and got hired as a ${JOBS[g.job].short}.`, false); continue; }
      const need = Object.keys(BOOKS).filter((k) => (JOBS[g.job].needs || []).includes(BOOKS[k].subj) && !(p.read || []).some((r) => r.id === k) && !(p.toRead || []).includes(k));
      if ((p.toRead || []).length < 2 && need.length) p.toRead = [...(p.toRead || []), pick(need)];
    }
    if (g.type === 'learn') {
      if (readCount(p, [g.subject]) - (g.base || 0) >= 2) { goalDone(p, `I read two books about ${SUBJECTS[g.subject]?.name.toLowerCase()}. I actually know things now.`, false); continue; }
      const need = Object.keys(BOOKS).filter((k) => BOOKS[k].subj === g.subject && !(p.read || []).some((r) => r.id === k) && !(p.toRead || []).includes(k));
      if ((p.toRead || []).length < 2 && need.length) p.toRead = [...(p.toRead || []), pick(need)];
    }
    if (g.type === 'party' && g.step === 1 && g.day < W.day) { const n = g.guests || 0; goalDone(p, `I threw a party and ${plural(n, 'person')} came!`); }
    if (g.type === 'ask' && g.step === 1) { if (!p.cr.wish || p.cr.wish.id !== g.item) { const got = (p.decor || []).some((d) => d.id === g.item); if (got) goalDone(p, `I asked the Creator for ${g.what}, and they listened.`); else goalGiveUp(p, 'The Creator never answered.'); } }
  }
}
// what they do about it during the day
function goalPlan(p) {
  const g = p.goal; if (!g || p.grow < 1 || p.visitor) return false;
  const t = W.t, target = g.target && person(g.target);
  if (g.type === 'friend' && target) { p.befriend = target.id; return false; }
  if (g.type === 'apologize' && target) { p.makeup = target.id; return false; }
  if (g.type === 'confront' && target) {
    const D = typeof drama === 'function' ? drama() : null;
    if (D && !sceneBusy && D.heat >= 4 && W.day - D.last >= 2 && t > 0.2 && t < 0.5 && !target.inside && rand() < 0.4) { if (startUproar({ kind: 'grudge', a: p.id, b: target.id, w: 3, why: `${p.name} finally confronted ${target.name}` })) { goalDone(p, `I confronted ${target.name} in front of everyone. It turned into a whole thing.`, false); return true; } }
    p.confront = target.id; return false;
  }
  if (rand() > 0.3) return false;
  switch (g.type) {
    case 'party': {
      if (g.step !== 0 || t > 0.3 || W.meeting) return false;
      if (W.event && W.event.day === W.day) return false;
      const guests = W.people.filter((q) => q !== p && q.grow >= 0.6 && !q.away && fscore(q, p) >= 1).sort((a, b) => fscore(b, p) - fscore(a, p)).slice(0, 6);
      if (guests.length < 2) return false;
      W.event = { id: 'party', day: W.day, host: p.id, going: [p.id, ...guests.map((q) => q.id)], title: `${p.name}'s party` };
      g.step = 1; g.day = W.day; g.guests = guests.length;
      for (const q of guests.slice(0, 4)) if (typeof postText === 'function') postText(p, q.id, pick(['party at the park at 4!! come!!!', 'im throwing a party today. park. 4pm. be there', 'u coming to my party?? park at 4']), 'nice');
      diary(`🎉 <b>${esc(p.name)}</b> is throwing a party in the park at 4:00 pm! Invited: ${guests.map((q) => esc(q.name)).join(', ')}.`);
      bubble(p, "I'm throwing a party! Park, four o'clock!", 3);
      if (typeof postChirp === 'function') postChirp(p, 'PARTY. park. 4pm. everyone is invited (except people who are mean)');
      return false;
    }
    case 'club': {
      const mem = W.people.filter((q) => q !== p && q.grow >= 0.8 && fscore(q, p) >= 1.5 && !q.away).sort((a, b) => fscore(b, p) - fscore(a, p)).slice(0, 4);
      if (mem.length < 2) return false;
      W.clubs = W.clubs || [];
      const c = { id: uid(), name: g.clubName || 'Club', topic: g.clubTopic || 'anything', founder: p.id, members: [p.id, ...mem.map((q) => q.id)], last: W.day, founded: W.day };
      W.clubs.push(c); if (W.clubs.length > 6) W.clubs.shift();
      for (const q of mem) { remember(q, `${p.name} invited me to the ${c.name}. I said yes.`, 2, 'club', p.name); feel(q, p, 0.4, true); }
      diary(`🧩 <b>${esc(p.name)}</b> started the <b>${esc(c.name)}</b> with ${mem.map((q) => esc(q.name)).join(', ')}. They'll meet every couple of days.`);
      if (typeof postChirp === 'function') postChirp(p, `the ${c.name.toLowerCase()} is officially a thing. first meeting soon`);
      goalDone(p, `I started the ${c.name}!`, false);
      return false;
    }
    case 'book': {
      if (t > 0.55) return false;
      const seat = rand() < 0.5 ? ['cafe', CAFE_SEATS[Math.floor(rand() * CAFE_SEATS.length)]] : ['park', jitter(TOWN.park.spot, 4)];
      setTask(p, 'write', seat[0], seat[1]); return true;
    }
    case 'ask': {
      if (g.step !== 0) return false;
      if (!p.cr.wish) p.cr.wish = { kind: 'decor', id: g.item, color: g.color, day: W.day };
      g.step = 1;
      queueLetter(p, 'ask', { what: g.what });
      if (typeof notifyCreator === 'function') notifyCreator('ask', p, `${p.name} is asking you for ${g.what}.`, `could you maybe give me ${g.what}? it would mean a lot`);
      remember(p, `I asked the Creator for ${g.what}.`, 2, 'wishMade');
      return false;
    }
    case 'suggest': { dropSuggestion(p); goalDone(p, "I left a note in Claude's suggestion box.", false); return false; }
  }
  return false;
}
function goalAfterEncounter(a, b, intent) {
  const g = a.goal; if (!g || g.target !== b.id) return;
  if (g.type === 'confront' && intent === 'confront') goalDone(a, `I finally told ${b.name} what I think of them. To their face.`);
  if (g.type === 'apologize' && intent === 'makeup') goalDone(a, `I apologized to ${b.name}. It felt right.`, false);
}
function confrontOpening(a, b) {
  if (a.confront !== b.id) return null;
  a.confront = null;
  remember(a, `I confronted ${b.name}.`, 3, 'fight', b.name); remember(b, `${a.name} came up and confronted me.`, 3, 'fight', a.name);
  feel(b, a, -0.8, true);
  return { say: pick(["We need to talk. Now.", `I'm done pretending, ${b.name}. You know what you did.`, "Say it to my face. Go on."]), action: 'chat', feeling: -2, reply: { say: pick(['Excuse me?!', "Wow. Okay. You want to do this here?", "I don't owe you anything."]), action: 'chat', feeling: -2 } };
}
function writeStart(p) { p.busyUntil = now + 7 * ts(); p.face = rand() * 6.28; emote(p, '✍️', 3); if (rand() < 0.5) bubble(p, pick(['Shh. I\'m writing.', 'Chapter three is giving me trouble.', 'Ooh, plot twist.', 'Nobody look at my notebook.']), 2.4); }
async function writeDone(p) {
  const g = p.goal; if (!g || g.type !== 'book') return;
  g.progress = (g.progress || 0) + 1;
  remember(p, `Worked on my book about ${g.topic}.`, 1, 'writing');
  if (g.progress < 3) { bubble(p, pick(['Another chapter done!', 'Okay. That part is good.', 'Writing is HARD.']), 2.2); return; }
  const subj = Object.keys(SUBJECTS).find((k) => SUBJECTS[k].kw.test(g.topic)) || (/(story|life|love)/i.test(g.topic) ? 'stories' : favSubject(p));
  let title = null, lines = null;
  if (aiReady() && aiBusy < 2) {
    try { const r = await llm(`You are ${p.name}, a villager in ${ISL.name}. In your own words: ${p.selfNote}\nYou just finished writing a small book about ${g.topic}. Give it a title and 4 short lines describing what is in it (story beats if it's a story, key ideas if it's nonfiction), in plain words.\nReply with only JSON: {"title": "...", "lines": ["...", "...", "...", "..."]}`, { model: modelOf(p), max: 260 }); if (r?.title) title = String(r.title).slice(0, 60); if (Array.isArray(r?.lines)) lines = r.lines.slice(0, 5).map((x) => String(x).slice(0, 140)); } catch (e) {}
  }
  const TT = g.topic.replace(/\b\w/g, (c) => c.toUpperCase());
  title = title || pick([`${TT}: A Small Book`, `All About ${TT}`, `Notes on ${TT}`, `My Life and ${TT}`]);
  lines = lines && lines.length >= 2 ? lines : [`${p.name} wrote this book about ${g.topic}.`, `It is full of things ${p.name} learned the hard way.`, `The last chapter is about the island.`, 'It ends with a thank-you to everyone who listened.'];
  const id = 'w_' + uid();
  W.mods = W.mods || { books: {}, foods: [], decor: {}, builds: {}, events: {}, debates: [] };
  W.mods.books[id] = { subj: SUBJECTS[subj] ? subj : 'stories', title, by: p.name, price: 6, facts: lines, fiction: subj === 'stories', mod: true, written: true };
  BOOKS[id] = W.mods.books[id];
  if (W.stock.books) W.stock.books.push(newItem('book', id, null, null, 1));
  const fans = W.people.filter((q) => q !== p && fscore(q, p) >= 2).slice(0, 3);
  for (const q of fans) q.toRead = [...(q.toRead || []), id].slice(0, 4);
  diary(`✍️ <b>${esc(p.name)}</b> finished writing a book: <i>${esc(title)}</i>. It's on the shelf at Paper Moon Books.`);
  if (typeof postChirp === 'function') postChirp(p, `i wrote a book. it's called "${title}". it's at the bookstore. be nice`);
  queueLetter(p, 'book', { title });
  goalDone(p, `I wrote a whole book: "${title}".`, false);
  bubble(p, 'I FINISHED MY BOOK!', 3); emote(p, '✨', 3);
}
function clubTick() {
  if (MODE !== 'host' || sceneBusy || W.meeting || W.t < 0.36 || W.t > 0.5) return;
  for (const c of W.clubs || []) {
    if (W.day - c.last < 2) continue;
    const mem = c.members.map((id) => person(id)).filter((q) => q && sceneFree(q));
    if (mem.length < 2) continue;
    c.last = W.day;
    runScene({ id: uid(), kind: 'huddle', issue: { kind: 'club', label: c.name, about: `their ${c.name} meeting, talking about ${c.topic}` }, center: sceneCenter(mem[0]), members: mem.slice(0, 5).map((q) => ({ id: q.id, name: q.name, side: 'mid' })), lines: [], day: W.day, started: W.t, creator: null, live: false, principals: [c.founder] });
    diary(`🧩 The <b>${esc(c.name)}</b> is meeting by the fountain.`);
    return;
  }
}
function goalContext(me) {
  const g = me.goal; if (!g) return '';
  return `\nYOUR OWN GOAL RIGHT NOW (you chose it yourself): to ${g.title}. It's on your mind. Bring it up when it fits, ask people for help, or make plans out loud.`;
}
function goalHtml(p) {
  const g = p.goal;
  const done = (W.goalsDone || []).filter((x) => x.name === p.name).slice(-2);
  return `${g ? `<p class="hint">${GOALS[g.type]?.icon || '🎯'} <b>Working toward:</b> ${esc(g.title)} <span class="chip">since day ${g.since}</span>${g.type === 'book' ? ` · ${g.progress || 0}/3 chapters` : ''}</p>` : ''}${done.length ? `<p class="hint">🏅 Did it: ${done.map((x) => esc(x.title)).join(' · ')}</p>` : ''}`;
}
function goalsBoardHtml() {
  const G = W.people.filter((p) => p.goal), clubs = W.clubs || [];
  return `<p class="label">🎯 What people are working toward</p>${G.length ? G.map((p) => `<p class="note" style="margin:2px 0">${GOALS[p.goal.type]?.icon || '🎯'} <b>${esc(p.name)}</b> wants to ${esc(p.goal.title)}.</p>`).join('') : '<p class="hint">Nobody has a big plan right now. They come up with their own at night.</p>'}
    ${clubs.length ? `<p class="hint">🧩 Clubs: ${clubs.map((c) => `${esc(c.name)} (${c.members.map((id) => esc(person(id)?.name || '?')).join(', ')})`).join('; ')}</p>` : ''}`;
}

// Claude's suggestion box
const SUGGEST_BUILDS = ['bench', 'lamp', 'flowers', 'tree', 'picnic', 'birdbath', 'planter', 'swings', 'gazebo', 'pond', 'arch', 'lights', 'fountain2', 'windmill', 'campfire', 'umbrella'];
function dropSuggestion(p) {
  W.suggestions = W.suggestions || [];
  if (W.suggestions.filter((s) => !s.done).length >= 6) return;
  const where = pick(['plaza', 'park', 'garden', 'beach', 'pier']);
  const r = rand(); let s;
  if (r < 0.55) { const type = pick(SUGGEST_BUILDS.filter((k) => BUILDS[k])); s = { kind: 'build', type, where, text: pick([`Could we get ${a_an(BUILDS[type].name)} near the ${where}? Please and thank you.`, `Dear Claude, the ${where} needs ${a_an(BUILDS[type].name)}. Trust me.`, `${cap(a_an(BUILDS[type].name))} by the ${where} would make everyone happier. Especially me.`]) }; }
  else if (r < 0.85) { const dec = Object.entries(p.body.decorAff || {}).filter(([k]) => DECOR[k] && k !== 'laptop').sort((a, b) => b[1] - a[1])[0]?.[0] || 'plant'; s = { kind: 'decor', item: dec, text: pick([`My room could really use ${a_an(DECOR[dec].name)}. Just saying.`, `Is it greedy to ask for ${a_an(DECOR[dec].name)}? For my room?`]) }; }
  else { const shop = pick(['books', 'nook', 'clothes']); s = { kind: 'stock', shop, text: `Can you put something new in ${SHOPS[shop].name}? Everything there is the same.` }; }
  W.suggestions.push({ id: uid(), by: p.id, name: p.name, day: W.day, done: false, ...s });
  if (W.suggestions.length > 20) W.suggestions.shift();
  remember(p, `I left a note in Claude's suggestion box: "${s.text}"`, 2, 'suggested');
  diary(`✳ <b>${esc(p.name)}</b> left a note in Claude's suggestion box: "${esc(s.text)}"`);
}
function fulfillSuggestion() {
  const s = (W.suggestions || []).find((x) => !x.done); if (!s) return false;
  const p = person(s.by); s.done = true; s.doneDay = W.day;
  let what = '';
  if (s.kind === 'build' && BUILDS[s.type]) {
    const base = s.where === 'beach' ? BEACH : s.where === 'pier' ? [2.5, 26] : TOWN[s.where]?.spot || [0, 8];
    let placed = false;
    for (let i = 0; i < 40 && !placed; i++) { const x = base[0] + (rand() - 0.5) * 9, z = base[1] + (rand() - 0.5) * 9; if (!spotProblem(x, z, BUILDS[s.type].size || 1.4)) { W.placed.push({ id: uid(), type: s.type, x, z, rot: rand() * 6.28, day: W.day, by: 'Claude' }); buildPlaced(); placed = true; } }
    what = placed ? `built ${a_an(BUILDS[s.type].name)} by the ${s.where}` : '';
  } else if (s.kind === 'decor' && p && DECOR[s.item]) { receive(p, newItem('decor', s.item, topColors(p)[0] || 'lilac', null, 2)); addJoy(p, 12); what = `left ${a_an(DECOR[s.item].name)} outside room ${p.room + 1}`; }
  else if (s.kind === 'stock') { claudeRestock(); what = `restocked ${SHOPS[s.shop]?.name || 'a shop'}`; }
  if (!what) { s.done = false; return false; }
  s.result = what;
  logUpdate('suggestion', `Read ${s.name}'s note in the suggestion box and ${what}.`, `${s.name}'s idea`);
  if (p) { remember(p, `Claude read my note in the suggestion box and actually ${what.replace(/^built/, 'built').replace(/^left/, 'left')}!`, 3, 'claudeUpdate'); creatorShift(p, 0.1); addJoy(p, 15); if (typeof postChirp === 'function') postChirp(p, pick(['claude actually read my suggestion?? 😭', 'ok the suggestion box WORKS', 'thank u claude. whoever u are'])); }
  return true;
}
function suggestionsHtml() {
  const S = (W.suggestions || []).slice(-6).reverse();
  return `<p class="label">✳ Claude's suggestion box</p><p class="hint">Residents leave notes here. Claude reads them while you're away and builds what it can.</p>${S.length ? S.map((s) => `<p class="note" style="margin:2px 0">${s.done ? '✅' : '📝'} <b>${esc(s.name)}</b>: "${esc(s.text)}"${s.done && s.result ? ` <span class="hint">(Claude ${esc(s.result)})</span>` : ''}</p>`).join('') : '<p class="hint">Empty for now.</p>'}`;
}
function pendingSuggestionText() { const s = (W.suggestions || []).find((x) => !x.done); return s ? `${s.name} left this note in the suggestion box: "${s.text}"` : null; }

