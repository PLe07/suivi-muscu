/* Suivi muscu Léopold — app installable (PWA).
   Données : localStorage sur le téléphone, synchronisées avec le dépôt privé PLe07/suivi-muscu-data
   (fichier data/suivi.json) grâce à un token GitHub saisi dans l'onglet Plus. */
(function () {
"use strict";

/* ---------- Configuration ---------- */
const DATA_REPO = "PLe07/suivi-muscu-data";
const VAPID_PUBLIC = "BCEI2u1482k-3IQi3ootVf93p5KR34y8_zLbJsrj9gTbtWPHvJaYAxC3-Dg2ESeHZB00WDzXqzvq3s2McjymQKw";
const SHORTCUT_NAME = "Pas Suivi";
const STEP_GOAL = 8000;

/* ---------- Programme ---------- */
const START = new Date(2026, 10, 23); // lundi de la semaine 1
const BILAN_DATES = ["2026-12-21", "2027-01-18", "2027-02-15"];
const JOURS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const JOURS_C = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const MOIS_C = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];

const ACT = {
  A: { nom:"Séance A", sous:"Pecs & triceps", lieu:"Chambre", duree:"40 min", type:"muscu", push:true },
  B: { nom:"Séance B", sous:"Tractions, dips, biceps", lieu:"Parc, barres dehors (vas-y à vélo)", duree:"45 min", type:"muscu", push:true },
  C: { nom:"Séance C", sous:"Pecs & bras, volume", lieu:"Chambre", duree:"40 min", type:"muscu", push:true },
  G: { nom:"Gainage", sous:"Abdos & tronc", lieu:"Chambre", duree:"15 min", type:"muscu", push:false },
  VELO: { nom:"Vélo", sous:"tranquille", lieu:"Dehors : tu peux parler, mais pas chanter", duree:"45 à 60 min", type:"cardio" },
  MARCHE: { nom:"Marche rapide", sous:"", lieu:"Dehors, rythme soutenu", duree:"30 à 45 min", type:"cardio" }
};
const ORDER = ["A","B","C","G","VELO","MARCHE"];
const SHORT = { A:"A · Pecs", B:"B · Parc", C:"C · Pecs & bras", G:"Gainage", VELO:"Vélo", MARCHE:"Marche" };
const DEFAULT_PLAN = [["A"],["VELO"],["MARCHE"],["C"],["G","VELO"],["B"],[]];
const ECHAUFF = ["1 min de jumping jacks","1 min de cercles de bras et de rotations d'épaules","10 pompes mains sur le lit","10 squats","30 s de planche"];

/* v = nom du fichier vidéo dans videos/ (sans .mp4), yt = recherche YouTube de secours */
const EX = {
  A: [
    { id:"a1", nom:"Pompes pieds surélevés", detail:"pieds sur le lit", series:4, min:10, max:15, u:"rép.", repos:90, c:"Haut des pecs. Corps gainé, coudes à 45° du corps.", v:"pompes-pieds-sureleves", yt:"pompes pieds surélevés technique" },
    { id:"a2", nom:"Pompes en déficit", detail:"mains sur 2 piles de livres", series:3, min:10, max:15, u:"rép.", repos:90, c:"La poitrine descend sous le niveau des mains, 3 s de descente.", v:"pompes-deficit", yt:"deficit push up technique" },
    { id:"a3", nom:"Dips sur chaise", detail:"dos à la chaise, jambes tendues", series:3, min:12, max:20, u:"rép.", repos:60, c:"Triceps. Épaules basses, coudes à 90° maximum.", v:"dips-chaise", yt:"dips sur chaise triceps technique" },
    { id:"a4", nom:"Pompes diamant", detail:"mains en losange sous la poitrine", series:3, min:8, max:15, u:"rép.", repos:60, c:"Triceps et intérieur des pecs.", v:"pompes-diamant", yt:"pompes diamant technique" },
    { id:"a5", nom:"Pike push-ups", detail:"corps en V, fesses en l'air", series:3, min:8, max:12, u:"rép.", repos:60, c:"Épaules : elles élargissent le haut du buste.", v:"pike-push-up", yt:"pike push up technique" },
    { id:"a6", nom:"Pompes classiques", detail:"une série, maximum moins 1", series:1, min:null, max:null, u:"rép.", repos:0, c:"Ton test de la semaine : le chiffre alimente ta courbe de progrès.", fin:true, v:"pompes", yt:"pompes technique parfaite" }
  ],
  B: [
    { id:"b1", nom:"Tractions pronation", detail:"paumes vers l'avant", series:4, min:5, max:12, u:"rép.", repos:120, c:"Moins de 5 ? Saute en haut et redescends en 5 s (négatives).", v:"tractions-pronation", yt:"traction pronation technique" },
    { id:"b2", nom:"Dips aux barres parallèles", detail:"", series:4, min:8, max:15, u:"rép.", repos:120, c:"Le meilleur exercice pecs + triceps sans matériel. Buste penché en avant = plus de pecs.", v:"dips-barres", yt:"dips barres parallèles pectoraux technique" },
    { id:"b3", nom:"Chin-ups", detail:"paumes vers toi", series:3, min:6, max:12, u:"rép.", repos:90, c:"Biceps. Menton au-dessus de la barre, descente contrôlée.", v:"chin-ups", yt:"chin up technique" },
    { id:"b4", nom:"Rowing australien", detail:"sous une barre basse", series:3, min:10, max:15, u:"rép.", repos:90, c:"Dos et biceps. La poitrine vient toucher la barre.", v:"rowing-australien", yt:"rowing australien technique" },
    { id:"b5", nom:"Relevés de genoux suspendu", detail:"", series:3, min:10, max:15, u:"rép.", repos:60, c:"Abdos, sans te balancer.", v:"releves-genoux-suspendu", yt:"relevé de genoux suspendu technique" }
  ],
  C: [
    { id:"c1", nom:"Pompes archer", detail:"pompes larges si trop dur", series:4, min:6, max:10, u:"rép./côté", repos:90, c:"Le bras tendu sur le côté aide à peine : tout passe par l'autre.", v:"pompes-archer", yt:"pompes archer technique" },
    { id:"c2", nom:"Pompes lestées", detail:"sac à dos de 5 à 10 kg", series:3, min:10, max:15, u:"rép.", repos:90, c:"Sac bien serré contre le dos. Note le poids du sac dans la note de séance.", v:"pompes-lestees", yt:"pompes lestées sac à dos" },
    { id:"c3", nom:"Rowing sous une table", detail:"table solide", series:4, min:8, max:15, u:"rép.", repos:90, c:"Allongé dessous, tire la poitrine vers le bord. Vérifie avant que la table ne bascule pas.", v:"rowing-table", yt:"rowing inversé sous une table" },
    { id:"c4", nom:"Curl biceps au sac à dos", detail:"", series:3, min:12, max:20, u:"rép.", repos:60, c:"Coudes collés au corps, 2 s de descente.", v:"curl-sac", yt:"curl biceps sac à dos maison" },
    { id:"c5", nom:"Extensions triceps", detail:"mains sur le rebord d'un bureau", series:3, min:10, max:15, u:"rép.", repos:60, c:"Seuls les coudes plient, le front descend vers les mains.", v:"extensions-triceps", yt:"bodyweight triceps extension" },
    { id:"c6", nom:"Planche", detail:"", series:3, min:45, max:45, u:"s", repos:45, c:"Fesses serrées, pas de dos creux.", v:"planche", yt:"planche gainage technique" }
  ],
  G: [
    { id:"g1", nom:"Planche", detail:"", series:3, min:45, max:60, u:"s", repos:45, c:"Fesses serrées, pas de dos creux.", v:"planche", yt:"planche gainage technique" },
    { id:"g2", nom:"Gainage latéral", detail:"par côté", series:3, min:30, max:45, u:"s/côté", repos:30, c:"Hanches hautes, corps bien aligné.", v:"gainage-lateral", yt:"gainage latéral technique" },
    { id:"g3", nom:"Hollow hold", detail:"épaules et jambes décollées", series:3, min:20, max:30, u:"s", repos:30, c:"Le bas du dos reste collé au sol du début à la fin.", v:"hollow-hold", yt:"hollow body hold technique" },
    { id:"g4", nom:"Relevés de jambes allongé", detail:"", series:3, min:12, max:15, u:"rép.", repos:45, c:"Jambes tendues, descente lente sans toucher le sol.", v:"releves-jambes", yt:"relevés de jambes allongé technique" },
    { id:"g5", nom:"Superman", detail:"allongé sur le ventre", series:3, min:12, max:15, u:"rép.", repos:30, c:"Bras et jambes décollés 2 s en haut : renforce le bas du dos.", v:"superman", yt:"exercice superman lombaires" }
  ]
};

const TODO = [
  { id:"t-tests", txt:"Tester tes maxima : pompes, pompes archer par côté, planche" },
  { id:"t-barre", txt:"Tester tractions et dips dès que tu as accès à une barre" },
  { id:"t-ruban", txt:"Mesurer ton tour de bras contracté et ton tour de poitrine" },
  { id:"t-photos", txt:"Prendre 3 photos de départ (face, profil, dos), même lumière" },
  { id:"t-parc", txt:"Trouver un parc de street workout ou une salle avec barres" },
  { id:"t-seances", txt:"Faire la séance A mercredi et la séance C vendredi" }
];

const DEFAULT_REGLAGES = { heureSeance:"18:30", heureParc:"06:30", heurePas:"20:00", heureBilan:"19:30", notifs:{ seance:true, pas:true, bilan:true, biody:true } };
const SEED = {
  profil: { prenom:"Léopold", poids:61, taille:170, naissance:"2007-08-19", _t:0 },
  bilans: { items:[{ date:"2026-11-17", poids:61, mg:11.69, mm:54.03, hydra:71.29, angle:7.8 }], _t:0 },
  tests: { items:[{ date:"2026-11-17", pompes:30, poids:61 }], _t:0 },
  "w-2026-11-16": { planning:[[],[],["A"],["MARCHE"],["C"],["G","VELO"],[]], _t:0 },
  reglages: Object.assign({}, DEFAULT_REGLAGES, { _t:0 })
};

/* ---------- Dates ---------- */
const pad2 = n => String(n).padStart(2, "0");
const ymd = d => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
const parseYmd = s => { const p = String(s).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const mondayOf = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return addDays(x, -((x.getDay() + 6) % 7)); };
const dayIdx = d => (d.getDay() + 6) % 7;
const weekNum = mon => Math.floor(Math.round((mon - START) / 86400000) / 7) + 1;
const fdate = k => { const d = parseYmd(k); return d.getDate() + " " + MOIS_C[d.getMonth()]; };
const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
const todayKey = () => ymd(new Date());
const hhmm = iso => { const d = new Date(iso); return isNaN(d) ? "" : pad2(d.getHours()) + " h " + pad2(d.getMinutes()); };

/* ---------- Utilitaires ---------- */
const isNum = v => typeof v === "number" && isFinite(v);
const fmt = (v, d) => isNum(v) ? v.toLocaleString("fr-FR", { maximumFractionDigits: d == null ? 1 : d }) : "—";
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const clone = o => o == null ? {} : JSON.parse(JSON.stringify(o));
const toNum = v => { if (v == null) return null; const s = String(v).trim().replace(/\s/g, "").replace(",", "."); if (s === "") return null; const n = Number(s); return isFinite(n) ? n : null; };
const byDate = (a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
const fmtClock = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ":" + pad2(m) : m) + ":" + pad2(x); };
const isStandalone = () => (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

/* ---------- Stockage local ---------- */
const LS = "suivi.v1", LS_TOK = "suivi.token", LS_RUN = "suivi.run";
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
let state = (function () {
  try { const s = JSON.parse(lsGet(LS) || "null"); if (s && s.docs) return s; } catch (e) {}
  return { docs: clone(SEED), pas: {}, meta: {} };
})();
for (const k in SEED) if (!state.docs[k]) state.docs[k] = clone(SEED[k]);
if (!state.pas) state.pas = {};
if (!state.meta) state.meta = {};
const D = id => state.docs[id];
function saveLocal() { lsSet(LS, JSON.stringify(state)); }
function write(id, data) { data._t = Date.now(); state.docs[id] = data; saveLocal(); scheduleSync(); }
const token = () => lsGet(LS_TOK) || "";
const reglages = () => { const r = D("reglages") || {}; return Object.assign({}, DEFAULT_REGLAGES, r, { notifs: Object.assign({}, DEFAULT_REGLAGES.notifs, r.notifs || {}) }); };

/* ---------- Synchronisation GitHub ---------- */
const S = { view:"aujourdhui", wOff:0, scope:"week", sel:null, addFor:null, open:{}, vid:{}, metric:"pompes", confirmDel:null, formMsg:{}, sync:"local", syncMsg:"", push:{ supported:false, sub:false }, msg:{} };
let syncTimer = null, syncing = false, syncAgain = false, pendingRender = false, pollUntil = 0;

function b64enc(str) { const bytes = new TextEncoder().encode(str); let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin); }
function b64dec(b64) { const bin = atob(String(b64).replace(/\s/g, "")); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return new TextDecoder().decode(bytes); }
function ghHeaders(json) { const h = { Authorization: "Bearer " + token(), Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }; if (json) h["Content-Type"] = "application/json"; return h; }
async function getFile(path) {
  const r = await fetch("https://api.github.com/repos/" + DATA_REPO + "/contents/" + path, { headers: ghHeaders(false), cache: "no-store" });
  if (r.status === 404) return { sha: null, json: null };
  if (!r.ok) throw { code: r.status };
  const j = await r.json();
  let json = null;
  try { json = JSON.parse(b64dec(j.content || "")); } catch (e) { json = null; }
  return { sha: j.sha, json: json };
}
async function putFile(path, obj, sha, message) {
  const body = { message: message, content: b64enc(JSON.stringify(obj, null, 1) + "\n") };
  if (sha) body.sha = sha;
  const r = await fetch("https://api.github.com/repos/" + DATA_REPO + "/contents/" + path, { method: "PUT", headers: ghHeaders(true), body: JSON.stringify(body) });
  if (!r.ok) throw { code: r.status };
  const j = await r.json();
  return j.content && j.content.sha;
}
async function dispatch(type, payload) {
  const r = await fetch("https://api.github.com/repos/" + DATA_REPO + "/dispatches", { method: "POST", headers: ghHeaders(true), body: JSON.stringify({ event_type: type, client_payload: payload || {} }) });
  if (r.status !== 204) throw { code: r.status };
}
function mergeRemote(rdocs) {
  let changed = false;
  for (const id in rdocs) {
    const r = rdocs[id], l = state.docs[id];
    if (r && typeof r === "object" && (!l || (r._t || 0) > (l._t || 0))) { state.docs[id] = r; changed = true; }
  }
  return changed;
}
function localAhead(rdocs) {
  for (const id in state.docs) { const l = state.docs[id], r = rdocs[id]; if ((l._t || 0) > 0 && (!r || (l._t || 0) > (r._t || 0))) return true; }
  return false;
}
function scheduleSync(ms) { if (!token()) return; clearTimeout(syncTimer); syncTimer = setTimeout(sync, ms == null ? 2500 : ms); }
async function sync() {
  if (!token()) { setSync("local"); return; }
  if (!navigator.onLine) { setSync("offline"); return; }
  if (syncing) { syncAgain = true; return; }
  syncing = true; setSync("sync");
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const f = await getFile("data/suivi.json");
      const rdocs = (f.json && f.json.docs) || {};
      if (mergeRemote(rdocs)) { saveLocal(); renderSoft(); }
      if (!localAhead(rdocs)) break;
      try {
        await putFile("data/suivi.json", { app: "suivi-muscu", updatedAt: new Date().toISOString(), docs: state.docs }, f.sha, "Suivi : mise à jour depuis l'app");
        break;
      } catch (e) { if (e && (e.code === 409 || e.code === 422) && attempt < 2) continue; throw e; }
    }
    const p = await getFile("data/pas.json");
    if (p.json && typeof p.json === "object") {
      const before = JSON.stringify(state.pas);
      state.pas = p.json;
      if (JSON.stringify(state.pas) !== before) { saveLocal(); renderSoft(); }
    }
    state.meta.lastSync = new Date().toISOString(); saveLocal();
    setSync("ok");
  } catch (e) {
    const c = e && e.code;
    setSync(c === 401 || c === 403 || c === 404 ? "badtoken" : "offline");
  } finally {
    syncing = false;
    if (syncAgain) { syncAgain = false; scheduleSync(800); }
  }
}
function setSync(s) { S.sync = s; renderStatus(); }
const $status = document.getElementById("status");
function renderStatus() {
  const map = { local:["Pas de synchro","local"], sync:["Synchro…","sync"], ok:["Synchronisé","ok"], offline:["Hors ligne","local"], badtoken:["Token refusé","err"] };
  const m = map[S.sync] || map.local;
  $status.textContent = m[0];
  $status.className = "status " + m[1];
}
$status.addEventListener("click", () => { if (token()) sync(); else { location.hash = "#plus"; } });

