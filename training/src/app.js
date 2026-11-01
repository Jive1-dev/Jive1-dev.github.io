// ---------- Winter Arc Training: App ----------
// Daten kommen von Claude B (training/data/*.json) und werden beim Bauen als WA_DATA eingesetzt.
// Gespeichert wird nur im Browser (localStorage). Export/Import als JSON.

const D = WA_DATA;
const EX = Object.fromEntries(D.ex.uebungen.map(u => [u.id, u]));
const META = D.ex._meta;
const PROG = D.prog;
const VIDEOS = D.videos || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s/60) + ":" + String(s%60).padStart(2,"0"); };
const DAYS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const DAYS_LONG = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

// ---------- Datum ----------
const dkey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const parse = k => { const [y,m,d] = k.split("-").map(Number); return new Date(y, m-1, d); };
const addDays = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return dkey(d); };
const today = () => dkey(new Date());
const dayIdx = k => (parse(k).getDay() + 6) % 7;
const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const longDate = k => { const d = parse(k); return `${DAYS_LONG[dayIdx(k)]} ${d.getDate()}. ${MONTHS[d.getMonth()]}`; };

// ---------- Speicher ----------
const KEY = "winterarc.training.v1";
const fresh = () => ({ v:1, profile:{name:"", kg:50, cm:165, alter:16}, settings:{start:"2026-11-02", hantelKg:5, theme:null},
  logs:{}, body:{w:[], m:[], photos:[]}, skills:{}, food:{}, custom:[] });
let S = fresh();
try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch(e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e) {} };
const logOf = k => (S.logs[k] ||= {done:false, light:false, pre:[], swaps:{}, sets:{}, extra:[]});

// ---------- Programm ----------
function weekOf(k){ return Math.floor(diffDays(S.settings.start, k) / 7) + 1; }
function progWeek(w){ if (w < 1) w = 1; if (w > 52) w = 40 + ((w - 53) % 13); return PROG.wochen[w - 1]; }
function progDay(k){ const w = weekOf(k); return { w, week: progWeek(w), day: progWeek(w).tage[dayIdx(k)], pre: w < 1 }; }
function phaseOf(w){ const ph = PROG._meta.phasen; return ph.find(p => w >= p.von && w <= p.bis) || ph[ph.length - 1]; }
const ROMAN = ["I","II","III","IV"];
const exName = id => EX[id]?.name || (S.custom.find(c => c.id === id) || {}).name || id;
const muscleShort = k => (META.muskeln[k] || k).split(" (")[0];
const unitText = (u, n) => ({wdh:"Wiederholungen", wdh_seite:"pro Seite", sek:"Sekunden", sek_seite:"Sek pro Seite", versuche:"Versuche"}[u] || META.einheiten[u] || u);
const isSec = u => u === "sek" || u === "sek_seite";

// Ablauf eines Tages: eine Übung nach der anderen (Regel 1)
function buildSteps(day, log){
  const steps = [];
  const pre = PROG._meta.vorDemTraining?.antworten || [];
  const preGroups = new Set(pre.filter(a => log.pre.includes(a.text)).flatMap(a => a.gruppen));
  (day.plan || []).forEach((b, bi) => {
    const once = b.block === "aufwaermen" || b.block === "abschluss" || b.block === "test";
    let rounds = once ? 1 : (b.runden || 1);
    if (!once && log.light) rounds = Math.max(1, rounds - 1);
    if (b.block === "paar" && preGroups.size && b.uebungen.some(u => preGroups.has(EX[log.swaps[`${bi}.${b.uebungen.indexOf(u)}`] || u.id]?.gruppe))) rounds = Math.max(1, rounds - 1);
    for (let r = 1; r <= rounds; r++) b.uebungen.forEach((u, ui) => {
      const id = log.swaps[`${bi}.${ui}`] || u.id;
      let ziel = u.ziel; if (log.light && ziel) ziel = Math.max(1, Math.round(ziel * .8));
      steps.push({ key:`${bi}.${ui}.${r}`, bi, ui, r, rounds, block:b.block, title:b.titel, id, ziel, bereich:u.bereich, einheit:u.einheit || EX[id]?.einheit || "wdh",
        tempo:u.tempo || null, kg:u.hantelKg || null, text:u.text || null, test: b.block === "test",
        pause: once ? (b.block === "test" ? 90 : 10) : (b.pauseSek || 35) });
    });
  });
  return steps;
}

// Verlauf: letzter Wert und Rekord pro Übung (ohne den Tag k)
function history(id, k){
  let last = null, lastDate = null, best = null;
  Object.keys(S.logs).sort().forEach(d => {
    if (d >= k) return;
    const vals = Object.values(S.logs[d].sets).filter(s => s.id === id).map(s => s.v);
    (S.logs[d].extra || []).filter(e => e.id === id).forEach(e => vals.push(e.v));
    if (!vals.length) return;
    const m = Math.max(...vals); last = m; lastDate = d; best = best == null ? m : Math.max(best, m);
  });
  return { last, lastDate, best };
}

// ---------- Motivation ----------
const MOT = D.motiv || {};
const FALLBACK_QUOTES = [
  {text:"Komm und hol sie.", quelle:"Leonidas, überliefert bei Plutarch"},
  {text:"Mit ihm oder auf ihm.", quelle:"Spartanische Mutter zu ihrem Sohn über den Schild, bei Plutarch"},
  {text:"Umso besser, dann kämpfen wir im Schatten.", quelle:"Dienekes, bei Herodot (Historien 7,226)"}
];
function quotes(){
  const q = MOT.sprueche || MOT.zitate || [];
  const list = Array.isArray(q) ? q : [];
  return list.length ? list : FALLBACK_QUOTES;
}
function dayPick(list, salt = 0){ if (!list?.length) return null; const n = diffDays("2026-01-01", today()) + salt; return list[((n % list.length) + list.length) % list.length]; }
function line(kind){
  const own = MOT.saetze?.[kind] || MOT.eigene?.[kind];
  const fb = { start:["Heute zählt nur diese eine Übung. Dann die nächste."], pause:["Atmen. Gleich wieder."], ende:["Erledigt. So baut man einen Körper: Tag für Tag."],
    rekord:["Neuer Rekord. Gestern geschlagen."], verpasst:["Ein verpasster Tag ist kein verlorener Krieg. Heute wieder."] }[kind];
  const l = Array.isArray(own) && own.length ? own : fb;
  const pick = dayPick(l, kind.length); return typeof pick === "string" ? pick : (pick?.text || "");
}
function weeksDone(){
  const done = new Set(); Object.entries(S.logs).forEach(([d, l]) => { if (l.done) done.add(weekOf(d)); });
  let n = 0; done.forEach(w => { const c = DAYS.slice(0,6).filter((_, i) => S.logs[addDays(S.settings.start, (w-1)*7 + i)]?.done).length; if (c >= 4) n++; });
  return n;
}
function rank(){
  const r = MOT.raenge || MOT.raenge_list || [{ab:0,name:"Rekrut"},{ab:2,name:"Agoge-Schüler"},{ab:4,name:"Hoplit"},{ab:8,name:"Veteran"},{ab:13,name:"Krieger"},{ab:26,name:"Spartiat"},{ab:39,name:"Polemarch"},{ab:52,name:"Legende"}];
  const w = weeksDone(); let cur = r[0], next = null;
  r.forEach((x, i) => { const ab = x.ab ?? x.wochen ?? 0; if (w >= ab){ cur = x; next = r[i+1] || null; } });
  return { name: cur.name, next, w };
}
function streak(){
  let k = today(), n = 0; if (!S.logs[k]?.done) k = addDays(k, -1);
  for (let i = 0; i < 400; i++){ if (dayIdx(k) === 6){ k = addDays(k, -1); continue; } if (k < S.settings.start) break; if (S.logs[k]?.done){ n++; k = addDays(k, -1); } else break; }
  return n;
}

