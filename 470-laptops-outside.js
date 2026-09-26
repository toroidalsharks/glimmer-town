// ============================================================
// LAPTOPS & THE OUTSIDE: who can read it, who talks about it,
// who gets jealous, and who saves up
// ============================================================
const LAPTOP_COST = 45, GIFT_LAPTOP_COST = 60;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CE_CATS = { 'Politics and elections': 'politics', 'International relations': 'politics', 'Business and economy': 'world', 'Science and technology': 'world', 'Health and environment': 'world', 'Arts and culture': 'world', 'Sports': 'world', 'Disasters and accidents': 'world', 'Armed conflicts and attacks': null, 'Law and crime': null };
const canReachOutside = (p) => hasLaptop(p) || !!(p.task && p.task.pc);
async function getText(url) { const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 9000); try { const r = await fetch(url, { signal: ac.signal, headers: { Accept: 'text/html' } }); if (!r.ok) throw new Error('http ' + r.status); return await r.text(); } finally { clearTimeout(t); } }
function parseCurrentEvents(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html'), out = [];
  let cat = null;
  const cats = Object.keys(CE_CATS);
  for (const el of doc.body.querySelectorAll('p, b, strong, [role="heading"], [class*="heading"], ul')) {
    if (el.tagName !== 'UL') { const t = el.textContent.replace(/\s+/g, ' ').trim(); if (t.length < 45) { const k = cats.find((c) => t.toLowerCase().startsWith(c.toLowerCase())); if (k) cat = k; } continue; }
    if (el.parentElement && el.parentElement.closest('li')) continue;
    if (!cat || !CE_CATS[cat]) continue;
    for (const li of el.querySelectorAll('li')) {
      if (li.querySelector('ul')) continue;
      let text = li.textContent.replace(/\s+/g, ' ').trim();
      for (let i = 0; i < 3; i++) text = text.replace(/\s*\([^()]{1,40}\)\s*$/, '').trim();
      if (text.length < 25) continue;
      const par = li.parentElement && li.parentElement.closest('li');
      const topic = par ? ((par.querySelector(':scope > a') || par.firstChild)?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) : '';
      out.push({ cat, kind: CE_CATS[cat], topic, text: topic && !text.startsWith(topic) ? `${topic}: ${text}` : text });
    }
  }
  return out.sort((a, b) => (a.kind === 'politics' ? 0 : 1) - (b.kind === 'politics' ? 0 : 1));
}
async function fetchWorldNews(add) {
  if (cfg.outsidePolitics === false) return;
  for (const dd of [0, 1]) {
    try {
      const d = new Date(Date.now() - dd * 864e5), title = `Portal:Current_events/${d.getUTCFullYear()}_${MONTHS[d.getUTCMonth()]}_${d.getUTCDate()}`;
      const ev = parseCurrentEvents(await getText(`https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`));
      let pol = 0, wor = 0;
      for (const e of ev) { if (e.kind === 'politics' ? pol++ >= 6 : wor++ >= 3) continue; add(e.kind, `world news, ${e.cat.toLowerCase()} (via Wikipedia)`, e.text, { cat: e.cat }); }
    } catch (e) {}
  }
}

