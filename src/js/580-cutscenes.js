// ============================================================
// CUTSCENES: big moments play like a little movie. Letterbox bars, a
// title card, the camera moves, lines type out, OBJECTION! bursts.
// ============================================================
const CUT = { queue: [], live: null, i: -1, typed: 0, lineT: 0, cam: null, waiting: null, el: null, touched: 0 };
const cutsOn = () => cfg.cutscenes !== false;
const JUDGE = { name: 'Judge Hoot', color: '#c9a36b' };
const CUT_VOICES = { judge: JUDGE.name, narrator: '', jury: 'The jury', crowd: 'Everyone', creator: 'The Creator', bailiff: 'Bailiff' };
function cutCss() {
  if ($('#cutCss')) return;
  const st = document.createElement('style'); st.id = 'cutCss';
  st.textContent = `
  #cut { position: fixed; inset: 0; z-index: 40; pointer-events: none; font-family: var(--body); }
  #cut.mir { transform: scaleX(-1); }
  #cut .cbar { position: absolute; left: 0; right: 0; height: 11vh; background: #07050d; transition: transform .6s cubic-bezier(.2,.8,.2,1); pointer-events: none; }
  #cut .cbar.t { top: 0; transform: translateY(-100%); } #cut .cbar.b { bottom: 0; transform: translateY(100%); }
  #cut.on .cbar { transform: none; }
  #cut .ctitle { position: absolute; left: 50%; top: 42%; transform: translate(-50%, -50%) scale(.9); text-align: center; opacity: 0; transition: opacity .5s, transform .6s; width: min(90vw, 760px); }
  #cut .ctitle.show { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  #cut .ct1 { font-family: var(--display); font-size: clamp(26px, 6vw, 54px); color: #fff6d6; text-shadow: 0 3px 0 #3a2150, 0 0 24px rgba(255,190,240,.55); letter-spacing: .02em; line-height: 1.15; }
  #cut .ct2 { margin-top: 8px; font-size: clamp(13px, 2.4vw, 18px); color: #e9dcff; text-shadow: 0 2px 6px #000; }
  #cut .cbox { position: absolute; left: 50%; bottom: calc(11vh + 12px); transform: translateX(-50%) translateY(20px); width: min(94vw, 760px); background: rgba(16,12,30,.9); border: 2px solid rgba(255,255,255,.14); border-radius: 18px; padding: 16px 20px 18px; color: #fbf6ff; opacity: 0; transition: opacity .3s, transform .3s; pointer-events: auto; box-shadow: 0 10px 40px rgba(0,0,0,.45); }
  #cut .cbox.show { opacity: 1; transform: translateX(-50%); }
  #cut .cname { position: absolute; top: -17px; left: 18px; font-family: var(--display); font-size: 15px; padding: 3px 14px; border-radius: 12px; background: #bba8ff; color: #1a1426; box-shadow: 0 3px 0 rgba(0,0,0,.35); }
  #cut .cname:empty { display: none; }
  #cut .ctext { font-size: clamp(15px, 2.6vw, 20px); line-height: 1.45; min-height: 2.9em; }
  #cut .ctext.narr { font-style: italic; color: #d9ccff; }
  #cut .cnext { position: absolute; right: 16px; bottom: 8px; font-size: 13px; color: #bba8ff; animation: cutbob 1s infinite; opacity: 0; }
  #cut .cnext.show { opacity: 1; }
  @keyframes cutbob { 50% { transform: translateY(3px); } }
  #cut .cskip { position: absolute; right: 14px; top: calc(11vh + 10px); pointer-events: auto; background: rgba(16,12,30,.7); color: #e9dcff; border: 1px solid rgba(255,255,255,.2); border-radius: 12px; padding: 5px 12px; font: 13px var(--body); }
  #cut .cfx { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
  #cut .burst { font-family: var(--display); font-size: clamp(40px, 11vw, 110px); color: #fff; padding: .35em .7em .45em; transform: rotate(-6deg) scale(.2); opacity: 0; animation: cutburst 1.25s cubic-bezier(.2,1.6,.4,1) forwards; clip-path: polygon(0% 18%, 9% 0%, 22% 14%, 36% 1%, 49% 15%, 63% 0%, 76% 13%, 90% 2%, 100% 22%, 93% 44%, 100% 64%, 90% 83%, 97% 100%, 78% 88%, 63% 100%, 50% 86%, 35% 100%, 22% 87%, 8% 100%, 3% 78%, 0% 58%, 6% 40%); text-shadow: 0 4px 0 rgba(0,0,0,.35); letter-spacing: .02em; white-space: nowrap; }
  #cut .burst.objection { background: linear-gradient(#ff5a5a, #c2123a); }
  #cut .burst.holdit { background: linear-gradient(#5aa8ff, #2346c9); }
  #cut .burst.takethat { background: linear-gradient(#ffd23f, #e07b00); color: #3a1a00; text-shadow: none; }
  #cut .burst.order { background: linear-gradient(#b98a5e, #6b4a2e); }
  @keyframes cutburst { 0% { transform: rotate(-6deg) scale(.2); opacity: 0; } 18% { transform: rotate(-4deg) scale(1.08); opacity: 1; } 30% { transform: rotate(-6deg) scale(1); } 80% { opacity: 1; } 100% { transform: rotate(-6deg) scale(1.02); opacity: 0; } }
  #cut .stamp { font-family: var(--display); font-size: clamp(44px, 12vw, 120px); padding: .1em .45em; border: .09em solid currentColor; border-radius: .18em; transform: rotate(-9deg) scale(2.4); opacity: 0; animation: cutstamp 2.4s cubic-bezier(.3,1.4,.5,1) forwards; background: rgba(10,6,20,.55); }
  #cut .stamp.guilty { color: #ff5a6e; } #cut .stamp.innocent { color: #7ff0b8; } #cut .stamp.plain { color: #fff6d6; }
  @keyframes cutstamp { 0% { transform: rotate(-9deg) scale(2.4); opacity: 0; } 14% { transform: rotate(-9deg) scale(.96); opacity: 1; } 22% { transform: rotate(-9deg) scale(1); } 85% { opacity: 1; } 100% { opacity: 0; } }
  #cut .flash { position: absolute; inset: 0; background: #fff; opacity: 0; animation: cutflash .5s ease-out; }
  @keyframes cutflash { 0% { opacity: .85; } 100% { opacity: 0; } }
  #cut .vign { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 45%, rgba(10,0,20,.75)); opacity: 0; transition: opacity .8s; }
  #cut .vign.show { opacity: 1; }
  #stage.shake { animation: cutshake .45s; }
  @keyframes cutshake { 10%, 50%, 90% { transform: translate(-7px, 3px); } 30%, 70% { transform: translate(7px, -3px); } }
  #cut .cchoice { position: absolute; left: 50%; bottom: calc(11vh + 150px); transform: translateX(-50%); display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; width: min(94vw, 760px); pointer-events: auto; }
  #cut .cchoice button { font: 15px var(--display); background: #ffd36b; color: #2a1a10; border: 0; border-radius: 14px; padding: 9px 16px; box-shadow: 0 4px 0 #b8862a; }
  #cut .cchoice .tmr { width: 100%; text-align: center; color: #e9dcff; font-size: 13px; text-shadow: 0 1px 4px #000; }
  body.incut .tag { visibility: hidden !important; }
  body.incut #cambar, body.incut .hud, body.incut #toggle { opacity: 0; pointer-events: none; }
  `;
  document.head.appendChild(st);
}
function cutEl() {
  if (CUT.el) return CUT.el;
  cutCss();
  const d = document.createElement('div'); d.id = 'cut'; d.hidden = true;
  d.innerHTML = `<div class="vign"></div><div class="cbar t"></div><div class="cbar b"></div><div class="cfx"></div>
    <div class="ctitle"><div class="ct1"></div><div class="ct2"></div></div>
    <div class="cbox"><div class="cname"></div><div class="ctext"></div><div class="cnext">▼</div></div>
    <div class="cchoice" hidden></div><button class="cskip" type="button">Skip ▸▸</button>`;
  document.body.appendChild(d);
  d.querySelector('.cbox').addEventListener('click', () => cutTap());
  d.querySelector('.cskip').addEventListener('click', () => send({ t: 'cut', a: 'skip' }));
  d.querySelector('.cchoice').addEventListener('click', (e) => { const b = e.target.closest('[data-cpick]'); if (b) send({ t: 'cut', a: 'pick', k: b.dataset.cpick }); });
  CUT.el = d; return d;
}
// who is talking: a resident id, or one of the roles above
function cutSpeaker(L) {
  const p = L.who && person(L.who);
  if (p) return { name: p.name, color: `hsl(${Math.round(p.body.hue)}, 70%, 72%)`, p };
  if (L.name) return { name: L.name, color: L.color || '#d9ccff' };
  if (L.who === 'judge') return { name: JUDGE.name, color: '#f3d49a' };
  return { name: CUT_VOICES[L.who] ?? '', color: '#d9ccff' };
}
// queue a cutscene. S = { kind, title, sub, music, stage(S) -> sets up cast and camera,
// lines: [{ who, text, fx, shot, emote }], onEnd(S), choice handling via lines[i].choice }
function queueCut(S) {
  S.id = S.id || uid(); S.day = W.day;
  if (MODE !== 'host' || typeof offlineSim !== 'undefined' && offlineSim || !cutsOn()) { cutArchive(S); try { S.onEnd?.(S, true); } catch (e) { console.error(e); } return S; }
  CUT.queue.push(S);
  return S;
}
function cutArchive(S) {
  W.cutscenes = W.cutscenes || [];
  if (W.cutscenes.some((c) => c.id === S.id)) return;
  const nm = (L) => { const sp = cutSpeaker(L); return { who: sp.name, text: L.text, fx: L.fx || null }; };
  W.cutscenes.push({ id: S.id, kind: S.kind, title: S.title, sub: S.sub || '', day: S.day ?? W.day, icon: S.icon || '🎬', lines: (S.played || S.lines || []).filter((L) => L.text).map(nm).slice(0, 60) });
  if (W.cutscenes.length > 24) W.cutscenes.splice(0, W.cutscenes.length - 24);
  markDirty();
}
function cutFx(kind) {
  const fx = cutEl().querySelector('.cfx');
  const add = (html) => { const w = document.createElement('div'); w.innerHTML = html; const n = w.firstChild; fx.appendChild(n); setTimeout(() => n.remove(), 2600); };
  const shake = () => { const s = $('#stage'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); };
  switch (kind) {
    case 'objection': add('<div class="burst objection">OBJECTION!</div>'); shake(); Sound.objection?.(); break;
    case 'holdit': add('<div class="burst holdit">HOLD IT!</div>'); shake(); Sound.objection?.(0.8); break;
    case 'takethat': add('<div class="burst takethat">TAKE THAT!</div>'); shake(); Sound.objection?.(1.2); break;
    case 'order': add('<div class="burst order">ORDER!</div>'); Sound.gavel?.(); break;
    case 'gavel': Sound.gavel?.(); break;
    case 'guilty': add('<div class="stamp guilty">GUILTY</div>'); Sound.stamp?.(); shake(); break;
    case 'innocent': add('<div class="stamp innocent">NOT GUILTY</div>'); Sound.stamp?.(); break;
    case 'stamp': add(`<div class="stamp plain">${esc(CUT.stampText || '')}</div>`); Sound.stamp?.(); break;
    case 'flash': add('<div class="flash"></div>'); break;
    case 'shock': add('<div class="flash"></div>'); shake(); Sound.gasp?.(); break;
    case 'gasp': Sound.gasp?.(); break;
    case 'hearts': if (CUT.focus) for (let i = 0; i < 3; i++) setTimeout(() => spawnBurst(CUT.focus.x, 2.4, CUT.focus.z, ['#ff8fb6', '#ffd6ec', '#ffffff'], 30, 1.8, 0.4), i * 350); Sound.sparkle(); break;
    case 'confetti': if (CUT.focus) for (let i = 0; i < 4; i++) setTimeout(() => spawnBurst(CUT.focus.x + (rand() - 0.5) * 4, 4, CUT.focus.z + (rand() - 0.5) * 4, ['#ff8fb6', '#ffffff', '#ffd36b', '#c9b3ff', '#9fe3c4'], 50, 2.6, 0.35), i * 300); Sound.bell(); break;
    case 'dark': cutEl().querySelector('.vign').classList.add('show'); break;
    case 'light': cutEl().querySelector('.vign').classList.remove('show'); break;
    case 'heartbeat': Sound.heartbeat?.(); break;
    case 'scream': Sound.gasp?.(1.5); shake(); break;
  }
}
function cutStart(S) {
  const el = cutEl();
  CUT.live = S; CUT.i = -1; CUT.waiting = null; CUT.lineT = 0; S.played = [];
  el.hidden = false; el.classList.toggle('mir', !!cfg.mirror);
  requestAnimationFrame(() => el.classList.add('on'));
  document.body.classList.add('incut');
  releaseDlg?.();
  if (!$('#sheet').hidden && !CUT.userBusy() && !S.replay) { $('#sheet').hidden = true; CUT.sheetBack = true; }
  try { S.stage?.(S); } catch (e) { console.error('cut stage', e); }
  const T = el.querySelector('.ctitle'); T.querySelector('.ct1').textContent = S.title || ''; T.querySelector('.ct2').textContent = S.sub || '';
  if (S.title) { T.classList.add('show'); Sound.bell(); }
  S.titleUntil = now + (S.title ? 3.2 : 0.2);
  if (S.dark) cutFx('dark');
  diary(`🎬 ${S.icon || ''} <b>${esc(S.title || 'A scene')}</b>${S.sub ? `: ${esc(S.sub)}` : ''}`);
}
CUT.userBusy = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); };
function cutLine(i) {
  const S = CUT.live, el = cutEl(), L = S.lines[i];
  CUT.i = i; CUT.typed = 0; CUT.lineT = 0; CUT.waiting = null;
  if (!L) return cutEnd(false);
  S.played.push(L);
  const sp = cutSpeaker(L), nm = el.querySelector('.cname'), tx = el.querySelector('.ctext');
  nm.textContent = sp.name; nm.style.background = sp.color;
  tx.classList.toggle('narr', !sp.name); tx.textContent = '';
  el.querySelector('.cbox').classList.toggle('show', !!L.text);
  el.querySelector('.cnext').classList.remove('show');
  if (L.fx) { CUT.stampText = L.stamp || ''; cutFx(L.fx); }
  if (sp.p) { if (L.emote) emote(sp.p, L.emote, 3); if (L.text) Sound.voice(sp.p, L.text, true); CUT.focus = sp.p; if (sp.p.pose?.kind !== 'cut' && L.pose) sp.p.pose = { kind: L.pose, until: now + 4 }; }
  try { (S.shot || cutShotDefault)(S, L, sp); } catch (e) {}
  if (L.run) { try { L.run(S); } catch (e) { console.error(e); } }
  if (L.choice) { CUT.waiting = { until: now + (L.choice.timeout || 25), L }; cutShowChoice(L.choice); }
}
function cutShowChoice(ch) {
  const box = cutEl().querySelector('.cchoice');
  box.hidden = false;
  box.innerHTML = ch.options.map(([k, l]) => `<button type="button" data-cpick="${esc(k)}">${esc(l)}</button>`).join('') + `<div class="tmr"></div>`;
  W.cutLive = { id: CUT.live.id, title: CUT.live.title, prompt: ch.prompt || '', options: ch.options }; markDirty();
}
function cutPick(k) {
  const S = CUT.live; if (!S || !CUT.waiting) return '';
  const L = CUT.waiting.L; CUT.waiting = null;
  cutEl().querySelector('.cchoice').hidden = true; W.cutLive = null; markDirty();
  let more = [];
  try { more = L.choice.pick(k, S) || []; } catch (e) { console.error(e); }
  S.lines.splice(CUT.i + 1, 0, ...more);
  cutLine(CUT.i + 1);
  return '';
}
function cutTap() {
  const S = CUT.live; if (!S) return;
  CUT.touched = now;
  const L = S.lines[CUT.i];
  if (now < S.titleUntil) { S.titleUntil = now; return; }
  if (!L) return;
  if (CUT.waiting) return;
  if (CUT.typed < (L.text || '').length) { CUT.typed = (L.text || '').length; return; }
  cutLine(CUT.i + 1);
}
function cutEnd(skipped) {
  const S = CUT.live; if (!S) return;
  if (skipped && CUT.waiting) { const L = CUT.waiting.L; CUT.waiting = null; try { const more = L.choice.pick(L.choice.fallback || 'jury', S) || []; S.played.push(...more); } catch (e) {} }
  if (skipped) for (let j = CUT.i + 1; j < S.lines.length; j++) { const L = S.lines[j]; S.played.push(L); if (L.run) { try { L.run(S); } catch (e) {} } }
  const el = cutEl();
  el.classList.remove('on'); el.querySelector('.cbox').classList.remove('show'); el.querySelector('.ctitle').classList.remove('show'); el.querySelector('.cchoice').hidden = true; cutFx('light');
  setTimeout(() => { if (!CUT.live) el.hidden = true; }, 650);
  document.body.classList.remove('incut');
  W.cutLive = null;
  cutArchive(S);
  try { S.unstage?.(S); } catch (e) { console.error(e); }
  for (const p of W.people) if (p.task?.kind === 'cutscene') { p.task = null; p.busyUntil = 0; p.path = []; if (!p.heldByDlg) p.state = 'free'; p.pose = null; }
  CUT.live = null; CUT.cam = null;
  // the scene closed the panel you had open: bring it back once the scenes are done
  if (CUT.sheetBack && !CUT.queue.length) { CUT.sheetBack = false; setTimeout(() => { if (!CUT.live && $('#sheet').hidden) { $('#sheet').hidden = false; refreshPanel(true); } }, 700); }
  try { S.onEnd?.(S, false); } catch (e) { console.error(e); }
  markDirty();
}
// put a resident on their mark for the scene
function cutPlace(p, x, z, face, opts = {}) {
  if (!p) return;
  p.path = []; p.inside = !!opts.inside; p.x = x; p.z = z; if (face !== undefined) p.face = face;
  p.task = { kind: 'cutscene', phase: 'do' }; p.busyUntil = Infinity; p.state = 'talk'; p.at = opts.at || p.at;
}
// camera: glide the town camera to a spot, or the room camera to a named shot
function cutCam(tx, ty, tz, cx, cy, cz, room) { CUT.cam = { t: new T3.Vector3(tx, ty, tz), c: new T3.Vector3(cx, cy, cz), room: !!room }; }
function cutShotDefault(S, L, sp) {
  if (!S.center) return;
  const [cx, cz] = S.center, dir = S.dir ?? 0;
  if (sp.p && !sp.p.inside && L.shot !== 'wide') {
    const p = sp.p, a = dir + (S.side = -(S.side || 1)) * 0.35;
    cutCam(p.x, 1.5, p.z, p.x + Math.sin(a) * 7.5, 4.2, p.z + Math.cos(a) * 7.5);
  } else cutCam(cx, 1.2, cz, cx + Math.sin(dir) * 17, 9, cz + Math.cos(dir) * 17);
}
// the panel counts as busy for a little while after you touch it, so a scene never yanks it away mid-tap
document.addEventListener('pointerdown', (e) => { if (e.target.closest && e.target.closest('#sheet, #dlg, .dlg')) CUT.sheetTouch = performance.now(); }, true);
// dressing someone up or writing a letter takes a while, so those count as busy for longer
const sheetBusy = () => {
  const sh = $('#sheet'); if (!sh || sh.hidden) return false;
  const since = performance.now() - (CUT.sheetTouch || -1e9);
  const deep = (typeof lookOpen !== 'undefined' && lookOpen && activeTab === 'people') || (typeof mailOpen !== 'undefined' && mailOpen && activeTab === 'mail');
  return since < (deep ? 240000 : 90000);
};
function cutFrame(dt) {
  if (!CUT.live) {
    if (CUT.queue.length && !W.meeting && !(W.scene && W.scene.live) && !fishing?.running && !sheetBusy() && !CUT.userBusy()) cutStart(CUT.queue.shift());
    return;
  }
  const S = CUT.live, el = cutEl();
  lastTouch = now;
  if (CUT.cam) {
    const k = Math.min(1, dt * 2.2);
    if (CUT.cam.room && interior) { roomControls.target.lerp(CUT.cam.t, k); roomCam.position.lerp(CUT.cam.c, k); }
    else if (!CUT.cam.room && !interior) { controls.target.lerp(CUT.cam.t, k); camera.position.lerp(CUT.cam.c, k); }
  }
  if (now < S.titleUntil) return;
  el.querySelector('.ctitle').classList.remove('show');
  if (CUT.i < 0) { cutLine(0); return; }
  const L = S.lines[CUT.i]; if (!L) return cutEnd(false);
  const txt = L.text || '';
  if (CUT.typed < txt.length) { CUT.typed = Math.min(txt.length, CUT.typed + dt * 42); el.querySelector('.ctext').textContent = txt.slice(0, Math.floor(CUT.typed)); return; }
  el.querySelector('.cnext').classList.toggle('show', !CUT.waiting);
  if (CUT.waiting) {
    const left = Math.ceil(CUT.waiting.until - now); const tm = el.querySelector('.cchoice .tmr'); if (tm) tm.textContent = `${CUT.waiting.L.choice.prompt || 'Your call.'} ${left > 0 ? `(the jury decides in ${left}s)` : ''}`;
    if (now >= CUT.waiting.until) cutPick(CUT.waiting.L.choice.fallback || 'jury');
    return;
  }
  CUT.lineT += dt;
  const hold = L.hold ?? Math.min(6.5, 1.5 + txt.length * 0.035) + (L.fx === 'guilty' || L.fx === 'innocent' ? 1.8 : 0);
  if (CUT.lineT >= hold) cutLine(CUT.i + 1);
}
function cutCmd(c) {
  if (c.a === 'skip') { if (CUT.live) cutEnd(true); return ''; }
  if (c.a === 'next') { cutTap(); return ''; }
  if (c.a === 'pick') return cutPick(c.k);
  if (c.a === 'replay') { const R = (W.cutscenes || []).find((x) => x.id === c.id); if (R && !CUT.live) cutReplay(R); return ''; }
  return '';
}
// replays: the dialogue again, over the island as it is now
function cutReplay(R) {
  const names = new Map(W.people.map((p) => [p.name, p.id]));
  const lines = R.lines.map((l) => ({ who: names.get(l.who) || null, name: names.get(l.who) ? null : (l.who || ''), text: l.text, fx: l.fx && !['hearts', 'confetti'].includes(l.fx) ? l.fx : null }));
  CUT.queue.unshift({ id: 'replay-' + R.id, kind: 'replay', title: R.title, sub: `Replay · day ${R.day}`, icon: R.icon, lines, replay: true, onEnd: () => {} });
  if (activeTab) { $('#sheet').hidden = true; }
}
function cutReplaysHtml(max = 8) {
  const R = (W.cutscenes || []).slice(-max).reverse();
  if (!R.length) return '';
  return `<p class="label">🎬 Scenes you can replay</p>${R.map((c) => `<div class="note" style="display:flex;gap:8px;align-items:center;justify-content:space-between"><span><span class="chip">day ${c.day}</span> ${esc(c.icon || '🎬')} ${esc(c.title)}</span><button class="btn" type="button" data-cutreplay="${c.id}" style="padding:3px 10px;font-size:12px">▶ Replay</button></div>`).join('')}`;
}

