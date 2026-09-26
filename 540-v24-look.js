// ============================================================
// v24 LOOK: soft storybook rendering. Materials, textures, water, sky,
// glow, depth blur and the quality ladder for older phones.
// ============================================================
const GFX_LEVELS = { auto: 'Auto', pretty: 'Pretty', balanced: 'Balanced', lite: 'Lite', classic: 'Classic (v23 look)' };
const gfxOn = () => (cfg.gfx || 'auto') !== 'classic';
const GFX = { level: 'pretty', post: false, dof: true, bloom: true, frames: [], slowFor: 0, t0: 0, auto: true, stepped: 0 };

// ---------- materials ----------
function makeToon(p) {
  if (!gfxOn()) return new T3.MeshToonMaterial(p);
  const q = { ...(p || {}) }; delete q.gradientMap;
  if (GFX.cheap) { delete q.roughness; delete q.metalness; delete q.envMapIntensity; delete q.envMap; return new T3.MeshLambertMaterial(q); }
  if (q.color === '#bfe8ff') return new T3.MeshStandardMaterial({ roughness: 0.18, metalness: 0.15, envMap: GFX.env || null, envMapIntensity: 1.2, ...q });
  return new T3.MeshStandardMaterial({ roughness: 0.8, metalness: 0, ...q });
}
function cachedMat(key, make) { let m = matCache.get(key); if (!m) { m = make(); matCache.set(key, m); } return m; }
// the residents: soft vinyl with a glossy coat and a rim of light
function vinyl(color, opts = {}) {
  if (!gfxOn()) return toon(color);
  const key = 'vinyl:' + color + ':' + (opts.kind || '');
  return cachedMat(key, () => {
    const cloth = opts.kind === 'cloth';
    if (GFX.cheap) { const m = new T3.MeshStandardMaterial({ color, roughness: cloth ? 0.8 : 0.45, metalness: 0 }); m.onBeforeCompile = rimHook; return m; }
    const m = new T3.MeshPhysicalMaterial({ color, roughness: cloth ? 0.72 : 0.42, metalness: 0, clearcoat: cloth ? 0.08 : 0.55, clearcoatRoughness: 0.35, sheen: cloth ? 0.6 : 0, sheenRoughness: 0.6, sheenColor: new T3.Color('#ffffff') });
    m.envMap = GFX.env || null; m.envMapIntensity = 0.55;
    m.onBeforeCompile = rimHook;
    return m;
  });
}
const RIM = { color: { value: new T3.Color('#ffd6f0') }, k: { value: 0.35 } };
function rimHook(sh) {
  sh.uniforms.uRimC = RIM.color; sh.uniforms.uRimK = RIM.k;
  sh.fragmentShader = 'uniform vec3 uRimC; uniform float uRimK;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  { float fr = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0); totalEmissiveRadiance += uRimC * pow(fr, 3.0) * uRimK; }');
}
function leafMat(color) {
  return cachedMat('leaf:' + color, () => { const m = makeToon({ color, vertexColors: true, roughness: 0.9 }); m.userData.leafOf = color; return m; });
}
function bakedMat(key, opts = {}) { return cachedMat('baked:' + key, () => makeToon({ color: '#ffffff', vertexColors: true, roughness: 0.85, ...opts })); }

