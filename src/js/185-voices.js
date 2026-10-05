// ============================================================
// VOICES: every scripted line gets rewritten in the speaker's own words, and nothing is said twice
// ============================================================
// Every bubble, text and Chirp post passes through voiceLine(). A line the game wrote from a
// fixed list becomes a "moment" (names, numbers and titles swapped for slots like {A}), and the
// model writes a handful of fresh ways for that resident to say something at that moment.
// Those wait in a small per-resident bank and are used once each. Lines that came from a model
// already pass straight through. Without a key (or while the model is busy) residents pull from
// lines the model wrote earlier for the same moment, or vary the old line with their own habits,
// and they skip anything the town has heard lately.
const VOICE_KEY = `glimmer-voices-${ISLE}`;
const VOICE = (() => {
  const blank = { bank: {}, book: {}, seen: {}, said: [], mine: {}, day: '', calls: 0, wrote: 0, wild: 0 };
  try { return Object.assign(blank, JSON.parse(localStorage.getItem(VOICE_KEY) || '{}')); } catch (e) { return blank; }
})();
const voiceSaid = new Set(VOICE.said);
const voicePass = new Map(); // text prefix -> real time it may pass through bubble() untouched
const voiceQueue = [];
let voiceBusy = 0, voiceNextBatch = 0, voiceDirty = false, nextWildAt = 0;
const VOICE_SAID_MAX = 6000, VOICE_BANK_TTL = 12 * 3600e3, VOICE_BATCH = 6, VOICE_PER = 5;

const voiceOn = () => brainCfg.voices !== false;
const voiceNorm = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}{} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
function voiceHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
const voicePrefix = (s) => voiceNorm(s).slice(0, 26);
function voiceToday() { const d = new Date().toDateString(); if (VOICE.day !== d) { VOICE.day = d; VOICE.calls = 0; VOICE.wrote = 0; VOICE.wild = 0; } }
// residents' own writing share of the daily model budget, so conversations keep theirs
const voiceRoom = () => { voiceToday(); return aiReady() && voiceOn() && VOICE.calls < brainCfg.budget * 0.45 && aiLeft() > Math.max(30, brainCfg.budget * 0.12); };

// anything a model wrote may pass through bubble() as it is
function voiceTrust(text, secs = 900) {
  const k = voicePrefix(text); if (k.length < 12) return;
  voicePass.set(k, Date.now() + secs * 1000);
  if (voicePass.size > 600) { const t = Date.now(); for (const [x, until] of voicePass) if (until < t || voicePass.size > 500) voicePass.delete(x); }
}
function voiceTrustAll(v, depth = 0) {
  if (depth > 5 || v == null) return;
  if (typeof v === 'string') { if (v.length > 1) voiceTrust(v); return; }
  if (Array.isArray(v)) { for (const x of v) voiceTrustAll(x, depth + 1); return; }
  if (typeof v === 'object') for (const x of Object.values(v)) voiceTrustAll(x, depth + 1);
}
const voiceTrusted = (text) => { const u = voicePass.get(voicePrefix(text)); return !!u && u > Date.now(); };

// remember that this was said, by the town and by this person
function voiceHeard(p, text, channel) {
  if (p && p.id && (VOICE.mine[p.id] || []).slice(-1)[0] === String(text).slice(0, 120)) return;
  const n = voiceNorm(text); if (n.length < 2) return;
  const h = voiceHash(n);
  if (!voiceSaid.has(h)) { voiceSaid.add(h); VOICE.said.push(h); if (VOICE.said.length > VOICE_SAID_MAX) { for (const x of VOICE.said.splice(0, 500)) voiceSaid.delete(x); } }
  if (p && p.id) { const m = VOICE.mine[p.id] = VOICE.mine[p.id] || []; m.push(String(text).slice(0, 120)); if (m.length > 24) m.splice(0, m.length - 24); }
  voiceDirty = true;
}
const voiceUsed = (text) => voiceSaid.has(voiceHash(voiceNorm(text)));

