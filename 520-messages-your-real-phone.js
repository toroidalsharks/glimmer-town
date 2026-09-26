// ============================================================
// MESSAGES TO YOUR REAL PHONE: push notifications through ntfy,
// and email for the really bad stuff
// ============================================================
const notifyCfg = { topic: '', token: '', email: '', bad: true, news: true, ask: true, digest: false, quietFrom: 22, quietTo: 8, maxDay: 5 };
function loadNotify() { try { Object.assign(notifyCfg, JSON.parse(localStorage.getItem('glimmer-notify') || '{}')); } catch (e) {} }
function saveNotify() { try { localStorage.setItem('glimmer-notify', JSON.stringify(notifyCfg)); } catch (e) {} }
loadNotify();
let notifySent = (() => { try { return JSON.parse(localStorage.getItem('glimmer-notify-log') || '[]'); } catch (e) { return []; } })();
function logSent(key) { notifySent.push({ at: Date.now(), key }); notifySent = notifySent.filter((x) => Date.now() - x.at < 864e5); try { localStorage.setItem('glimmer-notify-log', JSON.stringify(notifySent)); } catch (e) {} }
function quietNow() { const h = new Date().getHours(), a = +notifyCfg.quietFrom, b = +notifyCfg.quietTo; if (a === b) return false; return a < b ? h >= a && h < b : h >= a || h < b; }
function canNotify(level, key) {
  if (MODE !== 'host' || !notifyCfg.topic || !notifyCfg[level] || typeof offlineSim !== 'undefined' && offlineSim) return false;
  if (level !== 'bad' && quietNow()) return false;
  if (notifySent.filter((x) => Date.now() - x.at < 864e5).length >= (+notifyCfg.maxDay || 5)) return false;
  if (key && notifySent.some((x) => x.key === key && Date.now() - x.at < 6 * 3600e3)) return false;
  return true;
}
async function sendPush(level, title, message, opts = {}) {
  if (!notifyCfg.topic) return false;
  const payload = { topic: notifyCfg.topic, title: String(title).slice(0, 120), message: String(message).slice(0, 900), priority: level === 'bad' ? 4 : level === 'ask' ? 3 : 3, tags: opts.tags || [level === 'bad' ? 'rotating_light' : level === 'ask' ? 'pray' : 'sparkles'] };
  try { payload.click = location.href.split('#')[0]; } catch (e) {}
  if ((level === 'bad' || opts.email) && notifyCfg.email && notifyCfg.token) payload.email = notifyCfg.email;
  try {
    const r = await fetch('https://ntfy.sh/', { method: 'POST', body: JSON.stringify(payload), headers: notifyCfg.token ? { Authorization: 'Bearer ' + notifyCfg.token } : {} });
    if (!r.ok) { lastNotifyError = `ntfy said ${r.status}${r.status === 403 || r.status === 401 ? ' (check the access token)' : r.status === 429 ? ' (too many messages today)' : ''}.`; return false; }
    lastNotifyError = ''; return true;
  } catch (e) { lastNotifyError = "Couldn't reach ntfy.sh from the box."; return false; }
}
let lastNotifyError = '';
async function residentVoice(p, situation, fallback) {
  if (p && aiReady() && aiBusy < 3) {
    try {
      const r = await llm(`You are ${p.name}, a villager in ${ISL.name}, a tiny island town. In your own words: ${p.selfNote}${p.style ? `\nHOW YOU TALK: ${styleOf(p)}` : ''}
You're texting the Creator (the mysterious being who made your island; they're away right now and you can reach them on their phone). What's going on: ${situation}
Write the text: one or two short sentences, in your own voice, like a real text message.
Reply with only JSON: {"text": "..."}`, { model: modelOf(p), max: 90, fallbackKey: 'text' });
      if (r?.text) return String(r.text).replace(/^["']|["']$/g, '').slice(0, 240);
    } catch (e) {}
  }
  return fallback;
}
async function notifyCreator(level, p, situation, fallbackText, opts = {}) {
  const key = opts.key || `${level}:${situation.slice(0, 40)}`;
  if (!canNotify(level, key)) return false;
  logSent(key);
  const said = p ? await residentVoice(p, situation, fallbackText || null) : null;
  const title = level === 'bad' ? `${said && p ? p.name + ' needs you' : 'Trouble on the island'} (${ISL.name})` : level === 'ask' ? `${p ? p.name : 'Someone'} is asking for something` : `News from ${ISL.name}`;
  const body = said ? `${p.name}: "${said}"${level !== 'ask' ? `\n\n${situation}` : ''}` : situation;
  const ok = await sendPush(level, title, body, opts);
  if (ok) { W.notified = W.notified || []; W.notified.push({ day: W.day, level, text: body.slice(0, 200), at: Date.now() }); if (W.notified.length > 20) W.notified.shift(); }
  return ok;
}
const NOTIFY_RULES = [
  [/🔥 <b>An uproar broke out/, 'bad', (t) => { const S = W.scene; const p = S && person(pick(S.members).id); return [p, `A huge argument just broke out at the fountain about "${S?.issue.label || 'something'}". Everyone is taking sides.`, 'uproar:' + (S?.id || W.day), `everyone is yelling at the fountain. it's about "${S?.issue.label || 'something'}". please come`]; }],
  [/💥 <b>/, 'bad', () => { const S = W.scene; const p = S && person(pick(S.members).id); return [p, "Someone just got shoved in the middle of the fight at the fountain. It's getting physical.", 'shove:' + (S?.id || W.day), 'someone just got SHOVED. this is bad']; }],
  [/😷 <b>/, 'bad', (t) => { const p = byTag(t); const f = friendOf(p); return [f || p, `${p?.name || 'Someone'} is really sick with pneumonia and can't get out of bed.`, 'pneu:' + p?.id, f ? `${p?.name} is really sick. like REALLY sick. can you check on them?` : 'i am so sick. i can barely breathe']; }],
  [/🦴 <b>/, 'bad', (t) => { const p = byTag(t); return [p, `${p?.name || 'Someone'} broke their arm.`, 'broke:' + p?.id, 'i broke my arm. it hurts so bad']; }],
  [/✊ <b>Strike!/, 'bad', () => { const p = pick(W.people.filter((q) => collarOf(q) && collarOf(q) !== 'white')); return [p, "The workers went on strike outside Glimmer Labs. Nobody's working today.", 'strike:' + W.day, "we're on strike. nobody's working today. just so you know"]; }],
  [/🤒 Something is going around/, 'bad', () => { const p = pick(W.people.filter((q) => q.health?.ill)); return [p, 'A bunch of people on the island are sick at the same time.', 'sickwave:' + W.day, 'half the island is sick. it is like a zombie movie but with tissues']; }],
  [/was born to/, 'news', (t) => { const k = byTag(t), par = k && W.people.find((q) => (k.parents || []).includes(q.name)); return [par || k, `A baby was born on the island: ${stripHtml(t)}`, 'born:' + W.day]; }],
  [/moved into room/, 'news', (t) => { const p = byTag(t); return [p, `Someone new moved to the island: ${stripHtml(t)}`, 'moved:' + p?.id]; }],
  [/got married|💍 <b>/, 'news', (t) => { const p = byTag(t); return [p, stripHtml(t), 'wed:' + W.day]; }],
  [/💻 <b>[^<]+<\/b> saved up/, 'news', (t) => { const p = byTag(t); return [p, `${p?.name} saved up and bought their own laptop.`, 'laptop:' + p?.id]; }],
  [/^(📄|🧬|⚗️|🔭) <b>/, 'news', (t) => { const p = byTag(t); return [p, stripHtml(t), 'paper:' + p?.id + W.day]; }],
  [/^🤖 <b>/, 'news', (t) => { const p = byTag(t); return [p, stripHtml(t), 'robot:' + W.day]; }],
  [/^✍️ <b>/, 'news', (t) => { const p = byTag(t); return [p, stripHtml(t), 'book:' + p?.id]; }],
  [/^🎉 <b>/, 'news', (t) => { const p = byTag(t); return [p, stripHtml(t), 'party:' + W.day]; }],
  [/^🧩 <b>[^<]+<\/b> started/, 'news', (t) => { const p = byTag(t); return [p, stripHtml(t), 'club:' + p?.id]; }],
];
function byTag(t, i = 0) { const names = [...String(t).matchAll(/<b>([^<]+)<\/b>/g)].map((m) => m[1]); return names[i] ? W.people.find((q) => q.name === names[i]) : null; }
function friendOf(p) { if (!p) return null; return W.people.filter((q) => q !== p && fscore(q, p) >= 3).sort((a, b) => fscore(b, p) - fscore(a, p))[0] || null; }
function notifyWatch(html) {
  if (MODE !== 'host' || !notifyCfg.topic || (typeof offlineSim !== 'undefined' && offlineSim)) return;
  for (const [re, level, fn] of NOTIFY_RULES) {
    if (!re.test(html)) continue;
    try { const [p, sit, key, fb] = fn(html); notifyCreator(level, p, sit, fb || null, { key }); } catch (e) {}
    return;
  }
}
let starveCheck = 0;
function notifyTick() {
  if (MODE !== 'host' || !notifyCfg.topic || now < starveCheck) return;
  starveCheck = now + 30;
  const p = W.people.find((q) => q.hunger > 0.95 && q.coins < 1 && !q.away && !q.inside);
  if (p) notifyCreator('bad', p, `${p.name} is starving and has no coins left for food.`, "i'm so hungry and i don't have any coins. can you help?", { key: 'starve:' + p.id + W.day });
  if (notifyCfg.digest && W.t > 0.62 && W.digestDay !== new Date().toDateString() && canNotify('news', 'digest:' + new Date().toDateString())) {
    W.digestDay = new Date().toDateString();
    const hi = W.log.filter((e) => e.day === W.day && /^(🔥|💥|💻|🎉|🧩|✍️|🩺|😷|🦴|🤖|📄|🧬|🌐|💍|💔|✊|🎂)/.test(e.text)).slice(-8).map((e) => '• ' + stripHtml(e.text).slice(0, 140));
    if (hi.length) { logSent('digest:' + W.digestDay); sendPush('news', `Today in ${ISL.name} (day ${W.day})`, hi.join('\n'), { email: true, tags: ['newspaper'] }); }
  }
}
function newTopic() { const a = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = 'glimmer-'; for (let i = 0; i < 14; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
function renderNotify() {
  const el = $('#notifyBox'); if (!el) return;
  if (MODE !== 'host') { el.innerHTML = '<p class="label">📱 Messages from the island</p><p class="hint">Set this up on the box itself, since the box is the one that sends them.</p>'; return; }
  const C = notifyCfg;
  el.innerHTML = `<p class="label">📱 Messages from the island</p>
    <p class="hint">Residents can text your real phone when something big happens. It uses <b>ntfy</b>, a free notification app: install it (iPhone or Android), tap +, and subscribe to the topic below. Keep the topic secret; anyone who knows it can read the messages.</p>
    <div class="field"><label for="ntTopic">Your private topic</label><div style="display:flex;gap:6px"><input id="ntTopic" value="${esc(C.topic)}" placeholder="tap New" style="flex:1;font:14px var(--body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:8px 10px"><button class="btn" type="button" data-nt="new">New</button></div></div>
    ${C.topic ? `<p class="hint">In the app, subscribe to <b>${esc(C.topic)}</b> on ntfy.sh, or open <a href="https://ntfy.sh/${encodeURIComponent(C.topic)}" target="_blank" rel="noopener">ntfy.sh/${esc(C.topic)}</a> on your phone.</p>` : ''}
    <label class="check"><input type="checkbox" id="ntBad" ${C.bad ? 'checked' : ''}> When things go really bad (uproars, fights, serious illness, strikes, starving)</label>
    <label class="check"><input type="checkbox" id="ntNews" ${C.news ? 'checked' : ''}> When something new happens (babies, weddings, new laptops, books, robots, parties)</label>
    <label class="check"><input type="checkbox" id="ntAsk" ${C.ask ? 'checked' : ''}> When someone asks you for something</label>
    <label class="check"><input type="checkbox" id="ntDigest" ${C.digest ? 'checked' : ''}> A short summary every evening</label>
    <div class="field"><label for="ntMax">At most this many a day</label><select id="ntMax">${[2, 3, 5, 8, 12].map((n) => `<option ${+C.maxDay === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="field"><label>Quiet hours (only really bad news gets through)</label><div style="display:flex;gap:6px;align-items:center"><select id="ntQf">${[...Array(24).keys()].map((h) => `<option value="${h}" ${+C.quietFrom === h ? 'selected' : ''}>${(h % 12) || 12}${h < 12 ? 'am' : 'pm'}</option>`).join('')}</select> to <select id="ntQt">${[...Array(24).keys()].map((h) => `<option value="${h}" ${+C.quietTo === h ? 'selected' : ''}>${(h % 12) || 12}${h < 12 ? 'am' : 'pm'}</option>`).join('')}</select></div></div>
    <details><summary class="hint" style="cursor:pointer">Email too (optional)</summary>
      <p class="hint">ntfy only sends email for accounts with a verified address. Make a free account at ntfy.sh, verify your email under Account, create an access token, and paste both here. Really bad news and the evening summary will also go to your inbox.</p>
      <div class="field"><label for="ntEmail">Your email</label><input id="ntEmail" type="email" value="${esc(C.email)}" style="font:14px var(--body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:8px 10px"></div>
      <div class="field"><label for="ntToken">ntfy access token</label><input id="ntToken" type="password" value="${esc(C.token)}" placeholder="tk_…" style="font:14px var(--body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:8px 10px"></div>
    </details>
    <div class="btns"><button class="btn gold" type="button" data-nt="save">Save</button><button class="btn" type="button" data-nt="test" ${C.topic ? '' : 'disabled'}>Send a test message</button></div>
    ${lastNotifyError ? `<p class="hint" style="color:var(--bad)">${esc(lastNotifyError)}</p>` : ''}
    <p class="hint">Real text messages (SMS) need a paid service and a server, so this sends app notifications instead. They show up on your lock screen like a text.</p>
    <hr><p class="label">🌙 While the box is off</p>
    <p class="hint">When you open the island again, it catches up on the time you missed.</p>
    <div class="field"><label for="awayPace">Island time while you're away</label><select id="awayPace">${[[0, 'Pause the island'], [0.5, '1 day for every 2 hours'], [1, '1 day for every hour'], [2, '2 days for every hour']].map(([v, n]) => `<option value="${v}" ${+(cfg.awayPace ?? 1) === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="field"><label for="awayMax">Catch up at most</label><select id="awayMax">${[1, 3, 5, 7, 14].map((n) => `<option value="${n}" ${+(cfg.awayMax ?? 7) === n ? 'selected' : ''}>${plural(n, 'day')}</option>`).join('')}</select></div>`;
}
function readNotifyForm() {
  const v = (id) => $('#' + id);
  notifyCfg.topic = (v('ntTopic')?.value || '').trim().replace(/[^\w-]/g, '').slice(0, 64);
  notifyCfg.bad = !!v('ntBad')?.checked; notifyCfg.news = !!v('ntNews')?.checked; notifyCfg.ask = !!v('ntAsk')?.checked; notifyCfg.digest = !!v('ntDigest')?.checked;
  notifyCfg.maxDay = +(v('ntMax')?.value || 5); notifyCfg.quietFrom = +(v('ntQf')?.value ?? 22); notifyCfg.quietTo = +(v('ntQt')?.value ?? 8);
  if (v('ntEmail')) notifyCfg.email = v('ntEmail').value.trim().slice(0, 120);
  if (v('ntToken')) notifyCfg.token = v('ntToken').value.trim().slice(0, 120);
  saveNotify();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-nt]'); if (!b) return;
  if (b.dataset.nt === 'new') { $('#ntTopic').value = newTopic(); return; }
  readNotifyForm();
  if (b.dataset.nt === 'save') { toast(notifyCfg.topic ? 'Saved. Residents can reach your phone now.' : 'Saved. Messages are off until you add a topic.'); renderNotify(); }
  if (b.dataset.nt === 'test') {
    const p = findMili() || pick(W.people);
    sendPush('news', `Hello from ${ISL.name}!`, `${p ? p.name : 'Someone'}: "Testing, testing. Can you hear us out there?"`, { email: !!(notifyCfg.email && notifyCfg.token) }).then((ok) => { toast(ok ? 'Sent! Check your phone.' : lastNotifyError || "That didn't go through."); renderNotify(); });
  }
});
document.addEventListener('change', (e) => { if (e.target.id === 'awayPace' || e.target.id === 'awayMax') { cfg[e.target.id] = Number(e.target.value); savePrefs(); toast('Saved.'); } });

