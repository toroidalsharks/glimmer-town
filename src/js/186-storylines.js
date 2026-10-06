// ============================================================
// STORYLINES: a resident's own little saga, told over a few real hours
// ============================================================
// Now and then the model gives one resident a storyline drawn from their life: a secret
// project, a rivalry, a comeback, a mystery they're chasing. It plays out in 3 to 5 scenes,
// each written fresh from what is going on at that moment, with the people around them
// reacting. The last scene resolves it, and everyone involved remembers it.
// W.arcs = [{ id, pid, title, premise, beats: [{ day, text }], total, nextAt, done, outcome }]
let nextArcAt = 0;
const arcBusy = new Set();
const ARC_GAP = [12 * 60e3, 26 * 60e3], ARC_START = [10 * 60e3, 25 * 60e3];
const arcsLive = () => (W.arcs || []).filter((a) => !a.done && person(a.pid));
const arcOf = (p) => arcsLive().find((a) => a.pid === p.id) || null;
function arcFree(p) {
  return p && !p.away && !p.visitor && !p.inside && p.state === 'free' && !p.heldByDlg && stageOf(p) !== 'baby' && stageOf(p) !== 'toddler' && !(typeof jailed === 'function' && jailed(p)) && !p.isClaude && canChat(p);
}
const arcNear = (p) => W.people.filter((q) => q !== p && !q.inside && !q.away && stageOf(q) !== 'baby' && Math.hypot(q.x - p.x, q.z - p.z) < 10).slice(0, 4);
function arcCard(p) {
  return `${voiceCard(p)}
How ${p.name} feels about people: ${Object.values(p.feelings || {}).filter((f) => Math.abs(f.score) >= 3).slice(0, 6).map((f) => `${f.name} ${Math.round(f.score)} ("${String(f.note || '').slice(0, 70)}")`).join('; ') || 'nothing strong yet'}
What ${p.name} carries from the past: ${(p.past || []).slice(0, 5).map((m) => `"${String(m.text).slice(0, 90)}"`).join('; ') || 'not much yet'}
Secret want: ${p.want?.text || 'nothing in particular'}`;
}
async function arcStart(force) {
  const busy = new Set(arcsLive().map((a) => a.pid));
  const pool = W.people.filter((p) => arcFree(p) && !busy.has(p.id) && !(W.arcs || []).some((a) => a.pid === p.id && Date.now() - (a.endedAt || 0) < 3 * 3600e3));
  if (!pool.length) return false;
  const weight = (p) => 1 + (p.past || []).filter((m) => m.weight >= 3).length * 0.4 + Object.values(p.feelings || {}).filter((f) => Math.abs(f.score) >= 5).length * 0.5;
  let r = rand() * pool.reduce((s, p) => s + weight(p), 0), p = pool[0];
  for (const q of pool) { r -= weight(q); if (r <= 0) { p = q; break; } }
  const kid = stageOf(p) !== 'adult';
  const prompt = `You are the storyteller for ${ISL.name}, a tiny island town in a life sim. Give ${p.name} a storyline that grows out of who they are and what has happened to them. It should be the kind of thing the player can't stop checking on: a secret project, a rivalry, a comeback, an obsession, a mystery they're chasing, a big change they're working up to, a grudge, a lie that's getting out of hand. Specific, a little absurd or a little heartbreaking, never generic.
${voiceRules()}
- No romance or flirting in a storyline (love has its own story in the game). No crimes.${kid ? `\n- ${p.name} is a ${stageOf(p)}, so keep it right for their age.` : ''}

${arcCard(p)}
OTHER PEOPLE IN TOWN: ${W.people.filter((q) => q !== p && !q.visitor && !q.away).map((q) => `${q.name}${stageOf(q) !== 'adult' ? ` (${stageOf(q)})` : ''}`).join(', ')}

Reply with only JSON: {"title": "a short storyline title, 2-6 words", "premise": "one or two sentences: what ${p.name} is secretly up to and why", "beats": 3 to 5 (how many scenes it takes)}`;
  voiceToday(); VOICE.calls++; voiceDirty = true;
  let v = null;
  try { v = await llm(prompt, { model: modelOf(p), temperature: 1.05, max: 260 }); } catch (e) { v = null; }
  if (!v || !v.title || !v.premise) return false;
  const arc = { id: uid(), pid: p.id, name: p.name, title: fitLine(String(v.title), 60), premise: fitLine(String(v.premise), 300), beats: [], total: clamp(Math.round(Number(v.beats) || 4), 3, 5), nextAt: Date.now() + 20e3, done: false, startDay: W.day };
  W.arcs = W.arcs || []; W.arcs.push(arc); if (W.arcs.length > 30) W.arcs.splice(0, W.arcs.length - 30);
  diary(`📖 <b>${esc(p.name)}</b> has something going on: <i>${esc(arc.title)}</i>.`);
  remember(p, `I started something: ${arc.premise}`, 3, 'arc');
  if (typeof canNotify === 'function' && canNotify('news', 'arc-' + arc.id)) { logSent('arc-' + arc.id); sendPush('news', `${p.name}: ${arc.title}`, `Something is going on with ${p.name} in ${ISL.name}.`); }
  markDirty();
  return arc;
}
async function arcBeat(arc, force) {
  const p = person(arc.pid); if (!p) { arc.done = true; return false; }
  if (!force && !arcFree(p)) { arc.nextAt = Date.now() + 90e3; return false; }
  const n = arc.beats.length + 1, last = n >= arc.total, kid = stageOf(p) !== 'adult';
  const near = arcNear(p);
  const prompt = `You are the storyteller for ${ISL.name}, a tiny island town in a life sim. ${p.name}'s storyline "${arc.title}" continues.
PREMISE: ${arc.premise}
SO FAR: ${arc.beats.length ? arc.beats.map((b, i) => `${i + 1}. ${b.text}`).join(' ') : 'nothing has happened yet; this is the first scene.'}
${voiceRules()}
- No romance or flirting, no crimes.${kid ? ` ${p.name} is a ${stageOf(p)}; keep it right for their age.` : ''}

${arcCard(p)}${outsideClockContext()}
NEARBY RIGHT NOW: ${near.length ? near.map((q) => `${q.name}${stageOf(q) !== 'adult' ? ` (${stageOf(q)})` : ''}, feels ${Math.round(fscore(q, p))} about ${p.name}`).join('; ') : 'nobody close'}

Write scene ${n} of ${arc.total}${last ? ', the LAST one: resolve it. It can succeed, fail, or twist into something nobody expected, but it has to land' : '. Move it forward and make it escalate or turn'}. Use the people nearby if it helps. Show it, keep it short.
Reply with only JSON: {"say": "what ${p.name} says out loud, 1-2 sentences", "to": "a nearby name or null", "thought": "what ${p.name} privately thinks", "reactions": [{"who": "nearby name", "say": "their reaction"}], "diary": "one or two narrator sentences about what happens in this scene"${last ? ', "outcome": "success, fail or twist", "changed": "one short sentence on how this changed ' + p.name + '"' : ''}}`;
  voiceToday(); VOICE.calls++; voiceDirty = true;
  arc.nextAt = Date.now() + 5 * 60e3;
  p.state = 'talk'; emote(p, '…', 6);
  let v = null;
  try { v = await within(llm(prompt, { model: modelOf(p), temperature: 1.0, max: 420, patience: 25000 }), 30000); } catch (e) { v = null; }
  finally { if (p.state === 'talk' && !p.heldByDlg) p.state = 'free'; }
  if (!v || !v.say || !v.diary) return false;
  const say = fitLine(String(v.say), 200), text = fitLine(String(v.diary), 320);
  const to = near.find((q) => q.name.toLowerCase() === String(v.to || '').toLowerCase()) || null;
  if (to) p.face = Math.atan2(to.x - p.x, to.z - p.z);
  voiceTrust(say); voiceHeard(p, say, 'say');
  bubbleRaw(p, say, 3.4 + say.length / 15); emote(p, last ? '✨' : '📖', 4);
  if (v.thought) p.thought = { text: fitLine(String(v.thought), 200), at: Date.now() };
  arc.beats.push({ day: W.day, text, say });
  diary(`📖 <b>${esc(p.name)}</b> · <i>${esc(arc.title)}</i> (${n}/${arc.total}): ${esc(text)} "${esc(say)}"`);
  remember(p, `${arc.title}: ${text}`, last ? 4 : 3, 'arc', to ? to.name : null);
  if (to) { remember(to, `${p.name}'s "${arc.title}" pulled me in: ${text}`.slice(0, 300), 2, 'arcSaw', p.name); feel(to, p, 0.2, true); }
  sceneReactions(p, v.reactions, near, `(${arc.title})`, say);
  if (last) {
    arc.done = true; arc.endedAt = Date.now(); arc.outcome = ['success', 'fail', 'twist'].includes(String(v.outcome)) ? String(v.outcome) : 'twist';
    if (v.changed) { arc.changed = fitLine(String(v.changed), 200); p.past.push({ day: W.day, text: `${arc.title}: ${arc.changed}`, weight: 4 }); p.past = p.past.sort((x, y) => y.weight - x.weight || y.day - x.day).slice(0, 24); }
    if (arc.outcome === 'success') { addJoy(p, 25); addMood(p, 0.5); } else if (arc.outcome === 'fail') addMood(p, -0.4); else addMood(p, 0.2);
    for (const q of W.people) if (q !== p && !q.away && fscore(q, p) >= 3 && rand() < 0.5) remember(q, `Heard how ${p.name}'s "${arc.title}" ended: ${text}`.slice(0, 300), 2, 'rumor', p.name);
    diary(`📖 <i>${esc(arc.title)}</i> is over. ${arc.outcome === 'success' ? 'It worked.' : arc.outcome === 'fail' ? 'It did not work out.' : 'Nobody saw that coming.'}${arc.changed ? ` ${esc(arc.changed)}` : ''}`);
    if (typeof canNotify === 'function' && canNotify('news', 'arcend-' + arc.id)) { logSent('arcend-' + arc.id); sendPush('news', `${p.name}: ${arc.title} (the end)`, text); }
  } else arc.nextAt = Date.now() + ARC_GAP[0] + rand() * (ARC_GAP[1] - ARC_GAP[0]);
  markDirty();
  return true;
}
function arcTick() {
  if (MODE !== 'host' || !W || W.meeting || (typeof CUT !== 'undefined' && CUT.live) || brainCfg.wild === false || !voiceRoom()) return;
  const t = Date.now();
  if (!nextArcAt) nextArcAt = t + ARC_START[0] + rand() * (ARC_START[1] - ARC_START[0]);
  const due = arcsLive().find((a) => t >= a.nextAt && !arcBusy.has(a.id));
  if (due) { arcBusy.add(due.id); arcBeat(due).finally(() => arcBusy.delete(due.id)); return; }
  if (t >= nextArcAt && arcsLive().length < 2) { nextArcAt = t + ARC_START[0] + rand() * (ARC_START[1] - ARC_START[0]); arcStart(); }
}
// the resident page: what's on their mind, and their storyline so far
function voiceDetailHtml(p) {
  const th = p.thought && Date.now() - p.thought.at < 6 * 3600e3 ? p.thought.text : '';
  const a = arcOf(p) || (W.arcs || []).filter((x) => x.pid === p.id && x.done).slice(-1)[0];
  return `${th ? `<p class="label">On their mind</p><p class="hint" style="font-style:italic">${esc(th)}</p>` : ''}${a ? `<p class="label">${a.done ? 'Their last storyline' : 'Their storyline'}: ${esc(a.title)}</p>${a.beats.length ? a.beats.map((b, i) => `<p class="hint">${i + 1}. ${esc(b.text)}</p>`).join('') : '<p class="hint">Something is starting. Keep an eye on them.</p>'}${a.done && a.changed ? `<p class="hint">${esc(a.changed)}</p>` : ''}` : ''}`;
}
// a Chirp post written by the resident, about whatever is on their mind
async function aiChirp(p) {
  const recent = (W.chirps || []).slice(-6).map((c) => `${c.name}: ${c.text}`).join('\n');
  const prompt = `${voiceCard(p)}
${voiceRules()}
${outsideClockContext()}
${recent ? `\nRECENT POSTS ON CHIRP (the island feed):\n${recent}\n` : ''}
${p.name} opens Chirp and posts something. It could be about their day, a hot opinion, a vague complaint, a brag, a question for the town, a reply to the feed, something oddly specific. Write it exactly the way ${p.name} posts. One post, under 200 characters, no hashtags, no quotation marks.
Reply with only JSON: {"post": "..."}`;
  voiceToday(); VOICE.calls++; voiceDirty = true;
  try { const r = await llm(prompt, { model: modelOf(p), temperature: 1.05, max: 120, fallbackKey: 'post' }); const t = r?.post ? fitLine(String(r.post).replace(/^["']|["']$/g, ''), 220) : ''; if (t) voiceTrust(t); return t; } catch (e) { return ''; }
}
