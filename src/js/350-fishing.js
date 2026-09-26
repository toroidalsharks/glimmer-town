// ============================================================
// FISHING (for you, at the end of the pier)
// ============================================================
const CATCHES = [
  { name: 'a tiny minnow', color: 'cream', q: 1, w: 30 }, { name: 'a sea bass', color: 'navy', q: 1, w: 25 },
  { name: 'a rainbow trout', color: 'rose', q: 2, w: 18 }, { name: 'a pufferfish', color: 'lemon', q: 2, w: 12 },
  { name: 'a moon jellyfish', color: 'lilac', q: 3, w: 6 }, { name: 'a golden koi', color: 'lemon', q: 3, w: 4 },
];
let fishing = null;
function openFishing() {
  if (MODE !== 'host') return;
  W.fishDay = W.fishDay || {};
  const used = W.fishDay[W.day] || 0;
  fishing = { pos: 0, dir: 1, zone: 0.35 + rand() * 0.3, width: 0.16, speed: 0.9 + rand() * 0.6, running: true };
  $('#fishBox').hidden = false; $('#fishMsg').textContent = `Cast ${used + 1} today. Tap Reel when the float is in the pink. Rare fish sell for a lot.`;
  if (!interior && Math.hypot(controls.target.x, controls.target.z - 38) > 6) camGo('pier');
  $('#fishZone').style.left = (fishing.zone * 100) + '%'; $('#fishZone').style.width = (fishing.width * 100) + '%';
  Sound.splash();
}
function fishingFrame(dt) {
  if (!fishing || !fishing.running) return;
  fishing.pos += fishing.dir * fishing.speed * dt;
  if (fishing.pos > 1) { fishing.pos = 1; fishing.dir = -1; } if (fishing.pos < 0) { fishing.pos = 0; fishing.dir = 1; }
  $('#fishFloat').style.left = `calc(${fishing.pos * 100}% - 9px)`;
}
function reel() {
  if (!fishing || !fishing.running) return;
  fishing.running = false;
  W.fishDay = { [W.day]: (W.fishDay[W.day] || 0) + 1 };
  const hit = fishing.pos >= fishing.zone && fishing.pos <= fishing.zone + fishing.width;
  if (!hit) { $('#fishMsg').textContent = 'It got away! Tap Cast to try again.'; Sound.splash(); return; }
  const center = Math.abs(fishing.pos - (fishing.zone + fishing.width / 2)) < fishing.width * 0.2;
  const pool = CATCHES.filter((c) => center || c.q < 3);
  let r = rand() * pool.reduce((s, c) => s + c.w, 0), got = pool[0];
  for (const c of pool) { if ((r -= c.w) <= 0) { got = c; break; } }
  const it = newItem('decor', 'fishbowl', got.color, null, got.q); it.catchName = got.name.replace(/^an? /, '');
  W.creator.items.push(it); markDirty();
  Sound.sparkle();
  $('#fishMsg').textContent = `You caught ${got.name}${got.q === 3 ? '! That one is rare!' : '!'} It's in a fishbowl in Your gifts.`;
  diary(`<span class="cr">Creator</span> went fishing off the pier and caught ${got.name}.`);
  const fisher = W.people.find((p) => p.job === 'pier' && !p.inside && Math.hypot(p.x, p.z - 38) < 8);
  if (fisher) { bubble(fisher, got.q === 3 ? `Whoa. ${cap(got.name.replace(/^an? /, ''))}?! Nice.` : pick(['Nice catch.', 'Not bad!', 'Beginner\'s luck.']), 3); remember(fisher, `I watched the Creator catch ${got.name} off my pier.`, 2, 'fishing'); }
}

