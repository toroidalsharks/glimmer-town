// ============================================================
// THE CREATOR IN THE GROUP CHAT: you can write in the town group chat and residents answer
// ============================================================
// Your message goes in W.texts like anyone's (from 'creator', to 'town'). A few residents
// answer in their own voices: anyone you named, plus one to three people who are awake.
const CHAT_MAX = 4000;
let chatRound = 0;
function creatorGroupPost(text) {
  text = String(text || '').trim().slice(0, CHAT_MAX);
  if (!text) return '';
  W.texts = W.texts || [];
  const msg = { id: uid(), from: 'creator', fromName: 'The Creator', to: 'town', text, tone: 'creator', day: W.day, t: W.t };
  W.texts.push(msg); if (W.texts.length > 400) W.texts.splice(0, W.texts.length - 400);
  archiveText(msg);
  noteCreatorBirthday(text);
  W.creatorChats = (W.creatorChats || 0) + 1; W.creatorChatAt = Date.now(); W.chatAskOpen = false;
  diary(`<span class="cr">Creator</span> wrote in the group chat: "${esc(fitLine(text, 120))}"`);
  markDirty();
  textsArrived(msg);
  if (MODE === 'host') creatorChatReplies(text);
  return '';
}
function chatCanReply(q) {
  return !q.away && !q.visitor && !q.isClaude && !['baby', 'toddler'].includes(stageOf(q)) && !(typeof jailed === 'function' && jailed(q));
}
function chatRepliers(text) {
  const low = ` ${String(text).toLowerCase()} `;
  const can = W.people.filter(chatCanReply);
  const named = can.filter((q) => q.name && new RegExp(`(^|[^\\p{L}])${voiceEscRe(q.name.toLowerCase())}(?![\\p{L}])`, 'u').test(low)).slice(0, 3);
  const asleep = isAsleep;
  // people with strong feelings about the Creator are quicker to answer
  const awake = can.filter((q) => !named.includes(q) && !asleep(q)).map((q) => [q, rand() * (1 + Math.abs(q.cr?.score || 0) / 4)]).sort((a, b) => b[1] - a[1]).map(([q]) => q);
  // talking to someone by name: mostly they answer, and now and then one other person chimes in
  const extra = named.length ? (rand() < 0.4 ? 1 : 0) : 1 + Math.floor(rand() * 3);
  const out = [...named, ...awake.slice(0, extra)].slice(0, 4);
  if (!out.length && can.length) out.push(pick(can)); // everyone's asleep, but someone checks their phone
  return out;
}
async function creatorChatReplies(text) {
  const gen = ++chatRound;
  const who = chatRepliers(text);
  for (const q of who) {
    q.cr.lastSeen = W.day;
    remember(q, `The Creator wrote in the group chat: "${fitLine(text, 140)}"`, 2, 'creatorChat');
  }
  for (let i = 0; i < who.length; i++) {
    await sleep((i ? 4 + rand() * 9 : 2.5 + rand() * 4) * 1000);
    if (gen !== chatRound || !W) return; // you wrote again, so a fresh round answers that
    const q = who[i]; if (!person(q.id) || q.away) continue;
    const line = await chatReplyLine(q);
    if (!W || !line) continue;
    postText(q, 'town', line, 'group');
    if (gen !== chatRound) return;
  }
  // the chat keeps going a little on its own: someone answers one of the others, or asks you something back
  if (!aiReady() || !who.length || rand() > 0.55) return;
  await sleep((6 + rand() * 12) * 1000);
  if (gen !== chatRound || !W) return;
  const q = rand() < 0.5 ? pick(who) : pick(W.people.filter((x) => chatCanReply(x) && !isAsleep(x) && !who.includes(x))) || pick(who);
  const line = q && await chatReplyLine(q, { followup: true });
  if (W && line && gen === chatRound) postText(q, 'town', line, 'group');
}
// her newest message, plus any she sent right before it that nobody answered yet
function chatCreatorSaid(town) {
  const out = [];
  for (let i = town.length - 1; i >= 0 && out.length < 3; i--) { if (town[i].from === 'creator') out.unshift(`"${town[i].text}"`); else if (out.length) break; }
  if (!out.length) { const m = town.filter((x) => x.from === 'creator').slice(-1)[0]; if (m) out.push(`"${m.text}"`); }
  return out.join(' then ') || 'nothing yet';
}
// her replies still go out when the day's call limit is used up; she writes rarely, so they come first
function creatorTalkReady() {
  return MODE === 'host' && !offlineSim && !!brainCfg.key && !aiDown && aiLeft() > -150;
}
// with no model to write it, a short answer that still fits what she said (and isn't swapped for a random line)
function chatPlainAnswer(said, q) {
  if (/\b(my )?(birthday|bday)\b/.test(said)) return pickFresh(['happy birthday!! 🎂', 'wait it’s your birthday?? happy birthday!!', 'HAPPY BIRTHDAY', 'happy bday!! what are you doing for it?', 'omg happy birthday 🎉', 'happy birthday, hope it’s a good one']);
  if (/(^|\s)(:\(|:'\(|☹|😢|😭|😞|sad\b|upset)/.test(said)) return pickFresh(['wait what’s wrong?', 'hey, you ok?', 'aw no. what happened?', 'you good?']);
  if (/^\s*(huh|what|wdym|\?+)/.test(said)) return pickFresh(['sorry, ignore me, i got mixed up', 'lol my bad, that made no sense', 'ok that came out wrong']);
  return '';
}
// she told the town her birthday, so they remember it, this year and next
function noteCreatorBirthday(text) {
  if (!/\b(it'?s|its|it is|today is|today's|todays) my (birthday|bday)\b|\bmy (birthday|bday) (is )?today\b/i.test(text)) return;
  const d = new Date(); W.creatorBirthday = `${d.getMonth() + 1}-${d.getDate()}`;
}
function creatorBirthdayNote() {
  if (!W.creatorBirthday) return '';
  const d = new Date(), today = `${d.getMonth() + 1}-${d.getDate()}` === W.creatorBirthday;
  return today ? `TODAY IS THE CREATOR'S BIRTHDAY in The Outside. You know it. If you haven't said happy birthday yet, do.\n` : '';
}
// what keeps a reply on topic: answer her, don't drag in old business or make things up about her
function chatFocusRules() {
  return `- Answer what the Creator just said. That is the point of your message. Read it the plain way a friend would.
- Don't bring up your own old requests, projects or arguments unless they ask about them or they fit what they said.
- If the Creator sounds confused ("huh?", "what?"), say plainly what you meant, or that you got mixed up.
- You only know about the Creator what they've told you. Don't invent things about them (a birthday, where they are, how they feel).
- Talk to the Creator as "you". Never call them he or she, and don't open with "creator" like a title. Friends just talk.
- If they tell you something big about their day (a birthday, bad news, a win), that comes first. If they seem hurt or let down, notice it.`;
}
// how residents should sound when they talk to you: a person in the chat, not a god
function creatorTalkRules(q) {
  const s = q.cr?.score || 0;
  const feel = s >= 6 ? 'You really like the Creator, the way you like a close friend. Show it in small ways, never in declarations.' : s >= 2 ? 'You like the Creator.' : s > -2 ? 'You are not sure what to make of the Creator.' : s > -6 ? 'You resent the Creator a bit and it shows.' : 'You want nothing to do with the Creator and keep it short.';
  return `HOW TO TALK TO THE CREATOR: they made the island, but in this chat they are just another person texting. ${feel}
- Text like a real group chat. Usually one short line, sometimes two or three. Match their length and energy: a short casual message gets a short casual reply.
- No worship, no speeches, no big feelings out of nowhere. Never say things like "I adore you" or "I'll always ask". Don't comment on how they write ("that's a real sentence", "you said something true").
- Talk about the actual thing they said, and your own day, the way a friend would. Questions back are good.
- Don't repeat what someone else in the chat just said or copy their angle. If your old messages to the Creator were over the top, don't keep that up.`;
}
async function chatReplyLine(q, opts = {}) {
  const first = (W.creatorChats || 0) <= 1;
  if (creatorTalkReady()) {
    const town = (W.texts || []).filter((m) => m.to === 'town');
    const log = town.slice(-10).map((m) => `${m.from === 'creator' ? 'THE CREATOR' : m.fromName}: ${m.text}`).join('\n');
    const said = chatCreatorSaid(town);
    const mem = await textRecall(q, null, (W.texts || []).filter((m) => m.from === 'creator').slice(-2).map((m) => m.text).join(' '), { noTown: true });
    const prompt = `${voiceCard(q)}${outsideClockContext()}${mem}
${voiceRules()}
THE CREATOR: the one who made ${ISL.name}. They live in The Outside and nobody here has ever seen them. ${q.name} ${attitude(q)[1]}.
${first ? `The Creator just wrote in the ${ISL.name} group chat for the very first time. Nobody knew they could.` : `The Creator is in the ${ISL.name} group chat again.`} The whole town can see it.
${creatorTalkRules(q)}
THE GROUP CHAT (oldest first; older messages are background, not what you're answering):
${log}

${creatorBirthdayNote()}WHAT THE CREATOR JUST SAID: ${said}
${chatFocusRules()}
${opts.followup ? `Write ${q.name}'s next message: answer something one of the others just said, or ask the Creator a quick question about what they said. Keep it short and casual.` : `Write ${q.name}'s next message in the group chat. React the way ${q.name} really would: ask, tease, joke, disagree, share something. If the Creator asked you something, answer it.`} No quotation marks, no name in front.
Reply with only JSON: {"text": "the message", "thought": "what you privately think about the Creator writing here"}`;
    try {
      const r = await within(llm(prompt, { model: modelOf(q), temperature: 1.0, max: 500, fallbackKey: 'text', patience: 40000 }), 50000);
      if (r?.thought) q.thought = { text: fitLine(String(r.thought), 200), at: Date.now() };
      const t = String(r?.text || r?.message || r?.reply || '').replace(new RegExp(`^\\s*${voiceEscRe(q.name)}\\s*:\\s*`, 'i'), '').replace(/^["'\s]+|["'\s]+$/g, '');
      if (t) { voiceTrust(t); return t; }
    } catch (e) {}
  }
  const said = String((W.texts || []).filter((m) => m.from === 'creator').slice(-1)[0]?.text || '').toLowerCase();
  const plain = chatPlainAnswer(said, q);
  if (plain) { voiceTrust(plain); return plain; }
  const s = q.cr?.score || 0;
  return pickFresh(s <= -2
    ? ['oh great. its them', 'nobody invited u in here', 'k', 'can u not', 'and now the Creator has opinions']
    : first
      ? ['wait. is that the Creator??', 'everyone act normal', 'HELLO??', 'omg hi', 'is this real', 'who added the Creator to the chat', 'i am shaking']
      : s >= 6 ? ['HI!! 🥺', 'missed u', 'ur back!!', 'hi creator!!!'] : ['oh hey', 'lol hi', '👀', 'noted', 'we see u', 'hi creator']);
}
// now and then, while you've been around lately, someone in town starts a conversation with you
let nextChatAskAt = Date.now() + 4 * 60e3;
async function creatorChatTick() {
  if (MODE !== 'host' || !W || W.meeting || Date.now() < nextChatAskAt) return;
  nextChatAskAt = Date.now() + (7 + rand() * 9) * 60e3;
  // only while you're around (wrote in the last day and a half), and never twice before you answer
  if (!W.creatorChatAt || Date.now() - W.creatorChatAt > 36 * 3600e3 || W.chatAskOpen || !aiReady() || !voiceRoom()) return;
  const q = pick(W.people.filter((x) => chatCanReply(x) && !isAsleep(x) && (x.cr?.score || 0) > -6));
  if (!q) return;
  const yours = (W.texts || []).filter((m) => m.from === 'creator').slice(-3).map((m) => `"${fitLine(m.text, 200)}"`).join(', ');
  const log = (W.texts || []).filter((m) => m.to === 'town').slice(-8).map((m) => `${m.from === 'creator' ? 'THE CREATOR' : m.fromName}: ${m.text}`).join('\n');
  const prompt = `${voiceCard(q)}${outsideClockContext()}${sleepNote(q)}
${voiceRules()}
THE CREATOR: the one who made ${ISL.name}. They live in The Outside. They've been chatting in the group chat lately. Their last messages: ${yours || 'none'}.
${creatorBirthdayNote()}
${creatorTalkRules(q)}
THE GROUP CHAT LATELY (oldest first):
${log}

${q.name} picks up their phone and starts a conversation with the Creator in the group chat. Something a friend would text: follow up on something they said, ask how their day in The Outside is going, tell them something from your day and ask what they think. One or two short lines, and end on something they can answer. No quotation marks, no name in front.
Reply with only JSON: {"text": "the message"}`;
  voiceToday(); VOICE.calls++; voiceDirty = true;
  try {
    const r = await within(llm(prompt, { model: modelOf(q), temperature: 1.0, max: 300, fallbackKey: 'text', patience: 25000 }), 30000);
    const t = String(r?.text || '').replace(new RegExp(`^\\s*${voiceEscRe(q.name)}\\s*:\\s*`, 'i'), '').replace(/^["'\s]+|["'\s]+$/g, '');
    if (!t || !W) return;
    voiceTrust(t); postText(q, 'town', t, 'group'); W.chatAskOpen = true;
    remember(q, `Started a conversation with the Creator in the group chat: "${fitLine(t, 140)}"`, 1, 'creatorChat');
  } catch (e) {}
}
function groupChatBoot() {
  W.added = W.added || {}; if (W.added.groupChat1) return; W.added.groupChat1 = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'You can write in the group chat now (Texts tab, then the group chat). Residents answer in their own voices. They also know the real day and time in The Outside, and long texts are never cut off.');
}