// ---------- Kleinkram ----------
let toastT;
function toast(msg){ clearTimeout(toastT); $(".toast")?.remove(); const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; (document.getElementById("root") || document.body).appendChild(t); toastT = setTimeout(() => t.remove(), 2400); }
let audio;
function beep(f = 880, d = .2){ try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = f; g.gain.value = .16; o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + d); } catch(e) {} try { navigator.vibrate && navigator.vibrate(d > .3 ? [180,80,180] : 40); } catch(e) {} }
let wake = null;
function lockScreen(){ try { navigator.wakeLock?.request("screen").then(w => wake = w).catch(() => {}); } catch(e) {} }
function unlockScreen(){ try { wake?.release(); } catch(e) {} wake = null; }
function glossify(text){
  let out = esc(text); const used = new Set();
  Object.keys(META.glossar || {}).sort((a, b) => b.length - a.length).forEach(w => {
    if (used.has(w)) return;
    const re = new RegExp(`(^|[^\\p{L}>])(${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?![\\p{L}])`, "iu");
    if (re.test(out)){ out = out.replace(re, (m, a, b) => `${a}<button class="gl" data-gl="${esc(w)}">${b}</button>`); used.add(w); }
  });
  return out;
}
const ICON = {
  heute:'<svg viewBox="0 0 24 24"><path d="M12 3 4 7v6c0 4 3.5 7 8 8 4.5-1 8-4 8-8V7z"/><path d="M12 8l3 8h-2l-1-3-1 3H9z"/></svg>',
  plan:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
  skills:'<svg viewBox="0 0 24 24"><path d="M12 2v5M9 4h6"/><path d="M6 22l6-15 6 15"/><path d="M8.5 16h7"/></svg>',
  koerper:'<svg viewBox="0 0 24 24"><circle cx="12" cy="4.5" r="2.5"/><path d="M6 9h12M12 9v6M12 15l-4 7M12 15l4 7"/></svg>',
  essen:'<svg viewBox="0 0 24 24"><path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 2-3 5-3 8h3v10"/></svg>',
  gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  play:'<svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z" fill="currentColor" stroke="none"/></svg>',
  back:'<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>'
};

// ---------- Rahmen ----------
function shell(){
  const root = document.getElementById("root") || document.body.appendChild(Object.assign(document.createElement("div"), {id:"root"}));
  root.innerHTML = `
  <div class="app">
    <header class="hdr">${logoSVG(38)}<div class="brand">WINTER ARC<small>TRAINING · 52 WOCHEN</small></div><div class="sp"></div>
      <span class="rank" id="rank"></span>
      <a class="icon-btn" href="#einstellungen" aria-label="Einstellungen">${ICON.gear}</a></header>
    <main id="view"></main>
  </div>
  <nav class="tabs" aria-label="Bereiche"><div class="in">
    <a href="#heute">${ICON.heute}Heute</a><a href="#plan">${ICON.plan}Plan</a><a href="#skills">${ICON.skills}Skills</a><a href="#koerper">${ICON.koerper}Körper</a><a href="#essen">${ICON.essen}Essen</a>
  </div></nav>`;
}
function setRank(){ const r = rank(); $("#rank").textContent = r.name.toUpperCase(); }

// ---------- Router ----------
const VIEWS = { heute: viewHeute, plan: viewPlan, skills: viewSkills, koerper: viewKoerper, essen: viewEssen, einstellungen: viewSettings, agoge: viewAgoge, bericht: viewBericht };
function route(){
  const name = (location.hash || "#heute").slice(1).split("-")[0];
  const v = VIEWS[name] ? name : "heute";
  document.body.classList.toggle("agoge", v === "agoge");
  $$(".tabs a").forEach(a => a.setAttribute("aria-current", a.getAttribute("href") === "#" + v ? "page" : "false"));
  if (v !== "agoge") stopTimers();
  VIEWS[v]();
  setRank();
  mountFigs($("#view"));
  window.scrollTo(0, 0);
}
addEventListener("hashchange", route);
document.addEventListener("click", e => {
  const g = e.target.closest(".gl"); if (g){ e.preventDefault(); toast(`${g.dataset.gl}: ${META.glossar[g.dataset.gl]}`); }
});

