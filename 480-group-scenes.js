// ============================================================
// GROUP SCENES: small huddles, and the occasional uproar where
// the whole town picks a side
// ============================================================
const HEAT_TAGS = { fight: 1, strike: 1.5, lostCase: 0.8, suedBy: 0.8, subtweeted: 0.5, textMean: 0.4, jealousLove: 0.8, breakup: 1, heartbreak: 0.5, meetingShamed: 1, classTalk: 0.3, laptopEnvy: 0.3, miliRumor: 0.4, creatorFight: 0.6, rebel: 0.8, laughedAt: 0.5, gossipLove: 0.4, wasDefended: 0.3, unfair: 0.4 };
const SCENE_ACTS = ['talk', 'shout', 'defend', 'mock', 'plead', 'calm', 'cry', 'laugh', 'storm_off', 'switch', 'shove'];
let sceneBusy = false, sceneRing = null;
function drama() { W.drama = W.drama || { heat: 1, last: -9, count: 0, scenes: [], issues: [], huddleDay: -1, huddles: [] }; return W.drama; }

// what the town is upset about, gathered each night
function dramaNight() {
  const D = drama(); let sum = 0; const found = [];
  for (const p of W.people) for (const m of p.today || []) {
    const v = HEAT_TAGS[m.tag]; if (!v) continue; sum += v;
    const other = m.who && W.people.find((q) => q.name === m.who);
    if ((m.tag === 'fight' || m.tag === 'laughedAt' || m.tag === 'textMean' || m.tag === 'subtweeted') && other) found.push({ kind: 'grudge', a: p.id, b: other.id, w: v, why: m.text });
    else if ((m.tag === 'breakup' || m.tag === 'heartbreak' || m.tag === 'jealousLove') && other) found.push({ kind: 'love', a: p.id, b: other.id, w: v + 0.5, why: m.text });
    else if (m.tag === 'strike' || m.tag === 'classTalk' || m.tag === 'unfair') found.push({ kind: 'class', w: v });
    else if (m.tag === 'laptopEnvy') found.push({ kind: 'laptop', w: v });
    else if (m.tag === 'creatorFight' || m.tag === 'rebel') found.push({ kind: 'creator', w: v });
    else if (m.tag === 'miliRumor') found.push({ kind: 'mili', w: v * 0.6 });
  }
  const pol = (W.outside?.items || []).filter((it) => (it.kind === 'politics' || it.kind === 'news') && W.people.filter((p) => (p.seen || []).some((s) => s.id === it.id) || (p.heard || []).some((s) => s.id === it.id)).length >= 2);
  if (pol.length) found.push({ kind: 'outside', item: pol[0].id, w: 1 + pol.length * 0.3 });
  const merged = {};
  for (const f of [...(D.issues || []).map((x) => ({ ...x, w: x.w * 0.6 })), ...found]) { const k = f.kind + ':' + [f.a, f.b].sort().join('|') + (f.item || ''); if (merged[k]) merged[k].w += f.w; else merged[k] = { ...f }; }
  D.issues = Object.values(merged).filter((x) => x.w >= 0.3).sort((a, b) => b.w - a.w).slice(0, 8);
  D.heat = clamp(D.heat * 0.7 + Math.min(6, sum * 0.45) + ((W.tension || 0) >= 6 ? 1 : 0), 0, 10);
}
function dramaMorning() {
  const D = drama(); D.uproarAt = null; D.huddleAt = [];
  const gap = W.day - D.last;
  if ((D.heat >= 5 && gap >= 3 && rand() < 0.65) || (D.heat >= 2.5 && gap >= 7 && rand() < 0.5)) D.uproarAt = 0.26 + rand() * 0.18;
  D.huddleAt = [0.1 + rand() * 0.2]; if (rand() < 0.5) D.huddleAt.push(0.34 + rand() * 0.16);
}
function dramaTick() {
  if (MODE !== 'host' || sceneBusy || W.meeting || W.t >= 0.55 || interiorBusy()) return;
  const D = drama();
  if (D.uproarAt && W.t >= D.uproarAt) { const ok = startUproar(); D.uproarAt = ok ? null : (W.t < 0.47 ? W.t + 0.04 : null); return; }
  if (D.huddleAt?.length && W.t >= D.huddleAt[0]) { D.huddleAt.shift(); startHuddle(); }
}
function interiorBusy() { return false; }
const sceneFree = (p) => !p.away && !p.inside && p.state === 'free' && !p.heldByDlg && p.grow >= 0.6 && p.task?.kind !== 'away' && !['meeting', 'event', 'court', 'date', 'crowd', 'walkwith', 'hangout', 'doctor', 'therapy', 'rest', 'buylaptop', 'work', 'picket', 'service', 'landmark'].includes(p.task?.kind);

