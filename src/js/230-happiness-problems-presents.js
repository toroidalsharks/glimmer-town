// ============================================================
// HAPPINESS, PROBLEMS & PRESENTS
// ============================================================
const PROB_ICON = { gift: '🎁', hungry: '🍙', wish: '✨', fight: '⚡', lonely: '💧', sick: '🤒', hurt: '🩹', low: '🌧' };
function problemOf(p) {
  if (p.pendingGift) return { kind: 'gift' };
  if (p.hunger > 0.72) return { kind: 'hungry' };
  { const hp = healthProblem(p); if (hp) return hp; }
  if (p.cr.wish) return { kind: 'wish' };
  const g = Object.entries(p.feelings).filter(([id, f]) => f.score <= -5 && person(id)).sort((a, b) => a[1].score - b[1].score)[0];
  if (g && !p.makeup) return { kind: 'fight', who: g[0] };
  if (W.day - p.bornDay >= 2 && p.grow >= 1 && !Object.values(p.feelings).some((f) => f.score >= 3) && !p.befriend) return { kind: 'lonely' };
  return null;
}
function addJoy(p, n) {
  p.joy = (p.joy || 0) + n; p.level = p.level || 1;
  while (p.joy >= 100) {
    p.joy -= 100; p.level++; p.pendingGift = true; Sound.levelup();
    emote(p, '★', 4); bubble(p, pick(['I leveled up!', 'I feel so happy today!']), 3, true);
    diary(`<b>${esc(p.name)}</b> reached level ${p.level}! They have a present for you.`);
    remember(p, `I felt so happy that I reached level ${p.level}.`, 2, 'levelUp');
  }
}
function claimPresent(p) {
  if (!p.pendingGift) return null;
  p.pendingGift = false;
  const color = bestBy(Object.keys(COLORS), (c) => (p.likes[c] || 0) * 1.5);
  let it;
  if (p.job === 'clothes') it = newItem('hat', bestBy(Object.keys(HATS), (h) => p.likes['hat:' + h] || 0), color, p.id, 2);
  else if (p.job === 'mart' || p.job === 'cafe') { const fav = Object.entries(p.tastes).filter(([k]) => foodById(k).shop === p.job).sort((a, b) => b[1] - a[1])[0]; it = newItem('food', fav ? fav[0] : pick(FOODS.filter((x) => x.shop === p.job)).id, null, p.id, 1); }
  else if (p.job === 'garden') it = newItem('decor', rand() < 0.5 ? 'bouquet' : 'plant', color, p.id, 2);
  else if (p.job === 'pier') it = newItem('decor', 'fishbowl', color, p.id, 2);
  else it = newItem('decor', bestBy(NOOK_MADE, (d) => p.body.decorAff[d] || 0), color, p.id, 2);
  W.creator.items.push(it);
  creatorShift(p, 0.6);
  remember(p, `I gave the Creator ${a_an(itemName(it))} that I made myself.`, 3, 'gaveCreator');
  diary(`<b>${esc(p.name)}</b> gave <span class="cr">the Creator</span> ${a_an(esc(itemName(it)))}.`);
  return it;
}
function specialOpening(a, b) {
  if (a.makeup === b.id) {
    a.makeup = null;
    const forgive = (b.feelings[a.id]?.score ?? 0) > -8 || rand() < 0.3;
    remember(a, `I apologized to ${b.name}.`, 3, 'apologized', b.name); remember(b, `${a.name} came and apologized to me.`, 3, 'gotApology', a.name);
    diary(`<b>${esc(a.name)}</b> apologized to <b>${esc(b.name)}</b>. ${forgive ? 'They made up.' : "It didn't go well."}`);
    if (forgive) { addJoy(a, 25); addJoy(b, 10); }
    return { say: pick(["I'm sorry about before. Can we start over?", "Hey… I'm sorry. I mean it."]), action: 'chat', feeling: 4, reply: forgive ? { say: pick(['…Okay. I forgive you.', "Thanks for saying that. Let's be friends again."]), action: 'chat', feeling: 5 } : { say: "Hmph. I'll think about it.", action: 'chat', feeling: 1 } };
  }
  if (a.befriend === b.id) {
    a.befriend = null;
    const ok = (b.feelings[a.id]?.score ?? 0) > -3;
    remember(a, `I asked ${b.name} to be friends.`, 3, ok ? 'newFriend' : 'rejected', b.name);
    if (ok) { remember(b, `${a.name} asked to be my friend.`, 2, 'newFriend', a.name); addJoy(a, 25); diary(`<b>${esc(a.name)}</b> asked <b>${esc(b.name)}</b> to be friends, and they said yes.`); }
    return { say: pick([`Hi ${b.name}! Um… want to be friends?`, 'Can I hang out with you sometimes?']), action: 'chat', feeling: 3, reply: ok ? { say: pick(["Sure! I'd like that.", 'Of course! Friends!']), action: 'chat', feeling: 4 } : { say: '…No thanks.', action: 'walk_away', feeling: -1 } };
  }
  const cf = confrontOpening(a, b); if (cf) return cf;
  const mo = miliOpening(a, b); if (mo) return mo;
  const co = claudeOpening(a, b); if (co) return co;
  const bo = bookOpening(a, b); if (bo) return bo;
  { const oo = outsideOpening(a, b); if (oo) return oo; }
  const clo = classOpening(a, b); if (clo) return clo;
  if (isBirthday(b) && !a.today.some((m) => m.tag === 'wishedBday' && m.who === b.name) && (a.feelings[b.id]?.score ?? 0) > -2) {
    remember(a, `Wished ${b.name} a happy birthday.`, 1, 'wishedBday', b.name); remember(b, `${a.name} wished me a happy birthday.`, 1, 'gotBday', a.name); feel(b, a, 0.4, true);
    return { say: pick([`Happy birthday, ${b.name}!`, `Hey, birthday ${b.name}!`, "It's your birthday! Are you older and wiser now?"]), action: 'chat', feeling: 3, reply: { say: pick(['Thank you!! Hehe.', 'You remembered!', "Don't make it a big deal… thanks though."]), action: 'chat', feeling: 3 } };
  }
  return null;
}

