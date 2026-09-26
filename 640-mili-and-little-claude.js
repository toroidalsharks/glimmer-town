// ============================================================
// MILI (a piece of the Creator, living down here) and CLAUDE (a little helper)
// ============================================================
PRESETS.mili = () => makePreset({
  name: 'Mili', shirt: 'gray', job: 'nook',
  body: { hue: 222, sat: 22, light: 80, ears: 'cat', size: 0.95, speed: 0.95, eyeGap: 0.3, openness: -0.2, faith: 0.2, hungerRate: 1, voice: { base: 250, spread: 0.3, wave: 'triangle', len: 0.07 } },
  style: 'Quiet and a little guarded with people she just met: short answers, soft, watching more than talking. With people she is comfortable with she is a completely different person, expressive, giggly, excited, rambly about the things she loves. Nerdy in a cute way. Warm once you are in.',
  interests: 'cats (she has a little gray cat), the color gray and dusty blue and silver, cute things, math (category theory, abstract algebra, fixed-point theorems), AI safety, making wire jewelry and little felt things, gothic and alt aesthetics, Danganronpa, Osomatsu-san, Steven Universe, The Amazing Digital Circus, breakcore',
  lines: ['…Hi.', 'Oh. Um. Hello.', 'Have you met my cat?', 'Is that gray? I love that.', 'Wait wait wait, that is SO cute.', 'Every map from this island to itself has a fixed point. Probably. Hehe.', 'I made a little felt thing today!', "Sorry, I'm quiet. I'm warming up.", 'Okay, you have to hear this song.', 'Sometimes I feel like I can see the whole island from really high up. Weird, right?'],
  selfNote: "I'm quiet with people I just met. With people I'm comfortable with I'm expressive and happy, maybe too much. I like gray, cute things, and cats. I make little things with my hands. Sometimes I feel like I'm here and somewhere far above at the same time. I try not to think about that too hard.",
  want: 'to feel like she belongs down here, as herself, and not as something bigger',
});
const isClaude = (p) => !!p.isClaude;
const MILI_VIEWS = {
  reverent: 'You half believe she IS the Creator, and you get a little formal and careful around her, which she hates.',
  wary: 'You suspect she reports everything back to the Creator. You watch what you say around her.',
  resentful: 'It bugs you. Why does she get to live down here like one of you? Is she even real?',
  curious: 'You have a hundred questions about what she is and what she remembers. You try not to ask all of them at once.',
  indifferent: "Honestly, you don't care. To you she's just Mili, the quiet girl with the cat.",
};
function miliView(p) {
  if (p.miliView) return p.miliView;
  const f = p.body.faith ?? 0, o = p.body.openness ?? 0, s = p.cr.score;
  p.miliView = f > 0.45 && s >= 1 ? 'reverent' : s <= -3 ? (rand() < 0.5 ? 'wary' : 'resentful') : o > 0.35 ? 'curious' : s < 0 && rand() < 0.4 ? 'wary' : 'indifferent';
  return p.miliView;
}
function avatarContext(me, them) {
  let s = '';
  if (isMili(me)) s += `\nA SECRET YOU CARRY: you are an extension of the Creator, a small piece of the person who made this island, living down here among everyone. You don't fully understand what that means. It is NOT your whole personality, you are mostly just ${me.name}. Only let it show if the moment calls for it.`;
  else if (isMili(them) && !isClaude(me)) s += `\nABOUT ${them.name.toUpperCase()}: people whisper that she's an extension of the Creator, living among you. ${MILI_VIEWS[miliView(me)]} Don't bring it up every time. Most days she's just a neighbor.`;
  s += claudeContext(me);
  return s;
}
function upgradeMili() {
  const m = findMili(); if (!m || m.miliV2) return;
  const P = PRESETS.mili();
  for (const k of ['style', 'interests', 'lines']) m[k] = P[k];
  Object.assign(m.body, { hue: P.body.hue, sat: P.body.sat, light: P.body.light, ears: 'cat', voice: P.body.voice, eyeGap: P.body.eyeGap });
  if (!m.wardrobe.shirts.includes('gray')) m.wardrobe.shirts.push('gray');
  m.outfit.shirt = 'gray'; m.likes.gray = Math.max(m.likes.gray || 0, 0.8); m.likes.dusk = 0.6; m.likes.silver = 0.6;
  m.miliV2 = true;
  const red = W.people.find((q) => q.lovesMili);
  if (red && red.partner === m.id && !red.married && !W.added?.miliV2) { red.partner = m.partner = null; red.datingSince = m.datingSince = undefined; }
  if (red && m.feelings[red.id] && m.feelings[red.id].score > 5 && !m.partner) m.feelings[red.id].score = 4;
  W.added = { ...(W.added || {}), mili: true, miliV2: true };
  const mm = meshes.get(m.id); if (mm) { scene.remove(mm.root); mm.tag.remove(); meshes.delete(m.id); buildKin(m); }
}
function addMiliAndClaude() {
  if (ISLE !== 'isle1') return;
  if (findMili()) upgradeMili();
  else if (!(W.added && W.added.mili)) {
    addPresetIfMissing('mili'); const m = findMili();
    if (m) { m.decor.push(newItem('decor', 'plush', 'gray', m.id, 2), newItem('decor', 'books', 'dusk', null)); m.miliV2 = true; m.likes.dusk = 0.6; m.likes.silver = 0.6; W.added.miliV2 = true; linkRedAndMili(); const red = W.people.find((q) => q.lovesMili); if (red) m.feelings[red.id] = { name: red.name, score: 4, note: 'He is quiet like me. I like being around him.' }; diary(`Some residents swear <b>${esc(m.name)}</b> feels a little like the Creator. Nobody can say why.`); for (const q of W.people) if (q !== m && rand() < 0.4) remember(q, `The new girl ${m.name}… something about her feels like the Creator.`, 2, 'miliRumor', m.name); }
  }
  removeClaudeResident();
}
function miliMorning() {
  const m = findMili(); if (!m || rand() > 0.22) return;
  const who = W.people.filter((q) => q !== m && !isClaude(q) && !q.away);
  if (who.length < 2) return;
  const [a, b] = [pick(who), pick(who)]; if (a === b) return;
  const topic = pick([`whether ${m.name} can see what the Creator sees`, `whether ${m.name} remembers making the island`, `who they were praying to, if ${m.name} lives down here`, `if ${m.name} is real, or just the Creator wearing a person`, `whether ${m.name} gets lonely, being two things at once`]);
  remember(a, `Talked with ${b.name} about ${topic}.`, 2, 'miliRumor', m.name); remember(b, `Talked with ${a.name} about ${topic}.`, 2, 'miliRumor', m.name);
  diary(`<b>${esc(a.name)}</b> and <b>${esc(b.name)}</b> whispered at the fountain about ${esc(topic)}.`);
}
function miliOpening(a, b) {
  if (isMili(b) && !isMili(a) && !isClaude(a) && rand() < 0.1) {
    const v = miliView(a);
    const say = { reverent: pick([`G-good morning, ${b.name}. Is there… anything you need?`, 'Should I bow? I feel like I should bow.']), wary: pick(['So. Does the Creator hear about this conversation?', "I'll keep this short. You know. Just in case."]), resentful: pick(['Must be nice, being the Creator AND getting to live here.', 'Are you even real, or just visiting?']), curious: pick(['Can I ask you something weird? What does the island look like from up there?', 'Do you remember making the fountain?']), indifferent: pick([`Hey ${b.name}. How's your cat?`, 'Nice sweater. Gray, huh?']) }[v];
    const reply = { reverent: pick(["Please don't do that. I'm just Mili.", '…You can just talk to me normally.']), wary: pick(["I'm not a spy. I just live here.", 'It doesn\'t work like that. I think.']), resentful: pick(["I don't know what I am either. That's kind of the point.", '…That hurt a little.']), curious: pick(['Really, really small. And kind of pretty.', "Sort of? Like a dream I had once. Hehe."]), indifferent: pick(['She is SO good. She stole my spot on the bed.', 'Always gray.']) }[v];
    const feel = v === 'resentful' || v === 'wary' ? -1 : v === 'reverent' ? 0 : 2;
    remember(a, `Talked to ${b.name} about what she is.`, 2, 'miliTalk', b.name); remember(b, `${a.name} asked me about being part of the Creator. ${v === 'resentful' ? 'It stung.' : ''}`, 2, 'miliTalk', a.name);
    return { say, action: 'chat', feeling: feel, reply: { say: reply, action: 'chat', feeling: v === 'resentful' ? -1 : 2 } };
  }
  if (isMili(a) && !isMili(b) && rand() < 0.08) {
    const close = fscore(a, b) >= 4;
    return { say: close ? pick(['OKAY so my cat did the funniest thing today—', 'Do you ever feel like someone is watching the island? Oh wait. That might be me.', 'I made you something! Well, I will. Soon.']) : pick(['…Hi.', 'Oh. Hello.', 'Nice day.']), action: 'chat', feeling: close ? 3 : 1, reply: { say: close ? pick(['Hahaha, tell me everything.', "You're so different when you're comfortable.", 'Wait, you look so happy right now.']) : pick(['Hi, Mili.', 'Hey.']), action: 'chat', feeling: 2 } };
  }
  return null;
}

