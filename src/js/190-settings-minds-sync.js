// ============================================================
// SETTINGS: minds and sync
// ============================================================
// one-tap model sets for Settings. The first one is the game's default list.
const MODEL_PICKS = [
  { key: 'default', label: 'The usual mix', models: DEFAULT_MODELS, judge: 'deepseek/deepseek-v4-flash', why: 'three cheap roleplay models, so residents sound a little different from each other' },
  { key: 'ds41', label: 'DeepSeek V4.1 Flash', models: ['deepseek/deepseek-v4.1-flash'], judge: 'deepseek/deepseek-v4.1-flash', why: 'newer and smarter than V4 Flash, better at keeping facts straight, still cheap (a little over V4 Flash)' },
  { key: 'glm', label: 'GLM 5.3 Flash', models: ['z-ai/glm-5.3-flash'], judge: 'z-ai/glm-5.3-flash', why: 'scores well on reasoning for its price and stays in character' },
];
function renderBrainSettings() {
  const el = $('#brainBox'); if (!el) return;
  const left = aiLeft();
  const fbLink = brainCfg.fbUrl && brainCfg.code ? `${location.origin === 'null' ? '(host this page first)' : location.origin + location.pathname}?db=${encodeURIComponent(brainCfg.fbUrl)}&code=${encodeURIComponent(brainCfg.code)}` : '';
  el.innerHTML = (MODE === 'remote' ? '<p class="label">Their minds</p><p class="hint">Minds are set up on the box. This remote asks the box to think when you talk to someone.</p>' : '') + `
    ${MODE === 'remote' ? '<div hidden>' : '<div style="display:flex;flex-direction:column;gap:10px">'}
    <p class="label">Their minds</p>
    <p class="hint">Each resident runs on its own model through OpenRouter. They talk to each other, argue, gossip and rewrite who they are each night. Without a key they fall back to simple rules.</p>
    <div class="field"><label for="orKey">OpenRouter key</label><input id="orKey" type="password" autocomplete="off" placeholder="sk-or-..." value="${esc(brainCfg.key)}" style="font:15px var(--body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:8px 10px"></div>
    <div class="field"><label for="orModels">Models residents can have (one per line)</label><textarea id="orModels" rows="4" style="font:14px ui-monospace,monospace;color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:8px 10px">${esc(brainCfg.models.join('\n'))}</textarea></div>
    <div class="field"><label for="orJudge">Model that judges how conversations went</label><input id="orJudge" type="text" value="${esc(brainCfg.judge)}" style="font:14px ui-monospace,monospace;color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:8px 10px"></div>
    <div class="field"><label for="orBudget">Most model calls per real day (about 3 or 4 per conversation)</label><input id="orBudget" type="number" min="0" max="5000" value="${brainCfg.budget}" style="font:15px var(--body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:8px 10px"></div>
    <div class="field"><label>Quick switch (everyone gets the same model, and you can switch back any time)</label><div class="btns">${MODEL_PICKS.map((m) => `<button class="btn${brainCfg.models.length === m.models.length && m.models.every((x, i) => brainCfg.models[i] === x) ? ' gold' : ''}" type="button" data-usemodels="${esc(m.key)}" title="${esc(m.why)}">${esc(m.label)}</button>`).join('')}</div><p class="hint">${MODEL_PICKS.map((m) => `<b>${esc(m.label)}</b>: ${esc(m.why)}`).join('<br>')}</p></div>
    <div class="btns"><button class="btn gold" type="button" id="orSave">Save minds</button><button class="btn" type="button" id="orFind">Find cheap roleplay models</button><button class="btn" type="button" id="orShuffle">Give everyone a new model</button></div>
    <p class="status">${aiDown ? esc(aiDown) : lastAiError ? esc(lastAiError) + ' · ' + aiStats.n + ' calls today' : brainCfg.key ? `${aiStats.n} calls today, ${Math.max(0, left)} left · about $${aiStats.cost.toFixed(3)} spent today` : 'No key yet, so residents run on rules.'}</p>
    <div id="orList"></div></div>
    <hr>
    <p class="label">Sync between devices</p>
    <p class="hint">Needed for the remote and the ferry. Paste your Firebase Realtime Database URL. The town code keeps your town separate; anyone with both can see it, so keep them private.</p>
    <div class="field"><label for="fbUrl">Firebase database URL</label><input id="fbUrl" type="url" placeholder="https://your-project-default-rtdb.firebaseio.com" value="${esc(brainCfg.fbUrl)}" style="font:14px var(--body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:8px 10px"></div>
    <div class="field"><label for="fbCode">Town code</label><input id="fbCode" type="text" value="${esc(brainCfg.code || 'glimmer-' + uid() + uid())}" style="font:14px ui-monospace,monospace;color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:8px 10px"></div>
    <div class="btns"><button class="btn gold" type="button" id="fbSave">Save and reload</button></div>
    ${fbLink ? `<p class="hint">Open these on your other devices. They copy the sync settings over, but never your OpenRouter key.</p>
      <div class="btns"><button class="btn" type="button" data-copy="${esc(fbLink + '#remote')}">Copy remote link</button><button class="btn" type="button" data-copy="${esc(fbLink + '#isle2')}">Copy second island link</button><button class="btn" type="button" data-copy="${esc(fbLink + '#box')}">Copy box link</button></div>` : ''}`;
}
document.addEventListener('click', async (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'orSave') {
    brainCfg.key = $('#orKey').value.trim();
    brainCfg.models = $('#orModels').value.split(/\s*\n\s*/).map((s) => s.trim()).filter(Boolean);
    if (!brainCfg.models.length) brainCfg.models = DEFAULT_MODELS.slice();
    brainCfg.judge = $('#orJudge').value.trim() || brainCfg.models[0];
    brainCfg.budget = clamp(Number($('#orBudget').value) || 0, 0, 5000);
    aiDown = ''; saveBrain();
    if (MODE === 'host') RT.sample = brainCfg.key ? makeSample() : null;
    badModels.clear(); lastAiError = ''; checkModels(); if (W) W.people.forEach(modelOf);
    toast(brainCfg.key ? 'Saved. Residents will start thinking for themselves.' : 'Saved.'); renderBrainSettings();
  }
  if (b.dataset.usemodels) {
    const m = MODEL_PICKS.find((x) => x.key === b.dataset.usemodels); if (!m) return;
    brainCfg.models = m.models.slice(); brainCfg.judge = m.judge; saveBrain();
    badModels.clear(); lastAiError = ''; checkModels(); if (W) { W.people.forEach((p) => { p.model = null; modelOf(p); }); markDirty(); }
    toast(`Switched to ${m.label}.`); renderBrainSettings();
  }
  if (b.id === 'orShuffle' && W) { W.people.forEach((p) => { p.model = pick(brainCfg.models); }); markDirty(); toast('Everyone got a new model.'); refreshPanel(true); }
  if (b.id === 'orFind') {
    b.disabled = true; b.textContent = 'Looking…';
    try {
      const r = await fetch('https://openrouter.ai/api/v1/models'); const d = await r.json();
      const list = (d.data || []).filter((m) => (m.context_length || 0) >= 32000 && Number(m.pricing?.prompt) > 0 && Number(m.pricing?.completion) < 0.0000015 && /(deepseek|glm|mimo|flash|llama|mistral|qwen|gemma|hermes|muse)/i.test(m.id)).sort((x, y) => (Number(x.pricing.prompt) + Number(x.pricing.completion)) - (Number(y.pricing.prompt) + Number(y.pricing.completion))).slice(0, 14);
      $('#orList').innerHTML = `<div class="chips">${list.map((m) => `<button class="btn" type="button" data-addmodel="${esc(m.id)}" style="font-size:12px;padding:5px 10px">${esc(m.id)} · $${(Number(m.pricing.prompt) * 1e6).toFixed(2)}/$${(Number(m.pricing.completion) * 1e6).toFixed(2)}</button>`).join('')}</div><p class="hint">Prices per million input/output tokens. Tap one to add it to the list, then save.</p>`;
    } catch (x) { $('#orList').innerHTML = '<p class="hint">Couldn\'t reach OpenRouter right now.</p>'; }
    b.disabled = false; b.textContent = 'Find cheap roleplay models';
  }
  if (b.dataset.addmodel) { const ta = $('#orModels'); if (!ta.value.split('\n').includes(b.dataset.addmodel)) ta.value = (ta.value.trim() + '\n' + b.dataset.addmodel).trim(); }
  if (b.id === 'fbSave') { brainCfg.fbUrl = $('#fbUrl').value.trim(); brainCfg.code = $('#fbCode').value.trim(); saveBrain(); saveNow(); setTimeout(() => location.reload(), 400); }
  if (b.dataset.copy) { try { await navigator.clipboard.writeText(b.dataset.copy); toast('Link copied.'); } catch (x) { prompt('Copy this link:', b.dataset.copy); } }
});

