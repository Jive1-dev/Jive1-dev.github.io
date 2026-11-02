// Echte Fotos statt Figur, wo es eine passende Aufnahme gibt (Claude A, Nacht 2).
// Quelle: free-exercise-db (github.com/yuhonas/free-exercise-db), Unlicense = Public Domain.
// Gestrichen (zeigten eine andere Ausführung als Benajas, Kritik B): deeppu, dip, benchdip, benchdips, rfly, legraise, calf1/2/1db, nordic, dbpress → 3D.
// Zwei Bilder pro Übung (Start, Ende) wechseln sich ab. Skills ohne Foto behalten die 3D-Figur.
const PHOTOS = {"pu": "Pushups", "incpu": "Incline_Push-Up", "declpu": "Decline_Push-Up", "hspu": "Handstand_Push-Ups", "triext": "Body_Tricep_Press", "curl": "Dumbbell_Bicep_Curl", "row": "One-Arm_Dumbbell_Row", "wristcurl": "Seated_Dumbbell_Palms-Up_Wrist_Curl", "revlunge": "Dumbbell_Rear_Lunge", "pullup": "Pullups", "negpu": "Pullups", "bridge": "Butt_Lift_Bridge", "thrust1": "Single_Leg_Glute_Bridge", "sideplank": "Side_Bridge", "crunch": "Crunches", "kneeraise": "Bent-Knee_Hip_Raise", "twist": "Russian_Twist", "jumpsq": "Freehand_Jump_Squat", "broadjump": "Standing_Long_Jump", "goblet": "Goblet_Squat", "hangknee": "Hanging_Leg_Raise", "squat": "Bodyweight_Squat", "catcow": "Cat_Stretch", "circles": "Arm_Circles", "hipflex": "Kneeling_Hip_Flexor", "calfstretch": "Calf_Stretch_Hands_Against_Wall"};
const photoSrc = (id, i) => `img/${PHOTOS[id]}_${i}.jpg`;
const hasPhoto = id => !!PHOTOS[id];
function photoBox(id, cls = ""){
  return `<figure class="photo ${cls}" data-pid="${id}" aria-label="Foto der Übung"><img src="${photoSrc(id, 0)}" alt="" decoding="async"><img class="ph-b" src="${photoSrc(id, 1)}" alt="" decoding="async">
    <figcaption><span class="pa">Start</span><span class="pb">Ende</span></figcaption></figure>`;
}
// Fotos nach dem Laden einblenden; wenn ein Bild fehlt (offline, noch nicht im Cache), zurück zur Figur
function mountPhotos(root){
  (root || document).querySelectorAll("figure.photo img").forEach(img => {
    const ok = () => img.closest("figure")?.classList.add("ready");
    if (img.complete && img.naturalWidth) ok(); else { img.addEventListener("load", ok, { once: true });
      img.addEventListener("error", () => { const f = img.closest("figure"); if (!f || !f.isConnected) return; const id = f.dataset.pid, w = document.createElement("div");
        w.innerHTML = figSVG(id, (typeof EX !== "undefined" && EX[id]?.muskeln) || [], f.classList.contains("thumb") ? "fig-thumb" : ""); f.replaceWith(w.firstElementChild || w); mountFigs(document.getElementById("view")); }, { once: true }); }
  });
}
// an bestehende mountFigs-Aufrufe anhängen (wie fig3d.js)
(() => { const prev = mountFigs; mountFigs = function(root){ prev(root); mountPhotos(root); }; })();