// ---------- textures, painted at startup ----------
function periodicNoise(N, cells, seed) {
  const r = mulberry(seed), g = []; for (let i = 0; i < cells * cells; i++) g.push(r());
  const out = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const fx = (x / N) * cells, fy = (y / N) * cells, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const G = (a, b) => g[((b % cells) * cells) + (a % cells)];
    const a = G(ix, iy), b = G(ix + 1, iy), c = G(ix, iy + 1), d = G(ix + 1, iy + 1);
    out[y * N + x] = (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
  }
  return out;
}
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function texFrom(N, fill, repeat = true) {
  const c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), img = g.createImageData(N, N);
  fill(img.data, N, g);
  g.putImageData(img, 0, 0);
  const t = new T3.CanvasTexture(c); t.encoding = T3.LinearEncoding;
  if (repeat) t.wrapS = t.wrapT = T3.RepeatWrapping;
  t.anisotropy = Math.min(4, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
  return t;
}
// R: fine detail, G: large soft patches, B: tiny highlights
function paintGrass(d, N) {
  const big = periodicNoise(N, 4, 11), mid = periodicNoise(N, 16, 12), fine = periodicNoise(N, 64, 13), r = mulberry(5);
  for (let i = 0; i < N * N; i++) { d[i * 4] = 150 + (mid[i] - 0.5) * 70 + (fine[i] - 0.5) * 60; d[i * 4 + 1] = big[i] * 255; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255; }
  // little grass marks: short upside-down V strokes, lighter on one side
  for (let k = 0; k < 520; k++) {
    const cx = Math.floor(r() * N), cy = Math.floor(r() * N), light = r() < 0.6;
    for (let s = -3; s <= 3; s++) {
      const x = (cx + s + N) % N, y = (cy + Math.abs(s) - 3 + N) % N, j = (y * N + x) * 4;
      d[j] = light ? Math.min(255, d[j] + 70) : Math.max(0, d[j] - 55);
      if (light) d[j + 2] = 200;
    }
  }
}
function voronoi(N, cells, seed) {
  const r = mulberry(seed), pts = [];
  for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) pts.push([(x + 0.15 + r() * 0.7) / cells, (y + 0.15 + r() * 0.7) / cells, r()]);
  const f1 = new Float32Array(N * N), f2 = new Float32Array(N * N), id = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N, cx = Math.floor(u * cells), cy = Math.floor(v * cells); let a = 9, b = 9, ai = 0;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const gx = (cx + ox + cells) % cells, gy = (cy + oy + cells) % cells, p = pts[gy * cells + gx];
      let dx = p[0] - u, dy = p[1] - v; dx -= Math.round(dx); dy -= Math.round(dy);
      const dd = Math.hypot(dx, dy) * cells;
      if (dd < a) { b = a; a = dd; ai = p[2]; } else if (dd < b) b = dd;
    }
    f1[y * N + x] = a; f2[y * N + x] = b; id[y * N + x] = ai;
  }
  return { f1, f2, id };
}
function paintCobble(d, N) {
  const V = voronoi(N, 7, 21), fine = periodicNoise(N, 32, 22);
  for (let i = 0; i < N * N; i++) {
    const edge = V.f2[i] - V.f1[i], stone = Math.min(1, Math.max(0, (edge - 0.06) / 0.16));
    const dome = 1 - Math.min(1, V.f1[i] * 1.1) * 0.25;
    const v = (0.58 + 0.42 * stone) * (0.86 + 0.14 * V.id[i]) * dome * (0.94 + 0.12 * fine[i]);
    d[i * 4] = v * 255; d[i * 4 + 1] = 128; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255;
  }
}
function paintSand(d, N) {
  const n = periodicNoise(N, 32, 31), r = mulberry(32), m = periodicNoise(N, 6, 33);
  for (let i = 0; i < N * N; i++) { let v = 190 + (n[i] - 0.5) * 50 + (r() - 0.5) * 36; d[i * 4] = v; d[i * 4 + 1] = m[i] * 255; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255; }
}
function paintPlank(d, N) {
  const n = periodicNoise(N, 8, 41), grain = periodicNoise(N, 48, 42), r = mulberry(43), rows = 8, shade = [];
  for (let k = 0; k < rows; k++) shade.push(0.88 + r() * 0.16);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, row = Math.floor((y / N) * rows), fy = ((y / N) * rows) % 1;
    const gap = fy < 0.07 ? 0.55 : 1, knot = grain[(y * N + ((x * 3) % N))] * 0.12;
    const v = (0.78 + 0.18 * n[i] - knot) * shade[row] * gap;
    d[i * 4] = Math.min(255, v * 255); d[i * 4 + 1] = 128; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255;
  }
}
function paintShingle(d, N) {
  const rows = 8, cols = 6, n = periodicNoise(N, 16, 51);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, fy = (y / N) * rows, row = Math.floor(fy), ty = fy - row, off = (row % 2) * 0.5;
    const fx = (x / N) * cols + off, tx = fx - Math.floor(fx);
    const scallop = Math.sqrt(Math.max(0, 1 - Math.pow((tx - 0.5) * 2, 2))) * 0.45;
    const inside = ty < 0.55 + scallop;
    const v = inside ? 0.8 + 0.2 * (ty / (0.55 + scallop)) : 0.62;
    const edge = inside && ty > 0.5 + scallop ? 0.82 : 1;
    const vv = v * edge * (0.93 + 0.1 * n[i]) * (Math.abs(tx - 0.5) > 0.47 ? 0.8 : 1);
    d[i * 4] = vv * 255; d[i * 4 + 1] = 128; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255;
  }
}
function paintPlaster(d, N) {
  const n = periodicNoise(N, 24, 61), m = periodicNoise(N, 6, 62), r = mulberry(63);
  for (let i = 0; i < N * N; i++) { const v = 0.93 + 0.06 * n[i] + 0.04 * m[i] + (r() - 0.5) * 0.03; d[i * 4] = v * 255; d[i * 4 + 1] = 128; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255; }
}
function paintSoil(d, N) {
  const V = voronoi(N, 10, 71), n = periodicNoise(N, 32, 72);
  for (let i = 0; i < N * N; i++) { const v = 0.75 + 0.2 * n[i] + 0.12 * Math.min(1, (V.f2[i] - V.f1[i]) * 3); d[i * 4] = Math.min(255, v * 255); d[i * 4 + 1] = 128; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255; }
}
function radialTex(N, stops, gray = true) {
  // gray: the gradient lives in the color channels (for alpha maps and additive glows);
  // otherwise it is white with a fading alpha (for ordinary transparent sprites)
  const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  if (gray) { g.fillStyle = '#000'; g.fillRect(0, 0, N, N); }
  const gr = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
  for (const [o, a] of stops) gr.addColorStop(o, gray ? `rgb(${Math.round(a * 255)},${Math.round(a * 255)},${Math.round(a * 255)})` : `rgba(255,255,255,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, N, N);
  const t = new T3.CanvasTexture(c); t.encoding = T3.LinearEncoding; return t;
}
const TEX = {};
function gfxTextures() {
  if (TEX.grass) return TEX;
  TEX.grass = texFrom(256, paintGrass); TEX.cobble = texFrom(256, paintCobble); TEX.sand = texFrom(128, paintSand);
  TEX.plank = texFrom(128, paintPlank); TEX.shingle = texFrom(128, paintShingle); TEX.plaster = texFrom(128, paintPlaster); TEX.soil = texFrom(128, paintSoil);
  TEX.blob = radialTex(64, [[0, 1], [0.35, 0.7], [0.7, 0.22], [1, 0]]);
  TEX.glow = radialTex(64, [[0, 1], [0.15, 0.75], [0.45, 0.2], [0.75, 0.05], [1, 0]]);
  TEX.dot = radialTex(32, [[0, 1], [0.55, 0.95], [1, 0]], false);
  return TEX;
}
// a ground material whose texture follows world x/z, so paths, plazas and big
// pieces share one continuous pattern. lo/hi set how strong the detail is.
function worldMat(key, color, tex, scale = 0.25, lo = 0.8, hi = 1.12, patch = 0.14, extra = {}) {
  if (!gfxOn()) return toon(color);
  return cachedMat('world:' + key, () => {
    const m = makeToon({ color, map: tex, roughness: 0.92, ...extra });
    const U = { uS: { value: scale }, uLo: { value: lo }, uHi: { value: hi }, uP: { value: patch } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec2 vWxz; varying float vCamD;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vWxz = (modelMatrix * vec4(transformed, 1.0)).xz; vCamD = -mvPosition.z;');
      sh.fragmentShader = 'varying vec2 vWxz; varying float vCamD; uniform float uS, uLo, uHi, uP;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
  { vec2 q = vWxz * uS; vec4 t1 = texture2D(map, q); vec4 t1b = texture2D(map, mat2(0.8, -0.6, 0.6, 0.8) * q * 0.73 + vec2(0.21, 0.53));
    vec4 t2 = texture2D(map, vWxz * uS * 0.11 + vec2(0.37, 0.61));
    float fine = 1.0 - smoothstep(22.0, 55.0, vCamD);
    float f1 = mix(0.5, (t1.r + t1b.r) * 0.5, fine), f1b = mix(0.0, (t1.b + t1b.b) * 0.5, fine);
    float det = mix(uLo, uHi, f1 + (1.0 - fine) * 0.08) * mix(1.0 - uP, 1.0 + uP * 0.6, t2.g) + f1b * 0.06;
    diffuseColor.rgb *= det; }`);
    };
    m.customProgramCacheKey = () => 'worldMat';
    return m;
  });
}
function grassMat(lobe) {
  if (!gfxOn()) return toon(ISL.grass);
  return lobe ? worldMat('grassLobe', ISL.grass, gfxTextures().grass, 0.3, 0.82, 1.1, 0.16)
    : worldMat('grass', ISL.grass, gfxTextures().grass, 0.3, 0.82, 1.1, 0.16);
}
function pathMat() { return gfxOn() ? worldMat('cobble', '#f1e6d2', gfxTextures().cobble, 0.34, 0.72, 1.06, 0.06) : toon('#efe4d0'); }
// a soft dark footprint under each building so it sits on the ground
function gfxContact(g) {
  if (!gfxOn()) return;
  g.updateMatrixWorld(true);
  const bb = new T3.Box3().setFromObject(g), sx = bb.max.x - bb.min.x, sz = bb.max.z - bb.min.z;
  if (!(sx > 0.5 && sz > 0.5) || sx > 40) return;
  const s = blobShadow(sx * 1.45, sz * 1.45, 0.34); s.position.set((bb.max.x + bb.min.x) / 2, 0.1, (bb.max.z + bb.min.z) / 2); g.add(s);
}
// a material with its own UVs and a detail texture (roofs, walls, planks)
function detailMat(key, color, tex, repeat = 1, extra = {}, rot = 0, lo = 0.72, hi = 1.12) {
  if (!gfxOn()) return toon(color);
  const rr = Array.isArray(repeat) ? repeat : [repeat, repeat];
  return cachedMat('detail:' + key + color + rr.join('x') + rot, () => {
    const t = tex.clone(); t.needsUpdate = true; t.repeat.set(rr[0], rr[1]); t.rotation = rot; t.center.set(0.5, 0.5);
    const m = makeToon({ color, roughness: 0.85, ...extra });
    m.map = t;
    const U = { uLo: { value: lo }, uHi: { value: hi } };
    m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U); sh.fragmentShader = 'uniform float uLo, uHi;\n' + sh.fragmentShader.replace('#include <map_fragment>', '{ vec4 t1 = texture2D(map, vUv); diffuseColor.rgb *= mix(uLo, uHi, t1.r); }'); };
    m.customProgramCacheKey = () => 'detailMat';
    return m;
  });
}
const hexOf = (m) => '#' + m.color.getHexString();
function roofMats(mat) { return gfxOn() && mat && mat.color ? [mat, detailMat('roof', hexOf(mat), gfxTextures().shingle, 0.42, {}, Math.PI / 2, 0.62, 1.12)] : mat; }
function wallMat(color) { return gfxOn() ? detailMat('wall', color, gfxTextures().plank, [1.6, 3.2], {}, 0, 0.86, 1.05) : toon(color); }
// ---------- vertex-baked props from Blender ----------
const ASSET_GEO = {};
let assetBytes = null;
function assetParts(name) {
  if (ASSET_GEO[name]) return ASSET_GEO[name];
  if (!assetBytes) { const s = atob(ASSET_BIN); assetBytes = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) assetBytes[i] = s.charCodeAt(i); }
  const A = ASSET_META[name]; if (!A) return [];
  const buf = assetBytes.buffer;
  const parts = A.parts.map((P) => {
    const n = P.vc, q = new Int16Array(buf, P.p, n * 3), nn = new Int8Array(buf, P.n, n * 3), cc = new Uint8Array(buf, P.c, n * 3);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) { const k = i % 3; pos[i] = P.min[k] + ((q[i] + 32768) / 65535) * (P.max[k] - P.min[k]); nor[i] = nn[i] / 127; col[i] = cc[i] / 255; }
    const g = new T3.BufferGeometry();
    g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('normal', new T3.BufferAttribute(nor, 3)); g.setAttribute('color', new T3.BufferAttribute(col, 3));
    if (P.i !== undefined) g.setIndex(new T3.BufferAttribute(new Uint16Array(buf, P.i, P.ic).slice(), 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    g.userData.keep = true;
    return { geo: g, tint: P.tint || null, double: !!P.double };
  });
  ASSET_GEO[name] = parts;
  return parts;
}
// build a group from an asset. tints: { leaf: '#8fd48a', rock: '#b9b3c9', ... }
function prop(name, tints = {}, cast = true) {
  const g = new T3.Group();
  for (const P of assetParts(name)) {
    let m;
    if (P.tint) { const c = tints[P.tint] || '#ffffff'; m = P.tint === 'leaf' ? leafMat(c) : bakedMat(P.tint + c, { color: c, side: P.double ? T3.DoubleSide : T3.FrontSide }); }
    else m = bakedMat(name + (P.double ? ':2' : ''), P.double ? { side: T3.DoubleSide } : {});
    if (P.double && P.tint === 'leaf') m.side = T3.DoubleSide;
    const o = new T3.Mesh(P.geo, m); o.castShadow = cast; o.receiveShadow = true; g.add(o);
  }
  return g;
}
// geometries from assets are shared, so never let disposeTree free them
function keepShared(o) { o.traverse((c) => { if (c.geometry && c.geometry.userData.keep) c.geometry.dispose = () => {}; }); return o; }

