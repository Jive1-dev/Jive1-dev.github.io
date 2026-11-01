// ---------- Logo und Muskelkarte ----------
// Logo: spartanischer Rundschild (Hoplon) mit dem Lambda, dem Zeichen auf den Schilden der Spartaner.
function logoSVG(size = 40, cls = ""){
  return `<svg class="logo ${cls}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="47" class="lg-rim"/>
    <circle cx="50" cy="50" r="39" class="lg-face"/>
    <circle cx="50" cy="50" r="39" class="lg-ring"/>
    <path class="lg-lambda" d="M50 22 L74 76 H63 L50 45 L37 76 H26 Z"/>
  </svg>`;
}

// Muskelkarte vorne und hinten. Jede Region trägt einen Muskel-Key aus exercises.json.
// stufe: { key: 0..3 } färbt die Region (0 = nichts, 3 = viel).
const MAP_REGIONS = {
  front: [
    ["schulter_vorne", "circle", {cx:30, cy:44, r:7}], ["schulter_vorne", "circle", {cx:70, cy:44, r:7}],
    ["brust", "ellipse", {cx:41, cy:50, rx:10, ry:7.5}], ["brust", "ellipse", {cx:59, cy:50, rx:10, ry:7.5}],
    ["bizeps", "ellipse", {cx:24.5, cy:64, rx:4.6, ry:9.5}], ["bizeps", "ellipse", {cx:75.5, cy:64, rx:4.6, ry:9.5}],
    ["unterarm", "ellipse", {cx:21, cy:86, rx:4, ry:10.5}], ["unterarm", "ellipse", {cx:79, cy:86, rx:4, ry:10.5}],
    ["bauch", "rect", {x:43.5, y:60, width:13, height:30, rx:4}],
    ["bauch_seite", "ellipse", {cx:38, cy:74, rx:3.8, ry:11}], ["bauch_seite", "ellipse", {cx:62, cy:74, rx:3.8, ry:11}],
    ["hueftbeuger", "ellipse", {cx:43, cy:96, rx:4, ry:4}], ["hueftbeuger", "ellipse", {cx:57, cy:96, rx:4, ry:4}],
    ["bein_vorne", "ellipse", {cx:41.5, cy:120, rx:7.2, ry:18}], ["bein_vorne", "ellipse", {cx:58.5, cy:120, rx:7.2, ry:18}],
    ["bein_innen", "ellipse", {cx:47.5, cy:114, rx:2.4, ry:11}], ["bein_innen", "ellipse", {cx:52.5, cy:114, rx:2.4, ry:11}],
    ["schienbein", "ellipse", {cx:41.5, cy:160, rx:4, ry:14}], ["schienbein", "ellipse", {cx:58.5, cy:160, rx:4, ry:14}],
    ["fuss", "ellipse", {cx:41, cy:182, rx:5, ry:2.6}], ["fuss", "ellipse", {cx:59, cy:182, rx:5, ry:2.6}]
  ],
  back: [
    ["nacken", "path", {d:"M42 34 L50 30 L58 34 L54 44 L46 44 Z"}],
    ["ruecken_oben", "path", {d:"M36 42 L46 44 L54 44 L64 42 L58 56 L42 56 Z"}],
    ["schulter_hinten", "circle", {cx:30, cy:44, r:7}], ["schulter_hinten", "circle", {cx:70, cy:44, r:7}],
    ["trizeps", "ellipse", {cx:24.5, cy:64, rx:4.6, ry:9.5}], ["trizeps", "ellipse", {cx:75.5, cy:64, rx:4.6, ry:9.5}],
    ["unterarm", "ellipse", {cx:21, cy:86, rx:4, ry:10.5}], ["unterarm", "ellipse", {cx:79, cy:86, rx:4, ry:10.5}],
    ["ruecken_breit", "path", {d:"M37 52 L48 58 L48 76 L41 80 L35 64 Z"}], ["ruecken_breit", "path", {d:"M63 52 L52 58 L52 76 L59 80 L65 64 Z"}],
    ["ruecken_unten", "rect", {x:44, y:78, width:12, height:12, rx:3}],
    ["po", "ellipse", {cx:43, cy:98, rx:7.5, ry:7}], ["po", "ellipse", {cx:57, cy:98, rx:7.5, ry:7}],
    ["bein_hinten", "ellipse", {cx:41.5, cy:124, rx:7, ry:16}], ["bein_hinten", "ellipse", {cx:58.5, cy:124, rx:7, ry:16}],
    ["wade", "ellipse", {cx:41.5, cy:156, rx:5.2, ry:11}], ["wade", "ellipse", {cx:58.5, cy:156, rx:5.2, ry:11}],
    ["fuss", "ellipse", {cx:41, cy:182, rx:5, ry:2.6}], ["fuss", "ellipse", {cx:59, cy:182, rx:5, ry:2.6}]
  ]
};
// Grundkörper (Silhouette), auf dem die Muskeln liegen
const MAP_BODY = `<ellipse cx="50" cy="16" rx="8.5" ry="10.5"/><rect x="45" y="25" width="10" height="8" rx="3"/>
  <path d="M28 38 Q50 30 72 38 L69 60 Q66 84 62 92 L38 92 Q34 84 31 60 Z"/>
  <rect x="19" y="40" width="11" height="34" rx="5.5"/><rect x="70" y="40" width="11" height="34" rx="5.5"/>
  <rect x="16.5" y="72" width="9" height="28" rx="4.5"/><rect x="74.5" y="72" width="9" height="28" rx="4.5"/>
  <path d="M36 90 L64 90 L63 104 Q50 110 37 104 Z"/>
  <rect x="33" y="100" width="16" height="42" rx="8"/><rect x="51" y="100" width="16" height="42" rx="8"/>
  <rect x="35" y="140" width="13" height="40" rx="6"/><rect x="52" y="140" width="13" height="40" rx="6"/>`;
function muscleMapSVG(stufe = {}, labels = true){
  const side = (k, dx) => `<g transform="translate(${dx} 0)"><g class="mm-body">${MAP_BODY}</g>` +
    MAP_REGIONS[k].map(([key, tag, at]) => `<${tag} class="mm-r s${Math.max(0, Math.min(3, stufe[key] || 0))}" data-m="${key}" ${Object.entries(at).map(([a, v]) => `${a}="${v}"`).join(" ")}/>`).join("") +
    (labels ? `<text class="mm-t" x="50" y="196" text-anchor="middle">${k === "front" ? "VORNE" : "HINTEN"}</text>` : "") + `</g>`;
  return `<svg class="mmap" viewBox="0 0 210 200" role="img" aria-label="Muskelkarte vorne und hinten">${side("front", 0)}${side("back", 110)}</svg>`;
}
