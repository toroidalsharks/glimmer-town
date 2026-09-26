// ============================================================
// YOUR GARDEN PLOT (next to the town garden)
// ============================================================
const CROPS = {
  strawberry: { name: 'strawberries', emoji: '🍓', days: 2, price: 2, seasons: ['spring', 'summer'], food: 'strawberry', yield: 2, col: '#ff4f6a' },
  carrot: { name: 'carrots', emoji: '🥕', days: 2, price: 1, seasons: ['spring', 'autumn'], food: 'carrot', yield: 2, col: '#ff9a3c' },
  tulip: { name: 'tulips', emoji: '🌷', days: 2, price: 2, seasons: ['spring'], flower: 'rose', col: '#ff7fa8' },
  tomato: { name: 'tomatoes', emoji: '🍅', days: 3, price: 2, seasons: ['summer'], food: 'tomato', yield: 2, col: '#ff5a4a' },
  sunflower: { name: 'sunflowers', emoji: '🌻', days: 3, price: 2, seasons: ['summer', 'autumn'], flower: 'lemon', col: '#ffd23a' },
  pumpkin: { name: 'pumpkins', emoji: '🎃', days: 4, price: 3, seasons: ['autumn'], food: 'pumpkin', yield: 1, col: '#ff8a2a' },
  cabbage: { name: 'winter cabbage', emoji: '🥬', days: 3, price: 2, seasons: ['autumn', 'winter'], food: 'cabbage', yield: 1, col: '#9fd67e' },
  snowdrop: { name: 'snowdrops', emoji: '🤍', days: 3, price: 2, seasons: ['winter'], flower: 'cream', col: '#ffffff' },
};
const PLOT_N = 6;
const PLOT_AT = polar(135, 16.6);
let plotGroup = null, plotPick = null;
function tileReady(t) { return t && t.stage >= CROPS[t.crop].days; }
function tileState(t) {
  if (!t) return 'Ready for seeds';
  const C = CROPS[t.crop];
  if (tileReady(t)) return 'Ready to pick!';
  const w = t.wateredDay === W.day || wetToday();
  return `${t.stage}/${C.days} days${w ? (wetToday() && t.wateredDay !== W.day ? ' · the rain watered it' : ' · watered') : ' · thirsty'}`;
}
function plotGrow() {
  if (!W.plot) return;
  const wet = wetToday();
  const helper = W.people.find((p) => p.job === 'garden' && !p.away && p.cr.score >= 3);
  let helped = false;
  for (const t of W.plot) {
    if (!t || tileReady(t)) continue;
    let watered = t.wateredDay === W.day || wet;
    if (!watered && helper && rand() < 0.5) { watered = true; helped = true; }
    if (watered) t.stage++; else t.missed = (t.missed || 0) + 1;
  }
  if (helped) { diary(`<b>${esc(helper.name)}</b> saw your plot looking thirsty and watered it for you.`); remember(helper, "Watered the Creator's garden plot. It looked thirsty.", 2, 'helpedCreator'); }
}
function plotCmd(c) {
  W.plot = W.plot || Array(PLOT_N).fill(null);
  const i = clamp(Math.floor(c.i) || 0, 0, PLOT_N - 1), t = W.plot[i], C = W.creator;
  if (c.act === 'plant') {
    const cr = CROPS[c.crop]; if (!cr) return 'Pick a seed.';
    if (t) return 'Something is already growing there.';
    if (!cr.seasons.includes(seasonOf().id)) return `${cap(cr.name)} won't grow in ${seasonOf().name.toLowerCase()}.`;
    if (C.coins < cr.price) return "You don't have enough coins.";
    C.coins -= cr.price; W.plot[i] = { crop: c.crop, day: W.day, stage: 0, wateredDay: -1, missed: 0 };
    plotPick = null; buildPlot(); markDirty(); Sound.coin();
    return `You planted ${cr.name}. Water them every day.`;
  }
  if (c.act === 'water') {
    if (!t) return 'Nothing is planted there.';
    if (tileReady(t)) return 'It is ready to pick!';
    if (t.wateredDay === W.day) return 'Already watered today.';
    t.wateredDay = W.day; buildPlot(); markDirty(); Sound.splash();
    return `You watered the ${CROPS[t.crop].name}.`;
  }
  if (c.act === 'harvest') {
    if (!tileReady(t)) return 'Not ready yet.';
    const cr = CROPS[t.crop], q = (t.missed || 0) === 0 ? (rand() < 0.3 ? 3 : 2) : 1;
    const got = [];
    if (cr.food) for (let k = 0; k < (cr.yield || 1); k++) { const it = newItem('food', cr.food, null, null, q); it.grown = true; C.items.push(it); got.push(it); }
    else { const it = newItem('decor', 'bouquet', cr.flower, null, q); it.label = `bouquet of ${cr.name}`; it.grown = true; C.items.push(it); got.push(it); }
    W.plot[i] = null; buildPlot(); markDirty(); Sound.sparkle();
    diary(`<span class="cr">Creator</span> picked ${cr.name} from their garden plot${q === 3 ? '. They came out perfect' : ''}.`);
    const g = W.people.find((p) => !p.inside && Math.hypot(p.x - PLOT_AT[0], p.z - PLOT_AT[1]) < 9);
    if (g) { bubble(g, pick([`Ooh, ${cr.name}!`, 'You grew those yourself?', 'That smells so good.', 'Can I have one? Kidding. Unless…']), 3); remember(g, `Watched the Creator pick ${cr.name} from their garden.`, 1, 'creatorGarden'); }
    return `You picked ${got.length > 1 ? `${got.length} ` : ''}${cr.name}${q === 3 ? ' ★★★' : ''}. They're in Your gifts.`;
  }
  return '';
}
function buildPlot() {
  if (MODE !== 'host' || !scene) return;
  if (plotGroup) scene.remove(plotGroup);
  const g = new T3.Group(); plotGroup = g;
  const plot = W.plot || [];
  g.add(mesh(box(4.9, 0.12, 3.5), toon('#c49a6c'), 0, 0.06, 0, false));
  for (let i = 0; i < PLOT_N; i++) {
    const t = plot[i], x = -1.55 + (i % 3) * 1.55, z = i < 3 ? -0.8 : 0.8;
    const wet = t && (t.wateredDay === W.day || wetToday());
    g.add(mesh(box(1.3, 0.22, 1.3), toon(wet ? '#5a3d2a' : '#7a5538'), x, 0.16, z));
    if (!t) continue;
    const C = CROPS[t.crop], f = Math.min(1, t.stage / C.days), leaf = toon('#6fbf6a');
    if (!tileReady(t)) {
      for (let k = 0; k < 3; k++) { const s = mesh(new T3.ConeGeometry(0.1 + f * 0.1, 0.18 + f * 0.5, 5), leaf, x - 0.35 + k * 0.35, 0.3 + (0.09 + f * 0.25), z, false); g.add(s); }
      continue;
    }
    const col = toon(C.col);
    if (t.crop === 'pumpkin') { g.add(mesh(sph(0.42, 12, 8).scale(1, 0.75, 1), col, x, 0.55, z)); g.add(mesh(cyl(0.05, 0.05, 0.2, 5), leaf, x, 0.9, z)); }
    else if (t.crop === 'cabbage') g.add(mesh(new T3.IcosahedronGeometry(0.38, 1), col, x, 0.62, z));
    else if (t.crop === 'carrot') for (let k = 0; k < 3; k++) { g.add(mesh(new T3.ConeGeometry(0.1, 0.3, 5), leaf, x - 0.35 + k * 0.35, 0.5, z, false)); g.add(mesh(cyl(0.09, 0.09, 0.08, 8), col, x - 0.35 + k * 0.35, 0.3, z, false)); }
    else if (C.flower || t.crop === 'sunflower') for (let k = 0; k < 3; k++) { const h = t.crop === 'sunflower' ? 1.2 : 0.55, xx = x - 0.35 + k * 0.35; g.add(mesh(cyl(0.03, 0.03, h, 5), leaf, xx, 0.27 + h / 2, z, false)); g.add(mesh(sph(t.crop === 'sunflower' ? 0.2 : 0.12, 8, 6), col, xx, 0.3 + h, z)); }
    else for (let k = 0; k < 3; k++) { const xx = x - 0.35 + k * 0.35; g.add(mesh(new T3.ConeGeometry(0.16, 0.4, 5), leaf, xx, 0.5, z, false)); g.add(mesh(sph(0.1, 8, 6), col, xx + 0.08, 0.42, z + 0.12)); }
    g.add(mesh(sph(0.08, 6, 5), toon('#ffe98a', { emissive: new T3.Color('#6a5a10') }), x, 1.5 + Math.sin(i) * 0.1, z, false));
  }
  const sign = mesh(box(1.5, 0.7, 0.08), toon('#fff4dc'), 0, 0.95, 1.95); g.add(sign); g.add(mesh(cyl(0.05, 0.05, 0.8, 5), toon('#8a6a4e'), 0, 0.4, 1.93));
  const tx = document.createElement('canvas'); tx.width = 256; tx.height = 110; const c2 = tx.getContext('2d'); c2.fillStyle = '#fff4dc'; c2.fillRect(0, 0, 256, 110); c2.fillStyle = '#6b4a3a'; c2.font = '30px "Mochiy Pop One", sans-serif'; c2.textAlign = 'center'; c2.fillText("Creator's", 128, 46); c2.fillText('garden', 128, 88);
  const face = mesh(new T3.PlaneGeometry(1.44, 0.64), new T3.MeshBasicMaterial({ map: new T3.CanvasTexture(tx) }), 0, 0.95, 1.995, false); g.add(face);
  g.position.set(PLOT_AT[0], 0, PLOT_AT[1]); g.rotation.y = Math.atan2(-PLOT_AT[0], -PLOT_AT[1]) + Math.PI;
  g.traverse((o) => (o.userData.tap = { kind: 'plot' }));
  scene.add(g);
}
function plotHtml() {
  const plot = W.plot || Array(PLOT_N).fill(null), S = seasonOf();
  const inSeason = Object.entries(CROPS).filter(([, c]) => c.seasons.includes(S.id));
  const tiles = plot.map((t, i) => {
    const C = t && CROPS[t.crop];
    const act = !t ? `<button class="btn" type="button" data-plotpick="${i}">Plant</button>` : tileReady(t) ? `<button class="btn gold" type="button" data-plot="harvest" data-i="${i}">Pick</button>` : t.wateredDay === W.day ? '' : `<button class="btn" type="button" data-plot="water" data-i="${i}">💧 Water</button>`;
    return `<div class="tile${plotPick === i ? ' on' : ''}"><span class="tile-e">${t ? (tileReady(t) ? C.emoji : '🌱') : '·'}</span><span class="tile-n">${t ? esc(cap(C.name)) : 'Empty'}</span><span class="tile-s">${esc(tileState(t))}</span>${act}</div>`;
  }).join('');
  const seeds = plotPick !== null && !plot[plotPick] ? `<p class="label">Seeds for ${S.name.toLowerCase()}</p><div class="picker">${inSeason.map(([k, c]) => `<button class="btn" type="button" data-plot="plant" data-i="${plotPick}" data-crop="${k}" ${W.creator.coins < c.price ? 'disabled' : ''}>${c.emoji} ${esc(c.name)} · ${c.price} ✦ · ${c.days} days</button>`).join('')}</div>` : '';
  return `<p class="label">Your garden plot</p><p class="hint">${S.icon} It's ${S.name.toLowerCase()}, day ${seasonDay()} of 7. Water every day and your crops grow a day. Never miss a day and they come out extra nice. Homegrown gifts mean a lot to people.</p><div class="plot">${tiles}</div>${seeds}`;
}

