// ---------- Logo und Muskelkarte ----------
// Logo: Spartaner-Helm im Profil. Form: «Spartan helmet» von Delapouite, game-icons.net, CC BY 3.0
// (https://creativecommons.org/licenses/by/3.0/). Geändert: zweifarbig (Helmbusch rot, Helm Bronze mit Verlauf).
let LOGO_N = 0;
const HELM_D = "M253.714 20.358c-8.79.075-17.448.82-25.89 2.308c-46.55 8.208-89.423 26.157-121.225 52.065c-31.803 25.908-52.572 59.39-56.316 100.053l-.004.04l-.004.04c-8.45 83.885 39.397 152.37 65.604 181.553c5.21 5.804 7.064 13.574 6.533 20.862s-3.04 14.494-6.598 21.838c-7.114 14.688-18.703 30.06-31.03 44.457c-13.957 16.303-27.375 29.703-37.75 39.627c7.203-1.214 14.764-4.37 22.67-9.368c14.66-9.265 29.554-24.475 42.097-41.298c12.543-16.824 22.807-35.28 28.802-50.586c2.998-7.654 4.912-14.54 5.614-19.72c.7-5.178-.177-8.39-.354-8.687c-15.34-25.73-31.257-52.027-40.687-79.112s-12.2-55.565-.073-83.35c25.223-57.79 78.02-85.085 130.772-89.605c52.61-4.508 105.963 12.396 136.545 44.71l23.292 22.474l69.254-41.47c-20.34-26.314-55.49-55.33-96.24-76.257c-33.546-17.226-70.702-28.978-106.18-30.428q-4.436-.182-8.832-.144zM372.42 146.184l-.058-.057l.31.313c-.083-.087-.17-.17-.25-.256zM244.814 118.95a167 167 0 0 0-7.4.457c-3.562.305-7.11.73-10.64 1.255l9.628 45.077a117 117 0 0 1 17.646-3.564l-9.233-43.226zm43.85 3.658c-4.866 12.845-7.33 25.916-6.978 39.04c6.034.48 12.086 1.335 18.12 2.557c-.868-12.19 1.306-24.43 6.362-36.98a173 173 0 0 0-17.504-4.617m-106.672 11.79c-6.112 3.028-12 6.54-17.612 10.532c17.55 8.862 29.7 22.763 34.715 39.594a107.4 107.4 0 0 1 15.564-10.063c-6.122-16.257-17.577-30.086-32.666-40.063zm88.136 44.796q-1.734-.003-3.457.047q-4.014.113-7.952.502c-41.993 4.176-77.31 30.258-87.475 90.07c-2.198 12.94 4.293 42.822 12.246 67.66c7.952 24.836 16.634 45.517 16.634 45.517l.504 1.198l.143 1.295c1.96 17.7-9.11 34.967-21.212 52.26c-8.036 11.486-16.43 22.104-23.97 31.72c24-1.35 45.963-11.985 67.177-30.947c-.124-.5-.17-.71-.313-1.297c-.866-3.594-1.955-8.697-1.687-14.68c.446-9.983 5.674-21.958 18.818-31.868c-24.577-35.02-28.898-78.757-24.06-115.027l.886-6.65l6.626-1.05c58.715-9.29 97.246-28.81 139.34-54.593c-27.566-21.88-61.198-34.115-92.25-34.158zm120.197 37.84c-48.424 30.517-91.56 55.67-157.556 67.35c-3.253 33.408 2.427 71.84 25.226 100.798c12.607.61 23.264 6.977 29.904 16.184c6.747 9.353 9.946 21.162 10.83 33.628c23.288 21.426 62.97 39.024 97.764 56.655c-3.17-39.444-.296-76.34-14.538-114.11l-62.842-25.3l-.062-.027c-14.313-6.018-23.332-13.792-26.512-24.03c-3.18-10.236-.874-19.966 1.188-31.064l2.2-11.852l10.74 5.476c23.407 11.94 51.394 20.52 77.548 20.065l6.582-.116l2.103 6.238c10.593 31.436 12.912 56.612 15.752 82.203l7.787 3.113c4.126-29.38 1.912-68.686-3.862-104.425c-5.463-33.817-14.72-65.03-22.252-80.788zM223.397 441.148c-.01.444.094.455.01.04c-.002-.008-.01-.033-.01-.04";
// Alles ausserhalb dieser Fläche ist Helmbusch (rot), innerhalb Helm (Bronze).
const HELM_CLIP = "M140 512 L165 400 L160 300 L172 228 L215 196 L270 168 L330 171 L380 198 L430 212 L512 212 L512 512 Z";
function helmSVG(n){
  return `<defs><linearGradient id="hb${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4dcab"/><stop offset=".45" stop-color="#c79457"/><stop offset="1" stop-color="#6d421d"/></linearGradient>`
    + `<linearGradient id="hc${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e5483b"/><stop offset="1" stop-color="#7c1511"/></linearGradient>`
    + `<clipPath id="hk${n}"><path d="${HELM_CLIP}"/></clipPath></defs>`
    + `<path d="${HELM_D}" fill="url(#hc${n})"/><path d="${HELM_D}" fill="url(#hb${n})" clip-path="url(#hk${n})"/>`;
}
function logoSVG(size = 40, cls = ""){
  return `<svg class="logo helm ${cls}" width="${size}" height="${size}" viewBox="0 0 512 512" aria-hidden="true">${helmSVG(++LOGO_N)}</svg>`;
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
