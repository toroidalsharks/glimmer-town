// ============================================================
// FLINGS: once in a long while, someone in a couple cheats and the town finds out
// ============================================================
// Everyone dates one person at a time. Rarely, a resident who is cooling on their partner
// starts secretly seeing someone else. W.fling = { a, b, q, day, found } where a is the one
// cheating, b is who they're seeing and q is a's partner. Within a few days someone notices,
// word gets around, and q breaks up with a (or asks for a divorce). Real people (Mili, Red,
// Tim, custom and invited residents) are never any of the three.
const FLING_GAP = 21;       // game days between flings, at least
const FLING_CHANCE = 0.05;  // per morning, once the gap has passed and someone fits
const FLING_FOUND_BY = 5;   // days until it comes out, at most
const flingAble = (p) => !!p && p.grow >= 1 && !p.visitor && !p.away && !p.noRomance && !p.isClaude && !isRealish(p) && !guarded(p) && !(typeof jailed === 'function' && jailed(p));
function flingPick() {
  const busy = W.wedding ? [W.wedding.a, W.wedding.b] : [];
  const L = [];
  for (const a of W.people) {
    const q = a.partner && person(a.partner);
    if (!q || a.separated || busy.includes(a.id) || !flingAble(a) || !flingAble(q) || fscore(a, q) >= 6) continue;
    for (const b of W.people) {
      if (b === a || b === q || b.partner || !flingAble(b) || related(a, b)) continue;
      if (fscore(a, b) >= 6 && fscore(b, a) >= 4) L.push({ a, b, q });
    }
  }
  return L.length ? pick(L) : null;
}
function flingEnd() { W.fling = null; markDirty(); }
function flingMorning() {
  if (MODE !== 'host') return;
  const F = W.fling;
  if (!F) {
    if (W.day - (W.flingDay ?? -FLING_GAP) < FLING_GAP || rand() > FLING_CHANCE) return;
    const f = flingPick(); if (!f) return;
    const { a, b, q } = f;
    W.fling = { a: a.id, b: b.id, q: q.id, day: W.day, found: false }; W.flingDay = W.day;
    remember(a, `I've been secretly seeing ${b.name} behind ${q.name}'s back. Nobody can know.`, 3, 'secretFling', b.name);
    remember(b, `${a.name} and I have been seeing each other in secret, even though ${a.name} is with ${q.name}.`, 3, 'secretFling', a.name);
    diary(`🤫 <b>${esc(a.name)}</b> keeps slipping away to see <b>${esc(b.name)}</b>. ${esc(q.name)} doesn't know.`);
    markDirty();
    return;
  }
  const a = person(F.a), b = person(F.b), q = person(F.q);
  // it fizzles on its own if the couple already split or someone left
  if (!a || !b || !q || a.partner !== q.id || q.partner !== a.id) return flingEnd();
  if (F.found) {
    // a divorce went to Glimmer Hall, which decides from here
    if (q.separated) return flingEnd();
    // the breakup can get cut off by nightfall; keep q set on it until it happens
    q.breakWith = a.id; q.breakWhy = `You found out ${a.name} has been secretly seeing ${b.name}.`;
    return;
  }
  if (W.day - F.day < 1 || (W.day - F.day < FLING_FOUND_BY && rand() > 0.35)) return;
  F.found = true;
  const others = W.people.filter((w) => w !== a && w !== b && w !== q && w.grow >= 1 && !w.visitor && !w.away);
  const friends = others.filter((w) => fscore(w, q) >= 3);
  const w = rand() < 0.4 ? null : pick(friends.length ? friends : others) || null;
  if (w) {
    remember(w, `I saw ${a.name} with ${b.name}, and it wasn't just friends. I told ${q.name}.`, 2, 'sawFling', a.name);
    remember(q, `${w.name} told me they saw ${a.name} with ${b.name}. ${a.name} has been cheating on me.`, 3, 'heartbreak', a.name);
    feel(q, w, 1, true);
    const hearer = pick(others.filter((x) => x !== w));
    if (hearer) rumorStart(w, hearer, a, `${a.name} was seeing ${b.name} behind ${q.name}'s back.`, -1);
  } else remember(q, `I caught ${a.name} with ${b.name}. ${a.name} has been cheating on me.`, 3, 'heartbreak', a.name);
  feel(q, a, -5, true); feel(q, b, -3, true);
  remember(a, `${q.name} found out about ${b.name}.`, 3, 'caught', q.name);
  remember(b, `${q.name} found out about ${a.name} and me.`, 2, 'caught', q.name);
  for (const x of others) if (x !== w && rand() < 0.4) remember(x, `I heard ${a.name} was seeing ${b.name} behind ${q.name}'s back.`, 1, 'gossipLove', a.name);
  q.breakWith = a.id; q.breakWhy = `You found out ${a.name} has been secretly seeing ${b.name}.`;
  diary(`🤫 <b>${esc(q.name)}</b> found out <b>${esc(a.name)}</b> has been seeing <b>${esc(b.name)}</b> behind their back${w ? `. ${esc(w.name)} saw them together` : ''}.`);
  townRecord('cheating', [a.id, b.id, q.id], `${q.name} found out ${a.name} was secretly seeing ${b.name}.`);
  markDirty();
}
// old saves: a confession could land on someone who had just started dating, leaving the
// first partner still pointing at them. Anyone whose partner doesn't point back is single.
function loveRepairBoot() {
  W.added = W.added || {}; if (W.added.loveOneToOne) return; W.added.loveOneToOne = true;
  const fixed = [];
  for (const p of W.people) {
    if (!p.partner) continue;
    const q = person(p.partner);
    if (q && q.partner === p.id) continue;
    p.partner = null; p.married = p.separated = false; p.datingSince = undefined;
    if (q) { p.exes = [...(p.exes || []), q.name].slice(-5); remember(p, `${q.name} and I aren't together anymore. They're with someone else now.`, 3, 'breakup', q.name); fixed.push(`${p.name} and ${q.name}`); }
  }
  if (W.wedding) { const a = person(W.wedding.a), b = person(W.wedding.b); if (!a || !b || a.partner !== b.id) W.wedding = null; }
  if (typeof logUpdate === 'function') logUpdate('build', `Everyone dates one person at a time now. A confession could land on someone who had just started seeing someone else, so they looked like they were dating two people. ${fixed.length ? `I untangled it: ${fixed.join(', ')} aren't together anymore.` : 'Nobody in town was tangled up.'} Once in a long while someone might still cheat, and the town tends to find out.`, 'one partner each');
}
