// ============================================================
// CASE CLARITY: murders on a real-world calendar, an acting detective
// when the real one is grieving, misleading clues that get ruled out,
// labels that say how much to trust each clue, and a briefing scene
// ============================================================
const YEAR_MS = 365 * 864e5;
const MURDER_PACES = { real: 'About once a real year', game: 'Once a game year (every couple of hours)', never: 'Never' };
function murderDue(S, MY) {
  const pace = S.murderPace || 'real';
  if (pace === 'never') return false;
  if (pace === 'game') return !MY.done && W.day >= MY.day;
  return S.nextMurderAt != null && Date.now() >= S.nextMurderAt;
}
function murderCommitted(S, MY) { MY.done = true; } // commitMurder itself sets the next real-world date
const listNames = (a) => (a.length <= 1 ? a[0] || 'nobody' : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

// ---- who works the case ----
function grievingFor(p, C) { return !!(p && C.victim && ((p.feelings[C.victim]?.score || 0) >= 3 || /grieving/.test(p.health?.low?.why || ''))); }
function caseDetective(C, det) {
  if (C.acting) { const a = person(C.acting); if (a && adult(a) && !jailed(a)) return a; }
  if (!det || C.tier < 2 || !grievingFor(det, C)) return det;
  const a = W.people.filter((p) => adult(p) && !jailed(p) && p.id !== det.id && p.id !== C.culprit && p.id !== C.victim && !C.suspects.includes(p.id) && !grievingFor(p, C))
    .sort((x, y) => (personaOf(y).order + (y.body.openness ?? 0)) - (personaOf(x).order + (x.body.openness ?? 0)))[0];
  if (!a) return det;
  C.acting = a.id;
  const label = CRIME_TYPES[C.type].label.toLowerCase();
  remember(det, `I couldn't work the ${label} case. I was too close to ${C.victimName}. ${a.name} took it over.`, 3, 'grief', a.name);
  remember(a, `I'm the acting detective on the ${label} case while ${det.name} grieves.`, 3, 'detective', det.name);
  diary(`🔎 <b>${esc(det.name)}</b> is too shaken by ${esc(C.victimName || 'the victim')}'s death to work the case. <b>${esc(a.name)}</b> is filling in as acting detective.`);
  markDirty();
  return a;
}

// ---- misleading clues get a follow-up that rules them out ----
const PHYS_NOUN = { shirt: 'thread', hair: 'hair', shoe: 'footprints', build: 'marks', ears: 'silhouette' };
function debunkFor(C, c) {
  if (c.genuine !== false || c.debunkedBy || c.clears) return null;
  if (c.kind === 'witness') { const w = person(c.witness); return `${w ? w.name : 'The witness'} admits it was dark and they only saw them for a second. They aren't sure about the ${c.attr === 'hair' ? 'hair' : 'clothes'} anymore.`; }
  if (c.attr) {
    const owner = C.suspects.find((pid) => pid !== C.culprit && C.traits[pid]?.[c.attr] === c.val);
    return owner ? `The ${PHYS_NOUN[c.attr]} turned out to be from ${nameOf(owner)}, who walked past earlier that day. It has nothing to do with what happened.` : `The ${PHYS_NOUN[c.attr]} turned out to be old. It was there before any of this happened.`;
  }
  if (c.kind === 'item' && C.planted) return null; // the broken lock already covers a planted item
  return null;
}
function withDebunks(C, clues) {
  const out = clues.slice();
  for (const c of clues) {
    const text = debunkFor(C, c); if (!text) continue;
    const d = { id: 'd' + c.id, found: false, kind: 'debunk', icon: '✖', text, debunks: c.id, genuine: true };
    c.debunkedBy = d.id;
    const at = out.indexOf(c), firstOpen = out.findIndex((x) => !x.found);
    const pos = Math.min(out.length, Math.max(at + 3, firstOpen < 0 ? out.length : firstOpen));
    out.splice(pos, 0, d);
  }
  return out;
}
function clueLabel(c) {
  if (c.ruledOut) return ['ruled out', 'bad'];
  if (c.kind === 'debunk') return ['update', 'good'];
  if (c.clears) return ['clears someone', 'good'];
  if (c.kind === 'motive') return ['rumor', ''];
  if (c.kind === 'witness') return ['witness, could be wrong', ''];
  if (c.kind === 'alibi') return ['alibi broken', 'gold'];
  return ['evidence', 'gold'];
}
function evidenceDots(C, pid) {
  const e = Math.max(0, evidenceAgainst(C, pid));
  const n = Math.min(5, Math.round(e));
  return '●'.repeat(n) + '○'.repeat(5 - n);
}

// ---- the briefing: the detective walks you through the case ----
function briefingCut(C, auto) {
  const det = caseDetective(C, detectiveOf()); if (!det) return 'There is no detective to brief you.';
  const K = CRIME_TYPES[C.type], found = C.clues.filter((c) => c.found);
  const cast = castFrom([det.id, ...C.suspects.filter((id) => person(id) && !jailed(person(id)))], 5);
  const L = [nline(`${det.name}${C.acting ? ', the acting detective,' : ''} walks you through the ${K.label.toLowerCase()} case${C.victimName ? `: what happened to ${C.victimName}` : ''}.`)];
  if (!found.length) L.push(pline(det.id, "We don't have anything solid yet. Give me a day."));
  for (const c of found) {
    if (c.kind === 'debunk') continue;
    L.push(pline(det.id, c.text, c.kind === 'alibi' ? 'takethat' : null));
    if (c.ruledOut) { L.push(pline(det.id, pick(['Forget that one. It turned out to mean nothing.', "That one was a dead end. Cross it off."]))); continue; }
    const fits = fitsClue(C, c).map(nameOf);
    L.push(pline(det.id, c.clears ? `That clears ${nameOf(c.pid)}.` : c.kind === 'motive' ? pick(['That\'s just talk around town, though. A reason, not proof.', 'A reason to do it. Not proof they did.']) : c.kind === 'witness' ? (fits.length ? `A witness can be wrong, but it fits ${listNames(fits)}.` : 'Nobody on our list fits that. Strange.') : fits.length ? `That fits ${listNames(fits)}.` : "That doesn't fit anyone on our list."));
  }
  const ranked = C.suspects.map((id) => [id, evidenceAgainst(C, id)]).sort((a, b) => b[1] - a[1]);
  const [top, second] = ranked;
  if (found.length >= 2 && top && top[1] - (second?.[1] ?? 0) >= 1) L.push(pline(det.id, `Right now it points at ${nameOf(top[0])}. If I had to bet, that's who I'd look at.`, 'shock'));
  else if (ranked.length) L.push(pline(det.id, `It could still be ${listNames(ranked.slice(0, 2).map((x) => nameOf(x[0])))}. I want more before anyone gets accused.`));
  const left = C.clues.filter((c) => !c.found).length;
  L.push(nline(left ? `${left} clue${left === 1 ? ' is' : 's are'} still out there. Searching the scene or questioning suspects can turn them up.` : 'Every clue has been found. It\'s time to accuse someone, or let the detective decide.'));
  queueCut({ kind: 'briefing', crimeId: C.id, icon: '🔎', title: auto ? 'The Case So Far' : 'Case Briefing', sub: `${K.label}${C.victimName ? ` · ${C.victimName}` : ''}`, music: 'mystery', lines: L,
    stage: (S) => townStage(S, [C.where.x, C.where.z], cast, C.where.key === 'pier' ? { r: 2.2, arc: 1.2 } : { r: 2.6 }) });
  return `${det.name} is on the way.`;
}
// halfway through a serious case, the detective sums it up without being asked
function maybeAutoBriefing(C) {
  if (C.tier < 2 || C.autoBriefed || C.status !== 'open') return;
  if (C.clues.filter((c) => c.found && c.kind !== 'debunk').length >= 3) { C.autoBriefed = true; briefingCut(C, true); }
}

function crimeClarityBoot() {
  const S = crimeState();
  S.murderPace = S.murderPace || 'real';
  if (S.nextMurderAt == null) {
    const had = S.list.some((C) => C.type === 'murder');
    S.nextMurderAt = Date.now() + (had ? YEAR_MS : (30 + rand() * 300) * 864e5);
  }
  for (const C of S.list) {
    if (C.v2 || !['open', 'charged', 'trial'].includes(C.status)) continue;
    C.v2 = true;
    C.clues = withDebunks(C, C.clues);
    for (const c of C.clues) if (c.found && c.debunks) { const t = C.clues.find((x) => x.id === c.debunks); if (t) t.ruledOut = true; }
  }
  W.added = W.added || {}; if (W.added.caseClarity) return; W.added.caseClarity = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'Murders were happening once a game year, which is only a couple of hours in real life. Now there\'s about one murder per real year (you can change that in the Court tab). If the detective is too upset to work a case, someone else steps in as acting detective. Misleading clues now get a follow-up that rules them out, every clue says how far to trust it, and you can call the detective for a briefing that walks through the whole case.', 'clearer cases');
}
