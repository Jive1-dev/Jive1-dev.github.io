// Echte Fotos statt Figur, wo es eine passende Aufnahme gibt (Claude A, Nacht 2).
// Quelle: free-exercise-db (github.com/yuhonas/free-exercise-db), Unlicense = Public Domain.
// Zwei Bilder pro Übung (Start, Ende) wechseln sich ab. Skills ohne Foto behalten die 3D-Figur.
const PHOTOS = {"pu": "Pushups", "deeppu": "Pushups", "incpu": "Incline_Push-Up", "declpu": "Decline_Push-Up", "hspu": "Handstand_Push-Ups", "benchdip": "Bench_Dips", "benchdips": "Bench_Dips", "dip": "Dips_-_Triceps_Version", "triext": "Body_Tricep_Press", "curl": "Dumbbell_Bicep_Curl", "row": "One-Arm_Dumbbell_Row", "rfly": "Seated_Bent-Over_Rear_Delt_Raise", "wristcurl": "Seated_Dumbbell_Palms-Up_Wrist_Curl", "revlunge": "Dumbbell_Rear_Lunge", "pullup": "Pullups", "negpu": "Pullups", "bridge": "Butt_Lift_Bridge", "thrust1": "Single_Leg_Glute_Bridge", "calf1db": "Calf_Raise_On_A_Dumbbell", "sideplank": "Side_Bridge", "crunch": "Crunches", "legraise": "Flat_Bench_Lying_Leg_Raise", "kneeraise": "Bent-Knee_Hip_Raise", "twist": "Russian_Twist", "jumpsq": "Freehand_Jump_Squat", "broadjump": "Standing_Long_Jump", "dbpress": "Dumbbell_Shoulder_Press", "goblet": "Goblet_Squat", "hangknee": "Hanging_Leg_Raise", "squat": "Bodyweight_Squat", "nordic": "Natural_Glute_Ham_Raise", "catcow": "Cat_Stretch", "circles": "Arm_Circles", "hipflex": "Kneeling_Hip_Flexor", "calfstretch": "Calf_Stretch_Hands_Against_Wall", "calf2": "Calf_Raise_On_A_Dumbbell", "calf1": "Calf_Raise_On_A_Dumbbell"};
const photoSrc = (id, i) => `img/${PHOTOS[id]}_${i}.jpg`;
const hasPhoto = id => !!PHOTOS[id];
function photoBox(id, cls = ""){
  return `<figure class="photo ${cls}" data-pid="${id}" aria-label="Foto der Übung"><img src="${photoSrc(id, 0)}" alt="" decoding="async"><img class="ph-b" src="${photoSrc(id, 1)}" alt="" decoding="async">
    <figcaption>Start ↔ Ende · Foto: free-exercise-db</figcaption></figure>`;
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
