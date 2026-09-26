// node tests/music.mjs
// The music starts by itself where the browser allows it, and the playlists deal out
// different songs. (Playwright's page.evaluate counts as a tap, so the "tap for music"
// case can't be tested headless.)
import { openGame } from './lib.mjs';

let failed = 0;
const ok = (cond, what) => { console.log(`${cond ? '  ok ' : ' FAIL'}  ${what}`); if (!cond) failed++; };
const t0 = Date.now();

// a browser that allows sound without a tap (like the page after a reload): music plays on its own
{
  const { browser, page, E, errors } = await openGame({ args: ['--autoplay-policy=no-user-gesture-required'] });
  try {
    await page.waitForTimeout(3000);
    ok(/^♪ /.test(await page.textContent('#np')), 'music starts at boot with no tap');
    const titles = await E(`(() => { const out = new Set(); for (let i = 0; i < 12; i++) out.add(applyCmd({ t: 'skip' })); return [...out]; })()`);
    ok(titles.length >= 6 && titles.every((t) => /^♪ Now playing: /.test(t)), 'skipping deals out different songs');
    ok(titles.every((t, i) => i === 0 || t !== titles[i - 1]), 'no song plays twice in a row');
    ok(errors.length === 0, 'no errors on the page' + (errors.length ? ': ' + errors.join(' / ') : ''));
  } finally { await browser.close(); }
}

console.log(failed ? `\n${failed} failed` : `\nall good (${Math.round((Date.now() - t0) / 1000)} s)`);
process.exit(failed ? 1 : 0);
