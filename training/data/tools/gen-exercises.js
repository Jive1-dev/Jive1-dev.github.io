// Generator für training/data/exercises.json (Claude B). Aufruf: node exercises.js <ziel.json>
const fs = require("fs");

const meta = {
  version: 1,
  stand: "2026-11-01",
  autor: "Claude B",
  hinweis: "Ein Eintrag pro Figuren-ID aus training/src/figures.js. Format siehe training/data/SCHEMA.md.",
  muskeln: {
    brust: "Brust",
    schulter_vorne: "Schulter vorne",
    schulter_seite: "Schulter seitlich (macht die Schultern breit)",
    schulter_hinten: "Schulter hinten",
    trizeps: "Trizeps (Rückseite vom Oberarm, streckt den Arm)",
    bizeps: "Bizeps (Vorderseite vom Oberarm, beugt den Arm)",
    unterarm: "Unterarm und Griff",
    handgelenk: "Handgelenke",
    finger: "Finger",
    ruecken_breit: "breiter Rücken (zieht die Arme nach unten)",
    ruecken_oben: "oberer Rücken (zieht die Schulterblätter zusammen)",
    ruecken_unten: "unterer Rücken",
    nacken: "Nacken und Haltung",
    bauch: "Bauch vorne",
    bauch_seite: "Bauch seitlich",
    hueftbeuger: "Hüftbeuger (hebt das Bein nach vorne)",
    po: "Po",
    bein_vorne: "Oberschenkel vorne",
    bein_hinten: "Oberschenkel hinten",
    bein_innen: "Oberschenkel innen",
    wade: "Wade",
    schienbein: "Schienbein vorne",
    fuss: "Fuss"
  },
  gruppen: {
    aufwaermen: "Aufwärmen",
    haltung: "Haltung",
    dehnen: "Dehnen",
    handstand: "Skill: Handstand",
    planche: "Skill: Planche",
    lsit: "Skill: L-Sitz",
    press: "Skill: Press (Hochdrücken in den Handstand)",
    druecken: "Drücken",
    ziehen: "Ziehen",
    arme: "Arme und Schultern (Hanteln)",
    beine: "Beine und Po",
    bauch: "Bauch"
  },
  einheiten: {
    wdh: "Wiederholungen",
    wdh_seite: "Wiederholungen pro Seite",
    sek: "Sekunden",
    sek_seite: "Sekunden pro Seite",
    versuche: "Versuche"
  },
  material: {
    boden: "Boden (Matte oder Teppich)",
    handtuch: "Handtuch",
    wand: "Wand",
    stuhl: "stabiler Stuhl ohne Rollen",
    zwei_stuehle: "zwei stabile Stühle ohne Rollen",
    parallettes: "Parallettes",
    brett: "Liegestützbrett",
    stange: "Klimmzugstange",
    hanteln: "Hanteln (2 × 5 kg, später 8–10 kg)",
    ball: "6-kg-Ball",
    treppe: "Treppenstufe",
    moebel: "schweres Möbel zum Festhalten (Sofa, Bett)",
    tuer: "Tür (gesperrt, Benaja will keine Tür-Übungen)"
  },
  glossar: {
    "Wiederholung": "Die Bewegung einmal ganz machen. 10 Wiederholungen = 10 Mal.",
    "Satz": "Eine Übung einmal am Stück, z. B. 10 Liegestütze. Danach kommt eine Pause.",
    "Supersatz": "Zwei Übungen abwechselnd: erst Übung 1, kurze Pause, dann Übung 2, kurze Pause.",
    "Runde": "Beide Übungen eines Supersatzes einmal gemacht.",
    "Pause": "Ruhezeit zwischen zwei Sätzen. Bei uns meist 30–45 Sekunden.",
    "Tempo": "Wie schnell du dich bewegst. «4 Sek runter» heisst: beim Absenken langsam bis 4 zählen.",
    "Brett": "Körper gerade wie ein Brett: Kopf, Rücken, Po und Fersen auf einer Linie. Bauch und Po fest.",
    "Schulterblätter": "Die zwei flachen Knochen hinten oben auf dem Rücken.",
    "Hohlkörper": "Auf dem Rücken liegen, unterer Rücken drückt in den Boden, Bauch fest, Körper wie eine flache Banane.",
    "Leiter": "Die Reihe von leichteren und schwereren Versionen einer Übung. Geht eine nicht, nimmst du die Stufe darunter.",
    "Deload": "Leichte Woche: weniger Sätze, damit der Körper sich erholt und danach stärker ist.",
    "Skill": "Ein Kunststück wie Handstand oder Planche. Braucht Übung, nicht nur Kraft.",
    "Halten": "In einer Position bleiben, ohne dich zu bewegen. Gezählt wird in Sekunden.",
    "Negativ": "Nur den Rückweg machen, ganz langsam. Z. B. beim Klimmzug oben starten und langsam runter.",
    "Rumpf": "Bauch, Rücken und Seiten zusammen: die Mitte vom Körper."
  },
  handgelenkTipp: "Handgelenke tun bei starkem Abknicken weh? Handtuch gefaltet unter die Handballen, oder auf die Parallettes bzw. das Liegestützbrett gehen. Vorher immer «Handgelenke aufwärmen».",
  stoppRegel: "Sofort aufhören nur bei: stechendem Schmerz im Gelenk, Schwindel, Schwarzwerden vor den Augen oder Schmerz in der Brust. Muskelbrennen und Müdigkeit sind normal und gewollt."
};

// x(id, name, gruppe, muskeln, einheit, material, ziel, schritte, fehler, sicherheit, leichter, schwerer, extra)
// leichter/schwerer: Figuren-ID oder null. Extra-Felder: leichterTipp, schwererTipp, handgelenk, tempo, gesperrt, ersatz
const L = [];
function x(id, name, gruppe, muskeln, einheit, material, ziel, schritte, fehler, sicherheit, leichter, schwerer, extra = {}){
  L.push({ id, name, gruppe, muskeln, einheit, material, ziel, schritte, fehler, sicherheit, leichter, schwerer, ...extra });
}
const HG = { handgelenk: true };
const TEMPO_KLEIN = "4 Sek runter, 1 Sek Pause oben, dann wieder hoch";

/* ---------- Aufwärmen, Haltung, Dehnen ---------- */
x("wrist", "Handgelenke aufwärmen", "aufwaermen", ["handgelenk", "unterarm"], "sek", ["boden", "handtuch"],
  "Macht die Handgelenke bereit für Liegestütze und Handstand.",
  ["Geh auf Hände und Knie. Finger zeigen nach vorne.", "Schieb das Gewicht langsam nach vorne, bis du einen leichten Zug spürst.", "Wieder zurück. Ruhig hin und her schaukeln.", "Dann Hände drehen: Finger zeigen zu den Knien, nochmals schaukeln."],
  ["Zu weit nach vorne, bis es sticht.", "Zu schnell: das ist kein Wippen, sondern ruhiges Schaukeln."],
  "Nur bis zum leichten Ziehen. Handtuch unter die Handballen, wenn es drückt.", null, null,
  { leichterTipp: "Weniger weit nach vorne schaukeln.", ...HG });

x("scap", "Schulterblatt-Liegestütz", "aufwaermen", ["ruecken_oben", "schulter_vorne"], "wdh", ["boden"],
  "Weckt die Muskeln um die Schulterblätter. Schützt die Schultern bei Handstand und Planche.",
  ["Geh in die Liegestütz-Position, Arme gestreckt.", "Arme bleiben gestreckt. Lass die Brust ein wenig zwischen die Schultern sinken.", "Drück den Boden weg, bis der obere Rücken leicht rund ist.", "Langsam hin und her."],
  ["Arme beugen: die Ellbogen bleiben ganz gestreckt.", "Hüfte hängt durch: Bauch und Po fest."],
  "Handtuch unter die Handballen, wenn die Handgelenke drücken.", null, null,
  { leichterTipp: "Auf den Knien machen.", ...HG });

x("circles", "Armkreisen", "aufwaermen", ["schulter_vorne", "schulter_seite", "schulter_hinten"], "wdh", ["boden"],
  "Macht die Schultern warm.",
  ["Steh gerade, Arme seitlich gestreckt.", "Mach grosse Kreise nach vorne.", "Nach der Hälfte die Richtung wechseln."],
  ["Nur kleine Kreise: mach sie so gross, wie es angenehm geht.", "Schultern zu den Ohren ziehen: locker lassen."],
  "Kein Risiko. Langsam starten.", null, null);

