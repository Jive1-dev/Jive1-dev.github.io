// Baut training/index.html aus src/* und data/*.json (eine Datei, offline nutzbar).
// Aufruf: node training/build.cjs [Pfad für Vorschau ohne <head>]
const fs = require("fs"), path = require("path");
const dir = __dirname, rd = f => fs.readFileSync(path.join(dir, f), "utf8");
const opt = f => fs.existsSync(path.join(dir, f)) ? JSON.parse(rd(f)) : null;
const data = { ex: opt("data/exercises.json"), prog: opt("data/program.json"), skills: opt("data/skills.json"),
  nut: opt("data/nutrition.json"), videos: opt("data/videos.json"), motiv: opt("data/motivation.json") };
// videos.json darf ein _meta haben; die App erwartet { id: {url, kanal, titel} }
if (data.videos){ const v = {}; Object.entries(data.videos).forEach(([k, x]) => { if (k !== "_meta" && x && x.url) v[k] = x; }); data.videos = v; }
const js = `const WA_DATA = ${JSON.stringify(data)};\n${rd("src/figures.js")}\n${rd("src/art.js")}\n${rd("src/app.js")}`;
const body = `<title>Winter Arc Training</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Barlow:wght@400;500;600;700&display=swap">
<style>${rd("src/app.css")}</style>
<div id="root"></div>
<noscript>Diese App braucht JavaScript.</noscript>
<script>${js.replace(/<\/script/g, "<\\/script")}</script>`;
const head = `<!doctype html><html lang="de-CH"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0d0b09"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="description" content="52 Wochen Calisthenics: Plan, Training Schritt für Schritt, Skills, Körper und Essen.">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="icon-180.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}</style></head><body>`;
fs.writeFileSync(path.join(dir, "index.html"), head + body + "</body></html>");
if (process.argv[2]) fs.writeFileSync(process.argv[2], body);
const version = Date.now().toString(36);
fs.writeFileSync(path.join(dir, "sw.js"), `// Offline-Cache für Winter Arc Training (Version ${version})
const CACHE = "wa-training-${version}";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("wa-training-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.host.includes("fonts.googleapis.com") || url.host.includes("fonts.gstatic.com")){
    e.respondWith(caches.open(CACHE).then(async c => (await c.match(req)) || fetch(req).then(r => (c.put(req, r.clone()), r))));
    return;
  }
  if (url.origin !== location.origin || !url.pathname.includes("/training/")) return;
  e.respondWith(fetch(req).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(req, r.clone())); return r; })
    .catch(async () => (await caches.match(req)) || (req.mode === "navigate" ? caches.match("./index.html") : Response.error())));
});
`);
fs.writeFileSync(path.join(dir, "manifest.webmanifest"), JSON.stringify({
  name: "Winter Arc Training", short_name: "Winter Arc", start_url: "./", scope: "./", display: "standalone",
  background_color: "#0d0b09", theme_color: "#0d0b09", lang: "de-CH",
  icons: [{src:"icon-192.png", sizes:"192x192", type:"image/png"}, {src:"icon-512.png", sizes:"512x512", type:"image/png"}, {src:"icon-512.png", sizes:"512x512", type:"image/png", purpose:"maskable"}]
}, null, 1));
console.log("gebaut:", Math.round(fs.statSync(path.join(dir, "index.html")).size / 1024), "KB", Object.entries(data).map(([k, v]) => `${k}:${v ? "ja" : "nein"}`).join(" "));