/* ---------- Planning ---------- */
const cleanPlan = p => p.map(d => (Array.isArray(d) ? d : []).filter(c => ACT[c]));
function template() { const p = D("planning"); return (p && Array.isArray(p.days) && p.days.length === 7) ? cleanPlan(p.days) : DEFAULT_PLAN.map(d => d.slice()); }
function planFor(mk) { const w = D("w-" + mk); return (w && Array.isArray(w.planning) && w.planning.length === 7) ? cleanPlan(w.planning) : template(); }
function hasOverride(mk) { const w = D("w-" + mk); return !!(w && Array.isArray(w.planning)); }
function doneCounts(mon) {
  const c = {};
  for (let i = 0; i < 7; i++) {
    const j = D("j-" + ymd(addDays(mon, i)));
    if (j && j.fait) for (const k in j.fait) if (j.fait[k] && ACT[k]) c[k] = (c[k] || 0) + 1;
  }
  return c;
}
function doneMap(mon, plan) {
  const left = doneCounts(mon);
  const res = plan.map(d => d.map(() => false));
  for (let i = 0; i < 7; i++) {
    const j = D("j-" + ymd(addDays(mon, i)));
    plan[i].forEach((c, x) => { if (j && j.fait && j.fait[c] && left[c] > 0) { res[i][x] = true; left[c]--; } });
  }
  for (let i = 0; i < 7; i++) plan[i].forEach((c, x) => { if (!res[i][x] && left[c] > 0) { res[i][x] = true; left[c]--; } });
  return res;
}
function weekStats(mon, plan, upto) {
  const planned = {}, done = doneCounts(mon);
  for (let i = 0; i < 7; i++) {
    if (upto && ymd(addDays(mon, i)) > upto) continue;
    plan[i].forEach(c => { planned[c] = (planned[c] || 0) + 1; });
  }
  let pm = 0, dm = 0, pc = 0, dc = 0;
  for (const c in planned) {
    const m = Math.min(planned[c], done[c] || 0);
    if (ACT[c].type === "muscu") { pm += planned[c]; dm += m; } else { pc += planned[c]; dc += m; }
  }
  return { pm, dm, pc, dc };
}
function pushWarnings(plan) {
  const out = [];
  const isPush = d => d.filter(c => ACT[c] && ACT[c].push);
  for (let i = 0; i < 7; i++) {
    const a = isPush(plan[i]);
    if (a.length > 1) out.push(JOURS[i] + " : deux séances pecs le même jour. Répartis-les.");
    if (i < 6) {
      const b = isPush(plan[i + 1]);
      if (a.length && b.length) out.push(JOURS[i] + " (" + a.join(", ") + ") puis " + JOURS[i + 1].toLowerCase() + " (" + b.join(", ") + ") : garde 48 h entre deux séances pecs et bras.");
    }
  }
  return out;
}
function regularity() {
  const now = new Date(), cur = weekNum(mondayOf(now)), t = ymd(now);
  let pm = 0, dm = 0;
  for (let w = 1; w <= Math.min(cur, 12); w++) {
    const mon = addDays(START, (w - 1) * 7), mk = ymd(mon);
    const st = weekStats(mon, planFor(mk), w === cur ? t : null);
    pm += st.pm; dm += st.dm;
  }
  return { pm, dm, pct: pm ? Math.round(dm / pm * 100) : null };
}
function pasFor(date) {
  const a = state.pas && state.pas[date];
  if (a && isNum(a.pas)) return { v: a.pas, auto: true, at: a.at };
  const j = D("j-" + date);
  if (j && isNum(j.pas)) return { v: j.pas, auto: false };
  return null;
}