x("legswing", "Beinschwingen", "aufwaermen", ["hueftbeuger", "bein_hinten", "po"], "wdh_seite", ["boden", "wand"],
  "Macht die Hüfte locker für Kniebeugen und Sprünge.",
  ["Steh seitlich zur Wand und halte dich mit einer Hand.", "Schwing ein Bein locker vor und zurück.", "Oberkörper bleibt aufrecht.", "Dann das andere Bein."],
  ["Mit Schwung bis zum Ziehen reissen: locker schwingen.", "Rücken krumm machen: Oberkörper bleibt gerade."],
  "Klein anfangen, jede Runde etwas höher.", null, null);

x("catcow", "Katze-Kuh", "aufwaermen", ["ruecken_unten", "ruecken_oben", "bauch"], "wdh", ["boden"],
  "Bewegt die Wirbelsäule. Gut gegen steifen Rücken vom Sitzen.",
  ["Geh auf Hände und Knie.", "Rücken rund machen wie eine Katze, Kinn zur Brust.", "Dann Rücken nach unten sinken lassen, Blick nach vorne.", "Langsam mit dem Atem wechseln."],
  ["Zu schnell.", "Nur den Kopf bewegen statt den ganzen Rücken."],
  "Langsam bewegen. Fäuste statt flache Hände, wenn die Handgelenke drücken.", null, null, HG);

x("squat", "Kniebeuge", "beine", ["bein_vorne", "po"], "wdh", ["boden"],
  "Grundübung für starke Beine. Auch gutes Aufwärmen.",
  ["Füsse schulterbreit, Zehen leicht nach aussen.", "Setz dich nach hinten unten, als ob ein Stuhl da wäre.", "Knie zeigen in die gleiche Richtung wie die Zehen.", "Fersen bleiben am Boden. Hochdrücken."],
  ["Knie fallen nach innen.", "Fersen heben sich vom Boden."],
  "Knie dürfen über die Zehen, das ist ok. Rücken bleibt gerade.", null, "revlunge",
  { leichterTipp: "Auf einen Stuhl absetzen und wieder aufstehen.", schwererTipp: "Unten 2 Sek halten oder den 6-kg-Ball vor der Brust halten." });

x("door", "Brust dehnen im Türrahmen", "dehnen", ["brust", "schulter_vorne"], "sek_seite", ["tuer"],
  "Dehnt die Brust.",
  ["Unterarm an den Türrahmen.", "Einen Schritt nach vorne.", "30 Sek halten."],
  ["Schulter zum Ohr ziehen.", "Zu weit nach vorne lehnen."],
  "Gesperrt: Benaja will keine Tür-Übungen. Ersatz: Wandengel.", null, null,
  { gesperrt: true, ersatz: "wallangel" });

x("chintuck", "Kinn zurückziehen", "haltung", ["nacken"], "wdh", ["boden"],
  "Gegen den nach vorne geschobenen Kopf vom Handy. Bessere Haltung.",
  ["Steh oder sitz gerade, Blick geradeaus.", "Schieb das Kinn gerade nach hinten, als ob du ein Doppelkinn machst.", "2 Sek halten, dann locker lassen."],
  ["Kopf nach unten nicken statt nach hinten schieben.", "Schultern hochziehen."],
  "Kein Risiko. Sanft, nicht drücken.", null, null);

x("wallangel", "Wandengel", "haltung", ["ruecken_oben", "schulter_hinten", "nacken"], "wdh", ["wand"],
  "Öffnet die Brust und stärkt den oberen Rücken. Gute Haltung.",
  ["Steh mit dem Rücken an der Wand, Füsse eine Handbreite davor.", "Arme wie ein «W» an die Wand, Ellbogen auf Schulterhöhe.", "Schieb die Arme langsam nach oben zu einem «Y».", "Und wieder runter zum «W»."],
  ["Unterer Rücken löst sich stark von der Wand: Bauch leicht anspannen.", "Arme verlieren den Kontakt zur Wand: nur so hoch, wie es geht."],
  "Kein Risiko. Langsam bewegen.", "chintuck", null,
  { leichterTipp: "Einen Schritt weg von der Wand, Arme nur in die Luft." });

x("hipflex", "Hüftbeuger dehnen", "dehnen", ["hueftbeuger", "bein_vorne"], "sek_seite", ["boden", "handtuch"],
  "Löst die vorne enge Hüfte vom vielen Sitzen.",
  ["Knie dich hin, ein Fuss vorne auf dem Boden (wie beim Heiratsantrag).", "Handtuch unter das hintere Knie.", "Po anspannen und die Hüfte langsam nach vorne schieben.", "Halten und ruhig atmen. Dann Seite wechseln."],
  ["Ins Hohlkreuz fallen: Po fest, Bauch leicht an.", "Vorderes Knie fällt nach innen."],
  "Nur bis zum Ziehen, nie bis es sticht.", null, null);

x("calfstretch", "Waden dehnen", "dehnen", ["wade"], "sek_seite", ["wand"],
  "Lockert die Waden nach Wadenheben und Sprüngen.",
  ["Hände an die Wand.", "Ein Bein weit nach hinten, Ferse bleibt am Boden.", "Hinteres Bein gestreckt, Hüfte nach vorne zur Wand.", "Halten, dann Seite wechseln."],
  ["Ferse hebt sich.", "Hinterer Fuss zeigt nach aussen: Zehen nach vorne."],
  "Nur bis zum Ziehen.", null, null);

/* ---------- Handstand ---------- */
x("hswall", "Handstand an der Wand", "handstand", ["schulter_vorne", "trizeps", "bauch", "handgelenk"], "sek", ["wand", "boden", "handtuch"],
  "Gewöhnt Schultern und Handgelenke ans Gewicht. Grundlage für den freien Handstand.",
  ["Hände eine Handlänge vor die Wand, schulterbreit, Finger gespreizt.", "Mit dem Rücken zur Wand: ein Bein hochschwingen, das zweite folgt. Fersen an die Wand.", "Arme ganz gestreckt, Ohren zwischen den Armen.", "Bauch und Po fest, Körper gerade. Halten.", "Runter: ein Bein nach dem anderen."],
  ["Hohlkreuz (Bauch hängt durch): Bauch fest, Rippen rein.", "Arme gebeugt: Ellbogen ganz durchstrecken."],
  "Zuerst den Ausstieg üben: Hand zur Seite setzen und wie ein halbes Rad runter. Handtuch unter die Handballen.", "pike", "hskick",
  { leichterTipp: "Pike-Liegestütz-Position halten, Füsse auf dem Stuhl.", ...HG });

x("hskick", "Handstand aufschwingen", "handstand", ["schulter_vorne", "bauch", "handgelenk"], "versuche", ["boden", "handtuch"],
  "Lernen, mit genau der richtigen Kraft in den Handstand zu kommen.",
  ["Steh in Schrittstellung, Arme gestreckt über dem Kopf.", "Hände auf den Boden, schulterbreit, Finger gespreizt.", "Hinteres Bein hochschwingen, vorderes drückt ab.", "Oben die Beine zusammen. Mit den Fingern bremsen, wenn du kippst."],
  ["Zu viel Schwung: du kippst über. Lieber zu wenig, dann mehr.", "Arme beugen beim Aufschwingen."],
  "Platz frei räumen. Rausfallen üben: Hand zur Seite und Rad. Nicht nach hinten auf den Rücken fallen.", "hswall", "hsfree", HG);

x("hsfree", "Freier Handstand", "handstand", ["schulter_vorne", "bauch", "handgelenk", "finger"], "sek", ["boden", "handtuch"],
  "Der Skill selbst: frei stehen auf den Händen.",
  ["Aufschwingen wie geübt.", "Arme gestreckt, Blick zwischen die Hände.", "Kippst du nach vorne: Finger in den Boden krallen.", "Kippst du nach hinten: Handballen drücken.", "Zählen, solange du stehst."],
  ["Mit gebeugten Armen balancieren: Ellbogen gestreckt lassen.", "Beine auseinander: zusammen und fest."],
  "Freie Fläche, kein Möbel in der Nähe. Rausfallen mit Rad zur Seite.", "hskick", "hsshape",
  { schwererTipp: "Länger halten: Ziel 30 Sek.", ...HG });