// ---------- rounded boxes: softer edges on anything big enough to notice ----------
function roundBox(w, h, d) {
  const mn = Math.min(w, h, d), mx = Math.max(w, h, d);
  if (!gfxOn() || mn < 0.22 || mx < 0.9) return new T3.BoxGeometry(w, h, d);
  return roundedBoxGeo(w, h, d, Math.min(0.16, mn * 0.2));
}
function roundedBoxGeo(width, height, depth, radius) {
  // after three.js RoundedBoxGeometry (MIT), one bevel segment
  const segments = 3, g = new T3.BoxGeometry(1, 1, 1, segments, segments, segments).toNonIndexed();
  const pos = g.attributes.position.array, nor = g.attributes.normal.array, uv = g.attributes.uv.array;
  const box = new T3.Vector3(width, height, depth).divideScalar(2).subScalar(radius), p = new T3.Vector3(), n = new T3.Vector3();
  const faceTris = pos.length / 6, faceDir = new T3.Vector3(), half = 0.5 / segments;
  for (let i = 0, j = 0; i < pos.length; i += 3, j += 2) {
    p.fromArray(pos, i); n.copy(p); n.x -= Math.sign(n.x) * half; n.y -= Math.sign(n.y) * half; n.z -= Math.sign(n.z) * half; n.normalize();
    pos[i] = box.x * Math.sign(p.x) + n.x * radius; pos[i + 1] = box.y * Math.sign(p.y) + n.y * radius; pos[i + 2] = box.z * Math.sign(p.z) + n.z * radius;
    nor[i] = n.x; nor[i + 1] = n.y; nor[i + 2] = n.z;
    const side = Math.floor(i / faceTris);
    const u = (a, b, la, lb) => { uv[j] = (a + la / 2) / la; uv[j + 1] = (b + lb / 2) / lb; };
    if (side === 0 || side === 1) { faceDir.set(1, 0, 0); u(pos[i + 2] * (side === 0 ? -1 : 1), pos[i + 1], depth, height); }
    else if (side === 2 || side === 3) u(pos[i], pos[i + 2] * (side === 2 ? -1 : 1), width, depth);
    else u(pos[i] * (side === 4 ? 1 : -1), pos[i + 1], width, height);
  }
  g.computeBoundingSphere(); g.parameters = { width, height, depth };
  return g;
}

