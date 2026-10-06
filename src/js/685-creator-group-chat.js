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
  W.creatorChats = (W.creatorChats || 0) + 1;
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
  const asleep = (q) => q.inside && q.task?.kind === 'home' && isNight();
  // people with strong feelings about the Creator are quicker to answer
  const awake = can.filter((q) => !named.includes(q) && !asleep(q)).map((q) => [q, rand() * (1 + Math.abs(q.cr?.score || 0) / 4)]).sort((a, b) => b[1] - a[1]).map(([q]) => q);
  const out = [...named, ...awake.slice(0, 1 + Math.floor(rand() * 3))].slice(0, 4);
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
}
async function chatReplyLine(q) {
  const first = (W.creatorChats || 0) <= 1;
  if (aiReady()) {
    const log = (W.texts || []).filter((m) => m.to === 'town').slice(-14).map((m) => `${m.from === 'creator' ? 'THE CREATOR' : m.fromName}: ${m.text}`).join('\n');
    const mem = await textRecall(q, null, (W.texts || []).filter((m) => m.from === 'creator').slice(-2).map((m) => m.text).join(' '), { noTown: true });
    const prompt = `${voiceCard(q)}${outsideClockContext()}${mem}
${voiceRules()}
THE CREATOR: the being who made ${ISL.name}. They live in The Outside and nobody here has ever seen them. ${q.name} ${attitude(q)[1]}.
${first ? `The Creator just wrote in the ${ISL.name} group chat for the very first time. Nobody knew they could.` : `The Creator writes in the ${ISL.name} group chat sometimes, and just did again.`} The whole town can see it.
THE GROUP CHAT (oldest first):
${log}

Write ${q.name}'s next message in the group chat. Answer the Creator the way ${q.name} really feels about them: ask, tease, argue, gush, confess or react to the others, whatever is true to you. If the Creator asked you something, answer it. Write as much or as little as you would really send. No quotation marks, no name in front.
Reply with only JSON: {"text": "the message", "thought": "what you privately think about the Creator writing here"}`;
    try {
      const r = await llm(prompt, { model: modelOf(q), temperature: 1.0, max: 500, fallbackKey: 'text' });
      if (r?.thought) q.thought = { text: fitLine(String(r.thought), 200), at: Date.now() };
      const t = String(r?.text || '').replace(new RegExp(`^\\s*${voiceEscRe(q.name)}\\s*:\\s*`, 'i'), '').replace(/^["'\s]+|["'\s]+$/g, '');
      if (t) { voiceTrust(t); return t; }
    } catch (e) {}
  }
  const s = q.cr?.score || 0;
  return pickFresh(s <= -2
    ? ['oh great. its them', 'nobody invited u in here', 'k', 'can u not', 'and now the Creator has opinions']
    : first
      ? ['wait. is that the Creator??', 'everyone act normal', 'HELLO??', 'omg hi', 'is this real', 'who added the Creator to the chat', 'i am shaking']
      : s >= 6 ? ['HI!! 🥺', 'missed u', 'ur back!!', 'hi creator!!!'] : ['oh hey', 'lol hi', '👀', 'noted', 'we see u', 'hi creator']);
}
function groupChatBoot() {
  W.added = W.added || {}; if (W.added.groupChat1) return; W.added.groupChat1 = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'You can write in the group chat now (Texts tab, then the group chat). Residents answer in their own voices. They also know the real day and time in The Outside, and long texts are never cut off.');
}
