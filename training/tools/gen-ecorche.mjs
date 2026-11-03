// Anatomie-Körper für die Muskelkarte aus BodyParts3D 4.0 (CC BY 4.0), aufbereitet von human-atlas (MIT).
// Ebene 0: Haut (Kopf, Hände, Füsse, Bauch, Lat; dort fehlen im Datensatz Muskeln), knapp unter die Muskeln gesenkt.
// Ebene 1: oberflächliche Muskeln. Pro Eckpunkt: Region (Muskel-Key aus exercises.json).
import fs from 'node:fs';
import { MeshoptSimplifier } from 'meshoptimizer';
await MeshoptSimplifier.ready;
const [DIR, OUT, SKIN_T = 18000, MRATIO = 0.16] = process.argv.slice(2);
const atlas = JSON.parse(fs.readFileSync(DIR + '/atlas.json', 'utf8'));
const bins = {}; const bin = c => bins[c] ||= fs.readFileSync(`${DIR}/body-${c}.bin`);
const part = p => { const b = bin(p.chunk), sl = (o, n) => b.buffer.slice(b.byteOffset + o, b.byteOffset + o + n);
  const pos = new Float32Array(sl(p.positions, p.vertexCount * 12)), nrm = new Int16Array(sl(p.normals, p.vertexCount * 6)), idx = new Uint32Array(sl(p.indices, p.indexCount * 4));
  // gleiche Positionen verschweissen, Normalen mitteln
  const map = new Map(), remap = new Uint32Array(p.vertexCount), wp = [], wn = [];
  for (let i = 0; i < p.vertexCount; i++){ const k = `${pos[i*3].toFixed(5)},${pos[i*3+1].toFixed(5)},${pos[i*3+2].toFixed(5)}`; let j = map.get(k);
    if (j === undefined){ j = wp.length / 3; map.set(k, j); wp.push(pos[i*3], pos[i*3+1], pos[i*3+2]); wn.push(0, 0, 0); } remap[i] = j; for (let a = 0; a < 3; a++) wn[j*3+a] += nrm[i*3+a]; }
  for (let i = 0; i < wn.length; i += 3){ const l = Math.hypot(wn[i], wn[i+1], wn[i+2]) || 1; for (let a = 0; a < 3; a++) wn[i+a] = Math.round(wn[i+a] / l * 32767); }
  return { pos: new Float32Array(wp), nrm: new Int16Array(wn), idx: Uint32Array.from(idx, i => remap[i]) }; };
