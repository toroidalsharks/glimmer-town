// ============================================================
// STARFALL FESTIVAL & FIREWORKS
// ============================================================
const bursts = [];
let lastBurst = 0;
function fireworksFrame(dt) {
  const fest = W.event?.id === 'festival' && W.event.day === W.day && W.t >= 0.595 && W.t < 0.665 && !interior;
  if (fest && now - lastBurst > 0.55) {
    lastBurst = now;
    const n = 70, pos = new Float32Array(n * 3), vel = [];
    const cx = (rand() - 0.5) * 34, cy = 20 + rand() * 10, cz = 20 + rand() * 30;
    for (let i = 0; i < n; i++) { pos[i * 3] = cx; pos[i * 3 + 1] = cy; pos[i * 3 + 2] = cz; const th = rand() * 6.28, ph = Math.acos(rand() * 2 - 1), sp = 5 + rand() * 3; vel.push([Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp, Math.sin(ph) * Math.sin(th) * sp]); }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3));
    const col = pick(['#ff8fb6', '#ffd36b', '#9fd3ff', '#c9b3ff', '#9fe3c4', '#ffffff']);
    const pts = new T3.Points(g, softPoints({ color: col, size: 0.7, transparent: true, opacity: 1, depthWrite: false }));
    scene.add(pts); bursts.push({ pts, vel, age: 0 }); Sound.boom();
  }
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i]; b.age += dt;
    const a = b.pts.geometry.attributes.position.array;
    for (let k = 0; k < b.vel.length; k++) { const v = b.vel[k]; v[1] -= 3.2 * dt; v[0] *= 0.985; v[2] *= 0.985; a[k * 3] += v[0] * dt; a[k * 3 + 1] += v[1] * dt; a[k * 3 + 2] += v[2] * dt; }
    b.pts.geometry.attributes.position.needsUpdate = true;
    b.pts.material.opacity = Math.max(0, 1 - b.age / 2.2);
    if (b.age > 2.2) { scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); bursts.splice(i, 1); }
  }
}

