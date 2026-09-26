// ============================================================
// THE DIALOG BOX (tap a resident)
// ============================================================
let dlg = null, typeTimer = 0;
const dlgEl = $('#dlg');
function typeText(text) {
  const el = $('#dlgText'); clearInterval(typeTimer); el.textContent = '';
  let i = 0; typeTimer = setInterval(() => { i += 2; el.textContent = text.slice(0, i); if (i >= text.length) clearInterval(typeTimer); }, 22);
  el.onclick = () => { clearInterval(typeTimer); el.textContent = text; };
  el.classList.toggle('dreamy', text.startsWith('💭'));
}
function greet(p) {
  const pr = problemOf(p), s = p.cr.score;
  if (pr?.kind === 'gift') return 'Creator! I leveled up, and I made you something!';
  if (pr?.kind === 'hungry') return "My tummy won't stop rumbling… Do you have anything to eat?";
  if (pr?.kind === 'wish') return `I keep wishing for ${wishText(p.cr.wish)}… Do you think it'll ever happen?`;
  if (pr?.kind === 'fight') return `${person(pr.who)?.name || 'Someone'} and I had a falling out. What should I do?`;
  if (pr && ['sick', 'hurt', 'low'].includes(pr.kind)) return healthGreet(p, pr);
  if (pr?.kind === 'lonely') return "I don't really have any friends here yet…";
  if (s >= 6) return pick(['Creator! You came to see me!', 'Hi, Creator! I was hoping you would visit.']);
  if (s >= 2) return pick(["Oh! Hi, Creator. What's up?", 'Hey, Creator!']);
  if (s > -2) return pick(['Is that… the Creator? Um, hi?', 'Oh! Are you the Creator?']);
  if (s > -6) return pick(['Oh. It\'s you. What do you want?', 'Hmph. The Creator.']);
  return "I didn't ask you to come here.";
}
function openBuy(shop, uid, food) {
  let it;
  if (food) { const k = W.keeper[shop] && person(W.keeper[shop]); it = { uid: 'menu-' + food, kind: 'food', id: food, q: 1, makerName: k ? k.name : null }; }
  else it = (W.stock[shop] || []).find((x) => x.uid === uid);
  if (!it) return;
  releaseDlg();
  const clerk = onDuty(shop);
  dlg = { pid: clerk ? clerk.id : null, mode: 'buy', shop, uid, food, text: `${cap(a_an(itemName(it)))}${it.makerName ? `, made by ${it.makerName}` : ''}. That's ${plural(itemPrice(it), 'coin')}.${clerk && it.maker === clerk.id ? ' I made that one myself!' : ''}` };
  renderDlg(true);
}
function openInteract(pid, opts = {}) {
  const p = person(pid); if (!p || MODE !== 'host') return;
  unfollowId = null;
  if (dlg && dlg.pid !== pid) releaseDlg();
  if (!interior && !p.inside && p.state === 'free') { p.state = 'talk'; p.heldByDlg = true; p.face = Math.atan2(camera.position.x - p.x, camera.position.z - p.z); }
  if (!interior && p.inside && p.task?.kind === 'home') { openInterior({ kind: 'room', id: pid }); }
  dlg = { pid, mode: 'menu', text: opts.text || greet(p) };
  openDetail = pid;
  if (!sheet.hidden && window.innerWidth < 820) sheet.hidden = true;
  renderDlg(true);
}
function releaseDlg() {
  if (!dlg) return;
  const p = person(dlg.pid);
  if (p && p.heldByDlg) { p.heldByDlg = false; if (p.state === 'talk') p.state = 'free'; }
  dlg = null; dlgEl.hidden = true; clearInterval(typeTimer);
}
function quoteOf(res) { const m = /"([^]*)"\s*$/.exec(res || ''); return m ? m[1] : res; }
function dlgSay(text) { if (!dlg) return; dlg.text = text; dlg.mode = 'menu'; renderDlg(true); }
function renderDlg(retype) {
  if (!dlg) return;
  const p = dlg.pid ? person(dlg.pid) : null;
  if (!p && !['buy', 'buyfor', 'done'].includes(dlg.mode)) { releaseDlg(); return; }
  dlgEl.hidden = false;
  dlgEl.style.setProperty('--nm', p ? COLORS[p.outfit.shirt] : '#ffd36b');
  $('#dlgName').innerHTML = p ? `<span class="dot" style="background:${skinCss(p)};border-color:#2a2238"></span>${esc(p.name)} <span class="lv">Lv ${p.level || 1}</span>` : esc(SHOPS[dlg.shop]?.name || 'Shop');
  if (retype) { typeText(dlg.text); if (p && dlg.text && !dlg.text.startsWith('💭 …')) Sound.voice(p, dlg.text.replace(/^💭\s*/, ''), true); }
  if (['buy', 'buyfor', 'done'].includes(dlg.mode)) {
    const C = W.creator;
    let h = `<p class="hint" style="color:#6d6488">You have ${C.coins} ✦.</p>`;
    if (dlg.mode === 'buy') h += `<div class="dlg-choices"><button class="btn gold" data-d="buy">Buy it</button><button class="btn" data-d="buyfor">Buy it as a gift for…</button><button class="btn" data-d="close">Never mind</button></div>`;
    else if (dlg.mode === 'buyfor') h += `<div class="dlg-choices">${W.people.map((q) => `<button class="btn" data-d="buyto" data-to="${q.id}">${esc(q.name)}${q.cr.wish ? ' ✨' : ''}</button>`).join('')}<button class="btn" data-d="close">Never mind</button></div>`;
    else h += `<div class="dlg-choices"><button class="btn" data-d="close">Keep looking</button></div>`;
    $('#dlgBody').innerHTML = h; return;
  }
  const C = W.creator, pr = problemOf(p), body = $('#dlgBody');
  const joy = `<div class="joy" title="Happiness"><i style="width:${Math.round(p.joy || 0)}%"></i></div>`;
  let html = '';
  if (dlg.mode === 'menu' && isAsleep(p)) {
    html = `${joy}<div class="dlg-choices"><button class="btn gold" data-d="dream">Peek at their dream</button><button class="btn" data-d="talk">Talk anyway</button><button class="btn" data-d="close">Let them sleep</button></div>`;
  } else if (dlg.mode === 'dream') {
    html = `<div class="dlg-choices"><button class="btn" data-d="close">Tiptoe away</button><button class="btn" data-d="menu">Back</button></div>`;
  } else if (dlg.mode === 'menu') {
    const probBtns = !pr ? '' : pr.kind === 'gift' ? `<button class="btn gold" data-d="present">Accept their present</button>`
      : pr.kind === 'hungry' ? `<button class="btn gold" data-d="food">Treat them to food</button>`
      : pr.kind === 'wish' ? `<button class="btn gold" data-d="gift">Give them something</button><button class="btn" data-d="adv" data-c="wait">I'll look for it</button>`
      : ['sick', 'hurt', 'low'].includes(pr.kind) ? `<button class="btn gold" data-d="care">Take care of them</button>`
      : pr.kind === 'fight' ? `<button class="btn gold" data-d="adv" data-c="sorry">Go apologize</button><button class="btn" data-d="adv" data-c="letgo">Let it go</button><button class="btn" data-d="adv" data-c="stand">Stand your ground</button>`
      : `<button class="btn gold" data-d="adv" data-c="friend">Go say hi to someone</button>`;
    html = `${joy}<div class="dlg-choices">${probBtns}
      <button class="btn" data-d="talk">Talk</button>
      ${pr?.kind === 'wish' ? '' : '<button class="btn" data-d="gift">Give a gift</button>'}
      ${pr?.kind === 'hungry' ? '' : '<button class="btn" data-d="food">Treat to food</button>'}
      <button class="btn" data-d="coins">Give coins</button>
      ${(interior?.kind === 'room' && interior.id === p.id) || p.visitor ? '' : `<button class="btn" data-d="room">Visit their room</button>`}
      <button class="btn" data-d="page">Their page</button></div>`;
  } else if (dlg.mode === 'talk') {
    const st = talkState[p.id] || (talkState[p.id] = { log: [], busy: false });
    html = RT.sample ? `<form class="talk-row" data-dtalk="${p.id}"><input id="dlgInput" type="text" maxlength="240" autocomplete="off" placeholder="Say something to ${esc(p.name)}…" ${st.busy ? 'disabled' : ''}><button class="btn gold" type="submit" ${st.busy ? 'disabled' : ''}>Speak</button></form>${st.err ? `<p class="hint" style="color:#8a4a4a">${esc(st.err)}</p>` : ''}<div class="dlg-choices"><button class="btn" data-d="menu">Back</button></div>`
      : `<p class="hint" style="color:#6d6488">Add an OpenRouter key in Settings to talk to them.</p><div class="dlg-choices"><button class="btn" data-d="menu">Back</button></div>`;
  } else if (dlg.mode === 'gift') {
    html = C.items.length ? `<div class="items">${C.items.map((it) => itemCard(it, `<div class="item-row"><span class="item-by">${wishMatch(p, it) ? '✨ their wish' : ''}</span><button class="btn gold" data-d="give" data-u="${it.uid}">Give</button></div>`)).join('')}</div>` : `<p class="hint" style="color:#6d6488">You don't have anything yet. Tap a shop in town to go inside and buy something.</p>`;
    html += `<div class="dlg-choices"><button class="btn" data-d="menu">Back</button></div>`;
  } else if (dlg.mode === 'food') {
    html = `<p class="hint" style="color:#6d6488">You have ${C.coins} ✦. Pick something and they'll eat it right away.</p><div class="dlg-choices">${FOODS.map((f) => `<button class="btn" data-d="feed" data-f="${f.id}" ${C.coins < f.price ? 'disabled' : ''}>${esc(cap(f.name))} · ${f.price} ✦</button>`).join('')}</div><div class="dlg-choices"><button class="btn" data-d="menu">Back</button></div>`;
  } else if (dlg.mode === 'coins') {
    html = `<p class="hint" style="color:#6d6488">You have ${C.coins} ✦.</p><div class="dlg-choices">${[1, 5, 10].map((n) => `<button class="btn gold" data-d="coin" data-n="${n}" ${C.coins < n ? 'disabled' : ''}>${plural(n, 'coin')}</button>`).join('')}<button class="btn" data-d="menu">Back</button></div>`;
  }
  body.innerHTML = html;
  if (dlg.mode === 'talk') { const i = $('#dlgInput'); if (i && !i.disabled) setTimeout(() => i.focus(), 30); }
}
dlgEl.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || !dlg) return;
  if (b.id === 'dlgX') { releaseDlg(); return; }
  const d = b.dataset.d;
  if (d === 'close') { releaseDlg(); return; }
  if (d === 'buy' || d === 'buyto') {
    const res = applyCmd({ t: 'buy', shop: dlg.shop, uid: dlg.uid, id: dlg.food, to: b.dataset.to || null });
    dlg.mode = 'done'; if (b.dataset.to) { dlg.pid = b.dataset.to; dlg.text = quoteOf(res); } else dlg.text = res; renderDlg(true); refreshPanel(true); return;
  }
  if (d === 'buyfor') { dlg.mode = 'buyfor'; renderDlg(false); return; }
  const p = person(dlg.pid); if (!p) return;
  if (['talk', 'gift', 'food', 'coins', 'menu'].includes(d)) { dlg.mode = d; renderDlg(d === 'menu' ? false : false); return; }
  if (d === 'dream') { dlg.mode = 'dream'; dlg.text = '💭 …'; renderDlg(true); const id = p.id; peekDream(p).then((txt) => { if (dlg && dlg.pid === id) { dlg.text = '💭 ' + txt; dlg.mode = 'dream'; renderDlg(true); } }); return; }
  if (d === 'present') { const it = claimPresent(p); addJoy(p, 0); markDirty(); dlgSay(it ? `Here! I made ${a_an(itemName(it))} just for you. I hope you like it!` : 'Hmm?'); if (it) toast(`${cap(itemName(it))} added to Your gifts.`); return; }
  if (d === 'care') { const id = p.id; releaseDlg(); openCare(id); return; }
  if (d === 'adv') { dlgSay(quoteOf(applyCmd({ t: 'advice', to: p.id, choice: b.dataset.c })) || 'Okay.'); return; }
  if (d === 'give') { dlgSay(quoteOf(applyCmd({ t: 'gift', uid: b.dataset.u, to: p.id }))); return; }
  if (d === 'feed') { dlgSay(quoteOf(applyCmd({ t: 'feed', to: p.id, id: b.dataset.f }))); return; }
  if (d === 'coin') { dlgSay(quoteOf(applyCmd({ t: 'coins', to: p.id, n: Number(b.dataset.n) }))); return; }
  if (d === 'room') { const id = p.id; releaseDlg(); openInterior({ kind: 'room', id }); if (person(id).inside && person(id).task?.kind === 'home') setTimeout(() => openInteract(id), 400); return; }
  if (d === 'page') { const id = p.id; releaseDlg(); activeTab = 'people'; openDetail = id; openSheet(); return; }
});
dlgEl.addEventListener('submit', async (e) => {
  const f = e.target.closest('[data-dtalk]'); if (!f || !dlg) return;
  e.preventDefault();
  const p = person(f.dataset.dtalk), said = $('#dlgInput').value.trim(); if (!p || !said || !RT.sample) return;
  const st = talkState[p.id] || (talkState[p.id] = { log: [], busy: false });
  st.log.push({ me: true, text: said }); st.busy = true; st.err = '';
  dlg.text = '…'; renderDlg(true);
  const history = st.log.slice(-7, -1).map((l) => ({ who: l.me ? 'Creator' : p.name, text: l.text }));
  try {
    const r = await RT.sample.json(talkPrompt(p, said, history), { model: modelOf(p), fallbackKey: 'reply', cache: false });
    const reply = String(r?.reply || '…').slice(0, 400);
    st.log.push({ me: false, text: reply });
    applyCmd({ t: 'talked', to: p.id, said, reply, feeling: clamp(Math.round(Number(r?.feeling) || 0), -2, 2), memory: String(r?.memory || '').slice(0, 200) });
    if (dlg && dlg.pid === p.id) { dlg.text = reply; }
  } catch (err) {
    st.log.pop();
    st.err = err?.code === 'no_key' || err?.code === 'no_credit' ? 'Add an OpenRouter key in Settings on the box to talk.' : err?.code === 'rate_limited' ? "You've been talking a lot. Try again in a bit." : (err?.code === 'bad_model' ? 'Their model is missing on OpenRouter. Pick another in Settings.' : err?.code === 'rate_limited' ? 'OpenRouter is busy. Try again in a moment.' : 'They got distracted. Try saying it again.');
    if (dlg && dlg.pid === p.id) dlg.text = `(${st.err})`;
  }
  st.busy = false;
  if (dlg && dlg.pid === p.id) { dlg.mode = 'talk'; renderDlg(true); }
});

