// ============================================================
// SECRET WANTS
// ============================================================
const WANTS = [
  () => ({ text: 'to be the most liked person in town' }),
  (p, q) => q && { text: `to become really close to ${q.name}`, who: q.id },
  (p, q) => q && q.job && { text: `to take over ${q.name}'s job as ${JOBS[q.job].short}`, who: q.id },
  () => ({ text: "to be the Creator's favorite, no matter what" }),
  () => ({ text: 'to prove to everyone that the Creator is not real' }),
  () => ({ text: 'to become the richest person in town' }),
  (p, q) => q && { text: `to get back at ${q.name} someday`, who: q.id },
  () => ({ text: 'to have the nicest room in the apartments' }),
  () => ({ text: 'to be left alone, mostly' }),
  () => ({ text: 'to be the one everyone listens to at town meetings' }),
  (p, q) => q && { text: `to find out ${q.name}'s secrets`, who: q.id },
];
function newWant(p) {
  const others = W.people.filter((q) => q !== p);
  for (let i = 0; i < 12; i++) { const w = pick(WANTS)(p, others.length ? pick(others) : null); if (w) return w; }
  return { text: 'to find where they belong' };
}

