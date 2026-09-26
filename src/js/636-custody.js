// ============================================================
// CUSTODY: whoever is charged waits for their trial in the cell under
// Glimmer Hall, and a trial that got lost (the box reloaded while it was
// queued) is held again instead of leaving the accused free forever
// ============================================================
function holdForTrial(A, C) {
  if (!A || !C || A.away) return;
  if (A.jail && !A.jail.remand) return; // already serving something
  A.jail = { until: W.day + 9999, crime: C.id, label: `charged with ${CRIME_TYPES[C.type].label.toLowerCase()}`, remand: true, since: W.day };
  A.task = { kind: 'jail', phase: 'do' };
  if (!A.today.some((m) => m.tag === 'remand')) remember(A, 'They are holding me in the cell under Glimmer Hall until my trial.', 3, 'remand');
}
function endRemand(A) {
  if (!A?.jail?.remand) return;
  A.jail = null;
  if (A.task?.kind === 'jail') { A.task = null; A.state = 'free'; A.busyUntil = 0; A.inside = false; const s = TOWN.hall.spot; A.x = s[0]; A.z = s[1] + 1.5; }
}
const trialWaiting = (C) => trialsQueued.has(C.id) || CUT.queue.some((q) => q.crimeId === C.id && (q.kind === 'trial' || q.kind === 'arrest')) || (CUT.live && CUT.live.crimeId === C.id && ['trial', 'arrest'].includes(CUT.live.kind));
// morning (and boot): everyone charged is in custody, lost trials get held, stray holds get cleared
function custodyCheck(atBoot) {
  const S = crimeState();
  for (const C of S.list) {
    if (!['charged', 'trial'].includes(C.status)) continue;
    const A = person(C.accused);
    if (!A) { C.status = C.clues.some((c) => !c.found) ? 'open' : 'cold'; C.accused = null; continue; }
    holdForTrial(A, C);
    if (!trialWaiting(C) && (atBoot || W.day - (C.chargedDay ?? W.day) >= 1)) { C.status = 'charged'; crimeTrialNow(C); }
  }
  for (const p of W.people) {
    if (!p.jail?.remand) continue;
    const C = crimeById(p.jail.crime);
    if (C && ['charged', 'trial'].includes(C.status) && C.accused === p.id) continue;
    // the verdict came in but the sentence never got picked (the box reloaded): use the default
    if (C && C.status === 'closed' && C.convicted === p.id && !C.sentence && typeof applySentence === 'function') { endRemand(p); applySentence(C, p, sentenceOptions(C, p)[0].key); continue; }
    endRemand(p);
  }
}
function custodyBoot() {
  custodyCheck(true);
  W.added = W.added || {}; if (W.added.custody) return; W.added.custody = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'Anyone charged with a crime now waits for their trial in the cell under Glimmer Hall instead of walking around town. If a trial got lost because the box reloaded in the middle of it, it gets held again.', 'custody before trial');
}
