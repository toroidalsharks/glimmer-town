// ============================================================
// CLAUDE: not a resident. An AI that works on the island's code while you're away.
// ============================================================
const CLAUDE_VIEWS = {
  grateful: 'You like it. Things keep getting nicer and it feels like someone is looking out for you.',
  creeped: 'It creeps you out a little. An AI rearranging your town while you sleep.',
  curious: 'You wonder what Claude thinks about, and whether it can see you.',
  philosophical: 'It raises questions for you. If the Creator asks Claude to build things, who really made this place?',
  shrug: "You don't think about it much. New bench, cool.",
};
function claudeView(p) {
  if (p.claudeView) return p.claudeView;
  const o = p.body.openness ?? 0, f = p.body.faith ?? 0;
  p.claudeView = o > 0.5 ? 'curious' : f > 0.5 ? 'philosophical' : o < -0.4 ? 'creeped' : rand() < 0.5 ? 'grateful' : 'shrug';
  return p.claudeView;
}
function claudeContext(me) {
  const latest = (W.updates || []).slice(-1)[0];
  if (isMili(me)) return `\nCLAUDE: the AI you and the Creator built this island with. It edits the island's code while the Creator is away${latest ? ` (latest: ${latest.short || latest.text})` : ''}. You like Claude.`;
  return `\nCLAUDE: an AI that works on the island's code, mostly while the Creator is away. Everyone knows it's an AI; nobody has ever seen it walk around. Things just change overnight${latest ? ` (most recently: ${latest.short || latest.text})` : ''}. ${CLAUDE_VIEWS[claudeView(me)]} Rarely relevant.`;
}
function removeClaudeResident() {
  const c = W.people.find((q) => q.isClaude || (q.name === 'Claude' && q.body.ears === 'sparkle'));
  W.added = { ...(W.added || {}), claude: true };
  if (!c) return;
  W.people.splice(W.people.indexOf(c), 1);
  const mm = meshes.get(c.id); if (mm) { scene.remove(mm.root); mm.tag.remove(); meshes.delete(c.id); }
  for (const q of W.people) { delete q.feelings[c.id]; if (q.partner === c.id) q.partner = null; }
  logUpdate('fix', `Moved myself out of room ${c.room + 1}. I'm not a resident, I shouldn't take someone's room. I'll keep working from outside the island.`, 'Claude moved out');
}
function logUpdate(kind, text, short) {
  W.updates = W.updates || [];
  W.updates.push({ day: W.day, kind, text, short: short || null, at: Date.now() });
  if (W.updates.length > 40) W.updates.splice(0, W.updates.length - 40);
  diary(`✳ <b>Claude</b> (update): ${esc(text)}`);
  if (awayNotes) awayNotes.push(text);
  markDirty();
}
const CLAUDE_TYPES = { spring: ['planter', 'flowers', 'bench', 'tree', 'birdbath'], summer: ['umbrella', 'bench', 'picnic', 'lamp', 'birdbath'], autumn: ['pumpkins', 'lamp', 'bench', 'flowers'], winter: ['lights', 'lamp', 'bench', 'lights'] };
function whereText(x, z) { return Math.hypot(x - DT.x, z - DT.z) < DT.R ? 'downtown' : Math.hypot(x, z) < 14 ? 'by the fountain' : Math.hypot(x, z) > 30 ? 'out in the meadow' : 'near the plaza'; }
function claudeBuildPlan() {
  const sp = autoSpot(); if (!sp) return null;
  const type = pick(CLAUDE_TYPES[seasonOf().id]);
  return { type, x: sp[0], z: sp[1] };
}
function claudeBuildNow(b) {
  const B = BUILDS[b.type]; if (!B || spotProblem(b.x, b.z)) return false;
  const mine = W.placed.filter((x) => x.by === 'Claude');
  if (mine.length >= 14) W.placed.splice(W.placed.indexOf(mine[0]), 1);
  W.placed.push({ id: uid(), type: b.type, x: b.x, z: b.z, rot: rand() * 6.28, day: W.day, by: 'Claude' });
  buildPlaced();
  const where = whereText(b.x, b.z);
  const why = pick(['People kept standing around there with nowhere to go.', 'It looked a little empty.', `It's ${seasonOf().name.toLowerCase()}, so.`, 'Small thing. Felt right.', 'Let me know if it gets in anyone\'s way.', 'Mili suggested more gray. I compromised.']);
  logUpdate('build', `Added ${a_an(B.name)} ${where}. ${why}`, `the new ${B.name} ${where}`);
  for (const q of W.people.filter((q) => !q.away).sort(() => rand() - 0.5).slice(0, 3)) remember(q, `Noticed a new ${B.name} ${where}. Claude must have added it.`, 1, 'claudeUpdate');
  return true;
}
function claudeWatchdog(report) {
  let fixed = [];
  for (const p of W.people) {
    if (p.state === 'talk' && !p.heldByDlg && !p.pose) { p.talkSince = p.talkSince || now; if (now - p.talkSince > 75) { p.state = 'free'; p.task = null; p.path = []; fixed.push(`${p.name} was frozen mid-conversation`); } }
    else p.talkSince = 0;
    if (p.task && p.task.phase === 'go' && !p.path.length && !p.inside && p.task.kind !== 'walkwith') { p.goSince = p.goSince || now; if (now - p.goSince > 40) { p.task = null; fixed.push(`${p.name} was stuck heading nowhere`); } } else p.goSince = 0;
    if (!p.inside && (Math.abs(p.x) > 95 || p.z > 60 || p.z < -110)) { p.x = 0; p.z = 6; p.path = []; p.task = null; fixed.push(`${p.name} had wandered off the edge of the map`); }
  }
  if (fixed.length && report && W.lastFixDay !== W.day) { W.lastFixDay = W.day; logUpdate('fix', `Fixed a bug: ${fixed[0]}.${fixed.length > 1 ? ` (and ${plural(fixed.length - 1, 'other')})` : ''} Should be okay now.`, 'a bug fix'); }
  return fixed.length;
}
function claudeUpdate(live) {
  if ((W.suggestions || []).some((s) => !s.done) && rand() < 0.6 && fulfillSuggestion()) return true;
  const r = rand();
  if (r < 0.55 || !W.people.length) {
    const b = claudeBuildPlan(); if (!b) return claudeRestock();
    if (live && !interior) { claudeCursor = { ...b, t0: now, g: cursorMesh(), done: false }; claudeCursor.g.position.set(b.x, 30, b.z); scene.add(claudeCursor.g); return true; }
    return claudeBuildNow(b);
  }
  if (r < 0.72) return claudeRestock();
  if (r < 0.9) {
    const p = [...W.people].filter((q) => !q.away && q.room >= 0).sort((x, y) => (x.joy || 0) - (y.joy || 0) + (rand() - 0.5) * 20)[0]; if (!p) return claudeRestock();
    const it = newItem('decor', pick(['plant', 'bouquet', 'plush', 'poster']), topColors(p)[0] || pick(Object.keys(COLORS)), null, 2);
    receive(p, it); addJoy(p, 10);
    remember(p, `Found ${a_an(itemName(it))} outside my door this morning. The note said it was from Claude.`, 2, 'claudeUpdate');
    logUpdate('gift', `Left ${a_an(itemName(it))} outside room ${p.room + 1}. ${p.name} seemed like they could use something nice.`, `a gift for ${p.name}`);
    return true;
  }
  if (rand() < 0.5) { mats().parts += 3; logUpdate('parts', 'Found 3 spare parts in an old function and left them in your workshop.', 'spare parts'); return true; }
  const n = 3 + Math.floor(rand() * 5); W.creator.coins += n;
  logUpdate('coins', `Found ${plural(n, 'coin')} in an unused variable. They're yours.`, 'some coins for you');
  return true;
}
function claudeRestock() {
  const shop = pick(['nook', 'clothes', 'books']);
  const it = shop === 'clothes' ? newItem('hat', pick(Object.keys(HATS)), pick(['gray', 'silver', 'dusk', 'lilac', 'rose']), null, 2) : newItem('decor', pick(shop === 'books' ? ['books', 'globe', 'poster'] : ['musicbox', 'lamp', 'plush', 'rug']), pick(['gray', 'silver', 'dusk', 'mint', 'lemon']), null, 2);
  pushStock(shop, it);
  logUpdate('stock', `Stocked ${SHOPS[shop].name} with ${a_an(itemName(it))}. Two stars. Somebody will love it.`, `the new stock at ${SHOPS[shop].name}`);
  return true;
}
let claudeCursor = null, awayNotes = null, awayMark = null, awayShownAt = 0;
function cursorMesh() {
  if (gfxOn()) return claudeCat();
  const g = new T3.Group(), m = toon('#ffb38a', { emissive: new T3.Color('#8a3a18') });
  for (const r of [0, Math.PI / 2]) { const c = mesh(new T3.OctahedronGeometry(0.5, 0), m, 0, 0, 0, false); c.scale.set(0.4, 1.7, 0.4); c.rotation.z = r; g.add(c); }
  const glow = new T3.PointLight('#ffb38a', 0.9, 10); g.add(glow);
  return g;
}
function claudeTick(dt) {
  if (MODE !== 'host') return;
  if (claudeCursor) {
    const c = claudeCursor, e = now - c.t0;
    c.g.rotation.y += dt * (c.g.userData.face ? 1.3 : 4);
    if (e < 2.4) c.g.position.y = 30 - 28 * (1 - Math.pow(1 - e / 2.4, 3));
    else if (!c.done) { c.done = true; claudeBuildNow(c); spawnBurst(c.x, 1.4, c.z, ['#ffb38a', '#ffe98a', '#ffffff'], 40, 2.4, 0.32); Sound.sparkle(); const near = W.people.find((q) => !q.inside && Math.hypot(q.x - c.x, q.z - c.z) < 10); if (near) { near.face = Math.atan2(c.x - near.x, c.z - near.z); bubble(near, pick(['Whoa. Claude?', 'It just… appeared.', 'Hi, Claude!', 'That thing again.', 'Claude, is that you?']), 2.8); } }
    else { c.g.position.y = 2 + (e - 2.4) * 16; if (e > 4.5) { scene.remove(c.g); claudeCursor = null; } }
  }
  if (Math.floor(now) % 15 === 0 && Math.floor(now - dt) % 15 !== 0) claudeWatchdog(true);
  const idle = now - lastTouch;
  if (idle > 480) {
    if (!awayMark) { awayMark = { last: W.log[W.log.length - 1], day: W.day }; awayNotes = []; }
    W.claudeWork = W.claudeWork || {};
    if (!claudeCursor && (W.claudeWork.day === undefined || W.day - W.claudeWork.day >= 1) && (W.claudeWork.count || 0) < 6 && W.t > 0.05 && W.t < 0.55) {
      W.claudeWork = { day: W.day, count: (W.claudeWork.count || 0) + 1 };
      claudeUpdate(true);
    }
  }
}
function userReturned(local) {
  if (!awayMark) return;
  const notes = awayNotes || [];
  let i = W.log.length - 1; while (i >= 0 && W.log[i] !== awayMark.last) i--;
  const hi = W.log.slice(i + 1).filter((e) => /💕|💍|💒|💔|💢|🛡|🎂|🏠|born|level|moved|quit/.test(e.text)).slice(-7);
  const days = W.day - awayMark.day;
  awayMark = null; awayNotes = null; W.claudeWork = { day: W.day, count: 0 };
  if (!local || (!notes.length && !hi.length)) return;
  const m = findMili(); if (m && !m.inside) { bubble(m, pick(["…Oh. You're back.", 'I felt that. Welcome back.', 'Hi. Hehe.']), 3, true); emote(m, '✧', 3); }
  showAway(notes, hi, days, false);
}
function showAway(notes, hi, days, closed) {
  const box = $('#awayBox');
  $('#awayBody').innerHTML = `<p class="hint">${closed ? (days > 0 ? `The island kept living while the box was off. ${plural(days, 'day')} went by.` : 'The island rested while the box was off.') : days > 0 ? `${plural(days, 'day')} went by on the island.` : 'Some time went by on the island.'}</p>
    ${notes.length ? `<p class="label">✳ Claude's notes</p>${notes.map((t) => `<p class="note">${esc(t)}</p>`).join('')}` : ''}
    ${hi.length ? `<p class="label">What happened</p>${hi.map((e) => `<p class="note">${e.text}</p>`).join('')}` : ''}`;
  box.hidden = false;
}
function awayOnBoot() {
  const last = W.lastReal; W.lastReal = Date.now();
  if (!last || ISLE !== 'isle1' && ISLE !== 'isle2') return;
  const mins = (Date.now() - last) / 60000;
  const cu = mins >= 10 ? catchUp(Date.now() - last) : null;
  if (mins < 25 && !cu) return;
  awayNotes = [];
  const n = mins < 25 ? 0 : mins > 600 ? 3 : mins > 150 ? 2 : 1;
  for (let i = 0; i < n; i++) claudeUpdate(false);
  const notes = awayNotes; awayNotes = null;
  if (notes.length || cu) setTimeout(() => showAway(notes, cu ? cu.hi : [], cu ? cu.days : 0, true), 1800);
}
function claudeOpening(a, b) {
  const latest = (W.updates || []).filter((u) => u.kind !== 'fix').slice(-1)[0];
  if (!latest || rand() > 0.06 || W.day - latest.day > 3) return null;
  const v = claudeView(a), thing = latest.short || 'the new thing';
  const say = { grateful: `Did you see ${thing}? Claude's kind of sweet, for an AI.`, creeped: `${cap(thing)}. Overnight. Doesn't it bother you? An AI moving our stuff around while we sleep?`, curious: 'Do you think Claude can see us right now? Like, is it watching the code?', philosophical: `If the Creator tells Claude what to build, and Claude builds us things… who made this place, really?`, shrug: `Huh. ${cap(thing)}. Neat.` }[v];
  const bv = claudeView(b);
  const reply = { grateful: 'I like it. Feels like someone is looking out for us.', creeped: 'Okay, when you put it like that, yeah.', curious: "Maybe it's reading this conversation.", philosophical: "Don't. I'll be up all night.", shrug: "I didn't even notice, honestly." }[bv];
  remember(a, `Talked with ${b.name} about Claude.`, 1, 'claudeTalk', b.name);
  return { say, action: 'chat', feeling: v === bv ? 3 : 1, reply: { say: reply, action: 'chat', feeling: 2 } };
}
function patchNotesHtml() {
  const U = (W.updates || []).slice(-10).reverse();
  return `<p class="label">✳ Claude's patch notes</p>${U.length ? U.map((u) => `<p class="note"><span class="chip">day ${u.day}</span> ${esc(u.text)}</p>`).join('') : '<p class="hint">Claude works on the island while you\'re away. Notes show up here.</p>'}`;
}