// ---------- HEUTE ----------
function shieldSVG(){ return `<svg viewBox="0 0 40 46"><path class="sd-o" d="M20 3 L36 9 V22 C36 33 28 40 20 43 C12 40 4 33 4 22 V9 Z"/><path class="sd-f" d="M20 8 L31 12 V22 C31 30 26 35 20 38 C14 35 9 30 9 22 V12 Z"/></svg>`; }
function weekShields(k){
  const mon = addDays(k, -dayIdx(k));
  return `<div class="shield-row">${DAYS.map((d, i) => { const dk = addDays(mon, i); const l = S.logs[dk];
    return `<div class="shield-day ${l?.done ? "done" : ""} ${dk === k ? "today" : ""} ${i === 6 ? "rest" : ""}">${shieldSVG()}${d}</div>`; }).join("")}</div>`;
}
function viewHeute(){
  const k = today(), { w, week, day, pre } = progDay(k), log = logOf(k), ph = phaseOf(Math.max(1, w));
  const q = dayPick(quotes());
  const st = streak(), r = rank();
  let main;
  if (day.name === "Ruhe" || dayIdx(k) === 6){
    const next = progDay(addDays(k, 1)).day;
    main = `<div class="card hero"><div class="eyebrow">${longDate(k)}</div><h1 class="title-xl" style="margin-top:6px">Ruhetag</h1>
      <p class="muted" style="margin-top:6px">${esc(day.hinweis || "Erholung ist Teil des Trainings. Die Muskeln wachsen jetzt.")}</p></div>
      <div class="card"><div class="kicker">Wochen-Check</div>${weightQuick()}</div>
      <div class="card"><div class="kicker">Morgen</div><h3>${esc(next.name)}</h3><p class="muted">${esc(next.muskelText || "")} · ${next.minuten} Min</p></div>`;
  } else {
    const steps = buildSteps(day, log);
    const mins = log.light ? Math.round(day.minuten * .8) : day.minuten;
    const goals = [...new Map(steps.filter(s => s.block === "paar" || s.block === "skills").map(s => [s.id, s])).values()].slice(0, 3);
    const preQ = PROG._meta.vorDemTraining;
    main = `<div class="card hero">
        <div class="split"><span class="eyebrow">${longDate(k)}</span><span class="eyebrow">${pre ? "Start" : `Woche ${w} · Phase ${ROMAN[PROG._meta.phasen.indexOf(ph)] || ""}`}</span></div>
        <h1 class="title-xl" style="margin-top:8px">${esc(day.name)}</h1>
        <p class="muted" style="margin-top:4px">${esc(day.muskelText || "")}</p>
        <div class="chips" style="margin-top:10px">${(day.muskeln || []).slice(0, 5).map(m => `<span class="mchip">${esc(muscleShort(m))}</span>`).join("")}</div>
        ${week.typ !== "normal" ? `<p class="hint" style="margin-top:10px">${week.typ === "deload" ? "Leichte Woche: weniger Runden. Sehnen und Gelenke holen auf." : "Testwoche: Zeig, was du gewonnen hast."}</p>` : ""}
        ${day.fortschritt ? `<p class="hint" style="margin-top:10px">${esc(day.fortschritt)}</p>` : ""}
      </div>
      ${log.done ? `<div class="card"><div class="kicker">Erledigt</div><h3>Agoge bestanden ✓</h3><p class="muted" style="margin-top:6px">${esc(line("ende"))}</p>
        <div class="row" style="margin-top:12px"><a class="btn sm" href="#bericht">Kampfbericht</a><button class="btn sm" id="again">Nochmal öffnen</button></div></div>` : `
      <div class="card"><div class="kicker">Schlag deine Zahlen</div><div class="list">
        ${goals.map(s => { const h = history(s.id, k); const zielT = s.bereich ? `${s.bereich[0]}–${s.bereich[1]}` : s.ziel;
          return `<div class="line"><span>${esc(exName(s.id))}</span><b class="num">${h.last != null ? `${h.last} → ${Math.max(h.last + 1, s.ziel || 0)}` : zielT} ${isSec(s.einheit) ? "Sek" : ""}</b></div>`; }).join("")}
      </div></div>
      <div class="card"><div class="kicker">${esc(preQ?.frage || "Was hast du heute schon gemacht?")}</div>
        <div class="chips" id="pre">${(preQ?.antworten || []).map(a => `<button class="chip" data-pre="${esc(a.text)}" aria-pressed="${a.text === "Nichts" ? !log.pre.length : log.pre.includes(a.text)}">${esc(a.text)}</button>`).join("")}</div>
        <p class="small" style="margin-top:8px">Bereits Trainiertes bekommt 1 Runde weniger, nie ganz gestrichen.</p></div>
      <button class="btn primary" id="go">${ICON.play}Agoge starten · ${mins} Min</button>
      <div class="card"><div class="kicker">Ablauf</div><div class="timeline">${timeline(day)}</div></div>
      <button class="btn ghost wide sm" id="light" aria-pressed="${log.light}">${log.light ? "✓ Leichte Version aktiv (Muskelkater/müde)" : "Muskelkater oder müde? Leichte Version"}</button>`}`;
  }
  $("#view").innerHTML = `<div class="stack">
    ${q ? `<div class="quote"><p>«${esc(q.text)}»</p><small>${esc(q.quelle || q.stelle || "")}</small></div>` : ""}
    ${main}
    <div class="card"><div class="split"><span class="kicker" style="margin:0">Schild-Kette</span><span class="small num">${st} ${st === 1 ? "Tag" : "Tage"} in Folge</span></div>
      <div style="margin-top:10px">${weekShields(k)}</div>
      <p class="small" style="margin-top:8px">Rang: <b>${esc(r.name)}</b>${r.next ? ` · nächster Rang «${esc(r.next.name)}» nach ${r.next.ab ?? r.next.wochen} vollen Wochen` : ""}</p></div>
    <div class="card"><div class="kicker">Selbst eintragen</div><p class="small">Extra trainiert? Trag es ein, es zählt für Rekorde.</p>${extraForm()}</div>
  </div>`;
  $("#go")?.addEventListener("click", () => { log.started ||= Date.now(); save(); location.hash = "#agoge"; });
  $("#again")?.addEventListener("click", () => { log.pos = 0; save(); location.hash = "#agoge"; });
  $("#light")?.addEventListener("click", () => { log.light = !log.light; save(); viewHeute(); });
  $$("#pre .chip").forEach(b => b.addEventListener("click", () => {
    const t = b.dataset.pre;
    if (t === "Nichts") log.pre = []; else log.pre = log.pre.includes(t) ? log.pre.filter(x => x !== t) : [...log.pre, t];
    save(); viewHeute(); mountFigs($("#view"));
  }));
  bindWeight(); bindExtra(k);
}
function timeline(day){
  let t = 0;
  return (day.plan || []).map(b => { const row = `<i>${t}</i><span><b>${esc(b.titel)}</b> · ${b.uebungen.map(u => esc(exName(u.id))).join(" + ")}</span>`; t += b.min || 0; return row; }).join("") + `<i>${t}</i><span>Fertig</span>`;
}
function extraForm(){
  const opts = Object.values(EX).filter(u => !u.gesperrt).map(u => `<option value="${esc(u.name)}"></option>`).join("");
  return `<div class="row wrap" style="margin-top:8px"><input class="field grow" id="xName" list="xList" placeholder="Übung, z. B. Klimmzug" style="flex:2 1 180px"><datalist id="xList">${opts}</datalist>
    <input class="field" id="xVal" type="number" inputmode="numeric" min="0" placeholder="Zahl" style="flex:1 1 80px"><button class="btn sm" id="xAdd">Eintragen</button></div>`;
}
function bindExtra(k){
  $("#xAdd")?.addEventListener("click", () => {
    const name = $("#xName").value.trim(), v = Number($("#xVal").value);
    if (!name || !v){ toast("Übung und Zahl eintragen."); return; }
    let ex = Object.values(EX).find(u => u.name.toLowerCase() === name.toLowerCase());
    if (!ex){ let c = S.custom.find(c => c.name.toLowerCase() === name.toLowerCase()); if (!c){ c = {id:"c" + Date.now().toString(36), name, einheit:"wdh"}; S.custom.push(c); } ex = c; }
    logOf(k).extra.push({id: ex.id, v, t: Date.now()}); save();
    const h = history(ex.id, k); toast(h.best != null && v > h.best ? `Neuer Rekord: ${ex.name} ${v}!` : `Eingetragen: ${ex.name} ${v}`);
    $("#xName").value = ""; $("#xVal").value = "";
  });
}
function latestKg(){ const w = S.body.w; return w.length ? w[w.length - 1].kg : S.profile.kg; }
function weightQuick(){ return `<div class="row"><input class="field grow" id="wIn" type="number" step="0.1" inputmode="decimal" placeholder="Gewicht in kg" value=""><button class="btn sm" id="wSave">Speichern</button></div><p class="small" style="margin-top:6px">Einmal pro Woche, am Morgen vor dem Essen. Letzter Wert: ${latestKg()} kg</p>`; }
function bindWeight(){
  $("#wSave")?.addEventListener("click", () => {
    const v = parseFloat(String($("#wIn").value).replace(",", "."));
    if (!(v > 25 && v < 200)){ toast("Bitte ein Gewicht in kg eingeben."); return; }
    const k = today(); S.body.w = S.body.w.filter(x => x.d !== k); S.body.w.push({d:k, kg:v}); S.body.w.sort((a, b) => a.d < b.d ? -1 : 1); S.profile.kg = v; save();
    toast(`Gespeichert: ${v} kg`); route();
  });
}

