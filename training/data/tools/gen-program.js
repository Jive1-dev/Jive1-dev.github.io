// Generator für training/data/program.json (Claude B). Aufruf: node program.js <exercises.json> <ziel.json>
const fs = require("fs");
const EX = new Map(JSON.parse(fs.readFileSync(process.argv[2], "utf8")).uebungen.map(u => [u.id, u]));

// ---- Zeitmodell (Sekunden) ----
const PAUSE = 35;             // Pause nach jeder Übung im Supersatz (Regel 5: 30–45)
const WECHSEL = 30;           // Material holen, Position einnehmen pro Paar
const MIN_WARM = 6, MIN_SKILL = 10, MIN_COOL = 3;
function arbeitSek(id, ziel, tempo){
  const e = EX.get(id).einheit;
  const proWdh = tempo ? 6 : 3;
  if (e === "wdh") return ziel * proWdh;
  if (e === "wdh_seite") return 2 * ziel * proWdh + 5;
  if (e === "sek") return ziel;
  if (e === "sek_seite") return 2 * ziel + 5;
  if (e === "versuche") return ziel * 15;
  throw new Error(e);
}

// ---- Phasen ----
const PHASEN = [
  { key: "F", name: "Fundament", von: 1, bis: 13,
    ziel: "Saubere Technik, Gelenke und Sehnen stärken, Grundkraft. Handstand an der Wand sicher, Krähe stabil.",
    regel: "Jede Woche 1 Wiederholung mehr (oder 2–5 Sek länger halten). Technik vor Zahl.", hantelKg: 5 },
  { key: "A", name: "Aufbau", von: 14, bis: 26,
    ziel: "Muskeln aufbauen: mehr Runden, schwerere Stufen. Hanteln 8–10 kg, sobald sie da sind.",
    regel: "Erst die Wiederholungen hoch, dann schwerere Stufe oder Hantel (doppelte Steigerung).", hantelKg: 8 },
  { key: "K", name: "Kraft und Skills", von: 27, bis: 39,
    ziel: "Schwere Stufen mit weniger Wiederholungen, langsames Tempo. Freier Handstand, Tuck-Planche, L-Sitz.",
    regel: "Langsam runter (3 Sek). Skill-Stufe steigt nur, wenn der letzte Test es zeigt.", hantelKg: 10 },
  { key: "P", name: "Peak", von: 40, bis: 52,
    ziel: "Alles zusammenbringen: Bestwerte, schwerste sichere Stufen, am Schluss grosser Test.",
    regel: "Bestwerte jagen, aber nur mit sauberer Technik.", hantelKg: 10 }
];
const DELOAD = w => w % 5 === 0;
const TEST = w => [13, 26, 39, 52].includes(w);

// ---- Tage ----
const TAGE = [
  ["Mo", "Oberkörper A", "Brust, Schulter vorne, Trizeps + Handstand und Planche"],
  ["Di", "Unterkörper A", "Oberschenkel vorne, Waden, Bauch"],
  ["Mi", "Oberkörper B", "Rücken (Klimmzüge), Schulter seitlich und hinten, Bizeps, Unterarme"],
  ["Do", "Unterkörper B", "Po, Oberschenkel hinten, Schienbein, Füsse, Bauch"],
  ["Fr", "Oberkörper C mit Skills", "Skills lang (Handstand, Planche) + Brust und Rücken"],
  ["Sa", "Ganzkörper mit Sprungkraft", "Sprünge, ganzer Körper"],
  ["So", "Ruhe", ""]
];
const WARM = { o: "wrist scap circles", u: "legswing squat catcow", g: "wrist legswing squat" };
const COOL = { o: "chintuck wallangel", u: "hipflex calfstretch", g: "hipflex calfstretch", Do: "foot hipflex calfstretch" };
const ART = { Mo: "o", Di: "u", Mi: "o", Do: "u", Fr: "o", Sa: "g" };