// "Did you see Red's 3 cats?" -> "Did you see {A}'s {n1} cats?" with the slots kept aside
const voiceEscRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function voiceSeed(text) {
  let s = String(text); const slots = {}; let q = 0, n = 0, L = 0;
  s = s.replace(/"([^"{}]{2,70})"/g, (m, x) => { const k = `{q${++q}}`; slots[k] = x; return `"${k}"`; });
  const names = [...new Set((W?.people || []).map((p) => p.name).filter((x) => x && x.length > 1))].sort((a, b) => b.length - a.length);
  for (const nm of names) {
    const re = new RegExp(`(^|[^\\p{L}])(${voiceEscRe(nm)})(?![\\p{L}])`, 'giu');
    s = s.replace(re, (m, pre, hit) => { let k = Object.keys(slots).find((x) => /^\{[A-Z]\}$/.test(x) && slots[x].toLowerCase() === hit.toLowerCase()); if (!k) { if (L > 25) return m; k = `{${String.fromCharCode(65 + L++)}}`; slots[k] = hit; } return pre + k; });
  }
  s = s.replace(/\{[^{}]*\}|\d+/g, (m) => { if (m[0] === '{') return m; const k = `{n${++n}}`; slots[k] = m; return k; });
  return { seed: s, slots };
}
function voiceFill(line, slots) {
  let bad = false;
  const out = String(line).replace(/\{([A-Z]|n\d+|q\d+)\}/g, (m) => (m in slots ? slots[m] : ((bad = true), m)));
  return bad || /[{}]/.test(out) ? null : out;
}

// a resident's own little habits, used when no fresh line is ready
const VOICE_TICS = {
  say: { open: ['Honestly, ', 'Okay, ', 'Ugh, ', 'Oh! ', 'Hm. ', 'Listen, ', "Y'know what? ", 'Heh. ', 'Wait. ', 'So, ', 'Ooh, ', 'Look, ', 'Huh. ', 'Well, ', 'Mm. ', 'Psst. '],
    close: [' Anyway.', ' Right?', ' …I think.', ' Ha.', ' Seriously.', ' Just saying.', ' Don’t quote me.', ' Wild.', ' Classic.', ' Hmph.', ' Heh.', ' Ugh.', ' Love that.', ' Typical.', ' Whatever.', ' …Yeah.'] },
  text: { open: ['ok ', 'lol ', 'ngl ', 'wait ', 'omg ', 'ok so ', 'bro ', 'hm ', 'ugh ', 'lowkey '], close: [' lol', ' tbh', ' 😭', ' !!', ' fr', ' 💀', ' ok', ' anyway', ' 🙃', ' haha', ' …', ' ✨'] },
};
function voiceTics(p, channel) {
  const T = VOICE_TICS[channel === 'say' ? 'say' : 'text'], id = String(p?.id || 'x');
  const take = (arr, k) => { const out = []; for (let i = 0; out.length < 3 && i < 12; i++) { const x = arr[parseInt(voiceHash(id + k + i), 36) % arr.length]; if (!out.includes(x)) out.push(x); } return out; };
  return { open: take(T.open, 'o'), close: take(T.close, 'c') };
}
function voiceVary(p, text, channel) {
  const st = p ? stageOf(p) : 'adult';
  if (st === 'baby' || st === 'toddler' || String(text).length < 3) return text;
  const T = voiceTics(p, channel), base = String(text).trim();
  const join = (o, s) => (channel !== 'say' ? o + s.toLowerCase() : /[.!?] $/.test(o) ? o + s : o + s.charAt(0).toLowerCase() + s.slice(1));
  const end = (s) => (/[.!?…]$/.test(s) ? s : s + (channel === 'say' ? '.' : ''));
  const c = [base];
  for (const o of T.open) c.push(join(o, base));
  for (const e of T.close) c.push(end(base) + e);
  for (const o of T.open.slice(0, 2)) for (const e of T.close.slice(0, 2)) c.push(join(o, end(base)) + e);
  const fresh = c.filter((x) => !voiceUsed(x));
  return pick(fresh.length ? fresh : c);
}