// hearing about it secondhand
function hearOutside(p, it, from) {
  if (!p || !it || (p.seen || []).some((s) => s.id === it.id) || (p.heard || []).some((s) => s.id === it.id)) return false;
  p.heard = p.heard || [];
  p.heard.push({ id: it.id, text: it.text, source: it.source, serious: it.serious, kind: it.kind, from: from?.name || 'someone', day: W.day });
  if (p.heard.length > 6) p.heard.shift();
  remember(p, `${from ? from.name : 'Someone'} told me what's going on in the Outside: "${String(it.text).slice(0, 110)}"`, 1, 'outside', from?.name || null);
  return true;
}
function outsideItem(id) { return (W.outside?.items || []).find((x) => x.id === id) || null; }
function recentOutside(p, days = 2) { return [...(p.seen || []).filter((x) => W.day - x.day <= days).map((x) => ({ ...x, own: true })), ...(p.heard || []).filter((x) => W.day - x.day <= 1)]; }
function outsideNudge(a, b) {
  if (!W.outsideFound || cfg.outside === false) return '';
  const L = recentOutside(a).filter((x) => !(b.seen || []).some((s) => s.id === x.id));
  if (L.length && rand() < 0.45) {
    const pol = L.filter((x) => x.kind === 'politics'), it = pol.length && rand() < 0.6 ? pick(pol) : pick(L);
    hearOutside(b, it, a);
    if (hasLaptop(a) && !hasLaptop(b)) setTimeout(() => laptopEnvy(b, a), 6000);
    return ` Something from the Outside is on your mind: "${String(it.text).slice(0, 240)}" (${it.source}${it.own ? '' : `; ${it.from} told you about it`}). Bring it up with ${b.name} and say what you think about it.${it.serious ? ' It is serious news, so be respectful.' : ''}${it.kind === 'politics' ? " It's politics from another world; you can have an opinion, but stick to what the news actually says." : ''}`;
  }
  if (hasLaptop(b) && !hasLaptop(a) && W.day - (a.askedOutside ?? -9) >= 1 && rand() < 0.35) { a.askedOutside = W.day; setTimeout(() => laptopEnvy(a, b), 6000); return ` ${b.name} has a laptop and can read the Outside whenever they want. You don't have one. Ask them what's going on out there${a.saving ? " (you're saving up for your own)" : ", and maybe let a little jealousy show"}.`; }
  return '';
}
function outsideOpening(a, b) {
  if (!W.outsideFound || cfg.outside === false) return null;
  const L = recentOutside(a).filter((x) => !(b.seen || []).some((s) => s.id === x.id));
  if (L.length && rand() < 0.25) {
    const it = pick(L); hearOutside(b, it, a);
    const envy = hasLaptop(a) && !hasLaptop(b); if (envy) setTimeout(() => laptopEnvy(b, a), 5000);
    const short = String(it.text).slice(0, 90) + (it.text.length > 90 ? '…' : '');
    return { say: it.own ? pick([`Did you see this on the Outside? "${short}"`, `I read something on the Outside: "${short}"`, `Okay so on the Outside, "${short}"`]) : `${it.from} told me "${short}". About the Outside!`, action: 'chat', feeling: 1, topic: 'outside',
      reply: { say: it.serious ? pick(["That's awful.", "I hope they're okay out there.", "Heavy. I don't know what to say."]) : envy ? pick(['Must be nice having a laptop.', "Wait, what? Show me. …Oh, right, I can't.", 'I wish I could see it myself.']) : pick(['No way.', 'The Outside is so weird.', 'Wait, really?', 'Huh. Tell me more.']), action: 'chat', feeling: envy ? 0 : 1 } };
  }
  if (hasLaptop(b) && !hasLaptop(a) && rand() < 0.12) { setTimeout(() => laptopEnvy(a, b), 4000); return { say: pick(["What's going on in the Outside today?", 'Can I borrow your laptop for like five minutes?', 'Must be nice, reading the Outside whenever you want.']), action: 'chat', feeling: 0, reply: { say: pick(['Sure, for a minute.', 'Get your own, lol.', 'Honestly? A lot. It never stops.', 'I can tell you about it.']), action: 'chat', feeling: 0 } }; }
  return null;
}

