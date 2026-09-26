// ============================================================
// v25 glue: the cell and Judge Hoot in the everyday courtroom,
// the verdict prompt on the remote, first-run notes
// ============================================================
function hallCell(S) {
  courtOwl = owlMesh(); courtOwl.position.set(0, 1.35, -3.6); S.add(courtOwl);
  const bars = new T3.Group(), mat = toon('#5a5470');
  for (let i = 0; i < 7; i++) bars.add(mesh(cyl(0.035, 0.035, 2.6, 6), mat, 3.0 + i * 0.25, 1.3, -2.55));
  for (let i = 0; i < 5; i++) bars.add(mesh(cyl(0.035, 0.035, 2.6, 6), mat, 3.0, 1.3, -2.55 - i * 0.3));
  bars.add(mesh(box(1.7, 0.08, 0.08), mat, 3.75, 2.6, -2.55)); bars.add(mesh(box(1.7, 0.08, 0.08), mat, 3.75, 0.3, -2.55));
  S.add(bars); S.add(mesh(box(1.4, 0.3, 0.6), toon('#8a84a8'), 3.8, 0.15, -3.6));
  jailedPeople().slice(0, 2).forEach((p, i) => addPerson(S, p, ...COURT_POS.cell[i], -0.8));
}
function cutChoiceHtml() {
  const c = W.cutLive; if (!c || !c.options) return '';
  return `<div class="creator" style="border-color:#ffd36b"><h3>🎬 ${esc(c.title || 'A scene is playing')}</h3><p>${esc(c.prompt || 'The court is waiting for you.')}</p>
    <div class="btns">${c.options.map(([k, l]) => `<button class="btn gold" type="button" data-cutpick="${esc(k)}">${esc(l)}</button>`).join('')}</div></div>`;
}
function v25Boot() {
  W.added = W.added || {}; if (W.added.v25) return; W.added.v25 = true;
  { const S = crimeState(), yr = Math.floor((W.day - 1) / YEAR); S.murderYear[yr] = { day: Math.max(W.day + 4, yr * YEAR + 9 + Math.floor(rand() * 14)), done: false }; S.lastSerious = W.day; S.lastPetty = W.day - 1; }
  if (typeof logUpdate === 'function') logUpdate('build', "Big moments play as scenes now. Court cases are real trials: Judge Hoot (an owl, very serious) runs the room, lawyers object, witnesses crack, and you rule at the end or leave it to the jury. Weddings, engagements, babies and divorces get their own scenes too. I also added crime. Petty stuff, serious stuff, and once a year, a murder. Every crime leaves clues that match real residents, so you can work out who did it from the Court tab. Some people will get away with things. Some innocent people will get convicted. The truth usually comes out.", 'trials, crimes and cutscenes');
}

function closeFishing() { fishing = null; $('#fishBox').hidden = true; }

// photos
function loadAlbum() { try { return JSON.parse(localStorage.getItem('glimmer-album') || '[]'); } catch (e) { return []; } }
function saveAlbum(a) { while (a.length) { try { localStorage.setItem('glimmer-album', JSON.stringify(a)); return true; } catch (e) { a.pop(); } } return false; }
function clockText() { const hr = (6 + W.t * 24) % 24, hh = Math.floor(hr), mm = Math.floor((hr - hh) * 60 / 15) * 15; return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'}`; }
function takePhoto() {
  const src = renderer.domElement, c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0);
  const place = interior ? (interior.kind === 'room' ? `${person(interior.id)?.name || 'someone'}'s room` : TOWN[interior.shop]?.name || 'a shop') : ISL.name;
  const label = `${place} · Day ${W.day} · ${clockText()}`, fs = Math.max(14, Math.round(c.height * 0.026));
  g.font = `${fs}px "Mochiy Pop One", "Arial Rounded MT Bold", sans-serif`;
  const w = g.measureText(label).width + fs * 1.4, h = fs * 1.9, x = fs * 0.8, y = c.height - h - fs * 0.8;
  g.fillStyle = 'rgba(13,19,48,.72)'; g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, h / 2) : g.rect(x, y, w, h); g.fill();
  g.fillStyle = '#fff6d6'; g.textBaseline = 'middle'; g.fillText(label, x + fs * 0.7, y + h / 2);
  const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = `glimmer-day${W.day}-${Date.now() % 100000}.png`; document.body.appendChild(a); a.click(); a.remove();
  const tw = 360, th = Math.round(c.height * tw / c.width), t = document.createElement('canvas'); t.width = tw; t.height = th;
  t.getContext('2d').drawImage(c, 0, 0, tw, th);
  const album = loadAlbum(); album.unshift({ day: W.day, label, src: t.toDataURL('image/jpeg', 0.72) }); saveAlbum(album.slice(0, 16)); albumVer++;
  const fl = $('#flash'); fl.style.transition = 'none'; fl.style.opacity = 0.9; requestAnimationFrame(() => { fl.style.transition = 'opacity .6s'; fl.style.opacity = 0; });
  Sound.shutter();
  if (!interior) { const near = W.people.filter((p) => !p.inside && p.state === 'free' && Math.hypot(p.x - controls.target.x, p.z - controls.target.z) < 12); if (near.length) bubble(pick(near), pick(['Cheese!', 'Wait, were my eyes closed?', 'Get my good side!', '✌️', 'Did someone just take a picture?']), 2.4); }
  toast('Photo saved. It is in the Diary too.');
}
let albumShown = -1;
function renderAlbum() {
  const wrap = $('#albumWrap'); if (!wrap || albumShown === albumVer) return;
  albumShown = albumVer;
  const album = loadAlbum();
  wrap.innerHTML = album.length ? `<p class="label">Photos</p><div class="album">${album.map((ph, i) => `<a href="${ph.src}" download="glimmer-day${ph.day}-${i}.jpg" title="${esc(ph.label || '')}"><img src="${ph.src}" alt="${esc(ph.label || `Photo from day ${ph.day}`)}"></a>`).join('')}</div><div class="btns"><button class="btn warn" type="button" data-clearalbum>Clear photos</button></div>` : '<p class="hint">Tap 📷 to take a photo of the town. They show up here.</p>';
}