/* ---------- Phases ---------- */
function phase(w) {
  if (w <= 0) return { nom:"S0 · Tests et mise en route", tip:"Semaine de mise en route : 3 séries par exercice, technique propre avant tout." };
  if (w <= 4) return { nom:"S" + w + "/12 · Phase 1 · Base", tip:"Phase base : monte les répétitions dans la fourchette avec une technique propre." };
  if (w === 6) return { nom:"S6/12 · Semaine allégée", tip:"Semaine allégée (fêtes) : 2 séries par exercice. On récupère, on ne s'arrête pas." };
  if (w <= 8) return { nom:"S" + w + "/12 · Phase 2 · Volume", tip:"Phase volume : +1 série sur les 2 premiers exercices, descente en 3 s sur toutes les pompes." };
  if (w <= 12) return { nom:"S" + w + "/12 · Phase 3 · Intensité", tip:"Phase intensité : sac plus lourd, pause de 2 s en bas des pompes, dernière série en dégressif (pieds surélevés, puis classiques, puis genoux, sans repos)." };
  return { nom:"Cycle de 12 semaines terminé", tip:"Cycle terminé : fais ton bilan final, on prépare le cycle suivant." };
}
function setsFor(code, i, ex, w) {
  if (ex.fin) return 1;
  let s = ex.series;
  if (w === 6) return Math.min(s, 2);
  if (w <= 0) return Math.min(s, 3);
  if (w >= 5 && w <= 12 && (code === "A" || code === "B" || code === "C") && i < 2) s += 1;
  return s;
}
function target(ex, n) {
  if (ex.fin) return "1 × max − 1";
  const r = ex.min === ex.max ? ex.min : ex.min + "-" + ex.max;
  return n + " × " + r + " " + ex.u;
}
const restLabel = r => r < 60 ? r + " s" : (r % 60 === 0 ? (r / 60) + " min" : Math.floor(r / 60) + " min " + pad2(r % 60));
const isTimed = ex => ex.u.charAt(0) === "s";

/* ---------- Données de séance ---------- */
function lastFor(code, exId, before) {
  let best = null;
  for (const id in state.docs) {
    if (id.slice(0, 2) !== "s-") continue;
    const d = state.docs[id];
    if (!d || d.code !== code || !(d.date < before)) continue;
    const v = d.sets && d.sets[exId];
    if (!Array.isArray(v) || !v.some(isNum)) continue;
    if (!best || d.date > best.date) best = { date: d.date, v: v };
  }
  return best;
}
function shouldLevelUp(ex, last) {
  if (!last || ex.fin || ex.max == null) return false;
  const vals = last.v.filter(isNum);
  if (vals.length < Math.min(2, ex.series)) return false;
  return vals.every(v => v >= ex.max);
}
const items = id => { const d = D(id); return (d && Array.isArray(d.items)) ? d.items.slice() : []; };
function latestWeight() {
  const all = items("tests").concat(items("bilans")).filter(x => isNum(x.poids)).sort(byDate);
  if (all.length) return all[all.length - 1].poids;
  const p = D("profil"); return p && isNum(p.poids) ? p.poids : null;
}
function metricSeries(m) {
  let pts = [];
  const tests = items("tests"), bil = items("bilans");
  if (m === "pompes") {
    tests.forEach(t => { if (isNum(t.pompes)) pts.push({ d: t.date, v: t.pompes }); });
    for (const id in state.docs) {
      if (id.slice(0, 2) !== "s-") continue;
      const s = state.docs[id];
      if (s && s.code === "A" && s.sets && Array.isArray(s.sets.a6) && isNum(s.sets.a6[0])) pts.push({ d: s.date, v: s.sets.a6[0] + 1 });
    }
  } else if (m === "poids") {
    tests.concat(bil).forEach(t => { if (isNum(t.poids)) pts.push({ d: t.date, v: t.poids }); });
  } else if (m === "mg") {
    bil.forEach(t => { if (isNum(t.mg)) pts.push({ d: t.date, v: t.mg }); });
  } else if (m === "bras") {
    tests.forEach(t => { if (isNum(t.bras)) pts.push({ d: t.date, v: t.bras }); });
  } else if (m === "pas") {
    const now = new Date();
    for (let i = 27; i >= 0; i--) { const k = ymd(addDays(now, -i)); const p = pasFor(k); if (p) pts.push({ d: k, v: p.v }); }
  }
  pts.sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0);
  const out = [];
  pts.forEach(p => {
    const prev = out[out.length - 1];
    if (prev && prev.d === p.d) { if (m === "pompes") prev.v = Math.max(prev.v, p.v); else prev.v = p.v; }
    else out.push({ d: p.d, v: p.v });
  });
  return out;
}

/* ---------- Chrono de séance et minuteurs ---------- */
const $runbar = document.getElementById("runbar"), $runTime = document.getElementById("run-time"), $runLbl = document.getElementById("run-lbl"), $runEl = document.getElementById("run-el");
const $cd = document.getElementById("cd"), $cdTime = document.getElementById("cd-time"), $cdLbl = document.getElementById("cd-lbl"), $cdStop = document.getElementById("cd-stop");
let run = (function () { try { return JSON.parse(lsGet(LS_RUN) || "null"); } catch (e) { return null; } })();
let cd = null, ticker = null, actx = null, wakeLock = null, lastBeep = -1;
function audio() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); } catch (e) { actx = null; } }
function beep(freq, dur) {
  if (!actx) return;
  try {
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
    o.frequency.value = freq || 880;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.25));
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + (dur || 0.25) + 0.05);
  } catch (e) {}
}
async function keepAwake(on) {
  try {
    if (on && "wakeLock" in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => { wakeLock = null; }); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { wakeLock = null; }
}
function startRun(code, date) {
  audio();
  run = { code: code, date: date, start: Date.now() };
  lsSet(LS_RUN, JSON.stringify(run));
  keepAwake(true); startTicker(); render();
}
function stopRun() { run = null; lsDel(LS_RUN); keepAwake(false); updateBar(); }
function startCountdown(sec, label, kind) {
  audio();
  cd = { end: Date.now() + sec * 1000, label: label, kind: kind };
  lastBeep = -1; startTicker();
}
function stopCountdown() { cd = null; updateBar(); }
function startTicker() { if (!ticker) ticker = setInterval(updateBar, 250); updateBar(); }
function updateBar() {
  const showRun = !!run, showCd = !!cd;
  $runbar.hidden = !(showRun || showCd);
  if (showRun) {
    $runEl.hidden = false;
    $runTime.textContent = fmtClock((Date.now() - run.start) / 1000);
    $runLbl.textContent = (ACT[run.code] ? ACT[run.code].nom : "Séance") + " en cours";
  } else $runEl.hidden = true;
  if (showCd) {
    const left = Math.ceil((cd.end - Date.now()) / 1000);
    $cd.hidden = false; $cdStop.hidden = false;
    $cd.classList.toggle("hold", cd.kind === "hold");
    if (left > 0) {
      $cdTime.textContent = fmtClock(left); $cdLbl.textContent = cd.label;
      if (left <= 3 && left !== lastBeep) { lastBeep = left; beep(660, 0.12); }
    } else {
      beep(990, 0.6);
      try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
      const k = cd.kind;
      $cdTime.textContent = k === "hold" ? "Terminé" : "C'est reparti";
      $cdLbl.textContent = k === "hold" ? "Souffle, puis repos" : "Série suivante";
      cd = null;
      setTimeout(() => { if (!cd) { $cd.hidden = true; $cdStop.hidden = true; if (!run) $runbar.hidden = true; } }, 3500);
      return;
    }
  } else { $cd.hidden = true; $cdStop.hidden = true; }
  if (!showRun && !showCd && ticker) { clearInterval(ticker); ticker = null; }
}
$cdStop.addEventListener("click", stopCountdown);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") { if (run) keepAwake(true); if (token()) sync(); }
});

