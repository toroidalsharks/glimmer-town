// ============================================================
// PANELS (shared by the box and the remote)
// ============================================================
const sheet = $('#sheet');
let activeTab = 'people', openDetail = null, shopTab = 'mart', giftPick = null, talkState = {};
const skinCss = (p) => `hsl(${Math.round(p.body.hue)} ${p.body.sat ?? 70}% ${p.body.light ?? 78}%)`;
function doing(p) {
  if (p.state === 'talk') return 'chatting';
  const k = p.task?.kind;
  if (k === 'away' && p.away) return `visiting ${ISLES[p.away.to].name}`;
  if (p.inside && k === 'home') return W.t >= 0.63 || W.t < 0.008 ? 'asleep' : 'at home';
  return { arcade: 'at the arcade', work: 'at work', eat: 'eating out', shop: 'shopping', cafe: 'having tea', forage: 'picking berries', stroll: 'out for a walk', visit: 'visiting a friend', home: 'heading home', meeting: 'at the town meeting', event: 'at the town event', donate: 'chipping in', pray: 'wishing at the sky', date: 'on a date', snowman: 'building a snowman', tinker: 'building something', hangout: 'hanging out at home with a friend', walkwith: 'out walking with a friend', read: 'reading', picket: 'on strike', surf: 'on GlimmerNet', landmark: 'out and about', court: 'at Glimmer Hall', service: 'doing community service', rest: 'resting in bed', doctor: 'at the clinic', therapy: 'at the clinic', ritual: 'double-checking something at home', buylaptop: 'buying a laptop', browse: 'browsing books', write: 'writing', crowd: W.scene?.kind === 'uproar' ? 'in the uproar at the fountain' : 'chatting in a group' }[k] || 'wandering';
}
function showTab(t) {
  activeTab = t;
  document.querySelectorAll('.tab').forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.tab === t)); if (b.dataset.tab === t && !sheet.hidden) b.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }); });
  for (const id of ['people', 'mail', 'texts', 'web', 'shops', 'gifts', 'build', 'board', 'court', 'diary', 'box']) $('#pane-' + id).hidden = id !== t;
  refreshPanel(true);
}
let lastPanel = 0, panelBusy = false;
function refreshPanel(force) {
  if (!W || sheet.hidden) return;
  if (!force && (panelBusy || document.activeElement?.closest?.('.sheet input, .sheet select, .sheet textarea'))) return;
  const pane = $('#pane-' + activeTab), scroll = pane.scrollTop;
  if (activeTab === 'people') openDetail && person(openDetail) ? renderDetail(openDetail) : renderPeople();
  else if (activeTab === 'mail') renderMail();
  else if (activeTab === 'shops') renderShops();
  else if (activeTab === 'gifts') renderGifts();
  else if (activeTab === 'build') renderBuild();
  else if (activeTab === 'board') renderBoard();
  else if (activeTab === 'diary') renderDiary();
  else if (activeTab === 'texts') renderTexts();
  else if (activeTab === 'web') renderWeb();
  else if (activeTab === 'court') renderCourt();
  else if (activeTab === 'box') { renderLink(); if (force) { renderBrainSettings(); renderNotify(); } }
  pane.scrollTop = scroll;
}
function itemCard(it, btn) {
  const by = it.kind === 'book' && BOOKS[it.id] ? `${SUBJECTS[BOOKS[it.id].subj].icon} ${esc(SUBJECTS[BOOKS[it.id].subj].name)} · by ${esc(BOOKS[it.id].by)}` : it.makerName ? `Made by ${esc(it.makerName)}` : it.kind === 'food' ? 'From the menu' : it.handmade ? 'Handmade by you' : 'Imported from over the sea';
  return `<div class="item"><div class="item-top"><span class="swatch" style="background:${itemColor(it)}"></span><span class="item-name">${esc(cap(itemName(it)))}</span></div>
    <span class="item-by">${by}${it.q > 1 ? ` · <span class="stars">${'★'.repeat(it.q)}</span>` : ''}</span>${btn}</div>`;
}
let inviteOpen = false;
function renderPeople() {
  const inv = inviteOpen ? `<form class="creator" data-invite><h3>Invite someone to move in</h3>
    <div class="field"><label for="invName">Name</label><input id="invName" maxlength="20" required style="font:15px var(--body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:8px 10px"></div>
    <div class="field"><label for="invColor">Favorite color</label><select id="invColor">${Object.keys(COLORS).map((c) => `<option>${c}</option>`).join('')}</select></div>
    <div class="field"><label for="invAbout">Tell them who this person is, in their own words if you can</label><textarea id="invAbout" rows="4" maxlength="1200" required style="font:15px var(--body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:10px;padding:8px 10px"></textarea></div>
    <div class="btns"><button class="btn gold" type="submit">Move them in</button><button class="btn" type="button" data-invitetoggle>Cancel</button></div></form>`
    : `<div class="btns"><button class="btn" type="button" data-invitetoggle>Invite someone to move in</button></div>`;
  $('#pane-people').innerHTML = inv + W.people.map((p) => {
    const [att, , cls] = attitude(p);
    return `<button class="who" type="button" data-id="${p.id}">
      <span class="dot" style="background:${skinCss(p)};border-color:${COLORS[p.outfit.shirt]}"></span>
      <span><span class="who-name">${esc(p.name)}</span> <span class="chip ${cls}">${att}</span>${p.cr.wish ? ' <span class="chip gold">✧ wish</span>' : ''}${p.partner && person(p.partner) ? ` <span class="chip good">${p.married ? '💍' : '💕'} ${esc(person(p.partner).name)}</span>` : ''}${isBirthday(p) ? ' <span class="chip gold">🎂 birthday</span>' : ''}<br><span class="who-note">${esc(p.selfNote)}</span></span>
      <span class="who-stats">${p.room >= 0 ? `room ${p.room + 1}` : 'guest'}<br>${p.coins} coins<br>${doing(p)}</span></button>`;
  }).join('');
}
function renderDetail(id) {
  const p = person(id); openDetail = id;
  const feels = Object.values(p.feelings).sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 6);
  const mems = [...p.past].sort((a, b) => b.weight - a.weight || b.day - a.day).slice(0, 5);
  const age = W.day - p.bornDay, fav = favoriteFood(p);
  const hated = Object.entries(p.tastes).filter(([, v]) => v < -0.25).map(([k]) => foodById(k).name);
  const cols = topColors(p);
  const [att, attLong, cls] = attitude(p);
  const sc = p.cr.score, w = Math.abs(sc) * 5, left = sc >= 0 ? 50 : 50 - w;
  const C = W.creator;
  const ts_ = talkState[id] || (talkState[id] = { log: [], busy: false });
  const canTalk = !!RT.sample || MODE === 'host' && !!RT.sample;
  $('#pane-people').innerHTML = `
    <button class="back" type="button" data-back>&larr; Everyone</button>
    <div class="d-head"><span class="dot" style="background:${skinCss(p)};border-color:${COLORS[p.outfit.shirt]}"></span>
      <div><div class="d-name">${esc(p.name)}</div>
      <div class="d-sub">Room ${p.room + 1} · generation ${p.gen} · ${age === 0 ? (p.parents.length ? 'born today' : 'moved in today') : `${plural(age, 'day')} in town`}${p.parents.length ? ` · child of ${esc(p.parents.join(' and '))}` : ''} · ${doing(p)}</div><div class="d-sub">${p.married ? '💍' : p.partner ? '💕' : ''} ${esc(relStatus(p))}${p.bday ? ` · 🎂 ${dateText(p.bday)}${isBirthday(p) ? ', today!' : ''}` : ''}${p.job && JOBS[p.job] ? ` · ${JOBS[p.job].short}, ${payOf(p)}/day` : ''}</div></div></div>
    ${lookStudioHtml(p)}
    <p class="label">In their own words</p>
    <p class="quote">${esc(p.selfNote)}</p>
    ${bookshelfHtml(p)}
    ${LAB_JOBS.includes(p.job) && ensureResearch(p) ? `<p class="hint">🔬 Working on ${esc(p.research.title)} (${Math.round(p.research.progress)}%${p.research.stuck ? ', stuck' : ''}). <button class="btn" type="button" data-openlab="${p.id}">Visit their desk</button></p>` : ''}
    ${goalHtml(p)}
    ${healthDetailHtml(p)}
    ${savingHtml(p)}
    ${isMili(p) ? `<p class="hint">✧ A piece of you, living down here. Her cat is called ${esc(catName())}. <button class="btn" type="button" data-renamecat>Rename the cat</button></p>` : ''}
    ${(() => { const T = (W.texts || []).filter((m) => m.from === p.id || m.to === p.id).slice(-4).reverse(); return T.length ? `<p class="label">Their phone</p>${T.map((m) => `<p class="hint">${m.from === p.id ? `To ${esc(m.to === 'town' ? 'the group chat' : person(m.to)?.name || '?')}` : `From ${esc(m.fromName)}`}: "${esc(m.text)}"</p>`).join('')}` : ''; })()}
    <div class="creator">
      <h3>How ${esc(p.name)} sees you</h3>
      <div class="facts" style="display:flex;justify-content:space-between"><span class="chip ${cls}">${att}</span><span style="color:var(--dim);font-size:12px">${esc(p.name)} ${attLong}</span></div>
      <span class="bar" style="height:8px"><i style="left:${left}%;width:${w}%;background:${sc >= 0 ? 'var(--good)' : 'var(--bad)'}"></i></span>
      <p>${esc(beliefText(p))}</p>
      ${p.cr.wish ? `<p style="color:var(--gold)">✧ Wishing for ${esc(wishText(p.cr.wish))} (${plural(Math.max(0, 3 - (W.day - p.cr.wish.day)), 'day')} left before they give up).</p>` : ''}
      <div class="btns">
        <button class="btn gold" type="button" data-giftfor="${p.id}">Give a gift</button>
        <button class="btn" type="button" data-coins="1" data-to="${p.id}" ${C.coins < 1 ? 'disabled' : ''}>Send 1 coin</button>
        <button class="btn" type="button" data-coins="5" data-to="${p.id}" ${C.coins < 5 ? 'disabled' : ''}>Send 5 coins</button>
        <button class="btn" type="button" data-room="${p.id}">${MODE === 'host' ? 'Visit their room' : 'Show their room in the box'}</button>
      </div>
      ${giftPick === p.id ? giftChooser(p) : ''}
      <div class="talk">
        <div class="talk-log">${ts_.log.map((l) => `<div class="${l.me ? 'me' : 'them'}">${esc(l.text)}</div>`).join('')}${ts_.busy ? `<div class="them">…</div>` : ''}</div>
        ${canTalk ? `<form class="talk-row" data-talk="${p.id}"><input id="talk-${p.id}" type="text" maxlength="240" autocomplete="off" placeholder="Say something to ${esc(p.name)}…" ${ts_.busy ? 'disabled' : ''}><button class="btn" type="submit" ${ts_.busy ? 'disabled' : ''}>Speak</button></form>` : '<p class="hint">Add an OpenRouter key in Settings to talk to them.</p>'}
        ${ts_.err ? `<p class="hint">${esc(ts_.err)}</p>` : ''}
      </div>
    </div>
    <dl class="facts">
      ${p.visitor ? `<dt>Visiting</dt><dd>From ${esc(ISLES[p.visitor.home].name)}, going home tomorrow</dd>` : ''}
      <dt>Mind</dt><dd>${esc(shortModel(modelOf(p)))}${MODE === 'host' ? ` <select data-setmodel="${p.id}" style="font:12px var(--body);background:var(--raise);color:var(--ink);border:1px solid var(--line);border-radius:6px">${brainCfg.models.map((m) => `<option value="${esc(m)}" ${m === p.model ? 'selected' : ''}>${esc(shortModel(m))}</option>`).join('')}</select>` : ''}</dd>
      <dt>Secret want</dt><dd>${esc(p.want?.text || 'unknown')}</dd>
      <dt>Job</dt><dd>${p.job ? `${cap(JOBS[p.job].short)}, ${plural(p.jobDays, 'day')}` : 'Too young to work'}</dd>
      <dt>Coins</dt><dd>${p.coins}</dd>
      <dt>Wearing</dt><dd>${cap(outfitText(p))}</dd>
      <dt>Favorite food</dt><dd>${fav ? cap(fav) : 'Still figuring it out'}${hated.length ? ` · can't stand ${hated.join(', ')}` : ''}</dd>
      <dt>Room</dt><dd>${p.decor.length ? p.decor.map((d) => esc(itemName(d)) + (d.makerName ? ` (by ${esc(d.makerName)})` : '')).join(', ') : 'Bare so far'}</dd>
      <dt>Body</dt><dd>${cap(bodyFacts(p, false))}</dd>
    </dl>
    <div><div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:var(--faint)">Hunger</span><span>${Math.round(p.hunger * 100)}%</span></div><div class="meter"><i style="width:${Math.round(p.hunger * 100)}%"></i></div></div>
    ${cols.length ? `<p class="label">Style</p><div class="chips">${cols.map((c) => `<span class="chip"><i style="background:${COLORS[c]}"></i>likes ${c}</span>`).join('')}${p.wardrobe.hats.map((h) => `<span class="chip"><i style="background:${COLORS[h.color]}"></i>${esc(hatText(h))}${h.maker ? ` by ${esc(h.maker)}` : ''}</span>`).join('')}</div>` : ''}
    <p class="label">How they feel about others</p>
    <div>${feels.length ? feels.map((f) => { const w2 = Math.abs(f.score) * 5, l2 = f.score >= 0 ? 50 : 50 - w2; return `<div class="feel"><b>${esc(f.name)}</b><span class="bar"><i style="left:${l2}%;width:${w2}%;background:${f.score >= 0 ? 'var(--good)' : 'var(--bad)'}"></i></span><span>${esc(f.note)}</span></div>`; }).join('') : '<p class="hint">Hasn\'t met anyone yet.</p>'}</div>
    <p class="label">Memories they keep</p>
    ${mems.length ? `<ul class="mem">${mems.map((m) => `<li>Day ${m.day}: ${esc(m.text)}</li>`).join('')}</ul>` : '<p class="hint">Nothing kept yet. They choose what to keep each night.</p>'}`;
}
function giftChooser(p) {
  const items = W.creator.items;
  if (!items.length) return `<p class="hint">You don't have anything to give yet. Buy something in the Shops tab first.</p>`;
  return `<div class="items">${items.map((it) => itemCard(it, `<div class="item-row"><span class="item-by">${wishMatch(p, it) ? '✧ their wish' : ''}</span><button class="btn gold" type="button" data-give="${it.uid}" data-to="${p.id}">Give</button></div>`)).join('')}</div>`;
}
function renderShops() {
  const C = W.creator, keeper = W.keeper[shopTab] && person(W.keeper[shopTab]);
  const workers = W.people.filter((p) => p.job === SHOPS[shopTab].job);
  let items;
  const isFood = FOODS.some((f) => f.shop === shopTab);
  if (shopTab === 'arcade') items = [];
  else if (isFood) {
    items = FOODS.filter((f) => f.shop === shopTab).map((f) => {
      const it = { uid: 'menu-' + f.id, kind: 'food', id: f.id, q: 1, makerName: keeper ? keeper.name : null };
      return itemCard(it, `<div class="item-row"><span class="price">${f.price} ✦</span><button class="btn" type="button" data-buy="${shopTab}" data-food="${f.id}" ${C.coins < f.price ? 'disabled' : ''}>Buy</button></div>`);
    });
  } else {
    items = W.stock[shopTab].map((it) => itemCard(it, `<div class="item-row"><span class="price">${itemPrice(it)} ✦</span><button class="btn" type="button" data-buy="${shopTab}" data-uid="${it.uid}" ${C.coins < itemPrice(it) ? 'disabled' : ''}>Buy</button></div>`));
  }
  $('#pane-shops').innerHTML = `
    <div class="wallet"><b>${C.coins} ✦</b><span class="hint">Your coins. You get 20 more every morning.</span></div>
    <div class="shop-tabs">${Object.entries(SHOPS).map(([k, s]) => `<button class="btn" type="button" data-shoptab="${k}" aria-pressed="${k === shopTab}">${s.name}</button>`).join('')}</div>
    <p class="hint">${SHOPS[shopTab].blurb} ${workers.length ? `Works here: ${workers.map((w) => esc(w.name)).join(', ')}.` : 'Nobody works here right now.'}${isFood ? (keeper ? ` Today's food is made by ${esc(keeper.name)}.` : '') : ' New pieces show up after each workday.'}</p>
    <div class="btns"><button class="btn gold" type="button" data-inside="${shopTab}">${MODE === 'host' ? 'Go inside' : 'Show inside in the box'}</button></div>
    ${shopTab === 'books' ? bookCatalogHtml() + '<p class="label">On the front table today</p>' : ''}
    <div class="items">${items.join('') || '<p class="hint">Sold out. Check back tomorrow.</p>'}</div>
    <p class="hint">Whatever you buy goes into Your gifts. Residents notice who made things: they may love a gift because a friend made it, or refuse it because a rival did.</p>`;
}
function renderGifts() {
  const C = W.creator;
  const pickTo = giftPick && person(giftPick) ? giftPick : null;
  $('#pane-gifts').innerHTML = `
    <div class="wallet"><b>${C.coins} ✦</b><span class="hint">You get 20 more every morning.</span></div>
    ${plotHtml()}
    ${workshopHtml()}
    <p class="label">Give to</p>
    <div class="picker">${W.people.map((p) => `<button class="btn" type="button" data-pickto="${p.id}" aria-pressed="${p.id === pickTo}">${esc(p.name)}${p.cr.wish ? ' ✧' : ''}</button>`).join('')}</div>
    ${pickTo ? `<p class="hint">${esc(person(pickTo).name)} ${person(pickTo).cr.wish ? `is wishing for ${esc(wishText(person(pickTo).cr.wish))}.` : "isn't wishing for anything right now."}</p>` : '<p class="hint">Pick someone, then tap Give on an item.</p>'}
    <p class="label">Your collection</p>
    ${C.items.length ? `<div class="items">${C.items.map((it) => itemCard(it, `<div class="item-row"><span class="item-by">${pickTo && wishMatch(person(pickTo), it) ? '✧ their wish' : ''}</span>${(W.placed || []).some((pl) => pl.type === 'museum') && (it.catchName || it.handmade || it.q >= 3) ? `<button class="btn" type="button" data-donate="${it.uid}">Donate</button>` : ''}<button class="btn" type="button" data-sell="${it.uid}">Sell ${sellValue(it)} ✦</button><button class="btn gold" type="button" data-give="${it.uid}" data-to="${pickTo || ''}" ${pickTo ? '' : 'disabled'}>Give</button></div>`)).join('')}</div>` : '<p class="hint">Nothing yet. Visit the Shops tab.</p>'}
    <p class="label">Who you've given to</p>
    <div class="chips">${W.people.map((p) => `<span class="chip">${esc(p.name)}: ${Math.round(C.gifts[p.id] || 0)}</span>`).join('')}</div>
    <p class="hint">Residents keep track. Favor one person too much and the others notice.</p>`;
}
function renderBoard() {
  const ev = W.event && W.event.day === W.day ? W.event : null;
  const pr = W.project, P = pr && PROJECTS[pr.id];
  const built = Object.keys(W.built);
  const P2 = W.paper && W.paper.day === W.day ? W.paper : null;
  $('#pane-board').innerHTML = `
    <div class="paper"><p class="p-mast">The ${esc(ISL.name)} Gazette · Day ${W.day}</p>${P2 ? `<h3>${esc(P2.headline)}</h3>${P2.stories.map((st) => `<p><b>${esc(st.title)}</b> ${esc(st.text)}</p>`).join('')}` : `<p class="hint" style="color:#6d6488">Today's paper hasn't been printed yet.</p><div class="btns"><button class="btn gold" type="button" data-paper>Read today's paper</button></div>`}</div>
    <p class="label">How ${esc(ISL.name)} works</p><p class="hint">${esc(CULT.long)}${sharing() ? ` The pantry holds ${W.pantry || 0} coins.` : ''}</p>
    <p class="label">Today's plan</p>
    ${ev ? `<p>${esc(cap(EVENTS[ev.id].name))} at ${EVENTS[ev.id].at}. Going: ${ev.going.map((id) => esc(person(id)?.name || '')).filter(Boolean).join(', ')}.</p>` : '<p class="hint">No event planned today.</p>'}
    <p class="label">Town project</p>
    ${pr ? `<p><b>${esc(cap(P.name))}</b>, suggested by ${esc(pr.by)}.</p><div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:var(--faint)">Raised</span><span>${pr.raised} of ${P.cost} coins</span></div><div class="meter gold"><i style="width:${Math.min(100, Math.round(pr.raised / P.cost * 100))}%"></i></div>
      <div class="btns"><button class="btn gold" type="button" data-chip="5" ${W.creator.coins < 5 ? 'disabled' : ''}>Chip in 5 coins</button><button class="btn" type="button" data-chip="1" ${W.creator.coins < 1 ? 'disabled' : ''}>Chip in 1</button></div>` : '<p class="hint">No project yet. Someone might suggest one at the next meeting.</p>'}
    ${built.length ? `<p class="label">Built together</p><div class="chips">${built.map((k) => `<span class="chip good">${esc(PROJECTS[k].name)}, day ${W.built[k].day}</span>`).join('')}</div>` : ''}
    <p class="label">Last town meeting</p>
    ${W.minutes ? `<div class="minutes"><p class="hint">Day ${W.minutes.day}, chaired by ${esc(W.minutes.chair)}.</p>${W.minutes.items.map((m) => `<div class="mi"><b>${esc(m.by)}:</b> <span>"${esc(m.text)}"</span><br><span class="chip ${m.passed ? 'good' : 'bad'}">${m.kind === 'complaint' ? (m.passed ? 'They apologized' : 'No apology') : m.passed ? 'Passed' : 'Failed'} ${m.yes}–${m.no}</span></div>`).join('')}</div>` : '<p class="hint">They meet every morning at the fountain before work.</p>'}
    <p class="label">${seasonOf().icon} ${seasonOf().name}, day ${seasonDay()} of 7</p>
    ${(() => { const up = W.people.filter((p) => p.bday).map((p) => [p, (p.bday - yearDay() + YEAR) % YEAR]).filter(([, d]) => d <= 7).sort((a, b) => a[1] - b[1]); return up.length ? `<div class="chips">${up.map(([p, d]) => `<span class="chip ${d === 0 ? 'gold' : ''}">🎂 ${esc(p.name)} ${d === 0 ? 'today!' : d === 1 ? 'tomorrow' : `in ${d} days`}</span>`).join('')}</div>` : '<p class="hint">No birthdays this week.</p>'; })()}
    ${workMoneyHtml()}
    ${labsHtml()}
    ${laptopsHtml()}
    ${dramaHtml()}
    ${goalsBoardHtml()}
    ${socialBoardHtml()}
    ${suggestionsHtml()}
    ${healthHtml()}
    <p class="label">📚 What everyone is reading</p>${(() => { const L = W.people.filter((p) => (p.toRead || []).length && BOOKS[p.toRead[0]]).map((p) => `<p class="note" style="margin:2px 0">📖 <b>${esc(p.name)}</b>: <i>${esc(BOOKS[p.toRead[0]].title)}</i></p>`); return L.length ? `<div>${L.join('')}</div>` : '<p class="hint">Nobody is reading anything right now. The bookstore sells books by subject.</p>'; })()}
    <p class="label">Couples</p>
    ${(() => { const seen = new Set(), L = []; for (const p of W.people) { const q = p.partner && person(p.partner); if (!q || seen.has(p.id)) continue; seen.add(p.id); seen.add(q.id); L.push(`<span class="chip good">${p.married ? '💍' : '💕'} ${esc(p.name)} & ${esc(q.name)}</span>`); } const wd = W.wedding && person(W.wedding.a) && person(W.wedding.b) ? `<p>💒 ${esc(person(W.wedding.a).name)} and ${esc(person(W.wedding.b).name)} are getting married ${W.wedding.day === W.day + 1 ? 'tomorrow' : `on day ${W.wedding.day}`} at ${EVENTS.wedding.at}.</p>` : ''; return wd + (L.length ? `<div class="chips">${L.join('')}</div>` : '<p class="hint">Nobody is dating yet. Give it time.</p>'); })()}
    ${patchNotesHtml()}
    <p class="label">What the town thinks of you</p>
    <div class="chips">${W.people.map((p) => { const [a, , c] = attitude(p); return `<span class="chip ${c}">${esc(p.name)}: ${a}</span>`; }).join('')}</div>`;
}
function renderDiary() {
  if (!$('#albumWrap')) { $('#pane-diary').innerHTML = '<div id="albumWrap"></div><div id="diaryList"></div>'; albumShown = -1; }
  renderAlbum();
  let html = '', lastDay = null;
  for (const e of [...W.log].reverse().slice(0, 100)) { if (e.day !== lastDay) { html += `<div class="day">Day ${e.day}</div>`; lastDay = e.day; } html += `<p>${e.text}</p>`; }
  $('#diaryList').innerHTML = `<div class="diary">${html || '<p>Nothing has happened yet.</p>'}</div>`;
}
function renderBuild() {
  const C = W.creator;
  $('#pane-build').innerHTML = `
    <div class="wallet"><b>${C.coins} ✦</b><span class="hint">Make the island yours. Residents notice what you add, and they'll hang out around it.</span></div>
    <p class="label">Decorations</p>
    <div class="items">${Object.entries(BUILDS).filter(([, b]) => !b.big).map(([k, b]) => `<div class="item"><div class="item-top"><span class="item-name">${esc(cap(b.name))}</span></div><div class="item-row"><span class="price">${b.price} ✦</span></div><div class="btns">${MODE === 'host' ? `<button class="btn gold" type="button" data-place="${k}" ${C.coins < b.price ? 'disabled' : ''}>Place it</button>` : ''}<button class="btn" type="button" data-autoplace="${k}" ${C.coins < b.price ? 'disabled' : ''}>${MODE === 'host' ? 'Anywhere' : 'Place it'}</button></div></div>`).join('')}</div>
    <p class="label">Landmarks</p><p class="hint">Big, expensive buildings that change what residents do.${(W.museum || []).length ? ` The museum has ${plural(W.museum.length, 'exhibit')}.` : ''}</p>
    <div class="items">${Object.entries(BUILDS).filter(([, b]) => b.big).map(([k, b]) => { const have = (W.placed || []).some((pl) => pl.type === k); return `<div class="item"><div class="item-top"><span class="item-name">${esc(cap(b.name))}</span>${have ? ' <span class="chip good">Built</span>' : ''}</div><span class="item-by">${esc(b.blurb)}</span><div class="item-row"><span class="price">${b.price} ✦</span></div><div class="btns">${MODE === 'host' ? `<button class="btn gold" type="button" data-place="${k}" ${C.coins < b.price ? 'disabled' : ''}>Place it</button>` : ''}<button class="btn" type="button" data-autoplace="${k}" ${C.coins < b.price ? 'disabled' : ''}>${MODE === 'host' ? 'Anywhere' : 'Place it'}</button></div></div>`; }).join('')}</div>
    <p class="label">More land</p>
    <div class="items">${Object.entries(LOBES).map(([k, l]) => `<div class="item"><span class="item-name">${esc(l.name)}</span><span class="item-by">${esc(l.blurb || '')}</span>${W.lobes.includes(k) ? '<span class="chip good">Yours</span>' : `<div class="item-row"><span class="price">${l.price} ✦</span><button class="btn gold" type="button" data-land="${k}" ${C.coins < l.price ? 'disabled' : ''}>Raise it</button></div>`}</div>`).join('')}</div>
    ${workshopAgentHtml()}
    ${(W.placed || []).length ? `<p class="label">What you've built</p><div class="chips">${W.placed.map((pl) => `<span class="chip">${esc(BUILDS[pl.type].name)} <button class="btn" type="button" data-unplace="${pl.id}" style="padding:1px 8px;font-size:11px">Remove</button></span>`).join('')}</div>` : ''}`;
}
let mailOpen = null, mailListScroll = 0, mailSlide = null;
function mailStep(dir) {
  const mail = W.mail || [], i = mail.findIndex((x) => x.id === mailOpen), j = i + dir;
  if (i < 0 || j < 0 || j >= mail.length) return;
  mailOpen = mail[j].id; mailSlide = dir > 0 ? 'l' : 'r'; refreshPanel(true); $('#pane-mail').scrollTop = 0; mailSlide = null;
}
function renderMail() {
  const mail = W.mail || [];
  const pane = $('#pane-mail');
  if (mailOpen) {
    const m = mail.find((x) => x.id === mailOpen);
    if (!m) { mailOpen = null; return renderMail(); }
    if (!m.read) send({ t: 'mailread', mid: m.id });
    m.read = true;
    if (!m.written && RT.sample) writeLetter(m);
    const i = mail.indexOf(m), nextUnread = mail.find((x, j) => j !== i && !x.read);
    pane.innerHTML = `<div class="mailnav">
        <button class="back" type="button" data-mailback>&larr; All letters</button>
        <span class="mailpos">${i + 1} of ${mail.length}</span>
        <span class="btns" style="margin:0"><button class="btn" type="button" data-mailnav="-1" ${i <= 0 ? 'disabled' : ''} aria-label="Newer letter">‹</button><button class="btn" type="button" data-mailnav="1" ${i >= mail.length - 1 ? 'disabled' : ''} aria-label="Older letter">›</button></span>
      </div>
      <div class="letter ${mailSlide ? 'slide-' + mailSlide : ''}" style="--ink:hsl(${Math.round(m.hue || 280)} 45% 32%)">
        <p class="l-date">Day ${m.day}${!m.written && RT.sample ? ' · <i>unfolding…</i>' : ''}</p>
        <p>${esc(m.greet)}</p>${String(m.body).split(/\n\n+/).map((b) => `<p>${esc(b)}</p>`).join('')}<p class="l-sign">${esc(m.sign)}<br>${esc(m.fromName)}</p>
      </div>
      <p class="hint" style="text-align:center">Swipe the letter left or right for the next one.${nextUnread ? ` <button class="btn gold" type="button" data-mail="${nextUnread.id}" style="padding:3px 10px;font-size:12px">Next unread ✉</button>` : ''}</p>
      ${m.reply ? `<div class="creator"><h3>You wrote back</h3><p>"${esc(m.reply)}"</p>${m.reaction ? `<p><b style="color:var(--ink)">${esc(m.fromName)}:</b> "${esc(m.reaction)}"</p>` : ''}</div>`
        : person(m.from) ? `<form class="talk" data-mailreply="${m.id}"><label class="label" for="reply-${m.id}">Write back</label><textarea id="reply-${m.id}" rows="3" maxlength="600" placeholder="Dear ${esc(m.fromName)}…" style="font:15px var(--body);color:var(--ink);background:var(--raise);border:1px solid var(--line);border-radius:12px;padding:10px"></textarea><div class="btns"><button class="btn gold" type="submit">Send your letter</button></div></form>`
        : `<p class="hint">${esc(m.fromName)} doesn't live here anymore.</p>`}`;
    return;
  }
  const unread = mail.filter((m) => !m.read).length;
  pane.innerHTML = `<p class="hint">Residents write to you when something big happens, or when they feel ignored. ${unread ? `${plural(unread, 'unread letter')}.` : ''}</p>
    ${mail.length ? mail.map((m) => `<button class="who" type="button" data-mail="${m.id}"><span class="dot" style="background:hsl(${Math.round(m.hue || 280)} 70% 78%);border-color:${m.read ? 'var(--line)' : 'var(--gold)'}"></span><span><span class="who-name">${esc(m.fromName)}</span>${m.read ? '' : ' <span class="chip gold">new</span>'}${m.reply ? ' <span class="chip good">replied</span>' : ''}<br><span class="who-note">${esc(m.body)}</span></span><span class="who-stats">day ${m.day}</span></button>`).join('') : '<p class="hint">No letters yet. The mailbox is by the apartment door.</p>'}`;
}
let peerCount = 0;
function renderLink() {
  const s = $('#linkStatus');
  if (MODE === 'host') s.textContent = RT.room ? (peerCount > 1 ? `This device is running the town. ${plural(peerCount - 1, 'other device')} connected.` : 'This device is running the town. No remote connected yet.') : 'This device is running the town. Add Firebase in Settings below to use a remote.';
  else s.textContent = 'This device is the remote.';
}
// swipe through letters
{
  let sx = null, sy = 0;
  const pm = $('#pane-mail');
  pm.addEventListener('touchstart', (e) => { if (!mailOpen || e.target.closest('textarea, input, form')) { sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  pm.addEventListener('touchend', (e) => { if (sx == null || !mailOpen) return; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null; if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6) mailStep(dx < 0 ? 1 : -1); }, { passive: true });
  document.addEventListener('keydown', (e) => { if (!mailOpen || sheet.hidden || activeTab !== 'mail' || e.target.closest?.('textarea, input')) return; if (e.key === 'ArrowRight') mailStep(1); else if (e.key === 'ArrowLeft') mailStep(-1); });
}
// panel clicks
sheet.addEventListener('click', (e) => {
  const t = e.target.closest('button'); if (!t) return;
  const d = t.dataset;
  if (d.thread !== undefined) { textThread = d.thread || null; refreshPanel(true); if (textThread) $('#pane-texts').scrollTop = 1e6; else $('#pane-texts').scrollTop = 0; return; }
  if (d.renamecat !== undefined) { const n = prompt("What's her cat's name?", catName()); if (n && n.trim()) send({ t: 'catname', name: n.trim().slice(0, 20) }); return; }
  if (d.webview) { webView = d.webview; refreshPanel(true); return; }
  if (d.refreshoutside !== undefined) { fetchOutside(true).then(() => refreshPanel(true)); toast('Checking the Outside…'); return; }
  if (d.sendlink) { const sel = document.querySelector(`[data-sendto="${d.sendlink}"]`); if (sel) send({ t: 'sendlink', item: d.sendlink, to: sel.value }); return; }
  if (d.subj !== undefined) { bookSubj = d.subj || null; refreshPanel(true); return; }
  if (d.buybook) { send({ t: 'buybook', id: d.buybook }); return; }
  if (d.openlab) { openLab(d.openlab); return; }
  if (d.care) { openCare(d.care); return; }
  if (d.lookopen !== undefined) { lookOpen = lookOpen === d.lookopen ? null : d.lookopen; refreshPanel(true); return; }
  if (d.looktab) { lookTab = d.looktab; refreshPanel(true); return; }
  if (d.look) { send({ t: 'look', pid: d.look, part: d.part, val: d.val }); return; }
  if (d.hair) { send({ t: 'hair', pid: d.hair, style: d.style, color: d.hcolor }); return; }
  if (d.fashion) { send({ t: 'fashion', pid: d.fashion, fashion: d.fstyle }); return; }
  if (d.laptopgift) { send({ t: 'laptopgift', pid: d.laptopgift }); return; }
  if (d.openperson) { openDetail = d.openperson; showTab('people'); return; }
  if (d.clinicview !== undefined) { send({ t: 'clinicview' }); if (MODE === 'host') sheet.hidden = true; return; }
  if (d.labsview !== undefined) { send({ t: 'labsview', wing: d.labsview || undefined }); if (MODE === 'host') sheet.hidden = true; return; }
  if (d.rule) { send({ t: 'rule', id: d.rule, choice: d.choice }); return; }
  if (d.crime) { send({ t: 'crime', a: d.crime, cid: d.cid, pid: d.pid }); return; }
  if (d.cutreplay) { send({ t: 'cut', a: 'replay', id: d.cutreplay }); return; }
  if (d.cutpick) { send({ t: 'cut', a: 'pick', k: d.cutpick }); return; }
  if (d.hallview !== undefined) { send({ t: 'hallview' }); if (MODE === 'host') sheet.hidden = true; return; }
  if (d.debateform !== undefined) { debateForm = !debateForm; refreshPanel(true); return; }
  if (d.startdebate !== undefined) { const a = $('#dbA').value, b = $('#dbB').value, topic = ($('#dbCustom').value.trim() || $('#dbTopic').value).slice(0, 80); if (a === b) { toast('Pick two different residents.'); return; } debateForm = false; send({ t: 'debate', a, b, topic }); return; }
  if (d.craftcolor) { if (COLORS[d.craftcolor]) craftPick = d.craftcolor; refreshPanel(true); return; }
  if (d.craft) { send({ t: 'craft', kind: d.craft, id: d.cid, color: d.color || craftPick }); return; }
  if (d.donate) { send({ t: 'donate', uid: d.donate }); return; }
  if (d.sell) { send({ t: 'sell', uid: d.sell }); return; }
  if (d.plotpick !== undefined) { plotPick = plotPick === Number(d.plotpick) ? null : Number(d.plotpick); refreshPanel(true); return; }
  if (d.plot) { if (d.plot === 'plant') plotPick = null; send({ t: 'plot', act: d.plot, i: Number(d.i), crop: d.crop }); return; }
  if (d.clearalbum !== undefined) { if (confirm('Delete all the photos in this album? Photos you already downloaded stay safe.')) { try { localStorage.removeItem('glimmer-album'); } catch (err) {} albumVer++; renderAlbum(); } return; }
  if (d.back !== undefined) { openDetail = null; giftPick = null; send({ t: 'follow', id: null }); refreshPanel(true); return; }
  if (d.id) { openDetail = d.id; giftPick = null; send({ t: 'follow', id: d.id }); refreshPanel(true); $('#pane-people').scrollTop = 0; return; }
  if (d.giftfor) { giftPick = giftPick === d.giftfor ? null : d.giftfor; refreshPanel(true); return; }
  if (d.coins) { send({ t: 'coins', to: d.to, n: Number(d.coins) }); return; }
  if (d.room) { send({ t: 'room', id: d.room }); if (MODE === 'host') sheet.hidden = true; return; }
  if (d.give) { if (!d.to) return; send({ t: 'gift', uid: d.give, to: d.to }); return; }
  if (d.shoptab) { shopTab = d.shoptab; refreshPanel(true); return; }
  if (d.buy) { send(d.food ? { t: 'buy', shop: d.buy, id: d.food } : { t: 'buy', shop: d.buy, uid: d.uid }); return; }
  if (d.pickto) { giftPick = d.pickto; refreshPanel(true); return; }
  if (d.chip) { send({ t: 'chip', n: Number(d.chip) }); return; }
  if (d.invitetoggle !== undefined) { inviteOpen = !inviteOpen; refreshPanel(true); return; }
  if (d.place) { placing = { type: d.place }; sheet.hidden = true; $('#placeText').textContent = `Tap the ground where the ${BUILDS[d.place].name} should go.`; $('#placeBar').hidden = false; return; }
  if (d.autoplace) { send({ t: 'place', type: d.autoplace }); return; }
  if (d.land) { send({ t: 'land', lobe: d.land }); return; }
  if (d.unplace) { send({ t: 'unplace', id: d.unplace }); return; }
  if (d.mail) { if (!mailOpen) mailListScroll = $('#pane-mail').scrollTop; mailOpen = d.mail; refreshPanel(true); $('#pane-mail').scrollTop = 0; return; }
  if (d.mailnav) { mailStep(Number(d.mailnav)); return; }
  if (d.mailback !== undefined) { mailOpen = null; refreshPanel(true); $('#pane-mail').scrollTop = mailListScroll; return; }
  if (d.paper !== undefined) { makePaper(t); return; }
  if (d.inside) { send({ t: 'shopview', shop: d.inside }); if (MODE === 'host') sheet.hidden = true; return; }
});
sheet.addEventListener('change', (e) => { const s = e.target.closest('[data-setmodel]'); if (!s || !W) return; const p = person(s.dataset.setmodel); if (p) { p.model = s.value; markDirty(); toast(`${p.name} now thinks with ${shortModel(s.value)}.`); } });
sheet.addEventListener('submit', async (e) => {
  const inv = e.target.closest('[data-invite]');
  if (inv) { e.preventDefault(); const name = $('#invName').value.trim(), about = $('#invAbout').value.trim(), color = $('#invColor').value; if (!name || !about) return; const bt = inv.querySelector('button[type=submit]'); bt.disabled = true; bt.textContent = 'Moving in…'; if (MODE === 'host') { toast(await inviteResident(name, about, color)); } else send({ t: 'invite', name, about, color }); inviteOpen = false; refreshPanel(true); return; }
  const mf = e.target.closest('[data-mailreply]');
  if (mf) { e.preventDefault(); const m = (W.mail || []).find((x) => x.id === mf.dataset.mailreply); const txt = mf.querySelector('textarea').value.trim(); if (!m || !txt) return; const bt = mf.querySelector('button'); bt.disabled = true; bt.textContent = 'Sending…'; panelBusy = true; await replyLetter(m, txt); panelBusy = false; if (MODE !== 'host') { m.reply = txt; } refreshPanel(true); return; }
  const f = e.target.closest('[data-talk]'); if (!f) return;
  e.preventDefault();
  const id = f.dataset.talk, p = person(id), input = f.querySelector('input'), said = input.value.trim();
  if (!p || !said || !RT.sample) return;
  const st = talkState[id] || (talkState[id] = { log: [], busy: false });
  st.log.push({ me: true, text: said }); st.busy = true; st.err = '';
  const history = st.log.slice(-7, -1).map((l) => ({ who: l.me ? 'Creator' : p.name, text: l.text }));
  panelBusy = true; refreshPanel(true);
  try {
    const r = await RT.sample.json(talkPrompt(p, said, history), { model: modelOf(p), fallbackKey: 'reply', cache: false });
    const reply = String(r?.reply || '…').slice(0, 400);
    st.log.push({ me: false, text: reply });
    send({ t: 'talked', to: id, said, reply, feeling: clamp(Math.round(Number(r?.feeling) || 0), -2, 2), memory: String(r?.memory || '').slice(0, 200) });
  } catch (err) {
    st.log.pop();
    st.err = err?.code === 'no_key' || err?.code === 'no_credit' ? 'Add an OpenRouter key in Settings on the box to talk.' : err?.code === 'rate_limited' ? "You've been talking a lot. Try again in a bit." : err?.code === 'refused' ? `${p.name} didn't answer that.` : (err?.code === 'bad_model' ? 'Their model is missing on OpenRouter. Pick another in Settings.' : err?.code === 'rate_limited' ? 'OpenRouter is busy. Try again in a moment.' : 'They got distracted. Try saying it again.');
  }
  st.busy = false; panelBusy = false; refreshPanel(true);
  const inp = document.getElementById('talk-' + id); if (inp) inp.focus();
});
document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
function openSheet() { sheet.hidden = false; showTab(activeTab); }
// a taller panel, for dressing people up or reading long letters; remembered on this device
{
  const g = $('#growSheet'), setTall = (on) => { sheet.classList.toggle('tall', on); g.setAttribute('aria-pressed', String(on)); g.textContent = on ? '⤡' : '⤢'; g.setAttribute('aria-label', on ? 'Make the panel shorter' : 'Make the panel taller'); };
  try { setTall(localStorage.getItem('glimmer-tall-sheet') === '1'); } catch (e) {}
  g.addEventListener('click', () => { const on = !sheet.classList.contains('tall'); setTall(on); try { localStorage.setItem('glimmer-tall-sheet', on ? '1' : '0'); } catch (e) {} });
}
$('#toggle').addEventListener('click', () => (sheet.hidden ? openSheet() : (sheet.hidden = true)));
$('#close').addEventListener('click', () => { if (MODE === 'remote') return; sheet.hidden = true; openDetail = null; giftPick = null; });
let toastT = 0;
function toast(text) { const t = $('#toast'); t.textContent = text; t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => (t.style.opacity = 0), 3800); }