// ---------- soft round particles instead of squares ----------
function softPoints(opts) {
  const m = new T3.PointsMaterial(opts);
  if (gfxOn()) { m.map = gfxTextures().dot; m.alphaTest = 0.02; m.transparent = true; m.depthWrite = false; }
  return m;
}
// a soft blob of shadow on the ground
function blobShadow(w, d, opacity = 0.32) {
  const m = mesh(new T3.PlaneGeometry(w, d), new T3.MeshBasicMaterial({ color: 0x1a1030, alphaMap: gfxTextures().blob, transparent: true, opacity, depthWrite: false }), 0, 0.1, 0, false);
  m.rotation.x = -Math.PI / 2; m.receiveShadow = false; m.renderOrder = 1; m.raycast = () => {};
  return m;
}
function glowSprite(color, size, opacity = 0.8) {
  const s = new T3.Sprite(new T3.SpriteMaterial({ map: gfxTextures().glow, color, transparent: true, opacity, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false }));
  s.scale.set(size, size, 1); s.raycast = () => {};
  return s;
}

// ---------- sky dome ----------
let skyDome = null;
const SKY = { top: new T3.Color('#58b4ff'), hor: new T3.Color('#dff4ff'), sun: new T3.Vector3(0.5, 0.6, 0.2), glow: new T3.Color('#fff2cf') };
function buildSky() {
  const mat = new T3.ShaderMaterial({
    uniforms: { uTop: { value: SKY.top }, uHor: { value: SKY.hor }, uSun: { value: SKY.sun }, uGlow: { value: SKY.glow }, uGlowK: { value: 0.5 } },
    vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform vec3 uTop, uHor, uGlow, uSun; uniform float uGlowK; varying vec3 vDir;
      void main() { float h = clamp(vDir.y, -0.2, 1.0); float t = pow(max(h, 0.0), 0.55);
        vec3 c = mix(uHor, uTop, t); float s = max(dot(normalize(vDir), normalize(uSun)), 0.0);
        c += uGlow * (pow(s, 12.0) * 0.55 + pow(s, 400.0) * 1.5) * uGlowK;
        c = mix(c, uHor * 0.92, smoothstep(0.02, -0.2, vDir.y));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`,
    side: T3.BackSide, depthWrite: false, fog: false,
  });
  skyDome = new T3.Mesh(new T3.SphereGeometry(420, 32, 16), mat);
  skyDome.renderOrder = -10; skyDome.frustumCulled = false; skyDome.raycast = () => {};
  scene.add(skyDome);
}

// ---------- water ----------
let waterMesh = null, seabed = null;
const WATER_ISLES = [];
function waterIsles() {
  WATER_ISLES.length = 0;
  WATER_ISLES.push([0, 0, 32.2], [DT.x, DT.z, DT.R + 2.3], [BEACH[0], BEACH[1], BEACH_R + 1.6]);
  for (const k of W?.lobes || []) { const [x, z] = lobeCenter(k); WATER_ISLES.push([x, z, lobeR(k) + 2.1]); }
  if (waterMesh) { const U = waterMesh.material.uniforms; U.uN.value = Math.min(12, WATER_ISLES.length); WATER_ISLES.slice(0, 12).forEach((w, i) => U.uIsles.value[i].set(w[0], w[1], w[2], 0)); }
}
function buildWater() {
  const isles = []; for (let i = 0; i < 12; i++) isles.push(new T3.Vector4(0, 0, -99, 0));
  const mat = new T3.ShaderMaterial({
    uniforms: {
      uT: { value: 0 }, uIsles: { value: isles }, uN: { value: 0 },
      uShallow: { value: new T3.Color('#5fe8e0') }, uMid: { value: new T3.Color('#36b9e8') }, uDeep: { value: new T3.Color('#2f7fd8') },
      uFoam: { value: new T3.Color('#ffffff') }, uSunDir: { value: new T3.Vector3(0.5, 0.7, 0.3) }, uSunC: { value: new T3.Color('#fff4dc') },
      uL: { value: 1 }, uBox: { value: 0 }, uFogC: { value: new T3.Color('#dff4ff') }, uFogN: { value: 140 }, uFogF: { value: 380 },
    },
    vertexShader: 'varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      uniform float uT, uL, uBox, uFogN, uFogF; uniform vec4 uIsles[12]; uniform int uN;
      uniform vec3 uShallow, uMid, uDeep, uFoam, uSunDir, uSunC, uFogC; varying vec3 vW;
      float h21(vec2 p) { p = mod(p, 289.0); vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        vec2 p = vW.xz; float d = 1e4;
        for (int i = 0; i < 12; i++) { if (i >= uN) break; d = min(d, length(p - uIsles[i].xy) - uIsles[i].z); }
        float n1 = vn(p * 0.35 + vec2(uT * 0.12, uT * 0.07)), n2 = vn(p * 0.9 - vec2(uT * 0.2, -uT * 0.13));
        float dd = d + (n1 - 0.5) * 1.2;
        vec3 c = mix(uShallow, uMid, smoothstep(0.0, 7.0, dd)); c = mix(c, uDeep, smoothstep(5.0, 26.0, dd));
        // caustic ripples in the shallows
        float camD = length(vW - cameraPosition), near1 = 1.0 - smoothstep(45.0, 110.0, camD);
        float ca = abs(sin((n1 * 2.0 + n2) * 6.2832)); c += (1.0 - smoothstep(0.0, 0.12, ca)) * 0.18 * (1.0 - smoothstep(0.0, 9.0, dd)) * uL * near1;
        // shore foam: a solid edge and a second line that breathes in and out
        float wv = sin(uT * 1.1 + n2 * 3.0) * 0.5 + 0.5;
        float foam = 1.0 - smoothstep(0.15, 0.55 + wv * 0.25, dd);
        float line2 = smoothstep(0.18, 0.0, abs(dd - (1.2 + wv * 1.3))) * (0.55 - wv * 0.35);
        c = mix(c, uFoam, clamp(foam * 0.95 + line2, 0.0, 1.0));
        // sun glints
        vec3 V = normalize(cameraPosition - vW); vec3 N = normalize(vec3((n1 - 0.5) * 0.35, 1.0, (n2 - 0.5) * 0.35));
        float spec = pow(max(dot(reflect(-normalize(uSunDir), N), V), 0.0), 60.0) * uL;
        float sp = step(0.93, vn(p * 3.1 + uT * 0.6)) * step(0.5, n2) * (0.35 + 0.65 * uL) * (1.0 - smoothstep(20.0, 60.0, d)) * near1;
        c += uSunC * (spec * 0.8 + sp * 0.55);
        c *= mix(0.18, 1.0, uL); c += uBox * vec3(0.05, 0.25, 0.35) * (1.0 - smoothstep(0.0, 10.0, dd));
        float a = mix(0.62, 0.96, smoothstep(0.0, 10.0, dd)); a = max(a, foam);
        float fd = length(vW - cameraPosition); float fog = smoothstep(uFogN, uFogF, fd) * (1.0 - uBox);
        c = mix(c, uFogC, fog);
        float edge = uBox * smoothstep(3.0, 16.0, dd);
        gl_FragColor = vec4(c, a * (1.0 - edge));
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`,
    transparent: true, depthWrite: false, fog: false,
  });
  waterMesh = new T3.Mesh(new T3.PlaneGeometry(900, 900, 1, 1), mat);
  waterMesh.rotation.x = -Math.PI / 2; waterMesh.position.y = -0.9; waterMesh.renderOrder = 2; waterMesh.raycast = () => {};
  scene.add(waterMesh);
  seabed = mesh(new T3.CircleGeometry(170, 48), makeToon({ color: '#3fa6c8', roughness: 1 }), 0, -3.2, -18, false); seabed.rotation.x = -Math.PI / 2; seabed.receiveShadow = false; seabed.raycast = () => {};
  scene.add(seabed);
  waterIsles();
}

// ---------- the island pieces: a flat lawn with a rounded lip, a little cliff, then sand into the sea ----------
function islandPiece(x, z, R, grass, opts = {}) {
  const g = new T3.Group(); g.position.set(x, 0, z);
  const seg = opts.seg || 96;
  // lawn + rounded lip, textured in world space
  const top = [new T3.Vector2(0.001, 0), new T3.Vector2(R - 0.9, 0), new T3.Vector2(R - 0.45, -0.035), new T3.Vector2(R - 0.18, -0.11), new T3.Vector2(R, -0.26)];
  const lawn = mesh(new T3.LatheGeometry(top.reverse(), seg), grass, 0, opts.dy || 0, 0, false); lawn.receiveShadow = true; g.add(lawn);
  // cliff, sand shelf and the slope under the water, colored per ring
  const sand = opts.sand || '#f4e2b8', wet = opts.wet || '#d9c29a', cliffA = opts.cliff || '#a7825f', cliffB = opts.cliff2 || '#8d6a4c';
  const prof = [
    [R, -0.26, cliffA], [R + 0.06, -0.42, cliffB], [R + 0.12, -0.56, cliffA], [R + 0.18, -0.66, cliffB],
    [R + 0.55, -0.7, sand], [R + 1.4, -0.74, sand], [R + 2.1, -0.83, sand], [R + 2.6, -0.95, wet], [R + 4.5, -1.6, wet], [R + 8, -3.1, '#9fb8a8'],
  ];
  const pts = prof.map(([r, y]) => new T3.Vector2(r, y));
  const geo = new T3.LatheGeometry(pts.reverse(), seg);
  const cols = [], rev = prof.slice().reverse(), rnd = mulberry(Math.round(R * 100 + x));
  const segCols = []; for (let s = 0; s <= seg; s++) segCols.push(0.94 + rnd() * 0.1);
  for (let s = 0; s <= seg; s++) for (let k = 0; k < rev.length; k++) { const c = new T3.Color(rev[k][2]).multiplyScalar(k >= rev.length - 4 ? segCols[s] : 1); cols.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new T3.Float32BufferAttribute(cols, 3));
  const side = mesh(geo, bakedMat('shore', { roughness: 0.95 }), 0, 0, 0, false); side.receiveShadow = true; g.add(side);
  g.traverse((o) => (o.raycast = () => {}));
  return g;
}
// a sandy mound (the beach) rising gently out of the water
function sandPiece(x, z, R) {
  const g = new T3.Group(); g.position.set(x, 0, z);
  const pts = [[0.001, 0.05], [R - 1.2, 0.05], [R - 0.2, -0.05], [R + 0.8, -0.45], [R + 1.8, -0.85], [R + 3, -1.3], [R + 6, -2.8]].map(([r, y]) => new T3.Vector2(r, y));
  const m = mesh(new T3.LatheGeometry(pts.reverse(), 72), worldMat('sand', '#f6e4b8', gfxTextures().sand, 0.35, 0.86, 1.08, 0.08), 0, 0, 0, false);
  m.receiveShadow = true; g.add(m);
  return g;
}

// ---------- lighting rig ----------
let rimLight = null, fillLight = null;
function gfxLights() {
  if (!gfxOn()) return;
  sun.shadow.normalBias = 0.1; sun.shadow.bias = -0.0005;
  hemi.color.set('#d9eeff'); hemi.groundColor.set('#b5c98f');
  sun.color.set('#fff0d4');
  fillLight = new T3.DirectionalLight(0xc9d8ff, 0); fillLight.position.set(-40, 30, 50); scene.add(fillLight);
}
function gfxEnv() {
  if (!gfxOn() || GFX.env || !T3.PMREMGenerator) return;
  try {
    const pm = new T3.PMREMGenerator(renderer), es = new T3.Scene();
    const sky = new T3.Mesh(new T3.SphereGeometry(10, 16, 8), new T3.MeshBasicMaterial({ side: T3.BackSide, vertexColors: true }));
    const cols = [], pos = sky.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 10, c = new T3.Color('#f3e6ff').lerp(new T3.Color('#8fc8ff'), Math.max(0, y)).lerp(new T3.Color('#ffd9b8'), Math.max(0, -y) * 0.8); cols.push(c.r, c.g, c.b); }
    sky.geometry.setAttribute('color', new T3.Float32BufferAttribute(cols, 3)); es.add(sky);
    const lamp = (x, y, z, s, c) => { const m = new T3.Mesh(new T3.SphereGeometry(s, 8, 6), new T3.MeshBasicMaterial({ color: c })); m.material.color.multiplyScalar(6); m.position.set(x, y, z); es.add(m); };
    lamp(4, 6, 3, 1.4, '#fff4e0'); lamp(-5, 3, -2, 1.1, '#ffd1ec'); lamp(0, -4, 5, 1.2, '#cfe6ff');
    GFX.env = pm.fromScene(es, 0.02).texture; pm.dispose();
  } catch (e) { console.warn('env', e); }
}