// Does this line need rewriting? Model lines, the player's own words and signature lines don't.
function voiceSkip(p, text) {
  const t = String(text || '').trim();
  if (!t || t === '…' || t.length < 2 || /^[\p{P}\p{S}\s]+$/u.test(t)) return true;
  if (voiceTrusted(t)) return true;
  if (p?.lines?.includes(t)) return true;
  if (p?.lovesMili && /love you/i.test(t)) return true;
  return false;
}

// The one door: give back what this resident actually says. channel: 'say' | 'text' | 'post'
function voiceLine(p, text, channel = 'say', opts = {}) {
  if (text == null) return text;
  text = String(text);
  if (MODE !== 'host' || !W || !p || voiceSkip(p, text)) { if (MODE === 'host' && W && text.length > 1 && text !== '…') voiceHeard(p, text, channel); return text; }
  const { seed, slots } = voiceSeed(text);
  const key = channel + ':' + voiceHash(voiceNorm(seed));
  const seen = VOICE.seen[key] = (VOICE.seen[key] || 0) + 1;
  let out = null;
  const okLine = (l) => { const f = voiceFill(l, slots); return f && !voiceUsed(f) && (!opts.safe || opts.safe(f)) ? f : null; };
  // 1. this resident's own fresh lines for this moment
  const mine = VOICE.bank[p.id]?.[key];
  if (mine) {
    while (mine.length && !out) { const l = mine.shift(); if (Date.now() - l.at < VOICE_BANK_TTL) out = okLine(l.t); }
    if (mine.length < 2) voiceWant(p, key, seed, slots, channel, text, opts);
    if (!mine.length) delete VOICE.bank[p.id][key];
  } else if (seen >= 2 || opts.eager) voiceWant(p, key, seed, slots, channel, text, opts);
  // 2. something the model once wrote for this moment for someone else, if nobody has said it
  if (!out && seen >= 2) {
    const book = VOICE.book[key] || [];
    const own = new Set((W.people || []).filter((q) => q !== p).map((q) => q.name.toLowerCase()));
    const cand = book.filter((l) => l.by !== p.id && voiceFill(l.t, slots) && !voiceUsed(voiceFill(l.t, slots)) && ![...own].some((n) => n.length > 2 && voiceFill(l.t, slots).toLowerCase().includes(n) && !Object.values(slots).some((v) => v.toLowerCase() === n)) && (!opts.safe || opts.safe(voiceFill(l.t, slots))));
    if (cand.length) out = voiceFill(pick(cand).t, slots);
  }
  // 3. the old line, said their own way
  if (!out) out = seen >= 2 || voiceUsed(text) ? voiceVary(p, text, channel) : text;
  if (opts.safe && !opts.safe(out)) out = text;
  voiceHeard(p, out, channel);
  return out;
}

