// ============================================================
// TRIALS: every case in session plays out as a courtroom scene.
// Judge Hoot keeps order, lawyers object, the Creator (or the jury) rules.
// ============================================================
function owlMesh() {
  const g = new T3.Group();
  if (gfxOn()) { const inner = keepShared(prop('owl', {})); inner.rotation.y = Math.PI; g.add(inner); }
  else { g.add(mesh(sph(0.5, 16, 12), toon('#9a6a45'), 0, 0.6, 0)); g.add(mesh(sph(0.42, 16, 12), toon('#9a6a45'), 0, 1.12, 0)); g.add(mesh(new T3.ConeGeometry(0.07, 0.16, 6), toon('#ffb347'), 0, 1.02, 0.43)); }
  const ring = toon('#ffd36b'), pupil = vinyl('#1e1830');
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = new T3.Group(); e.position.set(s * 0.17, 1.14, 0.36);
    e.add(mesh(new T3.CircleGeometry(0.13, 20), toon('#fff8e6'), 0, 0, 0, false));
    e.add(mesh(new T3.RingGeometry(0.1, 0.13, 20), ring, 0, 0, 0.002, false));
    const pu = mesh(sph(0.075, 12, 10), pupil, 0, 0, 0.02, false); pu.scale.z = 0.45; e.add(pu);
    e.add(mesh(sph(0.022, 6, 5), toon('#ffffff', { emissive: new T3.Color('#ffffff') }), 0.03, 0.03, 0.05, false));
    e.rotation.y = s * 0.12; g.add(e); eyes.push(e);
  }
  g.userData.eyes = eyes;
  g.traverse((o) => { o.userData.tap = { kind: 'judge' }; if (o.isMesh) o.castShadow = true; });
  return g;
}
let courtOwl = null;
// ---------- the courtroom, laid out for a trial ----------
const COURT_POS = {
  judge: [0, -3.35], witness: [0, -1.55], pros: [-2.75, -0.55], def: [2.75, -0.55], defendant: [2.75, 0.55], plaintiff: [-2.75, 0.55],
  jury: [[-3.95, -3.1], [-3.95, -2.25], [-3.95, -1.4], [-3.35, -3.1], [-3.35, -2.25], [-3.35, -1.4]],
  gallery: [[-2.2, 1.9], [-1.1, 1.9], [0, 1.9], [1.1, 1.9], [2.2, 1.9], [-1.6, 3.1], [-0.5, 3.1], [0.6, 3.1], [1.7, 3.1]],
  cell: [[3.55, -3.45], [4.05, -2.95]],
};
const COURT_SHOTS = {
  wide: [[5.6, 9.2, 8.2], [0, 0.8, -1.2]], judge: [[1.9, 3.5, -0.2], [0, 2.45, -3.5]], witness: [[1.6, 2.6, 2.4], [0, 1.45, -1.55]],
  pros: [[1.0, 2.7, 1.3], [-2.75, 1.4, -0.55]], def: [[-1.1, 2.7, 1.3], [2.75, 1.4, -0.55]], defendant: [[-1.2, 2.6, 2.6], [2.75, 1.3, 0.55]], plaintiff: [[1.2, 2.6, 2.6], [-2.75, 1.3, 0.55]],
  jury: [[-0.6, 3.0, 0.2], [-3.7, 1.2, -2.3]], gallery: [[0.4, 3.2, -2.2], [0, 1.1, 2.5]], cell: [[1.2, 2.9, -0.4], [3.8, 1.3, -3.2]],
};
function buildTrialRoom(S) {
  const R = roomScene, T = S.trial;
  shell(R, '#e9dcc4', '#8a5f40', { pattern: 'stripes', wainscot: '#6e4a34' });
  const wood = toon('#7a5238'), light = toon('#a0714c'), brass = toon('#e8c26a');
  // judge's bench and Judge Hoot
  const bench = new T3.Group(); bench.add(mesh(box(3.8, 1.7, 1.2), wood, 0, 0.85, 0)); bench.add(mesh(box(4.0, 0.14, 1.45), light, 0, 1.76, 0)); bench.add(mesh(box(1.1, 0.8, 0.06), toon('#fff4dc'), 0, 1.05, 0.62));
  bench.position.set(0, 0.3, -3.05); R.add(bench); R.add(mesh(box(4.4, 0.3, 1.9), light, 0, 0.15, -3.05));
  courtOwl = owlMesh(); courtOwl.position.set(0, 1.4, -3.5); courtOwl.scale.setScalar(1.05); R.add(courtOwl);
  const gav = new T3.Group(); const hd = mesh(cyl(0.11, 0.11, 0.36, 12), toon('#5a3a2a'), 0, 0, 0); hd.rotation.z = Math.PI / 2; gav.add(hd); gav.add(mesh(cyl(0.03, 0.03, 0.42, 6), toon('#5a3a2a'), 0.05, 0.1, 0.18)); gav.position.set(1.15, 2.18, -2.75); R.add(gav); S.gavel = gav;
  const sg = sign('⚖ Glimmer Hall', '#fffaf2', '#6b4a3a', 3.2); sg.position.set(0, 4.05, -3.97); R.add(sg);
  for (const x of [-1.9, 1.9]) { R.add(mesh(cyl(0.04, 0.04, 2.8, 6), brass, x, 1.4, -3.75)); R.add(mesh(box(0.7, 1.0, 0.03), toon(x < 0 ? '#6f73c9' : '#ff9fbf'), x + 0.38, 2.35, -3.75)); }
  // witness stand, lawyers' desks, jury box, gallery, the cell
  R.add(mesh(box(1.3, 1.1, 0.5), light, 0, 0.55, -1.05)); R.add(mesh(box(1.45, 0.1, 0.62), wood, 0, 1.12, -1.05)); R.add(mesh(cyl(0.03, 0.03, 0.4, 6), toon('#3a3a44'), 0.3, 1.35, -1.0));
  for (const [x, c] of [[-2.05, '#6f73c9'], [2.05, '#ff9fbf']]) { R.add(mesh(box(0.7, 0.95, 2.4), light, x, 0.48, 0)); R.add(mesh(box(0.85, 0.1, 2.55), wood, x, 0.98, 0)); R.add(mesh(box(0.05, 0.4, 2.2), toon(c), x + (x < 0 ? 0.36 : -0.36), 0.55, 0)); R.add(mesh(box(0.3, 0.05, 0.4), toon('#fff4dc'), x, 1.05, -0.4)); }
  R.add(mesh(box(1.6, 0.8, 3.0), wood, -3.65, 0.4, -2.25)); R.add(mesh(box(0.08, 0.5, 3.0), light, -2.85, 1.0, -2.25));
  for (const z of [1.9, 3.1]) { R.add(mesh(box(5.6, 0.14, 0.6), light, 0, 0.48, z + 0.1)); R.add(mesh(box(5.6, 0.6, 0.1), light, 0, 0.8, z + 0.42)); }
  { const bars = new T3.Group(), mat = toon('#5a5470'); for (let i = 0; i < 7; i++) { bars.add(mesh(cyl(0.035, 0.035, 2.6, 6), mat, 3.0 + i * 0.25, 1.3, -2.55)); } for (let i = 0; i < 5; i++) bars.add(mesh(cyl(0.035, 0.035, 2.6, 6), mat, 3.0, 1.3, -2.55 - i * 0.3)); bars.add(mesh(box(1.7, 0.08, 0.08), mat, 3.75, 2.6, -2.55)); bars.add(mesh(box(1.7, 0.08, 0.08), mat, 3.75, 0.3, -2.55)); R.add(bars); R.add(mesh(box(1.4, 0.3, 0.6), toon('#8a84a8'), 3.8, 0.15, -3.6)); }
  // the cast on their marks
  const at = (pid, [x, z], face, opts) => { const p = person(pid); if (p) addPerson(R, p, x, z, face, opts); };
  if (T.witness) at(T.witness, COURT_POS.witness, 0);
  if (T.pros) at(T.pros, COURT_POS.pros, Math.PI / 2);
  if (T.counsel) at(T.counsel, COURT_POS.def, -Math.PI / 2);
  if (T.def && T.def !== T.counsel) at(T.def, T.counsel ? COURT_POS.defendant : COURT_POS.def, -Math.PI / 2);
  if (T.plaintiff && T.plaintiff !== T.pros) at(T.plaintiff, COURT_POS.plaintiff, Math.PI / 2);
  (T.jury || []).slice(0, 6).forEach((pid, i) => at(pid, COURT_POS.jury[i], Math.PI / 2, { y: 0.28 }));
  (T.gallery || []).slice(0, 9).forEach((pid, i) => at(pid, COURT_POS.gallery[i], Math.PI, { y: 0.28 }));
  jailedPeople().slice(0, 2).forEach((p, i) => { if (![T.def, T.witness].includes(p.id)) addPerson(R, p, ...COURT_POS.cell[i], -0.8); });
  $('#rcTitle').textContent = 'Glimmer Hall'; $('#rcSub').textContent = S.title || 'Court is in session.';
}
function courtShot(S, L, sp) {
  const T = S.trial; let k = L.shot;
  if (!k && sp.p) { const id = sp.p.id; k = id === T.witness ? 'witness' : id === T.pros ? 'pros' : id === T.counsel ? 'def' : id === T.def ? (T.counsel ? 'defendant' : 'def') : id === T.plaintiff ? 'plaintiff' : (T.jury || []).includes(id) ? 'jury' : 'gallery'; }
  if (!k) k = L.who === 'judge' ? 'judge' : L.who === 'jury' ? 'jury' : L.who === 'crowd' ? 'gallery' : 'wide';
  const sh = COURT_SHOTS[k] || COURT_SHOTS.wide;
  cutCam(sh[1][0], sh[1][1], sh[1][2], sh[0][0], sh[0][1], sh[0][2], true);
  if (L.who === 'judge' && L.fx === 'gavel' || L.fx === 'order') { if (S.gavel) { S.gavel.rotation.z = -0.9; setTimeout(() => S.gavel && (S.gavel.rotation.z = 0), 180); } }
  if (sp.p) sp.p.bubble = { text: L.text || '', until: now + 3 };
}
function courtStage(S) {
  const T = S.trial;
  for (const pid of [T.pros, T.counsel, T.def, T.witness, T.plaintiff, ...(T.jury || []), ...(T.gallery || [])]) { const p = person(pid); if (p && !jailed(p)) cutPlace(p, TOWN.hall.spot[0], TOWN.hall.spot[1], 0, { inside: true, at: 'hall' }); }
  if (interior) closeInterior();
  openInterior({ kind: 'hall' });
  interior.dirty = true;
  cutCam(...COURT_SHOTS.wide[1], ...COURT_SHOTS.wide[0], true);
}
function courtUnstage(S) { if (interior?.kind === 'hall') closeInterior(); courtOwl = null; }
function owlFrame() {
  if (!courtOwl || !interior) return;
  const blink = (now % 4.3) < 0.14; courtOwl.userData.eyes.forEach((e) => (e.scale.y = blink ? 0.15 : 1));
  const talking = CUT.live && CUT.live.lines[CUT.i]?.who === 'judge' && CUT.typed < (CUT.live.lines[CUT.i]?.text || '').length;
  courtOwl.rotation.z = talking ? Math.sin(now * 12) * 0.04 : Math.sin(now * 0.8) * 0.02;
  courtOwl.children[0] && (courtOwl.children[0].position.y = talking ? Math.abs(Math.sin(now * 10)) * 0.03 : 0);
}
// who sits where: jurors and a gallery drawn from everyone free
function courtCrowd(exclude, nJury = 6, nGallery = 7) {
  const pool = W.people.filter((p) => p.grow >= 0.8 && !p.away && !p.visitor && !jailed(p) && !exclude.includes(p.id)).sort(() => rand() - 0.5);
  const jury = pool.filter((p) => p.grow >= 1).slice(0, nJury).map((p) => p.id);
  const gallery = pool.filter((p) => !jury.includes(p.id)).slice(0, nGallery).map((p) => p.id);
  return { jury, gallery };
}
const nameOf = (pid) => person(pid)?.name || 'someone';
const jline = (text, fx) => ({ who: 'judge', text, fx });
const nline = (text, fx) => ({ who: 'narrator', text, fx });
const pline = (pid, text, fx, extra = {}) => ({ who: pid, text, fx, ...extra });