// ---------- post: depth-of-field blur, glow, grading ----------
const POST = {};
function fsPass(frag, uniforms) {
  return new T3.ShaderMaterial({ uniforms, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: frag, depthTest: false, depthWrite: false, toneMapped: false });
}
function postInit() {
  if (POST.ready) return true;
  try {
    const gl2 = renderer.capabilities.isWebGL2;
    const opt = { minFilter: T3.LinearFilter, magFilter: T3.LinearFilter, format: T3.RGBAFormat, depthBuffer: false, stencilBuffer: false };
    POST.scene = new T3.WebGLRenderTarget(4, 4, { ...opt, depthBuffer: true, stencilBuffer: true });
    if (gl2) POST.scene.samples = 4;
    for (const k of ['q1', 'q2', 'e1', 'e2', 'd1', 'd2', 'f1', 'f2']) POST[k] = new T3.WebGLRenderTarget(4, 4, opt);
    POST.cam = new T3.OrthographicCamera(-1, 1, 1, -1, 0, 1); POST.quad = new T3.Mesh(new T3.PlaneGeometry(2, 2)); POST.quad.frustumCulled = false; POST.sc = new T3.Scene(); POST.sc.add(POST.quad);
    const texel = () => ({ value: new T3.Vector2(1, 1) });
    POST.down = fsPass(`uniform sampler2D tIn; uniform vec2 uTx; uniform float uThr, uKnee; varying vec2 vUv;
      vec3 bright(vec3 c) { float l = max(c.r, max(c.g, c.b)); float s = clamp(l - uThr + uKnee, 0.0, 2.0 * uKnee); s = s * s / (4.0 * uKnee + 1e-4); return c * max(s, l - uThr) / max(l, 1e-4); }
      void main() { vec3 a = texture2D(tIn, vUv + uTx * vec2(-1.0, -1.0)).rgb, b = texture2D(tIn, vUv + uTx * vec2(1.0, -1.0)).rgb, c = texture2D(tIn, vUv + uTx * vec2(-1.0, 1.0)).rgb, d = texture2D(tIn, vUv + uTx * vec2(1.0, 1.0)).rgb;
        vec3 o = uThr > 0.0 ? (bright(a) + bright(b) + bright(c) + bright(d)) * 0.25 : (a + b + c + d) * 0.25; gl_FragColor = vec4(o, 1.0); }`, { tIn: { value: null }, uTx: texel(), uThr: { value: 0 }, uKnee: { value: 0.2 } });
    POST.blur = fsPass(`uniform sampler2D tIn; uniform vec2 uDir; varying vec2 vUv;
      void main() { vec3 c = texture2D(tIn, vUv).rgb * 0.2270270270;
        c += (texture2D(tIn, vUv + uDir * 1.3846153846).rgb + texture2D(tIn, vUv - uDir * 1.3846153846).rgb) * 0.3162162162;
        c += (texture2D(tIn, vUv + uDir * 3.2307692308).rgb + texture2D(tIn, vUv - uDir * 3.2307692308).rgb) * 0.0702702703;
        gl_FragColor = vec4(c, 1.0); }`, { tIn: { value: null }, uDir: texel() });
    POST.comp = fsPass(`uniform sampler2D tScene, tDof1, tDof2, tB1, tB2; uniform float uBloom, uDof, uFocus, uBand, uSat, uVig, uAspect, uT, uBox;
      uniform vec3 uLift, uGain; varying vec2 vUv;
      float h(vec2 p) { return fract(52.9829189 * fract(dot(gl_FragCoord.xy + uT * 7.0, vec2(0.06711056, 0.00583715)))); }
      void main() {
        vec3 col = texture2D(tScene, vUv).rgb;
        if (uDof > 0.0) {
          float dy = vUv.y - uFocus; float f = smoothstep(uBand, uBand + 0.4, abs(dy)) * (dy > 0.0 ? 0.9 : 0.6) * uDof;
          vec3 b1 = texture2D(tDof1, vUv).rgb, b2 = texture2D(tDof2, vUv).rgb;
          col = mix(col, b1, smoothstep(0.0, 0.55, f)); col = mix(col, b2, smoothstep(0.45, 1.0, f));
        }
        col += (texture2D(tB1, vUv).rgb * 0.9 + texture2D(tB2, vUv).rgb * 1.3) * uBloom;
        float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col = mix(vec3(l), col, uSat);
        col = col * mix(uLift, uGain, smoothstep(0.0, 0.7, l));
        vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0); col *= 1.0 - uVig * smoothstep(0.35, 1.05, length(q));
        vec4 o = LinearTosRGB(vec4(max(col, 0.0), 1.0));
        o.rgb += (h(vUv) - 0.5) / 255.0 * (1.0 - uBox * step(l, 0.002));
        gl_FragColor = o; }`,
      { tScene: { value: null }, tDof1: { value: null }, tDof2: { value: null }, tB1: { value: null }, tB2: { value: null }, uBloom: { value: 0.7 }, uDof: { value: 1 }, uFocus: { value: 0.45 }, uBand: { value: 0.16 }, uSat: { value: 1.12 }, uVig: { value: 0.22 }, uAspect: { value: 1 }, uT: { value: 0 }, uBox: { value: 0 }, uLift: { value: new T3.Vector3(0.97, 0.98, 1.04) }, uGain: { value: new T3.Vector3(1.03, 1.0, 0.96) } });
    POST.ready = true; POST.w = 0; POST.h = 0;
    return true;
  } catch (e) { console.warn('post off', e); POST.failed = true; return false; }
}
function postSize() {
  const v = renderer.getDrawingBufferSize(new T3.Vector2()), w = Math.max(4, v.x), h = Math.max(4, v.y);
  if (w === POST.w && h === POST.h) return;
  POST.w = w; POST.h = h;
  POST.scene.setSize(w, h);
  const q = [Math.max(2, Math.round(w / 4)), Math.max(2, Math.round(h / 4))], e = [Math.max(2, Math.round(w / 8)), Math.max(2, Math.round(h / 8))];
  POST.q1.setSize(...q); POST.q2.setSize(...q); POST.d1.setSize(...q); POST.d2.setSize(...q);
  POST.e1.setSize(...e); POST.e2.setSize(...e); POST.f1.setSize(...e); POST.f2.setSize(...e);
}
function fsDraw(mat, target) { POST.quad.material = mat; renderer.setRenderTarget(target); renderer.render(POST.sc, POST.cam); }
function blurInto(a, b, w, h) {
  POST.blur.uniforms.tIn.value = a.texture; POST.blur.uniforms.uDir.value.set(1 / w, 0); fsDraw(POST.blur, b);
  POST.blur.uniforms.tIn.value = b.texture; POST.blur.uniforms.uDir.value.set(0, 1 / h); fsDraw(POST.blur, a);
}
const _proj = new T3.Vector3();
function renderView(scn, cam) {
  if (!GFX.post || !postInit()) { renderer.setRenderTarget(null); renderer.render(scn, cam); GFX.calls = renderer.info.render.calls; GFX.tris = renderer.info.render.triangles; return; }
  postSize();
  const W0 = POST.w, H0 = POST.h, qw = POST.q1.width, qh = POST.q1.height, ew = POST.e1.width, eh = POST.e1.height;
  renderer.setRenderTarget(POST.scene); renderer.render(scn, cam); GFX.calls = renderer.info.render.calls; GFX.tris = renderer.info.render.triangles;
  const D = POST.down.uniforms, night = 1 - daylight();
  // glow: bright parts, quarter and eighth size
  if (GFX.bloom) {
    D.tIn.value = POST.scene.texture; D.uTx.value.set(1 / W0, 1 / H0); D.uThr.value = (GFX.thr ?? 0.95) - night * (cfg.boxMode ? 0.45 : 0.35); fsDraw(POST.down, POST.q1);
    blurInto(POST.q1, POST.q2, qw, qh);
    D.tIn.value = POST.q1.texture; D.uTx.value.set(0.5 / qw, 0.5 / qh); D.uThr.value = 0; fsDraw(POST.down, POST.e1);
    blurInto(POST.e1, POST.e2, ew, eh);
  }
  // depth blur: the whole picture, softened
  const dof = GFX.dof && !interior;
  if (dof) {
    D.tIn.value = POST.scene.texture; D.uTx.value.set(1 / W0, 1 / H0); D.uThr.value = 0; fsDraw(POST.down, POST.d1);
    blurInto(POST.d1, POST.d2, qw, qh);
    D.tIn.value = POST.d1.texture; D.uTx.value.set(0.5 / qw, 0.5 / qh); fsDraw(POST.down, POST.f1);
    blurInto(POST.f1, POST.f2, ew, eh); blurInto(POST.f1, POST.f2, ew, eh);
  }
  const C = POST.comp.uniforms;
  C.tScene.value = POST.scene.texture; C.tDof1.value = POST.d1.texture; C.tDof2.value = POST.f1.texture; C.tB1.value = POST.q1.texture; C.tB2.value = POST.e1.texture;
  C.uBloom.value = GFX.bloom ? ((GFX.bloomK ?? 0.4) + night * (cfg.boxMode ? 0.9 : 0.6)) * (interior ? 0.8 : 1) : 0;
  C.uDof.value = dof ? (cfg.boxMode ? 0.6 : 1) : 0;
  if (dof) { _proj.copy(controls.target).project(cam); C.uFocus.value = Math.min(0.8, Math.max(0.2, _proj.y * 0.5 + 0.5)); const dist = cam.position.distanceTo(controls.target); C.uBand.value = 0.12 + Math.min(0.2, Math.max(0, (dist - 20) / 400)); }
  C.uAspect.value = W0 / H0; C.uT.value = (now * 7.13) % 100; C.uBox.value = cfg.boxMode ? 1 : 0;
  C.uVig.value = cfg.boxMode ? 0.05 : interior ? 0.3 : 0.22;
  const dk = interior ? 0 : (GFX.dusk || 0) * 0.7; C.uGain.value.set(1.03 + dk * 0.1, 1.0 - dk * 0.03, 0.96 - dk * 0.12); C.uLift.value.set(0.97 + dk * 0.02, 0.98 - dk * 0.02, 1.04 + dk * 0.04);
  fsDraw(POST.comp, null);
}

