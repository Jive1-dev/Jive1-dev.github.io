// Generator für training/data/skills.json (Claude B): Skill-Leitern mit Testkriterien. Aufruf: node gen-skills.js <exercises.json> <ziel.json>
const fs = require("fs");
const EX = new Map(JSON.parse(fs.readFileSync(process.argv[2], "utf8")).uebungen.map(u => [u.id, u]));
// [Übungs-ID, Wert, Einheit, Testtext]  Einheit: sek | wdh | wdh_seite | sek_seite | von5
const L = [
  { id: "handstand", name: "Handstand", start: "hskick", stufen: [
    ["pikeel", 30, "sek", "Pike-Position mit Füssen auf dem Stuhl 30 Sek halten, Hüfte über den Händen."],
    ["hswall", 30, "sek", "30 Sek an der Wand, Arme gestreckt, Körper gerade."],
    ["hskick", 4, "von5", "4 von 5 Aufschwüngen ohne Überkippen. Rausfallen mit Rad sitzt."],
    ["hsfree", 10, "sek", "10 Sek frei, bester von 5 Versuchen."],
    ["hsfree", 30, "sek", "30 Sek frei, bester von 5 Versuchen."],
    ["hsshape", 3, "wdh", "3 Mal Knie anziehen und strecken, ohne abzusteigen."],
    ["hspu", 1, "wdh", "1 saubere Handstand-Liegestütz an der Wand, Kopf berührt nur das Kissen."] ] },
  { id: "planche", name: "Planche", start: "tuckpl", stufen: [
    ["frog", 30, "sek", "30 Sek Frosch-Stand."],
    ["crow", 30, "sek", "30 Sek Krähe."],
    ["pllean", 20, "sek", "20 Sek Planche-Lehne, Schultern deutlich vor den Händen."],
    ["tuckpl", 10, "sek", "10 Sek Tuck-Planche, Arme gestreckt."],
    ["advtuck", 10, "sek", "10 Sek mit flachem Rücken."],
    ["straddle", 5, "sek", "5 Sek Grätsch-Planche."] ] },
  { id: "lsit", name: "L-Sitz", start: "tuckl", stufen: [
    ["support", 30, "sek", "30 Sek Stütz, Schultern unten."],
    ["tuckl", 20, "sek", "20 Sek mit angezogenen Knien."],
    ["onel", 15, "sek_seite", "15 Sek pro Bein."],
    ["lsit", 10, "sek", "10 Sek L-Sitz, Knie gestreckt."],
    ["lsit", 20, "sek", "20 Sek L-Sitz."],
    ["vsit", 5, "sek", "5 Sek V-Sitz."] ] },
  { id: "press", name: "Press in den Handstand", start: "pikecomp", stufen: [
    ["pikecomp", 15, "wdh", "15 Mal beide Beine gestreckt anheben."],
    ["pikelift", 8, "wdh_seite", "8 Mal pro Bein, Hüfte über den Händen."],
    ["crowhs", 1, "wdh", "1 Mal von der Krähe in den Handstand (an der Wand ok)."],
    ["tuckpress", 3, "wdh", "3 Tuck-Press hintereinander."],
    ["strpress", 1, "wdh", "1 Grätsch-Press."] ] },
  { id: "klimmzug", name: "Klimmzug", start: "pullup", stufen: [
    ["hang", 30, "sek", "30 Sek hängen."],
    ["negpu", 5, "wdh", "5 Negativ-Klimmzüge à 5 Sek runter."],
    ["pullup", 5, "wdh", "5 saubere Klimmzüge am Stück."],
    ["pullup", 10, "wdh", "10 saubere Klimmzüge am Stück."],
    ["pullup", 8, "wdh", "8 Klimmzüge mit 3 Sek runter."] ] },
  { id: "pistol", name: "Pistol-Kniebeuge", start: "boxpistol", stufen: [
    ["boxpistol", 8, "wdh_seite", "8 Mal pro Bein auf den Stuhl setzen und aufstehen."],
    ["pistol", 3, "wdh_seite", "3 ganze Pistols pro Bein, freies Bein in der Luft."],
    ["pistol", 8, "wdh_seite", "8 ganze Pistols pro Bein."] ] }
];
const stand = { quelle: "TRAINING-APP.md Abschnitt 2", geschafft: ["frog", "crow", "pllean"], werte: { hsfree: 5, pullup: 3, pike: 3, tuckpl: 0 } };
const leitern = L.map(l => ({ id: l.id, name: l.name, startUebung: l.start, stufen: l.stufen.map(([id, wert, einheit, text], i) => {
  if (!EX.has(id)) throw new Error(id);
  return { nr: i + 1, uebung: id, name: EX.get(id).name, test: { wert, einheit, text } };
}) }));
const out = { _meta: { version: 1, stand: "2026-11-01", autor: "Claude B",
  regel: "Eine Stufe gilt als geschafft, wenn der Test sauber erreicht ist (Technik vor Zahl). Dann schaltet die App die nächste Stufe frei. Kein Rückstufen als Strafe: geht eine Stufe an einem Tag nicht, wird nur für diesen Satz die leichtere genommen (Regel 7).",
  einheiten: { sek: "Sekunden", wdh: "Wiederholungen", wdh_seite: "Wiederholungen pro Seite", sek_seite: "Sekunden pro Seite", von5: "von 5 Versuchen" },
  startStand: stand }, leitern };
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 2) + "\n");
console.log(leitern.map(l => l.name + ": " + l.stufen.length).join(", "));
