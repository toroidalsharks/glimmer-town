// ============================================================
// SIMULATION STEP
// ============================================================
const isNight = () => W.t >= 0.63;
function step(dt) {
  if (!W.meeting) W.t += dt / cfg.daySec;
  if (W.t >= 0.018 && W.meetingDay !== W.day && !W.meeting && W.t < 0.2) { W.meetingDay = W.day; townMeeting().catch((e) => { console.error(e); W.meeting = null; }); }
  if (W.t >= 0.7 && W.reflectedDay !== W.day) nightfall();
  if (W.t >= 1) newDay();
  const dDay = dt / cfg.daySec;
  for (const p of W.people) {
    if (p.task?.kind === 'away') continue;
    const asleep = p.inside && p.task?.kind === 'home';
    if (!W.meeting) p.hunger = clamp(p.hunger + p.body.hungerRate * dDay * (asleep ? 0.35 : 1.15), 0, 1);
    if (p.hunger > 0.88 && !p.today.some((m) => m.tag === 'hungry')) remember(p, 'Went hungry for a long stretch.', 2, 'hungry');
    p.moving = false;
    poseStep(p, dt);
    if (jailHold(p)) continue;
    if (p.state === 'talk') continue;
    if (asleep) {
      if (W.t >= 0.008 + (p.room % 9) * 0.0012 && W.t < 0.6) { p.inside = false; p.task = null; p.at = homeKey(p); p.x = TOWN[homeKey(p)].spot[0] + (rand() - 0.5) * 2; p.z = TOWN[homeKey(p)].spot[1] + 0.3; }
      else continue;
    }
    if (!p.task && p.inside) { p.task = { kind: 'home', phase: 'do' }; p.busyUntil = Infinity; continue; }
    const k = p.task?.kind;
    if (W.t >= 0.6 && k !== 'home' && !p.inside && k !== 'meeting' && !(k === 'event' && W.event && EVENTS[W.event.id] && W.t < EVENTS[W.event.id].t1)) setTask(p, 'home', homeKey(p));
    if (!p.task) { if (!W.meeting) plan(p); continue; }
    if (p.task?.kind === 'walkwith') { walkWithStep(p, dt); continue; }
    if (p.path.length) {
      const tgt = p.path[0], dx = tgt.x - p.x, dz = tgt.z - p.z, d = Math.hypot(dx, dz);
      const achy = p.body.ailments?.length && W.t < 0.15 && !(p.healedUntil >= W.day) ? 0.75 : 1;
      if (achy < 1 && p.sickDay !== W.day && /sick/.test(p.body.ailments.join(' ')) && rand() < 0.01) { p.sickDay = W.day; bubble(p, pick(['Ugh. Sick again.', 'Mornings are the worst.', 'My joints. Man.']), 2.6); remember(p, 'Felt sick this morning, like always.', 1, 'sick'); }
      const sp = achy * healthSpeed(p) * 3.1 * p.body.speed * (p.hunger > 0.9 ? 0.65 : 1) * (0.7 + 0.3 * p.grow) * (W.weather === 'storm' ? 0.85 : 1) * (W.meeting ? 1.6 : 1);
      if (d < 0.2) { p.x = tgt.x; p.z = tgt.z; p.path.shift(); p.stuckT = 0; p.lastD = Infinity; if (!p.path.length) { p.at = p.dest; startDo(p); } continue; }
      const mv = Math.min(d, sp * dt);
      p.x += (dx / d) * mv; p.z += (dz / d) * mv; p.moving = true;
      p.face = Math.atan2(dx, dz);
      const rr = Math.hypot(p.x, p.z);
      if (rr < FOUNTAIN_R - 0.3) { p.x *= (FOUNTAIN_R - 0.3) / rr; p.z *= (FOUNTAIN_R - 0.3) / rr; }
      // stuck watchdog: if we stop getting closer, skip ahead and re-plan
      if (d < (p.lastD ?? Infinity) - 0.05) { p.lastD = d; p.stuckT = 0; } else { p.stuckT = (p.stuckT || 0) + dt; }
      if (p.stuckT > 2.5) { p.stuckT = 0; p.lastD = Infinity; p.x = tgt.x; p.z = tgt.z; p.path.shift(); if (!p.path.length) { p.at = p.dest; startDo(p); } }
      continue;
    }
    if (p.task.phase === 'go') { p.at = p.dest || p.at; startDo(p); continue; }
    if (p.task.phase === 'do' && now >= p.busyUntil) { if (finishDo(p) !== false) p.task = null; }
  }
  personalSpace(dt); textTick(); chirpTick(); healthTick(dt); dramaTick(); showTick(); clubTick(); socialTick(); notifyTick(); if (Math.floor(now) % 5 === 0 && Math.floor(now - dt) % 5 !== 0) laptopTick(); if (Math.floor(now) % 20 === 0 && Math.floor(now - dt) % 20 !== 0) agentDaily();
  const festNight = W.event?.id === 'festival' && W.event.day === W.day && W.t < 0.665;
  if ((!isNight() || festNight) && !W.meeting) {
    const ok = W.people.filter(canChat);
    for (let i = 0; i < ok.length; i++) for (let j = i + 1; j < ok.length; j++) {
      const a = ok[i], b = ok[j];
      if (a.state !== 'free' || b.state !== 'free') continue;
      if (d2(a, b) > 3.2) continue;
      if (a.task?.kind === 'work' && b.task?.kind === 'work' && rand() > 0.3) continue;
      const key = [a.id, b.id].sort().join('|');
      if (W.apart && (W.apart[key] || 0) >= W.day) continue;
      const seeks = (x, y) => x.makeup === y.id || x.befriend === y.id || x.confessTo === y.id || x.proposeTo === y.id || x.breakWith === y.id || x.confront === y.id;
      const special = seeks(a, b) ? a : seeks(b, a) ? b : null;
      if (!special && (W.pairCool[key] || 0) > now) continue;
      if (!special && wantsQuiet(a, b)) continue;
      if (!special && socialAvoids(a, b) && rand() < 0.9) continue;
      if (special || rand() < dt * (a.task?.kind === 'event' ? 2.5 : 1.3)) {
        const [x, y] = special ? (special === a ? [a, b] : [b, a]) : rand() < 0.5 ? [a, b] : [b, a];
        x.face = Math.atan2(y.x - x.x, y.z - x.z); y.face = Math.atan2(x.x - y.x, x.z - y.z);
        encounter(x, y).catch(() => {});
      }
    }
    romanceTick();
  }
}

