// ============================================================
// PERSONAL SPACE (no more standing inside each other)
// ============================================================
function personalSpace(dt) {
  const out = W.people.filter((p) => !p.inside && p.task?.kind !== 'away');
  for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
    const a = out[i], b = out[j];
    if ((a.pose && a.pose.with === b.id) || (b.pose && b.pose.with === a.id)) continue;
    if (a.task?.kind === 'walkwith' && a.task.lead === b.id || b.task?.kind === 'walkwith' && b.task.lead === a.id) continue;
    let dx = b.x - a.x, dz = b.z - a.z; const d = Math.hypot(dx, dz);
    const R = a.state === 'talk' && b.state === 'talk' ? 1.45 : (a.moving || b.moving) ? 0.8 : 1.0;
    if (d >= R) continue;
    if (d < 1e-3) { dx = rand() - 0.5; dz = rand() - 0.5; } else { dx /= d; dz /= d; }
    const push = (R - d) * Math.min(1, dt * 5);
    const fa = a.task?.phase === 'do' && a.task.kind === 'cafe' ? 0 : b.task?.phase === 'do' && b.task.kind === 'cafe' ? 1 : 0.5;
    a.x -= dx * push * fa; a.z -= dz * push * fa; b.x += dx * push * (1 - fa); b.z += dz * push * (1 - fa);
    for (const p of [a, b]) keepOnLand(p);
  }
}
function keepOnLand(p) {
  if (Math.abs(p.x) < 4 && p.z > 28.5 && p.z < 39.5) p.x = clamp(p.x, -1.25, 1.25); else if (Math.abs(p.x) < 4 && p.z >= 39.5 && p.z < 43) p.x = clamp(p.x, -2.3, 2.3);
  for (const [ox, oz, r] of OBSTACLES) { const dx = p.x - ox, dz = p.z - oz, d = Math.hypot(dx, dz); if (d < r + 0.3 && d > 1e-3) { p.x = ox + dx / d * (r + 0.3); p.z = oz + dz / d * (r + 0.3); } }
}
function spaceOut(a, b) {
  let dx = b.x - a.x, dz = b.z - a.z; const d = Math.hypot(dx, dz);
  if (d >= 1.45 || d < 1e-3) return;
  dx /= d; dz /= d;
  a.pose = { kind: 'step', tx: b.x - dx * 1.5, tz: b.z - dz * 1.5, until: now + 1.2, with: b.id };
}