// Vorlage: "id:start>ende[:t][:r4]"  t = Tempo aus exercises.json, r4 = 4 Runden; Hanteln bekommen kg aus der Phase
// Paar: "a | b"
const V = {
  F: { r: 3,
    Mo: { sk: "hswall:15>35 pllean:8>20", p: ["deeppu:6>12 | reary:10>15", "pike:3>8 | row:10>14", "benchdips:8>15 | rfly:10>12:t", "triext:8>12 | hollowt:20>40"] },
    Di: { sk: "tuckl:8>20 crow:10>25", p: ["bss:8>12 | lat:10>12:t", "goblet:10>15 | dbpress:8>12:t", "calf2:15>25 | kneeraise:10>15", "boxpistol:5>10 | hollowt:20>40"] },
    Mi: { sk: "hskick:4>6 crow:10>25", p: ["pullup:3>6 | pu:8>15", "negpu:3>5 | lat:10>12:t", "curl:10>12:t | ohe:10>12:t", "rfly:10>12:t | pikecomp:8>15"] },
    Do: { sk: "tuckl:8>20 hswall:15>35", p: ["thrust1:10>15 | curl:10>12:t", "sldl:8>12 | wristcurl:12>15:t", "revlunge:8>12 | legraise:6>10", "tib:15>25 | sideplank:20>40"] },
    Fr: { skMin: 15, sk: "hskick:4>6 tuckpl:1>5 crow:10>25", p: ["pullup:3>6 | deeppu:6>12", "row:10>14 | pike:3>8", "pikelift:3>6 | hang:20>40"] },
    Sa: { sk: "hsfree:5>12 crow:10>25", p: ["jumpsq:5>8 | assistpu:5>10", "broadjump:3>5 | pu:8>15", "bss:8>12 | dbpress:8>12:t", "sldl:8>12 | hollowrock:8>15"] }
  },
  A: { r: 3,
    Mo: { sk: "hswall:30>60 tuckpl:2>8", p: ["deeppu:10>15:r4 | reary:12>15:r4", "pikeel:4>10:r4 | row:10>14:r4", "dip:4>10 | rfly:10>12:t", "triext:10>15 | hollow:20>40"] },
    Di: { sk: "onel:8>15 crow:20>40", p: ["bssdb:8>12:r4 | lat:10>12:t:r4", "goblet:12>20 | dbpress:8>12:t", "calf1:12>20 | legraise:8>12", "boxpistol:8>12 | hollow:20>40"] },
    Mi: { sk: "hskick:6>8 hsfree:5>15", p: ["pullup:5>8:r4 | declpu:8>14:r4", "negpu:4>6:r4 | lat:10>12:t:r4", "curl:10>12:t | ohe:10>12:t", "rfly:10>12:t | hangknee:6>12"] },
    Do: { sk: "onel:8>15 hswall:30>60", p: ["thrustb:10>15:r4 | curl:10>12:t:r4", "sldl:10>14:r4 | wristcurl:15>20:t", "revlunge:10>14 | legraise:8>12", "tib:20>30 | sideplank:30>50"] },
    Fr: { skMin: 15, sk: "hsfree:5>15 tuckpl:2>8 crowhs:3>5", p: ["pullup:5>8:r4 | deeppu:10>15:r4", "row:10>14 | pppu:5>10", "pikelift:5>8 | hang:30>60"] },
    Sa: { sk: "hsfree:5>15 crowhs:3>5", p: ["jumpsq:6>10:r4 | pullup:3>6:r4", "broadjump:4>6 | declpu:8>14", "bss:10>14 | dbpress:8>12:t", "thrust1:10>15 | hollowrock:12>20"] }
  },
  K: { r: 3,
    Mo: { sk: "hsfree:10>25 tuckpl:5>12", p: ["dip:8>14:r4 | reary:12>15:r4", "pppu:6>10:r4 | row:10>14:r4", "hspu:1>4 | rfly:10>12:t", "triext:12>18 | hollow:30>50"] },
    Di: { sk: "lsit:5>15 crowhs:3>5", p: ["pistol:2>6:r4 | lat:10>12:t:r4", "bssdb:8>12:r4 | dbpress:8>12:t:r4", "calf1db:12>18 | legraise:10>15", "cossack:6>10 | hollow:30>50"] },
    Mi: { sk: "hsfree:10>25 hsshape:3>6", p: ["pullup:5>8:t:r4 | pikeel:8>12:r4", "negpu:4>6:r4 | lat:10>12:t:r4", "curl:8>12:t | ohe:8>12:t", "rfly:10>12:t | hangknee:10>15"] },
    Do: { sk: "lsit:5>15 hswall:40>60", p: ["nordic:2>5:r4 | curl:10>12:t:r4", "thrustb:12>18:r4 | wristcurl:15>20:t", "sldl:10>14 | twist:16>24", "tib:20>30 | sideplank:30>50"] },
    Fr: { skMin: 15, sk: "advtuck:3>8 hsfree:10>25 tuckpress:3>5", p: ["pullup:5>8:t:r4 | pppu:6>10:r4", "row:10>14 | deeppu:12>18", "crowhs:3>5 | hang:40>60"] },
    Sa: { sk: "hsfree:10>25 tuckpress:3>5", p: ["broadjump:5>6:r4 | pullup:4>7:r4", "jumpsq:8>10 | dip:8>14", "bssdb:8>12 | dbpress:8>12:t", "sldl:10>14 | hollowrock:15>20"] }
  },
  P: { r: 3,
    Mo: { sk: "hsfree:20>40 advtuck:3>10", p: ["dip:12>18:r4 | reary:15>20:r4", "pppu:8>12:r4 | row:12>15:r4", "hspu:2>5 | rfly:10>12:t", "triext:15>20 | dragon:2>5"] },
    Di: { sk: "lsit:10>20 crowhs:4>6", p: ["pistol:5>8:r4 | lat:10>12:t:r4", "bssdb:10>14:r4 | dbpress:10>12:t:r4", "calf1db:15>20 | legraise:12>15", "cossack:8>12 | hollowrock:15>25"] },
    Mi: { sk: "hsshape:4>8 hsfree:20>40", p: ["pullup:6>10:t:r4 | declpu:15>20:r4", "negpu:5>6:r4 | lat:10>12:t:r4", "curl:10>12:t | ohe:10>12:t", "rfly:10>12:t | hangknee:12>15"] },
    Do: { sk: "lsit:10>20 hswall:45>60", p: ["nordic:3>6:r4 | curl:10>12:t:r4", "thrustb:15>20:r4 | wristcurl:15>20:t", "sldl:12>15 | twist:20>30", "tib:25>30 | sideplank:40>60"] },
    Fr: { skMin: 15, sk: "advtuck:3>10 hsfree:20>40 tuckpress:3>6", p: ["pullup:8>12:r4 | pppu:8>12:r4", "row:12>15 | deeppu:15>20", "pikeel:10>15 | hang:45>60"] },
    Sa: { sk: "hsfree:20>40 crowhs:4>6", p: ["broadjump:5>6:r4 | pullup:6>10:r4", "jumpsq:8>10 | dip:12>18", "bssdb:10>14 | dbpress:10>12:t", "thrust1:12>15 | hollowrock:15>25"] }
  }
};

