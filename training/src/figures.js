// ---------- Figuren ----------
// Strichfigur mit fester Gliederlänge. Eine Pose nennt nur Hüfte (p), Rumpfwinkel (t), Hände und Füsse;
// Ellbogen und Knie rechnet die inverse Kinematik aus. So bleiben Arme und Beine beim Animieren gleich lang.
// Seitenansicht schaut nach rechts, Boden bei y = 110.
const LEN = {T:34, UA:17, FA:16, TH:23, SH:22, TOE:7, HO:11, HR:7};
const D2R = Math.PI / 180;

function ik(a, t, l1, l2, s){
  const dx = t[0]-a[0], dy = t[1]-a[1], d = Math.hypot(dx, dy) || 0.001, max = l1 + l2 - 0.01;
  if (d >= max){ const ux = dx/d, uy = dy/d; return [[a[0]+ux*l1, a[1]+uy*l1], [a[0]+ux*max, a[1]+uy*max]]; }
  const base = Math.atan2(dy, dx), c = Math.max(-1, Math.min(1, (l1*l1 + d*d - l2*l2) / (2*l1*d))), ang = Math.acos(c);
  return [[a[0]+l1*Math.cos(base+s*ang), a[1]+l1*Math.sin(base+s*ang)], t];
}

// Spezifikation -> Schlüsselwerte (Hüfte, Winkel, Ziele), die sich linear mischen lassen
function keyOf(sp){
  let p, t, lg = sp.lg;
  if (sp.L){ // Brett-Linie ab den Füssen: L = [Fuss x, Fuss y, Winkel]
    const [fx, fy, a] = sp.L, ux = Math.cos(a*D2R), uy = Math.sin(a*D2R);
    p = [fx + 45*ux, fy + 45*uy]; t = a;
    if (!lg) lg = [[fx, fy, 1, sp.toe ?? 60]];
  } else if (sp.S){ // Linie ab den Schultern: S = [Schulter x, y, Winkel Richtung Füsse]
    const [nx, ny, a] = sp.S, ux = Math.cos(a*D2R), uy = Math.sin(a*D2R);
    p = [nx + LEN.T*ux, ny + LEN.T*uy]; t = a + 180;
    if (!lg) lg = [[nx + 79*ux, ny + 79*uy, 1, sp.toe ?? null]];
  } else { p = sp.p; t = sp.t ?? -90; }
  return {p, t, bow: sp.bow || 0, hd: sp.hd || 0, hx: sp.hx || 0, ar: sp.ar || [], lg: lg || [], ball: sp.ball};
}
function mixKey(A, B, k){
  const l = (a, b) => a + (b - a) * k;
  let dt = B.t - A.t; if (dt > 180) dt -= 360; if (dt < -180) dt += 360;
  return {
    p:[l(A.p[0],B.p[0]), l(A.p[1],B.p[1])], t: A.t + dt*k, bow: l(A.bow,B.bow), hd: l(A.hd,B.hd), hx: l(A.hx,B.hx), ball: A.ball,
    ar: A.ar.map((h,i)=>[l(h[0],B.ar[i][0]), l(h[1],B.ar[i][1]), h[2]]),
    lg: A.lg.map((f,i)=>[l(f[0],B.lg[i][0]), l(f[1],B.lg[i][1]), f[2], f[3]==null ? null : l(f[3], B.lg[i][3] ?? f[3])])
  };
}
function solve(K){
  const ux = Math.cos(K.t*D2R), uy = Math.sin(K.t*D2R);
  const n = [K.p[0] + LEN.T*ux, K.p[1] + LEN.T*uy];
  const hd = (K.t + K.hd) * D2R, h = [n[0] + LEN.HO*Math.cos(hd) + K.hx, n[1] + LEN.HO*Math.sin(hd)];
  const m = [(n[0]+K.p[0])/2 + K.bow*uy, (n[1]+K.p[1])/2 - K.bow*ux];
  const arms = K.ar.map(a => { const [e, w] = ik(n, [a[0],a[1]], LEN.UA, LEN.FA, a[2]); return [e, w]; });
  const legs = K.lg.map(f => {
    const [k, an] = ik(K.p, [f[0],f[1]], LEN.TH, LEN.SH, f[2]);
    const toe = f[3]==null ? null : [an[0] + LEN.TOE*Math.cos(f[3]*D2R), an[1] + LEN.TOE*Math.sin(f[3]*D2R)];
    return [k, an, toe];
  });
  return {n, h, m, p:K.p, arms, legs, ball:K.ball};
}

