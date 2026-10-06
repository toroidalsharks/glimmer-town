// ============================================================
// THE TEXTS TAB
// ============================================================
let textThread = null, textsStick = false;
// what you're typing in the group chat lives here, so a redraw never wipes it
const CHAT_DRAFT_KEY = 'glimmer-chat-draft';
let chatDraft = ''; try { chatDraft = localStorage.getItem(CHAT_DRAFT_KEY) || ''; } catch (e) {}
function setChatDraft(v) { chatDraft = String(v || '').slice(0, CHAT_MAX); try { localStorage.setItem(CHAT_DRAFT_KEY, chatDraft); } catch (e) {} }
const chatInputFocused = () => document.activeElement?.id === 'groupChatInput';
function textMsgHtml(m, left) {
  if (m.from === 'creator') return `<div class="msg r you"><span class="msg-n">You</span><span class="msg-t">${esc(m.text)}</span><span class="msg-d">Day ${m.day} · ${clockAt(m.t)}</span></div>`;
  const p = person(m.from), side = textThread === 'town' ? 'l' : m.from === left ? 'l' : 'r';
  return `<div class="msg ${side}${['bully', 'mean'].includes(m.tone) ? ' bad' : ''}"><span class="msg-n" style="color:${p ? skinCss(p) : 'var(--dim)'}">${esc(m.fromName)}</span><span class="msg-t">${esc(m.text)}</span><span class="msg-d">Day ${m.day} · ${clockAt(m.t)}</span></div>`;
}
function renderTexts() {
  const T = W.texts || [];
  const pane = $('#pane-texts');
  if (textThread) {
    const msgs = T.filter((m) => textThreadKey(m.from, m.to) === textThread);
    const left = textThread === 'town' ? null : textThread.split('|')[0];
    const chatHtml = msgs.slice(-60).map((m) => textMsgHtml(m, left)).join('') || '<p class="hint">No texts yet.</p>';
    const sig = `${textThread}:${msgs.length}:${msgs.length ? msgs[msgs.length - 1].id : ''}`;
    const ch = pane.dataset.view === textThread && pane.querySelector('.chat');
    // already showing this chat: only swap the messages, so the box you're typing in stays put
    if (ch) {
      if (pane.dataset.sig !== sig) { textsStick = textsStick || pane.scrollHeight - pane.scrollTop - pane.clientHeight < 120; ch.innerHTML = chatHtml; pane.dataset.sig = sig; }
      return;
    }
    const title = textThread === 'town' ? `${ISL.name} group chat` : textThread.split('|').map((id) => person(id)?.name || '?').join(' & ');
    const box = textThread === 'town' ? `<form class="talk-row chat-send" data-groupchat><textarea id="groupChatInput" rows="2" maxlength="${CHAT_MAX}" autocomplete="off" placeholder="Write to the whole town…"></textarea><button class="btn" type="submit">Send</button></form><p class="hint">Everyone in town can read what you write here. A few of them will answer.</p>` : '';
    pane.innerHTML = `<button class="back thread-exit" type="button" data-thread="">&larr; Back to all texts</button><p class="label">${esc(title)}</p><div class="chat">${chatHtml}</div>${box}<button class="back thread-exit bottom" type="button" data-thread="">&larr; Exit this chat</button>`;
    pane.dataset.view = textThread; pane.dataset.sig = sig;
    const ta = pane.querySelector('#groupChatInput'); if (ta) ta.value = chatDraft;
    pane.scrollTop = pane.scrollHeight;
    return;
  }
  pane.dataset.view = '';
  const threads = new Map([['town', null]]);
  for (const m of T) { const k = textThreadKey(m.from, m.to); threads.set(k, m); }
  const at = (m) => (m ? m.day * 10 + m.t : 1e9); // the group chat sits on top until someone posts in it
  const list = [...threads.entries()].sort((x, y) => at(y[1]) - at(x[1]));
  pane.innerHTML = `<p class="hint">Everyone's phones. They don't know you can read their private texts. You can write in the group chat.</p>` + list.map(([k, m]) => { const names = k === 'town' ? `${ISL.name} group chat` : k.split('|').map((id) => person(id)?.name || '?').join(' & '); return `<button class="who" type="button" data-thread="${esc(k)}"><span class="dot" style="background:${k === 'town' ? 'var(--gold)' : 'var(--lilac)'}"></span><span><span class="who-name">${esc(names)}</span>${m && ['bully', 'mean'].includes(m.tone) ? ' <span class="chip bad">tense</span>' : m && ['sweet', 'flirt'].includes(m.tone) ? ' <span class="chip good">sweet</span>' : ''}<br><span class="who-note">${m ? `${esc(m.from === 'creator' ? 'You' : m.fromName)}: ${esc(m.text)}` : 'Nobody has posted yet. Say hi.'}</span></span><span class="who-stats">${m ? `day ${m.day}<br>${clockAt(m.t)}` : ''}</span></button>`; }).join('');
}
// a new text: redraw the Texts tab if it's open, even while you're typing in the group chat
function textsArrived(msg) {
  if (activeTab !== 'texts' || sheet.hidden) return;
  if (chatInputFocused()) { const pane = $('#pane-texts'), sc = pane.scrollTop; renderTexts(); pane.scrollTop = textsStick ? pane.scrollHeight : sc; textsStick = false; }
  else refreshPanel(false);
}
function sendGroupChat(form) {
  const ta = form.querySelector('textarea'), text = ta.value.trim();
  if (!text) return;
  textsStick = true;
  send({ t: 'groupchat', text: text.slice(0, CHAT_MAX) });
  ta.value = ''; setChatDraft('');
}
function clockAt(t) { const hr = (6 + t * 24) % 24, hh = Math.floor(hr), mm = Math.floor((hr - hh) * 60); return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'}`; }

// poses drawn every frame
function poseFigure(p, m) {
  healthLook(p, m); hideShowDev(m);
  const po = p.pose && p.pose.until > now ? p.pose : null;
  m.arms.forEach((a, i) => { a.position.y = 0.8; a.rotation.z = (i ? 1 : -1) * 0.35; });
  m.fig.rotation.z = 0;
  const ww = p.task?.kind === 'walkwith' && p.task.hands ? p.task : null;
  const led = !ww && W.people.find((q) => q.task?.kind === 'walkwith' && q.task.hands && q.task.lead === p.id && Math.hypot(q.x - p.x, q.z - p.z) < 1.3);
  if (ww || led) { const side = ww ? ww.side : -led.task.side; const i = side > 0 ? 1 : 0; m.arms[i].rotation.z = (i ? 1 : -1) * 1.05; }
  if (!po && p.task?.kind === 'event' && p.task.phase === 'do' && W.event && DANCE.includes(W.event.id)) {
    const ph = Sound.beatPhase(), bc = Sound.beatCount() + (p.room || 0);
    m.fig.position.y = Math.abs(Math.sin(ph * Math.PI)) * 0.16;
    const up = bc % 2 ? 1 : 0; m.arms[up].rotation.z = (up ? 1 : -1) * 2.5; m.arms[up].position.y = 1.05;
    m.fig.rotation.z = Math.sin(ph * Math.PI * 2) * 0.08;
    return;
  }
  if (m.book) m.book.visible = false; if (m.picket) m.picket.visible = false;
  if (!po && p.task?.phase === 'do' && p.task.kind === 'surf') { m.arms.forEach((a) => (a.rotation.x = -1.25)); m.head.rotation.x = 0.35; if (!m.phone) { m.phone = mesh(box(0.2, 0.3, 0.04), toon('#2a2733', { emissive: new T3.Color('#1a3a5a') }), 0, 1.0, 0.4, false); m.phone.rotation.x = -0.9; m.fig.add(m.phone); } m.phone.visible = true; return; }
  if (m.phone) m.phone.visible = false;
  if (!po && p.task?.phase === 'do' && (p.task.kind === 'read' || p.task.kind === 'write')) { m.arms.forEach((a) => (a.rotation.x = -1.1)); m.head.rotation.x = 0.32; if (!m.book) { m.book = mesh(box(0.44, 0.06, 0.32), toon('#b86b8a'), 0, 0.92, 0.42, false); m.fig.add(m.book); } m.book.material = toon(SUBJECTS[BOOKS[p.task.book]?.subj]?.color || '#b86b8a'); m.book.visible = true; return; }
  if (!po && p.task?.phase === 'do' && p.task.kind === 'picket') { m.arms[1].rotation.z = 2.7; m.arms[1].position.y = 1.05; if (!m.picket) { m.picket = new T3.Group(); m.picket.add(mesh(cyl(0.03, 0.03, 1.4, 5), toon('#8a6a4e'), 0, 0.7, 0)); m.picket.add(mesh(box(0.9, 0.55, 0.05), toon('#fff4dc'), 0, 1.45, 0)); m.picket.position.set(0.55, 0.9, 0.1); m.fig.add(m.picket); } m.picket.visible = true; m.picket.position.y = 0.9 + Math.abs(Math.sin(now * 3 + p.x)) * 0.12; return; }
  if (po && (po.kind === 'show' || po.kind === 'look')) { showPose(p, m, po); return; }
  if (!po) return;
  const k = po.kind, t = now * 16;
  if (k === 'hug' || k === 'jealous' && false) { m.arms.forEach((a) => { a.rotation.x = -1.35; }); m.fig.rotation.x = 0.14; }
  else if (k === 'cuddle') { const other = person(po.with); if (other) { const f = p.face, rx = Math.cos(f), rz = -Math.sin(f); const s = Math.sign((other.x - p.x) * rx + (other.z - p.z) * rz) || 1; m.head.rotation.z = -s * 0.32; m.fig.rotation.z = -s * 0.12; m.arms[s > 0 ? 1 : 0].rotation.z = (s > 0 ? 1 : -1) * 1.2; } }
  else if (k === 'highfive') { m.arms[1].rotation.z = 2.6; m.arms[1].position.y = 1.1; }
  else if (k === 'pat') { m.arms[1].rotation.x = -2.3; m.arms[1].position.y = 1.0; }
  else if (k === 'patted' || k === 'poked') { m.fig.position.y = Math.abs(Math.sin(now * 6)) * 0.05; }
  else if (k === 'poke') { m.arms[1].rotation.x = -1.5; }
  else if (k === 'fight') { m.fig.position.y = Math.abs(Math.sin(t)) * 0.16; m.fig.rotation.z = Math.sin(t * 1.3) * 0.16; m.arms[0].rotation.x = Math.sin(t) * 1.4; m.arms[1].rotation.x = -Math.sin(t) * 1.4; }
  else if (k === 'defend') { m.arms[0].rotation.z = -1.5; m.arms[1].rotation.z = 1.5; }
  else if (k === 'snicker') { m.fig.position.y = Math.abs(Math.sin(now * 20)) * 0.05; m.arms[0].rotation.x = -2.1; m.arms[0].position.y = 1.0; }
  else if (k === 'jealous') { m.arms.forEach((a, i) => { a.rotation.x = -1.2; a.rotation.z = (i ? -1 : 1) * 0.7; }); m.fig.rotation.x = -0.08; }
}
function poseStep(p, dt) {
  const po = p.pose; if (!po) return;
  if (po.until <= now) { p.pose = null; return; }
  if (po.tx === undefined) return;
  const dx = po.tx - p.x, dz = po.tz - p.z, d = Math.hypot(dx, dz);
  if (d > 0.02) { const mv = Math.min(d, 2.6 * dt); p.x += dx / d * mv; p.z += dz / d * mv; p.moving = d > 0.12; }
}

// tags nudge each other so speech bubbles don't pile up
const tagSlots = [];
function declutterTags() {
  const L = [];
  for (const [, m] of meshes) {
    if (m.tag.style.display === 'none' || m.sx === undefined) continue;
    const d = camera.position.distanceTo(m.root.position);
    m.tsc = clamp(34 / d, 0.62, 1);
    m.talk = !m.tagBub.hidden;
    L.push(m);
  }
  L.sort((a, b) => b.sy - a.sy);
  const placed = [];
  for (const m of L) {
    let y = m.sy;
    if (m.talk) {
      const w = (m.tag.offsetWidth || 60) * m.tsc, h = (m.tag.offsetHeight || 20) * m.tsc;
      for (let pass = 0; pass < 6; pass++) {
        let moved = false;
        for (const r of placed) if (Math.abs(m.sx - r.x) < (w + r.w) / 2 - 6 && y > r.y - r.h + 4 && y - h < r.y - 4) { y = r.y - r.h - 3; moved = true; }
        if (!moved) break;
      }
      y = Math.max(y, m.sy - 70);
      placed.push({ x: m.sx, y, w, h });
    }
    const was = Number.isFinite(m.offY) ? m.offY : 0;
    m.offY = was + ((y - m.sy) - was) * 0.25;
    m.tag.style.transform = `translate(${m.sx}px, ${m.sy + m.offY}px) translate(-50%, -100%) scale(${m.tsc.toFixed(3)})`;
    m.tag.style.transformOrigin = '50% 100%';
    m.tag.style.zIndex = String(Math.round(m.sy));
  }
}

