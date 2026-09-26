// ============================================================
// CAMERA: pan, glide to places, keyboard, photos
// ============================================================
let camGoal = null, unfollowId = null, wantPhoto = false, albumVer = 0;
const keysDown = new Set();
function shiftView(dx, dz) { controls.target.x += dx; controls.target.z += dz; camera.position.x += dx; camera.position.z += dz; }
function clampView() {
  const t = controls.target, cx = clamp(t.x, -90, 90), cz = clamp(t.z, -100, 78);
  if (cx !== t.x || cz !== t.z) shiftView(cx - t.x, cz - t.z);
}
function slideTo(x, z, k) { const t = controls.target; shiftView((x - t.x) * k, (z - t.z) * k); }
function userPanned() { camGoal = null; camHome = false; unfollowId = openDetail; lastTouch = now; }
function camSpots() {
  const L = [['town', 'Whole town', 0, -16, null], ['fountain', 'Fountain', 0, 0, 40], ['downtown', 'Downtown', DT.x, DT.z + 4, 52], ['pier', 'Pier', 0, 35, 34], ['park', 'Park', ...TOWN.park.spot, 36], ['beach', 'Seashell Beach', ...BEACH, 36], ['garden', 'Garden', ...TOWN.garden.spot, 36]];
  for (const k of W.lobes || []) L.push([k, LOBES[k].name, ...lobeCenter(k), 44]);
  return L;
}
function camGo(key) {
  if (key === 'reset') return resetView();
  const s = camSpots().find((x) => x[0] === key); if (!s || !controls) return;
  if (interior) closeInterior();
  camGoal = { x: s[2], z: s[3], r: s[4] }; unfollowId = openDetail; lastTouch = now;
}
function camForward() {
  const f = new T3.Vector3().subVectors(controls.target, camera.position); f.y = 0;
  if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
  const r = new T3.Vector3(-f.z, 0, f.x); if (cfg.mirror) r.multiplyScalar(-1);
  return [f, r];
}
function panBy(dx, dy) {
  if (interior || !controls) return;
  const [f, r] = camForward(), s = camera.position.distanceTo(controls.target) * 0.0018;
  shiftView(-r.x * dx * s + f.x * dy * s, -r.z * dx * s + f.z * dy * s);
  userPanned(); clampView();
}
function cameraFrame(dt) {
  if (interior) return;
  if (camHome) { camGoal = { x: 0, z: -16, r: null }; camHome = false; }
  const sel = openDetail && person(openDetail);
  if (camGoal) {
    const k = Math.min(1, dt * 2.4);
    slideTo(camGoal.x, camGoal.z, k);
    if (camGoal.r) { const off = camera.position.clone().sub(controls.target), len = off.length(); if (len > camGoal.r + 0.5) { off.setLength(len + (camGoal.r - len) * k); camera.position.copy(controls.target).add(off); } }
    if (Math.hypot(controls.target.x - camGoal.x, controls.target.z - camGoal.z) < 0.15) camGoal = null;
  } else if (cfg.follow && sel && !sel.inside && sel.id !== unfollowId) slideTo(sel.x, sel.z, Math.min(1, dt * 2.5));
  if (keysDown.size) {
    const [f, r] = camForward(), sp = camera.position.distanceTo(controls.target) * 0.7 * dt;
    let mx = 0, mz = 0;
    if (keysDown.has('w')) { mx += f.x; mz += f.z; } if (keysDown.has('s')) { mx -= f.x; mz -= f.z; }
    if (keysDown.has('d')) { mx += r.x; mz += r.z; } if (keysDown.has('a')) { mx -= r.x; mz -= r.z; }
    if (mx || mz) { shiftView(mx * sp, mz * sp); userPanned(); }
    if (keysDown.has('q')) orbitBy(-160 * dt, 0, 0); if (keysDown.has('e')) orbitBy(160 * dt, 0, 0);
    if (keysDown.has('+')) orbitBy(0, 0, -160 * dt); if (keysDown.has('-')) orbitBy(0, 0, 160 * dt);
  }
  clampView();
}
const KEYMAP = { w: 'w', arrowup: 'w', s: 's', arrowdown: 's', a: 'a', arrowleft: 'a', d: 'd', arrowright: 'd', q: 'q', e: 'e', '+': '+', '=': '+', '-': '-', _: '-' };
function wireCamKeys() {
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (fishing && (k === ' ' || k === 'enter')) { e.preventDefault(); if (fishing.running) reel(); else openFishing(); return; }
    if (k === 'escape' && !$('#fishBox').hidden) { closeFishing(); return; }
    if (k === 'p') { wantPhoto = true; return; }
    if (KEYMAP[k]) { keysDown.add(KEYMAP[k]); if (k.startsWith('arrow')) e.preventDefault(); }
  });
  addEventListener('keyup', (e) => { const k = KEYMAP[e.key.toLowerCase()]; if (k) keysDown.delete(k); });
  addEventListener('blur', () => keysDown.clear());
}
function setMoveMode(on) {
  cfg.moveMode = on;
  controls.touches.ONE = on ? T3.TOUCH.PAN : T3.TOUCH.ROTATE;
  controls.mouseButtons.LEFT = on ? T3.MOUSE.PAN : T3.MOUSE.ROTATE;
  $('#cbMove').setAttribute('aria-pressed', String(on));
  $('#cbMove').textContent = on ? '✥ Moving' : '✥ Move';
}
function renderGoto() {
  $('#goto').innerHTML = `<button class="btn gold" type="button" data-go="reset">⟲ Reset view</button>` + camSpots().map(([k, label]) => `<button class="btn" type="button" data-go="${k}">${esc(label)}</button>`).join('');
}
function wireCamBar() {
  $('#cbMove').addEventListener('click', () => { setMoveMode(!cfg.moveMode); toast(cfg.moveMode ? 'One finger now slides the camera around. Two fingers still zoom.' : 'One finger turns the camera again.'); });
  $('#cbGo').addEventListener('click', () => { const g = $('#goto'); if (g.hidden) renderGoto(); g.hidden = !g.hidden; });
  $('#goto').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (!b) return; camGo(b.dataset.go); $('#goto').hidden = true; });
  $('#cbPhoto').addEventListener('click', () => { wantPhoto = true; });
  $('#cbSong').addEventListener('click', () => { Sound.unlock(); const t = Sound.skip(); toast(t ? `♪ Now playing: ${t}` : 'Music is off in Settings.'); });
  $('#fishReel').addEventListener('click', () => reel());
  $('#fishCast').addEventListener('click', () => openFishing());
  $('#fishClose').addEventListener('click', () => closeFishing());
  wireCamKeys();
}
function wireZoomGuards() {
  const stop = (e) => e.preventDefault();
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, stop, { passive: false });
  document.addEventListener('dblclick', (e) => { if (!e.target.closest('input, textarea')) e.preventDefault(); }, { passive: false });
  document.addEventListener('touchmove', (e) => { if (e.touches && e.touches.length > 1 && !e.target.closest('#stage, #pad')) e.preventDefault(); }, { passive: false });
  document.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); if (!e.target.closest('#stage canvas')) orbitBy(0, 0, e.deltaY * 2); } }, { passive: false });
  document.addEventListener('pointerdown', () => { if (MODE === 'host') { userReturned(true); lastTouch = now; } }, true);
  document.addEventListener('keydown', () => { if (MODE === 'host') { userReturned(true); lastTouch = now; } }, true);
  $('#awayOk').addEventListener('click', () => { $('#awayBox').hidden = true; });
  if (window.visualViewport) visualViewport.addEventListener('resize', () => { if (visualViewport.scale > 1.02) resetPageZoom(); });
}
function resetPageZoom() {
  const vp = $('#vp'); if (!vp) return;
  vp.setAttribute('content', 'width=device-width, initial-scale=1.0001, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  setTimeout(() => { vp.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'); resize(); }, 60);
}
function resetView() {
  resetPageZoom();
  if (interior) closeInterior();
  const portrait = innerHeight > innerWidth;
  camGoal = null; camHome = false; unfollowId = openDetail;
  controls.target.set(0, 2, -16); camera.position.set(portrait ? 50 : 42, portrait ? 70 : 50, portrait ? 80 : 58);
  camera.zoom = 1; camera.updateProjectionMatrix(); controls.update(); resize();
}
const shines = [];
function shineCmd(id) {
  const i = shines.findIndex((s) => s.id === id); if (i < 0) return '';
  const s = shines.splice(i, 1)[0]; scene.remove(s.g);
  const v = s.big ? 8 : rand() < 0.62 ? 1 : rand() < 0.9 ? 2 : 3; W.creator.coins = Math.min(9999, W.creator.coins + v);
  spawnBurst(s.x, 1.2, s.z, ['#ffd36b', '#fff6d6'], s.big ? 50 : 18, 2, 0.3); Sound.coin(); if (s.big) Sound.levelup();
  W.shinesFound = (W.shinesFound || 0) + 1; markDirty();
  return s.big ? `A golden star! +${v} coins.` : `+${v} ✦`;
}
let nextShine = 5;
function shineFrame(dt) {
  if (MODE !== 'host' || interior) return;
  for (let i = shines.length - 1; i >= 0; i--) { const s = shines[i]; if (Math.hypot(s.x - controls.target.x, s.z - controls.target.z) > 42) { scene.remove(s.g); shines.splice(i, 1); } }
  for (const s of shines) { s.g.rotation.y += dt * 3; s.g.position.y = 1.2 + Math.sin(now * 3 + s.x) * 0.15; }
  if (now < nextShine || shines.length >= 3) return;
  nextShine = now + 11 + rand() * 11;
  const cx = controls.target.x, cz = controls.target.z;
  for (let k = 0; k < 20; k++) {
    const x = cx + (rand() - 0.5) * 30, z = cz + (rand() - 0.5) * 30;
    if (spotProblem(x, z)) continue;
    const big = rand() < 0.035, m = toon(big ? '#ffd36b' : '#ffe98a', { emissive: new T3.Color(big ? '#8a6a10' : '#6a5a10') });
    const g = new T3.Group(); const c = mesh(big ? new T3.OctahedronGeometry(0.9, 0) : cyl(0.6, 0.6, 0.14, 18), m, 0, 0, 0, false); if (!big) c.rotation.x = Math.PI / 2; g.add(c);
    g.position.set(x, 1.2, z); const id = uid(); g.traverse((o) => (o.userData.tap = { kind: 'shine', id })); scene.add(g); tappables.push(c);
    shines.push({ id, g, x, z, big }); break;
  }
}
const MATS = { wood: '🪵 wood', stone: '🪨 stone', flowers: '🌼 flowers', shells: '🐚 shells', parts: '⚙️ metal parts' };
const mats = () => { const M = (W.creator.mats = W.creator.mats || {}); for (const k of Object.keys(MATS)) M[k] = M[k] || 0; return M; };
const nodes = [], treeCool = {};
let nextNode = 3;
function nodeMesh(kind) {
  const g = new T3.Group();
  if (kind === 'wood') for (let i = 0; i < 3; i++) { const l = mesh(cyl(0.18, 0.18, 1.1, 8), toon('#9a6f4e'), 0, 0.2 + (i === 2 ? 0.3 : 0), (i - 1) * 0.36 * (i === 2 ? 0 : 1)); l.rotation.z = Math.PI / 2; g.add(l); }
  else if (kind === 'stone') { g.add(mesh(new T3.DodecahedronGeometry(0.5, 0), toon('#a9a3c2'), 0, 0.35, 0)); g.add(mesh(new T3.DodecahedronGeometry(0.3, 0), toon('#8a84a8'), 0.5, 0.2, 0.2)); }
  else if (kind === 'flowers') for (let i = 0; i < 6; i++) { const a = i * 1.05; g.add(mesh(cyl(0.02, 0.02, 0.4, 4), toon('#6fbf6a'), Math.cos(a) * 0.35, 0.2, Math.sin(a) * 0.35, false)); g.add(mesh(sph(0.13, 8, 6), toon(['#ff9fbf', '#ffe98a', '#c9b3ff', '#ffffff'][i % 4]), Math.cos(a) * 0.35, 0.45, Math.sin(a) * 0.35)); }
  else if (kind === 'parts') { for (let i = 0; i < 3; i++) { const gear = mesh(new T3.TorusGeometry(0.22, 0.08, 6, 8), toon(['#a9a3c2', '#c9ccd6', '#8a84a8'][i]), (i - 1) * 0.35, 0.1 + (i % 2) * 0.12, (i % 2) * 0.2); gear.rotation.x = Math.PI / 2 - 0.3; g.add(gear); } g.add(mesh(box(0.3, 0.12, 0.2), toon('#2f8f8a'), 0.1, 0.07, -0.25)); }
  else { const s = mesh(new T3.ConeGeometry(0.3, 0.5, 8), toon('#ffd3c7'), 0, 0.2, 0); s.rotation.z = 1.4; g.add(s); g.add(mesh(sph(0.16, 8, 6), toon('#fff4dc'), 0.45, 0.1, 0.2)); }
  g.userData.ringIdx = g.children.length;
  g.add(mesh(new T3.RingGeometry(0.75, 0.85, 20), new T3.MeshBasicMaterial({ color: 0xfff6d6, transparent: true, opacity: 0.6, side: 2 }), 0, 0.03, 0, false).rotateX(-Math.PI / 2));
  return g;
}
function nodeFrame(dt) {
  if (MODE !== 'host' || interior) return;
  const cx0 = controls.target.x, cz0 = controls.target.z;
  for (let i = nodes.length - 1; i >= 0; i--) { const n = nodes[i]; if (Math.hypot(n.x - cx0, n.z - cz0) > 42 || now - n.born > 150) { scene.remove(n.g); nodes.splice(i, 1); continue; } n.g.children[n.g.userData.ringIdx].scale.setScalar(1 + Math.sin(now * 3 + n.x) * 0.1); n.g.userData.gem.position.y = 1.5 + Math.sin(now * 2.5 + n.x) * 0.15; n.g.userData.gem.rotation.y += dt * 2; }
  if (now < nextNode || nodes.length >= 7) return;
  nextNode = now + 3 + rand() * 4;
  const cx = controls.target.x, cz = controls.target.z;
  const nearBeach = Math.hypot(cx - BEACH[0], cz - BEACH[1]) < 22, nearGreen = [TOWN.garden.spot, TOWN.park.spot, ...(W.lobes || []).map(lobeCenter)].some(([gx, gz]) => Math.hypot(cx - gx, cz - gz) < 16);
  for (let k = 0; k < 25; k++) {
    let x = cx + (rand() - 0.5) * 34, z = cz + (rand() - 0.5) * 34;
    const winter = seasonOf().id === 'winter';
    let kind = nearBeach && rand() < 0.65 ? 'shells' : pick(nearGreen ? ['flowers', 'flowers', 'flowers', 'wood', 'stone'] : ['wood', 'wood', 'stone', 'stone', 'flowers', 'flowers', 'shells']);
    if (winter && kind === 'flowers' && rand() < 0.5) kind = 'stone';
    if (Math.hypot(cx - DT.x, cz - DT.z) < 34 && rand() < 0.5) kind = 'parts';
    if (kind === 'parts') { [x, z] = polarDT(rand() * 360, 15.8 + rand() * 0.7); if (Math.hypot(x - cx, z - cz) > 30) continue; }
    else if (kind === 'shells') { const a = rand() * 6.28, rr = Math.sqrt(rand()) * (BEACH_R - 1.5); x = BEACH[0] + Math.cos(a) * rr; z = BEACH[1] + Math.sin(a) * rr; if (!nearBeach && rand() < 0.5) { const b = rand() * 6.28; x = Math.cos(b) * 29.6; z = Math.sin(b) * 29.6; if (Math.abs(x) < 3 && z > 0) continue; } }
    else if (spotProblem(x, z)) continue;
    const g = nodeMesh(kind); g.scale.setScalar(1.35);
    const gc = { wood: '#c49a6c', stone: '#c9c3e0', flowers: '#ff9fbf', shells: '#ffd3c7', parts: '#9fe3ff' }[kind], gem = mesh(new T3.OctahedronGeometry(0.22, 0), toon(gc, { emissive: new T3.Color(gc).multiplyScalar(0.5) }), 0, 1.5, 0, false); g.add(gem); g.userData.gem = gem;
    g.position.set(x, kind === 'shells' ? 0.05 : 0, z); const id = uid(); g.traverse((o) => (o.userData.tap = { kind: 'node', id })); scene.add(g); g.children.forEach((c) => tappables.push(c));
    nodes.push({ id, g, x, z, kind, born: now }); break;
  }
}
function gatherCmd(c) {
  const M = mats();
  if (c.bed) {
    if ((treeCool[c.bed] || 0) > now) return c.wood ? 'This tree needs a rest.' : 'Let the flowers grow back a little first.';
    treeCool[c.bed] = now + (c.bed === 'tgarden' ? 15 : 30);
    if (c.wood) { M.wood++; spawnBurst(c.x, 3, c.z, ['#f7b6c8', '#ffc9d6'], 16, 2, 0.35); markDirty(); return '+1 wood 🪵'; }
    if (seasonOf().id === 'winter' && rand() < 0.5) return 'Everything is frozen. Try again in a bit, or check the beach.';
    const n = 1 + (rand() < 0.4 ? 1 : 0); M.flowers += n;
    spawnBurst(c.x, 1, c.z, ['#ff9fbf', '#ffe98a', '#c9b3ff', '#ffffff'], 14, 1.6, 0.25); Sound.ui(); markDirty();
    return `+${n} flowers 🌼`;
  }
  if (c.tree) {
    if ((treeCool[c.id] || 0) > now) return 'This tree needs a rest. Try another one.';
    treeCool[c.id] = now + 25; const n = 1 + (rand() < 0.3 ? 1 : 0); M.wood += n;
    spawnBurst(c.x, 3.5, c.z, seasonOf().id === 'autumn' ? ['#f0a04b', '#e07b3c'] : seasonOf().id === 'winter' ? ['#ffffff'] : ['#8fd48a', '#b8e39a'], 18, 2, 0.35); Sound.step(); markDirty();
    if (rand() < 0.15) { M.flowers++; return `+${n} wood, and a flower fell out! 🌼`; }
    return `+${n} wood 🪵`;
  }
  const i = nodes.findIndex((n) => n.id === c.id); if (i < 0) return '';
  const n = nodes.splice(i, 1)[0]; scene.remove(n.g);
  const v = 1 + Math.floor(rand() * 2); M[n.kind] += v;
  spawnBurst(n.x, 0.8, n.z, ['#fff6d6', '#ffd36b'], 14, 1.6, 0.25); Sound.ui(); markDirty();
  return `+${v} ${MATS[n.kind]}`;
}
function recipe(kind, id) {
  if (kind === 'decor' && id === 'laptop') return { parts: 5, stone: 3, shells: 3, wood: 2, flowers: 0 };
  if (kind === 'hat') { const p = HATS[id].price; return { flowers: id === 'crown' ? 4 : 1, shells: Math.ceil(p / 3), wood: 0, stone: 0 }; }
  if (kind === 'food') { const f = foodById(id); return { flowers: 1 + Math.ceil(f.price / 2), shells: 1, wood: 1, stone: 0 }; }
  const p = DECOR[id].price;
  const R = { wood: Math.ceil(p / 2), stone: p >= 6 ? 1 : 0, flowers: ['bouquet', 'plant', 'painting', 'quilt'].includes(id) ? 3 : 0, shells: ['fishbowl', 'globe', 'musicbox'].includes(id) ? 2 : 0 };
  if (['bouquet'].includes(id)) R.wood = 0;
  return R;
}
const canMake = (R) => Object.entries(R).every(([k, v]) => (mats()[k] || 0) >= v);
const recipeText = (R) => Object.entries(R).filter(([, v]) => v).map(([k, v]) => `${v} ${MATS[k].split(' ')[0]}`).join(' ') || 'free';
function craftCmd(c) {
  const valid = c.kind === 'hat' ? HATS[c.id] : c.kind === 'food' ? FOODS.some((f) => f.id === c.id) : DECOR[c.id];
  if (!valid) return '';
  const R = recipe(c.kind, c.id); if (!canMake(R)) return "You don't have enough materials yet.";
  const M = mats(); for (const [k, v] of Object.entries(R)) M[k] -= v;
  const color = c.kind === 'food' ? null : COLORS[c.color] ? c.color : pick(Object.keys(COLORS));
  const it = newItem(c.kind, c.id, color, null, rand() < 0.25 ? 3 : 2); it.handmade = true; W.creator.items.push(it);
  Sound.sparkle(); markDirty(); diary(`<span class="cr">Creator</span> made ${a_an(esc(itemName(it)))} by hand.`);
  return `You made ${a_an(itemName(it))}! It's in your collection.`;
}
let craftPick = 'mint';
function workshopHtml() {
  if (!COLORS[craftPick]) craftPick = 'mint';
  const M = mats();
  const wishes = W.people.filter((p) => p.cr.wish && !['coins', 'book'].includes(p.cr.wish.kind));
  const card = (kind, id, color, label, who) => { const R = recipe(kind, id); return `<div class="item"><div class="item-top">${color ? `<span class="swatch" style="background:${COLORS[color]}"></span>` : ''}<span class="item-name">${esc(cap(label))}</span></div><span class="item-by">${who ? `✧ ${esc(who)} wishes for this · ` : ''}${recipeText(R)}</span><div class="btns"><button class="btn ${who ? 'gold' : ''}" type="button" data-craft="${kind}" data-cid="${id}" data-color="${color || ''}" ${canMake(R) ? '' : 'disabled'}>Make it</button></div></div>`; };
  return `<p class="label">Your workshop</p>
    <div class="chips">${Object.entries(MATS).map(([k, n]) => `<span class="chip">${n}: ${M[k] || 0}</span>`).join('')}</div>
    <p class="hint">🪵 Tap trees for wood. 🌼 Tap the town garden, flower beds and planters for flowers, or look around the park, garden and meadows. 🐚 Shells wash up on Seashell Beach (Go to… → Seashell Beach). 🪨 Stones turn up all over. ⚙️ Metal parts: tap the green recycling bin next to Glimmer Labs downtown, look for little gear piles on the downtown sidewalks, or crack Starlight crystals. A laptop takes a lot of them. Look for the little floating gems: each one marks something to pick up.</p>
    ${wishes.length ? `<p class="label">Wishes you can make</p><div class="items">${wishes.map((p) => { const w = p.cr.wish; return card(w.kind, w.id, w.color, wishText(w).replace(/^an? /, ''), p.name); }).join('')}</div>` : ''}
    <p class="label">Make anything</p>
    <p class="hint">Color: <b>${esc(craftPick)}</b></p>
    <div class="chips">${Object.entries(COLORS).map(([k, c]) => `<button class="sw" type="button" data-craftcolor="${k}" aria-pressed="${craftPick === k}" title="${k}" aria-label="${k}" style="background:${c}"></button>`).join('')}</div>
    <div class="items">${Object.keys(DECOR).map((id) => card('decor', id, craftPick, DECOR[id].name)).join('')}${Object.keys(HATS).map((id) => card('hat', id, craftPick, HATS[id].name)).join('')}</div>`;
}
let lastSongTalk = 0;
function onSongChange(title) {
  if (!W || now - lastSongTalk < 40 || interior || rand() > 0.45) return;
  const near = W.people.filter((p) => !p.inside && p.state === 'free' && controls && Math.hypot(p.x - controls.target.x, p.z - controls.target.z) < 14);
  if (!near.length) return;
  lastSongTalk = now; const p = pick(near);
  setTimeout(() => bubble(p, pick([`Ooh, I love this one.`, `Is this "${title}"? Classic.`, 'Wait, who put this song on?', '♪ la la la ♪', isMili(p) ? 'This could use more breakbeats, honestly.' : 'This song makes me want to dance.', 'Hmm hm hmm ♪']), 3), 1500);
}
const DANCE = ['festival', 'wedding', 'bday', 'beach', 'harvest', 'blossoms', 'party'];