// ---------- quality ladder ----------
function gfxApplyLevel(level) {
  GFX.level = level;
  const on = gfxOn();
  GFX.post = on && (level === 'pretty' || level === 'balanced') && !POST.failed;
  GFX.dof = level === 'pretty'; GFX.bloom = level === 'pretty' || level === 'balanced';
  GFX.fpsCap = on && level !== 'pretty' ? 30 : 0;
  const dpr = window.devicePixelRatio || 1;
  if (!on) { renderer.setPixelRatio(Math.min(1.75, dpr)); if (typeof resize === 'function') resize(); return; }
  renderer.setPixelRatio(level === 'pretty' ? Math.min(1.5, dpr) : level === 'balanced' ? Math.min(1.15, dpr) : Math.min(1, dpr));
  if (sun && sun.shadow) { const s = level === 'pretty' ? 2048 : 1024; if (sun.shadow.mapSize.x !== s) { sun.shadow.mapSize.set(s, s); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } } }
  if (typeof resize === 'function') resize();
}
function gfxStart() {
  const want = cfg.gfx || 'auto';
  GFX.auto = want === 'auto';
  let lvl = want === 'auto' ? (() => { try { return localStorage.getItem('glimmer-gfx-auto') || 'pretty'; } catch (e) { return 'pretty'; } })() : want === 'classic' ? 'lite' : want;
  GFX.noShadow = lvl === 'min'; if (lvl === 'min') lvl = 'lite';
  gfxApplyLevel(lvl); GFX.t0 = now; GFX.slowFor = 0; GFX.frames.length = 0;
  if (GFX.noShadow) { renderer.shadowMap.enabled = false; sun.castShadow = false; }
}
// watch the frame rate for a while; if the phone is struggling, step down once or twice
function gfxWatch(dt) {
  if (!GFX.auto || document.hidden) return;
  const t = performance.now() / 1000;
  if (!GFX.wt0) { GFX.wt0 = t; GFX.wn = 0; return; }
  if (now - GFX.t0 < 4) { GFX.wt0 = t; GFX.wn = 0; return; }
  GFX.wn++;
  const span = t - GFX.wt0; if (span < 3 || GFX.wn < 4) return;
  const avg = span / GFX.wn; GFX.wt0 = t; GFX.wn = 0;
  if (avg > 0.045) GFX.slowFor += avg > 0.12 ? 2 : 1; else GFX.slowFor = 0;
  if (GFX.slowFor >= 2 && GFX.level === 'lite' && !GFX.noShadow) {
    GFX.noShadow = true; renderer.shadowMap.enabled = false; sun.castShadow = false; GFX.slowFor = 0; GFX.t0 = now;
    scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)); });
    try { localStorage.setItem('glimmer-gfx-auto', 'min'); } catch (e) {}
    return;
  }
  if (GFX.slowFor >= 2 && GFX.level !== 'lite') {
    const next = GFX.level === 'pretty' ? 'balanced' : 'lite';
    gfxApplyLevel(next); GFX.slowFor = 0; GFX.t0 = now;
    try { localStorage.setItem('glimmer-gfx-auto', next); } catch (e) {}
  }
}
function gfxSetting(v) {
  cfg.gfx = GFX_LEVELS[v] ? v : 'auto'; savePrefs();
  try { localStorage.removeItem('glimmer-gfx-auto'); } catch (e) {}
  const needReload = (v === 'classic') !== (GFX.wasClassic || false) || (v !== 'auto' && (v === 'lite') !== !!GFX.cheap);
  if (needReload) { toast('Reloading to change the look…'); setTimeout(() => location.reload(), 700); return; }
  gfxStart(); applyLook();
}

