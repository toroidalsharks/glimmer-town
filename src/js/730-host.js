// ============================================================
// HOST: taps in the 3D town
// ============================================================
function wireTownInput() {
  const ray = new T3.Raycaster(), ndc = new T3.Vector2();
  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; lastTouch = now; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 8) return;
    const r = renderer.domElement.getBoundingClientRect();
    let x = e.clientX - r.left; if (cfg.mirror) x = r.width - x;
    ndc.set((x / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    if (interior) {
      ray.setFromCamera(ndc, roomCam);
      const h = ray.intersectObjects(roomScene.children, true).find((i) => i.object.userData.tap);
      if (!h) { releaseDlg(); return; }
      const tp = h.object.userData.tap;
      if (interior.kind === 'labs' && (tp.kind === 'person' || tp.kind === 'desk')) { openLab(tp.pid); return; }
      if (interior.kind === 'clinic' && tp.kind === 'person') { clinicTap(tp.pid); return; }
      if (tp.kind === 'person') { const q = person(tp.pid); const asleep = q && q.inside && q.task?.kind === 'home' && (W.t >= 0.6 || W.t < 0.02); openInteract(tp.pid, asleep ? { text: 'Mmm… zzz… Huh? Creator? It\'s the middle of the night…' } : {}); }
      else if (tp.kind === 'buy') openBuy(tp.shop, tp.uid, tp.food);
      else if (tp.kind === 'shelf') { shopTab = 'books'; bookSubj = tp.subj; activeTab = 'shops'; openSheet(); }
      else if (tp.kind === 'judge') { activeTab = 'court'; openSheet(); }
      else if (tp.kind === 'arcade') { Sound.levelup(); toast(pick(['High score!', 'Game over. Insert coin?', 'You beat the boss!', 'New record: AAA'])); }
      return;
    }
    ray.setFromCamera(ndc, camera);
    if (placing) {
      const pt = new T3.Vector3(); ray.ray.intersectPlane(new T3.Plane(new T3.Vector3(0, 1, 0), 0), pt);
      const prob = pt ? spotProblem(pt.x, pt.z, BUILDS[placing.type]?.size || 0) : 'Pick a spot on land.';
      if (prob) { toast(prob); return; }
      const res = applyCmd({ t: 'place', type: placing.type, x: pt.x, z: pt.z }); toast(res); cancelPlacing(); return;
    }
    const roots = [...meshes.values()].filter((m) => m.root.visible).map((m) => m.root);
    const hit = ray.intersectObjects([...roots, ...tappables], true)[0];
    if (document.body.classList.contains('ghost')) { if (!hit) document.body.classList.remove('ghost'); return; }
    if (!hit) { releaseDlg(); if (openDetail && !sheet.hidden) { openDetail = null; refreshPanel(true); } return; }
    let o = hit.object; while (o && !o.userData.tap && !o.userData.pid) o = o.parent;
    if (!o) return;
    if (o.userData.pid && !o.userData.tap) { openInteract(o.userData.pid); return; }
    const tp = o.userData.tap;
    if (tp.kind === 'shop') { openInterior({ kind: 'shop', shop: tp.shop }); }
    else if (tp.kind === 'mail') { activeTab = 'mail'; mailOpen = null; openSheet(); }
    else if (tp.kind === 'fish') openFishing();
    else if (tp.kind === 'hall') openInterior({ kind: 'hall' });
    else if (tp.kind === 'labs') openInterior({ kind: 'labs', wing: labWingLast });
    else if (tp.kind === 'clinic') openInterior({ kind: 'clinic' });
    else if (tp.kind === 'robot') robotTap(tp.id);
    else if (tp.kind === 'tgarden') { const r = applyCmd({ t: 'gather', bed: 'tgarden', x: TOWN.garden.spot[0], z: TOWN.garden.spot[1] }); if (r) toast(r); }
    else if (tp.kind === 'placed') { const pl = (W.placed || []).find((q) => q.id === tp.id); if (pl && ['flowers', 'planter', 'arch', 'tree'].includes(pl.type)) { const r = applyCmd({ t: 'gather', bed: pl.id, wood: pl.type === 'tree', x: pl.x, z: pl.z }); if (r) toast(r); } }
    else if (['orchard', 'boulder', 'crystal', 'scrap'].includes(tp.kind)) { const r = applyCmd({ t: 'landtap', kind: tp.kind, id: tp.id, x: tp.x, z: tp.z }); if (r) toast(r); }
    else if (tp.kind === 'node' || tp.kind === 'tree') { const r = applyCmd({ t: 'gather', id: tp.id, tree: tp.kind === 'tree', x: tp.x, z: tp.z }); if (r) toast(r); }
    else if (tp.kind === 'pc') { toast(`The public computer at Paper Moon Books. Anyone can read the Outside here. ${W.people.filter((q) => q.task?.pc).map((q) => q.name).join(' and ') || 'Nobody'} ${W.people.filter((q) => q.task?.pc).length === 1 ? 'is' : 'are'} on it right now.`); Sound.ui(); }
    else if (tp.kind === 'shine') { const r = applyCmd({ t: 'shine', id: tp.id }); if (r) toast(r); }
    else if (tp.kind === 'plot') { activeTab = 'gifts'; openSheet(); $('#pane-gifts').scrollTop = 0; }
    else if (tp.kind === 'ghost') ghostTap(tp.id);
    else if (tp.kind === 'crimescene') { activeTab = 'court'; openSheet(); }
    else if (tp.kind === 'memorial') { const m = crimeState().memorials.find((x) => x.id === tp.id); if (m) { toast(`🕯 ${m.name}. Day ${m.born} to day ${m.died}. Loved here.`); Sound.bell(); } }
    else if (tp.kind === 'cat') { toast(`${catName()} ${pick(['purrs.', 'blinks at you slowly.', 'ignores you, like a cat.', 'rolls over for belly rubs. It is a trap.', 'meows at Mili.'])}`); Sound.ui(); }
    else if (tp.kind === 'snowman') { toast(`A snowman ${tp.by} built on day ${tp.day}.`); Sound.ui(); }
    else if (tp.kind === 'room') { const p = W.people.find((q) => q.room === tp.room); if (p) { openInterior({ kind: 'room', id: p.id }); if (p.inside && p.task?.kind === 'home' && W.t < 0.6 && W.t >= 0.02) setTimeout(() => openInteract(p.id), 400); } else toast(`Room ${tp.room + 1} is empty. A baby might move in someday.`); }
  });
}