// Tests (Testwochen 13/26/39/52): eine Messung pro Tag, statt Paar 1. Ergebnis = neuer Startwert.
const TESTS = {
  Mo: [["deeppu", "So viele tiefe Liegestütze wie möglich, 1 Satz."], ["hswall", "Handstand an der Wand: so lange wie möglich."]],
  Di: [["bss", "Bulgarische Kniebeuge: so viele wie möglich, schwächeres Bein zählt."], ["calf1", "Einbeiniges Wadenheben: so viele wie möglich."]],
  Mi: [["pullup", "So viele saubere Klimmzüge wie möglich, 1 Satz."], ["hang", "Hängen: so lange wie möglich."]],
  Do: [["hollow", "Hohlkörper: so lange wie möglich."], ["sideplank", "Seitstütz: so lange wie möglich, schwächere Seite zählt."]],
  Fr: [["hsfree", "Freier Handstand: bester von 5 Versuchen."], ["tuckpl", "Tuck-Planche (oder höchste Stufe, die du kannst): bester von 3 Versuchen."]],
  Sa: [["broadjump", "Weitsprung: bester von 3 Sprüngen, in Zentimetern messen."], ["lsit", "L-Sitz (oder Tuck-L-Sitz): bester von 3 Versuchen."]]
};

// ---- Hilfen ----
function parseSlot(s){
  const [id, range, ...opt] = s.trim().split(":");
  if (!EX.has(id)) throw new Error("unbekannte Übung " + id);
  const [a, b] = range.split(">").map(Number);
  const tempo = opt.includes("t");
  // Regel 9: kleine Muskeln mit Tempo nicht über 12 Wdh, danach schwerere Hantel (doppelte Steigerung)
  const B = tempo ? Math.min(b, 12) : b, A = tempo ? Math.min(a, Math.max(8, B - 4)) : a;
  return { id, a: A, b: B, tempo, r4: opt.includes("r4") };
}
function lerp(sl, k){ return Math.round(sl.a + (sl.b - sl.a) * k); }
function bereich(id, z){
  const e = EX.get(id).einheit;
  if (e.startsWith("sek")) return [z, z + 5];
  if (e === "versuche") return [z, z];
  return [z, z + 2];
}
function item(sl, k, phase, deload){
  const u = EX.get(sl.id);
  let ziel = lerp(sl, k);
  if (deload) ziel = Math.max(1, Math.round(ziel * 0.8));
  const o = { id: sl.id, ziel, bereich: bereich(sl.id, ziel), einheit: u.einheit };
  if (sl.tempo && u.tempo) o.tempo = u.tempo;
  if (u.material.includes("hanteln")) o.hantelKg = phase.hantelKg;
  return o;
}