// ---------- AGOGE (Training, Schritt für Schritt) ----------
let T = null; // laufender Timer
function stopTimers(){ if (T){ clearInterval(T.iv); T = null; } unlockScreen(); }
function viewAgoge(){
  const k = today(), { day } = progDay(k), log = logOf(k);
  if (!day.plan){ location.hash = "#heute"; return; }
  const steps = buildSteps(day, log);
  log.pos = Math.min(log.pos || 0, steps.length - 1); save();
  lockScreen();
  renderStep(steps, log, k);
}
function renderStep(steps, log, k){
  stopTimers(); lockScreen();
  const i = log.pos, s = steps[i], u = EX[s.id] || {name: exName(s.id), schritte:[], muskeln:[], fehler:[]};
  const h = history(s.id, k), next = steps[i + 1];
  const started = log.started || Date.now(); log.started = started;
  const remainMin = steps.slice(i).reduce((a, x) => a + (isSec(x.einheit) ? (x.ziel || 20) : (x.ziel || 10) * 3) + x.pause, 0) / 60;
  const endAt = new Date(Date.now() + remainMin * 6e4);
  const prev = log.sets[s.key]?.v;
  const startVal = prev ?? (h.last != null ? h.last : (s.ziel || 0));
  const goal = s.test ? "Maximum" : (s.bereich ? `${s.bereich[0]}–${s.bereich[1]}` : (s.ziel ?? ""));
  const vid = VIDEOS[s.id];
  const showKg = (u.material || []).includes("hanteln");
  $("#view").innerHTML = `
    <div class="ag-top">
      <div class="row"><a class="icon-btn" href="#heute" aria-label="Zurück zu Heute">${ICON.back}</a>
        <div class="grow ag-meta"><span class="num">Übung ${i + 1} von ${steps.length}</span><span class="num" id="clock">0:00</span><span class="num">fertig ca. ${String(endAt.getHours()).padStart(2,"0")}:${String(endAt.getMinutes()).padStart(2,"0")}</span></div></div>
      <div class="ag-prog"><i style="width:${(i / steps.length) * 100}%"></i></div>
    </div>
    <div class="ag-card">
      <div class="eyebrow">${esc(s.title)}${s.rounds > 1 ? ` · ${s.rounds - s.r === 0 ? "letztes Mal" : `noch ${s.rounds - s.r + 1} Mal`}` : ""}</div>
      ${figSVG(s.id, u.muskeln || [])}
      <h2 class="ag-name">${esc(u.name)}</h2>
      <div class="chips">${(u.muskeln || []).slice(0, 4).map(m => `<span class="mchip">${esc(muscleShort(m))}</span>`).join("")}</div>
      <div class="goal"><b class="num">${esc(goal)}</b><span>${esc(s.test ? (s.text || "") : unitText(s.einheit))}${s.kg ? ` · ${S.settings.hantelKg} kg` : ""}</span></div>
      ${h.last != null ? `<div class="beat"><span>Letztes Mal <b class="num">${h.last}</b></span><span>Heute? <b class="num">${h.last + 1}</b></span><span>Rekord <b class="num">${h.best}</b></span></div>` : ""}
      ${s.tempo ? `<p class="hint">Tempo: ${esc(s.tempo)}</p>` : ""}
      ${u.handgelenk ? `<p class="hint">${esc(META.handgelenkTipp)}</p>` : ""}
      <ol class="steps">${(u.schritte || []).map(t => `<li>${glossify(t)}</li>`).join("")}</ol>
      <details class="more"><summary>Fehler vermeiden</summary><ul class="steps" style="margin-top:6px">${(u.fehler || []).map(t => `<li>${esc(t)}</li>`).join("")}</ul>${u.sicherheit ? `<p class="small" style="margin-top:6px">${esc(u.sicherheit)}</p>` : ""}</details>
      ${vid ? `<div id="vidSlot"><button class="btn wide" id="vid">${ICON.play}Video ansehen${vid.kanal ? ` · ${esc(vid.kanal)}` : ""}</button></div>` : ""}
      ${isSec(s.einheit) ? `<button class="watch" id="watch">Stoppuhr starten</button>` : ""}
      <div class="stepper"><button id="minus" aria-label="weniger">−</button><input id="val" class="num" type="number" inputmode="numeric" min="0" value="${startVal}" aria-label="${isSec(s.einheit) ? "Sekunden" : "Wiederholungen"}"><button id="plus" aria-label="mehr">+</button></div>
      ${showKg ? `<div class="row small"><span>Hanteln</span><button class="chip" id="kgm">−</button><b class="num" id="kgv">${S.settings.hantelKg} kg</b><button class="chip" id="kgp">+</button></div>` : ""}
      <button class="btn primary" id="done">${next ? "Fertig ✓" : "Agoge beenden ✓"}</button>
      <div class="ag-tools">
        <button class="btn" id="easier">${u.leichter ? "Zu schwer?" : "Leichter?"}</button>
        <button class="btn" id="swap">Tauschen</button>
        <button class="btn" id="pain">Schmerz?</button>
      </div>
      <div id="panel"></div>
      <div class="row" style="justify-content:space-between">
        <button class="btn ghost sm" id="prev" ${i === 0 ? "disabled" : ""}>Zurück</button>
        <button class="btn ghost sm" id="skip">Überspringen</button>
      </div>
      ${next ? `<p class="next">Danach: ${esc(exName(next.id))}</p>` : ""}
    </div>`;
  const clock = () => { const el = $("#clock"); if (el) el.textContent = fmt((Date.now() - started) / 1000); };
  clock(); const clockIv = setInterval(clock, 1000);
  const val = $("#val");
  $("#minus").onclick = () => { val.value = Math.max(0, (Number(val.value) || 0) - 1); };
  $("#plus").onclick = () => { val.value = (Number(val.value) || 0) + 1; };
  if (showKg){ const setKg = d => { S.settings.hantelKg = Math.max(1, Math.round((S.settings.hantelKg + d) * 2) / 2); save(); $("#kgv").textContent = `${S.settings.hantelKg} kg`; }; $("#kgm").onclick = () => setKg(-.5); $("#kgp").onclick = () => setKg(.5); }
  $("#vid")?.addEventListener("click", () => {
    const m = String(vid.url).match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/);
    const link = `<a class="small" href="${esc(vid.url)}" target="_blank" rel="noopener">Auf YouTube öffnen</a>`;
    if (!navigator.onLine){ $("#vidSlot").innerHTML = `<p class="small">Offline: Video geht nur mit Internet.</p>`; return; }
    $("#vidSlot").innerHTML = m ? `<div class="video-box"><iframe src="https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1&playsinline=1" title="${esc(vid.titel || u.name)}" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen></iframe></div><p style="margin-top:6px">${link}</p>` : link;
  });
  // Stoppuhr im Knopf: 3 Sek Vorlauf, dann zählt sie hoch, tippen = Stopp
  $("#watch")?.addEventListener("click", () => {
    const b = $("#watch");
    if (T && T.kind === "watch"){ const sec = T.start ? Math.round((Date.now() - T.start) / 1000) : 0; stopTimers(); lockScreen(); b.classList.remove("run"); b.textContent = "Stoppuhr starten"; if (sec) val.value = sec; return; }
    stopTimers(); lockScreen(); b.classList.add("run");
    T = {kind:"watch", start:0, prep: Date.now() + 3000, last:4};
    T.iv = setInterval(() => {
      if (!T.start){ const left = Math.ceil((T.prep - Date.now()) / 1000); if (left <= 0){ T.start = Date.now(); beep(); } else if (left !== T.last){ T.last = left; beep(620, .06); b.textContent = `Bereit … ${left}`; } }
      else b.textContent = `${fmt((Date.now() - T.start) / 1000)} · Stopp`;
    }, 200);
  });
  const go = d => { clearInterval(clockIv); log.pos = Math.max(0, Math.min(steps.length - 1, i + d)); save(); renderStep(steps, log, k); mountFigs($("#view")); window.scrollTo(0, 0); };
  $("#prev").onclick = () => go(-1);
  $("#skip").onclick = () => { if (!next){ finish(log, k, steps); return; } go(1); };
  // Fertig: Wert speichern, dann zählt der Knopf selbst die Pause runter (Regel 2)
  $("#done").onclick = () => {
    const b = $("#done");
    if (T && T.kind === "rest"){ stopTimers(); go(1); return; }
    const v = Math.max(0, Number(val.value) || 0);
    log.sets[s.key] = {id: s.id, v, kg: showKg ? S.settings.hantelKg : null, t: Date.now()}; save();
    if (h.best != null && v > h.best) toast(`Neuer Rekord: ${v}! ${line("rekord")}`);
    if (!next){ clearInterval(clockIv); finish(log, k, steps); return; }
    stopTimers(); lockScreen();
    let left = s.pause; b.classList.add("rest");
    const paint = () => { b.innerHTML = `Pause <b class="num">${fmt(left)}</b> · dann ${esc(exName(next.id))}`; };
    paint();
    T = {kind:"rest"}; T.iv = setInterval(() => { left--; if (left > 0 && left <= 3) beep(620, .06); if (left <= 0){ beep(880, .4); stopTimers(); go(1); return; } paint(); }, 1000);
  };
  $("#easier").onclick = () => {
    if (u.leichter && EX[u.leichter]){ log.swaps[`${s.bi}.${s.ui}`] = u.leichter; save(); toast(`Leichtere Stufe: ${EX[u.leichter].name}`); clearInterval(clockIv); viewAgoge(); mountFigs($("#view")); }
    else toast(u.leichterTipp || "Weniger Wiederholungen oder langsamer, dafür sauber.");
  };
  $("#swap").onclick = () => {
    const alts = Object.values(EX).filter(x => x.gruppe === u.gruppe && x.id !== s.id && !x.gesperrt).slice(0, 12);
    $("#panel").innerHTML = `<div class="card"><div class="kicker">Statt ${esc(u.name)}</div><div class="list">${alts.map(x => `<button class="btn sm wide" data-alt="${x.id}" style="justify-content:flex-start">${esc(x.name)}</button>`).join("")}</div></div>`;
    $$("[data-alt]").forEach(b => b.onclick = () => { log.swaps[`${s.bi}.${s.ui}`] = b.dataset.alt; save(); clearInterval(clockIv); viewAgoge(); mountFigs($("#view")); });
  };
  $("#pain").onclick = () => {
    $("#panel").innerHTML = `<div class="pain"><p><b>${esc(META.stoppRegel)}</b></p>
      <button class="btn wide" id="painJoint">Gelenk sticht: leichtere oder andere Übung</button>
      <button class="btn wide" id="painStop">Schwindel, Schwarzwerden oder Brustschmerz: jetzt stoppen</button></div>`;
    $("#painJoint").onclick = () => { if (u.leichter && EX[u.leichter]){ $("#easier").click(); } else $("#swap").click(); };
    $("#painStop").onclick = () => { clearInterval(clockIv); stopTimers(); $("#view").innerHTML = `<div class="stack"><div class="pain"><h3>Training gestoppt</h3><p>Setz oder leg dich hin, Beine hoch, trink Wasser. Wenn es nicht nach ein paar Minuten weggeht, oder bei Brustschmerz: sofort deinen Eltern sagen oder 144 anrufen.</p></div><a class="btn wide" href="#heute">Zu Heute</a></div>`; };
  };
}
function finish(log, k, steps){
  stopTimers();
  log.done = true; log.finished = Date.now(); log.pos = 0; save();
  location.hash = "#bericht";
}

