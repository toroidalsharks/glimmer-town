// ============================================================
// SHOW & TELL: "look at this!" on phones and laptops, and book browsing
// ============================================================
const PIGEON_VIDEOS = ['a pigeon riding the trolley all the way around downtown', 'a cat video from GlimmerNet where the cat falls asleep mid-meow', 'a video of the fountain at night set to sad music', 'a clip of someone dropping their ice cream in slow motion', 'a GlimmerNet quiz that says they are "a croissant, emotionally"', 'a video of Bolt the robot beeping at a crab'];
let nextShow = 50;
function pickShowContent(a, b) {
  const own = (a.seen || []).filter((s) => W.day - s.day <= 3 && !(b.seen || []).some((x) => x.id === s.id));
  if (hasLaptop(a) && own.length && W.outsideFound) { const s = pick(own), it = outsideItem(s.id); if (it) return { kind: 'outside', it, dev: 'laptop', say: pick(['Okay you HAVE to see this.', 'Look what I found on the Outside.', 'Come here, come here. Look.']) }; }
  const ch = (W.chirps || []).slice(-30).filter((c) => c.by !== b.id && c.likes.length >= 2 && !c.likes.includes(b.id));
  if (ch.length && rand() < 0.5) { const c = pick(ch); return { kind: 'chirp', c, dev: 'phone', say: pick([`Did you see what ${c.by === a.id ? 'I' : c.name} posted?`, 'Look at this post. LOOK at it.', 'Okay this chirp is so funny.']) }; }
  const tx = (W.texts || []).slice(-40).filter((m) => m.to === a.id && m.from !== b.id);
  if (tx.length && rand() < 0.35) { const m = pick(tx); return { kind: 'text', m, dev: 'phone', say: pick([`Look what ${m.fromName} texted me.`, `Don't tell ${m.fromName} I showed you this.`, 'Read this text. What does it MEAN.']) }; }
  return { kind: 'video', v: pick(PIGEON_VIDEOS), dev: hasLaptop(a) && rand() < 0.4 ? 'laptop' : 'phone', say: pick(['You have to watch this.', 'Okay, this is the funniest thing ever.', 'Watch this. Trust me.']) };
}
function showTick() {
  if (MODE !== 'host' || W.meeting || now < nextShow || W.t > 0.6) return;
  nextShow = now + (40 + rand() * 50) * ts();
  const free = W.people.filter((p) => canChat(p) && p.grow >= 0.8 && !p.pose && ['stroll', 'visit', 'cafe'].includes(p.task?.kind || 'stroll'));
  for (const a of free.sort(() => rand() - 0.5)) {
    const b = free.find((q) => q !== a && fscore(a, q) >= 1 && Math.hypot(q.x - a.x, q.z - a.z) < 7);
    if (!b) continue;
    showScene(a, b, pickShowContent(a, b)).catch(() => {});
    return;
  }
}
async function showScene(a, b, C) {
  if (!a || !b || a.inside || b.inside || a.state !== 'free' || b.state !== 'free') return;
  a.state = b.state = 'talk';
  const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2; let dx = b.x - a.x, dz = b.z - a.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
  const until = now + 9;
  a.pose = { kind: 'show', until, tx: mx - dx * 0.5, tz: mz - dz * 0.5, dev: C.dev }; b.pose = { kind: 'look', until, tx: mx + dx * 0.5, tz: mz + dz * 0.5 };
  a.face = Math.atan2(dx, dz); b.face = Math.atan2(-dx, -dz);
  try {
    bubble(a, C.say, 2.6); emote(a, C.dev === 'laptop' ? '💻' : '📱', 3);
    await sleep(2600);
    let r = '';
    if (C.kind === 'outside') {
      seeItem(b, C.it, false);
      r = (b.seen || []).slice(-1)[0]?.react || 'Whoa.';
      remember(b, `${a.name} showed me something from the Outside on their laptop.`, 2, 'outside', a.name);
      if (!hasLaptop(b) && rand() < 0.5) setTimeout(() => laptopEnvy(b, a), 3000);
    } else if (C.kind === 'chirp') {
      if (!C.c.likes.includes(b.id)) C.c.likes.push(b.id);
      r = pick(['LOL.', 'Okay that IS funny.', "I can't believe they posted that.", 'Oh no. Oh NO.', 'Send me that.']); emote(b, '😂', 2.5);
      remember(b, `${a.name} showed me ${C.c.name}'s post: "${C.c.text.slice(0, 80)}"`, 1, 'showed', a.name);
    } else if (C.kind === 'text') {
      r = pick(['Ooh. Okay. That is a lot.', 'They did NOT say that.', "Reply with a heart. Trust me.", 'Hmm. I think they like you.']); emote(b, '👀', 2.5);
      remember(b, `${a.name} showed me a text from ${C.m.fromName}: "${C.m.text.slice(0, 80)}"`, 1, 'gossip', a.name);
      if (rand() < 0.3) { const src = person(C.m.from); if (src) { remember(src, `Heard that ${a.name} showed my text to ${b.name}.`, 2, 'textMean', a.name); feel(src, a, -0.4, true); } }
    } else {
      r = pick(['HAHAHA.', 'Play it again!', 'Why is this so funny?', "I'm going to think about this all day."]); emote(b, '😂', 2.5); emote(a, '😂', 2.5);
      remember(b, `${a.name} showed me ${C.v}. We couldn't stop laughing.`, 1, 'showed', a.name);
    }
    bubble(b, r, 3);
    feel(a, b, 0.25, true); feel(b, a, 0.3, true); addJoy(a, 5); addJoy(b, 6);
    remember(a, `Showed ${b.name} ${C.kind === 'outside' ? 'something from the Outside' : C.kind === 'video' ? C.v : C.kind === 'text' ? 'a text I got' : 'a funny post'} on my ${C.dev}.`, 1, 'showed', b.name);
    await sleep(3200);
  } finally {
    a.pose = b.pose = null; if (!a.heldByDlg) a.state = 'free'; if (!b.heldByDlg) b.state = 'free';
    W.pairCool[[a.id, b.id].sort().join('|')] = now + 25 * ts();
  }
}
function hideShowDev(m) { if (m.showDev) m.showDev.visible = false; if (m.showLap) m.showLap.visible = false; }
function showPose(p, m, po) {
  if (po.kind === 'show') {
    m.arms[1].rotation.x = -1.35; m.arms[1].position.y = 0.95; m.arms[0].rotation.x = -0.9;
    if (po.dev === 'laptop') { if (!m.showLap) { m.showLap = laptopMesh(COLORS[topColors(p)[0]] || '#9fd3ff'); m.showLap.scale.setScalar(0.75); m.showLap.position.set(0, 0.95, 0.62); m.fig.add(m.showLap); } m.showLap.visible = true; }
    else { if (!m.showDev) { m.showDev = new T3.Group(); m.showDev.add(mesh(box(0.2, 0.34, 0.04), toon('#2a2733'), 0, 0, 0, false)); m.showDev.add(mesh(box(0.17, 0.28, 0.01), toon('#9fe3ff', { emissive: new T3.Color('#2a6a8a') }), 0, 0, -0.025, false)); m.showDev.position.set(0.28, 1.12, 0.62); m.fig.add(m.showDev); } m.showDev.visible = true; }
  } else if (po.kind === 'look') { m.fig.rotation.x = 0.16; m.head.rotation.z = Math.sin(now * 2) * 0.08 + 0.12; m.arms.forEach((a) => (a.rotation.x = -0.4)); }
}

