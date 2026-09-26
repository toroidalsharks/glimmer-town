// ============================================================
// DREAMS
// ============================================================
const isAsleep = (p) => p.inside && p.task?.kind === 'home' && (W.t >= 0.63 || W.t < 0.008);
function daydreamDream(p) {
  const people = Object.values(p.feelings).map((f) => f.name);
  const friend = people.length ? pick(people) : 'a stranger with no face';
  const food = favoriteFood(p) || pick(FOODS).name;
  const place = pick(['the fountain', 'the end of the pier', 'Berry Mart', 'the roof of the apartments', 'the garden']);
  const sky = p.cr.score >= 2 ? 'a warm light in the sky hums their name' : p.cr.score <= -2 ? 'a huge eye in the clouds watches them and says nothing' : "a voice from above asks a question they can't quite hear";
  return pick([
    `${p.name} is floating above ${place} on a giant ${food}. ${cap(friend)} waves from a cloud, and ${sky}.`,
    `${p.name} works at a shop that only sells ${food}. Every single customer is ${friend}. Then ${sky}.`,
    `The whole town is underwater, and ${p.name} can breathe just fine. ${cap(friend)} swims past wearing a crown of coins. Far above, ${sky}.`,
    `${p.name} is at a town meeting where everyone is a cat. ${cap(friend)} is the mayor. The vote is about ${food}, and ${sky}.`,
  ]);
}
function dreamPrompt(p) {
  const mems = [...p.past].sort((a, b) => b.weight - a.weight).slice(0, 6).map((m) => `- ${m.text}`).join('\n') || '- nothing much yet';
  const feels = Object.values(p.feelings).sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 4).map((f) => `${f.name} (${f.score > 0 ? 'likes' : 'dislikes'} them)`).join(', ') || 'nobody yet';
  return `${p.name} is a small, round villager asleep in their apartment in ${ISL.name}, a tiny island town in the style of Tomodachi Life. Write the dream they are having tonight.

Who they are, in their own words: ${p.selfNote}${p.interests ? `\nThey're into: ${p.interests}` : ''}
People on their mind: ${feels}
How they feel about the Creator (the unseen being who made the island): ${attitude(p)[1]}${p.cr.wish ? `. They are wishing for ${wishText(p.cr.wish)}` : ''}.
Things they remember:
${mems}

Make it 2 to 4 short sentences, present tense, third person, whimsical and a little surreal the way dreams are, mixing real people and things from their life. Cute, never gory.
Reply with only JSON: {"dream": "...", "mood": "sweet" | "funny" | "strange" | "sad" | "scary"}`;
}
async function peekDream(p) {
  if (p.dream && p.dream.day === W.day) return p.dream.text;
  let text = null;
  if (RT.sample) { try { const r = await RT.sample.json(dreamPrompt(p), { model: modelOf(p), fallbackKey: 'dream', cache: false }); text = String(r?.dream || '').slice(0, 500) || null; } catch (e) {} }
  if (!text) text = daydreamDream(p);
  p.dream = { day: W.day, text };
  remember(p, `I had a dream: ${text.slice(0, 160)}`, 2, 'dream');
  diary(`<b>${esc(p.name)}</b> dreamed: <i>${esc(text)}</i>`);
  markDirty();
  return text;
}

