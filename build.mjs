// Builds the single-file game (index.html) from src/.
//   node build.mjs           build index.html and version.json
//   node build.mjs --check   make sure the script parses first, and only write if it does
//   node build.mjs --watch   rebuild (with the check) whenever something in src/ changes
//
// Every file in src/js is part of ONE script. They are joined in filename
// order (000, 010, 020, ...) inside a single function, so they all share one
// scope: a name declared at the top of one file is visible in every file.
// That also means two files can't both declare the same top-level name.
//
// version.json holds a short fingerprint of the build. The game compares it
// with its own (BUILD_ID in 745-auto-update.js) and reloads when they differ,
// so publishing a new build updates the box by itself.
import { readFileSync, writeFileSync, readdirSync, watch } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'index.html');
const VERSION = join(ROOT, 'version.json');
const STAMP = "const BUILD_ID = '@@BUILD@@';";
const META = '<meta name="glimmer-build" content="@@BUILD@@">';

export function build({ checkFirst = false } = {}) {
  const template = readFileSync(join(SRC, 'index.html'), 'utf8');
  const css = readFileSync(join(SRC, 'styles.css'), 'utf8');
  const files = readdirSync(join(SRC, 'js')).filter((f) => f.endsWith('.js')).sort();
  const js = files.map((f) => readFileSync(join(SRC, 'js', f), 'utf8')).join('');
  if (!template.includes('/*@@CSS@@*/') || !template.includes('//@@JS@@\n')) throw new Error('src/index.html lost its /*@@CSS@@*/ or //@@JS@@ marker');
  let html = template.replace('/*@@CSS@@*/', () => css).replace('//@@JS@@\n', () => js);
  if (html.split(STAMP).length !== 2) throw new Error(`expected exactly one ${STAMP} in src/js`);
  if (html.split(META).length !== 2) throw new Error(`expected exactly one ${META} in src/index.html`);
  const id = createHash('sha256').update(html).digest('hex').slice(0, 10);
  html = html.replace(STAMP, () => `const BUILD_ID = '${id}';`).replace(META, () => `<meta name="glimmer-build" content="${id}">`);
  if (checkFirst) check(html);
  writeFileSync(OUT, html);
  writeFileSync(VERSION, JSON.stringify({ build: id }) + '\n');
  return { html, files, id };
}

// find the main inline script and parse it without running it
export function check(html) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const main = scripts.sort((a, b) => b.length - a.length)[0];
  try { new Function(main); } catch (e) {
    const m = String(e.stack).match(/<anonymous>:(\d+)/);
    throw new Error(`The game script doesn't parse: ${e.message}${m ? ` (around line ${m[1]} of the built script)` : ''}`);
  }
  const dupes = topLevelDuplicates();
  if (dupes.length) throw new Error(`These names are declared at the top level of more than one file:\n${dupes.join('\n')}`);
}
function topLevelDuplicates() {
  const seen = new Map(), out = [];
  for (const f of readdirSync(join(SRC, 'js')).filter((x) => x.endsWith('.js')).sort()) {
    for (const line of readFileSync(join(SRC, 'js', f), 'utf8').split('\n')) {
      const m = line.match(/^(?:const|let|var|function|async function|class)\s+([A-Za-z_$][\w$]*)/);
      if (!m) continue;
      if (seen.has(m[1]) && seen.get(m[1]) !== f) out.push(`  ${m[1]}: ${seen.get(m[1])} and ${f}`);
      else seen.set(m[1], f);
    }
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const careful = process.argv.includes('--check') || process.argv.includes('--watch');
  const run = () => {
    const t0 = Date.now();
    const { html, files, id } = build({ checkFirst: careful });
    console.log(`built index.html from ${files.length} files (${(html.length / 1024).toFixed(0)} KB, build ${id}) in ${Date.now() - t0} ms`);
  };
  try { run(); } catch (e) { console.error(e.message); if (!process.argv.includes('--watch')) process.exit(1); }
  if (process.argv.includes('--watch')) {
    console.log('watching src/ ...');
    let t = null;
    watch(SRC, { recursive: true }, () => { clearTimeout(t); t = setTimeout(() => { try { run(); } catch (e) { console.error(e.message); } }, 150); });
  }
}