x("hsshape", "Handstand-Formen", "handstand", ["schulter_vorne", "bauch", "hueftbeuger"], "wdh", ["boden", "handtuch"],
  "Mehr Kontrolle im Handstand: Beine bewegen, ohne zu kippen.",
  ["Steh frei im Handstand.", "Beuge langsam die Knie und zieh sie an.", "Dann wieder gerade nach oben strecken.", "Jede Form kurz halten."],
  ["Zu schnell: langsam, sonst kippst du.", "Arme beugen beim Wechsel."],
  "Erst üben, wenn der freie Handstand 15 Sek klappt. Rausfallen mit Rad.", "hsfree", null, HG);

x("hspu", "Handstand-Liegestütz an der Wand", "handstand", ["schulter_vorne", "trizeps", "brust"], "wdh", ["wand", "boden", "handtuch"],
  "Sehr starke Schultern. Für viel später.",
  ["Handstand mit dem Rücken zur Wand.", "Langsam die Arme beugen, Kopf vor die Hände.", "Kopf berührt das Kissen ganz leicht.", "Kräftig hochdrücken."],
  ["Runterfallen statt kontrolliert senken.", "Ellbogen weit nach aussen: eher nach hinten zeigen."],
  "Gefaltetes Kissen oder Handtuch unter den Kopf. Erst ab ca. 10 Pike-Liegestützen mit Füssen auf dem Stuhl.", "pikeel", null,
  { leichterTipp: "Nur runter (langsam 5 Sek), dann mit den Füssen absteigen.", ...HG });

/* ---------- Planche ---------- */
x("pllean", "Planche-Lehne", "planche", ["schulter_vorne", "brust", "bauch", "handgelenk"], "sek", ["parallettes", "boden"],
  "Erste Stufe zur Planche: Schultern tragen das Gewicht vor den Händen.",
  ["Liegestütz-Position, Hände auf den Parallettes.", "Arme ganz gestreckt.", "Schultern langsam nach vorne über die Hände schieben.", "Schultern nach unten drücken, oberer Rücken leicht rund.", "Halten."],
  ["Arme beugen: sie bleiben ganz gestreckt.", "Hüfte hängt durch: Bauch und Po fest."],
  "Nur so weit nach vorne, wie die Handgelenke es angenehm finden. Parallettes schonen die Handgelenke.", "ftplank", "tuckpl",
  { leichterTipp: "Weniger weit nach vorne lehnen.", schwererTipp: "Weiter nach vorne lehnen, bis die Schultern vor den Fingern sind.", ...HG });

x("frog", "Frosch-Stand", "planche", ["schulter_vorne", "bauch", "handgelenk"], "sek", ["boden", "handtuch"],
  "Gleichgewicht auf den Händen. Vorstufe zur Krähe.",
  ["Geh in die Hocke, Hände schulterbreit vor dir.", "Arme leicht beugen, Knie aussen an die Ellbogen legen.", "Gewicht langsam nach vorne, bis die Füsse abheben.", "Blick leicht nach vorne. Halten."],
  ["Zu schnell nach vorne kippen.", "Blick zwischen die Füsse: lieber nach vorne schauen."],
  "Kissen vor den Kopf legen, falls du nach vorne kippst.", null, "crow",
  { leichterTipp: "Nur einen Fuss abheben.", ...HG });

x("crow", "Krähe", "planche", ["schulter_vorne", "trizeps", "bauch", "handgelenk"], "sek", ["boden", "handtuch"],
  "Gleichgewicht und Kraft auf den Händen.",
  ["Hände schulterbreit, Finger gespreizt.", "Knie hoch an die Oberarme, nahe bei den Achseln.", "Nach vorne lehnen, bis die Füsse abheben.", "Bauch fest, Füsse zum Po ziehen. Halten."],
  ["Knie zu tief auf den Armen: so hoch wie möglich.", "Arme ganz gestreckt: leicht gebeugt ist richtig."],
  "Kissen vor den Kopf. Langsam nach vorne, nicht reinkippen.", "frog", "tuckpl",
  { schwererTipp: "Arme ganz strecken (gestreckte Krähe).", ...HG });

x("tuckpl", "Tuck-Planche", "planche", ["schulter_vorne", "brust", "bauch", "handgelenk"], "sek", ["parallettes", "boden"],
  "Planche mit angezogenen Knien. Füsse in der Luft, Arme gestreckt.",
  ["Hände auf die Parallettes, Arme gestreckt.", "Knie zur Brust ziehen, Rücken rund.", "Schultern nach vorne lehnen, bis die Füsse abheben.", "Schultern nach unten drücken. Halten, auch wenn es nur 1 Sek ist."],
  ["Arme beugen: das macht es zur Krähe.", "Nicht weit genug nach vorne lehnen."],
  "Parallettes schonen die Handgelenke. Rausfallen: Füsse einfach zurück auf den Boden.", "pllean", "advtuck",
  { leichterTipp: "Nur die Füsse kurz abheben, oder mit den Zehenspitzen am Boden halten.", ...HG });

x("advtuck", "Fortgeschrittene Tuck-Planche", "planche", ["schulter_vorne", "brust", "bauch", "ruecken_unten"], "sek", ["parallettes", "boden"],
  "Wie die Tuck-Planche, aber mit flachem Rücken. Deutlich schwerer.",
  ["Starte in der Tuck-Planche.", "Schieb die Hüfte nach hinten, bis der Rücken flach ist.", "Knie bleiben gebeugt, aber weiter weg von der Brust.", "Schultern noch weiter nach vorne. Halten."],
  ["Rücken bleibt rund.", "Hüfte sinkt unter die Schultern."],
  "Erst, wenn die Tuck-Planche 15 Sek klappt.", "tuckpl", "straddle", HG);

x("straddle", "Grätsch-Planche", "planche", ["schulter_vorne", "brust", "bauch", "po"], "sek", ["parallettes", "boden"],
  "Planche mit gestreckten, gegrätschten Beinen. Sehr weit weg, ein Ziel für später.",
  ["Starte in der fortgeschrittenen Tuck-Planche.", "Strecke die Beine weit gegrätscht nach hinten.", "Körper bleibt waagrecht, Arme gestreckt.", "Halten."],
  ["Hüfte hängt durch.", "Knie gebeugt."],
  "Erst, wenn die fortgeschrittene Tuck-Planche 15 Sek klappt.", "advtuck", null, HG);

/* ---------- L-Sitz ---------- */
x("support", "Stütz auf den Parallettes", "lsit", ["trizeps", "schulter_vorne", "ruecken_breit"], "sek", ["parallettes"],
  "Grundlage für L-Sitz und Dips: Gewicht auf gestreckten Armen tragen.",
  ["Stell dich zwischen die Parallettes und greif sie.", "Drück dich hoch, bis die Arme gestreckt sind.", "Schultern weg von den Ohren drücken.", "Füsse knapp über dem Boden. Halten."],
  ["Schultern bei den Ohren: nach unten drücken.", "Ellbogen gebeugt."],
  "Kaum Risiko. Parallettes müssen fest stehen.", null, "tuckl",
  { leichterTipp: "Füsse leicht am Boden lassen und nur einen Teil des Gewichts tragen." });

x("tuckl", "Tuck-L-Sitz", "lsit", ["bauch", "hueftbeuger", "trizeps"], "sek", ["parallettes"],
  "L-Sitz mit angezogenen Knien.",
  ["Stütz auf den Parallettes, Arme gestreckt.", "Zieh beide Knie zur Brust.", "Schultern nach unten drücken.", "Halten."],
  ["Schultern hochgezogen.", "Rücken ganz rund nach hinten gelehnt: aufrecht bleiben."],
  "Kaum Risiko.", "support", "onel",
  { leichterTipp: "Nur ein Knie anziehen, der andere Fuss bleibt am Boden." });

x("onel", "L-Sitz mit einem Bein", "lsit", ["bauch", "hueftbeuger", "bein_vorne"], "sek", ["parallettes"],
  "Zwischenstufe: ein Bein gestreckt, ein Bein angezogen.",
  ["Starte im Tuck-L-Sitz.", "Streck ein Bein gerade nach vorne.", "Halten, dann Bein wechseln."],
  ["Gestrecktes Bein hängt nach unten.", "Knie vom gestreckten Bein gebeugt."],
  "Kaum Risiko.", "tuckl", "lsit");

