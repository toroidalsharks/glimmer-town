// ============================================================
// GLIMMER HALL: the courthouse. Fights, disputes, divorces, licenses and debates.
// ============================================================
const CASE_KINDS = {
  fight: { label: 'Assault', icon: '💢' }, bully: { label: 'Harassment', icon: '📱' }, complaint: { label: 'Complaint', icon: '📝' }, dispute: { label: 'Dispute', icon: '💔' },
  divorce: { label: 'Divorce', icon: '💍' }, labor: { label: 'Labor dispute', icon: '✊' }, license: { label: 'Marriage license', icon: '💒' }, debate: { label: 'Debate', icon: '🗣' },
};
const DEBATES = ['Is a hot dog a sandwich?', 'Should the island have a curfew?', 'Is cereal a soup?', 'Cats or dogs?', 'Is Mili the Creator?', "Should we trust Claude's overnight changes?", 'Is it okay to eat the last croissant without asking?', 'Is pineapple allowed on pizza?', 'Should the Creator pick favorites?', 'Is the ferry worth the ticket?', 'Are pigeons friends or spies?', 'Should every day start with a town meeting?', 'Does the Creator owe us anything?', 'Is it rude to text instead of visiting?'];
const GRIEVANCES = ['plays music way too loud at night', 'cut in line at the bakery. Twice', 'borrowed my book and never gave it back', 'keeps spreading rumors about me', 'stole my fishing spot on the pier', 'stepped on my flowers in the garden', 'told everyone my secret', 'keeps taking the good bench by the fountain', 'laughed at me in front of everyone', 'owes me coins and pretends not to'];
const RULINGS = {
  fight: [['apologize', 'Guilty: go apologize'], ['fine', 'Guilty: pay them 5 coins'], ['service', 'Community service'], ['apart', 'Stay apart for 3 days'], ['talk', 'Talk it out'], ['innocent', 'Not guilty']],
  complaint: [['apologize', 'They owe an apology'], ['fine', 'Pay 3 coins'], ['talk', 'Talk it out'], ['dismiss', 'Dismiss it']],
  dispute: [['apart', 'Stay apart for 3 days'], ['talk', 'Talk it out'], ['dismiss', 'Dismiss it']],
  divorce: [['grant', 'Grant the divorce'], ['counsel', 'Order couples counseling']],
  license: [['fountain', 'Big wedding at the fountain'], ['now', 'Marry them here, right now'], ['wait', 'Ask them to wait']],
  debate: [['p', 'Side with #P'], ['d', 'Side with #D'], ['both', 'You both have a point'], ['vote', 'Let the town vote']],
};
RULINGS.bully = RULINGS.fight;
RULINGS.labor = [['raise', 'Fair pay for everyone'], ['labs', 'Side with Glimmer Labs'], ['talkall', 'Get everyone to the table']];
const openCases = () => (W.cases || []).filter((c) => c.status === 'open');
const caseTitle = (c) => c.kind === 'debate' ? `Debate: ${c.topic}` : c.kind === 'license' ? `${c.pName} & ${c.dName}: marriage license` : c.kind === 'divorce' ? `${c.pName} v. ${c.dName} (divorce)` : `${c.pName} v. ${c.dName}`;
function fileCase(kind, P, D, extra = {}) {
  if (!P || !D || P === D || MODE !== 'host') return null;
  W.cases = W.cases || [];
  if (openCases().some((c) => c.kind === kind && [c.p, c.d].sort().join() === [P.id, D.id].sort().join())) return null;
  if (openCases().length >= 7 && kind !== 'license' && kind !== 'divorce') return null;
  const c = { id: uid(), kind, p: P.id, d: D.id, pName: P.name, dName: D.name, filed: W.day, status: 'open', args: {}, ...extra };
  const K = CASE_KINDS[kind];
  c.summary = {
    fight: `${P.name} says ${D.name} started a fight with them.`,
    bully: `${P.name} says ${D.name} keeps sending them mean texts.`,
    complaint: `${P.name} says ${D.name} ${extra.grievance || pick(GRIEVANCES)}.`,
    dispute: `${P.name} wants ${D.name} to stay away from their partner.`,
    divorce: `${P.name} wants a divorce from ${D.name}.`,
    license: `${P.name} and ${D.name} want to get married.`,
    debate: `${P.name} and ${D.name} can't agree: ${extra.topic}`,
    labor: `${P.name} speaks for the workers on strike. They want fair pay from Glimmer Labs, where ${D.name} works.`,
  }[kind];
  c.args = defaultArgs(c, P, D);
  W.cases.push(c); if (W.cases.length > 60) W.cases.splice(0, W.cases.length - 60);
  remember(P, kind === 'debate' ? `${D.name} and I are taking our argument to Glimmer Hall: ${extra.topic}` : `I filed a case against ${D.name} at Glimmer Hall.`, 2, 'filedCase', D.name);
  if (kind !== 'debate' && kind !== 'license') remember(D, `${P.name} took me to court at Glimmer Hall.`, 2, 'suedBy', P.name);
  diary(`⚖ ${K.icon} New case at Glimmer Hall: <b>${esc(caseTitle(c))}</b>. ${esc(c.summary)}`);
  markDirty();
  return c;
}
function defaultArgs(c, P, D) {
  const A = {
    fight: [pick([`${D.name} shoved me. In front of everyone.`, `I didn't do anything and ${D.name} just went for me.`]), pick([`They had it coming.`, `${P.name} is exaggerating. It was barely a push.`, `I'm… not proud of it. But they started it with words.`])],
    bully: [pick([`I have the texts. Every single one.`, `It keeps happening. I just want it to stop.`]), pick(['They were jokes.', "Everyone talks like that. They're too sensitive.", 'Okay. Maybe I went too far.'])],
    complaint: [`${c.summary.replace(`${P.name} says `, 'Your honor, ')}`, pick(["That's not even true.", 'I can explain.', "Wow. Okay. Didn't know we were doing this."])],
    dispute: [`${D.name} keeps getting close to my partner. I want it to stop.`, pick(["We're just friends!", 'I can talk to whoever I want.'])],
    divorce: [pick(["It isn't working. It hasn't for a while.", "I don't feel the same anymore."]), pick(["Please. Give us a chance.", 'Fine. If that is what they want.', "I didn't see this coming."])],
    license: [pick(["We're ready. We've been ready.", 'Please say yes!']), pick(['What they said. Hehe.', "I've never been more sure."])],
    labor: ['We work just as hard. We just want fair pay.', pick(['The Labs pays what the work is worth.', "I didn't set the salaries. Don't look at me.", 'Read a book and apply, then.'])],
    debate: [pick(['Obviously yes. Think about it.', 'This is the most important question of our time.', 'I have three points. Okay, two.']), pick(['Absolutely not.', 'That is the worst take I have ever heard.', 'I respect it. I also think it is wrong.'])],
  }[c.kind] || ['…', '…'];
  return { p: A[0], d: A[1] };
}
async function hearSides(c) {
  if (!aiReady() || c.args.ai) return;
  c.args.ai = true;
  const P = person(c.p), D = person(c.d); if (!P || !D) return;
  const sit = (me, them, side) => `You are in court at Glimmer Hall, and the Creator is the judge. The case: ${c.summary}${c.topic ? ` The question: ${c.topic}` : ''} You are ${side}. In one or two sentences, make your case to the judge, in your own voice. You can be honest, defensive, petty, emotional, or funny.`;
  try {
    const a = await aiLine(P, D, [], sit(P, D, c.kind === 'debate' ? `arguing YES / your side` : 'the one who brought this case')); if (a?.say) c.args.p = a.say;
    const b = await aiLine(D, P, [{ who: P.name, say: c.args.p }], sit(D, P, c.kind === 'debate' ? `arguing the other side` : 'the one this case is against')); if (b?.say) c.args.d = b.say;
  } catch (e) {}
  markDirty(); if (activeTab === 'court') refreshPanel(true);
}
function juryVotes(c) {
  const P = person(c.p), D = person(c.d);
  const jurors = W.people.filter((q) => q !== P && q !== D && !q.away && !q.visitor);
  let yes = 0, no = 0;
  const strength = { fight: 1.2, bully: 1.5, complaint: 0.3, dispute: 0.2 }[c.kind] ?? 0;
  for (const q of jurors) { const lean = (P ? fscore(q, P) : 0) - (D ? fscore(q, D) : 0) + strength + (rand() - 0.5) * 3; if (lean > 0) yes++; else no++; }
  return { yes, no, jurors };
}
function applyRuling(c, choice, byJury) {
  const P = person(c.p), D = person(c.d);
  if (c.status !== 'open') return 'That case is closed.';
  const ok = RULINGS[c.kind]?.some(([k]) => k === choice) || choice === 'jury';
  if (!ok) return '';
  if (choice === 'jury') {
    if (c.kind === 'debate') choice = 'vote';
    else if (c.kind === 'labor') { const v = juryVotes(c); c.jury = `${v.yes}–${v.no}`; choice = v.yes > v.no ? 'raise' : 'labs'; }
    else if (c.kind === 'license') choice = 'fountain';
    else if (c.kind === 'divorce') choice = rand() < 0.6 ? 'grant' : 'counsel';
    else { const v = juryVotes(c); c.jury = `${v.yes}–${v.no}`; choice = v.yes > v.no ? (c.kind === 'fight' ? pick(['apologize', 'fine', 'service']) : c.kind === 'bully' ? 'apart' : c.kind === 'dispute' ? 'apart' : 'apologize') : c.kind === 'fight' || c.kind === 'bully' ? 'innocent' : 'dismiss'; }
    byJury = true;
  }
  c.status = 'closed'; c.ruled = W.day; c.choice = choice; c.byJury = !!byJury;
  const judge = byJury ? 'The jury' : 'The Creator';
  let text = '', win = null, lose = null;
  const title = caseTitle(c);
  if (!P || !D) { c.result = 'Dismissed. Someone moved away.'; return c.result; }
  switch (choice) {
    case 'raise': case 'labs': case 'talkall': text = applyLabor(c, choice); win = choice === 'raise' ? P : choice === 'labs' ? D : null; lose = choice === 'raise' ? D : choice === 'labs' ? P : null; break;
    case 'apologize': D.makeup = P.id; feel(P, D, 1, true); feel(D, P, -0.5, true); win = P; lose = D; text = `${D.name} has to apologize to ${P.name}.`; break;
    case 'fine': { const n = Math.min(c.kind === 'complaint' ? 3 : 5, D.coins); D.coins -= n; P.coins += n; win = P; lose = D; text = `${D.name} pays ${P.name} ${plural(n, 'coin')}.`; break; }
    case 'service': { const sp = autoSpot(); if (sp) setTask(D, 'service', Math.hypot(sp[0] - DT.x, sp[1] - DT.z) < DT.R ? 'downtown' : 'plaza', [sp[0] + 1.2, sp[1]], { x: sp[0], z: sp[1] }); win = P; lose = D; text = `${D.name} has to do community service: plant flowers for the town.`; break; }
    case 'apart': W.apart = W.apart || {}; W.apart[[P.id, D.id].sort().join('|')] = W.day + 3; win = P; lose = D; text = `${P.name} and ${D.name} have to stay apart for 3 days.`; break;
    case 'talk': D.makeup = P.id; P.befriend = D.id; feel(P, D, 0.8, true); feel(D, P, 0.8, true); text = `${P.name} and ${D.name} have to sit down and talk it out.`; break;
    case 'innocent': case 'dismiss': feel(P, D, -0.6, true); win = D; lose = P; text = choice === 'innocent' ? `${D.name} is not guilty.` : `The complaint is dismissed.`; break;
    case 'grant': P.partner = D.partner = null; P.married = D.married = false; P.separated = D.separated = false; P.exes = [...(P.exes || []), D.name].slice(-5); D.exes = [...(D.exes || []), P.name].slice(-5); D.heartbreakDay = W.day; text = `The divorce is granted. ${P.name} and ${D.name} are no longer married.`; for (const q of W.people) if (q !== P && q !== D && rand() < 0.6) remember(q, `I heard ${P.name} and ${D.name} got divorced.`, 1, 'gossipLove', P.name); break;
    case 'counsel': P.separated = D.separated = false; feel(P, D, 2.5, true); feel(D, P, 2.5, true); text = `${P.name} and ${D.name} are going to counseling. They're still married, for now.`; break;
    case 'fountain': text = `License approved. ${P.name} and ${D.name} will marry at the fountain.`; win = P; break;
    case 'now': {
      W.wedding = null; P.married = D.married = true; P.partner = D.id; D.partner = P.id; P.separated = D.separated = false;
      addJoy(P, 45); addJoy(D, 45);
      for (const q of [P, D]) if (!q.inside) setTask(q, 'court', 'hall', jitter(TOWN.hall.spot, 1.2), { wed: true });
      const [hx, hz] = TOWN.hall.spot; for (let i = 0; i < 4; i++) setTimeout(() => spawnBurst(hx + (rand() - 0.5) * 3, 4, hz + (rand() - 0.5) * 3, ['#ff8fb6', '#ffffff', '#ffd36b'], 40, 2.2, 0.35), i * 700);
      Sound.bell();
      remember(P, `${D.name} and I got married at Glimmer Hall. The Creator married us.`, 3, 'married', D.name); remember(D, `${P.name} and I got married at Glimmer Hall. The Creator married us.`, 3, 'married', P.name);
      text = `${P.name} and ${D.name} are married! A quick courthouse wedding at Glimmer Hall.`; win = P; break;
    }
    case 'wait': W.wedding = null; feel(P, D, 0, true); creatorShift(P, -0.3); creatorShift(D, -0.3); remember(P, 'The Creator told us to wait before getting married.', 2, 'lostCase'); remember(D, 'The Creator told us to wait before getting married.', 2, 'lostCase'); text = `${P.name} and ${D.name} were asked to wait before they marry.`; break;
    case 'p': case 'd': { win = choice === 'p' ? P : D; lose = choice === 'p' ? D : P; feel(lose, win, -0.3, true); text = `On "${c.topic}", ${judge.toLowerCase() === 'the jury' ? 'the town' : 'the Creator'} sides with ${win.name}.`; break; }
    case 'both': feel(P, D, 0.5, true); feel(D, P, 0.5, true); text = `On "${c.topic}", they both have a point.`; break;
    case 'vote': { const v = juryVotes({ ...c, kind: 'debate' }); c.jury = `${v.yes}–${v.no}`; win = v.yes >= v.no ? P : D; lose = win === P ? D : P; feel(lose, win, -0.3, true); text = `The town voted ${Math.max(v.yes, v.no)} to ${Math.min(v.yes, v.no)} for ${win.name} on "${c.topic}".`; break; }
  }
  c.result = text;
  if (win) { remember(win, `Won at Glimmer Hall: ${text}`, 2, 'wonCase', null, { what: title }); addJoy(win, 12); if (!byJury) creatorShift(win, 0.4); }
  if (lose) { remember(lose, `Lost at Glimmer Hall: ${text}`, 3, 'lostCase', null, { what: title }); if (!byJury) creatorShift(lose, -0.5); }
  if (!byJury && lose && win && c.kind !== 'debate') {
    const v = juryVotes(c), townSaid = v.yes > v.no ? P : D;
    for (const q of v.jurors) { const agrees = townSaid === win ? rand() < 0.7 : rand() < 0.3; creatorShift(q, agrees ? 0.1 : -0.15); if (!agrees && rand() < 0.4) remember(q, `I don't think the Creator's ruling in ${title} was fair.`, 1, 'unfair'); }
  }
  if (c.kind !== 'license' || choice !== 'fountain') townRecord(choice === 'grant' ? 'divorce' : choice === 'now' ? 'married' : 'court', [P.id, D.id], choice === 'now' ? `${P.name} and ${D.name} got married at Glimmer Hall.` : `${title}: ${text}${byJury ? ' The jury decided.' : ' The Creator decided.'}`);
  diary(`⚖ Ruling in <b>${esc(title)}</b>${byJury && c.jury ? ` (jury ${c.jury})` : ''}: ${esc(text)}`);
  Sound.bell(); markDirty();
  return `⚖ ${text}`;
}
function courtMorning() {
  if (ISLE !== 'isle1' && ISLE !== 'isle2') return;
  const ppl = W.people.filter((p) => !p.away && !p.visitor && p.grow >= 1);
  if (ppl.length < 2) return;
  if (rand() < 0.35) { const a = pick(ppl), b = pick(ppl.filter((q) => q !== a)); if (b) fileCase('debate', a, b, { topic: pick(DEBATES) }); }
  const sour = [];
  for (const a of ppl) for (const b of ppl) if (a !== b && fscore(a, b) <= -3) sour.push([a, b]);
  if (sour.length && rand() < 0.4) { const [a, b] = pick(sour); fileCase('complaint', a, b, { grievance: pick(GRIEVANCES) }); }
  for (const c of openCases()) if (c.kind === 'divorce' && W.day - c.filed >= 3) applyRuling(c, 'grant', true);
  for (const c of openCases()) if (c.kind === 'license' && (!W.wedding || W.day - c.filed >= 2)) { c.status = 'closed'; c.result = 'Approved automatically.'; }
}
let lastCourtTalk = 0;
function courtTick() {
  if (MODE !== 'host' || !W) return;
  const cases = openCases().filter((c) => c.kind !== 'license');
  if (W.t >= 0.27 && W.t < 0.34 && W.courtDay !== W.day && cases.length) {
    W.courtDay = W.day;
    const c = cases[0], P = person(c.p), D = person(c.d);
    c.heard = W.day; W.courtCase = c.id;
    const free = (q) => q && !q.away && !q.inside && q.state === 'free' && q.task?.kind !== 'work';
    for (const q of [P, D]) if (free(q)) setTask(q, 'court', 'hall', jitter(TOWN.hall.spot, 1.2), { case: c.id });
    for (const q of W.people.filter((x) => x !== P && x !== D && free(x)).sort(() => rand() - 0.5).slice(0, 3)) setTask(q, 'court', 'hall', jitter(TOWN.hall.spot, 2), { case: c.id, gallery: true });
    diary(`⚖ Court is in session at Glimmer Hall: <b>${esc(caseTitle(c))}</b>.`);
    toast(`⚖ Court is in session: ${caseTitle(c)}. You're the judge, open the Court tab.`);
    if (cutsOn() && MODE === 'host' && !offlineSim) { W.courtCase = null; startCivilTrial(c); }
  }
  if (W.t >= 0.36 && W.courtCase) {
    const c = (W.cases || []).find((x) => x.id === W.courtCase); W.courtCase = null;
    if (c && c.status === 'open' && W.day - c.filed >= 1) applyRuling(c, 'jury', true);
  }
  if (interior?.kind === 'hall' && now - lastCourtTalk > 4.5) {
    lastCourtTalk = now;
    const c = (W.cases || []).find((x) => x.id === W.courtCase);
    const inRoom = W.people.filter((p) => p.inside && p.task?.kind === 'court');
    if (c && inRoom.length) {
      const P = person(c.p), D = person(c.d), turn = Math.floor(now / 4.5) % 3;
      if (turn === 0 && P && inRoom.includes(P)) bubble(P, c.args.p, 4.2);
      else if (turn === 1 && D && inRoom.includes(D)) bubble(D, c.args.d, 4.2);
      else { const g = inRoom.filter((q) => q !== P && q !== D); if (g.length) { const q = pick(g); bubble(q, pick(['Ooh.', 'Objection!', '*whispers*', 'Order in the court!', 'This is better than TV.']), 2.4); } }
    }
  }
}
function hallKey() { return ['h', CUT.live?.id || '', jailedPeople().map((p) => p.id).join(','), W.people.filter((p) => p.inside && p.task?.kind === 'court').map((p) => p.id).join(','), W.courtCase || '', openCases().length, cfg.boxMode].join('|'); }
function buildHall() {
  if (CUT.live?.trial && interior?.kind === 'hall') return buildTrialRoom(CUT.live);
  const S = roomScene;
  shell(S, '#efe4cf', '#9a6f4e', { pattern: 'stripes', wainscot: '#7a5a44' });
  const wood = toon('#7a5238'), light = toon('#a0714c');
  const bench = new T3.Group(); bench.add(mesh(box(3.6, 1.6, 1.2), wood, 0, 0.8, 0)); bench.add(mesh(box(3.8, 0.12, 1.4), light, 0, 1.66, 0)); bench.add(mesh(box(1.0, 0.8, 0.2), toon('#fff4dc'), 0, 1.0, 0.62)); bench.position.set(0, 0.3, -3.1); S.add(bench);
  S.add(mesh(box(4.2, 0.3, 1.9), light, 0, 0.15, -3.1));
  const gav = new T3.Group(); const hd = mesh(cyl(0.1, 0.1, 0.35, 10), toon('#5a3a2a'), 0, 0, 0); hd.rotation.z = Math.PI / 2; gav.add(hd); gav.add(mesh(cyl(0.03, 0.03, 0.4, 6), toon('#5a3a2a'), 0, 0.2, 0)); gav.position.set(1.1, 2.1, -3.0); S.add(gav);
  const sg = sign('⚖ Glimmer Hall', '#fffaf2', '#6b4a3a', 3.4); sg.position.set(0, 3.9, -3.97); S.add(sg);
  for (const [x, c] of [[-2.6, '#6f73c9'], [2.6, '#ff9fbf']]) { S.add(mesh(cyl(0.04, 0.04, 2.6, 6), toon('#c9b3a0'), x + 0.9, 1.3, -3.6)); S.add(mesh(box(0.6, 0.9, 0.03), toon(c), x + 1.22, 2.2, -3.6)); }
  for (const x of [-2.1, 2.1]) { S.add(mesh(box(2.2, 0.12, 1), light, x, 0.85, -0.6)); for (const s of [-0.9, 0.9]) S.add(mesh(box(0.12, 0.8, 0.12), wood, x + s, 0.4, -0.6)); }
  for (let r = 0; r < 2; r++) for (const x of [-2.4, 2.4]) { S.add(mesh(box(3, 0.14, 0.7), light, x, 0.5, 1.6 + r * 1.4)); S.add(mesh(box(3, 0.6, 0.1), light, x, 0.85, 1.9 + r * 1.4)); }
  const c = (W.cases || []).find((x) => x.id === W.courtCase);
  const inRoom = W.people.filter((p) => p.inside && p.task?.kind === 'court');
  let gi = 0;
  for (const p of inRoom) {
    if (c && p.id === c.p) addPerson(S, p, -2.1, 0.4, Math.PI);
    else if (c && p.id === c.d) addPerson(S, p, 2.1, 0.4, Math.PI);
    else { const x = [-3.2, -1.6, 1.6, 3.2][gi % 4], z = 1.3 + Math.floor(gi / 4) * 1.4; addPerson(S, p, x, z, Math.PI); gi++; }
  }
  hallCell(S);
  bench.traverse((o) => (o.userData.tap = { kind: 'judge' }));
  $('#rcTitle').textContent = 'Glimmer Hall';
  const n = openCases().length;
  $('#rcSub').textContent = c && inRoom.length ? `Court is in session: ${caseTitle(c)}. Tap the judge's bench to rule.` : n ? `${plural(n, 'case')} waiting. Tap the judge's bench to see the docket.` : 'The courtroom is quiet today.';
}
let debateForm = false;
function renderCourt() {
  const open = openCases(), past = (W.cases || []).filter((c) => c.status === 'closed').slice(-8).reverse();
  const opts = W.people.filter((p) => !p.away).map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  if (MODE === 'host') open.slice(0, 2).forEach((c) => hearSides(c));
  $('#pane-court').innerHTML = cutChoiceHtml() + crimeBoardHtml() + `
    <div class="creator"><h3>⚖ Glimmer Hall</h3><p>Residents bring their fights, disputes, divorces, marriage licenses and silly debates here. You're the judge. Anything you leave for more than a day goes to a jury of residents at the next morning session.</p>
    <div class="btns"><button class="btn" type="button" data-hallview>${MODE === 'host' ? 'Go to the courtroom' : 'Show the courtroom in the box'}</button><button class="btn" type="button" data-debateform>Start a debate</button></div>
    ${debateForm ? `<div class="field"><label>Between</label><select id="dbA">${opts}</select><select id="dbB">${W.people.filter((p) => !p.away).map((p, i) => `<option value="${p.id}" ${i === 1 ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
      <div class="field"><label for="dbTopic">About</label><select id="dbTopic">${DEBATES.map((t) => `<option>${esc(t)}</option>`).join('')}</select><input id="dbCustom" placeholder="…or write your own question" maxlength="80" style="font:14px var(--body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:7px 10px"></div>
      <div class="btns"><button class="btn gold" type="button" data-startdebate>Summon them</button></div>` : ''}</div>
    <p class="label">The docket</p>
    ${open.length ? open.map((c) => `<div class="creator"><h3>${CASE_KINDS[c.kind].icon} ${esc(caseTitle(c))}</h3>
      <div class="chips"><span class="chip">${CASE_KINDS[c.kind].label}</span><span class="chip">filed day ${c.filed}</span>${c.id === W.courtCase ? '<span class="chip gold">in session now</span>' : ''}</div>
      <p>${esc(c.summary)}</p>
      <p class="note"><b>${esc(c.pName)}:</b> "${esc(c.args.p || '…')}"</p><p class="note"><b>${esc(c.dName)}:</b> "${esc(c.args.d || '…')}"</p>
      <div class="btns">${(RULINGS[c.kind] || []).map(([k, l]) => `<button class="btn ${k === 'jury' ? '' : 'gold'}" type="button" data-rule="${c.id}" data-choice="${k}">${esc(l.replace('#P', c.pName).replace('#D', c.dName))}</button>`).join('')}${c.kind !== 'license' ? `<button class="btn" type="button" data-rule="${c.id}" data-choice="jury">Let the jury decide</button>` : ''}</div></div>`).join('') : '<p class="hint">No cases right now. Peace on the island. For now.</p>'}
    ${past.length ? `<p class="label">Past rulings</p>${past.map((c) => `<p class="note"><span class="chip">day ${c.ruled}</span> <b>${esc(caseTitle(c))}</b>: ${esc(c.result || '')} <span class="hint">${c.byJury ? `(jury${c.jury ? ` ${c.jury}` : ''})` : '(you)'}</span></p>`).join('')}` : ''}${townRecordHtml()}`;
  $('#detSel')?.addEventListener('change', (e) => send({ t: 'crime', a: 'detective', pid: e.target.value }));
  $('#paceSel')?.addEventListener('change', (e) => send({ t: 'crime', a: 'pace', pace: e.target.value }));
}

function planLandmark(p) {
  const big = (W.placed || []).filter((pl) => BUILDS[pl.type]?.big);
  if (!big.length || p.visitor) return false;
  const t = W.t;
  let pool = big.filter((pl) => pl.type !== 'observatory' || (t > 0.5 && t < 0.6));
  if (p.body.ailments?.length && !(p.healedUntil >= W.day + 1)) { const cl = big.find((pl) => pl.type === 'clinic'); if (cl && rand() < 0.4) pool = [cl]; }
  if (!pool.length || rand() > 0.13) return false;
  const pl = pick(pool), size = BUILDS[pl.type].size, a = rand() * 6.28;
  const dest = Math.hypot(pl.x - DT.x, pl.z - DT.z) < DT.R ? 'downtown' : 'plaza';
  setTask(p, 'landmark', dest, [pl.x + Math.cos(a) * (size + 0.8), pl.z + Math.sin(a) * (size + 0.8)], { id: pl.id, type: pl.type });
  return true;
}
function landmarkDone(p) {
  const T = p.task, n = BUILDS[T.type]?.name || 'landmark';
  addJoy(p, { carousel: 10, onsen: 14, clinic: 6, observatory: 12, museum: 10, ferris: 16 }[T.type] || 8);
  if (T.type === 'clinic') { p.healedUntil = W.day + 1; if (p.body.ailments?.length) bubble(p, pick(['Joints feel… okay? Huh.', 'The doctor said drink more water. Wow.', 'Tomorrow morning should be easier.']), 3); }
  if (T.type === 'onsen') p.hunger = Math.max(0, p.hunger - 0.05);
  if (T.type === 'museum' && (W.museum || []).length) remember(p, `Went to the museum and saw ${pick(W.museum).name}.`, 1, 'museum');
  else remember(p, `Went to the ${n}.`, 1, 'landmark');
  if (T.type === 'museum' || T.type === 'ferris' || T.type === 'carousel') { W.tickets = (W.tickets || 0) + 1; }
}
function museumDaily() {
  const n = (W.museum || []).length, tix = W.tickets || 0; W.tickets = 0;
  if (!tix) return;
  const coins = Math.min(12, Math.floor(tix / 3) + Math.floor(n / 4));
  if (coins > 0) { W.creator.coins += coins; diary(`🎟 Yesterday's ticket sales brought in ${plural(coins, 'coin')}.`); }
}