// jealousy and saving up
function laptopEnvy(p, owner) {
  if (!p || hasLaptop(p) || p.grow < 1 || p.visitor || p.away) return;
  if (W.day - (p.envyDay ?? -9) < 1) return;
  p.envyDay = W.day;
  if (!p.saving && rand() < 0.5) {
    p.saving = { what: 'laptop', goal: LAPTOP_COST, since: W.day, inspired: owner?.name || null, helped: [] };
    remember(p, `${owner ? `${owner.name} has a laptop and gets to read the Outside.` : 'Everyone with a laptop gets to read the Outside.'} I'm saving up for my own.`, 2, 'laptopEnvy', owner?.name || null);
    diary(`💻 <b>${esc(p.name)}</b> started saving up for a laptop${owner ? ` after hearing ${esc(owner.name)} talk about the Outside` : ''}.`);
    if (typeof postChirp === 'function' && rand() < 0.5) postChirp(p, pick(['saving up for a laptop. do not ask me to get ice cream', `day 1 of saving for a laptop. i have ${p.coins} coins`, 'i am so tired of hearing about the Outside secondhand. saving up']));
    if (!p.cr.wish && p.cr.score >= 1 && rand() < 0.4) p.cr.wish = { kind: 'decor', id: 'laptop', color: topColors(p)[0] || 'silver', day: W.day };
    if (owner && fscore(p, owner) < 3 && rand() < 0.5) feel(p, owner, -0.3, true);
  } else remember(p, pick(['Everyone with a laptop keeps talking about the Outside. Must be nice.', 'I only ever hear about the Outside secondhand.']), 1, 'laptopEnvy', owner?.name || null);
  if (!p.inside && rand() < 0.5) setTimeout(() => bubble(p, pick(['Must be nice having a laptop.', "I'm saving up. You'll see.", 'One day I\'ll read the Outside myself.']), 2.4), 3000);
}
function laptopOwners() { return W.people.filter((p) => hasLaptop(p)); }
let ownersSeen = null;
function laptopTick() {
  const ids = laptopOwners().map((p) => p.id);
  if (!ownersSeen) { ownersSeen = new Set(ids); return; }
  for (const id of ids) if (!ownersSeen.has(id)) {
    ownersSeen.add(id);
    const p = person(id); if (!p) continue;
    if (p.saving) { p.saving = null; }
    const others = W.people.filter((q) => q !== p && !hasLaptop(q) && q.grow >= 1 && !q.away).sort(() => rand() - 0.5).slice(0, 2);
    for (const q of others) setTimeout(() => laptopEnvy(q, p), (8 + rand() * 30) * 1000);
  }
  for (const id of [...ownersSeen]) if (!ids.includes(id)) ownersSeen.delete(id);
}
function laptopMorning() {
  selfMotivatedSaving();
  const savers = W.people.filter((p) => p.saving && !hasLaptop(p));
  for (const p of savers) {
    const S = p.saving;
    const friends = W.people.filter((q) => q !== p && !q.saving && q.coins >= 25 && fscore(q, p) >= 5 && !q.away);
    for (const q of friends) if (rand() < 0.3) {
      const n = 2 + Math.floor(rand() * 4); q.coins -= n; p.coins += n; S.helped = [...new Set([...(S.helped || []), q.name])];
      remember(q, `Chipped in ${plural(n, 'coin')} toward ${p.name}'s laptop.`, 2, 'gaveKind', p.name); remember(p, `${q.name} chipped in ${plural(n, 'coin')} toward my laptop!`, 2, 'gotKind', q.name); feel(p, q, 0.6, true);
      diary(`🤝 <b>${esc(q.name)}</b> chipped in ${plural(n, 'coin')} toward <b>${esc(p.name)}</b>'s laptop.`);
    }
    if (typeof postChirp === 'function' && rand() < 0.25) postChirp(p, `laptop fund: ${Math.min(p.coins, S.goal)}/${S.goal}. ${pick(['almost there', 'skipping dessert again', 'this is taking forever', 'we ball'])}`);
    if (W.day - S.since >= 20 && p.coins < S.goal * 0.4 && rand() < 0.3) { remember(p, 'I gave up saving for a laptop. Maybe someday.', 2, 'wishLost'); p.saving = null; }
  }
  if (W.people.length && W.day % 3 === 0 && !W.built?.computer && W.outsideFound) { const n = W.people.filter((p) => !hasLaptop(p) && p.grow >= 1).length; if (n >= 3) for (const p of W.people) if (!hasLaptop(p) && rand() < 0.3) remember(p, 'Most of us still can\'t read the Outside. Maybe the town should get a public computer.', 1, 'idea'); }
}
function planBuyLaptop(p) {
  if (!p.saving || hasLaptop(p) || W.t > 0.55 || p.grow < 1) return false;
  const can = sharing() && !p.visitor ? (W.pantry || 0) >= p.saving.goal + 20 : p.coins >= p.saving.goal;
  if (!can) return false;
  setTask(p, 'buylaptop', 'labs', jitter(TOWN.labs.spot, 1)); return true;
}
function buyLaptopStart(p) { p.busyUntil = now + 3 * ts(); emote(p, '💻', 3); bubble(p, pick(['One laptop, please. I saved up.', 'I have the coins! All of them!', 'Is the refurbished one still here?']), 2.6); }
function buyLaptopDone(p) {
  const S = p.saving; if (!S || hasLaptop(p)) return;
  if (sharing() && !p.visitor) { if ((W.pantry || 0) < S.goal) return; W.pantry -= S.goal; } else { if (p.coins < S.goal) return; p.coins -= S.goal; }
  const it = newItem('decor', 'laptop', topColors(p)[0] || 'silver', null, 1); p.decor.push(it);
  const days = W.day - S.since;
  p.saving = null; addJoy(p, 30); ownersSeen?.add(p.id);
  if (p.cr.wish?.id === 'laptop') p.cr.wish = null;
  remember(p, `I bought my own laptop after saving for ${plural(Math.max(1, days), 'day')}${S.helped?.length ? `, with help from ${S.helped.join(' and ')}` : ''}. Now I can read the Outside myself.`, 3, 'laptopGot');
  for (const n of S.helped || []) { const q = W.people.find((x) => x.name === n); if (q) { feel(p, q, 0.8, true); remember(q, `${p.name} finally bought their laptop. I helped!`, 2, 'gaveKind', p.name); } }
  diary(`💻 <b>${esc(p.name)}</b> saved up for ${plural(Math.max(1, days), 'day')} and bought a refurbished laptop from Glimmer Labs!${S.helped?.length ? ` ${esc(S.helped.join(' and '))} helped.` : ''}`);
  bubble(p, pick(['IT\'S MINE. I bought it myself.', 'Hello, Outside. Finally.', 'Worth every skipped dessert.']), 3);
  if (typeof postChirp === 'function') postChirp(p, pick(['I GOT A LAPTOP. saved up for it myself', 'laptop acquired. the Outside is MINE now', `${plural(Math.max(1, days), 'day')} of saving. worth it. laptop!!`]));
  const others = W.people.filter((q) => q !== p && !hasLaptop(q) && q.grow >= 1).sort(() => rand() - 0.5).slice(0, 2);
  for (const q of others) setTimeout(() => laptopEnvy(q, p), (10 + rand() * 20) * 1000);
}
function creatorLaptop(pid) {
  const p = person(pid); if (!p) return '';
  if (hasLaptop(p)) return `${p.name} already has a laptop.`;
  if (W.creator.coins < GIFT_LAPTOP_COST) return `A new laptop costs ${GIFT_LAPTOP_COST} coins.`;
  W.creator.coins -= GIFT_LAPTOP_COST;
  const it = newItem('decor', 'laptop', topColors(p)[0] || 'silver', null, 1); p.decor.push(it);
  const wished = p.cr.wish?.id === 'laptop', was = p.saving;
  p.saving = null; if (wished) p.cr.wish = null;
  creatorShift(p, wished ? 1.5 : 1); addJoy(p, 35); W.creator.gifts[p.id] = (W.creator.gifts[p.id] || 0) + 1;
  remember(p, `The Creator gave me a brand-new laptop${was ? ` while I was still saving up for one. I get to keep my ${plural(p.coins, 'coin')}` : ''}.`, 3, wished ? 'wishGranted' : 'creatorGift', null, { what: 'a laptop' });
  diary(`💻 The <span class="cr">Creator</span> gave <b>${esc(p.name)}</b> a brand-new laptop${was ? ' (they had been saving up for one)' : ''}.`);
  const line = pick(was ? ['WAIT. I was saving for this! Thank you!!', "I don't have to skip dessert anymore?!", 'You saw me saving? …Thank you.'] : ['A laptop?! For me?!', 'The Outside, here I come.', 'This changes everything. Thank you.']);
  if (!p.inside) { bubble(p, line, 3.5, true); emote(p, '💻', 3); }
  for (const q of W.people) if (q !== p && !hasLaptop(q) && rand() < 0.35) remember(q, `${p.name} got a laptop from the Creator.`, 1, 'laptopEnvy', p.name);
  markDirty();
  return `💻 ${p.name}: "${line}"`;
}

