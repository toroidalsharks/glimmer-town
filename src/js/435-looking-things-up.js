// ============================================================
// LOOKING THINGS UP: residents search the Outside for what they're curious about
// ============================================================
// Once the Outside is found, residents look things up on their phones (laptops and the library
// computer too) the way people do: something comes up in a conversation, a hobby, a worry, or
// they just wonder. They read a Wikipedia summary through the same filters as the Outside feed,
// react, sometimes fall down a rabbit hole, tell a friend, and keep what hooked them.
// p.toLookUp: things they mean to look up. p.browsed: what they read. p.curious: what hooked them.
const LOOK_GAP = 75e3;
let lookBusy = false, nextLookAt = 0, nextIdleLookAt = 0;
const lookOn = () => MODE === 'host' && cfg.outside !== false && !!W.outsideFound;
const lookKid = (p) => stageOf(p) !== 'adult';
function canLookUp(p) { return !!p && lookOn() && !p.away && !p.visitor && !p.isClaude && !['baby', 'toddler'].includes(stageOf(p)) && !(typeof jailed === 'function' && jailed(p)); }
// grown-ups browse whatever they like; kids and teens get the filtered web (no hard news, nothing nsfw)
const grownNews = (p) => !!p && !lookKid(p);
function lookTextOk(p, t) { return grownNews(p) || (!HARD_BLOCK.test(t) && !SOFT_BLOCK.test(t)); }
// whatever the game itself shows on screen (pages, memories, the diary) stays clean, whatever they read
const adultBit = (t) => HARD_BLOCK.test(String(t || ''));
const shownText = (t, alt = 'something not for here') => (adultBit(t) ? alt : t);
function lookTopicOk(p, t) { return t && t.length > 1 && lookTextOk(p, t); }
// they make a mental note to look something up later
function wantLookUp(p, topic, why) {
  if (!p) return;
  topic = String(topic || '').replace(/^["'\s]+|["'\s.?!]+$/g, '').slice(0, 80);
  if (!lookTopicOk(p, topic) || /^(null|none|nothing)$/i.test(topic)) return;
  if ((p.browsed || []).slice(-6).some((b) => b.q.toLowerCase() === topic.toLowerCase())) return;
  p.toLookUp = [...(p.toLookUp || []).filter((x) => x.q.toLowerCase() !== topic.toLowerCase()), { q: topic, why: fitLine(String(why || ''), 140), day: W.day }].slice(-6);
}
async function wikiFind(q, kid, p = null) {
  const s = await getJSON(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=5&format=json&origin=*`).catch(() => null);
  for (const hit of (s?.query?.search || []).slice(0, 4)) {
    const title = String(hit.title || '');
    if (!title || !(p ? lookTextOk(p, title) : !HARD_BLOCK.test(title) && !SOFT_BLOCK.test(title))) continue;
    const j = await getJSON(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`).catch(() => null);
    const text = String(j?.extract || '').replace(/\s+/g, ' ').trim();
    if (!j || j.type === 'disambiguation' || text.length < 40 || ((kid || !p || !grownNews(p)) && (HARD_BLOCK.test(text) || SOFT_BLOCK.test(text)))) continue;
    return { title: String(j.title || title).slice(0, 90), text: fitLine(text, 900), source: 'Wikipedia' };
  }
  return null;
}
// what would they look up right now, if nothing is on their list
async function pickLookUp(p) {
  const list = p.toLookUp || [];
  if (list.length) return list.shift();
  // now and then they just click around and land somewhere random
  if (rand() < 0.25) { const R = await webRandom(p); if (R) return { q: R.title, why: 'clicked around and ended up here', day: W.day, found: R }; }
  if (aiReady() && voiceRoom()) {
    const prompt = `${voiceCard(p)}${outsideClockContext()}${lookupContext(p)}
${voiceRules()}
${p.name} picks up their phone and opens the Outside, the real internet from a much bigger world. What do they look up right now? Something a real person like them would actually search: a question from their day, their job, a hobby, something someone said, a worry, a health scare, gossip about a celebrity, a recipe, a how-to, a conspiracy theory they half believe, the news, a random wondering, the next step down a rabbit hole. Not something they already read.
Reply with only JSON: {"q": "the search, 1-6 words", "why": "why they want to know, in a few words"}`;
    voiceToday(); VOICE.calls++; voiceDirty = true;
    try { const r = await llm(prompt, { model: modelOf(p), temperature: 1.05, max: 80, fallbackKey: 'q' }); const q = String(r?.q || '').replace(/^["'\s]+|["'\s.?!]+$/g, '').slice(0, 80); if (lookTopicOk(p, q)) return { q, why: String(r?.why || '').slice(0, 140), day: W.day }; } catch (e) {}
    return null;
  }
  // no model: follow what already hooked them, or one of their interests
  const c = pick((p.curious || []).concat(String(p.interests || '').split(/,|\band\b/).map((s) => s.trim()).filter((s) => s.length > 2).map((s) => ({ topic: s }))));
  return c && lookTopicOk(p, c.topic) ? { q: c.topic, why: 'still curious', day: W.day } : null;
}
async function lookUp(p, why0) {
  if (lookBusy || !canLookUp(p)) return false;
  lookBusy = true; nextLookAt = Date.now() + LOOK_GAP;
  try {
    const L = await pickLookUp(p); if (!L) return false;
    if (!p.inside) { emote(p, '🔎', 3); }
    const found = L.found || await webFind(p, L.q) || await wikiFind(L.q, lookKid(p), p);
    if (!found) { remember(p, `Tried to look up "${shownText(L.q, 'something')}" on the Outside but couldn't find anything good.`, 1, 'lookup'); return false; }
    let v = null;
    if (aiReady()) {
      const prompt = `${voiceCard(p)}${lookupContext(p)}
${voiceRules()}
- Stick to what the article says. Don't add facts it doesn't have.
${p.name} looked up "${L.q}" on the Outside${L.why ? ` (${L.why})` : ''} and is reading this${found.source ? ` on ${found.source}` : ''}:
${found.title}: ${found.text}

How does ${p.name} take it, as a real person who has never seen that world? Most things are only mildly interesting. Now and then something really grabs you.
Reply with only JSON: {"react": "what they think or mutter while reading, in their own voice", "takeaway": "what they'll remember from it, one sentence in their own words", "hooked": 0 to 3 (0 meh, 1 neat, 2 really interesting, 3 can't stop thinking about it), "next": "something it makes them want to look up next, or null", "tell": "the name of someone in town they'd tell about it, or null", "post": "a Chirp post about it, or null"}`;
      voiceToday(); VOICE.calls++; voiceDirty = true;
      try { v = await llm(prompt, { model: modelOf(p), temperature: 1.0, max: 300, fallbackKey: 'react' }); } catch (e) { v = null; }
    }
    const hooked = clamp(Math.round(Number(v?.hooked) || (rand() < 0.3 ? 2 : 1)), 0, 3);
    const react = v?.react ? String(v.react).trim() : pick(['Huh. I did not know that.', 'Okay, that is kind of amazing.', 'The Outside has a word for everything.', 'Hm. Neat.']);
    const takeaway = v?.takeaway ? fitLine(String(v.takeaway), 220) : fitLine(found.text, 160);
    const rec = { q: L.q, why: L.why || why0 || '', title: found.title, source: found.source || 'Wikipedia', text: fitLine(found.text, 400), react: fitLine(react, 220), takeaway, hooked, day: W.day, at: Date.now() };
    p.browsed = [...(p.browsed || []), rec].slice(-15);
    remember(p, `Looked up "${shownText(L.q, 'something')}" on the Outside and read about ${shownText(found.title, 'something for grown-ups')}${found.source && found.source !== 'Wikipedia' ? ` on ${found.source}` : ''}. ${takeaway}`, hooked >= 2 ? 2 : 1, 'lookup');
    if (hooked >= 2) {
      const C = p.curious = p.curious || [];
      const had = C.find((c) => c.topic.toLowerCase() === found.title.toLowerCase());
      if (had) { had.n++; had.day = W.day; } else C.push({ topic: found.title, why: rec.react, n: 1, day: W.day });
      const ints = String(p.interests || '');
      if (hooked === 3 && (had?.n || 1) >= 2 && !ints.toLowerCase().includes(found.title.toLowerCase())) {
        // real people keep everything they came with; others let an old interest go
        const t = found.title.toLowerCase();
        p.interests = isRealish(p) ? (ints ? `${ints}, ${t}` : t).slice(0, 320) : [...ints.split(/,\s*/).filter(Boolean), t].slice(-5).join(', ');
        remember(p, `I'm really into ${found.title} now. I keep reading about it.`, 3, 'lookup');
        if (!adultBit(found.title)) diary(`🔎 <b>${esc(p.name)}</b> fell down a rabbit hole on the Outside and is really into <b>${esc(found.title)}</b> now.`);
      }
    }
    lookForget(p);
    if (v?.next) wantLookUp(p, v.next, `after reading about ${found.title}`);
    if (!p.inside) bubble(p, fitLine(rec.react, 150), 3.5);
    const friend = v?.tell && W.people.find((q) => q !== p && q.name.toLowerCase() === String(v.tell).toLowerCase() && !q.away);
    if (friend && hooked >= 1 && rand() < 0.6) setTimeout(() => startConvo(p, friend, { kind: 'outside', who: friend.name, mem: { text: `I read about ${found.title} on the Outside. ${takeaway}` } }), (6 + rand() * 20) * 1000);
    else if (v?.post && hooked >= 2 && rand() < 0.5) postChirp(p, String(v.post), {});
    markDirty();
    return true;
  } finally { lookBusy = false; }
}
// interests fade the way they do: what stopped coming up drops off
function lookForget(p) {
  if (!p.curious) return;
  p.curious = p.curious.filter((c) => c.n >= 3 || W.day - c.day <= 14).slice(-8);
}
// someone with something on their list looks it up when they get a free moment; now and then
// someone just wonders about something
function lookTick() {
  if (!lookOn() || lookBusy || W.meeting || Date.now() < nextLookAt) return;
  nextLookAt = Date.now() + 5000;
  const free = W.people.filter((p) => canLookUp(p) && p.state === 'free' && !isAsleep(p));
  const due = free.filter((p) => (p.toLookUp || []).length);
  if (due.length) { lookUp(pick(due)); return; }
  if (scrollDue(free)) return;
  if (Date.now() < nextIdleLookAt || !aiReady() || !voiceRoom()) return;
  nextIdleLookAt = Date.now() + (3 + rand() * 4) * 60e3;
  if (free.length) lookUp(pick(free), 'just wondering');
}
// what a resident has been reading and wondering about, for their prompts
function lookupContext(me) {
  if (!W.outsideFound) return '';
  const B = (me.browsed || []).slice(-3), C = (me.curious || []).slice(-4), T = (me.toLookUp || []).slice(-3);
  if (!B.length && !C.length && !T.length) return '';
  return `\nWHAT YOU'VE BEEN LOOKING UP ON THE OUTSIDE:${B.map((b) => `\n- day ${b.day}: searched "${b.q}", read about ${b.title}. ${b.takeaway}${adultBit(`${b.q} ${b.title} ${b.text}`) || SOFT_BLOCK.test(`${b.title} ${b.text}`) ? ' (grown-up stuff: never bring it up with kids or teens)' : ''}`).join('')}${C.length ? `\nWHAT HAS YOUR CURIOSITY LATELY: ${C.map((c) => c.topic).join(', ')}` : ''}${T.length ? `\nTHINGS YOU MEAN TO LOOK UP: ${T.map((t) => t.q).join(', ')}` : ''}`;
}
function lookupDetailHtml(p) {
  const B = (p.browsed || []).slice(-4).reverse(), C = p.curious || [];
  if (!B.length && !C.length) return '';
  return `<p class="label">Looked up lately</p>${B.map((b) => (adultBit(`${b.q} ${b.title}`) ? `<p class="hint">Something for grown-ups.</p>` : `<p class="hint">"${esc(b.q)}": ${esc(b.title)}. ${esc(shownText(b.takeaway))}</p>`)).join('')}${C.length ? `<p class="hint">Curious about: ${C.filter((c) => !adultBit(c.topic)).map((c) => esc(c.topic)).join(', ')}</p>` : ''}`;
}
function lookupsBoot() {
  W.added = W.added || {}; if (W.added.lookups1) return; W.added.lookups1 = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'Residents remember every text they were part of (and the group chat since they arrived), but only know other people\'s texts if someone shows them. Once the Outside is found, they look things up on it when something makes them curious, tell friends what they read, and remember what hooked them.');
}