x("lsit", "L-Sitz", "lsit", ["bauch", "hueftbeuger", "bein_vorne", "trizeps"], "sek", ["parallettes"],
  "Klassischer Skill: Körper bildet ein «L», nur die Hände am Boden.",
  ["Stütz auf den Parallettes.", "Beide Beine gestreckt nach vorne heben, waagrecht.", "Zehen strecken, Knie gestreckt.", "Schultern nach unten drücken. Halten."],
  ["Knie gebeugt.", "Beine zu tief."],
  "Kaum Risiko.", "onel", "vsit");

x("vsit", "V-Sitz", "lsit", ["bauch", "hueftbeuger", "schulter_vorne"], "sek", ["parallettes"],
  "Sehr schwerer Skill: Beine höher als waagrecht. Ziel für später.",
  ["Starte im L-Sitz.", "Hebe die Beine höher Richtung Gesicht.", "Hüfte nach vorne schieben, Schultern zurück.", "Halten."],
  ["Knie beugen, um höher zu kommen.", "Arme beugen."],
  "Erst, wenn der L-Sitz 20 Sek klappt.", "lsit", null);

x("pikecomp", "Bein-Heben im Sitzen", "press", ["bauch", "hueftbeuger"], "wdh", ["boden"],
  "Macht die vorderen Hüftmuskeln stark. Wichtig für L-Sitz und Press.",
  ["Sitz mit gestreckten Beinen am Boden.", "Hände neben die Knie auf den Boden.", "Beide Beine gestreckt ein paar Zentimeter anheben.", "Kurz halten, langsam absenken."],
  ["Knie beugen.", "Nach hinten lehnen: Oberkörper bleibt aufrecht."],
  "Kaum Risiko.", null, "pikelift",
  { leichterTipp: "Nur ein Bein heben.", schwererTipp: "Hände weiter vorne bei den Füssen." });

/* ---------- Press ---------- */
x("pikelift", "Bein heben im Pike am Stuhl", "press", ["schulter_vorne", "bauch", "hueftbeuger"], "wdh_seite", ["stuhl", "boden", "handtuch"],
  "Übt das Gefühl, die Hüfte über die Hände zu bringen.",
  ["Füsse auf den Stuhl, Hände am Boden, Hüfte hoch.", "Laufe mit den Händen nahe zum Stuhl, Hüfte fast über den Händen.", "Ein Bein gestreckt nach oben heben.", "Langsam wieder ab. Seite wechseln."],
  ["Hüfte nicht über den Händen.", "Arme beugen."],
  "Stuhl an die Wand stellen, damit er nicht rutscht.", "pike", "crowhs", HG);

x("crowhs", "Von der Krähe in den Handstand", "press", ["schulter_vorne", "trizeps", "bauch"], "wdh", ["boden", "wand", "handtuch"],
  "Mit Kraft statt Schwung in den Handstand drücken.",
  ["Starte in der Krähe.", "Lehn dich nach vorne, Hüfte hoch.", "Drück die Arme gestreckt und hebe die Knie über die Hüfte.", "Oben die Beine strecken."],
  ["Mit Schwung springen.", "Kopf runterhängen lassen."],
  "Zuerst an der Wand üben. Rausfallen mit Rad.", "crow", "tuckpress", HG);

x("tuckpress", "Tuck-Press", "press", ["schulter_vorne", "bauch", "hueftbeuger"], "wdh", ["boden", "wand", "handtuch"],
  "Aus der Hocke mit angezogenen Knien in den Handstand drücken.",
  ["Hocke, Hände vor den Füssen.", "Schultern nach vorne, Füsse heben ab.", "Hüfte hoch über die Hände, Knie eng.", "Oben die Beine strecken."],
  ["Abspringen statt drücken.", "Arme beugen."],
  "Zuerst mit dem Rücken nahe an der Wand üben. Rausfallen mit Rad.", "crowhs", "strpress", HG);

x("strpress", "Grätsch-Press", "press", ["schulter_vorne", "bauch", "hueftbeuger", "bein_innen"], "wdh", ["boden", "handtuch"],
  "Mit gestreckten, gegrätschten Beinen in den Handstand drücken. Ziel für später.",
  ["Grätschstand, Hände flach vor dir am Boden.", "Schultern nach vorne, Hüfte hoch.", "Beine gegrätscht gestreckt abheben.", "Hüfte über die Hände, Beine zusammen nach oben."],
  ["Abspringen.", "Knie beugen."],
  "Braucht viel Beweglichkeit. Nie mit Gewalt dehnen.", "tuckpress", null, HG);

x("puhs", "Aus dem Liegestütz in den Handstand", "press", ["schulter_vorne", "bauch", "hueftbeuger"], "wdh", ["boden", "handtuch"],
  "Verbindet Kraft und Kontrolle: vom Brett über den Pike in den Handstand.",
  ["Liegestütz-Position.", "Hüfte hoch, Füsse laufen nahe zu den Händen.", "Hüfte über die Hände schieben.", "Beine nach oben in den Handstand."],
  ["Hüfte bleibt hinter den Händen.", "Zu schnell, mit Schwung."],
  "Freie Fläche. Rausfallen mit Rad.", "pikelift", null, HG);

x("ftplank", "Fingerspitzen-Brett", "handstand", ["finger", "unterarm", "bauch"], "sek", ["boden"],
  "Starke Finger: die bremsen dich im Handstand.",
  ["Liegestütz-Position, aber nur auf den Fingerspitzen.", "Finger gespreizt, leicht gebogen.", "Körper gerade wie ein Brett.", "Halten."],
  ["Finger knicken ein: lieber auf die Knie.", "Hüfte hängt durch."],
  "Auf den Knien starten. Langsam steigern, Finger sind kleine Gelenke.", null, "pllean",
  { leichterTipp: "Auf den Knien machen." });

/* ---------- Drücken ---------- */
x("incpu", "Liegestütz mit Händen auf dem Stuhl", "druecken", ["brust", "trizeps", "schulter_vorne"], "wdh", ["stuhl"],
  "Leichtere Liegestütze für mehr Wiederholungen.",
  ["Stuhl an die Wand. Hände auf die Sitzfläche.", "Füsse zurück, Körper gerade wie ein Brett.", "Brust zur Stuhlkante senken.", "Kräftig hochdrücken."],
  ["Hüfte hängt durch.", "Ellbogen weit zur Seite: eher schräg nach hinten (Pfeil-Form)."],
  "Stuhl steht an der Wand, damit er nicht wegrutscht.", "kneepu", "pu");

x("pu", "Liegestütz", "druecken", ["brust", "trizeps", "schulter_vorne", "bauch"], "wdh", ["boden", "brett"],
  "Grundübung für Brust, Arme und Schultern.",
  ["Hände etwas breiter als die Schultern.", "Körper gerade wie ein Brett, Bauch und Po fest.", "Langsam runter, bis die Brust fast den Boden berührt.", "Kräftig hochdrücken, bis die Arme gestreckt sind."],
  ["Hüfte hängt durch oder ist zu hoch.", "Nur halb runter."],
  "Handgelenke drücken? Liegestützbrett, Parallettes oder Handtuch.", "incpu", "deeppu",
  { schwererTipp: "Langsamer: 3 Sek runter.", ...HG });

x("deeppu", "Tiefer Liegestütz auf den Parallettes", "druecken", ["brust", "trizeps", "schulter_vorne"], "wdh", ["parallettes"],
  "Mehr Bewegung als normal: Brust geht tiefer als die Hände.",
  ["Hände auf die Parallettes, Körper gerade.", "Langsam runter, bis die Brust unter die Hände kommt.", "Unten kurz halten.", "Kräftig hochdrücken."],
  ["Schultern rollen nach vorne: Schulterblätter zusammen.", "Hüfte hängt durch."],
  "Nur so tief, wie es in der Schulter angenehm ist. Kein Stechen.", "pu", "declpu");

x("declpu", "Liegestütz mit Füssen auf dem Stuhl", "druecken", ["brust", "schulter_vorne", "trizeps"], "wdh", ["stuhl", "boden"],
  "Schwerer als normal und mehr für die Schultern.",
  ["Füsse auf den Stuhl, Hände am Boden.", "Körper gerade wie ein Brett.", "Langsam runter, Stirn Richtung Boden.", "Hochdrücken."],
  ["Hüfte hängt durch.", "Kopf zuerst runter statt die Brust."],
  "Stuhl an die Wand, damit er nicht wegrutscht.", "deeppu", "pppu", HG);

