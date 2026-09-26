// ============================================================
// PER-FRAME VISUALS
// ============================================================
const vec = new T3.Vector3();
let flash = 0, camHome = false, lastTouch = -99;
function daylight() { const t = W.t; if (t < 0.03) return 0.25 + (t / 0.03) * 0.75; if (t < 0.55) return 1; if (t < 0.66) return 1 - ((t - 0.55) / 0.11) * 0.75; return 0.25; }
function visuals(dt) {
  const L = daylight(), t = W.t;
  const sa = (t * 1.3 - 0.15) * Math.PI;
  sun.position.set(Math.cos(sa) * 60, 40 + Math.sin(sa) * 40, 0);
  sun.intensity = 0.62 * L * (W.weather === 'clear' ? 1 : 0.62);
  hemi.intensity = 0.22 + 0.33 * L;
  nightLight.intensity = (1 - L) * 0.55;
  const dusk = t > 0.5 && t < 0.66 ? Math.sin(((t - 0.5) / 0.16) * Math.PI) : t < 0.04 ? Math.sin((t / 0.04) * Math.PI) * 0.6 : 0;
  if (cfg.boxMode) scene.background.copy(black);
  else { scene.background.copy(skyNight).lerp(skyDay, L); scene.background.lerp(skyDusk, dusk * 0.5); if (W.weather !== 'clear') scene.background.lerp(grey, 0.35 * L); }
  if (flash > 0) { scene.background.lerp(white, flash * 0.5); flash -= dt * 3; }
  if (W.weather === 'storm' && L > 0.5 && rand() < dt * 0.15) flash = 1;
  stars.material.opacity = cfg.boxMode ? 0.6 * (1 - L) + 0.1 : (1 - L) * 0.9;
  const lampOn = L < 0.7 ? 1 : 0;
  for (const m of lampMats) m.emissive.setRGB(lampOn, lampOn * 0.85, lampOn * 0.5);
  for (const m of lanternMats) m.emissive.copy(m.color).multiplyScalar(lampOn * 0.9);
  for (let i = 0; i < windowMats.length; i++) {
    const p = W.people.find((q) => q.room === i), m = windowMats[i];
    if (!p) { m.emissive.setRGB(0, 0, 0); m.color.set('#3a3f66'); continue; }
    const home = p.inside && p.task?.kind === 'home';
    const lit = home && ((t > 0.55 && t < 0.8) || t < 0.012);
    if (lit) { m.color.set('#fff4d0'); m.emissive.setHSL(p.body.hue / 360, 0.9, 0.55).multiplyScalar(0.8); }
    else { m.color.set(home ? '#2a2d4a' : '#5a6aa0'); m.emissive.setRGB(0, 0, 0); }
  }
  for (let i = 0; i < jets.length; i++) { const k = ((now * 0.8 + i / jets.length) % 1), a = (i / jets.length) * Math.PI * 2; jets[i].position.set(Math.cos(a) * k * 1.8, 3.0 + Math.sin(k * Math.PI) * 1.1 - k * 2.2, Math.sin(a) * k * 1.8); }
  bushBerries.forEach((bs, i) => bs.forEach((b, k) => (b.visible = k < W.bushes[i])));
  for (const c of clouds) { const u = c.userData; u.a += u.s * dt; c.position.set(Math.cos(u.a) * u.r, u.y, Math.sin(u.a) * u.r); u.m.color.set(W.weather === 'clear' ? '#ffffff' : '#c3cad8'); u.m.opacity = cfg.boxMode ? 0.35 : 0.95; }
  projectGroup.children.forEach((o) => { if (o.userData.spin) o.rotation.y += dt; });
  if (labsGroup) labsGroup.traverse((o) => { if (o.userData.blink) o.visible = Math.floor(now * 1.5) % 2 === 0; });
  if (landGroup) landGroup.traverse((o) => { if (o.userData.spinY) o.rotation.y += dt * 0.5; });
  if (placedGroup) placedGroup.traverse((o) => { if (o.userData.spinY) o.rotation.y += dt * 0.6; if (o.userData.steam !== undefined) { const k = ((now * 0.45 + o.userData.steam) % 1); o.position.y = 0.6 + k * 2.4; o.material.opacity = 0.5 * (1 - k); o.scale.setScalar(0.6 + k); } if (o.userData.spin) o.rotation.z += dt * 0.8; if (o.userData.flame) { o.scale.y = 0.8 + Math.sin(now * 12 + o.id) * 0.2; o.visible = true; } });
  rain.visible = W.weather === 'rain' || W.weather === 'storm';
  if (rain.visible) { const a = rainGeo.attributes.position.array, sp = W.weather === 'storm' ? 34 : 22; for (let i = 0; i < RAIN_N; i++) { a[i * 3 + 1] -= sp * dt; if (a[i * 3 + 1] < 0) a[i * 3 + 1] = 34; } rainGeo.attributes.position.needsUpdate = true; }
  foam.material.opacity = 0.4 + Math.sin(now * 1.2) * 0.15;
  sea.material.color.set(cfg.boxMode ? '#0f2740' : '#6ccff2');

  const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
  for (const p of W.people) {
    const m = meshes.get(p.id); if (!m) continue;
    m.root.visible = !p.inside;
    const onPier = p.z > 28 && Math.abs(p.x) < 2.6;
    m.root.position.set(p.x, onPier ? 0.28 : p.z * p.z + p.x * p.x < 149 ? 0.08 : 0.02, p.z);
    let dy = p.face - m.root.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    m.root.rotation.y += dy * Math.min(1, dt * 10);
    const walk = p.moving ? now * 10 * p.body.speed : 0;
    m.legs[0].rotation.x = Math.sin(walk) * 0.6; m.legs[1].rotation.x = -Math.sin(walk) * 0.6;
    m.arms[0].rotation.x = -Math.sin(walk) * 0.5; m.arms[1].rotation.x = Math.sin(walk) * 0.5;
    m.fig.position.y = p.moving ? Math.abs(Math.sin(walk)) * 0.12 : 0;
    const sitting = p.task?.kind === 'cafe' && p.task.phase === 'do';
    if (sitting) { m.fig.position.y = 0.28; m.legs.forEach((l) => (l.rotation.x = -1.3)); }
    const praying = p.task?.kind === 'pray' && p.task.phase === 'do';
    if (praying) { m.head.rotation.x = -0.45; m.arms.forEach((a) => (a.rotation.x = -2.4)); } else m.head.rotation.x = 0;
    const working = p.task?.kind === 'work' && p.task.phase === 'do';
    lookFrame(p, m);
    m.tools.visible = working || (p.job && p.job !== 'pier' && p.job !== 'garden' && p.task?.kind === 'work');
    m.fig.rotation.x = working && p.job === 'garden' ? 0.25 + Math.sin(now * 2 + p.x) * 0.1 : 0;
    m.head.rotation.z = p.hunger > 0.85 ? 0.2 : Math.sin(now * 0.8 + p.x) * 0.04;
    const blink = ((now + p.x * 3) % 3.7) < 0.12;
    m.eyes.forEach((e) => (e.scale.y = blink ? 0.2 : 1.45));
    m.mouth.scale.set(1, p.bubble && p.bubble.until > now && p.bubble.text !== '…' ? 1 + Math.abs(Math.sin(now * 14)) * 0.8 : 1, 1);
    faceUpdate(p, m, blink);
    poseFigure(p, m);
    const tag = m.tag, show = !p.inside && !interior;
    tag.style.display = show ? '' : 'none';
    if (!show) continue;
    vec.set(p.x, m.root.position.y + 2.55 * m.root.scale.x + (p.outfit.hat ? 0.4 : 0), p.z).project(camera);
    if (vec.z > 1) { tag.style.display = 'none'; continue; }
    m.sx = (vec.x * 0.5 + 0.5) * w; m.sy = (-vec.y * 0.5 + 0.5) * h;
    const b = p.bubble && p.bubble.until > now ? p.bubble.text : '';
    if (m.tagBub.textContent !== b) m.tagBub.textContent = b;
    m.tagBub.hidden = !b; m.tagBub.classList.toggle('sky', !!(b && p.bubble.sky));
    const e = p.emote && p.emote.until > now ? p.emote.ch : '';
    if (m.tagEmo.textContent !== e) { m.tagEmo.textContent = e; m.tagEmo.style.color = e === '♥' ? '#ff6f9c' : e === '✦' || e === '✧' ? '#ffd36b' : e === '☁' ? '#b8bfd8' : e === '○' ? '#8fe0b0' : e === '✕' ? '#ff9090' : '#ffffff'; }
    const nk = p.name + (p.level || 1);
    if (m.nmKey !== nk) { m.nmKey = nk; m.tagNm.innerHTML = esc(p.name) + ` <span class="lv">Lv ${p.level || 1}</span>`; }
    const pr = !b && !e && problemOf(p), icon = pr ? PROB_ICON[pr.kind] : '';
    if (m.tagTh.textContent !== icon) m.tagTh.textContent = icon; m.tagTh.hidden = !icon;
    tag.classList.toggle('sel', p.id === openDetail);
  }
  if (!interior) declutterTags();
  const sel = openDetail && person(openDetail);
  selRing.visible = !!(sel && !sel.inside && !interior);
  if (sel && sel.moving && !interior && !sel.inside) Sound.step();
  if (sel) { selRing.position.set(sel.x, sel.z > 28 && Math.abs(sel.x) < 2.6 ? 0.3 : 0.1, sel.z); }
  cameraFrame(dt);
  if (interior) { if (interior.kind === 'room' && !person(interior.id)) closeInterior(); else interiorFrame(); }
}
function orbitBy(dx, dy, dz) {
  const cam = interior ? roomCam : camera, ctl = interior ? roomControls : controls;
  const off = cam.position.clone().sub(ctl.target);
  const s = new T3.Spherical().setFromVector3(off);
  s.theta -= dx * 0.008 * (cfg.mirror ? -1 : 1);
  s.phi = clamp(s.phi - dy * 0.006, ctl.minPolarAngle, ctl.maxPolarAngle);
  if (interior) s.theta = clamp(s.theta, ctl.minAzimuthAngle, ctl.maxAzimuthAngle);
  s.radius = clamp(s.radius * Math.pow(1.004, dz), ctl.minDistance, ctl.maxDistance);
  off.setFromSpherical(s); cam.position.copy(ctl.target).add(off);
  lastTouch = now;
}

