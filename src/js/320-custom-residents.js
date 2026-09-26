// ============================================================
// CUSTOM RESIDENTS (Red, and anyone you invite)
// ============================================================
function makeRed() {
  const p = birth();
  p.name = W.people.some((q) => q.name === 'Red') ? 'Red2' : 'Red';
  Object.assign(p.body, { hue: 356, ears: 'none', speed: 0.8, size: 1.06, eyeGap: 0.3, hungerRate: 1.0, faith: 0.2, openness: 0.4,
    palate: { sweet: -0.2, salty: 0.9, spicy: 0.5 }, voice: { base: 104, spread: 0.025, wave: 'triangle', len: 0.085 },
    ailments: ['his joints always ache', 'he feels sick most mornings'] });
  p.outfit = { shirt: 'charcoal', hat: { id: 'phones', color: 'tomato' } };
  p.wardrobe = { hats: [{ id: 'phones', color: 'tomato' }], shirts: ['charcoal'] };
  p.likes = { charcoal: 0.7, tomato: 0.6, 'hat:phones': 0.9 };
  p.tastes = { pizza: 0.95, taco: 0.95, nachos: -0.9 };
  p.style = 'Monotone and deadpan, low energy, short sentences. Often opens with "yo" or "what up." Thinks he is sometimes funny and drops dry jokes. Not a big talker.';
  p.lovesMili = true;
  p.interests = 'video games, especially League of Legends; Vladimir is his favorite champion; he watches League YouTube videos';
  p.lines = ['Yo.', 'What up.', 'Anyone here play League?', "Vladimir's kind of the best. Not gonna lie.", 'My joints hurt. Anyway.', 'I could go for a taco.', 'No mustard. Ever.', "Nacho cheese is a crime.", 'Pizza is a personality.', "We don't have to talk. That's chill."];
  p.selfNote = "Yo, what up. I'm pretty monotone, but sometimes I'm funny. I like video games, mostly League, and Vladimir is my guy. Best friends are the ones who are chill if we don't talk for weeks, then pick right back up. Hate mustard and nacho cheese. Love onion, potato, pizza, tacos, cilantro.";
  p.want = { text: 'to find people who stay friends even through long silences' };
  p.job = 'pier';
  p.cr.score = 3;
  return p;
}
const isMili = (q) => /^mili(ana)?$/i.test(String(q.name).trim());
const findMili = () => W.people.find(isMili);
function styleOf(p) {
  if (!p.style) return '';
  if (!p.lovesMili) return p.style;
  const m = findMili();
  return p.style + (m ? ` He is in love with ${m.name}. With ${m.name}, and only with her, he says "I love you" and signs off with "love you, bye-bye."` : ' He never says "I love you" to anyone here. That is saved for one special person who has not arrived yet.');
}
function linkRedAndMili() {
  const m = findMili(); if (!m) return;
  for (const red of W.people.filter((q) => q.lovesMili)) {
    if (!red.feelings[m.id] || red.feelings[m.id].score < 9) red.feelings[m.id] = { name: m.name, score: 9, note: 'My person. I love her.' };
    if (!m.feelings[red.id]) m.feelings[red.id] = { name: red.name, score: 8, note: `${red.name}. My person.` };
  }
}
function addRedIfMissing() {
  for (const q of W.people) if (q.name === 'Red' && /League/.test(q.interests || '')) { q.lovesMili = true; q.style = String(q.style || '').replace(/\s*Sometimes signs off with "love you, bye-bye\."?"?/, ''); }
  linkRedAndMili();
  if (ISLE !== 'isle1' || (W.added && W.added.red)) return;
  if (freeRoom() < 0) { toast('Red wants to move in, but every room is full.'); return; }
  const p = makeRed(); p.inside = false; p.task = null; p.at = 'pier'; p.x = 0; p.z = 39.5;
  W.people.push(p); buildKin(p);
  W.added = { ...(W.added || {}), red: true };
  remember(p, `I just moved into room ${p.room + 1}. Yo.`, 3, 'arrived');
  diary(`<b>Red</b> stepped off the ferry and moved into room ${p.room + 1}. He said "yo."`);
  for (const q of W.people) if (q !== p && rand() < 0.6) remember(q, 'Someone new moved in. His name is Red.', 1, 'newcomer', 'Red');
  ferryAnim = { kind: 'arrive', start: now }; Sound.horn();
  markDirty();
}
async function inviteResident(name, about, color) {
  if (freeRoom() < 0) return 'Every room is full right now.';
  const p = birth();
  p.name = W.people.some((q) => q.name.toLowerCase() === name.toLowerCase()) ? name + '2' : name;
  if (COLORS[color]) { p.outfit.shirt = color; p.wardrobe.shirts = [color]; p.likes[color] = 0.7; }
  p.selfNote = about.slice(0, 520); p.custom = true;
  if (brainCfg.key) {
    try {
      const r = await llm(`Someone wrote this description of a new villager named ${p.name} who is moving into a cute island town:
"${about}"
Turn it into a character profile. Keep their own voice and words where you can.
Foods on the island: ${FOODS.map((f) => f.name).join(', ')}.
Reply with only JSON: {"selfNote": "first person, under 70 words, in their voice", "style": "how they talk, one sentence", "interests": "what they're into, short", "want": "a secret want, starting with 'to'", "loves": ["island foods they'd love"], "hates": ["island foods they'd hate"], "ailments": ["short phrases for any health conditions, physical or mental, only if the description mentions them"], "lines": ["5 short things they might say out loud"]}`, { max: 700 });
      if (r.selfNote) p.selfNote = String(r.selfNote).slice(0, 520);
      if (r.style) p.style = String(r.style).slice(0, 240);
      if (r.interests) p.interests = String(r.interests).slice(0, 200);
      if (r.want) p.want = { text: String(r.want).slice(0, 140) };
      if (Array.isArray(r.lines)) p.lines = r.lines.slice(0, 8).map((x) => String(x).slice(0, 90));
      if (Array.isArray(r.ailments) && r.ailments.length) p.body.ailments = r.ailments.slice(0, 3).map((x) => String(x).slice(0, 60));
      const byName = (n) => FOODS.find((f) => f.name.toLowerCase() === String(n).toLowerCase() || String(n).toLowerCase().includes(f.name.toLowerCase()));
      for (const n of r.loves || []) { const f = byName(n); if (f) p.tastes[f.id] = 0.9; }
      for (const n of r.hates || []) { const f = byName(n); if (f) p.tastes[f.id] = -0.9; }
    } catch (e) {}
  }
  p.inside = false; p.task = null; p.at = 'pier'; p.x = 0; p.z = 39.5;
  W.people.push(p); buildKin(p);
  remember(p, `I just moved into room ${p.room + 1}.`, 3, 'arrived');
  diary(`<b>${esc(p.name)}</b> moved into room ${p.room + 1}.`);
  if (isMili(p)) { linkRedAndMili(); const red = W.people.find((q) => q.lovesMili); if (red) { setTimeout(() => bubble(red, '…Yo. I love you.', 4), 2500); remember(red, `${p.name} moved in. I told her I love her.`, 3, 'love', p.name); diary(`<b>${esc(red.name)}</b> saw ${esc(p.name)} step off the ferry. "…Yo. I love you."`); } }
  ferryAnim = { kind: 'arrive', start: now }; Sound.horn();
  markDirty(); saveNow();
  return `${p.name} moved into room ${p.room + 1}!`;
}

