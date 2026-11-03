# Generator für training/data/videos.json (Claude B). Aufruf: python3 tools/gen-videos.py
# Quelle: Web-Suche vom 1.11.2026. Nur Links, die in Suchtreffern standen. youtube.com war aus der Sitzung nicht erreichbar,
# daher sind Videos NICHT angeschaut (geprueft=false). Kanal nur, wenn der Suchtreffer ihn nennt.
import json
V = {
 "hswall":   ("fj6lKSg5bSM", "3 Ways to get into a Chest-To-Wall Handstand", None, "en"),
 "hskick":   ("karmVwMgErk", "How to Kick Up to Handstand - Handstands 101", None, "en"),
 "hsfree":   ("6DPl4QlAY4k", "How to Handstand and Balance Freestanding", None, "en"),
 "pllean":   ("wKV5zVJTYBo", "How To Planche Lean Correctly", None, "en"),
 "tuckpl":   ("mCcxZJSljgk", "Tuck Planche Tutorial", None, "en"),
 "advtuck":  ("M65xGWsyPNY", "ADVANCED TUCK PLANCHE Tutorial", None, "en"),
 "frog":     ("La4D-klsHLQ", "How to Frogstand Tutorial - Beginner Calisthenics", None, "en"),
 "crow":     ("Q5wCVzRqaPY", "Calisthenics Skills Anyone Can Learn: The Crow Pose", None, "en"),
 "crowhs":   ("8lxZFHGHIQ8", "Crow to Handstand Progressions Beginner To Advanced", None, "en"),
 "tuckl":    ("r-LQKNxGJB0", "L-Sit Tutorial On Floor, Bar And Parallel Bars (6 Step-by-Step Guide)", None, "en"),
 "lsit":     ("r-LQKNxGJB0", "L-Sit Tutorial On Floor, Bar And Parallel Bars (6 Step-by-Step Guide)", None, "en"),
 "onel":     ("49pZak4cQ_0", "How To Do A Single Leg L-Sit On Parallettes - Supported L-Sit Progression Exercises", None, "en"),
 "pullup":   ("rmdn5X_KLkY", "The PERFECT Pull-Up (Full Guide)", "Saturn Movement", "en"),
 "negpu":    ("gbPURTSxQLY", "How To Do a Negative Pull-Up", None, "en"),
 "hang":     ("OT-wTpxP9uo", "Everyone Skips This Before Pull-Ups (Dead Hang Basics)", None, "en"),
 "pu":       ("s1X8e4JFdbE", "How To Do Push Ups Correctly", None, "en"),
 "deeppu":   ("cydG4okCjYU", "Deep Push Ups: Paralletes", None, "en"),
 "declpu":   ("9yoySai9DuI", "How To Do A Decline Push Up", None, "en"),
 "pppu":     ("RvA22_Hiouw", "Pseudo Planche Push Up Progression Tutorial for Beginners", None, "en"),
 "pike":     ("pHR5yG6xBps", "Pike Push Up Tutorial For Beginners (With Progressions)", "Pat Chadwick", "en"),
 "pikeel":   ("GoMrYWx6Cy8", "Elevated Pike Push-Ups Tutorial: Perfect Form & Strong Shoulders", None, "en"),
 "benchdip": ("AWz_7B1cch0", "How To Properly Do Tricep Chair Dips - 3 Common Mistakes", None, "en"),
 "benchdips":("AWz_7B1cch0", "How To Properly Do Tricep Chair Dips - 3 Common Mistakes", None, "en"),
 "dip":      ("fwfZchB1mvA", "Dips Proper Form (Chest vs. Triceps)", None, "en"),
 "curl":     ("nBzLCE-dcRQ", "Dumbbell Biceps Curl (Both Arms & Alternate)", None, "en"),
 "ohe":      ("a9oPnZReIRE", "Dumbbell Overhead Tricep Extension - OPEX Exercise Library", "OPEX", "en"),
 "lat":      ("3VcKaXpzqRo", "How To: Dumbbell Side Lateral Raise", None, "en"),
 "row":      ("9kbvlaLSTpE", "One Arm Dumbbell Row: Correct Form & 5 COMMON MISTAKES", None, "en"),
 "rfly":     ("UO_v23hHAdM", "Bent Over Dumbbell Rear Delt Flyes (Exercise Tutorial + Form Tips)", None, "en"),
 "revlunge": ("MyqQRJ2lW7Q", "Dumbbell Reverse Lunges (Tutorial + Tips)", None, "en"),
 "sldl":     ("Zfr6wizR8rs", "The BEST Single-Leg RDL Tutorial (Romanian Deadlift)", None, "en"),
 "bss":      ("VPhhE6bBzZE", "How To Do Bulgarian Split Squats Correctly", None, "en"),
 "bssdb":    ("VPhhE6bBzZE", "How To Do Bulgarian Split Squats Correctly", None, "en"),
 "pistol":   ("zSrpQDZwdD0", "PISTOL SQUATS lernen (Technik Tutorial)", None, "de"),
 "boxpistol":("6dV4hFahrpU", "6 Pistol Squat Progressions — Beginner to Advanced", None, "en"),
 "thrust1":  ("3KbkpCgW2pQ", "Single-Leg Glute Bridge: A Step-by-Step Guide", None, "en"),
 "nordic":   ("K7Gr4M79JnY", "Nordic Hamstring Curl richtig ausführen (Zuhause, im Studio & Alternativen)", None, "de"),
 "calf1":    ("Ux47hU-ePXs", "How to Do Single Leg Calf Raises", None, "en"),
 "calf1db":  ("Ux47hU-ePXs", "How to Do Single Leg Calf Raises", None, "en"),
 "tib":      ("UmHbtN0iFMg", "How To Do a Tibialis Anterior Wall Raise", "Zenia Wood", "en"),
 "sideplank":("0M-erHBl48U", "Side Plank Tutorial - Proper Form + 5 Progressions", None, "en"),
 "legraise": ("vb-rnjF9g8A", "How to Do Lying Leg Raises", None, "en"),
 "hollowt":  ("HAfUt2Cco74", "HOLLOW BODY HOLD Progressions (Beginner to Advanced)", None, "en"),
 "hollow":   ("HAfUt2Cco74", "HOLLOW BODY HOLD Progressions (Beginner to Advanced)", None, "en"),
 "hangknee": ("MRcpnl4G3YA", "Hanging Knee Raise Tutorial - True Form", None, "en"),
 "jumpsq":   ("JbuaU19KVGM", "Squat Jump Progression", None, "en"),
 "broadjump":("z1IDJMMg024", "How to do the Broad Jump Properly", None, "en"),
 "dbpress":  ("bmy7tIopNt4", "Standing Dumbbell Shoulder Press (Tutorial + Tips)", None, "en"),
 "goblet":   ("zsN2WvklwDk", "Dumbbell Goblet Squat: Correct Form & Common Mistakes", None, "en"),
}
ex = [u["id"] for u in json.load(open("exercises.json"))["uebungen"]]
out = {"_meta": {
  "version": 1, "stand": "2026-11-01", "autor": "Claude B",
  "quelle": "Web-Suche vom 1.11.2026. Nur Links, die in Suchtreffern standen. Titel wie im Treffer.",
  "geprueft": False,
  "warnung": "youtube.com war aus der Arbeitsumgebung nicht erreichbar: Videos sind NICHT angeschaut, Kanal und Inhalt (auch Regel: keine okkulten Inhalte) sind nicht geprüft. Vor dem Einschalten jedes Video einmal ansehen und `geprueft` pro Eintrag auf true setzen. Ungeprüfte Videos zeigt die App nicht.",
  "einbetten": "https://www.youtube-nocookie.com/embed/{id} erst nach Tippen laden.",
  "ohneVideo": sorted(i for i in ex if i not in V)},
  "videos": {}}
for i in ex:
  if i in V:
    vid, titel, kanal, sprache = V[i]
    out["videos"][i] = {"id": vid, "url": f"https://www.youtube.com/watch?v={vid}", "titel": titel, "kanal": kanal, "sprache": sprache, "geprueft": False}
  else:
    out["videos"][i] = None
json.dump(out, open("videos.json", "w"), ensure_ascii=False, indent=1)
print(len(V), "mit Video,", len(out["_meta"]["ohneVideo"]), "ohne")