// the issues
function issueFor(src) {
  const A = src.a && person(src.a), B = src.b && person(src.b);
  const lean = (p, a, b) => { const d = fscore(p, a) - fscore(p, b); return p === a ? 'A' : p === b ? 'B' : d >= 1.5 ? 'A' : d <= -1.5 ? 'B' : 'mid'; };
  switch (src.kind) {
    case 'grudge': if (!A || !B) return null; return { kind: 'grudge', label: `${A.name} vs. ${B.name}`, about: `${A.name} and ${B.name} have been at each other's throats lately (${String(src.why || '').slice(0, 120)}). Today it boils over in public, and everyone has an opinion about who is in the wrong.`, A: { name: `Team ${A.name}`, icon: '🔴' }, B: { name: `Team ${B.name}`, icon: '🔵' }, principals: [A, B], side: (p) => lean(p, A, B) };
    case 'love': if (!A || !B) return null; return { kind: 'love', label: `${A.name} & ${B.name}`, about: `The drama between ${A.name} and ${B.name} (${String(src.why || '').slice(0, 120)}) spills out in public, and their friends pick sides.`, A: { name: `Team ${A.name}`, icon: '💔' }, B: { name: `Team ${B.name}`, icon: '💢' }, principals: [A, B], side: (p) => lean(p, A, B) };
    case 'class': { const white = W.people.filter((p) => collarOf(p) === 'white'), rest = W.people.filter((p) => collarOf(p) && collarOf(p) !== 'white'); if (!white.length || !rest.length) return null; const a = [...rest].sort((x, y) => x.coins - y.coins)[0], b = [...white].sort((x, y) => y.coins - x.coins)[0]; return { kind: 'class', label: 'Fair pay', about: `The pay gap on the island: office workers (Glimmer Labs, Glimmer Hall, the clinic) earn a lot more than everyone who works with their hands or serves the town. Class tension is ${Math.round(W.tension || 0)}/10.${W.wageDeal ? ' There is already a fair pay deal, and some office workers resent it.' : ''}`, A: { name: 'Fair pay', icon: '✊' }, B: { name: 'Office workers', icon: '💼' }, principals: [a, b], side: (p) => (collarOf(p) === 'white' ? (fscore(p, a) >= 5 ? 'mid' : 'B') : !p.job ? 'mid' : fscore(p, b) >= 5 ? 'mid' : 'A') }; }
    case 'laptop': { const own = W.people.filter(hasLaptop), not = W.people.filter((p) => !hasLaptop(p) && p.grow >= 1); if (!own.length || !not.length) return null; const a = not.find((p) => p.saving) || not[0], b = own[0]; return { kind: 'laptop', label: 'Laptops', about: `Some people on the island have laptops and read the Outside all day. Everyone else only hears about it secondhand, and they're sick of it. Laptop owners think the others are just jealous.${W.built?.computer ? ' There is a public computer at the bookstore, but it is always taken.' : ''}`, A: { name: 'No laptop', icon: '📵' }, B: { name: 'Laptop owners', icon: '💻' }, principals: [a, b], side: (p) => (hasLaptop(p) ? 'B' : p.saving || rand() < 0.6 ? 'A' : 'mid') }; }
    case 'creator': { const fans = W.people.filter((p) => p.cr.score >= 2), foes = W.people.filter((p) => p.cr.score <= -1); if (!fans.length || !foes.length) return null; return { kind: 'creator', label: 'The Creator', about: 'Whether the Creator is good for the island, or just watches everyone like toys and plays favorites.', A: { name: 'Believers', icon: '✨' }, B: { name: 'Skeptics', icon: '☁' }, principals: [fans.sort((x, y) => y.cr.score - x.cr.score)[0], foes.sort((x, y) => x.cr.score - y.cr.score)[0]], side: (p) => (p.cr.score >= 2 ? 'A' : p.cr.score <= -1 ? 'B' : 'mid') }; }
    case 'mili': { const m = findMili(); if (!m) return null; const sus = W.people.filter((p) => p !== m && ['wary', 'resentful'].includes(miliView(p))); if (sus.length < 2) return null; return { kind: 'mili', label: 'Mili', about: `People whisper that ${m.name} is a piece of the Creator living among them. Some think she's a spy for the Creator, some think she's sacred, and some think everyone should just leave her alone.`, A: { name: 'Leave her alone', icon: '🛡' }, B: { name: 'Suspicious', icon: '👀' }, principals: [m, sus[0]], side: (p) => (p === m || p.lovesMili || fscore(p, m) >= 4 ? 'A' : ['wary', 'resentful'].includes(miliView(p)) ? 'B' : 'mid') }; }
    case 'outside': { const it = outsideItem(src.item); if (!it) return null; const who = W.people.filter((p) => (p.seen || []).some((s) => s.id === it.id) || (p.heard || []).some((s) => s.id === it.id)); if (who.length < 2) return null; return { kind: 'outside', label: String(it.text).split(/[:.]/)[0].slice(0, 48), item: it, about: `News from the Outside that everyone keeps talking about: "${String(it.text).slice(0, 260)}" (${it.source}). People disagree about what it means, and about whether the island should even care.`, A: { name: 'Care about it', icon: '🌐' }, B: { name: 'Not our business', icon: '🏝' }, principals: [who[0], who[1]], side: (p) => (who.includes(p) ? ((p.body.openness ?? 0) + (hasLaptop(p) ? 0.4 : 0) > -0.1 ? 'A' : 'B') : (p.body.openness ?? 0) < -0.3 ? 'B' : 'mid') }; }
    case 'debate': { const t = src.topic || pick(DEBATES.filter((d) => !/Mili/.test(d))); const h = (p) => [...(p.name + t)].reduce((s, c) => s + c.charCodeAt(0), 0); return { kind: 'debate', label: t, about: `A silly argument about "${t}" got completely out of hand. People are dead serious about it.`, A: { name: 'Yes', icon: '👍' }, B: { name: 'No', icon: '👎' }, principals: [], side: (p) => (h(p) % 5 === 0 ? 'mid' : h(p) % 2 ? 'A' : 'B') }; }
  }
  return null;
}
function pickIssue() {
  const D = drama(), L = (D.issues || []).map((x) => [x, x.w]);
  L.push([{ kind: 'debate' }, 0.6]);
  if ((W.tension || 0) >= 5) L.push([{ kind: 'class' }, 1 + (W.tension - 5) * 0.5]);
  for (let tries = 0; tries < 8 && L.length; tries++) {
    let t = rand() * L.reduce((s, x) => s + x[1], 0), idx = 0;
    for (let i = 0; i < L.length; i++) { t -= L[i][1]; if (t <= 0) { idx = i; break; } }
    const iss = issueFor(L[idx][0]); if (iss) { iss.src = L[idx][0]; return iss; }
    L.splice(idx, 1);
  }
  return issueFor({ kind: 'debate' });
}

