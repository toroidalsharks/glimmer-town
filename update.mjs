// Checks the auto-update: served over http, the page leaves itself alone
// while version.json matches, reloads once when a newer build shows up,
// and doesn't reload in a loop if the new page is slow to arrive.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib.mjs';

let fake = null; // when set, version.json claims this build
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  if (path === '/version.json') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(fake ? JSON.stringify({ build: fake }) : readFileSync(join(ROOT, 'version.json'))); }
  if (path === '/' || path === '/index.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(readFileSync(join(ROOT, 'index.html'))); }
  res.writeHead(404); res.end();
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/index.html`;

let failed = 0;
const ok = (cond, what) => { console.log(`${cond ? '  ok ' : ' FAIL'}  ${what}`); if (!cond) failed++; };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext();
await ctx.addInitScript(() => { try { localStorage.setItem('glimmer-town-v3-prefs', JSON.stringify({ gfx: 'lite', spin: false })); } catch (e) {} });
const three = join(ROOT, 'node_modules', 'three');
if (existsSync(three)) await ctx.route('**/three@0.147.0/**', (r) => r.fulfill({ body: readFileSync(three + new URL(r.request().url()).pathname.split('three@0.147.0')[1]), contentType: 'application/javascript' }));
await ctx.route('**/fonts.googleapis.com/**', (r) => r.fulfill({ body: '', contentType: 'text/css' }));
await ctx.route(/openrouter|firebaseio|wikipedia|algolia|mastodon|ntfy/, (r) => r.fulfill({ contentType: 'application/json', body: '{}' }));
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
const loads = []; page.on('framenavigated', (f) => { if (f === page.mainFrame()) loads.push(f.url()); });

await page.goto(base);
await page.waitForTimeout(12000);
ok(loads.length === 1, 'no reload while the published build matches');

fake = 'test-next';
await page.waitForURL(/[?&]v=test-next/, { timeout: 90000 }).catch(() => {});
ok(/[?&]v=test-next/.test(page.url()), 'reloads onto the new build when one is published');

const after = loads.length;
await page.waitForTimeout(15000);
ok(loads.length === after, "doesn't keep reloading while the new page is still on its way");
ok(errors.length === 0, 'no errors on the page' + (errors.length ? ': ' + errors.slice(0, 3).join(' / ') : ''));

await browser.close(); server.close();
process.exit(failed ? 1 : 0);