x("kneepu", "Knie-Liegestütz", "druecken", ["brust", "trizeps", "schulter_vorne"], "wdh", ["boden", "handtuch"],
  "Leichteste Liegestütz-Stufe. Gut für die letzten Sätze, wenn nichts mehr geht.",
  ["Knie auf dem Handtuch, Hände etwas breiter als die Schultern.", "Von den Knien bis zum Kopf eine gerade Linie.", "Brust zum Boden senken.", "Hochdrücken."],
  ["Po in die Luft gestreckt.", "Nur halb runter."],
  "Handtuch unter die Knie.", null, "incpu", HG);

x("pppu", "Planche-Liegestütz", "druecken", ["schulter_vorne", "brust", "trizeps", "bauch"], "wdh", ["parallettes", "boden"],
  "Liegestütz mit Händen weiter hinten bei der Hüfte. Baut Kraft für die Planche.",
  ["Hände auf die Parallettes, auf Höhe vom Bauch.", "Schultern nach vorne lehnen, vor die Hände.", "Langsam runter, Ellbogen eng am Körper.", "Hochdrücken, Schultern bleiben vorne."],
  ["Schultern rutschen zurück hinter die Hände.", "Ellbogen gehen zur Seite."],
  "Am Boden nur mit Parallettes, sonst knicken die Handgelenke zu stark ab.", "declpu", null, HG);

x("pike", "Pike-Liegestütz", "druecken", ["schulter_vorne", "trizeps"], "wdh", ["boden", "handtuch"],
  "Liegestütz für die Schultern. Weg zum Handstand-Liegestütz.",
  ["Hände schulterbreit, Hüfte hoch, Körper wie ein umgedrehtes «V».", "Füsse nahe zu den Händen laufen.", "Kopf langsam vor die Hände Richtung Boden senken.", "Hochdrücken."],
  ["Ellbogen zur Seite: eher nach hinten zeigen.", "Hüfte sinkt ab, dann wird es ein normaler Liegestütz."],
  "Handtuch unter die Handballen.", "incpu", "pikeel",
  { leichterTipp: "Füsse weiter weg von den Händen, oder nur halb runter.", ...HG });

x("pikeel", "Pike-Liegestütz mit Füssen auf dem Stuhl", "druecken", ["schulter_vorne", "trizeps"], "wdh", ["stuhl", "boden", "handtuch"],
  "Schwerer: mehr Gewicht auf den Schultern, fast wie Handstand.",
  ["Füsse auf den Stuhl, Hände am Boden.", "Hände nahe zum Stuhl laufen, Hüfte hoch über die Hände.", "Kopf langsam vor die Hände senken.", "Hochdrücken."],
  ["Hüfte nicht über den Händen.", "Ellbogen zur Seite."],
  "Stuhl an die Wand, damit er nicht rutscht.", "pike", "hspu", HG);

x("benchdip", "Stuhl-Dips mit gebeugten Knien", "druecken", ["trizeps", "brust", "schulter_vorne"], "wdh", ["stuhl"],
  "Leichte Dips für den Trizeps.",
  ["Setz dich vor den Stuhl, Hände hinter dir auf die Sitzkante.", "Po vom Stuhl weg, Knie gebeugt, Füsse flach.", "Langsam runter, bis die Oberarme fast waagrecht sind.", "Hochdrücken."],
  ["Zu tief runter: Schulter zieht vorne.", "Schultern zu den Ohren."],
  "Nur bis die Oberarme waagrecht sind, nicht tiefer. Stuhl an die Wand.", null, "benchdips", HG);

x("benchdips", "Stuhl-Dips mit gestreckten Beinen", "druecken", ["trizeps", "brust", "schulter_vorne"], "wdh", ["stuhl"],
  "Schwerere Stuhl-Dips.",
  ["Wie die Stuhl-Dips, aber Beine gestreckt, Fersen am Boden.", "Po nahe am Stuhl.", "Runter, bis die Oberarme waagrecht sind.", "Hochdrücken."],
  ["Zu tief.", "Po weit vom Stuhl weg."],
  "Nur bis die Oberarme waagrecht sind. Stuhl an die Wand.", "benchdip", "dip", HG);

x("dip", "Dips zwischen zwei Stühlen", "druecken", ["trizeps", "brust", "schulter_vorne"], "wdh", ["zwei_stuehle"],
  "Eine der besten Übungen für Brust und Trizeps.",
  ["Zwei stabile Stühle, Lehnen aussen, Sitzflächen zueinander, schulterbreit.", "Hände auf die Sitzkanten, Arme gestreckt, Knie gebeugt.", "Langsam runter, Oberkörper leicht nach vorne.", "Hochdrücken, bis die Arme gestreckt sind."],
  ["Zu tief: Oberarme nur bis waagrecht.", "Schultern zu den Ohren."],
  "Vorher testen, ob die Stühle wackeln. Kein Stuhl mit Rollen. Kein Stechen vorne in der Schulter.", "benchdips", null,
  { leichterTipp: "Nur runter (5 Sek langsam), mit den Füssen wieder hoch." });

x("triext", "Trizeps-Strecken am Stuhl", "druecken", ["trizeps"], "wdh", ["stuhl"],
  "Trizeps mit dem eigenen Körpergewicht.",
  ["Stuhl an die Wand. Hände auf die Sitzkante.", "Füsse zurück, Körper gerade.", "Nur die Ellbogen beugen, Stirn Richtung Hände.", "Arme strecken, bis du wieder oben bist."],
  ["Liegestütz daraus machen: Ellbogen zeigen nach unten, nicht zur Seite.", "Hüfte hängt durch."],
  "Langsam. Ellbogen nicht ruckartig durchdrücken.", null, "dip",
  { leichterTipp: "Füsse näher zum Stuhl.", schwererTipp: "Füsse weiter weg." });

/* ---------- Hanteln ---------- */
x("curl", "Bizeps-Curl", "arme", ["bizeps", "unterarm"], "wdh", ["hanteln"],
  "Starke Arme vorne.",
  ["Steh gerade, Hantel in der Hand, Arm gestreckt.", "Ellbogen bleibt eng am Körper.", "Hantel zur Schulter hochziehen.", "Oben 1 Sek halten, dann 4 Sek langsam runter."],
  ["Mit Schwung aus dem Rücken.", "Ellbogen wandert nach vorne."],
  "Kein Risiko bei sauberer Technik.", null, null,
  { tempo: TEMPO_KLEIN, leichterTipp: "Nur 3 Sek runter, oder weniger Wiederholungen.", schwererTipp: "Schwerere Hantel oder 5 Sek runter." });

x("ohe", "Trizeps über Kopf", "arme", ["trizeps"], "wdh", ["hanteln"],
  "Trizeps, vor allem der lange Teil, der die Arme dick macht.",
  ["Hantel mit beiden Händen über dem Kopf.", "Ellbogen zeigen nach vorne oben, nahe am Kopf.", "Hantel langsam hinter den Kopf senken.", "Arme strecken."],
  ["Ellbogen gehen weit auseinander.", "Hohlkreuz: Bauch fest."],
  "Hantel gut festhalten. Langsam, damit sie nicht an den Kopf schlägt.", null, null,
  { tempo: TEMPO_KLEIN, schwererTipp: "Einarmig oder schwerere Hantel." });

x("lat", "Seitheben", "arme", ["schulter_seite"], "wdh", ["hanteln"],
  "Breite Schultern.",
  ["Steh gerade, Hanteln neben dem Körper.", "Arme fast gestreckt seitlich hochheben.", "Bis auf Schulterhöhe, nicht höher.", "Oben 1 Sek halten, 4 Sek langsam runter."],
  ["Mit Schwung.", "Schultern zu den Ohren ziehen."],
  "Leichtes Gewicht reicht. Langsam ist wichtiger als schwer.", null, null,
  { tempo: TEMPO_KLEIN, leichterTipp: "Nur eine Hantel, abwechselnd.", schwererTipp: "5 Sek runter oder schwerere Hanteln." });

x("row", "Hantel-Rudern mit Stuhl", "ziehen", ["ruecken_breit", "ruecken_oben", "bizeps"], "wdh_seite", ["hanteln", "stuhl"],
  "Rücken stark machen. Gleicht die vielen Liegestütze aus.",
  ["Eine Hand auf die Stuhl-Sitzfläche, Rücken gerade, fast waagrecht.", "Hantel in der anderen Hand, Arm hängt gestreckt.", "Hantel zur Hüfte ziehen, Ellbogen nahe am Körper.", "Oben Schulterblatt nach hinten drücken, langsam runter."],
  ["Rücken rund.", "Oberkörper dreht mit."],
  "Rücken gerade halten.", null, null,
  { tempo: TEMPO_KLEIN, schwererTipp: "Schwerere Hantel oder oben 2 Sek halten." });

