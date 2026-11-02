// Prüft harte Sätze pro Muskel und Woche wie die Muskelkarte (Hauptmuskel 1, weitere ½; Skills + Paare)
const P = require(process.argv[2] || "../data/program.json"), E = new Map(require(process.argv[3] || "../data/exercises.json").uebungen.map(u => [u.id, u]));
const M = Object.keys(require(process.argv[3] || "../data/exercises.json")._meta.muskeln);
const res = {};
for (const w of P.wochen){ if (w.typ !== "normal") continue;
  const s = Object.fromEntries(M.map(m => [m, 0]));
  w.tage.forEach(t => (t.plan || []).filter(b => b.block === "paar" || b.block === "skills").forEach(b => b.uebungen.forEach(u => E.get(u.id).muskeln.forEach((m, i) => s[m] += b.runden * (i ? .5 : 1)))));
  for (const m of M){ (res[m] ||= []).push(s[m]); }
}
for (const m of M){ const v = res[m], min = Math.min(...v), max = Math.max(...v), unter6 = v.filter(x => x < 6).length;
  console.log(m.padEnd(16), "min", String(min).padStart(5), "max", String(max).padStart(5), unter6 ? `  <6 in ${unter6}/${v.length} Wochen` : ""); }
