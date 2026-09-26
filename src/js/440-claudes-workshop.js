// ============================================================
// CLAUDE'S WORKSHOP: an in-game editor that adds new content (as safe data, never code)
// ============================================================
const hexOk = (c) => /^#[0-9a-f]{6}$/i.test(String(c || ''));
const slug = (s) => 'm_' + String(s || 'thing').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
const strc = (s, n) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, n);
const numc = (v, a, b, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d; };
const SHAPES = ['box', 'cyl', 'sph', 'cone'];
function cleanParts(parts, lim) {
  if (!Array.isArray(parts)) return null;
  const out = [];
  for (const p of parts.slice(0, 14)) {
    if (!p || !SHAPES.includes(p.shape)) continue;
    const size = (Array.isArray(p.size) ? p.size : [p.size, p.size, p.size]).slice(0, 3).map((v) => numc(v, 0.03, lim, 0.3));
    while (size.length < 3) size.push(size[0] || 0.3);
    const pos = (Array.isArray(p.pos) ? p.pos : [0, 0, 0]).slice(0, 3).map((v, i) => numc(v, i === 1 ? 0 : -lim, i === 1 ? lim * 2 : lim, 0));
    while (pos.length < 3) pos.push(0);
    out.push({ shape: p.shape, size, pos, color: hexOk(p.color) ? p.color : '#c9b3ff', glow: !!p.glow });
  }
  return out.length ? out : null;
}
function partsMesh(parts) {
  const g = new T3.Group();
  for (const p of parts || []) {
    const [a, b, c] = p.size, geo = p.shape === 'box' ? box(a, b, c) : p.shape === 'cyl' ? cyl(a, a, b, 14) : p.shape === 'cone' ? new T3.ConeGeometry(a, b, 14) : sph(a, 14, 10);
    const m = mesh(geo, toon(p.color, p.glow ? { emissive: new T3.Color(p.color).multiplyScalar(0.5) } : undefined), p.pos[0], p.pos[1] + (p.shape === 'sph' ? a : b / 2), p.pos[2]);
    g.add(m);
  }
  return g;
}
function applyMods() {
  const M = W.mods; if (!M) return;
  for (const [id, b] of Object.entries(M.books || {})) if (SUBJECTS[b.subj]) BOOKS[id] = b;
  for (const f of M.foods || []) if (!FOODS.some((x) => x.id === f.id)) FOODS.push(f);
  for (const [id, d] of Object.entries(M.decor || {})) { DECOR[id] = d; }
  for (const [id, b] of Object.entries(M.builds || {})) BUILDS[id] = b;
  for (const [id, e] of Object.entries(M.events || {})) EVENTS[id] = e;
  for (const t of M.debates || []) if (!DEBATES.includes(t)) DEBATES.push(t);
}
function acceptMods(r) {
  W.mods = W.mods || { books: {}, foods: [], decor: {}, builds: {}, events: {}, debates: [] };
  const M = W.mods, added = [];
  for (const b of (r.books || []).slice(0, 3)) {
    const subj = SUBJECTS[b.subject] ? b.subject : Object.keys(SUBJECTS).find((k) => SUBJECTS[k].name.toLowerCase() === String(b.subject || '').toLowerCase());
    const facts = (b.facts || []).map((f) => strc(f, 180)).filter((f) => f.length > 8).slice(0, 5);
    if (!subj || facts.length < 2 || !b.title) continue;
    const id = slug(b.title); if (BOOKS[id]) continue;
    M.books[id] = { subj, title: strc(b.title, 60), by: strc(b.author || 'Anonymous', 40), price: Math.round(numc(b.price, 3, 12, 6)), facts, fiction: !!b.fiction, mod: true };
    added.push(`the book "${M.books[id].title}"`);
    if (W.stock.books) W.stock.books.push(newItem('book', id, null, null, 1));
  }
  for (const f of (r.foods || []).slice(0, 2)) {
    const shop = ['mart', 'cafe', 'bakery', 'icecream'].includes(f.shop) ? f.shop : 'mart', id = slug(f.name);
    if (!f.name || FOODS.some((x) => x.id === id)) continue;
    const fl = { sweet: numc(f.sweet, 0, 1, 0.3), salty: numc(f.salty, 0, 1, 0.3), spicy: numc(f.spicy, 0, 1, 0) }; if (fl.sweet + fl.salty + fl.spicy < 0.1) fl.salty = 0.3;
    const food = { id, shop, name: strc(f.name, 30).toLowerCase(), price: Math.round(numc(f.price, 1, 8, 3)), fill: numc(f.fill, 0.1, 0.6, 0.35), fl, color: hexOk(f.color) ? f.color : '#ffb38a', parts: cleanParts(f.parts, 0.4), mod: true };
    M.foods.push(food); FOODS.push(food); added.push(`${food.name} at ${SHOPS[shop].name}`);
  }
  for (const d of (r.decor || []).slice(0, 2)) {
    const id = slug(d.name), parts = cleanParts(d.parts, 1.2);
    if (!d.name || DECOR[id] || !parts) continue;
    M.decor[id] = { name: strc(d.name, 30).toLowerCase(), price: Math.round(numc(d.price, 2, 20, 6)), parts, mod: true };
    DECOR[id] = M.decor[id]; added.push(`a new decoration: ${M.decor[id].name}`);
    if (W.stock.nook) W.stock.nook.push(newItem('decor', id, pick(Object.keys(COLORS)), null, 2));
  }
  for (const b of (r.builds || []).slice(0, 1)) {
    const id = slug(b.name), parts = cleanParts(b.parts, 3);
    if (!b.name || BUILDS[id] || !parts) continue;
    M.builds[id] = { name: strc(b.name, 30).toLowerCase(), price: Math.round(numc(b.price, 8, 120, 25)), parts, mod: true };
    BUILDS[id] = M.builds[id]; added.push(`something new to build: ${M.builds[id].name}`);
  }
  for (const e of (r.events || []).slice(0, 1)) {
    const id = slug(e.name), place = ['plaza', 'park', 'garden', 'pier', 'cafe', 'beach'].includes(e.place) ? e.place : 'plaza';
    if (!e.name || EVENTS[id]) continue;
    const t0 = numc(e.start_hour, 9, 18, 14) / 24 - 0.25;
    const hr = Math.floor(numc(e.start_hour, 9, 18, 14));
    M.events[id] = { name: strc(e.name, 50), place, t0, t1: t0 + 0.07, at: `${((hr + 11) % 12) + 1}:00 ${hr < 12 ? 'am' : 'pm'}`, mod: true };
    EVENTS[id] = M.events[id]; added.push(`a new town event idea: ${M.events[id].name}`);
  }
  for (const t of (r.debates || []).slice(0, 2)) { const q = strc(t, 90); if (q.length > 8 && !DEBATES.includes(q)) { M.debates.push(q); DEBATES.push(q); added.push(`a debate topic: "${q}"`); } }
  return added;
}
let agentBusy = false;
function agentState(request) {
  const ppl = W.people.slice(0, 16).map((p) => `${p.name} (${p.job ? JOBS[p.job]?.short : 'kid'}; into: ${strc(p.interests || p.selfNote, 80)}${p.cr.wish ? `; wishing for ${wishText(p.cr.wish)}` : ''})`).join('\n');
  return `ISLAND: ${ISL.name}, day ${W.day}, ${seasonOf().name}.
RESIDENTS:\n${ppl}
RECENT DIARY:\n${W.log.slice(-12).map((e) => '- ' + stripHtml(e.text)).join('\n')}
ALREADY EXISTS (don't duplicate): books: ${Object.values(BOOKS).map((b) => b.title).join('; ')}. foods: ${FOODS.map((f) => f.name).join(', ')}. decor: ${Object.values(DECOR).map((d) => d.name).join(', ')}. builds: ${Object.values(BUILDS).map((b) => b.name).join(', ')}. events: ${Object.values(EVENTS).map((e) => e.name).join(', ')}.
BOOK SUBJECTS you can use: ${Object.keys(SUBJECTS).join(', ')}.
${request ? `THE CREATOR ASKED YOU: "${strc(request, 400)}"\nDo what they asked as well as the schema allows. If it isn't possible with these schemas, say so kindly in the notes and add the closest thing you can.` : 'Nobody asked for anything specific. Look at what residents wish for, what they are into, and what happened lately, and add one to three things that would make the island more fun.'}`;
}
async function runAgent(request) {
  if (MODE !== 'host') return 'Claude works from the box. Ask from there.';
  if (!brainCfg.key) return 'Claude needs an OpenRouter key in Settings to work on the island.';
  if (agentBusy) return 'Claude is already working on something.';
  agentBusy = true;
  const prompt = `You are Claude, an AI that maintains Glimmer Town, a cozy island life sim where AI residents live. The Creator (the player) built it with you. You can't edit code here. You add content by returning JSON that the game loads. Keep everything cute, kind, and fitting the island. Book facts must be TRUE, well-known, and simply worded.
${agentState(request)}

SCHEMAS (all optional; use only what fits):
- books: [{"title","author","subject": one of the subjects,"facts": [3-5 true facts as short sentences],"price": 4-10,"fiction": false}]
- foods: [{"name","shop": "mart"|"cafe"|"bakery"|"icecream","price":1-8,"sweet":0-1,"salty":0-1,"spicy":0-1,"fill":0.1-0.6,"color":"#hex","parts": optional 3D parts (small, size under 0.4)}]
- decor: [{"name","price":2-20,"parts": [3D parts for a small room decoration about 1 unit tall]}]
- builds: [{"name","price":8-120,"parts": [3D parts for an outdoor thing up to 3 units wide/tall]}]
- events: [{"name":"a town event","place":"plaza"|"park"|"garden"|"pier"|"cafe"|"beach","start_hour":9-18}]
- debates: ["a fun question residents could argue about"]
3D parts: {"shape":"box"|"cyl"|"sph"|"cone","size":[w,h,d] (cyl/cone/sph use [radius,height]),"pos":[x,y,z] (y is the bottom),"color":"#hex","glow":false}

Reply with only JSON: {"notes": "your patch notes to the Creator, first person, warm, 1-3 sentences", "books": [], "foods": [], "decor": [], "builds": [], "events": [], "debates": []}`;
  try {
    const r = await llm(prompt, { model: brainCfg.workshop || brainCfg.judge, max: 1400, temperature: 0.7 });
    if (!r || typeof r !== 'object') return "Claude couldn't get through today. Try again later.";
    const added = acceptMods(r);
    W.agentRuns = W.agentRuns || [];
    const note = strc(r.notes || (added.length ? 'Added a few things.' : 'Looked around. Nothing to add today.'), 400);
    W.agentRuns.unshift({ day: W.day, at: Date.now(), request: request ? strc(request, 200) : null, notes: note, added });
    W.agentRuns = W.agentRuns.slice(0, 20);
    logUpdate('mod', `${note}${added.length ? ` (New: ${added.join(', ')}.)` : ''}`, added[0] || 'an update');
    for (const q of W.people.filter((q) => !q.away).sort(() => rand() - 0.5).slice(0, 3)) if (added.length) remember(q, `Claude added ${added[0]} to the island.`, 1, 'claudeUpdate');
    importStock(); markDirty();
    return added.length ? `✳ Claude added ${added.join(', ')}.` : `✳ ${note}`;
  } catch (e) { return "Claude couldn't get through. Check the key or the model in Settings."; }
  finally { agentBusy = false; }
}
function agentDaily() {
  if (MODE !== 'host' || !brainCfg.key || agentBusy || cfg.agent === false) return;
  const today = new Date().toDateString();
  if (W.agentDay === today) return;
  if (now - lastTouch < 300 && W.agentDay) return;
  W.agentDay = today;
  runAgent(null).then((msg) => { if (msg) toast(msg); });
}
function workshopAgentHtml() {
  const runs = (W.agentRuns || []).slice(0, 6);
  return `<p class="label">✳ Ask Claude to add something</p>
    <p class="hint">Once a day, while you're away, Claude looks at the island and adds new things: books, foods, decorations, buildable things, events and debate topics. You can also ask for something specific. It uses your OpenRouter key.</p>
    <form data-agentform><textarea id="agentReq" rows="2" maxlength="400" placeholder="e.g. a book about frogs, a matcha donut at the bakery, a lighthouse lamp for my room…" style="width:100%;font:14px var(--body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:8px 10px"></textarea>
    <div class="btns"><button class="btn gold" type="submit">Ask Claude</button></div></form>
    ${MODE === 'host' ? `<div class="field"><label for="agentModel">Claude's model (any OpenRouter model id; a Claude model works great)</label><input id="agentModel" value="${esc(brainCfg.workshop || '')}" placeholder="${esc(brainCfg.judge)}" style="font:13px var(--body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:7px 10px"></div>` : ''}
    ${runs.length ? runs.map((r) => `<p class="note"><span class="chip">day ${r.day}</span> ${r.request ? `<i>You asked: "${esc(r.request)}"</i><br>` : ''}${esc(r.notes)}${r.added.length ? `<br><span class="hint">Added: ${esc(r.added.join(', '))}</span>` : ''}</p>`).join('') : ''}`;
}