// ---------- KAMPFBERICHT ----------
function viewBericht(){
  const k = today(), log = logOf(k), { day } = progDay(k);
  const dur = log.finished && log.started ? (log.finished - log.started) / 1000 : 0;
  const ids = [...new Set(Object.values(log.sets).map(s => s.id))];
  const recs = ids.map(id => { const h = history(id, k); const best = Math.max(...Object.values(log.sets).filter(s => s.id === id).map(s => s.v)); return {id, best, prev: h.best}; }).filter(r => r.prev != null && r.best > r.prev);
  const q = dayPick(quotes(), 7);
  $("#view").innerHTML = `<div class="report">
    ${logoSVG(96)}
    <div class="eyebrow">Kampfbericht · ${longDate(k)}</div>
    <h1 class="title-xl">${log.done ? "Agoge bestanden" : "Noch nicht fertig"}</h1>
    <div class="tiles" style="width:100%"><div class="tile"><b class="num">${dur ? fmt(dur) : "–"}</b><span>Minuten</span></div><div class="tile"><b class="num">${Object.keys(log.sets).length}</b><span>Sätze</span></div>
      <div class="tile"><b class="num">${streak()}</b><span>Tage in Folge</span></div><div class="tile"><b class="num">${recs.length}</b><span>Rekorde</span></div></div>
    ${recs.length ? `<div class="recs">${recs.map(r => `<div class="rec"><span>${esc(exName(r.id))}</span><b class="num">${r.prev} → ${r.best}</b></div>`).join("")}</div>` : `<p class="muted">${esc(line("ende"))}</p>`}
    ${q ? `<div class="quote" style="text-align:left"><p>«${esc(q.text)}»</p><small>${esc(q.quelle || "")}</small></div>` : ""}
    <div class="card" style="width:100%;text-align:left"><div class="kicker">Heute trainiert</div>${muscleMapSVG(muscleLoad([k]))}</div>
    <a class="btn primary" href="#heute">Zurück</a>
  </div>`;
}
function muscleLoad(days){
  const c = {};
  days.forEach(d => { const l = S.logs[d]; if (!l) return; Object.values(l.sets).forEach(s => { (EX[s.id]?.muskeln || []).slice(0, 2).forEach(m => c[m] = (c[m] || 0) + 1); }); });
  const st = {}; Object.entries(c).forEach(([m, n]) => st[m] = n >= 9 ? 3 : n >= 5 ? 2 : 1);
  return st;
}