let dirty = false, saving = false, lastDbSave = 0;
function markDirty() { dirty = true; }
function serialize() {
  return JSON.parse(JSON.stringify(W, (k, v) => (k === 'bubble' || k === 'emote' || k === 'happyUntil' || k === 'lastD' || k === 'stuckT' ? undefined : v === Infinity ? 1e12 : v)));
}
function trimForSize(obj) {
  let s = JSON.stringify(obj);
  while (s.length > 230000 && obj.log.length > 40) { obj.log.splice(0, 40); s = JSON.stringify(obj); }
  if (s.length > 230000) for (const p of obj.people) { p.past = p.past.slice(0, 12); p.today = p.today.slice(-15); }
  return obj;
}
async function saveNow() {
  if (MODE !== 'host' || !W) return;
  W.lastReal = Date.now();
  const snap = trimForSize(serialize());
  snap.pairCool = {}; snap.meeting = null;
  try { localStorage.setItem(ISL.save, JSON.stringify(snap)); } catch (e) {}
  if (!RT.db || saving) { if (saving) dirty = true; return; }
  saving = true; dirty = false; lastDbSave = now;
  RT.db.doc(ISL.doc + '/alive').set({ at: Date.now() }).catch(() => {});
  try { await RT.db.doc(STATE_DOC).set({ v: 3, savedAt: Date.now(), host: DEVICE, world: snap }); } catch (e) { if (e && e.code === 'quota_exceeded') toast('The town is too big to save online.'); }
  saving = false;
}
function fixLoaded(s) {
  s.pairCool = {}; s.babies = s.babies || []; s.meeting = null; s.mail = s.mail || []; s.stock.books = s.stock.books || []; s.placed = s.placed || []; s.lobes = s.lobes || []; s.pantry = s.pantry || 0; for (const q of s.people) { q.body.openness = q.body.openness ?? rand() * 2 - 1; }
  for (const p of s.people) {
    p.state = 'free'; p.path = p.path || []; p.heldByDlg = false; p.joy = p.joy || 0; p.level = p.level || 1;
    if (p.inside && p.task?.kind === 'home') p.busyUntil = Infinity;
    else { p.inside = false; p.task = null; p.path = []; p.at = 'plaza'; const a = rand() * 6.28; p.x = Math.cos(a) * 7; p.z = Math.sin(a) * 7; }
  }
  return s;
}
async function loadWorld() {
  if (RT.db) {
    try { const d = await RT.db.doc(STATE_DOC).get(); const v = d.exists && d.data(); if (v && v.v === 3 && v.world?.people?.length) return fixLoaded(JSON.parse(JSON.stringify(v.world))); } catch (e) {}
  }
  try { const s = JSON.parse(localStorage.getItem(ISL.save) || 'null'); if (s && s.v === 3 && s.people?.length) return fixLoaded(s); } catch (e) {}
  return null;
}
function newWorld() {
  W = { v: 3, day: 1, t: 0.004, weather: 'clear', people: [], log: [], pairCool: {}, nextId: 1, reflectedDay: 0, meetingDay: 0, babies: [], bushes: BUSHES.map(() => 3),
    stock: { clothes: [], nook: [] }, keeper: {}, creator: { coins: 30, items: [], gifts: {}, giftsTotal: 0 }, project: null, built: {}, event: null, minutes: null, mail: [], paper: null, placed: [], lobes: [], pantry: 0 };
  for (let i = 0; i < 5; i++) W.people.push(birth());
  importStock();
  diary(`${W.people.map((p) => esc(p.name)).join(', ')} moved into the apartments. Nobody has seen the Creator yet.`);
  return W;
}

