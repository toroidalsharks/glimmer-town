// ============================================================
// MEMORY & DIARY
// ============================================================
function remember(p, text, weight = 1, tag = 'misc', who = null, meta = null) {
  p.today.push({ text, weight, tag, who, meta });
  if (p.today.length > 40) p.today.shift();
}
function diary(text) {
  W.log.push({ day: W.day, text });
  if (typeof notifyWatch === 'function') { try { notifyWatch(text); } catch (e) {} }
  if (W.log.length > 220) W.log.splice(0, W.log.length - 220);
  markDirty();
}

