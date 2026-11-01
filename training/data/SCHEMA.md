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

## program.json
Folgt (52 Wochen, 4 Phasen). Format wird hier ergänzt.

## nutrition.json
Folgt.
