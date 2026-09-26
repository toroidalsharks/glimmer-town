// ============================================================
// BIRTHDAYS
// ============================================================
function ensureBdays() { for (const p of W.people) if (!p.bday) p.bday = p.bornDay > 1 ? yearDay(p.bornDay) : 1 + Math.floor(rand() * YEAR); }
const isBirthday = (p) => !!p.bday && W.day > (p.bornDay || 0) && yearDay() === p.bday;
function birthdayMorning() {
  ensureBdays();
  for (const p of W.people.filter((q) => isBirthday(q) && !q.away)) {
    addJoy(p, 20); remember(p, "It's my birthday today!", 2, 'birthday');
    diary(`🎂 It's <b>${esc(p.name)}</b>'s birthday!`);
    const friends = W.people.filter((q) => q !== p && !q.away && !q.visitor && (q.feelings[p.id]?.score || 0) >= 3);
    for (const f of friends.slice(0, 3)) {
      const it = newItem('decor', pick(['bouquet', 'plush', 'poster', 'musicbox', 'globe']), topColors(p)[0] || pick(Object.keys(COLORS)), f.id);
      receive(p, it); feel(p, f, 0.6, true);
      remember(p, `${f.name} gave me ${a_an(itemName(it))} for my birthday.`, 2, 'bdayGift', f.name);
      remember(f, `Gave ${p.name} ${a_an(itemName(it))} for their birthday.`, 1, 'gaveKind', p.name);
    }
    if (friends.length) diary(`${friends.slice(0, 3).map((f) => esc(f.name)).join(', ')} gave ${esc(p.name)} birthday presents.`);
    if (!(W.event && W.event.day === W.day)) { W.event = { id: 'bday', day: W.day, host: p.id, going: [p.id, ...friends.map((f) => f.id)] }; diary(`There's a surprise party for ${esc(p.name)} at Moonbean Café at ${EVENTS.bday.at}.`); }
  }
}

