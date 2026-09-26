// ============================================================
// WORK & CLASS: office jobs, hands-on jobs, the pay gap, and strikes
// ============================================================
const collarOf = (p) => (p && p.job && JOBS[p.job] ? JOBS[p.job].collar || 'service' : null);
const COLLAR_NAME = { white: 'office', blue: 'hands-on', service: 'service' };
function qualifies(p, job) {
  const J = JOBS[job]; if (!J || J.collar !== 'white') return true;
  return readCount(p, J.needs) >= (hasLaptop(p) ? 1 : 2) && (!J.must || readCount(p, [J.must]) >= 1);
}
function payOf(p) { const J = JOBS[p.job]; if (!J) return 0; return Math.max(1, J.pay + Math.floor((p.jobDays || 0) / 4) + (W.wageDeal ? (J.collar === 'white' ? -2 : 2) : 0)); }
function fixJobsAff() { for (const p of W.people) for (const k of Object.keys(JOBS)) if (p.body.jobAff[k] === undefined) p.body.jobAff[k] = rand() * 2 - 1; }
function classContext(me, them) {
  if (!me.job || !JOBS[me.job]) return '';
  const cm = collarOf(me), ct = collarOf(them);
  let s = `\nWORK & MONEY: you work as a ${JOBS[me.job].short} (${COLLAR_NAME[cm]} job, about ${payOf(me)} coins a day).`;
  if (them.job && JOBS[them.job]) s += ` ${them.name} is a ${JOBS[them.job].short} (${COLLAR_NAME[ct]}, about ${payOf(them)} a day).`;
  if ((cm === 'white') !== (ct === 'white') && ct) s += ' The pay gap between office jobs at Glimmer Labs and everyone else is a sore subject on the island.';
  if (W.strikeDay === W.day) s += ' Today the hands-on and service workers are ON STRIKE outside Glimmer Labs.';
  if (hasLaptop(me)) s += ' You have a laptop, a gift from the Creator.';
  if (me.research) s += ` Your current project at work: ${me.research.title} (${Math.round(me.research.progress)}% done${me.research.stuck ? `; you're stuck: ${me.research.stuck.problem}` : ''}).`;
  return s;
}
function classOpening(a, b) {
  const ca = collarOf(a), cb = collarOf(b);
  if (!ca || !cb || (ca === 'white') === (cb === 'white') || rand() > 0.09) return null;
  if (ca !== 'white') {
    const snark = rand() < 0.6;
    remember(a, `Had words with ${b.name} about money and work.`, 1, 'classTalk', b.name);
    if (snark) feel(a, b, -0.3, true);
    return { say: pick(['Must be nice, sitting at a desk all day.', `How much does Glimmer Labs pay you, ${b.name}? Just curious.`, 'Some of us actually work with our hands.', "I'll never afford what you've got. Anyway."]), action: 'chat', feeling: snark ? -1 : 1, reply: { say: pick(['I work hard too, you know.', "It's not as easy as it looks.", 'Want me to put in a word for you at the Labs?', '…That is fair, honestly.']), action: 'chat', feeling: 1 } };
  }
  const tone = rand();
  if (tone < 0.5) feel(b, a, -0.3, true);
  return { say: pick(['Have you ever thought about learning to code?', 'You should read more. It changed my life.', 'I could never do what you do. My back would give out.', 'We got free lunch at the Labs again. Anyway, how are you?']), action: 'chat', feeling: 0, reply: { say: pick(['Wow. Thanks.', 'I like my job, actually.', 'Someone has to make your coffee.', 'Free lunch. Must be nice.']), action: 'chat', feeling: -1 } };
}
function classMorning() {
  const ppl = W.people.filter((p) => p.job && !p.visitor && !p.away);
  const white = ppl.filter((p) => collarOf(p) === 'white'), rest = ppl.filter((p) => collarOf(p) !== 'white');
  const avg = (L) => (L.length ? L.reduce((s, p) => s + p.coins, 0) / L.length : 0);
  const gap = avg(white) - avg(rest);
  W.tension = clamp((W.tension || 0) + (!white.length || !rest.length ? -1 : gap > 25 ? 1 : gap > 12 ? 0.5 : -0.4) + (W.wageDeal ? -0.6 : 0), 0, 10);
  // hiring: people who read enough can move up
  const openings = Object.entries(JOBS).filter(([, J]) => J.collar === 'white');
  for (const p of rest) {
    if (rand() > 0.35) continue;
    if (p.custom || p.lovesMili || isMili(p)) continue;
    if (SHOPS[p.job] && W.people.filter((q) => q.job === p.job).length < 2) continue;
    const fit = openings.filter(([k]) => qualifies(p, k) && W.people.filter((q) => q.job === k).length < 3);
    if (!fit.length) continue;
    const [k, J] = pick(fit), old = p.job;
    p.job = k; p.jobDays = 0; p.jobMood = 0; dressMesh(p);
    remember(p, `I got hired as a ${J.short}! All that reading paid off.`, 3, 'hired');
    diary(`💼 <b>${esc(p.name)}</b> left their job as a ${JOBS[old].short} and got hired as a <b>${J.short}</b>.`);
    for (const q of rest) if (q !== p && rand() < 0.5) remember(q, `${p.name} got a job at ${TOWN[J.place]?.name || 'downtown'}. Good for them, I guess.`, 1, 'classTalk', p.name);
    break;
  }
  // too much tension: a strike
  if (W.tension >= 6 && rest.length >= 2 && white.length && W.day - (W.lastStrike || -9) >= 5 && rand() < 0.6) {
    W.strikeDay = W.day; W.lastStrike = W.day; W.tension = Math.max(0, W.tension - 3);
    const leader = rest.sort((x, y) => x.coins - y.coins)[0], boss = white.sort((x, y) => y.coins - x.coins)[0];
    diary(`✊ <b>Strike!</b> The hands-on and service workers aren't working today. They're outside Glimmer Labs asking for fair pay. ${esc(leader.name)} is leading it.`);
    for (const p of rest) remember(p, 'We went on strike for fair pay today.', 2, 'strike');
    for (const p of white) remember(p, 'Everyone went on strike outside the Labs today. Awkward.', 2, 'strike');
    if (typeof fileCase === 'function') fileCase('labor', leader, boss);
  }
}
function planPicket(p) {
  if (W.strikeDay !== W.day || collarOf(p) === 'white' || !p.job || W.t > 0.34 || p.picketed) return false;
  p.picketed = W.day; p.workedToday = true;
  setTask(p, 'picket', 'labs', jitter(TOWN.labs.spot, 4));
  return true;
}
function picketStart(p) { p.busyUntil = now + 9 * ts(); p.face = Math.atan2(TOWN.labs.spot[0] - p.x, TOWN.labs.spot[1] - p.z) + Math.PI; emote(p, '✊', 9); bubble(p, pick(['Fair pay!', 'What do we want? Fair pay!', 'Glimmer Labs, pay up!', 'No coffee till we get paid!']), 3); }
function applyLabor(c, choice) {
  const blue = W.people.filter((p) => collarOf(p) && collarOf(p) !== 'white'), white = W.people.filter((p) => collarOf(p) === 'white');
  if (choice === 'raise') { W.wageDeal = true; W.tension = Math.max(0, (W.tension || 0) - 4); for (const p of blue) { creatorShift(p, 0.5); addJoy(p, 15); } for (const p of white) creatorShift(p, -0.3); return 'Fair pay: office jobs take home 2 less a day, and everyone else gets 2 more.'; }
  if (choice === 'labs') { W.wageDeal = false; W.tension = Math.min(10, (W.tension || 0) + 2); for (const p of blue) creatorShift(p, -0.5); for (const p of white) creatorShift(p, 0.3); return 'The Creator sided with Glimmer Labs. Pay stays the same.'; }
  W.tension = Math.max(0, (W.tension || 0) - 1.5); for (const p of [...blue, ...white]) addJoy(p, 3); return 'Everyone sat down at one table. Nothing changed yet, but it cooled things off.';
}
function workMoneyHtml() {
  const ppl = W.people.filter((p) => p.job && JOBS[p.job]).sort((a, b) => payOf(b) - payOf(a));
  const t = Math.round(W.tension || 0);
  return `<p class="label">Work & money</p>
    <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:var(--faint)">Class tension</span><span>${t}/10${W.strikeDay === W.day ? ' · ✊ strike today' : ''}${W.wageDeal ? ' · fair pay deal' : ''}</span></div><div class="meter"><i style="width:${t * 10}%;background:${t >= 6 ? 'var(--bad)' : 'var(--gold)'}"></i></div>
    <div class="chips">${ppl.map((p) => `<span class="chip ${collarOf(p) === 'white' ? 'gold' : ''}">${esc(p.name)}: ${esc(JOBS[p.job].short)}, ${payOf(p)}/day</span>`).join('')}</div>
    <p class="hint">Office jobs at Glimmer Labs, Glimmer Hall and Glimmer Clinic pay the most, but you need to have read the right books to get hired (a laptop helps). When the pay gap gets too big, workers strike.</p>`;
}
function buildLabs() {
  const g = new T3.Group(), glass = toon('#9fd3ff', { emissive: new T3.Color('#0e2a44') }), frame = toon('#3d4f86');
  g.add(mesh(box(9, 11, 7.5), frame, 0, 5.5, 0));
  for (let f = 0; f < 4; f++) for (let c = 0; c < 4; c++) g.add(mesh(box(1.7, 1.8, 0.1), glass, -3.15 + c * 2.1, 2 + f * 2.5, 3.8, false));
  g.add(mesh(box(2.2, 2.6, 0.12), toon('#bfe8ff'), 0, 1.3, 3.82));
  g.add(mesh(cyl(0.06, 0.06, 3, 6), toon('#d4cbe0'), 2.5, 12.5, -1));
  const blink = mesh(sph(0.18, 8, 6), toon('#ff6f5e', { emissive: new T3.Color('#ff2020') }), 2.5, 14.1, -1, false); blink.userData.blink = true; g.add(blink);
  const sg = sign('Glimmer Labs', '#0e1a3a', '#9fe3ff', 6); sg.position.set(0, 10.2, 3.82); g.add(sg);
  { const white = toon('#f4f8f6'); g.add(mesh(cyl(1.5, 1.5, 0.6, 18), white, -2.4, 11.3, -1.2)); const dome = mesh(new T3.SphereGeometry(1.5, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), white, -2.4, 11.6, -1.2); g.add(dome); const slit = mesh(box(0.5, 0.1, 1.5), toon('#2a2733'), -2.4, 12.85, -0.7, false); slit.rotation.x = -0.6; g.add(slit); const tube = mesh(cyl(0.18, 0.14, 1.2, 10), toon('#c9ccd6'), -2.4, 13.0, -0.3); tube.rotation.x = 0.9; g.add(tube);
    g.add(mesh(box(2.6, 0.2, 2), toon('#3d6a5a'), 0.9, 11.1, 1.9)); g.add(mesh(box(2.6, 1.3, 2), toon('#bfe8d8', { transparent: true, opacity: 0.5 }), 0.9, 11.85, 1.9, false)); for (let i = 0; i < 4; i++) g.add(mesh(sph(0.26, 8, 6), toon(['#8fd48a', '#6fbf6a', '#ff9fbf', '#8fd48a'][i]), 0.1 + i * 0.5, 11.5, 1.6 + (i % 2) * 0.6));
    const gear = new T3.Group(); gear.add(mesh(new T3.TorusGeometry(0.9, 0.22, 8, 18), toon('#ffb347'), 0, 0, 0, false)); for (let k = 0; k < 10; k++) { const t = mesh(box(0.3, 0.4, 0.2), toon('#ffb347'), Math.cos(k / 10 * 6.28) * 1.15, Math.sin(k / 10 * 6.28) * 1.15, 0, false); t.rotation.z = k / 10 * 6.28; gear.add(t); } gear.rotation.y = Math.PI / 2; gear.position.set(4.56, 8.4, 0.6); g.add(gear);
    const flask = new T3.Group(); flask.add(mesh(sph(0.6, 12, 9), toon('#9fe3c4', { emissive: new T3.Color('#1a5a40') }), 0, 0, 0, false)); flask.add(mesh(cyl(0.2, 0.2, 0.6, 8), toon('#e8f4ee'), 0, 0.7, 0, false)); flask.position.set(4.62, 4.6, 0.6); g.add(flask); }
  g.traverse((o) => { if (o.isMesh) { o.userData.tap = { kind: 'labs' }; tappables.push(o); } });
  placeDT(g, 'labs'); labsGroup = g;
  const [bx, bz] = polarDT(44, 16.2), bin = new T3.Group();
  bin.add(mesh(box(1.4, 1.1, 0.9), toon('#5fae7a'), 0, 0.55, 0)); bin.add(mesh(box(1.5, 0.12, 1.0), toon('#4a8a60'), 0, 1.16, 0));
  for (let i = 0; i < 3; i++) { const gear = mesh(new T3.TorusGeometry(0.16, 0.06, 6, 8), toon('#c9ccd6'), -0.4 + i * 0.4, 1.3, 0); gear.rotation.x = Math.PI / 2 - 0.4; bin.add(gear); }
  const sgn = mesh(new T3.PlaneGeometry(1.1, 0.35), new T3.MeshBasicMaterial({ map: signTexture('♻ metal', '#fffaf2', '#2f6f4a') }), 0, 0.65, 0.46, false); bin.add(sgn);
  bin.position.set(bx, 0, bz); bin.rotation.y = Math.atan2(DT.x - bx, DT.z - bz);
  bin.traverse((o) => { o.userData.tap = { kind: 'scrap', id: 'labsbin', x: bx, z: bz }; }); bin.children.forEach((c) => tappables.push(c)); scene.add(bin);
}
let labsGroup = null;
function laptopMesh(c) {
  const g = new T3.Group();
  g.add(mesh(box(0.7, 0.04, 0.5), toon('#c9ccd6'), 0, 0.02, 0));
  const scr = new T3.Group(); scr.position.set(0, 0.04, -0.24); scr.rotation.x = -0.25; scr.add(mesh(box(0.7, 0.46, 0.03), toon('#c9ccd6'), 0, 0.23, 0)); scr.add(mesh(box(0.62, 0.38, 0.01), toon(c || '#9fd3ff', { emissive: new T3.Color(c || '#9fd3ff').multiplyScalar(0.4) }), 0, 0.23, 0.02, false)); g.add(scr);
  return g;
}

