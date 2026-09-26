// Shared setup for the tests: opens the built index.html in headless Chromium
// with the game's debug handle (window.__g), which only exists over file://.
import { chromium } from 'playwright';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = join(ROOT, 'tests', 'out');
mkdirSync(OUT, { recursive: true });

export async function openGame({ gfx = 'lite', width = 900, height = 600, prefs = {} } = {}) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const ctx = await browser.newContext();
  await ctx.addInitScript((p) => { try { if (!localStorage.getItem('glimmer-town-v3-prefs')) localStorage.setItem('glimmer-town-v3-prefs', JSON.stringify(p)); } catch (e) {} }, { gfx, spin: false, ...prefs });
  // serve three.js from node_modules when it's installed, so tests work offline
  const three = join(ROOT, 'node_modules', 'three');
  if (existsSync(three)) await ctx.route('**/three@0.147.0/**', (r) => r.fulfill({ body: readFileSync(three + new URL(r.request().url()).pathname.split('three@0.147.0')[1]), contentType: 'application/javascript' }));
  await ctx.route('**/fonts.googleapis.com/**', (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  // never talk to real services from a test
  await ctx.route(/openrouter|firebaseio|wikipedia|algolia|mastodon|ntfy/, (r) => r.fulfill({ contentType: 'application/json', body: '{}' }));

  const page = await ctx.newPage();
  await page.setViewportSize({ width, height });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  // GAME=path/to/other.html tests another build, e.g. an older version
  await page.goto(pathToFileURL(process.env.GAME || join(ROOT, 'index.html')).href);
  await page.waitForFunction(() => window.__g && window.__g.ev('typeof W !== "undefined" && W.people.length > 0 && typeof camera !== "undefined"'), null, { timeout: 60000 });
  await page.waitForTimeout(1500);

  const E = (code) => page.evaluate((c) => window.__g.ev(c), code);

  // advance whatever cutscene is playing, one line at a time, until it ends or waits for a choice
  // returns 'wait' (a choice is showing), 'end', 'none', or the line it stopped on
  const cutStep = async (max = 60, log = () => {}) => {
    let st = 'none';
    for (let i = 0; i < max; i++) {
      st = await E(`(() => { if (!CUT.live) return 'none'; if (now < CUT.live.titleUntil) { CUT.live.titleUntil = now; return 'title'; } if (CUT.waiting) return 'wait'; const L = CUT.live.lines[CUT.i]; if (L) CUT.typed = (L.text || '').length; cutLine(CUT.i + 1); const M = CUT.live && CUT.live.lines[CUT.i]; return M ? ((M.fx || '') + '|' + (cutSpeaker(M).name || '') + ': ' + (M.text || '')).slice(0, 110) : 'end'; })()`);
      log(st);
      if (st === 'wait' || st === 'none' || st === 'end') return st;
      if (i < max - 1) await page.waitForTimeout(120);
    }
    return st;
  };

  return { browser, page, E, errors, cutStep };
}
