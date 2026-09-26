// ============================================================
// AUTO-UPDATE: when a newer build is published, the box and the
// remote save and reload themselves at a quiet moment, so nobody
// has to change ?v= by hand. build.mjs stamps BUILD_ID and writes
// version.json next to index.html.
// ============================================================
const BUILD_ID = '@@BUILD@@';
const UPDATE_KEY = 'glimmer-update';
// on the local dev server, check every few seconds so saving a file reloads the page
const updateLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
function updateQuiet() {
  if (CUT.live || CUT.queue.length || sheetBusy() || CUT.userBusy()) return false;
  if (fishing && fishing.running) return false;
  return true;
}
async function checkForUpdate() {
  if (location.protocol === 'file:' || BUILD_ID.startsWith('@@') || navigator.onLine === false) return;
  let latest = null;
  try {
    const r = await fetch(new URL('version.json', location.href).href.split('?')[0] + '?t=' + Date.now(), { cache: 'no-store' });
    if (r.ok) latest = String((await r.json()).build || '');
  } catch (e) { return; }
  if (!latest || latest === BUILD_ID) return;
  // version.json only says something changed. Before reloading, make sure the published page
  // really is a different build: if version.json and index.html were uploaded out of step,
  // reloading would just bring back this same page, over and over.
  let ignore = {};
  try { ignore = JSON.parse(localStorage.getItem(UPDATE_KEY + '-ignore') || '{}'); } catch (e) {}
  if (ignore.build === latest && Date.now() - ignore.at < 6 * 3600e3) return;
  let pageBuild = null;
  try {
    const u = new URL(location.href); u.search = ''; u.hash = ''; u.searchParams.set('t', Date.now());
    const r = await fetch(u.href, { cache: 'no-store', headers: { Range: 'bytes=0-4095' } });
    const head = (await r.text()).slice(0, 8000);
    pageBuild = (head.match(/<meta name="glimmer-build" content="([^"]+)"/) || [])[1] || null;
  } catch (e) { return; }
  if (!pageBuild || pageBuild === BUILD_ID) { try { localStorage.setItem(UPDATE_KEY + '-ignore', JSON.stringify({ build: latest, at: Date.now() })); } catch (e) {} return; }
  latest = pageBuild;
  // the page itself can lag behind version.json on the CDN; don't chase the same build in a loop
  let tried = {};
  try { tried = JSON.parse(localStorage.getItem(UPDATE_KEY) || '{}'); } catch (e) {}
  if (tried.build === latest && Date.now() - tried.at < 30 * 60e3) return;
  if (checkForUpdate.pending) return;
  checkForUpdate.pending = true;
  const go = async () => {
    if (!updateQuiet()) { setTimeout(go, 20e3); return; }
    try { localStorage.setItem(UPDATE_KEY, JSON.stringify({ build: latest, at: Date.now() })); } catch (e) {}
    toast('✨ A new version of the island just arrived. Reloading…');
    if (MODE === 'host') { try { await saveNow(); } catch (e) {} }
    setTimeout(() => { const u = new URL(location.href); u.searchParams.set('v', latest); location.replace(u.href); }, updateLocal ? 300 : 1800);
  };
  go();
}
function startUpdateChecks() {
  if (location.protocol === 'file:') return;
  setTimeout(checkForUpdate, updateLocal ? 3e3 : 60e3);
  setInterval(checkForUpdate, updateLocal ? 3e3 : 10 * 60e3);
}

