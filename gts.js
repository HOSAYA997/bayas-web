import { getApps, getApp, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getDatabase, ref, onValue, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxQFnaTxPGvnyAH3YKeHvUIP24I2e422o",
  authDomain: "bayas-88ec5.firebaseapp.com",
  databaseURL: "https://bayas-88ec5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bayas-88ec5",
  appId: "1:484097821045:web:4682957645816860472b3c"
};
const db = getDatabase(getApps().length ? getApp() : initializeApp(firebaseConfig));
const $ = id => document.getElementById(id);
const fold = s => (s == null ? "" : String(s)).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const norm = s => fold(s).replace(/[^a-z0-9]/g, "");
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const store = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const STATS = ["PS", "Ataque", "Defensa", "At. Esp.", "Def. Esp.", "Velocidad"];
const PAGE = 100, STALE_MS = 10 * 60 * 1000;
const NAT_ES = {
  hardy: "Fuerte", lonely: "Huraña", brave: "Audaz", adamant: "Firme", naughty: "Pícara", bold: "Osada", docile: "Dócil",
  relaxed: "Plácida", impish: "Agitada", lax: "Floja", timid: "Miedosa", hasty: "Activa", serious: "Seria", jolly: "Alegre",
  naive: "Ingenua", modest: "Modesta", mild: "Afable", quiet: "Mansa", bashful: "Tímida", rash: "Alocada", calm: "Serena",
  gentle: "Amable", sassy: "Grosera", careful: "Cauta", quirky: "Rara"
};
const natName = n => NAT_ES[fold(n)] || (n ? n[0].toUpperCase() + n.slice(1) : "");
const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : "");

/* ---------- estilos y pestañas ---------- */
const st = document.createElement("style");
st.textContent = `
[hidden]{display:none!important}
#tabs{display:flex;gap:6px;margin:6px 0 12px}
#tabs button{padding:8px 16px;font-weight:600}
#tabs button.on,#g-types button.on{border-color:var(--acc);color:var(--acc)}
#g-types{display:flex;gap:0}
#g-types button{padding:7px 16px;font-weight:600}
#g-types button:first-child{border-radius:8px 0 0 8px}#g-types button:last-child{border-radius:0 8px 8px 0}
#g-estado{font-size:.9rem;color:var(--mut);margin-bottom:10px}
#g-estado.ok{color:var(--ok)} #g-estado.warn{color:var(--warn)}
.gwrap{border:1px solid var(--line);border-radius:10px;overflow:auto;max-height:68vh}
.gwrap table{border-collapse:collapse;width:100%;font-size:.88rem}
.gwrap th,.gwrap td{padding:6px 9px;text-align:left;border-bottom:1px solid var(--line);white-space:nowrap;vertical-align:middle}
.gwrap th{position:sticky;top:0;background:#222735;color:var(--mut);cursor:pointer;user-select:none;z-index:1}
.gwrap td.detail{line-height:1.35;min-width:150px}
.gwrap td.detail .ivs{font-variant-numeric:tabular-nums}
.gwrap td.detail .ivs i{font-style:normal}
.gwrap td.num,.gwrap th.num{text-align:right;font-variant-numeric:tabular-nums}
.gwrap tbody tr.r{cursor:pointer} .gwrap tbody tr.r:hover td{background:#222735}
.gwrap tr.det td{white-space:normal;background:#161a23;color:#cfd3df;font-size:.84rem;line-height:1.5}
.tag{display:inline-block;padding:0 6px;border-radius:6px;font-size:.75rem;margin-left:4px;border:1px solid var(--line);color:var(--mut)}
.tag.shiny{color:#ffd45a;border-color:#7a6320} .tag.bad{color:var(--bad);border-color:#6a2a2a}
.alert{display:inline-flex;gap:8px;align-items:center;padding:3px 8px;margin:0 6px 6px 0;border:1px solid var(--line);border-radius:8px;background:var(--card);font-size:.85rem}
.alert.on{border-color:var(--ok)} .alert button{padding:0 6px}
#g-advbox{padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--card)}
#g-advbox label{display:flex;flex-direction:column;font-size:.75rem;color:var(--mut);gap:2px}
#g-advbox input[type=number]{width:70px}
.gtoast{border-color:#e5b94a;background:#2a2415}.gtoast b{color:#e5b94a}
`;
document.head.append(st);