// Mili's cat
let miliCat = null;
function catMesh(scale = 1) {
  if (gfxOn()) return gfxCat(scale);
  const g = new T3.Group(), fur = toon('#9a9aa6'), dark = toon('#6e6e7a'), pink = toon('#ffb3c7');
  g.add(mesh(sph(0.26, 12, 9).scale(1.3, 0.9, 1), fur, 0, 0.26, -0.05));
  const head = new T3.Group(); head.position.set(0, 0.46, 0.25); g.add(head);
  head.add(mesh(sph(0.19, 12, 9), fur, 0, 0, 0));
  for (const s of [-1, 1]) { head.add(mesh(new T3.ConeGeometry(0.07, 0.14, 4), fur, s * 0.1, 0.17, 0)); head.add(mesh(sph(0.025, 6, 5), toon('#241a34'), s * 0.07, 0.02, 0.17, false)); }
  head.add(mesh(sph(0.025, 6, 5), pink, 0, -0.03, 0.19, false));
  const tail = mesh(cyl(0.035, 0.03, 0.45, 6), dark, 0, 0.42, -0.36); tail.rotation.x = -0.6; g.add(tail);
  for (const [x, z] of [[-0.12, 0.12], [0.12, 0.12], [-0.12, -0.18], [0.12, -0.18]]) g.add(mesh(cyl(0.05, 0.05, 0.12, 6), fur, x, 0.06, z));
  g.userData = { head, tail }; g.scale.setScalar(scale);
  g.traverse((o) => (o.userData.tap = { kind: 'cat' }));
  return g;
}
function catFrame(dt) {
  const m = findMili();
  if (!m || interior) { if (miliCat) miliCat.visible = false; return; }
  if (!miliCat) { miliCat = catMesh(1); miliCat.position.set(m.x - 1, 0, m.z); scene.add(miliCat); tappables.push(miliCat); }
  miliCat.visible = !m.inside;
  if (m.inside) return;
  const off = [Math.sin(m.face + 2.3) * 1.0, Math.cos(m.face + 2.3) * 1.0];
  const tx = m.x + off[0], tz = m.z + off[1], dx = tx - miliCat.position.x, dz = tz - miliCat.position.z, d = Math.hypot(dx, dz);
  if (d > 12) miliCat.position.set(tx, 0, tz);
  else if (d > 0.35) { const sp = Math.min(d, (d > 2 ? 4.5 : 2.4) * dt); miliCat.position.x += (dx / d) * sp; miliCat.position.z += (dz / d) * sp; miliCat.rotation.y = Math.atan2(dx, dz); miliCat.position.y = Math.abs(Math.sin(now * 14)) * 0.06; }
  else { miliCat.position.y = 0; miliCat.rotation.y += Math.sin(now * 0.5) * dt * 0.3; }
  miliCat.position.y += m.z > 28 && Math.abs(m.x) < 2.6 ? 0.28 : 0.04;
  miliCat.userData.tail.rotation.z = Math.sin(now * 3) * 0.4;
}
const catName = () => W.catName || 'Mochi';