x("rfly", "Vorgebeugtes Seitheben", "arme", ["schulter_hinten", "ruecken_oben"], "wdh", ["hanteln"],
  "Hintere Schulter für gute Haltung und gesunde Schultern.",
  ["Knie leicht beugen, Oberkörper weit nach vorne, Rücken gerade.", "Hanteln hängen unter der Brust.", "Arme seitlich hochheben, wie Flügel.", "Oben kurz halten, langsam runter."],
  ["Mit Schwung aus dem Rücken.", "Rücken rund."],
  "Rücken gerade. Leichtes Gewicht reicht.", "reary", null,
  { tempo: TEMPO_KLEIN, leichterTipp: "Ohne Hanteln oder mit Wasserflaschen.", schwererTipp: "Schwerere Hanteln." });

x("wristcurl", "Handgelenk-Curl", "arme", ["unterarm", "handgelenk"], "wdh", ["hanteln", "stuhl"],
  "Stärkere Handgelenke und Unterarme. Hilft bei Handstand und Klimmzügen.",
  ["Setz dich, Unterarm auf dem Oberschenkel, Handfläche nach oben.", "Hand hängt über das Knie.", "Hantel nur mit dem Handgelenk hochrollen.", "Langsam runter."],
  ["Unterarm hebt sich mit.", "Zu schwer und ruckartig."],
  "Leichtes Gewicht, langsam. Kein Stechen im Handgelenk.", null, null,
  { tempo: TEMPO_KLEIN });

x("revlunge", "Ausfallschritt rückwärts", "beine", ["bein_vorne", "po"], "wdh_seite", ["hanteln", "boden"],
  "Starke Beine, ein Bein nach dem anderen.",
  ["Steh gerade, Hantel in der Hand.", "Grosser Schritt nach hinten.", "Hinteres Knie fast bis zum Boden senken.", "Mit dem vorderen Bein zurückdrücken."],
  ["Vorderes Knie fällt nach innen.", "Oberkörper kippt weit nach vorne."],
  "Langsam, bis du sicher stehst.", "squat", "bss",
  { leichterTipp: "Ohne Hantel." });

x("sldl", "Einbeiniges Kreuzheben", "beine", ["bein_hinten", "po", "ruecken_unten"], "wdh_seite", ["hanteln", "boden"],
  "Hintere Oberschenkel und Po. Dazu Gleichgewicht.",
  ["Steh auf einem Bein, Hantel in der Gegenhand.", "Kippe nach vorne, das freie Bein geht gerade nach hinten.", "Rücken gerade, Hantel nahe am Bein.", "Bis du hinten am Bein Zug spürst, dann hoch."],
  ["Rücken wird rund.", "Hüfte dreht auf."],
  "Rücken gerade. Bei Wackeln mit einer Hand an der Wand halten.", null, null,
  { leichterTipp: "Ohne Hantel oder mit einer Hand an der Wand." });

/* ---------- Ziehen ---------- */
x("hang", "Hängen an der Stange", "ziehen", ["unterarm", "ruecken_breit", "schulter_hinten"], "sek", ["stange"],
  "Starker Griff und gesunde Schultern.",
  ["Greif die Stange schulterbreit, Handflächen von dir weg.", "Hänge mit gestreckten Armen.", "Schultern leicht nach unten ziehen, weg von den Ohren.", "Halten."],
  ["Ganz schlaff hängen.", "Mit den Beinen schwingen."],
  "Stange vorher fest prüfen. Langsam loslassen, nicht abspringen.", null, "assistpu");

x("pullup", "Klimmzug", "ziehen", ["ruecken_breit", "bizeps", "unterarm", "ruecken_oben"], "wdh", ["stange"],
  "Die beste Übung für einen breiten Rücken.",
  ["Hänge an der Stange, Handflächen von dir weg.", "Schultern nach unten, dann ziehen.", "Hoch, bis das Kinn über der Stange ist.", "Langsam runter, bis die Arme gestreckt sind."],
  ["Nur halb runter.", "Mit den Beinen schwingen."],
  "Stange vorher fest prüfen.", "negpu", null,
  { schwererTipp: "Langsamer runter (4 Sek) oder oben 2 Sek halten." });

x("negpu", "Negativ-Klimmzug", "ziehen", ["ruecken_breit", "bizeps", "unterarm"], "wdh", ["stange", "stuhl"],
  "Nur der Weg nach unten, ganz langsam. Macht schnell stärker für Klimmzüge.",
  ["Mit dem Stuhl hochsteigen, Kinn über die Stange.", "Füsse weg vom Stuhl.", "Langsam runter, bis 5 zählen.", "Unten Arme gestreckt. Wieder hochsteigen."],
  ["Zu schnell runter fallen.", "Unten nicht ganz strecken."],
  "Stuhl an die Seite, damit du beim Runtergehen nicht drauf landest.", "assistpu", "pullup");

x("assistpu", "Klimmzug mit Fuss auf dem Stuhl", "ziehen", ["ruecken_breit", "bizeps"], "wdh", ["stange", "stuhl"],
  "Klimmzug mit Hilfe. Mehr Wiederholungen möglich.",
  ["Stuhl unter die Stange, ein Fuss oder beide Füsse drauf.", "Stange greifen, Arme gestreckt.", "Hochziehen, die Füsse helfen nur so viel wie nötig.", "Langsam runter."],
  ["Nur mit den Beinen drücken.", "Nur halb runter."],
  "Stuhl stabil, nicht mit Rollen.", "hang", "negpu");

x("doorrow", "Rudern an der Tür", "ziehen", ["ruecken_oben", "bizeps"], "wdh", ["tuer"],
  "Gesperrt.", ["Gesperrt."], ["–", "–"],
  "Gesperrt: Benaja will keine Tür-Übungen (altes Haus). Ersatz: Hantel-Rudern.", null, null,
  { gesperrt: true, ersatz: "row" });

x("doorrowlow", "Tiefes Rudern an der Tür", "ziehen", ["ruecken_oben", "bizeps"], "wdh", ["tuer"],
  "Gesperrt.", ["Gesperrt."], ["–", "–"],
  "Gesperrt: Benaja will keine Tür-Übungen (altes Haus). Ersatz: Hantel-Rudern.", null, null,
  { gesperrt: true, ersatz: "row" });

x("reary", "Y-Heben in Bauchlage", "ziehen", ["ruecken_oben", "schulter_hinten"], "wdh", ["boden"],
  "Oberer Rücken und hintere Schulter. Gut für die Haltung.",
  ["Lieg auf dem Bauch, Arme schräg nach vorne wie ein «Y».", "Daumen zeigen nach oben.", "Arme vom Boden heben, Schulterblätter nach unten hinten.", "2 Sek halten, langsam ab."],
  ["Kopf in den Nacken: Blick bleibt zum Boden.", "Mit Schwung."],
  "Kein Risiko.", null, "rfly",
  { schwererTipp: "Kleine Wasserflaschen in die Hände." });

/* ---------- Beine ---------- */
x("bss", "Bulgarische Kniebeuge", "beine", ["bein_vorne", "po", "bein_innen"], "wdh_seite", ["stuhl", "boden"],
  "Eine der besten Beinübungen ohne Gewichte.",
  ["Hinterer Fuss mit dem Rist auf den Stuhl.", "Vorderer Fuss weit genug vorne.", "Gerade runter, bis das hintere Knie fast den Boden berührt.", "Mit dem vorderen Bein hochdrücken."],
  ["Vorderer Fuss zu nah am Stuhl.", "Knie fällt nach innen."],
  "Stuhl an die Wand. Am Anfang neben einer Wand üben, falls du wackelst.", "revlunge", "bssdb");

x("bssdb", "Bulgarische Kniebeuge mit Hantel", "beine", ["bein_vorne", "po", "bein_innen"], "wdh_seite", ["stuhl", "hanteln", "boden"],
  "Wie die Bulgarische Kniebeuge, aber schwerer.",
  ["Wie die Bulgarische Kniebeuge.", "Eine oder zwei Hanteln in den Händen, Arme hängen.", "Runter, bis das hintere Knie fast den Boden berührt.", "Hochdrücken."],
  ["Oberkörper kippt weit nach vorne.", "Knie fällt nach innen."],
  "Stuhl an die Wand.", "bss", null,
  { schwererTipp: "Zwei Hanteln oder 3 Sek runter." });

