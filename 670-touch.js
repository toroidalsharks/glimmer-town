// ============================================================
// TOUCH: hugs, cuddles, high fives, pats, fights, and everyone watching
// ============================================================
const POSE_DUR = { hug: 3.2, cuddle: 6, highfive: 1.8, pat: 2.4, fight: 3.2, poke: 1.6 };
const POSE_GAP = { hug: 0.72, cuddle: 0.6, highfive: 1.0, pat: 0.85, fight: 1.0, poke: 0.9 };
function freeBoth(a, b) { for (const p of [a, b]) if (p.state === 'talk' && !p.heldByDlg) p.state = 'free'; }
async function physicalScene(a, b, kind) {
  if (!a || !b || a.inside || b.inside || a === b) return;
  const dur = POSE_DUR[kind] || 2.5, gap = POSE_GAP[kind] || 1;
  a.state = b.state = 'talk';
  const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2; let dx = b.x - a.x, dz = b.z - a.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
  const until = now + dur + 0.6;
  a.pose = { kind, with: b.id, until, tx: mx - dx * gap / 2, tz: mz - dz * gap / 2, side: 1 };
  b.pose = { kind: kind === 'pat' ? 'patted' : kind === 'fight' ? 'fight' : kind === 'poke' ? 'poked' : kind, with: a.id, until, tx: mx + dx * gap / 2, tz: mz + dz * gap / 2, side: -1 };
  if (kind === 'cuddle') { let f = Math.atan2(dz, -dx); const toCam = Math.atan2(camera.position.x - mx, camera.position.z - mz); if (Math.cos(f - toCam) < 0) f += Math.PI; a.face = b.face = f; a.pose.lean = b.pose.lean = true; }
  else { a.face = Math.atan2(dx, dz); b.face = Math.atan2(-dx, -dz); }
  try {
    if (kind === 'hug') {
      emote(a, '♥', 3); emote(b, '♥', 3); bubble(a, pick(['C\'mere.', 'Hug!', 'I missed you.', 'You looked like you needed this.']), 2.4);
      feel(a, b, 0.4, true); feel(b, a, 0.4, true); addJoy(a, 8); addJoy(b, 8);
      remember(a, `Hugged ${b.name}.`, 1, 'hug', b.name); remember(b, `${a.name} hugged me.`, 1, 'hug', a.name);
      jealousyCheck(a, b, 'hugging');
    } else if (kind === 'cuddle') {
      emote(a, '💕', 5); emote(b, '💕', 5); bubble(a, pick(['Five more minutes.', 'This is my favorite spot.', 'Hehe.', 'You\'re warm.']), 2.6);
      setTimeout(() => bubble(b, pick(['Mhm.', 'Mine too.', 'Stay.', '…Hehe.']), 2.4), 2200);
      feel(a, b, 0.5, true); feel(b, a, 0.5, true); addJoy(a, 12); addJoy(b, 12);
      remember(a, `Cuddled with ${b.name}.`, 2, 'cuddle', b.name); remember(b, `Cuddled with ${a.name}.`, 2, 'cuddle', a.name);
      jealousyCheck(a, b, 'cuddling');
    } else if (kind === 'highfive') {
      bubble(a, pick(['Up top!', 'Yes!', 'Nice!']), 1.6); setTimeout(() => { spawnBurst(mx, 2.1, mz, ['#ffe98a', '#ffffff'], 16, 2, 0.25); Sound.ui(); bubble(b, pick(['Yeah!', 'Heck yes.', '✋']), 1.4); }, 600);
      feel(a, b, 0.25, true); feel(b, a, 0.25, true);
    } else if (kind === 'pat') {
      emote(b, '✿', 2.5); bubble(a, pick(['Good job today.', "You're growing so fast.", 'There, there.']), 2.4);
      feel(b, a, 0.4, true); addJoy(b, 6);
    } else if (kind === 'poke') {
      bubble(a, pick(['Boop.', 'Hey. Hey. Hey.', 'Tag, you\'re it.']), 1.6); setTimeout(() => bubble(b, pick(['Hey!', 'Rude!', 'Hehe, stop!']), 1.4), 700);
    } else if (kind === 'fight') {
      emote(a, '💢', dur); emote(b, '💢', dur);
      bubble(a, pick(['Take that back!', "You've had this coming.", 'Say that again!', 'Move.']), 2.2);
      setTimeout(() => bubble(b, pick(['Hey! Get off!', 'Are you serious?!', 'Ow!', "Don't touch me!"]), 2), 900);
      const dust = setInterval(() => spawnBurst(mx + (rand() - 0.5), 0.6, mz + (rand() - 0.5), ['#d8cfc0', '#bfb4a2', '#ffffff'], 10, 1.6, 0.4), 450);
      setTimeout(() => clearInterval(dust), dur * 1000);
      Sound.boom();
      feel(b, a, -1.5, true); feel(a, b, -0.5, true);
      remember(a, `Got into a fight with ${b.name}.`, 3, 'fight', b.name); remember(b, `${a.name} started a fight with me.`, 3, 'fight', a.name);
      diary(`💢 <b>${esc(a.name)}</b> and <b>${esc(b.name)}</b> got into a scuffle.`);
      if (rand() < 0.45) setTimeout(() => fileCase('fight', b, a), 5000);
      bystanders(a, b);
      setTimeout(() => fightInjury(a, b), dur * 1000);
    }
    await sleep(dur * 1000);
    if (kind === 'fight') { b.x += dx * 0.9; b.z += dz * 0.9; keepOnLand(b); }
  } finally {
    a.pose = b.pose = null; freeBoth(a, b);
    W.pairCool[[a.id, b.id].sort().join('|')] = now + 30 * ts();
  }
}
function bystanders(a, b) {
  const near = W.people.filter((q) => q !== a && q !== b && !q.inside && q.state === 'free' && Math.hypot(q.x - b.x, q.z - b.z) < 11);
  let defended = false;
  for (const q of near) {
    const toV = fscore(q, b), toA = fscore(q, a);
    if (!defended && toV >= 4 && toA < 3) {
      defended = true;
      const t = [b.x - (b.x - a.x) * 0.35 + (rand() - 0.5) * 0.4, b.z - (b.z - a.z) * 0.35];
      q.state = 'talk'; q.pose = { kind: 'defend', until: now + 4, tx: t[0], tz: t[1], with: a.id }; q.face = Math.atan2(a.x - t[0], a.z - t[1]);
      setTimeout(() => bubble(q, pick([`Hey! Leave ${b.name} alone!`, 'Back off.', `Not cool, ${a.name}.`, "That's enough!"]), 2.6), 700);
      setTimeout(() => { q.pose = null; if (q.state === 'talk' && !q.heldByDlg) q.state = 'free'; }, 4200);
      feel(q, a, -1.2, true); feel(b, q, 1.5, true); feel(a, q, -0.8, true);
      remember(q, `Stood up for ${b.name} when ${a.name} started a fight.`, 3, 'defended', b.name);
      remember(b, `${q.name} stood up for me against ${a.name}.`, 3, 'wasDefended', q.name);
      diary(`🛡 <b>${esc(q.name)}</b> stepped in and stood up for ${esc(b.name)}.`);
    } else if (toV <= -3 || toA >= 5 && toV < 1) {
      q.pose = { kind: 'snicker', until: now + 2.5 }; emote(q, '😏', 2.5);
      setTimeout(() => bubble(q, pick(['Hehe.', 'Pfft.', 'Get him!', 'lol.', 'Popcorn time.']), 1.8), 400 + rand() * 800);
      feel(b, q, -0.8, true); remember(b, `${q.name} laughed while ${a.name} picked a fight with me.`, 2, 'laughedAt', q.name);
    } else if (rand() < 0.5) { emote(q, '😮', 2); }
  }
}
function jealousyCheck(a, b, doing) {
  for (const q of W.people) {
    if (q === a || q === b || q.inside || q.state !== 'free' || isClaude(q)) continue;
    if (Math.hypot(q.x - a.x, q.z - a.z) > 13) continue;
    for (const [x, y] of [[a, b], [b, a]]) {
      const mine = q.partner === x.id, crush = !mine && fscore(q, x) >= 6.5 && x.partner !== q.id;
      if (!mine && !crush) continue;
      if (x.partner === y.id && !mine && rand() < 0.5) continue;
      q.pose = { kind: 'jealous', until: now + 3.5 }; emote(q, mine ? '💢' : '😒', 3.5);
      q.face = Math.atan2(x.x - q.x, x.z - q.z);
      bubble(q, mine ? pick([`…Why is ${x.name} ${doing} ${y.name}?`, `Excuse me?`, `Oh. Cool. Great.`]) : pick([`…Must be nice.`, `Why ${y.name}, though?`, 'Whatever. I don\'t care.']), 2.6);
      feel(q, y, mine ? -1.2 : -0.8, true); if (mine) feel(q, x, -0.5, true);
      if (mine && rand() < 0.25) setTimeout(() => fileCase('dispute', q, y), 6000);
      remember(q, `Saw ${x.name} ${doing} ${y.name}. ${mine ? 'We\'re together. What was that?' : "It shouldn't bother me. It does."}`, 3, 'jealousLove', x.name);
      if (rand() < 0.5) setTimeout(() => sendText(q, mine ? x : y, mine ? 'jealousPartner' : 'jealous'), 4000 + rand() * 6000);
      return;
    }
  }
}
function afterChat(a, b) {
  if (!a || !b || a.inside || b.inside || a.state !== 'free' || b.state !== 'free' || W.meeting) return;
  if (isNight() && !(W.event?.id === 'festival' && W.event.day === W.day)) return;
  const fa = fscore(a, b), fb = fscore(b, a), couple = a.partner === b.id, r = rand();
  if (couple && fa >= 4 && fb >= 4) { if (r < 0.3) return physicalScene(a, b, 'cuddle'); if (r < 0.5) return physicalScene(a, b, 'hug'); if (r < 0.8) return walkTogether(a, b, true); return; }
  if (a.grow >= 1 && b.grow < 1 && b.parents.includes(a.name) && r < 0.5) return physicalScene(a, b, 'pat');
  if (Math.min(fa, fb) >= 6 && r < 0.28) return physicalScene(a, b, 'hug');
  if (Math.min(fa, fb) >= 3 && r < 0.14) return physicalScene(a, b, 'highfive');
  if (Math.min(fa, fb) >= 2 && r > 0.93) return physicalScene(a, b, 'poke');
  if (fa >= 3 && fb >= 3 && r > 0.6 && r < 0.85) return walkTogether(a, b, false);
  if (fa <= -6 && r < 0.3) return physicalScene(a, b, 'fight');
  if (fb <= -6 && r < 0.3) return physicalScene(b, a, 'fight');
  if (fa <= -3 && r < 0.3) { a.pose = { kind: 'jealous', until: now + 2 }; emote(a, '😒', 2.5); bubble(a, pick(['Whatever.', 'Hmph.', 'Okay, bye.']), 1.8); }
}

