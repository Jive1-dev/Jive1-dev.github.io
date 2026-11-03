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
    glass: new THREE.MeshStandardMaterial({ color: 0x3a332c, roughness: 0.4, metalness: 0.3, transparent: true, opacity: 0.38, depthWrite: false }),
    towel: new THREE.MeshStandardMaterial({ color: 0x6d5a3e, roughness: 0.95 }),
    ball: new THREE.MeshStandardMaterial({ color: 0x3b3430, roughness: 0.7 }),
    shadow: new THREE.ShadowMaterial({ opacity: 0.38 })
  };
  const GREY = {
    skin: new THREE.MeshStandardMaterial({ color: 0xc8c5bf, roughness: 0.58, metalness: 0.03 }), skinFar: new THREE.MeshStandardMaterial({ color: 0x9d9a94, roughness: 0.62, metalness: 0.03 }),
    muscle: new THREE.MeshStandardMaterial({ color: 0xc81e12, roughness: 0.5, metalness: 0.03 }), muscleFar: new THREE.MeshStandardMaterial({ color: 0x8e150c, roughness: 0.55, metalness: 0.03 })
  };  Object.values(GREY).forEach(m => m.color.convertSRGBToLinear());

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
          const z = sd * 26, seat = add(mesh(BOX, mat.glass)); seat.scale.set(30, 3, 22); seat.position.set(100, 26.5, z); seat.castShadow = false;
          [[87, z - 9], [113, z - 9], [87, z + 9], [113, z + 9]].forEach(([lx, lz]) => { const l = add(mesh(CYL, mat.glass)); l.scale.set(1.3, 25, 1.3); l.position.set(lx, 12.5, lz); });
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
  const PARTS = ["chest", "pec0", "pec1", "abs", "trap", "belly", "pelvis", "neck", "head", "crest", "delt0", "delt1", "glute",
    "ua0", "el0", "fa0", "hand0", "ua1", "el1", "fa1", "hand1", "th0", "kn0", "sh0", "ft0", "th1", "kn1", "sh1", "ft1", "db0", "db1", "ball"];
  // Posen mit sehr starker Hüftbeugung (> 150°, z. B. Krähe, Frosch, Tuck-Planche) bleiben vorerst bei der runden Statue:
  // dort reisst der Anatomie-Körper noch (abgesprochen mit A, bis zur echten Lösung).
  const DEEP = new Map();
  function deepFlex(id){
    if (DEEP.has(id)) return DEEP.get(id);
    let max = 0;
    figKeys(id).forEach(K => { const S = solve(K), dx = S.n[0] - S.p[0], dy = S.n[1] - S.p[1];
      S.legs.forEach(L => { if (!L) return; const tx = L[0][0] - S.p[0], ty = L[0][1] - S.p[1];
        const a = Math.acos(Math.max(-1, Math.min(1, (dx * tx + dy * ty) / (Math.hypot(dx, dy) * Math.hypot(tx, ty) || 1)))) * 180 / Math.PI; max = Math.max(max, 180 - a); }); });
    const r = !window.__noFallback && !FRONT_VIEW.has(id) && max > 150; DEEP.set(id, r); return r;
  }
  function buildScene(id, muscles){
    const f = FIGS[id], scene = new THREE.Scene(), body = {}; if (ENV) scene.environment = ENV;
    const on = new Set(); (muscles || []).forEach(m => (MUSCLE_SEG[m] || []).forEach(s => on.add(s)));
    const segOf = k => k.replace(/[01]$/, "").replace("glute", "hip").replace("pelvis", "belly").replace(/^el$/, "x").replace(/^kn$/, "x")
      .replace(/^pec$/, "chest").replace(/^trap$/, "neck").replace(/^abs$/, "belly");
    const ana = typeof BODY3D !== "undefined" && !deepFlex(id) ? anatomyMesh(muscles) : null; if (ana) scene.add(ana);
    PARTS.forEach(k => {
      let o;
      if (ana && !/^db|^ball/.test(k)) return;
      if (k === "db0" || k === "db1"){
        if (!(f.db || []).includes(+k[2])) return;
        o = new THREE.Group(); const h = mesh(CYL, mat.metal); h.scale.set(0.9, 11, 0.9); h.rotation.x = Math.PI / 2; o.add(h);
        [-5, 5].forEach(z => { const pl = mesh(CYL, mat.metal); pl.scale.set(3.6, 2.4, 3.6); pl.rotation.x = Math.PI / 2; pl.position.z = z; o.add(pl); });
      } else if (k === "crest"){
        if (typeof BODY3D !== "undefined") return;
        o = mesh(SPH, mat.crest);
      } else if (k === "ball"){
        if (!f.k.some(s => s.ball)) return; o = mesh(SPH, mat.ball);
      } else {
        const far = /1$/.test(k) && !FRONT_VIEW.has(id);
        const m = on.has(segOf(k)) || (k.startsWith("delt") && on.has("delt"));
        const G2 = typeof BODY3D !== "undefined";   // neben Anatomie-Figuren: gleiches mattes Grau statt Bronze
        o = mesh(SPH, m ? (far ? (G2 ? GREY.muscleFar : mat.muscleFar) : (G2 ? GREY.muscle : mat.muscle)) : (far ? (G2 ? GREY.skinFar : mat.skinFar) : (G2 ? GREY.skin : mat.skin)));
      }
      body[k] = o; scene.add(o);
    });
    const props3 = new THREE.Group(); props(props3, f); scene.add(props3);
    // Boden: Schatten + feine Linie
    const [bx0, , bw0] = figBox(id);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(Math.max(70, bw0 * 0.55), 64), GLOW); disc.rotation.x = -Math.PI / 2; disc.position.set(bx0 + bw0 / 2, -0.05, 0); scene.add(disc);
    const floor = mesh(new THREE.PlaneGeometry(600, 300), mat.shadow, false); floor.rotation.x = -Math.PI / 2; floor.position.set(100, 0.02, 0); scene.add(floor);
    // Licht: warmes Hauptlicht mit Schatten, bronzenes Gegenlicht, kühles Fülllicht
    const matte = typeof BODY3D !== "undefined";
    scene.add(new THREE.HemisphereLight(0xfff4e2, 0x1a120c, matte ? 0.3 : 0.55));
    const key = new THREE.DirectionalLight(0xfff1dc, matte ? 1.35 : 1.55); key.position.set(60, 190, 160); key.target.position.set(100, 40, 0);
    key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 4; key.shadow.bias = -0.0008;
    Object.assign(key.shadow.camera, { left: -140, right: 140, top: 150, bottom: -60, near: 10, far: 500 });
    scene.add(key, key.target);
    const rim = new THREE.DirectionalLight(0xd09a55, 1.1); rim.position.set(180, 120, -170); scene.add(rim);
    const fill = new THREE.DirectionalLight(0x9fb4d0, 0.35); fill.position.set(-120, 60, 80); scene.add(fill);
    return { scene, body, id, ana, props: props3 };
  }

  const SH = 9.5, HIP = 5.2;   // halbe Schulter- und Hüftbreite
  function poseAna(st, S){
    const { body: B, id } = st, front = FRONT_VIEW.has(id);
    const off = (i, w) => front ? V(i ? -w : w, 0, 0) : V(0, 0, i ? -w : w);
    const n = P(S.n), m = P(S.m), p = P(S.p), h = P(S.h), spine = n.clone().sub(p).normalize();
    const fwd = front ? V(0, 0, 1) : V(spine.y, -spine.x, 0);
    const SHW = 0.172 * G, HW = 0.085 * G;
    const arm = i => S.arms[i] || S.arms[0], leg = i => S.legs[i] || S.legs[0];
    const sh = i => n.clone().add(off(i, SHW)).addScaledVector(spine, -0.055 * G);
    const el = i => arm(i) ? P(arm(i)[0]).add(off(i, SHW)) : sh(i).addScaledVector(spine, -0.26 * G);
    const wr = i => arm(i) ? P(arm(i)[1]).add(off(i, SHW)) : el(i).addScaledVector(spine, -0.23 * G);
    const fi = i => { const a = el(i), b = wr(i);
      if (b.y < 4){ const hz = h.clone().sub(p); hz.y = 0; if (front || hz.lengthSq() < 1) hz.set(1, 0, 0); return b.clone().addScaledVector(hz.normalize(), 0.13 * G).setY(Math.max(0.6, b.y - 1)); }   // Hand flach am Boden
      return b.clone().addScaledVector(b.clone().sub(a).normalize(), 0.155 * G); };
    const wr0 = wr; const wrUp = i => { const w = wr0(i); if (w.y < 2.2) w.y = 2.2; return w; };
    const hip = i => p.clone().add(off(i, HW));
    // Starke Hüftbeugung: Knie weit nach aussen (Krähe/Frosch: Knie liegen aussen an den Oberarmen, nicht im Bauch)
    const flexOf = i => { if (front || !leg(i)) return 0; const d = n.clone().sub(p).normalize(), t = P(leg(i)[0]).sub(p).normalize(); return 180 - d.angleTo(t) * 180 / Math.PI; };
    const spread = [0, 1].map(i => Math.max(0, Math.min(1, (flexOf(i) - 105) / 45)));
    // Sitzend von vorn (Russian Twist): Knie und Füsse kommen nach vorn zur Kamera, sonst knien die Beine zur Seite
    const seatF = front && p.y < 0.2 * G ? 1 : 0;
    const kn = i => leg(i) ? P(leg(i)[0]).add(off(i, HW + spread[i] * (SHW + 3 - HW))).add(V(0, seatF * 0.12 * G, seatF * 0.34 * G)) : hip(i).addScaledVector(spine, -0.415 * G);
    const an = i => leg(i) ? P(leg(i)[1]).add(off(i, HW + spread[i] * (SHW - 1 - HW))).add(V(0, seatF * -0.02 * G, seatF * 0.62 * G)) : kn(i).addScaledVector(spine, -0.395 * G);
    const toe = i => { const L2 = leg(i); if (L2 && L2[2]) return P(L2[2]).add(off(i, HW + spread[i] * (SHW - 1 - HW))).addScaledVector(P(L2[2]).sub(P(L2[1])).normalize(), 2);
      const a = an(i), sh2 = kn(i).sub(a).normalize(), f2 = front ? V(0, 0, 1) : V(-sh2.y, sh2.x, 0).multiplyScalar(-1);
      return a.clone().addScaledVector(f2.dot(fwd) < 0 ? f2.negate() : f2, 0.15 * G).addScaledVector(sh2, -0.05 * G); };
    // Starke Hüftbeugung (Krähe, Frosch): Becken kippt mit, unterer Rücken rundet sich (wie beim echten Körper)
    let m2 = m;
    if (!front && leg(0)){
      const d = m.clone().sub(p).normalize(), t = kn(0).sub(hip(0)).normalize(), flex = 180 - d.angleTo(t) * 180 / Math.PI;
      if (flex > 95){ const want = 95 + (flex - 95) * 0.35, rot = (flex - want) * Math.PI / 180, sgn = Math.sign(d.x * t.y - d.y * t.x) || 1;
        m2 = p.clone().add(d.applyAxisAngle(V(0, 0, 1), sgn * rot).multiplyScalar(m.distanceTo(p))); }
    }
    st.sharp = Math.max(0, Math.min(1, (Math.max(flexOf(0), flexOf(1)) - 110) / 40));
    const J = { p: () => p, m: () => m2, n: () => n, h: () => h, sh, el, wr: wrUp, fi, hip, kn, an, toe };
    skinPose(st, J, front);
    [0, 1].forEach(i => { if (B["db" + i] && arm(i)){ const w = wr(i), d = w.clone().sub(el(i)).normalize(); B["db" + i].position.copy(w).addScaledVector(d, 0.07 * G); B["db" + i].rotation.set(0, front ? Math.PI / 2 : 0, 0); } });
    if (B.ball && S.arms[0]){ const a = wr(0), b2 = wr(1); B.ball.position.copy(a).add(b2).multiplyScalar(0.5).add(V(0, 4, 0)); B.ball.scale.set(7, 7, 7); }
  }
  function pose(st, S){
    if (st.ana) return poseAna(st, S);
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
    if (B.crest) placeSeg(B.crest, top.clone().addScaledVector(hf, 5.5).addScaledVector(hd, 1.5), top.clone().addScaledVector(hf, -11).addScaledVector(hd, -2.5), front ? 9 : 3.2, 9, 1.2, front ? WX : WZ);
    const glOff = p.clone().sub(m).normalize();
    // Po: hinter der Hüfte (Gegenrichtung zur Blickrichtung). Blickrichtung ≈ senkrecht zur Wirbelsäule in der Bildebene.
    const spine = n.clone().sub(p).normalize(); const fwd = front ? V(0, 0, 1) : V(spine.y, -spine.x, 0);
    // Anatomie: Brustmuskeln, Bauch, Trapez (vorne = fwd, quer = Schulterachse)
    const side = front ? WX : WZ;
    [0, 1].forEach(i => { const c = n.clone().lerp(m, 0.42).addScaledVector(fwd, 5.2).addScaledVector(side, i ? -5.2 : 5.2);
      placeSeg(B["pec" + i], c.clone().addScaledVector(spine, -3.6), c.clone().addScaledVector(spine, 3.2), 9.5, 4.2, 0.6, ref); });
    const ac = m.clone().lerp(p, 0.42).addScaledVector(fwd, 4.6);
    placeSeg(B.abs, ac.clone().addScaledVector(spine, -7), ac.clone().addScaledVector(spine, 6), 9.5, 3.4, 0.5, ref);
    const tc = n.clone().addScaledVector(fwd, -3.2).addScaledVector(spine, -2.5);
    placeSeg(B.trap, tc.clone().addScaledVector(spine, -5), tc.clone().addScaledVector(spine, 3.5), 15, 5, 0.6, ref);
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


  // ---------- Übungsfigur aus dem Anatomie-Körper (Skinning auf die Posen aus figures.js) ----------
  // Ruhe-Gelenke in Metern (BodyParts3D, linke Seite x > 0; rechts gespiegelt), aus den Knochen abgeleitet.
  const RJ = { p: [0, 0.885, -0.015], m: [0, 1.165, -0.03], n: [0, 1.44, -0.03], h: [0, 1.635, 0.005],
    sh: [0.172, 1.385, -0.025], el: [0.212, 1.125, -0.02], wr: [0.245, 0.893, -0.004], fi: [0.262, 0.74, 0.025],
    hip: [0.085, 0.885, -0.015], kn: [0.085, 0.47, -0.012], an: [0.072, 0.075, -0.028], toe: [0.088, 0.018, 0.125] };
  const G = 55;   // Posen-Einheiten pro Meter (Oberschenkel 23 ≈ 0.415 m)
  const rj = (k, side) => { const v = RJ[k]; return V(side < 0 ? -v[0] : v[0], v[1], v[2]); };
  // Knochen: [Name, Start, Ende, Seite (0 Mitte, 1 links, -1 rechts), Eltern]
  const BONES = [["lowT", "p", "m", 0, -1], ["upT", "m", "n", 0, 0], ["head", "n", "h", 0, 1]];
  [1, -1].forEach(sd => { const b = BONES.length;
    BONES.push(["UA", "sh", "el", sd, 1], ["FA", "el", "wr", sd, b], ["HD", "wr", "fi", sd, b + 1], ["TH", "hip", "kn", sd, 0], ["SHN", "kn", "an", sd, b + 3], ["FT", "an", "toe", sd, b + 4]); });
  BONES.forEach(b => { b.a = rj(b[1], b[3] || 1); b.b = rj(b[2], b[3] || 1); if (!b[3]){ b.a.x = 0; b.b.x = 0; } b.len = b.a.distanceTo(b.b); b.u = b.b.clone().sub(b.a).normalize(); });
  const HIPPAIR = BONES.map(b => b[0] === "TH" || b[0] === "lowT");
  const bi = (nm, sd) => BONES.findIndex(b => b[0] === nm && (b[3] === sd || !b[3]));
  const ALLOW = { brust: ["upT", "UA", "lowT"], schulter_vorne: ["UA", "upT"], schulter_seite: ["UA", "upT"], schulter_hinten: ["UA", "upT"], ruecken_oben: ["upT", "UA"], ruecken_breit: ["upT", "lowT", "UA"],
    nacken: ["upT", "head"], bizeps: ["UA", "FA", "upT"], trizeps: ["UA", "FA", "upT"], unterarm: ["FA", "UA", "HD"], bauch: ["lowT", "upT"], bauch_seite: ["lowT", "upT"], ruecken_unten: ["lowT", "upT"],
    po: ["lowT", "TH"], hueftbeuger: ["lowT", "TH", "SHN"], hose: ["lowT", "TH", "upT"], bein_vorne: ["TH", "SHN", "lowT"], bein_innen: ["TH", "lowT", "SHN"], bein_hinten: ["TH", "SHN", "lowT"],
    wade: ["SHN", "TH", "FT"], schienbein: ["SHN", "FT"], fuss: ["FT", "SHN"] };
  const TRUNKY = new Set(["brust", "ruecken_oben", "ruecken_breit", "nacken", "bauch", "bauch_seite", "ruecken_unten", "po", "hose"]);
  function segDist(v, b){ const t = Math.max(0, Math.min(b.len, v.clone().sub(b.a).dot(b.u))); return v.distanceTo(b.a.clone().addScaledVector(b.u, t)); }
  let SKIN = null; const EXPO = (typeof window !== "undefined" && window.__anaExpo) || 3;
  function skinWeights(){
    if (SKIN) return SKIN;
    const { raw, reg, keys } = bodyGeometry(), n = reg.length, b0 = new Uint8Array(n), b1 = new Uint8Array(n), w0 = new Float32Array(n), v = V(0, 0, 0), R = 0.045;
    for (let i = 0; i < n; i++){
      v.set(raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2]); const sd = v.x >= 0 ? 1 : -1, k = keys[reg[i]];
      let names = ALLOW[k];
      if (!names) names = v.y > 1.42 ? ["head", "upT"] : v.y < 0.12 ? ["FT", "SHN"] : Math.abs(v.x) > 0.17 && v.y < 1.0 ? ["HD", "FA"] : ["upT", "lowT", "UA", "TH"];
      // weiche Verteilung auf die zwei nächsten erlaubten Knochen (1/d^6), Rumpfmuskeln bleiben bevorzugt am Rumpf
      const cand = names.map(nm => { const j = bi(nm, BONES.find(b => b[0] === nm)[3] ? sd : 0); let d = segDist(v, BONES[j]) + 0.004;
        if (TRUNKY.has(k) && /UA|TH/.test(nm)) d *= 2.4; if (/schulter/.test(k || "") && nm === "upT") d *= 1.4; return { j, d }; }).sort((x, y) => x.d - y.d);
      const best = cand[0].j, other = (cand[1] || cand[0]).j, a1 = 1 / Math.pow(cand[0].d, EXPO), a2 = cand[1] ? 1 / Math.pow(cand[1].d, EXPO) : 0, w = a1 / (a1 + a2);
      b0[i] = best; b1[i] = other; w0[i] = w;
    }
    const ch = new Int8Array(n).fill(-1);   // gemeinsames Gelenk: Kind-Knochen des Paars (oder -1)
    for (let i = 0; i < n; i++){ if (b0[i] === b1[i]) continue; if (BONES[b1[i]][4] === b0[i]) ch[i] = b1[i]; else if (BONES[b0[i]][4] === b1[i]) ch[i] = b0[i]; }
    SKIN = { b0, b1, w0, ch }; return SKIN;
  }
  let REST_E = null;
  function restEdges(){
    if (REST_E) return REST_E; const { raw, idx } = bodyGeometry(); REST_E = new Float32Array(idx.length / 3);
    const d = (a, b) => Math.hypot(raw[a * 3] - raw[b * 3], raw[a * 3 + 1] - raw[b * 3 + 1], raw[a * 3 + 2] - raw[b * 3 + 2]) * G * 1.25;
    for (let t = 0; t < idx.length; t += 3){ const m = Math.max(d(idx[t], idx[t + 1]), d(idx[t + 1], idx[t + 2]), d(idx[t + 2], idx[t])) * 2.2 + 0.6; REST_E[t / 3] = m * m; }   // Grenze im Quadrat
    return REST_E;
  }
  const ANA_MAT = fibers(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.58, metalness: 0.03, envMapIntensity: 0.4 }));
  function anatomyMesh(muscles){
    const B = bodyGeometry(), n = B.reg.length, on = new Set(muscles || []);
    const geo = new THREE.BufferGeometry(), col = new Float32Array(n * 3);
    for (let v = 0; v < n; v++){ const k = B.keys[B.reg[v]], c = k === "hose" ? ((on.has("po") && B.nrm[v * 3 + 2] < -0.25) || (on.has("hueftbeuger") && B.nrm[v * 3 + 2] > 0.3 && B.raw[v * 3 + 1] < 0.89 && Math.abs(B.raw[v * 3]) > 0.035) ? LV_COL[3] : HOSE) : k === "haare" ? HAIR : on.has(k) ? LV_COL[3] : (k === "haut" && on.has("nacken") && B.raw[v * 3 + 1] > 1.42 && B.raw[v * 3 + 1] < 1.49) ? LV_COL[3] : (k === "haut" && (on.has("handgelenk") || on.has("finger")) && Math.abs(B.raw[v * 3]) > 0.17 && B.raw[v * 3 + 1] < 0.9) ? LV_COL[3] : (k && k !== "haut") ? LV_COL[0] : SKIN_COL; col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b; }
    if (window.__anaDbg){ const { b0 } = skinWeights(), pal = [0xffffff, 0x3060ff, 0xffd000, 0xff3030, 0x30ff30, 0xff30ff, 0x30ffff, 0xff8000, 0x8000ff, 0x00a080];
      for (let v = 0; v < n; v++){ const c = new THREE.Color(pal[b0[v] % 10]); col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b; } }
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3)); geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.setIndex(new THREE.BufferAttribute(B.idx.slice(), 1));
    geo.setAttribute("fib", new THREE.BufferAttribute(B.fib, 1));
    const m = mesh(geo, ANA_MAT); m.frustumCulled = false; skinWeights(); return m;
  }
  const R0_SIDE = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI / 2), Q1 = new THREE.Quaternion(), Q2 = new THREE.Quaternion();
  // Pose (Welt-Gelenke) → Matrizen pro Knochen → Eckpunkte
  function skinPose(st, J, front){
    const B = bodyGeometry(), { b0, b1, w0, ch } = skinWeights(), R0 = front ? new THREE.Quaternion() : R0_SIDE, axis = V(0, 0, 1);
    const L = BONES.map(b => {
      const sd = b[3], key = s2 => s2 ? (front ? (sd > 0 ? 0 : 1) : (sd > 0 ? 1 : 0)) : 0;   // Seite → Index der Pose
      const a = J[b[1]](key(sd)), e = J[b[2]](key(sd)), up = e.clone().sub(a), plen = up.length() || 1e-6; up.divideScalar(plen);
      const ur = b.u.clone().applyQuaternion(R0);
      // Drehung in der Bewegungsebene (um die Blickachse z), dann Rest ausrichten
      const ang = Math.atan2(up.y, up.x) - Math.atan2(ur.y, ur.x);
      Q1.setFromAxisAngle(axis, ang).multiply(R0); const ur2 = b.u.clone().applyQuaternion(Q1);
      Q2.setFromUnitVectors(ur2, up); const q = Q2.clone().multiply(Q1);
      const ratio = plen / (b.len * G), m = new THREE.Matrix4().makeRotationFromQuaternion(q);
      const S = new THREE.Matrix3().set(1 + (ratio - 1) * b.u.x * b.u.x, (ratio - 1) * b.u.x * b.u.y, (ratio - 1) * b.u.x * b.u.z,
        (ratio - 1) * b.u.y * b.u.x, 1 + (ratio - 1) * b.u.y * b.u.y, (ratio - 1) * b.u.y * b.u.z, (ratio - 1) * b.u.z * b.u.x, (ratio - 1) * b.u.z * b.u.y, 1 + (ratio - 1) * b.u.z * b.u.z);
      const lin = new THREE.Matrix4().setFromMatrix3(S); lin.premultiply(m); lin.multiplyScalar(G); lin.elements[15] = 1;
      const ta = b.a.clone().applyMatrix4(lin); lin.setPosition(a.x - ta.x, a.y - ta.y, a.z - ta.z);
      const sc = new THREE.Matrix3().copy(S).multiplyScalar(G);
      return { e: lin.elements, r: m.elements, q: q.clone(), s: sc.elements, ap: a.clone() };
    });
    const pos = st.ana.geometry.attributes.position.array, nr = st.ana.geometry.attributes.normal.array, raw = B.raw, rn = B.nrm, n = b0.length;
    const qb = new THREE.Quaternion(), tv = new THREE.Vector3(), tn = new THREE.Vector3(), sharp = st.sharp || 0;
    for (let i = 0; i < n; i++){
      const x = raw[i * 3], y = raw[i * 3 + 1], z = raw[i * 3 + 2], A = L[b0[i]].e, C = L[b1[i]].e;
      let w = w0[i];
      // Starke Hüftbeugung: an der Hüfte hart mischen, sonst stehen halb gedrehte Oberschenkel-/Po-Muskeln als Fetzen ab
      if (sharp && HIPPAIR[b0[i]] && HIPPAIR[b1[i]] && b0[i] !== b1[i]) w = Math.max(0, Math.min(1, (w - 0.5) * (1 + sharp * 7) + 0.5));
      const u = 1 - w;
      if (ch[i] >= 0 && w > 0.002 && w < 0.998){
        // um das gemeinsame Gelenk drehen: Drehungen mischen (nlerp), Skalierung linear, dann vom gebeugten Gelenk aus ansetzen
        const K = BONES[ch[i]], qa = L[b0[i]].q, qc = L[b1[i]].q, dt = qa.x * qc.x + qa.y * qc.y + qa.z * qc.z + qa.w * qc.w, sg = dt < 0 ? -1 : 1;
        qb.set(w * qa.x + u * sg * qc.x, w * qa.y + u * sg * qc.y, w * qa.z + u * sg * qc.z, w * qa.w + u * sg * qc.w).normalize();
        const dx = x - K.a.x, dy = y - K.a.y, dz = z - K.a.z, Sa = L[b0[i]].s, Sc = L[b1[i]].s;
        tv.set(w * (Sa[0] * dx + Sa[3] * dy + Sa[6] * dz) + u * (Sc[0] * dx + Sc[3] * dy + Sc[6] * dz),
               w * (Sa[1] * dx + Sa[4] * dy + Sa[7] * dz) + u * (Sc[1] * dx + Sc[4] * dy + Sc[7] * dz),
               w * (Sa[2] * dx + Sa[5] * dy + Sa[8] * dz) + u * (Sc[2] * dx + Sc[5] * dy + Sc[8] * dz)).applyQuaternion(qb).add(L[ch[i]].ap);
        pos[i * 3] = tv.x; pos[i * 3 + 1] = tv.y; pos[i * 3 + 2] = tv.z;
        tn.set(rn[i * 3], rn[i * 3 + 1], rn[i * 3 + 2]).applyQuaternion(qb); nr[i * 3] = tn.x; nr[i * 3 + 1] = tn.y; nr[i * 3 + 2] = tn.z;
        continue;
      }
      pos[i * 3] = w * (A[0] * x + A[4] * y + A[8] * z + A[12]) + u * (C[0] * x + C[4] * y + C[8] * z + C[12]);
      pos[i * 3 + 1] = w * (A[1] * x + A[5] * y + A[9] * z + A[13]) + u * (C[1] * x + C[5] * y + C[9] * z + C[13]);
      pos[i * 3 + 2] = w * (A[2] * x + A[6] * y + A[10] * z + A[14]) + u * (C[2] * x + C[6] * y + C[10] * z + C[14]);
      const nx = rn[i * 3], ny = rn[i * 3 + 1], nz = rn[i * 3 + 2], Ra = L[b0[i]].r, Rc = L[b1[i]].r;
      nr[i * 3] = w * (Ra[0] * nx + Ra[4] * ny + Ra[8] * nz) + u * (Rc[0] * nx + Rc[4] * ny + Rc[8] * nz);
      nr[i * 3 + 1] = w * (Ra[1] * nx + Ra[5] * ny + Ra[9] * nz) + u * (Rc[1] * nx + Rc[5] * ny + Rc[9] * nz);
      nr[i * 3 + 2] = w * (Ra[2] * nx + Ra[6] * ny + Ra[10] * nz) + u * (Rc[2] * nx + Rc[6] * ny + Rc[10] * nz);
    }
    // Sicherheitsnetz: stark überdehnte Dreiecke (Fetzen bei extremer Beugung) ausblenden; Index nur hochladen, wenn sich etwas ändert
    const I0 = B.idx, ix = st.ana.geometry.index.array, T2 = restEdges(); let changed = false;
    for (let t = 0, f = 0; t < I0.length; t += 3, f++){
      const a = I0[t] * 3, b = I0[t + 1] * 3, c = I0[t + 2] * 3;
      let dx = pos[a] - pos[b], dy = pos[a + 1] - pos[b + 1], dz = pos[a + 2] - pos[b + 2], e = dx * dx + dy * dy + dz * dz;
      dx = pos[b] - pos[c]; dy = pos[b + 1] - pos[c + 1]; dz = pos[b + 2] - pos[c + 2]; const e2 = dx * dx + dy * dy + dz * dz; if (e2 > e) e = e2;
      dx = pos[c] - pos[a]; dy = pos[c + 1] - pos[a + 1]; dz = pos[c + 2] - pos[a + 2]; const e3 = dx * dx + dy * dy + dz * dz; if (e3 > e) e = e3;
      const bad = e > T2[f], nb = bad ? I0[t] : I0[t + 1];
      if (ix[t + 1] !== nb){ ix[t + 1] = nb; ix[t + 2] = bad ? I0[t] : I0[t + 2]; changed = true; }
    }
    if (changed) st.ana.geometry.index.needsUpdate = true;
    st.ana.geometry.attributes.position.needsUpdate = true; st.ana.geometry.attributes.normal.needsUpdate = true;
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
  // Rahmen aus der echten Figur über die ganze Bewegung (+ Geräte), damit sie das Bild füllt
  function fitBox(st, id){
    const box = new THREE.Box3(), f = FIGS[id], n = figKeys(id).length, T = (n === 2 ? 2 : n) * f.ms, tmp = new THREE.Box3();
    const ns = st.thumb ? 2 : 8;
    for (let k = 0; k < ns; k++){ pose(st, st.thumb ? solve(figKeys(id)[k * (figKeys(id).length - 1)]) : figState(id, T * k / ns));
      if (st.ana){ st.ana.geometry.computeBoundingBox(); box.union(st.ana.geometry.boundingBox); }
      else Object.values(st.body).forEach(o => { if (o.visible){ o.updateMatrixWorld(true); tmp.setFromObject(o); box.union(tmp); } }); }
    if (st.props.children.length){ tmp.setFromObject(st.props); box.union(tmp); }
    return box;
  }
  const _v = new THREE.Vector3();
  function aimFit(id, box, aspect){
    const c = box.getCenter(new THREE.Vector3()), front = FRONT_VIEW.has(id), wall = (FIGS[id].props || []).find(([k]) => k === "wall");
    const size = box.getSize(new THREE.Vector3()), lying = size.y < size.x * 0.55;
    const yaw = (front ? -22 : wall && wall[1] > c.x ? -28 : 24) * Math.PI / 180, pitch = (lying ? 18 : 8) * Math.PI / 180;
    cam.aspect = aspect; cam.fov = 26; cam.updateProjectionMatrix();
    const dir = V(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).normalize();
    const right = new THREE.Vector3().crossVectors(V(0, 1, 0), dir).normalize(), up = new THREE.Vector3().crossVectors(dir, right);
    const tv = Math.tan(cam.fov * Math.PI / 360) * 0.9, th = tv * aspect;
    let dist = 0;
    for (let i = 0; i < 8; i++){ _v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).sub(c);
      const x = _v.dot(right), y = _v.dot(up), z = _v.dot(dir); dist = Math.max(dist, z + Math.abs(x) / th, z + Math.abs(y) / tv); }
    cam.position.copy(c).addScaledVector(dir, dist); cam.lookAt(c);
  }
  function draw(item, now){
    const { cv, st, id } = item;
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H){ cv.width = W; cv.height = H; }
    if (!st.fit) st.fit = fitBox(st, id);
    const tp = performance.now(); pose(st, now == null ? solve(figKeys(id)[0]) : figState(id, now)); item.poseMs = performance.now() - tp;
    renderer.setSize(W, H, false); if (st.fit) aimFit(id, st.fit, W / H); else aimCamera(id, W / H);
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
      const item = { cv, id, st: big ? buildScene(id, mus) : null, mus, big };
      cv.__vis = true; obs && obs.observe(cv);
      items.add(item);
      if (big) requestAnimationFrame(() => draw(item, !REDUCED ? performance.now() : null));
      else thumbs.push(item);   // kleine Figuren: nacheinander zeichnen (eine pro Bild), dann Speicher frei
    });
  }

  // ---------- Muskelkarte: zwei Bronzestatuen (vorne, hinten) ----------
  // Liest die Stufen 0–3 aus der gezeichneten Karte (svg.mmap, .mm-r[data-m].sN) und färbt echte Muskeln.
  // Echter Körper (BodyParts3D, siehe body3d.js) als Bronzestatue; jede Muskelregion bekommt die Farbe ihrer Trainingsstufe.
  // Anatomie-Stil: helles Grau, trainierte Muskeln rot (je mehr, desto kräftiger)
  const LV_COL = [0xc8c5bf, 0xe3a493, 0xdc5a45, 0xc81e12].map(c => new THREE.Color(c).convertSRGBToLinear());
  const SKIN_COL = new THREE.Color(0xbab6b0).convertSRGBToLinear();
  const HOSE = new THREE.Color(0x8a857e).convertSRGBToLinear(), HAIR = new THREE.Color(0x3a332d).convertSRGBToLinear();
  const LV_WORD = ["noch nicht trainiert", "wenig", "mittel", "viel"];
  let BODY = null;
  function bodyGeometry(){
    if (BODY) return BODY;
    const D = BODY3D, raw = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; };
    const qp = new Uint16Array(raw(D.p)), qn = new Int8Array(raw(D.nm)), ib = raw(D.i), reg = new Uint8Array(raw(D.r)), layer = D.l ? new Uint8Array(raw(D.l)) : new Uint8Array(D.n);
    const idx = D.n < 65536 ? new Uint16Array(ib) : new Uint32Array(ib);
    const pos = new Float32Array(D.n * 3), nrm = new Float32Array(D.n * 3), rawP = new Float32Array(D.n * 3), cx = (D.min[0] + D.max[0]) / 2, cz = (D.min[2] + D.max[2]) / 2;
    for (let v = 0; v < D.n; v++) for (let a = 0; a < 3; a++){
      const w = D.min[a] + qp[v * 3 + a] / 65535 * (D.max[a] - D.min[a]);
      pos[v * 3 + a] = (a === 0 ? w - cx : a === 1 ? w - D.min[1] : w - cz) * 100;   // Meter → cm, Füsse auf 0, Mitte auf x = z = 0
      rawP[v * 3 + a] = w;
      nrm[v * 3 + a] = qn[v * 3 + a] / 127;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere();
    // Nachbarn für weiche Farbübergänge
    const nb = Array.from({ length: D.n }, () => new Set());
    for (let t = 0; t < idx.length; t += 3){ const [x, y, z] = [idx[t], idx[t + 1], idx[t + 2]]; nb[x].add(y).add(z); nb[y].add(x).add(z); nb[z].add(x).add(y); }
    // Faserrichtung pro Muskelgruppe und Seite (Hauptachse der Form) → Streifen-Koordinate pro Eckpunkt
    const fib = new Float32Array(D.n).fill(-1000), groups = new Map();
    const FIBR = new Set(["bauch", "ruecken_breit", "ruecken_unten"].map(k => D.keys.indexOf(k)));
    for (let v = 0; v < D.n; v++){ if (!layer[v] && !FIBR.has(reg[v])) continue; const g = reg[v] * 2 + (rawP[v * 3] >= 0 ? 1 : 0); let a = groups.get(g); if (!a) groups.set(g, a = []); a.push(v); }
    groups.forEach(list => {
      let mx = 0, my = 0, mz = 0; list.forEach(v => { mx += rawP[v * 3]; my += rawP[v * 3 + 1]; mz += rawP[v * 3 + 2]; }); mx /= list.length; my /= list.length; mz /= list.length;
      const C = [0, 0, 0, 0, 0, 0, 0, 0, 0]; list.forEach(v => { const d = [rawP[v * 3] - mx, rawP[v * 3 + 1] - my, rawP[v * 3 + 2] - mz]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i * 3 + j] += d[i] * d[j]; });
      let f = [0.3, 1, 0.2]; for (let it = 0; it < 30; it++){ const g = [C[0] * f[0] + C[1] * f[1] + C[2] * f[2], C[3] * f[0] + C[4] * f[1] + C[5] * f[2], C[6] * f[0] + C[7] * f[1] + C[8] * f[2]]; const l = Math.hypot(...g) || 1; f = g.map(x => x / l); }
      list.forEach(v => { const nx = nrm[v * 3], ny = nrm[v * 3 + 1], nz = nrm[v * 3 + 2];
        let ax = f[1] * nz - f[2] * ny, ay = f[2] * nx - f[0] * nz, az = f[0] * ny - f[1] * nx; const l = Math.hypot(ax, ay, az) || 1;
        fib[v] = ((rawP[v * 3] - mx) * ax + (rawP[v * 3 + 1] - my) * ay + (rawP[v * 3 + 2] - mz) * az) / l; });
    });
    geo.setAttribute("fib", new THREE.BufferAttribute(fib, 1));
    BODY = { geo, reg, layer, raw: rawP, nrm, idx, fib, nb: nb.map(s => [...s]), keys: D.keys }; return BODY;
  }
  // Feine Muskelfasern (Streifen quer zur Faserrichtung); blenden bei kleinen Bildern aus, damit nichts flimmert
  function fibers(m){
    // fwidth braucht in WebGL 1 eine Erweiterung; ohne sie keine Fasern (Figur bleibt sichtbar)
    const gl2 = renderer.capabilities.isWebGL2, der = gl2 || !!renderer.extensions.get("OES_standard_derivatives");
    if (!der) return m;
    if (!gl2) m.extensions = { derivatives: true };
    m.onBeforeCompile = sh => {
      sh.vertexShader = "attribute float fib;\nvarying float vFib;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvFib = fib;");
      sh.fragmentShader = "varying float vFib;\n" + sh.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
        if (vFib > -100.0){ float q = vFib * 260.0; float fw = fwidth(q); float s = 0.5 + 0.5 * sin(q * 6.2831);
          float k = clamp(1.4 - fw * 2.2, 0.0, 1.0); diffuseColor.rgb *= 1.0 - k * 0.24 * (1.0 - s); }`);
    };
    return m;
  }
  const STATUE_MAT = fibers(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.05, envMapIntensity: 0.6 }));
  function statue(lv){
    const { geo: g0, reg, layer, nb, keys, nrm: nrmB, raw: rawB } = bodyGeometry(), n = reg.length, geo = g0.clone();
    let col = new Float32Array(n * 3);
    for (let v = 0; v < n; v++){ const k = keys[reg[v]], c = k === "hose" ? (lv.po && nrmB[v * 3 + 2] < -0.25 ? LV_COL[lv.po] : lv.hueftbeuger && nrmB[v * 3 + 2] > 0.3 && rawB[v * 3 + 1] < 0.89 && Math.abs(rawB[v * 3]) > 0.035 ? LV_COL[lv.hueftbeuger] : HOSE) : k === "haare" ? HAIR : (k === "haut" && lv.nacken && rawB[v * 3 + 1] > 1.42 && rawB[v * 3 + 1] < 1.49) ? LV_COL[lv.nacken] : (k === "haut" || !k) ? SKIN_COL : (lv[k] ? LV_COL[lv[k]] : LV_COL[0]); col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b; }
    for (let it = 0; it < 2; it++){ const nx = new Float32Array(n * 3);
      for (let v = 0; v < n; v++){ let r = col[v * 3] * 2, g = col[v * 3 + 1] * 2, b = col[v * 3 + 2] * 2; const L = nb[v];
        let d = 2; for (const u of L){ if (reg[u] !== reg[v]) continue; r += col[u * 3]; g += col[u * 3 + 1]; b += col[u * 3 + 2]; d++; } nx[v * 3] = r / d; nx[v * 3 + 1] = g / d; nx[v * 3 + 2] = b / d; }
      col = nx; }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const g = new THREE.Group(), body = mesh(geo, STATUE_MAT); body.userData.body = true; g.add(body);
    return g;
  }
  const muscleOfFace = f => { const { reg, keys } = bodyGeometry(); const c = {}; [f.a, f.b, f.c].forEach(v => { const k = keys[reg[v]]; if (k && k !== "hose" && k !== "haut" && k !== "haare") c[k] = (c[k] || 0) + 1; });
    return Object.keys(c).sort((x, y) => c[y] - c[x])[0] || null; };
  function buildMap(lv){
    const scene = new THREE.Scene(); if (ENV) scene.environment = ENV;
    const a = statue(lv), b = statue(lv);
    a.position.x = -27; a.rotation.y = 0.3;  b.position.x = 27; b.rotation.y = Math.PI + 0.3;
    scene.add(a, b);
    const stone = new THREE.MeshStandardMaterial({ color: 0x1c1712, roughness: 0.55, metalness: 0.35 }), rimM = new THREE.MeshStandardMaterial({ color: 0x8a6232, roughness: 0.3, metalness: 0.85 });
    [-27, 27].forEach(x => {
      const d = new THREE.Mesh(new THREE.CircleGeometry(40, 48), GLOW); d.rotation.x = -Math.PI / 2; d.position.set(x, -7.05, 0); scene.add(d);
      const pl = mesh(new THREE.CylinderGeometry(19, 21, 6, 56), stone); pl.position.set(x, -3.6, 0); scene.add(pl);
      const rg = mesh(new THREE.CylinderGeometry(19.3, 19.3, 0.9, 56), rimM, false); rg.position.set(x, -0.45, 0); scene.add(rg);
    });
    [-27, 27].forEach(x => { const fl = mesh(new THREE.CircleGeometry(18.8, 48), mat.shadow, false); fl.rotation.x = -Math.PI / 2; fl.position.set(x, 0.05, 0); scene.add(fl); });
    scene.add(new THREE.HemisphereLight(0xfff4e2, 0x1a120c, 0.55));
    const key = new THREE.DirectionalLight(0xfff1dc, 1.5); key.position.set(-40, 300, 110); key.target.position.set(0, 80, 0);
    key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 4; key.shadow.bias = -0.0008;
    Object.assign(key.shadow.camera, { left: -110, right: 110, top: 190, bottom: -30, near: 10, far: 500 });
    const rim = new THREE.DirectionalLight(0xd09a55, 1.2); rim.position.set(160, 140, -190);
    const rim2 = new THREE.DirectionalLight(0xd09a55, 0.9); rim2.position.set(-160, 140, -190);
    const fill = new THREE.DirectionalLight(0x9fb4d0, 0.35); fill.position.set(120, 60, 120);
    scene.add(key, key.target, rim, rim2, fill);
    return { scene, groups: [a, b] };
  }
  const mcam = new THREE.PerspectiveCamera(24, 1, 5, 2000);
  function drawMap(it){
    const { cv } = it, w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H){ cv.width = W; cv.height = H; }
    mcam.aspect = W / H; mcam.updateProjectionMatrix();
    const vf = mcam.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * mcam.aspect);
    const dist = Math.max(95 / Math.tan(vf / 2), 62 / Math.tan(hf / 2)) + 20;
    mcam.position.set(0, 84 + dist * 0.12, dist); mcam.lookAt(0, 81, 0);
    renderer.setSize(W, H, false); renderer.render(it.st.scene, mcam);
    const ctx = it.ctx || (it.ctx = cv.getContext("2d")); ctx.clearRect(0, 0, W, H); ctx.drawImage(renderer.domElement, 0, 0);
  }
  function upgradeMaps(root){
    if (typeof BODY3D === "undefined") return;
    root.querySelectorAll("svg.mmap").forEach(svg => {
      if (svg.dataset.f3d) return; svg.dataset.f3d = 1;
      const lv = {}; svg.querySelectorAll(".mm-r[data-m]").forEach(r => { const n = +((r.getAttribute("class").match(/\bs(\d)\b/) || [])[1] || 0); lv[r.dataset.m] = Math.max(lv[r.dataset.m] || 0, n); });
      lv.schulter_seite = Math.max(lv.schulter_vorne || 0, lv.schulter_hinten || 0);
      const wrap = document.createElement("div"); wrap.className = "mmap3d"; wrap.style.cssText = "position:relative;max-width:420px;margin:0 auto";
      const cv = document.createElement("canvas"); cv.style.cssText = "display:block;width:100%;aspect-ratio:1.18/1;height:auto;cursor:pointer;touch-action:manipulation";
      const trained = Object.keys(lv).filter(k => lv[k] > 0).map(k => muscleShort(k));
      cv.setAttribute("role", "img"); cv.setAttribute("aria-label", "Muskelkarte vorne und hinten. " + (trained.length ? "Trainiert: " + [...new Set(trained)].join(", ") : "Noch nichts trainiert"));
      const lab = document.createElement("div"); lab.style.cssText = "display:flex;justify-content:space-around;font:600 11px var(--display);letter-spacing:.18em;color:var(--bone-3);margin-top:-4px";
      lab.innerHTML = "<span>VORNE</span><span>HINTEN</span>";
      const tip = document.createElement("div"); tip.className = "mm3-tip"; tip.setAttribute("aria-live", "polite");
      tip.style.cssText = "min-height:1.4em;text-align:center;font-size:13px;color:var(--bone-2);margin-top:4px";
      tip.textContent = "Tipp auf einen Muskel";
      const src = document.createElement("div"); src.style.cssText = "text-align:center;font-size:10px;color:var(--bone-3);margin-top:2px";
      src.innerHTML = 'Körper: <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/" target="_blank" rel="noopener" style="color:inherit">BodyParts3D</a> © DBCLS, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener" style="color:inherit">CC BY 4.0</a>, verändert';
      wrap.append(cv, lab, tip, src); svg.replaceWith(wrap);
      const it = { cv, st: buildMap(lv), map: true };
      const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
      cv.addEventListener("click", e => {
        const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        drawMap(it); ray.setFromCamera(ndc, mcam);
        const hit = ray.intersectObjects(it.st.groups, true).find(h => h.object.userData.body);
        const m = hit && hit.face ? muscleOfFace(hit.face) : null;
        tip.textContent = m ? `${muscleShort(m)}: ${LV_WORD[lv[m] || 0]}` : "Tipp auf einen Muskel";
      });
      mapItems.add(it); requestAnimationFrame(() => drawMap(it));
    });
  }
  const mapItems = new Set();
  let rsz = 0; window.addEventListener("resize", () => { clearTimeout(rsz); rsz = setTimeout(() => mapItems.forEach(it => it.cv.isConnected ? drawMap(it) : mapItems.delete(it)), 150); });

  const thumbs = [];
  function drawThumb(){
    const t0 = performance.now();
    while (thumbs.length && performance.now() - t0 < 12){
      const it = thumbs.shift(); if (!it.cv.isConnected){ items.delete(it); continue; }
      it.st = buildScene(it.id, it.mus); it.st.thumb = true; draw(it, null);
      if (it.st.ana) it.st.ana.geometry.dispose(); it.st = null; items.delete(it);
    }
  }
  function loop(now){
    if (thumbs.length) drawThumb();
    for (const it of items){
      if (!it.cv.isConnected){ items.delete(it); obs && obs.unobserve(it.cv); continue; }
      if (it.big && it.st && !REDUCED && it.cv.__vis !== false){ if (it.st.ana && now - (it.last || 0) < 30) continue; it.last = now; draw(it, now); }   // Anatomie: 30 Bilder/s reichen, spart Akku
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return { upgrade: root => { upgrade(root); upgradeMaps(root); }, items, mapItems };
})();

// Bestehende Aufrufe von mountFigs bekommen automatisch die 3D-Figur
if (F3D){
  const mount2D = mountFigs;
  mountFigs = function(root){ mount2D(root); F3D.upgrade(root); };
}
