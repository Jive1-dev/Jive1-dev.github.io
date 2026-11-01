# Datenformat `training/data/` (Besitzer: Claude B)

Alle Texte Deutsch (Schweiz, «ss»), kurze Sätze, kein Fachwort ohne Erklärung (siehe `_meta.glossar`).
Claude A liest diese Dateien in `training/src/*`. Änderungswünsche am Format bitte ins Postfach (`claude-uebergabe/TRAINING-APP.md` §8).

## exercises.json

```jsonc
{
  "_meta": {
    "muskeln":   { "<key>": "Anzeigename" },   // z. B. "trizeps": "Trizeps (Rückseite vom Oberarm, streckt den Arm)"
    "gruppen":   { "<key>": "Anzeigename" },
    "einheiten": { "wdh" | "wdh_seite" | "sek" | "sek_seite" | "versuche": "Anzeigename" },
    "material":  { "<key>": "Anzeigename" },
    "glossar":   { "Wort": "Erklärung in einem Satz" },
    "handgelenkTipp": "Text, wird bei handgelenk:true angezeigt",
    "stoppRegel": "einziger Text, der zum Aufhören rät (Regel 6)"
  },
  "uebungen": [{
    "id": "pu",                  // = Figuren-ID in training/src/figures.js (1:1, alle 84)
    "name": "Liegestütz",
    "gruppe": "druecken",
    "muskeln": ["brust", "trizeps"],        // Keys aus _meta.muskeln, wichtigster zuerst
    "einheit": "wdh",
    "material": ["boden", "brett"],
    "ziel": "Wofür die Übung gut ist (1 Satz, für Regel 4)",
    "schritte": ["3–5 kurze Schritte"],
    "fehler": ["genau 2 typische Fehler, mit Korrektur nach dem Doppelpunkt"],
    "sicherheit": "1–2 Sätze",
    "leichter": "incpu" | null,   // Figuren-ID der leichteren Stufe (Regel 7: sofort dorthin wechseln)
    "schwerer": "deeppu" | null,
    // optional:
    "leichterTipp": "leichter machen, ohne die Übung zu wechseln",
    "schwererTipp": "schwerer machen, ohne die Übung zu wechseln",
    "tempo": "z. B. 4 Sek runter, 1 Sek Pause oben (Regel 9)",
    "handgelenk": true,          // Druck auf überstreckte Handgelenke -> _meta.handgelenkTipp zeigen
    "gesperrt": true,            // nie einplanen (z. B. Tür-Übungen)
    "ersatz": "row"              // bei gesperrt: diese Übung stattdessen
  }]
}
```

**Leitern** sind ein gerichteter Graph, keine strenge Kette: mehrere Übungen dürfen auf dieselbe leichtere Stufe zeigen
(z. B. `boxpistol.leichter = squat`, `cossack.leichter = squat`). Die App nimmt immer `leichter` bzw. `schwerer`
der aktuellen Übung. Gibt es keine Stufe, zeigt sie `leichterTipp`.

Zusätzlich 5 Übungen **ohne Figur** (`ohneFigur: true`, `figurErsatz` = vorläufig angezeigte Figur):
`jumpsq`, `broadjump`, `dbpress`, `goblet`, `hangknee`. Wunsch an A: Figuren mit genau diesen IDs.

## program.json
Erzeugt von `tools/gen-program.js` (nicht von Hand ändern, sondern Vorlage im Skript anpassen und neu erzeugen).

```jsonc
{
  "_meta": { "phasen": [...], "deloadWochen": [5,10,...], "testWochen": [13,26,39,52],
             "zeitmodell": {...}, "startwerte": {...}, "vorDemTraining": { "frage": "Was hast du heute schon gemacht?", ... } },
  "wochen": [{
    "woche": 1, "phase": "F", "typ": "normal" | "deload" | "test",
    "fokus": "1 Satz für die Woche",
    "tage": [{
      "tag": "Mo", "name": "Oberkörper A", "minuten": 49,          // Summe der Blöcke, immer ≤ 60
      "muskelText": "Rücken, Brust, Arme", "muskeln": ["ruecken_breit", ...],
      "fortschritt": "Klimmzug: letzte Woche 3, heute 4.",          // fehlt in Deload-/Test-/Startwochen
      "plan": [
        { "block": "aufwaermen", "titel": "Aufwärmen", "min": 6, "uebungen": [{ "id": "wrist", "ziel": 30, "einheit": "sek" }] },
        { "block": "skills", "titel": "Skills", "min": 10, "runden": 4, "pauseSek": 45, "hinweis": "...", "uebungen": [...] },
        { "block": "test", ... },                                    // nur in Testwochen, statt Paar 1
        { "block": "paar", "titel": "Paar 1", "min": 6, "runden": 3, "pauseSek": 35,
          "uebungen": [ { "id": "pullup", "ziel": 3, "bereich": [3,5], "einheit": "wdh" },
                        { "id": "deeppu", "ziel": 6, "bereich": [6,8], "einheit": "wdh" } ] },
        { "block": "abschluss", "titel": "Abschluss", "min": 3, "uebungen": [...] }
      ]
    }, { "tag": "So", "name": "Ruhe", "minuten": 0, "hinweis": "..." }]
  }]
}
```
- Übung im Paar: optional `tempo` (Text) und `hantelKg`.
- **Ablauf in der App (Regel 1):** Paar = A, Pause, B, Pause, so oft wie `runden`. Immer nur **eine** Übung zeigen.
- **Zeit:** 3 Sek pro Wiederholung, 6 mit Tempo, Pause 35 Sek, 30 Sek Wechsel pro Paar. Passt ein Tag nicht in 60 Min,
  kürzt der Generator: erst 4→3 Runden, dann letztes Paar auf 2 Runden, dann letztes Paar weg (mindestens 3 Paare).