// book browsing: they go pick out books they want
function planBrowse(p) {
  if ((p.toRead || []).length || p.saving || p.coins < 8 || W.t > 0.55 || p.grow < 1 || rand() > 0.1) return false;
  setTask(p, 'browse', 'books'); return true;
}
function browseStart(p) { p.inside = true; p.busyUntil = now + 3.5 * ts(); }
function browseDone(p) {
  p.inside = false;
  const fav = favSubject(p), readIds = new Set((p.read || []).map((r) => r.id));
  const stock = (W.stock.books || []).filter((it) => it.kind === 'book' && BOOKS[it.id] && !readIds.has(it.id));
  const liked = stock.filter((it) => BOOKS[it.id].subj === fav || SUBJECTS[BOOKS[it.id].subj]?.kw.test(`${p.interests || ''} ${p.selfNote || ''}`));
  const it = pick(liked.length ? liked : stock);
  let id = it?.id;
  if (!id) { const pool = Object.keys(BOOKS).filter((k) => !readIds.has(k) && BOOKS[k].subj === fav); id = pick(pool.length ? pool : Object.keys(BOOKS).filter((k) => !readIds.has(k))); }
  if (!id) return;
  const price = BOOKS[id].price || 5; if (p.coins < price) return;
  spend(p, price); const seller = W.keeper?.books && person(W.keeper.books); if (seller && seller !== p) earn(seller, 1);
  if (it) W.stock.books.splice(W.stock.books.indexOf(it), 1);
  p.toRead = [...(p.toRead || []), id];
  remember(p, `Bought "${BOOKS[id].title}" at Paper Moon Books. I can't wait to start it.`, 1, 'boughtBook');
  bubble(p, pick([`"${BOOKS[id].title}"! Mine now.`, 'New book! New book!', 'Okay, I have a stack problem.']), 2.6);
}