// the public computer (a town project) at Paper Moon Books
const PC_AT = () => polarDT(99, 16);
function pcMesh() {
  const g = new T3.Group(), [x, z] = PC_AT();
  g.add(mesh(box(0.9, 0.9, 0.6), toon('#5f4a6b'), 0, 0.45, 0)); g.add(mesh(cyl(0.06, 0.06, 0.5, 6), toon('#c9ccd6'), 0, 1.1, 0));
  g.add(mesh(box(1.1, 0.75, 0.1), toon('#2a2733'), 0, 1.6, 0)); g.add(mesh(box(0.95, 0.6, 0.02), toon('#9fe3ff', { emissive: new T3.Color('#2a6a8a') }), 0, 1.6, 0.06, false));
  g.add(mesh(box(0.8, 0.05, 0.3), toon('#c9ccd6'), 0, 0.93, 0.3));
  const sg = sign('Public computer', '#fff4dc', '#5f4a6b', 1.3); sg.position.set(0, 2.2, 0.06); g.add(sg);
  g.position.set(x, 0, z); g.rotation.y = Math.atan2(DT.x - x, DT.z - z);
  g.traverse((o) => { if (o.isMesh) { o.userData.tap = { kind: 'pc' }; tappables.push(o); } });
  return g;
}
function pcSpot() { const [x, z] = PC_AT(), dx = DT.x - x, dz = DT.z - z, d = Math.hypot(dx, dz); return [x + dx / d * 1.1, z + dz / d * 1.1]; }
function surfStartPC(p) { if (!p.task?.pc) return; const [x, z] = PC_AT(); p.face = Math.atan2(x - p.x, z - p.z); }

