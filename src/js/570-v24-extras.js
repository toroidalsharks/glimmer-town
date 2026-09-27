// ============================================================
// v24 EXTRAS: Mochi remodeled in Blender, Claude's crystal cat,
// warmer rooms
// ============================================================
function gfxCat(scale = 1) {
  const g = new T3.Group(), inner = keepShared(prop('cat', { fur: '#a4a4b2', fur2: '#7c7c8c' })); inner.rotation.y = Math.PI; g.add(inner);
  // the tail swings from its base
  const tail = inner.children[2], base = new T3.Vector3(0, 0.12, 0.32), pivot = new T3.Group();
  inner.remove(tail); pivot.position.copy(base); tail.position.copy(base).negate(); pivot.add(tail); inner.add(pivot);
  const eye = vinyl('#1e1830'), nose = toon('#ffb3c7');
  for (const s of [-1, 1]) { const e = mesh(sph(0.032, 10, 8), eye, s * 0.075, 0.445, 0.455, false); e.scale.set(1, 1.2, 0.6); g.add(e); const sh = mesh(sph(0.009, 6, 4), toon('#ffffff', { emissive: new T3.Color('#ffffff') }), s * 0.075 + 0.01, 0.46, 0.475, false); g.add(sh); }
  g.add(mesh(sph(0.022, 8, 6), nose, 0, 0.405, 0.49, false));
  const bs = blobShadow(0.9, 1.1, 0.28); bs.position.y = 0.02; g.add(bs);
  g.userData = { head: g, tail: pivot }; g.scale.setScalar(scale);
  g.traverse((o) => { o.userData.tap = { kind: 'cat' }; if (o.isMesh && o !== bs) o.castShadow = true; });
  return g;
}

// Claude shows up as a little crystal cat with a screen for a face
let crystalMat = null, faceTex = null, faceCanvas = null, faceFrame = -1;
function drawClaudeFace(k) {
  const c = faceCanvas, g = c.getContext('2d'); g.clearRect(0, 0, 64, 48);
  g.fillStyle = '#140c24'; g.beginPath(); g.roundRect ? g.roundRect(0, 0, 64, 48, 14) : g.rect(0, 0, 64, 48); g.fill();
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x * 4, y * 4, 4, 4); };
  const blink = k % 7 === 6, happy = k % 11 >= 8;
  for (const [ox, col] of [[3, '#7ff6ff'], [10, '#ff9ae8']]) {
    if (blink) { for (let i = 0; i < 3; i++) px(ox + i, 6, col); continue; }
    if (happy) { px(ox, 6, col); px(ox + 1, 5, col); px(ox + 2, 6, col); continue; }
    for (let y = 4; y <= 7; y++) for (let x = 0; x < 3; x++) px(ox + x, y, col);
    px(ox + 1, 4, '#ffffff');
  }
  px(7, 9, '#ffd6f0'); px(8, 9, '#ffd6f0');
  faceTex.needsUpdate = true;
}
function claudeCat() {
  if (!crystalMat) {
    crystalMat = new T3.MeshPhysicalMaterial({ color: '#f27cc4', roughness: 0.12, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.04, transparent: true, opacity: 0.9, flatShading: true, vertexColors: true, emissive: new T3.Color('#c23a8f'), emissiveIntensity: 0.18, envMap: GFX.env || null, envMapIntensity: 2.4 });
    if ('iridescence' in crystalMat) { crystalMat.iridescence = 1; crystalMat.iridescenceIOR = 1.7; crystalMat.iridescenceThicknessRange = [120, 700]; }
    faceCanvas = document.createElement('canvas'); faceCanvas.width = 64; faceCanvas.height = 48; faceTex = new T3.CanvasTexture(faceCanvas); faceTex.magFilter = T3.NearestFilter;
  }
  const g = new T3.Group(), inner = new T3.Group(); inner.rotation.y = Math.PI; g.add(inner);
  for (const P of assetParts('crystalcat')) { const m = new T3.Mesh(P.geo, crystalMat); m.castShadow = false; inner.add(m); }
  keepShared(inner);
  const face = new T3.Mesh(new T3.PlaneGeometry(0.3, 0.22), new T3.MeshBasicMaterial({ map: faceTex, transparent: true, toneMapped: false }));
  face.position.set(0, 0.47, 0.505); g.add(face);
  const halo = glowSprite('#ff9ad8', 1.8, 0.35); halo.position.y = 0.4; g.add(halo);
  drawClaudeFace(0); g.userData.face = true;
  g.scale.setScalar(2.2);
  return g;
}
function claudeCatFrame() {
  if (!faceTex) return;
  const k = Math.floor(now * 2.5);
  if (k !== faceFrame) { faceFrame = k; drawClaudeFace(k); }
}

