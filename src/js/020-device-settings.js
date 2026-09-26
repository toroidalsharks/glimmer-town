// ============================================================
// SETTINGS (per device)
// ============================================================
const cfg = { daySec: 300, spin: true, follow: true, shadows: true, boxMode: false, mirror: false, music: true, sfx: true, voices: true, volume: 0.7, cute: true, cutscenes: true };
function loadPrefs() { try { Object.assign(cfg, JSON.parse(localStorage.getItem(SAVE_KEY + '-prefs') || '{}')); } catch (e) {} }
function savePrefs() { try { localStorage.setItem(SAVE_KEY + '-prefs', JSON.stringify(cfg)); } catch (e) {} }
const ts = () => clamp(cfg.daySec / 300, 0.35, 4);
const ISLES = {
  isle1: { name: 'Glimmer Town', apt: 'Glimmer Apartments', doc: 'town', grass: '#9ce07a', save: SAVE_KEY },
  isle2: { name: 'Driftwood Bay', apt: 'Driftwood Apartments', doc: 'town2', grass: '#c9dc8c', save: SAVE_KEY + '-isle2' },
};
const ISLE = /isle2/.test(location.hash) ? 'isle2' : 'isle1', OTHER = ISLE === 'isle1' ? 'isle2' : 'isle1', ISL = ISLES[ISLE];
const STATE_DOC = ISL.doc + '/state', HOST_DOC = ISL.doc + '/host';
const DEVICE = (() => { try { let d = localStorage.getItem('glimmer-device'); if (!d) { d = 'dev-' + uid(); localStorage.setItem('glimmer-device', d); } return d; } catch (e) { return 'dev-' + uid(); } })();