// ---------- civil cases from the docket ----------
const CIVIL_BITS = {
  fight: { open: ['Your honor, {D} shoved me. In public. At the fountain.', 'I want the court to know I did nothing. NOTHING.'], back: ['{P} is being dramatic. It was a bump.', 'They started it and everyone knows it.'], obj: 'Objection! {P} is making me sound like a monster!', rule: ['Overruled. Hoo. You did shove them.', 'Sustained. Let us all calm our feathers.'] },
  bully: { open: ['I have every text {D} sent me. Every single one.', 'It keeps happening. I just want it to stop.'], back: ['They were jokes! Everyone talks like that.', 'I barely even know {P}.'], obj: 'Objection! Those texts are out of context!', rule: ['Overruled. There is not much context that makes that okay.', 'Sustained. Barely.'] },
  complaint: { open: ['{D} {G}. And I am tired of pretending it is fine.', 'I am here because I have had ENOUGH.'], back: ['That is not even true.', 'Wow. Okay. Did not know we were doing this in front of everyone.'], obj: 'Objection! Hearsay!', rule: ['This is Glimmer Hall, not a TV show. But… sustained.', 'Overruled. Hoo.'] },
  dispute: { open: ['{D} keeps getting close to my partner. I want the court to make it stop.'], back: ['We are FRIENDS. Friends talk.', 'I can talk to whoever I want.'], obj: 'Objection! Speculation!', rule: ['Sustained. Nobody here can read minds.', 'Overruled.'] },
  divorce: { open: ['It is not working. It has not worked for a long time.', 'I do not feel the same anymore. I am sorry.'], back: ['Please. Give us one more chance.', 'Fine. If that is what they want.'], obj: 'Objection! That is not what happened on our anniversary!', rule: ['Sustained. This is hard enough already.', 'Overruled, gently.'] },
  debate: { open: ['Your honor, the answer is obviously yes. I have prepared three points. Okay, two.', 'This is the most important question of our time.'], back: ['That is the worst take I have ever heard.', 'I respect it. I also think it is wrong.'], obj: 'OBJECTION! That argument is illegal!', rule: ['There is no such thing as an illegal argument. Overruled.', 'Sustained, because I agree.'] },
  license: { open: ['We are ready. We have been ready for a while.', 'Please say yes!'], back: ['What they said. Hehe.', 'I have never been more sure.'], obj: '', rule: [] },
};
const cfill = (s, c) => String(s).replace(/\{P\}/g, c.pName).replace(/\{D\}/g, c.dName).replace(/\{G\}/g, c.grievance || 'keeps being impossible');
function civilLines(c, T) {
  const B = CIVIL_BITS[c.kind] || CIVIL_BITS.complaint, Pp = c.p, Dp = c.d;
  const L = [jline(`Order! Court is now in session. Hoo. ${caseTitle(c).replace(/[.?!]$/, (m) => m === '.' ? '' : m)}${/[?!]$/.test(caseTitle(c)) ? '' : '.'}`, 'gavel')];
  L.push(jline(`${c.pName}, you brought this case. Speak.`));
  L.push(pline(Pp, c.args.p || cfill(pick(B.open), c)));
  L.push(pline(Dp, c.args.d || cfill(pick(B.back), c)));
  if (c.kind === 'license') {
    L.push(pline(Pp, cfill(pick(B.open), c), 'hearts'), pline(Dp, cfill(pick(B.back), c)));
    return L;
  }
  L.push(pline(Pp, cfill(pick(B.open), c)));
  if (B.obj) { L.push(pline(Dp, cfill(B.obj, c), 'objection')); L.push(jline(pick(B.rule))); }
  const friend = (T.gallery || []).map(person).filter(Boolean).sort((a, b) => Math.abs(fscore(b, person(Pp) || b) - fscore(b, person(Dp) || b)) - Math.abs(fscore(a, person(Pp) || a) - fscore(a, person(Dp) || a)))[0];
  if (friend) { const side = fscore(friend, person(Pp) || friend) >= fscore(friend, person(Dp) || friend) ? c.pName : c.dName; L.push(pline(friend.id, pick([`For the record, I am with ${side} on this.`, `I saw the whole thing. ${side} is telling the truth.`, `Can I say something? …${side} is right. Sorry.`]), null)); L.push(({ who: 'crowd', text: pick(['Ooooh.', '*whispering*', 'Oh no she DIDN\'T.', 'Scandalous.']), fx: 'gasp' })); L.push(jline('Order! Order in the gallery!', 'order')); }
  L.push(pline(Dp, pick(['I have nothing more to say.', 'This whole thing is ridiculous.', 'I just want this to be over.'])));
  return L;
}
async function aiCivilLines(c, T) {
  if (!aiReady() || aiBusy >= 3) return null;
  const Pp = person(c.p), Dp = person(c.d); if (!Pp || !Dp) return null;
  const gal = (T.gallery || []).map(person).filter(Boolean).slice(0, 4);
  try {
    const r = await llm(`A courtroom scene in Glimmer Hall on ${ISL.name}, a tiny island town of cute villagers who are real, flawed people. The judge is Judge Hoot, a fussy old owl who says "hoo". Think of a dramatic TV courtroom, but small and a little funny.
THE CASE (${CASE_KINDS[c.kind]?.label}): ${c.summary}${c.topic ? ` Question: ${c.topic}` : ''}
${Pp.name} (bringing the case): ${sceneProfile(Pp, { members: [{ id: Dp.id }] })}. Their opening: "${c.args.p || ''}"
${Dp.name} (the other side): ${sceneProfile(Dp, { members: [{ id: Pp.id }] })}. Their answer: "${c.args.d || ''}"
IN THE GALLERY: ${gal.map((q) => `${q.name} (${fscore(q, Pp) >= fscore(q, Dp) ? `sides with ${Pp.name}` : `sides with ${Dp.name}`})`).join(', ') || 'a few neighbors'}
Write 10 to 14 lines of the hearing, BEFORE any ruling. Both sides argue, bring up real grievances, at least two objections ("Objection! …" with a reason) that Judge Hoot sustains or overrules, someone from the gallery chimes in, and the gallery gasps at least once. Keep every line under 22 words. No ruling at the end.
Reply with only JSON: {"lines":[{"who":"name, or JUDGE, or GALLERY","say":"...","fx":"objection, holdit, gasp, gavel or none"}]}`, { model: badModels.has(brainCfg.judge) ? null : brainCfg.judge, max: 900, temperature: 0.9 });
    return aiToLines(r?.lines, [Pp, Dp, ...gal]);
  } catch (e) { return null; }
}
function aiToLines(raw, cast) {
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const l of raw.slice(0, 32)) {
    const who = String(l.who || '').trim(), say = String(l.say || '').replace(/\s+/g, ' ').trim().slice(0, 200); if (!say) continue;
    const fx = ['objection', 'holdit', 'takethat', 'gasp', 'gavel', 'shock'].includes(l.fx) ? l.fx : null;
    if (/^judge|hoot/i.test(who)) out.push(jline(say, fx));
    else if (/^(gallery|crowd|everyone)/i.test(who)) out.push({ who: 'crowd', text: say, fx: fx || 'gasp' });
    else if (/^jury/i.test(who)) out.push({ who: 'jury', text: say, fx });
    else if (/^narrat/i.test(who)) out.push(nline(say, fx));
    else { const p = cast.find((q) => q && q.name.toLowerCase() === who.toLowerCase()); if (p) out.push(pline(p.id, say, fx)); }
  }
  return out.length >= 5 ? out : null;
}
// the docket case in session becomes a scene; the Creator can rule at the end
async function startCivilTrial(c) {
  if (!c || c.status !== 'open' || CUT.live || CUT.queue.some((q) => q.caseId === c.id)) return;
  const Pp = person(c.p), Dp = person(c.d); if (!Pp || !Dp || jailed(Pp) || jailed(Dp)) return;
  const crowd = courtCrowd([c.p, c.d], c.kind === 'debate' || c.kind === 'license' ? 0 : 6, 7);
  const T = { kind: 'civil', pros: c.p, def: c.d, jury: crowd.jury, gallery: crowd.gallery, caseId: c.id };
  let body = null;
  try { body = await Promise.race([aiCivilLines(c, T), sleep(22000).then(() => null)]); } catch (e) {}
  if (c.status !== 'open') return;
  const lines = [nline(pick(['Glimmer Hall was packed. Nobody wanted to miss this.', 'The gallery went quiet as the doors opened.', 'Somebody brought snacks. It was going to be one of those days.']))].concat(body || civilLines(c, T));
  // debates list their own "town vote" for the old court panel; the scene adds its own jury/vote button below
  const opts = (RULINGS[c.kind] || []).filter(([k]) => k !== 'vote').map(([k, l]) => [k, l.replace('#P', c.pName).replace('#D', c.dName)]);
  if (c.kind !== 'license') opts.push(['jury', c.kind === 'debate' ? 'Let the town vote' : 'Let the jury decide']);
  lines.push(jline(c.kind === 'license' ? 'Creator, shall I stamp this marriage license?' : 'The court has heard enough. Creator, how do you rule? Hoo.', null));
  lines[lines.length - 1].choice = { prompt: 'You are the judge.', options: opts, timeout: 25, fallback: c.kind === 'license' ? 'fountain' : 'jury', pick: (k) => civilVerdict(c, k, T) };
  queueCut({ kind: 'trial', caseId: c.id, icon: CASE_KINDS[c.kind]?.icon || '⚖', title: caseTitle(c), sub: CASE_KINDS[c.kind]?.label || 'A hearing', music: 'trial', trial: T, lines, stage: courtStage, unstage: courtUnstage, shot: courtShot,
    onEnd: (S, silent) => { if (c.status === 'open') applyRuling(c, c.kind === 'license' ? 'fountain' : 'jury', true); } });
}
function civilVerdict(c, k, T) {
  const byJury = k === 'jury';
  const res = applyRuling(c, k, byJury) || '';
  const text = (c.result || res.replace(/^⚖\s*/, '')).trim();
  const L = [];
  if (byJury && c.jury && c.kind !== 'debate') { const fp = person((T.jury || [])[0]); L.push(fp ? pline(fp.id, `We the jury have decided. ${c.jury.replace('–', ' to ')}.`) : { who: 'jury', text: `The jury has decided, ${c.jury.replace('–', ' to ')}.` }); }
  L.push(jline(byJury ? text : `The Creator has ruled. ${text}`, 'gavel'));
  const win = ['innocent', 'dismiss'].includes(c.choice) ? c.d : ['apologize', 'fine', 'service', 'apart', 'p'].includes(c.choice) ? c.p : c.choice === 'd' ? c.d : null;
  if (['innocent', 'dismiss'].includes(c.choice) && c.kind !== 'debate') L.push({ who: 'narrator', text: '', fx: 'innocent', hold: 1.8 });
  else if (['apologize', 'fine', 'service', 'apart'].includes(c.choice)) L.push({ who: 'narrator', text: '', fx: 'guilty', hold: 1.8 });
  if (c.choice === 'grant') { L.push(pline(c.p, pick(['…Thank you.', 'It is for the best.', 'I will always care about you.']), null, { emote: '💔' }), pline(c.d, pick(['I hope you find what you are looking for.', '…Okay.', 'I need some air.']), null, { emote: '💧' })); }
  else if (c.choice === 'counsel') L.push(pline(c.p, 'Counseling. Fine. For us.'), pline(c.d, 'Thank you, Creator.', null, { emote: '♥' }));
  else if (c.choice === 'now') L.push(jline('By the power of Glimmer Hall, I pronounce you married! Hoo!', 'confetti'), pline(c.p, 'I love you!', 'hearts'), pline(c.d, 'I love you too!'));
  else if (win && person(win)) { const lose = win === c.p ? c.d : c.p; L.push(pline(win, pick(['YES. Thank you!', 'Justice!', 'I knew it.', 'Told you so.']), null, { emote: '✨' })); if (person(lose)) L.push(pline(lose, pick(['This is so unfair.', 'Whatever.', 'I want an appeal!', '…Fine.']), null, { emote: '💢' })); }
  L.push(jline('Court is adjourned!', 'gavel'));
  return L;
}
// a quick scene when the Creator rules from the Court tab
function verdictMini(c) {
  if (!c || c.kind === 'debate' || MODE !== 'host') return;
  const L = [jline(`In the matter of ${caseTitle(c)}…`, 'gavel'), jline(c.result || 'The court has ruled.')];
  if (['apologize', 'fine', 'service', 'apart'].includes(c.choice)) L.splice(1, 0, { who: 'narrator', text: '', fx: 'guilty', hold: 1.6 });
  if (['innocent', 'dismiss'].includes(c.choice)) L.splice(1, 0, { who: 'narrator', text: '', fx: 'innocent', hold: 1.6 });
  const T = { kind: 'civil', pros: c.p, def: c.d, jury: [], gallery: [] };
  queueCut({ kind: 'verdict', icon: '⚖', title: 'The Creator rules', sub: caseTitle(c), music: 'trial', trial: T, lines: L, stage: courtStage, unstage: courtUnstage, shot: courtShot });
}