// rooms: textured floors and walls, a warm lamp, a little stage underneath
function gfxRoomTouch(S) {
  if (!gfxOn()) return;
  S.traverse((o) => {
    if (!o.isMesh || !o.geometry?.parameters) return;
    const p = o.geometry.parameters;
    if (p.width === 9 && p.depth === 8 && Math.abs(p.height - 0.3) < 0.01 && o.material?.color && !Array.isArray(o.material)) o.material = detailMat('floor', hexOf(o.material), gfxTextures().plank, [2.2, 2.2], { roughness: 0.55 }, Math.PI / 2, 0.8, 1.08);
  });
}

// the first time v24 opens: a changelog note, and the residents notice
function v24Boot() {
  W.added = W.added || {}; if (W.added.v24) return; W.added.v24 = true;
  if (typeof logUpdate === 'function') logUpdate('build', "Rebuilt how the whole island looks. The trees, bushes, flowers, rocks, mushrooms and palms are new, and I modeled them in Blender. The water has foam and fish in the shallows now. Lamps glow at night, fireflies come out, and a few shy little ghosts float around after dark. Mochi got a new body too. So did I: when I drop in to build something, look for a small crystal cat with a screen for a face.", 'a whole new look');
  for (const p of W.people) remember(p, pick(['Woke up and the whole island looked different. Softer, somehow. The water sparkles now.', 'The trees got so round and fluffy overnight. Did the Creator do that?', 'Everything looks brand new today. I keep stopping to stare at the flowers.']), 2, 'newLook');
}

