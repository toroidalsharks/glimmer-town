// ============================================================
// COMMANDS (the one door for everything you do, local or from a remote)
// ============================================================
function applyCmd(c) {
  if (!W) return 'The town is still loading.';
  const C = W.creator;
  switch (c.t) {
    case 'buy': {
      let it, price;
      const foodShop = FOODS.some((f) => f.shop === c.shop);
      if (foodShop) {
        const f = foodById(c.id); if (!f || f.shop !== c.shop) return 'That is not on the menu.';
        it = newItem('food', f.id, null, W.keeper[c.shop], 1);
      } else {
        const s = W.stock[c.shop]; const i = s ? s.findIndex((x) => x.uid === c.uid) : -1;
        if (i < 0) return 'Someone already bought that one.';
        it = s[i];
      }
      price = itemPrice(it);
      if (C.coins < price) return `You need ${plural(price, 'coin')} for that.`;
      if (!foodShop) W.stock[c.shop].splice(W.stock[c.shop].indexOf(it), 1);
      C.coins -= price; C.items.push(it);
      const m = it.maker && person(it.maker);
      if (m) { m.coins += it.kind === 'food' ? 1 : price; creatorShift(m, 0.6); remember(m, `The Creator bought ${a_an(itemName(it))} I made!`, 2, 'creatorBought'); emote(m, '✦', 3); }
      diary(`<span class="cr">Creator</span> bought ${a_an(esc(itemName(it)))}${m ? ` made by ${esc(m.name)}` : ''} at ${SHOPS[c.shop].name}.`);
      markDirty();
      Sound.coin();
      if (c.to && person(c.to)) return applyCmd({ t: 'gift', uid: it.uid, to: c.to });
      return `Bought ${a_an(itemName(it))}${m ? `. ${m.name} earned ${plural(it.kind === 'food' ? 1 : price, 'coin')}` : ''}.`;
    }
    case 'feed': {
      const p = person(c.to), f = foodById(c.id); if (!p || !f) return '';
      if (C.coins < f.price) return `You need ${plural(f.price, 'coin')} for that.`;
      C.coins -= f.price;
      const it = newItem('food', f.id, null, W.keeper[f.shop], 1);
      const m = it.maker && person(it.maker); if (m && m !== p) m.coins += 1;
      const res = giftItem(p, it); if (res.refused) C.items.push(it);
      bubble(p, res.line, 4.5, true); emote(p, res.refused ? '☁' : '♥', 3); markDirty();
      return res.text;
    }
    case 'advice': {
      const p = person(c.to); if (!p) return '';
      const pr = problemOf(p), t = pr?.who && person(pr.who);
      const unCool = (a, b) => { delete W.pairCool[[a.id, b.id].sort().join('|')]; };
      if (pr?.kind === 'fight' && t) {
        if (c.choice === 'sorry') { p.makeup = t.id; unCool(p, t); if (p.state !== 'talk' || p.heldByDlg) { p.task = null; p.path = []; } creatorShift(p, 0.3); addJoy(p, 10); remember(p, `The Creator told me to go apologize to ${t.name}.`, 2, 'advice'); bubble(p, `Okay… I'm going to find ${t.name}.`, 3, true); return `${p.name}: "Okay… I'll go say sorry to ${t.name}."`; }
        if (c.choice === 'letgo') { p.feelings[t.id].score = -2; creatorShift(p, 0.3); addJoy(p, 20); remember(p, `The Creator helped me let go of my grudge against ${t.name}.`, 2, 'advice'); return `${p.name}: "You're right. It's not worth staying mad at ${t.name}."`; }
        if (c.choice === 'stand') { feel(p, t, -1, true); creatorShift(p, 0.5); addJoy(p, 15); remember(p, `The Creator said I was right about ${t.name}.`, 2, 'advice'); return `${p.name}: "Yeah! I'm not the one who should apologize!"`; }
      }
      if (pr?.kind === 'lonely' && c.choice === 'friend') {
        const cand = W.people.filter((q) => q !== p && q.grow >= 1).sort((a, b) => (b.feelings[p.id]?.score || 0) - (a.feelings[p.id]?.score || 0))[0];
        if (!cand) return `${p.name}: "There's nobody around to talk to…"`;
        p.befriend = cand.id; unCool(p, cand); if (p.state !== 'talk' || p.heldByDlg) { p.task = null; p.path = []; } addJoy(p, 10);
        return `${p.name}: "Okay! I'll go talk to ${cand.name}. Wish me luck!"`;
      }
      if (pr?.kind === 'wish' && c.choice === 'wait') { p.cr.wish.day = W.day; creatorShift(p, 0.2); addJoy(p, 5); return `${p.name}: "You'll look for it? Okay, I'll wait!"`; }
      return `${p.name}: "Hm? I'm okay now."`;
    }
    case 'gift': {
      const p = person(c.to), i = C.items.findIndex((x) => x.uid === c.uid);
      if (!p) return 'They are not here anymore.'; if (i < 0) return 'That item is gone.';
      const it = C.items.splice(i, 1)[0];
      const res = giftItem(p, it); if (!res.refused) Sound.sparkle();
      if (res.refused) C.items.push(it);
      bubble(p, res.line, 4.5, true); emote(p, res.refused ? '☁' : '✧', 3);
      markDirty();
      return res.text;
    }
    case 'coins': {
      const p = person(c.to), n = clamp(Math.floor(c.n) || 0, 1, 50);
      if (!p) return 'They are not here anymore.'; if (C.coins < n) return 'You don\'t have enough coins.';
      const res = giftCoins(p, n); bubble(p, res.line, 4, true); emote(p, '✦', 3); markDirty();
      return res.text;
    }
    case 'chip': {
      const n = clamp(Math.floor(c.n) || 0, 1, 50);
      if (!W.project) return 'There is no project right now.'; if (C.coins < n) return 'You don\'t have enough coins.';
      C.coins -= n; W.project.raised += n;
      for (const p of W.people) { if (p.cr.score > -2) creatorShift(p, 0.3); remember(p, `Someone said the Creator chipped in ${plural(n, 'coin')} for ${PROJECTS[W.project.id].name}.`, 1, 'creatorHelp'); }
      diary(`<span class="cr">Creator</span> chipped in ${plural(n, 'coin')} for ${esc(PROJECTS[W.project.id].name)}.`);
      const name = PROJECTS[W.project.id].name; checkProject(); markDirty();
      return W.built[Object.keys(PROJECTS).find((k) => PROJECTS[k].name === name)] ? `That finished ${name}!` : `Added ${plural(n, 'coin')} to ${name}.`;
    }
    case 'place': {
      const B = BUILDS[c.type]; if (!B) return '';
      if (C.coins < B.price) return `You need ${plural(B.price, 'coin')} for ${a_an(B.name)}.`;
      let x = c.x, z = c.z;
      if (x === undefined || x === null) { const sp = autoSpot(B.size || 0); if (!sp) return 'There is no room left. Try buying more land.'; [x, z] = sp; }
      const prob = spotProblem(x, z, B.size || 0); if (prob) return prob;
      C.coins -= B.price; W.placed.push({ id: uid(), type: c.type, x, z, rot: rand() * 6.28, day: W.day });
      buildPlaced(); reactToBuild(B.name); diary(`<span class="cr">Creator</span> put ${a_an(esc(B.name))} in town.`); markDirty();
      return `Placed ${a_an(B.name)}.`;
    }
    case 'unplace': { const i = (W.placed || []).findIndex((x) => x.id === c.id); if (i < 0) return ''; const pl = W.placed.splice(i, 1)[0]; C.coins += Math.floor(BUILDS[pl.type].price / 2); buildPlaced(); markDirty(); return `Removed the ${BUILDS[pl.type].name}. You got half back.`; }
    case 'land': {
      const L = LOBES[c.lobe]; if (!L || W.lobes.includes(c.lobe)) return '';
      if (C.coins < L.price) return `You need ${plural(L.price, 'coin')} for the ${L.name}.`;
      C.coins -= L.price; W.lobes.push(c.lobe); buildLand();
      diary(`The island grew! <b>${esc(L.name)}</b> rose out of the sea.`);
      for (const p of W.people) if (!p.inside && rand() < 0.6) { bubble(p, pick(['Whoa, the island just got bigger!', 'New land?!', 'Did you feel that?']), 3); remember(p, `The island grew. ${L.name} rose out of the sea.`, 2, 'build'); }
      markDirty(); return `${L.name} rose out of the sea!`;
    }
    case 'invite': { inviteResident(String(c.name || 'Newbie').slice(0, 20), String(c.about || '').slice(0, 1200), c.color).then((m) => toast(m)); return 'Someone is packing their bags…'; }
    case 'mailread': { const m = (W.mail || []).find((x) => x.id === c.mid); if (m) { m.read = true; markDirty(); } return ''; }
    case 'mailtext': { const m = (W.mail || []).find((x) => x.id === c.mid); if (m) { Object.assign(m, { greet: String(c.greet || m.greet), body: String(c.body || m.body), sign: String(c.sign || m.sign), written: true }); markDirty(); } return ''; }
    case 'mailreply': {
      const m = (W.mail || []).find((x) => x.id === c.mid); if (!m || m.reply) return '';
      m.reply = String(c.reply || ''); m.reaction = String(c.reaction || ''); m.read = true;
      const p = person(m.from);
      if (p) { const f = clamp(Number(c.feeling) || 0, -2, 2); creatorShift(p, f * 0.8 + 0.4); addJoy(p, 12); p.cr.lastSeen = W.day; remember(p, `The Creator wrote back to my letter: "${m.reply.slice(0, 140)}"`, 3, 'creatorLetter'); bubble(p, m.reaction.slice(0, 110), 5, true); emote(p, '✉', 3); diary(`<span class="cr">Creator</span> wrote back to <b>${esc(p.name)}</b>. ${esc(p.name)}: "${esc(m.reaction)}"`); }
      markDirty(); return p ? `${p.name} read your letter.` : '';
    }
    case 'paper': { if (c.paper && c.paper.headline) { W.paper = { day: W.day, headline: String(c.paper.headline).slice(0, 120), stories: (c.paper.stories || []).slice(0, 3).map((x) => ({ title: String(x.title || '').slice(0, 100), text: String(x.text || '').slice(0, 600) })) }; markDirty(); } return ''; }
    case 'talked': {
      const p = person(c.to); if (!p) return '';
      applyTalk(p, String(c.said || ''), String(c.reply || '…'), Number(c.feeling) || 0, String(c.memory || ''));
      markDirty(); return '';
    }
    case 'follow': openDetail = c.id || null; if (MODE === 'host' && c.id) lastTouch = now; return '';
    case 'room': if (c.id) openInterior({ kind: 'room', id: c.id }); else closeInterior(); return '';
    case 'shopview': if (SHOPS[c.shop]) openInterior({ kind: 'shop', shop: c.shop }); return '';
    case 'set': if (c.key === 'gfx' && GFX_LEVELS[c.value]) { if (MODE === 'host') { gfxSetting(c.value); wireGfxSettings(); } return ''; } if (['spin', 'follow', 'shadows', 'boxMode', 'mirror', 'daySec', 'cute', 'cutscenes'].includes(c.key)) { cfg[c.key] = c.value; savePrefs(); applyLook(); syncSettingsUI(); if (c.key === 'cute' && MODE === 'host') setTimeout(() => location.reload(), 800); } return '';
    case 'plot': return plotCmd(c);
    case 'lab': if (MODE === 'host' && person(c.pid)) { labAct(c.pid, c.act, c.text).then((r) => { if (r) toast(r); if (labOpen) renderLab(); refreshPanel(false); }); setTimeout(() => { if (labOpen) renderLab(); }, 30); } return '';
    case 'labsview': if (MODE === 'host') openInterior({ kind: 'labs', wing: LAB_WINGS[c.wing] ? c.wing : labWingLast }); return '';
    case 'uproar': if (W.scene && W.scene.kind === 'uproar' && W.scene.live && !W.scene.creator && ['A', 'B', 'calm'].includes(c.choice)) W.scene.creator = c.choice; return '';
    case 'hair': return setHair(c.pid, c.style, c.color);
    case 'laptopgift': return MODE === 'host' ? creatorLaptop(c.pid) : '';
    case 'clinicview': if (MODE === 'host') openInterior({ kind: 'clinic' }); return '';
    case 'care': if (MODE === 'host' && person(c.pid)) { careAct(c.pid, c.act, c.text, c.cond).then((r) => { if (r) toast(r); if (careOpen) renderCare(); refreshPanel(false); }); setTimeout(() => { if (careOpen) renderCare(); }, 30); } return '';
    case 'agent': if (MODE === 'host') runAgent(String(c.request || '').slice(0, 400)).then((m) => { toast(m); refreshPanel(true); }); return '✳ Claude is working on it…';
    case 'sendlink': { const it = (W.outside?.items || []).find((x) => x.id === c.item), p = person(c.to); if (!it || !p) return ''; if (!W.outsideFound) { W.outsideFound = { by: 'creator', name: 'The Creator', day: W.day }; diary('🌐 <span class="cr">Creator</span> showed the island a window to <b>the Outside</b>.'); } seeItem(p, it, true); return `You showed ${p.name}. Watch what they say.`; }
    case 'outside': cfg[c.key === 'posts' ? 'outsidePosts' : c.key === 'politics' ? 'outsidePolitics' : 'outside'] = !!c.value; savePrefs(); if (c.value) fetchOutside(true); return '';
    case 'buybook': { const B = BOOKS[c.id]; if (!B) return ''; if (C.coins < B.price) return `You need ${plural(B.price, 'coin')}.`; C.coins -= B.price; C.items.push(newItem('book', c.id, null, null, 1)); Sound.coin(); markDirty(); return `You bought "${B.title}". It's in Your gifts.`; }
    case 'rule': { const k = (W.cases || []).find((x) => x.id === c.id); if (!k) return 'That case is gone.'; const r = applyRuling(k, c.choice, false); if (k.status === 'closed' && cutsOn()) verdictMini(k); return r; }
    case 'cut': return cutCmd(c);
    case 'crime': return crimeCmd(c);
    case 'hallview': if (MODE === 'host') openInterior({ kind: 'hall' }); return '';
    case 'debate': { const a = person(c.a), b = person(c.b); if (!a || !b) return ''; const k = fileCase('debate', a, b, { topic: String(c.topic || pick(DEBATES)).slice(0, 80), byCreator: true }); return k ? `⚖ ${a.name} and ${b.name} have been summoned to debate: ${k.topic}` : 'They already have a debate waiting.'; }
    case 'skip': { const t = Sound.skip(); return t ? `♪ Now playing: ${t}` : 'The box has music turned off.'; }
    case 'gather': return gatherCmd(c);
    case 'landtap': {
      const M = mats(), key = 'lt' + c.id;
      if ((treeCool[key] || 0) > now) return c.kind === 'orchard' ? 'No ripe fruit yet. Try another tree.' : c.kind === 'scrap' ? 'The bin is empty. Glimmer Labs throws out more stuff every minute or so.' : c.kind === 'boulder' ? 'You already chipped this one. Give it a minute.' : 'This crystal is still recharging.';
      treeCool[key] = now + (c.kind === 'crystal' ? 60 : c.kind === 'scrap' ? 45 : 30);
      if (c.kind === 'orchard') { M.wood++; spawnBurst(c.x, 3, c.z, ['#6fbf6a', '#ffb347'], 14, 2, 0.3); markDirty(); if (rand() < 0.45) { const it = newItem('food', 'apple', null, null, 2); it.grown = true; W.creator.items.push(it); Sound.coin(); return '+1 wood and an apple 🍎'; } Sound.step(); return '+1 wood 🪵'; }
      if (c.kind === 'scrap') { const n = 1 + (rand() < 0.4 ? 1 : 0); M.parts += n; spawnBurst(c.x, 1.2, c.z, ['#c9ccd6', '#9fe3ff'], 14, 1.8, 0.25); Sound.coin(); markDirty(); return `+${n} metal parts ⚙️ (from the recycling bin)`; }
      if (c.kind === 'boulder') { const n = 2 + (rand() < 0.3 ? 1 : 0); M.stone += n; spawnBurst(c.x, 1, c.z, ['#c9c3e0', '#8a84a8'], 16, 2, 0.3); Sound.step(); markDirty(); return `+${n} stone 🪨`; }
      const got = pick(['shells', 'flowers', 'stone', 'parts', 'parts']), n = 2 + Math.floor(rand() * 2); M[got] += n; spawnBurst(c.x, 1.5, c.z, ['#9fd3ff', '#c9b3ff', '#ffb3e6', '#ffffff'], 30, 2.4, 0.3); Sound.sparkle(); markDirty();
      if (rand() < 0.08) { const n2 = 5; W.creator.coins += n2; return `+${n} ${MATS[got]} and ${n2} coins hidden inside ✨`; }
      return `+${n} ${MATS[got]} ✨`;
    }
    case 'craft': return craftCmd(c);
    case 'donate': { if (!(W.placed || []).some((pl) => pl.type === 'museum')) return 'Build a museum first.'; const i = C.items.findIndex((x) => x.uid === c.uid); if (i < 0) return ''; const it = C.items.splice(i, 1)[0]; W.museum = W.museum || []; W.museum.push({ name: itemName(it), day: W.day }); for (const p of W.people) if (rand() < 0.4) remember(p, `The Creator gave ${a_an(itemName(it))} to the museum.`, 1, 'museum'); diary(`🏛 <span class="cr">Creator</span> donated ${a_an(esc(itemName(it)))} to the museum.`); Sound.sparkle(); markDirty(); return `Donated ${a_an(itemName(it))}. The museum has ${plural(W.museum.length, 'exhibit')} now.`; }
    case 'sell': { const i = C.items.findIndex((x) => x.uid === c.uid); if (i < 0) return 'That item is gone.'; const it = C.items.splice(i, 1)[0], v = sellValue(it); C.coins = Math.min(9999, C.coins + v); Sound.coin(); markDirty(); return `Sold ${a_an(itemName(it))} for ${plural(v, 'coin')}.`; }
    case 'shine': return shineCmd(c.id);
    case 'catname': W.catName = String(c.name || '').slice(0, 20) || null; markDirty(); return `Her cat is called ${catName()} now.`;
    case 'cam': if (c.home) { openDetail = null; camHome = true; } if (c.place && MODE === 'host') camGo(c.place); return '';
  }
  return '';
}
let pendingAcks = new Map(), rIsle = 'isle1';
function send(c) {
  if (MODE === 'host') { const res = applyCmd(c); if (res) toast(res); refreshPanel(true); return; }
  if (!RT.room) { toast('The remote lost its connection to the box.'); return; }
  const id = uid(); c.rid = id; c.isle = rIsle;
  RT.room.emit(`${rIsle}-cmd`, c).catch(() => toast("Couldn't reach the box."));
  if (['buy', 'gift', 'coins', 'chip'].includes(c.t)) {
    const timer = setTimeout(() => { pendingAcks.delete(id); toast("The box didn't answer. Is it still running?"); }, 7000);
    pendingAcks.set(id, timer);
  }
}

