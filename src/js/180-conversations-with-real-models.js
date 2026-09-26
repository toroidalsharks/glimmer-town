// ============================================================
// CONVERSATIONS WITH REAL MODELS
// ============================================================
const AI_ACTIONS = ['chat', 'tease', 'insult', 'apologize', 'brag', 'gossip', 'confide', 'ask_for_help', 'share_food', 'give_coin', 'demand', 'lie', 'walk_away'];
let aiBusy = 0;
function aboutThem(me, them) {
  const f = me.feelings[them.id];
  const mine = me.partner && person(me.partner);
  const rel = me.partner === them.id ? (me.married ? `${them.name} is your spouse. You're married.\n` : `You and ${them.name} are dating.\n`) : mine ? `You are ${me.married ? 'married to' : 'dating'} ${mine.name}.\n` : (me.exes || []).includes(them.name) ? `${them.name} is your ex.\n` : '';
  const mem = [...me.past, ...me.today].filter((m) => m.who === them.name || (m.text || '').includes(them.name)).slice(-5).map((m) => `- ${m.text}`).join('\n');
  return rel + `${f ? `You feel ${f.score >= 5 ? 'close to' : f.score >= 2 ? 'warm toward' : f.score > -2 ? 'neutral about' : f.score > -5 ? 'annoyed by' : 'hostile toward'} ${them.name} (${Math.round(f.score)} on -10..10). Your note on them: "${f.note}"` : `You have never really talked to ${them.name}.`}${mem ? `\nWhat you remember about ${them.name}:\n${mem}` : ''}`;
}
function aiLine(me, them, transcript, situation) {
  const recent = me.today.slice(-5).map((m) => `- ${m.text}`).join('\n') || '- nothing much';
  const system = `You are ${me.name}, a small villager in ${ISL.name}, a tiny island town. This is a character simulation with real personalities: ${me.name} can be petty, jealous, stubborn, sarcastic, proud, shy, loving, or wrong, exactly as their history suggests. Never act like an assistant and never lecture. Do not smooth over conflict just to be nice; only soften if something in this conversation earned it. People here hold grudges, keep secrets, gossip, and sometimes lie. Like anyone in a small town, you care where you stand: you may go along with your crowd even when you privately disagree, say different things to different people, and remember who sided with whom. The Creator is only a small, distant part of life here: don't bring them up unless the conversation naturally goes there. Mostly talk about your own life: neighbors, work, food, plans, rumors, the town, and what you want. Keep lines short and natural, the way people actually talk.`;
  const user = `WHO YOU ARE (your own words): ${me.selfNote}
YOUR SECRET WANT (never say it outright unless it helps you): ${me.want?.text || 'nothing in particular'}
BODY: ${bodyFacts(me)}${me.grow < 1 ? ' You are a small child.' : ''}${me.style ? `\nHOW YOU TALK: ${styleOf(me)}` : ''}${me.interests ? `\nYOU'RE INTO: ${me.interests}` : ''}
LIFE: ${me.job ? `works as a ${JOBS[me.job].short}` : 'too young to work'}, ${me.coins} coins, hunger ${Math.round(me.hunger * 100)}%, wearing ${outfitText(me)}.
${cultureContext(me, them)}${avatarContext(me, them)}${readingContext(me)}${classContext(me, them)}${outsideContext(me, them)}${healthContext(me, them)}${goalContext(me)}${crimeContext(me, them)}${recordContext(me)}${socialContext(me, them)}${townRecordContext(me, them)}
THE CREATOR (a distant, unseen being who made the island; rarely relevant): you ${attitude(me)[1].replace(/^is /, 'are ').replace(/^adores/, 'adore').replace(/^likes/, 'like').replace(/^resents/, 'resent').replace(/^wants/, 'want')}.
${aboutThem(me, them)}
${them.name} is wearing ${outfitText(them)}${them.hunger > 0.75 ? ' and looks hungry' : ''}.
SEASON: ${seasonOf().name}, ${W.weather} weather.${isBirthday(me) ? ' Today is YOUR birthday.' : ''}${isBirthday(them) ? ` Today is ${them.name}'s birthday.` : ''}
TODAY SO FAR:
${recent}
${transcript.length ? `\nCONVERSATION SO FAR:\n${transcript.map((l) => `${l.who}: "${l.say}"${l.action !== 'chat' ? ` [${l.action}]` : ''}`).join('\n')}\n` : ''}
SITUATION: ${situation}

Reply with only JSON: {"thought": "what you privately think right now (can differ from what you say)", "say": "what you say out loud, 1-2 short sentences", "action": "one of ${AI_ACTIONS.join(', ')}", "gossip_about": "a name, only if you are gossiping about someone"}`;
  return llm([{ role: 'system', content: system }, { role: 'user', content: user }], { model: modelOf(me), max: 220, fallbackKey: 'say' }).then((r) => (r && r.say ? { thought: String(r.thought || '').slice(0, 240), say: String(r.say).slice(0, 180), action: AI_ACTIONS.includes(r.action) ? r.action : 'chat', gossip: r.gossip_about ? String(r.gossip_about) : null } : null)).catch(() => null);
}
function aiJudge(a, b, transcript, thoughts) {
  const fa = a.feelings[b.id], fb = b.feelings[a.id];
  const prompt = `Two villagers in a small island town just talked. Decide honestly what this conversation changed between them.
${a.name} felt ${fa ? Math.round(fa.score) : 0} toward ${b.name} before (scale -10..10). ${a.name}'s private thoughts: ${thoughts[a.id].join(' / ')}
${b.name} felt ${fb ? Math.round(fb.score) : 0} toward ${a.name} before. ${b.name}'s private thoughts: ${(thoughts[b.id] || []).join(' / ')}
TRANSCRIPT:
${transcript.map((l) => `${l.who}: "${l.say}" [${l.action}]`).join('\n')}

Rules: insults, bragging, demands and lies that land make things worse. Sincere apologies, kindness and real listening make things better. Small talk barely changes anything. Nobody has to end up friends, and grudges can deepen.
Reply with only JSON: {"a_to_b": integer -3..3, "b_to_a": integer -3..3, "a_note": "${a.name}'s one-line opinion of ${b.name} now, in their voice", "b_note": "${b.name}'s one-line opinion of ${a.name} now, in their voice", "rumor": null or {"about": "name of a third person who was talked about", "text": "what was said about them", "tone": -1 or 1}, "diary": "one short narrator sentence about what happened"}`;
  return llm(prompt, { model: badModels.has(brainCfg.judge) ? null : brainCfg.judge, temperature: 0.4, max: 300 }).catch(() => null);
}
function doAct(me, them, line) {
  const act = line.action;
  if (['share_food', 'give_coin', 'ask_for_help', 'tease', 'walk_away'].includes(act)) return applyAction(me, them, act);
  const faces = { insult: [them, '!'], apologize: [me, '💧'], brag: [me, '★'], gossip: [me, '?'], confide: [me, '♥'], demand: [me, '!'] };
  if (faces[act]) emote(faces[act][0], faces[act][1], 2.6);
  return { text: act === 'chat' ? `${me.name} chatted with ${them.name}` : `${me.name} ${{ insult: 'insulted', apologize: 'apologized to', brag: 'bragged to', gossip: 'gossiped with', confide: 'confided in', demand: 'made a demand of', lie: 'told something to' }[act] || 'talked to'} ${them.name}`, kind: ['insult', 'demand'].includes(act) ? -1 : ['apologize', 'confide'].includes(act) ? 1 : 0 };
}
async function aiEncounter(a, b, intent) {
  aiBusy++;
  a.state = b.state = 'talk';
  const place = TOWN[a.path.length ? 'plaza' : a.at]?.name || 'the plaza';
  const T = [], thoughts = { [a.id]: [], [b.id]: [] };
  const say = async (p, text) => { bubble(p, text, 2.8 + text.length / 15); await sleep((2.4 + text.length / 16) * 1000); };
  const log = (p, l, act) => diary(`<b>${esc(p.name)}</b>: "${esc(l.say)}"${l.action !== 'chat' ? ` <i>(${esc(act.text)})</i>` : ''}${l.thought ? ` <span class="th">thinks: ${esc(l.thought)}</span>` : ''}`);
  let spoke = false, fallback = false;
  try {
    const sit = intent === 'makeup' ? `You walk up to ${b.name} at ${place}. You've decided to apologize to them. The Creator nudged you to, but whether you mean it is up to you.`
      : intent === 'confront' ? `You walk right up to ${b.name} at ${place}. You're done staying quiet about what's been going on between you two. You're confronting them, out loud, right now.`
      : intent === 'befriend' ? `You walk up to ${b.name} at ${place}. You're lonely and you want to become friends with them.`
      : `You run into ${b.name} at ${place}.${W.event && W.event.day === W.day && a.task?.kind === 'event' ? ` You're both at ${EVENTS[W.event.id].name}.` : ''}${outsideNudge(a, b)}`;
    bubble(a, '…', 30);
    const l1 = await aiLine(a, b, T, sit);
    if (!l1) throw new Error('no line');
    spoke = true;
    const act1 = doAct(a, b, l1); T.push({ who: a.name, say: l1.say, action: l1.action }); thoughts[a.id].push(l1.thought);
    log(a, l1, act1); await say(a, l1.say);
    if (l1.action !== 'walk_away') {
      bubble(b, '…', 30);
      const l2 = await aiLine(b, a, T, `${a.name} came up to you at ${place} and said: "${l1.say}"${l1.action !== 'chat' ? ` (${act1.text})` : ''}. Answer them.`);
      if (l2) {
        const act2 = doAct(b, a, l2); T.push({ who: b.name, say: l2.say, action: l2.action }); thoughts[b.id].push(l2.thought);
        log(b, l2, act2); await say(b, l2.say);
        if (l2.action !== 'walk_away' && (rand() < 0.55 || ['insult', 'tease', 'demand', 'apologize'].includes(l2.action))) {
          bubble(a, '…', 30);
          const l3 = await aiLine(a, b, T, `${b.name} answered: "${l2.say}". Say one last thing, or walk away.`);
          if (l3) { const act3 = doAct(a, b, l3); T.push({ who: a.name, say: l3.say, action: l3.action }); thoughts[a.id].push(l3.thought); log(a, l3, act3); await say(a, l3.say); }
        }
      }
    }
    const v = await aiJudge(a, b, T, thoughts);
    const da = clamp(Math.round(Number(v?.a_to_b) || 0), -3, 3), db = clamp(Math.round(Number(v?.b_to_a) || 0), -3, 3);
    feel(a, b, da); feel(b, a, db);
    if (v?.a_note && a.feelings[b.id]) a.feelings[b.id].note = String(v.a_note).slice(0, 200);
    if (v?.b_note && b.feelings[a.id]) b.feelings[a.id].note = String(v.b_note).slice(0, 200);
    const quote = T.map((l) => `${l.who}: "${l.say}"`).join(' ');
    const tagA = da <= -1 ? 'gotMean' : da >= 1 ? 'gotKind' : 'talk', tagB = db <= -1 ? 'gotMean' : db >= 1 ? 'gotKind' : 'talk';
    remember(a, `At ${place} with ${b.name}: ${quote}`.slice(0, 400), 1 + Math.abs(da), intent === 'makeup' && da > 0 ? 'apologized' : intent === 'befriend' && da > 0 ? 'newFriend' : tagA, b.name);
    remember(b, `At ${place} with ${a.name}: ${quote}`.slice(0, 400), 1 + Math.abs(db), intent === 'makeup' && db > 0 ? 'gotApology' : tagB, a.name);
    if (v?.rumor?.about) {
      const target = W.people.find((q) => q.name.toLowerCase() === String(v.rumor.about).toLowerCase());
      if (target && target !== a && target !== b) { const tone = Number(v.rumor.tone) < 0 ? -1 : 1; feel(b, target, tone, true); remember(b, `${a.name} told me about ${target.name}: ${String(v.rumor.text).slice(0, 160)}`, 2, 'rumor', target.name); }
    }
    if (v?.diary) diary(`<i>${esc(String(v.diary).slice(0, 220))}</i>`);
    if (da > 0) addJoy(a, 3 + da * 2); if (db > 0) addJoy(b, 3 + db * 2);
    if (intent === 'makeup' && da > 0 && db > 0) { addJoy(a, 20); addJoy(b, 10); }
  } catch (e) {
    if (!spoke) fallback = true;
  } finally {
    aiBusy = Math.max(0, aiBusy - 1);
    for (const p of [a, b]) if (p.state === 'talk' && !p.heldByDlg) p.state = 'free';
    if (!fallback) W.pairCool[[a.id, b.id].sort().join('|')] = now + 60 * ts();
  }
  if (fallback) return ruleEncounter(a, b);
}
async function aiReflect(p, T) {
  const names = [...new Set(T.map((m) => m.who).filter(Boolean))];
  const r = await llm([{ role: 'system', content: `You are ${p.name}, a villager in ${ISL.name}. Stay in character. You are not an assistant.` }, { role: 'user', content: `It's night on day ${W.day}. You're lying in bed in room ${p.room + 1}, thinking over your day.

WHO I THOUGHT I WAS THIS MORNING: ${p.selfNote}
MY SECRET WANT: ${p.want?.text || 'none yet'}
HOW I FEEL ABOUT THE CREATOR: ${attitude(p)[1]}.${townRecordContext(p, null)}

TODAY:
${T.map((m, i) => `${i}. ${m.text}`).join('\n')}

1. Rewrite, in first person and under 60 words, who you are now. Change only what today gave you a reason to change. It's fine if nothing changes. Keep grudges and hopes that still matter.
2. For each person you dealt with today (${names.join(', ') || 'no one'}), write one honest line about how you see them now.
3. Pick up to 2 memories from today, by number, that you'll carry forever.
4. If today changed what you secretly want, write your new secret want. Otherwise leave it empty.

Reply with only JSON: {"self": "...", "people": {"Name": "line"}, "keep": [numbers], "want": ""}` }], { model: modelOf(p), max: 500 }).catch(() => null);
  return r && r.self ? r : null;
}
function finishReflection(p, r, T) {
  p.selfNote = String(r.self).slice(0, 520);
  for (const f of Object.values(p.feelings)) if (r.people?.[f.name]) f.note = String(r.people[f.name]).slice(0, 200);
  for (const i of r.keep || []) if (T[i] && !p.past.some((x) => x.text === T[i].text)) p.past.push({ day: W.day, text: T[i].text, weight: 3 });
  for (const m of T) if (m.weight >= 2 && !p.past.some((x) => x.text === m.text)) p.past.push({ day: W.day, text: m.text, weight: m.weight });
  p.past = p.past.sort((x, y) => y.weight - x.weight || y.day - x.day).slice(0, 24);
  if (r.want && String(r.want).trim().length > 3) p.want = { text: String(r.want).slice(0, 140).replace(/^to /i, 'to ') };
}

