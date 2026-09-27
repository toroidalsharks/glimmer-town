// ============================================================
// ART STYLE: town moods (sky, light, water, menu colors), picked in Settings
// ============================================================
// each mood: sky day/dusk/night, sun, hemisphere light, rim light on the
// residents, water, a grass tint, the final color grade, and menu accents.
// 'storybook' keeps the exact v24 colors for anyone who liked them.
const MOODS = {
  glimmer: {
    name: 'Glimmer', blurb: 'Clear pastel days, pink sunsets and violet nights.',
    top: ['#5fb4ff', '#8a6ad0', '#120c36'], hor: ['#f1ecff', '#ffa9b8', '#28236a'], duskK: [0.5, 0.9],
    sun: ['#fff0d8', '#ffb48c', '#b4a8ff'], hemi: ['#dcecff', '#f4c8e0', '#7a70e0'], ground: ['#c3dc98', '#3e3470'],
    rim: ['#ffe8f6', '#ffb8c8', '#b0a8ff'], rimK: 0.06,
    water: ['#6ff5e0', '#3cc6f0', '#3a78e0'], waterBox: '#113a78', grass: ['#a6dc8c', 0.3],
    sat: 1.16, lift: [0.98, 0.97, 1.05], gain: [1.04, 1.0, 0.97],
    ui: { accent: '#c3b0ff', accent2: '#ff9fc8', glow: '120, 90, 220', bg: '#0e0b22', panel: '19, 15, 38' },
  },
  storybook: {
    name: 'Storybook', blurb: 'The look from before this update.',
    top: ['#4aa8ff', '#7a6ab8', '#0b1233'], hor: ['#dff3ff', '#ffb99a', '#1d2a5a'], duskK: [0.45, 0.85],
    sun: ['#fff3dc', '#ffa468', '#9fb4ff'], hemi: ['#cfe8ff', '#ffb0c8', '#6a78d8'], ground: ['#b9cf95', '#3a3668'],
    rim: ['#fff0f6', '#ffc0a0', '#9fb8ff'], rimK: 0,
    water: ['#5ff0e2', '#34bfe9', '#2c7ddb'], waterBox: '#0c3c6e', grass: null,
    sat: 1.12, lift: [0.97, 0.98, 1.04], gain: [1.03, 1.0, 0.96],
    ui: { accent: '#bba8ff', accent2: '#ff8fb6', glow: '110, 90, 200', bg: '#0d1330', panel: '17, 14, 28' },
  },
  candy: {
    name: 'Candy', blurb: 'Soft cotton-candy skies and minty water.',
    top: ['#8fc8ff', '#b08ae0', '#1a1440'], hor: ['#ffe6f4', '#ffb3d0', '#3a2a6a'], duskK: [0.5, 0.85],
    sun: ['#fff4ec', '#ffa6c0', '#c0b0ff'], hemi: ['#f0e6ff', '#ffc0e0', '#8a80e8'], ground: ['#d8e8b0', '#4a3a78'],
    rim: ['#ffe0f4', '#ffc0dc', '#c0b0ff'], rimK: 0.04,
    water: ['#8ff5e8', '#6fd0f5', '#6a9af0'], waterBox: '#2a4a8a', grass: ['#b8f0a0', 0.4],
    sat: 1.04, lift: [1.0, 0.98, 1.03], gain: [1.04, 1.0, 1.0],
    ui: { accent: '#ffb3d6', accent2: '#9fe3d4', glow: '230, 120, 180', bg: '#1a0f26', panel: '30, 18, 40' },
  },
  golden: {
    name: 'Golden hour', blurb: 'Warm honey light all day long.',
    top: ['#6aaef0', '#9a6ab0', '#0f1030'], hor: ['#ffe9c8', '#ffa070', '#2a2050'], duskK: [0.5, 0.95],
    sun: ['#ffe2b0', '#ff9050', '#a0b0ff'], hemi: ['#ffeed8', '#ffb890', '#6a70d0'], ground: ['#c8c890', '#3a3060'],
    rim: ['#fff0d0', '#ffb890', '#a0b0ff'], rimK: 0.04,
    water: ['#6fe8d0', '#3cb0d8', '#2a70c0'], waterBox: '#0c3a60', grass: ['#b8d870', 0.22],
    sat: 1.1, lift: [0.99, 0.97, 0.97], gain: [1.07, 1.01, 0.92],
    ui: { accent: '#ffcf7a', accent2: '#ff9a6a', glow: '230, 150, 70', bg: '#170f14', panel: '30, 20, 22' },
  },
  hologram: {
    name: 'Hologram', blurb: 'Bright cyan and magenta with strong glowing edges. Made for the box.',
    top: ['#3a8cff', '#6a3ad0', '#080a28'], hor: ['#c8f0ff', '#ff6ab0', '#1a1650'], duskK: [0.55, 0.9],
    sun: ['#f4f8ff', '#ff70a0', '#70a0ff'], hemi: ['#c8e8ff', '#ff90d0', '#5a60ff'], ground: ['#a8d0a0', '#2a2060'],
    rim: ['#a0f0ff', '#ff90e0', '#80a0ff'], rimK: 0.2,
    water: ['#40ffe8', '#20c0ff', '#2a5ae0'], waterBox: '#0a4a8a', grass: ['#80f0a0', 0.2],
    sat: 1.22, lift: [0.96, 0.97, 1.06], gain: [1.03, 1.0, 1.02],
    ui: { accent: '#7ff0ff', accent2: '#ff7ad8', glow: '60, 200, 255', bg: '#060a1e', panel: '10, 14, 34' },
  },
};
const moodOf = () => MOODS[cfg.mood] || MOODS.glimmer;
// the lawn color for this mood, before seasons change it
function moodGrass() {
  const M = moodOf(), c = new T3.Color(ISL.grass);
  if (M.grass) c.lerp(new T3.Color(M.grass[0]), M.grass[1]);
  return c;
}
// menus pick up the mood's accents on every device (the remote uses its own pref)
function moodMenus() {
  const U = moodOf().ui, R = document.documentElement.style;
  R.setProperty('--lilac', U.accent); R.setProperty('--accent', U.accent); R.setProperty('--accent2', U.accent2);
  R.setProperty('--glow', U.glow); R.setProperty('--bg', U.bg); R.setProperty('--panel', U.panel);
  document.body.dataset.mood = cfg.mood && MOODS[cfg.mood] ? cfg.mood : 'glimmer';
}
function setMood(k) {
  if (!MOODS[k]) return;
  cfg.mood = k; savePrefs(); moodMenus();
  if (MODE !== 'host') return;
  if (typeof applySeason === 'function' && typeof scene !== 'undefined' && scene) applySeason(true);
}
function moodSettingsHtml() {
  const cur = MOODS[cfg.mood] ? cfg.mood : 'glimmer';
  return `<p class="label">Town mood</p><div class="moods" role="group" aria-label="Town mood">${Object.entries(MOODS).map(([k, M]) => `<button class="mood" type="button" data-mood="${k}" aria-pressed="${cur === k}"><i style="background:linear-gradient(160deg, ${M.top[0]}, ${M.hor[0]} 55%, ${M.water[0]} 56%, ${M.water[2]})"></i><b>${esc(M.name)}</b><span>${esc(M.blurb)}</span></button>`).join('')}</div>`;
}
function wireMoodSettings() {
  const box = $('#moodBox'); if (!box) return;
  box.innerHTML = moodSettingsHtml();
  box.querySelectorAll('[data-mood]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.mood;
    if (MODE === 'remote') send({ t: 'set', key: 'mood', value: k });
    setMood(k); wireMoodSettings();
  }));
}
function moodBoot() {
  W.added = W.added || {};
  if (W.added.moods1) return; W.added.moods1 = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'The town has a fresh coat of paint. Days are a clearer pastel, sunsets go pink and nights turn violet, and the menus got a new look to match. Settings has a Town mood picker now: Glimmer (the new look), Storybook (the old one), Candy, Golden hour, and Hologram, which is extra bright with glowing edges for the box. The Look studio has new styles, haircuts and accessories too.', 'town moods and a fresh look');
}