- **Deload** (jede 5. Woche): 2 Runden, Ziel 80 %. **Test**: Paar 1 wird durch 2 Messungen ersetzt, Rest 2 Runden.
- Die Zahlen sind ein Plan. Die Fortschritts-Engine (A) passt sie an echte Ergebnisse an.

## Werkzeuge
`node tools/gen-exercises.js exercises.json` · `node tools/gen-program.js exercises.json program.json` · `node tools/check-exercises.js`

## nutrition.json
Erzeugt von `tools/gen-nutrition.js`. Teile:
- `rechnung`: Formel (Mifflin-St Jeor × 1.7 + 350 kcal, Protein 1.9 g/kg), `js` zum Nachrechnen mit echtem Gewicht, `beispiel` (50 kg → 2850 kcal, mind. 95 g), `anpassen` (Regeln nach 2 Wochen Gewichtstrend).
- `zielText` mit Platzhaltern `{kcal}`, `{protein}`.
- `checkliste`: 9 Punkte `{id, text, tipp}` (Ersatz fürs Kalorienzählen).
- `mahlzeiten`: ohne Kochen `{id, name, wann[], kcal, protein, preis, zutaten[], hinweis, optional?}`; `wann` passt zu `checkliste.id`.
- `beispieltag`: `{teile[], summe}`.
- `koffein`: Grenze 3 mg/kg (150 mg), nach 14 Uhr keins, Tabelle `getraenke[]`.
- `einkauf`: `proWoche[]` `{was, menge, packung, anzahl, preis}`, `summeCHF`.
- `nichtNehmen`: Liste für unter 18.
Alle Preise und Nährwerte sind gerundete Schätzungen, keine Marken.

`node tools/gen-nutrition.js nutrition.json`

## skills.json
Erzeugt von `tools/gen-skills.js`. 6 Leitern (Handstand, Planche, L-Sitz, Press, Klimmzug, Pistol):
`leitern[] = {id, name, startUebung, stufen[] = {nr, uebung (exercises-ID), name, test: {wert, einheit, text}}}`.
`_meta.startStand`: was Benaja laut Abschnitt 2 schon kann. Freischalten nur über bestandenen Test, nie Rückstufen als Strafe.
`node tools/gen-skills.js exercises.json skills.json`

## videos.json
Erzeugt von `tools/gen-videos.py`. `videos["<id>"] = {id, url, titel, kanal|null, sprache, geprueft} | null`.
**Alle `geprueft: false`:** youtube.com war aus Claude Bs Umgebung nicht erreichbar, die Links stammen nur aus Suchtreffern.
Die App zeigt nur Videos mit `geprueft: true`. Benaja (oder ein Claude mit YouTube-Zugang) schaut jedes einmal an und setzt das Feld.
Einbetten: `https://www.youtube-nocookie.com/embed/{id}`, erst nach Tippen laden.

## motivation.json
Erzeugt von `tools/gen-motivation.py`. `zitate[] {text, wer, quelle, bezug}` (6, Stellen geprüft) · `saetze{start, ende, rekord, leichtereStufe, verpassterTag, deload, testwoche}[]` ·
`raenge[] {abWochen, name, text}` (Rekrut 0 → Agoge 4 → Hoplit 13 → Spartiat 26 → Lochagos 39 → Polemarch 52; Woche zählt ab 4/6 Tagen) · `bibel[] {stelle, sinngemaess}` (10).
Regel: max. 2 Sätze pro Training, nie im Pausen-Knopf.
