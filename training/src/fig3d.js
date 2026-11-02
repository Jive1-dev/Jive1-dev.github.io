// ---------- 3D-Figuren (Claude B) ----------
// Macht aus den bestehenden Posen (figures.js: FIGS, figState, figBox, MUSCLE_SEG, FRONT_VIEW) einen 3D-Körper
// mit Volumen, Licht und Schatten. Ersetzt jede gezeichnete Figur (svg.fig) durch ein Canvas.
// Ein einziger WebGL-Renderer zeichnet alle Figuren nacheinander (Handys erlauben nur wenige WebGL-Kontexte).
// Ohne WebGL bleibt die gezeichnete Figur stehen.
const F3D = (() => {
  if (typeof THREE === "undefined") return null;
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
  } catch (e) { return null; }
  if (!renderer.getContext()) return null;

  const C = { prop: 0x5a4632, metal: 0x2b2b2e };
  // Bronze-Statue mit glühend roten Arbeitsmuskeln (Spartan-Stil)
  const mat = {
    skin: new THREE.MeshStandardMaterial({ color: 0xc08a4e, roughness: 0.34, metalness: 0.78 }),
    skinFar: new THREE.MeshStandardMaterial({ color: 0x8c6237, roughness: 0.42, metalness: 0.72 }),
    muscle: new THREE.MeshStandardMaterial({ color: 0x8e0f0a, roughness: 0.28, metalness: 0.45, emissive: 0x5a0402, emissiveIntensity: 0.7 }),
    muscleFar: new THREE.MeshStandardMaterial({ color: 0x5e0b07, roughness: 0.36, metalness: 0.45, emissive: 0x2e0201, emissiveIntensity: 0.6 }),
    crest: new THREE.MeshStandardMaterial({ color: 0x7a0d08, roughness: 0.85, metalness: 0.0, emissive: 0x1e0201, emissiveIntensity: 0.4 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x24201c, roughness: 0.5, metalness: 0.35 }),
    floor: new THREE.MeshStandardMaterial({ color: 0x0f0c0a, roughness: 1, metalness: 0, envMapIntensity: 0.15 }),
    metal: new THREE.MeshStandardMaterial({ color: C.metal, roughness: 0.32, metalness: 0.75 }),
    wall: new THREE.MeshStandardMaterial({ color: 0x2a241d, roughness: 0.9 }),
    towel: new THREE.MeshStandardMaterial({ color: 0x6d5a3e, roughness: 0.95 }),
    ball: new THREE.MeshStandardMaterial({ color: 0x3b3430, roughness: 0.7 }),
    shadow: new THREE.ShadowMaterial({ opacity: 0.38 })
  };
  const SPH = new THREE.SphereGeometry(1, 40, 28);
  // Weicher Bronzeschimmer am Boden (unbeleuchtet, läuft nach aussen aus)
  const GLOW = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
    const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, "rgba(120,82,44,0.55)"); r.addColorStop(0.45, "rgba(70,48,28,0.35)"); r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false });
  })();
  // Umgebung für Metall-Spiegelungen: dunkler Raum mit warmen und kühlen Lichtflächen
  let ENV = null;
  try {
    const es = new THREE.Scene(); es.background = new THREE.Color(0x0b0907);
    const panel = (c, x, y, z, w, h, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry; m.lookAt(0, 0, 0); es.add(m); };
    panel(0xfff0d8, 3, 6, 6, 6, 4); panel(0xd28f44, -7, 2, -4, 5, 6); panel(0x6f88a8, -6, 1, 6, 3, 3); panel(0x3a2a1a, 0, -6, 0, 12, 12);
    const pm = new THREE.PMREMGenerator(renderer); ENV = pm.fromScene(es, 0.04).texture; pm.dispose();
  } catch (e) { ENV = null; }
  const CYL = new THREE.CylinderGeometry(1, 1, 1, 28);
  const BOX = new THREE.BoxGeometry(1, 1, 1);
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const P = (pt, z = 0) => V(pt[0], 110 - pt[1], z);      // Pose-Koordinate → Welt (y nach oben, Boden = 0)
  const WZ = V(0, 0, 1), WX = V(1, 0, 0);

  // Ellipsoid zwischen zwei Punkten. w = Breite (quer zur Blickrichtung), d = Tiefe, ext = Überlappung an den Enden
  function placeSeg(mesh, a, b, w, d, ext = 1.0, refAxis = WZ){
    const dir = b.clone().sub(a); const len = Math.max(dir.length(), 0.001); dir.divideScalar(len);
    let ref = refAxis.clone(); if (Math.abs(dir.dot(ref)) > 0.95) ref = Math.abs(dir.dot(WX)) > 0.95 ? V(0, 1, 0) : WX.clone();
    const x = new THREE.Vector3().crossVectors(dir, ref).normalize(); const z = new THREE.Vector3().crossVectors(x, dir).normalize();
    const m = new THREE.Matrix4().makeBasis(x, dir, z);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromRotationMatrix(m);
    mesh.scale.set(d / 2, len / 2 + ext, w / 2);
  }
  function placeCyl(mesh, a, b, r){
    const dir = b.clone().sub(a); const len = dir.length(); dir.normalize();
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
    mesh.scale.set(r, len, r);
  }
  const mesh = (geo, m, cast = true) => { const o = new THREE.Mesh(geo, m); o.castShadow = cast; o.receiveShadow = true; return o; };

  // ---------- Geräte ----------
  function props(group, f){
    (f.props || []).forEach(([k, x]) => {
      const add = (o) => { group.add(o); return o; };
      if ((k === "chair" || k === "chairL") && f === FIGS.dip){
        [-1, 1].forEach(sd => {
          const z = sd * 24, seat = add(mesh(BOX, mat.wood)); seat.scale.set(30, 3, 26); seat.position.set(100, 26.5, z);
          [[87, z - 11], [113, z - 11], [87, z + 11], [113, z + 11]].forEach(([lx, lz]) => { const l = add(mesh(CYL, mat.wood)); l.scale.set(1.3, 25, 1.3); l.position.set(lx, 12.5, lz); });
        });
      } else if (k === "chair" || k === "chairL"){
        const seat = add(mesh(BOX, mat.wood)); seat.scale.set(32, 3, 30); seat.position.set(x + 16, 28 - 1.5, 0);
        [[x + 2, -12], [x + 30, -12], [x + 2, 12], [x + 30, 12]].forEach(([lx, lz]) => { const l = add(mesh(CYL, mat.wood)); l.scale.set(1.3, 26.5, 1.3); l.position.set(lx, 13.2, lz); });
        const bx = k === "chair" ? x + 31 : x + 1;
        const back = add(mesh(BOX, mat.wood)); back.scale.set(2.5, 30, 30); back.position.set(bx, 28 + 15, 0);
      } else if (k === "par"){
        [-10, 10].forEach(z => {
          const bar = add(mesh(CYL, mat.metal)); bar.scale.set(1.5, 22, 1.5); bar.rotation.z = Math.PI / 2; bar.position.set(x, 12, z);
          [-8, 8].forEach(dx => { const leg = add(mesh(CYL, mat.metal)); leg.scale.set(1.1, 12, 1.1); leg.position.set(x + dx, 6, z); });
          const foot = add(mesh(BOX, mat.metal)); foot.scale.set(20, 1.2, 4); foot.position.set(x, 0.6, z);
        });
      } else if (k === "stair"){
        const st = add(mesh(BOX, mat.wood)); st.scale.set(70, 10, 46); st.position.set(x + 35, 5, 0);
      } else if (k === "wall"){
        const w = add(mesh(BOX, mat.wall, false)); w.scale.set(3, 140, 70); w.position.set(x + 1.5, 70, 0);
      } else if (k === "bar"){
        const b = add(mesh(CYL, mat.metal)); b.scale.set(1.3, 60, 1.3); b.rotation.x = Math.PI / 2; b.position.set(x, 114, 0);
      } else if (k === "towel"){
        const t = add(mesh(BOX, mat.towel)); t.scale.set(28, 0.8, 18); t.position.set(x, 0.4, 0);
      }
    });
  }

  // ---------- Körper ----------
  const PARTS = ["chest", "belly", "pelvis", "neck", "head", "crest", "delt0", "delt1", "glute",
    "ua0", "el0", "fa0", "hand0", "ua1", "el1", "fa1", "hand1", "th0", "kn0", "sh0", "ft0", "th1", "kn1", "sh1", "ft1", "db0", "db1", "ball"];
  function buildScene(id, muscles){
    const f = FIGS[id], scene = new THREE.Scene(), body = {}; if (ENV) scene.environment = ENV;
    const on = new Set(); (muscles || []).forEach(m => (MUSCLE_SEG[m] || []).forEach(s => on.add(s)));
    const segOf = k => k.replace(/[01]$/, "").replace("glute", "hip").replace("pelvis", "belly").replace(/^el$/, "x").replace(/^kn$/, "x");
    PARTS.forEach(k => {
      let o;
      if (k === "db0" || k === "db1"){
        if (!(f.db || []).includes(+k[2])) return;
        o = new THREE.Group(); const h = mesh(CYL, mat.metal); h.scale.set(0.9, 11, 0.9); h.rotation.x = Math.PI / 2; o.add(h);
        [-5, 5].forEach(z => { const pl = mesh(CYL, mat.metal); pl.scale.set(3.6, 2.4, 3.6); pl.rotation.x = Math.PI / 2; pl.position.z = z; o.add(pl); });
      } else if (k === "crest"){
        o = mesh(SPH, mat.crest);
      } else if (k === "ball"){
        if (!f.k.some(s => s.ball)) return; o = mesh(SPH, mat.ball);
      } else {
        const far = /1$/.test(k) && !FRONT_VIEW.has(id);
        const m = on.has(segOf(k)) || (k.startsWith("delt") && on.has("delt"));
        o = mesh(SPH, m ? (far ? mat.muscleFar : mat.muscle) : (far ? mat.skinFar : mat.skin));
      }
      body[k] = o; scene.add(o);
    });
    const props3 = new THREE.Group(); props(props3, f); scene.add(props3);
    // Boden: Schatten + feine Linie
    const [bx0, , bw0] = figBox(id);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(Math.max(70, bw0 * 0.55), 64), GLOW); disc.rotation.x = -Math.PI / 2; disc.position.set(bx0 + bw0 / 2, -0.05, 0); scene.add(disc);
    const floor = mesh(new THREE.PlaneGeometry(600, 300), mat.shadow, false); floor.rotation.x = -Math.PI / 2; floor.position.set(100, 0.02, 0); scene.add(floor);
    // Licht: warmes Hauptlicht mit Schatten, bronzenes Gegenlicht, kühles Fülllicht
    scene.add(new THREE.HemisphereLight(0xfff4e2, 0x1a120c, 0.55));
    const key = new THREE.DirectionalLight(0xfff1dc, 1.55); key.position.set(60, 190, 160); key.target.position.set(100, 40, 0);
    key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 4; key.shadow.bias = -0.0008;
    Object.assign(key.shadow.camera, { left: -140, right: 140, top: 150, bottom: -60, near: 10, far: 500 });
    scene.add(key, key.target);
    const rim = new THREE.DirectionalLight(0xd09a55, 1.1); rim.position.set(180, 120, -170); scene.add(rim);
    const fill = new THREE.DirectionalLight(0x9fb4d0, 0.35); fill.position.set(-120, 60, 80); scene.add(fill);
    return { scene, body, id };
  }

  const SH = 9.5, HIP = 5.2;   // halbe Schulter- und Hüftbreite
  function pose(st, S){
    const { body: B, id } = st, front = FRONT_VIEW.has(id);
    const off = (i, w) => front ? V(i ? -w : w, 0, 0) : V(0, 0, i ? -w : w);
    const n = P(S.n), m = P(S.m), p = P(S.p), h = P(S.h);
    const ref = front ? WX : WZ;
    placeSeg(B.chest, n.clone().lerp(m, -0.12), m, 23, 15, 3.5, ref);
    placeSeg(B.belly, m, p, 18.5, 12.5, 3, ref);
    placeSeg(B.pelvis, p.clone().lerp(m, 0.18), p.clone().lerp(m, -0.25), 19.5, 13, 1.5, ref);
    const hc = n.clone().lerp(h, 0.92), hd = h.clone().sub(n).normalize();
    placeSeg(B.neck, n.clone().addScaledVector(hd, -2), n.clone().addScaledVector(hd, 6), 7.5, 7.5, 0.5, ref);
    placeSeg(B.head, hc.clone().addScaledVector(hd, -6.4), hc.clone().addScaledVector(hd, 6.8), 13, 14.5, 0.6, ref);
    // Spartaner-Helmkamm: zeigt, wo vorne ist (Kopf oben, von der Stirn nach hinten)
    const hf = front ? V(0, 0, 1) : V(hd.y, -hd.x, 0);
    const top = hc.clone().addScaledVector(hd, 6.2);
    placeSeg(B.crest, top.clone().addScaledVector(hf, 5.5).addScaledVector(hd, 1.5), top.clone().addScaledVector(hf, -11).addScaledVector(hd, -2.5), front ? 9 : 3.2, 9, 1.2, front ? WX : WZ);
    const glOff = p.clone().sub(m).normalize();
    // Po: hinter der Hüfte (Gegenrichtung zur Blickrichtung). Blickrichtung ≈ senkrecht zur Wirbelsäule in der Bildebene.
    const spine = n.clone().sub(p).normalize(); const fwd = front ? V(0, 0, 1) : V(spine.y, -spine.x, 0);
    B.glute.position.copy(p).addScaledVector(fwd, -4.5).addScaledVector(glOff, -1.5); B.glute.scale.set(front ? 10 : 7.5, 7.5, front ? 6.5 : 10.5);
    [0, 1].forEach(i => {
      const arm = S.arms[i] || S.arms[0], leg = S.legs[i] || S.legs[0];
      if (arm){
        const o = off(i, SH), sh = n.clone().add(o).addScaledVector(spine, -3), el = P(arm[0]).add(o), wr = P(arm[1]).add(o);
        B["delt" + i].position.copy(sh); B["delt" + i].scale.set(5.6, 5.6, 5.6);
        placeSeg(B["ua" + i], sh, el, 8.2, 7.6, 1.2, ref);
        placeSeg(B["fa" + i], el, wr, 6.6, 6, 1.0, ref);
        B["el" + i].position.copy(el); B["el" + i].scale.set(3.4, 3.4, 3.4); B["el" + i].visible = true;
        B["hand" + i].position.copy(wr).addScaledVector(wr.clone().sub(el).normalize(), 2.2); B["hand" + i].scale.set(2.9, 3.4, 2.9);
        if (B["db" + i]){ B["db" + i].position.copy(wr).addScaledVector(wr.clone().sub(el).normalize(), 2.5); B["db" + i].rotation.set(0, front ? Math.PI / 2 : 0, 0); }
        [B["delt" + i], B["ua" + i], B["fa" + i], B["hand" + i]].forEach(o2 => o2.visible = true);
      } else ["delt", "ua", "el", "fa", "hand"].forEach(k => B[k + i].visible = false);
      if (leg){
        const o = off(i, HIP), hip = p.clone().add(o), kn = P(leg[0]).add(o), an = P(leg[1]).add(o);
        placeSeg(B["th" + i], hip, kn, 11.5, 10.5, 2, ref);
        placeSeg(B["sh" + i], kn, an, 8, 7.8, 1.2, ref);
        B["kn" + i].position.copy(kn); B["kn" + i].scale.set(4.6, 4.6, 4.6); B["kn" + i].visible = true;
        if (leg[2]){ placeSeg(B["ft" + i], an, P(leg[2]).add(o), 5.2, 4.2, 1.6, ref); B["ft" + i].visible = true; }
        else { B["ft" + i].position.copy(an).add(V(1.5, -1, 0)); B["ft" + i].scale.set(4.5, 2.6, 3); B["ft" + i].visible = true; }
        [B["th" + i], B["sh" + i]].forEach(o2 => o2.visible = true);
      } else ["th", "kn", "sh", "ft"].forEach(k => B[k + i].visible = false);
    });
    if (B.ball && S.arms[0]){ const a = P(S.arms[0][1]), b2 = P((S.arms[1] || S.arms[0])[1]); B.ball.position.copy(a).add(b2).multiplyScalar(0.5).add(V(0, 4, 0)); B.ball.scale.set(7, 7, 7); }
  }

  // ---------- Kamera und Zeichnen ----------
  const cam = new THREE.PerspectiveCamera(26, 1.39, 5, 2000);
  function aimCamera(id, aspect){
    const [bx, by, bw, bh] = figBox(id);
    const cx = bx + bw / 2, cy = 110 - (by + bh / 2);
    const front = FRONT_VIEW.has(id), wall = (FIGS[id].props || []).find(([k]) => k === "wall");
    const wallRight = wall && wall[1] > cx;
    const S0 = solve(figKeys(id)[0]), lying = Math.abs(S0.n[1] - S0.p[1]) < 16;
    const yaw = (front ? -24 : wallRight ? -30 : 24) * Math.PI / 180, pitch = (lying ? 20 : 9) * Math.PI / 180;
    cam.aspect = aspect; cam.fov = 26; cam.updateProjectionMatrix();
    const vf = cam.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
    const dist = Math.max((bw * 0.5) / Math.tan(hf / 2), (bh * 0.5) / Math.tan(vf / 2)) * 1.06 + 40;
    cam.position.set(cx + Math.sin(yaw) * dist, cy + Math.sin(pitch) * dist, Math.cos(yaw) * dist);
    cam.lookAt(cx, cy - 4, 0);
  }
  function draw(item, now){
    const { cv, st, id } = item;
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H){ cv.width = W; cv.height = H; }
    pose(st, now == null ? solve(figKeys(id)[0]) : figState(id, now));
    renderer.setSize(W, H, false); aimCamera(id, W / H);
    renderer.render(st.scene, cam);
    const ctx = item.ctx || (item.ctx = cv.getContext("2d")); ctx.clearRect(0, 0, W, H); ctx.drawImage(renderer.domElement, 0, 0);
  }

  const items = new Set();
  const obs = typeof IntersectionObserver === "function" ? new IntersectionObserver(es => es.forEach(e => { e.target.__vis = e.isIntersecting; }), { rootMargin: "80px" }) : null;
  function upgrade(root){
    root.querySelectorAll("svg.fig").forEach(svg => {
      if (svg.dataset.f3d) return; svg.dataset.f3d = 1;
      const id = FIGS[svg.dataset.fig] ? svg.dataset.fig : "squat", mus = (svg.dataset.mu || "").split(" ").filter(Boolean);
      const cv = document.createElement("canvas"); cv.className = svg.getAttribute("class").replace(/\bfig\b/, "fig fig3d"); cv.dataset.fig = id;
      cv.setAttribute("role", "img"); cv.setAttribute("aria-label", "Figur zeigt die Übung");
      const [, , bw, bh] = figBox(id); cv.style.aspectRatio = `${bw} / ${bh}`; cv.style.height = "auto";
      svg.replaceWith(cv);
      const big = cv.getBoundingClientRect().width >= 200;
      const item = { cv, id, st: buildScene(id, mus), big };
      cv.__vis = true; obs && obs.observe(cv);
      items.add(item);
      requestAnimationFrame(() => draw(item, big && !REDUCED ? performance.now() : null));
    });
  }
  function loop(now){
    for (const it of items){
      if (!it.cv.isConnected){ items.delete(it); obs && obs.unobserve(it.cv); continue; }
      if (it.big && !REDUCED && it.cv.__vis !== false) draw(it, now);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return { upgrade, items };
})();

// Bestehende Aufrufe von mountFigs bekommen automatisch die 3D-Figur
if (F3D){
  const mount2D = mountFigs;
  mountFigs = function(root){ mount2D(root); F3D.upgrade(root); };
}
