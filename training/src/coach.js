// ---------- Claude-Coach (Claude B) ----------
// Nach jedem Training: die Daten gehen an Claude, Claude wertet aus und schlägt Anpassungen vor
// (Ziel hoch/runter, leichtere/schwerere Stufe). Benaja übernimmt sie mit einem Tipp, die App rechnet ab dann damit.
// Im Claude-Artefakt direkt über die Fähigkeit «sample»; sonst Ersatzweg: Daten kopieren, in einem Claude-Chat
// einfügen, Antwort zurück einfügen. Gespeichert: S.coachLog[Tag] (Auswertung) und S.coachAdj[Übung] (aktive Anpassungen).
const COACH = (() => {
  let sampleP = null;
  const getSample = () => sampleP ||= (typeof window !== "undefined" && window.claude && typeof window.claude.use === "function"
    ? window.claude.use("sample").catch(() => null) : Promise.resolve(null));
  let ctl = null, busy = false, unavailable = false;

  // ---------- Daten eines Trainings, kompakt ----------
  function report(k){
    const log = logOf(k), { w, day } = progDay(k), steps = buildSteps(day, log);
    const ph = phaseOf(Math.max(1, w)), ex = {};
    steps.filter(s => ["skills", "paar", "test"].includes(s.block)).forEach(s => {
      const e = ex[s.id] ||= { id: s.id, name: exName(s.id), einheit: s.einheit, ziel: s.ziel, bereich: s.bereich || null,
        runden: [], gefuehl: [], notiz: (log.notes || {})[s.id] || null, leichter: EX[s.id]?.leichter || null, schwerer: EX[s.id]?.schwerer || null,
        letzteMale: [], claudeAnpassung: (S.coachAdj || {})[s.id] ? { faktor: S.coachAdj[s.id].f || 1, stufe: S.coachAdj[s.id].stufe || null } : null };
      const v = log.sets[s.key]; e.runden.push(v ? v.v : null); if (v?.feel) e.gefuehl.push(v.feel);
    });
    Object.values(ex).forEach(e => {
      e.letzteMale = Object.keys(S.logs).sort().filter(d => d < k).reverse().map(d => {
        const vals = Object.values(S.logs[d].sets).filter(x => x.id === e.id).map(x => x.v); return vals.length ? { tag: d, werte: vals } : null;
      }).filter(Boolean).slice(0, 3);
    });
    const dur = log.finished && log.started ? Math.round((log.finished - log.started - (log.pauseMs || 0)) / 60000) : null;
    const kg = (S.body.w || []).slice(-4).map(x => ({ tag: x.d, kg: x.kg }));
    return {
      tag: k, woche: w, phase: ph.name, training: day.name, geplanteMinuten: day.minuten, gebrauchteMinuten: dur,
      fertig: !!log.done, leichteVersion: !!log.light, nur25Min: !!log.short, gekuerzt: !!log.trim,
      vorherGemacht: log.pre || [], uebungen: Object.values(ex), gewicht: kg, trainingsDieseWoche: weekCount(k),
      profil: { alter: S.profile.alter, kg: latestKg(), cm: S.profile.cm }
    };
  }

  function reportWeek(k){
    const mon = addDays(k, -dayIdx(k)), days = [0,1,2,3,4,5].map(i => addDays(mon, i));
    const ex = {};
    days.forEach(d => { const log = S.logs[d]; if (!log) return; Object.values(log.sets).filter(x => ["skills","paar","test"].includes(x.block)).forEach(x => {
      const e = ex[x.id] ||= { id: x.id, name: exName(x.id), einheit: EX[x.id]?.einheit, tage: {}, leichter: EX[x.id]?.leichter || null, schwerer: EX[x.id]?.schwerer || null, notizen: [] };
      (e.tage[d] ||= []).push(x.v); });
      Object.entries(log.notes || {}).forEach(([id, t]) => { if (ex[id]) ex[id].notizen.push(t); }); });
    const planned = days.map(d => { const { day } = progDay(d); return { tag: d, training: day.name, gemacht: !!S.logs[d]?.done, minuten: day.minuten }; });
    return { woche: weekOf(k), phase: phaseOf(Math.max(1, weekOf(k))).name, tage: planned, uebungen: Object.values(ex),
      gewicht: (S.body.w || []).slice(-6).map(x => ({ tag: x.d, kg: x.kg })), aktiveAnpassungen: S.coachAdj || {}, profil: { alter: S.profile.alter, kg: latestKg() } };
  }
  const RULES = `Du bist der Trainings-Coach in einer Calisthenics-App für einen 16-jährigen Anfänger (ca. 50 kg, will Muskeln aufbauen, Skills: Handstand, Planche). Er trainiert zuhause, 6 Tage pro Woche, max. 60 Min.
Werte das heutige Training aus und schlage Anpassungen für die nächsten Male vor. Regeln:
- Deutsch (Schweiz, «ss» statt «ß»), du-Form, kurze Sätze, ehrlich, freundlich, nie von oben herab. Keine Fachwörter ohne Erklärung.
- Rate nie zum Aufhören oder Pausieren des Trainings. Einzige Ausnahme: Notizen über stechenden Gelenkschmerz, Schwindel, Schwarzwerden oder Brustschmerz → dann im Feld "warnung" klar sagen: diese Übung weglassen bzw. stoppen und mit einer erwachsenen Person oder Ärztin sprechen. Keine Diagnosen.
- Anpassungen nur mit Übungs-IDs aus den Daten. Höchstens 4. Keine Anpassung, wenn alles im Plan liegt.
- "ziel": neues Ziel für die nächsten Male (gleiche Einheit). Höchstens 25 % über oder unter dem heutigen Ziel. Hoch nur, wenn er in allen Runden das obere Ende des Bereichs erreicht hat oder "leicht" gesagt hat. Runter, wenn er das Ziel in mindestens der Hälfte der Runden verfehlt hat oder die Notiz "zu schwer" sagt.
- "leichter"/"schwerer": nur wenn die Übung eine solche Stufe hat (Felder leichter/schwerer). Leichter bei wiederholtem klarem Verfehlen oder Schmerznotiz am Gelenk; schwerer nur, wenn er das Ziel klar und mehrmals übertroffen hat.
- "letzteMale" zeigt frühere Werte. Kleine Schritte sind besser als grosse.
Antworte NUR mit diesem JSON:
{"auswertung":"2-4 kurze Sätze","gut":["bis 3 kurze Punkte, was gut war"],"anpassungen":[{"id":"übungs-id","aktion":"ziel|leichter|schwerer","ziel":12,"grund":"1 kurzer Satz"}],"naechstesMal":"1 Satz, worauf er nächstes Mal achten soll","warnung":null}`;
  const isWeekKey = k => /^W/.test(k);
  const prompt = k => isWeekKey(k)
    ? RULES.replace("Werte das heutige Training aus", "Werte die ganze Trainingswoche aus (Wochenbericht am Ruhetag)").replace("2-4 kurze Sätze", "3-5 kurze Sätze zur Woche: was lief, was stagniert, wie oft trainiert") .replace("1 Satz, worauf er nächstes Mal achten soll", "1 Satz: Fokus für nächste Woche")
      + "\n\nDaten der Woche (JSON):\n" + JSON.stringify(reportWeek(k.slice(1)))
    : RULES + "\n\nDaten des Trainings (JSON):\n" + JSON.stringify(report(k));

  // ---------- Antwort prüfen und übernehmen ----------
  function clean(r, k){
    if (!r || typeof r !== "object") throw new Error("keine Auswertung");
    const ids = new Set((isWeekKey(k) ? reportWeek(k.slice(1)) : report(k)).uebungen.map(e => e.id));
    const an = (Array.isArray(r.anpassungen) ? r.anpassungen : []).filter(a => a && ids.has(String(a.id)) && ["ziel", "leichter", "schwerer"].includes(a.aktion))
      .slice(0, 4).map(a => ({ id: String(a.id), aktion: a.aktion, ziel: Number(a.ziel) || null, grund: String(a.grund || "").slice(0, 200) }))
      .filter(a => a.aktion !== "ziel" || a.ziel > 0)
      .filter(a => a.aktion === "ziel" || (a.aktion === "leichter" ? EX[a.id]?.leichter : EX[a.id]?.schwerer));
    return { auswertung: String(r.auswertung || "").slice(0, 700), gut: (Array.isArray(r.gut) ? r.gut : []).slice(0, 3).map(x => String(x).slice(0, 160)),
      anpassungen: an, naechstesMal: String(r.naechstesMal || "").replace(/^(Fokus( nächste Woche)?|Nächstes Mal)\s*:\s*/i, "").slice(0, 240), warnung: r.warnung ? String(r.warnung).slice(0, 300) : null };
  }
  function planZiel(id, k){
    // Planziel (ohne Claude-Faktor) der Übung heute oder beim nächsten Mal in den kommenden 14 Tagen
    for (let i = 0; i < 15; i++){
      const d = addDays(k, i), { day } = progDay(d);
      const u = (day.plan || []).flatMap(b => b.uebungen).find(x => x.id === id); if (u?.ziel) return u.ziel;
    }
    return null;
  }
  const baseDay = k => isWeekKey(k) ? k.slice(1) : k;
  function apply(k, chosen){
    const c = S.coachLog?.[k]; if (!c) return;
    S.coachAdj ||= {};
    const done = [];
    c.res.anpassungen.forEach((a, i) => {
      if (!chosen.includes(i)) return;
      const prev = S.coachAdj[a.id] ? { ...S.coachAdj[a.id] } : null;
      if (a.aktion === "ziel"){
        const base = planZiel(a.id, baseDay(k)); if (!base) return;
        // Sicherheitsgrenze im Code: pro Auswertung höchstens ±25 % gegenüber dem bisherigen Faktor, insgesamt 0.5–2
        const old = S.coachAdj[a.id]?.f || 1;
        const f = Math.min(2, Math.max(0.5, Math.min(old * 1.25, Math.max(old * 0.75, a.ziel / base))));
        S.coachAdj[a.id] = { ...(S.coachAdj[a.id] || {}), f: +f.toFixed(3), grund: a.grund, seit: baseDay(k) };
      } else {
        const to = a.aktion === "leichter" ? EX[a.id].leichter : EX[a.id].schwerer;
        S.coachAdj[a.id] = { ...(S.coachAdj[a.id] || {}), stufe: to, f: 1, grund: a.grund, seit: baseDay(k) };
      }
      done.push({ i, id: a.id, prev });
    });
    c.applied = done; c.appliedAt = Date.now(); save();
  }
  function undo(k){
    const c = S.coachLog?.[k]; if (!c?.applied) return;
    c.applied.forEach(x => { if (x.prev) S.coachAdj[x.id] = x.prev; else delete S.coachAdj[x.id]; });
    delete c.applied; save();
  }
  function store(k, res, via){ S.coachLog ||= {}; S.coachLog[k] = { res, t: Date.now(), via }; save(); }
  function parseText(t){
    const s = String(t || ""), a = s.indexOf("{"), b = s.lastIndexOf("}");
    if (a < 0 || b <= a) throw new Error("Kein JSON gefunden");
    return JSON.parse(s.slice(a, b + 1));
  }

  // ---------- Anzeige im Kampfbericht ----------
  const actText = a => a.aktion === "ziel" ? `Ziel neu ${a.ziel}` : a.aktion === "leichter" ? `Leichtere Stufe: ${exName(EX[a.id].leichter)}` : `Schwerere Stufe: ${exName(EX[a.id].schwerer)}`;
  function card(k){ return `<div class="card coach" id="coachCard" data-k="${k}" style="width:100%;text-align:left">${inner(k)}</div>`; }
  function inner(k){
    const wk = isWeekKey(k), c = S.coachLog?.[k], log = wk ? { sets: Object.assign({}, ...[0,1,2,3,4,5].map(i => (S.logs[addDays(addDays(k.slice(1), -dayIdx(k.slice(1))), i)] || {}).sets || {})) } : logOf(k);
    const head = `<div class="kicker">${wk ? "Wochenbericht von Claude" : "Claude-Coach"}</div>`;
    if (busy) return `${head}<p class="coach-think">Claude schaut sich dein Training an …</p><button class="btn" id="coStop">Stopp</button>`;
    if (!c){
      if (!Object.keys(log.sets).length) return `${head}<p class="muted">${wk ? "Diese Woche sind noch keine Werte eingetragen." : "Nach dem Training wertet Claude deine Werte aus und passt die nächsten Ziele an."}</p>`;
      return `${head}<p class="muted">${wk ? "Claude schaut die ganze Woche an: was lief, was stagniert, Fokus für nächste Woche." : "Claude wertet deine Werte aus und passt die nächsten Ziele an dich an."}</p>
        <button class="btn primary wide" id="coGo">${wk ? "Woche auswerten lassen" : "Training auswerten lassen"}</button>${unavailable ? fallback(k) : ""}`;
    }
    const r = c.res, ap = new Set((c.applied || []).map(x => x.i));
    return `${head}
      ${r.warnung ? `<div class="pain" style="margin:8px 0"><b>${esc(r.warnung)}</b></div>` : ""}
      <p style="margin-top:6px">${esc(r.auswertung)}</p>
      ${r.gut.length ? `<ul class="coach-gut">${r.gut.map(g => `<li>${esc(g)}</li>`).join("")}</ul>` : ""}
      ${r.anpassungen.length ? `<div class="eyebrow" style="margin-top:12px">Vorschläge für die nächsten Male</div>
        <div class="coach-list">${r.anpassungen.map((a, i) => `<label class="coach-row"><input type="checkbox" data-coi="${i}" ${c.applied ? (ap.has(i) ? "checked" : "") : "checked"} ${c.applied ? "disabled" : ""}>
          <span><b>${esc(exName(a.id))}:</b> ${esc(actText(a))}<br><small class="muted">${esc(a.grund)}</small></span></label>`).join("")}</div>
        ${c.applied ? `<p class="small" style="margin-top:8px">✓ Übernommen. Die App rechnet ab jetzt damit.</p><button class="btn" id="coUndo">Rückgängig</button>`
          : `<button class="btn primary wide" id="coApply" style="margin-top:10px">Übernehmen</button>`}`
        : `<p class="small" style="margin-top:8px">Keine Änderung nötig. Der Plan passt.</p>`}
      ${r.naechstesMal ? `<p class="hint" style="margin-top:10px">${wk ? "Fokus nächste Woche" : "Nächstes Mal"}: ${esc(r.naechstesMal)}</p>` : ""}
      <button class="chip" id="coAgain" style="margin-top:10px">Nochmals auswerten</button>`;
  }
  function fallback(k){
    return `<div class="coach-fb"><p class="small" style="margin-top:10px">Hier kann die App Claude nicht direkt fragen. So geht es trotzdem:
      1. «Daten kopieren», 2. Claude-Chat öffnen und einfügen, 3. Claudes Antwort kopieren und unten einfügen.</p>
      <div class="row" style="gap:8px;margin-top:8px"><button class="btn" id="coCopy">Daten kopieren</button><a class="btn" href="https://claude.ai/new" target="_blank" rel="noopener">Claude öffnen</a></div>
      <textarea class="field" id="coPaste" rows="4" placeholder="Antwort von Claude hier einfügen" style="margin-top:8px;width:100%"></textarea>
      <button class="btn wide" id="coPasteGo" style="margin-top:6px">Antwort übernehmen</button></div>`;
  }
  function rerender(k){ const el = document.getElementById("coachCard"); if (el && el.dataset.k === k){ el.innerHTML = inner(k); bind(k); } }
  async function run(k){
    if (busy) return;
    const sample = await getSample();
    if (!sample){ unavailable = true; rerender(k); return; }
    busy = true; rerender(k); ctl = new AbortController();
    try {
      const res = await sample.json(prompt(k), { signal: ctl.signal, modelTier: "default" });
      store(k, clean(res, k), "sample");
    } catch (e) {
      const code = e && e.code;
      if (code === "not_granted" || code === "sampling_disabled" || code === "not_declared" || code === "capability_disabled" || code === "capability_removed") unavailable = true;
      else if (code !== "cancelled") toast(code === "rate_limited" ? "Claude ist gerade ausgelastet. Später nochmals." : "Auswertung hat nicht geklappt. Nochmals versuchen?");
    } finally { busy = false; rerender(k); }
  }
  function bind(k){
    const $id = id => document.getElementById(id);
    $id("coGo")?.addEventListener("click", () => run(k));
    $id("coAgain")?.addEventListener("click", () => { delete S.coachLog[k]; save(); run(k); });
    $id("coStop")?.addEventListener("click", () => ctl?.abort());
    $id("coApply")?.addEventListener("click", () => {
      const chosen = [...document.querySelectorAll("[data-coi]")].filter(x => x.checked).map(x => +x.dataset.coi);
      apply(k, chosen); toast("Übernommen ✓"); rerender(k);
    });
    $id("coUndo")?.addEventListener("click", () => { undo(k); toast("Rückgängig gemacht"); rerender(k); });
    $id("coCopy")?.addEventListener("click", async () => {
      const t = prompt(k);
      try { await navigator.clipboard.writeText(t); toast("Kopiert. Jetzt in Claude einfügen."); }
      catch (e) { const ta = $id("coPaste"); if (ta){ ta.value = t; ta.select(); } toast("Bitte selbst kopieren (markiert)"); }
    });
    $id("coPasteGo")?.addEventListener("click", () => {
      try { store(k, clean(parseText($id("coPaste").value), k), "chat"); rerender(k); toast("Auswertung übernommen ✓"); }
      catch (e) { toast("Das ist keine gültige Antwort. Bitte die ganze Antwort von Claude einfügen."); }
    });
    // Direkt nach dem Training automatisch auswerten (einmal pro Tag), wenn Claude direkt erreichbar ist
    const log = isWeekKey(k) ? {} : logOf(k);
    if (log.done && !S.coachLog?.[k] && !busy && !unavailable && log.finished && Date.now() - log.finished < 6 * 3600e3 && !log.coachAuto){
      log.coachAuto = true; save();
      getSample().then(s => { if (s) run(k); else { unavailable = true; rerender(k); } });
    } else if (!S.coachLog?.[k] && !unavailable){
      getSample().then(s => { if (!s){ unavailable = true; rerender(k); } });
    }
  }
  // Anpassung für eine Übung (für buildSteps und Anzeige)
  const adj = id => (S.coachAdj || {})[id] || null;
  // Wochenbericht am Sonntag: Schlüssel "W" + Datum des Sonntags
  const weekCard = k => card("W" + k), weekBind = k => bind("W" + k);
  return { card, bind, report, reportWeek, prompt, adj, apply, undo, clean, parseText, weekCard, weekBind };
})();