// ---------- PLAN ----------
let planSel = null;
function viewPlan(){
  const k = today(), cw = Math.max(1, weekOf(k)); planSel ??= Math.min(52, cw);
  let g = "";
  ROMAN.forEach((rn, r) => { g += `<span class="rn">${rn}</span>`; for (let i = 1; i <= 13; i++){ const w = r * 13 + i, wk = PROG.wochen[w - 1];
    g += `<button class="wc ${wk.typ === "deload" ? "dl" : ""} ${wk.typ === "test" ? "ts" : ""} ${w < cw ? "past" : ""} ${w === cw ? "now" : ""} ${w === planSel ? "sel" : ""}" data-w="${w}" aria-label="Woche ${w}">${wk.typ === "test" ? "T" : ""}</button>`; } });
  const wk = PROG.wochen[planSel - 1], ph = phaseOf(planSel), mon = addDays(S.settings.start, (planSel - 1) * 7);
  $("#view").innerHTML = `<div class="stack">
    <div><div class="eyebrow">Start ${longDate(S.settings.start)}</div><h1 class="title-xl" style="margin-top:6px">Dein Jahr</h1></div>
    <div class="card"><div class="wgrid">${g}</div>
      <div class="legend" style="margin-top:10px"><span><i class="wc now"></i>jetzt</span><span><i class="wc past"></i>vorbei</span><span><i class="wc dl"></i>leichte Woche</span><span><i class="wc ts"></i>Test</span></div></div>
    <div class="card"><div class="kicker">Phase ${ROMAN[PROG._meta.phasen.indexOf(ph)]} · ${esc(ph.name)}</div><p class="muted">${esc(ph.ziel)}</p></div>
    <div class="card"><div class="split"><h3>Woche ${planSel}</h3><span class="small">${wk.typ === "deload" ? "leichte Woche" : wk.typ === "test" ? "Testwoche" : ""}</span></div>
      <p class="small" style="margin-top:4px">${esc(wk.fokus || "")}</p>
      <div style="margin-top:8px">${wk.tage.map((t, i) => { const dk = addDays(mon, i); const done = S.logs[dk]?.done;
        return `<button class="dayrow" data-day="${i}"><b>${DAYS[i]}</b><span>${esc(t.name)}<br><span class="small">${esc(t.muskelText || t.hinweis || "")}</span></span><span class="${done ? "ok" : "small num"}">${done ? "✓" : t.minuten ? t.minuten + "′" : ""}</span></button>`; }).join("")}</div></div>
    <div id="dayDetail"></div>
  </div>`;
  $$(".wc[data-w]").forEach(b => b.onclick = () => { planSel = Number(b.dataset.w); viewPlan(); });
  $$(".dayrow").forEach(b => b.onclick = () => {
    const t = wk.tage[Number(b.dataset.day)];
    if (!t.plan){ $("#dayDetail").innerHTML = `<div class="card"><h3>Ruhetag</h3><p class="muted">${esc(t.hinweis || "")}</p></div>`; return; }
    $("#dayDetail").innerHTML = `<div class="card"><div class="kicker">${DAYS_LONG[Number(b.dataset.day)]} · ${t.minuten} Min</div><h3>${esc(t.name)}</h3><div class="list" style="margin-top:10px">
      ${t.plan.map(bl => `<div><div class="eyebrow">${esc(bl.titel)}${bl.runden > 1 ? ` · ${bl.runden} Mal` : ""}</div>${bl.uebungen.map(u => `<div class="line"><span>${esc(exName(u.id))}</span><b class="num">${u.bereich ? `${u.bereich[0]}–${u.bereich[1]}` : (u.ziel ?? "")} ${isSec(u.einheit) ? "Sek" : ""}</b></div>`).join("")}</div>`).join("")}
    </div></div>`;
    $("#dayDetail").scrollIntoView({behavior:"smooth", block:"start"});
  });
}

// ---------- SKILLS ----------
function ladderPos(L){
  if (S.skills[L.id]) return S.skills[L.id];
  const done = new Set(D.skills._meta?.startStand?.geschafft || []);
  let pos = 1; L.stufen.forEach(st => { if (done.has(st.uebung)) pos = Math.max(pos, st.nr + 1); });
  if (pos === 1 && L.startUebung){ const st = L.stufen.find(x => x.uebung === L.startUebung); if (st) pos = st.nr; }
  return Math.min(pos, L.stufen.length);
}
function viewSkills(){
  $("#view").innerHTML = `<div class="stack"><div><div class="eyebrow">Skill-Leitern</div><h1 class="title-xl" style="margin-top:6px">Meisterschaft</h1>
    <p class="muted" style="margin-top:6px">${esc(D.skills._meta?.regel || "")}</p></div>
    ${D.skills.leitern.map(L => { const pos = ladderPos(L), cur = L.stufen.find(s => s.nr === pos) || L.stufen[L.stufen.length - 1]; const ex = EX[cur.uebung] || {};
      return `<div class="card" id="L-${L.id}"><div class="split"><h3>${esc(L.name)}</h3><span class="small num">Stufe ${pos} von ${L.stufen.length}</span></div>
        <div style="margin-top:10px">${figSVG(cur.uebung, ex.muskeln || [])}</div>
        <p style="margin-top:10px"><b>${esc(cur.name)}</b></p><p class="hint" style="margin-top:6px">Test: ${esc(cur.test.text)}</p>
        <button class="btn wide" style="margin-top:10px" data-pass="${L.id}">Test geschafft ✓</button>
        <div class="ladder" style="margin-top:12px">${L.stufen.map(st => `<div class="lstep ${st.nr < pos ? "done" : st.nr === pos ? "cur" : "lock"}"><span class="ic">${st.nr < pos ? "✓" : st.nr === pos ? "●" : "○"}</span><span>${esc(st.name)}</span><small class="num">${st.test.wert} ${esc(D.skills._meta.einheiten?.[st.test.einheit] || st.test.einheit)}</small></div>`).join("")}</div></div>`; }).join("")}
  </div>`;
  $$("[data-pass]").forEach(b => b.onclick = () => {
    if (b.dataset.armed !== "1"){ b.dataset.armed = "1"; b.textContent = "Wirklich sauber geschafft? Nochmal tippen"; setTimeout(() => { b.dataset.armed = ""; b.textContent = "Test geschafft ✓"; }, 3500); return; }
    const L = D.skills.leitern.find(x => x.id === b.dataset.pass); const pos = ladderPos(L);
    if (pos >= L.stufen.length){ toast("Höchste Stufe erreicht. Legende."); return; }
    S.skills[L.id] = pos + 1; save(); toast(`Freigeschaltet: ${L.stufen[pos].name}`); viewSkills(); mountFigs($("#view"));
  });
}