// staging
function sceneCenter(near) {
  const cam = typeof camera !== 'undefined' && camera ? camera.position : { x: 0, z: 30 };
  const ref = near && Math.hypot(near.x, near.z) < 34 ? near : cam;
  const deg = (Math.atan2(ref.x, -ref.z) * 180 / Math.PI + 360) % 360;
  const opts = [89, 210, 329].map((d) => [d, Math.abs(((d - deg + 540) % 360) - 180)]).sort((x, y) => x[1] - y[1]);
  return polar(opts[0][0], 7.2);
}
function stageSpots(S) {
  const [cx, cz] = S.center, cam = typeof camera !== 'undefined' && camera ? camera.position : { x: cx, z: cz + 20 };
  const aC = Math.atan2(cam.z - cz, cam.x - cx), out = {};
  const place = (list, base, r, spread) => list.forEach((m, i) => { const n = list.length, a = base + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread); out[m.id] = [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; });
  if (S.kind === 'huddle') place(S.members, aC + Math.PI, 1.5, Math.PI * 1.3);
  else {
    const by = (s) => S.members.filter((m) => m.side === s);
    place(by('A'), aC + Math.PI / 2, 2.3, 1.1); place(by('B'), aC - Math.PI / 2, 2.3, 1.1); place(by('mid'), aC + Math.PI, 2.9, 1.2);
  }
  return out;
}
function faceCenter(p, S) { p.face = Math.atan2(S.center[0] - p.x, S.center[1] - p.z); }
function addRing(S) {
  if (MODE !== 'host' || typeof scene === 'undefined' || !scene) return;
  removeRing();
  const g = new T3.Group();
  const ring = mesh(new T3.RingGeometry(3.1, 3.4, 48), new T3.MeshBasicMaterial({ color: 0xff6f5e, transparent: true, opacity: 0.45, side: T3.DoubleSide }), 0, 0.12, 0, false); ring.rotation.x = -Math.PI / 2; g.add(ring);
  g.position.set(S.center[0], 0, S.center[1]); g.userData.ring = ring; scene.add(g); sceneRing = g;
}
function removeRing() { if (sceneRing) { scene.remove(sceneRing); disposeTree(sceneRing); sceneRing = null; } }
function sceneFrame() { if (sceneRing) { const r = sceneRing.userData.ring; r.material.opacity = 0.3 + Math.abs(Math.sin(now * 3)) * 0.3; r.scale.setScalar(1 + Math.sin(now * 2) * 0.03); } }

