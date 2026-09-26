// npm run dev
// Builds the game, serves it at http://localhost:8080, and rebuilds whenever
// something in src/ changes. It also prints this computer's Wi-Fi address so
// you can open the same page on the box's phone while you work.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, watch } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../build.mjs';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const PORT = Number(process.env.PORT) || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

function rebuild() {
  const t0 = Date.now();
  // the page on your screen reloads itself within a few seconds of a good build;
  // a build that doesn't parse is never written, so the page keeps the last good one
  try { const { files } = build({ checkFirst: true }); console.log(`rebuilt from ${files.length} files in ${Date.now() - t0} ms`); }
  catch (e) { console.error('\n  BUILD PROBLEM: ' + e.message + '\n'); }
}
rebuild();
let timer = null;
watch(join(ROOT, 'src'), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(rebuild, 150); });

createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(file));
}).listen(PORT, () => {
  console.log(`\nGlimmer Town is at http://localhost:${PORT}`);
  for (const list of Object.values(networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) console.log(`on the phone (same Wi-Fi): http://${a.address}:${PORT}`);
  console.log('edit anything in src/ and reload the page.\n');
});
