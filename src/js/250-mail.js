// ============================================================
// MAIL
// ============================================================
// each kind of letter has a few ways it can go, so the same event reads differently each time
function letterTemplate(p, kind, f) {
  const s = p.cr.score, warm = s >= 2, cold = s <= -2, P = typeof personaOf === 'function' ? personaOf(p) : { energy: 0, warmth: 0 };
  const loud = P.energy > 0.45, shy = P.energy < -0.35;
  const sign = pick(warm ? ['Love,', 'Your friend,', 'With a big hug,', 'Yours,', 'Hugs,', loud ? 'Love love love,' : 'Warmly,'] : cold ? ['Whatever.', 'Sincerely,', 'Signed,', 'Regards, I guess,'] : ['From,', 'Take care,', 'Bye for now,', 'See you,', shy ? 'Quietly,' : 'Cheers,', 'Talk soon,']);
  const greet = pick(warm ? ['Dear Creator,', 'Dearest Creator,', loud ? 'CREATOR!!' : 'Hello again, Creator,', 'Hi Creator!'] : cold ? ['Creator,', 'To the Creator.', 'Hey.'] : ['Hi, Creator,', 'Hello Creator,', 'Dear Creator,', shy ? 'um, hi Creator,' : 'Hey Creator!']);
  const V = {
    wishGranted: [`You gave me ${f.what}! I wished and wished, and you heard me. I put it where I can see it every day.`, `${cap(f.what || 'it')} is here and it's perfect. I keep picking it up just to hold it. Thank you.`, `I don't know how you knew I wanted ${f.what}. I told almost nobody. It's on my shelf now and I smile every time I walk by.`],
    wishLost: cold ? [`I asked for ${f.what}. Three whole days. Nothing. I guess I know where I stand.`, `So ${f.what} was too much to ask. Noted.`] : [`I wished for ${f.what} for a long time. Maybe you were busy. I'm not mad. Okay, I'm a little sad.`, `I stopped wishing for ${f.what}. It's fine. I'll wish for something smaller next time.`, `I guess ${f.what} wasn't meant to be. I still think about it at night sometimes.`],
    jealous: [`I saw you gave ${f.who} something again. That's okay. I just wondered… when's it my turn?`, `${f.who} showed everyone what you gave them. I clapped. I clapped kind of slowly.`, `Is ${f.who} your favorite? You can tell me. I can take it. Probably.`],
    trip: [`I went to ${f.to}! Over there, ${f.culture}. It was ${pick(['so strange', 'kind of wonderful', 'a lot to think about'])}.`, `Back from ${f.to}. Over there, ${f.culture}. I brought home sand in my shoes and a lot of new thoughts.`],
    madeUp: [`${f.who} and I made up today! I think you had something to do with it. My chest feels lighter.`, `${f.who} said sorry, and then I said sorry, and then we both laughed. I missed them.`, `We're okay again, ${f.who} and me. I didn't know how heavy it was until it was gone.`],
    levelUp: [`Today was one of the best days I've had here. I felt so happy I could burst, and I wanted you to be the first to know.`, `Nothing big happened today, and it was still perfect. Is that allowed?`, `I felt like myself all day today. I don't always. I wanted to write it down somewhere, so I'm writing it to you.`, `Good news: I'm doing great! That's the whole news. ${loud ? 'GREAT!!' : 'Just great.'}`],
    talk: [`I can't stop thinking about when you talked to me. ${warm ? 'Please talk to me again soon!' : 'I still have questions for you.'}`, `You spoke to me today. I told three people and none of them believed me.`, `When you talked to me, the whole sky felt closer. Is that silly?`],
    ignored: cold ? ["It's been quiet from you. That's fine. We're busy anyway.", "You stopped showing up. We noticed. We're managing."] : ["Are you still there? It's been quiet. I hope you're okay, wherever you are.", "I looked up at the sky today and wondered what you were doing. It's been a while.", "No pressure. I just miss hearing from you. Even a little wave would be nice.", "I saved you a seat at the fountain. Just in case."],
    baby: [`${f.who} was born today! They're so small. Will you watch over them?`, `Our family got bigger today. ${f.who} has the tiniest hands. Please look after them.`],
    rebel: [`The town voted to stop waiting on you, and I voted yes. We can take care of ourselves. ${s > -6 ? 'Prove us wrong, if you want.' : ''}`, `We decided we don't need you to run things. Don't take it personally. Actually, do.`],
    arrived: [`I just got off the ferry from ${f.from}. I left ${f.who || 'everything'} behind. Everything here smells like salt. Are you the same Creator as over there?`, `New island, new room, new everything. ${f.from} feels far away already. Be nice to me?`],
    leaving: [`I'm taking the ferry to ${f.to}. ${f.why} Please don't forget me.`, `By the time you read this I'll be on my way to ${f.to}. ${f.why} I'll look back at least once.`],
    verdictWin: [`Thank you for what you decided at Glimmer Hall (${f.what}). I felt like somebody finally listened.`, `About ${f.what}: thank you. I walked home the long way just to enjoy it.`],
    verdictLose: cold ? [`About ${f.what}. I don't think that was fair. You didn't even hear my side.`] : [`I keep thinking about ${f.what}. It stung. I'm trying to understand why you ruled that way.`, `I lost ${f.what}. I'm not writing to argue. I just needed to say it hurt.`],
    bullied: [`Someone keeps sending me mean texts. I don't want to say who. I just wanted somebody to know.`, `My phone buzzes and my stomach drops. Somebody's being cruel. I'm telling you so it isn't only mine to carry.`],
    claudeNote: [`Little status report! I added something new to the island today. ${pick(['Mili sat near it for a while. I think that means it worked.', 'Nobody has tripped on it yet.', 'Everyone seems okay. I checked on a few people.'])} Thanks for letting me build here with you.`, `Update from the workshop: the island is running smoothly and I only broke one thing, briefly. Thank you for trusting me with it.`],
    bdayThanks: [`You remembered my birthday. I didn't even know you knew when it was. I'm keeping it forever.`, `Best birthday present: knowing you remembered. The actual present was also very good.`],
    dating: [`Guess what? ${f.who} and I are dating now! I keep smiling at nothing. You're the first one I'm telling.`, `${f.who} held my hand today. On purpose! We're together now. ${loud ? 'AAAA.' : 'I\'m still a little stunned.'}`],
    heartbreak: [`I told ${f.who} how I feel. They said no. I'll be okay. Just maybe not today.`, `${f.who} was kind about it, which almost makes it worse. I'm going to eat something warm and go to bed early.`],
    engaged: [`${f.who} asked me to marry them and I said yes! The wedding is tomorrow at the fountain. Will you come watch?`, `We're getting married! ${f.who} and me! Tomorrow, at the fountain. Please be there, in whatever way you can.`],
    ask: [`Can I ask you for something? I'd really love ${f.what}. ${warm ? "Only if it's not too much trouble!" : "You don't have to. But it would mean a lot."}`, `I've been saving up, but it's slow, so I'm just going to say it: I'd love ${f.what}.`],
    book: [`I wrote a book! A whole one! It's called "${f.title}". It's at Paper Moon Books. ${warm ? 'I hope you read it.' : "You probably won't read it. That's fine."}`, `"${f.title}" is finished and on the shelf at Paper Moon Books. My name is on the cover. MY NAME.`],
    festival: [`The fireworks tonight were so pretty. I looked up the whole time and wondered if you were watching them too.`, `Festival night! I ate too much and danced badly and it was perfect.`],
  };
  const opts = V[kind];
  return { greet, body: opts ? pick(opts) : 'I just wanted to write to you.', sign };
}
// a personal P.S. drawn from their own day, so no two letters read the same
const PS_SKIP_TAG = /secret|guilt|crime|clue|charged|remand|murder|culprit|jail|restyle|creator|wish|letter|grief|bullied|haircut|style/i;
const PS_SKIP_TEXT = /kill|murder|dead|died|stole|steal|guilt|clue|did it|body|police|detective|jail|cell/i;
function letterTwist(p, lastKind) {
  const T = [];
  const mem = (p.today || []).filter((m) => m.weight >= 2 && !PS_SKIP_TAG.test(m.tag || '') && !PS_SKIP_TEXT.test(m.text || '') && m.text.length < 160);
  if (mem.length) T.push(['day', `P.S. ${pick(mem).text}`]);
  if (p.job && JOBS[p.job]) T.push(['job', `P.S. ${pick([`Work at the ${JOBS[p.job].short} was ${pick(['slow', 'busy', 'weird', 'fine, mostly'])} today.`, `Being a ${JOBS[p.job].title} is ${pick(['harder than it looks', 'more fun than people think', 'tiring, but I like it'])}.`])}`]);
  const partner = p.partner && person(p.partner);
  if (partner) T.push(['love', `P.S. ${partner.name} ${pick(['says hi. Well, they didn\'t, but they would.', 'is humming in the other room.', 'doesn\'t know I write to you. Or maybe they do.'])}`]);
  const fav = typeof favoriteFood === 'function' && favoriteFood(p);
  if (fav) T.push(['food', `P.S. ${pick([`If you ever visit, I'll share my ${fav}.`, `I had ${fav} today. Just thought you should know.`])}`]);
  const friend = Object.entries(p.feelings || {}).filter(([id, f]) => f.score >= 5 && person(id)).sort((a, b) => b[1].score - a[1].score)[0];
  if (friend) T.push(['friend', `P.S. ${pick([`${friend[1].name} and I are basically inseparable now.`, `Don't tell ${friend[1].name}, but they're my favorite person here.`, `${friend[1].name} made me laugh so hard today I snorted.`])}`]);
  if (p.look && typeof lookText === 'function' && !(typeof workOutfit === 'function' && workOutfit(p))) T.push(['look', `P.S. I'm wearing ${lookText(p)} right now. ${pick(['Thoughts?', 'I think it works.', 'Be honest.'])}`]);
  if (typeof seasonOf === 'function') T.push(['season', `P.S. ${pick([`It's ${seasonOf().name.toLowerCase()} here. `, ''])}${pick(['The light at the pier was beautiful tonight.', 'The wind smelled like rain.', 'I saw a shooting star, or maybe a firefly.'])}`]);
  T.push(['ask', `P.S. ${pick(['Do you sleep? What do you dream about?', 'What is the sky like where you are?', 'Is there a Creator for you, too?', 'Do you have a cat? You seem like you would.', 'What do you eat for breakfast?', 'Do you ever get lonely up there?'])}`]);
  const fresh = T.filter(([k]) => k !== lastKind);
  const got = pick(fresh.length ? fresh : T);
  return { kind: got[0], text: got[1] };
}
const BIG_LETTERS = ['baby', 'engaged', 'dating', 'heartbreak', 'leaving', 'arrived', 'bdayThanks', 'wishGranted', 'book', 'rebel'];
function queueLetter(p, kind, facts = {}) {
  if (!W.mail) W.mail = [];
  if (W.mail.some((m) => m.from === p.id && m.day === W.day)) return;
  const mine = W.mail.filter((m) => m.from === p.id);
  // small letters only now and then, and never the same thing twice in a row
  if (!BIG_LETTERS.includes(kind) && mine.some((m) => W.day - m.day < 3 || (m.kind === kind && W.day - m.day < 8))) return;
  const t = letterTemplate(p, kind, facts);
  for (let i = 0; i < 4 && W.mail.some((m) => String(m.body).split('\n\n')[0] === t.body); i++) Object.assign(t, letterTemplate(p, kind, facts));
  const tw = rand() < 0.85 ? letterTwist(p, mine[0]?.twist) : null;
  if (tw) t.body += '\n\n' + tw.text;
  W.mail.unshift({ id: uid(), from: p.id, fromName: p.name, hue: p.body.hue, day: W.day, kind, facts, ...t, twist: tw?.kind || null, written: false, read: false, reply: null, reaction: null });
  if (W.mail.length > 40) W.mail.length = 40;
  Sound.paper();
}
function nightLetters() {
  const cand = [];
  for (const p of W.people) {
    if (p.visitor || p.away || (typeof jailed === 'function' && jailed(p))) continue;
    const has = (tag) => p.today.find((m) => m.tag === tag);
    let kind = null, facts = {}, prio = 0;
    if (isBirthday(p) && has('bdayCreator')) { kind = 'bdayThanks'; prio = 9; }
    else if (has('wishGranted')) { kind = 'wishGranted'; facts.what = has('wishGranted').meta?.what || 'my wish'; prio = 9; }
    else if (has('apologized') || has('gotApology')) { const m = has('apologized') || has('gotApology'); kind = 'madeUp'; facts.who = m.who; prio = 6; }
    else if (has('rebel')) { kind = 'rebel'; prio = 7; }
    else if (p.today.filter((m) => m.tag === 'bullied').length >= 2) { kind = 'bullied'; prio = 7; }
    else if (has('creatorTalk')) { kind = 'talk'; prio = 5; }
    else if (has('wishLost')) { kind = 'wishLost'; facts.what = has('wishLost').meta?.what || 'something'; prio = 5; }
    else if (has('lostCase') && rand() < 0.6) { kind = 'verdictLose'; facts.what = has('lostCase').meta?.what || 'the case'; prio = 5; }
    else if (has('wonCase') && rand() < 0.4) { kind = 'verdictWin'; facts.what = has('wonCase').meta?.what || 'the case'; prio = 4; }
    else if (has('jealous') && p.cr.score < 1) { kind = 'jealous'; facts.who = has('jealous').who; prio = 4; }
    else if (W.event?.id === 'festival' && W.event.day === W.day && p.cr.score >= 1 && rand() < 0.3) { kind = 'festival'; prio = 3; }
    else if (isClaude(p) && rand() < 0.25) { kind = 'claudeNote'; prio = 3; }
    else if (has('levelUp') && rand() < 0.3) { kind = 'levelUp'; prio = 2; }
    if (kind) { cand.push({ p, kind, facts, prio: prio + rand() }); continue; }
    const last = p.cr.lastSeen ?? p.bornDay;
    if (W.day - last >= 4 && W.day - (p.cr.ignoredLetter || -9) >= 6 && rand() < 0.1) cand.push({ p, kind: 'ignored', facts: {}, prio: 1 + rand() });
  }
  // at most two letters a night, the ones that matter most; only one "are you there?" letter at a time
  cand.sort((a, b) => b.prio - a.prio);
  let n = 0, lonely = W.day - (W.lonelyLetterDay ?? -99) < 4;
  for (const c of cand) {
    if (n >= 2) break;
    if (c.kind === 'ignored') { if (lonely) continue; lonely = true; W.lonelyLetterDay = W.day; c.p.cr.ignoredLetter = W.day; }
    const before = (W.mail || []).length;
    queueLetter(c.p, c.kind, c.facts);
    if ((W.mail || []).length > before) n++;
  }
}
function letterPrompt(m, p) {
  return `${m.fromName} is a small villager in ${ISL.name}, a tiny island town like Tomodachi Life. They are writing a short handwritten letter to "the Creator", the unseen being who made their island.
${p ? `Who they are, in their own words: ${p.selfNote}
How they feel about the Creator: ${attitude(p)[1]}.` : ''}
What the letter is about: ${m.kind}. Facts: ${JSON.stringify(m.facts)}.
A rough draft: "${m.body}"
${p ? `Things from their life lately: ${(p.today || []).filter((x) => x.weight >= 2 && !PS_SKIP_TAG.test(x.tag || '') && !PS_SKIP_TEXT.test(x.text || '')).slice(-4).map((x) => x.text).join(' ') || 'an ordinary day'}` : ''}
${(() => { const prev = (W.mail || []).filter((x) => x.from === m.from && x.id !== m.id && x.written).slice(0, 2).map((x) => x.body.slice(0, 160)); return prev.length ? `Their last letters said: ${prev.map((b) => `"${b}"`).join(' / ')}. Don't repeat those; this one should feel different.` : ''; })()}

Rewrite it in ${m.fromName}'s own voice: 2 to 5 short sentences plus the P.S. if the draft has one, simple words, specific to their life, with one small concrete detail or twist that only they would write. Keep their real feelings, including doubt or resentment if they have it.
Reply with only JSON: {"greeting": "e.g. Dear Creator,", "body": "...", "signoff": "e.g. Love,"}`;
}
const writingLetters = new Set();
async function writeLetter(m) {
  if (m.written || !RT.sample || writingLetters.has(m.id)) return;
  writingLetters.add(m.id); m.written = true;
  try {
    const r = await RT.sample.json(letterPrompt(m, person(m.from)), { model: modelOf(person(m.from)), fallbackKey: 'body', cache: false });
    if (r?.body) { send({ t: 'mailtext', mid: m.id, greet: String(r.greeting || m.greet).slice(0, 60), body: String(r.body).slice(0, 900), sign: String(r.signoff || m.sign).slice(0, 40) }); Object.assign(m, { greet: String(r.greeting || m.greet), body: String(r.body), sign: String(r.signoff || m.sign) }); }
  } catch (e) { m.written = false; }
  refreshPanel(true);
}
async function replyLetter(m, text) {
  const p = person(m.from);
  let reaction = null, feeling = 1;
  if (RT.sample && p) {
    try {
      const r = await RT.sample.json(`${m.fromName}, a small villager in ${ISL.name}, wrote this letter to the Creator (the unseen being who made their island):
"${m.greet} ${m.body} ${m.sign} ${m.fromName}"
Who they are: ${p.selfNote}
How they feel about the Creator: ${attitude(p)[1]}.
The Creator wrote back: "${text}"
What does ${m.fromName} say out loud after reading the reply? Stay true to their personality.
Reply with only JSON: {"reaction": "1 or 2 short sentences in first person", "feeling": integer from -2 to 2 for how this changes how they feel about the Creator}`, { model: modelOf(p), fallbackKey: 'reaction', cache: false });
      reaction = String(r?.reaction || '').slice(0, 300) || null; feeling = clamp(Math.round(Number(r?.feeling) || 0), -2, 2);
    } catch (e) {}
  }
  if (!reaction) reaction = p ? (p.cr.score >= 0 ? pick(['The Creator wrote back to me! I read it three times.', "I'm keeping this letter forever."]) : pick(['…Huh. I didn\'t think you\'d actually answer.', "Fine. That's something, I guess."])) : 'They never got it.';
  send({ t: 'mailreply', mid: m.id, reply: text.slice(0, 600), reaction, feeling });
}