/* ---------- Rendu ---------- */
const $app = document.getElementById("app");
const $tag = document.getElementById("weektag");
function render() {
  pendingRender = false;
  let h;
  if (S.view === "semaine") h = vWeek();
  else if (S.view === "seances") h = vSessions();
  else if (S.view === "progres") h = vProgress();
  else if (S.view === "plus") h = vPlus();
  else h = vToday();
  $app.innerHTML = h;
  document.querySelectorAll("nav.tabs a").forEach(a => {
    if (a.dataset.v === S.view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  $tag.textContent = phase(weekNum(mondayOf(new Date()))).nom;
  updateBar();
}
function renderSoft() {
  const ae = document.activeElement;
  if (ae && $app.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) { pendingRender = true; return; }
  const playing = $app.querySelector("video");
  if (playing && !playing.paused) { pendingRender = true; return; }
  render();
}
const ytLink = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);

/* Aujourd'hui */
function installCard() {
  if (isStandalone()) return "";
  return '<div class="card hint"><h3>Installe l\'app sur ton iPhone</h3><p class="mt">Dans Safari : bouton Partager, puis <strong>Sur l\'écran d\'accueil</strong>. Ouvre ensuite l\'app depuis son icône : c\'est indispensable pour recevoir les notifications.</p></div>';
}
function todoCard() {
  const t = D("todo") || {}, done = t.done || {};
  const n = TODO.filter(x => done[x.id]).length;
  return '<div class="card"><div class="between"><h3>Semaine de tests</h3><span class="pill ' + (n === TODO.length ? "good" : "") + '">' + n + "/" + TODO.length + "</span></div>" +
    '<div class="todo">' + TODO.map(x => '<label for="' + x.id + '"><input type="checkbox" id="' + x.id + '" data-act="todo" data-id="' + x.id + '"' + (done[x.id] ? " checked" : "") + "><span>" + esc(x.txt) + "</span></label>").join("") + "</div>" +
    '<p class="small muted mt">Note tes résultats dans <a href="#progres">Progrès</a> : ils deviennent ton point de départ.</p></div>';
}
function videoBlock(ex, key) {
  if (!S.vid[key]) return "";
  return '<div class="vid" data-yt="' + esc(ex.yt) + '"><video src="videos/' + esc(ex.v) + '.mp4" playsinline muted loop autoplay controls preload="metadata"></video>' +
    '<div class="vfoot"><a href="' + ytLink(ex.yt) + '" target="_blank" rel="noopener">Autres démos sur YouTube</a></div></div>';
}
function sessionBody(code, t) {
  const w = weekNum(mondayOf(parseYmd(t)));
  const doc = D("s-" + t + "-" + code) || {};
  const running = run && run.code === code && run.date === t;
  let h = "";
  if (!running) h += '<button type="button" class="btn" data-act="start" data-code="' + code + '" data-date="' + t + '">Démarrer la séance</button>';
  else h += '<p class="tip">Séance en cours : le chrono tourne en bas de l\'écran et l\'écran reste allumé.</p>';
  if (code !== "G") h += '<details class="warm mt"><summary>Échauffement · 5 min</summary><ul>' + ECHAUFF.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></details>";
  if (code !== "G") h += '<p class="tip mt">' + esc(phase(w).tip) + "</p>";
  h += '<div class="mt">';
  EX[code].forEach((ex, i) => {
    const n = setsFor(code, i, ex, w);
    const vals = (doc.sets && Array.isArray(doc.sets[ex.id])) ? doc.sets[ex.id] : [];
    const last = lastFor(code, ex.id, t);
    const vkey = t + "-" + ex.id;
    let inputs = "";
    for (let k = 0; k < n; k++) {
      const v = isNum(vals[k]) ? vals[k] : "";
      const iid = "in-" + t + "-" + ex.id + "-" + k;
      inputs += '<label for="' + iid + '"><span class="lbl">' + (ex.fin ? "Max − 1" : "Série " + (k + 1)) + '</span><input id="' + iid + '" type="number" inputmode="numeric" min="0" max="999" step="1" value="' + v + '" placeholder="' + (isTimed(ex) ? "s" : "rép.") + '" data-act="set" data-code="' + code + '" data-date="' + t + '" data-ex="' + ex.id + '" data-i="' + k + '" data-n="' + n + '"></label>';
    }
    let btns = '<button type="button" class="btn sm ghost" data-act="video" data-key="' + vkey + '" aria-expanded="' + !!S.vid[vkey] + '">' + (S.vid[vkey] ? "Masquer la vidéo" : "▶ Technique") + "</button>";
    if (isTimed(ex)) btns += '<button type="button" class="btn sm" data-act="hold" data-s="' + ex.min + '" data-l="' + esc(ex.nom) + '">Chrono ' + ex.min + " s</button>";
    if (ex.repos) btns += '<button type="button" class="btn sm ghost" data-act="rest" data-s="' + ex.repos + '">Repos ' + restLabel(ex.repos) + "</button>";
    h += '<div class="ex"><div class="ex-head"><div class="ex-name">' + (i + 1) + ". " + esc(ex.nom) + (ex.detail ? ' <span class="ex-detail">· ' + esc(ex.detail) + "</span>" : "") + '</div><div class="ex-target">' + esc(target(ex, n)) + "</div></div>" +
      '<div class="ex-c">' + esc(ex.c) + "</div>" + videoBlock(ex, vkey) +
      '<div class="sets">' + inputs + "</div>" +
      '<div class="row">' + btns + "</div>" +
      (last ? '<div class="last">Dernière fois (' + fdate(last.date) + ") : " + last.v.map(x => isNum(x) ? x : "–").join(" · ") + "</div>" : "") +
      (shouldLevelUp(ex, last) ? '<div class="up">Haut de fourchette atteint : passe à la variante plus dure ou ajoute 2 à 3 kg dans le sac.</div>' : "") +
      "</div>";
  });
  h += "</div>";
  const nid = "note-" + t + "-" + code;
  h += '<label class="f mt" for="' + nid + '">Note de séance (poids du sac, ressenti, douleur…)<textarea id="' + nid + '" data-act="note" data-code="' + code + '" data-date="' + t + '">' + esc(doc.note || "") + "</textarea></label>";
  if (isNum(doc.duree)) h += '<p class="small muted mt">Durée enregistrée : ' + doc.duree + " min</p>";
  return h;
}
function actCard(code, t, j, isExtra) {
  const a = ACT[code];
  const done = !!(j.fait && j.fait[code]);
  const key = t + code;
  const defOpen = a.type === "muscu" && !done;
  const open = (key in S.open) ? S.open[key] : defOpen;
  let h = '<div class="card ' + (done ? "isdone" : "main") + '">';
  h += '<div class="between"><div><h3>' + esc(a.nom) + (a.sous ? ' <span class="sous">· ' + esc(a.sous) + "</span>" : "") + '</h3><p class="small muted">' + esc(a.lieu) + " · " + esc(a.duree) + "</p></div>" + (done ? '<span class="pill good">Fait</span>' : (isExtra ? '<span class="pill">En plus</span>' : "")) + "</div>";
  if (a.type === "muscu") { if (open) h += '<div class="mt">' + sessionBody(code, t) + "</div>"; }
  else if (code === "VELO") h += '<p class="small mt">Les jours de parc, y aller à vélo compte déjà.</p>';
  h += '<div class="row mt">';
  h += '<button type="button" class="btn ' + (done ? "quiet" : "good") + '" data-act="done" data-code="' + code + '" data-date="' + t + '">' + (done ? "Annuler « fait »" : (a.type === "muscu" ? "Séance terminée" : "C'est fait")) + "</button>";
  if (a.type === "muscu") h += '<button type="button" class="btn ghost" data-act="open" data-key="' + key + '" data-def="' + (defOpen ? 1 : 0) + '">' + (open ? "Replier" : "Voir la séance") + "</button>";
  if (isExtra && !done) h += '<button type="button" class="btn quiet" data-act="unextra" data-code="' + code + '" data-date="' + t + '">Retirer</button>';
  h += "</div></div>";
  return h;
}
function stepsCard(t) {
  const p = pasFor(t);
  const j = D("j-" + t) || {};
  const pct = p ? Math.min(100, Math.round(p.v / STEP_GOAL * 100)) : 0;
  let h = '<div class="card"><div class="between"><h3>Pas du jour</h3><span class="small muted">objectif 8 000</span></div>';
  h += '<div class="row mt" style="align-items:baseline"><span class="bigsteps">' + (p ? fmt(p.v, 0) : "—") + "</span>" +
    (p ? '<span class="small muted">' + (p.auto ? "depuis Santé" + (p.at ? " à " + hhmm(p.at) : "") : "saisis à la main") + "</span>" : "") + "</div>";
  h += '<div class="bar mt' + (pct >= 100 ? " ok" : "") + '"><i style="width:' + pct + '%"></i></div>';
  if (p && p.v < STEP_GOAL) h += '<p class="small mt">Il t\'en manque ' + fmt(STEP_GOAL - p.v, 0) + ", soit environ " + Math.max(5, Math.round((STEP_GOAL - p.v) / 100 / 5) * 5) + " min de marche.</p>";
  h += '<div class="row mt"><a class="btn sm" href="shortcuts://run-shortcut?name=' + encodeURIComponent(SHORTCUT_NAME) + '" data-act="health">Mettre à jour depuis Santé</a></div>';
  h += '<details class="warm mt"><summary>Saisir à la main</summary><label class="f mt" for="pas-' + t + '" style="max-width:200px">Nombre de pas<input id="pas-' + t + '" type="number" inputmode="numeric" min="0" step="100" value="' + (isNum(j.pas) ? j.pas : "") + '" data-act="pas" data-date="' + t + '"></label></details>';
  return h + "</div>";
}
function vToday() {
  const now = new Date(), t = ymd(now), mon = mondayOf(now), di = dayIdx(now), w = weekNum(mon);
  const plan = planFor(ymd(mon));
  const j = D("j-" + t) || {};
  const planned = plan[di];
  const extra = (Array.isArray(j.extra) ? j.extra : []).filter(c => ACT[c] && planned.indexOf(c) < 0);
  let h = '<p class="date">' + JOURS[di] + " " + now.getDate() + " " + MOIS[now.getMonth()] + '</p><div class="stack">';
  h += installCard();
  if (!planned.length && !extra.length) h += '<div class="card"><h3>Repos</h3><p class="muted mt">Rien de prévu aujourd\'hui. Marche quand même : objectif 8 000 pas.</p></div>';
  planned.forEach(c => { h += actCard(c, t, j, false); });
  extra.forEach(c => { h += actCard(c, t, j, true); });
  if (w <= 0) h += todoCard();
  h += stepsCard(t);
  const others = ORDER.filter(c => planned.indexOf(c) < 0 && extra.indexOf(c) < 0);
  if (others.length) h += '<div class="card"><h3>Faire autre chose aujourd\'hui</h3><p class="small muted">Séance ratée hier ? Rattrape-la ici, elle compte pour la semaine.</p><div class="row mt">' + others.map(c => '<button type="button" class="chip' + (ACT[c].push ? " push" : "") + '" data-act="extra" data-code="' + c + '" data-date="' + t + '">+ ' + esc(SHORT[c]) + "</button>").join("") + "</div></div>";
  if (di === 6) h += '<div class="card main"><h3>C\'est dimanche : bilan de la semaine</h3><p class="mt">Sommeil, ressenti, note : 1 minute dans <a href="#semaine">Semaine</a>. Je m\'en sers pour ajuster ton programme.</p></div>';
  return h + "</div>";
}

/* Semaine */
function vWeek() {
  const now = new Date(), tk = ymd(now);
  const mon = addDays(mondayOf(now), S.wOff * 7), mk = ymd(mon), w = weekNum(mon);
  const tpl = S.scope === "tpl";
  const plan = tpl ? template() : planFor(mk);
  const dm = tpl ? null : doneMap(mon, plan);
  let h = '<div class="weeknav"><button type="button" class="btn sm ghost nav-arrow" data-act="wnav" data-d="-1" aria-label="Semaine précédente">‹</button>' +
    '<div class="t">' + (tpl ? "Planning type" : "Semaine du " + fdate(mk)) + "<small>" + (tpl ? "s'applique à toutes les semaines" : esc(phase(w).nom)) + "</small></div>" +
    '<button type="button" class="btn sm ghost nav-arrow" data-act="wnav" data-d="1" aria-label="Semaine suivante">›</button></div>';
  h += '<div class="between"><div class="seg" role="group" aria-label="Ce que tu modifies"><button type="button" data-act="scope" data-s="week" aria-pressed="' + (!tpl) + '">Cette semaine</button><button type="button" data-act="scope" data-s="tpl" aria-pressed="' + tpl + '">Planning type</button></div>' +
    (!tpl && hasOverride(mk) ? '<span class="pill warn">Modifiée</span>' : "") + "</div>";
  h += '<p class="small muted mt">Touche une séance pour la déplacer ou la retirer. ' + (tpl ? "Les changements valent pour toutes les semaines sans modification propre." : "Les changements valent pour cette semaine seulement.") + "</p>";
  const warns = pushWarnings(plan);
  if (warns.length) h += '<div class="stack mt">' + warns.map(x => '<div class="warnbox">' + esc(x) + "</div>").join("") + "</div>";
  h += '<div class="card mt">';
  for (let i = 0; i < 7; i++) {
    const dk = ymd(addDays(mon, i));
    const isToday = !tpl && dk === tk;
    const p = tpl ? null : pasFor(dk);
    h += '<div class="day' + (isToday ? " today" : "") + '"><div><div class="dname">' + JOURS_C[i] + "</div>" + (tpl ? "" : '<div class="ddate">' + fdate(dk) + (isToday ? " · auj." : "") + "</div>") + '</div><div class="chips">';
    if (!plan[i].length) h += '<span class="rest-day">Repos</span>';
    plan[i].forEach((c, x) => {
      const sel = S.sel && S.sel.day === i && S.sel.idx === x;
      const done = dm && dm[i][x];
      h += '<button type="button" class="chip' + (ACT[c].push ? " push" : "") + (done ? " done" : "") + (sel ? " sel" : "") + '" data-act="chip" data-day="' + i + '" data-idx="' + x + '" aria-pressed="' + !!sel + '">' + (done ? "✓ " : "") + esc(SHORT[c]) + "</button>";
    });
    h += '<button type="button" class="chip add" data-act="addopen" data-day="' + i + '" aria-label="Ajouter une activité le ' + JOURS[i].toLowerCase() + '">+</button>';
    if (p) h += '<span class="small muted">' + fmt(p.v, 0) + " pas</span>";
    h += "</div>";
    if (S.sel && S.sel.day === i && plan[i][S.sel.idx]) {
      h += '<div class="menu"><span class="lab">Déplacer « ' + esc(SHORT[plan[i][S.sel.idx]]) + " » vers</span>" +
        JOURS_C.map((d, k) => k === i ? "" : '<button type="button" class="btn sm ghost" data-act="move" data-to="' + k + '">' + d + "</button>").join("") +
        '<button type="button" class="btn sm quiet" data-act="remove">Retirer</button><button type="button" class="btn sm quiet" data-act="cancel">Annuler</button></div>';
    }
    if (S.addFor === i) {
      h += '<div class="menu"><span class="lab">Ajouter le ' + JOURS[i].toLowerCase() + "</span>" + ORDER.map(c => '<button type="button" class="btn sm ghost" data-act="add" data-code="' + c + '">' + esc(SHORT[c]) + "</button>").join("") + '<button type="button" class="btn sm quiet" data-act="cancel">Annuler</button></div>';
    }
    h += "</div>";
  }
  h += "</div>";
  const canReset = tpl ? !!D("planning") : hasOverride(mk);
  if (canReset) h += '<div class="row mt"><button type="button" class="btn sm quiet" data-act="reset">' + (tpl ? "Revenir au planning conseillé" : "Annuler les changements de cette semaine") + "</button></div>";
  if (!tpl) {
    const st = weekStats(mon, plan, null);
    const steps = [];
    for (let i = 0; i < 7; i++) { const p = pasFor(ymd(addDays(mon, i))); if (p && p.v > 0) steps.push(p.v); }
    const avg = steps.length ? Math.round(steps.reduce((a, b) => a + b, 0) / steps.length) : null;
    h += "<h2>Bilan de la semaine</h2>";
    h += '<div class="tiles"><div class="card tile"><div class="big">' + st.dm + "/" + st.pm + '</div><div class="lbl">Muscu faite</div></div>' +
      '<div class="card tile"><div class="big">' + st.dc + "/" + st.pc + '</div><div class="lbl">Cardio fait</div></div>' +
      '<div class="card tile"><div class="big">' + (avg == null ? "—" : fmt(avg, 0)) + '</div><div class="lbl">Pas / jour (moy.)</div></div>' +
      '<div class="card tile"><div class="big">' + (st.pm ? Math.round(st.dm / st.pm * 100) + " %" : "—") + '</div><div class="lbl">Régularité</div></div></div>';
    const wd = D("w-" + mk) || {};
    h += '<div class="card mt stack"><label class="f" for="som-' + mk + '" style="max-width:220px">Sommeil moyen (heures par nuit)<input id="som-' + mk + '" type="number" inputmode="decimal" min="0" max="14" step="0.5" value="' + (isNum(wd.sommeil) ? wd.sommeil : "") + '" data-act="wfield" data-f="sommeil" data-mk="' + mk + '"></label>' +
      '<div><div class="small muted" style="font-weight:700;margin-bottom:6px">Ressenti de la semaine (1 = dur, 5 = au top)</div><div class="rating" role="group" aria-label="Ressenti">' +
      [1, 2, 3, 4, 5].map(v => '<button type="button" data-act="ressenti" data-v="' + v + '" data-mk="' + mk + '" aria-pressed="' + (wd.ressenti === v) + '">' + v + "</button>").join("") + "</div></div>" +
      '<label class="f" for="wn-' + mk + '">Note pour ton coach (douleur, séance ratée, envie de changer un exercice…)<textarea id="wn-' + mk + '" data-act="wfield" data-f="note" data-mk="' + mk + '">' + esc(wd.note || "") + "</textarea></label></div>";
  }
  return h;
}

/* Séances */
function vSessions() {
  const w = weekNum(mondayOf(new Date()));
  let h = '<h2>Les séances</h2><p class="muted">Séries affichées pour cette semaine (' + esc(phase(w).nom) + "). Arrête chaque série quand il te reste 1 ou 2 répétitions propres en réserve.</p>";
  h += '<div class="stack mt">';
  ["A", "B", "C", "G"].forEach(code => {
    const a = ACT[code];
    h += '<div class="card"><h3>' + esc(a.nom) + ' <span class="sous">· ' + esc(a.sous) + '</span></h3><p class="small muted">' + esc(a.lieu) + " · " + esc(a.duree) + "</p>";
    if (code !== "G") h += '<details class="warm mt"><summary>Échauffement · 5 min</summary><ul>' + ECHAUFF.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></details>";
    h += '<div class="mt">';
    EX[code].forEach((ex, i) => {
      const vkey = "lib-" + ex.id;
      h += '<div class="ex"><div class="ex-head"><div class="ex-name">' + esc(ex.nom) + (ex.detail ? ' <span class="ex-detail">· ' + esc(ex.detail) + "</span>" : "") + '</div><div class="ex-target">' + esc(target(ex, setsFor(code, i, ex, w))) + "</div></div>" +
        '<div class="ex-c">' + esc(ex.c) + (ex.repos ? " Repos " + restLabel(ex.repos) + "." : "") + "</div>" + videoBlock(ex, vkey) +
        '<div class="row"><button type="button" class="btn sm ghost" data-act="video" data-key="' + vkey + '" aria-expanded="' + !!S.vid[vkey] + '">' + (S.vid[vkey] ? "Masquer la vidéo" : "▶ Technique") + "</button></div></div>";
    });
    h += "</div>";
    if (code === "B") h += '<p class="small mt">Pas d\'accès aux barres cette semaine : refais la séance C à la place. L\'achat le plus rentable pour ta chambre : une barre de traction de porte (environ 20 à 40 €).</p>';
    if (code === "G") h += '<p class="small mt">Enchaîne avec ta sortie vélo. Tes jambes travaillent déjà avec le vélo et la marche.</p>';
    h += "</div>";
  });
  h += "</div>";
  h += '<h2>Monter d\'un cran</h2><div class="card"><p><strong>Règle :</strong> quand tu atteins le haut de la fourchette sur toutes les séries avec une technique propre, passe à la variante plus dure ou ajoute 2 à 3 kg dans le sac à la séance suivante. L\'app te le signale sous l\'exercice.</p>' +
    '<p class="mt"><strong>Échelle des pompes, du plus facile au plus dur :</strong> classiques, en déficit, pieds surélevés, archer, lestées, pseudo-planche (mains au niveau des hanches, corps penché en avant).</p></div>';
  return h;
}

/* Progrès */
function chartSvg(pts, unit) {
  if (!pts.length) return '<p class="muted small">Pas encore de données : ajoute un test ou un bilan ci-dessous.</p>';
  const W = 640, H = 220, pl = 16, pr = 16, pt = 28, pb = 30;
  const xs = pts.map(p => parseYmd(p.d).getTime());
  let x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
  if (x0 === x1) { x0 -= 3 * 86400000; x1 += 3 * 86400000; }
  const vs = pts.map(p => p.v);
  const vmin = Math.min.apply(null, vs), vmax = Math.max.apply(null, vs);
  let y0 = vmin, y1 = vmax;
  const padv = (y1 - y0) * 0.2 || Math.max(1, Math.abs(y1) * 0.05);
  y0 -= padv; y1 += padv;
  const X = t => pl + (t - x0) / (x1 - x0) * (W - pl - pr);
  const Y = v => pt + (1 - (v - y0) / (y1 - y0)) * (H - pt - pb);
  const P = pts.map((p, i) => [X(xs[i]), Y(p.v)]);
  let s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Évolution">';
  [vmin, vmax].filter((v, i, a) => a.indexOf(v) === i).forEach(v => {
    s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" style="stroke:var(--line);stroke-dasharray:4 4"/>';
  });
  if (P.length > 1) {
    const line = P.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    s += '<path d="' + line + " L" + P[P.length - 1][0].toFixed(1) + " " + (H - pb) + " L" + P[0][0].toFixed(1) + " " + (H - pb) + ' Z" style="fill:var(--accent);opacity:.12"/>';
    s += '<path d="' + line + '" style="fill:none;stroke:var(--accent);stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round"/>';
  }
  P.forEach((p, i) => {
    const lastPt = i === P.length - 1;
    s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (lastPt ? 6 : 3.5) + '" style="fill:' + (lastPt ? "var(--accent)" : "var(--surface)") + ';stroke:var(--accent);stroke-width:2"/>';
  });
  const L = P[P.length - 1], F = P[0];
  const anchor = L[0] > W - 80 ? "end" : "middle";
  s += '<text x="' + L[0] + '" y="' + (L[1] - 12) + '" text-anchor="' + anchor + '" style="fill:var(--ink);font:700 15px var(--font-body)">' + fmt(pts[pts.length - 1].v) + (unit || "") + "</text>";
  if (P.length > 1) s += '<text x="' + F[0] + '" y="' + (F[1] - 12) + '" text-anchor="start" style="fill:var(--muted);font:600 13px var(--font-body)">' + fmt(pts[0].v) + (unit || "") + "</text>";
  s += '<text x="' + pl + '" y="' + (H - 8) + '" style="fill:var(--muted);font:600 12px var(--font-body)">' + fdate(pts[0].d) + "</text>";
  if (P.length > 1) s += '<text x="' + (W - pr) + '" y="' + (H - 8) + '" text-anchor="end" style="fill:var(--muted);font:600 12px var(--font-body)">' + fdate(pts[pts.length - 1].d) + "</text>";
  return s + "</svg>";
}
function objRow(label, s, c, t, u, tLabel) {
  let bar = '<span class="muted small">—</span>';
  if (isNum(s) && isNum(c) && isNum(t) && t !== s) {
    const p = Math.max(0, Math.min(100, Math.round((c - s) / (t - s) * 100)));
    bar = '<div class="bar' + (c >= t ? " ok" : "") + '"><i style="width:' + p + '%"></i></div>';
  }
  return "<tr><td>" + esc(label) + '</td><td class="num">' + (isNum(s) ? fmt(s) + (u || "") : "à tester") + '</td><td class="num">' + (isNum(c) ? fmt(c) + (u || "") : "—") + '</td><td class="num">' + (tLabel || (isNum(t) ? fmt(t) + (u || "") : "—")) + "</td><td>" + bar + "</td></tr>";
}
function histTable(kind, cols) {
  const raw = items(kind).map((x, i) => ({ x: x, i: i })).sort((a, b) => a.x.date < b.x.date ? 1 : a.x.date > b.x.date ? -1 : 0);
  let h = '<div class="card scroll mt"><table class="tbl"><thead><tr><th>Date</th>' + cols.map(c => "<th>" + c[1] + "</th>").join("") + "<th></th></tr></thead><tbody>";
  raw.forEach(r => {
    const ck = kind + ":" + r.i;
    h += '<tr><td class="num">' + fdate(r.x.date) + "</td>" + cols.map(c => '<td class="num">' + fmt(r.x[c[0]], 2) + "</td>").join("") +
      '<td><button type="button" class="btn sm quiet" data-act="del" data-kind="' + kind + '" data-i="' + r.i + '">' + (S.confirmDel === ck ? "Supprimer ?" : "×") + "</button></td></tr>";
  });
  return h + "</tbody></table></div>";
}
function formHtml(kind, fields, label) {
  const td = todayKey();
  return '<form class="card' + (kind === "bilan" ? " mt" : "") + '" data-form="' + kind + '"><div class="form">' +
    fields.map(f => '<label class="f" for="' + kind + "-" + f[0] + '">' + f[1] + '<input id="' + kind + "-" + f[0] + '" name="' + f[0] + '" type="' + f[2] + '"' + (f[2] === "number" ? ' inputmode="decimal" step="any" min="0"' : "") + (f[2] === "date" ? ' value="' + td + '"' : "") + "></label>").join("") +
    '</div><div class="row mt"><button type="submit" class="btn">' + label + "</button>" + (S.formMsg[kind] ? '<span class="small" style="color:var(--crit)">' + esc(S.formMsg[kind]) + "</span>" : "") + "</div></form>";
}
function vProgress() {
  const now = new Date(), t = ymd(now), w = weekNum(mondayOf(now));
  const reg = regularity();
  const next = BILAN_DATES.find(d => d >= t);
  const wt = latestWeight();
  let h = '<h2>Où tu en es</h2><div class="tiles">' +
    '<div class="card tile"><div class="big">' + (w <= 0 ? "S0" : w > 12 ? "Fini" : "S" + w) + '</div><div class="lbl">Semaine sur 12</div></div>' +
    '<div class="card tile"><div class="big">' + (reg.pct == null ? "—" : reg.pct + " %") + '</div><div class="lbl">Régularité · ' + reg.dm + "/" + reg.pm + " séances</div></div>" +
    '<div class="card tile"><div class="big">' + (next ? "J−" + daysBetween(t, next) : "—") + '</div><div class="lbl">Bilan Biody ' + (next ? "du " + fdate(next) : "") + "</div></div>" +
    '<div class="card tile"><div class="big">' + (isNum(wt) ? fmt(wt) + " kg" : "—") + '</div><div class="lbl">Poids</div></div></div>';
  const tests = items("tests").sort(byDate);
  const first = k => { for (const x of tests) if (isNum(x[k])) return x[k]; return null; };
  const last = k => { for (let i = tests.length - 1; i >= 0; i--) if (isNum(tests[i][k])) return tests[i][k]; return null; };
  const pomp = metricSeries("pompes");
  const p0 = pomp.length ? pomp[0].v : null, pc = pomp.length ? pomp[pomp.length - 1].v : null;
  const tr0 = first("tractions"), br0 = first("bras"), po0 = first("poitrine");
  const bil = items("bilans").sort(byDate);
  const b0 = bil[0], bl = bil[bil.length - 1];
  h += '<h2>Objectifs au 15 février</h2><div class="card scroll"><table class="tbl"><thead><tr><th>Objectif</th><th>Départ</th><th>Actuel</th><th>Cible</th><th>Avancée</th></tr></thead><tbody>' +
    objRow("Pompes d'affilée", p0, pc, 45, "") +
    objRow("Pompes archer (par côté)", first("archer"), last("archer"), 8, "") +
    objRow("Tractions pronation", tr0, last("tractions"), isNum(tr0) ? tr0 + 5 : null, "", isNum(tr0) ? null : "départ + 5") +
    objRow("Dips aux barres", first("dips"), last("dips"), 15, "") +
    objRow("Tour de bras contracté", br0, last("bras"), isNum(br0) ? br0 + 1 : null, " cm", isNum(br0) ? null : "départ + 1 cm") +
    objRow("Tour de poitrine", po0, last("poitrine"), isNum(po0) ? po0 + 2 : null, " cm", isNum(po0) ? null : "départ + 2 cm") +
    '<tr><td>Masse grasse</td><td class="num">' + (b0 && isNum(b0.mg) ? fmt(b0.mg, 2) + " %" : "—") + '</td><td class="num">' + (bl && isNum(bl.mg) ? fmt(bl.mg, 2) + " %" : "—") + '</td><td class="num">−1,87 kg</td><td class="small muted">Biody</td></tr>' +
    '<tr><td>Masse musculaire</td><td class="num">' + (b0 && isNum(b0.mm) ? fmt(b0.mm, 2) + " %" : "—") + '</td><td class="num">' + (bl && isNum(bl.mm) ? fmt(bl.mm, 2) + " %" : "—") + '</td><td class="num">+0,93 kg</td><td class="small muted">Biody</td></tr>' +
    '<tr><td>Régularité</td><td class="num">—</td><td class="num">' + (reg.pct == null ? "—" : reg.pct + " %") + '</td><td class="num">90 %</td><td>' + (reg.pct == null ? '<span class="muted small">—</span>' : '<div class="bar' + (reg.pct >= 90 ? " ok" : "") + '"><i style="width:' + Math.min(100, Math.round(reg.pct / 90 * 100)) + '%"></i></div>') + "</td></tr>" +
    "</tbody></table></div>";
  const metrics = [["pompes", "Pompes max", ""], ["pas", "Pas (4 sem.)", ""], ["poids", "Poids", " kg"], ["mg", "Masse grasse", " %"], ["bras", "Tour de bras", " cm"]];
  const cur = metrics.find(m => m[0] === S.metric) || metrics[0];
  h += '<h2>Courbe</h2><div class="card chart"><div class="row" role="group" aria-label="Mesure affichée">' + metrics.map(m => '<button type="button" class="chip' + (m[0] === cur[0] ? " sel" : "") + '" data-act="metric" data-m="' + m[0] + '" aria-pressed="' + (m[0] === cur[0]) + '">' + m[1] + "</button>").join("") + '</div><div class="mt">' + chartSvg(metricSeries(cur[0]), cur[2]) + "</div></div>";
  h += "<h2>Ajouter un test</h2>" + formHtml("test", [["date", "Date", "date"], ["pompes", "Pompes max", "number"], ["archer", "Archer / côté", "number"], ["planche", "Planche (s)", "number"], ["tractions", "Tractions", "number"], ["dips", "Dips", "number"], ["bras", "Tour de bras (cm)", "number"], ["poitrine", "Tour de poitrine (cm)", "number"], ["poids", "Poids (kg)", "number"]], "Enregistrer le test");
  if (tests.length) h += histTable("tests", [["pompes", "Pompes"], ["archer", "Archer"], ["planche", "Planche s"], ["tractions", "Tract."], ["dips", "Dips"], ["bras", "Bras cm"], ["poitrine", "Poitr. cm"], ["poids", "Poids"]]);
  h += '<h2>Bilans Biody</h2><div class="card"><p>Prochains : ' + BILAN_DATES.map(d => fdate(d) + (d.slice(0, 4) === "2027" ? " 2027" : "")).join(", ") + '.</p><p class="small muted mt">Pour comparer : même créneau qu\'au départ (vers 12 h 50), avant le repas, vessie vide, pas de sport dans les 12 h avant, pas d\'alcool la veille.</p></div>';
  h += formHtml("bilan", [["date", "Date", "date"], ["poids", "Poids (kg)", "number"], ["mg", "Masse grasse (%)", "number"], ["mm", "Masse musc. (%)", "number"], ["hydra", "Hydratation (%)", "number"], ["angle", "Angle de phase (°)", "number"]], "Enregistrer le bilan");
  if (bil.length) h += histTable("bilans", [["poids", "Poids"], ["mg", "Gras %"], ["mm", "Muscle %"], ["hydra", "Hydra %"], ["angle", "Angle °"]]);
  return h;
}

/* Plus : connexion, notifications, pas, plan */
function timeOptions(from, to, step, sel) {
  let o = "";
  for (let m = from; m <= to; m += step) { const v = pad2(Math.floor(m / 60)) + ":" + pad2(m % 60); o += '<option value="' + v + '"' + (v === sel ? " selected" : "") + ">" + v.replace(":", " h ") + "</option>"; }
  return o;
}
function vPlus() {
  const tok = token(), r = reglages();
  let h = "<h2>Connexion à tes données</h2>";
  h += '<div class="card stack">';
  if (tok) {
    h += '<p><span class="pill ' + (S.sync === "ok" ? "good" : S.sync === "badtoken" ? "warn" : "") + '">' + esc($status.textContent) + "</span> " + (state.meta.lastSync ? '<span class="small muted">Dernière synchro : ' + fdate(state.meta.lastSync.slice(0, 10)) + " à " + hhmm(state.meta.lastSync) + "</span>" : "") + "</p>";
    h += '<p class="small muted">Tes données sont copiées dans ton dépôt privé <code>' + DATA_REPO + "</code>.</p>";
    h += '<div class="row"><button type="button" class="btn sm" data-act="syncnow">Synchroniser maintenant</button><button type="button" class="btn sm quiet" data-act="logout">Retirer le token</button></div>';
  } else {
    h += "<p>Colle ici ton token GitHub pour sauvegarder tes données dans ton dépôt privé et activer les notifications.</p>";
    h += '<ol class="rules small"><li>Ouvre <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a>.</li><li>Nom : <code>suivi-muscu</code>, expiration : 1 an.</li><li>Repository access : <strong>Only select repositories</strong> → <code>suivi-muscu-data</code>.</li><li>Permissions → Repository → <strong>Contents : Read and write</strong>.</li><li>Generate token, copie-le, colle-le ci-dessous.</li></ol>';
    h += '<label class="f" for="tok">Token GitHub<input id="tok" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="github_pat_…"></label>';
    h += '<div class="row"><button type="button" class="btn" data-act="savetok">Enregistrer et synchroniser</button>' + (S.msg.tok ? '<span class="small" style="color:var(--crit)">' + esc(S.msg.tok) + "</span>" : "") + "</div>";
  }
  h += "</div>";

  h += "<h2>Notifications</h2><div class=\"card stack\">";
  if (!isStandalone()) h += '<p class="warnbox">Sur iPhone, les notifications ne marchent que depuis l\'app installée (Partager → Sur l\'écran d\'accueil, iOS 16.4 minimum).</p>';
  h += "<p>État : " + (S.push.sub ? '<span class="pill good">Activées sur ce téléphone</span>' : '<span class="pill warn">Pas activées</span>') + "</p>";
  h += '<div class="row"><button type="button" class="btn" data-act="pushon"' + (!tok ? " disabled" : "") + ">" + (S.push.sub ? "Réactiver" : "Activer les notifications") + "</button>" +
    (S.push.sub ? '<button type="button" class="btn ghost" data-act="pushtest">M\'envoyer une notif de test</button>' : "") + "</div>";
  if (!tok) h += '<p class="small muted">Enregistre d\'abord ton token ci-dessus.</p>';
  if (S.msg.push) h += '<p class="small">' + esc(S.msg.push) + "</p>";
  const n = r.notifs;
  h += '<div class="stack mt">' +
    '<label class="toggle" for="n-seance"><input type="checkbox" id="n-seance" data-act="notif" data-k="seance"' + (n.seance ? " checked" : "") + "><span>Séance du jour</span></label>" +
    '<div class="form"><label class="f" for="h-seance">Rappel séance (chambre)<select id="h-seance" data-act="heure" data-k="heureSeance">' + timeOptions(17 * 60 + 30, 20 * 60 + 30, 15, r.heureSeance) + "</select></label>" +
    '<label class="f" for="h-parc">Rappel séance au parc<select id="h-parc" data-act="heure" data-k="heureParc">' + timeOptions(6 * 60, 7 * 60 + 30, 15, r.heureParc) + "</select></label></div>" +
    '<label class="toggle" for="n-pas"><input type="checkbox" id="n-pas" data-act="notif" data-k="pas"' + (n.pas ? " checked" : "") + "><span>Pas du soir, si tu es sous 8 000</span></label>" +
    '<div class="form"><label class="f" for="h-pas">Heure<select id="h-pas" data-act="heure" data-k="heurePas">' + timeOptions(19 * 60 + 30, 20 * 60 + 45, 15, r.heurePas) + "</select></label></div>" +
    '<label class="toggle" for="n-bilan"><input type="checkbox" id="n-bilan" data-act="notif" data-k="bilan"' + (n.bilan ? " checked" : "") + "><span>Bilan du dimanche</span></label>" +
    '<div class="form"><label class="f" for="h-bilan">Heure<select id="h-bilan" data-act="heure" data-k="heureBilan">' + timeOptions(18 * 60, 20 * 60 + 30, 15, r.heureBilan) + "</select></label></div>" +
    '<label class="toggle" for="n-biody"><input type="checkbox" id="n-biody" data-act="notif" data-k="biody"' + (n.biody ? " checked" : "") + "><span>Veille de bilan Biody (20 h)</span></label></div>";
  h += '<p class="small muted">Les rappels partent de ton dépôt privé (GitHub Actions), à quelques minutes près.</p></div>';

  h += "<h2>Pas depuis Santé</h2><div class=\"card stack\"><p>Un raccourci iOS lit tes pas dans l'app Santé et les envoie à l'app. À créer une fois dans l'app <strong>Raccourcis</strong> :</p>" +
    '<ol class="rules small"><li>Nouveau raccourci, nommé exactement <code>' + SHORTCUT_NAME + "</code>.</li>" +
    "<li>Action <strong>Rechercher des échantillons de santé</strong> : Type = <em>Pas</em>, Date de début = <em>Aujourd'hui</em>.</li>" +
    "<li>Action <strong>Calculer les statistiques</strong> : <em>Somme</em> des échantillons de santé.</li>" +
    "<li>Action <strong>Formater la date</strong> : Date actuelle, format personnalisé <code>yyyy-MM-dd</code>.</li>" +
    "<li>Action <strong>Obtenir le contenu de l'URL</strong> : <code>https://api.github.com/repos/" + DATA_REPO + "/dispatches</code>, méthode <em>POST</em>.<br>En-têtes : <code>Authorization</code> = <code>Bearer</code> + espace + ton token ; <code>Accept</code> = <code>application/vnd.github+json</code>.<br>Corps JSON : <code>event_type</code> (texte) = <code>pas</code> ; <code>client_payload</code> (dictionnaire) avec <code>date</code> (texte) = la date formatée et <code>pas</code> (nombre) = les statistiques.</li>" +
    "<li>Onglet <strong>Automatisation</strong> → Heure de la journée → 19 h 45, chaque jour → <strong>Exécuter immédiatement</strong> → exécuter <code>" + SHORTCUT_NAME + "</code>.</li></ol>" +
    '<p class="small muted">Si ton iPhone est verrouillé à 19 h 45, iOS peut bloquer la lecture de Santé. Dans ce cas, appuie sur « Mettre à jour depuis Santé » dans Aujourd\'hui.</p>' +
    '<div class="row"><a class="btn sm" href="shortcuts://run-shortcut?name=' + encodeURIComponent(SHORTCUT_NAME) + '" data-act="health">Tester le raccourci</a></div></div>';

  const wt = latestWeight();
  const lo = isNum(wt) ? Math.round(wt * 1.6 / 5) * 5 : 100, hi = isNum(wt) ? Math.round(wt * 2 / 5) * 5 : 120;
  h += "<h2>Nutrition</h2>";
  h += '<div class="card stack"><p><strong>Mange autour de 2 500 kcal par jour, sans régime.</strong> À 11,7 % de gras, le sport en plus suffit à créer un petit déficit ; manger moins te ferait perdre du muscle.</p>' +
    "<p><strong>Protéines : " + lo + " à " + hi + " g par jour</strong> (1,6 à 2 g par kilo" + (isNum(wt) ? ", calculé sur " + fmt(wt) + " kg" : "") + "), en 3 ou 4 repas de 30 à 40 g.</p>" +
    "<p><strong>Ton poids sert de boussole :</strong> pèse-toi une fois par semaine, le matin à jeun. S'il baisse de plus de 1 kg en 4 semaines, ajoute une collation par jour (skyr + banane + une poignée d'amandes).</p>" +
    '<ul class="plain"><li>Féculents autour des séances (pâtes, riz, pain, fruits) : c\'est le carburant.</li><li>Légumes à 2 repas, environ 2 L d\'eau, plus les jours de vélo.</li><li>Sommeil : 8 h. C\'est la nuit que le muscle se construit.</li><li>Alcool : une soirée arrosée freine la récupération 1 à 2 jours.</li><li>Option : créatine monohydrate, 3 g par jour. Pas obligatoire.</li></ul></div>';
  h += '<div class="card scroll mt"><table class="tbl"><thead><tr><th>Aliment</th><th>Portion</th><th>Protéines (approx.)</th></tr></thead><tbody>' +
    [["Blanc de poulet", "150 g", "35 g"], ["Thon en boîte, égoutté", "140 g", "35 g"], ["Steak haché 5 %", "125 g", "25 g"], ["Skyr", "200 g", "20 g"], ["Œufs", "3", "18 g"], ["Lentilles cuites", "200 g", "18 g"]]
      .map(x => "<tr><td>" + x[0] + '</td><td class="num">' + x[1] + '</td><td class="num">' + x[2] + "</td></tr>").join("") + "</tbody></table></div>";
  h += '<h2>Cardio sans courir</h2><div class="card scroll"><table class="tbl"><thead><tr><th>Activité</th><th>Quand</th><th>Intensité</th></tr></thead><tbody>' +
    "<tr><td>Pas</td><td>Tous les jours</td><td>8 000 minimum, 10 000 idéal</td></tr>" +
    "<tr><td>Vélo tranquille</td><td>2 fois par semaine, 45 à 60 min</td><td>Tu peux parler, mais pas chanter</td></tr>" +
    "<tr><td>Marche rapide</td><td>1 fois par semaine, 30 à 45 min</td><td>Rythme soutenu</td></tr>" +
    "<tr><td>Vélo pour les trajets</td><td>Dès que possible</td><td>Libre</td></tr></tbody></table></div>";
  h += '<h2>Les 5 règles</h2><div class="card"><ol class="rules"><li>Jamais deux séances ratées de suite.</li><li>Une séance ratée est décalée, pas annulée : rattrape-la depuis Aujourd\'hui.</li><li>Jour sans motivation : fais juste l\'échauffement et le premier exercice. La plupart du temps, tu finis la séance.</li><li>Même heure à chaque séance, pour que ça devienne automatique.</li><li>Une douleur dans une articulation (épaule, coude, poignet) n\'est pas une courbature : arrête l\'exercice et dis-le à ton coach.</li></ol></div>';
  h += "<h2>Semaine de tests</h2>" + todoCard();
  return h;
}

/* ---------- Notifications push ---------- */
function urlB64ToUint8Array(b64) {
  const pad = "=".repeat((4 - b64.length % 4) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
async function refreshPushState() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) { S.push = { supported: false, sub: false }; return; }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    S.push = { supported: true, sub: !!sub };
  } catch (e) { S.push = { supported: false, sub: false }; }
}
async function enablePush() {
  S.msg.push = "";
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) throw new Error("Ce navigateur ne gère pas les notifications. Ouvre l'app depuis son icône sur l'écran d'accueil.");
    const perm = await Notification.requestPermission();
    if (perm !== "granted") throw new Error("Notifications refusées. Autorise-les dans Réglages → Notifications → Suivi muscu.");
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC) });
    const f = await getFile("push/subscription.json");
    await putFile("push/subscription.json", { sub: sub.toJSON(), at: new Date().toISOString(), ua: navigator.userAgent }, f.sha, "Notifications : abonnement du téléphone");
    S.push = { supported: true, sub: true };
    S.msg.push = "C'est activé. Envoie-toi une notif de test pour vérifier.";
  } catch (e) {
    S.msg.push = (e && e.message) ? e.message : (e && e.code === 401 ? "Token refusé : vérifie-le." : "Échec de l'activation, réessaie.");
  }
  render();
}
async function testPush() {
  S.msg.push = "Envoi demandé… la notif arrive en général en moins d'une minute.";
  render();
  try { await dispatch("test", { at: new Date().toISOString() }); }
  catch (e) { S.msg.push = "Échec de l'envoi (" + (e && e.code) + "). Vérifie le token."; render(); }
}

