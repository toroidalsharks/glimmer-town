// ============================================================
// LOOK STUDIO: change anyone's style, clothes, hair and face from their
// card, piece by piece; residents sometimes change a piece themselves
// ============================================================
const LOOK_LAYERS = ['cardigan', 'vest', 'hoodie', 'track', 'blazer', 'flannel', 'puffer', 'shell', 'corset', 'cape', 'overalls'];
const LOOK_BOTTOMS = ['pants', 'cargo', 'ripped', 'shorts', 'skirt', 'pleated', 'plaid', 'tutu', 'long', 'bell'];
const LOOK_HEADS = ['cap', 'beanie', 'beret', 'flatcap', 'straw', 'bucket', 'witch', 'catears', 'flowers', 'headbow', 'hairbow', 'sidebow', 'clips', 'starclips', 'headphones'];
const HEAD_COLORED = ['cap', 'beanie', 'beret', 'flatcap', 'bucket', 'witch', 'catears', 'hairbow', 'headbow', 'sidebow', 'headphones'];
const LOOK_EXTRAS = ['backpack', 'tote', 'satchel', 'heartbag', 'briefcase', 'belt', 'chain', 'pendant', 'bangles', 'wristbands', 'hoops', 'harness', 'tail', 'legwarmers', 'neckphones'];
const LOOK_NECKS = ['collar', 'bow', 'tie', 'choker', 'bell'];
const LOOK_PALETTE = ['#2e2a36', '#4a4652', '#a3a3ad', '#fbf8f4', '#fff4dc', '#cdb88f', '#6b4a3a', '#7a2e3a', '#b8323f', '#ff6f5e', '#ffb347', '#ffe98a', '#8fae6a', '#2f5d4a', '#9fe3c4', '#9fd3ff', '#5b7fb5', '#3d4f86', '#c9b3ff', '#5e3a6e', '#ff9fbf', '#ff5fa8'];
const LOOK_TIGHTS = { skin: 'Bare legs', '#2e2a36': 'Black tights', '#fbf8f4': 'White tights', '#ff9fbf': 'Pink tights', '#c9b3ff': 'Lilac tights' };
const LIP_COLORS = ['#ff7fa0', '#ff5f8f', '#b8323f', '#5e3a6e', '#c98a6a', '#2e2a36'];
const SKIN_TONES = [[28, 45, 82], [27, 50, 70], [24, 45, 56], [22, 40, 42], [20, 35, 30], [0, 70, 78], [35, 75, 76], [55, 70, 78], [100, 55, 76], [160, 55, 76], [200, 70, 78], [240, 60, 80], [280, 60, 80], [320, 65, 80]];
const EAR_CHOICES = ['none', 'round', 'pointy', 'cat', 'antenna', 'sprout'];
const KID_BLOCKED = ['corset', 'harness', 'briefcase', 'lipring', 'nosestud', 'liner', 'lips', 'underEye'];
const LOOK_LABELS = {
  cardigan: 'Cardigan', vest: 'Sweater vest', hoodie: 'Hoodie', track: 'Track jacket', blazer: 'Blazer', flannel: 'Flannel', puffer: 'Puffer', shell: 'Tech jacket', corset: 'Corset', cape: 'Cape', overalls: 'Overalls',
  pants: 'Pants', cargo: 'Cargo pants', ripped: 'Ripped jeans', shorts: 'Shorts', skirt: 'Mini skirt', pleated: 'Pleated skirt', plaid: 'Plaid skirt', tutu: 'Tutu', long: 'Long skirt', bell: 'Frilly skirt',
  cap: 'Cap', beanie: 'Beanie', beret: 'Beret', flatcap: 'Flat cap', straw: 'Straw hat', bucket: 'Bucket hat', witch: 'Witch hat', catears: 'Cat ears', flowers: 'Flower crown', headbow: 'Lace bow', hairbow: 'Ribbon', sidebow: 'Bow clip', clips: 'Hair clips', starclips: 'Star clips', headphones: 'Headphones',
  backpack: 'Backpack', tote: 'Tote', satchel: 'Satchel', heartbag: 'Heart purse', briefcase: 'Briefcase', belt: 'Studded belt', chain: 'Wallet chain', pendant: 'Pendant', bangles: 'Bangles', wristbands: 'Wristbands', hoops: 'Hoop earrings', harness: 'Harness', tail: 'Cat tail', legwarmers: 'Leg warmers', neckphones: 'Neck headphones',
  collar: 'Collar', bow: 'Bow', tie: 'Tie', choker: 'Choker', bell: 'Bell collar',
};
let lookOpen = null, lookTab = 'style';

