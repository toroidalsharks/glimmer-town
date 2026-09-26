const $ = (s) => document.querySelector(s);
const rand = Math.random;
const pick = (a) => a[Math.floor(rand() * a.length)];
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const d2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const a_an = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
const uid = () => Math.random().toString(36).slice(2, 10);
// shorten a spoken line without cutting a word or sentence in half
function fitLine(text, max) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max), end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (end > max * 0.5) return cut.slice(0, end + 1);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.5 ? cut.slice(0, sp) : cut).replace(/[\s,;:—-]+$/, '') + '…';
}
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