const KEYS = ['', 'brust','schulter_vorne','schulter_seite','schulter_hinten','bizeps','trizeps','unterarm','nacken','ruecken_oben','ruecken_breit','ruecken_unten','bauch','bauch_seite','hueftbeuger','po','bein_vorne','bein_innen','bein_hinten','wade','schienbein','fuss','hose','haut'];
const K = Object.fromEntries(KEYS.map((k, i) => [k, i]));
const RULES = [
  [/pectoralis major/i, 'brust'], [/clavicular part of .* deltoid/i, 'schulter_vorne'], [/acromial part/i, 'schulter_seite'], [/spinal part of .* deltoid/i, 'schulter_hinten'],
  [/biceps brachii|brachialis|coracobrachialis/i, 'bizeps'], [/triceps brachii|anconeus/i, 'trizeps'],
  [/brachioradialis|extensor carpi|flexor carpi|^(left|right) extensor digitorum$|flexor digitorum superficialis|palmaris longus|pronator teres|extensor digiti minimi|abductor pollicis longus|extensor pollicis (longus|brevis)/i, 'unterarm'],
  [/descending part of .* trapezius|sternocleidomastoid|splenius capitis/i, 'nacken'], [/transverse part of .* trapezius|ascending part of .* trapezius|infraspinatus/i, 'ruecken_oben'], [/teres major|teres minor/i, 'ruecken_breit'],
  [/external oblique|serratus anterior/i, 'bauch_seite'], [/gluteus maximus|gluteus medius/i, 'po'],
  [/rectus femoris|vastus lateralis|vastus medialis/i, 'bein_vorne'], [/sartorius|tensor fasciae latae/i, 'hueftbeuger'],
  [/adductor longus|adductor magnus|gracilis/i, 'bein_innen'], [/biceps femoris|semitendinosus|semimembranosus/i, 'bein_hinten'],
  [/gastrocnemius|soleus/i, 'wade'], [/tibialis anterior|extensor digitorum longus|fibularis longus/i, 'schienbein']
];
// Muskeln sammeln + vereinfachen
const P = [], N = [], R = [], L = [], I = [];
const grid = new Map(), CELL = 0.02, gk = (x, y, z) => `${Math.floor(x / CELL)},${Math.floor(y / CELL)},${Math.floor(z / CELL)}`;
let mt = 0, used = [];
for (const p of atlas.parts){
  const r = RULES.find(([re]) => re.test(p.name)); if (!r) continue; used.push(p.name);
  const m = part(p), target = Math.max(60, Math.floor(m.idx.length / 3 * MRATIO)) * 3;
  const [s] = MeshoptSimplifier.simplify(m.idx, m.pos, 3, Math.min(m.idx.length, target), 0.02);
  const [remap, cnt] = MeshoptSimplifier.compactMesh(s);
  const base = P.length / 3;
  const lp = new Float32Array(cnt * 3), ln = new Float32Array(cnt * 3);
  for (let o = 0; o < remap.length; o++){ const n = remap[o]; if (n === 0xffffffff) continue; for (let a = 0; a < 3; a++){ lp[n * 3 + a] = m.pos[o * 3 + a]; ln[n * 3 + a] = m.nrm[o * 3 + a] / 32767; } }
  for (let v = 0; v < cnt; v++){ P.push(lp[v * 3], lp[v * 3 + 1], lp[v * 3 + 2]); N.push(ln[v * 3], ln[v * 3 + 1], ln[v * 3 + 2]); R.push(K[r[1]]); L.push(1);
    const key = gk(lp[v * 3], lp[v * 3 + 1], lp[v * 3 + 2]); let a = grid.get(key); if (!a) grid.set(key, a = []); a.push(lp[v * 3], lp[v * 3 + 1], lp[v * 3 + 2], K[r[1]]); }
  if (process.env.ONLY !== '0') for (const t of s) I.push(base + t); mt += s.length / 3;
}
console.error('Muskeln', used.length, 'Dreiecke', mt);
// Haut
const sk = part(atlas.parts.find(p => p.name === 'Skin'));
const [ss] = MeshoptSimplifier.simplify(sk.idx, sk.pos, 3, SKIN_T * 3, 0.01);
const [srm, sc] = MeshoptSimplifier.compactMesh(ss);
const sp = new Float32Array(sc * 3), sn = new Float32Array(sc * 3);
for (let o = 0; o < srm.length; o++){ const n = srm[o]; if (n === 0xffffffff) continue; for (let a = 0; a < 3; a++){ sp[n * 3 + a] = sk.pos[o * 3 + a]; sn[n * 3 + a] = sk.nrm[o * 3 + a] / 32767; } }
let minY = 1e9, maxY = -1e9; for (let v = 0; v < sc; v++){ minY = Math.min(minY, sp[v * 3 + 1]); maxY = Math.max(maxY, sp[v * 3 + 1]); } const H = maxY - minY;
const nbr = Array.from({ length: sc }, () => new Set()); for (let t = 0; t < ss.length; t += 3){ const [a, b, c] = [ss[t], ss[t + 1], ss[t + 2]]; nbr[a].add(b).add(c); nbr[b].add(a).add(c); nbr[c].add(a).add(b); }
const sreg = new Uint8Array(sc), sink = new Float32Array(sc), keep = new Uint8Array(sc);
for (let v = 0; v < sc; v++){
  const x = sp[v * 3], y = sp[v * 3 + 1], yy = (y - minY) / H, ax = Math.abs(x), nz = sn[v * 3 + 2], torso = ax < 0.16;
  let r = 0;
  if (yy > 0.862) r = K.haut;                                         // Kopf und Hals
  else if (ax > 0.17 && yy < 0.497) r = K.haut;                       // Hände
  else if (yy < 0.055) r = K.fuss;                                    // Füsse
  else if (torso && nz > 0.25 && yy > 0.57 && yy < 0.718 && ax < 0.05 + (yy - 0.57) * 0.18) r = K.bauch;
  else if (torso && nz < 0.3 && ax > 0.03 && yy > 0.595 && yy < 0.6 + Math.max(0, ax - 0.03) * 1.55 && (nz < -0.05 || ax > 0.1)) r = K.ruecken_breit;
  else if (torso && nz < -0.3 && ax < 0.045 && yy > 0.565 && yy < 0.625) r = K.ruecken_unten;
  if (ax < 0.17 && yy > 0.445 && yy < 0.548 && !(nz < -0.25 && yy < 0.53 && ax > 0.02)) r = K.hose;
  sreg[v] = r; keep[v] = r ? 1 : 0;
  sink[v] = r === K.bauch ? 0.004 : r === K.ruecken_breit || r === K.ruecken_unten ? 0.006 : r === K.hose ? 0.002 : 0;
}
for (let v = 0; v < sc; v++) if (!keep[v]){ for (const u of nbr[v]) if (keep[u] && sreg[u]){ sreg[v] = sreg[u]; break; } }
for (let it = 0; it < 4; it++){ const nx = new Float32Array(sc); for (let v = 0; v < sc; v++){ let s = sink[v] * 2, c = 2; for (const u of nbr[v]){ s += sink[u]; c++; } nx[v] = s / c; } sink.set(nx); }
for (let v = 0; v < sc; v++) for (let a = 0; a < 3; a++) sp[v * 3 + a] -= sn[v * 3 + a] * sink[v];
// Schritt vorne abflachen: z pro Höhe höchstens so weit vorne wie die Leiste daneben
{ const cap = {}; for (let v = 0; v < sc; v++){ if (sreg[v] !== K.hose) continue; const ax = Math.abs(sp[v * 3]), b = Math.round((sp[v * 3 + 1] - minY) / H * 100);
    if (ax > 0.065 && ax < 0.1 && sn[v * 3 + 2] > 0.2) cap[b] = Math.max(cap[b] ?? -1, sp[v * 3 + 2]); }
  for (let v = 0; v < sc; v++){ if (sreg[v] !== K.hose) continue; const ax = Math.abs(sp[v * 3]), b = Math.round((sp[v * 3 + 1] - minY) / H * 100), c = cap[b] ?? cap[b + 1] ?? cap[b - 1];
    const yy = (sp[v * 3 + 1] - minY) / H; if (ax < 0.07 && c != null && (sp[v * 3 + 2] > c - 0.002 || (sn[v * 3 + 2] > 0.1 && yy > 0.46 && yy < 0.535))) sp[v * 3 + 2] = c - 0.004 - ax * ax * 0.8; }
  // Schritt unten: nichts hängt unter die Schritthöhe (wie bei einer Hose)
  const crotch = minY + 0.488 * H;
  for (let v = 0; v < sc; v++){ if (sreg[v] !== K.hose && !(Math.abs(sp[v * 3]) < 0.06 && sp[v * 3 + 1] < crotch && sp[v * 3 + 1] > minY + 0.40 * H)) continue;
    const ax = Math.abs(sp[v * 3]); if (ax < 0.055 && sp[v * 3 + 1] < crotch){ sp[v * 3 + 1] = crotch; sp[v * 3 + 2] = Math.min(sp[v * 3 + 2], 0.06); sreg[v] = K.hose; keep[v] = 1; } } }
