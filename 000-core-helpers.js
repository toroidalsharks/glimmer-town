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
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

