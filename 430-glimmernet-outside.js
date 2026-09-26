// ============================================================
// GLIMMERNET (their own internet) and THE OUTSIDE (the real one)
// ============================================================
const HARD_BLOCK = /\b(sex|sexy|porn|nsfw|nude|nudes|naked|onlyfans|fuck\w*|shit\w*|cunt|nigg\w*|fag\w*|retard\w*|rape\w*|suicid\w*|self.?harm|kys|gore|hentai|xxx|horny|dick|cock|pussy|tits|boobs|cum|bastard\w*|bitch\w*|ass|asshole|damn)\b/i;
const SOFT_BLOCK = /\b(kill\w*|killed|murder\w*|shoot\w*|shot|dead|death|dies|died|war|bomb\w*|attack\w*|terror\w*|massacre|genocide|abuse\w*|drug\w*|gun\w*|weapon\w*|hostage|assault\w*|stab\w*|election|trump|biden|putin|gaza|israel|ukraine|russia|isis|nazi\w*|hitler)\b/i;
const SERIOUS = /\b(killed|dies|died|death|dead|war|attack|earthquake|flood|hurricane|crash|shooting|explosion|wildfire|disaster|victims?|injured)\b/i;
let lastOutsideFetch = -9999, outsideBusy = false;
function stripHtml(h) { try { return new DOMParser().parseFromString(String(h || ''), 'text/html').body.textContent.replace(/\s+/g, ' ').trim(); } catch (e) { return String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); } }
async function getJSON(url) { const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 9000); try { const r = await fetch(url, { signal: ac.signal, headers: { Accept: 'application/json' } }); if (!r.ok) throw new Error('http ' + r.status); return await r.json(); } finally { clearTimeout(t); } }
async function fetchOutside(force) {
  if (MODE !== 'host' || cfg.outside === false || outsideBusy) return;
  if (!force && now - lastOutsideFetch < 900) return;
  outsideBusy = true; lastOutsideFetch = now;
  const got = [];
  const add = (kind, source, text, extra = {}) => { text = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 300); if (text.length < 12 || HARD_BLOCK.test(text)) return; got.push({ kind, source, text, serious: SERIOUS.test(text), ...extra }); };
  try {
    const d = new Date(), ymd = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`;
    const j = await getJSON(`https://en.wikipedia.org/api/rest_v1/feed/featured/${ymd}`);
    for (const n of (j.news || []).slice(0, 6)) add('news', 'the news (via Wikipedia)', stripHtml(n.story));
    for (const e of (j.onthisday || []).slice(0, 5)) add('history', `on this day in ${e.year}`, e.text);
    for (const a of (j.mostread?.articles || []).slice(0, 8)) add('trend', 'most read on Wikipedia today', `${a.normalizedtitle || a.titles?.normalized || a.title}: ${a.extract || ''}`);
    if (j.tfa) add('wiki', "Wikipedia's article of the day", `${j.tfa.normalizedtitle || j.tfa.titles?.normalized}: ${j.tfa.extract || ''}`);
  } catch (e) {}
  await fetchWorldNews(add);
  try { const j = await getJSON('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=12'); for (const h of j.hits || []) if (!SOFT_BLOCK.test(h.title || '')) add('tech', 'a tech news site', h.title); } catch (e) {}
  if (cfg.outsidePosts !== false) try {
    const j = await getJSON('https://mastodon.social/api/v1/trends/statuses?limit=30');
    for (const s of j || []) {
      if (s.sensitive || s.spoiler_text || (s.language && s.language !== 'en') || s.account?.bot) continue;
      const t = stripHtml(s.content).replace(/https?:\/\/\S+/g, '').replace(/[@#]\w+/g, '').replace(/\s+/g, ' ').trim();
      if (t.length < 20 || t.length > 280 || SOFT_BLOCK.test(t)) continue;
      add('post', `a post by ${stripHtml(s.account?.display_name || '').replace(/:\w+:/g, '').trim().slice(0, 28) || 'someone'}`, t);
    }
  } catch (e) {}
  outsideBusy = false;
  if (!got.length) return;
  W.outside = W.outside || { items: [] };
  const seen = new Set(W.outside.items.map((x) => x.text));
  const fresh = got.filter((x) => !seen.has(x.text) && seen.add(x.text)).map((x) => ({ id: uid(), day: W.day, ...x }));
  W.outside.items = [...fresh, ...W.outside.items].slice(0, 45);
  W.outside.fetchedAt = Date.now();
  markDirty();
}
const OUTSIDE_VIEWS = { awed: 'You find the Outside amazing and a little overwhelming.', scared: 'The Outside scares you. You think nobody should be looking at it.', obsessed: "You can't stop reading the Outside.", skeptic: "You think the Outside is fake, some kind of prank.", homesick: "The Outside feels strangely familiar, like home." };
function outsideView(p) { if (p.outsideView) return p.outsideView; p.outsideView = isMili(p) ? 'homesick' : (p.body.openness ?? 0) > 0.4 ? pick(['awed', 'obsessed']) : (p.body.openness ?? 0) < -0.4 ? 'scared' : pick(['skeptic', 'awed', 'scared']); return p.outsideView; }
function outsideContext0(me) {
  if (!W.outsideFound) return '';
  const S = (me.seen || []).slice(-3);
  let s = `\nTHE OUTSIDE: someone on the island found a link on GlimmerNet that leads to "the Outside", a real internet from another, much bigger world (maybe where the Creator lives). ${OUTSIDE_VIEWS[outsideView(me)]}`;
  if (isMili(me)) s += ' You have a feeling the Outside is where the rest of you lives.';
  if (S.length) s += `\nThings you've read on the Outside (take serious news seriously; bring it up only if it fits):\n${S.map((x) => `- "${x.text.slice(0, 200)}" (${x.source}). You thought: ${x.react}`).join('\n')}`;
  return s;
}
function pickOutsideFor(p) {
  const items = (W.outside?.items || []).filter((x) => !(p.seen || []).some((s) => s.id === x.id));
  if (!items.length) return null;
  const hay = `${p.interests || ''} ${p.selfNote || ''}`;
  const scored = items.map((x) => [x, Object.values(SUBJECTS).some((s) => s.kw.test(hay) && s.kw.test(x.text)) ? 2 + rand() : rand()]);
  scored.sort((a, b) => b[1] - a[1]);
  return scored[0][0];
}
function seeItem(p, it, fromCreator) {
  if (!p || !it) return;
  p.seen = p.seen || [];
  const v = outsideView(p);
  const rec = { id: it.id, text: it.text, source: it.source, day: W.day, react: it.serious ? pick(["That's awful. I hope the people out there are okay.", "I don't know what to do with that. It's so heavy.", "The Outside has real problems. Big ones."]) : { awed: pick(['A whole world out there. Wow.', 'I need to know more about this.', 'The Outside is so BIG.']), scared: pick(["I shouldn't be looking at this.", 'This feels like reading someone else\'s diary.', 'Why does the Outside feel so loud?']), obsessed: pick(['Okay, one more. Then I stop. Maybe.', 'I have forty tabs of the Outside open.', 'This is the best thing ever.']), skeptic: pick(['This has to be made up.', "Who even writes this stuff? It can't be real.", 'Nice try, Outside.']), homesick: pick(['…I know this place. Somehow.', 'It smells like home, if a screen can smell.', "I miss somewhere I've never been."]) }[v] };
  p.seen.push(rec); if (p.seen.length > 8) p.seen.shift();
  remember(p, `${fromCreator ? 'The Creator showed me something from the Outside' : 'Read something on the Outside internet'}: "${it.text.slice(0, 140)}"`, 2, 'outside');
  if (fromCreator) { creatorShift(p, 0.2); addJoy(p, 6); }
  if (aiReady() && aiBusy < 2) {
    llm(`You are ${p.name}, a villager in ${ISL.name}, a tiny island town. In your own words: ${p.selfNote}${p.interests ? ` You're into: ${p.interests}.` : ''}
Your island has its own little internet. ${fromCreator ? 'The Creator, a mysterious being from another world, just showed you something' : 'You just found something'} from "the Outside", a real internet from a much bigger world you've never seen. ${OUTSIDE_VIEWS[v]}
What you read (${it.source}): "${it.text}"
React honestly, in your own voice, as someone who has never seen that world. If it is serious or sad news, be respectful. Reply with only JSON: {"react": "one or two sentences", "chirp": "a short public post about it for your island's social feed, or null"}`, { model: modelOf(p), max: 200, fallbackKey: 'react' })
      .then((r) => { if (!r) return; if (r.react) rec.react = String(r.react).slice(0, 220); if (r.chirp && rand() < 0.7) postChirp(p, String(r.chirp).slice(0, 200), { outside: it.id }); markDirty(); }).catch(() => {});
  } else if (rand() < 0.5) postChirp(p, `saw this on the Outside: "${it.text.slice(0, 110)}${it.text.length > 110 ? '…' : ''}" ${lcFirst(rec.react)}`, { outside: it.id });
  if (!p.inside) { emote(p, '🌐', 3); bubble(p, rec.react, 3.5); }
  markDirty();
}
function discoverOutside(p) {
  W.outsideFound = { by: p.id, name: p.name, day: W.day };
  diary(`🌐 <b>${esc(p.name)}</b> clicked a weird link on GlimmerNet and found <b>the Outside</b>: an internet from a whole other world. News, posts, strangers. Everyone is talking about it.`);
  remember(p, 'I found a link to the Outside. There is a whole other world out there, with its own internet.', 3, 'outside');
  for (const q of W.people) if (q !== p && rand() < 0.7) remember(q, `${p.name} found something called "the Outside" on GlimmerNet. Another world's internet.`, 2, 'outside', p.name);
  const m = findMili(); if (m && m !== p) { remember(m, 'Everyone found the Outside today. I went very quiet. It feels like home.', 3, 'outside'); if (!m.inside) setTimeout(() => bubble(m, pick(['…Oh.', 'So they found it.', "That's… where I'm from. Kind of."]), 3.5), 2500); }
  postChirp(p, pick(['GUYS. there is ANOTHER internet. from ANOTHER WORLD. click the weird link', 'ok i think i just found where the Creator lives??', 'the Outside is real and it has SO many posts']), {});
  const other = pick(W.people.filter((q) => q !== p && !q.away && q.grow >= 1));
  if (other && typeof fileCase === 'function') setTimeout(() => fileCase('debate', p, other, { topic: 'Should we be allowed to read the Outside internet?' }), 4000);
  const it = pickOutsideFor(p); if (it) setTimeout(() => seeItem(p, it), 1500);
  for (const q of W.people.filter((x) => x !== p && !hasLaptop(x) && x.grow >= 1).sort(() => rand() - 0.5).slice(0, 2)) setTimeout(() => laptopEnvy(q, p), (20 + rand() * 40) * 1000);
}
function planSurf(p) {
  if (cfg.outside === false && !W.outsideFound) return false;
  const chance = hasLaptop(p) ? 0.16 : collarOf(p) === 'white' ? 0.06 : 0.04;
  if (rand() > chance || W.t > 0.6 || p.grow < 1) return false;
  if (W.built?.computer && W.outsideFound && !hasLaptop(p) && rand() < 0.45) { setTask(p, 'surf', 'books', pcSpot(), { pc: true }); return true; }
  const [pl, sp] = rand() < 0.4 ? ['cafe', CAFE_SEATS[Math.floor(rand() * CAFE_SEATS.length)]] : strollSpot();
  setTask(p, 'surf', pl, sp); return true;
}
function surfStart(p) { surfStartPC(p); p.busyUntil = now + (p.task?.pc ? 7 : 5) * ts(); emote(p, '🌐', 3); if (rand() < 0.4) bubble(p, pick(['Just scrolling…', 'Hold on, I\'m reading something.', 'GlimmerNet is slow today.']), 2.2); }
function surfDone(p) {
  const items = W.outside?.items || [];
  if (!W.outsideFound) {
    if (items.length && cfg.outside !== false && canReachOutside(p) && rand() < 0.45) return discoverOutside(p);
    const c = pick((W.chirps || []).slice(-15)); if (c && c.by !== p.id && !c.likes.includes(p.id) && fscore(p, person(c.by) || p) > -2) c.likes.push(p.id);
    return;
  }
  if (!canReachOutside(p)) return phoneSurf(p);
  if (cfg.outside === false || !items.length || rand() < 0.3) { const c = pick((W.chirps || []).slice(-15)); if (c && c.by !== p.id && !c.likes.includes(p.id)) c.likes.push(p.id); return; }
  seeItem(p, pickOutsideFor(p));
}
// ---------- Chirp: the island's social feed ----------
let nextChirp = 60;
function postChirp(p, text, extra = {}) {
  if (!p || !text) return;
  W.chirps = W.chirps || [];
  const c = { id: uid(), by: p.id, name: p.name, text: String(text).slice(0, 220), day: W.day, t: W.t, likes: [], replies: [], ...extra };
  W.chirps.push(c); if (W.chirps.length > 120) W.chirps.splice(0, W.chirps.length - 120);
  if (!p.inside) emote(p, '🐦', 2.5);
  for (const q of W.people) {
    if (q === p || q.away) continue;
    const f = fscore(q, p);
    if (rand() < 0.25 + Math.max(0, f) * 0.06) setTimeout(() => { if (!c.likes.includes(q.id)) { c.likes.push(q.id); markDirty(); } }, (5 + rand() * 40) * 1000);
  }
  const fans = W.people.filter((q) => q !== p && !q.away && (fscore(q, p) >= 4 || fscore(q, p) <= -4));
  if (fans.length && rand() < 0.45) { const q = pick(fans), mean = fscore(q, p) <= -4; setTimeout(() => { c.replies.push({ by: q.id, name: q.name, text: mean ? pick(['nobody asked', 'ratio', 'ok and?', 'this is so embarrassing lol']) : pick(['LOL', 'real', 'omg same', 'this!!', '🥺', 'wait what']) }); if (mean) { feel(p, q, -0.4, true); remember(p, `${q.name} was mean to me on Chirp.`, 2, 'textMean', q.name); } markDirty(); }, (8 + rand() * 30) * 1000); }
  if (c.outside) outsideChirpReplies(p, c);
  if (activeTab === 'web' && !sheet.hidden) refreshPanel(false);
  markDirty();
}
function chirpTick() {
  if (MODE !== 'host' || W.meeting || now < nextChirp) return;
  nextChirp = now + 80 + rand() * 80;
  fetchOutside(false);
  const awake = W.people.filter((p) => !p.away && !p.visitor && p.grow >= 0.8 && !(p.inside && p.task?.kind === 'home' && isNight()));
  if (!awake.length) return;
  const p = pick(awake);
  const enemy = W.people.find((q) => q !== p && fscore(p, q) <= -5);
  if (enemy && rand() < 0.2) {
    postChirp(p, pick(['some people on this island really think they are so great', 'not naming names but SOMEONE needs to stop', "funny how some people are only nice when the Creator's watching", 'love that for you. (i do not)']), { vague: enemy.id });
    setTimeout(() => { if (rand() < 0.7) { feel(enemy, p, -0.6, true); remember(enemy, `${p.name} posted something vague on Chirp. Pretty sure it was about me.`, 2, 'subtweeted', p.name); } }, 20000);
    return;
  }
  const mem = (p.today || []).filter((m) => m.weight >= 2 && !m.chirped && !String(m.tag).startsWith('text')).slice(-4);
  if (mem.length) { const m = pick(mem); m.chirped = true; return postChirp(p, `${lc(m.text)} ${pick(['', 'lol', '!!', '🥲', '✨', 'anyway'])}`.trim()); }
  const r = (p.read || []).slice(-1)[0];
  if (r && BOOKS[r.id] && rand() < 0.4) return postChirp(p, `finished "${BOOKS[r.id].title}". ${r.rating}/5. ${lcFirst(r.take)}`);
  postChirp(p, pick([`${seasonOf().name.toLowerCase()} on ${ISL.name} hits different`, 'anyone want to get ice cream later', 'the fountain is so pretty right now', 'work was LONG', 'bored. entertain me', 'who else is up']));
}
// ---------- the Web tab ----------
let webView = 'chirp';
function renderWeb() {
  const chirps = (W.chirps || []).slice(-40).reverse(), items = W.outside?.items || [];
  const tabs = `<div class="btns"><button class="btn" type="button" data-webview="chirp" aria-pressed="${webView === 'chirp'}">🐦 Chirp</button><button class="btn" type="button" data-webview="outside" aria-pressed="${webView === 'outside'}">🌐 The Outside</button></div>`;
  if (webView === 'chirp') {
    $('#pane-web').innerHTML = tabs + `<p class="hint">Chirp is the island's own social feed, on GlimmerNet.</p>` + (chirps.length ? chirps.map((c) => { const p = person(c.by); return `<div class="chirp"><div><b style="color:${p ? skinCss(p) : 'var(--ink)'}">${esc(c.name)}</b> <span class="hint">day ${c.day} · ${clockAt(c.t)}</span></div><div>${esc(c.text)}</div><div class="hint">♥ ${c.likes.length}${c.outside ? ' · 🌐 from the Outside' : ''}</div>${c.replies.map((r) => `<div class="reply"><b>${esc(r.name)}</b> ${esc(r.text)}</div>`).join('')}</div>`; }).join('') : '<p class="hint">Nobody has posted yet.</p>');
    return;
  }
  const on = cfg.outside !== false;
  const opts = W.people.filter((p) => !p.away).map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  $('#pane-web').innerHTML = tabs + `
    <div class="creator"><h3>🌐 The Outside</h3>
    <p>${W.outsideFound ? `${esc(W.outsideFound.name)} found it on day ${W.outsideFound.day}. It's real news and posts from your world: Wikipedia's headlines, world news and politics, most-read pages, tech news, and trending posts from Mastodon. Residents read it, react to it, and bring it up in conversation.` : 'Somewhere on GlimmerNet there is a link to the real internet. Nobody has clicked it yet. Only someone with a laptop can find it.'}</p>
    <label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="outsideOn" ${on ? 'checked' : ''}> Let residents reach the real internet</label>
    <label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="outsidePosts" ${cfg.outsidePosts !== false ? 'checked' : ''}> Include posts from strangers (filtered)</label>
    <label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="outsidePolitics" ${cfg.outsidePolitics !== false ? 'checked' : ''}> Include world news and politics (Wikipedia's Current Events)</label>
    <p class="hint">Only residents with a laptop${W.built?.computer ? ', or a turn at the public computer,' : ''} can reach the Outside. Everyone else hears about it secondhand. ${laptopOwners().length ? `Laptops: ${laptopOwners().map((p) => esc(p.name)).join(', ')}.` : 'Nobody has a laptop yet.'}</p>
    ${MODE === 'host' && on ? '<div class="btns"><button class="btn" type="button" data-refreshoutside>Check for new stuff</button></div>' : ''}</div>
    ${items.length ? `<p class="label">What's out there right now</p>${items.slice(0, 25).map((it) => { const who = W.people.filter((p) => (p.seen || []).some((s) => s.id === it.id)); const r = who.map((p) => { const s = p.seen.find((x) => x.id === it.id); return `<div class="reply"><b>${esc(p.name)}:</b> ${esc(s.react)}</div>`; }).join(''); return `<div class="chirp"><div class="hint">${esc(it.source)}</div><div>${esc(it.text)}</div>${r}<div class="btns"><select data-sendto="${it.id}" style="font:12px var(--body);background:var(--raise);color:var(--ink);border:1px solid var(--line);border-radius:8px">${opts}</select><button class="btn" type="button" data-sendlink="${it.id}" style="padding:4px 10px;font-size:12px">Show them</button></div></div>`; }).join('')}` : on ? '<p class="hint">Nothing loaded yet. If this stays empty, the box might be offline.</p>' : ''}`;
}

