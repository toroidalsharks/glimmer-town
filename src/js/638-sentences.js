// ============================================================
// SENTENCES: what happens to people who are convicted. The Creator
// picks from a few fitting options (or the court's default is used):
// restitution, community service, probation with an ankle monitor,
// stay-away orders, anger management, the cell, and for murder a real
// prison term with parole hearings, or exile from the island
// ============================================================
const PAROLE_GAP = 30 * 864e5;
const onProbation = (p) => !!(p?.probation && W.day <= p.probation.until);
const onService = (p) => !!(p?.service && W.day <= p.service.until && !jailed(p));
function sentenceOptions(C, A) {
  const K = CRIME_TYPES[C.type], d = K.days, again = onProbation(A) || (A.record || []).length > 0;
  const V = C.victim && person(C.victim);
  let o;
  if (C.type === 'murder') o = [
    { key: 'prison', label: 'A real year in the cell, with parole hearings' },
    { key: 'life', label: 'Life in the cell (hearings every few months)' },
    { key: 'exile', label: 'Banish them from the island forever' },
  ];
  else if (['assault', 'arson', 'poison'].includes(C.type)) o = [
    { key: 'cell', label: `${d} days in the cell, then anger management` },
    { key: 'probation', label: `Probation and anger management${V ? `, and stay away from ${V.name}` : ''}` },
    { key: 'harsh', label: `${d * 2} days in the cell` },
  ];
  else if (K.tier >= 2) o = [
    { key: 'cell', label: `${d} days in the cell, then probation` },
    { key: 'service', label: 'Community service and probation' },
    { key: ['embezzle', 'fraud'].includes(C.type) && A.job ? 'fired' : 'harsh', label: ['embezzle', 'fraud'].includes(C.type) && A.job ? 'Lose their job, pay it all back, probation' : `${d * 2} days in the cell` },
  ];
  else o = [
    { key: 'service', label: C.type === 'graffiti' ? 'Scrub the wall: community service' : 'Community service' },
    { key: 'apology', label: 'A public apology and probation' },
    { key: again ? 'cell' : 'warning', label: again ? '1 day in the cell (they did it again)' : 'Just pay it back, with a warning' },
  ];
  return o;
}
// the sentence itself: returns lines for the scene
function applySentence(C, A, key) {
  endRemand(A);
  const K = CRIME_TYPES[C.type], L = [], V = C.victim && person(C.victim), days = Math.max(1, K.days || 1);
  const repeat = onProbation(A);
  A.record = A.record || [];
  let text;
  const cell = (n, extra) => { A.jail = { until: W.day + n + (repeat ? 2 : 0), crime: C.id, label: K.label, ...extra }; A.task = { kind: 'jail', phase: 'do' }; };
  const probation = (n) => { A.probation = { until: W.day + n, crime: C.id }; };
  const stayAway = (n) => { if (!V) return; W.apart = W.apart || {}; W.apart[[A.id, V.id].sort().join('|')] = W.day + n; A.stayAway = { pid: V.id, name: V.name, until: W.day + n }; };
  const service = (n) => { A.service = { until: W.day + n, crime: C.id }; startService(A); };
  switch (key) {
    case 'prison': cell(99999, { untilReal: Date.now() + YEAR_MS, nextHearing: Date.now() + PAROLE_GAP, hearingGap: PAROLE_GAP }); text = 'one real year in the cell under Glimmer Hall, with a parole hearing every month'; break;
    case 'life': cell(99999, { untilReal: Date.now() + 50 * YEAR_MS, life: true, nextHearing: Date.now() + 3 * PAROLE_GAP, hearingGap: 3 * PAROLE_GAP }); text = 'life in the cell under Glimmer Hall. Parole hearings every three months'; break;
    case 'exile': text = 'exile. They leave on the ferry and may never come back'; break;
    case 'cell': cell(K.tier <= 1 ? 1 : days); probation(days * 2); if (['assault', 'arson', 'poison'].includes(C.type)) { A.program = { kind: 'anger', left: 3 }; stayAway(14); } text = `${K.tier <= 1 ? 1 : days} days in the cell${repeat ? ' (plus 2 for breaking probation)' : ''}, then probation${A.program ? ', anger management, and staying away from ' + (V?.name || 'the victim') : ''}`; break;
    case 'harsh': cell(days * 2); probation(days * 2); if (V && K.tier >= 2) stayAway(28); text = `${days * 2} days in the cell, then probation`; break;
    case 'probation': probation(days * 3); A.program = { kind: 'anger', left: 4 }; stayAway(21); text = `probation with an ankle monitor, anger management, and staying away from ${V?.name || 'the victim'}`; break;
    case 'fired': { const was = A.job ? JOBS[A.job].short : null; A.jobBeforeFired = A.job; A.job = null; probation(days * 2); text = `losing their job${was ? ` as a ${was}` : ''}, paying everything back, and probation`; break; }
    case 'service': service(K.tier >= 2 ? 5 : 3); if (K.tier >= 2) probation(8); text = `${K.tier >= 2 ? 5 : 3} days of community service${K.tier >= 2 ? ' and probation' : ''}`; break;
    case 'apology': probation(4); A.owesApology = V ? V.id : 'town'; text = 'a public apology and four days of probation'; break;
    default: text = 'paying it back, with a warning'; break;
  }
  if (C.restitution) text = `${text}, plus ${C.restitution} coins to make it right`;
  C.sentence = text; C.sentenceKey = key;
  A.record.push({ day: W.day, crime: K.label, sentence: key });
  A.remorse = A.remorse ?? (C.culprit === A.id ? clamp(0.25 + personaOf(A).warmth * 0.3 + rand() * 0.3, 0, 1) : 0);
  L.push(jline(`${A.name}, the court sentences you to ${text}. Hoo.`, 'gavel'));
  if (key === 'apology' && V) { L.push(pline(A.id, C.culprit === A.id ? `${V.name}… I'm sorry. I really am.` : `I'm sorry for what happened to you, ${V.name}. But I didn't do it.`)); L.push(pline(V.id, pick(['…Okay.', 'I heard you.', "Words are easy. We'll see."]))); if (C.culprit === A.id) feel(V, A, 1, true); }
  L.push(pline(A.id, C.culprit === A.id ? pick(['…I deserve this.', 'This is not over.', 'I just wanted…', '…']) : pick(['I DIDN\'T DO IT! You are making a mistake!', 'Somebody help me. Please. I didn\'t do this.', 'You got the wrong person!']), null, { emote: C.culprit === A.id ? '💧' : '💢' }));
  for (const q of W.people) if (q !== A && adult(q)) { remember(q, `${A.name} was found guilty of ${K.label.toLowerCase()} and got ${text}.`, 2, 'verdict', A.name); if (fscore(q, A) > 2 && rand() < 0.5) feel(q, A, -1.5, true); }
  remember(A, `I was found guilty of ${K.label.toLowerCase()} and got ${text}. ${C.wrong ? "I DIDN'T DO IT." : 'It is over.'}`, 4, 'convicted');
  diary(`⚖ <b>${esc(A.name)}</b>'s sentence for ${esc(K.label.toLowerCase())}: ${esc(text)}.`);
  townRecord('verdict', [A.id, C.victim], `${A.name} was found guilty of ${K.label.toLowerCase()}${!C.byCreator && C.jury ? ` (jury ${C.jury})` : ' by the Creator'} and got ${text}.`);
  if (key === 'exile') setTimeout(() => exileResident(A, C), 2500);
  markDirty();
  return L;
}
function exileResident(p, C) {
  if (!W.people.includes(p)) return;
  crimeState().exiled = [...(crimeState().exiled || []), { id: p.id, name: p.name, day: W.day, crime: CRIME_TYPES[C.type].label }];
  if (typeof depart === 'function' && RT.db && typeof OTHER !== 'undefined') { depart(p, 'I was banished.'); return; }
  W.people.splice(W.people.indexOf(p), 1);
  const m = meshes.get(p.id); if (m) { scene.remove(m.root); m.tag.remove(); meshes.delete(p.id); }
  for (const q of W.people) { const f = q.feelings[p.id]; if (f && Math.abs(f.score) >= 3) remember(q, `${p.name} was banished from the island. ${f.score > 0 ? 'I never got to say goodbye.' : 'Good.'}`, 3, 'exiled', p.name); }
  diary(`⛴ <b>${esc(p.name)}</b> was banished. They left on the ferry and won't be back.`);
  if (typeof Sound !== 'undefined') try { Sound.horn(); } catch (e) {}
  markDirty();
}
function startService(p) {
  if (!onService(p) || p.task || typeof autoSpot !== 'function') return;
  const sp = autoSpot(); if (!sp) return;
  setTask(p, 'service', Math.hypot(sp[0] - DT.x, sp[1] - DT.z) < DT.R ? 'downtown' : 'plaza', [sp[0] + 1.2, sp[1]], { x: sp[0], z: sp[1] });
}