// walking together (and holding hands)
function walkTogether(lead, f, hands) {
  if (!lead.task) plan(lead);
  if (!lead.task || !lead.path.length) return;
  f.task = { kind: 'walkwith', phase: 'go', lead: lead.id, hands, until: now + 40, idle: 0, side: rand() < 0.5 ? 1 : -1 }; f.path = [];
  bubble(f, hands ? pick(['Walk with me?', 'Can I come?', 'Hold my hand?']) : pick(['Wait up!', "I'll come with you.", 'Where are we going?']), 2.2);
  remember(f, `Walked around with ${lead.name}${hands ? ', holding hands' : ''}.`, hands ? 2 : 1, hands ? 'handhold' : 'walked', lead.name);
  if (hands) { remember(lead, `Walked around holding hands with ${f.name}.`, 2, 'handhold', f.name); jealousyCheck(lead, f, 'holding hands with'); }
}
function walkWithStep(p, dt) {
  const T = p.task, L = person(T.lead);
  if (!L || L.inside || L.task?.kind === 'away' || now > T.until || W.t >= 0.6) { p.task = null; if (L) bubble(p, pick(['See you!', 'That was nice.', 'Bye bye!']), 2); return; }
  if (!L.moving) T.idle += dt; else T.idle = 0;
  if (T.idle > 4) { p.task = null; bubble(p, pick(['See you later!', 'Okay, I\'m heading off.', 'That was fun.']), 2); return; }
  const f = L.face, rx = Math.cos(f) * T.side, rz = -Math.sin(f) * T.side;
  const tx = L.x + rx * 0.75, tz = L.z + rz * 0.75, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
  if (d > 0.08) { const sp = Math.max(3.1 * p.body.speed, 3.1 * L.body.speed) * (d > 1.5 ? 1.35 : 1.05); const mv = Math.min(d, sp * dt); p.x += dx / d * mv; p.z += dz / d * mv; p.moving = d > 0.15; p.face = d > 0.6 ? Math.atan2(dx, dz) : f; }
  else p.face = f;
  keepOnLand(p);
  if (T.hands && rand() < dt * 0.15) { emote(p, '💞', 2); }
}