// ---- Wochen erzeugen ----
const wochen = [];
const zeitFehler = [];
for (const ph of PHASEN){
  const trainingsWochen = [];
  for (let w = ph.von; w <= ph.bis; w++) if (!DELOAD(w) && !TEST(w)) trainingsWochen.push(w);
  for (let w = ph.von; w <= ph.bis; w++){
    const typ = TEST(w) ? "test" : DELOAD(w) ? "deload" : "normal";
    // Fortschritt k: Position in den Trainingswochen; Deload/Test nehmen den Wert der Woche davor
    const vorher = trainingsWochen.filter(x => x <= w);
    const idx = Math.max(0, vorher.length - 1);
    const k = trainingsWochen.length > 1 ? idx / (trainingsWochen.length - 1) : 0;
    const tage = [];
    for (const [tag, name, muskelText] of TAGE){
      if (tag === "So"){ tage.push({ tag, name, minuten: 0, hinweis: "Ruhetag. Spazieren, Velo fahren oder Dehnen ist gut, muss aber nicht." }); continue; }
      const vt = V[ph.key][tag], art = ART[tag];
      const plan = [];
      plan.push({ block: "aufwaermen", titel: "Aufwärmen", min: MIN_WARM, uebungen: WARM[art].split(" ").map(id => ({ id, ziel: EX.get(id).einheit.startsWith("sek") ? 30 : 10, einheit: EX.get(id).einheit })) });
      const skills = vt.sk.split(" ").map(parseSlot);
      plan.push({ block: "skills", titel: "Skills", min: vt.skMin || MIN_SKILL, runden: skills.length > 2 ? 3 : 4, pauseSek: 45,
        hinweis: "Abwechselnd, ganz frisch und sauber. Geht eine Stufe nicht: leichtere Stufe nehmen.",
        uebungen: skills.map(s => item(s, k, ph, false)) });
      let paare = vt.p.map(s => s.split("|").map(parseSlot));
      let tests = null;
      if (typ === "test"){
        tests = TESTS[tag].map(([id, text]) => ({ id, text, einheit: EX.get(id).einheit }));
        paare = paare.slice(1); // Paar 1 fällt weg, dafür Test
        plan.push({ block: "test", titel: "Test", min: 10, hinweis: "Gut aufgewärmt, volle Kraft. Ergebnis eintragen: daraus rechnet die App die nächsten Wochen.", uebungen: tests });
      }
      let pb = paare.map(p => {
        let runden = p.some(s => s.r4) ? 4 : V[ph.key].r;
        if (typ !== "normal") runden = 2;
        return { runden, uebungen: p.map(s => item(s, k, ph, typ === "deload")) };
      });
      const rundeSek = q => arbeitSek(q.uebungen[0].id, q.uebungen[0].ziel, q.uebungen[0].tempo) + arbeitSek(q.uebungen[1].id, q.uebungen[1].ziel, q.uebungen[1].tempo) + 2 * PAUSE;
      const minPaar = q => Math.ceil((q.runden * rundeSek(q) + WECHSEL) / 60);
      const fest = plan.reduce((s, b) => s + b.min, 0) + MIN_COOL;
      const gekuerzt = [];
      // Kürzen, bis der Tag in 60 Min passt: 4 Runden -> 3 (hinten zuerst), dann letztes Paar 2 Runden, dann letztes Paar weg (min. 3 Paare)
      while (fest + pb.reduce((s, q) => s + minPaar(q), 0) > 60){
        const vier = [...pb].reverse().find(q => q.runden > 3);
        if (vier){ vier.runden--; gekuerzt.push("runde"); continue; }
        const last = pb[pb.length - 1];
        if (last.runden > 2){ last.runden--; gekuerzt.push("runde"); continue; }
        if (pb.length > 3){ pb.pop(); gekuerzt.push("paar"); continue; }
        const dreier = [...pb].reverse().find(q => q.runden > 2);
        if (dreier){ dreier.runden--; gekuerzt.push("runde"); continue; }
        break;
      }
      pb.forEach((q, i) => plan.push({ block: "paar", titel: `Paar ${i + 1}`, min: minPaar(q), runden: q.runden, pauseSek: PAUSE, uebungen: q.uebungen }));
      plan.push({ block: "abschluss", titel: "Abschluss", min: MIN_COOL, uebungen: (COOL[tag] || COOL[art]).split(" ").map(id => ({ id, ziel: EX.get(id).einheit.startsWith("sek") ? 30 : 10, einheit: EX.get(id).einheit })) });
      const minuten = plan.reduce((s, b) => s + b.min, 0);
      if (minuten > 60) zeitFehler.push(`W${w} ${tag}: ${minuten} Min`);
      const muskelSet = [...new Set(plan.filter(b => b.block === "paar").flatMap(b => b.uebungen.flatMap(u => EX.get(u.id).muskeln)))];
      tage.push({ tag, name, muskeln: muskelSet, muskelText, minuten, plan });
    }
    const fokus = typ === "test" ? "Testwoche: messen, was du geschafft hast. Danach startet die nächste Phase."
      : typ === "deload" ? "Leichte Woche: nur 2 Runden, etwas weniger Wiederholungen. Der Körper baut jetzt auf."
      : ph.regel;
    wochen.push({ woche: w, phase: ph.key, typ, fokus, tage });
  }
}

