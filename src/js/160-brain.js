// ============================================================
// THE BRAIN: OpenRouter models, Firebase sync (standalone version)
// ============================================================
const BRAIN_KEY = 'glimmer-brain';
const DEFAULT_MODELS = ['deepseek/deepseek-v4-flash', 'z-ai/glm-5.3-flash', 'xiaomi/mimo-v2.5'];
const brainCfg = { key: '', models: DEFAULT_MODELS.slice(), judge: 'deepseek/deepseek-v4-flash', budget: 2000, fbUrl: '', code: '' };
function loadBrain() {
  try { Object.assign(brainCfg, JSON.parse(localStorage.getItem(BRAIN_KEY) || '{}')); } catch (e) {}
  const q = new URLSearchParams(location.search);
  if (q.get('db')) { brainCfg.fbUrl = q.get('db'); brainCfg.code = q.get('code') || brainCfg.code; saveBrain(); try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {} }
  if (!brainCfg.models.length) brainCfg.models = DEFAULT_MODELS.slice();
}
function saveBrain() { try { localStorage.setItem(BRAIN_KEY, JSON.stringify(brainCfg)); } catch (e) {} }
const TAB = DEVICE + '-' + uid();

let aiStats = (() => { try { return JSON.parse(localStorage.getItem('glimmer-ai-usage')) || { day: '', n: 0, cost: 0 }; } catch (e) { return { day: '', n: 0, cost: 0 }; } })(), aiDown = '';
function aiLeft() { const d = new Date().toDateString(); if (aiStats.day !== d) aiStats = { day: d, n: 0, cost: 0 }; return brainCfg.budget - aiStats.n; }
setInterval(() => { try { localStorage.setItem('glimmer-ai-usage', JSON.stringify(aiStats)); } catch (e) {} }, 15000);
function parseLoose(text) {
  const t = String(text || '');
  const fence = /```(?:json)?\s*([\s\S]*?)```/.exec(t);
  const body = fence ? fence[1] : t;
  const a = body.indexOf('{'), b = body.lastIndexOf('}');
  if (a < 0 || b < a) throw { code: 'invalid_json', text: t };
  return JSON.parse(body.slice(a, b + 1));
}
const badModels = new Set();
async function llmOnce(model, messages, opts) {
  let res;
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${brainCfg.key}`, 'Content-Type': 'application/json', 'X-Title': 'Glimmer Town' },
      body: JSON.stringify({ model, messages, temperature: opts.temperature ?? 0.95, max_tokens: Math.max(900, (opts.max || 450) * 2), reasoning: { effort: 'low', exclude: true }, usage: { include: true } }),
    });
  } catch (e) { throw { code: 'upstream_error' }; }
  if (!res.ok) {
    let msg = ''; try { msg = (await res.json())?.error?.message || ''; } catch (e) {}
    if (res.status === 401) { aiDown = 'OpenRouter rejected the key. Check it in Settings.'; throw { code: 'no_key' }; }
    if (res.status === 402) { aiDown = 'Your OpenRouter credits ran out, so residents went back to their own rules.'; throw { code: 'no_credit' }; }
    if (res.status === 400 || res.status === 404) { if (/model|not a valid|not found|no endpoints/i.test(msg)) { badModels.add(model); lastAiError = `${shortModel(model)} isn't available on OpenRouter, so I'm skipping it.`; } throw { code: 'bad_model' }; }
    throw { code: res.status === 429 ? 'rate_limited' : 'upstream_error' };
  }
  const d = await res.json();
  if (d.usage?.cost) aiStats.cost += d.usage.cost;
  const text = (d.choices?.[0]?.message?.content || '').trim();
  if (!text) throw { code: 'empty' };
  return text;
}
let lastAiError = '';
async function llm(input, opts = {}) {
  if (!brainCfg.key) throw { code: 'no_key' };
  aiLeft(); aiStats.n++;
  const messages = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
  const first = opts.model && !badModels.has(opts.model) ? opts.model : null;
  const order = [first, ...brainCfg.models.filter((m) => m !== first)].filter((m) => m && !badModels.has(m));
  if (!order.length) { lastAiError = 'None of your models are available on OpenRouter. Tap "Find cheap roleplay models" in Settings.'; throw { code: 'bad_model' }; }
  let err = { code: 'upstream_error' };
  for (const model of order.slice(0, 3)) {
    try {
      const text = await llmOnce(model, messages, opts);
      if (opts.raw) return text;
      try { return parseLoose(text); }
      catch (e) { if (opts.fallbackKey) return { [opts.fallbackKey]: text.replace(/^```\w*|```$/g, '').replace(/^["'\s]+|["'\s]+$/g, '').slice(0, 500) }; err = { code: 'invalid_json' }; }
    } catch (e) { err = e; if (e.code === 'no_key' || e.code === 'no_credit') throw e; }
  }
  if (err.code === 'rate_limited') lastAiError = 'OpenRouter is busy right now (rate limited).';
  throw err;
}
async function checkModels(showToast) {
  try {
    const r = await fetch('https://openrouter.ai/api/v1/models'); const d = await r.json();
    const ids = new Set((d.data || []).map((m) => m.id));
    if (!ids.size) return;
    const missing = brainCfg.models.filter((m) => !ids.has(m));
    missing.forEach((m) => badModels.add(m));
    if (brainCfg.judge && !ids.has(brainCfg.judge)) badModels.add(brainCfg.judge);
    if (missing.length && showToast !== false) toast(`Not on OpenRouter anymore: ${missing.map(shortModel).join(', ')}. Tap "Find cheap roleplay models" in Settings to swap them.`);
  } catch (e) {}
}
function makeSample() { const s = async (input, opts = {}) => ({ text: await llm(input, { ...opts, raw: true }) }); s.json = (input, opts = {}) => llm(input, opts); return s; }
function modelOf(p) { const good = brainCfg.models.filter((m) => !badModels.has(m)); if (!p) return good[0] || brainCfg.models[0]; if (!p.model || !brainCfg.models.includes(p.model) || (badModels.has(p.model) && good.length)) p.model = good.length ? good[(parseInt(String(p.id).slice(1)) || 0) % good.length] : p.model; return p.model; }
function __oldModelOf(p) { if (!p) return brainCfg.models[0]; if (!p.model || !brainCfg.models.includes(p.model)) p.model = brainCfg.models[(parseInt(p.id.slice(1)) || 0) % brainCfg.models.length]; return p.model; }
const shortModel = (m) => String(m || '').split('/').pop();
const aiReady = () => MODE === 'host' && !offlineSim && !!brainCfg.key && !aiDown && aiLeft() >= 4;

// ---- Firebase Realtime Database over plain REST + EventSource ----
function applyPath(root, path, data, type) {
  if (path === '/' || path === '') { if (type === 'patch' && root && typeof root === 'object') return { ...root, ...data }; return data; }
  const keys = path.split('/').filter(Boolean);
  const out = root && typeof root === 'object' ? { ...root } : {};
  let cur = out;
  for (let i = 0; i < keys.length - 1; i++) { cur[keys[i]] = cur[keys[i]] && typeof cur[keys[i]] === 'object' ? { ...cur[keys[i]] } : {}; cur = cur[keys[i]]; }
  const last = keys[keys.length - 1];
  if (data === null) delete cur[last];
  else if (type === 'patch' && cur[last] && typeof cur[last] === 'object') cur[last] = { ...cur[last], ...data };
  else cur[last] = data;
  return out;
}
function firebase(base, code) {
  const root = base.trim().replace(/\/+$/, '') + '/' + encodeURIComponent(code.trim());
  const url = (p) => `${root}/${p}.json`;
  const req = async (p, method = 'GET', body) => { const r = await fetch(url(p), { method, body: body === undefined ? undefined : JSON.stringify(body) }); if (!r.ok) throw { code: r.status === 401 || r.status === 403 ? 'not_granted' : 'unavailable' }; return r.json(); };
  const stream = (p, fn) => { const es = new EventSource(url(p)); const h = (e) => { try { const m = JSON.parse(e.data); fn(e.type, m.path, m.data); } catch (x) {} }; es.addEventListener('put', h); es.addEventListener('patch', h); return () => es.close(); };
  const snap = (v, id = '') => ({ id, exists: v !== null && v !== undefined, data: () => (v === null ? undefined : v), metadata: {} });
  const doc = (p) => ({
    id: p.split('/').pop(), path: p,
    get: async () => snap(await req(p)),
    set: (v) => req(p, 'PUT', v), update: (v) => req(p, 'PATCH', v), delete: () => req(p, 'DELETE'),
    async acquire({ holder, ttlMs = 30000 }) { const cur = await req(p + '/lease'); const t = Date.now(); if (cur && cur.holder !== holder && cur.exp > t) return { acquired: false }; await req(p + '/lease', 'PUT', { holder, exp: t + ttlMs }); return { acquired: true }; },
    onSnapshot(next) { let val = null; return stream(p, (type, path, data) => { val = applyPath(val, path, data, type); next(snap(val)); }); },
  });
  const coll = (p, filt) => ({
    path: p,
    doc: (id) => doc(`${p}/${id || uid() + uid()}`),
    where: (f, op, v) => coll(p, [f, v]),
    onSnapshot(next) {
      const seen = new Set(); let val = {};
      return stream(p, (type, path, data) => {
        val = applyPath(val, path, data, type) || {};
        const changes = [];
        for (const [id, d] of Object.entries(val)) { if (!d || seen.has(id)) continue; if (filt && d[filt[0]] !== filt[1]) continue; seen.add(id); changes.push({ type: 'added', doc: snap(d, id) }); }
        if (changes.length) next({ docChanges: () => changes });
      });
    },
  });
  const db = { doc, collection: (p) => coll(p) };
  const room = {
    emit: async (topic, data) => { await req(`room/${topic}`, 'POST', { data, from: TAB, at: Date.now() }); },
    on(topic, handler) {
      let first = true;
      return stream(`room/${topic}`, (type, path, d) => {
        if (path === '/') { if (first) { first = false; if (d) for (const [k, v] of Object.entries(d)) if (Date.now() - (v?.at || 0) > 20000) req(`room/${topic}/${k}`, 'DELETE').catch(() => {}); } return; }
        const parts = path.split('/').filter(Boolean);
        if (parts.length !== 1 || !d) return;
        const mine = d.from === TAB;
        handler({ topic, data: d.data, sameTab: mine, isMe: mine, peer: d.from, kind: 'viewer' });
        if (!mine) req(`room/${topic}/${parts[0]}`, 'DELETE').catch(() => {});
      });
    },
    onPeers(h) {
      const beat = async () => { try { await req(`peers/${TAB}`, 'PUT', Date.now()); const all = (await req('peers')) || {}; const t = Date.now(); for (const [k, v] of Object.entries(all)) if (t - v > 90000) req(`peers/${k}`, 'DELETE').catch(() => {}); h({ peers: Object.values(all).filter((v) => t - v < 60000) }); } catch (e) {} };
      beat(); setInterval(beat, 25000); return () => {};
    },
    connected: () => true,
  };
  return { db, room };
}
// a remote asks the box to think for it, so the key only lives on the box
const llmWaits = new Map();
function proxySample() {
  const ask = (input, opts = {}, raw = false) => new Promise((resolve, reject) => {
    const rid = uid();
    const timer = setTimeout(() => { llmWaits.delete(rid); reject({ code: 'upstream_error' }); }, 90000);
    llmWaits.set(rid, { resolve, reject, timer });
    RT.room.emit(`${rIsle}-cmd`, { t: 'llm', rid, input, model: opts.model || null, fallbackKey: opts.fallbackKey || null, raw, isle: rIsle }).catch(() => reject({ code: 'upstream_error' }));
  });
  const s = async (input, opts) => ({ text: await ask(input, opts, true) }); s.json = (input, opts) => ask(input, opts); return s;
}

async function initRuntime() {
  loadBrain();
  if (brainCfg.fbUrl && brainCfg.code) { try { const fb = firebase(brainCfg.fbUrl, brainCfg.code); RT.db = fb.db; RT.room = fb.room; } catch (e) {} }
  RT.sample = brainCfg.key ? makeSample() : null;
}

