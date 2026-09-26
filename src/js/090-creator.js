// ============================================================
// THE CREATOR: gifts, coins, wishes, talking
// ============================================================
function faithMult(p) { return 0.55 + 0.45 * (p.body.faith + 1) / 2; }
function creatorShift(p, d) { p.cr.score = clamp(p.cr.score + (d > 0 ? d * faithMult(p) : d * (1.4 - 0.4 * faithMult(p))), -10, 10); }
function believe(p, key, n = 1) { p.cr.beliefs[key] = (p.cr.beliefs[key] || 0) + n; }
function jealousy(p) {
  const mine = W.creator.gifts[p.id] || 0;
  for (const q of W.people) {
    if (q === p || q.grow < 1) continue;
    const theirs = W.creator.gifts[q.id] || 0;
    if (mine - theirs >= 3 && rand() < 0.3) {
      creatorShift(q, -0.15);
      remember(q, `The Creator gave ${p.name} something again. ${pick(["When's it my turn?", 'Maybe someday it will be me.', 'Good for them, I guess.'])}`, 1, 'jealous', p.name);
    }
  }
}
function wishMatch(p, it) {
  const w = p.cr.wish; if (!w) return 0;
  if (w.kind === 'book') return it.kind === 'book' && BOOKS[it.id]?.subj === w.subj ? 2 : 0;
  if (w.kind !== it.kind || w.id !== it.id) return 0;
  return !w.color || w.color === it.color ? 2 : 1;
}
function giftItem(p, it) {
  const base = baseLike(p, it) + (it.q - 1) * 0.15 + (rand() - 0.5) * 0.25;
  const mo = makerOpinion(p, it), maker = it.maker && person(it.maker), self = it.maker === p.id;
  const wm = wishMatch(p, it);
  const total = base + mo * 0.7 + wm * 0.8 + (self ? 0.4 : 0) + (it.grown ? 0.35 : 0) + (it.handmade ? 0.45 : 0) + (isBirthday(p) ? 0.3 : 0);
  const name = itemName(it);
  let line, refused = false;
  if (self) line = 'Wait… I made this! The Creator bought something I made?!';
  else if (wm) line = wm === 2 ? `My wish! ${cap(a_an(name))}! The Creator heard me!` : `It's… almost what I wished for. The Creator was listening!`;
  else if (maker && mo <= -0.45) {
    if (rand() < 0.55) { refused = true; line = `Made by ${maker.name}? I don't want anything of theirs.`; }
    else line = `It's nice… too bad ${maker.name} made it.`;
  } else if (maker && mo >= 0.35) line = `${maker.name} made this? They're so talented!`;
  else if (total > 0.6) line = pick([`${cap(a_an(name))}! I love it!`, 'This is exactly my style!', 'The Creator really knows me.']);
  else if (total > 0) line = pick(['Oh! Thank you, Creator.', `${cap(a_an(name))}. That's sweet.`]);
  else line = pick(['Um… thanks, I guess.', 'Does the Creator even know me?', `${cap(a_an(name))}? Not really my thing.`]);

  if (!refused && it.id === 'laptop') { line = pick(['A laptop?! For me?!', 'I can finally learn to code.', 'This changes everything. Thank you.']); remember(p, 'The Creator gave me a laptop. I can learn anything now.', 3, 'creatorGift'); for (const q of W.people) if (q !== p && rand() < 0.4) remember(q, `${p.name} got a laptop from the Creator.`, 2, 'jealous', p.name); }
  else if (!refused && !self && !wm && total > -0.2) {
    if (isBirthday(p)) { line = pick(['You remembered my birthday?!', `A birthday present! ${cap(a_an(name))}!`, "Is this… for my birthday? Creator!"]); remember(p, `The Creator gave me ${a_an(name)} on my birthday.`, 3, 'bdayCreator'); }
    else if (it.handmade) { line = pick([`You MADE this? With your own hands?`, `Handmade ${name}! I'm never letting go of it.`, "Wait, the Creator can craft?"]); remember(p, `The Creator made me ${a_an(name)} by hand.`, 3, 'creatorGift'); }
    else if (it.grown) { line = pick([`You grew this yourself? For me?`, `Homegrown ${name}! It smells like sunshine.`, 'The Creator has a garden? And they shared it with me?']); remember(p, `The Creator gave me ${name} they grew in their own garden.`, 2, 'creatorGrown'); }
  }
  if (refused) {
    creatorShift(p, -0.3); feel(p, maker, -0.5, true);
    remember(p, `The Creator tried to give me ${a_an(name)} ${maker.name} made. I gave it back.`, 3, 'creatorGiftRefused', maker.name);
    if (maker) { remember(maker, `${p.name} refused ${a_an(name)} I made, even from the Creator.`, 3, 'refusedMine', p.name); feel(maker, p, -1.2, true); }
    diary(`<span class="cr">Creator</span> offered ${esc(p.name)} ${a_an(esc(name))} made by ${esc(maker.name)}. <b>${esc(p.name)}</b> refused it.`);
    return { line, refused, text: `${p.name} refused it: "${line}"` };
  }
  receive(p, it); p.cr.lastSeen = W.day;
  addJoy(p, wm ? 45 : total > 0.6 ? 30 : total > 0 ? 15 : 5);
  W.creator.gifts[p.id] = (W.creator.gifts[p.id] || 0) + 1; W.creator.giftsTotal++;
  p.cr.gifts++;
  creatorShift(p, clamp(total, -1, 1.6) + 0.5 + (wm ? 2 : 0));
  if (it.color) believe(p, it.color); believe(p, it.kind === 'food' ? foodById(it.id).name : it.kind === 'decor' ? DECOR[it.id].name : it.kind === 'hat' ? HATS[it.id].name : 'shirt', 0.7);
  if (wm) { p.cr.wish = null; }
  if (maker && !self) {
    feel(p, maker, mo >= 0 ? 0.6 : -0.3, true);
    creatorShift(maker, 0.8); maker.coins += 1;
    remember(maker, `The Creator gave ${p.name} ${a_an(name)} I made! ${total > 0.3 ? 'They liked it.' : "I don't think they liked it."}`, 2, 'madeGift', p.name, { liked: total > 0.3 });
  }
  remember(p, `The Creator gave me ${a_an(name)}${maker && !self ? ` made by ${maker.name}` : ''}. ${total > 0.6 ? 'I loved it.' : total > 0 ? 'It was nice.' : "It wasn't really me."}`, 3, wm ? 'wishGranted' : 'creatorGift', maker?.name, { total, what: name });
  diary(`<span class="cr">Creator</span> gave <b>${esc(p.name)}</b> ${a_an(esc(name))}${maker && !self ? ` made by ${esc(maker.name)}` : ''}. "${esc(line)}"`);
  jealousy(p);
  return { line, refused, text: `${p.name}: "${line}"` };
}
function giftCoins(p, n) {
  W.creator.coins -= n; p.cr.lastSeen = W.day; if (sharing() && !p.visitor) { W.pantry = (W.pantry || 0) + n; } else p.coins += n;
  W.creator.gifts[p.id] = (W.creator.gifts[p.id] || 0) + (n >= 5 ? 1 : 0.4); W.creator.giftsTotal++;
  const wished = p.cr.wish?.kind === 'coins';
  const line = wished ? 'Coins! Just what I wished for!' : n >= 5 ? pick(['Coins from the sky?! Thank you, Creator!', 'So many coins! Is this real?']) : pick(['A coin! Thank you, Creator.', 'Oh, a coin fell from the sky.']);
  creatorShift(p, 0.3 + n * 0.12 + (wished ? 2 : 0)); addJoy(p, (n >= 5 ? 20 : 8) + (wished ? 30 : 0));
  if (wished) p.cr.wish = null;
  remember(p, `The Creator sent me ${plural(n, 'coin')}.`, n >= 5 ? 3 : 2, wished ? 'wishGranted' : 'creatorGift', null, { total: 0.5, what: plural(n, 'coin') });
  diary(`<span class="cr">Creator</span> sent <b>${esc(p.name)}</b> ${plural(n, 'coin')}. "${esc(line)}"`);
  if (n >= 5) jealousy(p);
  return { line, text: `${p.name}: "${line}"` };
}
function dailyWishes() {
  for (const p of W.people) {
    if (p.visitor) continue;
    const w = p.cr.wish;
    if (w && W.day - w.day >= 3) {
      creatorShift(p, -0.5);
      remember(p, `I wished for ${wishText(w)} and the Creator never answered.`, 3, 'wishLost', null, { what: wishText(w) });
      diary(`<b>${esc(p.name)}</b> gave up on wishing for ${esc(wishText(w))}.`);
      p.cr.wish = null;
    }
    if (!p.cr.wish && p.grow >= 0.8 && rand() < 0.4) {
      const r = rand(), color = bestBy(Object.keys(COLORS), (c) => (p.likes[c] || 0) * 1.5);
      let wsh;
      if (p.coins < 3 && r < 0.4) wsh = { kind: 'coins' };
      else if (r < 0.16) wsh = { kind: 'book', subj: favSubject(p) };
      else if (r < 0.55) wsh = { kind: 'decor', id: bestBy(Object.keys(DECOR), (d) => (p.body.decorAff[d] || 0) + (p.likes['decor:' + d] || 0)), color };
      else if (r < 0.8) wsh = { kind: 'hat', id: bestBy(Object.keys(HATS), (h) => p.likes['hat:' + h] || 0), color };
      else { const fav = Object.entries(p.tastes).sort((a, b) => b[1] - a[1])[0]; wsh = fav && fav[1] > 0.2 ? { kind: 'food', id: fav[0] } : { kind: 'decor', id: pick(Object.keys(DECOR)), color }; }
      wsh.day = W.day; p.cr.wish = wsh;
      remember(p, `I've started wishing for ${wishText(wsh)}.`, 1, 'wishMade');
    }
  }
}
function applyTalk(p, said, reply, feelingDelta, memory) {
  p.cr.talks++; p.cr.lastSeen = W.day;
  creatorShift(p, clamp(Number(feelingDelta) || 0, -2, 2) * 0.9 + 0.2); addJoy(p, 8 + Math.max(0, Number(feelingDelta) || 0) * 5);
  bubble(p, reply.length > 110 ? reply.slice(0, 107) + '…' : reply, 5 + reply.length / 25, true);
  emote(p, feelingDelta > 0 ? '♥' : feelingDelta < 0 ? '☁' : '✧', 3);
  remember(p, `The Creator spoke to me: "${said.slice(0, 120)}". ${memory ? memory.slice(0, 160) : `I said: "${reply.slice(0, 120)}"`}`, 3, 'creatorTalk', null, { delta: feelingDelta });
  diary(`<span class="cr">Creator</span> to <b>${esc(p.name)}</b>: "${esc(said.slice(0, 140))}" · ${esc(p.name)}: "${esc(reply.slice(0, 200))}"`);
  // others notice when someone gets the Creator's attention
  for (const q of W.people) if (q !== p && d2(q, p) < 9 && !q.inside && rand() < 0.5) remember(q, `I saw ${p.name} talking to the sky. They said the Creator spoke to them.`, 2, 'sawTalk', p.name);
}
function talkPrompt(p, said, history) {
  const feels = Object.values(p.feelings).sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 5).map((f) => `${f.name}: ${f.score > 0 ? '+' : ''}${Math.round(f.score)} (${f.note})`).join('; ') || 'nobody yet';
  const mems = [...p.past].sort((a, b) => b.weight - a.weight).slice(0, 6).map((m) => `- day ${m.day}: ${m.text}`).concat(p.today.slice(-6).map((m) => `- today: ${m.text}`)).join('\n') || '- nothing yet';
  const [att] = attitude(p);
  return `You are role-playing ${p.name}, a small, round villager who lives in room ${p.room + 1} of the apartments in Glimmer Town, a tiny island town. You are not an assistant. Everyone in town knows about "the Creator": an unseen being who made the island, sometimes sends gifts and coins from the sky, and whose likes and dislikes nobody knows for sure. Right now, the Creator is speaking directly to you.

WHO YOU ARE, IN YOUR OWN WORDS: ${p.selfNote}
BODY: ${bodyFacts(p)}${p.grow < 1 ? ' You are still a small child, so talk like one.' : ''}${p.style ? `\nHOW YOU TALK: ${styleOf(p)}` : ''}${p.interests ? `\nYOU'RE INTO: ${p.interests}` : ''}${healthContext(p, null)}${goalContext(p)}${crimeContext(p, null)}
LIFE: ${p.job ? `You work as a ${JOBS[p.job].title}.` : 'You are too young for a job.'} ${p.coins} coins. Wearing ${outfitText(p)}. Favorite food: ${favoriteFood(p) || 'not sure yet'}.
HOW YOU FEEL ABOUT THE CREATOR: ${att} (${Math.round(p.cr.score)} on a scale from -10 to 10). The Creator has given you ${plural(Math.round(p.cr.gifts), 'gift')} and spoken to you ${plural(p.cr.talks, 'time')} before. ${beliefText(p)}${p.cr.wish ? ` You are secretly wishing for ${wishText(p.cr.wish)}.` : ''}
YOUR NEIGHBORS: ${feels}
MEMORIES:
${mems}
${history.length ? `\nEARLIER IN THIS CONVERSATION:\n${history.map((h) => `${h.who}: ${h.text}`).join('\n')}\n` : ''}
THE CREATOR SAYS TO YOU NOW: "${said}"

Answer in character, the way ${p.name} would actually talk: short, simple, with feeling. Let your attitude toward the Creator show, including doubt, resentment, awe or affection, and questions you have about what the Creator is like. Mention neighbors or memories only if it fits.
Reply with only a JSON object: {"reply": "1 to 3 short sentences", "feeling": integer from -2 to 2 for how this moment changes how you feel about the Creator, "memory": "one short first-person sentence you will remember about this"}`;
}