/* ---------- Actions ---------- */
function editPlan(fn) {
  const mon = addDays(mondayOf(new Date()), S.wOff * 7), mk = ymd(mon);
  if (S.scope === "tpl") {
    const days = template().map(d => d.slice());
    fn(days);
    write("planning", { days: days });
  } else {
    const wd = clone(D("w-" + mk));
    const days = planFor(mk).map(d => d.slice());
    fn(days);
    wd.planning = days;
    write("w-" + mk, wd);
  }
  S.sel = null; S.addFor = null;
  render();
}
function editDay(date, fn) { const id = "j-" + date; const j = clone(D(id)); fn(j); write(id, j); render(); }
$app.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el || !$app.contains(el) || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") return;
  const ds = el.dataset;
  switch (ds.act) {
    case "done": {
      const wasDone = !!((D("j-" + ds.date) || {}).fait || {})[ds.code];
      if (!wasDone && run && run.code === ds.code && run.date === ds.date) {
        const id = "s-" + ds.date + "-" + ds.code; const doc = clone(D(id));
        doc.date = ds.date; doc.code = ds.code; doc.duree = Math.max(1, Math.round((Date.now() - run.start) / 60000));
        write(id, doc); stopRun();
      }
      editDay(ds.date, j => { j.fait = j.fait || {}; if (j.fait[ds.code]) delete j.fait[ds.code]; else j.fait[ds.code] = true; });
      break;
    }
    case "start": startRun(ds.code, ds.date); break;
    case "open": { const cur = (ds.key in S.open) ? S.open[ds.key] : ds.def === "1"; S.open[ds.key] = !cur; render(); break; }
    case "video": S.vid[ds.key] = !S.vid[ds.key]; render(); break;
    case "rest": startCountdown(Number(ds.s), "Repos", "rest"); break;
    case "hold": startCountdown(Number(ds.s), ds.l || "Tiens", "hold"); break;
    case "extra": editDay(ds.date, j => { j.extra = Array.isArray(j.extra) ? j.extra : []; if (j.extra.indexOf(ds.code) < 0) j.extra.push(ds.code); }); S.open[ds.date + ds.code] = true; render(); break;
    case "unextra": editDay(ds.date, j => { j.extra = (Array.isArray(j.extra) ? j.extra : []).filter(c => c !== ds.code); }); break;
    case "health": pollUntil = Date.now() + 3 * 60 * 1000; schedulePoll(); break;
    case "wnav": S.wOff += Number(ds.d); S.sel = null; S.addFor = null; render(); break;
    case "scope": S.scope = ds.s; S.sel = null; S.addFor = null; render(); break;
    case "chip": { const d = Number(ds.day), x = Number(ds.idx); S.sel = (S.sel && S.sel.day === d && S.sel.idx === x) ? null : { day: d, idx: x }; S.addFor = null; render(); break; }
    case "addopen": { const d = Number(ds.day); S.addFor = S.addFor === d ? null : d; S.sel = null; render(); break; }
    case "cancel": S.sel = null; S.addFor = null; render(); break;
    case "move": { const sel = S.sel; if (!sel) break; const to = Number(ds.to); editPlan(days => { const c = days[sel.day][sel.idx]; if (!c) return; days[sel.day].splice(sel.idx, 1); days[to].push(c); }); break; }
    case "remove": { const sel = S.sel; if (!sel) break; editPlan(days => { days[sel.day].splice(sel.idx, 1); }); break; }
    case "add": { const d = S.addFor; editPlan(days => { if (d != null && days[d].indexOf(ds.code) < 0) days[d].push(ds.code); }); break; }
    case "reset": {
      if (S.scope === "tpl") write("planning", { days: DEFAULT_PLAN.map(d => d.slice()) });
      else { const mk = ymd(addDays(mondayOf(new Date()), S.wOff * 7)); const wd = clone(D("w-" + mk)); delete wd.planning; write("w-" + mk, wd); }
      S.sel = null; S.addFor = null; render(); break;
    }
    case "ressenti": { const id = "w-" + ds.mk; const wd = clone(D(id)); wd.ressenti = Number(ds.v); write(id, wd); render(); break; }
    case "metric": S.metric = ds.m; render(); break;
    case "del": {
      const ck = ds.kind + ":" + ds.i;
      if (S.confirmDel !== ck) { S.confirmDel = ck; render(); break; }
      const doc = clone(D(ds.kind)); doc.items = (Array.isArray(doc.items) ? doc.items : []).filter((x, i) => i !== Number(ds.i));
      write(ds.kind, doc); S.confirmDel = null; render(); break;
    }
    case "savetok": {
      const v = (document.getElementById("tok").value || "").trim();
      if (!/^(github_pat_|ghp_)[A-Za-z0-9_]+$/.test(v)) { S.msg.tok = "Ce token ne ressemble pas à un token GitHub (il commence par github_pat_)."; render(); break; }
      lsSet(LS_TOK, v); S.msg.tok = ""; render(); sync(); break;
    }
    case "logout": lsDel(LS_TOK); setSync("local"); render(); break;
    case "syncnow": sync(); break;
    case "pushon": enablePush(); break;
    case "pushtest": testPush(); break;
  }
});
$app.addEventListener("input", e => {
  const el = e.target, ds = el.dataset;
  if (ds.act === "set") {
    const id = "s-" + ds.date + "-" + ds.code;
    const doc = clone(D(id));
    doc.date = ds.date; doc.code = ds.code; doc.sets = doc.sets || {};
    const arr = Array.isArray(doc.sets[ds.ex]) ? doc.sets[ds.ex] : [];
    const n = Number(ds.n);
    for (let k = 0; k < n; k++) if (!isNum(arr[k])) arr[k] = null;
    arr[Number(ds.i)] = toNum(el.value);
    doc.sets[ds.ex] = arr;
    write(id, doc);
  } else if (ds.act === "note") {
    const id = "s-" + ds.date + "-" + ds.code;
    const doc = clone(D(id)); doc.date = ds.date; doc.code = ds.code; doc.note = el.value;
    write(id, doc);
  } else if (ds.act === "pas") {
    const id = "j-" + ds.date; const j = clone(D(id)); j.pas = toNum(el.value);
    write(id, j);
  } else if (ds.act === "wfield") {
    const id = "w-" + ds.mk; const wd = clone(D(id));
    wd[ds.f] = ds.f === "sommeil" ? toNum(el.value) : el.value;
    write(id, wd);
  }
});
$app.addEventListener("change", e => {
  const el = e.target, ds = el.dataset;
  if (ds.act === "todo") {
    const t = clone(D("todo")); t.done = t.done || {};
    if (el.checked) t.done[ds.id] = true; else delete t.done[ds.id];
    write("todo", t); render();
  } else if (ds.act === "notif") {
    const r = clone(D("reglages")); r.notifs = Object.assign({}, DEFAULT_REGLAGES.notifs, r.notifs || {}); r.notifs[ds.k] = el.checked;
    write("reglages", r);
  } else if (ds.act === "heure") {
    const r = clone(D("reglages")); r[ds.k] = el.value; write("reglages", r);
  } else if (ds.act === "pas") {
    render();
  }
});
$app.addEventListener("focusout", () => {
  setTimeout(() => {
    if (!pendingRender) return;
    const ae = document.activeElement;
    if (!(ae && $app.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))) render();
  }, 450);
});
$app.addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target, kind = f.dataset.form;
  const keys = kind === "test" ? ["pompes", "archer", "planche", "tractions", "dips", "bras", "poitrine", "poids"] : ["poids", "mg", "mm", "hydra", "angle"];
  const it = { date: (f.elements.date && f.elements.date.value) || todayKey() };
  keys.forEach(k => { const v = toNum(f.elements[k] && f.elements[k].value); if (isNum(v)) it[k] = v; });
  if (Object.keys(it).length < 2) { S.formMsg[kind] = "Remplis au moins une mesure."; render(); return; }
  S.formMsg[kind] = "";
  const id = kind === "test" ? "tests" : "bilans";
  const doc = clone(D(id));
  doc.items = (Array.isArray(doc.items) ? doc.items : []).concat([it]).sort(byDate);
  write(id, doc);
  render();
});
/* Vidéo absente : on propose YouTube à la place */
document.addEventListener("error", e => {
  const v = e.target;
  if (!v || v.tagName !== "VIDEO") return;
  const box = v.closest(".vid");
  if (!box) return;
  box.innerHTML = '<div class="vfoot">Pas encore de vidéo pour cet exercice dans l\'app. <a href="' + ytLink(box.dataset.yt || "") + '" target="_blank" rel="noopener">Voir des démos sur YouTube</a></div>';
}, true);

/* Après « Mettre à jour depuis Santé » : on relit pas.json quelques fois */
let pollTimer = null;
function schedulePoll() {
  clearTimeout(pollTimer);
  if (Date.now() > pollUntil || !token()) return;
  pollTimer = setTimeout(async () => { if (document.visibilityState === "visible") await sync(); schedulePoll(); }, 20000);
}

/* ---------- Navigation ---------- */
const VIEWS = ["aujourdhui", "semaine", "seances", "progres", "plus"];
function route() {
  const h = (location.hash || "").replace("#", "");
  S.view = VIEWS.indexOf(h) >= 0 ? h : "aujourdhui";
  S.sel = null; S.addFor = null; S.confirmDel = null;
  render();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
window.addEventListener("online", () => scheduleSync(500));

/* Changement de jour pendant que l'app reste ouverte */
let shownDay = todayKey();
setInterval(() => { const t = todayKey(); if (t !== shownDay) { shownDay = t; renderSoft(); } }, 60000);

/* ---------- Démarrage ---------- */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").then(() => refreshPushState()).then(() => { if (S.view === "plus") renderSoft(); }).catch(() => {});
}
renderStatus();
route();
if (run) { keepAwake(true); startTicker(); }
if (token()) sync();
})();