// ---- the panel ----
const lookBtn = (pid, part, val, label, on) => `<button class="btn" type="button" data-look="${pid}" data-part="${part}" data-val="${esc(String(val))}" aria-pressed="${!!on}">${esc(label)}</button>`;
const lookSw = (pid, part, val, css, on, title) => `<button class="sw" type="button" data-look="${pid}" data-part="${part}" data-val="${esc(String(val))}" aria-pressed="${!!on}" title="${esc(title || '')}" aria-label="${esc(title || val)}" style="background:${css}"></button>`;
const lookRow = (label, inner) => `<p class="label">${label}</p><div class="chips">${inner}</div>`;
const kidOk = (p, k) => p.grow >= 1 || !KID_BLOCKED.includes(k);
function lookSummary(p) {
  const L = lookOf(p), h = hairOf(p);
  return `${FASHION[L.fashion].name} · ${HAIR_STYLES[h.style].toLowerCase()} ${h.color} hair · ${vibeWords(p).join(', ')}`;
}
function lookStudioHtml(p) {
  if (!p.body) return '';
  const open = lookOpen === p.id;
  let h = `<div class="looks"><div class="looks-top"><div><p class="label">Their look</p><p class="looks-sum">${esc(lookSummary(p))}</p></div>
    <button class="btn ${open ? '' : 'gold'}" type="button" data-lookopen="${p.id}" aria-expanded="${open}">${open ? 'Done' : '👗 Change look'}</button></div>`;
  if (!open) return h + '</div>';
  h += `<div class="chips looks-tabs">${[['style', 'Style'], ['outfit', 'Clothes'], ['hair', 'Hair'], ['face', 'Face']].map(([k, n]) => `<button class="btn" type="button" data-looktab="${k}" aria-pressed="${lookTab === k}">${n}</button>`).join('')}</div>`;
  if (!cuteOn()) h += `<p class="hint">The cute look is switched off in Settings, so clothes and faces won't show in the box until it's back on.</p>`;
  if (workOutfit(p)) h += `<p class="hint">${esc(p.name)} is in ${jailed(p) ? 'a jumpsuit' : 'a work uniform'} right now. Your changes show once they change back.</p>`;
  h += lookTab === 'outfit' ? lookOutfitHtml(p) : lookTab === 'hair' ? lookHairHtml(p) : lookTab === 'face' ? lookFaceHtml(p) : lookStyleHtml(p);
  return h + '</div>';
}
function lookStyleHtml(p) {
  const L = lookOf(p);
  let h = `<div class="chips">${lookBtn(p.id, 'fit', 1, '✨ Something that suits them', false)}${lookBtn(p.id, 'random', 1, '🎲 Surprise me', false)}</div>`;
  for (const [fam, name] of Object.entries(FASHION_FAMILIES)) {
    const ks = FASHION_ORDER.filter((k) => FASHION[k].family === fam && (p.grow >= 1 || KID_FASHION.includes(k)));
    if (ks.length) h += lookRow(name, ks.map((k) => lookBtn(p.id, 'style', k, FASHION[k].name, L.fashion === k)).join(''));
  }
  return h + `<p class="hint">Picking a style dresses them in a fresh outfit for it. Fine-tune the pieces under Clothes. Faces you change stay put.</p>`;
}
function lookOutfitHtml(p) {
  const L = lookOf(p), F = FASHION[L.fashion], pid = p.id;
  const sws = (part, cur) => LOOK_PALETTE.map((c) => lookSw(pid, part, c, c, cur === c, c)).join('');
  let h = lookRow(F.dress ? 'Dress' : 'Top', Object.entries(COLORS).map(([k, c]) => lookSw(pid, 'top', k, c, p.outfit.shirt === k, k)).join(''));
  h += lookRow('Print', ['none', 'heart', 'star', 'rainbow'].map((k) => lookBtn(pid, 'print', k, k === 'none' ? 'Plain' : cap(k), (L.print || 'none') === k)).join('') + lookBtn(pid, 'stripes', 1, 'Stripes', !!L.stripes));
  h += lookRow('Layer', lookBtn(pid, 'layer', 'none', 'None', !L.layer) + LOOK_LAYERS.filter((k) => kidOk(p, k)).map((k) => lookBtn(pid, 'layer', k, LOOK_LABELS[k], L.layer === k)).join(''));
  if (L.layer) h += `<div class="chips">${sws('layerColor', L.layerColor)}</div>`;
  h += lookRow(F.dress ? 'Skirt shape' : 'Bottoms', LOOK_BOTTOMS.map((k) => lookBtn(pid, 'bottom', k, LOOK_LABELS[k], L.bottom === k)).join(''));
  if (!F.dress) h += `<div class="chips">${sws('bottomColor', L.bottomColor)}</div>`;
  if (!['pants', 'cargo', 'ripped'].includes(L.bottom)) h += lookRow('Legs', Object.entries(LOOK_TIGHTS).map(([k, n]) => lookBtn(pid, 'tights', k, n, (L.tights || 'skin') === k)).join(''));
  h += lookRow('Shoes', sws('shoe', L.shoe) + lookBtn(pid, 'platform', 1, 'Platforms', !!L.platform));
  h += lookRow('On their head', lookBtn(pid, 'head', 'none', 'Nothing', !L.head) + LOOK_HEADS.map((k) => lookBtn(pid, 'head', k, LOOK_LABELS[k], L.head === k)).join(''));
  if (HEAD_COLORED.includes(L.head)) h += `<div class="chips">${sws('headColor', L.headColor)}</div>`;
  if (p.outfit.hat) h += `<p class="hint">They're wearing ${esc(a_an(hatText(p.outfit.hat)))} you gave them, which sits where a hat would. Clips, bows and cat ears still show.</p>`;
  h += lookRow('Glasses', [['none', 'None'], ['round', 'Glasses'], ['shades', 'Sunglasses']].map(([k, n]) => lookBtn(pid, 'glasses', k, n, k === 'none' ? !L.glasses : k === 'shades' ? L.glasses === 'shades' : L.glasses === true)).join(''));
  h += lookRow('Neck', LOOK_NECKS.map((k) => lookBtn(pid, 'neck', k, LOOK_LABELS[k], (L.neck || []).includes(k))).join(''));
  h += lookRow('Extras', LOOK_EXTRAS.filter((k) => kidOk(p, k)).map((k) => lookBtn(pid, 'extra', k, LOOK_LABELS[k], (L.extras || []).includes(k))).join(''));
  if ((L.extras || []).some((e) => e === 'backpack' || e === 'legwarmers')) h += lookRow('Backpack and leg warmer color', sws('pack', L.pack));
  return h;
}
function lookHairHtml(p) {
  const hr = hairOf(p);
  return lookRow('Haircut', Object.entries(HAIR_STYLES).map(([k, n]) => `<button class="btn" type="button" data-hair="${p.id}" data-style="${k}" aria-pressed="${hr.style === k}">${esc(n)}</button>`).join(''))
    + lookRow('Hair color', Object.entries(HAIR_COLORS).map(([k, c]) => `<button class="sw" type="button" data-hair="${p.id}" data-hcolor="${k}" aria-pressed="${hr.color === k}" title="${k}" aria-label="${k}" style="background:${c}"></button>`).join(''));
}
function lookFaceHtml(p) {
  const FC = lookOf(p).face, pid = p.id, marks = FC.marks || [];
  let h = lookRow('Eyes', Object.entries(EYE_SHAPES).map(([k, v]) => lookBtn(pid, 'eyes', k, v[0], FC.eyes === k)).join(''));
  h += lookRow('Eye color', Object.entries(EYE_COLORS).map(([k, c]) => lookSw(pid, 'eyeColor', k, c, (FC.eyeColor || 'dark') === k, k)).join(''));
  h += lookRow('Mouth', Object.entries(MOUTHS).map(([k, n]) => lookBtn(pid, 'mouth', k, n, FC.mouth === k)).join(''));
  h += lookRow('Brows', [['-0.14', 'Soft'], ['0', 'Plain'], ['0.14', 'Stern']].map(([v, n]) => lookBtn(pid, 'brow', v, n, Math.abs((FC.brow || 0) - Number(v)) < 0.01)).join('') + [['0.7', 'Thin'], ['1', 'Medium'], ['1.4', 'Thick']].map(([v, n]) => lookBtn(pid, 'browThick', v, n, Math.abs((FC.browThick || 1) - Number(v)) < 0.01)).join(''));
  h += lookRow('Blush', [['0', 'None'], ['0.55', 'Soft'], ['0.9', 'Rosy']].map(([v, n]) => lookBtn(pid, 'blush', v, n, Math.abs((FC.blush ?? 0.55) - Number(v)) < 0.12)).join(''));
  if (p.grow >= 1) h += lookRow('Lips', lookBtn(pid, 'lips', 'none', 'Natural', !FC.lips) + LIP_COLORS.map((c) => lookSw(pid, 'lips', c, c, FC.lips === c, c)).join(''));
  h += lookRow('Makeup and marks', Object.entries(FACE_MARKS).filter(([k]) => kidOk(p, k)).map(([k, n]) => lookBtn(pid, 'mark', k, n, ['lashes', 'liner', 'underEye', 'freckles'].includes(k) ? !!FC[k] : marks.includes(k))).join(''));
  h += lookRow('Skin', SKIN_TONES.map(([hu, s, l], i) => lookSw(pid, 'skin', i, `hsl(${hu}, ${s}%, ${l}%)`, Math.round(p.body.hue) === hu && (p.body.sat ?? 70) === s && (p.body.light ?? 78) === l, 'skin tone')).join(''));
  if (!isClaude(p)) h += lookRow('Ears', EAR_CHOICES.map((k) => lookBtn(pid, 'ears', k, k === 'none' ? 'Just a head' : cap(k), (p.body.ears || 'none') === k)).join(''));
  return h + `<div class="chips">${lookBtn(pid, 'resetface', 1, 'Back to their natural face', false)}</div>`;
}