// Requisiten (Boden ist immer da)
const PROP = {
  chair:  x => `<path class="prop" d="M${x} 82 H${x+32} M${x+2} 82 V110 M${x+30} 82 V110 M${x+32} 82 V52"/>`,
  chairL: x => `<path class="prop" d="M${x} 82 H${x+32} M${x+2} 82 V110 M${x+30} 82 V110 M${x} 82 V52"/>`,
  par:    x => `<path class="prop" d="M${x-10} 98 H${x+10} M${x-8} 98 V110 M${x+8} 98 V110"/>`,
  stair:  x => `<path class="prop" d="M${x} 110 V100 H${x+70}"/>`,
  wall:   x => `<path class="prop" d="M${x} -12 V110"/>`,
  bar:    x => `<path class="prop" d="M${x-30} -4 H${x+30}"/>`,
  door:   x => `<path class="prop" d="M${x} -12 V110 M${x} 52 h-4"/>`,
  towel:  x => `<path class="prop thin" d="M${x-14} 110 H${x+14}"/>`
};

// Posen. ar: [Hand x, y, Beugung ±1], lg: [Knöchel x, y, Beugung ±1, Zehenwinkel]
const ST = {p:[100,66], t:-90};                               // stehend, Seitenansicht
const LEGS_S = [[100,110,-1,0]];
const LEGS_F = [[95,110,1,null],[105,110,-1,null]];            // stehend, von vorne
const HANG = [[101,64,1]];
const FIGS = {
  // Aufwärmen, Haltung, Dehnen
  wrist:  {ms:1700, k:[{p:[80,86], t:-14, ar:[[114,110,1]], lg:[[58,108,1,180]]}, {p:[87,86], t:-16, ar:[[114,110,1]], lg:[[58,108,1,180]]}]},
  scap:   {ms:1000, k:[{L:[38,108,-23], ar:[[113,110,1]]}, {L:[38,108,-20], ar:[[113,110,1]], bow:-3}]},
  circles:{ms:650, k:[{...ST, ar:[[67,32,1],[133,32,-1]], lg:LEGS_F}, {...ST, ar:[[88,2,1],[112,2,-1]], lg:LEGS_F}, {...ST, ar:[[67,32,1],[133,32,-1]], lg:LEGS_F}, {...ST, ar:[[78,58,1],[122,58,-1]], lg:LEGS_F}]},
  legswing:{ms:1100, k:[{...ST, ar:[[100,64,1]], lg:[[100,110,-1,0],[128,94,-1,0]]}, {...ST, ar:[[100,64,1]], lg:[[100,110,-1,0],[74,100,-1,0]]}]},
  catcow: {ms:2200, k:[{p:[80,86], t:-14, bow:-6, hd:-30, ar:[[114,110,1]], lg:[[58,108,1,180]]}, {p:[80,84], t:-14, bow:8, hd:45, ar:[[114,110,1]], lg:[[58,108,1,180]]}]},
  squat:  {ms:1500, k:[{...ST, ar:[[133,34,1]], lg:LEGS_S}, {p:[80,88], t:-60, ar:[[129,60,1]], lg:LEGS_S}]},
  door:   {ms:2200, props:[["door",122]], k:[{p:[100,66], t:-90, ar:[[121,18,-1]], lg:[[110,110,-1,0],[90,110,-1,0]]}, {p:[104,66], t:-84, ar:[[121,18,-1]], lg:[[110,110,-1,0],[90,110,-1,0]]}]},
  chintuck:{ms:1600, k:[{...ST, hd:12, hx:3, ar:HANG, lg:LEGS_S}, {...ST, hd:-6, hx:-3, ar:HANG, lg:LEGS_S}]},
  wallangel:{ms:2200, k:[{...ST, ar:[[78,26,1],[122,26,-1]], lg:LEGS_F}, {...ST, ar:[[86,-2,1],[114,-2,-1]], lg:LEGS_F}]},
  hipflex:{ms:2200, k:[{p:[96,84], t:-90, ar:[[100,74,1]], lg:[[124,110,-1,0],[68,108,-1,180]]}, {p:[103,86], t:-96, ar:[[104,76,1]], lg:[[124,110,-1,0],[68,108,-1,180]]}]},
  calfstretch:{ms:2200, props:[["wall",142]], k:[{p:[100,68], t:-62, ar:[[141,40,1]], lg:[[120,110,-1,0],[66,110,1,0]]}, {p:[104,70], t:-58, ar:[[141,42,1]], lg:[[120,110,-1,0],[66,110,1,0]]}]},

  // Handstand, Planche, L-Sit, Press, Finger
  hswall: {ms:1800, props:[["wall",120]], k:[{p:[106,44], t:90, ar:[[104,110,1]], lg:[[113,0,1,-90]]}, {p:[107,44], t:90, ar:[[104,110,1]], lg:[[114,0,1,-90]]}]},
  hskick: {ms:1600, k:[{p:[106,46], t:88, ar:[[104,110,1]], lg:[[92,6,1,-110],[124,12,-1,-70]]}, {p:[106,44], t:90, ar:[[104,110,1]], lg:[[105,0,1,-90],[107,0,-1,-90]]}]},
  hsfree: {ms:2000, k:[{p:[104,44], t:90, ar:[[104,110,1]], lg:[[103,0,1,-90]]}, {p:[106,44], t:91, ar:[[104,110,1]], lg:[[108,0,1,-90]]}]},
  hsshape:{ms:1800, k:[{p:[104,44], t:90, ar:[[104,110,1]], lg:[[103,0,1,-90]]}, {p:[104,46], t:90, ar:[[104,110,1]], lg:[[90,30,-1,-150]]}]},
  hspu:   {ms:2000, props:[["wall",90]], k:[{p:[104,44], t:90, ar:[[104,110,-1]], lg:[[96,0,1,-90]]}, {p:[106,62], t:90, ar:[[104,110,-1]], lg:[[97,18,1,-90]]}]},
  pllean: {ms:1800, props:[["par",115]], k:[{L:[40,108,-26], ar:[[115,98,1]], toe:70}, {L:[40,108,-20], ar:[[115,98,1]], toe:70}]},
  frog:   {ms:1800, k:[{p:[86,76], t:22, ar:[[112,110,1]], lg:[[84,96,-1,200]]}, {p:[86,74], t:20, ar:[[112,110,1]], lg:[[84,92,-1,200]]}]},
  crow:   {ms:1800, k:[{p:[88,70], t:30, ar:[[114,110,1]], lg:[[84,88,-1,200]]}, {p:[88,68], t:28, ar:[[114,110,1]], lg:[[84,84,-1,200]]}]},
  tuckpl: {ms:1800, k:[{p:[88,78], t:4, ar:[[118,110,1]], lg:[[94,96,-1,200]]}, {p:[88,76], t:2, ar:[[118,110,1]], lg:[[94,94,-1,200]]}]},
  advtuck:{ms:1800, k:[{p:[86,76], t:2, ar:[[118,110,1]], lg:[[66,80,-1,180]]}, {p:[86,75], t:2, ar:[[118,110,1]], lg:[[65,79,-1,180]]}]},
  straddle:{ms:1800, k:[{p:[82,80], t:0, ar:[[117,110,1]], lg:[[38,80,1,180]]}, {p:[82,79], t:0, ar:[[117,110,1]], lg:[[38,78,1,180]]}]},
  support:{ms:1800, props:[["par",100]], k:[{p:[100,96], t:-90, ar:[[100,98,1]], lg:[[98,106,1,30]]}, {p:[100,94], t:-90, ar:[[100,98,1]], lg:[[98,104,1,30]]}]},
  tuckl:  {ms:1800, props:[["par",100]], k:[{p:[100,96], t:-92, ar:[[101,98,1]], lg:[[114,100,-1,0]]}, {p:[100,95], t:-92, ar:[[101,98,1]], lg:[[115,98,-1,0]]}]},
  onel:   {ms:1800, props:[["par",100]], k:[{p:[100,96], t:-94, ar:[[101,98,1]], lg:[[114,100,-1,0],[144,96,-1,-10]]}, {p:[100,95], t:-94, ar:[[101,98,1]], lg:[[115,99,-1,0],[144,94,-1,-10]]}]},
  lsit:   {ms:1800, props:[["par",100]], k:[{p:[100,96], t:-96, ar:[[101,98,1]], lg:[[144,95,-1,-10]]}, {p:[100,95], t:-96, ar:[[101,98,1]], lg:[[144,93,-1,-10]]}]},
  vsit:   {ms:1800, props:[["par",100]], k:[{p:[100,96], t:-100, ar:[[101,98,1]], lg:[[138,72,-1,-40]]}, {p:[100,95], t:-100, ar:[[101,98,1]], lg:[[138,70,-1,-40]]}]},
  pikecomp:{ms:1300, k:[{p:[80,106], t:-72, ar:[[106,110,1]], lg:[[125,107,-1,-30]]}, {p:[80,106], t:-68, ar:[[106,110,1]], lg:[[122,96,-1,-30]]}]},
  pikelift:{ms:1600, props:[["chairL",40]], k:[{p:[92,48], t:76, ar:[[106,110,1]], lg:[[70,80,1,180],[70,80,1,180]]}, {p:[94,46], t:80, ar:[[106,110,1]], lg:[[70,80,1,180],[98,2,1,-90]]}]},
  crowhs: {ms:1700, k:[{p:[88,70], t:30, ar:[[114,110,1]], lg:[[84,88,-1,200]]}, {p:[110,48], t:84, ar:[[114,110,1]], lg:[[100,40,-1,200]]}, {p:[112,44], t:90, ar:[[114,110,1]], lg:[[112,0,1,-90]]}]},
  tuckpress:{ms:1700, k:[{p:[84,80], t:40, ar:[[112,110,1]], lg:[[86,110,-1,0]]}, {p:[108,48], t:84, ar:[[112,110,1]], lg:[[96,40,-1,200]]}, {p:[110,44], t:90, ar:[[112,110,1]], lg:[[110,0,1,-90]]}]},
  strpress:{ms:1700, k:[{p:[94,62], t:66, ar:[[110,110,1]], lg:[[56,104,1,180]]}, {p:[106,46], t:84, ar:[[110,110,1]], lg:[[70,30,1,180]]}, {p:[108,44], t:90, ar:[[110,110,1]], lg:[[108,0,1,-90]]}]},
  puhs:   {ms:1800, k:[{L:[40,108,-12], ar:[[100,110,1]], toe:70}, {p:[96,70], t:70, ar:[[106,110,1]], lg:[[60,60,1,180]]}, {p:[106,44], t:90, ar:[[106,110,1]], lg:[[106,0,1,-90]]}]},
  ftplank:{ms:1800, k:[{L:[38,108,-23], ar:[[113,110,1]]}, {L:[38,108,-22], ar:[[113,110,1]]}]},

  // Drücken
  incpu:  {ms:1600, props:[["chair",134]], k:[{L:[85,108,-50], ar:[[150,82,1]], toe:60}, {L:[85,108,-35], ar:[[150,82,1]], toe:60}]},
  pu:     {ms:1400, k:[{L:[40,108,-23], ar:[[113,110,1]], toe:70}, {L:[40,108,-9], ar:[[113,110,1]], toe:70}]},
  deeppu: {ms:1600, props:[["par",106]], k:[{L:[40,108,-33], ar:[[106,98,1]], toe:70}, {L:[40,108,-11], ar:[[106,98,1]], toe:70}]},
  declpu: {ms:1600, props:[["chairL",44]], k:[{L:[62,80,-2], ar:[[140,110,1]], toe:90}, {L:[62,80,11], ar:[[140,110,1]], toe:90}]},
  kneepu: {ms:1400, k:[{p:[90,96], t:-38, ar:[[117,110,1]], lg:[[54,96,1,180]]}, {p:[94,104], t:-15, ar:[[117,110,1]], lg:[[54,96,1,180]]}]},
  pppu:   {ms:1700, k:[{L:[40,108,-23], ar:[[98,110,1]], toe:70}, {L:[40,108,-9], ar:[[98,110,1]], toe:70}]},
  pike:   {ms:1600, k:[{p:[84,67], t:30, ar:[[134,110,1]], lg:[[62,108,1,180]]}, {p:[88,72], t:48, ar:[[134,110,1]], lg:[[62,108,1,180]]}]},
  pikeel: {ms:1600, props:[["chairL",40]], k:[{p:[92,46], t:75, ar:[[106,110,1]], lg:[[70,80,1,180]]}, {p:[95,52], t:80, ar:[[106,110,1]], lg:[[70,80,1,180]]}]},
  benchdip:{ms:1600, props:[["chairL",48]], k:[{p:[82,84], t:-90, ar:[[76,82,1]], lg:[[120,110,-1,0]]}, {p:[86,100], t:-90, ar:[[76,82,1]], lg:[[120,110,-1,0]]}]},
  benchdips:{ms:1600, props:[["chairL",48]], k:[{p:[82,84], t:-90, ar:[[76,82,1]], lg:[[140,108,-1,-60]]}, {p:[86,100], t:-90, ar:[[76,82,1]], lg:[[140,108,-1,-60]]}]},
  dip:    {ms:1700, props:[["chair",86]], k:[{p:[100,82], t:-90, ar:[[100,82,1]], lg:[[84,102,1,190]]}, {p:[103,98], t:-84, ar:[[100,82,1]], lg:[[84,110,1,190]]}]},
  triext: {ms:1600, props:[["chair",126]], k:[{L:[80,108,-46], ar:[[142,82,1]], toe:60}, {L:[80,108,-32], ar:[[142,82,-1]], toe:60}]},

  // Hanteln
  curl:   {ms:1500, db:[0], k:[{...ST, ar:[[103,64,1]], lg:LEGS_S}, {...ST, ar:[[113,36,1]], lg:LEGS_S}]},
  ohe:    {ms:1600, db:[0], k:[{...ST, ar:[[104,-4,1]], lg:LEGS_S}, {...ST, ar:[[90,22,1]], lg:LEGS_S}]},
  lat:    {ms:1500, db:[0,1], k:[{...ST, ar:[[94,64,1],[106,64,-1]], lg:LEGS_F}, {...ST, ar:[[69,36,1],[131,36,-1]], lg:LEGS_F}]},
  row:    {ms:1500, props:[["chair",138]], db:[1], k:[{p:[106,66], t:-4, ar:[[152,82,1],[140,98,1]], lg:[[100,110,-1,0],[88,110,-1,0]]}, {p:[106,66], t:-4, ar:[[152,82,1],[128,70,1]], lg:[[100,110,-1,0],[88,110,-1,0]]}]},
  rfly:   {ms:1600, db:[0], k:[{p:[100,70], t:-12, ar:[[132,98,1]], lg:[[102,110,-1,0],[92,110,-1,0]]}, {p:[100,70], t:-12, ar:[[112,58,1]], lg:[[102,110,-1,0],[92,110,-1,0]]}]},
  wristcurl:{ms:1200, props:[["chair",80]], db:[0], k:[{p:[94,80], t:-90, ar:[[128,82,1]], lg:[[122,108,-1,0]]}, {p:[94,80], t:-90, ar:[[128,74,1]], lg:[[122,108,-1,0]]}]},
  revlunge:{ms:1700, db:[0], k:[{...ST, ar:HANG, lg:[[102,110,-1,0],[96,110,-1,0]]}, {p:[92,86], t:-88, ar:[[93,86,1]], lg:[[106,110,-1,0],[64,108,-1,90]]}]},
  sldl:   {ms:1800, db:[0], k:[{...ST, ar:HANG, lg:[[100,110,-1,0],[96,104,-1,0]]}, {p:[98,64], t:-8, ar:[[130,92,1]], lg:[[100,110,-1,0],[54,60,-1,180]]}]},

  // Ziehen
  hang:   {ms:2000, props:[["bar",100]], k:[{p:[100,64], t:-90, ar:[[100,-3,1]], lg:[[90,104,1,40]]}, {p:[100,62], t:-90, ar:[[100,-3,1]], lg:[[90,102,1,40]]}]},
  pullup: {ms:1800, props:[["bar",100]], k:[{p:[100,64], t:-90, ar:[[100,-3,1]], lg:[[90,104,1,40]]}, {p:[100,46], t:-90, ar:[[100,-3,1]], lg:[[90,86,1,40]]}]},
  negpu:  {ms:2600, asym:0.25, props:[["bar",100]], k:[{p:[100,64], t:-90, ar:[[100,-3,1]], lg:[[90,104,1,40]]}, {p:[100,46], t:-90, ar:[[100,-3,1]], lg:[[90,86,1,40]]}]},
  assistpu:{ms:1800, props:[["bar",100],["chairL",68]], k:[{p:[100,64], t:-90, ar:[[100,-3,1]], lg:[[86,82,1,180]]}, {p:[100,48], t:-90, ar:[[100,-3,1]], lg:[[86,82,1,180]]}]},
  doorrow:{ms:1600, props:[["door",146]], k:[{L:[124,110,-112], ar:[[136,50,1]], lg:[[124,110,-1,0]]}, {L:[124,110,-102], ar:[[136,46,1]], lg:[[124,110,-1,0]]}]},
  doorrowlow:{ms:1600, props:[["door",150]], k:[{L:[134,110,-128], ar:[[144,64,1]], lg:[[134,110,-1,0]]}, {L:[134,110,-117], ar:[[144,60,1]], lg:[[134,110,-1,0]]}]},
  reary:  {ms:1600, k:[{S:[70,104,0], ar:[[38,106,1]], toe:90, hd:-10}, {S:[70,103,0], ar:[[38,96,1]], toe:90, hd:-10}]},

  // Beine
  bss:    {ms:1600, props:[["chairL",28]], k:[{p:[90,64], t:-88, ar:HANG, lg:[[110,110,-1,0],[58,80,1,180]]}, {p:[86,86], t:-86, ar:[[88,86,1]], lg:[[110,110,-1,0],[58,80,1,180]]}]},
  bssdb:  {ms:1600, props:[["chairL",28]], db:[0], k:[{p:[90,64], t:-88, ar:HANG, lg:[[110,110,-1,0],[58,80,1,180]]}, {p:[86,86], t:-86, ar:[[88,86,1]], lg:[[110,110,-1,0],[58,80,1,180]]}]},
  pistol: {ms:1800, k:[{...ST, ar:[[133,34,1]], lg:[[100,110,-1,0],[126,100,-1,-30]]}, {p:[84,94], t:-56, ar:[[133,64,1]], lg:[[100,110,-1,0],[129,96,-1,-30]]}]},
  boxpistol:{ms:1800, props:[["chairL",56]], k:[{...ST, ar:[[133,34,1]], lg:[[100,110,-1,0],[126,100,-1,-30]]}, {p:[84,84], t:-62, ar:[[133,58,1]], lg:[[100,110,-1,0],[129,88,-1,-30]]}]},
  bridge: {ms:1500, k:[{S:[46,104,3], ar:[[74,110,1]], lg:[[106,110,-1,0]]}, {S:[46,103,-25], ar:[[74,110,1]], lg:[[106,110,-1,0]]}]},
  thrust1:{ms:1500, k:[{S:[46,104,3], ar:[[74,110,1]], lg:[[106,110,-1,0],[124,88,-1,-20]]}, {S:[46,103,-25], ar:[[74,110,1]], lg:[[106,110,-1,0],[122,56,-1,-40]]}]},
  thrustb:{ms:1500, props:[["chairL",20]], k:[{S:[52,80,30], ar:[[64,96,1]], lg:[[112,110,-1,0],[126,94,-1,-20]]}, {S:[52,80,0], ar:[[64,96,1]], lg:[[112,110,-1,0],[128,70,-1,-20]]}]},
  nordic: {ms:2400, asym:0.2, k:[{p:[80,87], t:-90, ar:[[94,80,-1]], lg:[[56,108,1,180]]}, {p:[96,95], t:-34, ar:[[128,100,1]], lg:[[56,108,1,180]]}]},
  calf2:  {ms:1100, props:[["stair",94]], k:[{p:[96,58], t:-90, ar:[[98,56,1]], lg:[[92,100,-1,-10]]}, {p:[98,48], t:-90, ar:[[100,46,1]], lg:[[96,90,-1,45]]}]},
  calf1:  {ms:1100, props:[["stair",94]], k:[{p:[96,58], t:-90, ar:[[98,56,1]], lg:[[92,100,-1,-10],[84,86,1,0]]}, {p:[98,48], t:-90, ar:[[100,46,1]], lg:[[96,90,-1,45],[86,76,1,0]]}]},
  calf1db:{ms:1100, props:[["stair",94]], db:[0], k:[{p:[96,58], t:-90, ar:[[98,56,1]], lg:[[92,100,-1,-10],[84,86,1,0]]}, {p:[98,48], t:-90, ar:[[100,46,1]], lg:[[96,90,-1,45],[86,76,1,0]]}]},
  tib:    {ms:1100, props:[["wall",80]], k:[{p:[86,66], t:-94, ar:[[88,64,1]], lg:[[104,108,-1,0]]}, {p:[86,66], t:-94, ar:[[88,64,1]], lg:[[104,108,-1,-35]]}]},
  foot:   {ms:1000, props:[["chair",76],["towel",120]], k:[{p:[92,80], t:-90, ar:[[110,80,1]], lg:[[120,108,-1,0]]}, {p:[92,80], t:-90, ar:[[110,80,1]], lg:[[120,108,-1,25]]}]},
  cossack:{ms:1800, k:[{p:[100,74], t:-90, ar:[[100,52,1]], lg:[[72,110,1,null],[128,110,-1,null]]}, {p:[80,92], t:-84, ar:[[90,66,1]], lg:[[72,110,-1,null],[128,110,-1,null]]}]},
  sideplank:{ms:1800, k:[{L:[40,108,-21], ar:[[112,110,1]], toe:0}, {L:[40,108,-16], ar:[[112,110,1]], toe:0}]},

  // Sprungkraft und Hantel-Ergänzungen (Wunsch von Claude B)
  jumpsq: {ms:1100, k:[{p:[82,88], t:-60, ar:[[84,96,1]], lg:[[100,110,-1,0]]}, {p:[100,50], t:-90, ar:[[106,-6,1]], lg:[[100,94,-1,50]]}]},
  broadjump:{ms:1300, k:[{p:[66,86], t:-55, ar:[[52,92,1]], lg:[[82,110,-1,0]]}, {p:[108,62], t:-72, ar:[[140,38,1]], lg:[[130,90,-1,20]]}, {p:[128,88], t:-60, ar:[[156,70,1]], lg:[[146,110,-1,0]]}]},
  dbpress:{ms:1500, db:[0,1], k:[{...ST, ar:[[86,30,1],[114,30,-1]], lg:LEGS_F}, {...ST, ar:[[90,-6,1],[110,-6,-1]], lg:LEGS_F}]},
  goblet: {ms:1600, db:[0], k:[{...ST, ar:[[110,44,1]], lg:LEGS_S}, {p:[82,88], t:-62, ar:[[108,66,1]], lg:LEGS_S}]},
  hangknee:{ms:1600, props:[["bar",100]], k:[{p:[100,64], t:-90, ar:[[100,-3,1]], lg:[[96,106,1,40]]}, {p:[100,62], t:-90, ar:[[100,-3,1]], lg:[[104,80,-1,-20]]}]},

  // Bauch
  crunch: {ms:1500, k:[{S:[62,106,0], ar:[[58,96,1]], lg:[[118,110,1,0]]}, {S:[68,90,30], ar:[[64,80,1]], lg:[[118,110,1,0]]}]},
  hollowt:{ms:1800, k:[{S:[70,99,8], ar:[[38,92,1]], lg:[[104,92,-1,-20]]}, {S:[70,98,8], ar:[[38,90,1]], lg:[[104,90,-1,-20]]}]},
  hollow: {ms:1800, k:[{S:[70,99,4], ar:[[38,92,1]], lg:[[148,96,1,-20]]}, {S:[70,98,4], ar:[[38,90,1]], lg:[[148,94,1,-20]]}]},
  hollowrock:{ms:1100, k:[{S:[70,104,0], ar:[[38,100,1]], lg:[[148,92,1,-20]]}, {S:[72,94,10], ar:[[40,84,1]], lg:[[148,104,1,-20]]}]},
  kneeraise:{ms:1500, k:[{S:[50,106,0], ar:[[70,110,1]], lg:[[128,104,1,-10]]}, {S:[50,106,0], ar:[[70,110,1]], lg:[[96,82,-1,-60]]}]},
  legraise:{ms:1700, k:[{S:[50,106,0], ar:[[70,110,1]], lg:[[128,102,1,-10]]}, {S:[50,106,0], ar:[[70,110,1]], lg:[[96,62,1,-90]]}]},
  dragon: {ms:2600, asym:0.25, k:[{S:[44,104,-80], ar:[[30,106,1]], toe:-90}, {S:[44,104,-14], ar:[[30,106,1]], toe:-20}]},
  twist:  {ms:1300, k:[{p:[100,104], t:-90, ar:[[86,92,1],[90,92,-1]], lg:[[92,98,1,null],[108,98,-1,null]], ball:1}, {p:[100,104], t:-90, ar:[[110,92,1],[114,92,-1]], lg:[[92,98,1,null],[108,98,-1,null]], ball:1}]}
};

