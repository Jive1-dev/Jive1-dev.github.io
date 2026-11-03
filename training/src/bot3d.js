// ---------- Übungsfigur als glatte Puppe (Claude A, Nacht 3) ----------
// Benaja: «Knochen/Muskeln stechen raus, sieht creepy aus, mindestens Gymkey-Niveau».
// Lösung: eine glatte Mixamo-Puppe (sauberes Skelett, echte Hautgewichte, darum keine Risse).
//  - 8 Übungen bewegen sich mit echten Mixamo-Animationen (von Benaja geladen, auf die Puppe umgerechnet).
//  - alle anderen nehmen die 2D-Posen aus figures.js (solve) als WINKEL: jedes Glied zeigt wie in der Pose,
//    die Puppe behält ihre eigenen Proportionen und wird danach auf den Boden bzw. an die Stange gestellt.
//  - arbeitende Muskeln werden rot auf der Haut eingefärbt (Zonen pro Eckpunkt aus Knochen + Lage).
// Hängt sich VOR fig3d.js in mountFigs; lädt die Puppe nicht, übernimmt fig3d.js wie bisher.
const BOT3D = (() => {
  if (typeof THREE === "undefined" || !THREE.GLTFLoader) return null;
  try { const c = document.createElement("canvas"); if (!(c.getContext("webgl2") || c.getContext("webgl"))) return null; } catch (e) { return null; }
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ASSET = { glb: "bot/ybot.json", clips: "bot/clips.json" };   // Puppe als Base64 in JSON (Artefakt liefert keine .glb aus)
  // Übungen mit echter Mixamo-Bewegung. move: Vorwärtsbewegung behalten (Weitsprung)
  const CLIP_MAP = { squat: { c: "Air_Squat" }, pu: { c: "Push_Up" }, ftplank: { c: "Plank" }, curl: { c: "Bicep_Curl" },
    jumpsq: { c: "Jump" }, broadjump: { c: "Forward_Jump", move: true }, pistol: { c: "Pistol" }, hang: { c: "Hanging_Idle", bar: true } };

  // Knochenname vereinheitlichen: «mixamorig:Hips», «mixamorigHips_1» -> «Hips»
  const NK = n => n.replace(/[:]/g, "").replace(/^mixamorig\d*/, "").replace(/_\d+$/, "");
  // ---------- Muskelzonen ----------
  const REG = ["none","brust","schulter_vorne","schulter_seite","schulter_hinten","trizeps","bizeps","unterarm","handgelenk","finger","ruecken_breit","ruecken_oben","ruecken_unten","nacken","bauch","bauch_seite","hueftbeuger","po","bein_vorne","bein_hinten","bein_innen","wade","schienbein","fuss"];
  function classify(mesh){
    const g = mesh.geometry, P = g.attributes.position, N = g.attributes.normal, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight;
    const bones = mesh.skeleton.bones.map(b => NK(b.name));
    const BW = {}; mesh.skeleton.bones.forEach((b, i) => { BW[bones[i]] = b.getWorldPosition(V()); });
    const out = new Uint8Array(P.count), v = V(), n = V();
    const nm = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld.clone().multiply(mesh.bindMatrix));
    for (let i = 0; i < P.count; i++){
      const ws = [SW.getX(i), SW.getY(i), SW.getZ(i), SW.getW(i)], is = [SI.getX(i), SI.getY(i), SI.getZ(i), SI.getW(i)];
      let best = 0, bi = is[0]; for (let j = 0; j < 4; j++) if (ws[j] > best){ best = ws[j]; bi = is[j]; }
      const name = bones[bi] || ""; v.fromBufferAttribute(P, i); mesh.boneTransform(i, v); v.applyMatrix4(mesh.matrixWorld);
      n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
      const x = v.x, ax = Math.abs(x), y = v.y, sideL = /^Left/.test(name), S = sideL ? "Left" : "Right", base = name.replace(/^(Left|Right)/, "");
      let r = "none";
      if (/Hand(Thumb|Index|Middle|Ring|Pinky)/.test(base)) r = "finger";
      else if (base === "Hand") r = "handgelenk";
      else if (base === "ForeArm") r = "unterarm";
      else if (base === "Arm" || base === "Shoulder"){
        const sh = BW[S + "Arm"], el = BW[S + "ForeArm"], t = Math.abs(x - sh.x) / Math.max(1e-4, Math.abs(el.x - sh.x));
        if (base === "Shoulder" && n.y > 0.5) r = "nacken";
        else if (t < 0.38 || base === "Shoulder") r = n.z > 0.35 ? "schulter_vorne" : n.z < -0.35 ? "schulter_hinten" : "schulter_seite";
        else r = n.z >= 0 ? (n.y < -0.3 ? "trizeps" : "bizeps") : "trizeps";
      }
      else if (base === "Neck") r = n.z < 0.3 ? "nacken" : "none";
      else if (base === "Spine2") r = n.z > 0.2 ? "brust" : n.y > 0.5 ? "nacken" : ax < 0.07 ? "ruecken_oben" : "ruecken_breit";
      else if (base === "Spine1") r = n.z > 0.2 ? (y > BW.Spine2.y - 0.02 ? "brust" : ax < 0.075 ? "bauch" : "bauch_seite") : ax < 0.06 ? "ruecken_oben" : "ruecken_breit";
      else if (base === "Spine") r = n.z > 0.15 ? (ax < 0.08 ? "bauch" : "bauch_seite") : n.z < -0.15 ? (ax < 0.09 ? "ruecken_unten" : "ruecken_breit") : "bauch_seite";
      else if (base === "Hips") r = n.z < -0.2 ? (y < BW.Hips.y + 0.02 ? "po" : "ruecken_unten") : n.z > 0.2 ? (y > BW.Hips.y + 0.03 ? "bauch" : "hueftbeuger") : "bauch_seite";
      else if (base === "UpLeg"){ const hy = BW.Hips.y, ky = BW[S + "Leg"].y, t = (hy - y) / (hy - ky);
        if (n.z < -0.25 && t < 0.28) r = "po"; else if (n.z > 0.3 && t < 0.22) r = "hueftbeuger";
        else if (Math.abs(n.x) > 0.5 && n.x * (sideL ? 1 : -1) < 0) r = "bein_innen"; else r = n.z >= -0.1 ? "bein_vorne" : "bein_hinten"; }
      else if (base === "Leg") r = n.z > 0.3 ? "schienbein" : "wade";
      else if (/^(Foot|ToeBase|Toe_End)$/.test(base)) r = "fuss";
      out[i] = REG.indexOf(r);
    }
    return out;
  }

  // ---------- Pose-Treiber (2D-Pose -> Knochenwinkel) ----------
  const CH = { Hips: "Spine", Spine: "Spine1", Spine1: "Spine2", Spine2: "Neck", Neck: "Head", Head: "HeadTop_End",
    LeftArm: "LeftForeArm", LeftForeArm: "LeftHand", LeftHand: "LeftHandMiddle1", RightArm: "RightForeArm", RightForeArm: "RightHand", RightHand: "RightHandMiddle1",
    LeftUpLeg: "LeftLeg", LeftLeg: "LeftFoot", LeftFoot: "LeftToeBase", LeftToeBase: "LeftToe_End", RightUpLeg: "RightLeg", RightLeg: "RightFoot", RightFoot: "RightToeBase", RightToeBase: "RightToe_End" };
  const RAD = { LeftFoot: 0.06, RightFoot: 0.06, LeftToeBase: 0.025, RightToeBase: 0.025, LeftToe_End: 0.015, RightToe_End: 0.015, Hips: 0.11, Head: 0.1, HeadTop_End: 0.02,
    LeftHand: 0.03, RightHand: 0.03, LeftHandMiddle1: 0.015, RightHandMiddle1: 0.015, LeftForeArm: 0.045, RightForeArm: 0.045, LeftLeg: 0.06, RightLeg: 0.06, Spine2: 0.12, Spine: 0.11 };
  let tb, rest, restDir, SC, root, model;
  function rig(){
    tb = {};
    // ein Skelett für alle Hautteile (Export kann pro Haut ein eigenes Skelett erzeugen)
    model.traverse(o => { if (o.isBone && !/_\d+$/.test(o.name)) tb[NK(o.name)] = o; });
    model.traverse(o => { if (o.isBone && !tb[NK(o.name)]) tb[NK(o.name)] = o; });
    model.traverse(o => { if (o.isSkinnedMesh){ const bs = o.skeleton.bones.map(b => tb[NK(b.name)] || b); o.skeleton = new THREE.Skeleton(bs, o.skeleton.boneInverses); } });
    root.rotation.set(0, 0, 0); root.position.set(0, 0, 0); root.updateMatrixWorld(true);
    rest = {}; for (const k in tb){ const b = tb[k]; rest[k] = { lq: b.quaternion.clone(), lp: b.position.clone(), wq: b.getWorldQuaternion(new THREE.Quaternion()), wp: b.getWorldPosition(V()) }; }
    restDir = {}; for (const k in CH) if (tb[k] && tb[CH[k]]) restDir[k] = rest[CH[k]].wp.clone().sub(rest[k].wp).normalize();
    SC = (rest.LeftUpLeg.wp.distanceTo(rest.LeftLeg.wp) + rest.LeftLeg.wp.distanceTo(rest.LeftFoot.wp)) / 45;
  }
  const bkey = b => NK(b.name);
  function resetPose(){ for (const k in tb){ tb[k].quaternion.copy(rest[k].lq); tb[k].position.copy(rest[k].lp); } root.updateMatrixWorld(true); }
  const pWQ = b => b.parent.getWorldQuaternion(new THREE.Quaternion());
  function aim(k, d){
    const b = tb[k]; if (!b || !restDir[k] || !d || d.lengthSq() < 1e-8) return;
    const pw = pWQ(b), rp = b.parent.isBone ? rest[bkey(b.parent)] : null;
    const dPar = rp ? pw.clone().multiply(rp.wq.clone().invert()) : new THREE.Quaternion();
    const cur = restDir[k].clone().applyQuaternion(dPar).normalize();
    const wq = new THREE.Quaternion().setFromUnitVectors(cur, d.clone().normalize()).multiply(pw.clone().multiply(rest[k].lq));
    b.quaternion.copy(pw.invert().multiply(wq)); b.updateMatrixWorld(true);
  }
  const W = k => tb[k].getWorldPosition(V());
  function lowest(){ let m = Infinity; for (const k in RAD) if (tb[k]){ const y = W(k).y - RAD[k]; if (y < m) m = y; } return m; }
  function setHipsWorld(p){ const h = tb.Hips; h.position.copy(h.parent.worldToLocal(p.clone())); root.updateMatrixWorld(true); }
  function applyPose(S, front){
    resetPose();
    const P2 = q => V(q[0], -q[1], 0), dirOf = (a, b) => P2(b).sub(P2(a)).normalize();
    const up = dirOf(S.p, S.n), fwd = front ? V(0, 0, 1) : V(up.y, -up.x, 0).normalize(), left = up.clone().cross(fwd).normalize();
    const Rq = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(left, up, fwd));
    tb.Hips.quaternion.copy(pWQ(tb.Hips).invert().multiply(Rq.multiply(rest.Hips.wq))); tb.Hips.updateMatrixWorld(true);
    const low = dirOf(S.p, S.m), high = dirOf(S.m, S.n);
    aim("Spine", low); aim("Spine1", low.clone().add(high).normalize()); aim("Spine2", high);
    aim("Neck", dirOf(S.n, S.h)); aim("Head", dirOf(S.n, S.h));
    [0, 1].forEach(i => {
      const s = i ? "Left" : "Right", A = S.arms[i] || S.arms[0], L = S.legs[i] || S.legs[0];
      if (A){ const [e, w] = A, fd = dirOf(e, w);
        aim(s + "Arm", dirOf(S.n, e)); aim(s + "ForeArm", fd);
        aim(s + "Hand", w[1] > 104 && !front ? V(fwd.x >= 0 ? 1 : -1, -0.15, 0).normalize() : fd);   // Stütz: Hand flach
      } else { aim(s + "Arm", up.clone().negate()); aim(s + "ForeArm", up.clone().negate()); }
      if (L){ const [k, a, t] = L; aim(s + "UpLeg", dirOf(S.p, k)); aim(s + "Leg", dirOf(k, a));
        let fd; if (t) fd = dirOf(a, t); else { const sh = dirOf(k, a); fd = front ? V(0, 0, 1) : V(-sh.y, sh.x, 0); if (fd.dot(fwd) < 0) fd.negate(); fd.add(sh.multiplyScalar(0.25)).normalize(); }
        aim(s + "Foot", fd); aim(s + "ToeBase", fd); }
    });
    const hipW = P2(S.p).multiplyScalar(SC).add(V(0, 110 * SC, 0)); setHipsWorld(hipW);
    const y2 = Math.max(...[S.p, S.n, ...S.arms.flat(), ...S.legs.flat().filter(Boolean)].map(q => q[1]));
    if (y2 >= 104) setHipsWorld(hipW.add(V(0, -lowest(), 0)));   // Bodenkontakt: tiefster Punkt auf den Boden
  }
  // Mixamo-Clip: Bild f (gemischt zwischen zwei Bildern)
  let CLIPS = {};
  function applyClip(id, t){
    const M = CLIP_MAP[id], C = CLIPS[M.c]; resetPose();
    const fr = (t * C.n) % (C.n - 1), f0 = Math.floor(fr), f1 = Math.min(C.n - 1, f0 + 1), a = fr - f0;
    const q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion();
    for (const k in C.q){ const b = tb[NK(k)]; if (!b) continue; const v = C.q[k]; q0.fromArray(v, f0 * 4); q1.fromArray(v, f1 * 4); b.quaternion.copy(q0.slerp(q1, a)); }
    const h = C.hp, hp = V(h[f0 * 3] * (1 - a) + h[f1 * 3] * a, h[f0 * 3 + 1] * (1 - a) + h[f1 * 3 + 1] * a, h[f0 * 3 + 2] * (1 - a) + h[f1 * 3 + 2] * a);
    if (!M.move){ hp.x = 0; hp.z = 0; }
    const base = rest.Hips.wp.clone();
    // Clip schaut nach +Z: für die Seitenansicht um 90° drehen (Blick nach +X wie die 2D-Posen)
    tb.Hips.position.copy(tb.Hips.parent.worldToLocal(base.add(hp)));
    root.updateMatrixWorld(true);
  }

  // ---------- Szene ----------
  let R = null, scene, cam, sunL, meshes = [], ready = null, failed = false, shadowFloor, propGroup;
  const BODY = new THREE.Color(0xd6d1c9), JOINT = new THREE.Color(0x7d7770), MUS = new THREE.Color(0xd2322a);
  function load(){
    if (ready) return ready;
    ready = (async () => {
      const [gltf, clips] = await Promise.all([fetch(ASSET.glb).then(r => { if (!r.ok) throw new Error("glb"); return r.json(); }).then(j => new Promise((res, rej) => { const bin = atob(j.glb), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); new THREE.GLTFLoader().parse(u.buffer, "", res, rej); })), fetch(ASSET.clips).then(r => { if (!r.ok) throw new Error("clips"); return r.json(); })]);
      CLIPS = clips; model = gltf.scene; root = new THREE.Group(); root.add(model);
      R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      R.outputEncoding = THREE.sRGBEncoding; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
      R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.setClearColor(0x000000, 0);
      scene = new THREE.Scene(); scene.add(root);
      scene.add(new THREE.HemisphereLight(0xfff3e4, 0x3a2e24, 0.85));
      sunL = new THREE.DirectionalLight(0xffffff, 2.3); sunL.castShadow = true; sunL.shadow.mapSize.set(1024, 1024); sunL.shadow.radius = 4;
      Object.assign(sunL.shadow.camera, { left: -2.2, right: 2.2, top: 2.6, bottom: -1.2, near: 0.5, far: 12 }); scene.add(sunL, sunL.target);
      const rim = new THREE.DirectionalLight(0xffc28a, 1.1); rim.position.set(-3, 2.5, -3); scene.add(rim);
      shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.32 })); shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.receiveShadow = true; scene.add(shadowFloor);
      propGroup = new THREE.Group(); scene.add(propGroup);
      cam = new THREE.PerspectiveCamera(30, 1, 0.05, 40);
      rig();
      model.traverse(o => { if (o.isSkinnedMesh){
        o.castShadow = true; o.frustumCulled = false;
        const joint = /Joints/.test(o.name), reg = joint ? null : classify(o);
        const col = new Float32Array(o.geometry.attributes.position.count * 3);
        o.geometry.setAttribute("color", new THREE.BufferAttribute(col, 3));
        o.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: joint ? 0.5 : 0.62, metalness: 0.02 });
        meshes.push({ o, reg, col, joint }); } });
      return true;
    })().catch(e => { failed = true; console.warn("Puppe nicht geladen, 3D-Figur wie bisher", e); return false; });
    return ready;
  }
  let lastMus = null;
  function paint(mus){
    const key = mus.join(" "); if (key === lastMus) return; lastMus = key;
    const on = new Set(mus.map(m => REG.indexOf(m)).filter(i => i > 0));
    const b = BODY.clone().convertSRGBToLinear(), j = JOINT.clone().convertSRGBToLinear(), m = MUS.clone().convertSRGBToLinear();
    for (const M of meshes){ const c = M.col;
      for (let i = 0; i < c.length / 3; i++){ const k = M.reg ? M.reg[i] : 0, cc = M.joint ? j : on.has(k) ? m : b; c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b; }
      M.o.geometry.attributes.color.needsUpdate = true; }
  }

  // ---------- Geräte (Stuhl, Parallettes, Stange, Wand, Treppe, Tür, Handtuch) ----------
  const WOOD = new THREE.MeshStandardMaterial({ color: 0x5b4634, roughness: 0.75 }), METAL = new THREE.MeshStandardMaterial({ color: 0xb7bbc0, roughness: 0.3, metalness: 0.6 });
  const WALLM = new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.95, transparent: true, opacity: 0.55 }), TOWEL = new THREE.MeshStandardMaterial({ color: 0x7a6248, roughness: 1 });
  const BALLM = new THREE.MeshStandardMaterial({ color: 0x8a3a2c, roughness: 0.6 }), DBM = new THREE.MeshStandardMaterial({ color: 0x8f949a, roughness: 0.35, metalness: 0.55 });
  function dumbbell(){ const g = new THREE.Group(); const h = cyl(0.018, 0.26, METAL, "z"); g.add(h); [-0.11, 0.11].forEach(z => { const p = cyl(0.07, 0.055, DBM, "z"); p.position.z = z; g.add(p); }); return g; }
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
  const cyl = (r, l, mat, axis) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 20), mat); if (axis === "z") m.rotation.x = Math.PI / 2; if (axis === "x") m.rotation.z = Math.PI / 2; m.castShadow = true; return m; };
  // Gerät in 2D-Koordinaten bauen (x vorne, y unten, Boden 110); Rückgabe: Gruppe + Kontaktflächen in 2D
  function buildProp(kind, x){
    const g = new THREE.Group(), s = SC, X = v => v * s, Y = v => (110 - v) * s;
    const surf = [];
    if (kind === "chair" || kind === "chairL"){
      const sx = X(x), ex = X(x + 32), cx = (sx + ex) / 2, w = 0.42, seatY = Y(82);
      g.add(box(ex - sx, 0.035, w, WOOD, cx, seatY - 0.018, 0));
      [sx + 0.02, ex - 0.02].forEach(lx => [-w / 2 + 0.02, w / 2 - 0.02].forEach(lz => g.add(box(0.03, seatY - 0.035, 0.03, WOOD, lx, (seatY - 0.035) / 2, lz))));
      const bx = kind === "chair" ? ex - 0.015 : sx + 0.015; g.add(box(0.03, Y(52) - seatY, w, WOOD, bx, (Y(52) + seatY) / 2, 0));
      surf.push({ y: 82, x0: x, x1: x + 32 });
    } else if (kind === "par"){
      const y = Y(98), cx = X(x);
      [-0.13, 0.13].forEach(z => { const bar = cyl(0.016, 0.3, METAL, "x"); bar.position.set(cx, y, z); g.add(bar);
        [-0.12, 0.12].forEach(dx => { const leg = cyl(0.012, y, METAL); leg.position.set(cx + dx, y / 2, z); g.add(leg); }); });
      surf.push({ y: 98, x0: x - 10, x1: x + 10 });
    } else if (kind === "stair"){
      g.add(box(X(70), Y(100), 0.9, WOOD, X(x) + X(70) / 2, Y(100) / 2, 0)); surf.push({ y: 100, x0: x, x1: x + 70 });
    } else if (kind === "wall" || kind === "door"){
      const wl = box(0.06, 2.6, 1.6, WALLM, X(x) + 0.03, 1.3, 0); g.add(wl);
      if (kind === "door"){ const h = cyl(0.012, 0.12, METAL, "z"); h.position.set(X(x) - 0.04, Y(52), 0.1); g.add(h); }
      surf.push({ xw: x });
    } else if (kind === "bar"){
      const b = cyl(0.022, 1.4, METAL, "z"); b.position.set(X(x), Y(-4), 0); g.add(b); [-0.68, 0.68].forEach(z => { const post = box(0.05, 0.3, 0.05, WOOD, X(x), Y(-4) + 0.13, z); g.add(post); }); surf.push({ bar: true, y: -4, x });
    } else if (kind === "towel"){
      g.add(box(X(28), 0.01, 0.35, TOWEL, X(x), 0.005, 0)); surf.push({});
    }
    return { g, surf };
  }
  // 2D-Kontaktpunkte und ihre Puppen-Knochen
  const CONTACTS = S => [
    ...[0, 1].flatMap(i => { const A = S.arms[i] || S.arms[0]; return A ? [{ p: A[1], k: i ? "LeftHand" : "RightHand", r: 0.03 }] : []; }),
    ...[0, 1].flatMap(i => { const L = S.legs[i] || S.legs[0]; return L ? [{ p: L[1], k: i ? "LeftFoot" : "RightFoot", r: 0.06 }, ...(L[2] ? [{ p: L[2], k: i ? "LeftToeBase" : "RightToeBase", r: 0.025 }] : [])] : []; }),
    { p: S.p, k: "Hips", r: 0.1 }, { p: S.n, k: "Spine2", r: 0.11 }];

  // ---------- eine Figur ----------
  function stateFor(id){
    const f = FIGS[id], front = FRONT_VIEW.has(id), clip = CLIP_MAP[id] && CLIPS[CLIP_MAP[id].c] ? CLIP_MAP[id] : null;
    const per = clip ? CLIPS[clip.c].d * 1000 : (figKeys(id).length === 2 ? 2 : figKeys(id).length) * f.ms;
    const st = { id, front, clip, per, props: [], barY: null, handY: null };
    // Geräte einmal bauen und an die Kontakte der ersten Pose anpassen
    const S0 = figState(id, 0);
    (f.props || []).forEach(([k, x]) => st.props.push({ kind: k, x, ...buildProp(k, x) }));
    // Stange: Hände hängen daran. Stütz ohne Bodenkontakt (Parallettes, Dips): Hände tragen den Körper.
    const floor2D = [...S0.legs.flatMap(L => [L[0], L[1], L[2]].filter(Boolean)), S0.p].some(q => q[1] >= 106);
    st.props.forEach(pr => pr.surf.forEach(sf => {
      if (sf.bar) st.barY = (110 - sf.y) * SC;
      else if (sf.y != null && !floor2D && (pr.kind === "par" || /^chair/.test(pr.kind))){
        const onIt = S0.arms.some(A => A && Math.abs(A[1][1] - sf.y) < 8 && A[1][0] >= sf.x0 - 8 && A[1][0] <= sf.x1 + 8);
        if (onIt){ st.handY = (110 - sf.y) * SC; st.handProp = pr; }
      }
    }));
    poseAt(st, 0);
    const hands = () => W("LeftHand").add(W("RightHand")).multiplyScalar(0.5);
    st.props.forEach(pr => { pr.off = V();
      pr.surf.forEach(sf => {
        if (sf.bar){ pr.off.x = hands().x - pr.x * SC; return; }
        if (pr === st.handProp){ pr.off.x = hands().x - ((sf.x0 + sf.x1) / 2) * SC; return; }
        if (sf.xw != null){ // Wand/Tür: am nächsten Kontakt in x ausrichten
          let best = null; CONTACTS(S0).forEach(c => { const d = Math.abs(c.p[0] - sf.xw) - (/Hand/.test(c.k) && pr.kind === "door" ? 30 : 0); if (d < 22 && (!best || d < best.d)) best = { d, c }; });
          if (best){ const w = W(best.c.k); pr.off.x = w.x + (pr.kind === "door" ? 0.03 : best.c.r) - sf.xw * SC; } return; }
        if (sf.y == null) return;
        let best = null; CONTACTS(S0).forEach(c => { const dy = Math.abs(c.p[1] - sf.y), inX = c.p[0] >= sf.x0 - 6 && c.p[0] <= sf.x1 + 6; if (dy < 8 && inX && (!best || dy < best.dy)) best = { dy, c }; });
        if (best){ const w = W(best.c.k), map = V(best.c.p[0] * SC, (110 - best.c.p[1]) * SC, 0);
          pr.off.set(w.x - map.x, (w.y - best.c.r) - (110 - sf.y) * SC, 0); }
      });
      pr.g.position.copy(pr.off); });
    // Hanteln und Ball (bewegen sich mit den Händen)
    st.db = (f.db || []).map(i => ({ i, g: dumbbell() }));
    if (S0.ball){ st.ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), BALLM); st.ball.castShadow = true; }
    // Kamera: Rahmen aus mehreren Momenten
    const bb = new THREE.Box3();
    for (let i = 0; i < 8; i++){ poseAt(st, i / 8 * st.per); for (const k in tb) bb.expandByPoint(W(k)); }
    st.props.forEach(pr => { const pb = new THREE.Box3().setFromObject(pr.g); if (!pb.isEmpty()){ pb.min.y = Math.max(pb.min.y, bb.min.y - 0.1); bb.union(pb); } });
    bb.expandByScalar(0.13); st.box = bb; return st;
  }
  function poseAt(st, now){
    const { id, front } = st;
    if (st.clip){ root.rotation.y = 0; root.updateMatrixWorld(true); applyClip(id, (now % st.per) / st.per); root.rotation.y = Math.PI / 2; root.updateMatrixWorld(true); }
    else { root.rotation.y = 0; root.updateMatrixWorld(true); applyPose(figState(id, now), front); }
    if (st.barY != null){ // Stange: Finger an die Stange
      const hy = Math.max(W("LeftHandMiddle1").y, W("RightHandMiddle1").y) + 0.02;
      setHipsWorld(W("Hips").add(V(0, st.barY - hy, 0)));
    } else if (st.handY != null){ // Stütz: Handballen auf das Gerät
      const hy = Math.min(W("LeftHand").y, W("RightHand").y) - 0.035;
      setHipsWorld(W("Hips").add(V(0, st.handY - hy, 0)));
    }
    (st.db || []).forEach(d => { const s = d.i ? "Left" : "Right", a = W(s + "Hand"), b = W(s + "HandMiddle1");
      d.g.position.copy(a.lerp(b, 1.05)); d.g.rotation.set(0, 0, 0); });
    if (st.ball){ st.ball.position.copy(W("LeftHandMiddle1").add(W("RightHandMiddle1")).multiplyScalar(0.5)); }
  }
  function frame(st, w, h){
    const bb = st.box, c = bb.getCenter(V()), s = bb.getSize(V());
    const dir = st.front ? V(0.22, 0.16, 1).normalize() : V(0.3, 0.2, 1).normalize();
    cam.aspect = w / h; cam.fov = 30; cam.updateProjectionMatrix();
    const vf = cam.fov * Math.PI / 360, hf = Math.atan(Math.tan(vf) * cam.aspect);
    const need = Math.max((s.y / 2) / Math.tan(vf), (Math.max(s.x, s.z * 0.6) / 2) / Math.tan(hf)) * 1.12 + Math.max(s.x, s.z) * 0.3;
    cam.position.copy(c).addScaledVector(dir, need); cam.lookAt(c);
    sunL.position.copy(c).add(V(1.6, 4, 2.4)); sunL.target.position.copy(c); sunL.target.updateMatrixWorld();
  }
  const items = new Set(), thumbs = [];
  let obs = typeof IntersectionObserver === "function" ? new IntersectionObserver(es => es.forEach(e => { e.target.__vis = e.isIntersecting; }), { rootMargin: "100px" }) : null;
  function draw(it, now){
    const cv = it.cv, w = Math.max(80, Math.round(cv.clientWidth)), h = Math.max(60, Math.round(cv.clientHeight || w * 0.75));
    const pr = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(w * pr)){ cv.width = Math.round(w * pr); cv.height = Math.round(h * pr); }
    R.setPixelRatio(pr); R.setSize(w, h, false);
    paint(it.mus); propGroup.clear(); it.st.props.forEach(p => propGroup.add(p.g)); (it.st.db || []).forEach(d => propGroup.add(d.g)); if (it.st.ball) propGroup.add(it.st.ball);
    poseAt(it.st, now == null ? it.st.per * 0.5 : now);
    frame(it.st, w, h); R.render(scene, cam);
    const cx = cv.getContext("2d"); cx.clearRect(0, 0, cv.width, cv.height); cx.drawImage(R.domElement, 0, 0, cv.width, cv.height);
  }
  function upgrade(root2){
    root2.querySelectorAll("svg.fig").forEach(svg => {
      if (svg.dataset.f3d || failed) return;
      const id = FIGS[svg.dataset.fig] ? svg.dataset.fig : "squat", mus = (svg.dataset.mu || "").split(" ").filter(Boolean);
      svg.dataset.f3d = "bot";   // fig3d.js überspringt markierte Figuren
      const cv = document.createElement("canvas"); cv.className = svg.getAttribute("class").replace(/\bfig\b/, "fig fig3d bot"); cv.dataset.fig = id;
      cv.setAttribute("role", "img"); cv.setAttribute("aria-label", "Figur zeigt die Übung");
      const thumb = /fig-thumb/.test(cv.className); cv.style.aspectRatio = thumb ? "4 / 3" : "4 / 3"; cv.style.height = "auto"; cv.style.width = "100%";
      const parent = svg.parentNode, next = svg.nextSibling; svg.replaceWith(cv);
      const it = { cv, id, mus, big: !thumb, svg, parent };
      load().then(ok => {
        if (!ok){ if (cv.isConnected){ delete svg.dataset.f3d; cv.replaceWith(svg); if (typeof F3D !== "undefined" && F3D) F3D.upgrade(svg.parentNode || document); } return; }
        if (!cv.isConnected) return;
        it.st = stateFor(id); obs && obs.observe(cv); cv.__vis = true;
        if (it.big){ items.add(it); draw(it, REDUCED ? null : performance.now()); } else { thumbs.push(it); }
      });
    });
  }
  function loop(now){
    if (R){
      const t0 = performance.now(); while (thumbs.length && performance.now() - t0 < 14){ const it = thumbs.shift(); if (it.cv.isConnected) draw(it, null); }
      for (const it of items){ if (!it.cv.isConnected){ items.delete(it); obs && obs.unobserve(it.cv); continue; }
        if (!REDUCED && it.cv.__vis !== false && now - (it.last || 0) >= 33){ it.last = now; draw(it, now); } }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return { upgrade, load, CLIP_MAP, stateFor, items };
})();

if (BOT3D){
  const prevMount = mountFigs;
  mountFigs = function(root){ BOT3D.upgrade(root || document); prevMount(root); };
}