const h1 = document.querySelector("h1");
const tabs = document.createElement("div"); tabs.id = "tabs";
tabs.innerHTML = '<button data-t="bayas">🫐 Bayas</button><button data-t="gts">🏷 GTS</button>';
h1.after(tabs);
const wrapB = document.createElement("div"); wrapB.id = "tab-bayas";
[...document.body.children].forEach(el => {
  if (el === h1 || el === tabs || el.tagName === "SCRIPT" || ["toasts", "modal", "smodal"].includes(el.id)) return;
  wrapB.append(el);
});
tabs.after(wrapB);
const panel = document.createElement("div"); panel.id = "tab-gts"; panel.hidden = true;
wrapB.after(panel);

panel.innerHTML = `
<div id="g-estado">Conectando…</div>
<div class="bar">
  <div id="g-types"><button data-t="POKEMON" class="on">Pokémon</button><button data-t="ITEM">Objetos</button></div>
  <input id="g-text" type="search" placeholder="Nombre… (@ para buscar vendedor)" style="min-width:250px">
  <input id="g-mov" class="pk" type="search" placeholder="Movimiento…" title="Varios movimientos separados por coma">
  <input id="g-pmin" type="number" min="0" placeholder="Precio mín">
  <input id="g-pmax" type="number" min="0" placeholder="Precio máx">
  <label class="it" style="display:flex;gap:4px;align-items:center" title="El precio del filtro es por unidad"><input id="g-unit" type="checkbox" checked> por unidad</label>
  <label style="display:flex;gap:4px;align-items:center"><input id="g-hexp" type="checkbox" checked> ocultar expirados</label>
  <button id="g-adv" class="pk">Filtros de Pokémon ▾</button>
  <button id="g-clear">Limpiar</button>
</div>
<div id="g-advbox" class="bar" hidden>
  <label>Naturaleza<select id="g-nat"><option value="">Todas</option></select></label>
  <label>Género<select id="g-gen"><option value="">Todos</option></select></label>
  <label>Shiny<select id="g-shiny"><option value="">Todos</option><option value="yes">Solo shiny</option><option value="no">No shiny</option></select></label>
  <label>Castrado<select id="g-cast"><option value="">Todos</option><option value="yes">Sí</option><option value="no">No</option></select></label>
  <label>Tera<select id="g-tera"><option value="">Todos</option></select></label>
  <label>Nivel mín<input id="g-lmin" type="number" min="1" max="100"></label>
  <label>Nivel máx<input id="g-lmax" type="number" min="1" max="100"></label>
  <div style="width:100%;display:flex;gap:8px;flex-wrap:wrap" id="g-ivs"></div>
  <div style="width:100%;display:flex;gap:8px;flex-wrap:wrap" id="g-evs"></div>
</div>
<div class="bar">
  <select id="g-saved"><option value="">Filtros guardados…</option></select>
  <button id="g-save">Guardar filtro actual</button>
  <button id="g-del">Borrar</button>
</div>
<div class="notif" id="g-notif" style="margin-bottom:8px">
  <b>🔔 Avisar cuando haya algo que cumpla este filtro con precio ≤</b>
  <input id="g-ap" type="number" min="0" placeholder="precio">
  <button id="g-acreate">Crear alerta con el filtro actual</button>
  <label><input id="g-snd" type="checkbox" checked> 🔊 Sonido</label>
  <label><input id="g-os" type="checkbox" checked> 🖥 Windows</label>
  <span id="g-perm"></span>
</div>
<div id="g-alist"></div>
<div id="g-count"></div>
<div class="gwrap"><table>
  <thead id="g-head"></thead>
  <tbody id="g-body"></tbody>
</table></div>
<div class="bar" style="margin-top:8px">
  <button id="g-prev">‹ Anterior</button><span id="g-page" style="color:var(--mut)"></span><button id="g-next">Siguiente ›</button>
</div>`;

$("g-ivs").innerHTML = STATS.map((n, i) => `<label>IV mín ${n}<input class="g-iv" data-i="${i}" type="number" min="0" max="31"></label>`).join("");
$("g-evs").innerHTML = STATS.map((n, i) => `<label>EV mín ${n}<input class="g-ev" data-i="${i}" type="number" min="0" max="252"></label>`).join("");

function showTab(t) {
  wrapB.hidden = t !== "bayas"; panel.hidden = t !== "gts";
  tabs.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.t === t));
  store("tabActive", t);
}
tabs.onclick = e => { const b = e.target.closest("button"); if (b) showTab(b.dataset.t); };
showTab(load("tabActive", "bayas"));