// ---- the command ----
function rebuildKin(p) {
  if (MODE !== 'host') return;
  const m = meshes.get(p.id); if (!m) return;
  scene.remove(m.root); m.tag.remove(); meshes.delete(p.id); buildKin(p);
}
function lookEdit(pid, part, val) {
  const p = person(pid); if (!p || !p.body) return '';
  const L = lookOf(p), kid = p.grow < 1, pal = LOOK_PALETTE.includes(val);
  if (kid && KID_BLOCKED.includes(val)) return '';
  const mods = { ...(p.body.faceMods || {}) }, toggle = (arr, k) => (arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]);
  let kind = 'clothes', rebuild = false;
  switch (part) {
    case 'style': if (!FASHION[val] || (kid && !KID_FASHION.includes(val))) return ''; setFashion(p, val, true); kind = 'style'; break;
    case 'fit': setFashion(p, pickFashion(p), true); kind = 'style'; break;
    case 'random': { const opts = FASHION_ORDER.filter((k) => (!kid || KID_FASHION.includes(k)) && k !== L.fashion); setFashion(p, pick(opts), true); kind = 'style'; break; }
    case 'top': if (!COLORS[val]) return ''; p.outfit.shirt = val; if (!p.wardrobe.shirts.includes(val)) p.wardrobe.shirts.push(val); break;
    case 'print': if (!['none', 'heart', 'star', 'rainbow'].includes(val)) return ''; L.print = val === 'none' ? null : val; break;
    case 'stripes': L.stripes = L.stripes ? null : '#fbf8f4'; break;
    case 'layer': if (val !== 'none' && !LOOK_LAYERS.includes(val)) return ''; L.layer = val === 'none' ? null : val; if (L.layer && !L.layerColor) L.layerColor = '#5b7fb5'; break;
    case 'layerColor': if (!pal) return ''; L.layerColor = val; break;
    case 'bottom': if (!LOOK_BOTTOMS.includes(val)) return ''; L.bottom = val; if (!L.bottomColor) L.bottomColor = '#4a4652'; break;
    case 'bottomColor': if (!pal) return ''; L.bottomColor = val; break;
    case 'tights': if (!LOOK_TIGHTS[val]) return ''; L.tights = val; break;
    case 'shoe': if (!pal) return ''; L.shoe = val; hairOf(p).shoe = val; break;
    case 'platform': L.platform = !L.platform; break;
    case 'head': if (val !== 'none' && !LOOK_HEADS.includes(val)) return ''; L.head = val === 'none' ? null : val; break;
    case 'headColor': if (!pal) return ''; L.headColor = val; break;
    case 'glasses': if (!['none', 'round', 'shades'].includes(val)) return ''; L.glasses = val === 'none' ? false : val === 'round' ? true : 'shades'; break;
    case 'neck': if (!LOOK_NECKS.includes(val)) return ''; L.neck = toggle(L.neck || [], val); break;
    case 'extra': if (!LOOK_EXTRAS.includes(val)) return ''; L.extras = toggle(L.extras || [], val); if (val === 'backpack' && !L.pack) L.pack = '#9fd3ff'; break;
    case 'pack': if (!pal) return ''; L.pack = val; break;
    case 'eyes': if (!EYE_SHAPES[val]) return ''; mods.eyes = val; kind = 'face'; break;
    case 'eyeColor': if (!EYE_COLORS[val]) return ''; mods.eyeColor = val; kind = 'face'; break;
    case 'mouth': if (!MOUTHS[val]) return ''; mods.mouth = val; kind = 'face'; break;
    case 'brow': if (!['-0.14', '0', '0.14'].includes(val)) return ''; mods.brow = Number(val); kind = 'face'; break;
    case 'browThick': if (!['0.7', '1', '1.4'].includes(val)) return ''; mods.browThick = Number(val); kind = 'face'; break;
    case 'blush': if (!['0', '0.55', '0.9'].includes(val)) return ''; mods.blush = Number(val); kind = 'face'; break;
    case 'lips': if (kid || (val !== 'none' && !LIP_COLORS.includes(val))) return ''; mods.lips = val === 'none' ? null : val; kind = 'face'; break;
    case 'mark': {
      if (!FACE_MARKS[val]) return '';
      if (['lashes', 'liner', 'underEye', 'freckles'].includes(val)) mods[val] = !L.face?.[val];
      else mods.marks = toggle(L.face?.marks || [], val);
      kind = 'face'; break;
    }
    case 'resetface': delete p.body.faceMods; L.face = faceFor(p, L.fashion); kind = 'face'; break;
    case 'skin': { const t = SKIN_TONES[Number(val)]; if (!t) return ''; [p.body.hue, p.body.sat, p.body.light] = t; rebuild = true; kind = 'face'; break; }
    case 'ears': if (!EAR_CHOICES.includes(val) || isClaude(p)) return ''; p.body.ears = val; rebuild = true; kind = 'face'; break;
    default: return '';
  }
  if (kind === 'face' && part !== 'resetface' && !rebuild) { p.body.faceMods = mods; p.look.face = faceFor(p, p.look.fashion); }
  p.look.byCreator = true; p.look.rev = (p.look.rev || 0) + 1;
  if (rebuild) rebuildKin(p); else restyleLook(p);
  if (typeof interior !== 'undefined' && interior) interior.dirty = true;
  if (!p.today.some((m) => m.tag === 'restyle')) {
    remember(p, kind === 'style' ? `The Creator changed my style to ${FASHION[p.look.fashion].name.replace(/ \(.*\)/, '').toLowerCase()}.` : kind === 'face' ? 'The Creator changed my face a little. I keep checking the mirror.' : 'The Creator picked out new clothes for me.', 2, 'restyle');
    if (!p.inside && MODE === 'host') bubble(p, pick(kind === 'face' ? ['Is my face different?', 'Wait, do I look new?', 'Huh. I like it.'] : ['Wait, I love this.', 'Is this me now?', 'Okay, new me!', 'Where did this come from?']), 2.6);
  }
  markDirty(); return '';
}