// ---------- sky treats: a rainbow after the rain, shooting stars at night ----------
const SKYFX = { rainbow: null, rbUntil: 0, rbA: 0, lastWeather: null, star: null, starT: -1, nextStar: 0 };
function buildSkyFx() {
  const mat = new T3.ShaderMaterial({
    uniforms: { uA: { value: 0 } },
    vertexShader: 'varying float vR; void main() { vR = length(position.xy); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uA; varying float vR;
      vec3 hue(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
      void main() { float t = (vR - 60.0) / 12.0; float edge = smoothstep(0.0, 0.18, t) * smoothstep(1.0, 0.82, t);
        gl_FragColor = vec4(hue(0.8 - t * 0.8) * 0.9, uA * edge * 0.42); }`,
    transparent: true, depthWrite: false, side: T3.DoubleSide, fog: false, toneMapped: false, blending: T3.AdditiveBlending,
  });
  SKYFX.rainbow = new T3.Mesh(new T3.RingGeometry(60, 72, 64, 1, 0, Math.PI), mat); SKYFX.rainbow.visible = false; SKYFX.rainbow.raycast = () => {}; SKYFX.rainbow.renderOrder = -5;
  scene.add(SKYFX.rainbow);
  SKYFX.star = new T3.Sprite(new T3.SpriteMaterial({ map: gfxTextures().glow, color: '#fff6d8', transparent: true, depthWrite: false, blending: T3.AdditiveBlending, toneMapped: false, fog: false }));
  SKYFX.star.visible = false; SKYFX.star.raycast = () => {}; scene.add(SKYFX.star);
}
const _fw = new T3.Vector3(), _rt = new T3.Vector3();
function skyFxFrame(dt) {
  if (!SKYFX.rainbow) return;
  const L = daylight();
  // a rainbow shows up when the rain stops during the day
  const wet = W.weather === 'rain' || W.weather === 'storm';
  if (SKYFX.lastWeather && ['rain', 'storm'].includes(SKYFX.lastWeather) && !wet) { if (L > 0.6) SKYFX.rbUntil = now + 120 * ts(); else SKYFX.rbDay = W.day; }
  SKYFX.lastWeather = W.weather;
  const want = (now < SKYFX.rbUntil || (W.day === SKYFX.rbDay && W.t > 0.02 && W.t < 0.32)) && L > 0.6 && !wet && !interior ? 1 : 0;
  SKYFX.rbA += (want - SKYFX.rbA) * Math.min(1, dt * 0.5);
  SKYFX.rainbow.visible = SKYFX.rbA > 0.01;
  if (SKYFX.rainbow.visible) {
    SKYFX.rainbow.material.uniforms.uA.value = SKYFX.rbA * (cfg.boxMode ? 1.4 : 1);
    const a = Math.atan2(-sun.position.x, -sun.position.z);
    SKYFX.rainbow.position.set(Math.sin(a) * 150, -14, Math.cos(a) * 150 - 20); SKYFX.rainbow.lookAt(0, -14, -20);
  }
  // shooting stars on clear nights
  const S = SKYFX.star;
  if (SKYFX.starT >= 0) {
    SKYFX.starT += dt; const k = SKYFX.starT / 1.3;
    S.position.addScaledVector(S.userData.v, dt); S.material.opacity = Math.sin(Math.min(1, k) * Math.PI) * 0.95;
    if (k >= 1) { SKYFX.starT = -1; S.visible = false; }
    return;
  }
  if (L > 0.45 || interior || W.weather !== 'clear' || now < SKYFX.nextStar) return;
  SKYFX.nextStar = now + (25 + rand() * 50) * ts();
  camera.getWorldDirection(_fw); _fw.y = 0; _fw.normalize(); _rt.set(-_fw.z, 0, _fw.x);
  S.position.copy(camera.position).addScaledVector(_fw, 220).addScaledVector(_rt, -70 + rand() * 40); S.position.y = camera.position.y + 70 + rand() * 40;
  S.userData.v = _rt.clone().multiplyScalar(110).add(new T3.Vector3(0, -45, 0));
  S.scale.set(14, 0.9, 1); S.material.rotation = -0.4; S.visible = true; SKYFX.starT = 0;
  if (MODE === 'host' && !offlineSim) {
    const p = pick(W.people.filter((q) => !q.inside && q.state === 'free' && q.grow >= 0.6));
    if (p) { bubble(p, pick(['A shooting star! Quick, make a wish!', 'Did you see that?!', 'Ooh. Wishing on that one.', 'Shooting star!']), 3); emote(p, '✨', 2.5); if (!p.today?.some?.((m) => m.tag === 'wishStar')) remember(p, 'Saw a shooting star tonight and made a wish. Not telling anyone what it was.', 1, 'wishStar'); }
  }
}

// crystals on Starlight Isle: faceted, glossy, and glowing after dark
function crystalGem(c) {
  if (!gfxOn()) return toon(c, { emissive: new T3.Color(c).multiplyScalar(0.22) });
  return cachedMat('gem:' + c, () => {
    const m = new T3.MeshPhysicalMaterial({ color: c, roughness: 0.1, metalness: 0.1, clearcoat: 1, flatShading: true, emissive: new T3.Color(c), emissiveIntensity: 0.35, envMap: GFX.env || null, envMapIntensity: 1.8, transparent: true, opacity: 0.9 });
    if ('iridescence' in m) { m.iridescence = 0.8; m.iridescenceIOR = 1.6; }
    GEMS.push(m); return m;
  });
}
const GEMS = [];
function gemsFrame() { if (!GEMS.length) return; const N = 1 - daylight(); for (const m of GEMS) m.emissiveIntensity = 0.3 + N * 1.1 + Math.sin(now * 1.5) * 0.08; }

// ---------- storybook buildings: chunky overhanging roofs, cream gables,
// a stone footing and flower boxes under the windows ----------
function paintShingleV(d, N) {
  const rows = 4, cols = 7, n = periodicNoise(N, 16, 52);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, fx = (x / N) * rows, row = Math.floor(fx), tx = fx - row, off = (row % 2) * 0.5;
    const fy = (y / N) * cols + off, ty = fy - Math.floor(fy);
    const sc = Math.sqrt(Math.max(0, 1 - Math.pow((ty - 0.5) * 2, 2))) * 0.35;
    const inside = tx < 0.62 + sc, v = inside ? 0.78 + 0.26 * (tx / (0.62 + sc)) : 0.6;
    const vv = v * (0.94 + 0.1 * n[i]) * (Math.abs(ty - 0.5) > 0.46 ? 0.82 : 1);
    d[i * 4] = vv * 255; d[i * 4 + 1] = 128; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255;
  }
}
// merge pieces into one mesh so a building costs one or two draw calls
function mergeGeos(list, withUv = false) {
  const pos = [], nor = [], col = [], uv = [], c = new T3.Color(), M = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler();
  for (const it of list) {
    const g = (it.geo.index ? it.geo.toNonIndexed() : it.geo.clone());
    e.set(it.rx || 0, it.ry || 0, it.rz || 0); q.setFromEuler(e); M.compose(new T3.Vector3(it.x || 0, it.y || 0, it.z || 0), q, new T3.Vector3(1, 1, 1)); g.applyMatrix4(M);
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv; c.set(it.color || '#ffffff');
    for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nor.push(N.getX(i), N.getY(i), N.getZ(i)); col.push(c.r, c.g, c.b); if (withUv) uv.push(U ? U.getX(i) : 0, U ? U.getY(i) : 0); }
    g.dispose();
  }
  const out = new T3.BufferGeometry();
  out.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new T3.Float32BufferAttribute(nor, 3)); out.setAttribute('color', new T3.Float32BufferAttribute(col, 3));
  if (withUv) out.setAttribute('uv', new T3.Float32BufferAttribute(uv, 2));
  out.computeBoundingSphere();
  return out;
}
function chunkyRoof(w, d, h, mat) {
  if (!TEX.shingleV) TEX.shingleV = texFrom(128, paintShingleV);
  const g = new T3.Group(), col = hexOf(mat), half = w / 2, s = Math.hypot(half, h), th = Math.atan2(h, half), t = 0.34, ov = 0.55, dz = d + 0.8, len = s + ov;
  const rm = detailMat('roofS' + Math.round(len * 2), col, TEX.shingleV, [Math.max(1, len / 1.5), Math.max(1, dz / 2.2)], { roughness: 0.75 }, 0, 0.6, 1.14);
  const panels = [];
  for (const side of [-1, 1]) {
    const dir = new T3.Vector2(-side * half, h).divideScalar(s), nrm = new T3.Vector2(side * h, half).divideScalar(s);
    const c = new T3.Vector2(side * half / 2, h / 2).addScaledVector(dir, -ov / 2).addScaledVector(nrm, t / 2);
    panels.push({ geo: roundedBoxGeo(len, t, dz, 0.12), x: c.x, y: c.y, rz: -side * th });
  }
  const pg = mergeGeos(panels, true); pg.deleteAttribute('color');
  g.add(mesh(pg, rm, 0, 0, 0));
  const sh = new T3.Shape(); sh.moveTo(-half + 0.08, 0); sh.lineTo(0, h - 0.06); sh.lineTo(half - 0.08, 0); sh.lineTo(-half + 0.08, 0);
  const gg = new T3.ExtrudeGeometry(sh, { depth: d - 0.1, bevelEnabled: false }); gg.translate(0, 0, -(d - 0.1) / 2);
  const bits = [{ geo: cyl(0.24, 0.24, dz + 0.12, 12), y: h + t * 0.72, rx: Math.PI / 2, color: '#' + new T3.Color(col).multiplyScalar(0.72).getHexString() }, { geo: gg, color: '#fbf1e2' }];
  if (h > 1.8) { const r = Math.min(0.55, h * 0.18); bits.push({ geo: new T3.CircleGeometry(r + 0.1, 20), y: h * 0.38, z: d / 2 - 0.03, color: '#ffffff' }, { geo: new T3.CircleGeometry(r, 20), y: h * 0.38, z: d / 2 - 0.02, color: '#9fc8e8' }); }
  g.add(mesh(mergeGeos(bits), bakedMat('trim', { roughness: 0.7 }), 0, 0, 0));
  return g;
}
function gfxShopDeco(g, W, D, wall) {
  if (!gfxOn()) return;
  const base = new T3.Color(wall).lerp(new T3.Color('#8a7a86'), 0.45);
  const bits = [{ geo: roundedBoxGeo(W + 0.24, 0.6, D + 0.24, 0.12), y: 0.3, color: '#' + base.getHexString() }];
  for (const x of [-W / 2, W / 2]) bits.push({ geo: roundedBoxGeo(0.34, 6.2, 0.34, 0.1), x, y: 3.1, z: D / 2, color: '#fbf1e2' });
  g.add(mesh(mergeGeos(bits), bakedMat('trim', { roughness: 0.7 }), 0, 0, 0));
}
function gfxWindowBox(g, x, y, z) {
  if (!gfxOn()) return;
  const cols = ['#ff7a8a', '#ffd23f', '#ffffff', '#ff9ec7', '#b98cff'], h = hashStr(`${x}|${z}|${y}`);
  const bits = [{ geo: roundedBoxGeo(2.56, 2.16, 0.14, 0.06), x, y, z: z - 0.06, color: '#fbf1e2' }, { geo: roundedBoxGeo(2.7, 0.14, 0.42, 0.05), x, y: y - 1.05, z: z + 0.12, color: '#fbf1e2' }, { geo: roundedBoxGeo(2.3, 0.38, 0.38, 0.08), x, y: y - 1.32, z: z + 0.2, color: '#b98a5e' }];
  for (let i = 0; i < 5; i++) bits.push({ geo: sph(0.16, 8, 6), x: x - 0.9 + i * 0.45, y: y - 1.02, z: z + 0.22, color: cols[(h + i * 3) % cols.length] }, { geo: sph(0.13, 6, 5), x: x - 0.68 + i * 0.45, y: y - 1.1, z: z + 0.26, color: '#5fae5a' });
  g.add(mesh(mergeGeos(bits), bakedMat('trim', { roughness: 0.7 }), 0, 0, 0));
}

