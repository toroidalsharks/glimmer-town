// ============================================================
// FASHION & FACES: every resident gets a personality ("vibe"), a
// clothing style that fits it (goth, emo, jirai kei, gyaru, lolita,
// preppy, mom, dad, ...), a face that matches, and a uniform for work
// ============================================================

// ---- personality: five sliders, -1..1, stable per resident ----
function seededRand(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function personaOf(p) {
  if (!p.body) return { energy: 0, warmth: 0, edge: 0, order: 0, cute: 0, age: 0.3 };
  if (!p.body.persona) {
    const r = seededRand(hashStr('persona:' + p.id + ':' + (p.name || ''))), s = () => r() * 2 - 1;
    const q = { energy: s(), warmth: s(), edge: s(), order: s(), cute: s(), age: r() };
    q.energy = clamp(q.energy + ((p.body.speed ?? 1) - 1) * 1.2, -1, 1);
    q.edge = clamp(q.edge + (p.body.openness ?? 0) * 0.35, -1, 1);
    // the people Milo wrote herself get a vibe that matches how she described them
    if (p.lovesMili) Object.assign(q, { energy: -0.35, warmth: 0.2, edge: 0.25, order: -0.2, cute: -0.3, age: 0.3 });
    for (const k of Object.keys(q)) q[k] = +q[k].toFixed(2);
    p.body.persona = q;
  }
  return p.body.persona;
}
function vibeWords(p) {
  const P = personaOf(p), w = [];
  if (P.energy > 0.35) w.push('bubbly'); else if (P.energy < -0.35) w.push('calm');
  if (P.warmth > 0.35) w.push('warm'); else if (P.warmth < -0.35) w.push('a bit cold');
  if (P.edge > 0.4) w.push('rebellious'); else if (P.edge < -0.4) w.push('gentle');
  if (P.order > 0.45) w.push('tidy'); else if (P.order < -0.45) w.push('messy');
  if (P.cute > 0.5) w.push('loves cute things');
  return w.length ? w : ['easygoing'];
}

// ---- clothing styles ----
const FASHION = {
  casual:  { name: 'Casual', family: 'everyday', tops: null, bottoms: [['pants', ['#5b7fb5', '#4a6fa8', '#4a4652']], ['shorts', ['#5b7fb5', '#cdb88f']]], shoes: ['#fffaf2', '#ff6f5e', '#3d4f86'] },
  preppy:  { name: 'Preppy', family: 'neat', tops: ['white', 'cream', 'sky'], layers: [['vest', ['navy', 'forest', 'wine']], ['cardigan', ['navy', 'cream', 'forest']]], bottoms: [['pleated', ['#3d4f86', '#2f5d4a', '#7a2e3a']], ['pants', ['#cdb88f', '#3d4f86']]], shoes: ['#5a3a2e', '#2e2a36'], neck: ['collar', 'tie'], glasses: 0.3, head: [['beret', ['#3d4f86', '#7a2e3a'], 0.3]] },
  emo:     { name: 'Emo', family: 'dark', tops: ['black', 'charcoal'], stripes: ['#ff3355', '#fbf8f4'], bottoms: [['pants', ['#2e2a36']]], shoes: ['#2e2a36', '#fffaf2'], extras: ['belt', 'wristbands'], liner: true },
  goth:    { name: 'Goth', family: 'dark', tops: ['black', 'plum'], bottoms: [['long', ['#2e2a36']], ['pants', ['#2e2a36']]], tights: '#2e2a36', shoes: ['#2e2a36'], platform: true, neck: ['choker'], extras: ['pendant'], liner: true, lips: '#4a1a3a' },
  alt:     { name: 'Alt / punk', family: 'dark', tops: ['black', 'charcoal', 'wine'], bottoms: [['pleated', ['#b8323f']], ['pants', ['#b8323f', '#2e2a36']]], tights: '#2e2a36', shoes: ['#2e2a36'], platform: true, neck: ['choker'], extras: ['chain', 'belt'], liner: true },
  jirai:   { name: 'Jirai kei', family: 'kawaii', tops: ['black', 'white', 'rose'], bottoms: [['pleated', ['#2e2a36', '#ff9fbf']]], tights: '#2e2a36', shoes: ['#2e2a36', '#ff9fbf'], platform: true, neck: ['collar', 'bow'], bowColor: ['#2e2a36', '#ff5f9a'], head: [['sidebow', ['#2e2a36', '#ff9fbf'], 1]], lashes: true, underEye: true, liner: true },
  gyaru:   { name: 'Gyaru', family: 'kawaii', tops: ['hotpink', 'white', 'lemon', 'peach'], bottoms: [['skirt', ['#fbf8f4', '#ff5fa8', '#d9a55a']], ['pants', ['#5b7fb5']]], tights: null, shoes: ['#fffaf2', '#ff9fbf'], platform: true, extras: ['hoops'], lashes: true, liner: true, lips: '#ff5f8f' },
  lolita:  { name: 'Lolita', family: 'kawaii', tops: ['rose', 'sky', 'white', 'black'], dress: true, bottoms: [['bell', null]], tights: '#fbf8f4', shoes: ['#2e2a36', '#fffaf2', '#ff9fbf'], platform: true, neck: ['bow'], head: [['headbow', null, 1]], lashes: true },
  cottage: { name: 'Cottagecore', family: 'soft', tops: ['cream', 'peach', 'moss', 'lemon'], dress: true, bottoms: [['long', null]], layers: [['cardigan', ['cream', 'moss', 'peach'], 0.4]], shoes: ['#5a3a2e', '#fffaf2'], head: [['straw', null, 0.35]], freckles: 0.45 },
  sporty:  { name: 'Sporty', family: 'everyday', tops: ['tomato', 'sky', 'white', 'navy'], layers: [['track', ['navy', 'tomato', 'charcoal'], 0.6]], bottoms: [['pants', ['#2e2a36', '#3d4f86']], ['shorts', ['#2e2a36', '#3d4f86']]], shoes: ['#fffaf2', '#ff6f5e'], head: [['cap', ['#3d4f86', '#ff6f5e'], 0.3]] },
  y2k:     { name: 'Y2K (dresses young)', family: 'kawaii', tops: ['hotpink', 'lilac', 'sky', 'lemon'], bottoms: [['pants', ['#5b7fb5', '#9fd3ff']], ['skirt', ['#c9b3ff', '#fbf8f4']]], shoes: ['#fffaf2', '#ff9fbf'], platform: true, head: [['clips', null, 0.8]], freckles: 0.3 },
  street:  { name: 'Streetwear', family: 'everyday', tops: ['charcoal', 'moss', 'black', 'tomato'], layers: [['hoodie', ['charcoal', 'moss', 'black', 'dusk'], 0.7]], bottoms: [['pants', ['#cdb88f', '#2e2a36', '#4a4652']]], shoes: ['#fffaf2', '#2e2a36'], extras: ['chain'], head: [['cap', ['#2e2a36', '#8fae6a'], 0.35]] },
  classic: { name: 'Classic (dresses older)', family: 'neat', tops: ['cream', 'white', 'dusk'], layers: [['cardigan', ['khaki', 'gray', 'wine']], ['vest', ['khaki', 'gray']]], bottoms: [['pants', ['#8a8a96', '#a8916b']], ['long', ['#6b5a4a', '#3d4f86']]], shoes: ['#5a3a2e', '#2e2a36'], glasses: 0.6, head: [['flatcap', ['#8a8a96', '#6b5a4a'], 0.35]] },
  mom:     { name: 'Mom style', family: 'soft', tops: ['peach', 'mint', 'sky', 'rose', 'white'], layers: [['cardigan', ['cream', 'khaki', 'lilac'], 0.6]], bottoms: [['pants', ['#5b7fb5', '#4a6fa8']]], shoes: ['#fffaf2'], extras: ['tote'], glasses: 0.2 },
  dad:     { name: 'Dad style', family: 'everyday', tops: ['white', 'navy', 'sky', 'moss'], bottoms: [['shorts', ['#cdb88f']], ['pants', ['#cdb88f', '#5b7fb5']]], shoes: ['#fffaf2'], extras: ['belt'], glasses: 0.4, head: [['cap', ['#3d4f86', '#8fae6a', '#ff6f5e'], 0.55]] },
  comfy:   { name: 'Comfy', family: 'everyday', tops: ['gray', 'lilac', 'cream', 'sky'], layers: [['hoodie', ['gray', 'lilac', 'cream', 'sky', 'mint']], ['puffer', ['gray', 'navy', 'lilac'], 0.35]], bottoms: [['pants', ['#a3a3ad', '#4a4652', '#c9b3ff']]], shoes: ['#fffaf2', '#a3a3ad'], extras: ['neckphones'], head: [['beanie', ['#a3a3ad', '#c9b3ff', '#fff4dc'], 0.35]] },
  business:{ name: 'Business', family: 'neat', tops: ['white', 'sky', 'cream'], layers: [['blazer', ['navy', 'charcoal', 'black']]], bottoms: [['pants', ['#3d4f86', '#4a4652', '#2e2a36']], ['pleated', ['#3d4f86', '#2e2a36']]], shoes: ['#2e2a36', '#5a3a2e'], neck: ['tie'], tie: ['#7a2e3a', '#3d4f86', '#2f5d4a'], extras: ['briefcase'], glasses: 0.3 },
  academia:{ name: 'Dark academia', family: 'neat', tops: ['cream', 'white'], layers: [['blazer', ['#6b4a3a', '#4a3a30', 'forest']], ['vest', ['#6b4a3a', 'khaki', 'forest']]], bottoms: [['plaid', ['#6b4a3a', '#3a3040']], ['pants', ['#6b4a3a', '#3a3040']]], shoes: ['#3a2a22', '#2e2a36'], neck: ['collar', 'tie'], tie: ['#3a3040', '#7a2e3a'], extras: ['satchel'], glasses: 0.5 },
  coquette:{ name: 'Coquette', family: 'soft', tops: ['rose', 'white', 'cream'], layers: [['corset', ['#ff9fbf', '#fbf8f4'], 0.45], ['cardigan', ['rose', 'cream'], 0.5]], bottoms: [['skirt', ['#ff9fbf', '#fbf8f4']], ['pleated', ['#ff9fbf', '#fbf8f4']]], tights: '#fbf8f4', shoes: ['#fbf8f4', '#ff9fbf'], neck: ['bow'], bowColor: ['#ff5f9a', '#fbf8f4'], head: [['hairbow', ['#ff9fbf', '#fbf8f4', '#ff5f9a'], 0.9]], extras: ['heartbag'], lashes: true, lips: '#ff7fa0' },
  boho:    { name: 'Boho', family: 'soft', tops: ['cream', 'peach', 'khaki', 'moss'], dress: true, bottoms: [['long', null]], shoes: ['#8a5a3a', '#cdb88f'], extras: ['bangles', 'tote'], head: [['flowers', null, 0.55]], freckles: 0.35 },
  fairy:   { name: 'Fairy kei', family: 'kawaii', tops: ['lilac', 'sky', 'mint', 'rose'], bottoms: [['tutu', ['#c9b3ff', '#9fd3ff', '#ff9fbf']], ['skirt', ['#c9b3ff', '#9fe3c4']]], tights: '#fbf8f4', shoes: ['#fffaf2', '#c9b3ff', '#9fd3ff'], platform: true, extras: ['backpack', 'legwarmers'], pack: ['#9fd3ff', '#ff9fbf', '#c9b3ff'], print: ['star', 'heart'], head: [['starclips', null, 0.8]], lashes: true, freckles: 0.3 },
  kidcore: { name: 'Kidcore', family: 'kawaii', tops: ['tomato', 'lemon', 'sky', 'mint'], print: ['rainbow', 'heart', 'star'], layers: [['overalls', ['#5b7fb5', '#ff9fbf', '#ffe98a'], 0.6]], bottoms: [['shorts', ['#5b7fb5', '#ff6f5e']], ['pants', ['#5b7fb5']]], shoes: ['#ff6f5e', '#ffe98a', '#9fd3ff'], extras: ['backpack'], pack: ['#ff6f5e', '#ffe98a', '#6fbf6a'], head: [['clips', null, 0.7]], freckles: 0.35 },
  neko:    { name: 'Neko (cat ears)', family: 'kawaii', tops: ['gray', 'white', 'black', 'rose'], layers: [['hoodie', ['gray', 'black', 'white', 'rose'], 0.6]], bottoms: [['pleated', ['#2e2a36', '#a3a3ad', '#ff9fbf']], ['shorts', ['#2e2a36']]], tights: '#2e2a36', shoes: ['#2e2a36', '#fffaf2'], neck: ['bell'], extras: ['tail'], head: [['catears', null, 1]], lashes: true, mouth: 'cat' },
  egirl:   { name: 'E-girl / e-boy', family: 'dark', tops: ['black', 'hotpink', 'white'], stripes: ['#fbf8f4', '#ff5fa8', '#2e2a36'], bottoms: [['plaid', ['#2e2a36', '#ff5fa8']], ['pants', ['#2e2a36']]], tights: '#2e2a36', shoes: ['#2e2a36'], platform: true, neck: ['choker'], extras: ['chain'], head: [['clips', null, 0.5]], liner: true, marks: ['heart'], blushK: 0.95 },
  grunge:  { name: 'Grunge', family: 'dark', tops: ['charcoal', 'black', 'moss'], layers: [['flannel', ['wine', 'forest', '#4a4652'], 0.85]], bottoms: [['ripped', ['#4a6fa8', '#2e2a36']]], shoes: ['#2e2a36', '#3a2a22'], extras: ['chain'], head: [['beanie', ['#2e2a36', '#7a2e3a', '#4a4652'], 0.5]] },
  witchy:  { name: 'Witchy', family: 'dark', tops: ['black', 'plum', 'forest'], dress: true, bottoms: [['long', null]], layers: [['cape', ['black', 'plum', 'wine'], 0.6]], shoes: ['#2e2a36'], neck: ['choker'], extras: ['pendant'], head: [['witch', ['#2e2a36', '#5e3a6e'], 0.55]], liner: true, lips: '#5e3a6e' },
  techwear:{ name: 'Techwear', family: 'dark', tops: ['black', 'charcoal'], layers: [['shell', ['black', 'charcoal', '#3a4a5a']]], bottoms: [['cargo', ['#2e2a36', '#3a3a44']]], shoes: ['#2e2a36'], extras: ['harness', 'backpack'], pack: ['#2e2a36'], head: [['cap', ['#2e2a36'], 0.3]] },
};
const KID_FASHION = ['casual', 'sporty', 'y2k', 'cottage', 'preppy', 'comfy', 'fairy', 'kidcore', 'neko'];
const FASHION_ORDER = ['casual', 'comfy', 'sporty', 'street', 'dad', 'preppy', 'business', 'academia', 'classic', 'cottage', 'coquette', 'boho', 'mom', 'jirai', 'gyaru', 'lolita', 'fairy', 'kidcore', 'neko', 'y2k', 'emo', 'goth', 'alt', 'egirl', 'grunge', 'witchy', 'techwear'];
const FASHION_FAMILIES = { everyday: 'Everyday', neat: 'Neat', soft: 'Soft', kawaii: 'Kawaii', dark: 'Dark' };
const isParent = (p) => W.people.some((q) => q !== p && (q.parents || []).includes(p.name));
function fashionWeights(p) {
  const P = personaOf(p), par = isParent(p);
  const w = {
    casual: 1.1, preppy: 0.45 + P.order * 0.8 - P.edge * 0.5, sporty: 0.35 + P.energy * 0.8 - P.cute * 0.3, street: 0.3 + P.edge * 0.4 + P.energy * 0.3,
    emo: 0.2 + P.edge * 0.9 - P.energy * 0.5 - P.warmth * 0.3 - P.age * 0.6, goth: 0.2 + P.edge * 0.9 - P.cute * 0.4 - P.energy * 0.3, alt: 0.2 + P.edge * 0.8 + P.energy * 0.5 - P.order * 0.3,
    jirai: 0.1 + P.cute * 0.7 + P.edge * 0.5 - P.age * 0.8, gyaru: 0.1 + P.energy * 0.8 + P.cute * 0.5 + P.warmth * 0.3 - P.age * 0.8, lolita: 0.1 + P.cute * 0.8 + P.order * 0.5 - P.energy * 0.3,
    cottage: 0.3 + P.warmth * 0.6 + P.cute * 0.3 - P.edge * 0.5, y2k: 0.2 + P.energy * 0.6 - P.age * 0.9, classic: 0.1 + P.age * 1.4 + P.order * 0.3,
    mom: par ? 0.9 + P.warmth * 0.5 + P.age * 0.5 : 0.04 + P.age * 0.25, dad: par ? 0.9 - P.energy * 0.2 + P.age * 0.5 : 0.04 + P.age * 0.25,
    comfy: 0.3 - P.energy * 0.6 + P.warmth * 0.2, business: 0.08 + P.order * 0.8 + P.age * 0.5 - P.edge * 0.4, academia: 0.1 + P.order * 0.5 - P.energy * 0.4 + P.edge * 0.25,
    coquette: 0.08 + P.cute * 0.7 + P.warmth * 0.3 - P.edge * 0.4, boho: 0.12 + P.warmth * 0.4 - P.order * 0.4 + P.age * 0.2,
    fairy: 0.08 + P.cute * 0.8 + P.energy * 0.3 - P.edge * 0.4 - P.age * 0.5, kidcore: 0.08 + P.energy * 0.6 + P.cute * 0.5 - P.age * 0.9, neko: 0.1 + P.cute * 0.6 + P.edge * 0.25 - P.warmth * 0.15,
    egirl: 0.08 + P.edge * 0.6 + P.cute * 0.4 - P.age * 0.9, grunge: 0.1 + P.edge * 0.7 - P.order * 0.6, witchy: 0.1 + P.edge * 0.6 - P.energy * 0.3 + P.age * 0.2 - P.cute * 0.2,
    techwear: 0.08 + P.edge * 0.5 + P.order * 0.5 - P.warmth * 0.4 - P.cute * 0.4,
  };
  if (p.grow < 1) for (const k of Object.keys(w)) if (!KID_FASHION.includes(k)) w[k] = 0;
  for (const k of Object.keys(w)) w[k] = Math.max(k === 'casual' ? 0.3 : 0, w[k]);
  return w;
}
function pickFashion(p, r = rand) {
  const w = fashionWeights(p), tot = Object.values(w).reduce((a, b) => a + b, 0);
  let x = r() * tot;
  for (const [k, v] of Object.entries(w)) { x -= v; if (x <= 0) return k; }
  return 'casual';
}
// choose the concrete pieces for a style (stable per resident, so they don't reshuffle every day)
function dressFor(p, fashion) {
  const F = FASHION[fashion] || FASHION.casual, r = seededRand(hashStr('dress:' + fashion + ':' + p.id));
  const pk = (arr) => arr[Math.floor(r() * arr.length) % arr.length];
  const d = { fashion };
  if (F.tops) d.top = pk(F.tops);
  const bt = pk(F.bottoms); d.bottom = bt[0]; d.bottomColor = bt[1] ? pk(bt[1]) : null;
  if (F.layers) { const opts = F.layers.filter((l) => l[2] == null || r() < l[2]); if (opts.length) { const l = pk(opts); d.layer = l[0]; d.layerColor = pk(l[1]); } }
  d.shoe = pk(F.shoes); d.platform = !!F.platform && r() < 0.8;
  d.tights = F.tights === undefined ? (['skirt', 'pleated', 'long', 'bell'].includes(d.bottom) ? pk(['skin', '#2e2a36', '#fbf8f4']) : null) : F.tights;
  d.neck = (F.neck || []).filter(() => r() < 0.85); d.extras = (F.extras || []).filter(() => r() < 0.8);
  if (F.stripes && r() < 0.7) d.stripes = pk(F.stripes);
  d.bowColor = F.bowColor ? pk(F.bowColor) : null;
  d.head = null; for (const [k, cols, ch] of F.head || []) if (r() < ch) { d.head = k; d.headColor = cols ? pk(cols) : null; }
  d.glasses = r() < (F.glasses || 0) + Math.max(0, personaOf(p).order - 0.6) * 0.5;
  d.tieColor = F.tie ? pk(F.tie) : null;
  d.pack = F.pack ? pk(F.pack) : null;
  d.print = F.print && r() < 0.75 ? pk(F.print) : null;
  return d;
}
function lookOf(p) {
  if (!p.look || !FASHION[p.look.fashion]) setFashion(p, isRealish(p) ? 'casual' : pickFashion(p, seededRand(hashStr('fashion:' + p.id + ':' + (p.name || '')))), true);
  return p.look;
}
function setFashion(p, fashion, quiet) {
  if (!FASHION[fashion]) return;
  const d = dressFor(p, fashion); p.look = { ...d, face: faceFor(p, fashion), rev: (p.look?.rev || 0) + 1 };
  // the style's colors go into their wardrobe and taste, so morning outfits stay in style
  if (d.top && COLORS[d.top]) {
    if (!p.wardrobe.shirts.includes(d.top)) p.wardrobe.shirts.push(d.top);
    p.outfit.shirt = d.top;
    for (const c of FASHION[fashion].tops) p.likes[c] = Math.max(p.likes[c] || 0, 0.6);
  }
  const h = typeof hairOf === 'function' ? hairOf(p) : null; if (h && SHOE_NAMES[d.shoe]) h.shoe = d.shoe;
  p.likes['style:' + fashion] = Math.max(p.likes['style:' + fashion] || 0, 1);
  if (!quiet && typeof restyleLook === 'function') restyleLook(p);
}
// ---- faces that fit the vibe ----
function faceFor(p, fashion) {
  const P = personaOf(p), F = FASHION[fashion] || {}, r = seededRand(hashStr('face:' + p.id)), real = isRealish(p);
  const eyes = P.cute > 0.6 && P.energy > 0.3 ? 'starry' : P.edge > 0.35 && P.cute > 0.2 ? 'cat' : P.edge > 0.35 && P.warmth < 0.1 ? 'sharp' : P.energy < -0.45 ? 'sleepy'
    : P.cute > 0.35 && P.energy > -0.1 ? 'sparkle' : P.warmth > 0.45 && P.energy < 0 ? 'droopy' : P.order > 0.45 && P.energy < 0 ? 'dot' : P.energy > 0.55 ? 'wide' : r() < 0.15 ? 'tiny' : 'round';
  const mouth = F.mouth || (P.cute > 0.5 && P.energy > 0.25 ? 'cat' : P.edge > 0.3 && P.cute > 0.2 && r() < 0.5 ? 'fang' : P.edge > 0.35 && P.energy > 0 ? 'smirk'
    : P.energy > 0.5 && P.warmth > 0.2 ? 'grin' : P.warmth < -0.3 && P.energy < 0.2 ? 'flat' : P.energy < -0.3 && P.cute > 0 ? 'small' : 'smile');
  const pkR = (a) => a[Math.floor(r() * a.length) % a.length];
  const tint = r() < 0.3 && !real ? pkR(F.family === 'dark' ? ['violet', 'red', 'gold'] : F.family === 'kawaii' ? ['pink', 'violet', 'blue'] : ['brown', 'blue', 'green', 'gold']) : 'dark';
  const marks = [...(F.marks || [])]; if (!real && r() < 0.1) marks.push('mole');
  const base = {
    eyes, mouth, eyeColor: tint, brow: P.warmth < -0.4 ? 0.14 : P.energy < -0.4 && P.warmth > 0 ? -0.14 : 0, browThick: P.edge > 0.4 ? 1.4 : P.cute > 0.4 ? 0.8 : 1,
    lashes: !!F.lashes || (P.cute > 0.45 && r() < 0.6), liner: !!F.liner && p.grow >= 1, underEye: !!F.underEye && p.grow >= 1, lips: p.grow >= 1 ? F.lips || null : null,
    freckles: r() < (F.freckles || 0.12), blush: F.blushK || (P.warmth > 0.3 ? 0.75 : P.warmth < -0.3 ? 0.3 : 0.55), marks,
  };
  // anything the Creator picked by hand stays, whatever style they wear next
  return { ...base, ...(p.body?.faceMods || {}) };
}

// ---- work uniforms ----
const UNIFORMS = {
  mart: { layer: ['apron', '#6fbf6a'], head: ['visor', '#6fbf6a'], neck: ['badge'], label: 'Berry Mart apron and visor' },
  cafe: { layer: ['apron', '#6b4a3a'], head: ['cap', '#2e2a36'], label: 'barista apron and cap' },
  clothes: { neck: ['tape'], label: 'measuring tape' },
  nook: { layer: ['apron', '#8a5a3a'], head: ['goggles'], label: 'leather apron and goggles' },
  garden: { layer: ['overalls', '#5b7fb5'], head: ['straw'], label: 'overalls and a straw hat' },
  pier: { layer: ['raincoat', '#ffd23f'], head: ['bucket', '#ffd23f'], label: 'yellow raincoat and bucket hat' },
  bakery: { layer: ['chefcoat', '#fbf8f4'], head: ['chef'], label: "white baker's coat and tall hat" },
  icecream: { layer: ['apron', '#ff9fbf', true], head: ['paper'], label: 'striped apron and paper hat' },
  books: { layer: ['cardigan', '#8a6a4e'], neck: ['lanyard'], glasses: true, label: 'cardigan and name badge' },
  arcade: { layer: ['vest', '#7a4ad8'], head: ['visor', '#7a4ad8'], neck: ['badge'], label: 'Pixel Palace vest and visor' },
  dev: { layer: ['hoodie', '#3d4f86'], neck: ['lanyard'], label: 'Glimmer Labs hoodie and lanyard' },
  ai: { layer: ['cardigan', '#5a7fd8'], neck: ['lanyard'], label: 'Glimmer Labs cardigan and lanyard' },
  lawyer: { layer: ['blazer', '#2e2a36'], neck: ['tie'], tie: '#7a2e3a', label: 'dark suit and tie' },
  bio: { layer: ['labcoat', '#fbf8f4'], neck: ['lanyard'], label: 'lab coat' },
  chem: { layer: ['labcoat', '#fbf8f4'], head: ['goggles'], label: 'lab coat and safety goggles' },
  phys: { layer: ['labcoat', '#fbf8f4'], neck: ['lanyard'], label: 'lab coat' },
  robo: { layer: ['coverall', '#d9783a'], head: ['goggles'], label: 'orange coveralls and goggles' },
  civil: { layer: ['hivis', '#d8ff4a'], head: ['hardhat'], label: 'hi-vis vest and hard hat' },
  doctor: { layer: ['labcoat', '#fbf8f4'], neck: ['stetho'], label: "doctor's white coat and stethoscope" },
  therapist: { layer: ['cardigan', '#c9b3ff'], neck: ['lanyard'], label: 'soft cardigan' },
  builder: { layer: ['hivis', '#d8ff4a'], head: ['hardhat'], label: 'hi-vis vest and hard hat' },
  janitor: { layer: ['coverall', '#6f86a0'], head: ['cap', '#6f86a0'], label: 'blue coveralls and cap' },
};
const inUniform = (p) => !!(p.job && UNIFORMS[p.job] && p.grow >= 1 && p.task?.kind === 'work');
// what the law puts people in: an orange jumpsuit in the cell, an orange vest for community service
const LAW_OUTFITS = { jumpsuit: { layer: ['coverall', '#ff8a3d'], label: 'orange jumpsuit' }, service: { layer: ['hivis', '#ff8a3d'], head: ['cap', '#ff8a3d'], label: 'orange community service vest' } };
const lawOutfit = (p) => (typeof jailed === 'function' && jailed(p) ? 'jumpsuit' : typeof onService === 'function' && onService(p) && p.task?.kind === 'service' ? 'service' : null);
const workOutfit = (p) => (lawOutfit(p) ? LAW_OUTFITS[lawOutfit(p)] : inUniform(p) ? UNIFORMS[p.job] : null);

// ---- words, for the minds and the panels ----
const BOTTOM_WORDS = { pants: 'pants', shorts: 'shorts', skirt: 'a mini skirt', pleated: 'a pleated skirt', long: 'a long skirt', bell: 'a frilly bell skirt', cargo: 'cargo pants', ripped: 'ripped jeans', tutu: 'a puffy tutu skirt', plaid: 'a plaid skirt' };
const LAYER_WORDS = { vest: 'a sweater vest', cardigan: 'a cardigan', track: 'a track jacket', hoodie: 'a hoodie', blazer: 'a blazer', flannel: 'an open flannel shirt', puffer: 'a puffy jacket', shell: 'a black tech jacket', corset: 'a laced corset top', cape: 'a long cape', overalls: 'overalls' };
const HEAD_WORDS = { beret: 'a beret', cap: 'a cap', flatcap: 'a flat cap', straw: 'a straw hat', bucket: 'a bucket hat', beanie: 'a beanie', witch: 'a pointy witch hat', catears: 'cat ears', flowers: 'a flower crown', headbow: 'a big lace bow', hairbow: 'a ribbon bow in their hair', sidebow: 'a bow clip', clips: 'hair clips', starclips: 'star clips', headphones: 'headphones' };
const EXTRA_WORDS = { tail: 'a cat tail', backpack: 'a backpack', satchel: 'a leather satchel', heartbag: 'a heart-shaped purse', briefcase: 'a briefcase', bangles: 'bangles', harness: 'a strap harness', legwarmers: 'leg warmers', neckphones: 'headphones around their neck', hoops: 'hoop earrings' };
function lookText(p) {
  const L = lookOf(p), F = FASHION[L.fashion];
  const law = lawOutfit(p); if (law) return `an ${LAW_OUTFITS[law].label}${typeof onProbation === 'function' && onProbation(p) ? ' and an ankle monitor' : ''}`;
  if (inUniform(p)) return `their ${JOBS[p.job].short} uniform (${UNIFORMS[p.job].label})${typeof onProbation === 'function' && onProbation(p) ? ' and an ankle monitor' : ''}`;
  const bits = [`${a_an(p.outfit.shirt)} ${F.dress ? 'dress' : 'top'}${L.print === 'heart' ? ' with a heart on it' : L.print === 'star' ? ' with a star on it' : L.print === 'rainbow' ? ' with rainbow stripes' : L.stripes ? ' with stripes' : ''}`];
  if (L.layer && LAYER_WORDS[L.layer]) bits.push(LAYER_WORDS[L.layer]);
  if (!(F.dress)) bits.push(BOTTOM_WORDS[L.bottom] || 'pants');
  if (L.platform) bits.push('platform shoes');
  if (L.head && HEAD_WORDS[L.head] && !p.outfit.hat) bits.push(HEAD_WORDS[L.head]);
  for (const e of L.extras || []) if (EXTRA_WORDS[e]) bits.push(EXTRA_WORDS[e]);
  if (L.glasses) bits.push(L.glasses === 'shades' ? 'sunglasses' : 'glasses');
  if (typeof onProbation === 'function' && onProbation(p)) bits.push('an ankle monitor');
  return `a ${F.name.replace(/ \(.*\)/, '').toLowerCase()} look: ${bits.join(', ')}`;
}
const visibleTop = (p) => { const L = p.look; return L && L.layer && COLORS[L.layerColor] && !workOutfit(p) ? L.layerColor : p.outfit?.shirt || 'cream'; };
function styleKin(a, b) {
  const x = a.look && FASHION[a.look.fashion], y = b.look && FASHION[b.look.fashion];
  if (!x || !y) return 0;
  return a.look.fashion === b.look.fashion ? 1 : x.family === y.family ? 0.5 : 0;
}
// what one resident says about another's clothes, if anything (offline minds)
function styleRemark(me, them, score) {
  if (!me.look || !them.look || them.grow < 1 && me.grow < 1) return null;
  if (inUniform(them)) return rand() < 0.4 ? { say: pick([`The ${JOBS[them.job].short} uniform suits you.`, 'Are you on your way to work?', 'You look so official right now.']), feeling: 1 } : null;
  const P = personaOf(me), kin = styleKin(me, them), F = FASHION[them.look.fashion], name = F.name.replace(/ \(.*\)/, '').toLowerCase();
  if (them.look.head === 'catears' && !them.outfit.hat && rand() < 0.35) return P.warmth > -0.2 ? { say: pick(['Are those cat ears? I love them.', 'Okay, the ears are adorable.', 'Do they twitch? They look like they should twitch.']), feeling: 1, compliment: true } : { say: pick(['Nice ears. Very normal.', 'Are you going to meow at me now?']), feeling: 0, action: 'tease' };
  if (kin === 1) return { say: pick([`Okay, your ${name} outfit today? Perfect.`, 'We match again. Great minds.', `Where did you get that? I need it.`]), feeling: 2, compliment: true };
  if (kin === 0.5 && score >= 0) return { say: pick(['Your outfit is really cute today.', 'I love how you dress.', 'That look is so you.']), feeling: 1, compliment: true };
  const old = FASHION[me.look.fashion].family === 'neat' || ['mom', 'dad', 'classic'].includes(me.look.fashion);
  if (old && F.family === 'dark' && rand() < 0.6) return P.warmth > 0 ? { say: pick(["Is that… a lot of black? It's very bold.", "I don't really get it, but you look confident."]), feeling: 0 } : { say: pick(["Who died?", 'Dressed for a funeral again?']), feeling: -1, action: 'tease' };
  if (F.family === 'kawaii' && FASHION[me.look.fashion].family === 'dark' && P.warmth < 0 && rand() < 0.5) return { say: pick(['That is so much pink.', 'Did a cake explode on you?']), feeling: -1, action: 'tease' };
  if (score >= 1 && P.warmth > 0.1) return { say: pick([`I like your ${name} style.`, 'Your shoes are amazing.', 'You always look put together.']), feeling: 1, compliment: true };
  return null;
}

// ---- building the clothes on a figure ----
function lookMat(color) { return vinyl(COLORS[color] || color, { kind: 'cloth' }); }
function lookSkin(p) { const B = p.body; return vinyl(`hsl(${Math.round(B.hue)}, ${B.sat ?? 70}%, ${B.light ?? 78}%)`); }
function dressLook(p, f) {
  if (!f || !f.fig || !f.body || !p.body) return f;
  f.lookParts = [];
  const add = (parent, o) => { o.traverse((c) => { c.userData.pid = p.id; }); parent.add(o); f.lookParts.push(o); return o; };
  const L = lookOf(p), F = FASHION[L.fashion] || FASHION.casual, U = workOutfit(p);
  const shirtC = COLORS[p.outfit.shirt] || '#fff4dc', skin = f.skin || lookSkin(p);
  // bottoms
  const bottom = U && ['overalls', 'coverall'].includes(U.layer?.[0]) ? 'pants' : L.bottom;
  const bColor = U && ['overalls', 'coverall'].includes(U.layer?.[0]) ? U.layer[1] : F.dress ? shirtC : L.bottomColor || '#4a4652';
  const tights = L.tights === 'skin' || !L.tights ? skin : lookMat(L.tights);
  const pantsLike = ['pants', 'cargo', 'ripped'].includes(bottom);
  const legMat = pantsLike ? lookMat(bColor) : bottom === 'shorts' ? skin : tights;
  f.legs.forEach((l) => (l.material = legMat));
  const bm = lookMat(bColor);
  if (bottom === 'cargo') f.legs.forEach((l, i) => add(l, mesh(box(0.07, 0.14, 0.15), bm, (i ? 1 : -1) * 0.12, 0.02, 0)));
  else if (bottom === 'ripped') f.legs.forEach((l, i) => { const rip = add(l, mesh(box(0.11, 0.045, 0.02), skin, 0, -0.02 + i * 0.05, 0.118, false)); rip.rotation.z = i ? 0.2 : -0.15; });
  else if (bottom === 'tutu') { add(f.fig, mesh(cyl(0.38, 0.6, 0.14, 18), bm, 0, 0.4, 0)); add(f.fig, mesh(cyl(0.42, 0.66, 0.12, 18), lookMat('#fbf8f4'), 0, 0.3, 0)); }
  else if (bottom === 'plaid') { add(f.fig, mesh(cyl(0.37, 0.52, 0.3, 12), bm, 0, 0.34, 0)); for (const [y, r, c] of [[0.27, 0.49, '#fbf8f4'], [0.39, 0.43, '#1e1a24']]) { const t = mesh(new T3.TorusGeometry(r, 0.014, 4, 18), toon(c), 0, y, 0, false); t.rotation.x = Math.PI / 2; add(f.fig, t); } }
  else if (bottom === 'shorts') for (const l of f.legs) add(l, mesh(cyl(0.145, 0.16, 0.2, 12), bm, 0, 0.1, 0));
  else if (bottom === 'skirt') add(f.fig, mesh(cyl(0.37, 0.5, 0.26, 20), bm, 0, 0.36, 0));
  else if (bottom === 'pleated') { const s = mesh(cyl(0.37, 0.52, 0.3, 12), bm, 0, 0.34, 0); add(f.fig, s); }
  else if (bottom === 'long') add(f.fig, mesh(cyl(0.37, 0.56, 0.46, 20), bm, 0, 0.24, 0));
  else if (bottom === 'bell') {
    add(f.fig, mesh(cyl(0.36, 0.6, 0.34, 22), bm, 0, 0.33, 0));
    const lace = mesh(new T3.TorusGeometry(0.59, 0.045, 6, 26), lookMat('#fbf8f4'), 0, 0.17, 0); lace.rotation.x = Math.PI / 2; add(f.fig, lace);
    add(f.fig, mesh(cyl(0.58, 0.62, 0.06, 22), lookMat('#fbf8f4'), 0, 0.13, 0));
  }
  // top layer
  const layer = U?.layer ? U.layer[0] : L.layer, lc = U?.layer ? U.layer[1] : L.layerColor;
  const lm = layer ? lookMat(lc) : null;
  const shell = (r = 0.405) => add(f.fig, mesh(new T3.CapsuleGeometry(r, 0.3, 6, 14), lm, 0, 0.78, 0));
  const frontStrip = (w, mat) => add(f.fig, mesh(box(w, 0.62, 0.04), mat, 0, 0.7, 0.4));
  let sleeves = null;
  switch (layer) {
    case 'vest': { shell(); const v = mesh(new T3.ConeGeometry(0.13, 0.3, 3), vinyl(shirtC, { kind: 'cloth' }), 0, 0.93, 0.4); v.rotation.z = Math.PI; v.scale.z = 0.3; add(f.fig, v); break; }
    case 'cardigan': case 'track': case 'blazer': {
      shell(); frontStrip(0.13, vinyl(shirtC, { kind: 'cloth' })); sleeves = lm;
      if (layer === 'cardigan') for (let i = 0; i < 3; i++) add(f.fig, mesh(sph(0.025, 6, 5), toon('#fbf8f4'), 0.085, 0.88 - i * 0.14, 0.415, false));
      if (layer === 'track') for (const a of f.arms) add(a, mesh(box(0.04, 0.42, 0.21), toon('#fbf8f4'), 0, -0.02, 0));
      if (layer === 'blazer') for (const s of [-1, 1]) { const lp = mesh(box(0.1, 0.3, 0.03), lm, s * 0.1, 0.9, 0.41); lp.rotation.z = s * 0.35; add(f.fig, lp); }
      break;
    }
    case 'hoodie': { shell(0.41); sleeves = lm; const hood = mesh(new T3.TorusGeometry(0.24, 0.1, 8, 16), lm, 0, 1.12, -0.2); hood.rotation.x = Math.PI / 2 - 0.5; add(f.fig, hood); add(f.fig, mesh(box(0.34, 0.14, 0.04), lm, 0, 0.55, 0.405)); for (const s of [-1, 1]) add(f.fig, mesh(cyl(0.012, 0.012, 0.16, 5), toon('#fbf8f4'), s * 0.06, 0.9, 0.41, false)); break; }
    case 'labcoat': case 'chefcoat': case 'raincoat': case 'coverall': {
      shell(0.41); sleeves = lm;
      if (layer !== 'coverall') add(f.fig, mesh(cyl(0.41, 0.47, layer === 'chefcoat' ? 0.2 : 0.36, 18), lm, 0, layer === 'chefcoat' ? 0.34 : 0.24, 0));
      if (layer === 'labcoat') frontStrip(0.09, vinyl(shirtC, { kind: 'cloth' }));
      if (layer === 'chefcoat') for (let i = 0; i < 3; i++) for (const s of [-1, 1]) add(f.fig, mesh(sph(0.025, 6, 5), toon('#c8c2b8'), s * 0.08, 0.9 - i * 0.14, 0.415, false));
      if (layer === 'labcoat' || layer === 'raincoat') add(f.fig, mesh(box(0.14, 0.08, 0.03), lm, 0.2, 0.62, 0.4));
      break;
    }
    case 'apron': {
      const ap = add(f.fig, mesh(box(0.5, 0.66, 0.035), lm, 0, 0.58, 0.395));
      if (U?.layer?.[2]) for (let i = 0; i < 3; i++) add(ap, mesh(box(0.5, 0.06, 0.04), toon('#fbf8f4'), 0, 0.22 - i * 0.2, 0.005, false));
      const st = mesh(new T3.TorusGeometry(0.17, 0.022, 5, 12, Math.PI), lm, 0, 0.9, 0.36); add(f.fig, st);
      break;
    }
    case 'overalls': { add(f.fig, mesh(box(0.42, 0.34, 0.035), lm, 0, 0.72, 0.39)); for (const s of [-1, 1]) add(f.fig, mesh(box(0.06, 0.34, 0.03), lm, s * 0.15, 0.98, 0.34)); add(f.fig, mesh(cyl(0.39, 0.39, 0.22, 18), lm, 0, 0.48, 0)); break; }
    case 'hivis': { shell(); for (const y of [0.62, 0.86]) { const b = mesh(new T3.TorusGeometry(0.41, 0.03, 5, 22), toon('#d9dde6'), 0, y, 0); b.rotation.x = Math.PI / 2; add(f.fig, b); } break; }
    case 'flannel': {
      shell(); frontStrip(0.13, vinyl(shirtC, { kind: 'cloth' })); sleeves = lm;
      const dk = toon(new T3.Color(COLORS[lc] || lc).multiplyScalar(0.5).getStyle()), lt = toon(new T3.Color(COLORS[lc] || lc).lerp(new T3.Color('#ffffff'), 0.35).getStyle());
      for (const [y, m] of [[0.56, dk], [0.72, lt], [0.88, dk]]) { const t = mesh(new T3.TorusGeometry(0.408, 0.014, 4, 22), m, 0, y, 0, false); t.rotation.x = Math.PI / 2; add(f.fig, t); }
      for (const a of f.arms) add(a, mesh(cyl(0.107, 0.107, 0.03, 10), dk, 0, 0, 0, false));
      break;
    }
    case 'puffer': { shell(0.45); sleeves = lm; const dk = toon(new T3.Color(COLORS[lc] || lc).multiplyScalar(0.8).getStyle()); for (const y of [0.56, 0.76, 0.96]) { const t = mesh(new T3.TorusGeometry(0.45, 0.022, 4, 22), dk, 0, y, 0, false); t.rotation.x = Math.PI / 2; add(f.fig, t); } add(f.fig, mesh(cyl(0.3, 0.33, 0.14, 16), lm, 0, 1.06, 0)); break; }
    case 'shell': { shell(0.415); sleeves = lm; add(f.fig, mesh(cyl(0.27, 0.3, 0.16, 16), lm, 0, 1.05, 0)); add(f.fig, mesh(box(0.025, 0.6, 0.02), toon('#9aa0ac'), 0, 0.72, 0.42, false)); break; }
    case 'corset': { add(f.fig, mesh(cyl(0.395, 0.39, 0.3, 18), lm, 0, 0.6, 0)); const lace = toon(lc === '#fbf8f4' ? '#ff9fbf' : '#fbf8f4'); for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const x = mesh(box(0.1, 0.018, 0.02), lace, 0, 0.5 + i * 0.09, 0.4, false); x.rotation.z = s * 0.5; add(f.fig, x); } break; }
    case 'cape': {
      const cm = cachedMat('cape:' + lc, () => makeToon({ color: COLORS[lc] || lc, gradientMap: gradMap, side: T3.DoubleSide }));
      add(f.fig, mesh(new T3.CylinderGeometry(0.42, 0.66, 0.78, 18, 1, true, Math.PI / 2, Math.PI), cm, 0, 0.6, -0.02));
      add(f.fig, mesh(new T3.TorusGeometry(0.27, 0.05, 6, 16), lm, 0, 1.0, 0)).rotation.x = Math.PI / 2;
      add(f.fig, mesh(sph(0.04, 8, 6), toon('#ffd36b'), 0, 0.98, 0.3, false));
      break;
    }
  }
  const armMat = sleeves || vinyl(shirtC, { kind: 'cloth' });
  f.arms.forEach((a) => (a.material = armMat)); f.body.material = vinyl(shirtC, { kind: 'cloth' });
  if (!U && L.stripes) for (const y of [0.52, 0.68, 0.84]) { const t = mesh(new T3.TorusGeometry(0.382, 0.03, 5, 24), lookMat(L.stripes), 0, y, 0); t.rotation.x = Math.PI / 2; add(f.fig, t); }
  // a print on the shirt, when nothing covers the chest
  if (!U && L.print && (!layer || layer === 'cape')) {
    if (L.print === 'rainbow') ['#ff6f5e', '#ffb347', '#ffe98a', '#6fbf6a', '#7fb3ff'].forEach((c, i) => { const t = mesh(new T3.TorusGeometry(0.383, 0.02, 4, 24), toon(c), 0, 0.88 - i * 0.045, 0, false); t.rotation.x = Math.PI / 2; add(f.fig, t); });
    else if (L.print === 'heart') add(f.fig, heartMesh(shirtC === COLORS.hotpink || shirtC === COLORS.rose ? '#fbf8f4' : '#ff5f8f', 0.8, 0, 0.8, 0.385));
    else if (L.print === 'star') { const st = starMesh('#ffd36b', 0.09); st.position.set(0, 0.8, 0.39); add(f.fig, st); }
  }
  // neck and chest
  const neck = U ? U.neck || [] : L.neck || [];
  for (const n of neck) {
    if (n === 'collar') for (const s of [-1, 1]) { const c = mesh(sph(0.09, 10, 6), toon('#fbf8f4'), s * 0.09, 1.0, 0.33, false); c.scale.set(1.3, 0.45, 0.5); c.rotation.z = s * -0.4; add(f.fig, c); }
    if (n === 'bow') { const bc = L.bowColor || (F.dress ? '#fbf8f4' : '#ff5f9a'); for (const s of [-1, 1]) { const w = mesh(new T3.ConeGeometry(0.06, 0.12, 8), toon(bc), s * 0.06, 0.96, 0.38, false); w.rotation.z = s * Math.PI / 2; add(f.fig, w); } add(f.fig, mesh(sph(0.03, 6, 5), toon(bc), 0, 0.96, 0.39, false)); }
    if (n === 'tie') { const tc = U?.tie || L.tieColor || '#7a2e3a'; add(f.fig, mesh(box(0.07, 0.3, 0.03), toon(tc), 0, 0.8, 0.405, false)); add(f.fig, mesh(sph(0.035, 6, 5), toon(tc), 0, 0.96, 0.39, false)); }
    if (n === 'choker') { const c = mesh(new T3.TorusGeometry(0.17, 0.025, 5, 14, Math.PI), toon('#1e1a24'), 0, 1.02, 0.3, false); c.rotation.z = Math.PI; c.rotation.x = 0.5; add(f.fig, c); add(f.fig, mesh(new T3.OctahedronGeometry(0.035, 0), toon('#d9dde6'), 0, 0.84, 0.39, false)); }
    if (n === 'badge') add(f.fig, mesh(box(0.1, 0.07, 0.02), toon('#fbf8f4'), 0.16, 0.9, 0.41, false));
    if (n === 'lanyard') { const ly = mesh(new T3.TorusGeometry(0.16, 0.012, 4, 12, Math.PI), toon('#5a7fd8'), 0, 0.92, 0.37, false); ly.rotation.z = Math.PI; add(f.fig, ly); add(f.fig, mesh(box(0.1, 0.13, 0.02), toon('#fbf8f4'), 0, 0.72, 0.41, false)); }
    if (n === 'stetho') { const st = mesh(new T3.TorusGeometry(0.17, 0.02, 5, 14, Math.PI), toon('#4a4652'), 0, 0.94, 0.37, false); st.rotation.z = Math.PI; add(f.fig, st); add(f.fig, mesh(cyl(0.045, 0.045, 0.02, 10), toon('#cfd3dc'), 0.12, 0.72, 0.41, false)).rotation.x = Math.PI / 2; }
    if (n === 'bell') { const c = mesh(new T3.TorusGeometry(0.2, 0.03, 5, 16, Math.PI), toon('#ff5f8f'), 0, 1.0, 0.24, false); c.rotation.z = Math.PI; c.rotation.x = 0.55; add(f.fig, c); add(f.fig, mesh(sph(0.045, 8, 6), toon('#ffd36b', { emissive: new T3.Color('#6a4a10') }), 0, 0.9, 0.4, false)); }
    if (n === 'tape') for (const s of [-1, 1]) add(f.fig, mesh(box(0.05, 0.4, 0.02), toon('#ffd23f'), s * 0.12, 0.8, 0.41, false));
  }
  const extras = U ? [] : L.extras || [];
  for (const e of extras) {
    if (e === 'belt') { const b = mesh(new T3.TorusGeometry(0.39, 0.035, 5, 24), toon('#2a2230'), 0, 0.46, 0); b.rotation.x = Math.PI / 2; add(f.fig, b); for (let i = -2; i <= 2; i++) add(f.fig, mesh(sph(0.02, 5, 4), toon('#d9dde6'), i * 0.09, 0.46, 0.41 - Math.abs(i) * 0.02, false)); }
    if (e === 'chain') { const c = mesh(new T3.TorusGeometry(0.12, 0.014, 4, 12, Math.PI), toon('#d9dde6'), 0.26, 0.38, 0.3, false); c.rotation.set(0.3, 0.6, Math.PI); add(f.fig, c); }
    if (e === 'pendant') add(f.fig, mesh(new T3.OctahedronGeometry(0.045, 0), toon('#d9dde6'), 0, 0.84, 0.4, false));
    if (e === 'wristbands') for (const a of f.arms) add(a, mesh(cyl(0.105, 0.105, 0.07, 10), toon('#ff3355'), 0, -0.14, 0, false));
    if (e === 'hoops') for (const s of [-1, 1]) { const h = mesh(new T3.TorusGeometry(0.07, 0.014, 5, 14), toon('#ffd36b'), s * 0.6, -0.2, 0.02, false); h.rotation.y = Math.PI / 2; add(f.head, h); }
    if (e === 'tote') add(f.arms[1], mesh(box(0.2, 0.22, 0.06), lookMat('#cdb88f'), 0.05, -0.3, 0.1));
    if (e === 'backpack') { const pm = lookMat(L.pack || '#9fd3ff'); add(f.fig, mesh(box(0.44, 0.46, 0.2), pm, 0, 0.78, -0.46)); add(f.fig, mesh(box(0.3, 0.16, 0.08), pm, 0, 0.66, -0.58)); for (const s of [-1, 1]) add(f.fig, mesh(box(0.05, 0.46, 0.03), pm, s * 0.17, 0.8, 0.39, false)); }
    if (e === 'satchel') { add(f.fig, mesh(box(0.26, 0.2, 0.08), lookMat('#6b4a3a'), 0.4, 0.4, 0.12)); const st = mesh(new T3.TorusGeometry(0.46, 0.016, 4, 24), toon('#4a3a30'), 0.02, 0.7, 0, false); st.rotation.set(Math.PI / 2, 0.75, 0); add(f.fig, st); }
    if (e === 'heartbag') { add(f.arms[1], heartMesh('#ff5f8f', 0.9, 0.02, -0.34, 0.12)); }
    if (e === 'briefcase') { add(f.arms[1], mesh(box(0.32, 0.24, 0.08), lookMat('#3a2a22'), 0.04, -0.4, 0.08)); add(f.arms[1], mesh(box(0.1, 0.03, 0.03), toon('#d9dde6'), 0.04, -0.26, 0.08, false)); }
    if (e === 'bangles') for (const a of f.arms) for (let i = 0; i < 2; i++) { const b = mesh(new T3.TorusGeometry(0.11, 0.016, 4, 12), toon(i ? '#ffd36b' : '#d9a55a'), 0, -0.1 - i * 0.05, 0, false); b.rotation.x = Math.PI / 2; add(a, b); }
    if (e === 'harness') { for (const s of [-1, 1]) { const st = mesh(box(0.045, 0.6, 0.03), toon('#1e1a24'), 0, 0.76, 0.41, false); st.rotation.z = s * 0.5; add(f.fig, st); } add(f.fig, mesh(box(0.1, 0.1, 0.04), toon('#9aa0ac'), 0, 0.76, 0.43, false)); }
    if (e === 'legwarmers') for (const l of f.legs) add(l, mesh(cyl(0.155, 0.17, 0.17, 12), lookMat(L.pack || '#ff9fbf'), 0, -0.08, 0));
    if (e === 'neckphones') { const ph = mesh(new T3.TorusGeometry(0.28, 0.035, 5, 16, Math.PI), toon('#2e2a36'), 0, 1.02, 0.02, false); ph.rotation.x = Math.PI / 2 + 0.25; ph.rotation.z = Math.PI; add(f.fig, ph); for (const s of [-1, 1]) add(f.fig, mesh(cyl(0.09, 0.09, 0.07, 12), toon('#ff9fbf'), s * 0.27, 0.99, 0.1, false)).rotation.z = Math.PI / 2; }
    if (e === 'tail') {
      const tc = lookMat(L.headColor || HAIR_COLORS[hairOf(p).color] || '#2e2a36');
      [[0, 0.42, -0.4, 0.09], [0.05, 0.5, -0.56, 0.085], [0.12, 0.64, -0.68, 0.08], [0.18, 0.8, -0.72, 0.075], [0.2, 0.95, -0.66, 0.07]].forEach(([x, y, z, r]) => add(f.fig, mesh(sph(r, 8, 6), tc, x, y, z)));
    }
  }
  // shoes
  if (f.shoes) for (const s of f.shoes) { s.material = vinyl(L.shoe || '#fffaf2'); if (L.platform) add(s, mesh(box(0.26, 0.09, 0.3), toon('#2e2a36'), 0, -0.07, 0, false)); }
  // head things: uniform hats win over style hats; a hat you bought for them wins over a style hat
  const bought = !!p.outfit.hat;
  if (f.hat) f.hat.visible = !(U && U.head);
  const headK = U ? U.head?.[0] : bought ? null : L.head, headC = U ? U.head?.[1] : L.headColor;
  if (headK) add(f.head, headMeshFor(headK, headC, F, p));
  if (!U && bought && HAIR_ACCESSORIES.includes(L.head)) add(f.head, headMeshFor(L.head, L.headColor, F, p)); // hair accessories sit next to a bought hat too
  if (U?.glasses || (!U && L.glasses)) add(f.head, glassesMesh(p, U?.glasses ? 'round' : L.glasses));
  if (typeof onProbation === 'function' && onProbation(p) && f.legs?.[0]) { add(f.legs[0], mesh(cyl(0.135, 0.135, 0.07, 10), toon('#1e1a24'), 0, -0.1, 0, false)); add(f.legs[0], mesh(box(0.09, 0.07, 0.06), toon('#1e1a24'), 0, -0.1, 0.13, false)); add(f.legs[0], mesh(sph(0.018, 5, 4), toon('#6fff8f', { emissive: new T3.Color('#1f8f3f') }), 0, -0.08, 0.165, false)); }
  faceLook(p, f, add);
  return f;
}
const HAIR_ACCESSORIES = ['clips', 'sidebow', 'starclips', 'hairbow', 'catears'];
function heartMesh(color, k = 1, x = 0, y = 0, z = 0) {
  const g = new T3.Group(), m = toon(color);
  for (const s of [-1, 1]) g.add(mesh(sph(0.045, 8, 6), m, s * 0.035, 0.02, 0, false));
  const tip = mesh(new T3.ConeGeometry(0.068, 0.08, 4), m, 0, -0.035, 0, false); tip.rotation.z = Math.PI; g.add(tip);
  g.scale.set(k, k, k * 0.5); g.position.set(x, y, z); return g;
}
function starMesh(color, r = 0.06) {
  const g = new T3.Group(), m = toon(color, { emissive: new T3.Color(color).multiplyScalar(0.25) });
  for (const rot of [0, Math.PI / 4]) { const o = mesh(new T3.OctahedronGeometry(r, 0), m, 0, 0, 0, false); o.scale.set(0.55, 1.2, 0.3); o.rotation.z = rot; g.add(o); const o2 = o.clone(); o2.rotation.z = rot + Math.PI / 2; g.add(o2); }
  return g;
}
function headMeshFor(k, color, F, p) {
  const g = new T3.Group(), c = (x) => toon(x);
  switch (k) {
    case 'beret': { const b = mesh(sph(0.5, 16, 8), c(color || '#3d4f86'), 0.08, 0.62, -0.02); b.scale.set(1, 0.32, 1); g.add(b); break; }
    case 'cap': g.add(mesh(new T3.SphereGeometry(0.645, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), c(color || '#3d4f86'), 0, 0.28, 0)); g.add(mesh(box(0.7, 0.05, 0.45), c(color || '#3d4f86'), 0, 0.3, 0.62)); break;
    case 'flatcap': { const b = mesh(sph(0.64, 16, 8), c(color || '#8a8a96'), 0, 0.38, 0.04); b.scale.set(1.02, 0.42, 1.05); g.add(b); g.add(mesh(box(0.5, 0.05, 0.3), c(color || '#8a8a96'), 0, 0.33, 0.6)); break; }
    case 'straw': g.add(mesh(cyl(0.95, 0.95, 0.04, 22), c('#e8cf8f'), 0, 0.46, 0)); g.add(mesh(cyl(0.48, 0.55, 0.3, 18), c('#e8cf8f'), 0, 0.6, 0)); g.add(mesh(cyl(0.555, 0.555, 0.08, 18), c('#ff9fbf'), 0, 0.5, 0)); break;
    case 'bucket': g.add(mesh(cyl(0.52, 0.6, 0.34, 18), c(color || '#ffd23f'), 0, 0.52, 0)); g.add(mesh(cyl(0.82, 0.82, 0.04, 20), c(color || '#ffd23f'), 0, 0.36, 0)); break;
    case 'chef': g.add(mesh(cyl(0.5, 0.5, 0.3, 18), c('#fbf8f4'), 0, 0.55, 0)); { const t = mesh(sph(0.5, 14, 10), c('#fbf8f4'), 0, 0.88, 0); t.scale.y = 0.75; g.add(t); } break;
    case 'paper': { const pp = mesh(new T3.ConeGeometry(0.5, 0.34, 4), c('#fbf8f4'), 0, 0.72, 0); pp.scale.z = 0.35; pp.rotation.y = Math.PI / 4; g.add(pp); g.add(mesh(box(0.7, 0.06, 0.2), c('#ff9fbf'), 0, 0.56, 0)); break; }
    case 'visor': { const band = mesh(new T3.TorusGeometry(0.6, 0.05, 6, 22), c(color || '#6fbf6a'), 0, 0.34, 0); band.rotation.x = Math.PI / 2; g.add(band); const br = mesh(new T3.CylinderGeometry(0.62, 0.62, 0.04, 20, 1, false, -Math.PI / 2, Math.PI), c(color || '#6fbf6a'), 0, 0.33, 0.14); br.scale.z = 0.8; g.add(br); break; }
    case 'hardhat': g.add(mesh(new T3.SphereGeometry(0.66, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), c('#ffd23f'), 0, 0.3, 0)); g.add(mesh(cyl(0.78, 0.78, 0.05, 20), c('#ffd23f'), 0, 0.3, 0.06)); g.add(mesh(box(0.12, 0.08, 1.2), c('#f2c200'), 0, 0.9, 0)); break;
    case 'goggles': { const band = mesh(new T3.TorusGeometry(0.63, 0.035, 5, 22), c('#2e2a36'), 0, 0.38, 0); band.rotation.x = Math.PI / 2 - 0.2; g.add(band); for (const s of [-1, 1]) { const l = mesh(cyl(0.12, 0.12, 0.08, 14), toon('#9fd3ff', { transparent: true, opacity: 0.8 }), s * 0.17, 0.45, 0.52, false); l.rotation.x = Math.PI / 2 - 0.4; g.add(l); } break; }
    case 'headbow': { const bc = color || '#fbf8f4'; for (const s of [-1, 1]) { const w = mesh(new T3.ConeGeometry(0.2, 0.34, 10), c(bc), s * 0.2, 0.66, 0.08); w.rotation.z = s * Math.PI / 2; g.add(w); } g.add(mesh(sph(0.09, 8, 6), c(bc), 0, 0.66, 0.08)); { const lace = mesh(new T3.TorusGeometry(0.62, 0.03, 5, 20, Math.PI), c('#fbf8f4'), 0, 0.24, 0.02); lace.rotation.y = Math.PI / 2; lace.rotation.z = Math.PI / 2; g.add(lace); } break; }
    case 'sidebow': { const bc = color || '#2e2a36'; for (const s of [-1, 1]) { const w = mesh(new T3.ConeGeometry(0.11, 0.2, 8), c(bc), 0.46 + s * 0.11, 0.46, 0.22); w.rotation.z = s * Math.PI / 2; g.add(w); } g.add(mesh(sph(0.05, 6, 5), c(bc), 0.46, 0.46, 0.22)); break; }
    case 'beanie': { const bc = color || '#a3a3ad'; g.add(mesh(new T3.SphereGeometry(0.665, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), c(bc), 0, 0.2, -0.02)); g.add(mesh(cyl(0.675, 0.675, 0.16, 20), c(new T3.Color(bc).multiplyScalar(0.85).getStyle()), 0, 0.26, -0.02)); g.add(mesh(sph(0.13, 10, 8), c('#fbf8f4'), 0, 0.9, -0.05)); break; }
    case 'witch': { const wc = color || '#2e2a36'; g.add(mesh(cyl(0.9, 0.9, 0.05, 22), c(wc), 0, 0.5, 0)); const cone = mesh(new T3.ConeGeometry(0.46, 1.1, 16), c(wc), 0.06, 1.05, -0.02); cone.rotation.z = -0.22; g.add(cone); g.add(mesh(cyl(0.47, 0.47, 0.1, 16), c('#b98adf'), 0, 0.57, 0)); break; }
    case 'catears': {
      const ec = color || HAIR_COLORS[hairOf(p).color] || '#2e2a36';
      const band = mesh(new T3.TorusGeometry(0.68, 0.024, 5, 20, Math.PI), c(ec), 0, 0.02, 0.04); g.add(band);
      for (const s of [-1, 1]) { const e = mesh(new T3.ConeGeometry(0.2, 0.42, 4), c(ec), s * 0.37, 0.72, 0.02); e.rotation.z = -s * 0.42; e.rotation.y = Math.PI / 4; e.scale.z = 0.6; g.add(e); const inner = mesh(new T3.ConeGeometry(0.1, 0.24, 4), c('#ffb3c7'), s * 0.355, 0.69, 0.09, false); inner.rotation.z = -s * 0.42; inner.rotation.y = Math.PI / 4; inner.scale.z = 0.5; g.add(inner); }
      break;
    }
    case 'flowers': { const big = p && ['curly', 'spiky', 'bun'].includes(hairOf(p).style), R = big ? 0.66 : 0.56, Y = big ? 0.56 : 0.44; for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.55 + (i / 8) * Math.PI * 1.1, x = Math.sin(a) * R, z = Math.cos(a) * R - 0.04; g.add(mesh(sph(0.095, 8, 6), c(['#ffffff', '#ffe98a', '#ff9fbf', '#c9b3ff', '#ffb38a'][i % 5]), x, Y, z)); if (i % 2) g.add(mesh(sph(0.055, 6, 5), c('#7cc86a'), x * 1.04, Y - 0.07, z * 1.04, false)); } break; }
    case 'hairbow': { const bc = color || '#ff9fbf'; for (const s of [-1, 1]) { const w = mesh(new T3.ConeGeometry(0.15, 0.28, 10), c(bc), s * 0.15, 0.28, -0.6); w.rotation.z = s * Math.PI / 2; g.add(w); const t = mesh(box(0.06, 0.3, 0.03), c(bc), s * 0.07, 0.06, -0.62, false); t.rotation.z = s * 0.25; g.add(t); } g.add(mesh(sph(0.07, 8, 6), c(bc), 0, 0.28, -0.62)); break; }
    case 'starclips': [[0.3, 0.42, 0.42, '#ffd36b'], [0.42, 0.3, 0.38, '#c9b3ff'], [-0.34, 0.4, 0.4, '#9fd3ff']].forEach(([x, y, z, col]) => { const s = starMesh(col, 0.07); s.position.set(x, y, z); g.add(s); }); break;
    case 'headphones': { const hc = color || '#2e2a36'; g.add(mesh(new T3.TorusGeometry(0.67, 0.05, 6, 20, Math.PI), c(hc), 0, 0.05, 0)); for (const s of [-1, 1]) { const e = mesh(cyl(0.19, 0.19, 0.14, 14), c('#ff9fbf'), s * 0.66, 0.02, 0); e.rotation.z = Math.PI / 2; g.add(e); } break; }
    case 'clips': for (let i = 0; i < 3; i++) g.add(mesh(box(0.1, 0.04, 0.04), c(['#ff9fbf', '#9fd3ff', '#ffe98a'][i]), 0.24 + i * 0.07, 0.5 - i * 0.07, 0.4 - i * 0.04, false)); break;
  }
  return g;
}
function glassesMesh(p, style) {
  const g = new T3.Group(), gap = 0.12 + p.body.eyeGap * 0.45, m = toon('#3a3040');
  const surf = (x, y, r = 0.62) => Math.sqrt(Math.max(0.01, r * r - x * x - y * y));
  for (const s of [-1, 1]) { const ring = mesh(new T3.TorusGeometry(0.105, 0.016, 5, 16), m, s * gap, 0.05, surf(s * gap, 0.05) + 0.05, false); ring.rotation.y = s * 0.15; g.add(ring); }
  if (style === 'shades') for (const s of [-1, 1]) { const lens = mesh(new T3.CircleGeometry(0.1, 14), cachedMat('shadesLens', () => new T3.MeshBasicMaterial({ color: 0x1e1a24, transparent: true, opacity: 0.85 })), s * gap, 0.05, surf(s * gap, 0.05) + 0.048, false); lens.rotation.y = s * 0.15; g.add(lens); }
  g.add(mesh(box(Math.max(0.04, gap * 2 - 0.2), 0.02, 0.02), m, 0, 0.08, surf(0, 0.08) + 0.03, false));
  return g;
}
const EYE_SHAPES = { round: ['Round', 1, 1, 0], sparkle: ['Sparkly', 1.2, 1.12, 0], starry: ['Starry', 1.2, 1.12, 0], sleepy: ['Sleepy', 1.1, 0.62, 0], sharp: ['Sharp', 1.15, 0.85, 0.22], cat: ['Cat', 0.8, 1.25, 0.32], droopy: ['Droopy', 1.1, 0.8, -0.25], wide: ['Wide', 1.35, 1.2, 0], tiny: ['Tiny', 0.62, 0.62, 0], dot: ['Dot', 0.78, 0.72, 0] };
const EYE_COLORS = { dark: '#241a34', brown: '#6b3f26', blue: '#2f64c8', green: '#2f7a4e', violet: '#6a3fc8', pink: '#d8408a', gold: '#b88a1a', red: '#a82838' };
const MOUTHS = { smile: 'Smile', cat: 'Cat', smirk: 'Smirk', grin: 'Grin', small: 'Small', fang: 'Fang', blep: 'Tongue out', flat: 'Flat' };
const FACE_MARKS = { lashes: 'Lashes', liner: 'Eyeliner', underEye: 'Pink under-eyes', freckles: 'Freckles', mole: 'Beauty mark', heart: 'Heart sticker', stars: 'Star stickers', bandaid: 'Bandage', lipring: 'Lip ring', nosestud: 'Nose stud' };
function faceLook(p, f, add) {
  const FC = lookOf(p).face || faceFor(p, lookOf(p).fashion); if (!f.eyes || !f.head) return;
  const gap = 0.12 + p.body.eyeGap * 0.45, surf = (x, y, r = 0.62) => Math.sqrt(Math.max(0.01, r * r - x * x - y * y));
  const dark = toon('#241a34'), marks = FC.marks || [];
  const [, kx, ky, rot] = EYE_SHAPES[FC.eyes] || EYE_SHAPES.round;
  const eyeM = vinyl(EYE_COLORS[FC.eyeColor] || EYE_COLORS.dark);
  f.eyes.forEach((e, i) => { const s = i ? 1 : -1; e.scale.x = kx; e.userData.ky = ky; e.rotation.z = -s * rot; e.material = eyeM; });
  if ((FC.eyes === 'sparkle' || FC.eyes === 'starry') && f.shines) for (const sh of f.shines) add(f.head, mesh(sph(0.014, 6, 5), toon('#ffffff', { emissive: new T3.Color('#ffffff') }), sh.position.x - 0.045, sh.position.y - 0.06, sh.position.z - 0.005, false));
  if (FC.eyes === 'starry' && f.shines) for (const sh of f.shines) { const st = starMesh('#ffffff', 0.032); st.position.set(sh.position.x - 0.03, sh.position.y - 0.035, sh.position.z + 0.004); add(f.head, st); }
  if (FC.eyes === 'sleepy' || FC.eyes === 'droopy') for (const s of [-1, 1]) { const lid = mesh(new T3.TorusGeometry(0.07, 0.014, 5, 10, Math.PI), dark, s * gap, FC.eyes === 'droopy' ? 0.13 : 0.1, surf(s * gap, 0.1) + 0.02, false); if (FC.eyes === 'droopy') lid.rotation.z = s * 0.3; add(f.head, lid); }
  if (FC.lashes) for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const l = mesh(new T3.ConeGeometry(0.014, 0.07, 4), dark, s * (gap + 0.05 + i * 0.028), 0.15 - i * 0.025, surf(s * (gap + 0.06), 0.14) + 0.02, false); l.rotation.z = -s * (0.6 + i * 0.35); add(f.head, l); }
  if (FC.liner) for (const s of [-1, 1]) { const w = mesh(new T3.ConeGeometry(0.02, 0.1, 4), dark, s * (gap + 0.085), 0.09, surf(s * (gap + 0.085), 0.09) + 0.015, false); w.rotation.z = -s * 1.15; add(f.head, w); }
  if (FC.underEye) for (const s of [-1, 1]) { const u = mesh(new T3.CircleGeometry(0.075, 12), cachedMat('underEye', () => new T3.MeshBasicMaterial({ color: 0xff6f93, transparent: true, opacity: 0.6 })), s * gap, -0.06, surf(s * gap, -0.06) + 0.012, false); u.scale.set(1.35, 0.55, 1); u.rotation.y = s * 0.2; add(f.head, u); }
  if (FC.freckles) for (const s of [-1, 1]) for (const [dx, dy] of [[0.1, -0.05], [0.16, -0.02], [0.13, -0.1]]) add(f.head, mesh(sph(0.012, 5, 4), toon('#b0704a'), s * (gap + dx), dy, surf(s * (gap + dx), dy) + 0.004, false));
  // little marks and stickers
  const onFace = (o, x, y, lift = 0.01) => { o.position.set(x, y, surf(x, y) + lift); o.lookAt(o.position.clone().multiplyScalar(2)); add(f.head, o); return o; };
  if (marks.includes('mole')) onFace(mesh(sph(0.017, 6, 5), toon('#3a2430'), 0, 0, 0, false), gap + 0.08, -0.16, 0.003);
  if (marks.includes('heart')) onFace(heartMesh('#ff5f8f', 0.55), -(gap + 0.13), -0.08);
  if (marks.includes('stars')) { onFace(starMesh('#ffd36b', 0.042), gap + 0.1, -0.07); onFace(starMesh('#ffd36b', 0.03), gap + 0.18, -0.12); }
  if (marks.includes('bandaid')) { const b = onFace(mesh(box(0.17, 0.065, 0.014), toon('#f2c9a0'), 0, 0, 0, false), gap + 0.13, 0.03); b.rotateZ(-0.5); b.add(mesh(box(0.05, 0.045, 0.01), toon('#e0a880'), 0, 0, 0.006, false)); }
  if (marks.includes('lipring')) { const r = onFace(mesh(new T3.TorusGeometry(0.03, 0.009, 5, 12), toon('#d9dde6'), 0, 0, 0, false), 0.075, -0.19, 0.008); r.rotateX(Math.PI / 2); }
  if (marks.includes('nosestud')) onFace(mesh(sph(0.012, 6, 5), toon('#d9dde6', { emissive: new T3.Color('#555') }), 0, 0, 0, false), 0.04, -0.03, 0.004);
  f.head.traverse((c) => { if (c.geometry?.type === 'CircleGeometry' && c.material?.color?.getHex() === 0xff8fb0) c.material.opacity = FC.blush; });
  // lipstick, or back to the plain mouth
  if (!f.mouthBase) f.mouthBase = f.mouth.material;
  const lipM = FC.lips ? toon(FC.lips) : f.mouthBase;
  for (const m of [f.mouth, f.mouthFrown, f.mouthO]) if (m) m.material = lipM;
  const RESTS = { flat: { sx: 1.1, sy: 0.25 }, smirk: { rot: 0.35, x: 0.03 }, grin: { sx: 1.4, sy: 1.25 }, small: { sx: 0.62, sy: 0.75 } };
  f.mouth.userData.rest = RESTS[FC.mouth] || null;
  if (FC.mouth === 'cat') { const cm = new T3.Group(); for (const s of [-1, 1]) { const a = mesh(new T3.TorusGeometry(0.035, 0.014, 5, 10, Math.PI), lipM, s * 0.035, -0.12, surf(s * 0.035, -0.12) + 0.01, false); a.rotation.z = Math.PI; cm.add(a); } add(f.head, cm); f.mouthCat = cm; } else f.mouthCat = null;
  f.mouthExtra = null;
  if (FC.mouth === 'fang') { const t = mesh(new T3.ConeGeometry(0.018, 0.045, 4), toon('#ffffff'), 0.035, -0.17, surf(0.035, -0.17) + 0.012, false); t.rotation.z = Math.PI; f.mouthExtra = add(f.head, t); }
  if (FC.mouth === 'blep') { const t = mesh(sph(0.032, 8, 6), toon('#ff7f9f'), 0.012, -0.175, surf(0.012, -0.175) + 0.004, false); t.scale.set(1, 1.2, 0.5); f.mouthExtra = add(f.head, t); }
  if (f.brows) f.brows.forEach((b) => { b.userData.base = FC.brow; b.scale.y = FC.browThick; });
}
// rebuild a resident's clothes on their live 3D model
function restyleLook(p) {
  const m = typeof meshes !== 'undefined' && meshes.get(p.id); if (!m) return;
  for (const o of m.lookParts || []) { o.parent?.remove(o); o.traverse((c) => c.geometry?.dispose()); }
  m.lookParts = [];
  if (!cuteOn()) return;
  dressLook(p, m); m.lookKey = lookKey(p);
  if (typeof interior !== 'undefined' && interior) interior.dirty = true;
}
const lookKey = (p) => `${p.look?.fashion}|${p.look?.rev || 0}|${inUniform(p) ? p.job : ''}|${lawOutfit(p) || ''}|${typeof onProbation === 'function' && onProbation(p) ? 'P' : ''}|${p.outfit.shirt}|${p.outfit.hat ? p.outfit.hat.id : ''}`;
function lookFrame(p, m) { if (m.lookParts && m.lookKey !== lookKey(p)) restyleLook(p); }