// ---- residents tinker with their own look now and then (called each morning) ----
function styleWhim(p) {
  if (isRealish(p) || p.grow < 1 || !p.look || p.look.byCreator || rand() > 0.03) return;
  const L = p.look, F = FASHION[L.fashion], roll = rand();
  if (roll < 0.3) {
    const k = pickFashion(p); if (k === L.fashion) return;
    setFashion(p, k);
    remember(p, `I wanted a change, so I tried a ${FASHION[k].name.replace(/ \(.*\)/, '').toLowerCase()} look. I think it's me.`, 2, 'style');
    diary(`👗 <b>${esc(p.name)}</b> showed up in a whole new ${esc(FASHION[k].name.replace(/ \(.*\)/, '').toLowerCase())} look today.`);
    return;
  }
  if (roll < 0.55 && F.head?.length) { const [k] = pick(F.head); if (k === L.head) return; L.head = k; remember(p, `I started wearing ${HEAD_WORDS[k] || 'something new on my head'}.`, 1, 'style'); }
  else if (roll < 0.8 && F.tops) { const c = pick(F.tops); if (c === p.outfit.shirt) return; p.outfit.shirt = c; if (!p.wardrobe.shirts.includes(c)) p.wardrobe.shirts.push(c); remember(p, `Bought ${a_an(c)} top. It goes with everything I own.`, 1, 'style'); }
  else { const c = pick(LOOK_PALETTE); if (!L.layer) return; L.layerColor = c; remember(p, `Found a new ${LOOK_LABELS[L.layer]?.toLowerCase() || 'jacket'} I like better than my old one.`, 1, 'style'); }
  L.rev = (L.rev || 0) + 1; restyleLook(p);
}

