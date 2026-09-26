// ============================================================
// CREATOR TREATS: throw a town event or buy everyone a snack with your coins
// ============================================================
const SPONSOR_PRICE = 12;
function sponsorable() {
  if (W.event && W.event.day === W.day) return [];
  const season = seasonOf().id;
  return Object.entries(EVENTS).filter(([, E]) => !E.special && (!E.season || E.season === season) && W.t < E.t0 - 0.03).map(([k]) => k);
}
function treatPrice() { return Math.max(3, W.people.filter((p) => !p.visitor && p.task?.kind !== 'away').length); }
function sponsorHtml() {
  const C = W.creator, evs = sponsorable(), tp = treatPrice(), treated = W.treatDay === W.day;
  return `<p class="label">Treat the town</p>
    ${evs.length ? `<p class="hint">Throw an event today for ${SPONSOR_PRICE} ✦. Everyone is invited.</p><div class="btns">${evs.map((k) => `<button class="btn" type="button" data-sponsor="${k}" ${C.coins < SPONSOR_PRICE ? 'disabled' : ''}>${esc(cap(EVENTS[k].name))}, ${EVENTS[k].at}</button>`).join('')}</div>` : ''}
    <div class="btns" style="margin-top:8px"><button class="btn gold" type="button" data-treat="1" ${treated || C.coins < tp ? 'disabled' : ''}>${treated ? 'You already bought snacks today' : `Buy everyone a snack (${tp} ✦)`}</button></div>`;
}
function sponsorCmd(c) {
  const C = W.creator;
  if (c.a === 'event') {
    const E = EVENTS[c.id]; if (!E || !sponsorable().includes(c.id)) return "It's too late for that today.";
    if (C.coins < SPONSOR_PRICE) return `You need ${plural(SPONSOR_PRICE, 'coin')}.`;
    C.coins -= SPONSOR_PRICE;
    W.event = { id: c.id, day: W.day, host: null, creator: true, going: W.people.filter((p) => p.task?.kind !== 'away').map((p) => p.id) };
    for (const p of W.people) { if (p.cr.score > -4) creatorShift(p, 0.4); addJoy(p, 6); remember(p, `The Creator threw ${E.name} for everyone at ${E.at}.`, 2, 'creatorEvent'); }
    diary(`<span class="cr">Creator</span> threw <b>${esc(E.name)}</b> at ${E.at}. Everyone is invited.`);
    Sound.sparkle(); markDirty();
    return `Everyone's invited to ${E.name} at ${E.at}.`;
  }
  if (c.a === 'treat') {
    const n = treatPrice();
    if (W.treatDay === W.day) return 'You already bought snacks today.';
    if (C.coins < n) return `You need ${plural(n, 'coin')}.`;
    C.coins -= n; W.treatDay = W.day;
    for (const p of W.people) {
      if (p.visitor || p.task?.kind === 'away') continue;
      p.hunger = clamp(p.hunger - 0.3, 0, 1); addJoy(p, 8); if (p.cr.score > -4) creatorShift(p, 0.3);
      remember(p, 'The Creator bought everyone a snack today.', 1, 'creatorTreat');
      if (!p.inside && rand() < 0.5) { bubble(p, pick(['Snacks from the sky!', 'Free treats? Thank you, Creator!', 'Mm, a little treat.']), 3); emote(p, '♥', 2); }
    }
    diary(`<span class="cr">Creator</span> bought everyone a snack.`);
    Sound.coin(); markDirty();
    return 'Everyone got a snack.';
  }
  return '';
}
sheet.addEventListener('click', (e) => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.sponsor) send({ t: 'sponsor', a: 'event', id: t.dataset.sponsor });
  else if (t.dataset.treat) send({ t: 'sponsor', a: 'treat' });
});
function creatorTreatsBoot() {
  W.added = W.added || {}; if (W.added.creatorTreats) return; W.added.creatorTreats = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'More to do with your coins: the Town board lets you throw a picnic, tea party or other event for everyone, buy the whole town a snack once a day, or pay off the rest of a town project in one go. First tastes of new food now share one line a day in the diary, so the big moments stay easy to find.', 'coins and the diary');
}
