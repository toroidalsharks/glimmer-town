# Glimmer Town

A tiny town of AI residents that lives inside a hologram box. They make friends, fall in love, get jobs, get sick, commit crimes, stand trial, read books, text each other, and keep living while the box is off. You are the Creator. A second phone works as the remote.

The game is one HTML page. It runs on an old phone with Three.js r147 from a CDN and nothing else. This repo holds the source for that page, split into small files, plus the tools that build and test it.

## Folder map

```
index.html              the built game (this is what GitHub Pages serves)
version.json            the build's fingerprint; the game checks it to update itself
build.mjs               joins src/ into index.html
src/
  index.html            the page skeleton, with two markers where CSS and JS go
  styles.css            all the styling
  js/                   the game, one file per system, run in filename order
    000-core-helpers.js
    010-data.js         ...
    560-assets.gen.js   Blender models (generated, don't edit)
    ...
    745-auto-update.js  reloads the box and the remote when a new build is published
    750-boot.js         starts everything
tests/
  smoke.mjs             boots the game in a headless browser and runs a crime, a trial, a wedding
  update.mjs            checks that the game updates itself exactly once when a new build appears
  music.mjs             checks that music starts on its own and the playlists rotate
  look.mjs              takes screenshots of the town into tests/out/
tools/
  serve.mjs             local server that rebuilds as you edit
  blender/assets.py     models the trees, flowers, Judge Hoot etc. in Blender and writes 560-assets.gen.js
docs/
  HISTORY.md            what each version added
.github/workflows/
  pages.yml             builds and publishes the site on every push
```

## Making a change

1. Edit a file in `src/js/` (or `src/styles.css`).
2. Run `npm run build`. That rewrites `index.html` and `version.json`.
3. Commit the `src/` change together with the new `index.html` and `version.json`.

`npm run dev` is nicer while you work: it serves the game at http://localhost:8080, rebuilds every time you save, and the open page reloads itself a few seconds later. It also prints an address you can open on the box's phone over Wi-Fi.

`npm run check` builds and also makes sure the script parses and that no two files declare the same top-level name.

## How the files fit together

Every file in `src/js/` is part of one big script. The build glues them together in filename order inside a single function, so a name declared at the top of one file can be used in any other file. Two consequences:

- **Names must be unique.** Two files can't both have a top-level `const pick` or `function drawSky`. `npm run check` catches this.
- **Order matters for things that run right away.** Functions can be called from anywhere. A top-level `const` has to be defined in an earlier file if something uses it while the page loads.

The numbers go up in tens so a new file can slot in between two others. Something new about the courthouse could go in `595-appeals.js`, between trials and crime.

New systems usually hook in at boot (`750-boot.js`) with a one-time upgrade guarded by a flag, like `v25Boot()` in `630-v25-glue.js`. That way old saves pick up the new feature once.

## Playing it

GitHub Pages serves `index.html`. Every build also writes `version.json` with a short fingerprint. The box and the remote look at it every ten minutes, and when it changes they wait for a quiet moment (no scene playing, no panel in use), save, and reload onto the new build. You don't need to change `?v=` by hand anymore; the game does it.

Your OpenRouter key, Firebase URL and town code are typed into Settings on the box and stay in that phone's storage. They are never in this repo. Keep it that way: don't paste keys into any file here.

## Publishing

Nothing to set up. With Pages on **Deploy from a branch** (the usual setting), GitHub serves the committed `index.html` and `version.json`, so pushing a rebuilt game is enough.

The workflow in `.github/workflows/pages.yml` also builds the game on every push and fails loudly if it doesn't parse. If you switch **Settings → Pages → Source** to **GitHub Actions**, the same workflow publishes a fresh build from `src/` on every push, so a change pushed without rebuilding still goes live.

## Tests

```
npm install                      once; brings in Playwright and a local copy of three.js
npx playwright install chromium  once; the browser the tests drive
npm test                         build, check, play a crime and a trial headless, then test auto-update
npm run shots                    screenshots of the town, the courtroom and a cutscene in tests/out/
```

A run of `npm test` takes a minute or two and prints one line per thing it checked. Add `-v` (`node tests/smoke.mjs -v`) to see every line of dialogue as the scenes play.

The tests open the built file straight from disk, where the game exposes a debug helper (`window.__g`) for poking at the world. That helper doesn't exist on the real site.

## 3D models

`tools/blender/assets.py` builds the trees, palms, bushes, rocks, flowers, clouds, ghosts, Mochi, the crystal cat, Judge Hoot and the memorial in Blender, bakes shading into the vertex colors, and writes `src/js/560-assets.gen.js`. It needs Python 3.11 and `pip install bpy`. Then `npm run assets`.