// friends rub off on each other: now and then someone starts dressing like a close friend
function styleDrift(p) {
  if (isRealish(p) || p.grow < 1 || p.look?.byCreator) return;
  if (rand() > 0.012) { if (typeof styleWhim === 'function') styleWhim(p); return; }
  const friends = Object.entries(p.feelings).filter(([id, f]) => f.score >= 6 && person(id)?.look).map(([id]) => person(id));
  const fr = friends.find((q) => q.look.fashion !== p.look?.fashion && (p.grow < 1 ? KID_FASHION.includes(q.look.fashion) : true));
  if (!fr) return;
  setFashion(p, fr.look.fashion);
  remember(p, `I started dressing more like ${fr.name}. ${FASHION[fr.look.fashion].name.replace(/ \(.*\)/, '')} suits me.`, 2, 'style', fr.name);
  diary(`👗 <b>${esc(p.name)}</b> started dressing ${esc(FASHION[fr.look.fashion].name.replace(/ \(.*\)/, '').toLowerCase())}, like <b>${esc(fr.name)}</b>.`);
}
function setFashionCmd(pid, fashion) {
  const p = person(pid); if (!p || !FASHION[fashion]) return '';
  if (p.grow < 1 && !KID_FASHION.includes(fashion)) return '';
  setFashion(p, fashion); p.look.byCreator = true;
  if (!p.today.some((m) => m.tag === 'restyle')) { remember(p, `The Creator changed my style to ${FASHION[fashion].name.replace(/ \(.*\)/, '').toLowerCase()}.`, 2, 'restyle'); if (!p.inside) bubble(p, pick(['Wait, I love this.', 'Is this me now?', 'Okay, new me!']), 2.6); }
  markDirty(); return '';
}
function fashionBoot() {
  W.added = W.added || {};
  for (const p of W.people) { personaOf(p); lookOf(p); }
  if (W.added.fashion1) return; W.added.fashion1 = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'Everyone has their own style now. Some residents are goth or emo, some are jirai kei, gyaru or lolita, some are preppy, sporty or cottagecore, and a few dress like somebody\'s mom or dad. Their faces fit who they are too: sleepy eyes, sharp eyes, sparkly eyes, lashes, eyeliner, freckles. They change into uniforms for work, notice each other\'s outfits, and sometimes start dressing like their best friends. You can change anyone\'s style from their card.', 'styles, faces and uniforms');
}
