// node tests/town-files.mjs
// A town saved to a file on one device opens on another (two browsers, so two separate storages),
// with its residents, its day and its text archive, and the town it replaced can be brought back.
import { openGame, OUT } from './lib.mjs';
import { join } from 'node:path';

let failed = 0;
const ok = (cond, what) => { console.log(`${cond ? '  ok ' : ' FAIL'}  ${what}`); if (!cond) failed++; };
const t0 = Date.now();
const file = join(OUT, 'town-file-test.json');
const settings = `(() => { activeTab = 'box'; openSheet(); refreshPanel(true); })()`;
let first = null;

// the old phone: save the town to a file
{
  const { browser, page, E, errors } = await openGame();
  try {
    await E(`(() => { W.day = 37; W.people[0].name = 'Spaghetti'; archiveText({ id: 'tf-test', from: W.people[1].id, to: 'creator', text: 'did you drop your phone in sauce', day: W.day, t: 0.5 }); })()`);
    await page.waitForTimeout(1200);
    first = await E(`({ names: W.people.map((p) => p.name).join(','), n: W.people.length })`);
    await E(settings);
    ok(/only saved on this device/.test(await page.textContent('#townFileBox')), 'without sync, Settings says the town only lives on this device');
    await E(`brainCfg.key = 'sk-or-v1-' + 'a'.repeat(64)`);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#tfSave')]);
    await E(`brainCfg.key = ''`);
    await dl.saveAs(file);
    const f = JSON.parse(await (await import('node:fs')).promises.readFile(file, 'utf8'));
    ok(f.glimmerTownFile === 1 && f.world.day === 37 && f.world.people[0].name === 'Spaghetti', 'the file holds the town');
    ok(f.texts.some((r) => r.id === 'tf-test'), 'the file holds the text archive');
    ok(!JSON.stringify(f).includes('sk-or-'), 'the file never holds an OpenRouter key');
    await page.screenshot({ path: join(OUT, 'town-files-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await E(settings); await E(`$('#townFileBox').scrollIntoView()`);
    await page.screenshot({ path: join(OUT, 'town-files-phone.png') });
    ok(errors.length === 0, 'no errors on the first device' + (errors.length ? ': ' + errors.join(' / ') : ''));
  } finally { await browser.close(); }
}

// the iPad: open the file, then bring the old town back
{
  const { browser, page, E, errors } = await openGame({ width: 820, height: 1180 });
  try {
    const before = await E(`W.people.map((p) => p.name).join(',')`);
    await E(settings);
    page.on('dialog', (d) => d.accept());
    await Promise.all([page.waitForEvent('load', { timeout: 60000 }), page.setInputFiles('#tfPick', file)]);
    await page.waitForFunction(() => window.__g && window.__g.ev('!!W && W.people.length > 0 && typeof camera !== "undefined"'), null, { timeout: 60000 });
    const got = await E(`({ names: W.people.map((p) => p.name).join(','), day: W.day })`);
    ok(got.day === 37 && got.names.startsWith('Spaghetti'), 'the other device opens the town from the file');
    ok(await E(`townFileAll().then((r) => r.some((x) => x.id === 'tf-test'))`), 'the texts came along');
    await page.waitForTimeout(25000); // a few autosaves must not undo it
    await page.reload();
    await page.waitForFunction(() => window.__g && window.__g.ev('!!W && W.people.length > 0 && typeof camera !== "undefined"'), null, { timeout: 60000 });
    ok(await E(`W.people[0].name === 'Spaghetti' && W.day === 37`), 'the opened town is still there after a reload');
    await E(settings);
    ok(!!(await page.$('#tfBack')), 'Settings offers to bring back the town from before');
    await Promise.all([page.waitForEvent('load', { timeout: 60000 }), page.click('#tfBack')]);
    await page.waitForFunction(() => window.__g && window.__g.ev('!!W && W.people.length > 0 && typeof camera !== "undefined"'), null, { timeout: 60000 });
    ok(await E(`W.people.map((p) => p.name).join(',')`) === before, 'the earlier town comes back');
    ok(errors.length === 0, 'no errors on the second device' + (errors.length ? ': ' + errors.join(' / ') : ''));
  } finally { await browser.close(); }
}

console.log(failed ? `\n${failed} failed` : `\nall good (${Math.round((Date.now() - t0) / 1000)} s)`);
process.exit(failed ? 1 : 0);
