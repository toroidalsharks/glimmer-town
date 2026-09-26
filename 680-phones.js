// ============================================================
// PHONES: slower, real conversations built from what actually happened
// ============================================================
const TOPIC_OF = {
  fight: 'fight', defended: 'defended', wasDefended: 'wasDefended', laughedAt: 'laughedAt', hug: 'sweet', cuddle: 'sweet', handhold: 'sweet',
  hangout: 'hangout', date: 'date', stoodUp: 'stoodUp', couple: 'couple', heartbreak: 'heartbreak', engaged: 'engaged', married: 'married', wedding: 'wedding',
  work: 'work', quit: 'quit', levelUp: 'happy', creatorGift: 'creator', wishGranted: 'creator', bdayCreator: 'creator', creatorGrown: 'creator', wishLost: 'sad',
  bdayGift: 'birthday', birthday: 'birthday', snowman: 'snowman', arcade: 'arcade', gossipLove: 'gossip', jealousLove: 'jealous', miliRumor: 'mili', miliTalk: 'mili',
  claudeUpdate: 'claude', bullied: 'bullied', hungry: 'hungry', sick: 'sick', event: 'event', newcomer: 'newcomer', won: 'happy', apologized: 'madeup', gotApology: 'madeup',
  hug2: 'sweet', confessedTo: 'gossip', breakup: 'breakup', notYet: 'sad', helpedCreator: 'random', fishing: 'random', outside: 'outside', laptopEnvy: 'laptop', laptopGot: 'laptopgot', hurt: 'sick', uproar: 'uproar',
};
const SAD = ['fight', 'laughedAt', 'stoodUp', 'heartbreak', 'sad', 'bullied', 'sick', 'breakup', 'hungry'];
const HAPPY = ['wasDefended', 'sweet', 'date', 'couple', 'engaged', 'married', 'wedding', 'happy', 'creator', 'birthday', 'hangout', 'madeup', 'event', 'snowman'];
const lc = (s) => String(s || '').replace(/[.!]+$/, '').replace(/^I /, 'i ').replace(/\bI\b/g, 'i').replace(/^([A-Z])/, (c) => c.toLowerCase());
const firstName = (s) => String(s || 'someone');
const interestOf = (p) => { const L = String(p.interests || '').split(/,|\band\b/).map((x) => x.trim().replace(/\(.*?\)/g, '')).filter((x) => x && x.length < 40); return L.length ? pick(L) : null; };
function recentTextSet() { return new Set((W.texts || []).slice(-90).map((m) => m.text.toLowerCase())); }
function pickFresh(list) {
  const used = recentTextSet(), fresh = list.filter((x) => x && !used.has(String(x).toLowerCase()));
  return pick(fresh.length ? fresh : list.filter(Boolean));
}
function pickTopic(a, b) {
  const mems = (a.today || []).filter((m) => !m.texted && (m.weight >= 2 || TOPIC_OF[m.tag]) && !['arrived', 'text', 'texted'].includes(m.tag) && !String(m.tag).startsWith('text'));
  const aboutB = mems.filter((m) => m.who === b.name);
  const pool = aboutB.length && rand() < 0.5 ? aboutB : mems;
  if (pool.length && rand() < 0.8) { const m = pick(pool.slice(-8)); m.texted = true; return { kind: TOPIC_OF[m.tag] || 'mem', mem: m, who: m.who }; }
  if (a.partner === b.id) return { kind: pick(['miss', 'plans', 'miss', 'wonder', 'random']) };
  if (!a.partner && !a.noRomance && fscore(a, b) >= 6.5 && !b.partner) return { kind: 'crush' };
  if (fscore(a, b) <= -4) return { kind: 'beef' };
  return { kind: (a.seen || []).length && rand() < 0.25 ? 'outside' : (a.read || []).length && rand() < 0.3 ? 'book' : pick(['interest', 'interest', 'food', 'job', 'weather', 'wonder', 'random', 'plans', 'claude']) };
}
function opener(a, b, T) {
  const who = firstName(T.who), m = T.mem ? lc(T.mem.text) : '', me = b.name.toLowerCase();
  const withB = T.who === b.name;
  const L = {
    fight: [`${m} today. still shaking honestly`, `ok so ${m}`, `dont be mad but ${m}`, `${who.toLowerCase()} and i got into it today`, 'today was so bad'],
    defended: [`i stood up for someone today. my heart is still racing`, `${m}. i'd do it again`],
    wasDefended: [`${who.toLowerCase()} stood up for me today 🥺`, `did u see ${who.toLowerCase()} defend me??`],
    laughedAt: [`${who.toLowerCase()} laughed at me today. right in front of me`, 'do people think im a joke'],
    sweet: withB ? ['thanks for today', 'that was nice earlier', 'still thinking about earlier 🥺', 'u give good hugs btw'] : [`${m} and i cant stop smiling`, `ok so ${m} 😳`],
    hangout: withB ? ['that was so fun. ur room is cute', 'same time next week?'] : [`${m}!!`, 'had the best night'],
    date: withB ? ['i had fun today', 'same spot tomorrow?', 'u looked really nice today'] : [`guess who went on a date 👀`, `${m}!!`],
    stoodUp: [`${who.toLowerCase()} didnt show up. i waited forever`, 'got stood up lol. its fine'],
    couple: [`so. ${who.toLowerCase()} and i are dating now`, 'guess who has a partner now 😳', `${m}!!!`],
    heartbreak: [`i told ${who.toLowerCase()} how i feel. they said no`, 'dont ask about today pls'],
    breakup: [`${m}`, 'its over with them. i dont want to talk about it. ok maybe i do'],
    engaged: ['IM ENGAGED', `${m}!!!!`], married: ['i got MARRIED today', 'still cant believe it. married!!'], wedding: ['that wedding was so cute', 'i cried at the wedding ok'],
    work: [`work was ${pick(['long', 'weirdly fun', 'so boring', 'actually nice', 'chaos'])} today`, `${m} lol`],
    quit: ['i quit my job. dont tell anyone yet', `${m}. new start i guess`],
    happy: ['today was SO good', 'best day ever honestly', 'im in such a good mood rn'],
    creator: ['the creator gave me something today??', `${m}. what does that even mean`, 'do u think the creator likes me'],
    sad: ['kind of a bad day', `${m}. whatever`, 'i dont want to talk about it but also i do'],
    birthday: ['BIRTHDAY GIFT CHECK', `${m} 🥺`],
    snowman: ['i built a snowman. his name is gerald', 'come see my snowman before it melts'],
    arcade: ['new high score 😤', 'lost all my coins at the arcade lol'],
    gossip: withB ? ['wait is it true??', 'ok so i heard something about u 👀'] : [`did u hear?? ${m.replace(/^i heard /, '')}`, `ok apparently ${m.replace(/^i heard /, '')}`],
    jealous: withB ? ['who was that today', 'so. who was that', 'are we ok?'] : [`i saw ${who.toLowerCase()} with someone today. its fine. whatever`, 'am i allowed to be jealous'],
    mili: isMili(b) ? ['can i ask u something weird', 'what does the island look like from up there', 'do u remember making the fountain'] : ['been thinking about mili again. like what she IS', 'do u think mili knows what were thinking', 'if mili is the creator who were we praying to'],
    claude: ['did u see what claude added', 'claude changed stuff again overnight lol', 'does claude ever sleep. is that a thing for ai'],
    bullied: ['someone keeps being mean to me', 'can u come sit with me', `${m}. i didnt even do anything`],
    hungry: ['im starving', 'do u have snacks', 'no coins. so hungry'],
    sick: m ? [`${m} ugh`, 'stuck in bed. entertain me', 'i feel so gross today', `update: ${m}`] : ['sick again. mornings suck', 'feel so gross today'],
    laptop: hasLaptop(b) ? ['can i borrow ur laptop for like 5 min', 'whats happening on the outside rn. pls. i have no laptop', 'u are so lucky u have a laptop'] : ['saving up for a laptop. do not let me buy anything', `i have ${a.coins} coins. ${a.saving ? `only ${Math.max(0, a.saving.goal - a.coins)} to go` : 'its hopeless'}`, 'everyone with a laptop is so annoying about the outside'],
    uproar: ['did u see what happened at the fountain', `${m}`, 'i cant believe today', 'ok that uproar was INSANE', 'are we still talking about the fountain thing'],
    laptopgot: ['I GOT A LAPTOP', 'guess who can read the outside now 😌', 'laptop acquired. ask me anything about the outside'],
    event: ['that was fun today!!', `${m}!`], newcomer: withB ? ['hi! welcome to the island 👋', `hey its ${a.name.toLowerCase()}. from the plaza`, 'welcome!! the bakery is the best btw'] : [`have u met ${who.toLowerCase()} yet`, 'theres a new person'],
    madeup: [`${m}. feels better`, 'we made up!!'],
    mem: [m, `so today ${m}`, `${m} lol`],
    outside: (() => { const own = (a.seen || []).slice(-3), q0 = (T.mem?.text.match(/"([^"]+)/) || [])[1], q = q0 && q0.length > 18 ? q0 : null; const s = own.length && rand() < 0.6 ? pick(own) : null; if (s) return [`ok the Outside is wild. "${s.text.slice(0, 80)}"`, `did u see this on the Outside. ${lcFirst(s.react)}`, `cant stop thinking about this: "${s.text.slice(0, 80)}"`]; if (q) return [`did u hear?? "${q.slice(0, 80)}"`, `ok apparently on the outside "${q.slice(0, 70)}". thoughts??`]; return ['have u been on the Outside yet', 'the outside is so much today']; })(),
    book: (() => { const r = pick(a.read || [{}]), B = BOOKS[r.id]; return B ? [`reading "${B.title.toLowerCase()}" and apparently ${lcFirst(pick(r.learned))}`, `ok "${B.title.toLowerCase()}" is so good. ${lcFirst(r.take)}`, `u should read ${B.title.toLowerCase()}. trust me`] : ['reading a book rn']; })(),
    miss: ['miss u', 'what r u doing rn', 'thinking about u', 'come find me later?', 'hi you'],
    plans: ['what r we doing tmr', 'wanna go to the pier later', 'bakery date?', 'arcade after work?'],
    crush: ['hi', 'hey what r u up to', `random but i like ur ${pick(['hat', 'shirt', 'laugh', 'voice'])}`, 'is it weird that i texted u'],
    beef: ['u know what u did', 'stay away from me tmr', 'so we are just ignoring what happened?'],
    interest: (() => { const i = interestOf(a); return i ? [`have u ever gotten into ${i}?`, `i cant stop thinking about ${i}`, `ok ${i} tangent incoming`] : ['what do u even do for fun']; })(),
    food: (() => { const f = favoriteFood(a); return f ? [`i could go for ${f} rn`, `have u tried the ${f}`, `${f} is elite. thats it thats the text`] : ['what should i eat']; })(),
    job: [a.job ? `the ${JOBS[a.job].short} life is exhausting` : 'what do u do all day', 'how was work'],
    weather: W.weather === 'rain' ? ['its POURING', 'rain day. staying in'] : W.weather === 'snow' ? ['SNOW', 'my toes are frozen'] : W.weather === 'storm' ? ['the thunder is so loud', 'r u ok in this storm'] : [`${seasonOf().name.toLowerCase()} is the best season fight me`, 'its so nice out'],
    wonder: ["do u ever think about what's past the water", 'do u think the creator is watching rn', 'what do u want to be doing a year from now', 'do u think we dream the same dreams'],
    random: ['whats up', 'bored', 'guess what', isNight() ? 'u up?' : 'hiii'],
  };
  return pickFresh(L[T.kind] || L.mem);
}
function replyLine(b, a, T, turn) {
  const f = fscore(b, a), warm = f >= 2, cold = f <= -2, k = T.kind;
  if (turn >= 3) return pickFresh(warm ? ['ok ttyl', 'hehe', 'yes!!', 'gn 🌙', 'love that', '👍'] : ['k', 'fine', 'ok', 'bye']);
  if (turn === 2) {
    const own = (b.today || []).filter((m) => (m.weight >= 2) && !String(m.tag).startsWith('text') && !['arrived', 'newcomer', 'miliRumor', 'miliTalk'].includes(m.tag) && m.who !== a.name && !String(m.text).includes(a.name)).slice(-3);
    if (own.length && rand() < 0.35) return `also ${lc(pick(own).text)}`;
    return pickFresh(SAD.includes(k) ? (warm ? ['thanks. means a lot', 'ok. yeah. thanks', 'i might take u up on that'] : ['nvm', 'forget it']) : HAPPY.includes(k) ? ['hehe', 'ok im still smiling', 'tell u more tmr'] : ['anyway', 'lol ok', 'wanna hang tmr?', 'ok back to work', 'ttyl']);
  }
  if (SAD.includes(k)) return pickFresh(cold ? ['ok?', 'sounds like a u problem', 'lol'] : warm ? ['wait are u ok??', 'omg what happened', 'want me to come over?', 'im so sorry', 'who do i need to fight'] : ['oh no', 'that sucks']);
  if (HAPPY.includes(k)) return pickFresh(cold ? ['cool', 'k', 'good for u i guess'] : ['NO WAY', 'omg tell me everything', 'thats so cute', 'im so happy for u', 'STOP 🥺']);
  const R = {
    gossip: ['WAIT what', 'no way', 'who told u', 'thats none of our business… but tell me'],
    jealous: warm ? ['u are allowed to feel that', 'want me to spy'] : ['not my problem'],
    mili: isMili(b) ? ['…i dont know. honestly', 'not really? sometimes a little', 'why does everyone ask me that 😭', 'really small. and kind of pretty'] : { reverent: ['we shouldnt talk about her like that', 'shes sacred ok'], wary: ['honestly same. careful what u say around her', 'i dont trust it'], resentful: ['she gets everything. its weird', 'ya its kinda unfair'], curious: ['i think about it ALL the time', 'we should ask her'], indifferent: ['shes just mili tho', 'i think ur overthinking it'] }[miliView(b)] || ['hmm'],
    claude: { grateful: ['i love the new stuff honestly', 'claude is kind of sweet for an ai'], creeped: ['an ai rearranging our town while we sleep. normal', 'it creeps me out ngl'], curious: ['i wonder what claude thinks about', 'do u think claude can see this'], philosophical: ['who told claude what to build. the creator? so who made US', 'ai builds the island, creator builds the ai… wait'], shrug: ['neat i guess', 'didnt notice tbh'] }[claudeView(b)] || ['huh'],
    miss: ['miss u too', 'omw', 'hehe hi', 'thinking about u too'],
    plans: ['yes!!', 'cant tmr :(', 'only if u pay lol', 'deal'],
    crush: f >= 6 ? ['hi!! 😳', 'hehe not weird at all', 'u too tbh'] : f >= 2 ? ['haha hi', 'thanks?', 'whats up'] : ['?', 'who is this'],
    beef: ['whatever', 'u started it', 'fine', 'can we just talk?'],
    interest: ['lol same', 'i dont get it but go off', 'ok explain', 'thats so u'],
    food: ['omg yes', 'eh', 'ur paying', 'now im hungry'],
    job: ['work is work', 'mine too honestly', 'lol quit'],
    weather: ['ikr', 'stay dry', 'its so pretty tho'],
    wonder: ['sometimes', 'thats deep for a tuesday', 'i try not to', 'honestly? yeah'],
    random: ['nm u', 'same', 'what', 'hi'],
    outside: warm ? ['the Outside is so weird', 'WHAT', 'how is that real', 'i saw that too', 'thats so heavy', 'how do they live like that out there', ...(hasLaptop(b) ? ['send me the link'] : ['must be nice having a laptop', 'i wish i could read it myself'])] : ['ok and', 'who cares about the outside', 'i dont trust the Outside', 'k'],
    book: ['nerd 💕', 'can i borrow it', 'wait thats actually cool', 'thats not true is it??', 'add it to my list'],
    laptop: hasLaptop(b) ? (warm ? ['ok fine. 5 minutes', 'u can come over and use it', 'save up!! u got this'] : ['get ur own', 'no lol']) : ['same honestly', 'we should pool our coins', 'ur so close!!', 'the outside isnt even that great. (i wish i knew)'],
    uproar: warm ? ['i heard!! are u ok', 'whose side were u on', 'everyone is talking about it', 'u were right btw', 'that got so out of hand'] : ['u were so embarrassing', 'whatever', 'ur side was wrong and u know it'],
    laptopgot: warm ? ['NO WAY', 'can i use it', 'ur so lucky', 'finally!!'] : ['cool', 'must be nice'],
    newcomer: T.who === b.name ? ['hi!! thank u', 'thank u 🥺 whats good here', 'hi. sorry, im shy'] : ['not yet! whats their deal', 'yeah they seem nice', 'who??'],
    mem: warm ? ['wait really', 'lol', 'how was it', 'thats so random'] : cold ? ['k', 'ok', 'and?'] : ['oh nice', 'lol', 'huh', 'wait really', 'ok cool'],
  };
  return pickFresh(R[k] || R.mem);
}
function textThreadKey(a, b) { return b === 'town' ? 'town' : [a, b].sort().join('|'); }
let nextConvoAt = 45, nextGroupAt = 120, lastGoodnightDay = {};
const convos = [];
function postText(from, toId, text, tone, T) {
  text = String(text || '').replace(/^["']|["']$/g, '').trim().slice(0, 180); if (!text) return null;
  W.texts = W.texts || [];
  const msg = { id: uid(), from: from.id, fromName: from.name, to: toId, text, tone, day: W.day, t: W.t };
  W.texts.push(msg); if (W.texts.length > 400) W.texts.splice(0, W.texts.length - 400);
  if (!from.inside) emote(from, '📱', 2.5);
  const to = toId !== 'town' && person(toId);
  if (to) {
    if (!to.inside) setTimeout(() => emote(to, '📱', 2.5), 900);
    const eff = { bully: -1.1, beef: -0.4, jealous: -0.2, sweet: 0.3, miss: 0.3, crush: 0.3, support: 0.5 }[tone] ?? 0.05;
    feel(to, from, eff, true);
    if (tone === 'bully') { remember(to, `${from.name} texted me: "${text}"`, 3, 'bullied', from.name); to.joy = Math.max(0, (to.joy || 0) - 5); if ((to.today || []).filter((m) => m.tag === 'bullied').length >= 2 && rand() < 0.5) fileCase('bully', to, from); }
  }
  markDirty();
  if (activeTab === 'texts' && !sheet.hidden) refreshPanel(false);
  return msg;
}
function toneFor(a, b, T) {
  if (T.kind === 'bully') return 'bully';
  const f = fscore(a, b);
  if (T.kind === 'beef' || f <= -4) return 'beef';
  if (a.partner === b.id || T.kind === 'miss') return 'miss';
  if (T.kind === 'crush') return 'crush';
  return f >= 4 ? 'sweet' : 'chat';
}
async function aiText(from, to, T, transcript, replying) {
  if (!(aiReady() && aiBusy < 2)) return null;
  const topic = T.mem ? `what happened: ${T.mem.text}` : { miss: 'you miss them', plans: 'making plans', crush: 'you have a crush on them and are nervous', beef: 'you are angry at them', bully: 'you want to be mean to them (PG, no slurs)', wonder: 'a big random thought', claude: 'the AI named Claude that keeps changing the island', mili: 'what Mili really is', interest: `something you're into: ${interestOf(from) || 'anything'}`, jealous: 'you felt jealous today' }[T.kind] || T.kind;
  try {
    const l = await aiLine(from, to, [], `You are TEXTING ${to.name} on your phone, not talking in person. ${replying ? 'Reply to their last message.' : `Start a text about ${topic}.`}${transcript.length ? `\nThe texts so far:\n${transcript.map((m) => `${m.fromName}: ${m.text}`).join('\n')}` : ''}\nWrite ONE short text message the way you personally text (lowercase is fine, emoji only if that is you). Say something specific and real, not generic. No quotation marks.`);
    return l && l.say ? l.say : null;
  } catch (e) { return null; }
}
async function startConvo(a, b, T) {
  if (!a || !b || a === b || a.away || b.away || convos.some((c) => c.a === a || c.b === a)) return;
  T = T || pickTopic(a, b);
  const c = { a, b, T }; convos.push(c);
  const transcript = [];
  try {
    const turns = T.kind === 'bully' ? (rand() < 0.5 ? 1 : 2) : 2 + Math.floor(rand() * 3);
    for (let i = 0; i < turns; i++) {
      const [s, r] = i % 2 ? [b, a] : [a, b];
      if (i) await sleep((5 + rand() * 12) * 1000);
      if (!W || s.away) break;
      if (s.inside && s.task?.kind === 'home' && (W.t >= 0.68 || W.t < 0.01) && i) break;
      let text = await aiText(s, r, T, transcript, i > 0);
      if (!text) text = i === 0 ? (T.kind === 'bully' ? pickFresh(['nobody likes u btw', 'saw u eating alone again lol', 'why do u even talk', 'ur so weird its embarrassing', 'no one asked']) : opener(s, r, T)) : replyLine(s, r, T, i);
      const msg = postText(s, r.id, text, i === 0 ? toneFor(a, b, T) : (SAD.includes(T.kind) && fscore(s, r) >= 2 ? 'support' : fscore(s, r) <= -3 ? 'beef' : 'chat'), T);
      if (msg) transcript.push(msg);
      if (T.kind === 'bully' && i === 0 && rand() > 0.5) break;
    }
    if (transcript.length) {
      const gist = T.mem ? T.mem.text : `${T.kind === 'miss' ? 'missing each other' : T.kind}`;
      remember(b, `Texted with ${a.name}. ${a.name} said: "${transcript[0].text}"`, SAD.includes(T.kind) || HAPPY.includes(T.kind) ? 2 : 1, 'textThread', a.name);
      remember(a, `Texted ${b.name} about ${String(gist).slice(0, 80)}.`, 1, 'textThread', b.name);
      if (T.kind === 'bully') {
        const bf = Object.entries(b.feelings).filter(([id, f]) => f.score >= 4 && id !== a.id && person(id) && !person(id).away).sort((x, y) => y[1].score - x[1].score)[0];
        if (bf && rand() < 0.6) { const friend = person(bf[0]); setTimeout(() => startConvo(b, friend, { kind: 'bullied', who: a.name, mem: { text: `${a.name} keeps texting me mean stuff` } }), 12000); setTimeout(() => startConvo(friend, a, { kind: 'beef', who: b.name }), 30000); }
      }
    }
  } finally { convos.splice(convos.indexOf(c), 1); }
}
function sendText(from, to, tone) {
  if (to === 'town') return groupPost(from);
  const kind = tone === 'jealousPartner' || tone === 'jealous' ? 'jealous' : tone === 'bully' ? 'bully' : tone === 'patch' ? 'claude' : tone;
  startConvo(from, to, { kind, who: to && to.name });
}
function groupPost(a) {
  const others = W.people.filter((q) => q !== a && !q.away && !(q.inside && q.task?.kind === 'home' && isNight()));
  const latest = (W.updates || []).slice(-1)[0];
  const lines = [
    ...(a.today || []).filter((m) => m.weight >= 2 && !String(m.tag).startsWith('text') && !m.posted).slice(-2).map((m) => { m.posted = true; return `${lc(m.text)} ${pick(['lol', '!!', '😭', '', 'anyway'])}`.trim(); }),
    'who left a sock at the fountain', 'bakery has fresh croissants rn go go go', 'lost my hat. if u see a hat its mine', 'is it just me or is the ferry late', 'hot take: ice cream is a breakfast food',
    `${seasonOf().name.toLowerCase()} vibes today`, W.event && W.event.day === W.day && EVENTS[W.event.id] ? `whos going to ${EVENTS[W.event.id].name}??` : 'anyone doing anything today',
    latest && latest.day >= W.day - 1 ? `did anyone else notice ${latest.short || 'the new thing'}. claude again` : 'anyone up?',
    findMili() && findMili() !== a && rand() < 0.3 ? 'if mili is part of the creator is she reading this chat rn 👀' : 'whats everyone doing',
  ];
  const text = pickFresh(lines);
  postText(a, 'town', text, 'group');
  const n = rand() < 0.3 ? 0 : rand() < 0.7 ? 1 : 2;
  for (let i = 0; i < n && others.length; i++) {
    const q = pick(others);
    setTimeout(() => { const low = text.toLowerCase(); postText(q, 'town', pickFresh(low.includes('mili') ? (isMili(q) ? ['…yes. hi.', 'i can read it the normal way. like everyone', 'please stop 😭'] : ['LMAO', 'guys stop', 'she is literally right there', 'honestly valid question']) : low.includes('claude') ? ['lol', 'i like it tbh', 'it keeps rearranging things', 'claude if ur reading this: more benches'] : ['lol', 'me', 'NO', 'omg', 'real', 'why is this chat like this', `${a.name.toLowerCase()} pls`, 'same', 'on my way']), 'group'); }, (4 + rand() * 12) * 1000 * (i + 1));
  }
}
function textTick() {
  if (W.meeting || MODE !== 'host') return;
  if (now >= nextConvoAt) {
    nextConvoAt = now + 60 + rand() * 70;
    const awake = W.people.filter((p) => !p.away && !p.visitor && p.grow >= 0.5 && !(p.inside && p.task?.kind === 'home' && (W.t >= 0.68 || W.t < 0.01)));
    if (awake.length >= 2) {
      const scored = awake.map((p) => [p, (p.today || []).filter((m) => !m.texted && m.weight >= 2).length + rand() * 1.5]).sort((x, y) => y[1] - x[1]);
      const a = scored[0][0];
      const T0 = pickTopic(a, a);
      let b = null;
      if (T0.who && T0.who !== a.name) { const w = W.people.find((q) => q.name === T0.who); if (w && rand() < 0.35 && !w.away) b = w; }
      if (!b) {
        const others = W.people.filter((q) => q !== a && !q.away && !q.visitor);
        const partner = a.partner && person(a.partner);
        const best = others.filter((q) => fscore(a, q) >= 3).sort((x, y) => fscore(a, y) - fscore(a, x));
        const enemy = others.find((q) => fscore(a, q) <= -6);
        if (enemy && rand() < 0.15 && (a.body.openness ?? 0) < 0.3) { if (T0.mem) T0.mem.texted = false; return startConvo(a, enemy, { kind: 'bully' }); }
        b = partner && rand() < 0.4 ? partner : best.length ? pick(best.slice(0, 3)) : others.length ? pick(others) : null;
      }
      if (b) { if (T0.mem && T0.who === b.name) T0.kind = TOPIC_OF[T0.mem.tag] || 'mem'; startConvo(a, b, T0); }
    }
  }
  if (now >= nextGroupAt) {
    nextGroupAt = now + 150 + rand() * 150;
    const awake = W.people.filter((p) => !p.away && !p.visitor && !(p.inside && p.task?.kind === 'home' && isNight()));
    if (awake.length) groupPost(pick(awake));
  }
  if (W.t > 0.62 && W.t < 0.7) for (const p of W.people) {
    const q = p.partner && person(p.partner);
    if (!q || lastGoodnightDay[p.id] === W.day || p.away) continue;
    lastGoodnightDay[p.id] = lastGoodnightDay[q.id] = W.day;
    if (rand() < 0.7) startConvo(p, q, { kind: 'miss' });
  }
}