// what they know
function laptopContext(me, them) {
  let s = '';
  if (hasLaptop(me)) s += W.outsideFound ? ' You have a laptop, so you can read the Outside whenever you want. Some people without one are jealous.' : '';
  else if (me.saving) s += ` You're saving up for a laptop so you can see the Outside for yourself (${Math.min(me.coins, me.saving.goal)} of ${me.saving.goal} coins so far). You've been skipping treats.`;
  else if (W.outsideFound) { const o = laptopOwners().filter((q) => q !== me).map((q) => q.name); s += ` You don't have a laptop, so you only hear about the Outside secondhand${o.length ? ` (${o.slice(0, 3).join(', ')} ${o.length === 1 ? 'has one' : 'have them'})` : ''}${W.built?.computer ? ', or from the public computer at Paper Moon Books' : ''}.`; }
  if (them && them !== me && hasLaptop(them) && !hasLaptop(me) && W.outsideFound) s += ` ${them.name} has a laptop.`;
  return s;
}
function heardContext(me) {
  const H = (me.heard || []).slice(-2);
  return H.length ? `\nThings people told you about the Outside (secondhand):\n${H.map((x) => `- ${x.from} said: "${String(x.text).slice(0, 180)}"`).join('\n')}` : '';
}
function savingHtml(p) {
  if (hasLaptop(p)) return W.outsideFound ? '<p class="hint">💻 Has a laptop, so they can read the Outside.</p>' : '';
  const S = p.saving, C = W.creator;
  const give = `<button class="btn" type="button" data-laptopgift="${p.id}" ${C.coins < GIFT_LAPTOP_COST ? 'disabled' : ''}>Buy them a laptop (${GIFT_LAPTOP_COST} ✦)</button>`;
  if (!S) return W.outsideFound && p.grow >= 1 ? `<p class="hint">💻 No laptop. ${give}</p>` : '';
  const have = Math.min(p.coins, S.goal);
  return `<p class="label">💻 Laptop fund</p><div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:var(--faint)">Saving since day ${S.since}${S.helped?.length ? ` · help from ${esc(S.helped.join(', '))}` : ''}</span><span>${have} of ${S.goal}</span></div><div class="meter gold"><i style="width:${Math.round(have / S.goal * 100)}%"></i></div>
    <div class="btns"><button class="btn" type="button" data-coins="5" data-to="${p.id}" ${C.coins < 5 ? 'disabled' : ''}>Chip in 5 ✦</button>${give}</div>`;
}
function laptopsHtml() {
  if (!W.outsideFound && !W.people.some((p) => p.saving || hasLaptop(p))) return '';
  const own = laptopOwners(), sav = W.people.filter((p) => p.saving && !hasLaptop(p));
  return `<p class="label">💻 Laptops & the Outside</p>
    <p class="hint">${own.length ? `Laptops: ${own.map((p) => esc(p.name)).join(', ')}. ` : 'Nobody has a laptop yet. '}Only residents with a laptop${W.built?.computer ? ' (or a turn at the public computer)' : ''} can read the Outside. Everyone else hears about it secondhand, and some of them get jealous.</p>
    ${sav.length ? `<div class="chips">${sav.map((p) => `<button class="btn" type="button" data-openperson="${p.id}" style="padding:4px 10px;font-size:12px">${esc(p.name)}: saving ${Math.min(p.coins, p.saving.goal)}/${p.saving.goal}</button>`).join('')}</div>` : ''}`;
}
function phoneSurf(p) {
  const oc = (W.chirps || []).slice(-25).filter((c) => c.outside && c.by !== p.id);
  if (oc.length && rand() < 0.6) {
    const c = pick(oc), it = outsideItem(c.outside), by = person(c.by);
    if (!c.likes.includes(p.id)) c.likes.push(p.id);
    if (it && hearOutside(p, it, by) && by && hasLaptop(by)) laptopEnvy(p, by);
    return;
  }
  const c = pick((W.chirps || []).slice(-15)); if (c && c.by !== p.id && !c.likes.includes(p.id)) c.likes.push(p.id);
}
function outsideChirpReplies(p, c) {
  if (rand() > 0.6) return;
  const q = pick(W.people.filter((x) => x !== p && !x.away && x.grow >= 1)); if (!q) return;
  setTimeout(() => {
    const it = outsideItem(c.outside), mine = hasLaptop(q);
    c.replies.push({ by: q.id, name: q.name, text: it?.serious ? pick(['this is so sad', 'i hope everyone out there is ok', 'heavy']) : mine ? pick(['saw this too!!', 'the Outside is wild today', 'wait read the rest of it', 'no way']) : pick(['must be nice having a laptop', 'wait what does that even mean', 'can someone with a laptop explain', 'i need a laptop so bad']) });
    if (!mine && it) { hearOutside(q, it, p); if (hasLaptop(p)) laptopEnvy(q, p); }
    markDirty();
  }, (10 + rand() * 30) * 1000);
}
function selfMotivatedSaving() {
  for (const p of W.people) {
    if (hasLaptop(p) || p.saving || p.grow < 1 || p.visitor || p.away) continue;
    const keen = collarOf(p) === 'white' || /computer|code|coding|game|tech|League/i.test(p.interests || '');
    if (keen && rand() < 0.04) { p.saving = { what: 'laptop', goal: LAPTOP_COST, since: W.day, inspired: null, helped: [] }; remember(p, 'I want a laptop of my own. I started saving.', 2, 'laptopEnvy'); diary(`💻 <b>${esc(p.name)}</b> started saving up for a laptop.`); }
  }
}
function laptopMigration() {
  W.added = W.added || {};
  if (W.added.laptops1) return;
  W.added.laptops1 = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'The Outside only works on laptops now. Residents without one hear about it secondhand, get jealous, and save up. World news and politics come in from Wikipedia, and the town can vote to build a public computer.', 'Laptops + world news');
  if (!W.outsideFound || laptopOwners().length) return;
  const fans = W.people.filter((p) => p.grow >= 1 && !p.visitor && (p.seen || []).length).sort((a, b) => (b.seen || []).length - (a.seen || []).length).slice(0, 3);
  diary('📵 The link to the Outside stopped working on phones. You need a real laptop to reach it now. A few people are not happy about it.');
  for (const p of fans) { p.saving = { what: 'laptop', goal: LAPTOP_COST, since: W.day, inspired: null, helped: [] }; remember(p, "The Outside doesn't work on phones anymore. I'm saving up for a laptop.", 2, 'laptopEnvy'); }
  if (fans.length) diary(`💻 ${fans.map((p) => `<b>${esc(p.name)}</b>`).join(', ')} started saving up for laptops.`);
}

function outsideContext(me, them) { const base = outsideContext0(me), lap = laptopContext(me, them), heard = heardContext(me); if (!base && !lap && !heard) return ''; return (base || '\nTHE OUTSIDE:') + lap + heard + (base ? ' When you talk about Outside news, stick to what you actually read or heard and never invent details about real people. You can still have feelings and opinions about it, like anyone would.' : ''); }
