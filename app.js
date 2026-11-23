/* Suivi muscu Léopold — app installable (PWA).
   Données : localStorage sur le téléphone, synchronisées avec le dépôt privé PLe07/suivi-muscu-data
   (fichier data/suivi.json) grâce à un token GitHub saisi dans l'onglet Plus. */
(function () {
"use strict";

/* ---------- Configuration ---------- */
const DATA_REPO = "PLe07/suivi-muscu-data";
const VAPID_PUBLIC = "BCEI2u1482k-3IQi3ootVf93p5KR34y8_zLbJsrj9gTbtWPHvJaYAxC3-Dg2ESeHZB00WDzXqzvq3s2McjymQKw";
const STEP_GOAL = 8000;
const STRIDE_M = 0.70; // longueur de pas estimée pour 1,70 m : 1 km de marche ≈ 1 430 pas
const GPS_STEPS_FROM = "2026-11-23"; // à partir de ce jour, les pas viennent des marches GPS (plus de Santé)

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
    { id:"b1", nom:"Tractions pronation", detail:"paumes vers l'avant", series:4, min:2, max:5, u:"rép.", repos:120, c:"Ton test : 2 d'affilée. Fais tes répétitions propres, puis 1 ou 2 négatives dans la même série (saute en haut, redescends en 5 s). 5 partout : on remonte la fourchette.", v:"tractions-pronation", yt:"traction pronation technique" },
    { id:"b2", nom:"Dips sur un banc", detail:"pas de barres à dips au parc", series:3, min:12, max:20, u:"rép.", repos:90, c:"Dos à un banc, mains au bord, jambes tendues. Épaules basses, coudes à 90° maximum. Trop facile : pieds posés sur un 2e banc.", v:"dips-chaise", yt:"bench dips technique" },
    { id:"b3", nom:"Chin-ups", detail:"paumes vers toi", series:3, min:3, max:6, u:"rép.", repos:120, c:"Ton test : 3 d'affilée. Biceps. Menton au-dessus de la barre, descente en 3 s.", v:"chin-ups", yt:"chin up technique" },
    { id:"b4", nom:"Rowing australien", detail:"sous une barre basse", series:3, min:10, max:15, u:"rép.", repos:90, c:"Ton test : 13 d'affilée. Dos et biceps. Corps gainé, la poitrine vient toucher la barre.", v:"rowing-australien", yt:"rowing australien technique" },
    { id:"b5", nom:"Relevés de genoux suspendu", detail:"lents, bassin enroulé", series:3, min:15, max:25, u:"rép.", repos:60, c:"Ton test : 27 d'affilée. 2 s pour monter les genoux à la poitrine, 2 s pour redescendre, sans te balancer. 25 partout : passe aux jambes tendues.", v:"releves-genoux-suspendu", yt:"relevé de genoux suspendu technique" }
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
let syncTimer = null, syncing = false, syncAgain = false, pendingRender = false;

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
/* Pas du jour : km marchés au GPS convertis en pas (1 pas ≈ 70 cm) + pas ajoutés à la main.
   Les anciens imports de l'app Santé ne servent plus que pour l'historique d'avant le 23/11. */
function walkKmGps(date) {
  let km = 0;
  for (const id in state.docs) {
    if (id.slice(0, 2) !== "g-") continue;
    const g = state.docs[id];
    if (g && !g.del && g.date === date && g.type === "MARCHE" && isNum(g.km)) km += g.km;
  }
  return km;
}
function pasFor(date) {
  const km = walkKmGps(date);
  const j = D("j-" + date);
  const extra = j && isNum(j.pas) ? Math.max(0, j.pas) : 0;
  const gps = Math.round(km * 1000 / STRIDE_M);
  if (gps || extra) return { v: gps + extra, gps: gps, km: km, extra: extra };
  const a = state.pas && state.pas[date];
  if (date < GPS_STEPS_FROM && a && isNum(a.pas)) return { v: a.pas, gps: 0, km: 0, extra: 0, old: true };
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
  } else if (m === "mmKg") {
    bil.forEach(t => { if (isNum(t.mmKg)) pts.push({ d: t.date, v: t.mmKg }); });
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

/* ---------- Traceur GPS (vélo, marche) ---------- */
/* Une app web sur iPhone n'a le GPS que tant qu'elle est ouverte à l'écran : l'écran reste allumé
   (Wake Lock) et un mode poche noir évite les touches involontaires. Si l'écran se verrouille quand même,
   le trou est relié en ligne droite au retour. */
const LS_TRK = "suivi.trk";
const $trk = document.getElementById("trk");
const $trkEl = document.getElementById("trk-el"), $trkKm = document.getElementById("trk-km"), $trkLbl = document.getElementById("trk-lbl");
const TRK = { VELO: { nom: "Vélo", ic: "🚲", vmax: 22 }, MARCHE: { nom: "Marche", ic: "🚶", vmax: 7 } };
let trk = (function () { try { const t = JSON.parse(lsGet(LS_TRK) || "null"); return t && TRK[t.type] ? t : null; } catch (e) { return null; } })();
let trkWatch = null, trkTicker = null, trkFix = null, trkMsg = "", trkSaveAt = 0, trkFollow = true, trkDel = false, trkCount = true, lockTimer = null;
let trkSpdFb = null;
let tMap = null, tLine = null, tDot = null, tAcc = null, tShown = -1, tCentered = false, leafletP = null;

const stepsKm = n => n * STRIDE_M / 1000;
const fmtKm = (km, d) => { const n = d == null ? 2 : d; return (isNum(km) ? km : 0).toLocaleString("fr-FR", { minimumFractionDigits: n, maximumFractionDigits: n }); };
function hav(a, b) {
  const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}
function trkSecs(t) {
  if (!t) return 0;
  const now = t.end || Date.now();
  return Math.max(0, (now - t.start - (t.paused || 0) - (t.pauseAt ? now - t.pauseAt : 0)) / 1000);
}
function paceTxt(secPerKm) { const p = Math.round(secPerKm); return Math.floor(p / 60) + "'" + pad2(p % 60) + " /km"; }
function paceLabel(type, km, secs) {
  if (!km || km < 0.05 || !secs) return "—";
  return type === "VELO" ? fmtKm(km / (secs / 3600), 1) + " km/h" : paceTxt(secs / km);
}
function speedLabel(type, ms) {
  if (ms == null || !isFinite(ms)) return "—";
  if (type === "VELO") return fmtKm(ms * 3.6, 1) + " km/h";
  return ms < 0.4 ? "à l'arrêt" : paceTxt(1000 / ms);
}
function trkPersist(force) {
  if (!trk) { lsDel(LS_TRK); return; }
  const n = Date.now();
  if (force || n - trkSaveAt > 3000) { trkSaveAt = n; lsSet(LS_TRK, JSON.stringify(trk)); }
}
/* Points bruts : [lat, lng, t (s), 1 si début d'un nouveau tronçon] */
function rawSegs(pts) {
  const out = []; let cur = [];
  (pts || []).forEach(p => { if (p[3] && cur.length) { out.push(cur); cur = []; } cur.push([p[0], p[1]]); });
  if (cur.length) out.push(cur);
  return out;
}
function simplifySegs(segs, tol) {
  return segs.map(seg => {
    if (seg.length < 3) return seg.map(p => [+p[0].toFixed(5), +p[1].toFixed(5)]);
    const kx = 111320 * Math.cos(seg[0][0] * Math.PI / 180), ky = 110540;
    const xy = seg.map(p => [p[1] * kx, p[0] * ky]);
    const keep = new Uint8Array(seg.length); keep[0] = 1; keep[seg.length - 1] = 1;
    const stack = [[0, seg.length - 1]];
    while (stack.length) {
      const ab = stack.pop(), a = ab[0], b = ab[1];
      const ax = xy[a][0], ay = xy[a][1], dx = xy[b][0] - ax, dy = xy[b][1] - ay, l2 = dx * dx + dy * dy;
      let md = 0, mi = -1;
      for (let i = a + 1; i < b; i++) {
        let t = l2 ? ((xy[i][0] - ax) * dx + (xy[i][1] - ay) * dy) / l2 : 0;
        t = Math.max(0, Math.min(1, t));
        const ex = ax + t * dx - xy[i][0], ey = ay + t * dy - xy[i][1], d = ex * ex + ey * ey;
        if (d > md) { md = d; mi = i; }
      }
      if (mi > 0 && md > tol * tol) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
    }
    return seg.filter((p, i) => keep[i]).map(p => [+p[0].toFixed(5), +p[1].toFixed(5)]);
  });
}
function sorties() {
  return Object.keys(state.docs).filter(id => id.slice(0, 2) === "g-").map(id => Object.assign({ id: id }, state.docs[id]))
    .filter(s => s && s.date && !s.del && TRK[s.type]).sort((a, b) => (b.start || 0) - (a.start || 0));
}
function kmDay(k) {
  const p = pasFor(k);
  let bike = 0;
  sorties().forEach(s => { if (s.date === k && s.type === "VELO") bike += s.km || 0; });
  const walk = p ? (p.km || 0) + stepsKm((p.extra || 0) + (p.old ? p.v : 0)) : 0;
  return { walk: walk, bike: bike, total: walk + bike };
}
function kmWeek(mon) {
  let walk = 0, bike = 0;
  for (let i = 0; i < 7; i++) { const k = kmDay(ymd(addDays(mon, i))); walk += k.walk; bike += k.bike; }
  return { walk: walk, bike: bike, total: walk + bike };
}
function traceSvg(segs, w, h) {
  const all = [].concat.apply([], segs || []);
  let s = '<svg class="trace" viewBox="0 0 ' + w + " " + h + '" aria-hidden="true">';
  if (all.length < 2) return s + "</svg>";
  const kx = Math.cos(all[0][0] * Math.PI / 180);
  const xs = all.map(p => p[1] * kx), ys = all.map(p => -p[0]);
  const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
  const pad = 5, sc = Math.min((w - 2 * pad) / ((x1 - x0) || 1e-9), (h - 2 * pad) / ((y1 - y0) || 1e-9));
  const ox = (w - (x1 - x0) * sc) / 2, oy = (h - (y1 - y0) * sc) / 2;
  const P = p => [((p[1] * kx - x0) * sc + ox).toFixed(1), ((-p[0] - y0) * sc + oy).toFixed(1)];
  let d = "";
  segs.forEach(sg => { if (sg.length) d += "M" + sg.map(p => P(p).join(" ")).join(" L"); });
  const a = P(all[0]), b = P(all[all.length - 1]);
  return s + '<path d="' + d + '"/><circle cx="' + a[0] + '" cy="' + a[1] + '" r="3.2" class="tr-a"/><circle cx="' + b[0] + '" cy="' + b[1] + '" r="3.2" class="tr-b"/></svg>';
}
function sortieRow(s, withDel) {
  const a = TRK[s.type], st = new Date(s.start || parseYmd(s.date));
  let h = '<div class="sortie">' + traceSvg(s.segs, 72, 54) + '<div><b>' + a.ic + " " + esc(a.nom) + " · " + fmtKm(s.km) + " km</b>" +
    '<span class="small muted">' + (withDel ? fdate(s.date) + " · " : "") + pad2(st.getHours()) + " h " + pad2(st.getMinutes()) + " · " + fmtClock(s.duree || 0) + " · " + esc(paceLabel(s.type, s.km, s.duree)) + "</span></div>";
  if (withDel) h += '<button type="button" class="btn sm quiet" data-act="gdel" data-id="' + esc(s.id) + '">' + (S.confirmDel === "g:" + s.id ? "Supprimer ?" : "×") + "</button>";
  return h + "</div>";
}

/* Démarrage, pause, fin */
function startTrk(type) {
  audio();
  trk = { type: type, date: todayKey(), start: Date.now(), paused: 0, pauseAt: null, end: null, pts: [], km: 0, gaps: 0, vmax: 0, cut: false };
  trkMsg = ""; trkFollow = true; trkDel = false; trkCount = true; tCentered = false;
  trkPersist(true); openTrk();
}
function openTrk() {
  if (!trk) return;
  $trk.hidden = false; document.body.style.overflow = "hidden";
  if (!trk.end) { watchGps(); keepAwake(true); }
  renderTrk();
  if (!trkTicker) trkTicker = setInterval(tickTrk, 1000);
}
function hideTrk() { destroyMap(); $trk.hidden = true; document.body.style.overflow = ""; render(); }
function closeTrkAll() {
  trk = null; trkPersist(true); stopGps(); destroyMap();
  if (!run) keepAwake(false);
  $trk.hidden = true; $trk.innerHTML = ""; document.body.style.overflow = "";
  clearInterval(trkTicker); trkTicker = null; updateBar();
}
function watchGps() {
  if (trkWatch != null) return;
  if (!("geolocation" in navigator)) { trkMsg = "Ce navigateur ne donne pas accès au GPS."; return; }
  trkWatch = navigator.geolocation.watchPosition(onFix, onGpsErr, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
}
function stopGps() { if (trkWatch != null) { try { navigator.geolocation.clearWatch(trkWatch); } catch (e) {} } trkWatch = null; }
function onGpsErr(e) {
  trkMsg = e && e.code === 1
    ? "Localisation refusée. Sur iPhone : Réglages → Confidentialité et sécurité → Service de localisation → Sites Safari → « Lorsque l'app est active » + « Position exacte », puis rouvre l'app."
    : "Je cherche le signal GPS… reste à découvert quelques secondes.";
  updateTrk();
}
function onFix(pos) {
  const c = pos.coords, now = Date.now();
  trkFix = { lat: c.latitude, lng: c.longitude, acc: c.accuracy, spd: (c.speed != null && c.speed >= 0) ? c.speed : null, t: now };
  trkMsg = "";
  if (!trk || trk.end || trk.pauseAt) { updateTrk(); return; }
  if (c.accuracy > 40) { trkMsg = "Signal GPS faible (± " + Math.round(c.accuracy) + " m) : j'attends un meilleur point."; updateTrk(); return; }
  const p = [+c.latitude.toFixed(6), +c.longitude.toFixed(6), Math.round(now / 1000)];
  const last = trk.pts[trk.pts.length - 1];
  if (!last || trk.cut) { if (last) p.push(1); trk.pts.push(p); trk.cut = false; trkPersist(true); updateTrk(); return; }
  const d = hav(last, p), dt = Math.max(1, p[2] - last[2]);
  if (d < Math.max(5, c.accuracy * 0.5)) { updateTrk(); return; }           // bruit sur place
  if (d / dt > TRK[trk.type].vmax && dt < 120 && (trk.rej || 0) < 3) { trk.rej = (trk.rej || 0) + 1; updateTrk(); return; } // saut GPS isolé
  trk.rej = 0;
  if (dt > 60) trk.gaps = (trk.gaps || 0) + 1;                             // écran verrouillé : relié en ligne droite
  if (trkFix.spd != null && c.accuracy <= 25 && trkFix.spd < TRK[trk.type].vmax) trk.vmax = Math.max(trk.vmax || 0, trkFix.spd);
  trk.km += d / 1000;
  trk.pts.push(p);
  if (dt <= 60) {
    let k = trk.pts.length - 2, dist = d;
    while (k > 0 && p[2] - trk.pts[k][2] < 10 && !trk.pts[k][3]) { dist += hav(trk.pts[k - 1], trk.pts[k]); k--; }
    const span = p[2] - trk.pts[k][2];
    if (span >= 4) {
      const v = dist / span;
      trkSpdFb = { v: v, t: Date.now() };
      if (v < TRK[trk.type].vmax) trk.vmax = Math.max(trk.vmax || 0, v);
    }
  }
  trkPersist(); updateTrk();
}
function pauseTrk() {
  if (!trk || trk.end) return;
  if (trk.pauseAt) { trk.paused += Date.now() - trk.pauseAt; trk.pauseAt = null; trk.cut = true; }
  else trk.pauseAt = Date.now();
  trkPersist(true); renderTrk();
}
function endTrk() {
  if (!trk) return;
  const n = Date.now();
  if (trk.pauseAt) { trk.paused += n - trk.pauseAt; trk.pauseAt = null; }
  trk.end = n; stopGps();
  if (!run) keepAwake(false);
  trkCount = trkSecs(trk) >= 600 && trk.km >= 0.3; // un essai de quelques secondes ne coche pas la séance
  trkDel = false;
  trkPersist(true); renderTrk();
}
function resumeTrk() {
  if (!trk || !trk.end) return;
  trk.paused += Date.now() - trk.end; trk.end = null; trk.cut = true;
  trkPersist(true); openTrk();
}
function saveTrk() {
  const t = trk; if (!t) return;
  const d = new Date(t.start), id = "g-" + ymd(d) + "-" + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds());
  const raw = rawSegs(t.pts);
  let tol = 3, segs = simplifySegs(raw, tol);
  while (segs.reduce((n, s) => n + s.length, 0) > 800 && tol < 60) { tol *= 1.6; segs = simplifySegs(raw, tol); }
  write(id, { date: t.date, type: t.type, start: t.start, end: t.end, duree: Math.round(trkSecs(t)), km: Math.round(t.km * 1000) / 1000, vmax: Math.round((t.vmax || 0) * 10) / 10, gaps: t.gaps || 0, segs: segs });
  const count = trkCount;
  closeTrkAll();
  if (count) {
    const dt = parseYmd(t.date), plan = planFor(ymd(mondayOf(dt)))[dayIdx(dt)];
    const jid = "j-" + t.date, j = clone(D(jid));
    j.fait = j.fait || {}; j.fait[t.type] = true;
    if (plan.indexOf(t.type) < 0) { j.extra = Array.isArray(j.extra) ? j.extra : []; if (j.extra.indexOf(t.type) < 0) j.extra.push(t.type); }
    write(jid, j);
  }
  confetti(); render();
}
function discardTrk() {
  if (!trkDel) { trkDel = true; renderTrk(); return; }
  closeTrkAll(); render();
}

/* Carte (Leaflet + OpenStreetMap, chargés seulement quand on en a besoin) */
function loadLeaflet() {
  if (window.L && window.L.map) return Promise.resolve(window.L);
  if (!leafletP) leafletP = new Promise((res, rej) => {
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "vendor/leaflet.css"; document.head.appendChild(css);
    const sc = document.createElement("script"); sc.src = "vendor/leaflet.js";
    sc.onload = () => (window.L && window.L.map) ? res(window.L) : rej(new Error("leaflet"));
    sc.onerror = () => { leafletP = null; rej(new Error("leaflet")); };
    document.head.appendChild(sc);
  });
  return leafletP;
}
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#2C43CF";
function destroyMap() { if (tMap) { try { tMap.remove(); } catch (e) {} } tMap = tLine = tDot = tAcc = null; tShown = -1; tCentered = false; }
function mountTrkMap() {
  const el = document.getElementById("t-map"); if (!el) return;
  loadLeaflet().then(L => {
    if (!el.isConnected || !trk) return;
    destroyMap();
    tMap = L.map(el, { zoomControl: false, attributionControl: true });
    tMap.attributionControl.setPrefix(false);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(tMap);
    const col = cssVar("--accent");
    tLine = L.polyline(rawSegs(trk.pts), { color: col, weight: 5, opacity: 0.9, lineJoin: "round", lineCap: "round" }).addTo(tMap);
    tAcc = L.circle([0, 0], { radius: 5, color: col, weight: 1, opacity: 0.4, fillOpacity: 0.1, interactive: false });
    tDot = L.circleMarker([0, 0], { radius: 8, color: "#fff", weight: 3, fillColor: col, fillOpacity: 1, interactive: false });
    tMap.on("dragstart", () => { trkFollow = false; const b = document.getElementById("t-recenter"); if (b) b.hidden = false; });
    if (trk.end && trk.pts.length > 1) { tMap.fitBounds(tLine.getBounds(), { padding: [28, 28], maxZoom: 17 }); tCentered = true; }
    else if (trkFix) { tMap.setView([trkFix.lat, trkFix.lng], 16); tCentered = true; }
    else if (trk.pts.length) { const l = trk.pts[trk.pts.length - 1]; tMap.setView([l[0], l[1]], 16); tCentered = true; }
    else tMap.setView([44.8378, -0.5792], 12); // Bordeaux, le temps que le GPS réponde
    tShown = trk.pts.length;
    setTimeout(() => { if (tMap) tMap.invalidateSize(); }, 200);
    updateMap();
  }).catch(() => { el.innerHTML = '<p class="t-nomap">Carte indisponible pour l\'instant (réseau ?). Le compteur de km marche quand même.</p>'; });
}
function updateMap() {
  if (!tMap || !trk) return;
  if (trk.pts.length !== tShown) { tLine.setLatLngs(rawSegs(trk.pts)); tShown = trk.pts.length; }
  if (trkFix && !trk.end) {
    const ll = [trkFix.lat, trkFix.lng];
    tDot.setLatLng(ll); tAcc.setLatLng(ll).setRadius(Math.max(3, trkFix.acc || 3));
    if (!tMap.hasLayer(tDot)) { tAcc.addTo(tMap); tDot.addTo(tMap); }
    if (!tCentered) { tMap.setView(ll, 16); tCentered = true; }
    else if (trkFollow) tMap.panTo(ll, { animate: true });
  }
}

/* Écran du traceur */
function renderTrk() {
  if (!trk) { $trk.hidden = true; return; }
  const a = TRK[trk.type], ended = !!trk.end, paused = !!trk.pauseAt, secs = trkSecs(trk);
  let h = '<div class="p-top"><button type="button" class="p-x" data-t="hide" aria-label="' + (ended ? "Fermer (la sortie reste à enregistrer)" : "Réduire, le GPS continue") + '">' + (ended ? "✕" : "↓") + "</button>" +
    '<div class="p-title"><b>' + a.ic + " " + esc(a.nom) + (ended ? " · terminée" : paused ? " · en pause" : " · GPS actif") + '</b><span id="t-el">' + fmtClock(secs) + "</span></div>" +
    (ended ? "" : '<span class="t-gps" id="t-gps">GPS…</span>') + "</div>";
  h += '<div class="p-body t-body">';
  h += '<div class="t-mapbox"><div class="t-map" id="t-map"></div>' + (ended ? "" : '<button type="button" class="btn sm t-recenter" id="t-recenter" data-t="recenter"' + (trkFollow ? " hidden" : "") + ">◎ Recentrer</button>") + "</div>";
  h += '<div class="t-big"><b id="t-km">' + fmtKm(trk.km) + "</b><span>km</span></div>";
  h += '<div class="t-grid"><div><b id="t-dur">' + fmtClock(secs) + "</b><span>durée</span></div>" +
    '<div><b id="t-avg">' + paceLabel(trk.type, trk.km, secs) + "</b><span>" + (trk.type === "VELO" ? "moyenne" : "allure moy.") + "</span></div>" +
    '<div><b id="t-now">' + (ended ? speedLabel(trk.type, trk.vmax || null) : "—") + "</b><span>" + (ended ? (trk.type === "VELO" ? "pointe" : "meilleure allure") : (trk.type === "VELO" ? "vitesse" : "allure")) + "</span></div></div>";
  h += '<p class="t-msg" id="t-msg"></p>';
  if (!ended) {
    h += '<div class="p-actions t-actions"><button type="button" class="btn big ghost" data-t="pause">' + (paused ? "▶ Reprendre" : "❚❚ Pause") + '</button><button type="button" class="btn big good" data-t="end">■ Terminer</button></div>' +
      '<div class="p-mini"><button type="button" data-t="lock">🔒 Mode poche (écran noir)</button><button type="button" data-t="hide">Réduire ›</button></div>' +
      '<p class="small muted">Laisse l\'app ouverte : ici l\'écran ne s\'éteint pas tout seul. Sur iPhone, une app web perd le GPS si l\'écran se verrouille ; si ça arrive, je relie le trou en ligne droite quand tu reviens. Téléphone en poche ou sur le guidon : active le mode poche.</p>';
  } else {
    const dt = parseYmd(trk.date), plan = planFor(ymd(mondayOf(dt)))[dayIdx(dt)];
    h += '<label class="toggle" for="t-count"><input type="checkbox" id="t-count" data-t="count"' + (trkCount ? " checked" : "") + "><span>Compter comme ta séance " + esc(a.nom.toLowerCase()) + " " + (trk.date === todayKey() ? "du jour" : "du " + fdate(trk.date)) + (plan.indexOf(trk.type) >= 0 ? " (prévue au planning)" : " (en plus du planning)") + "</span></label>";
    if (trk.km < 0.05) h += '<p class="warnbox">Moins de 50 m enregistrés : le GPS n\'a sans doute pas capté. Tu peux quand même garder la durée.</p>';
    h += '<div class="p-actions"><button type="button" class="btn big good" data-t="save">Enregistrer la sortie</button><button type="button" class="btn big ghost" data-t="resume">Reprendre l\'enregistrement</button></div>' +
      '<div class="p-mini"><button type="button" data-t="discard">' + (trkDel ? "Sûr ? Touche encore pour supprimer" : "Supprimer cette sortie") + "</button></div>";
  }
  h += "</div>";
  h += '<div class="t-lock" id="t-lock" hidden><b id="t-lock-km">' + fmtKm(trk.km) + ' km</b><span id="t-lock-el">' + fmtClock(secs) + "</span><p>Garde le doigt appuyé 1 seconde pour déverrouiller</p></div>";
  $trk.innerHTML = h;
  mountTrkMap();
  updateTrk();
}
function updateTrk() {
  updateBar();
  if (!trk || $trk.hidden) return;
  const secs = trkSecs(trk);
  const set = (id, v) => { const e = document.getElementById(id); if (e && e.textContent !== v) e.textContent = v; };
  set("t-el", fmtClock(secs)); set("t-dur", fmtClock(secs)); set("t-km", fmtKm(trk.km)); set("t-avg", paceLabel(trk.type, trk.km, secs));
  set("t-lock-km", fmtKm(trk.km) + " km"); set("t-lock-el", fmtClock(secs));
  let msg = "";
  if (!trk.end) {
    const fresh = trkFix && Date.now() - trkFix.t < 15000;
    const sp = fresh && trkFix.spd != null ? trkFix.spd : (trkSpdFb && Date.now() - trkSpdFb.t < 15000 ? trkSpdFb.v : null);
    set("t-now", trk.pauseAt ? "pause" : fresh ? speedLabel(trk.type, sp) : "—");
    const g = document.getElementById("t-gps");
    if (g) {
      const acc = fresh ? Math.round(trkFix.acc) : null;
      g.textContent = acc == null ? "GPS…" : "± " + acc + " m";
      g.className = "t-gps" + (acc == null ? "" : acc <= 15 ? " ok" : acc <= 40 ? " mid" : " bad");
    }
    msg = trkMsg;
    if (!msg && !trk.pts.length) msg = "Je cherche ta position… la première fois, ça peut prendre 20 à 30 secondes.";
  }
  if (!msg && trk.gaps) msg = trk.gaps + (trk.gaps > 1 ? " coupures" : " coupure") + " du GPS (écran verrouillé ?) " + (trk.gaps > 1 ? "reliées" : "reliée") + " en ligne droite.";
  set("t-msg", msg);
  updateMap();
}
function tickTrk() {
  if (!trk) { clearInterval(trkTicker); trkTicker = null; updateBar(); return; }
  updateTrk();
}
$trk.addEventListener("click", e => {
  const b = e.target.closest("[data-t]");
  if (!b || !trk) return;
  const act = b.dataset.t;
  if (act === "hide") hideTrk();
  else if (act === "pause") pauseTrk();
  else if (act === "end") endTrk();
  else if (act === "resume") resumeTrk();
  else if (act === "save") saveTrk();
  else if (act === "discard") discardTrk();
  else if (act === "recenter") { trkFollow = true; b.hidden = true; if (tMap && trkFix) tMap.setView([trkFix.lat, trkFix.lng], Math.max(tMap.getZoom() || 16, 15)); }
  else if (act === "lock") { const l = document.getElementById("t-lock"); if (l) l.hidden = false; }
});
$trk.addEventListener("change", e => { if (e.target.dataset.t === "count") trkCount = e.target.checked; });
$trk.addEventListener("pointerdown", e => {
  const l = e.target.closest("#t-lock"); if (!l) return;
  e.preventDefault();
  clearTimeout(lockTimer); l.classList.add("hold");
  lockTimer = setTimeout(() => { l.hidden = true; l.classList.remove("hold"); lockTimer = null; }, 900);
});
["pointerup", "pointercancel"].forEach(ev => $trk.addEventListener(ev, () => {
  if (!lockTimer) return;
  clearTimeout(lockTimer); lockTimer = null;
  const l = document.getElementById("t-lock"); if (l) l.classList.remove("hold");
}));

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
function stopRun() { run = null; lsDel(LS_RUN); if (!(trk && !trk.end)) keepAwake(false); updateBar(); }
function startCountdown(sec, label, kind) {
  audio();
  cd = { end: Date.now() + sec * 1000, label: label, kind: kind };
  lastBeep = -1; startTicker();
}
function stopCountdown() { cd = null; updateBar(); }
function startTicker() { if (!ticker) ticker = setInterval(updateBar, 250); updateBar(); }
function updateBar() {
  const showRun = !!run, showCd = !!cd, showTrk = !!trk && $trk.hidden;
  $runbar.hidden = !(showRun || showCd || showTrk);
  $trkEl.hidden = !showTrk;
  if (showTrk) {
    $trkKm.textContent = TRK[trk.type].ic + " " + fmtKm(trk.km) + " km";
    $trkLbl.textContent = (trk.end ? "Sortie à enregistrer" : trk.pauseAt ? "Sortie en pause" : fmtClock(trkSecs(trk)) + " · GPS actif") + " · touche pour ouvrir";
  }
  if (showRun) {
    $runEl.hidden = false;
    $runTime.textContent = fmtClock((Date.now() - run.start) / 1000);
    $runLbl.textContent = (ACT[run.code] ? ACT[run.code].nom : "Séance") + " en cours · touche pour reprendre";
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
      setTimeout(() => { if (!cd) { $cd.hidden = true; $cdStop.hidden = true; if (!run && !(trk && $trk.hidden)) $runbar.hidden = true; } }, 3500);
      return;
    }
  } else { $cd.hidden = true; $cdStop.hidden = true; }
  if (!showRun && !showCd && ticker) { clearInterval(ticker); ticker = null; }
}
$cdStop.addEventListener("click", stopCountdown);
document.getElementById("runbar").addEventListener("click", e => {
  if (e.target.closest("#cd-stop")) return;
  if (e.target.closest("#trk-el") || (trk && !play)) { openTrk(); return; }
  if (play) openPlay(play.code, play.date);
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    if (run || (trk && !trk.end)) keepAwake(true);
    if (trk && !trk.end) { stopGps(); watchGps(); }
    if (token()) sync();
  }
});

/* ---------- Mode séance guidé (plein écran) ---------- */
const LS_PLAY = "suivi.play";
const $play = document.getElementById("play");
let play = (function () { try { return JSON.parse(lsGet(LS_PLAY) || "null"); } catch (e) { return null; } })();
let playTicker = null, playFlash = "";
function savePlay() { if (play) lsSet(LS_PLAY, JSON.stringify(play)); else lsDel(LS_PLAY); }
function sessionId(code, date) { return "s-" + date + "-" + code; }
function sessionPlan(code, date) {
  const w = weekNum(mondayOf(parseYmd(date)));
  return EX[code].map((ex, i) => ({ ex: ex, i: i, n: setsFor(code, i, ex, w) }));
}
function totalSets(code, date) { return sessionPlan(code, date).reduce((a, x) => a + x.n, 0); }
function doneSets(code, date) {
  const doc = D(sessionId(code, date)) || {};
  return sessionPlan(code, date).reduce((a, x) => a + ((doc.sets && Array.isArray(doc.sets[x.ex.id])) ? doc.sets[x.ex.id].slice(0, x.n).filter(isNum).length : 0), 0);
}
function firstOpen(code, date) {
  const doc = D(sessionId(code, date)) || {};
  for (const x of sessionPlan(code, date)) {
    const vals = (doc.sets && doc.sets[x.ex.id]) || [];
    for (let k = 0; k < x.n; k++) if (!isNum(vals[k])) return { i: x.i, k: k };
  }
  return null;
}
function bestBefore(exId, date) {
  let best = null;
  for (const id in state.docs) {
    if (id.slice(0, 2) !== "s-") continue;
    const d = state.docs[id];
    if (!d || !(d.date < date) || !d.sets || !Array.isArray(d.sets[exId])) continue;
    d.sets[exId].forEach(v => { if (isNum(v) && (best == null || v > best)) best = v; });
  }
  return best;
}
function defaultValue(ex, code, date, k) {
  const doc = D(sessionId(code, date)) || {};
  const cur = doc.sets && doc.sets[ex.id] && doc.sets[ex.id][k];
  if (isNum(cur)) return cur;
  const last = lastFor(code, ex.id, date);
  if (last && isNum(last.v[k])) return last.v[k];
  if (last) { const nums = last.v.filter(isNum); if (nums.length) return nums[nums.length - 1]; }
  if (ex.fin) { const p = metricSeries("pompes"); return p.length ? Math.max(1, p[p.length - 1].v - 1) : 25; }
  return ex.min;
}
function openPlay(code, date) {
  audio();
  if (!play || play.code !== code || play.date !== date) {
    const pos = firstOpen(code, date);
    play = { code: code, date: date, i: pos ? pos.i : 0, k: pos ? pos.k : 0, phase: pos ? ((code !== "G" && pos.i === 0 && pos.k === 0) ? "warm" : "set") : "done", warm: {}, val: null, end: 0, total: 0 };
    if (!run || run.code !== code || run.date !== date) { run = { code: code, date: date, start: Date.now() }; lsSet(LS_RUN, JSON.stringify(run)); }
  }
  play.open = true; savePlay();
  keepAwake(true); startTicker(); renderPlay(); startPlayTicker();
}
function closePlay() { if (play) { play.open = false; savePlay(); } $play.hidden = true; document.body.style.overflow = ""; stopPlayTicker(); render(); }
function startPlayTicker() { if (!playTicker) playTicker = setInterval(tickPlay, 250); }
function stopPlayTicker() { clearInterval(playTicker); playTicker = null; }
function ringSvg(frac, big, small) {
  const C = 2 * Math.PI * 92;
  return '<svg class="ring" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="92" class="ring-bg"/><circle id="ring-fg" cx="110" cy="110" r="92" class="ring-fg" style="stroke-dasharray:' + C.toFixed(1) + ";stroke-dashoffset:" + (C * (1 - Math.max(0, Math.min(1, frac)))).toFixed(1) + '"/></svg><div class="ring-txt"><b id="ring-big">' + big + '</b><span>' + small + "</span></div>";
}
function nextLabel(code, date, i, k) {
  const plan = sessionPlan(code, date);
  if (k + 1 < plan[i].n) return plan[i].ex.nom + " · série " + (k + 2) + "/" + plan[i].n;
  if (i + 1 < plan.length) return plan[i + 1].ex.nom + " · série 1/" + plan[i + 1].n;
  return "Fin de la séance";
}
function playVideo(ex) {
  return '<div class="pvid" data-yt="' + esc(ex.yt) + '"><video src="videos/' + esc(ex.v) + '.mp4" playsinline muted loop autoplay preload="auto"></video></div>';
}
function renderPlay() {
  if (!play || !play.open) { $play.hidden = true; return; }
  const code = play.code, date = play.date, a = ACT[code];
  const plan = sessionPlan(code, date);
  const tot = totalSets(code, date), dn = doneSets(code, date);
  let h = '<div class="p-top"><button type="button" class="p-x" data-p="close" aria-label="Mettre en pause et fermer">✕</button>' +
    '<div class="p-title"><b>' + esc(a.nom) + " · " + esc(a.sous) + '</b><span id="p-elapsed">' + (run ? fmtClock((Date.now() - run.start) / 1000) : "0:00") + "</span></div>" +
    '<span class="p-count">' + dn + "/" + tot + '</span></div><div class="p-prog"><i style="width:' + (tot ? Math.round(dn / tot * 100) : 0) + '%"></i></div>';
  h += '<div class="p-body">';
  if (play.phase === "warm") {
    const n = ECHAUFF.filter((x, j) => play.warm[j]).length;
    h += '<p class="p-kicker">Échauffement · 5 min</p><h2 class="p-h">On chauffe les épaules et les coudes</h2><div class="p-warm">' +
      ECHAUFF.map((x, j) => '<button type="button" class="p-wi' + (play.warm[j] ? " on" : "") + '" data-p="warm" data-j="' + j + '"><span class="p-chk">' + (play.warm[j] ? "✓" : "") + "</span>" + esc(x) + "</button>").join("") + "</div>" +
      '<div class="p-actions"><button type="button" class="btn big" data-p="startsets">' + (n === ECHAUFF.length ? "C'est parti" : "Passer à la séance") + "</button></div>";
  } else if (play.phase === "set" || play.phase === "hold") {
    const x = plan[play.i], ex = x.ex;
    if (play.val == null) play.val = defaultValue(ex, code, date, play.k);
    const last = lastFor(code, ex.id, date);
    const best = bestBefore(ex.id, date);
    h += playVideo(ex);
    h += '<p class="p-kicker">Exercice ' + (play.i + 1) + "/" + plan.length + " · Série " + (play.k + 1) + "/" + x.n + "</p>" +
      '<h2 class="p-h">' + esc(ex.nom) + (ex.detail ? ' <span class="p-det">· ' + esc(ex.detail) + "</span>" : "") + "</h2>" +
      '<p class="p-target">Objectif : ' + esc(target(ex, x.n)) + (best != null ? ' · record <b>' + best + "</b>" : "") + "</p>" +
      '<p class="p-cue">' + esc(ex.c) + "</p>";
    if (play.phase === "hold") {
      const left = Math.max(0, (play.end - Date.now()) / 1000);
      h += '<div class="p-ring hold">' + ringSvg(left / play.total, Math.ceil(left), "secondes") + '</div><div class="p-actions"><button type="button" class="btn big ghost" data-p="holdstop">J\'arrête là</button></div>';
    } else {
      h += '<div class="stepper"><button type="button" data-p="dec" aria-label="Moins">−</button><output id="p-val">' + play.val + '</output><button type="button" data-p="inc" aria-label="Plus">+</button></div>' +
        '<p class="p-unit">' + esc(ex.u) + (last && isNum(last.v[play.k]) ? " · la dernière fois : " + last.v[play.k] : "") + "</p>";
      if (playFlash) h += '<p class="p-flash">' + esc(playFlash) + "</p>";
      h += '<div class="p-actions">' + (isTimed(ex) ? '<button type="button" class="btn big ghost" data-p="hold">Lancer le chrono ' + ex.min + " s</button>" : "") +
        '<button type="button" class="btn big good" data-p="validate">Valider la série</button></div>' +
        '<div class="p-mini"><button type="button" data-p="prev">‹ Série précédente</button><button type="button" data-p="skipex">Passer l\'exercice ›</button></div>';
    }
  } else if (play.phase === "rest") {
    const left = Math.max(0, (play.end - Date.now()) / 1000);
    h += '<p class="p-kicker">Repos</p><div class="p-ring">' + ringSvg(left / play.total, fmtClock(Math.ceil(left)), "respire") + "</div>" +
      (playFlash ? '<p class="p-flash">' + esc(playFlash) + "</p>" : "") +
      '<p class="p-next">Ensuite : <b>' + esc(plan[play.i].ex.nom + " · série " + (play.k + 1) + "/" + plan[play.i].n) + "</b></p>" +
      '<div class="p-actions"><button type="button" class="btn big ghost" data-p="plus15">+15 s</button><button type="button" class="btn big" data-p="skiprest">Passer le repos</button></div>';
  } else {
    const doc = D(sessionId(code, date)) || {};
    let reps = 0, sets = 0;
    plan.forEach(x => { const v = (doc.sets && doc.sets[x.ex.id]) || []; v.slice(0, x.n).forEach(n => { if (isNum(n)) { sets++; if (!isTimed(x.ex)) reps += n * (x.ex.u.indexOf("côté") >= 0 ? 2 : 1); } }); });
    const prs = (doc.prs || []).map(id => (plan.find(x => x.ex.id === id) || {}).ex).filter(Boolean);
    const mins = run ? Math.max(1, Math.round((Date.now() - run.start) / 60000)) : (doc.duree || 0);
    h += '<p class="p-kicker">Séance terminée</p><h2 class="p-h">Bien joué, Léopold.</h2>' +
      '<div class="p-sum"><div><b>' + mins + "</b><span>minutes</span></div><div><b>" + sets + "</b><span>séries</span></div><div><b>" + reps + "</b><span>répétitions</span></div></div>" +
      (prs.length ? '<div class="p-prs"><b>Records battus</b>' + prs.map(e => "<span>🏆 " + esc(e.nom) + "</span>").join("") + "</div>" : "") +
      '<p class="p-cue">Note ton ressenti si tu veux, puis valide : la séance compte pour ta semaine.</p>' +
      '<label class="f" for="p-note">Note (poids du sac, douleur, sensation…)<textarea id="p-note" data-p-note="1">' + esc(doc.note || "") + "</textarea></label>" +
      '<div class="p-actions"><button type="button" class="btn big good" data-p="finish">Terminer la séance</button></div>' +
      '<div class="p-mini"><button type="button" data-p="prev">‹ Revenir à la dernière série</button></div>';
  }
  h += "</div>";
  $play.innerHTML = h;
  $play.hidden = false;
  document.body.style.overflow = "hidden";
  const v = $play.querySelector("video");
  if (v) { v.addEventListener("error", () => { const box = v.closest(".pvid"); if (box) box.innerHTML = '<a class="pvid-yt" href="' + ytLink(box.dataset.yt || "") + '" target="_blank" rel="noopener">▶ Voir la technique sur YouTube</a>'; }); try { v.play(); } catch (e) {} }
}
function tickPlay() {
  if (!play || !play.open) return;
  const el = document.getElementById("p-elapsed");
  if (el && run) el.textContent = fmtClock((Date.now() - run.start) / 1000);
  if (play.phase !== "rest" && play.phase !== "hold") return;
  const left = (play.end - Date.now()) / 1000;
  const fg = document.getElementById("ring-fg"), big = document.getElementById("ring-big");
  const C = 2 * Math.PI * 92;
  if (fg) fg.style.strokeDashoffset = (C * (1 - Math.max(0, left) / play.total)).toFixed(1);
  if (big) big.textContent = play.phase === "rest" ? fmtClock(Math.max(0, Math.ceil(left))) : Math.max(0, Math.ceil(left));
  const s = Math.ceil(left);
  if (s <= 3 && s > 0 && s !== play.lastBeep) { play.lastBeep = s; beep(660, 0.12); }
  if (left <= 0) {
    beep(990, 0.6);
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
    if (play.phase === "hold") { play.val = play.total; playFlash = "Tenu " + play.total + " s. Valide la série."; }
    else playFlash = "";
    play.phase = "set"; play.lastBeep = null; savePlay(); renderPlay();
  }
}
function advance() {
  const plan = sessionPlan(play.code, play.date);
  let i = play.i, k = play.k + 1;
  if (k >= plan[i].n) { i++; k = 0; }
  const restSec = plan[play.i].ex.repos;
  if (i >= plan.length) { play.phase = "done"; play.i = plan.length - 1; play.k = plan[plan.length - 1].n - 1; }
  else {
    play.i = i; play.k = k; play.val = null;
    if (restSec > 0) { play.phase = "rest"; play.total = restSec; play.end = Date.now() + restSec * 1000; play.lastBeep = null; }
    else play.phase = "set";
  }
  savePlay();
}
function validateSet() {
  const plan = sessionPlan(play.code, play.date), x = plan[play.i];
  const id = sessionId(play.code, play.date);
  const doc = clone(D(id));
  doc.date = play.date; doc.code = play.code; doc.sets = doc.sets || {};
  const arr = Array.isArray(doc.sets[x.ex.id]) ? doc.sets[x.ex.id] : [];
  for (let k = 0; k < x.n; k++) if (!isNum(arr[k])) arr[k] = null;
  arr[play.k] = play.val;
  doc.sets[x.ex.id] = arr;
  const best = bestBefore(x.ex.id, play.date);
  playFlash = "";
  if (best != null && play.val > best) {
    doc.prs = Array.isArray(doc.prs) ? doc.prs : [];
    if (doc.prs.indexOf(x.ex.id) < 0) doc.prs.push(x.ex.id);
    playFlash = x.ex.fin ? "🏆 Record de pompes d'affilée : " + (play.val + 1) + " (avant : " + (best + 1) + ")" : "🏆 Nouveau record sur " + x.ex.nom + " : " + play.val + " (avant : " + best + ")";
    beep(1320, 0.25);
  }
  write(id, doc);
  advance();
  renderPlay();
}
function finishSession() {
  const code = play.code, date = play.date;
  const id = sessionId(code, date);
  const doc = clone(D(id));
  doc.date = date; doc.code = code;
  const noteEl = document.getElementById("p-note");
  if (noteEl) doc.note = noteEl.value;
  if (run) doc.duree = Math.max(1, Math.round((Date.now() - run.start) / 60000));
  write(id, doc);
  const jid = "j-" + date, j = clone(D(jid)); j.fait = j.fait || {}; j.fait[code] = true; write(jid, j);
  play = null; savePlay(); stopRun(); stopPlayTicker();
  $play.hidden = true; document.body.style.overflow = "";
  confetti();
  render();
}
function confetti() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = document.createElement("div");
  box.className = "confetti";
  const colors = ["#2C43CF", "#1B7C47", "#F0AE4C", "#E2523F", "#8090FF"];
  for (let n = 0; n < 60; n++) {
    const s = document.createElement("i");
    s.style.left = Math.random() * 100 + "vw";
    s.style.background = colors[n % colors.length];
    s.style.animationDelay = (Math.random() * 0.6).toFixed(2) + "s";
    s.style.transform = "rotate(" + Math.round(Math.random() * 360) + "deg)";
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3500);
}
$play.addEventListener("click", e => {
  const b = e.target.closest("[data-p]");
  if (!b || !play) return;
  audio();
  const act = b.dataset.p;
  const plan = sessionPlan(play.code, play.date);
  if (act === "close") { closePlay(); return; }
  if (act === "warm") { const j = Number(b.dataset.j); play.warm[j] = !play.warm[j]; savePlay(); renderPlay(); return; }
  if (act === "startsets") { play.phase = "set"; play.val = null; savePlay(); renderPlay(); return; }
  if (act === "inc" || act === "dec") {
    const ex = plan[play.i].ex, step = isTimed(ex) ? 5 : 1;
    play.val = Math.max(0, (play.val || 0) + (act === "inc" ? step : -step));
    const o = document.getElementById("p-val"); if (o) o.textContent = play.val;
    savePlay(); return;
  }
  if (act === "validate") { validateSet(); return; }
  if (act === "hold") { const ex = plan[play.i].ex; play.phase = "hold"; play.total = ex.min; play.end = Date.now() + ex.min * 1000; play.holdStart = Date.now(); play.lastBeep = null; playFlash = ""; savePlay(); renderPlay(); return; }
  if (act === "holdstop") { play.val = Math.max(1, Math.round((Date.now() - play.holdStart) / 1000)); play.phase = "set"; playFlash = "Tenu " + play.val + " s."; savePlay(); renderPlay(); return; }
  if (act === "skiprest") { play.phase = "set"; playFlash = ""; savePlay(); renderPlay(); return; }
  if (act === "plus15") { play.end += 15000; play.total += 15; savePlay(); tickPlay(); return; }
  if (act === "prev") {
    if (play.phase === "done") { play.phase = "set"; }
    else if (play.k > 0) play.k--;
    else if (play.i > 0) { play.i--; play.k = plan[play.i].n - 1; }
    play.val = null; play.phase = "set"; playFlash = ""; savePlay(); renderPlay(); return;
  }
  if (act === "skipex") {
    if (play.i + 1 < plan.length) { play.i++; play.k = 0; play.phase = "set"; }
    else play.phase = "done";
    play.val = null; playFlash = ""; savePlay(); renderPlay(); return;
  }
  if (act === "finish") { finishSession(); return; }
});
$play.addEventListener("input", e => {
  if (!play || !e.target.dataset.pNote) return;
  const id = sessionId(play.code, play.date), doc = clone(D(id));
  doc.date = play.date; doc.code = play.code; doc.note = e.target.value; write(id, doc);
});

