// ============================================================
// THE FERRY between two islands
// ============================================================
let otherExists = false, ferryAnim = null, ferry = null;
async function checkOther() { if (!RT.db) return; try { const d = await RT.db.doc(ISLES[OTHER].doc + '/alive').get(); otherExists = !!d.exists && Date.now() - (d.data()?.at || 0) < 36 * 3600e3; } catch (e) {} if (ferry) ferry.visible = otherExists; }
function ferryDepartures() {
  if (!RT.db || !otherExists || W.people.length < 4 || W.day < 4) return;
  for (const p of W.people) {
    if (p.grow < 1 || W.day - p.bornDay < 3 || p.visitor || p.away) continue;
    const fr = Object.values(p.feelings), friends = fr.filter((f) => f.score >= 3).length, grudges = fr.filter((f) => f.score <= -5).length;
    const score = (friends === 0 ? 1 : 0) + grudges * 0.6 + ((p.joy || 0) < 30 ? 0.3 : 0) - friends * 0.4;
    if (score > 0.6 && rand() < 0.1 * score) { depart(p, friends === 0 ? 'I never really found my place here.' : grudges ? "There are people here I can't be around anymore." : 'I want to see something new.'); return; }
  }
}
function depart(p, why) {
  const copy = JSON.parse(JSON.stringify(p, (k, v) => (['bubble', 'emote', 'happyUntil', 'lastD', 'stuckT'].includes(k) ? undefined : v === Infinity ? 1e12 : v)));
  copy.leftBehind = Object.values(p.feelings).sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 3).map((f) => ({ name: f.name, score: f.score }));
  Object.assign(copy, { task: null, path: [], inside: false, state: 'free', heldByDlg: false, makeup: null, befriend: null });
  RT.db.collection('ferry').doc().set({ to: OTHER, from: ISLE, day: W.day, person: copy }).catch(() => {});
  queueLetter(p, 'leaving', { to: ISLES[OTHER].name, why });
  W.people.splice(W.people.indexOf(p), 1);
  const m = meshes.get(p.id); if (m) { scene.remove(m.root); m.tag.remove(); meshes.delete(p.id); }
  for (const q of W.people) { const f = q.feelings[p.id]; if (f && Math.abs(f.score) >= 3) remember(q, `${p.name} took the ferry to ${ISLES[OTHER].name}. ${f.score > 0 ? 'I miss them already.' : "Good riddance."}`, 3, 'ferryGone', p.name); }
  delete W.creator.gifts[p.id];
  diary(`<b>${esc(p.name)}</b> took the morning ferry to ${ISLES[OTHER].name}. "${esc(why)}"`);
  toast(`${p.name} left on the ferry to ${ISLES[OTHER].name}.`);
  ferryAnim = { kind: 'depart', start: now }; Sound.horn();
}
function arrive(d) {
  if (d.kind === 'visit') return arriveVisitor(d);
  if (d.kind === 'return') return returnHome(d);
  const q = d.person; if (!q || freeRoom() < 0) return false;
  q.id = 'k' + (W.nextId++);
  while (W.people.some((x) => x.name === q.name)) q.name += 'a';
  Object.assign(q, { room: freeRoom(), feelings: {}, at: 'pier', x: (rand() - 0.5) * 1.5, z: 39.5, inside: false, task: null, path: [], state: 'free', today: [], busyUntil: 0, heldByDlg: false, makeup: null, befriend: null });
  q.cr = q.cr || { score: 0, beliefs: {}, wish: null, talks: 0, gifts: 0 };
  const left = (q.leftBehind || []).map((f) => f.name);
  remember(q, `I took the ferry here from ${ISLES[d.from]?.name || 'far away'}. I left behind ${left.length ? left.join(', ') : 'everything'}.`, 3, 'arrived');
  W.people.push(q); buildKin(q);
  diary(`A ferry pulled in from ${esc(ISLES[d.from]?.name || 'across the sea')}. <b>${esc(q.name)}</b> stepped off and moved into room ${q.room + 1}.`);
  queueLetter(q, 'arrived', { from: ISLES[d.from]?.name || 'across the sea', who: left[0] });
  for (const r of W.people) if (r !== q && rand() < 0.5) remember(r, `Someone new arrived on the ferry: ${q.name}.`, 1, 'newcomer', q.name);
  toast(`${q.name} arrived on the ferry!`);
  ferryAnim = { kind: 'arrive', start: now }; Sound.horn();
  markDirty();
  return true;
}
function listenFerry() {
  if (!RT.db) return;
  RT.db.collection('ferry').where('to', '==', ISLE).onSnapshot(async (snap) => {
    for (const ch of snap.docChanges()) {
      if (ch.type !== 'added') continue;
      const d = ch.doc.data(); if (!d) continue;
      if (arrive(d)) { try { await RT.db.doc('ferry/' + ch.doc.id).delete(); } catch (e) {} saveNow(); }
    }
  }, () => {});
}
function buildFerry() {
  const g = new T3.Group();
  g.add(mesh(box(2.6, 1.0, 6.5), toon('#ffffff'), 0, 0.1, 0));
  g.add(mesh(box(2.65, 0.25, 6.55), toon('#ff6f5e'), 0, -0.25, 0));
  g.add(mesh(box(1.8, 1.2, 2.6), toon('#9fd3ff'), 0, 1.2, -0.6));
  g.add(mesh(box(2.0, 0.15, 2.8), toon('#ffffff'), 0, 1.88, -0.6));
  g.add(mesh(cyl(0.25, 0.25, 1.0, 10), toon('#ffd36b'), 0, 2.4, -1.4));
  g.add(mesh(cyl(0.03, 0.03, 1.6, 6), toon('#5a5470'), 0, 2.7, 1.6));
  g.add(mesh(box(0.7, 0.4, 0.02), toon('#ff9fbf'), 0.35, 3.3, 1.6));
  g.position.set(5, -0.4, 36); g.visible = false;
  scene.add(g); return g;
}
function ferryFrame() {
  if (!ferry) return;
  ferry.visible = otherExists;
  const dock = new T3.Vector3(5, -0.4, 36), far = new T3.Vector3(55, -0.4, 110);
  if (ferryAnim) {
    const k = (now - ferryAnim.start) / 9;
    if (k >= 2) ferryAnim = null;
    else {
      let t = ferryAnim.kind === 'arrive' ? 1 - Math.min(1, k) : k < 1 ? k : 2 - k; // depart: out and back
      t = t * t * (3 - 2 * t);
      ferry.position.lerpVectors(dock, far, t);
      ferry.rotation.y = Math.atan2(far.x - dock.x, far.z - dock.z) + (ferryAnim.kind === 'depart' && k < 1 ? 0 : Math.PI);
      ferry.visible = true;
    }
  } else { ferry.position.copy(dock); ferry.rotation.y = 0; }
  ferry.position.y = -0.4 + Math.sin(now * 1.3) * 0.08;
}