const REDUCED = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const FIG_KEYS = new Map();
function figKeys(id){
  if (!FIG_KEYS.has(id)){ const f = FIGS[id]; FIG_KEYS.set(id, f.k.map(keyOf)); }
  return FIG_KEYS.get(id);
}
function figSVG(id, cls = ""){
  const f = FIGS[id] || FIGS.squat;
  const props = (f.props || []).map(([k, x]) => PROP[k](x)).join("");
  return `<svg class="fig ${cls}" viewBox="14 -16 172 130" data-fig="${id}" aria-hidden="true">
    <path class="ground" d="M14 111 H186"/>${props}<g class="ghost"></g><g class="live"></g></svg>`;
}
function figBody(){
  return `<polyline data-k="t"/><polyline data-k="a0"/><polyline data-k="a1"/><polyline data-k="l0"/><polyline data-k="l1"/><rect class="db" data-k="d0" width="12" height="7" rx="2"/><rect class="db" data-k="d1" width="12" height="7" rx="2"/><circle class="ball" data-k="b" r="7"/><circle class="head" data-k="h" r="${LEN.HR}"/>`;
}
function figDraw(g, id, S){
  const f = FIGS[id], q = k => g.querySelector(`[data-k="${k}"]`), pt = a => `${a[0].toFixed(1)},${a[1].toFixed(1)}`;
  q("t").setAttribute("points", `${pt(S.n)} ${pt(S.m)} ${pt(S.p)}`);
  [0,1].forEach(i => { const el = q("a"+i), a = S.arms[i]; if (!a){ el.style.display = "none"; return; } el.style.display = ""; el.setAttribute("points", `${pt(S.n)} ${pt(a[0])} ${pt(a[1])}`); });
  [0,1].forEach(i => { const el = q("l"+i), l = S.legs[i]; if (!l){ el.style.display = "none"; return; } el.style.display = ""; el.setAttribute("points", `${pt(S.p)} ${pt(l[0])} ${pt(l[1])}` + (l[2] ? ` ${pt(l[2])}` : "")); });
  [0,1].forEach(i => { const r = q("d"+i), on = (f.db || []).includes(i) && S.arms[i]; r.style.display = on ? "" : "none"; if (on){ r.setAttribute("x", S.arms[i][1][0]-6); r.setAttribute("y", S.arms[i][1][1]-3.5); } });
  const b = q("b"); if (S.ball && S.arms[1]){ b.style.display = ""; b.setAttribute("cx", (S.arms[0][1][0]+S.arms[1][1][0])/2); b.setAttribute("cy", S.arms[0][1][1]-4); } else b.style.display = "none";
  const h = q("h"); h.setAttribute("cx", S.h[0].toFixed(1)); h.setAttribute("cy", S.h[1].toFixed(1));
}
function figState(id, now){
  const f = FIGS[id], K = figKeys(id), n = K.length;
  const ease = x => 0.5 - 0.5*Math.cos(Math.PI*x);
  if (n === 2){
    let x = (now % (2*f.ms)) / (2*f.ms), k;
    if (f.asym){ k = x < f.asym ? ease(x/f.asym) : ease(1 - (x-f.asym)/(1-f.asym)); }
    else k = ease(x < .5 ? x*2 : 2 - x*2);
    return solve(mixKey(K[0], K[1], k));
  }
  const c = (now / f.ms) % n, i = Math.floor(c);
  return solve(mixKey(K[i], K[(i+1) % n], ease(c - i)));
}
// Alle sichtbaren Figuren in einem Takt animieren
const live = new Set();
function mountFigs(root){
  root.querySelectorAll("svg.fig").forEach(svg => {
    if (svg.dataset.ready) return; svg.dataset.ready = 1;
    const id = svg.dataset.fig, live1 = svg.querySelector(".live"), ghost = svg.querySelector(".ghost");
    live1.innerHTML = figBody();
    const K = figKeys(id);
    if (REDUCED){ ghost.innerHTML = figBody(); figDraw(ghost, id, solve(K[K.length-1])); }
    figDraw(live1, id, solve(K[0]));
    if (!REDUCED) live.add({svg, g: live1, id});
  });
}
function figLoop(now){
  for (const it of live){ if (!it.svg.isConnected){ live.delete(it); continue; } figDraw(it.g, it.id, figState(it.id, now)); }
  requestAnimationFrame(figLoop);
}
if (!REDUCED && typeof requestAnimationFrame === "function") requestAnimationFrame(figLoop);
