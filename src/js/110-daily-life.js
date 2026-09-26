// ============================================================
// DAILY LIFE
// ============================================================
function routeAround(from, to) {
  for (const [ox, oz, OR] of OBSTACLES) { const d = routeAround1([from[0] - ox, from[1] - oz], [to[0] - ox, to[1] - oz], OR); if (d.length) return d.map(([x, z]) => [x + ox, z + oz]); }
  return [];
}
function routeAround1(from, to, FOUNTAIN_R) {
  const ax = from[0], az = from[1], bx = to[0], bz = to[1];
  const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
  const t = clamp(-(ax * dx + az * dz) / L2, 0, 1);
  const cx = ax + dx * t, cz = az + dz * t, cd = Math.hypot(cx, cz);
  if (cd >= FOUNTAIN_R || t <= 0.02 || t >= 0.98) return [];
  let nx = cx, nz = cz;
  if (cd < 0.01) { nx = -dz; nz = dx; }
  const n = Math.hypot(nx, nz), R = FOUNTAIN_R + 1.4;
  const mid = [nx / n * R, nz / n * R];
  // two waypoints hugging the fountain so the turn stays smooth
  const ang = Math.atan2(mid[1], mid[0]), sgn = Math.sign((ax * dz - az * dx)) || 1;
  return [[Math.cos(ang + 0.55 * sgn) * R, Math.sin(ang + 0.55 * sgn) * R], mid, [Math.cos(ang - 0.55 * sgn) * R, Math.sin(ang - 0.55 * sgn) * R]].filter((q, i, arr) => i === 1 || true);
}
function bridgedAt(x, z) { for (const k of W.lobes || []) { const L = LOBES[k]; if (!L.bridge) continue; const [cx, cz] = lobeCenter(k); if (Math.hypot(x - cx, z - cz) < lobeR(k) + 1) return k; } return null; }
function bridgeVia(k, out) { const L = LOBES[k], D = L.d || LOBE_D, R = lobeR(k); const pts = [polar(L.a, 12.2), polar(L.a, 29), polar(L.a, D - R + 1)]; return out ? pts.reverse() : pts; }
function goTo(p, dest, spot) {
  const pts = [];
  const sp0 = spot || TOWN[dest].spot, fromIsle = bridgedAt(p.x, p.z), toIsle0 = bridgedAt(sp0[0], sp0[1]);
  if (fromIsle && fromIsle !== toIsle0) pts.push(...bridgeVia(fromIsle, true));
  const cur = TOWN[p.at] || TOWN.plaza, d = TOWN[dest];
  const E = (x) => (!x ? [] : Array.isArray(x[0]) ? x : [x]);
  if (dest !== p.at) {
    if (cur.zone === 'dt' && d.zone === 'dt') pts.push(...E(cur.local).slice().reverse(), ...E(d.local));
    else pts.push(...E(cur.entry).slice().reverse(), ...E(d.entry));
  }
  if (toIsle0 && toIsle0 !== fromIsle) pts.push(...bridgeVia(toIsle0, false));
  pts.push(spot || d.spot);
  const out = []; let prev = [p.x, p.z];
  for (const q of pts) { const det = routeAround(prev, q); const ordered = det.length ? orderDetour(prev, det) : []; out.push(...ordered, q); prev = q; }
  p.path = out.map(([x, z]) => ({ x, z }));
  p.dest = dest; p.stuckT = 0; p.lastD = Infinity;
}
function orderDetour(from, pts) { const [a, b, c] = pts; return Math.hypot(a[0] - from[0], a[1] - from[1]) <= Math.hypot(c[0] - from[0], c[1] - from[1]) ? [a, b, c] : [c, b, a]; }
const jitter = ([x, z], r) => [x + (rand() - 0.5) * r, z + (rand() - 0.5) * r];
function workSpot(job) {
  if (job === 'janitor') { const a = rand() * 6.28, r = FOUNTAIN_R + 2 + rand() * 6; return [Math.cos(a) * r, Math.sin(a) * r]; }
  if (job === 'builder') { const a = rand() * 6.28, r = 4.5 + rand() * 4; return [DT.x + Math.cos(a) * r, DT.z + Math.sin(a) * r]; }
  if (job === 'pier') return [(rand() - 0.5) * 1.6, 39.2];
  if (job === 'garden') return jitter(TOWN.garden.spot, 4);
  if (job === 'cafe') return jitter(polar(212, 16.4), 0.8);
  return jitter(TOWN[JOBS[job].place].spot, 1.2);
}
function setTask(p, kind, dest, spot, extra = {}) { p.task = { kind, phase: 'go', ...extra }; goTo(p, dest, spot); }
function strollSpot() {
  if ((W.placed || []).length && rand() < 0.35) { const ps = placeStrollSpot(); if (ps) return ['plaza', ps.spot]; }
  const r = rand();
  if (r < 0.18) { const a = rand() * Math.PI * 2, rr = 4.5 + rand() * 5; return ['downtown', [DT.x + Math.cos(a) * rr, DT.z + Math.sin(a) * rr]]; }
  if (r < 0.45) { const a = rand() * Math.PI * 2, rr = FOUNTAIN_R + 1.2 + rand() * 6; return ['plaza', [Math.cos(a) * rr, Math.sin(a) * rr]]; }
  if (r < 0.52) return ['pier', [(rand() - 0.5) * 1.6, 31 + rand() * 7]];
  if (r < 0.62) { const a = rand() * 6.28, rr = rand() * 6; return ['beach', [BEACH[0] + Math.cos(a) * rr, BEACH[1] + Math.sin(a) * rr]]; }
  if (r < 0.8) return ['park', jitter(TOWN.park.spot, 6)];
  return ['garden', jitter(TOWN.garden.spot, 5)];
}
function plan(p) {
  const t = W.t;
  const ev = W.event && W.event.day === W.day ? EVENTS[W.event.id] : null;
  const going = ev && W.event.going.includes(p.id);
  if (t >= 0.6 && !(going && t < ev.t1)) { setTask(p, 'home', homeKey(p)); return; }
  if (healthPlan(p)) return;
  if (going && t >= ev.t0 - 0.015 && t < ev.t1) { const cp = W.event.couple ? W.event.couple.indexOf(p.id) : -1; const spot = cp >= 0 ? [cp ? 0.8 : -0.8, FOUNTAIN_R + 1.3] : ev.place === 'plaza' ? (() => { const a = rand() * 6.28, rr = FOUNTAIN_R + 1.5 + rand() * 5.5; return [Math.cos(a) * rr, Math.sin(a) * rr]; })() : ev.place === 'pier' ? [(rand() - 0.5) * 1.8, 31 + rand() * 8] : ev.place === 'cafe' ? jitter(polar(212, 15), 3) : jitter(TOWN[ev.place].spot, 5); setTask(p, 'event', ev.place, spot, { until: ev.t1 }); return; }
  if (planPicket(p)) return;
  if (planBuyLaptop(p)) return;
  if (p.job && p.grow >= 1 && !p.workedToday && !p.visitor && t < 0.24) { setTask(p, 'work', JOBS[p.job].place, workSpot(p.job)); return; }
  if (goalPlan(p)) return;
  const seek = p.makeup || p.befriend || p.confessTo || p.proposeTo || p.breakWith || p.confront;
  if (seek) { const t = person(seek); if (!t) { p.makeup = p.befriend = p.confessTo = p.proposeTo = p.breakWith = p.confront = null; } else if (!t.inside) { setTask(p, 'visit', t.path.length ? t.dest : t.at, jitter([t.x, t.z], 1.5), { who: t.id }); return; } }
  if (t > 0.26 && t < 0.56 && p.hunger < 0.6 && planDate(p)) return;
  if (planHangout(p)) return;
  if (planLandmark(p)) return;
  if (planRead(p)) return;
  if (planBrowse(p)) return;
  if (planSurf(p)) return;
  if (p.hunger > 0.45) {
    if (purse(p) >= 1) { const r2 = rand(); setTask(p, 'eat', purse(p) < 2 || p.saving || r2 < 0.45 ? 'mart' : r2 < 0.65 ? 'cafe' : r2 < 0.85 ? 'bakery' : 'icecream'); return; }
    const i = W.bushes.findIndex((n) => n > 0);
    if (i >= 0) { setTask(p, 'forage', 'plaza', [BUSHES[i][0] * 0.86, BUSHES[i][1] * 0.86], { bush: i }); return; }
  }
  if (!p.saving && purse(p) >= (sharing() && !p.visitor ? 15 : 7) && rand() < 0.3) { setTask(p, 'shop', pick(['clothes', 'nook', 'nook', 'books'])); return; }
  if (!p.saving && purse(p) >= 2 && rand() < (/game|League/i.test(p.interests || '') ? 0.3 : 0.08)) { setTask(p, 'arcade', 'arcade'); return; }
  if (W.project && p.coins >= 9 && (!p.saving || W.project.id === 'computer') && rand() < 0.2) { setTask(p, 'donate', 'plaza', jitter([0, 4.6], 1)); return; }
  const r = rand();
  if (r < 0.2 && p.coins >= 1 && !p.saving) {
    const taken = new Set(W.people.filter((q) => q.task?.kind === 'cafe').map((q) => q.task.seat));
    const free = CAFE_SEATS.map((s, i) => i).filter((i) => !taken.has(i));
    if (free.length) { const seat = pick(free); setTask(p, 'cafe', 'cafe', CAFE_SEATS[seat], { seat }); return; }
  }
  if (r < 0.42) {
    const friends = W.people.filter((q) => q !== p && !q.inside && (p.feelings[q.id]?.score || 0) >= 2);
    if (friends.length) { const f = pick(friends); setTask(p, 'visit', f.path.length ? f.dest : f.at, jitter([f.x, f.z], 2.5), { who: f.id }); return; }
  }
  if (p.grow < 1) { const par = W.people.find((q) => p.parents.includes(q.name) && !q.inside); if (par && rand() < 0.6) { setTask(p, 'visit', par.path.length ? par.dest : par.at, jitter([par.x, par.z], 2), { who: par.id }); return; } }
  if (p.cr.wish && rand() < 0.15) { const [pl, sp] = strollSpot(); setTask(p, 'pray', pl, sp); return; }
  if (seasonOf().id === 'winter' && t < 0.55 && rand() < 0.07 && (W.snowmen || []).length < 8) { const [pl, sp] = strollSpot(); setTask(p, 'snowman', pl, sp); return; }
  const [pl, sp] = strollSpot();
  setTask(p, 'stroll', pl, sp);
}
function startDo(p) {
  const k = p.task.kind;
  p.task.phase = 'do';
  if (k === 'home') { p.inside = true; p.busyUntil = Infinity; if (interior?.kind === 'room' && interior.id === p.id) interior.dirty = true; return; }
  if (k === 'eat' || k === 'shop') { p.inside = true; p.busyUntil = now + 2.8 * ts(); return; }
  if (k === 'arcade') { p.inside = true; p.busyUntil = now + 5 * ts(); return; }
  if (k === 'cafe') { p.busyUntil = now + 11 * ts(); if (p.coins > 1 && rand() < 0.6) eatAt(p, 'cafe'); else bubble(p, pick(['What a view.', 'I love this spot.']), 2.2); return; }
  if (k === 'work' && JOBS[p.job]?.indoor) p.inside = true;
  if (k === 'work') { p.busyUntil = now + 1; if (p.job === 'pier') p.face = 0; if (SHOPS[p.job]) W.keeper[p.job] = p.id; return; }
  if (k === 'forage') { p.busyUntil = now + 1.5 * ts(); return; }
  if (k === 'meeting') { p.busyUntil = Infinity; p.face = Math.atan2(-p.x, -p.z); return; }
  if (k === 'event') { p.busyUntil = now + 1; return; }
  if (k === 'donate') { p.busyUntil = now + 1.5 * ts(); return; }
  if (k === 'hangout') { hangoutStart(p); return; }
  if (k === 'read') { readStart(p); return; }
  if (k === 'surf') { surfStart(p); return; }
  if (k === 'picket') { picketStart(p); return; }
  if (k === 'landmark') { p.busyUntil = now + 5 * ts(); const pl = (W.placed || []).find((q) => q.id === p.task.id); if (pl) p.face = Math.atan2(pl.x - p.x, pl.z - p.z); bubble(p, ({ carousel: ['Wheee!', 'One more ride!'], onsen: ['Ahhh…', 'So warm.'], clinic: ['Just a checkup.', 'Say ahh.'], observatory: ['Look at all the stars.', 'Is that a planet?'], museum: ['Ooh, a golden koi!', 'Culture.'], ferris: ['I can see my house!', "Don't rock it!"] }[p.task.type] || ['Nice.'])[Math.floor(rand() * 2)], 2.6); return; }
  if (k === 'court') { p.inside = true; p.busyUntil = now + (p.task.wed ? 4 : 9) * ts(); if (interior?.kind === 'hall') interior.dirty = true; return; }
  if (k === 'service') { p.busyUntil = now + 5 * ts(); p.face = Math.atan2(p.task.x - p.x, p.task.z - p.z); bubble(p, pick(['Community service. Great.', 'Planting flowers. As a punishment. Sure.', 'This is so embarrassing.']), 2.6); return; }
  if (k === 'snowman') { p.busyUntil = now + 4 * ts(); p.face = rand() * 6.28; bubble(p, pick(['Snowman time!', 'Roll, roll, roll…', 'This one will be the best one.']), 2.4); return; }
  if (k === 'date') { p.busyUntil = now + 10 * ts(); const q = person(p.task.with); if (q) p.face = Math.atan2(q.x - p.x, q.z - p.z); emote(p, '💕', 3); { const q2 = person(p.task.with); if (q2 && q2.task?.kind === 'date' && q2.task.phase === 'do' && q2.state === 'free' && p.state === 'free' && !q2.inside) setTimeout(() => { if (p.state === 'free' && q2.state === 'free') physicalScene(p, q2, pick(['cuddle', 'cuddle', 'hug'])); }, 900); } if (rand() < 0.6) bubble(p, pick(['Hi, you.', 'I saved you a spot.', 'This is nice.', 'Hehe. Hi.', 'You look good today.']), 2.4); return; }
  if (k === 'pray') { p.busyUntil = now + 4 * ts(); p.face = rand() * 6; bubble(p, `Creator, if you can hear me… I wish for ${wishText(p.cr.wish)}.`, 4.2, true); emote(p, '✧', 4); return; }
  if (healthStart(p, k)) return;
  if (k === 'buylaptop') { buyLaptopStart(p); return; }
  if (k === 'browse') { browseStart(p); return; }
  if (k === 'write') { writeStart(p); return; }
  if (k === 'crowd') { p.busyUntil = Infinity; if (W.scene) faceCenter(p, W.scene); return; }
  p.busyUntil = now + (2 + rand() * 4) * ts();
}
function finishDo(p) {
  const k = p.task.kind;
  if (['rest', 'doctor', 'therapy', 'ritual'].includes(k)) return healthFinish(p, k);
  if (k === 'buylaptop') { buyLaptopDone(p); return true; }
  if (k === 'browse') { browseDone(p); return true; }
  if (k === 'write') { writeDone(p); return true; }
  if (k === 'work') { if (W.t < workUntil(p.job)) { p.busyUntil = now + 1; return false; } if (JOBS[p.job]?.indoor) p.inside = false; endWork(p); }
  else if (k === 'event') { if (W.t < (p.task.until || 0) && W.t < 0.67) { p.busyUntil = now + 1; if (rand() < 0.02) { const ev = EVENTS[W.event?.id]; if (ev) bubble(p, pick(['This is so fun!', 'Best day ever.', W.event.id === 'snowball' ? 'Got you!' : W.event.id === 'bday' ? 'Happy birthday!' : W.event.id === 'beach' ? 'The water is perfect!' : W.event.id === 'blossoms' ? 'The petals are falling on my head!' : W.event.id === 'harvest' ? 'Pass the pumpkin soup?' : W.event.id === 'wedding' ? "I'm not crying, you're crying." : W.event.id === 'stars' ? 'Look, a shooting star!' : W.event.id === 'fishing' ? 'I got a bite!' : 'Yay!']), 2); } return false; } if (W.event?.id === 'fishing' && W.event.host === p.id) { const winner = pick(W.people.filter((q) => W.event.going.includes(q.id))); if (winner) { winner.coins += 4; remember(winner, 'I won the fishing contest!', 3, 'won'); diary(`<b>${esc(winner.name)}</b> won the fishing contest and 4 coins.`); } } remember(p, `Went to ${EVENTS[W.event?.id]?.name || 'the event'}.`, 2, 'event'); addJoy(p, 10); }
  else if (k === 'hangout') hangoutEnd(p);
  else if (k === 'read') readProgress(p, 0.5);
  else if (k === 'surf') surfDone(p);
  else if (k === 'picket') bubble(p, pick(['We are not backing down.', 'Same time tomorrow if nothing changes.', 'My feet hurt. Worth it.']), 2.4);
  else if (k === 'landmark') landmarkDone(p);
  else if (k === 'court') { p.inside = false; if (interior?.kind === 'hall') interior.dirty = true; }
  else if (k === 'service') { if (!spotProblem(p.task.x, p.task.z)) { W.placed.push({ id: uid(), type: 'flowers', x: p.task.x, z: p.task.z, rot: rand() * 6.28, day: W.day, by: p.name }); buildPlaced(); diary(`🌷 <b>${esc(p.name)}</b> planted a flower bed as community service.`); } remember(p, 'Did community service. Planted flowers for the town.', 2, 'service'); bubble(p, pick(['Done. Happy now?', "…Okay, it's kind of pretty.", 'Never again.']), 2.4); }
  else if (k === 'snowman') { if (seasonOf().id === 'winter') { W.snowmen = W.snowmen || []; W.snowmen.push({ x: p.x + Math.sin(p.face) * 1.2, z: p.z + Math.cos(p.face) * 1.2, face: p.face + Math.PI, by: p.name, day: W.day, scarf: topColors(p)[0] || COLORS[p.outfit.shirt] && p.outfit.shirt }); if (W.snowmen.length > 8) W.snowmen.shift(); buildSnowmen(); addJoy(p, 8); bubble(p, pick(['Ta-da!', 'His name is Gerald.', 'Perfect.', 'Needs a hat. Oh well.']), 2.4); remember(p, 'Built a snowman.', 1, 'snowman'); diary(`<b>${esc(p.name)}</b> built a snowman.`); } }
  else if (k === 'date') { const q = person(p.task.with); if (q && !q.inside && Math.hypot(q.x - p.x, q.z - p.z) < 4) { feel(p, q, 0.5, true); addJoy(p, 12); remember(p, `Went on a date with ${q.name} at ${TOWN[p.at]?.name || 'town'}.`, 2, 'date', q.name); bubble(p, pick(['That was nice.', 'Same time tomorrow?', 'I had fun.', 'Walk me home?']), 2.4); } else { remember(p, `Waited for ${q?.name || 'my date'}, but they never showed up.`, 2, 'stoodUp', q?.name || null); if (q) feel(p, q, -0.4, true); bubble(p, 'They never came…', 2.4); } }
  else if (k === 'eat') { p.inside = false; eatAt(p, FOODS.some((f) => f.shop === p.at) ? p.at : 'mart'); }
  else if (k === 'shop') { p.inside = false; residentBuys(p, W.stock[p.at] ? p.at : 'clothes'); }
  else if (k === 'arcade') { p.inside = false; if (purse(p) >= 1) { spend(p, 1); const gamer = /game|League/i.test(p.interests || ''); addJoy(p, gamer ? 12 : 6); bubble(p, pick(gamer ? ['gg.', 'Carried, honestly.', 'One more round.', 'That was so clean.'] : ['High score!', 'I lost immediately.', 'That was fun!', 'My thumbs hurt.']), 2.6); remember(p, 'Played games at Pixel Palace.', 1, 'arcade'); const k2 = W.keeper.arcade && person(W.keeper.arcade); if (k2 && k2 !== p) earn(k2, 1); } }
  else if (k === 'forage') { const i = p.task.bush; if (W.bushes[i] > 0) { W.bushes[i]--; p.hunger = clamp(p.hunger - 0.22, 0, 1); bubble(p, pick(['Free berries!', 'Mm, a little sour.']), 2.2); remember(p, 'Ate berries off a bush because I had no coins.', 1, 'forage'); } else bubble(p, 'Someone took them all…', 2.2); }
  else if (k === 'donate' && W.project) { const n = Math.min(p.coins - 4, 1 + Math.floor(rand() * 3)); if (n > 0) { p.coins -= n; W.project.raised += n; bubble(p, `${plural(n, 'coin')} for ${PROJECTS[W.project.id].name}!`, 2.4); remember(p, `Chipped in ${plural(n, 'coin')} for ${PROJECTS[W.project.id].name}.`, 1, 'chip'); checkProject(); } }
  return true;
}
function endWork(p) {
  const J = JOBS[p.job];
  p.jobDays++;
  if (LAB_JOBS.includes(p.job)) researchWork(p);
  let pay = payOf(p) + (p.saving ? 1 : 0);
  if (p.job === 'pier') pay += Math.floor(rand() * 3);
  if (p.job === 'garden') pay += rand() < 0.4 ? 2 : 0;
  earn(p, pay); p.workedToday = true;
  craft(p); workInjury(p);
  const joy = p.body.jobAff[p.job] * 0.8 + (rand() - 0.5) * 0.6;
  p.jobMood = p.jobMood * 0.7 + joy;
  remember(p, `Worked as a ${J.short} and earned ${pay} coins.`, 1, 'work', null, { joy });
  bubble(p, sharing() ? pick([`${pay} coins for the pantry!`, 'Done! That goes to everyone.']) : joy > 0.3 ? pick(['Good day at work!', 'I love this job.', `+${pay} coins!`]) : joy < -0.3 ? pick(['Finally done…', 'Work was so long.']) : `+${pay} coins.`, 2.4);
  if (p.jobMood < -1.4 && p.jobDays > 2 && rand() < 0.5) {
    const next = Object.keys(JOBS).filter((j) => j !== p.job && qualifies(p, j)).sort((x, y) => p.body.jobAff[y] - p.body.jobAff[x] + (rand() - 0.5))[0];
    diary(`<b>${esc(p.name)}</b> quit being a ${JOBS[p.job].short} and became a ${JOBS[next].short}.`);
    remember(p, `I quit my job as a ${J.short}. Tomorrow I start as a ${JOBS[next].short}.`, 3, 'quit');
    p.job = next; p.jobDays = 0; p.jobMood = 0; dressMesh(p);
  }
}
function morningOutfit(p) {
  if (rand() < 0.4) {
    p.outfit.shirt = bestBy(p.wardrobe.shirts, (c) => p.likes[c] || 0);
    if (p.wardrobe.hats.length) { const i = bestBy(p.wardrobe.hats.map((_, i) => i), (i) => (p.likes['hat:' + p.wardrobe.hats[i].id] || 0) + (p.likes[p.wardrobe.hats[i].color] || 0)); p.outfit.hat = rand() < 0.85 ? p.wardrobe.hats[i] : null; }
    dressMesh(p);
  }
}

