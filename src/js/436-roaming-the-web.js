// ============================================================
// ROAMING THE WEB: real web search, random clicking, and doomscrolling the feeds
// ============================================================
// Once the Outside is found, residents don't only read Wikipedia. They search the whole web
// (OpenRouter's web search on the player's key, about $0.007 a search, at most WEB_SEARCHES_A_DAY
// a day), click around and land on random pages, and scroll real feeds: trending posts and news
// links from Mastodon, the tech front page, the day's news and most-read pages. Scrolling changes
// their mood, keeps night owls up, and gives them things to bring up. The hard filter holds for
// everyone; kids and teens also skip hard news; grown-ups see it while news is on in the Web tab.
const WEB_SEARCHES_A_DAY = 30;
const SCROLL_GAP = 4 * 60e3;
let scrollBusy = false, nextScrollAt = Date.now() + 90e3, scrollFeedAt = 0, scrollFeed = [];
function webSearchOn() { return lookOn() && cfg.outsideSearch !== false && aiReady() && voiceRoom(); }
function webSearchLeft() {
  const d = new Date().toDateString(), S = W.webSearches = W.webSearches || { day: '', n: 0 };
  if (S.day !== d) { S.day = d; S.n = 0; }
  return WEB_SEARCHES_A_DAY - S.n;
}
// a real web search through the model, which reads the pages and reports what they say
async function webFind(p, q) {
  if (!webSearchOn() || webSearchLeft() <= 0 || rand() < 0.35) return null;
  W.webSearches.n++;
  const kid = lookKid(p);
  const prompt = `Search the web for: ${q}
Read what comes up and report back plainly, like a summary of the best page.${kid ? ' This is for a kid, so pick something kid-safe.' : ' This is for a grown-up: report what the pages say, whatever it is, but describe anything sexual in plain non-explicit words and never repeat slurs.'} Facts from the pages only.
Reply with only JSON: {"title": "the page or topic most worth reading", "source": "the website's name", "text": "what it says, 3 to 6 sentences"}`;
  voiceToday(); VOICE.calls++; voiceDirty = true;
  let cites = [];
  const r = await within(llm(prompt, { temperature: 0.4, max: 400, fallbackKey: 'text', patience: 30000, plugins: [{ id: 'web', max_results: 3 }], onCites: (c) => { cites = c; } }), 45000).catch(() => null);
  const text = String(r?.text || '').replace(/\s+/g, ' ').trim();
  if (!r || text.length < 40 || !lookTextOk(p, `${r.title || ''} ${text}`)) return null;
  let host = ''; try { host = new URL(cites[0]?.url || '').hostname.replace(/^www\./, ''); } catch (e) {}
  return { title: fitLine(String(r.title || q), 90), text: fitLine(text, 900), source: String(r.source || host || 'the web').slice(0, 60), web: true };
}
// a random page, the way people click around
async function webRandom(p) {
  for (let i = 0; i < 3; i++) {
    const j = await getJSON('https://en.wikipedia.org/api/rest_v1/page/random/summary').catch(() => null);
    const title = String(j?.title || ''), text = String(j?.extract || '').replace(/\s+/g, ' ').trim();
    if (j && j.type !== 'disambiguation' && text.length >= 60 && lookTextOk(p, `${title} ${text}`)) return { title: title.slice(0, 90), text: fitLine(text, 900), source: 'Wikipedia (random article)' };
  }
  return null;
}
// what's in the feeds right now: kept a while, refreshed every 15 minutes
async function loadScrollFeed() {
  if (Date.now() - scrollFeedAt < 15 * 60e3 && scrollFeed.length) return scrollFeed;
  scrollFeedAt = Date.now();
  const got = [];
  const add = (source, text, kind) => { text = String(text || '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 320); if (text.length >= 20) got.push({ id: 'f' + feedHash(text), source, text, kind, hard: SOFT_BLOCK.test(text) }); };
  const tasks = [
    getJSON('https://mastodon.social/api/v1/trends/links?limit=20').then((j) => { for (const l of j || []) if (!l.provider_name || !/^(x|twitter)$/i.test(l.provider_name)) add(l.provider_name || 'a news site', `${stripHtml(l.title)}${l.description ? `. ${stripHtml(l.description)}` : ''}`, 'news'); }),
    cfg.outsidePosts === false ? null : getJSON('https://mastodon.social/api/v1/trends/statuses?limit=30').then((j) => { for (const s of j || []) { if ((s.language && s.language !== 'en') || s.account?.bot) continue; add(`a post by ${stripHtml(s.account?.display_name || '').replace(/:\w+:/g, '').trim().slice(0, 28) || 'a stranger'}`, stripHtml(s.content).replace(/[@#]\w+/g, ''), 'post'); } }),
    getJSON('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=15').then((j) => { for (const h of j.hits || []) add('a tech news site', h.title, 'tech'); }),
    (() => { const d = new Date(); return getJSON(`https://en.wikipedia.org/api/rest_v1/feed/featured/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`); })().then((j) => {
      for (const n of (j.news || []).slice(0, 8)) add('the news', stripHtml(n.story), 'news');
      for (const a of (j.mostread?.articles || []).slice(0, 10)) add('most read today', `${a.normalizedtitle || a.titles?.normalized || a.title}: ${a.extract || ''}`, 'trend');
    }),
  ];
  await Promise.all(tasks.map((t) => t && t.catch(() => null)));
  if (got.length) scrollFeed = got.sort(() => rand() - 0.5).slice(0, 80);
  return scrollFeed;
}
function feedHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
// who picks up their phone to scroll: the bored, the anxious, the ones still up at night
function scrollDue(free) {
  if (scrollBusy || Date.now() < nextScrollAt || !aiReady() || !voiceRoom()) return false;
  nextScrollAt = Date.now() + SCROLL_GAP * (0.7 + rand() * 0.8);
  const up = W.people.filter((p) => canLookUp(p) && p.state === 'free' && !isAsleep(p) && (free.includes(p) || (p.inside && p.task?.kind === 'home')));
  if (!up.length) return false;
  const w = (p) => 1 + ((p.mood || 0) < -0.3 ? 1.5 : 0) + (W.t >= 0.6 ? 2 : 0) + (sleepOf(p).type === 'owl' ? 1 : 0) + (stageOf(p) === 'teen' ? 1 : 0);
  let r = rand() * up.reduce((s, p) => s + w(p), 0), who = up[0];
  for (const p of up) { r -= w(p); if (r <= 0) { who = p; break; } }
  doomscroll(who);
  return true;
}
async function doomscroll(p) {
  if (scrollBusy || !canLookUp(p)) return false;
  scrollBusy = true;
  try {
    const feed = (await loadScrollFeed()).filter((x) => lookTextOk(p, x.text) && !(p.scrolled || []).includes(x.id));
    if (feed.length < 3) return false;
    const n = 4 + Math.floor(rand() * 4), items = feed.slice(0, n);
    const late = W.t >= 0.6 || W.t < 0.1;
    const prompt = `${voiceCard(p)}${outsideClockContext()}${lookupContext(p)}${sleepNote(p)}
${voiceRules()}
- React to what the posts say. Don't add facts they don't have.
${p.name} is scrolling the Outside on their phone${late ? ' late at night when they should be asleep' : ''}. Their feed:
${items.map((x, i) => `${i + 1}. (${x.source}) ${x.text}`).join('\n')}

How does ${p.name} take it, as a real person scrolling? Some posts get a shrug, some a laugh, some get under your skin. Hard news can weigh on you; scrolling too long can leave you wired or empty.
Reply with only JSON: {"reacts": ["a quick reaction to each item, in order, in their own voice"], "stuck": the number of the one that stuck with them, "feeling": -2 to 2 (how they feel after scrolling), "takeaway": "what they'll remember, one sentence in their own words", "kept_going": true or false (did they lose track of time), "look_up": "something it makes them want to search, or null", "tell": "the name of someone in town they'd send it to, or null", "post": "a Chirp post about it, or null"}`;
    voiceToday(); VOICE.calls++; voiceDirty = true;
    const v = await within(llm(prompt, { model: modelOf(p), temperature: 1.0, max: 500, fallbackKey: 'takeaway', patience: 30000 }), 40000).catch(() => null);
    if (!v || !W) return false;
    p.scrolled = [...(p.scrolled || []), ...items.map((x) => x.id)].slice(-80);
    const R = Array.isArray(v.reacts) ? v.reacts : [];
    const k = clamp((Math.round(Number(v.stuck)) || 1) - 1, 0, items.length - 1), it = items[k];
    const react = fitLine(String(R[k] || v.takeaway || 'Huh.'), 220), takeaway = fitLine(String(v.takeaway || it.text), 220);
    p.seen = [...(p.seen || []), { id: it.id, text: it.text, source: it.source, react, day: W.day }].slice(-12);
    const feeling = clamp(Math.round(Number(v.feeling) || 0), -2, 2);
    p.mood = clamp((p.mood || 0) + feeling * 0.12, -1, 1);
    if (feeling < 0) addJoy(p, feeling * 3); else if (feeling > 0) addJoy(p, feeling * 2);
    remember(p, `Scrolled the Outside${late ? ' way too late' : ''}. ${shownText(takeaway, 'Saw some grown-up stuff.')}`, Math.abs(feeling) >= 2 ? 2 : 1, 'scroll');
    if (late && v.kept_going && p.sleep && !asleepTime(p)) { p.sleep.late = (p.sleep.late || 0) + 0.5; p.sleep.why = p.sleep.why || 'stayed up scrolling'; }
    p.scrolls = [...(p.scrolls || []), { day: W.day, text: it.text, source: it.source, react, feeling, at: Date.now() }].slice(-6);
    if (!p.inside) { emote(p, feeling < 0 ? '😶' : '📱', 3); if (!adultBit(react)) bubble(p, react, 3.5); }
    if (v.look_up) wantLookUp(p, v.look_up, `after scrolling past "${fitLine(it.text, 60)}"`);
    // grown-up stuff never gets passed on to kids or teens
    const forKids = !adultBit(it.text) && !SOFT_BLOCK.test(it.text);
    const friend = v.tell && W.people.find((q) => q !== p && q.name.toLowerCase() === String(v.tell).toLowerCase() && !q.away && !isAsleep(q) && (forKids || !lookKid(q)));
    if (friend && rand() < 0.5) startConvo(p, friend, { kind: 'outside', who: friend.name, mem: { text: `saw this on the Outside: ${fitLine(it.text, 140)}` } });
    else if (v.post && rand() < 0.4) postChirp(p, String(v.post), {});
    markDirty();
    return true;
  } finally { scrollBusy = false; }
}
function scrollDetailHtml(p) {
  const S = (p.scrolls || []).slice(-3).reverse();
  return S.length ? `<p class="label">Scrolled lately</p>${S.map((s) => (adultBit(`${s.text} ${s.react}`) ? `<p class="hint">${esc(s.source)}: something for grown-ups.</p>` : `<p class="hint">${esc(s.source)}: "${esc(fitLine(s.text, 120))}" ${esc(s.react)}</p>`)).join('')}` : '';
}
function roamBoot() {
  W.added = W.added || {}; if (W.added.roam1) return; W.added.roam1 = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'Once the Outside is found, residents roam the real web: they search it (with your key, about $0.007 a search, 30 a day at most; switch it off in the Web tab), click into random pages, and doomscroll trending posts and news. Grown-ups browse whatever they like; kids and teens get a filtered web, and grown-ups do not pass the worst of it on to them.');
}
