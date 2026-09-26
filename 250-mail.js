// ============================================================
// MAIL
// ============================================================
function letterTemplate(p, kind, f) {
  const s = p.cr.score, warm = s >= 2, cold = s <= -2;
  const sign = warm ? pick(['Love,', 'Your friend,', 'With a big hug,']) : cold ? pick(['Whatever.', 'Sincerely,', 'Signed,']) : pick(['From,', 'Take care,', 'Bye for now,']);
  const greet = warm ? 'Dear Creator,' : cold ? 'Creator,' : 'Hi, Creator,';
  const B = {
    wishGranted: `You gave me ${f.what}! I wished and wished, and you heard me. I put it where I can see it every day. I don't know what you are, but thank you.`,
    wishLost: cold ? `I asked for ${f.what}. Three whole days. Nothing. I guess I know where I stand.` : `I wished for ${f.what} for a long time. Maybe you were busy. I'm not mad. Okay, I'm a little sad.`,
    jealous: `I saw you gave ${f.who} something again. That's okay. I just wondered… when's it my turn?`,
    trip: `I went to ${f.to}! Over there, ${f.culture}. It was ${pick(['so strange', 'kind of wonderful', 'a lot to think about'])}. I'm still thinking about it.`,
    madeUp: `${f.who} and I made up today! I think you had something to do with it. My chest feels lighter.`,
    levelUp: `Today was one of the best days I've had here. I felt so happy I could burst, and I wanted you to be the first to know.`,
    talk: `I can't stop thinking about when you talked to me. ${warm ? 'Please talk to me again soon!' : 'I still have questions for you.'}`,
    ignored: cold ? "It's been quiet from you. That's fine. We're busy anyway." : "Are you still there? It's been quiet. I hope you're okay, wherever you are.",
    baby: `${f.who} was born today! They're so small. Will you watch over them?`,
    rebel: `The town voted to stop waiting on you, and I voted yes. We can take care of ourselves. ${s > -6 ? 'Prove us wrong, if you want.' : ''}`,
    arrived: `I just got off the ferry from ${f.from}. I left ${f.who || 'everything'} behind. Everything here smells like salt. Are you the same Creator as over there?`,
    leaving: `I'm taking the ferry to ${f.to}. ${f.why} Please don't forget me.`,
    verdictWin: `Thank you for what you decided at Glimmer Hall (${f.what}). I felt like somebody finally listened.`,
    verdictLose: cold ? `About ${f.what}. I don't think that was fair. You didn't even hear my side.` : `I keep thinking about ${f.what}. It stung. I'm trying to understand why you ruled that way.`,
    bullied: `Someone keeps sending me mean texts. I don't want to say who. I just wanted somebody to know.`,
    claudeNote: `Little status report! I added something new to the island today. ${pick(['Mili sat near it for a while. I think that means it worked.', 'Nobody has tripped on it yet.', "Everyone seems okay. I checked on a few people."])} Thanks for letting me build here with you.`,
    bdayThanks: `You remembered my birthday. I didn't even know you knew when it was. I'm keeping it forever.`,
    dating: `Guess what? ${f.who} and I are dating now! I keep smiling at nothing. You're the first one I'm telling.`,
    heartbreak: `I told ${f.who} how I feel. They said no. I'll be okay. Just maybe not today.`,
    engaged: `${f.who} asked me to marry them and I said yes! The wedding is tomorrow at the fountain. Will you come watch?`,
    ask: `Can I ask you for something? I'd really love ${f.what}. ${warm ? "Only if it's not too much trouble!" : "You don't have to. But it would mean a lot."}`,
    book: `I wrote a book! A whole one! It's called "${f.title}". It's at Paper Moon Books. ${warm ? 'I hope you read it.' : 'You probably won\'t read it. That\'s fine.'}`,
    festival: `The fireworks tonight were so pretty. I looked up the whole time and wondered if you were watching them too.`,
  };
  return { greet, body: B[kind] || 'I just wanted to write to you.', sign };
}
function queueLetter(p, kind, facts = {}) {
  if (!W.mail) W.mail = [];
  if (W.mail.some((m) => m.from === p.id && m.day === W.day)) return;
  const t = letterTemplate(p, kind, facts);
  W.mail.unshift({ id: uid(), from: p.id, fromName: p.name, hue: p.body.hue, day: W.day, kind, facts, ...t, written: false, read: false, reply: null, reaction: null });
  if (W.mail.length > 40) W.mail.length = 40;
  Sound.paper();
}
function nightLetters() {
  for (const p of W.people) {
    if (p.visitor || p.away) continue;
    const has = (tag) => p.today.find((m) => m.tag === tag);
    let kind = null, facts = {};
    if (isBirthday(p) && has('bdayCreator')) kind = 'bdayThanks';
    else if (has('wishGranted')) { kind = 'wishGranted'; facts.what = has('wishGranted').meta?.what || 'my wish'; }
    else if (has('apologized') || has('gotApology')) { const m = has('apologized') || has('gotApology'); kind = 'madeUp'; facts.who = m.who; }
    else if (has('levelUp')) kind = 'levelUp';
    else if (has('wishLost')) { kind = 'wishLost'; facts.what = has('wishLost').meta?.what || 'something'; }
    else if (has('jealous') && p.cr.score < 1) { kind = 'jealous'; facts.who = has('jealous').who; }
    else if (has('creatorTalk')) kind = 'talk';
    else if (has('rebel')) kind = 'rebel';
    else if (W.event?.id === 'festival' && W.event.day === W.day && p.cr.score >= 1) kind = 'festival';
    else if (p.today.filter((m) => m.tag === 'bullied').length >= 2) kind = 'bullied';
    else if (has('lostCase') && rand() < 0.6) { kind = 'verdictLose'; facts.what = has('lostCase').meta?.what || 'the case'; }
    else if (has('wonCase') && rand() < 0.4) { kind = 'verdictWin'; facts.what = has('wonCase').meta?.what || 'the case'; }
    else if (isClaude(p) && rand() < 0.35) kind = 'claudeNote';
    if (kind && rand() < 0.7) { queueLetter(p, kind, facts); continue; }
    const last = p.cr.lastSeen ?? p.bornDay;
    if (W.day - last >= 3 && W.day - (p.cr.ignoredLetter || -9) >= 3 && rand() < 0.12) { queueLetter(p, 'ignored'); p.cr.ignoredLetter = W.day; }
  }
}
function letterPrompt(m, p) {
  return `${m.fromName} is a small villager in ${ISL.name}, a tiny island town like Tomodachi Life. They are writing a short handwritten letter to "the Creator", the unseen being who made their island.
${p ? `Who they are, in their own words: ${p.selfNote}
How they feel about the Creator: ${attitude(p)[1]}.` : ''}
What the letter is about: ${m.kind}. Facts: ${JSON.stringify(m.facts)}.
A rough draft: "${m.body}"

Rewrite it in ${m.fromName}'s own voice: 2 to 5 short sentences, simple words, specific to their life. Keep their real feelings, including doubt or resentment if they have it.
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