// Regel 4: pro Tag kurzer Fortschritts-Satz aus der Vorwoche (gleicher Tag, gleiche Übung)
const EINH = { wdh: "", wdh_seite: " pro Seite", sek: " Sek", sek_seite: " Sek pro Seite", versuche: " Versuche" };
for (let i = 1; i < wochen.length; i++){
  for (const t of wochen[i].tage){
    if (!t.plan) continue;
    const vt = wochen[i - 1].tage.find(x => x.tag === t.tag);
    const alt = new Map((vt.plan || []).filter(b => b.block === "paar" || b.block === "skills").flatMap(b => b.uebungen).map(u => [u.id, u.ziel]));
    const neu = [...t.plan.filter(b => b.block === "paar"), ...t.plan.filter(b => b.block === "skills")].flatMap(b => b.uebungen)
      .filter(u => alt.has(u.id) && alt.get(u.id) < u.ziel).slice(0, 2)
      .map(u => `${EX.get(u.id).name}: letzte Woche ${alt.get(u.id)}, heute ${u.ziel}${EINH[u.einheit]}.`);
    if (neu.length) t.fortschritt = neu.join(" ");
  }
}

const out = {
  _meta: {
    version: 1, stand: "2026-11-01", autor: "Claude B",
    hinweis: "Geplante Ziele. Die Fortschritts-Engine (Claude A) passt sie an echte Ergebnisse an: Ziel oben im Bereich in allen Runden geschafft → nächste Woche mehr bzw. schwerere Stufe; Ziel nicht geschafft → gleich lassen oder leichtere Stufe (exercises.json: leichter).",
    phasen: PHASEN,
    deloadWochen: wochen.filter(w => w.typ === "deload").map(w => w.woche),
    testWochen: wochen.filter(w => w.typ === "test").map(w => w.woche),
    zeitmodell: { pauseSek: PAUSE, wechselSek: WECHSEL, sekProWdh: 3, sekProWdhMitTempo: 6, aufwaermenMin: MIN_WARM, skillsMin: MIN_SKILL, abschlussMin: MIN_COOL, maxMin: 60 },
    startwerte: {
      quelle: "TRAINING-APP.md Abschnitt 2 (2 Trainingstage, Stand 2026-11-01)",
      pullup: 3, pike: 3, deeppu: 6, curl: 15, calf2: 15, hsfree: 5, tuckpl: 0, crow: "kann", frog: "kann", pllean: "kann"
    },
    vorDemTraining: {
      frage: "Was hast du heute schon gemacht?",
      antworten: ["Nichts", "Sport in der Schule", "Velo / viel gelaufen", "Schon trainiert"],
      regel: "Bei Sport in der Schule oder schon trainiert: Paare mit denselben Muskeln 1 Runde weniger. Beine schon müde: Sprünge weglassen."
    },
    wochentage: TAGE.map(([tag, name, muskelText]) => ({ tag, name, muskelText }))
  },
  wochen
};
fs.writeFileSync(process.argv[3], JSON.stringify(out) + "\n");
const mins = wochen.flatMap(w => w.tage.filter(t => t.minuten).map(t => t.minuten));
console.log("Wochen", wochen.length, "Tage", mins.length, "Minuten min/max/schnitt", Math.min(...mins), Math.max(...mins), (mins.reduce((a, b) => a + b) / mins.length).toFixed(1));
console.log("Über 60 Min:", zeitFehler.length ? zeitFehler.join(", ") : "keine");