// ---- one-time upgrade for towns that already exist ----
const NEW_STYLES_2 = ['comfy', 'business', 'academia', 'coquette', 'boho', 'fairy', 'kidcore', 'neko', 'egirl', 'grunge', 'witchy', 'techwear'];
function looksBoot() {
  W.added = W.added || {};
  if (W.added.looks2) return; W.added.looks2 = true;
  for (const p of W.people) {
    if (!p.body || !p.look) continue;
    if (!isRealish(p) && !p.look.byCreator) {
      const r = seededRand(hashStr('looks2:' + p.id));
      if (r() < 0.4) { const k = pickFashion(p, r); if (k !== p.look.fashion && NEW_STYLES_2.includes(k)) setFashion(p, k, true); }
    }
    p.look.face = faceFor(p, p.look.fashion); p.look.rev = (p.look.rev || 0) + 1;
  }
  if (typeof logUpdate === 'function') logUpdate('build', 'Every resident card has a Change look button near the top now. You can pick from 27 styles (new ones include cottagecore\'s cousins coquette and boho, fairy kei, kidcore, neko with cat ears and a tail, e-girl, grunge, witchy, techwear, dark academia, business and comfy), then change any piece: jackets, skirts, tights, shoes, hats, bags, glasses. Faces have more to them too: eye shapes and eye colors, fangs and little tongues, blush, lipstick, freckles, stickers and piercings, plus skin and ears. A few residents already tried the new styles, and now and then someone swaps a piece on their own.', 'look studio');
}