// ---------- KÖRPER ----------
function weightChart(){
  const W = S.body.w; if (W.length < 2) return `<p class="small">Ab 2 Messungen siehst du hier die Kurve.</p>`;
  const X0 = 36, X1 = 300, Y0 = 130, Y1 = 12, start = W[0].d, span = Math.max(7, diffDays(start, W[W.length - 1].d));
  const vals = W.map(x => x.kg); const lo = Math.floor(Math.min(...vals) - .5), hi = Math.ceil(Math.max(...vals, W[0].kg + span / 7 * .5) + .5);
  const x = d => X0 + (X1 - X0) * diffDays(start, d) / span, y = v => Y0 - (Y0 - Y1) * (v - lo) / (hi - lo || 1);
  let s = ""; for (let v = lo; v <= hi; v++) if ((hi - lo) <= 6 || v % 2 === 0) s += `<line class="gl1" x1="${X0}" x2="${X1}" y1="${y(v)}" y2="${y(v)}"/><text x="2" y="${y(v) + 3}">${v} kg</text>`;
  const e = W[W.length - 1].d; s += `<polygon class="band" points="${x(start)},${y(W[0].kg)} ${x(e)},${y(W[0].kg + diffDays(start, e) / 7 * .25)} ${x(e)},${y(W[0].kg + diffDays(start, e) / 7 * .5)}"/>`;
  s += `<polyline class="ln" points="${W.map(p => `${x(p.d)},${y(p.kg)}`).join(" ")}"/>` + W.map((p, i) => `<circle class="${i === W.length - 1 ? "end" : "pt"}" cx="${x(p.d)}" cy="${y(p.kg)}" r="${i === W.length - 1 ? 4.5 : 2.5}"/>`).join("");
  return `<svg class="chart" viewBox="0 0 310 150" role="img" aria-label="Gewichtsverlauf">${s}</svg><p class="small">Bronzenes Band = Ziel +0.25 bis +0.5 kg pro Woche.</p>`;
}
function viewKoerper(){
  const k = today(), mon = addDays(k, -dayIdx(k)), weekDays = DAYS.map((_, i) => addDays(mon, i));
  const recs = {}, skipG = new Set(["aufwaermen","dehnen","haltung"]); Object.keys(S.logs).forEach(d => { Object.values(S.logs[d].sets).forEach(s => { if (skipG.has(EX[s.id]?.gruppe)) return; recs[s.id] = Math.max(recs[s.id] || 0, s.v); }); (S.logs[d].extra || []).forEach(e => { recs[e.id] = Math.max(recs[e.id] || 0, e.v); }); });
  const W = S.body.w, gain = W.length > 1 ? (W[W.length - 1].kg - W[0].kg) : 0;
  const lastPhoto = S.body.photos[S.body.photos.length - 1], nextPhoto = lastPhoto ? addDays(lastPhoto, 14) : S.settings.start;
  const M = S.body.m[S.body.m.length - 1] || {};
  $("#view").innerHTML = `<div class="stack">
    <div><div class="eyebrow">Fortschritt</div><h1 class="title-xl" style="margin-top:6px">Dein Körper</h1></div>
    <div class="tiles"><div class="tile"><b class="num">${latestKg()}</b><span>kg aktuell</span></div><div class="tile"><b class="num">${gain >= 0 ? "+" : ""}${gain.toFixed(1)}</b><span>kg seit Start</span></div></div>
    <div class="card"><div class="kicker">Gewicht</div>${weightQuick()}<div style="margin-top:12px">${weightChart()}</div></div>
    <div class="card"><div class="kicker">Diese Woche trainiert</div>${muscleMapSVG(muscleLoad(weekDays))}<p class="small" style="margin-top:6px">Je röter, desto mehr harte Sätze. Graue Muskeln kommen zu kurz.</p></div>
    <div class="card"><div class="kicker">Rekorde</div><div class="list">${Object.keys(recs).length ? Object.entries(recs).sort((a, b) => exName(a[0]).localeCompare(exName(b[0]))).map(([id, v]) => `<div class="line"><span>${esc(exName(id))}</span><b class="num">${v}</b></div>`).join("") : `<p class="small">Noch keine. Nach dem ersten Training stehen sie hier.</p>`}</div></div>
    <div class="card"><div class="kicker">Masse · einmal im Monat</div>
      <div class="tiles">${[["arm","Oberarm"],["brust","Brust"],["taille","Taille"],["bein","Oberschenkel"]].map(([kk, l]) => `<label class="lbl">${l} (cm)<input class="field" data-m="${kk}" type="number" step="0.5" inputmode="decimal" value="${M[kk] ?? ""}"></label>`).join("")}</div>
      <button class="btn wide" id="mSave" style="margin-top:10px">Masse speichern</button>${M.d ? `<p class="small" style="margin-top:6px">Zuletzt: ${longDate(M.d)}</p>` : ""}</div>
    <div class="card"><div class="kicker">Fotos · alle 2 Wochen</div><p class="muted">${nextPhoto <= k ? "Heute fällig" : `Nächste: ${longDate(nextPhoto)}`}. Gleiches Licht, gleiche Zeit: vorne, seitlich, hinten. Die Fotos bleiben auf deinem Handy.</p>
      <button class="btn wide" id="pSave" style="margin-top:10px">Fotos gemacht</button></div>
  </div>`;
  bindWeight();
  $("#mSave").onclick = () => { const m = {d:k}; $$("[data-m]").forEach(i => { const v = parseFloat(String(i.value).replace(",", ".")); if (v) m[i.dataset.m] = v; }); S.body.m.push(m); save(); toast("Masse gespeichert"); };
  $("#pSave").onclick = () => { S.body.photos.push(k); save(); toast("Notiert. Nächste Fotos in 2 Wochen."); viewKoerper(); };
}