// ---------- asking the model for fresh lines, a few residents at a time ----------
function voiceWant(p, key, seed, slots, channel, example, opts) {
  if (!voiceOn() || !brainCfg.key || opts.noAI) return;
  if (voiceQueue.some((r) => r.pid === p.id && r.key === key)) return;
  voiceQueue.push({ pid: p.id, key, seed, slotNames: Object.fromEntries(Object.entries(slots).map(([k, v]) => [k, v])), channel, example, at: Date.now(), safe: opts.safe || null, about: opts.about || '' });
  if (voiceQueue.length > 40) voiceQueue.splice(0, voiceQueue.length - 40);
}
function voiceCard(p) {
  const mem = [...(p.today || [])].slice(-4).map((m) => m.text).filter(Boolean).map((t) => `"${String(t).slice(0, 110)}"`).join('; ');
  const ptn = p.partner && person(p.partner);
  const mood = (p.mood || 0) > 0.35 ? 'in a good mood' : (p.mood || 0) < -0.35 ? 'in a bad mood' : 'in an ordinary mood';
  const said = (VOICE.mine[p.id] || []).slice(-8).map((s) => `"${s}"`).join(' ');
  return `${p.name}${ageNote(p) ? ` (${stageOf(p)})` : ''}: ${String(p.selfNote || '').slice(0, 220)}${p.style ? ` Talks: ${String(styleOf(p)).slice(0, 200)}.` : ''}${p.interests ? ` Into: ${String(p.interests).slice(0, 120)}.` : ''}${p.job && JOBS[p.job] ? ` Works as a ${JOBS[p.job].short}.` : ''}${ptn ? ` ${p.married ? 'Married to' : 'Dating'} ${ptn.name}.` : ''} Right now ${mood}, ${typeof doing === 'function' ? doing(p) : 'out and about'}${TOWN[p.at]?.name ? ` near ${TOWN[p.at].name}` : ''}.${ageNote(p)}${mem ? ` Lately: ${mem}.` : ''}${said ? ` Already said lately (never repeat or echo these): ${said}` : ''}`;
}
const VOICE_RULES = `Rules that always hold:
- Mili, Red, Tim and anyone the player invited are real people. Treat them warmly and with respect: they never cheat, never commit crimes, are never mocked for who they are, and are never the target of a freeze-out.
- Babies and toddlers can't really talk. Kids and teens are never romantic or flirty, never work, and stay away from adult topics.
- Nobody is ever cheating on a partner. Health conditions are never a joke and never linked to crime.
- Never claim facts about crimes or court cases (who did it, clues, times, evidence). Feelings about them are fine.
- No slurs, nothing sexual. Swearing only mild, and only if it suits the person.`;
async function voiceBatch() {
  const now0 = Date.now();
  if (voiceBusy || now0 < voiceNextBatch || !voiceQueue.length || !voiceRoom()) return;
  const oldest = Math.min(...voiceQueue.map((r) => r.at));
  if (voiceQueue.length < 3 && now0 - oldest < 9000) return;
  const jobs = voiceQueue.splice(0, VOICE_BATCH).filter((r) => person(r.pid));
  if (!jobs.length) return;
  voiceBusy++; voiceNextBatch = now0 + 12000; VOICE.calls++;
  const where = `${ISL.name}, ${seasonOf().name.toLowerCase()}, ${W.weather} weather, ${isNight() ? 'night' : W.t < 0.2 ? 'morning' : W.t < 0.45 ? 'midday' : 'evening'}`;
  const items = jobs.map((r, i) => {
    const p = person(r.pid), book = (VOICE.book[r.key] || []).slice(-6).map((l) => `"${l.t}"`).join(' ');
    const slots = Object.entries(r.slotNames).map(([k, v]) => `${k} = ${v}`).join(', ');
    const how = r.channel === 'text' ? 'a text message on their phone (texting style, short)' : r.channel === 'post' ? 'a public post on Chirp, the island social feed (short)' : 'something said out loud (short, under 18 words)';
    return `#${i + 1}
WHO: ${voiceCard(p)}
THE MOMENT: the game's old script had them say "${r.seed}" here.${r.about ? ` ${r.about}` : ''} That shows what is going on. Write ${VOICE_PER} NEW, different things ${p.name} might say instead, as ${how}.
${slots ? `SLOTS: ${slots}. Write a slot exactly like {A} when you mention it; the game fills it in. Never make up other {…}.\n` : ''}${book ? `ALREADY USED FOR THIS MOMENT (don't reuse): ${book}\n` : ''}`;
  }).join('\n');
  const prompt = `You write lines for the residents of ${where}. They are small, vivid, strange, funny, petty, tender people. Each one sounds only like themself.
${VOICE_RULES}

For each numbered item, write ${VOICE_PER} lines. Make them really different from each other: different moods, angles and lengths. Some should be surprising, oddly specific, or reveal something about the person. Use what they have going on lately. Don't start them all the same way, don't explain, no stage directions, no quotation marks, no hashtags.

${items}
Reply with only JSON: {"lines": {"1": ["...", "..."], "2": [...]}}`;
  try {
    const r = await llm(prompt, { model: modelOf(person(jobs[0].pid)), temperature: 1.05, max: 220 * jobs.length });
    const L = r?.lines || r || {};
    jobs.forEach((job, i) => {
      const got = (Array.isArray(L) ? L[i] : L[String(i + 1)] || L[i + 1]) || [];
      const p = person(job.pid); if (!p || !Array.isArray(got)) return;
      const clean = got.map((t) => fitLine(String(t || '').replace(/^["'\s]+|["'\s]+$/g, ''), job.channel === 'say' ? 150 : 200)).filter((t) => t.length > 1 && !/\{(?![A-Z]\}|n\d+\}|q\d+\})/.test(t) && voiceFill(t, job.slotNames) && !voiceUsed(voiceFill(t, job.slotNames)) && (!job.safe || job.safe(voiceFill(t, job.slotNames))));
      if (!clean.length) return;
      const B = VOICE.bank[p.id] = VOICE.bank[p.id] || {};
      B[job.key] = [...(B[job.key] || []), ...clean.map((t) => ({ t, at: Date.now() }))].slice(-8);
      const bk = VOICE.book[job.key] = VOICE.book[job.key] || [];
      for (const t of clean) bk.push({ t, by: p.id });
      if (bk.length > 14) bk.splice(0, bk.length - 14);
      VOICE.wrote += clean.length;
    });
    voicePrune(); voiceDirty = true;
  } catch (e) { voiceNextBatch = Date.now() + 45000; }
  finally { voiceBusy = Math.max(0, voiceBusy - 1); }
}
function voicePrune() {
  const t = Date.now(); let total = 0;
  for (const [pid, B] of Object.entries(VOICE.bank)) {
    if (!person(pid)) { delete VOICE.bank[pid]; continue; }
    for (const [k, L] of Object.entries(B)) { const keep = L.filter((l) => t - l.at < VOICE_BANK_TTL); if (keep.length) { B[k] = keep; total += keep.length; } else delete B[k]; }
  }
  if (total > 1600) for (const B of Object.values(VOICE.bank)) for (const k of Object.keys(B)) { B[k] = B[k].slice(-3); }
  const books = Object.keys(VOICE.book);
  if (books.length > 340) for (const k of books.slice(0, books.length - 300)) delete VOICE.book[k];
  const seen = Object.entries(VOICE.seen);
  if (seen.length > 4000) VOICE.seen = Object.fromEntries(seen.sort((a, b) => b[1] - a[1]).slice(0, 3000));
}
function voiceSave() {
  if (!voiceDirty) return; voiceDirty = false;
  try { localStorage.setItem(VOICE_KEY, JSON.stringify(VOICE)); }
  catch (e) { VOICE.book = {}; VOICE.said = VOICE.said.slice(-2000); try { localStorage.setItem(VOICE_KEY, JSON.stringify(VOICE)); } catch (x) {} }
}
setInterval(voiceSave, 20000);

// a little extra push for live model conversations, so two chats never go the same way
const VOICE_SPARKS = [
  'Bring up something oddly specific from your own life.', 'Be a little more blunt than usual.', 'Ask them a real question you actually want answered.',
  'Admit something small and a bit embarrassing.', 'Have a strong opinion about something trivial.', 'Get distracted by something nearby for a second.',
  'Make a joke only you would find funny.', 'Change the subject to what has been on your mind.', 'Say the thing you would normally keep to yourself (nothing cruel).',
  'Mention a plan or scheme you have.', 'Be warmer than they expect.', 'Complain about something small with real passion.', 'Use a phrase you have never used before.',
  'Remember something they did once and bring it up.', 'Be a little dramatic.', 'Tell a tiny lie about something unimportant, if that suits you.',
];
function voiceSpark(me) {
  const said = (VOICE.mine[me.id] || []).slice(-10);
  return `${said.length ? `\nTHINGS YOU SAID LATELY (never repeat these or reuse their wording): ${said.map((s) => `"${s}"`).join(' ')}` : ''}${rand() < 0.6 ? `\nTHIS TIME: ${pick(VOICE_SPARKS)}` : ''}`;
}

// ---------- surprises: now and then someone does something nobody saw coming ----------
const WILD_MOVES = {
  announce: { kid: true, what: 'makes a sudden announcement to everyone nearby about something they have decided' },
  confess: { kid: true, what: 'tells someone nearby a secret about themselves (a fear, a guilty pleasure, a regret, a weird habit), never anything romantic' },
  outburst: { kid: false, what: 'finally loses it about something that has been building up (at a situation, or at someone nearby)' },
  hype: { kid: true, what: 'showers someone nearby with over-the-top, sincere praise out of nowhere' },
  hot_take: { kid: false, what: 'posts a spicy opinion on Chirp, the island feed' },
  obsession: { kid: true, what: 'gets suddenly, deeply obsessed with a new hobby or interest' },
  song: { kid: true, what: 'breaks into a made-up song about their life right now' },
  dare: { kid: true, what: 'dares someone nearby to do something silly and harmless' },
  vow: { kid: true, what: 'makes a big public vow to change something about their own life' },
  gift: { kid: true, what: 'gives someone nearby a coin, out of nowhere, with a reason' },
};
function wildCandidates() {
  return W.people.filter((p) => !p.away && !p.visitor && !p.inside && p.state === 'free' && !p.heldByDlg && stageOf(p) !== 'baby' && stageOf(p) !== 'toddler' && !(typeof jailed === 'function' && jailed(p)) && !p.isClaude && canChat(p));
}
async function wildMoment(force) {
  if (MODE !== 'host' || W.meeting || (typeof CUT !== 'undefined' && CUT.live)) return false;
  if (!force && (!voiceRoom() || brainCfg.wild === false)) return false;
  const pool = wildCandidates(); if (!pool.length) return false;
  const weight = (p) => 1 + (p.today || []).filter((m) => m.weight >= 2).length + Object.values(p.feelings || {}).filter((f) => Math.abs(f.score) >= 5).length * 0.5;
  let r = rand() * pool.reduce((s, p) => s + weight(p), 0), p = pool[0];
  for (const q of pool) { r -= weight(q); if (r <= 0) { p = q; break; } }
  const kid = stageOf(p) !== 'adult';
  const near = W.people.filter((q) => q !== p && !q.inside && !q.away && stageOf(q) !== 'baby' && Math.hypot(q.x - p.x, q.z - p.z) < 10).slice(0, 4);
  const moves = Object.entries(WILD_MOVES).filter(([k, m]) => (!kid || m.kid) && (near.length || !['confess', 'hype', 'dare', 'gift'].includes(k)));
  const recent = (W.records || []).slice(-3).map((e) => (typeof townRecordText === 'function' ? townRecordText(e) : e.text)).filter(Boolean).join(' | ');
  const prompt = `Something surprising is about to happen in ${ISL.name}, a tiny island town in a life sim. ${p.name} is about to do something nobody saw coming, but that makes total sense for who they are and what they've been through.
${VOICE_RULES}
- Nothing romantic or flirty here; love has its own story in the game.

${voiceCard(p)}
How ${p.name} feels about people: ${Object.values(p.feelings || {}).filter((f) => Math.abs(f.score) >= 3).slice(0, 6).map((f) => `${f.name} ${Math.round(f.score)} ("${String(f.note || '').slice(0, 70)}")`).join('; ') || 'nothing strong yet'}
NEARBY: ${near.length ? near.map((q) => `${q.name}${ageNote(q) ? ` (${stageOf(q)})` : ''}, ${q.name} feels ${Math.round(fscore(q, p))} about ${p.name}`).join('; ') : 'nobody close'}
${recent ? `IN TOWN LATELY: ${recent}\n` : ''}${(VOICE.mine[p.id] || []).length ? `${p.name} said lately (don't repeat): ${(VOICE.mine[p.id] || []).slice(-6).map((s) => `"${s}"`).join(' ')}\n` : ''}
Pick ONE move: ${moves.map(([k, m]) => `${k} (${m.what})`).join('; ')}.
Make it vivid, specific and a little shocking, the kind of thing people talk about later. Then write how up to ${Math.min(3, near.length)} of the nearby people react, each in their own voice.
Reply with only JSON: {"move": "...", "say": "what ${p.name} says out loud, 1-2 sentences", "to": "name of the nearby person it is aimed at, or null", "post": "the Chirp post, only for hot_take", "obsession": "the new interest in 2-5 words, only for obsession", "thought": "what ${p.name} privately thinks", "reactions": [{"who": "name", "say": "their reaction out loud"}], "diary": "one short narrator sentence about what happened"}`;
  voiceToday(); VOICE.calls++; VOICE.wild++; voiceDirty = true;
  p.state = 'talk'; emote(p, '…', 6);
  let v = null;
  try { v = await llm(prompt, { model: modelOf(p), temperature: 1.05, max: 380 }); } catch (e) { v = null; }
  finally { if (p.state === 'talk' && !p.heldByDlg) p.state = 'free'; }
  if (!v || !v.say || !WILD_MOVES[v.move] || (kid && !WILD_MOVES[v.move].kid)) return false;
  return wildPlay(p, v, near);
}
function wildPlay(p, v, near) {
  const say = fitLine(String(v.say), 200), move = v.move;
  let to = near.find((q) => q.name.toLowerCase() === String(v.to || '').toLowerCase()) || null;
  if (to && move === 'outburst' && (isRealish(to) || stageOf(to) !== 'adult')) to = null;
  if (to) p.face = Math.atan2(to.x - p.x, to.z - p.z);
  voiceTrust(say); voiceHeard(p, say, 'say');
  bubbleRaw(p, say, 3.4 + say.length / 15);
  emote(p, { announce: '📣', confess: '🤫', outburst: '💢', hype: '🌟', hot_take: '🔥', obsession: '🤩', song: '🎵', dare: '😈', vow: '✊', gift: '✦' }[move] || '⚡', 4);
  const what = { announce: 'made an announcement', confess: `told ${to ? to.name : 'everyone'} a secret`, outburst: `blew up${to ? ` at ${to.name}` : ''}`, hype: `hyped up ${to ? to.name : 'everyone'}`, hot_take: 'posted a hot take', obsession: 'found a new obsession', song: 'broke into song', dare: `dared ${to ? to.name : 'someone'}`, vow: 'made a vow', gift: `gave ${to ? to.name : 'someone'} a coin` }[move];
  diary(`⚡ <b>${esc(p.name)}</b> ${esc(what)}: "${esc(say)}"${v.thought ? ` <span class="th">thinks: ${esc(String(v.thought).slice(0, 200))}</span>` : ''}`);
  remember(p, `I ${what}: "${say}"`, 3, 'wild', to ? to.name : null);
  if (move === 'outburst') { addMood(p, 0.3); if (to) { feel(to, p, -1); remember(to, `${p.name} blew up at me out of nowhere: "${say}"`, 3, 'gotMean', p.name); } }
  if (move === 'confess' && to) { feel(to, p, 1, true); feel(p, to, 0.5, true); remember(to, `${p.name} told me a secret: "${say}"`, 3, 'confidedIn', p.name); }
  if (move === 'hype' && to) { feel(to, p, 1.5); addJoy(to, 8); remember(to, `${p.name} hyped me up out of nowhere: "${say}"`, 2, 'gotKind', p.name); }
  if (move === 'gift' && to) applyAction(p, to, 'give_coin');
  if (move === 'obsession' && v.obsession) { const o = fitLine(String(v.obsession), 40); p.interests = [o, ...String(p.interests || '').split(/,\s*/).filter(Boolean)].slice(0, 5).join(', '); }
  if (move === 'vow') p.want = { text: fitLine(say, 140) };
  if (move === 'song') { emote(p, '🎵', 6); addJoy(p, 6); }
  if (move === 'hot_take' && v.post && typeof postChirp === 'function') { voiceTrust(String(v.post)); postChirp(p, fitLine(String(v.post), 220)); }
  const reacts = Array.isArray(v.reactions) ? v.reactions.slice(0, 3) : [];
  reacts.forEach((x, i) => {
    const q = near.find((n) => n.name.toLowerCase() === String(x?.who || '').toLowerCase()); if (!q || !x.say) return;
    const line = fitLine(String(x.say), 160); voiceTrust(line);
    setTimeout(() => { if (q.inside || q.away) return; q.face = Math.atan2(p.x - q.x, p.z - q.z); bubbleRaw(q, line, 2.8 + line.length / 15); voiceHeard(q, line, 'say'); emote(q, '👀', 2.4); diary(`<b>${esc(q.name)}</b>: "${esc(line)}"`); remember(q, `${p.name} ${what}: "${say.slice(0, 90)}". I said: "${line.slice(0, 90)}"`, 2, 'wildSaw', p.name); }, 2600 + i * 2300 + say.length * 30);
  });
  if (v.diary) diary(`<i>${esc(fitLine(String(v.diary), 220))}</i>`);
  markDirty();
  return true;
}

function voiceTick() {
  if (MODE !== 'host' || !W) return;
  voiceBatch();
  if (!nextWildAt) nextWildAt = now + 120 + rand() * 120;
  if (now >= nextWildAt) { nextWildAt = now + 240 + rand() * 300; if (rand() < 0.8) wildMoment(false); }
}
function voicesBoot() {
  W.added = W.added || {}; if (W.added.voices1) return; W.added.voices1 = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'Residents stopped reading from a script. With a key in Settings, the model now writes their everyday lines too (shopping, work, texts, Chirp posts, babysitting, everything), in their own voice, using what they have been up to. Each line is used once, and the town remembers what it has heard so nobody repeats themselves. Every few minutes someone also does something nobody saw coming: a confession, an outburst, a song, a vow, a hot take, a new obsession, and whoever is nearby reacts. Without a key they still mix up how they say things.', 'Residents speak for themselves');
}
function voiceStatus() {
  voiceToday();
  const waiting = Object.values(VOICE.bank).reduce((s, B) => s + Object.values(B).reduce((t, L) => t + L.length, 0), 0);
  if (!brainCfg.key) return 'Without a key, residents mix up how they say their old lines and skip what the town heard lately.';
  if (brainCfg.voices === false) return 'Residents use the game’s own lines when they are not in a full conversation.';
  return `Today the model wrote ${VOICE.wrote} fresh lines in ${VOICE.calls} calls${VOICE.wild ? `, with ${plural(VOICE.wild, 'surprise')}` : ''}. ${plural(waiting, 'line')} waiting to be said. This uses up to about half of the daily call limit above.`;
}
document.addEventListener('change', (e) => {
  if (e.target.id === 'voicesOn' || e.target.id === 'wildOn') {
    brainCfg[e.target.id === 'voicesOn' ? 'voices' : 'wild'] = e.target.checked; saveBrain();
    if (e.target.id === 'voicesOn' && !e.target.checked) voiceQueue.length = 0;
  }
});