/* ---------- datos ---------- */
const rows = new Map();
let meta = null, ready = false, renderT = null, sort = { k: "price", dir: 1 }, page = 0, mode = "POKEMON";
const expanded = new Set();
const natures = new Set(), genders = new Set(), teras = new Set();
let optSig = "";

const unitOf = r => (r.quantity > 0 ? r.price / r.quantity : r.price);
function prep(id, v) {
  const r = { id, ...v };
  r._unit = unitOf(r);
  r._name = norm(r.name) + "|" + norm(r.species);
  r._seller = norm(r.seller);
  r._moves = (r.moves || []).map(norm);
  if (r.nature) natures.add(r.nature);
  if (r.gender) genders.add(r.gender);
  if (r.teraType) teras.add(r.teraType);
  return r;
}
const lref = ref(db, "gts/listings");
onChildAdded(lref, s => { rows.set(s.key, prep(s.key, s.val())); touch(s.key); });
onChildChanged(lref, s => { rows.set(s.key, prep(s.key, s.val())); touch(s.key); });
onChildRemoved(lref, s => { rows.delete(s.key); touch(); });
onValue(lref, () => { ready = true; checkAll(); schedule(); }, { onlyOnce: true });
onValue(ref(db, "gts/meta"), s => { meta = s.val(); estado(); });

function touch(id) {
  if (ready && id && rows.has(id)) checkRow(rows.get(id));
  schedule();
}
function schedule() { if (!renderT) renderT = setTimeout(() => { renderT = null; refreshOptions(); render(); estado(); }, 350); }

function estado() {
  const e = $("g-estado");
  if (!meta) { e.className = ""; e.textContent = rows.size ? `${rows.size} anuncios cargados` : "Esperando datos de la GTS…"; return; }
  const hora = new Date(meta.updatedAt).toLocaleTimeString("es-ES");
  const old = Date.now() - meta.updatedAt > STALE_MS;
  e.className = meta.status === "sin_datos" || old ? "warn" : "ok";
  e.textContent = (meta.status === "sin_datos" ? "Sin anuncios en la última lectura. " : old ? "Datos antiguos. " : "") + `Última actualización ${hora} · ${rows.size} anuncios`;
}
setInterval(estado, 15000);

function fillSelect(id, set, labeler) {
  const sel = $(id), cur = sel.value, first = sel.options[0].outerHTML;
  const items = [...set].map(v => [v, labeler ? labeler(v) : v]).sort((a, b) => a[1].localeCompare(b[1], "es"));
  sel.innerHTML = first + items.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("");
  sel.value = cur;
}
function refreshOptions() {
  const sig = [natures.size, genders.size, teras.size].join();
  if (sig === optSig) return;
  optSig = sig; fillSelect("g-nat", natures, natName); fillSelect("g-gen", genders); fillSelect("g-tera", teras);
  if (pendingFilter) applyFilterSelects(pendingFilter);
}

/* ---------- modo: Pokémon u objetos ---------- */
function applyMode() {
  document.querySelectorAll("#g-types button").forEach(b => b.classList.toggle("on", b.dataset.t === mode));
  panel.querySelectorAll(".pk").forEach(el => el.hidden = mode !== "POKEMON");
  panel.querySelectorAll(".it").forEach(el => el.hidden = mode !== "ITEM");
  if (mode !== "POKEMON") $("g-advbox").hidden = true;
  else $("g-adv").textContent = $("g-advbox").hidden ? "Filtros de Pokémon ▾" : "Filtros de Pokémon ▴";
  if (!(mode === "POKEMON" ? ["name", "level", "gender", "ivTotal", "price", "seller", "expires"] : ["name", "quantity", "price", "unit", "seller", "expires"]).includes(sort.k)) sort = { k: "price", dir: 1 };
}
$("g-types").onclick = e => {
  const b = e.target.closest("button"); if (!b || b.dataset.t === mode) return;
  mode = b.dataset.t; page = 0; applyMode(); render(); store("gtsLast", getFilter());
};

