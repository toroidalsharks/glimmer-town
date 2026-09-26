// ============================================================
// REMOTE MODE
// ============================================================
function startRemote() {
  MODE = 'remote';
  setTimeout(wireGfxSettings, 0);
  $('#loading').remove();
  $('#stage').hidden = true; $('#tags').hidden = true; $('#hud').hidden = true; $('#toggle').hidden = true; $('#cambar').hidden = true;
  const rem = $('#remote'); rem.hidden = false;
  rem.appendChild(sheet); sheet.hidden = false; $('#close').hidden = true;
  $('#ghostBtn').disabled = true; $('#wakeBtn').disabled = false;
  const RW = {}, snapAt = {};
  let lastSnap = 0;
  const sw = document.createElement('div'); sw.className = 'pad-btns'; sw.id = 'isleSwitch'; sw.hidden = true; $('.remote-top').after(sw);
  const drawSwitch = () => { const ks = Object.keys(RW); sw.hidden = ks.length < 2; sw.innerHTML = ks.map((k) => `<button class="btn" type="button" data-isle="${k}" aria-pressed="${k === rIsle}" style="${k === rIsle ? 'background:var(--ink);color:#1a1426' : ''}">${ISLES[k].name}</button>`).join(''); };
  sw.addEventListener('click', (e) => { const b = e.target.closest('[data-isle]'); if (!b) return; rIsle = b.dataset.isle; W = RW[rIsle]; lastSnap = snapAt[rIsle]; openDetail = null; mailOpen = null; drawSwitch(); updateRemoteStatus(); refreshPanel(true); });
  for (const k of Object.keys(ISLES)) {
    RT.db.doc(ISLES[k].doc + '/state').onSnapshot((snap) => {
      const v = snap.exists && snap.data();
      if (!v || !v.world) { if (!Object.keys(RW).length) $('#remoteStatus').textContent = 'No town yet. Open this page on the box phone first.'; return; }
      RW[k] = JSON.parse(JSON.stringify(v.world)); snapAt[k] = v.savedAt || Date.now();
      if (!RW[rIsle]) rIsle = k;
      if (k === rIsle) { W = RW[k]; lastSnap = snapAt[k]; updateRemoteStatus(); refreshPanel(false); }
      drawSwitch();
    }, () => { $('#remoteStatus').textContent = 'Lost the town feed. Reload this page.'; });
  }
  RT.sample = proxySample();
  for (const k of Object.keys(ISLES)) RT.room.on(`${k}-ack`, (msg) => {
    const d = msg.data || {};
    if (llmWaits.has(d.rid)) { const w = llmWaits.get(d.rid); clearTimeout(w.timer); llmWaits.delete(d.rid); if (d.error) w.reject({ code: d.error }); else w.resolve(d.result); return; }
    if (pendingAcks.has(d.rid)) { clearTimeout(pendingAcks.get(d.rid)); pendingAcks.delete(d.rid); if (d.text) toast(d.text); }
  });
  function updateRemoteStatus() {
    if (!W) return;
    const age = Math.round((Date.now() - lastSnap) / 1000);
    const hr = (6 + W.t * 24) % 24, hh = Math.floor(hr);
    $('#remoteStatus').textContent = `${ISLES[rIsle].name} · Day ${W.day} · ${((hh + 11) % 12) + 1}${hh < 12 ? 'am' : 'pm'} · ${age < 60 ? 'box is live' : `box last seen ${Math.round(age / 60)} min ago`}`;
    $('#takeover').hidden = age < 75;
  }
  setInterval(updateRemoteStatus, 5000);
  $('#takeover').addEventListener('click', () => { try { location.hash = rIsle === 'isle2' ? 'isle2' : 'box'; } catch (e) {} location.reload(); });
  // touchpad
  const pad = $('#pad'), pts = new Map(); let acc = { dx: 0, dy: 0, dz: 0 }, pinch0 = 0, padPan = false;
  $('#padMode').addEventListener('click', () => { padPan = !padPan; $('#padMode').setAttribute('aria-pressed', String(padPan)); $('#padMode').textContent = padPan ? 'Moving' : 'Move mode'; pad.innerHTML = padPan ? 'Drag to slide around the town<br>Pinch to zoom' : 'Drag to turn the camera<br>Pinch to zoom'; });
  $('#padSong').addEventListener('click', () => send({ t: 'skip' }));
  document.querySelectorAll('#padGo [data-go]').forEach((b) => b.addEventListener('click', () => send({ t: 'cam', place: b.dataset.go })));
  pad.addEventListener('pointerdown', (e) => { pad.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  pad.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { acc.dx += e.clientX - prev[0]; acc.dy += e.clientY - prev[1]; }
    else if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); acc.dz += (pinch0 - d) * 1.5; pinch0 = d; }
  });
  const up = (e) => { pts.delete(e.pointerId); };
  pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
  pad.addEventListener('wheel', (e) => { e.preventDefault(); acc.dz += e.deltaY * 0.5; }, { passive: false });
  setInterval(() => { if (acc.dx || acc.dy || acc.dz) { RT.room.emit(`${rIsle}-cam`, { isle: rIsle, pan: padPan || undefined, dx: Math.round(acc.dx), dy: Math.round(acc.dy), dz: Math.round(acc.dz) }).catch(() => {}); acc = { dx: 0, dy: 0, dz: 0 }; } }, 80);
  document.querySelectorAll('[data-cam]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.cam;
    if (k === 'home') send({ t: 'cam', home: true }); else RT.room.emit(`${rIsle}-cam`, { isle: rIsle, dx: 0, dy: 0, dz: k === 'in' ? -120 : 120 }).catch(() => {});
  }));
  syncSettingsUI();
  showTab('people');
}