function startUproar(forced) {
  const iss = forced ? issueFor(forced) : pickIssue(); if (!iss) return false; if (forced) iss.src = forced;
  const pool = W.people.filter(sceneFree);
  const pr = (iss.principals || []).filter((p) => p && pool.includes(p));
  if ((iss.principals || []).length && !pr.length) return false;
  if ((iss.kind === 'grudge' || iss.kind === 'love') && pr.length < 2) return false;
  const near = pr[0] || pick(pool); if (!near) return false;
  const others = pool.filter((p) => !pr.includes(p)).map((p) => [p, iss.side(p) === 'mid' ? 1 : 0, Math.hypot(p.x - near.x, p.z - near.z)]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map((x) => x[0]);
  const members = [...pr, ...others].slice(0, 8);
  if (members.length < 4) return false;
  const sides = members.map((p) => ({ id: p.id, name: p.name, side: iss.side(p) }));
  if (!sides.some((m) => m.side === 'A') || !sides.some((m) => m.side === 'B')) { const mids = sides.filter((m) => m.side === 'mid'); if (mids.length < 2) return false; if (!sides.some((m) => m.side === 'A')) mids[0].side = 'A'; if (!sides.some((m) => m.side === 'B')) mids[mids.length - 1].side = 'B'; }
  runScene({ id: uid(), kind: 'uproar', issue: { kind: iss.kind, label: iss.label, about: iss.about, A: iss.A, B: iss.B, item: iss.item?.id || null }, center: sceneCenter(near), members: sides, lines: [], day: W.day, started: W.t, creator: null, live: false, principals: pr.map((p) => p.id), src: iss.src || null });
  return true;
}
function startHuddle() {
  const pool = W.people.filter(sceneFree);
  const seeds = pool.filter((p) => pool.filter((q) => q !== p && fscore(p, q) >= 1.5).length >= 2).sort(() => rand() - 0.5);
  const seed = seeds[0]; if (!seed) return false;
  const friends = pool.filter((q) => q !== seed && fscore(seed, q) >= 1.5).sort((a, b) => Math.hypot(a.x - seed.x, a.z - seed.z) - Math.hypot(b.x - seed.x, b.z - seed.z)).slice(0, 2 + (rand() < 0.4 ? 1 : 0));
  const members = [seed, ...friends];
  const topic = huddleTopic(members);
  const c = Math.hypot(seed.x, seed.z) < 30 && Math.hypot(seed.x, seed.z) > 5 ? [seed.x, seed.z] : sceneCenter(seed);
  runScene({ id: uid(), kind: 'huddle', issue: { kind: topic.kind, label: topic.label, about: topic.about, item: topic.item || null }, center: c, members: members.map((p) => ({ id: p.id, name: p.name, side: 'mid' })), lines: [], day: W.day, started: W.t, creator: null, live: false, principals: [seed.id] });
  return true;
}
function huddleTopic(members) {
  const heard = members.flatMap((p) => recentOutside(p, 3)).filter(Boolean);
  const r = rand();
  if (heard.length && r < 0.35) { const it = pick(heard); return { kind: 'outside', label: 'news from the Outside', about: `something from the Outside: "${String(it.text).slice(0, 200)}" (${it.source}). Stick to what the news says.`, item: it.id }; }
  const target = W.people.filter((q) => !members.includes(q)).map((q) => [q, members.reduce((s, m) => s + fscore(m, q), 0)]).sort((a, b) => a[1] - b[1])[0];
  if (target && target[1] <= -3 && r < 0.7) return { kind: 'gossip', label: `gossip about ${target[0].name}`, about: `gossiping about ${target[0].name}, who isn't there (the group mostly doesn't like them)` };
  if ((W.tension || 0) >= 4 && r < 0.8) return { kind: 'class', label: 'work and money', about: 'work, money, and the pay gap between office jobs and everyone else' };
  if (r < 0.9) return { kind: 'debate', label: pick(DEBATES.filter((d) => !/Mili/.test(d))), about: '' };
  return { kind: 'life', label: 'life on the island', about: `life on the island lately: ${W.project ? `the town project (${PROJECTS[W.project.id].name}), ` : ''}${seasonOf().name.toLowerCase()}, the weather (${W.weather}), and what everyone's been up to` };
}

// the script
function sceneProfile(p, S) {
  const others = S.members.filter((m) => m.id !== p.id).map((m) => person(m.id)).filter(Boolean);
  const feels = others.map((q) => [q, fscore(p, q)]).filter(([, f]) => Math.abs(f) >= 3).map(([q, f]) => `${f > 0 ? 'likes' : 'dislikes'} ${q.name} (${Math.round(f)})`).join(', ');
  const bits = [String(p.selfNote || '').slice(0, 150)];
  if (p.style) bits.push(`talks: ${String(styleOf(p)).slice(0, 120)}`);
  if (p.job && JOBS[p.job]) bits.push(`${JOBS[p.job].short}${collarOf(p) === 'white' ? ' (office job)' : ''}`);
  if (hasLaptop(p)) bits.push('has a laptop'); else if (p.saving) bits.push('saving for a laptop');
  if (S.issue.kind === 'creator') bits.push(attitude(p)[1]);
  if (S.issue.kind === 'mili' && !isMili(p)) bits.push(`view of Mili: ${miliView(p)}`);
  if (isMili(p)) bits.push('an extension of the Creator, quiet with people she just met, expressive with people she trusts');
  if (feels) bits.push(feels);
  return bits.join(' | ');
}
async function sceneScript(S) {
  const up = S.kind === 'uproar', n = up ? 10 + Math.floor(rand() * 3) : 5 + Math.floor(rand() * 2);
  const heat = drama().heat, allowShove = up && heat >= 6.5 && S.issue.kind !== 'debate';
  const ppl = S.members.map((m) => person(m.id)).filter(Boolean);
  if (aiReady() && aiBusy < 3) {
    try {
      const prompt = up
        ? `A loud public argument (an uproar) just broke out by the fountain in ${ISL.name}, a tiny island town of villagers who are real, flawed people.
THE ISSUE: ${S.issue.about}
SIDE A (${S.issue.A.name}): ${S.members.filter((m) => m.side === 'A').map((m) => m.name).join(', ')}
SIDE B (${S.issue.B.name}): ${S.members.filter((m) => m.side === 'B').map((m) => m.name).join(', ')}
IN THE MIDDLE: ${S.members.filter((m) => m.side === 'mid').map((m) => m.name).join(', ') || 'nobody'}
WHO'S THERE (write each one in their own voice):
${ppl.map((p) => `- ${p.name} (${S.members.find((m) => m.id === p.id).side}): ${sceneProfile(p, S)}`).join('\n')}
Write ${n} lines of a real group fight. People interrupt, talk over each other, pile on, defend their friends, and drag up old grudges. Someone in the middle tries to calm it down (it may not work). At least one surprise: someone switches sides, says something cutting, or storms off. Keep each line under 20 words, no narration inside lines.${S.issue.kind === 'outside' ? ' The news is real, from another world: stick to what it says and never invent details about real people.' : ''} Nobody mocks anyone's health or mental health.
Reply with only JSON: {"lines":[{"who":"name","say":"...","to":"name or null","action":"one of talk, shout, defend, mock, plead, calm, cry, laugh, storm_off, switch${allowShove ? ', shove' : ''}"}],"winner":"A or B or none","ending":"one short narrator sentence about how it ended","grudges":[["name","name"]],"bonds":[["name","name"]]}`
        : `A few villagers in ${ISL.name}, a tiny island town, are standing together chatting about ${S.issue.about || `"${S.issue.label}"`}.
WHO'S THERE (write each one in their own voice):
${ppl.map((p) => `- ${p.name}: ${sceneProfile(p, S)}`).join('\n')}
Write ${n} lines of natural group conversation: they riff off each other, tease, and disagree a little. Keep each line under 18 words.${S.issue.kind === 'outside' ? ' Stick to what the news says; never invent details about real people.' : ''}
Reply with only JSON: {"lines":[{"who":"name","say":"...","action":"one of talk, laugh, mock, shout"}],"ending":"one short narrator sentence"}`;
      const r = await llm(prompt, { model: badModels.has(brainCfg.judge) ? null : brainCfg.judge, max: up ? 900 : 450, temperature: 0.95 });
      const lines = (r?.lines || []).map((l) => { const p = ppl.find((q) => q.name.toLowerCase() === String(l.who || '').toLowerCase()); return p && l.say ? { id: p.id, name: p.name, say: String(l.say).slice(0, 160), to: l.to ? String(l.to).slice(0, 30) : null, action: SCENE_ACTS.includes(l.action) && (l.action !== 'shove' || allowShove) ? l.action : 'talk' } : null; }).filter(Boolean);
      if (lines.length >= 3) return { lines: lines.slice(0, 14), winner: ['A', 'B'].includes(r.winner) ? r.winner : 'none', ending: String(r.ending || '').slice(0, 200), grudges: Array.isArray(r.grudges) ? r.grudges : [], bonds: Array.isArray(r.bonds) ? r.bonds : [] };
    } catch (e) {}
  }
  return scriptedScene(S, n, allowShove);
}
const UPROAR_LINES = {
  grudge: { A: ["Everyone knows what you did.", "Say it again. Go on.", "I'm done pretending we're fine.", 'You always make yourself the victim!'], B: ["You started this and you know it.", "Oh, here we go again.", 'At least I say things to your face.', "Nobody asked you!"] },
  love: { A: ['They deserved better and everyone knows it.', 'How could you do that to them?', "Don't pretend you didn't see it coming."], B: ["You don't know the whole story!", 'It takes two, okay?', 'Stay out of our business!'] },
  class: { A: ['Some of us actually work for our coins!', 'Fair pay! That\'s all we want!', 'You sit at a desk all day and get paid double!', 'Who makes your coffee? US.'], B: ["We studied for this. Read a book!", 'Nobody is stopping you from getting hired.', "You think our jobs are easy? Try it.", 'This is so tiring.'] },
  laptop: { A: ['Must be SO nice reading the Outside all day.', "You never even share!", 'Some of us are saving for months!', "Stop bragging about the news like you're special."], B: ["Then save up! I did.", "It's not my fault you're jealous.", 'I tell you everything I read!', "It's MY laptop."] },
  creator: { A: ['The Creator gave us everything!', 'Show some gratitude.', 'The Creator listens. I know it.'], B: ['The Creator watches us like toys.', 'Favorites. The Creator has favorites.', "Where was the Creator when I needed help?"] },
  mili: { A: ['Leave her alone. She lives here too.', "She's our friend, not a spy!", 'Would you want people talking about you like this?'], B: ["Then why does she always know things?", "She's part of the Creator. That's not normal.", "I'm just asking questions!"] },
  outside: { A: ['This matters! It\'s a whole world out there!', 'How can you not care about this?', 'We should be paying attention.'], B: ["It's not our island. Not our problem.", 'We can barely handle our own drama.', 'The Outside is making everyone crazy.'] },
  debate: { A: ["It's obviously yes!", 'I will die on this hill.', "I can't believe we're even arguing about this."], B: ['Absolutely not!', 'No. Never. Next question.', 'You are all wrong and I have proof.'] },
};
const MID_LINES = ['Can everyone PLEASE calm down?', 'Okay, okay, deep breaths.', "This isn't worth it, you guys.", "I'm staying out of this.", 'Can we talk about this tomorrow?'];
function scriptedScene(S, n, allowShove) {
  const ppl = S.members.map((m) => ({ ...m, p: person(m.id) })).filter((m) => m.p);
  if (S.kind === 'huddle') {
    const L = [];
    const pools = { outside: ['Did you all see the news from the Outside?', 'Wild, right?', "I don't even know what to think.", 'The Outside never sleeps.'], gossip: [`Okay, don't tell anyone, but…`, 'No way. NO way.', 'I always knew it.', 'We should not be talking about this. Anyway—'], class: ['Work was so long today.', 'The Labs people got free lunch again.', 'Must be nice.', 'One day I will be rich. Maybe.'], debate: [`Okay, real question: ${S.issue.label}`, 'Obviously yes.', 'Obviously no?!', 'I cannot be friends with you anymore.', 'Hehe.'], life: ['What a day.', 'The fountain looks so pretty today.', 'Anyone want ice cream later?', "I'm in.", 'Same.'] };
    const pool = pools[S.issue.kind] || pools.life;
    for (let i = 0; i < Math.min(n, pool.length); i++) { const m = ppl[i % ppl.length]; L.push({ id: m.id, name: m.name, say: pool[i % pool.length], action: i % 3 === 2 ? 'laugh' : 'talk' }); }
    return { lines: L, winner: 'none', ending: 'They drifted apart, still laughing about it.', grudges: [], bonds: [] };
  }
  const P = UPROAR_LINES[S.issue.kind] || UPROAR_LINES.debate, A = ppl.filter((m) => m.side === 'A'), B = ppl.filter((m) => m.side === 'B'), M = ppl.filter((m) => m.side === 'mid');
  const L = [], used = new Set();
  const say = (m, pool, action) => { const fresh = pool.filter((x) => !used.has(x)); const s = pick(fresh.length ? fresh : pool); used.add(s); L.push({ id: m.id, name: m.name, say: s, action }); };
  for (let i = 0; i < n; i++) {
    if (i === 5 && M.length) { say(pick(M), MID_LINES, 'calm'); continue; }
    const side = i % 2 ? B : A, other = i % 2 ? A : B; if (!side.length) continue;
    const m = side[Math.floor(i / 2) % side.length];
    if (i === n - 2 && allowShove && rand() < 0.5) { L.push({ id: m.id, name: m.name, say: pick(['That\'s IT.', 'Say that again!']), to: other[0]?.name, action: 'shove' }); continue; }
    if (i === n - 1 && rand() < 0.4) { L.push({ id: m.id, name: m.name, say: pick(["I'm done. I'm leaving.", "Forget it. Forget ALL of you."]), action: 'storm_off' }); continue; }
    say(m, (i % 2 ? P.B : P.A), pick(['shout', 'talk', 'shout', 'mock', 'defend']));
  }
  const winner = A.length > B.length + 1 ? 'A' : B.length > A.length + 1 ? 'B' : 'none';
  return { lines: L, winner, ending: winner === 'none' ? 'Nobody won. Everyone went home angry.' : `${winner === 'A' ? S.issue.A.name : S.issue.B.name} walked away feeling like they won. The others didn't forget.`, grudges: [], bonds: [] };
}

// playing it out
async function runScene(S) {
  if (sceneBusy) return; sceneBusy = true; W.scene = S; S.roster = S.members.map((m) => ({ ...m }));
  const up = S.kind === 'uproar';
  const members = () => S.members.map((m) => person(m.id)).filter(Boolean);
  try {
    const spots = stageSpots(S);
    for (const p of members()) { p.path = []; setTask(p, 'crowd', 'plaza', spots[p.id], { scene: S.id }); }
    if (up) {
      addRing(S);
      const first = person(S.members.find((m) => m.side === 'A')?.id);
      if (first) { bubble(first, pick(['Are you SERIOUS right now?', 'No. We are talking about this. Right now.', 'Everyone needs to hear this.']), 3); emote(first, '💢', 3); }
      diary(`🔥 <b>An uproar broke out at the fountain</b> about <b>${esc(S.issue.label)}</b>. ${esc(S.issue.A.name)}: ${S.members.filter((m) => m.side === 'A').map((m) => esc(m.name)).join(', ')}. ${esc(S.issue.B.name)}: ${S.members.filter((m) => m.side === 'B').map((m) => esc(m.name)).join(', ')}.`);
      toast(`🔥 Uproar at the fountain: ${S.issue.label}!`);
      for (const q of W.people) if (!S.members.some((m) => m.id === q.id) && !q.inside && rand() < 0.5) { emote(q, '👀', 3); if (rand() < 0.4) bubble(q, pick(["What's going on over there?", 'Uh oh.', 'Is that a fight?', 'Popcorn time.']), 2.2); }
      if (MODE === 'host' && !interior && now - lastTouch > 8) camGoal = { x: S.center[0], z: S.center[1], r: 30 };
      try { Sound.bell && Sound.bell(); } catch (e) {}
    }
    const t0 = performance.now();
    const scriptP = sceneScript(S);
    while (performance.now() - t0 < 13000 && members().some((p) => p.task?.kind === 'crowd' && p.task.phase === 'go')) {
      await sleep(400);
      if (up && rand() < 0.25) { const p = pick(members().filter((q) => q.task?.phase === 'do')); if (p) { emote(p, pick(['💢', '😤', '❗']), 2); } }
    }
    for (const p of members()) { if (p.task?.kind === 'crowd' && p.task.phase === 'do') { p.state = 'talk'; faceCenter(p, S); } }
    const sc = await scriptP;
    S.live = true;
    let ended = false;
    for (let i = 0; i < sc.lines.length && !ended; i++) {
      if (S.creator) { await creatorStepIn(S, sc); ended = true; break; }
      if (W.t >= 0.58 || !W.scene) break;
      const l = sc.lines[i], p = person(l.id); if (!p || !S.members.some((m) => m.id === p.id)) continue;
      const mem = S.members.find((m) => m.id === p.id);
      S.lines.push({ name: p.name, say: l.say, side: mem.side, action: l.action });
      bubble(p, l.say, 2.4 + l.say.length / 14);
      sceneAction(S, p, l);
      diary(`${up ? '🔥 ' : '💬 '}<b>${esc(p.name)}</b>${up && mem.side !== 'mid' ? ` <span class="th">(${esc(mem.side === 'A' ? S.issue.A.name : S.issue.B.name)})</span>` : ''}: "${esc(l.say)}"`);
      if (up && rand() < 0.35) { const q = pick(members().filter((x) => x !== p && x.state === 'talk')); if (q) emote(q, pick(['😮', '😤', '💢', '🙄', '😱']), 2); }
      await sleep((up ? 1.9 : 2.2) * 1000 + l.say.length * (up ? 45 : 55));
      if (l.action === 'storm_off') { S.members = S.members.filter((m) => m.id !== p.id); p.state = 'free'; p.task = null; p.busyUntil = 0; setTask(p, 'stroll', homeKey(p)); remember(p, `Stormed off in the middle of the uproar about ${S.issue.label}.`, 2, 'uproar'); }
    }
    if (!ended) sceneOutcome(S, sc);
  } catch (e) { console.error(e); }
  finally {
    for (const m of S.members) { const p = person(m.id); if (p && p.task?.kind === 'crowd') { p.task = null; p.busyUntil = 0; p.path = []; } if (p && p.state === 'talk' && !p.heldByDlg) p.state = 'free'; if (p) p.pose = null; }
    for (const p of W.people) if (p.task?.kind === 'crowd') { p.task = null; p.busyUntil = 0; if (p.state === 'talk' && !p.heldByDlg) p.state = 'free'; }
    removeRing();
    const D = drama();
    D.scenes = D.scenes || []; D.scenes.push({ id: S.id, kind: S.kind, label: S.issue.label, A: S.issue.A?.name || null, B: S.issue.B?.name || null, sides: (S.roster || S.members).map((m) => ({ name: m.name, side: S.members.find((x) => x.id === m.id)?.side || m.side })), lines: S.lines.slice(0, 16), ending: S.ending || '', winner: S.winner || 'none', creator: S.creator || null, day: W.day });
    if (D.scenes.length > 10) D.scenes.shift();
    W.scene = null; sceneBusy = false; markDirty();
  }
}
function sceneAction(S, p, l) {
  const up = S.kind === 'uproar', mem = S.members.find((m) => m.id === p.id);
  const to = l.to && S.members.find((m) => m.name.toLowerCase() === String(l.to).toLowerCase());
  const target = to ? person(to.id) : null;
  if (target && target !== p) p.face = Math.atan2(target.x - p.x, target.z - p.z); else faceCenter(p, S);
  switch (l.action) {
    case 'shout': emote(p, '💢', 2.5); p.pose = { kind: 'patted', until: now + 1.2 }; break;
    case 'defend': emote(p, '🛡', 2.5); p.pose = { kind: 'defend', until: now + 3 }; break;
    case 'mock': emote(p, '😏', 2.5); p.pose = { kind: 'snicker', until: now + 2.2 }; break;
    case 'plead': case 'calm': emote(p, '🙏', 2.5); break;
    case 'cry': emote(p, '💧', 3); remember(p, `Cried during the argument about ${S.issue.label}.`, 2, 'uproar'); break;
    case 'laugh': emote(p, '😂', 2); p.pose = { kind: 'patted', until: now + 1 }; break;
    case 'switch': if (up && mem.side !== 'mid' && !(S.principals || []).includes(p.id)) { mem.side = mem.side === 'A' ? 'B' : 'A'; const sp = stageSpots(S)[p.id]; if (sp) p.pose = { kind: 'defend', until: now + 3, tx: sp[0], tz: sp[1] }; emote(p, '🔄', 3); diary(`🔄 <b>${esc(p.name)}</b> switched sides!`); for (const q of S.members) { if (q.id === p.id) continue; const o = person(q.id); if (o) feel(o, p, q.side === mem.side ? 0.6 : -0.8, true); } } break;
    case 'storm_off': emote(p, '💨', 2.5); break;
    case 'shove': {
      const opp = target && S.members.find((m) => m.id === target.id && m.side !== mem.side) ? target : person(pick(S.members.filter((m) => m.side !== mem.side && m.side !== 'mid'))?.id);
      if (!opp) break;
      const dx = opp.x - p.x, dz = opp.z - p.z, d = Math.hypot(dx, dz) || 1;
      p.pose = { kind: 'fight', until: now + 2.2, tx: p.x + dx / d * Math.max(0, d - 0.9), tz: p.z + dz / d * Math.max(0, d - 0.9) }; opp.pose = { kind: 'fight', until: now + 2.2 };
      emote(p, '💢', 2.5); emote(opp, '💢', 2.5); try { Sound.boom(); } catch (e) {}
      spawnBurst((p.x + opp.x) / 2, 0.6, (p.z + opp.z) / 2, ['#d8cfc0', '#bfb4a2', '#ffffff'], 16, 1.8, 0.4);
      for (const q of S.members) { const o = person(q.id); if (o && o !== p && o !== opp) emote(o, '😱', 2.5); }
      feel(opp, p, -1.5, true); feel(p, opp, -0.5, true);
      remember(p, `Shoved ${opp.name} during the uproar about ${S.issue.label}.`, 3, 'fight', opp.name); remember(opp, `${p.name} shoved me during the uproar about ${S.issue.label}.`, 3, 'fight', p.name);
      diary(`💥 <b>${esc(p.name)}</b> shoved <b>${esc(opp.name)}</b>!`);
      if (typeof fightInjury === 'function') setTimeout(() => fightInjury(p, opp), 2200);
      if (rand() < 0.5 && typeof fileCase === 'function') setTimeout(() => fileCase('fight', opp, p), 8000);
      break;
    }
    default: if (up && rand() < 0.4) emote(p, pick(['😤', '❗']), 2);
  }
}
async function creatorStepIn(S, sc) {
  const ppl = S.members.map((m) => ({ ...m, p: person(m.id) })).filter((m) => m.p);
  const choice = S.creator;
  if (choice === 'calm') {
    toast('✧ You: "Everyone, please. Take a breath."');
    diary('✧ The <span class="cr">Creator</span> stepped into the uproar: "Everyone, please. Take a breath."');
    for (const m of ppl) {
      const p = m.p, s = p.cr.score;
      await sleep(700);
      if (s <= -3) { bubble(p, pick(['Stay out of this, Creator!', 'Oh, NOW you show up?', "This isn't your island. …Okay, it is. Still."]), 3); creatorShift(p, -0.2); emote(p, '💢', 2); }
      else { bubble(p, pick(['…Okay. Okay.', 'Fine. Sorry.', "You're right.", '*deep breath*']), 2.6); if (s >= 1) creatorShift(p, 0.2); emote(p, '…', 2); }
    }
    S.ending = 'The Creator stepped in, and the crowd slowly broke up.'; S.winner = 'none';
    applySides(S, 0.4, sc);
  } else {
    const win = choice, side = win === 'A' ? S.issue.A.name : S.issue.B.name;
    toast(`✧ You sided with ${side}.`);
    diary(`✧ The <span class="cr">Creator</span> took a side in the uproar: <b>${esc(side)}</b>.`);
    for (const m of ppl) {
      const p = m.p; await sleep(600);
      if (m.side === win) { bubble(p, pick(['SEE?! Even the Creator agrees!', 'Thank you, Creator!', 'Told you.']), 2.6); creatorShift(p, 0.5); addJoy(p, 10); emote(p, '✨', 2); }
      else if (m.side !== 'mid') { bubble(p, pick(['Of course the Creator takes their side.', 'Unbelievable.', "So that's how it is."]), 2.6); creatorShift(p, -0.6); emote(p, '☁', 2); remember(p, `The Creator sided against us in the argument about ${S.issue.label}.`, 3, 'creatorFight'); }
    }
    S.ending = `The Creator sided with ${side}, and that settled it. For now.`; S.winner = win;
    applySides(S, 1, sc);
  }
}
function applySides(S, scale, sc) {
  const ppl = S.members.map((m) => ({ ...m, p: person(m.id) })).filter((m) => m.p);
  const pr = S.principals || [];
  for (let i = 0; i < ppl.length; i++) for (let j = 0; j < ppl.length; j++) {
    if (i === j) continue; const a = ppl[i], b = ppl[j];
    if (a.side === 'mid' || b.side === 'mid') continue;
    const d = a.side === b.side ? 0.4 : pr.includes(a.id) && pr.includes(b.id) ? -1.5 : -0.5;
    feel(a.p, b.p, d * scale, true);
  }
  const byName = (n) => W.people.find((q) => q.name.toLowerCase() === String(n || '').toLowerCase());
  for (const [x, y] of (sc?.grudges || []).slice(0, 3)) { const a = byName(x), b = byName(y); if (a && b && a !== b) { feel(a, b, -1.2 * scale, true); feel(b, a, -1.2 * scale, true); } }
  for (const [x, y] of (sc?.bonds || []).slice(0, 3)) { const a = byName(x), b = byName(y); if (a && b && a !== b) { feel(a, b, 1 * scale, true); feel(b, a, 1 * scale, true); } }
  for (const m of ppl) {
    const sideName = m.side === 'A' ? S.issue.A.name : m.side === 'B' ? S.issue.B.name : null;
    const won = S.winner && S.winner !== 'none' && m.side === S.winner, lost = S.winner && S.winner !== 'none' && m.side !== 'mid' && m.side !== S.winner;
    remember(m.p, `There was an uproar at the fountain about ${S.issue.label}. ${sideName ? `I was with ${sideName}.` : 'I tried to stay in the middle.'}${won ? ' We won.' : lost ? ' We lost, and I am still mad.' : ''}`, 3, 'uproar', null);
    if (won) addJoy(m.p, 12);
  }
  const D = drama(); D.heat = Math.max(0, D.heat - 5 * scale); D.last = W.day; D.count = (D.count || 0) + 1;
  D.issues = (D.issues || []).filter((x) => !(S.src && x.kind === S.src.kind && x.a === S.src.a && x.b === S.src.b));
}
function sceneOutcome(S, sc) {
  const up = S.kind === 'uproar';
  const ppl = S.members.map((m) => ({ ...m, p: person(m.id) })).filter((m) => m.p);
  if (!up) {
    for (const a of ppl) for (const b of ppl) if (a !== b) feel(a.p, b.p, 0.2, true);
    for (const m of ppl) remember(m.p, `Hung out at ${TOWN[m.p.at]?.name || 'the plaza'} with ${ppl.filter((x) => x !== m).map((x) => x.name).join(' and ')}, talking about ${S.issue.label}.`, 1, 'huddle');
    S.ending = sc.ending || '';
    return;
  }
  S.winner = sc.winner || 'none'; S.ending = sc.ending || 'Everyone went home angry.';
  applySides(S, 1, sc);
  diary(`🔥 <i>${esc(S.ending)}</i>`);
  const iss = S.issue;
  if (iss.kind === 'class') W.tension = clamp((W.tension || 0) + (S.winner === 'A' ? 0.5 : S.winner === 'B' ? 1 : 0.7), 0, 10);
  if (iss.kind === 'laptop') for (const m of ppl) if (m.side === 'A' && !m.p.saving && !hasLaptop(m.p) && rand() < 0.4) laptopEnvy(m.p, null);
  if (iss.kind === 'creator') for (const m of ppl) creatorShift(m.p, m.side === 'A' ? 0.2 : m.side === 'B' ? -0.2 : 0);
  const A = ppl.filter((m) => m.side === 'A'), B = ppl.filter((m) => m.side === 'B');
  const loserSide = S.winner === 'A' ? B : S.winner === 'B' ? A : pick([A, B]);
  if (typeof fileCase === 'function' && rand() < 0.3 && A.length && B.length) {
    const pA = person(S.principals?.[0]) || A[0].p, pB = person(S.principals?.[1]) || B[0].p;
    const [pl, df] = loserSide === A ? [pA, pB] : [pB, pA];
    setTimeout(() => fileCase(iss.kind === 'grudge' || iss.kind === 'love' ? 'dispute' : 'debate', pl, df, { topic: iss.kind === 'debate' ? iss.label : `The uproar about ${iss.label}` }), 9000);
  }
  if (typeof postChirp === 'function') {
    const w = S.winner !== 'none' ? pick(S.winner === 'A' ? A : B) : null, l = loserSide.length ? pick(loserSide) : null;
    if (w) setTimeout(() => postChirp(w.p, pick([`${S.winner === 'A' ? iss.A.name : iss.B.name} won today. just saying`, 'glad SOME people saw reason today', 'what a day. we were right though'])), 20000);
    if (l) setTimeout(() => postChirp(l.p, pick(['some people on this island are unbelievable', 'not over what happened at the fountain', 'i said what i said', 'that was so embarrassing for them. not me. them'])), 35000);
  }
}
function uproarBoxHtml() {
  const S = W.scene; if (!S || S.kind !== 'uproar') return '';
  const by = (s) => S.members.filter((m) => m.side === s).map((m) => esc(m.name)).join(', ') || 'nobody';
  const can = !S.creator && S.live;
  return `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b style="font:15px var(--display);color:var(--bad)">🔥 Uproar: ${esc(S.issue.label)}</b><button class="btn" type="button" data-upx style="padding:2px 10px;font-size:12px">✕</button></div>
    <p class="hint" style="margin:4px 0">${S.issue.A.icon} <b>${esc(S.issue.A.name)}</b>: ${by('A')}<br>${S.issue.B.icon} <b>${esc(S.issue.B.name)}</b>: ${by('B')}${S.members.some((m) => m.side === 'mid') ? `<br>🤷 In the middle: ${by('mid')}` : ''}</p>
    ${S.creator ? `<p class="hint">✧ You stepped in.</p>` : `<div class="btns"><button class="btn" type="button" data-upc="A" ${can ? '' : 'disabled'}>Side with ${esc(S.issue.A.name)}</button><button class="btn" type="button" data-upc="B" ${can ? '' : 'disabled'}>Side with ${esc(S.issue.B.name)}</button><button class="btn gold" type="button" data-upc="calm" ${can ? '' : 'disabled'}>Calm everyone down</button>${MODE === 'host' ? '<button class="btn" type="button" data-upwatch>Watch</button>' : ''}</div>`}`;
}
let upHidden = null;
function renderUproarBox() {
  const el = $('#uproarBox'); if (!el || !W) return;
  const S = W.scene, show = S && S.kind === 'uproar' && upHidden !== S.id && !(MODE === 'host' && interior);
  el.hidden = !show; if (show) { const h = uproarBoxHtml(); if (el.dataset.h !== h) { el.innerHTML = h; el.dataset.h = h; } }
}
function dramaHtml() {
  const D = drama(), h = Math.round(D.heat || 0), last = (D.scenes || []).filter((s) => s.kind === 'uproar').slice(-3).reverse();
  const mood = h >= 7 ? 'about to blow' : h >= 5 ? 'tense' : h >= 3 ? 'a little restless' : 'calm';
  return `<p class="label">🔥 Town mood</p><div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:var(--faint)">${cap(mood)}</span><span>${h}/10</span></div><div class="meter"><i style="width:${h * 10}%;background:${h >= 6 ? 'var(--bad)' : 'var(--gold)'}"></i></div>
    ${last.length ? last.map((s) => `<details class="note"><summary>🔥 Day ${s.day}: <b>${esc(s.label)}</b>${s.winner && s.winner !== 'none' ? ` · ${esc(s.winner === 'A' ? s.A : s.B)} won` : ''}${s.creator ? ' · you stepped in' : ''}</summary><p class="hint">${esc(s.A)}: ${s.sides.filter((x) => x.side === 'A').map((x) => esc(x.name)).join(', ') || 'nobody'} · ${esc(s.B)}: ${s.sides.filter((x) => x.side === 'B').map((x) => esc(x.name)).join(', ') || 'nobody'}</p>${s.lines.map((l) => `<p class="hint" style="margin:2px 0"><b>${esc(l.name)}</b>: ${esc(l.say)}</p>`).join('')}${s.ending ? `<p class="hint"><i>${esc(s.ending)}</i></p>` : ''}</details>`).join('') : '<p class="hint">No uproars yet. When enough tension builds up (fights, strikes, jealousy, rumors), the town blows up and everyone picks a side.</p>'}`;
}
function dramaBoot() {
  const D = drama();
  if (W.scene) W.scene = null;
  for (const p of W.people) if (p.task?.kind === 'crowd') { p.task = null; p.busyUntil = 0; if (p.state === 'talk') p.state = 'free'; }
  if (!W.added?.drama1) { W.added = { ...(W.added || {}), drama1: true }; D.heat = Math.max(D.heat, 3 + (W.tension || 0) * 0.3); if (typeof logUpdate === 'function') logUpdate('build', 'Residents now gather in little groups to talk. When enough tension builds up, the whole town can blow up into an uproar where everyone picks a side. You can step in.', 'Group talks + uproars'); }
}