for (let v = 0; v < sc; v++) if (sreg[v] === K.hose) for (let a = 0; a < 3; a++) sp[v * 3 + a] += sn[v * 3 + a] * 0.007;
// vorne in der Mitte extra glatt (Hose ohne Körperformen)
for (let it = 0; it < 120; it++){ const np = sp.slice(); for (let v = 0; v < sc; v++){ if (sreg[v] !== K.hose || Math.abs(sp[v * 3]) > 0.075 || sn[v * 3 + 2] < 0) continue; let s2 = [0, 0, 0], c = 0; for (const u of nbr[v]){ for (let a = 0; a < 3; a++) s2[a] += sp[u * 3 + a]; c++; } for (let a = 0; a < 3; a++) np[v * 3 + a] = sp[v * 3 + a] * 0.5 + s2[a] / c * 0.5; } sp.set(np); }
for (let it = 0; it < 60; it++) for (const f of [0.6, -0.62]){ const np = sp.slice(); for (let v = 0; v < sc; v++){ if (sreg[v] !== K.hose) continue; let s2 = [0, 0, 0], c = 0; for (const u of nbr[v]){ for (let a = 0; a < 3; a++) s2[a] += sp[u * 3 + a]; c++; } for (let a = 0; a < 3; a++) np[v * 3 + a] = sp[v * 3 + a] + f * (s2[a] / c - sp[v * 3 + a]); } sp.set(np); }
// Sixpack: zwei Säulen, Mittelfurche, drei Querfurchen
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
for (let v = 0; v < sc; v++){ if (sreg[v] !== K.bauch) continue; const ax = Math.abs(sp[v * 3]), yy = (sp[v * 3 + 1] - minY) / H;
  const u = (yy - 0.57) / (0.718 - 0.57), w = 0.05 + (yy - 0.57) * 0.18;
  const cs = sstep(0.002, 0.012, ax) * sstep(w, w - 0.014, ax);
  const rs = [0.3, 0.55, 0.78].reduce((m, ui) => m * (1 - 0.85 * Math.exp(-(((u - ui) / 0.045) ** 2))), 1) * sstep(0, 0.08, u) * sstep(1, 0.9, u);
  const bump = 0.008 * cs * rs; for (let a = 0; a < 3; a++) sp[v * 3 + a] += sn[v * 3 + a] * bump; }
