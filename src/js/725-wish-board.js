// ============================================================
// WISH BOARD: everyone's wishes on the Town board, with a way to grant each one
// ============================================================
// a gift you already hold, or one in a shop, that would come true for this wish (best match first)
function wishFinds(p) {
  const w = p.cr.wish; if (!w) return {};
  const best = (list) => list.map((it) => [it, wishMatch(p, it)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1] || itemPrice(a[0]) - itemPrice(b[0]))[0]?.[0] || null;
  const own = best(W.creator.items || []);
  let shop = null, forSale = null;
  for (const k of Object.keys(W.stock || {})) { const it = best(W.stock[k] || []); if (it && (!forSale || wishMatch(p, it) > wishMatch(p, forSale) || itemPrice(it) < itemPrice(forSale))) { forSale = it; shop = k; } }
  return { own, shop, forSale };
}
function wishBoardHtml() {
  const wishers = W.people.filter((p) => p.cr?.wish && !p.visitor);
  if (!wishers.length) return '<p class="label">Wishes</p><p class="hint">Nobody is wishing for anything right now.</p>';
  const C = W.creator;
  const rows = wishers.map((p) => {
    const w = p.cr.wish, left = Math.max(0, 3 - (W.day - w.day));
    const when = left <= 1 ? 'last day' : `${left} days left`;
    let act;
    if (w.kind === 'coins') act = `<button class="btn gold" type="button" data-coins="3" data-to="${p.id}" ${C.coins < 3 ? 'disabled' : ''}>Send 3 coins</button>`;
    else if (w.kind === 'food') {
      const f = foodById(w.id), f2 = f && SHOPS[f.shop] && f.shop !== 'plot';
      act = f2 ? `<button class="btn gold" type="button" data-wishbuy="${f.shop}" data-food="${f.id}" data-to="${p.id}" ${C.coins < f.price ? 'disabled' : ''}>Buy and give (${f.price} ✦)</button>` : '<span class="hint">Grow it in your garden plot.</span>';
    } else {
      const { own, shop, forSale } = wishFinds(p);
      if (own) act = `<button class="btn gold" type="button" data-give="${own.uid}" data-to="${p.id}">Give your ${esc(itemName(own))}</button>`;
      else if (forSale) act = `<button class="btn gold" type="button" data-wishbuy="${shop}" data-uid="${forSale.uid}" data-to="${p.id}" ${C.coins < itemPrice(forSale) ? 'disabled' : ''}>Buy at ${esc(SHOPS[shop].name)} and give (${itemPrice(forSale)} ✦)</button>`;
      else if (w.kind === 'book') act = `<button class="btn" type="button" data-wishbooks="${w.subj}">Look at Paper Moon Books</button>`;
      else act = `<button class="btn" type="button" data-wishmake="1">Make it in your workshop</button>`;
    }
    return `<div class="item"><div class="item-top"><span class="dot" style="background:${skinCss(p)};border-color:${COLORS[p.outfit.shirt]}"></span><b>${esc(p.name)}</b><span class="chip ${left <= 1 ? 'bad' : 'gold'}">${when}</span></div>
      <span>✧ Wishing for ${esc(wishText(w))}</span><div class="btns">${act}</div></div>`;
  }).join('');
  return `<p class="label">Wishes</p><p class="hint">Grant a wish before it runs out and they'll remember it. Wishes nobody answers leave them a little hurt.</p><div class="wishes" style="display:flex;flex-direction:column;gap:8px">${rows}</div>`;
}
// the board's own buttons; the rest (coins, give) go through the panel's usual handlers
sheet.addEventListener('click', (e) => {
  const t = e.target.closest('button'); if (!t) return;
  const d = t.dataset;
  if (d.wishbuy) { send(d.food ? { t: 'buy', shop: d.wishbuy, id: d.food, to: d.to } : { t: 'buy', shop: d.wishbuy, uid: d.uid, to: d.to }); return; }
  if (d.wishbooks !== undefined) { shopTab = 'books'; bookSubj = d.wishbooks || null; showTab('shops'); refreshPanel(true); return; }
  if (d.wishmake !== undefined) { showTab('gifts'); refreshPanel(true); }
});
function wishBoardBoot() {
  W.added = W.added || {}; if (W.added.wishBoard) return; W.added.wishBoard = true;
  if (typeof logUpdate === 'function') logUpdate('build', "Everyone's wishes are on the Town board now, with how many days each one has left and a button to grant it: send coins, buy the thing and give it, or make it in your workshop. Residents also stop skipping meals, eat breakfast at home, and like more of the food in town.", 'the wish board');
}