/* ---------- filtro ---------- */
function num(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : null; }
function getFilter() {
  return {
    type: mode, text: $("g-text").value, mov: $("g-mov").value, pmin: $("g-pmin").value, pmax: $("g-pmax").value,
    unit: $("g-unit").checked, hexp: $("g-hexp").checked,
    nat: $("g-nat").value, gen: $("g-gen").value, shiny: $("g-shiny").value, cast: $("g-cast").value, tera: $("g-tera").value,
    lmin: $("g-lmin").value, lmax: $("g-lmax").value,
    ivs: [...document.querySelectorAll(".g-iv")].map(i => i.value), evs: [...document.querySelectorAll(".g-ev")].map(i => i.value),
    sort: sort.k, dir: sort.dir
  };
}
let pendingFilter = null;
function applyFilterSelects(f) { $("g-nat").value = f.nat || ""; $("g-gen").value = f.gen || ""; $("g-tera").value = f.tera || ""; }
function setFilter(f) {
  pendingFilter = f;
  mode = f.type === "ITEM" ? "ITEM" : "POKEMON";
  $("g-text").value = f.text || ""; $("g-mov").value = f.mov || ""; $("g-pmin").value = f.pmin ?? ""; $("g-pmax").value = f.pmax ?? "";
  $("g-unit").checked = f.unit ?? true; $("g-hexp").checked = f.hexp ?? true;
  $("g-shiny").value = f.shiny || ""; $("g-cast").value = f.cast || "";
  $("g-lmin").value = f.lmin ?? ""; $("g-lmax").value = f.lmax ?? "";
  document.querySelectorAll(".g-iv").forEach((i, n) => i.value = (f.ivs || [])[n] ?? "");
  document.querySelectorAll(".g-ev").forEach((i, n) => i.value = (f.evs || [])[n] ?? "");
  applyFilterSelects(f);
  sort = { k: f.sort || "price", dir: f.dir || 1 }; page = 0; applyMode(); render();
}
function match(r, f, maxUnit) {
  const type = f.type === "ITEM" ? "ITEM" : "POKEMON";
  if (r.type !== type) return false;
  if (f.hexp && r.expired) return false;
  const t = (f.text || "").trim();
  if (t.startsWith("@")) { const q = norm(t.slice(1)); if (q && !r._seller.includes(q)) return false; }
  else if (t) { const q = norm(t); if (q && !r._name.includes(q)) return false; }
  const p = type === "ITEM" && f.unit ? r._unit : r.price, pmin = num(f.pmin), pmax = num(f.pmax);
  if (pmin != null && p < pmin) return false;
  if (pmax != null && p > pmax) return false;
  if (maxUnit != null && r._unit > maxUnit) return false;
  if (type === "ITEM") return true;
  const terms = (f.mov || "").split(/[,;]+/).map(norm).filter(Boolean);
  for (const q of terms) if (!r._moves.some(m => m.includes(q))) return false;
  if (f.nat && r.nature !== f.nat) return false;
  if (f.gen && r.gender !== f.gen) return false;
  if (f.shiny === "yes" && !r.shiny) return false;
  if (f.shiny === "no" && r.shiny) return false;
  if (f.cast === "yes" && !r.castrated) return false;
  if (f.cast === "no" && r.castrated) return false;
  if (f.tera && r.teraType !== f.tera) return false;
  const lmin = num(f.lmin), lmax = num(f.lmax);
  if (lmin != null && r.level < lmin) return false;
  if (lmax != null && r.level > lmax) return false;
  for (let i = 0; i < 6; i++) {
    const a = num((f.ivs || [])[i]); if (a != null && ((r.ivs || [])[i] ?? 0) < a) return false;
    const b = num((f.evs || [])[i]); if (b != null && ((r.evs || [])[i] ?? 0) < b) return false;
  }
  return true;
}

