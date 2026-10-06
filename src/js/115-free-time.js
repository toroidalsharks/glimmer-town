// ============================================================
// FREE TIME: work is a shift, not the whole day, and people go places with the rest of it
// ============================================================
// A shift runs about four island hours from when they clock in (doctors and therapists keep
// their clinic hours). Everyone gets a day off now and then. With the time left over, residents
// wander off somewhere they haven't been in a while: the pier, the beach, the park, downtown,
// the city, a landmark. They notice things there, and sometimes they keep going.
const SHIFT_KEEP = ['doctor', 'therapist'];
function workShiftEnd(p) {
  const end = workUntil(p.job);
  if (SHIFT_KEEP.includes(p.job)) return end;
  const T = p.task || {};
  if (!Number.isFinite(T.shiftEnd)) T.shiftEnd = Math.min(end, W.t + 0.15 + rand() * 0.04);
  return T.shiftEnd;
}
// roughly one day in five off, a different day for each person
const dayOff = (p) => !!p.job && !SHIFT_KEEP.includes(p.job) && (W.day + (p.room >= 0 ? p.room : 0)) % 5 === 0;
function dayOffPlan(p) {
  if (!dayOff(p) || p.workedToday || W.t >= 0.24) return false;
  p.workedToday = true; p.offDay = W.day;
  if (rand() < 0.6) bubble(p, pick(['Day off!', 'No work today. What do I even do with myself?', 'Sleeping in was the plan. Oh well.', 'Free day. Finally.']), 2.4);
  remember(p, 'Had the day off work.', 1, 'dayoff');
  return false; // the rest of plan() decides what they do with it
}
// where they could go; whatever they haven't been to lately wins
function exploreSpots() {
  const ring = (cx, cz, r0, r1) => { const a = rand() * 6.28, r = r0 + rand() * (r1 - r0); return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; };
  const out = [
    ['plaza', ring(0, 0, FOUNTAIN_R + 1.2, FOUNTAIN_R + 7)],
    ['downtown', ring(DT.x, DT.z, 4.5, 9.5)],
    ['pier', [(rand() - 0.5) * 1.6, 31 + rand() * 7]],
    ['beach', ring(BEACH[0], BEACH[1], 0, 6)],
    ['park', jitter(TOWN.park.spot, 6)],
    ['garden', jitter(TOWN.garden.spot, 5)],
  ];
  let c = null; for (let i = 0; i < 10 && !c; i++) c = cityStroll();
  if (c && TOWN[c[0]]) out.push(c);
  if ((W.placed || []).length) { const ps = placeStrollSpot(); if (ps) out.push(['plaza', ps.spot, ps.name]); }
  return out.filter(([pl, sp]) => TOWN[pl] && routePointOk(sp));
}
function explorePlan(p) {
  if (p.visitor || isBaby(p) || stageOf(p) === 'toddler' || W.t >= homeByT(p) - 0.03) return false;
  const seen = p.been = p.been || {};
  const opts = exploreSpots().filter(([pl]) => pl !== p.at);
  if (!opts.length) return false;
  opts.sort((a, b) => (seen[a[0]] ?? -99) - (seen[b[0]] ?? -99) + (rand() - 0.5) * 2);
  const [pl, sp, what] = opts[0];
  setTask(p, 'stroll', pl, sp, { explore: true, what: what || null });
  return true;
}
const EXPLORE_SAY = {
  pier: ['The water is so clear today.', 'I could watch the boats all day.', 'Smells like salt and fish. I love it.'],
  beach: ['Sand in my shoes already.', 'Found a shell!', 'The waves are loud today.'],
  park: ['This bench has my name on it.', 'Look at that tree.', 'So many dogs. Wait, are those dogs?'],
  garden: ['Something new is blooming.', 'It smells amazing over here.', 'Who planted these?'],
  plaza: ['The fountain never gets old.', 'Busy today.', 'People watching. Best hobby.'],
  downtown: ['I never come down here enough.', 'Is that shop new?', 'Downtown has a buzz to it.'],
};
function exploreArrive(p) {
  const T = p.task; if (!T?.explore) return;
  const seen = p.been = p.been || {}, first = seen[p.at] != null && W.day - seen[p.at] >= 5, place = T.what || TOWN[p.at]?.name || 'town';
  seen[p.at] = W.day;
  if (first && rand() < 0.7) bubble(p, pick([`I haven't been out to ${place} in ages.`, `Forgot how nice ${place} is.`, 'Huh. I should come here more.']), 2.6);
  else if (rand() < 0.45) bubble(p, pick(EXPLORE_SAY[p.at] || ['Nice out here.', 'I needed this walk.', 'Where to next?']), 2.4);
  if (rand() < 0.3) remember(p, `${first ? 'Went back out to' : 'Wandered over to'} ${place}${W.weather !== 'clear' ? ` in the ${W.weather}` : ''}.`, 1, 'explore');
  p.busyUntil = now + (3 + rand() * 6) * ts();
  p.keepGoing = rand() < 0.45; // sometimes they keep going
}