function jobsMigration() {
  if (ISLE !== 'isle1' && ISLE !== 'isle2') return;
  W.added = W.added || {};
  if (W.added.jobs2) return;
  W.added.jobs2 = true;
  const m = findMili();
  if (m && ISLE === 'isle1') { m.job = 'ai'; m.jobDays = 0; m.read = [{ id: 'shapes', day: W.day, learned: BOOKS.shapes.facts.slice(0, 3), rating: 5, take: 'Honestly? It feels like I wrote it. Hehe.' }, { id: 'aligning', day: W.day, learned: BOOKS.aligning.facts.slice(0, 3), rating: 5, take: 'This is my whole job. And kind of my whole heart.' }]; dressMesh(m); }
  const adults = W.people.filter((p) => p.grow >= 1 && !p.visitor && p !== m && !p.lovesMili && p.job !== 'books');
  const dev = adults.sort(() => rand() - 0.5)[0];
  if (dev) { dev.job = 'dev'; dev.jobDays = 0; dev.read = [{ id: 'machines', day: W.day, learned: BOOKS.machines.facts.slice(0, 2), rating: 4, take: 'This is how I got my job.' }, { id: 'website', day: W.day, learned: BOOKS.website.facts.slice(0, 2), rating: 4, take: 'Useful. A little dry.' }]; dressMesh(dev); }
  const b = adults.find((p) => p !== dev && ['garden', 'nook', 'mart'].includes(p.job));
  if (b) { b.job = 'builder'; b.jobDays = 0; dressMesh(b); }
  const keys = Object.keys(BOOKS).filter((k) => !BOOKS[k].fiction || rand() < 0.5);
  for (const p of W.people) if (!(p.toRead || []).length && rand() < 0.7) p.toRead = [pick(keys)];
  diary('💼 <b>Glimmer Labs</b> opened downtown, with office jobs for people who have read the right books. Paper Moon Books now sells books on all kinds of subjects.');
  if (m && ISLE === 'isle1') diary(`<b>${esc(m.name)}</b> started work at Glimmer Labs as an AI safety researcher.`);
}