/* ---------- tabla ---------- */
const fmtP = n => Number.isFinite(n) ? n.toLocaleString("es-ES", { maximumFractionDigits: 2 }) : "–";
function expMin(r) {
  if (r.expiresAt) return Math.round((r.expiresAt - Date.now()) / 60000);
  const m = /^\s*(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?/.exec(r.expires || "");
  return m ? (+m[1] || 0) * 1440 + (+m[2] || 0) * 60 + (+m[3] || 0) : null;
}
function left(r) {
  const m = expMin(r);
  if (m == null) return r.expires || "";
  return m <= 0 ? "expirado" : Math.floor(m / 60) + "h " + (m % 60) + "m";
}
const genderSym = g => g === "MALE" ? "♂" : g === "FEMALE" ? "♀" : g ? "–" : "";
function nameCell(r) {
  return esc(r.name || r.species || r.itemId || "?") + (r.shiny ? '<span class="tag shiny">✨ shiny</span>' : "") +
    (r.expired ? '<span class="tag bad">expirado</span>' : "");
}
function detailCell(r) {
  const ivs = (r.ivs || []).map(v => v === 31 ? `<i class="m31">31</i>` : v === 0 ? `<i class="m0">0</i>` : `<i>${v}</i>`).join("/");
  return `<div class="ivs">${ivs || "–"}</div><div>${esc(natName(r.nature))}</div><div>${esc(cap(r.ability))}</div>`;
}
const priceCell = r => `<b>${esc(r.priceFmt || fmtP(r.price))}</b>`;
const COLS = {
  POKEMON: [
    { k: "name", h: "Nombre", c: nameCell },
    { k: "level", h: "Nv", n: 1, c: r => r.level ?? "" },
    { k: "gender", h: "Gén.", c: r => genderSym(r.gender) },
    { k: "ivTotal", h: "Detalles", cls: "detail", c: detailCell },
    { k: "price", h: "Precio", n: 1, c: priceCell },
    { k: "seller", h: "Vendedor", c: r => esc(r.seller) },
    { k: "expires", h: "Expira", c: r => esc(left(r)) }
  ],
  ITEM: [
    { k: "name", h: "Nombre", c: nameCell },
    { k: "quantity", h: "Cant.", n: 1, c: r => r.quantity ?? "" },
    { k: "price", h: "Precio", n: 1, c: priceCell },
    { k: "unit", h: "Por ud.", n: 1, c: r => r.quantity > 1 ? esc(r.pricePerUnitFmt || fmtP(r._unit)) : "" },
    { k: "seller", h: "Vendedor", c: r => esc(r.seller) },
    { k: "expires", h: "Expira", c: r => esc(left(r)) }
  ]
};
function sortVal(r, k) { return k === "unit" ? r._unit : k === "expires" ? expMin(r) : r[k]; }
function render() {
  const f = getFilter(), cols = COLS[mode];
  $("g-head").innerHTML = "<tr>" + cols.map(c => `<th data-k="${c.k}" class="${(c.n ? "num " : "") + (c.cls || "")}">${c.h}${sort.k === c.k ? (sort.dir > 0 ? " ▲" : " ▼") : ""}</th>`).join("") + "</tr>";
  const list = [...rows.values()].filter(r => match(r, f));
  list.sort((a, b) => {
    const x = sortVal(a, sort.k), y = sortVal(b, sort.k);
    if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1;
    return (typeof x === "string" ? x.localeCompare(y, "es") : x - y) * sort.dir;
  });
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  if (page >= pages) page = pages - 1;
  const total = [...rows.values()].filter(r => r.type === mode).length;
  $("g-count").textContent = `${list.length} de ${total} anuncios`;
  $("g-page").textContent = ` Página ${page + 1} de ${pages} `;
  $("g-prev").disabled = page === 0; $("g-next").disabled = page >= pages - 1;
  $("g-body").innerHTML = list.slice(page * PAGE, page * PAGE + PAGE).map(r => {
    let html = `<tr class="r" data-id="${esc(r.id)}">` + cols.map(c => `<td class="${(c.n ? "num " : "") + (c.cls || "")}">${c.c(r)}</td>`).join("") + "</tr>";
    if (expanded.has(r.id)) html += `<tr class="det"><td colspan="${cols.length}">${details(r)}</td></tr>`;
    return html;
  }).join("");
}
function details(r) {
  const out = [];
  if (r.type !== "POKEMON") { out.push(`<b>ID:</b> ${esc(r.itemId)}`); return out.join("<br>"); }
  if (r.species && r.species !== r.name) out.push(`<b>Especie:</b> ${esc(r.species)}`);
  if (r.moves?.length) out.push(`<b>Movimientos:</b> ${r.moves.map(esc).join(", ")}`);
  if (r.ivs) out.push(`<b>IVs:</b> ${STATS.map((n, i) => `${n} ${r.ivs[i] ?? 0}`).join(" · ")}`);
  if (r.evs) out.push(`<b>EVs:</b> ${STATS.map((n, i) => `${n} ${r.evs[i] ?? 0}`).join(" · ")}`);
  const misc = [];
  if (r.teraType) misc.push("Tera " + esc(r.teraType));
  if (r.otName) misc.push("OT " + esc(r.otName));
  if (r.friendship != null) misc.push("Amistad " + r.friendship);
  if (r.castrated) misc.push("Castrado");
  if (r.aspects?.length) misc.push("Aspectos: " + r.aspects.map(esc).join(", "));
  if (misc.length) out.push(misc.join(" · "));
  return out.join("<br>") || "Sin más datos";
}
$("g-body").onclick = e => {
  const tr = e.target.closest("tr.r"); if (!tr) return;
  const id = tr.dataset.id; expanded.has(id) ? expanded.delete(id) : expanded.add(id); render();
};
$("g-head").onclick = e => {
  const th = e.target.closest("th"); if (!th) return;
  const k = th.dataset.k; sort = { k, dir: sort.k === k ? -sort.dir : 1 }; page = 0; render(); store("gtsLast", getFilter());
};
$("g-prev").onclick = () => { page--; render(); };
$("g-next").onclick = () => { page++; render(); };
$("g-adv").onclick = () => { const b = $("g-advbox"); b.hidden = !b.hidden; applyMode(); };
$("g-clear").onclick = () => { $("g-saved").value = ""; setFilter({ type: mode }); };
panel.querySelectorAll("#g-advbox input,#g-advbox select,.bar input,.bar select").forEach(el => {
  if (["g-saved", "g-ap"].includes(el.id)) return;
  el.addEventListener("input", () => { page = 0; render(); store("gtsLast", getFilter()); });
});

/* ---------- filtros guardados ---------- */
function refreshSaved(sel) {
  const s = load("gtsFilters", {});
  $("g-saved").innerHTML = '<option value="">Filtros guardados…</option>' + Object.keys(s).sort().map(n => `<option>${esc(n)}</option>`).join("");
  if (sel) $("g-saved").value = sel;
}
$("g-save").onclick = () => {
  const n = (prompt("Nombre del filtro:") || "").trim(); if (!n) return;
  const s = load("gtsFilters", {}); s[n] = getFilter(); store("gtsFilters", s); refreshSaved(n);
};
$("g-del").onclick = () => {
  const n = $("g-saved").value; if (!n || !confirm("¿Borrar el filtro «" + n + "»?")) return;
  const s = load("gtsFilters", {}); delete s[n]; store("gtsFilters", s); refreshSaved();
};
$("g-saved").onchange = () => { const f = load("gtsFilters", {})[$("g-saved").value]; if (f) setFilter(f); };

/* ---------- alertas ---------- */
let alerts = load("gtsAlerts", []);
let notified = load("gtsNotified", {});
let hits = [], hitT = null, audioCtx = null;
function summary(f) {
  const p = [f.type === "ITEM" ? "Objetos" : "Pokémon"];
  if (f.text) p.push(`«${f.text}»`);
  if (f.mov) p.push(`mov: ${f.mov}`);
  if (f.type !== "ITEM") {
    if (f.nat) p.push(natName(f.nat)); if (f.gen) p.push(f.gen);
    if (f.shiny === "yes") p.push("shiny");
    if (f.lmin || f.lmax) p.push(`Nv ${f.lmin || 1}-${f.lmax || 100}`);
    const iv = (f.ivs || []).map((v, i) => v ? `${STATS[i]}≥${v}` : "").filter(Boolean);
    if (iv.length) p.push("IV " + iv.join(" "));
  }
  return p.join(" · ");
}
function saveAlerts() { store("gtsAlerts", alerts); renderAlerts(); }
function renderAlerts() {
  $("g-alist").innerHTML = alerts.map(a => `<span class="alert ${a.on ? "on" : ""}" data-id="${a.id}">
    <input type="checkbox" ${a.on ? "checked" : ""} data-act="tog"> ${esc(summary(a.filter))} · precio ≤ <b>${fmtP(a.max)}</b>
    <button data-act="del" title="Borrar alerta">✕</button></span>`).join("");
}
$("g-acreate").onclick = async () => {
  const max = num($("g-ap").value);
  if (max == null) { alert("Escribe el precio máximo."); return; }
  alerts.push({ id: Date.now().toString(36), on: true, max, filter: getFilter() });
  saveAlerts(); await ensurePerm(); checkAll();
};
$("g-alist").onclick = e => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const a = alerts.find(x => x.id === el.closest(".alert").dataset.id); if (!a) return;
  if (el.dataset.act === "del") { alerts = alerts.filter(x => x !== a); delete notified[a.id]; store("gtsNotified", notified); }
  else { a.on = el.checked; if (a.on) checkAll(); }
  saveAlerts();
};
function hitKey(r) { return r.id + "@" + r.price; }
function evalRow(r, a) {
  if (!a.on || r.buyBlocked || r.expired) return false;
  if (!match(r, a.filter, a.max)) return false;
  const set = (notified[a.id] ||= []);
  const k = hitKey(r); if (set.includes(k)) return false;
  set.push(k); return true;
}
function checkRow(r) { for (const a of alerts) if (evalRow(r, a)) hits.push({ r, a }); flushSoon(); }
function checkAll() {
  if (!ready) return;
  for (const a of alerts) {
    notified[a.id] = (notified[a.id] || []).filter(k => rows.has(k.split("@")[0]));
    for (const r of rows.values()) if (evalRow(r, a)) hits.push({ r, a });
  }
  flushSoon();
}
function flushSoon() { if (hits.length && !hitT) hitT = setTimeout(flush, 700); }
function flush() {
  hitT = null; const list = hits; hits = []; store("gtsNotified", notified);
  if (!list.length) return;
  const seen = new Set(), uniq = list.filter(h => !seen.has(h.r.id) && seen.add(h.r.id)).sort((a, b) => a.r._unit - b.r._unit);
  uniq.slice(0, 5).forEach(h => toast(h.r));
  if (uniq.length > 5) toastText(`…y ${uniq.length - 5} anuncios más que cumplen tus alertas`);
  if ($("g-snd").checked) beep();
  if ($("g-os").checked) osNotify(uniq);
}
function label(r) { return r.name || r.species || r.itemId || "?"; }
function toast(r) {
  const t = document.createElement("div"); t.className = "toast gtoast";
  t.innerHTML = `<div><b>${esc(label(r))}</b>${r.type === "POKEMON" ? " Nv " + (r.level ?? "?") : ""}<br>${esc(r.priceFmt || fmtP(r.price))}${r.quantity > 1 ? ` (${r.quantity} uds.)` : ""} · ${esc(r.seller)}</div>`;
  t.onclick = () => { t.remove(); showTab("gts"); mode = r.type === "ITEM" ? "ITEM" : "POKEMON"; applyMode(); $("g-text").value = label(r); $("g-text").dispatchEvent(new Event("input")); };
  ($("toasts") || document.body).appendChild(t); setTimeout(() => t.remove(), 15000);
}
function toastText(s) {
  const t = document.createElement("div"); t.className = "toast gtoast"; t.textContent = s; t.onclick = () => t.remove();
  ($("toasts") || document.body).appendChild(t); setTimeout(() => t.remove(), 15000);
}
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = "triangle"; o.frequency.value = 660; g.gain.value = 0.15; o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.frequency.setValueAtTime(990, audioCtx.currentTime + 0.12); o.stop(audioCtx.currentTime + 0.3);
  } catch {}
}
function permText() {
  if (!("Notification" in window)) return "Este navegador no admite notificaciones";
  if (Notification.permission === "denied") return "Notificaciones bloqueadas en el navegador";
  if (Notification.permission === "default") return "Falta dar permiso (al crear una alerta se pedirá)";
  return "";
}
async function ensurePerm() {
  if ("Notification" in window && Notification.permission === "default") { try { await Notification.requestPermission(); } catch {} }
  $("g-perm").textContent = $("g-os").checked ? permText() : "";
}
function osNotify(list) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const title = list.length === 1 ? `GTS: ${label(list[0].r)} por ${list[0].r.priceFmt || fmtP(list[0].r.price)}` : `GTS: ${list.length} anuncios cumplen tus alertas`;
  const body = list.slice(0, 6).map(h => `${label(h.r)}: ${h.r.priceFmt || fmtP(h.r.price)}`).join("\n");
  try { new Notification(title, { body, tag: "gts-alerta", renotify: true, silent: $("g-snd").checked }); } catch {}
}
$("g-snd").checked = load("gtsSound", true); $("g-os").checked = load("gtsOs", true);
$("g-snd").onchange = () => store("gtsSound", $("g-snd").checked);
$("g-os").onchange = () => { store("gtsOs", $("g-os").checked); ensurePerm(); };
$("g-perm").textContent = permText();

/* ---------- arranque ---------- */
refreshSaved(); renderAlerts();
setFilter(load("gtsLast", {}));
window.addEventListener("beforeunload", () => store("gtsLast", getFilter()));