// ---- every morning: service, programs, probation ending, parole hearings ----
function sentenceMorning() {
  for (const p of W.people) {
    if (onService(p) && p.grow >= 1) startService(p);
    if (p.service && W.day > p.service.until) { remember(p, 'I finished my community service.', 2, 'served'); p.service = null; }
    if (p.program?.left > 0 && !jailed(p) && rand() < 0.7) {
      p.program.left--;
      remember(p, pick(['Went to anger management. We practiced breathing. It helped a little.', 'Anger management again. I talked about that night. It was hard.', 'At anger management they asked what I would do differently. I had an answer this time.']), 2, 'program');
      p.remorse = clamp((p.remorse || 0) + 0.12, 0, 1);
      if (!p.program.left) { diary(`🌱 <b>${esc(p.name)}</b> finished anger management.`); p.program = null; }
    }
    if (p.probation && W.day > p.probation.until) { remember(p, 'My probation is over. The ankle monitor is off.', 3, 'probationOver'); diary(`🔓 <b>${esc(p.name)}</b>'s probation ended.`); p.probation = null; }
    if (p.stayAway && W.day > p.stayAway.until) p.stayAway = null;
    if (jailed(p)) {
      p.remorse = clamp((p.remorse || 0) + (p.jail.crime && crimeById(p.jail.crime)?.culprit === p.id ? 0.015 : 0), 0, 1);
      if (p.jail.nextHearing && Date.now() >= p.jail.nextHearing && !CUT.queue.some((q) => q.kind === 'parole')) paroleCut(p);
    }
  }
}
// ---- the parole hearing ----
function lovedOneOf(C) { return C?.victim ? W.people.filter((q) => adult(q) && !jailed(q) && (q.feelings[C.victim]?.score || 0) >= 3).sort((a, b) => (b.feelings[C.victim].score) - (a.feelings[C.victim].score))[0] : null; }
function paroleCut(p) {
  if (!jailed(p) || !p.jail.nextHearing) return 'There is nothing to hear.';
  const C = crimeById(p.jail.crime), K = C ? CRIME_TYPES[C.type] : { label: 'their crime' }, lo = lovedOneOf(C), guilty = C && C.culprit === p.id;
  p.jail.nextHearing = Date.now() + (p.jail.hearingGap || PAROLE_GAP);
  const rem = p.remorse || 0, L = [];
  L.push(jline(`Order. Hoo. This is the parole hearing of ${p.name}, serving time for ${K.label.toLowerCase()}${C?.victimName ? ` in the death of ${C.victimName}` : ''}.`, 'gavel'));
  L.push(pline(p.id, !guilty ? pick(["I'll say it again. I didn't do it. I've lost all this time for nothing.", "I don't know what you want me to say. I'm innocent."]) : rem > 0.6 ? pick([`I think about ${C?.victimName || 'what I did'} every single day. I'm so sorry.`, "I'm not the same person who did that. I know sorry doesn't bring anyone back."]) : rem > 0.35 ? pick(["I made a mistake. A huge one. I'm trying to be better in here.", "I want to go home. I know I don't deserve it yet."]) : pick(['I did my time. Let me out.', "Everyone makes mistakes. Mine was just bigger."]), null, { emote: rem > 0.6 ? '💧' : null }));
  if (lo) { const warm = personaOf(lo).warmth; L.push(pline(lo.id, warm > 0.4 && rem > 0.5 ? pick([`I don't know if I can forgive you. But I don't want to carry this forever either.`, `${C?.victimName} wouldn't want me to hate you. I'm trying.`]) : pick([`${C?.victimName} is gone. Why should you get to walk around?`, `Keep ${p.name} away from us. Please.`, 'Every time I see that fountain I think of them. No.']), null, { emote: '💧' })); }
  const det = detectiveOf(); if (det && det.id !== p.id) L.push(pline(det.id, rem > 0.5 ? `For the record, ${p.name} has kept their head down in there. No trouble.` : `${p.name} hasn't shown much remorse, if you ask me.`));
  const odds = (guilty ? rem : 0.55) - (lo && personaOf(lo).warmth < 0.2 ? 0.2 : 0) - (p.jail.life ? 0.25 : 0);
  L.push(jline('Creator, the board needs your decision. Hoo.'));
  L[L.length - 1].choice = { prompt: `Parole for ${p.name}?`, options: [['grant', 'Grant parole'], ['deny', 'Deny, for now'], ['board', 'Let the parole board decide']], timeout: 30, fallback: 'board',
    pick: (k) => { const yes = k === 'grant' || (k === 'board' && odds + (rand() - 0.5) * 0.3 > 0.45); return paroleResult(p, C, yes, lo); } };
  queueCut({ kind: 'parole', icon: '🕊', title: `Parole Hearing: ${p.name}`, sub: K.label, music: 'trial', lines: L, stage: courtStage, unstage: courtUnstage, shot: courtShot, trial: { kind: 'parole', def: p.id, pros: det?.id || null, witness: lo?.id || null, jury: [], gallery: onlookers([p.id, lo?.id, det?.id].filter(Boolean), 6) } });
  return 'The parole board is gathering.';
}
function paroleResult(p, C, yes, lo) {
  const L = [];
  if (yes) {
    L.push(jline(`Parole granted. ${p.name} will go home on probation, with an ankle monitor. Hoo.`, 'gavel'));
    releaseFromJail(p, 'parole'); p.probation = { until: W.day + 60, crime: C?.id }; if (lo) { W.apart = W.apart || {}; W.apart[[p.id, lo.id].sort().join('|')] = W.day + 30; }
    L.push(pline(p.id, pick(['Thank you. I won\'t waste it.', '…I get to go home?', 'I don\'t know how to face everyone.']), null, { emote: '💧' }));
    if (lo) L.push(pline(lo.id, pick(['…', 'I hope you meant every word.', "I can't watch this."])));
    for (const q of W.people) if (q !== p && adult(q)) remember(q, `${p.name} got parole and came home.`, 2, 'parole', p.name);
  } else {
    L.push(jline(`Parole denied. ${p.name} stays in the cell. The board will hear the case again later. Hoo.`, 'gavel'));
    L.push(pline(p.id, pick(['…Okay.', 'Of course.', 'I understand.']), null, { emote: '💧' }));
    remember(p, 'My parole was denied.', 3, 'paroleDenied');
  }
  markDirty();
  return L;
}
// ---- words for the minds, so they know where someone stands ----
function recordContext(p) {
  const r = p.record || [], bits = [];
  if (jailed(p)) bits.push(p.jail.untilReal ? `You are in the cell under Glimmer Hall for ${p.jail.label.toLowerCase()}. It is a long sentence.` : `You are in the cell under Glimmer Hall for ${p.jail.label.toLowerCase()}.`);
  if (onProbation(p)) bits.push('You are on probation and wear an ankle monitor. Everyone can see it.');
  if (onService(p)) bits.push('You are doing community service in an orange vest.');
  if (p.stayAway && W.day <= p.stayAway.until) bits.push(`A court order says you must stay away from ${p.stayAway.name}.`);
  if (p.program?.left) bits.push('You go to anger management sessions.');
  if (r.length && !jailed(p)) bits.push(`You have a record: ${r.map((x) => x.crime.toLowerCase()).join(', ')}.`);
  return bits.length ? `\nTHE LAW AND YOU: ${bits.join(' ')}` : '';
}
function compensateWrong(p, C) {
  const days = Math.max(1, W.day - (C.verdictDay || W.day)), pay = Math.min(60, 5 + days * 2);
  p.coins += pay; p.probation = null; p.service = null; p.program = null; p.stayAway = null;
  const lab = CRIME_TYPES[C.type].label;
  p.record = (p.record || []).filter((r) => !(r.crime === lab && r.day >= (C.verdictDay || 0) - 1));
  for (const q of W.people) if (q !== p && adult(q) && rand() < 0.6) feel(q, p, 1, true);
  remember(p, `The town paid me ${pay} coins for the time I lost. It doesn't give the time back.`, 3, 'compensated');
  diary(`💰 The town paid <b>${esc(p.name)}</b> ${pay} coins for being wrongly convicted.`);
}
function jailLeftText(p) {
  const J = p.jail; if (!J) return '';
  if (J.remand) return 'waiting for trial';
  if (J.life) return 'life';
  if (J.untilReal) { const d = Math.max(0, Math.ceil((J.untilReal - Date.now()) / 864e5)); return `${d} real day${d === 1 ? '' : 's'} left`; }
  return `${plural(J.until - W.day, 'day')} left`;
}
// AI lines about a case are only kept if they don't state facts: the game states the facts itself
const FACT_WORDS = /(\d|\b(thread|hair|strand|footprints?|prints?|fibers?|silhouette|shadow|ears|shoes?|boots|shirt|dress|seen|saw|witness|alibi|exhibit|midnight|o'clock|knife|weapon|blood|poison|stairs|pier|beach|garden|park|tower|caf[eé]|door|lock|window|bucket|lamp|tide|home)\b)/i;
function factSafe(text, allowedIds) {
  const low = String(text || '').toLowerCase(); if (!low || FACT_WORDS.test(low)) return false;
  const colors = [...Object.keys(COLORS), ...Object.keys(HAIR_COLORS), 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'brown', 'pink', 'grey', 'silver', 'gold'];
  if (colors.some((c) => new RegExp(`\\b${c}\\b`).test(low))) return false;
  const ok = new Set(allowedIds.filter(Boolean).map((id) => String(nameOf(id)).toLowerCase()));
  for (const q of W.people) { const n = q.name.toLowerCase(); if (n.length > 2 && new RegExp(`\\b${n}\\b`).test(low) && !ok.has(n)) return false; }
  return true;
}
function sentencesBoot() {
  W.added = W.added || {}; if (W.added.sentences1) return; W.added.sentences1 = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'When someone is found guilty now, you pick the sentence. Small crimes get community service in an orange vest, a public apology, or a warning. Bigger ones get time in the cell and probation with an ankle monitor. Violent ones come with anger management and an order to stay away from the victim. Murder means a real year in the cell with a parole hearing every month, life, or exile from the island. People who get convicted by mistake are paid back when the truth comes out. I also stopped the AI from making up facts in trials: the game states every clue itself now.', 'sentences and parole');
}
