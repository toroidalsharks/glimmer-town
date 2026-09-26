// ============================================================
// CULTURES & VISITORS
// ============================================================
const CULTURES = {
  isle1: { short: 'everyone earns their own coins and pays for what they want', long: 'In Glimmer Town, everyone earns their own coins at work and pays for what they want at the shops. Saving up is smart, and asking for free things is a little embarrassing.' },
  isle2: { short: 'nobody keeps their own money; everything goes into a shared pantry that anyone can take from', long: 'In Driftwood Bay, nobody keeps their own money. Everything anyone earns goes into a shared pantry, and anyone can take what they need. Hoarding is shameful, and people are respected for how much they give.' },
};
const CULT = CULTURES[ISLE];
const sharing = () => ISLE === 'isle2';
function purse(p) { return sharing() && !p.visitor ? Math.max(W.pantry || 0, p.coins) : p.coins; }
function spend(p, n) { if (sharing() && !p.visitor && (W.pantry || 0) >= n) W.pantry -= n; else p.coins = Math.max(0, p.coins - n); }
function earn(p, n) { if (sharing() && !p.visitor) { W.pantry = (W.pantry || 0) + n; p.gave = (p.gave || 0) + n; } else p.coins += n; }
function homeOf(p) { return p.visitor ? p.visitor.home : ISLE; }
function cultureContext(me, them) {
  const lines = [];
  if (me.visitor) lines.push(`YOU ARE VISITING ${ISL.name} for the day, from ${ISLES[me.visitor.home].name}. Back home: ${CULTURES[me.visitor.home].long} Here: ${CULT.long} How you feel about the difference depends on who you are: refreshing, confusing, or offensive.`);
  else lines.push(`WHERE YOU LIVE: ${CULT.long}`);
  if (them && them.visitor && !me.visitor) lines.push(`${them.name} is a visitor from ${ISLES[them.visitor.home].name}, where ${CULTURES[them.visitor.home].short}. You might find their ways admirable, strange, or annoying, depending on who you are.`);
  return lines.join('\n');
}
function cultureLine(me, them) {
  if (me.visitor) return homeOf(me) === 'isle2' ? pick(['Wait, you pay for food here? Back home we just share everything.', 'Why does everyone keep their coins to themselves?', 'Where is your pantry? Nobody here will tell me.']) : pick(['So who pays for all this?', 'You just take food? Nobody checks?', 'Back home, if you want something, you work for it.']);
  return homeOf(them) === 'isle2' ? pick([`You're from Driftwood Bay, right? Is it true nobody has money there?`, 'Do you really just share everything back home?']) : pick(["You're from Glimmer Town? Why does everyone there count coins so much?", 'Is it true you have to pay for food where you live?']);
}
function cultureReply(me, them) {
  const o = me.body.openness ?? 0;
  if (o > 0.25) return { say: pick(["Huh. I kind of like that.", "That sounds nice, honestly.", "Maybe we could try that here."]), feeling: 1 };
  if (o < -0.25) return { say: pick(["Ugh. That's just weird.", 'Sounds like freeloading to me.', "That would never work here."]), feeling: -1 };
  return { say: pick(['Different islands, different ways, I guess.', 'Huh. Never thought about it.']), feeling: 0 };
}
function stripPerson(p) {
  const c = JSON.parse(JSON.stringify(p, (k, v) => (['bubble', 'emote', 'happyUntil', 'lastD', 'stuckT'].includes(k) ? undefined : v === Infinity ? 1e12 : v)));
  return Object.assign(c, { task: null, path: [], inside: false, state: 'free', heldByDlg: false, makeup: null, befriend: null });
}
function sendVisit(p) {
  const copy = stripPerson(p);
  RT.db.collection('ferry').doc().set({ kind: 'visit', to: OTHER, from: ISLE, day: W.day, homeId: p.id, person: copy }).catch(() => {});
  p.away = { to: OTHER, since: W.day };
  p.inside = true; p.task = { kind: 'away', phase: 'do' }; p.path = []; p.busyUntil = Infinity;
  diary(`<b>${esc(p.name)}</b> took the morning ferry to visit ${ISLES[OTHER].name} for the day.`);
  for (const q of W.people) if (q !== p && (q.feelings[p.id]?.score || 0) >= 3) remember(q, `${p.name} went to visit ${ISLES[OTHER].name} for the day.`, 1, 'awayNote', p.name);
  ferryAnim = { kind: 'depart', start: now }; Sound.horn();
}
function arriveVisitor(d) {
  const q = d.person; if (!q) return true;
  q.visitor = { home: d.from, homeId: d.homeId, leaveDay: W.day + 1 };
  q.id = 'v' + (W.nextId++);
  while (W.people.some((x) => x.name === q.name)) q.name += 'a';
  Object.assign(q, { room: -1, feelings: {}, at: 'pier', x: (rand() - 0.5) * 1.5, z: 39.5, inside: false, task: null, path: [], state: 'free', today: [], busyUntil: 0, workedToday: true });
  q.body.openness = q.body.openness ?? rand() * 2 - 1;
  remember(q, `I'm visiting ${ISL.name} for the day. Here, ${CULT.short}. Back home, ${CULTURES[d.from].short}.`, 3, 'visiting');
  W.people.push(q); buildKin(q);
  diary(`<b>${esc(q.name)}</b> is visiting from ${ISLES[d.from].name} for the day.`);
  for (const r of W.people) if (r !== q && !r.visitor && rand() < 0.5) remember(r, `A visitor named ${q.name} came over from ${ISLES[d.from].name}.`, 1, 'newcomer', q.name);
  ferryAnim = { kind: 'arrive', start: now }; Sound.horn();
  return true;
}
function sendVisitorsHome() {
  for (const q of [...W.people]) {
    if (!q.visitor || q.visitor.leaveDay > W.day) continue;
    const memories = [...q.past.filter((m) => m.day >= W.day - 2), ...q.today].map((m) => m.text).slice(-10);
    const notes = Object.values(q.feelings).map((f) => `${f.name}: ${f.note} (${Math.round(f.score)})`);
    RT.db.collection('ferry').doc().set({ kind: 'return', to: q.visitor.home, from: ISLE, day: W.day, homeId: q.visitor.homeId, name: q.name, memories, notes, selfNote: q.selfNote }).catch(() => {});
    W.people.splice(W.people.indexOf(q), 1);
    const m = meshes.get(q.id); if (m) { scene.remove(m.root); m.tag.remove(); meshes.delete(q.id); }
    diary(`<b>${esc(q.name)}</b> took the ferry home to ${ISLES[q.visitor.home].name}.`);
    ferryAnim = { kind: 'depart', start: now }; Sound.horn();
  }
}
function returnHome(d) {
  const p = person(d.homeId); if (!p) return true;
  p.away = null; p.inside = false; p.task = null; p.busyUntil = 0; p.at = 'pier'; p.x = (rand() - 0.5) * 1.5; p.z = 39.5;
  for (const t of d.memories || []) remember(p, `On my trip to ${ISLES[d.from].name}: ${t}`.slice(0, 400), 2, 'trip');
  if (d.notes?.length) remember(p, `People I met on ${ISLES[d.from].name}: ${d.notes.join('; ')}`.slice(0, 400), 2, 'trip');
  if (d.selfNote) p.selfNote = d.selfNote;
  diary(`<b>${esc(p.name)}</b> came home from ${ISLES[d.from].name}.`);
  queueLetter(p, 'trip', { to: ISLES[d.from].name, culture: CULTURES[d.from].short });
  ferryAnim = { kind: 'arrive', start: now }; Sound.horn();
  markDirty();
  return true;
}
function morningFerry() {
  if (!RT.db || !otherExists) return;
  sendVisitorsHome();
  for (const p of W.people) if (p.away && W.day - p.away.since >= 3) { p.away = null; p.inside = false; p.task = null; p.at = 'pier'; p.x = 0; p.z = 39.5; remember(p, 'The ferry back was late, but I made it home.', 2, 'trip'); }
  const home = W.people.filter((p) => !p.visitor && !p.away && p.grow >= 1);
  if (home.length >= 3 && rand() < 0.4) sendVisit(pick(home));
}