// room visits in the evening
function planHangout(p) {
  if (W.t < 0.44 || W.t > 0.56 || p.visitor || p.grow < 1 || rand() > 0.05 || p.room < 0) return false;
  const pals = W.people.filter((q) => q !== p && !q.inside && q.state === 'free' && !q.visitor && q.room >= 0 && (q.partner === p.id || fscore(p, q) >= 5 && fscore(q, p) >= 4) && (!q.task || ['stroll', 'visit'].includes(q.task.kind)));
  if (!pals.length) return false;
  const q = pick(pals), door = TOWN[homeKey(p)].spot;
  setTask(p, 'hangout', homeKey(p), door, { host: p.id }); setTask(q, 'hangout', homeKey(p), [door[0] + 0.8, door[1] + 0.3], { host: p.id });
  bubble(p, pick([`Want to come over, ${q.name}?`, 'Come see my room!', 'My place? I have snacks.']), 2.6);
  return true;
}
function hangoutStart(p) {
  const host = person(p.task.host);
  p.inside = true; p.busyUntil = now + (host === p ? 11 : 9) * ts();
  if (host === p) for (const q of W.people) { if (q !== p && q.inside && q.task?.kind === 'hangout' && q.task.host === p.id) q.task.met = true; }
  else if (host && host.inside && host.task?.kind === 'hangout') p.task.met = true;
  if (interior?.kind === 'room' && host && interior.id === host.id) interior.dirty = true;
}
function hangoutEnd(p) {
  p.inside = false;
  const host = person(p.task.host);
  if (!host || host === p) return;
  const together = p.task.met || (host.inside && host.task?.kind === 'hangout');
  if (together) {
    feel(p, host, 0.6, true); feel(host, p, 0.6, true); addJoy(p, 10); addJoy(host, 10);
    const what = pick(['played video games', 'watched a movie', 'talked until it got dark', 'ate snacks on the floor', 'looked at old photos', 'made a blanket fort']);
    remember(p, `Went over to ${host.name}'s room. We ${what}.`, 2, 'hangout', host.name); remember(host, `Had ${p.name} over. We ${what}.`, 2, 'hangout', p.name);
    diary(`🏠 <b>${esc(p.name)}</b> went over to <b>${esc(host.name)}</b>'s room. They ${what}.`);
  }
}

