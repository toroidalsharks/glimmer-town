// ============================================================
// BOOT
// ============================================================
function resize() { if (!renderer) return; const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); roomCam.aspect = w / h; roomCam.updateProjectionMatrix(); }
function hud() {
  const hr = (6 + W.t * 24) % 24, hh = Math.floor(hr), mm = Math.floor((hr - hh) * 60);
  $('#clock').textContent = `${seasonOf().icon} Day ${W.day} · ${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'} · ${W.meeting ? 'town meeting' : isNight() ? 'night' : W.weather} · ${plural(W.people.length, 'resident')} · ${W.creator.coins} ✦${(W.mail || []).some((m) => !m.read) ? ` · ✉ ${W.mail.filter((m) => !m.read).length}` : ''}`;
  if (mailFlag) mailFlag.rotation.z = (W.mail || []).some((m) => !m.read) ? 0 : -Math.PI / 2;
  $('#mailTab').textContent = (W.mail || []).some((m) => !m.read) ? `Mail (${W.mail.filter((m) => !m.read).length})` : 'Mail';
}
async function boot() {
  loadPrefs();
  if (![...$('#dayLen').options].some((o) => o.value === String(cfg.daySec))) cfg.daySec = 300;
  syncSettingsUI();
  await initRuntime();
  // decide whether this device runs the town or acts as its remote
  if (RT.db && RT.room) {
    const wantRemote = location.hash === '#remote', wantBox = location.hash === '#box' || ISLE === 'isle2';
    let lease = { acquired: true };
    if (!wantRemote) {
      try { lease = await RT.db.doc(HOST_DOC).acquire({ holder: DEVICE, ttlMs: 30000 }); } catch (e) { lease = { acquired: true }; }
      if (!lease.acquired && wantBox) { $('#loading').textContent = 'Waiting for the other device to stop running the town…'; for (let i = 0; i < 8 && !lease.acquired; i++) { await sleep(5000); try { lease = await RT.db.doc(HOST_DOC).acquire({ holder: DEVICE, ttlMs: 30000 }); } catch (e) {} } }
    }
    if (wantRemote || !lease.acquired) { startRemote(); return; }
    setInterval(async () => { try { const r = await RT.db.doc(HOST_DOC).acquire({ holder: DEVICE, ttlMs: 30000 }); if (!r.acquired) { saveNow(); location.reload(); } } catch (e) {} }, 10000);
  }
  try { await Promise.race([document.fonts.load('40px "Mochiy Pop One"'), sleep(1500)]); } catch (e) {}
  buildTown();
  selRing = mesh(new T3.RingGeometry(0.8, 1.0, 32), new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }), 0, 0.1, 0, false);
  selRing.rotation.x = -Math.PI / 2; selRing.visible = false; scene.add(selRing);
  W = (await loadWorld()) || newWorld();
  applyMods();
  W.people.forEach((p) => { if (!p.want) p.want = newWant(p); modelOf(p); });
  W.people.forEach(buildKin); buildProjects(); addRedIfMissing(); addPresetIfMissing('tim'); addMiliAndClaude(); fixJobsAff(); jobsMigration(); healthMigration(); laptopMigration(); dramaBoot(); v23Boot(); if (gfxOn()) v24Boot(); v25Boot(); miliHairFix(); fashionBoot(); looksBoot(); crimeClarityBoot(); custodyBoot(); sentencesBoot(); townRecordBoot(); socialBoot(); awayOnBoot(); buildLand(); buildPlaced(); buildRobots(); buildCuteWorld(); if (gfxOn()) { gfxMeadow(); gfxCritters(); } crimeProps(); gfxStart(); wireGfxSettings(); W.plot = W.plot || Array(PLOT_N).fill(null); ensureBdays(); buildDrift(); applySeason(true); buildPlot(); if (brainCfg.key) checkModels(false);
  if (!brainCfg.key) setTimeout(() => toast('Add an OpenRouter key in Settings to give everyone their own mind.'), 2500);
  $('#hudName').textContent = ISL.name; document.title = ISL.name;
  ferry = buildFerry(); if (RT.db) { checkOther(); listenFerry(); setInterval(checkOther, 60000); }
  resize(); addEventListener('resize', resize);
  const portrait = innerHeight > innerWidth;
  camera.position.set(portrait ? 50 : 42, portrait ? 70 : 50, portrait ? 80 : 58); controls.target.set(0, 2, -16);
  applyLook(); wireTownInput(); wireCamBar(); wireZoomGuards();
  $('#loading').remove();
  if (RT.room) {
    RT.room.on(`${ISLE}-cmd`, async (msg) => { if (msg.sameTab) return; const c = msg.data || {}; if ((c.isle || 'isle1') !== ISLE) return; if (c.t !== 'llm') { userReturned(false); lastTouch = now; } if (c.t === 'llm') { let out; try { out = { result: await llm(c.input, { model: c.model, raw: c.raw, fallbackKey: c.fallbackKey || undefined }) }; } catch (e) { out = { error: e.code || 'upstream_error' }; } RT.room.emit(`${ISLE}-ack`, { rid: c.rid, ...out }).catch(() => {}); return; } const res = applyCmd(c); if (c.rid) RT.room.emit(`${ISLE}-ack`, { rid: c.rid, text: res || '' }).catch(() => {}); refreshPanel(false); if (['buy', 'gift', 'coins', 'chip', 'talked'].includes(c.t)) setTimeout(saveNow, 400); });
    RT.room.on(`${ISLE}-cam`, (msg) => { if (msg.sameTab) return; const c = msg.data || {}; if ((c.isle || 'isle1') !== ISLE) return; if (c.pan) { panBy(Number(c.dx) || 0, Number(c.dy) || 0); if (c.dz) orbitBy(0, 0, Number(c.dz) || 0); } else orbitBy(Number(c.dx) || 0, Number(c.dy) || 0, Number(c.dz) || 0); });
    RT.room.onPeers((ch) => { peerCount = ch.peers.length; if (activeTab === 'box') renderLink(); });
  }
  let last = performance.now(), lastSave = 0, lastHud = -1;
  function frame(tms) {
    if (GFX.fpsCap && tms - (GFX.lastDraw || 0) < 1000 / GFX.fpsCap - 3) { requestAnimationFrame(frame); return; } GFX.lastDraw = tms;
    const dt = Math.min(0.1, (tms - last) / 1000); last = tms; now += dt;
    step(CUT.live ? dt * 0.08 : dt);
    if (CUT.live && CUT.cam) { if (interior) roomCam.lookAt(roomControls.target); else camera.lookAt(controls.target); }
    else if (interior) roomControls.update();
    else { controls.autoRotate = cfg.spin && now - lastTouch > 10 && !keysDown.size; const tx = controls.target.x, tz = controls.target.z; controls.update(); if (Math.abs(controls.target.x - tx) + Math.abs(controls.target.z - tz) > 1e-4) { userPanned(); clampView(); } }
    visuals(dt); ferryFrame(); fireworksFrame(dt); downtownFrame(dt); weddingFrame(dt); fishingFrame(dt); courtTick(); seasonFrame(dt); catFrame(dt); claudeTick(dt); shineFrame(dt); nodeFrame(dt); robotsFrame(dt); labsSpin(dt); sceneFrame(); cuteFrame(); cutFrame(dt); owlFrame(); crimeFrame(dt); crimeGossipTick();
    gfxFrame(dt); renderView(interior ? roomScene : scene, interior ? roomCam : camera);
    if (wantPhoto) { wantPhoto = false; try { takePhoto(); } catch (e) { console.error(e); toast('The camera jammed. Try again?'); } }
    if (now - lastHud > 0.5) { hud(); lastHud = now; }
    if (now - lastSave > 20 || (dirty && now - lastSave > 3)) { lastSave = now; saveNow(); }
    if (now - lastPanel > 2) { lastPanel = now; refreshPanel(false); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
if (location.protocol === 'file:') window.__g = { visit: (i) => sendVisit(person(i)), morning: () => morningFerry(), cmd2: (c) => applyCmd(c), depart: (i) => depart(person(i), 'Testing the ferry.'), letter: (i, k) => queueLetter(person(i), k, { what: 'a lilac lamp', who: 'Someone' }), other: () => otherExists, openInteract: (i) => openInteract(i), openInterior: (x) => openInterior(x), W: () => W, texts: () => W.texts, catchUp: (h) => catchUp(h * 3600e3), show: (a, b) => showScene(person(a), person(b), pickShowContent(person(a), person(b))), goal: (pid) => { const p = person(pid); pickGoal(p); return p.goal; }, uproar: () => startUproar(), huddle: () => startHuddle(), laptop: (pid) => creatorLaptop(pid), envy: (a, b) => laptopEnvy(person(a), person(b)), pce: (h) => parseCurrentEvents(h), ev: (s) => eval(s), crime: (t) => { const C = commitCrime(t); if (C) { C.pending = false; crimeDiscover(C); } return C && C.id; }, murder: () => { const ok = commitMurder(); const C = crimeState().list.slice(-1)[0]; if (ok) { C.pending = false; murderMorning(C); } return ok && C.id; }, health: (pid) => person(pid)?.health, sick: (pid, id) => catchIll(person(pid), id || 'cold', 'caught'), hurt: (pid, id) => injure(person(pid), id || 'scrape', 'while testing'), careAct: (pid, act, text) => careAct(pid, act, text), finish: (pid) => { const p = person(pid); ensureResearch(p); p.research.progress = 100; finishResearch(p); }, hm: () => healthMorning(), lab: (pid, act, text) => labAct(pid, act, text), work: (pid) => researchWork(person(pid)), agentAccept: (r) => acceptMods(r), agent: (q) => runAgent(q), fetchOutside: () => fetchOutside(true), surf: (i) => surfDone(person(i)), discover: (i) => discoverOutside(person(i)), chirp: () => { nextChirp = 0; }, finishBook: (i, b) => finishBook(person(i), b), classAM: () => classMorning(), readCtx: (i) => readingContext(person(i)) + classContext(person(i), W.people[0]), file: (k, a, b, x) => fileCase(k, person(a), person(b), x || {}), cases: () => W.cases, court: () => courtTick(), courtAM: () => courtMorning(), cupdate: (live) => claudeUpdate(live), away: () => { lastTouch = -9999; }, back: () => userReturned(true), convo: () => { nextConvoAt = 0; }, resetView: () => resetView(), watchdog: () => claudeWatchdog(true), text: (a, b, tone) => sendText(person(a), b === 'town' ? 'town' : person(b), tone), phys: (a, b, k) => physicalScene(person(a), person(b), k), walk: (a, b, h) => walkTogether(person(a), person(b), h), hang: (i) => planHangout(person(i)), claude: () => W.people.find((q) => q.isClaude), mili: () => findMili(), setDay: (d) => { W.day = d; applySeason(); buildPlot(); }, plotCmd: (c) => plotCmd(c), grow: () => plotGrow(), bdays: () => birthdayMorning(), snowman: (i) => { const p = person(i); setTask(p, 'snowman', 'plaza', [6, 6]); }, romance: (a, b, i) => romanceScene(person(a), person(b), i), fish: () => openFishing(), reel: () => reel(), fishing: () => fishing, go: (k) => camGo(k), pan: (x, y) => panBy(x, y), photo: () => { wantPhoto = true; }, cam: () => ({ t: controls.target.toArray(), c: camera.position.toArray() }), newDay: () => newDay(), startWed: () => startWeddingDay(), plan: (i) => plan(person(i)), cmd: (c) => applyCmd(c) };
startUpdateChecks();
boot();
