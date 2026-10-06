// ============================================================
// DARK NIGHTS: a murder is never scheduled and nobody is picked at random. It can only grow
// out of the town's own history: a feud that has run for weeks, kept raw by real fights and
// slights. Even then the would-be culprit gets a night where they can turn back, and most do.
// The yearly cap (murderDue in 635) still applies; a quiet year is a fine year.
// ============================================================
const GRUDGE_DAYS = 21;
const GRUDGE_HURTS = ['fight', 'gotMean', 'heartbreak', 'textMean', 'jealous', 'suedBy', 'subtweeted', 'stoodUp', 'snub', 'refusedMine', 'unfair'];
const GRUDGE_MENDS = ['gotApology', 'apologized', 'gotKind', 'hug', 'thawed', 'gaveKind'];
// every night: who holds a deep grudge against whom, since when, and how many real hurts keep it going
function grudgeScan() {
  const S = crimeState(), G = (S.grudges = S.grudges || {}), ppl = W.people.filter(adult);
  for (const p of ppl) for (const q of ppl) {
    if (p === q) continue;
    const k = p.id + '>' + q.id, f = fscore(p, q), g = G[k];
    const about = (tags) => (p.today || []).filter((m) => m.who === q.name && tags.includes(m.tag)).length;
    if (f <= -6) {
      const hurts = about(GRUDGE_HURTS), mends = about(GRUDGE_MENDS);
      if (!g) G[k] = { since: W.day, hurts, last: hurts ? W.day : null };
      else { g.hurts = Math.max(0, g.hurts + hurts - mends * 2); if (hurts) g.last = W.day; }
    } else if (f > -4 && g) delete G[k];
  }
  for (const k of Object.keys(G)) { const [a, b] = k.split('>'); if (!person(a) || !person(b)) delete G[k]; }
}
function grudgeCandidates() {
  const S = crimeState(), G = S.grudges || {}, out = [];
  for (const [k, g] of Object.entries(G)) {
    const [a, b] = k.split('>'), p = person(a), q = person(b);
    if (!p || !q || !crimeAble(p) || !victimAble(q, true)) continue;
    if (W.day - g.since < GRUDGE_DAYS || g.hurts < 3 || fscore(p, q) > -7) continue;
    if (g.last == null || W.day - g.last > 10) continue; // it has to still be raw
    if ((S.turnedBack?.[k] ?? -1) > W.day) continue;
    out.push({ p, q, g, k, depth: (W.day - g.since) / GRUDGE_DAYS + g.hurts / 3 - fscore(p, q) / 10 });
  }
  return out.sort((x, y) => y.depth - x.depth);
}
// how likely they are to walk away: friends, love, the Creator, how their days have been, help they got
function turnBackChance(p, q) {
  const S = crimeState();
  let c = 0.55;
  c += Math.min(0.24, W.people.filter((r) => r !== p && r !== q && fscore(p, r) >= 6).length * 0.08);
  const cr = p.cr?.score ?? 0; c += cr >= 2 ? 0.1 : cr <= -6 ? -0.1 : 0;
  c += ((p.joy ?? 50) - 30) / 200;
  if (p.health && W.day - (p.health.lastTherapy ?? -99) <= 7) c += 0.1;
  if ((p.today || []).some((m) => GRUDGE_MENDS.includes(m.tag))) c += 0.05;
  if (p.partner && person(p.partner)) c += 0.05;
  c += Math.min(0.15, ((S.turnedBy || {})[p.id] || 0) * 0.05); // they've stood there before and walked away
  return clamp(c, 0.35, 0.92);
}
// returns 'murder', 'turnedBack' or null (nothing tonight); roll is only passed in by tests
function darkNight(roll = rand()) {
  const S = crimeState();
  if (W.day - (S.lastDark ?? -99) < 7) return null;
  const x = grudgeCandidates()[0]; if (!x) return null;
  const { p, q, g, k } = x;
  S.lastDark = W.day;
  if (roll < turnBackChance(p, q)) {
    S.turnedBack = S.turnedBack || {}; S.turnedBack[k] = W.day + 30;
    S.turnedBy = S.turnedBy || {}; S.turnedBy[p.id] = (S.turnedBy[p.id] || 0) + 1;
    g.hurts = Math.max(0, g.hurts - 2); feel(p, q, 1.5, true);
    remember(p, `Last night I stood outside ${q.name}'s door for a long time. Then I turned around and went home. I don't want to be that person.`, 3, 'turnedBack', q.name);
    diary('🌙 Late last night, someone stood outside a neighbor\'s door for a long time. Then they walked home.');
    markDirty();
    return 'turnedBack';
  }
  const days = W.day - g.since;
  return commitMurder({ p, m: { victim: q, w: 1, why: `had been feuding with ${q.name} for ${plural(days, 'day')} and couldn't let it go` } }) ? 'murder' : null;
}
function darkNightsBoot() {
  W.added = W.added || {}; if (W.added.darkNights) return; W.added.darkNights = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'Murders aren\'t on a timer anymore, and nobody gets picked at random to be the killer. A murder can only happen when a feud between two residents has gone on for weeks, with real fights keeping it raw. Even then, the one holding the grudge gets a night where they can turn back, and most of them do. Friends, love, therapy and a good bond with you all make that more likely. The Court tab setting is now the most there can ever be, and a quiet year is a good year.', 'murders come from feuds');
}