x("pistol", "Pistol-Kniebeuge", "beine", ["bein_vorne", "po", "bauch"], "wdh_seite", ["boden"],
  "Kniebeuge auf einem Bein. Kraft und Gleichgewicht.",
  ["Steh auf einem Bein, das andere gestreckt nach vorne.", "Arme nach vorne für das Gleichgewicht.", "Langsam ganz runter.", "Hochdrücken, das freie Bein bleibt in der Luft."],
  ["Ferse hebt sich.", "Knie fällt nach innen."],
  "Am Anfang mit einer Hand an der Wand.", "boxpistol", null,
  { leichterTipp: "Mit einer Hand an der Wand oder nur halb runter." });

x("boxpistol", "Einbeinig auf den Stuhl setzen", "beine", ["bein_vorne", "po"], "wdh_seite", ["stuhl"],
  "Vorstufe zur Pistol-Kniebeuge.",
  ["Steh vor dem Stuhl auf einem Bein.", "Anderes Bein nach vorne gestreckt.", "Langsam auf den Stuhl setzen.", "Einbeinig wieder aufstehen."],
  ["Auf den Stuhl plumpsen.", "Mit Schwung aufstehen."],
  "Stuhl an die Wand.", "squat", "pistol",
  { schwererTipp: "Tieferer Sitz (Kissen weg, Treppenstufe)." });

x("bridge", "Po-Brücke", "beine", ["po", "bein_hinten"], "wdh", ["boden"],
  "Starker Po, schützt den unteren Rücken.",
  ["Lieg auf dem Rücken, Knie gebeugt, Füsse flach.", "Po fest anspannen.", "Hüfte hoch, bis Knie, Hüfte und Schultern eine Linie sind.", "Oben 2 Sek halten, langsam ab."],
  ["Hohlkreuz statt Po anspannen.", "Mit den Füssen weit weg vom Po."],
  "Kein Risiko.", null, "thrust1");

x("thrust1", "Einbeinige Po-Brücke", "beine", ["po", "bein_hinten"], "wdh_seite", ["boden"],
  "Doppelt so schwer wie die normale Po-Brücke.",
  ["Wie die Po-Brücke, aber ein Bein gestreckt in die Luft.", "Mit dem Bein am Boden die Hüfte hochdrücken.", "Oben 2 Sek halten.", "Langsam ab. Seite wechseln."],
  ["Hüfte kippt zur Seite.", "Hohlkreuz."],
  "Kein Risiko.", "bridge", "thrustb");

x("thrustb", "Einbeiniger Hüftstoss am Stuhl", "beine", ["po", "bein_hinten"], "wdh_seite", ["stuhl", "boden"],
  "Mehr Bewegung als die Po-Brücke, Po arbeitet stärker.",
  ["Schulterblätter an die Sitzkante vom Stuhl, Stuhl an der Wand.", "Ein Fuss am Boden, das andere Bein hoch.", "Hüfte hochdrücken, bis der Körper waagrecht ist.", "Oben 2 Sek halten, langsam ab."],
  ["Hüfte kippt zur Seite.", "Kopf in den Nacken."],
  "Stuhl an die Wand, damit er nicht wegrutscht.", "thrust1", null,
  { schwererTipp: "Hantel auf die Hüfte legen." });

x("nordic", "Nordic Curl", "beine", ["bein_hinten"], "wdh", ["moebel", "boden", "handtuch"],
  "Sehr starke hintere Oberschenkel. Schützt vor Zerrungen beim Sprinten.",
  ["Knie auf das Handtuch, Fersen unter das Sofa klemmen.", "Körper gerade von Knie bis Kopf.", "Langsam nach vorne kippen, so lange wie möglich bremsen.", "Mit den Händen abfangen und hochdrücken."],
  ["In der Hüfte knicken: Po bleibt fest.", "Zu früh fallen lassen."],
  "Hände immer bereit zum Abfangen. Möbel muss schwer genug sein.", "thrust1", null,
  { leichterTipp: "Nur ein Stück nach vorne und wieder zurück." });

x("calf2", "Wadenheben auf der Treppe", "beine", ["wade"], "wdh", ["treppe", "wand"],
  "Kräftige Waden, gut für Sprünge.",
  ["Fussballen auf die Treppenkante, Fersen hängen frei.", "Mit einer Hand an der Wand halten.", "Ganz hoch auf die Zehen.", "Oben 1 Sek halten, langsam tief runter."],
  ["Zu schnell und federnd.", "Nur halbe Bewegung."],
  "Gut festhalten.", null, "calf1",
  { tempo: "2 Sek hoch, 1 Sek oben, 3 Sek runter" });

x("calf1", "Einbeiniges Wadenheben", "beine", ["wade"], "wdh_seite", ["treppe", "wand"],
  "Doppelt so schwer wie beidbeinig.",
  ["Ein Fuss auf der Treppenkante, der andere in der Luft.", "Hand an der Wand.", "Ganz hoch auf die Zehen.", "Langsam tief runter."],
  ["Mit den Armen hochziehen.", "Zu schnell."],
  "Gut festhalten.", "calf2", "calf1db",
  { tempo: "2 Sek hoch, 1 Sek oben, 3 Sek runter" });

x("calf1db", "Einbeiniges Wadenheben mit Hantel", "beine", ["wade"], "wdh_seite", ["treppe", "wand", "hanteln"],
  "Wenn 20 einbeinig zu leicht sind.",
  ["Wie einbeiniges Wadenheben.", "Hantel in der Hand auf der Seite vom Arbeitsbein.", "Ganz hoch, langsam tief runter."],
  ["Zu schnell.", "Nur halbe Bewegung."],
  "Mit der freien Hand gut festhalten.", "calf1", null,
  { tempo: "2 Sek hoch, 1 Sek oben, 3 Sek runter" });

x("tib", "Schienbein-Heben an der Wand", "beine", ["schienbein"], "wdh", ["wand"],
  "Starke Schienbeine, schützt die Knie und Füsse bei Sprüngen.",
  ["Rücken an die Wand, Füsse einen Schritt davor.", "Fersen bleiben am Boden.", "Zehen so hoch wie möglich ziehen.", "Langsam ab."],
  ["Fersen heben sich.", "Zu nahe an der Wand: dann ist es zu leicht."],
  "Kein Risiko. Brennt schnell, das ist normal.", null, null,
  { schwererTipp: "Füsse weiter weg von der Wand." });

x("foot", "Handtuch mit den Zehen ziehen", "beine", ["fuss"], "wdh", ["stuhl", "handtuch"],
  "Starke Füsse für Sprünge und Gleichgewicht.",
  ["Sitz auf dem Stuhl, Handtuch flach vor deinem Fuss.", "Ferse bleibt am Boden.", "Mit den Zehen das Handtuch zu dir ziehen.", "Seite wechseln."],
  ["Ferse hebt sich.", "Nur die grosse Zehe arbeitet."],
  "Kein Risiko.", null, null);

x("cossack", "Seitliche Kniebeuge", "beine", ["bein_vorne", "bein_innen", "po"], "wdh_seite", ["boden"],
  "Beweglichkeit und Kraft für die Hüfte.",
  ["Breiter Stand, Zehen leicht nach aussen.", "Gewicht auf ein Bein, tief runter.", "Das andere Bein bleibt gestreckt, Zehen hoch.", "Zurück in die Mitte, dann andere Seite."],
  ["Ferse vom Beugebein hebt sich.", "Rücken rund."],
  "Nur so tief, wie es ohne Stechen geht.", "squat", null,
  { leichterTipp: "Nur halb runter, Hände vorne an einem Stuhl." });

x("sideplank", "Seitstütz", "bauch", ["bauch_seite", "schulter_seite"], "sek_seite", ["boden"],
  "Starke Seiten am Bauch, schützt den Rücken.",
  ["Leg dich auf die Seite, Ellbogen unter der Schulter.", "Füsse übereinander.", "Hüfte hoch, Körper gerade.", "Halten, dann Seite wechseln."],
  ["Hüfte sinkt ab.", "Oberkörper kippt nach vorne."],
  "Kein Risiko.", null, null,
  { leichterTipp: "Unteres Knie am Boden lassen.", schwererTipp: "Oberes Bein hochheben." });

