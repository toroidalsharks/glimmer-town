// ============================================================
// SHOPS & ECONOMY
// ============================================================
function newItem(kind, id, color, maker, q = 1) {
  const m = maker ? person(maker) : null;
  return { uid: uid(), kind, id, color, maker: m ? m.id : null, makerName: m ? m.name : null, q, day: W.day };
}
function importStock() {
  const s = W.stock; s.books = s.books || [];
  while (s.books.filter((x) => x.kind !== 'book').length < 2) s.books.push(newItem('decor', pick(['books', 'poster', 'globe', 'painting']), pick(Object.keys(COLORS)), null));
  for (let i = 0; i < 12 && s.books.filter((x) => x.kind === 'book').length < 4; i++) { const k = pick(Object.keys(BOOKS)); if (!s.books.some((x) => x.id === k)) s.books.push(newItem('book', k, null, null, 1)); }
  while (s.clothes.length < 4) s.clothes.push(rand() < 0.6 ? newItem('hat', pick(Object.keys(HATS)), pick(Object.keys(COLORS)), null) : newItem('shirt', 'shirt', pick(Object.keys(COLORS)), null));
  while (s.nook.length < 4) s.nook.push(newItem('decor', pick(NOOK_MADE), pick(Object.keys(COLORS)), null));
}
function pushStock(shop, it) { const s = W.stock[shop]; s.push(it); while (s.length > 10) { const i = s.findIndex((x) => !x.maker); s.splice(i >= 0 ? i : 0, 1); } }
function craft(p) {
  const q = clamp(1 + Math.floor(p.jobDays / 5) + (rand() < 0.25 ? 1 : 0) - (rand() < 0.2 ? 1 : 0), 1, 3);
  const color = bestBy(Object.keys(COLORS), (c) => (p.likes[c] || 0) * 1.5);
  let it = null, shop = null;
  if (p.job === 'clothes') { shop = 'clothes'; it = rand() < 0.65 ? newItem('hat', bestBy(Object.keys(HATS), (h) => p.likes['hat:' + h] || 0), color, p.id, q) : newItem('shirt', 'shirt', color, p.id, q); }
  else if (p.job === 'nook') { shop = 'nook'; it = newItem('decor', bestBy(NOOK_MADE, (d) => p.body.decorAff[d] || 0), color, p.id, q); }
  else if (p.job === 'garden' && rand() < 0.7) { shop = 'nook'; it = newItem('decor', rand() < 0.5 ? 'plant' : 'bouquet', color, p.id, q); }
  else if (p.job === 'books') { shop = 'books'; it = newItem('decor', rand() < 0.6 ? 'books' : pick(['poster', 'globe', 'painting']), color, p.id, q); }
  else if (p.job === 'pier' && rand() < 0.35) { shop = 'nook'; it = newItem('decor', 'fishbowl', color, p.id, q); }
  if (it) { pushStock(shop, it); remember(p, `Made ${a_an(itemName(it))} for ${SHOPS[shop].name}.`, 1, 'made', null, { what: itemName(it) }); }
}
// how much someone likes an item on its own, before thinking about who made it
function baseLike(p, it) {
  if (it.kind === 'book') return BOOKS[it.id] ? bookLike(p, it.id) : 0;
  if (it.kind === 'food') { const f = foodById(it.id); const P = p.body.palate, fl = f.fl, sum = fl.sweet + fl.salty + fl.spicy; return p.tastes[f.id] ?? (P.sweet * fl.sweet + P.salty * fl.salty + P.spicy * fl.spicy) / sum; }
  if (it.kind === 'hat') return (p.likes[it.color] || 0) * 0.8 + (p.likes['hat:' + it.id] || 0) * 0.8 - (p.wardrobe.hats.some((h) => h.id === it.id && h.color === it.color) ? 0.6 : 0) + 0.1;
  if (it.kind === 'shirt') return (p.likes[it.color] || 0) * 0.9 - (p.wardrobe.shirts.includes(it.color) ? 0.5 : 0);
  return (p.likes[it.color] || 0) * 0.7 + (p.body.decorAff[it.id] || 0) * 0.6 + (p.likes['decor:' + it.id] || 0) * 0.5;
}
function makerOpinion(p, it) { if (!it.maker || it.maker === p.id) return 0; const f = p.feelings[it.maker]; return f ? f.score / 8 : 0; }
function bestBy(keys, score) { return keys.map((k) => [k, score(k) + rand() * 0.7]).sort((a, b) => b[1] - a[1])[0][0]; }
function receive(p, it) {
  if (it.kind === 'book') { receiveBook(p, it); if (interior?.kind === 'room' && interior.id === p.id) interior.dirty = true; return; }
  if (it.kind === 'food') {
    const f = foodById(it.id); p.hunger = clamp(p.hunger - f.fill, 0, 1);
    const joy = clamp(baseLike(p, it) + (rand() - 0.5) * 0.3, -1, 1);
    p.tastes[f.id] = p.tastes[f.id] === undefined ? joy : p.tastes[f.id] * 0.7 + joy * 0.3;
  } else if (it.kind === 'hat') { p.wardrobe.hats.push({ id: it.id, color: it.color, maker: it.makerName }); p.outfit.hat = p.wardrobe.hats[p.wardrobe.hats.length - 1]; p.likes['hat:' + it.id] = (p.likes['hat:' + it.id] || 0) + 0.3; dressMesh(p); }
  else if (it.kind === 'shirt') { if (!p.wardrobe.shirts.includes(it.color)) p.wardrobe.shirts.push(it.color); p.outfit.shirt = it.color; dressMesh(p); }
  else { p.decor.push(it); if (p.decor.length > 12) p.decor.shift(); p.likes['decor:' + it.id] = (p.likes['decor:' + it.id] || 0) + 0.3; }
  p.likes[it.color] = (p.likes[it.color] || 0) + 0.2;
  if (interior?.kind === 'room' && interior.id === p.id) interior.dirty = true;
}
function residentBuys(p, shop) {
  const stock = W.stock[shop];
  if (!stock.length) { bubble(p, 'Nothing new today…', 2); return; }
  const scored = stock.map((it) => ({ it, s: baseLike(p, it) + makerOpinion(p, it) * 0.8 + (it.q - 1) * 0.15 + (rand() - 0.5) * 0.3, mo: makerOpinion(p, it) }));
  scored.sort((a, b) => b.s - a.s);
  const snub = scored.find((x) => x.mo <= -0.45 && baseLike(p, x.it) > 0.4);
  const best = scored.find((x) => itemPrice(x.it) <= purse(p) && x.mo > -0.45);
  if (snub && (!best || best.it !== snub.it) && rand() < 0.6) {
    bubble(p, `${snub.it.makerName} made that? No thanks.`, 2.8); emote(p, '☁');
    remember(p, `Saw ${a_an(itemName(snub.it))} I liked at ${SHOPS[shop].name}, but ${snub.it.makerName} made it, so I left it.`, 2, 'snub', snub.it.makerName);
    diary(`<b>${esc(p.name)}</b> refused to buy ${a_an(esc(itemName(snub.it)))} because ${esc(snub.it.makerName)} made it.`);
    return;
  }
  if (!best || best.s < 0.25) { bubble(p, best ? 'Just looking.' : 'Too expensive…', 2); return; }
  const it = best.it, price = itemPrice(it);
  stock.splice(stock.indexOf(it), 1);
  spend(p, price);
  const maker = it.maker && person(it.maker);
  if (maker && maker !== p) {
    maker.coins += price; feel(maker, p, 1, true); feel(p, maker, best.mo > 0.2 ? 0.5 : 0.2, true);
    remember(maker, `${p.name} bought the ${itemName(it)} I made!`, 2, 'sold', p.name);
  }
  receive(p, it);
  bubble(p, pick([`New ${itemName(it)}!`, `I love my new ${itemName(it)}.`, maker && maker !== p ? `${maker.name} made this. So cute!` : 'How do I look?']), 2.8); emote(p, '✦', 2);
  remember(p, `Bought ${a_an(itemName(it))}${maker && maker !== p ? ` made by ${maker.name}` : ''} at ${SHOPS[shop].name}.`, 2, 'bought', maker?.name, { what: itemName(it) });
  diary(`<b>${esc(p.name)}</b> bought ${a_an(esc(itemName(it)))}${maker && maker !== p ? ` made by ${esc(maker.name)}` : ''}.`);
}
function eatAt(p, shop) {
  const menu = FOODS.filter((f) => f.shop === shop && f.price <= purse(p));
  if (!menu.length) { bubble(p, "I can't afford anything…", 2.2); return; }
  const unknown = menu.filter((f) => p.tastes[f.id] === undefined);
  const f = unknown.length && (rand() < 0.35 || Object.keys(p.tastes).length < 2) ? pick(unknown) : [...menu].sort((a, b) => (p.tastes[b.id] ?? 0) - (p.tastes[a.id] ?? 0) + (rand() - 0.5) * 0.3)[0];
  const P = p.body.palate, fl = f.fl, sum = fl.sweet + fl.salty + fl.spicy;
  const joy = clamp((P.sweet * fl.sweet + P.salty * fl.salty + P.spicy * fl.spicy) / sum + (rand() - 0.5) * 0.4, -1, 1);
  const first = p.tastes[f.id] === undefined;
  p.tastes[f.id] = first ? joy : p.tastes[f.id] * 0.7 + joy * 0.3;
  spend(p, f.price); p.hunger = clamp(p.hunger - f.fill, 0, 1);
  const cook = W.keeper[shop] && W.keeper[shop] !== p.id ? person(W.keeper[shop]) : null;
  let line = joy > 0.35 ? pick([`Mmm, ${f.name}!`, `${cap(f.name)} is the best.`]) : joy < -0.2 ? pick([`Blegh. ${cap(f.name)}…`, `I don't like ${f.name}.`]) : `${cap(f.name)}. It's fine.`;
  if (cook && Math.abs(joy) > 0.45 && rand() < 0.6) { line = joy > 0 ? `${cook.name} makes the best ${f.name}!` : `${cook.name} ruined the ${f.name} again.`; feel(p, cook, joy > 0 ? 0.5 : -0.5, true); remember(cook, `${p.name} ${joy > 0 ? 'loved' : 'complained about'} the ${f.name} I made.`, 1, joy > 0 ? 'praised' : 'criticized', p.name); }
  bubble(p, line, 2.6); emote(p, joy > 0.35 ? '♥' : joy < -0.2 ? '☁' : '…', 2);
  remember(p, `Ate ${f.name} at ${SHOPS[shop].name}${cook ? ` (${cook.name} made it)` : ''}${joy > 0.35 ? ' and loved it' : joy < -0.2 ? ' and hated it' : ''}.`, first ? 2 : 1, 'ate', cook?.name, { food: f.name, joy, first });
  if (first) diary(`<b>${esc(p.name)}</b> tried ${f.name} for the first time${joy > 0.35 ? ' and loved it' : joy < -0.2 ? ' and made a face' : ''}.`);
}