// ---------- ESSEN ----------
function targets(){
  const kg = latestKg(), { cm, alter } = S.profile, R = D.nut.rechnung;
  const r50 = v => Math.round(v / 50) * 50, r5 = v => Math.round(v / 5) * 5;
  return { kcal: r50((10 * kg + 6.25 * cm - 5 * alter + 5) * R.aktivitaet + R.plusZunehmen), protein: r5(R.proteinProKg * kg), kg };
}
function viewEssen(){
  const k = today(), f = (S.food[k] ||= {checks:[], koffein:[]}), t = targets(), N = D.nut;
  const mg = f.koffein.reduce((a, x) => a + x, 0), max = Math.round((N.koffein.maxMgProKg || 3) * t.kg), late = new Date().getHours() >= (N.koffein.nachUhr || 14);
  $("#view").innerHTML = `<div class="stack">
    <div><div class="eyebrow">Ohne Kalorienzählen</div><h1 class="title-xl" style="margin-top:6px">Essen</h1></div>
    <div class="tiles"><div class="tile"><b class="num">${t.kcal}</b><span>kcal pro Tag</span></div><div class="tile"><b class="num">${t.protein} g</b><span>Protein pro Tag</span></div></div>
    <p class="small">Aus ${t.kg} kg, ${S.profile.cm} cm, ${S.profile.alter} Jahren. Ziel: +0.25 bis +0.5 kg pro Woche.</p>
    <div class="card"><div class="split"><span class="kicker" style="margin:0">Heute</span><span class="small num">${f.checks.length} / ${N.checkliste.length}</span></div>
      <div class="check" style="margin-top:10px">${N.checkliste.map(c => `<button data-c="${c.id}" aria-pressed="${f.checks.includes(c.id)}"><i>${f.checks.includes(c.id) ? "✓" : ""}</i><span>${esc(c.text)}<small>${esc(c.tipp || "")}</small></span></button>`).join("")}</div></div>
    <div class="card"><div class="split"><span class="kicker" style="margin:0">Koffein heute</span><span class="small num">${mg} / ${max} mg</span></div>
      <div class="meter ${mg > max ? "over" : ""}" style="margin-top:8px"><i style="width:${Math.min(100, mg / max * 100)}%"></i></div>
      <p class="small" style="margin-top:6px">${mg > max ? "Über der Grenze. Kein Koffein mehr heute, viel Wasser trinken." : late ? `Nach ${N.koffein.nachUhr} Uhr: kein Koffein mehr, sonst schläfst du schlecht.` : esc(N.koffein.text)}</p>
      <div class="chips" style="margin-top:8px">${N.koffein.getraenke.map((g, i) => `<button class="chip" data-k="${i}">+ ${esc(g.name)} (${g.mg})</button>`).join("")}${f.koffein.length ? `<button class="chip" id="kUndo">Rückgängig</button>` : ""}</div></div>
    <div class="card"><div class="kicker">Mahlzeiten ohne Kochen</div><div class="list">${N.mahlzeiten.map(m => `<details class="more"><summary class="plain">${esc(m.name)} · ${m.kcal} kcal · ${m.protein} g Protein</summary><p class="small" style="margin-top:4px">${esc((m.zutaten || []).join(", "))}${m.hinweis ? ` · ${esc(m.hinweis)}` : ""}${m.preis ? ` · ca. ${m.preis.toFixed(2)} Fr.` : ""}</p></details>`).join("")}</div></div>
    <div class="card"><div class="kicker">Einkauf pro Woche</div><div class="list">${N.einkauf.proWoche.map(e => `<div class="line"><span>${esc(e.was)}</span><b class="num">${esc(e.menge)}</b></div>`).join("")}</div>${N.einkauf.summeCHF ? `<p class="small" style="margin-top:6px">Ca. ${N.einkauf.summeCHF} Fr. pro Woche (Schätzung).</p>` : ""}</div>
    ${N.nichtNehmen ? `<div class="card"><details class="more"><summary>Nicht nehmen (unter 18)</summary><ul class="steps" style="margin-top:6px">${(Array.isArray(N.nichtNehmen) ? N.nichtNehmen : N.nichtNehmen.liste || []).map(x => `<li>${esc(typeof x === "string" ? x : (x.was || x.text || ""))}${x.warum ? `: ${esc(x.warum)}` : ""}</li>`).join("")}</ul></details></div>` : ""}
  </div>`;
  $$("[data-c]").forEach(b => b.onclick = () => { const id = b.dataset.c; f.checks = f.checks.includes(id) ? f.checks.filter(x => x !== id) : [...f.checks, id]; save(); viewEssen(); });
  $$("[data-k]").forEach(b => b.onclick = () => { f.koffein.push(N.koffein.getraenke[Number(b.dataset.k)].mg); save(); viewEssen(); });
  $("#kUndo")?.addEventListener("click", () => { f.koffein.pop(); save(); viewEssen(); });
}

// ---------- EINSTELLUNGEN ----------
function viewSettings(){
  const P = S.profile;
  $("#view").innerHTML = `<div class="stack">
    <div><div class="eyebrow">Einstellungen</div><h1 class="title-xl" style="margin-top:6px">Dein Profil</h1></div>
    <div class="card"><div class="tiles">
      <label class="lbl">Name<input class="field" id="sName" value="${esc(P.name)}" placeholder="Jive"></label>
      <label class="lbl">Alter<input class="field" id="sAlter" type="number" inputmode="numeric" value="${P.alter}"></label>
      <label class="lbl">Grösse (cm)<input class="field" id="sCm" type="number" inputmode="numeric" value="${P.cm}"></label>
      <label class="lbl">Hanteln (kg)<input class="field" id="sKg" type="number" step="0.5" inputmode="decimal" value="${S.settings.hantelKg}"></label>
      <label class="lbl">Start des Plans<input class="field" id="sStart" type="date" value="${S.settings.start}"></label>
      <label class="lbl">Aussehen<select class="field" id="sTheme"><option value="">wie das Gerät</option><option value="dark" ${S.settings.theme === "dark" ? "selected" : ""}>Dunkel</option><option value="light" ${S.settings.theme === "light" ? "selected" : ""}>Hell</option></select></label>
    </div><button class="btn wide" id="sSave" style="margin-top:12px">Speichern</button></div>
    <div class="card"><div class="kicker">Daten sichern</div><p class="small">Alles bleibt in diesem Browser. Sichere ab und zu eine Kopie.</p>
      <div class="row wrap" style="margin-top:10px"><button class="btn sm" id="exp">Als Datei sichern</button><button class="btn sm" id="copy">Kopieren</button><label class="btn sm">Datei laden<input type="file" id="imp" accept="application/json" hidden></label></div>
      <textarea class="field" id="io" rows="3" placeholder="Oder hier eine Kopie einfügen und «Einfügen» tippen" style="margin-top:10px"></textarea>
      <button class="btn sm" id="paste" style="margin-top:8px">Einfügen</button></div>
    <div class="card"><div class="kicker">Neu anfangen</div><button class="btn sm" id="reset">Alles löschen</button></div>
    <p class="small">Winter Arc Training · Inhalte von Claude A (App, Figuren) und Claude B (Übungen, Programm, Essen). Keine Medizin: bei Schmerzen oder Unsicherheit Arzt fragen.</p>
  </div>`;
  $("#sSave").onclick = () => {
    P.name = $("#sName").value.trim(); P.alter = Number($("#sAlter").value) || P.alter; P.cm = Number($("#sCm").value) || P.cm;
    S.settings.hantelKg = parseFloat($("#sKg").value) || S.settings.hantelKg; S.settings.start = $("#sStart").value || S.settings.start; S.settings.theme = $("#sTheme").value || null;
    save(); applyTheme(); toast("Gespeichert");
  };
  const dump = () => JSON.stringify(S, null, 1);
  $("#exp").onclick = () => { try { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([dump()], {type:"application/json"})); a.download = `winterarc-training-${today()}.json`; a.click(); toast("Datei wird gespeichert"); } catch(e) { $("#io").value = dump(); toast("Kopie unten, bitte selbst kopieren"); } };
  $("#copy").onclick = () => { navigator.clipboard?.writeText(dump()).then(() => toast("Kopiert"), () => { $("#io").value = dump(); $("#io").select(); toast("Unten markiert, bitte kopieren"); }); };
  const load = txt => { try { const o = JSON.parse(txt); if (o.v !== 1 || !o.logs) throw 0; S = Object.assign(fresh(), o); save(); applyTheme(); toast("Geladen"); route(); } catch(e) { toast("Das ist keine gültige Sicherung."); } };
  $("#imp").onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => load(r.result); r.readAsText(f); };
  $("#paste").onclick = () => load($("#io").value);
  $("#reset").onclick = e => { const b = e.currentTarget; if (b.dataset.armed !== "1"){ b.dataset.armed = "1"; b.textContent = "Wirklich alles löschen? Nochmal tippen"; return; } S = fresh(); save(); toast("Gelöscht"); route(); };
}

// ---------- Start ----------
function applyTheme(){ const t = S.settings.theme; if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
applyTheme();
shell();
route();
if ("serviceWorker" in navigator && location.protocol === "https:" && document.querySelector('link[rel="manifest"]')){
  addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
