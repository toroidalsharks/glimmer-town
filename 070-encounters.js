// ============================================================
// ENCOUNTERS
// ============================================================
function emote(p, ch, secs = 2.4) { p.emote = { ch, until: now + secs }; }
function bubble(p, text, secs, sky = false) { p.bubble = { text, until: now + secs, sky }; if (text && text !== '…' && MODE === 'host' && controls && !offlineSim) { try { if (hearable(p)) Sound.voice(p, text); } catch (e) {} } }
function applyAction(a, b, action) {
  if (action === 'share_food') {
    if (a.hunger < 0.8) { a.hunger = clamp(a.hunger + 0.12, 0, 1); b.hunger = clamp(b.hunger - 0.25, 0, 1); return { text: `${a.name} shared a snack with ${b.name}`, kind: 1 }; }
    return { text: `${a.name} wanted to share but had nothing`, kind: 0 };
  }
  if (action === 'give_coin') {
    if (a.coins > 0) { a.coins--; b.coins++; emote(b, '✦'); return { text: `${a.name} gave ${b.name} a coin`, kind: 1 }; }
    return { text: `${a.name} reached for a coin but had none`, kind: 0 };
  }
  if (action === 'tease') { emote(b, '!'); return { text: `${a.name} teased ${b.name}`, kind: -1 }; }
  if (action === 'walk_away') return { text: `${a.name} walked away from ${b.name}`, kind: -1 };
  if (action === 'ask_for_help') { emote(a, '?'); return { text: `${a.name} asked ${b.name} for help`, kind: 0 }; }
  return { text: `${a.name} chatted with ${b.name}`, kind: 0 };
}
function feel(me, them, delta, quiet = false) {
  if (!them || me === them) return;
  const f = me.feelings[them.id] || { name: them.name, score: 0, note: 'Just met.' };
  f.name = them.name; f.score = clamp(f.score + delta, -10, 10); me.feelings[them.id] = f;
  if (quiet) return;
  if (delta > 0) { emote(me, '♥'); me.happyUntil = now + 6; addJoy(me, 3); }
  if (delta < 0) emote(me, '☁');
  if (f.score >= 3) { me.likes[them.outfit.shirt] = (me.likes[them.outfit.shirt] || 0) + 0.15; if (them.outfit.hat) me.likes['hat:' + them.outfit.hat.id] = (me.likes['hat:' + them.outfit.hat.id] || 0) + 0.15; }
}
const tagFor = (kind, giver) => (kind > 0 ? (giver ? 'gaveKind' : 'gotKind') : kind < 0 ? (giver ? 'wasMean' : 'gotMean') : 'talk');
function canChat(p) {
  if (p.inside || p.state !== 'free' || W.meeting) return false;
  if (W.t >= 0.6 && p.task?.kind !== 'event') return false;
  const k = p.task?.kind;
  if ((k === 'work' || k === 'event') && p.task.phase === 'go') return false;
  return !k || ['stroll', 'visit', 'cafe', 'forage', 'work', 'event'].includes(k);
}
async function encounter(a, b) {
  const rom = a.confessTo === b.id ? 'confess' : a.proposeTo === b.id ? 'propose' : a.breakWith === b.id ? 'breakup' : null;
  if (rom) return romanceScene(a, b, rom);
  const intent = a.makeup === b.id ? 'makeup' : a.befriend === b.id ? 'befriend' : a.confront === b.id ? 'confront' : null;
  spaceOut(a, b);
  if (aiReady() && aiBusy < 2) { if (intent) { a.makeup = null; a.befriend = null; a.confront = null; } await aiEncounter(a, b, intent); }
  else await ruleEncounter(a, b);
  afterChat(a, b); goalAfterEncounter(a, b, intent);
}
async function ruleEncounter(a, b) {
  a.state = b.state = 'talk';
  const place = TOWN[a.path.length ? 'plaza' : a.at]?.name || 'the plaza';
  const secsFor = (s) => 2.4 + s.length / 16;
  try {
    bubble(a, '…', 30);
    const op = specialOpening(a, b) || daydream(a, b, { opening: true });
    await sleep(500);
    bubble(a, op.say, secsFor(op.say));
    await sleep(900);
    const act1 = applyAction(a, b, op.action);
    feel(a, b, op.feeling);
    remember(a, `At ${place} I told ${b.name}: "${op.say}"${act1.kind || op.action !== 'chat' ? ` (${act1.text})` : ''}.`, act1.kind ? 2 : 1, tagFor(act1.kind, true), b.name);
    remember(b, `At ${place}, ${a.name} said "${op.say}"${act1.kind || op.action !== 'chat' ? ` (${act1.text})` : ''}.`, act1.kind ? 2 : 1, op.compliment ? 'compliment' : tagFor(act1.kind, false), a.name);
    if (op.compliment && b.outfit.hat) { b.likes['hat:' + b.outfit.hat.id] = (b.likes['hat:' + b.outfit.hat.id] || 0) + 0.4; b.likes[b.outfit.hat.color] = (b.likes[b.outfit.hat.color] || 0) + 0.3; }
    diary(`<b>${esc(a.name)}</b>: "${esc(op.say)}"${act1.kind || op.action !== 'chat' ? ` <i>(${esc(act1.text)})</i>` : ''}`);
    await sleep(secsFor(op.say) * 1000 - 600);
    if (op.action === 'walk_away') { a.state = 'free'; a.task = null; }
    bubble(b, '…', 30);
    await sleep(500);
    const rep = op.reply || daydream(b, a, { replyTo: op.action, compliment: op.compliment, topic: op.topic, stance: op.stance });
    bubble(b, rep.say, secsFor(rep.say));
    await sleep(900);
    const act2 = applyAction(b, a, rep.action);
    feel(b, a, rep.feeling);
    if (op.topic === 'creator') feel(a, b, rep.feeling, true);
    remember(b, `I answered "${rep.say}"${act2.kind ? ` (${act2.text})` : ''}.`, act2.kind || op.topic ? 2 : 1, op.topic === 'creator' ? (rep.feeling < 0 ? 'creatorFight' : 'creatorTalkOther') : tagFor(act2.kind, true), a.name);
    remember(a, `${b.name} answered "${rep.say}"${act2.kind ? ` (${act2.text})` : ''}.`, act2.kind || op.topic ? 2 : 1, op.topic === 'creator' ? (rep.feeling < 0 ? 'creatorFight' : 'creatorTalkOther') : tagFor(act2.kind, false), b.name);
    diary(`<b>${esc(b.name)}</b>: "${esc(rep.say)}"${act2.kind || rep.action !== 'chat' ? ` <i>(${esc(act2.text)})</i>` : ''}`);
    await sleep(secsFor(rep.say) * 1000 - 600);
    if (rep.action === 'walk_away') b.task = null;
  } finally {
    for (const p of [a, b]) if (p.state === 'talk') p.state = 'free';
    W.pairCool[[a.id, b.id].sort().join('|')] = now + 25 * ts();
  }
}