/* ---------- Série, records, badges ---------- */
function dayStatus(k) {
  const d = parseYmd(k), mon = mondayOf(d), plan = planFor(ymd(mon))[dayIdx(d)];
  const j = D("j-" + k) || {}, fait = j.fait || {};
  const muscu = plan.filter(c => ACT[c].type === "muscu");
  const doneAny = Object.keys(fait).some(c => fait[c] && ACT[c]);
  const doneMuscu = Object.keys(fait).filter(c => fait[c] && ACT[c] && ACT[c].type === "muscu").length;
  return { planned: plan, muscu: muscu, doneAny: doneAny, doneMuscu: doneMuscu, ok: muscu.length ? doneMuscu >= muscu.length : true };
}
function streak() {
  let n = 0;
  const today = new Date();
  const st0 = dayStatus(ymd(today));
  let d = st0.doneAny ? today : addDays(today, -1);
  for (let guard = 0; guard < 400; guard++) {
    const k = ymd(d);
    if (k < "2026-11-16") break;
    const st = dayStatus(k);
    if (!st.ok) break;
    if (st.doneAny) n++;
    d = addDays(d, -1);
  }
  return n;
}
function allSessions() { return Object.keys(state.docs).filter(id => id.slice(0, 2) === "s-").map(id => state.docs[id]).filter(Boolean); }
function musclDoneCount() { let n = 0; for (const id in state.docs) if (id.slice(0, 2) === "j-") { const f = (state.docs[id] || {}).fait || {}; for (const c in f) if (f[c] && ACT[c] && ACT[c].type === "muscu") n++; } return n; }
function records() {
  const out = [];
  ["A", "B", "C", "G"].forEach(code => EX[code].forEach(ex => {
    if (out.find(r => r.nom === ex.nom && r.u === ex.u)) return;
    let best = null, date = null;
    allSessions().forEach(s => { const v = s.sets && s.sets[ex.id]; if (Array.isArray(v)) v.forEach(n => { if (isNum(n) && (best == null || n > best)) { best = ex.fin ? n + 1 : n; date = s.date; } }); });
    if (best != null) out.push({ nom: ex.fin ? "Pompes d'affilée" : ex.nom, u: ex.fin ? "rép." : ex.u, best: best, date: date });
  }));
  return out;
}
const PUSH_IDS = { a1: 1, a2: 1, a4: 1, a5: 1, a6: 1, c1: 2, c2: 1 };
function pushupTotal() { let t = 0; allSessions().forEach(s => { for (const id in PUSH_IDS) { const v = s.sets && s.sets[id]; if (Array.isArray(v)) v.forEach(n => { if (isNum(n)) t += n * PUSH_IDS[id]; }); } }); return t; }
function stepDays() { let n = 0; const t = todayKey(); for (let d = parseYmd("2026-11-16"); ymd(d) <= t; d = addDays(d, 1)) { const p = pasFor(ymd(d)); if (p && p.v >= STEP_GOAL) n++; } return n; }
function perfectWeeks() {
  let n = 0;
  const cur = weekNum(mondayOf(new Date()));
  for (let w = 1; w < Math.min(cur, 13); w++) { const mon = addDays(START, (w - 1) * 7), st = weekStats(mon, planFor(ymd(mon)), null); if (st.pm && st.dm >= st.pm) n++; }
  return n;
}
function badges() {
  const m = musclDoneCount(), pr = allSessions().some(s => Array.isArray(s.prs) && s.prs.length), pt = pushupTotal(), sd = stepDays(), pw = perfectWeeks(), stk = streak();
  const parc = (() => { let n = 0; for (const id in state.docs) if (id.slice(0, 2) === "j-") { const f = (state.docs[id] || {}).fait || {}; if (f.B) n++; } return n; })();
  return [
    { ic: "🎯", nom: "Première séance", ok: m >= 1, info: m >= 1 ? "Débloqué" : "Termine ta première séance" },
    { ic: "🔥", nom: "Série de 7 jours", ok: stk >= 7, info: Math.min(stk, 7) + "/7 jours" },
    { ic: "📅", nom: "Semaine parfaite", ok: pw >= 1, info: pw >= 1 ? pw + " semaine" + (pw > 1 ? "s" : "") : "Toutes les séances d'une semaine" },
    { ic: "💪", nom: "10 séances", ok: m >= 10, info: Math.min(m, 10) + "/10" },
    { ic: "🏋️", nom: "25 séances", ok: m >= 25, info: Math.min(m, 25) + "/25" },
    { ic: "🏆", nom: "Premier record", ok: pr, info: pr ? "Débloqué" : "Bats un record en séance" },
    { ic: "🫸", nom: "1 000 pompes", ok: pt >= 1000, info: Math.min(pt, 1000) + "/1 000" },
    { ic: "🚶", nom: "7 jours à 8 000 pas", ok: sd >= 7, info: Math.min(sd, 7) + "/7 jours" },
    { ic: "🌅", nom: "5 séances au parc", ok: parc >= 5, info: Math.min(parc, 5) + "/5" }
  ];
}
function heatmap() {
  let h = '<div class="heat" role="img" aria-label="Calendrier des séances, semaine 0 à 12"><div class="heat-h"><span></span>' + JOURS_C.map(d => "<span>" + d.charAt(0) + "</span>").join("") + "</div>";
  const tk = todayKey();
  for (let w = 0; w <= 12; w++) {
    const mon = addDays(START, (w - 1) * 7);
    h += '<div class="heat-r"><span class="heat-w">S' + w + "</span>";
    for (let i = 0; i < 7; i++) {
      const k = ymd(addDays(mon, i)), st = dayStatus(k);
      let cls = "rest";
      if (k > tk) cls = st.muscu.length ? "todo" : "rest";
      else if (st.doneMuscu) cls = "done";
      else if (st.doneAny) cls = "cardio";
      else if (st.muscu.length && k < tk) cls = "miss";
      else if (st.muscu.length) cls = "todo";
      h += '<span class="hc ' + cls + (k === tk ? " now" : "") + '" title="' + fdate(k) + '"></span>';
    }
    h += "</div>";
  }
  return h + '</div><div class="heat-leg"><span><i class="hc done"></i>muscu faite</span><span><i class="hc cardio"></i>cardio</span><span><i class="hc miss"></i>ratée</span><span><i class="hc todo"></i>prévue</span></div>';
}
function weekVolume() {
  const out = [];
  const cur = Math.max(1, Math.min(12, weekNum(mondayOf(new Date()))));
  for (let w = Math.max(0, cur - 7); w <= cur; w++) {
    const mon = addDays(START, (w - 1) * 7), a = ymd(mon), b = ymd(addDays(mon, 6));
    let reps = 0;
    allSessions().forEach(s => { if (s.date >= a && s.date <= b && s.sets) ["A", "B", "C"].forEach(code => { if (s.code !== code) return; EX[code].forEach(ex => { if (isTimed(ex)) return; const v = s.sets[ex.id]; if (Array.isArray(v)) v.forEach(n => { if (isNum(n)) reps += n * (ex.u.indexOf("côté") >= 0 ? 2 : 1); }); }); }); });
    out.push({ w: w, reps: reps });
  }
  return out;
}
function volumeBars(data) {
  const max = Math.max(1, ...data.map(d => d.reps));
  if (!data.some(d => d.reps)) return '<p class="muted small">Le volume apparaîtra après ta première séance validée.</p>';
  return '<div class="vbars">' + data.map(d => '<div class="vb"><span class="vb-n">' + (d.reps || "") + '</span><i style="height:' + Math.max(2, Math.round(d.reps / max * 100)) + '%"></i><span class="vb-l">S' + d.w + "</span></div>").join("") + "</div>";
}
function kmBars() {
  const cur = Math.max(0, Math.min(12, weekNum(mondayOf(new Date()))));
  const data = [];
  for (let w = Math.max(0, cur - 7); w <= cur; w++) { const k = kmWeek(addDays(START, (w - 1) * 7)); data.push({ w: w, walk: k.walk, bike: k.bike, t: k.total }); }
  if (!data.some(d => d.t)) return '<p class="muted small mt">Les km apparaîtront dès que tes pas arrivent ou après ta première sortie GPS.</p>';
  const max = Math.max(1, ...data.map(d => d.t));
  return '<div class="vbars">' + data.map(d => '<div class="vb"><span class="vb-n">' + (d.t ? fmtKm(d.t, d.t >= 10 ? 0 : 1) : "") + '</span><span class="vb-st" style="height:' + (d.t ? Math.max(3, Math.round(d.t / max * 100)) : 0) + '%"><i class="bk" style="flex:' + (d.t ? d.bike / d.t : 0).toFixed(4) + '"></i><i class="wk" style="flex:' + (d.t ? d.walk / d.t : 0).toFixed(4) + '"></i></span><span class="vb-l">S' + d.w + "</span></div>").join("") +
    '</div><div class="heat-leg"><span><i class="lg wk"></i>à pied</span><span><i class="lg bk"></i>à vélo</span></div>';
}
const MOTIV = [
  "40 minutes de séance, c'est moins qu'un scroll TikTok qui part en vrille.",
  "Pose Insta, prends le tapis : les pecs ne se dessinent pas en regardant ceux des autres.",
  "Le meilleur moment pour faire ta séance, c'est avant d'ouvrir une appli.",
  "Une séance ratée, on la décale. Deux d'affilée, jamais.",
  "Chaque série validée compte. Même les mauvais jours.",
  "Tu ne te souviendras d'aucune vidéo de ce soir. De ta séance, si.",
  "Mets ton téléphone en mode avion pendant la séance : le chrono marche quand même.",
  "Petit rappel : 61 kg aujourd'hui, l'objectif c'est de prendre du muscle, pas d'en perdre."
];

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
  void running;
  h += '<p class="small muted">Saisie manuelle : tu peux corriger ou compléter tes séries ici. Pour t\'entraîner, utilise plutôt « Commencer la séance ».</p>';
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
  else {
    const ss = sorties().filter(s => s.date === t && s.type === code);
    if (ss.length) h += '<div class="mt">' + ss.map(s => sortieRow(s)).join("") + "</div>";
    if (code === "VELO") h += '<p class="small mt">Les jours de parc, y aller à vélo compte déjà. Lance le GPS : la distance et le tracé s\'enregistrent tout seuls.</p>';
  }
  h += '<div class="row mt">';
  if (a.type === "cardio" && TRK[code]) h += (trk ? '<button type="button" class="btn" data-act="gpsopen">📍 Sortie en cours · ' + fmtKm(trk.km) + " km</button>" : '<button type="button" class="btn' + (done ? " ghost" : "") + '" data-act="gps" data-type="' + code + '">📍 ' + (done ? "Nouvelle sortie GPS" : "Lancer le GPS") + "</button>");
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
  const km = kmDay(t);
  let h = '<div class="card"><div class="between"><h3>Pas et km du jour</h3><span class="small muted">objectif 8 000 pas</span></div>';
  h += '<div class="row mt" style="align-items:baseline;gap:6px 8px"><span class="bigsteps">' + (p ? fmt(p.v, 0) : "0") + '</span><span class="small muted">pas</span>' +
    (km.total > 0 ? '<span class="bigkm">' + fmtKm(km.total, 1) + '</span><span class="small muted">km</span>' : "") + "</div>";
  h += '<div class="bar mt' + (pct >= 100 ? " ok" : "") + '"><i style="width:' + pct + '%"></i></div>';
  const parts = [];
  if (p && p.km > 0) parts.push("🚶 " + fmtKm(p.km, 1) + " km de marche au GPS ≈ " + fmt(p.gps, 0) + " pas");
  if (p && p.extra > 0) parts.push("+ " + fmt(p.extra, 0) + " pas ajoutés à la main");
  if (km.bike > 0) parts.push("🚲 " + fmtKm(km.bike, 1) + " km à vélo");
  if (parts.length) h += '<p class="small mt">' + parts.join(" · ") + "</p>";
  const left = STEP_GOAL - (p ? p.v : 0);
  if (left > 0) h += '<p class="small mt">Il t\'en manque ' + fmt(left, 0) + " : environ " + fmtKm(stepsKm(left), 1) + " km, soit " + Math.max(5, Math.round(stepsKm(left) / 5 * 60 / 5) * 5) + " min de marche. Lance le GPS marche en sortant.</p>";
  else h += '<p class="small mt" style="color:var(--good);font-weight:700">Objectif de pas atteint 👏</p>';
  const ss = sorties().filter(s => s.date === t);
  if (ss.length) h += '<div class="mt">' + ss.map(s => sortieRow(s)).join("") + "</div>";
  h += '<div class="row mt">' + (trk
    ? '<button type="button" class="btn sm" data-act="gpsopen">📍 Sortie en cours · ' + fmtKm(trk.km) + " km</button>"
    : '<button type="button" class="btn sm" data-act="gps" data-type="MARCHE">🚶 GPS marche</button><button type="button" class="btn sm" data-act="gps" data-type="VELO">🚲 GPS vélo</button>') + "</div>";
  h += '<p class="small muted mt">Tes pas sont calculés à partir de tes marches GPS : 1 km ≈ ' + fmt(Math.round(1000 / STRIDE_M / 10) * 10, 0) + " pas.</p>";
  h += '<details class="warm mt"><summary>Marché sans le GPS ? Ajoute des pas à la main</summary><label class="f mt" for="pas-' + t + '" style="max-width:220px">Pas en plus aujourd\'hui<input id="pas-' + t + '" type="number" inputmode="numeric" min="0" step="100" value="' + (isNum(j.pas) && j.pas > 0 ? j.pas : "") + '" data-act="pas" data-date="' + t + '"></label></details>';
  return h + "</div>";
}
function weekStrip(mon, plan, tk) {
  let h = '<a class="wstrip" href="#semaine" aria-label="Voir la semaine">';
  const dm = doneMap(mon, plan);
  for (let i = 0; i < 7; i++) {
    const k = ymd(addDays(mon, i));
    const mus = plan[i].filter(c => ACT[c].type === "muscu");
    const allDone = plan[i].length && dm[i].every(Boolean);
    const someDone = dm[i].some(Boolean);
    let cls = plan[i].length ? (mus.length ? "plan" : "cardio") : "rest";
    if (allDone) cls = "done"; else if (someDone) cls += " part"; else if (k < tk && mus.length) cls = "miss";
    const lab = mus.length ? mus.map(c => c === "G" ? "G" : c).join("") : (plan[i].length ? "·" : "");
    h += '<span class="wd ' + cls + (k === tk ? " now" : "") + '"><small>' + JOURS_C[i].charAt(0) + "</small><b>" + (allDone ? "✓" : lab) + "</b></span>";
  }
  return h + "</a>";
}
function sessionStats(code, date) {
  const doc = D(sessionId(code, date)) || {};
  let reps = 0, sets = 0;
  sessionPlan(code, date).forEach(x => { const v = (doc.sets && doc.sets[x.ex.id]) || []; v.slice(0, x.n).forEach(n => { if (isNum(n)) { sets++; if (!isTimed(x.ex)) reps += n * (x.ex.u.indexOf("côté") >= 0 ? 2 : 1); } }); });
  return { reps: reps, sets: sets, duree: doc.duree, prs: (doc.prs || []).length };
}
function heroCard(code, t, j, isExtra) {
  const a = ACT[code];
  const done = !!(j.fait && j.fait[code]);
  const plan = sessionPlan(code, t);
  const tot = totalSets(code, t), dn = doneSets(code, t);
  const key = t + code;
  const open = !!S.open[key];
  let h = '<div class="card hero ' + (done ? "isdone" : "") + '">';
  if (done) {
    const st = sessionStats(code, t);
    h += '<p class="kicker good">✓ Séance faite</p><h3>' + esc(a.nom) + ' <span class="sous">· ' + esc(a.sous) + "</span></h3>" +
      '<div class="mini-stats"><span><b>' + (st.duree || "—") + "</b> min</span><span><b>" + st.sets + "</b> séries</span><span><b>" + st.reps + "</b> rép.</span>" + (st.prs ? "<span><b>🏆 " + st.prs + "</b> record" + (st.prs > 1 ? "s" : "") + "</span>" : "") + "</div>";
  } else {
    const kick = code === "B" ? "Au parc" : (new Date().getHours() < 14 ? "Aujourd'hui" : "Ce soir");
    h += '<p class="kicker">' + kick + (isExtra ? " · en plus" : "") + "</p><h3 class=\"hero-t\">" + esc(a.nom) + ' <span class="sous">· ' + esc(a.sous) + "</span></h3>" +
      '<p class="small muted">' + esc(a.lieu) + " · " + esc(a.duree) + " · " + plan.length + " exercices · " + tot + " séries</p>" +
      '<div class="ex-chips">' + plan.map(x => "<span>" + esc(x.ex.nom) + "</span>").join("") + "</div>";
    if (dn) h += '<div class="bar mt"><i style="width:' + Math.round(dn / tot * 100) + '%"></i></div><p class="small muted">' + dn + "/" + tot + " séries déjà faites</p>";
    h += '<button type="button" class="btn big mt" data-act="play" data-code="' + code + '" data-date="' + t + '">' + (dn || (play && play.code === code && play.date === t) ? "▶ Reprendre la séance" : "▶ Commencer la séance") + "</button>";
  }
  h += '<div class="row mt">';
  h += '<button type="button" class="btn sm ghost" data-act="open" data-key="' + key + '" data-def="0">' + (open ? "Masquer le détail" : "Détail et saisie manuelle") + "</button>";
  h += '<button type="button" class="btn sm quiet" data-act="done" data-code="' + code + '" data-date="' + t + '">' + (done ? "Annuler « fait »" : "Marquer comme faite") + "</button>";
  if (isExtra && !done) h += '<button type="button" class="btn sm quiet" data-act="unextra" data-code="' + code + '" data-date="' + t + '">Retirer</button>';
  h += "</div>";
  if (open) h += '<div class="mt">' + sessionBody(code, t) + "</div>";
  return h + "</div>";
}
function vToday() {
  const now = new Date(), t = ymd(now), mon = mondayOf(now), di = dayIdx(now), w = weekNum(mon);
  const plan = planFor(ymd(mon));
  const j = D("j-" + t) || {};
  const planned = plan[di];
  const extra = (Array.isArray(j.extra) ? j.extra : []).filter(c => ACT[c] && planned.indexOf(c) < 0);
  const list = planned.concat(extra);
  const stk = streak();
  const motiv = MOTIV[(now.getDate() + now.getMonth() * 3) % MOTIV.length];
  let h = '<div class="hello"><div><p class="date">' + JOURS[di] + " " + now.getDate() + " " + MOIS[now.getMonth()] + '</p><p class="motiv">' + esc(motiv) + "</p></div>" +
    '<div class="streak' + (stk ? "" : " zero") + '" title="Jours d\'affilée sans séance ratée"><b>🔥 ' + stk + "</b><span>jour" + (stk > 1 ? "s" : "") + "</span></div></div>";
  h += weekStrip(mon, plan, t);
  h += '<div class="stack mt">' + installCard();
  if (play && !play.open && (play.date !== t || list.indexOf(play.code) < 0)) {
    h += '<div class="card hero"><p class="kicker">Séance en pause</p><h3>' + esc(ACT[play.code].nom) + ' <span class="sous">· ' + fdate(play.date) + '</span></h3><button type="button" class="btn big mt" data-act="play" data-code="' + play.code + '" data-date="' + play.date + '">▶ Reprendre</button></div>';
  }
  list.filter(c => ACT[c].type === "muscu").forEach(c => { h += heroCard(c, t, j, extra.indexOf(c) >= 0); });
  list.filter(c => ACT[c].type === "cardio").forEach(c => { h += actCard(c, t, j, extra.indexOf(c) >= 0); });
  if (!list.length) h += '<div class="card"><p class="kicker">Repos</p><h3>Récupère, mais bouge</h3><p class="muted mt">Pas de séance aujourd\'hui. Vise quand même 8 000 pas : une marche de 30 minutes suffit souvent.</p></div>';
  if (w <= 0) h += todoCard();
  h += stepsCard(t);
  const next = BILAN_DATES.find(d => d >= t);
  if (next) { const dd = daysBetween(t, next); h += '<div class="card slim"><span>📊 Prochain bilan Biody</span><b>' + (dd === 0 ? "aujourd'hui" : dd === 1 ? "demain" : "dans " + dd + " jours") + "</b></div>"; }
  const others = ORDER.filter(c => list.indexOf(c) < 0);
  if (others.length) h += '<details class="card"><summary><b>Faire autre chose aujourd\'hui</b> <span class="small muted">· rattraper une séance</span></summary><div class="row mt">' + others.map(c => '<button type="button" class="chip' + (ACT[c].push ? " push" : "") + '" data-act="extra" data-code="' + c + '" data-date="' + t + '">+ ' + esc(SHORT[c]) + "</button>").join("") + "</div></details>";
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
      '<div class="card tile"><div class="big">' + (st.pm ? Math.round(st.dm / st.pm * 100) + " %" : "—") + '</div><div class="lbl">Régularité</div></div>' +
      (function () { const k = kmWeek(mon); return '<div class="card tile"><div class="big">' + fmtKm(k.walk, 1) + '</div><div class="lbl">Km à pied</div></div><div class="card tile"><div class="big">' + fmtKm(k.bike, 1) + '</div><div class="lbl">Km à vélo (GPS)</div></div>'; })() + "</div>";
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
  h += '<h2>Ton calendrier</h2><div class="card">' + heatmap() + '</div>';
  h += '<div class="card mt row" style="justify-content:space-between"><label class="f" for="quick-w" style="flex:1;min-width:150px">Pesée du jour (kg, le matin à jeun)<input id="quick-w" type="number" inputmode="decimal" step="0.1" min="30" max="200" placeholder="61,0"></label><button type="button" class="btn" data-act="weigh">Enregistrer</button>' + (S.formMsg.weigh ? '<span class="small" style="color:var(--crit)">' + esc(S.formMsg.weigh) + '</span>' : '') + '</div>';
  h += '<h2>Objectifs au 15 février</h2><div class="card scroll"><table class="tbl"><thead><tr><th>Objectif</th><th>Départ</th><th>Actuel</th><th>Cible</th><th>Avancée</th></tr></thead><tbody>' +
    objRow("Pompes d'affilée", p0, pc, 45, "") +
    objRow("Pompes archer (par côté)", first("archer"), last("archer"), 8, "") +
    objRow("Tractions pronation", tr0, last("tractions"), isNum(tr0) ? tr0 + 5 : null, "", isNum(tr0) ? null : "départ + 5") +
    objRow("Chin-ups (paumes vers toi)", first("chinups"), last("chinups"), isNum(first("chinups")) ? first("chinups") + 5 : null, "", isNum(first("chinups")) ? null : "départ + 5") +
    objRow("Tour de bras contracté", br0, last("bras"), isNum(br0) ? br0 + 1 : null, " cm", isNum(br0) ? null : "départ + 1 cm") +
    objRow("Tour de poitrine", po0, last("poitrine"), isNum(po0) ? po0 + 2 : null, " cm", isNum(po0) ? null : "départ + 2 cm") +
    objRow("Poids (prise de muscle)", b0 && isNum(b0.poids) ? b0.poids : 61, latestWeight(), 63, " kg") +
    objRow("Muscle squelettique", b0 && isNum(b0.mmKg) ? b0.mmKg : 29.08, bl && isNum(bl.mmKg) ? bl.mmKg : null, (b0 && isNum(b0.mmKg) ? b0.mmKg : 29.08) + 1, " kg") +
    '<tr><td>Masse grasse</td><td class="num">' + (b0 && isNum(b0.mg) ? fmt(b0.mg, 1) + " %" : "—") + '</td><td class="num">' + (bl && isNum(bl.mg) ? fmt(bl.mg, 1) + " %" : "—") + '</td><td class="num">≤ 13 %</td><td>' + (bl && isNum(bl.mg) ? '<span class="pill ' + (bl.mg <= 13 ? 'good">OK' : 'warn">À surveiller') + '</span>' : '') + '</td></tr>' +
    '<tr><td>Régularité</td><td class="num">—</td><td class="num">' + (reg.pct == null ? "—" : reg.pct + " %") + '</td><td class="num">90 %</td><td>' + (reg.pct == null ? '<span class="muted small">—</span>' : '<div class="bar' + (reg.pct >= 90 ? " ok" : "") + '"><i style="width:' + Math.min(100, Math.round(reg.pct / 90 * 100)) + '%"></i></div>') + "</td></tr>" +
    "</tbody></table></div>";
  const bd = badges(), nb = bd.filter(b => b.ok).length;
  h += '<h2>Badges <span class="muted" style="font-size:16px">' + nb + '/' + bd.length + '</span></h2><div class="badges">' + bd.map(b => '<div class="badge' + (b.ok ? ' on' : '') + '"><span class="bi">' + b.ic + '</span><b>' + esc(b.nom) + '</b><small>' + esc(b.info) + '</small></div>').join('') + '</div>';
  const rec = records();
  h += '<h2>Tes records</h2>' + (rec.length ? '<div class="card scroll"><table class="tbl"><thead><tr><th>Exercice</th><th>Meilleure série</th><th>Le</th></tr></thead><tbody>' + rec.map(r => '<tr><td>' + esc(r.nom) + '</td><td class="num"><b>' + r.best + '</b> ' + esc(r.u) + '</td><td class="num">' + fdate(r.date) + '</td></tr>').join('') + '</tbody></table></div>' : '<div class="card"><p class="muted">Tes records apparaîtront après tes premières séances guidées.</p></div>');
  h += '<h2>Volume par semaine</h2><div class="card"><p class="small muted">Répétitions totales des séances A, B et C.</p>' + volumeBars(weekVolume()) + '</div>';
  const kw = kmWeek(mondayOf(now)), ss = sorties();
  const bikeTot = ss.filter(x => x.type === "VELO").reduce((a, x) => a + (x.km || 0), 0);
  h += '<h2>Km parcourus</h2><div class="tiles"><div class="card tile"><div class="big">' + fmtKm(kw.total, 1) + '</div><div class="lbl">km cette semaine</div></div>' +
    '<div class="card tile"><div class="big">' + fmtKm(kw.walk, 1) + '</div><div class="lbl">à pied · semaine</div></div>' +
    '<div class="card tile"><div class="big">' + fmtKm(kw.bike, 1) + '</div><div class="lbl">à vélo · semaine</div></div>' +
    '<div class="card tile"><div class="big">' + fmtKm(bikeTot, bikeTot >= 100 ? 0 : 1) + '</div><div class="lbl">km vélo au total</div></div></div>';
  h += '<div class="card mt"><p class="small muted">À pied et à vélo : tes sorties GPS (plus les pas ajoutés à la main).</p>' + kmBars() + "</div>";
  h += ss.length ? '<div class="card mt"><h3>Tes sorties GPS</h3><div class="mt">' + ss.slice(0, 10).map(x => sortieRow(x, true)).join("") + "</div></div>"
    : '<div class="card mt"><p class="muted">Ta prochaine sortie vélo ou marche : lance le GPS depuis Aujourd\'hui. Distance, durée, vitesse et tracé s\'enregistrent ici.</p></div>';
  const metrics = [["pompes", "Pompes max", ""], ["pas", "Pas (4 sem.)", ""], ["poids", "Poids", " kg"], ["mmKg", "Muscle", " kg"], ["mg", "Masse grasse", " %"], ["bras", "Tour de bras", " cm"]];
  const cur = metrics.find(m => m[0] === S.metric) || metrics[0];
  h += '<h2>Courbe</h2><div class="card chart"><div class="row" role="group" aria-label="Mesure affichée">' + metrics.map(m => '<button type="button" class="chip' + (m[0] === cur[0] ? " sel" : "") + '" data-act="metric" data-m="' + m[0] + '" aria-pressed="' + (m[0] === cur[0]) + '">' + m[1] + "</button>").join("") + '</div><div class="mt">' + chartSvg(metricSeries(cur[0]), cur[2]) + "</div></div>";
  h += "<h2>Ajouter un test</h2>" + formHtml("test", [["date", "Date", "date"], ["pompes", "Pompes max", "number"], ["archer", "Archer / côté", "number"], ["planche", "Planche (s)", "number"], ["tractions", "Tractions", "number"], ["chinups", "Chin-ups", "number"], ["australien", "Rowing australien", "number"], ["genoux", "Relevés de genoux", "number"], ["dips", "Dips", "number"], ["bras", "Tour de bras (cm)", "number"], ["poitrine", "Tour de poitrine (cm)", "number"], ["poids", "Poids (kg)", "number"]], "Enregistrer le test");
  if (tests.length) h += histTable("tests", [["pompes", "Pompes"], ["archer", "Archer"], ["planche", "Planche s"], ["tractions", "Tract."], ["chinups", "Chin-ups"], ["australien", "Austral."], ["genoux", "Genoux"], ["dips", "Dips"], ["bras", "Bras cm"], ["poitrine", "Poitr. cm"], ["poids", "Poids"]]);
  h += '<h2>Bilans Biody</h2><div class="card stack"><p><b>Ta fiche du 17/11 :</b> muscle squelettique 29,1 kg (référence 28,2 kg), masse grasse 7,2 kg soit 11,7 % (référence 14,9 %), indice de masse maigre 18,6 kg/m² (référence 17), eau totale 38,7 L (référence 39,5 L), angle de phase 7,8°. Tu es déjà plus musclé et plus sec que la référence : l\'objectif est de prendre du muscle, pas de perdre du gras.</p><p>Prochains : ' + BILAN_DATES.map(d => fdate(d) + (d.slice(0, 4) === "2027" ? " 2027" : "")).join(", ") + '.</p><p class="small muted mt">Pour comparer : même créneau qu\'au départ (vers 12 h 50), avant le repas, vessie vide, pas de sport dans les 12 h avant, pas d\'alcool la veille.</p></div>';
  h += formHtml("bilan", [["date", "Date", "date"], ["poids", "Poids (kg)", "number"], ["mg", "Masse grasse (%)", "number"], ["mm", "Masse musc. (%)", "number"], ["mmKg", "Muscle squelettique (kg)", "number"], ["mgKg", "Masse grasse (kg)", "number"], ["eau", "Eau totale (L)", "number"], ["hydra", "Hydratation (%)", "number"], ["angle", "Angle de phase (°)", "number"]], "Enregistrer le bilan");
  if (bil.length) h += histTable("bilans", [["poids", "Poids"], ["mmKg", "Muscle kg"], ["mg", "Gras %"], ["mgKg", "Gras kg"], ["eau", "Eau L"], ["angle", "Angle °"]]);
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
    '<label class="toggle" for="n-pas"><input type="checkbox" id="n-pas" data-act="notif" data-k="pas"' + (n.pas ? " checked" : "") + "><span>Pas du soir, si tu es sous 8 000 (marches GPS)</span></label>" +
    '<div class="form"><label class="f" for="h-pas">Heure<select id="h-pas" data-act="heure" data-k="heurePas">' + timeOptions(19 * 60 + 30, 20 * 60 + 45, 15, r.heurePas) + "</select></label></div>" +
    '<label class="toggle" for="n-bilan"><input type="checkbox" id="n-bilan" data-act="notif" data-k="bilan"' + (n.bilan ? " checked" : "") + "><span>Bilan du dimanche</span></label>" +
    '<div class="form"><label class="f" for="h-bilan">Heure<select id="h-bilan" data-act="heure" data-k="heureBilan">' + timeOptions(18 * 60, 20 * 60 + 30, 15, r.heureBilan) + "</select></label></div>" +
    '<label class="toggle" for="n-biody"><input type="checkbox" id="n-biody" data-act="notif" data-k="biody"' + (n.biody ? " checked" : "") + "><span>Veille de bilan Biody (20 h)</span></label></div>";
  h += '<p class="small muted">Les rappels partent de ton dépôt privé (GitHub Actions), à quelques minutes près.</p></div>';

  h += '<h2>Traceur GPS et pas</h2><div class="card stack"><p>Pour le vélo et la marche : <strong>Aujourd\'hui → 🚲 GPS vélo</strong> ou <strong>🚶 GPS marche</strong>. Carte en direct, km, durée, vitesse ; à la fin, la sortie s\'enregistre et coche ta séance.</p>' +
    '<p><strong>Tes pas viennent de tes marches GPS</strong> : 1 km ≈ ' + fmt(Math.round(1000 / STRIDE_M / 10) * 10, 0) + ' pas (un pas d\'environ ' + fmt(STRIDE_M * 100, 0) + ' cm). Plus besoin de l\'app Santé ni du raccourci : tu peux supprimer le raccourci « Pas Suivi » et ses automatisations. Une marche faite sans GPS s\'ajoute à la main dans Aujourd\'hui.</p>' +
    '<ul class="plain small"><li>La première fois, autorise la localisation. Si tu as refusé : Réglages → Confidentialité et sécurité → Service de localisation → Sites Safari → « Lorsque l\'app est active » et « Position exacte ».</li>' +
    "<li>Garde l'app ouverte pendant la sortie : l'écran reste allumé. En poche ou sur le guidon, touche <strong>Mode poche</strong> (écran noir, appui long pour revenir).</li>" +
    "<li>Si l'écran se verrouille quand même, le GPS s'arrête (règle d'iOS pour les apps web) : en revenant, le trou est relié en ligne droite.</li></ul></div>";

  const wt = latestWeight();
  const lo = isNum(wt) ? Math.round(wt * 1.8 / 5) * 5 : 110, hi = isNum(wt) ? Math.round(wt * 2.1 / 5) * 5 : 130;
  h += "<h2>Nutrition</h2>";
  h += '<div class="card stack"><p><strong>Objectif : prendre du muscle proprement, autour de 2 700 à 2 800 kcal par jour.</strong> Ta dépense mesurée est de 2 380 kcal avec une activité faible ; avec tes séances et le vélo, tu montes vers 2 600. Il faut un petit surplus de 200 kcal, sinon le muscle ne se construit pas.</p>' +
    "<p><strong>Protéines : " + lo + " à " + hi + " g par jour</strong> (1,8 à 2,1 g par kilo" + (isNum(wt) ? ", calculé sur " + fmt(wt) + " kg" : "") + "), en 3 ou 4 repas de 30 à 40 g.</p>" +
    "<p><strong>Ta balance sert de boussole :</strong> pèse-toi chaque lundi matin à jeun (champ « Pesée du jour » dans Progrès). Vise environ +0,25 kg par semaine, soit 63 kg mi-février. Si tu prends plus de 0,5 kg par semaine, enlève une collation ; si rien ne bouge pendant 2 semaines, ajoute-en une (skyr + banane + une poignée d'amandes, environ 350 kcal).</p>" +
    '<ul class="plain"><li>Féculents autour des séances (pâtes, riz, pain, fruits) : c\'est le carburant.</li><li>Eau : 2 à 2,5 L par jour, plus les jours de vélo. Ton eau totale était un peu sous la référence (38,7 L pour 39,5 L).</li><li>Légumes à 2 repas.</li><li>Sommeil : 8 h. C\'est la nuit que le muscle se construit.</li><li>Alcool : une soirée arrosée freine la récupération 1 à 2 jours.</li><li>Option : créatine monohydrate, 3 g par jour. Pas obligatoire.</li></ul></div>';
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
    case "play": openPlay(ds.code, ds.date); break;
    case "gps": if (trk) openTrk(); else startTrk(ds.type); break;
    case "gpsopen": openTrk(); break;
    case "gdel": {
      const ck = "g:" + ds.id;
      if (S.confirmDel !== ck) { S.confirmDel = ck; render(); break; }
      const g = D(ds.id) || {}; write(ds.id, { del: true, date: g.date }); S.confirmDel = null; render(); break;
    }
    case "weigh": {
      const v = toNum((document.getElementById("quick-w") || {}).value);
      if (!isNum(v) || v < 30 || v > 200) { S.formMsg.weigh = "Entre ton poids en kg, par exemple 61,4."; render(); break; }
      const doc = clone(D("tests")); const tk = todayKey();
      doc.items = (Array.isArray(doc.items) ? doc.items : []).filter(x => !(x.date === tk && Object.keys(x).length === 2 && isNum(x.poids)));
      doc.items.push({ date: tk, poids: v }); doc.items.sort(byDate); write("tests", doc); S.formMsg.weigh = ""; render(); break;
    }
    case "open": { const cur = (ds.key in S.open) ? S.open[ds.key] : ds.def === "1"; S.open[ds.key] = !cur; render(); break; }
    case "video": S.vid[ds.key] = !S.vid[ds.key]; render(); break;
    case "rest": startCountdown(Number(ds.s), "Repos", "rest"); break;
    case "hold": startCountdown(Number(ds.s), ds.l || "Tiens", "hold"); break;
    case "extra": editDay(ds.date, j => { j.extra = Array.isArray(j.extra) ? j.extra : []; if (j.extra.indexOf(ds.code) < 0) j.extra.push(ds.code); }); S.open[ds.date + ds.code] = true; render(); break;
    case "unextra": editDay(ds.date, j => { j.extra = (Array.isArray(j.extra) ? j.extra : []).filter(c => c !== ds.code); }); break;
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
  const keys = kind === "test" ? ["pompes", "archer", "planche", "tractions", "chinups", "australien", "genoux", "dips", "bras", "poitrine", "poids"] : ["poids", "mg", "mm", "mmKg", "mgKg", "eau", "hydra", "angle"];
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
if (play && play.open) { renderPlay(); startPlayTicker(); }
if (trk) { if (trk.end) trkCount = trkSecs(trk) >= 600 && trk.km >= 0.3; openTrk(); }
if (token()) sync();
})();