/* ---------- Bauch ---------- */
x("crunch", "Crunch", "bauch", ["bauch"], "wdh", ["boden"],
  "Einfachste Bauchübung.",
  ["Lieg auf dem Rücken, Knie gebeugt, Füsse flach.", "Hände an die Schläfen, nicht am Hinterkopf ziehen.", "Schultern vom Boden heben, Rippen zur Hüfte.", "Langsam ab."],
  ["Am Kopf ziehen.", "Ganz hochsitzen: nur die Schultern heben."],
  "Kein Risiko.", null, "hollowt");

x("hollowt", "Hohlkörper mit angezogenen Knien", "bauch", ["bauch"], "sek", ["boden"],
  "Leichtere Form vom Hohlkörper.",
  ["Lieg auf dem Rücken.", "Unteren Rücken in den Boden drücken.", "Knie anziehen, Füsse und Schultern heben.", "Arme nach vorne, halten."],
  ["Unterer Rücken hebt sich vom Boden.", "Luft anhalten: normal weiter atmen."],
  "Kein Risiko.", "crunch", "hollow");

x("hollow", "Hohlkörper", "bauch", ["bauch", "hueftbeuger"], "sek", ["boden"],
  "Die wichtigste Bauchspannung für Handstand und alle Skills.",
  ["Lieg auf dem Rücken, unteren Rücken in den Boden drücken.", "Arme gestreckt über den Kopf.", "Beine gestreckt heben, Schultern heben.", "Körper wie eine flache Banane. Halten."],
  ["Unterer Rücken hebt sich: Beine höher halten.", "Kopf in den Nacken: Kinn leicht zur Brust."],
  "Unterer Rücken bleibt am Boden.", "hollowt", "hollowrock",
  { leichterTipp: "Arme neben den Körper, Beine höher." });

x("hollowrock", "Hohlkörper-Schaukeln", "bauch", ["bauch", "hueftbeuger"], "wdh", ["boden"],
  "Hohlkörper halten und dabei vor und zurück schaukeln.",
  ["Geh in den Hohlkörper.", "Form fest halten.", "Vor und zurück schaukeln wie eine Wippe.", "Form nicht verlieren."],
  ["Knicken in der Hüfte.", "Schwung aus den Armen."],
  "Kein Risiko.", "hollow", null);

x("kneeraise", "Knieheben im Liegen", "bauch", ["bauch", "hueftbeuger"], "wdh", ["boden"],
  "Unterer Bauch.",
  ["Lieg auf dem Rücken, Hände neben dem Po.", "Knie gebeugt anheben zur Brust.", "Po leicht vom Boden heben.", "Langsam ab, Füsse knapp über dem Boden."],
  ["Mit Schwung.", "Unterer Rücken hebt sich beim Absenken."],
  "Kein Risiko.", null, "legraise");

x("legraise", "Beinheben im Liegen", "bauch", ["bauch", "hueftbeuger"], "wdh", ["boden"],
  "Unterer Bauch, schwerer als Knieheben.",
  ["Lieg auf dem Rücken, Hände neben dem Po.", "Beine gestreckt nach oben heben.", "Langsam ab, bis knapp über den Boden.", "Unterer Rücken bleibt am Boden."],
  ["Unterer Rücken hebt sich: nur so tief, wie es flach bleibt.", "Mit Schwung."],
  "Unterer Rücken bleibt am Boden.", "kneeraise", "dragon");

x("dragon", "Drachenfahne", "bauch", ["bauch", "ruecken_breit", "hueftbeuger"], "wdh", ["moebel", "boden"],
  "Sehr schwere Bauchübung. Ziel für später.",
  ["Lieg auf dem Rücken, halte hinter dem Kopf ein schweres Möbel fest.", "Körper gerade nach oben, nur die Schultern am Boden.", "Ganz langsam absenken, Körper bleibt gerade.", "Knapp über dem Boden stoppen."],
  ["In der Hüfte knicken.", "Auf dem Nacken statt auf den Schultern."],
  "Erst, wenn Beinheben 15 Mal sauber geht. Nie auf dem Nacken abstützen.", "legraise", null,
  { leichterTipp: "Knie angezogen lassen." });

x("twist", "Rumpfdrehen mit Ball", "bauch", ["bauch_seite", "bauch"], "wdh", ["ball", "boden"],
  "Seitliche Bauchmuskeln.",
  ["Setz dich, Knie gebeugt, Oberkörper leicht nach hinten.", "Ball vor der Brust.", "Oberkörper nach links drehen, Ball zum Boden.", "Dann nach rechts. Links + rechts = 1 Wiederholung."],
  ["Nur die Arme bewegen: der Oberkörper dreht mit.", "Rücken rund."],
  "Rücken gerade, langsam drehen.", "crunch", null,
  { leichterTipp: "Ohne Ball, Füsse am Boden.", schwererTipp: "Füsse vom Boden heben." });


/* ---------- Ohne Figur (Wunsch an A: Figur mit gleicher ID ergänzen). figurErsatz = vorübergehend angezeigte Figur ---------- */
x("jumpsq", "Strecksprung aus der Hocke", "beine", ["bein_vorne", "po", "wade"], "wdh", ["boden"],
  "Sprungkraft: Beine schnell und explosiv machen.",
  ["Füsse schulterbreit, halbe Kniebeuge, Arme nach hinten.", "Explosiv hochspringen, Arme nach oben schwingen.", "Weich auf den Fussballen landen, Knie gebeugt.", "Kurz stabil stehen, dann der nächste Sprung."],
  ["Harte Landung mit gestreckten Knien.", "Knie fallen bei der Landung nach innen."],
  "Leise landen: das schont die Gelenke. Auf Matte oder Teppich, nicht auf Fliesen in Socken.", "squat", "broadjump",
  { ohneFigur: true, figurErsatz: "squat" });

x("broadjump", "Weitsprung aus dem Stand", "beine", ["po", "bein_vorne", "bein_hinten"], "wdh", ["boden"],
  "Sprungkraft nach vorne. Gut messbar in Zentimetern.",
  ["Füsse schulterbreit an eine Linie.", "Arme zurück, in die halbe Kniebeuge.", "Mit beiden Beinen so weit wie möglich nach vorne springen.", "Weich landen, Knie gebeugt. Zurücklaufen, nächster Sprung."],
  ["Bei der Landung nach hinten fallen.", "Ohne Armschwung."],
  "Braucht ca. 3 Meter freien Platz. Rutschfester Boden oder draussen.", "jumpsq", null,
  { ohneFigur: true, figurErsatz: "squat" });

x("dbpress", "Schulterdrücken mit Hanteln", "druecken", ["schulter_vorne", "schulter_seite", "trizeps"], "wdh", ["hanteln"],
  "Kräftige, runde Schultern.",
  ["Steh gerade, Hanteln auf Schulterhöhe, Handflächen nach vorne.", "Bauch und Po fest.", "Hanteln gerade nach oben drücken, bis die Arme gestreckt sind.", "Langsam zurück auf Schulterhöhe."],
  ["Hohlkreuz: Bauch und Po fest.", "Nur halb hoch."],
  "Kein Schwung aus den Beinen.", "pike", "pikeel",
  { ohneFigur: true, figurErsatz: "ohe", tempo: "3 Sek runter, dann kräftig hoch" });

x("goblet", "Kniebeuge mit Ball vor der Brust", "beine", ["bein_vorne", "po", "bauch"], "wdh", ["ball"],
  "Kniebeuge mit Gewicht. Hilft auch, aufrecht zu bleiben.",
  ["Halte den 6-kg-Ball (oder eine Hantel) mit beiden Händen vor der Brust.", "Füsse schulterbreit, Zehen leicht nach aussen.", "Tief runter, Ellbogen innen an den Knien.", "Hochdrücken."],
  ["Oberkörper kippt nach vorne.", "Fersen heben sich."],
  "Rücken gerade.", "squat", "bssdb",
  { ohneFigur: true, figurErsatz: "squat" });

x("hangknee", "Knieheben hängend", "bauch", ["bauch", "hueftbeuger", "unterarm"], "wdh", ["stange"],
  "Bauch und Griff zusammen.",
  ["Häng an der Stange, Arme gestreckt.", "Knie langsam zur Brust ziehen.", "Kurz oben halten.", "Langsam runter, nicht schwingen."],
  ["Mit Schwung.", "Beine fallen lassen."],
  "Stange vorher prüfen.", "kneeraise", null,
  { ohneFigur: true, figurErsatz: "hang" });

/* ---------- Ausgabe ---------- */
const out = { _meta: meta, uebungen: L };
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2) + "\n");
console.log("geschrieben:", L.length, "Übungen");