// Normalen aus der verformten Fläche neu (Hose, Bauch, Rücken), sonst zeichnet das Licht die alte Form nach
{ const acc = new Float32Array(sc * 3);
  for (let t = 0; t < ss.length; t += 3){ const [a, b, c] = [ss[t], ss[t + 1], ss[t + 2]];
    const ux = sp[b*3]-sp[a*3], uy = sp[b*3+1]-sp[a*3+1], uz = sp[b*3+2]-sp[a*3+2], vx = sp[c*3]-sp[a*3], vy = sp[c*3+1]-sp[a*3+1], vz = sp[c*3+2]-sp[a*3+2];
    const nx = uy*vz-uz*vy, ny = uz*vx-ux*vz, nz = ux*vy-uy*vx; for (const i of [a, b, c]){ acc[i*3] += nx; acc[i*3+1] += ny; acc[i*3+2] += nz; } }
  for (let v = 0; v < sc; v++){ if (sreg[v] !== K.hose && sreg[v] !== K.bauch && sreg[v] !== K.ruecken_breit && sreg[v] !== K.ruecken_unten) continue;
    const l = Math.hypot(acc[v*3], acc[v*3+1], acc[v*3+2]) || 1; if (acc[v*3]*sn[v*3] + acc[v*3+1]*sn[v*3+1] + acc[v*3+2]*sn[v*3+2] < 0) continue;
    for (let a = 0; a < 3; a++) sn[v*3+a] = acc[v*3+a] / l; } }
const base = P.length / 3;
for (let v = 0; v < sc; v++){ P.push(sp[v * 3], sp[v * 3 + 1], sp[v * 3 + 2]); N.push(sn[v * 3], sn[v * 3 + 1], sn[v * 3 + 2]); R.push(sreg[v]); L.push(0); }
if (process.env.ONLY !== '1') for (let t = 0; t < ss.length; t += 3) if (keep[ss[t]] || keep[ss[t + 1]] || keep[ss[t + 2]]) I.push(base + ss[t], base + ss[t + 1], base + ss[t + 2]);
const n = P.length / 3; console.error('Eckpunkte', n, 'Dreiecke', I.length / 3);
let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
for (let v = 0; v < n; v++) for (let a = 0; a < 3; a++){ mn[a] = Math.min(mn[a], P[v * 3 + a]); mx[a] = Math.max(mx[a], P[v * 3 + a]); }
const qp = new Uint16Array(n * 3), qn = new Int8Array(n * 3);
for (let v = 0; v < n; v++) for (let a = 0; a < 3; a++){ qp[v * 3 + a] = Math.round((P[v * 3 + a] - mn[a]) / (mx[a] - mn[a]) * 65535); qn[v * 3 + a] = Math.round(Math.max(-1, Math.min(1, N[v * 3 + a])) * 127); }
const qi = n < 65536 ? Uint16Array.from(I) : Uint32Array.from(I);
const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
const out = `// ---------- Körper der Muskelkarte (Claude B, generiert mit training/tools/gen-ecorche.mjs) ----------
// Quelle: BodyParts3D 4.0, © The Database Center for Life Science (DBCLS), Lizenz CC BY 4.0
// (https://creativecommons.org/licenses/by/4.0/), aufbereitet von human-atlas (github.com/ashemag/human-atlas, MIT).
// Geändert: ${used.length} oberflächliche Muskeln + Hautoberfläche vereinfacht, Haut unter die Muskeln gesenkt, Bauch-Relief ergänzt, quantisiert.
const BODY3D = ${JSON.stringify({ n, t: I.length / 3, min: mn.map(v => +v.toFixed(5)), max: mx.map(v => +v.toFixed(5)), keys: KEYS, p: b64(qp), nm: b64(qn), i: b64(qi), r: b64(Uint8Array.from(R)), l: b64(Uint8Array.from(L)) })};
`;
fs.writeFileSync(OUT, out); console.error('KB', (out.length / 1024).toFixed(0));
