// ============================================================
// TOWN FILES: save the town to a file and open it on another device
// ============================================================
// Without sync the town only lives in this browser, so a lost phone loses it. A town file carries
// the world, the lines residents have already said, and the whole text archive. It never carries
// the OpenRouter key or the sync settings. Opening a file replaces the town on this device; the
// town it replaces is kept aside under BEFORE_FILE_KEY and can be brought back from Settings.
const BEFORE_FILE_KEY = ISL.save + '-before-file';
let townFileBusy = false, townFileSwapping = false, townFileLink = '', onlineSavedAt = 0;
function townFileName() {
  const d = new Date(), pad = (n) => String(n).padStart(2, '0');
  return `${ISL.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-day${W.day}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}
function townFileAll() {
  return txaOpen().then((db) => new Promise((res) => {
    if (!db) return res([]);
    try { const rq = db.transaction('texts').objectStore('texts').getAll(); rq.onsuccess = () => res(rq.result || []); rq.onerror = () => res([]); } catch (e) { res([]); }
  }));
}
async function townFileMake() {
  W.lastReal = Date.now();
  const world = serialize(); world.pairCool = {}; world.meeting = null;
  let voices = null; try { voices = localStorage.getItem(VOICE_KEY); } catch (e) {}
  const out = { glimmerTownFile: 1, isle: ISLE, name: ISL.name, savedAt: Date.now(), world, voices, texts: await townFileAll() };
  return new File([JSON.stringify(out)], townFileName(), { type: 'application/json' });
}
async function townFileSave() {
  if (MODE !== 'host' || !W || townFileBusy) return;
  townFileBusy = true;
  try {
    const file = await townFileMake();
    // phones and tablets get the share sheet (Save to Files, AirDrop); computers download it
    const touch = matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: ISL.name }); toast('Town file ready. Open it on your other device from Settings.'); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    // a share sheet that needs a fresh tap, or no share sheet: hand over a plain link to tap
    if (townFileLink) URL.revokeObjectURL(townFileLink);
    townFileLink = URL.createObjectURL(file);
    const a = document.createElement('a'); a.href = townFileLink; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
    renderTownFiles(file.name);
  } catch (e) { console.error('town file', e); toast('The town file could not be made. Try again?'); }
  finally { townFileBusy = false; }
}
function townFileRead(text) {
  let f = null; try { f = JSON.parse(text); } catch (e) {}
  if (f && f.glimmerTownFile) return { world: readSave(f.world), voices: f.voices || null, texts: Array.isArray(f.texts) ? f.texts : null, name: f.name };
  // a bare save (what localStorage holds) opens too
  return { world: readSave(f), voices: null, texts: null, name: '' };
}
async function townFileTexts(rows) {
  const db = await txaOpen(); if (!db) return;
  await new Promise((res) => {
    try {
      const tx = db.transaction('texts', 'readwrite'), st = tx.objectStore('texts');
      st.clear(); for (const r of rows) if (r && r.seq && r.id) { const a = st.put(r); a.onerror = (e) => { e.preventDefault(); e.stopPropagation(); }; }
      tx.oncomplete = res; tx.onerror = res; tx.onabort = res;
    } catch (e) { res(); }
  });
}
// replaces the town here with f.world and reloads; keepOld puts the current town aside first
async function townFileUse(f, keepOld) {
  const s = f.world; s.lastReal = Date.now();
  townFileSwapping = true; // the running town must not save over the one coming in
  if (keepOld) { try { const cur = localStorage.getItem(ISL.save); if (cur) localStorage.setItem(BEFORE_FILE_KEY, cur); } catch (e) {} }
  try { localStorage.setItem(ISL.save, JSON.stringify(s)); }
  catch (e) { toast('This device is out of room for the town. Free some space and try again.'); setTimeout(() => location.reload(), 3000); return; }
  if (f.voices) { try { localStorage.setItem(VOICE_KEY, f.voices); } catch (e) {} }
  if (f.texts) await townFileTexts(f.texts);
  // the online copy has to match, or the next load would pick whichever is newer
  if (RT.db) { try { await Promise.race([RT.db.doc(STATE_DOC).set({ v: 3, savedAt: Date.now(), host: DEVICE, world: trimForSize(JSON.parse(JSON.stringify(s))) }), sleep(15000)]); } catch (e) {} }
  toast('Opening the town…'); setTimeout(() => location.reload(), 600);
}
async function townFileOpen(file) {
  if (!file || MODE !== 'host') return;
  let text = ''; try { text = await file.text(); } catch (e) {}
  const f = townFileRead(text);
  if (!f.world) { toast('That file isn\'t a Glimmer Town save.'); return; }
  const who = f.world.people.length;
  if (!confirm(`Open ${f.name || 'this town'} from day ${f.world.day}, with ${who} ${who === 1 ? 'resident' : 'residents'}? It replaces the town on this device. The town here now is kept aside, and you can bring it back from Settings.`)) return;
  townFileUse(f, true);
}
function townFileBack() {
  let raw = null; try { raw = localStorage.getItem(BEFORE_FILE_KEY); } catch (e) {}
  const s = readSave(raw); if (!s) return;
  if (!confirm(`Bring back the town from before you opened a file (day ${s.day})? The town here now is replaced.`)) return;
  try { localStorage.removeItem(BEFORE_FILE_KEY); } catch (e) {}
  townFileUse({ world: s }, false);
}
function townFileAgo(t) {
  const s = Math.round((Date.now() - t) / 1000);
  return s < 60 ? 'a few seconds ago' : s < 3600 ? plural(Math.round(s / 60), 'minute') + ' ago' : 'over an hour ago';
}
function renderTownFiles(madeName) {
  const el = $('#townFileBox'); if (!el) return;
  if (MODE === 'remote') { el.innerHTML = '<p class="label">Your town on other devices</p><p class="hint">Town files are saved and opened on the device that runs the town.</p>'; return; }
  let before = null; try { before = readSave(localStorage.getItem(BEFORE_FILE_KEY)); } catch (e) {}
  const where = RT.db
    ? (onlineSavedAt ? `Saved online ${townFileAgo(onlineSavedAt)}.` : 'Sync is on, so the town is saved online every 20 seconds.') + ' Open your box link on another device and it carries on from there.'
    : 'This town is only saved on this device. Turn on Sync between devices below to keep it online, or save it to a file now and then.';
  el.innerHTML = `<p class="label">Your town on other devices</p>
    <p class="status">${esc(where)}</p>
    <div class="btns"><button class="btn gold" type="button" id="tfSave">Save town to a file</button><button class="btn" type="button" id="tfOpen">Open a town file</button>${before ? `<button class="btn" type="button" id="tfBack">Bring back the earlier town (day ${before.day})</button>` : ''}</div>
    <input type="file" id="tfPick" accept=".json,application/json" hidden>
    ${madeName && townFileLink ? `<p class="hint">If nothing downloaded, <a style="color:inherit" href="${townFileLink}" download="${esc(madeName)}">tap here for ${esc(madeName)}</a>.</p>` : ''}
    <p class="hint">On an iPhone or iPad, pick Save to Files (iCloud Drive) or AirDrop. On the other device, open the game, tap Open a town file and choose it. The file holds everyone, their memories and every text, but never your OpenRouter key, so add that in Settings there.</p>`;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'tfSave') townFileSave();
  if (b.id === 'tfOpen') $('#tfPick')?.click();
  if (b.id === 'tfBack') townFileBack();
});
document.addEventListener('change', (e) => { if (e.target.id === 'tfPick') { const f = e.target.files?.[0]; e.target.value = ''; townFileOpen(f); } });
function townFilesBoot() {
  W.added = W.added || {}; if (W.added.townFiles1) return; W.added.townFiles1 = true;
  if (typeof logUpdate === 'function') logUpdate('build', 'You can save the whole town to a file now (Settings, Your town on other devices) and open it on another phone, an iPad or a computer. Everyone comes along with their memories and every text. Your OpenRouter key stays out of the file.', 'town files');
}