// settings
function syncSettingsUI() { ['spin', 'follow', 'shadows', 'boxMode', 'mirror', 'music', 'sfx', 'voices', 'cute', 'cutscenes'].forEach((k) => ($('#' + k).checked = cfg[k] !== false && !!cfg[k])); $('#dayLen').value = String(cfg.daySec); $('#volume').value = String(cfg.volume ?? 0.7); }
['music', 'sfx', 'voices'].forEach((k) => $('#' + k).addEventListener('change', (e) => { cfg[k] = e.target.checked; savePrefs(); Sound.levels(); }));
$('#volume').addEventListener('input', (e) => { cfg.volume = Number(e.target.value); savePrefs(); Sound.levels(); });
['spin', 'follow', 'shadows', 'boxMode', 'mirror', 'cutscenes'].forEach((k) => $('#' + k).addEventListener('change', (e) => { if (MODE === 'remote') send({ t: 'set', key: k, value: e.target.checked }); else { cfg[k] = e.target.checked; savePrefs(); applyLook(); } }));
$('#dayLen').addEventListener('change', (e) => { const v = Number(e.target.value); if (MODE === 'remote') send({ t: 'set', key: 'daySec', value: v }); else { cfg.daySec = v; savePrefs(); } });
function applyLook() {
  if (MODE !== 'host' || !renderer) return;
  stage.classList.toggle('mirror', cfg.mirror);
  renderer.shadowMap.enabled = cfg.shadows && !GFX.noShadow; sun.castShadow = cfg.shadows && !GFX.noShadow;
  scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)); });
}
$('#ghostBtn').addEventListener('click', () => { if (MODE === 'remote') return; document.body.classList.add('ghost'); sheet.hidden = true; const h = $('#ghostHint'); h.style.opacity = 1; setTimeout(() => (h.style.opacity = 0), 2500); });
let wakeLock = null;
async function requestWake() { try { wakeLock = await navigator.wakeLock.request('screen'); $('#wakeBtn').textContent = 'Screen stays on'; } catch (e) { $('#wakeBtn').textContent = "This browser won't keep the screen on"; } }
$('#wakeBtn').addEventListener('click', requestWake);
$('#cute').addEventListener('change', (e) => { if (MODE === 'remote') { send({ t: 'set', key: 'cute', value: e.target.checked }); return; } cfg.cute = e.target.checked; savePrefs(); toast('Reloading to apply…'); setTimeout(() => location.reload(), 700); });
document.addEventListener('visibilitychange', () => { if (wakeLock && document.visibilityState === 'visible') requestWake(); if (document.visibilityState === 'hidden') saveNow(); if (document.visibilityState === 'visible') resumeCatchUp(); });
let resetArmed = false;
$('#resetBtn').addEventListener('click', () => {
  if (MODE === 'remote') { toast('Start a new town from the box itself.'); return; }
  if (!resetArmed) { resetArmed = true; $('#resetBtn').textContent = 'Tap again to replace everyone'; $('#resetHint').textContent = "This can't be undone."; setTimeout(() => { resetArmed = false; $('#resetBtn').textContent = 'Start a new town'; $('#resetHint').textContent = 'This replaces everyone who lives here now.'; }, 4000); return; }
  resetArmed = false; closeInterior(); removeAllMeshes(); newWorld(); W.people.forEach(buildKin); buildProjects(); openDetail = null; saveNow(); showTab('people');
  $('#resetBtn').textContent = 'Start a new town'; $('#resetHint').textContent = 'New neighbors just moved in.';
});

