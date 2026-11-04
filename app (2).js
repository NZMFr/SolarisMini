/* =====================================================
   SOLARIS MINI — core (app.js)
   SM namespace: storage, profile, levels, coins, home,
   player, settings, cloak, panic, toasts, modal helper.
   ===================================================== */
"use strict";
window.SM = (() => {

const BRAND = "Solaris Mini";
const XP_PER_LEVEL = base => 100 * base;         // xp needed to go level->level+1
const CHAT_XP = 6, PLAY_XP_PER_SEC = 0.1;        // 1 xp per 10s playing
const COINS_PER_LEVEL = 100;

/* ---------- storage ---------- */
const store = {
  get(k, d){ try{ const v = localStorage.getItem("solaris_" + k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ localStorage.setItem("solaris_" + k, JSON.stringify(v)); }
};
const dayKey = (d = new Date()) => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");

/* ---------- white svg icons ---------- */
const ic = (inner, vb = "0 0 24 24") => `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const ICONS = {
  star: f => `<svg viewBox="0 0 24 24" width="15" height="15"><path fill="${f ? "#ffd35c" : "none"}" stroke="${f ? "#ffd35c" : "currentColor"}" stroke-width="2" stroke-linejoin="round" d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"/></svg>`,
  crown: `<svg viewBox="0 0 24 24" width="12" height="12"><path fill="#3d2c00" d="M2.5 8.5l4.7 3.4L12 5l4.8 6.9 4.7-3.4-1.8 10H4.3l-1.8-10zM4.5 20h15v1.8h-15z"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" width="11" height="11"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  flame: `<svg viewBox="0 0 24 24" width="13" height="13"><path fill="#ff8a3d" d="M12 22c-4 0-7-2.9-7-6.8 0-2.5 1.3-4.4 2.7-6C9 7.7 10.4 6 10.8 3.4c2.4 1.6 3.5 3.9 3.3 6.4 1-.5 1.8-1.4 2.1-2.7 1.7 1.8 2.8 4 2.8 6.1 0 3.9-3 6.8-7 6.8z"/></svg>`,
  shield: (col, lvl) => `<svg viewBox="0 0 24 24" width="11" height="11"><path fill="${col}" d="M12 2l8 3v6c0 5-3.5 9.3-8 11-4.5-1.7-8-6-8-11V5z"/><text x="12" y="14.5" text-anchor="middle" font-size="8.5" font-weight="900" fill="rgba(0,0,0,.75)" font-family="Nunito">${lvl}</text></svg>`,
  send: ic('<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>'),
  gif: ic('<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M7 15v-6h2.5a2 2 0 0 1 0 4H7M14 9v6M14 9h3M14 12h2.5"/>'),
  smile: ic('<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>'),
  gamepad: ic('<rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M7 11v4M5 13h4M16 12h.01M18.5 14h.01"/>'),
  trophy: ic('<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4M12 14v4M8 21h8"/>'),
  chart: ic('<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>'),
  users: ic('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5 6.5-5s5.7 1.5 6.5 5M16 5a3 3 0 1 1 0 6M17.5 15.5c2 .6 3.4 2 4 4.5"/>'),
  megaphone: ic('<path d="M3 11v3l4 .5V10.5zM7 10l11-5v12l-11-5"/><path d="M18 8a3.5 3.5 0 0 1 0 6"/>'),
  flag: ic('<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>'),
  gavel: ic('<path d="M13 6l5 5M9 10l-6.5 6.5a1.5 1.5 0 0 0 0 2l1 1a1.5 1.5 0 0 0 2 0L12 13M14.5 4.5l5 5M12 21h9"/>'),
  chest: `<svg viewBox="0 0 24 24" width="46" height="46"><path fill="#8a5a2b" d="M3 8h18v12H3z"/><path fill="#a8713a" d="M3 8c0-3 4-5 9-5s9 2 9 5v3H3z"/><path fill="#ffd35c" d="M10 8h4v5h-4z"/><circle cx="12" cy="10.5" r="1.4" fill="#8a5a2b"/></svg>`,
  coin: `<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 7v10M9.2 9.5h4.2a1.8 1.8 0 0 1 0 3.6H9.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  eye: ic('<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>'),
  x: ic('<path d="M5 5l14 14M19 5L5 19"/>'),
  search: ic('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/>'),
  blank: ic('<rect x="3" y="4" width="13" height="16" rx="2"/><path d="M19 9l4 3-4 3"/>'),
  pip: ic('<rect x="2" y="4" width="20" height="16" rx="2"/><rect x="11" y="11" width="9" height="7" rx="1.5" fill="currentColor" stroke="none"/>'),
  mute: ic('<path d="M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/>'),
  vol: ic('<path d="M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
  dice: ic('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="8.2" cy="8.2" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.8" cy="15.8" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.8" cy="8.2" r="1.3" fill="currentColor" stroke="none"/><circle cx="8.2" cy="15.8" r="1.3" fill="currentColor" stroke="none"/>'),
  spark: ic('<path d="M12 2l1.8 5.5L19 9l-5.2 1.5L12 16l-1.8-5.5L5 9l5.2-1.5zM19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z"/>'),
  ban: ic('<circle cx="12" cy="12" r="9"/><path d="M5.5 5.5l13 13"/>'),
  timer: ic('<circle cx="12" cy="13" r="8"/><path d="M12 9.5V13l2.5 1.5M9 2h6"/>'),
  paint: ic('<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.4-2.2-.7-1.3.1-2.8 1.6-2.8H17a4 4 0 0 0 4-4c0-5-4-9-9-9z"/><circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="16.5" cy="10.5" r="1.2" fill="currentColor" stroke="none"/>'),
  text: ic('<path d="M5 6V4h14v2M12 4v16M9 20h6"/>'),
  heart: `<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 21s-7.5-4.6-9.5-9C1 8 3 5 6.2 5c2 0 3.4 1 4.3 2.4h3c.9-1.4 2.3-2.4 4.3-2.4 3.2 0 5.2 3 3.7 7-2 4.4-9.5 9-9.5 9z"/></svg>`,
  th: `<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M7 10.5v4h3.5l4.5 3.5v-11L10.5 6.5H7z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M17.8 7.5a6.5 6.5 0 0 1 0 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  wow: `<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 16.5h.01" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M8.5 9.5L11 11.5M15.5 9.5L13 11.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`,
};

/* ---------- utils ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const fmtTime = s => { s = Math.floor(s); if (s < 60) return s + "s";
  const m = Math.floor(s/60), r = s%60; if (m < 60) return r ? m+"m "+r+"s" : m+"m";
  return Math.floor(m/60)+"h "+(m%60)+"m"; };
const timeAgo = ts => { const d = Date.now()-ts; if (d < 60e3) return "now";
  if (d < 3600e3) return Math.floor(d/60e3)+"m"; if (d < 86400e3) return Math.floor(d/3600e3)+"h"; return Math.floor(d/86400e3)+"d"; };

function toast(msg, err){
  const t = document.createElement("div");
  t.className = "toast" + (err ? " err" : "");
  t.textContent = msg;
  $("toastRoot").appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = ".3s"; setTimeout(() => t.remove(), 320); }, 3200);
}
function openModal(html, wide){
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = `<div class="modal-card${wide ? " wide" : ""}">${html}</div>`;
  m.addEventListener("click", e => { if (e.target === m || e.target.closest("[data-close]")) m.remove(); });
  $("modalRoot").appendChild(m);
  return m;
}

/* ---------- profile / users registry ---------- */
const BOTS = [
  { user:"sol",   name:"Sol",   bio:"first light",   status:"Online", role:"Beta Tester", pfp:"" },
  { user:"luna",  name:"Luna",  bio:"moon walker",   status:"Idle",   role:"",          pfp:"" },
  { user:"orbit", name:"Orbit", bio:"in the grind",  status:"DND",    role:"",          pfp:"" },
  { user:"vex",   name:"Vex",   bio:"edge runner",   status:"Online", role:"",          pfp:"" },
];
function blankUser(u, name){
  return { user:u, name:name || u, bio:"", pfp:"", status:"Online", role:"",
    coins:0, chatXp:0, gameXp:{}, cosmetics:{ frame:"", textFx:"", badges:[], theme:"" },
    clan:null, friends:[], log:[], banned:false, shadow:false, mutedUntil:0, nowPlaying:null };
}
let users = store.get("users", {});
function getUser(u){
  if (users[u]) return users[u];
  const b = BOTS.find(x => x.user === u);
  if (b) return { ...blankUser(b.user, b.name), ...b };
  return null;
}
function me(){
  let m = store.get("me", null);
  if (m && !users[m.user]){ users[m.user] = { ...blankUser(m.user, m.name), ...m }; store.set("users", users); }
  if (m) m = users[m.user];
  return m;
}
function saveMe(patch){
  let m = me(); if (!m) return null;
  Object.assign(m, patch);
  users[m.user] = m; store.set("users", users);
  store.set("me", { user:m.user });
  updateCoinChip();
  return m;
}

/* ---------- levels ---------- */
function lvlFromXp(xp){
  let lvl = 1, need = XP_PER_LEVEL(1), rest = xp;
  while (rest >= need && lvl < 999){ rest -= need; lvl++; need = XP_PER_LEVEL(lvl); }
  return lvl;
}
function addXp(kind, amount){
  const m = me(); if (!m) return;
  const before = kind === "chat" ? lvlFromXp(m.chatXp) : lvlFromXp(m.gameXp[kind] || 0);
  if (kind === "chat") m.chatXp += amount; else m.gameXp[kind] = (m.gameXp[kind] || 0) + amount;
  const after = kind === "chat" ? lvlFromXp(m.chatXp) : lvlFromXp(m.gameXp[kind]);
  if (after > before){
    m.coins += (after - before) * COINS_PER_LEVEL;
    toast(`Level up! ${kind === "chat" ? "Chat" : "Game"} level ${after} — +${(after-before)*COINS_PER_LEVEL} coins`);
    pushNotif(m.user, `You reached ${kind === "chat" ? "Chat" : "Game"} Level ${after} and earned ${(after-before)*COINS_PER_LEVEL} coins.`);
  }
  saveMe({});
}
function updateCoinChip(){ const m = me(); if (m) $("coinCount").textContent = m.coins.toLocaleString(); }
function lvlBadge(lvl){
  const tiers = [[1,"#b0793f"],[5,"#c0c8d8"],[10,"#ffd35c"],[20,"#5ad1ff"],[40,"#c56cf0"]];
  let col = tiers[0][1];
  for (const [min, c] of tiers) if (lvl >= min) col = c;
  return `<span class="lvl-badge" style="background:color-mix(in srgb,${col} 22%,transparent);color:${col};border:1px solid color-mix(in srgb,${col} 55%,transparent)">${ICONS.shield(col, lvl)} LV ${lvl}</span>`;
}

/* ---------- notifications ---------- */
let notifs = store.get("notifs", []);
function pushNotif(user, text, type = "system"){
  notifs.unshift({ id: "n" + Date.now() + Math.random().toString(36).slice(2,6), user, text, type, ts: Date.now(), read: false });
  store.set("notifs", notifs);
  if (SM.onInboxChange) SM.onInboxChange();
}

/* ---------- settings ---------- */
const defaults = { lib:"gnmath", accent:"#c9c1f2", fx:true, cloak:false, cloakPreset:"docs",
  panicUrl:"https://en.wikipedia.org", profanity:"mod", msgRequests:true, tenorKey:"", slowOverride:"auto" };
let settings = { ...defaults, ...store.get("settings", {}) };
function saveSettings(){ store.set("settings", settings); }

/* ---------- games ---------- */
const LIBS = (typeof GAME_LIBRARY !== "undefined") ? GAME_LIBRARY : { gnmath:{games:[]}, lumin:{games:[]} };
function libGames(lib = settings.lib){
  return (LIBS[lib]?.games || []).slice().sort((a,b) => (a.num||0)-(b.num||0))
    .map(g => ({ ...g, id: lib + ":" + (g.num ?? g.name) }));
}
const allGames = () => Object.keys(LIBS).flatMap(l => libGames(l));
const findGame = id => allGames().find(g => g.id === id);
function gotd(){
  const force = store.get("gotdForce", "");
  if (force){ const f = effGames().find(g => g.id === force && !g.hidden); if (f) return f; }
  const gs = effGames().filter(g => !g.hidden);
  if (!gs.length) return null;
  const day = Math.floor(Date.now() / 864e5);
  return gs[day % gs.length];
}
let devGames = store.get("devGames", []);
function effGames(){ return [...devGames.filter(d => !d.hidden), ...allGames()]; }
function findEff(id){ return effGames().find(g => g.id === id); }

/* ---------- favorites / playtime / recents / streak ---------- */
let favorites = store.get("fav", []);
let playtime = store.get("pt", {});
let lastPlayed = store.get("lp", {});
let streak = store.get("streak", { last:null, count:0 });
(function(){
  const today = dayKey(), y = dayKey(new Date(Date.now() - 864e5));
  if (streak.last !== today){ streak.count = streak.last === y ? streak.count + 1 : 1; streak.last = today; store.set("streak", streak); }
})();

/* ---------- starfield ---------- */
const canvas = $("stars"), ctx = canvas.getContext("2d");
let starArr = [];
function initStars(){ canvas.width = innerWidth; canvas.height = innerHeight;
  starArr = Array.from({length:80}, () => ({ x:Math.random()*canvas.width, y:Math.random()*canvas.height,
    r:Math.random()*1.3+.3, p:Math.random()*6.28, s:.5+Math.random()*1.6 })); }
function drawStars(t){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for (const s of starArr){ ctx.globalAlpha = .25+.75*Math.abs(Math.sin(t/1000*s.s+s.p));
    ctx.fillStyle = "#ccd5ff"; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,7); ctx.fill(); }
  ctx.globalAlpha = 1; requestAnimationFrame(drawStars);
}
initStars(); addEventListener("resize", initStars); requestAnimationFrame(drawStars);

/* ---------- accent ---------- */
const PRESETS = ["#c9c1f2","#b8bdf5","#8ecdf5","#f5b8d0","#9fe8c0","#f5d9a8","#c9aef5"];
function applyAccent(c){ settings.accent = c; document.documentElement.style.setProperty("--accent", c); }

/* ---------- cloak + panic ---------- */
const CLOAKS = {
  docs:     { title:"Google Docs",             svg:"#4285F4", letter:"D" },
  drive:    { title:"My Drive - Google Drive", svg:"#F4B400", letter:"A" },
  classroom:{ title:"Home | Google Classroom", svg:"#1FA463", letter:"C" },
};
function applyCloak(){
  if (!settings.cloak) return;
  const c = CLOAKS[settings.cloakPreset] || CLOAKS.docs;
  document.title = c.title;
  $("favicon").href = "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='${c.svg}'/><text x='50' y='70' font-size='55' text-anchor='middle' fill='#fff' font-family='Arial' font-weight='bold'>${c.letter}</text></svg>`);
}
let lastEsc = 0;
addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const now = Date.now();
  if (now - lastEsc < 450){ location.replace(settings.panicUrl || "https://en.wikipedia.org"); return; }
  lastEsc = now;
});

/* ---------- navigation ---------- */
const viewRenders = {};
let currentView = "home";
function registerView(name, fn){ viewRenders[name] = fn; }
function switchView(name){
  currentView = name;
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  $("view-" + name).classList.remove("hidden");
  document.querySelectorAll(".nav-seg").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  if (viewRenders[name]) viewRenders[name]();
  window.scrollTo(0, 0);
}
document.querySelectorAll(".nav-seg").forEach(b => b.onclick = () => switchView(b.dataset.view));

/* ---------- player ---------- */
let current = null, sessionStart = 0, tick = null, muted = false, savedContent = null;
function openGame(g){
  if (!me()) return;
  current = g; sessionStart = Date.now(); muted = false;
  lastPlayed[g.id] = Date.now(); store.set("lp", lastPlayed);
  saveMe({ nowPlaying: g.id });
  $("playerName").textContent = g.name;
  $("playerMult").classList.toggle("hidden", !(gotd() && gotd().id === g.id));
  loadFrame($("playerFrame"), g);
  $("muteBtn").textContent = "Mute";
  $("player").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  clearInterval(tick);
  tick = setInterval(() => {
    $("clockText").textContent = fmtTime((playtime[g.id]||0) + (Date.now()-sessionStart)/1000);
  }, 1000);
  renderHome();
}
function loadFrame(f, g){
  if (g.html != null){ f.removeAttribute("src"); f.srcdoc = g.html; }
  else { f.removeAttribute("srcdoc"); f.src = g.url; }
}
function finalize(){
  if (!current) return;
  const el = Math.floor((Date.now() - sessionStart)/1000);
  if (el > 0){
    playtime[current.id] = (playtime[current.id]||0) + el; store.set("pt", playtime);
    const mult = gotd() && gotd().id === current.id ? 2 : 1;
    addXp(current.id, Math.round(el * PLAY_XP_PER_SEC * mult));
  }
  sessionStart = Date.now();
}
function closePlayer(){
  finalize(); clearInterval(tick);
  const f = $("playerFrame");
  f.srcdoc = ""; f.src = "about:blank";
  $("player").classList.add("hidden");
  document.body.style.overflow = "";
  saveMe({ nowPlaying: null });
  current = null;
  if (currentView === "home") renderHome();
}
$("closeBtn").onclick = () => closePlayer();
$("fsBtn").onclick = () => document.fullscreenElement ? document.exitFullscreen() : $("player").requestFullscreen();
$("blankBtn").onclick = () => { if (current) cloakLaunch(current); };
function cloakLaunch(g){
  const w = window.open("about:blank", "_blank");
  if (!w) return toast("Popup blocked — allow popups for blank tab launches.", true);
  const d = w.document; d.title = g.name; d.body.style.cssText = "margin:0";
  const f = d.createElement("iframe");
  f.setAttribute("allowfullscreen", "");
  f.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:none";
  d.body.appendChild(f);
  if (g.html != null) f.srcdoc = g.html; else f.src = g.url;
}
$("muteBtn").onclick = () => {
  const f = $("playerFrame");
  if (!muted){
    savedContent = { html: f.getAttribute("srcdoc"), url: f.getAttribute("src") };
    f.srcdoc = ""; f.src = "about:blank";
    muted = true; $("muteBtn").textContent = "Unmute"; toast("Audio suspended");
  } else {
    if (savedContent && savedContent.html != null){ f.removeAttribute("src"); f.srcdoc = savedContent.html; }
    else { f.removeAttribute("srcdoc"); f.src = (savedContent && savedContent.url) || "about:blank"; }
    muted = false; $("muteBtn").textContent = "Mute";
  }
};
$("pipBtn").onclick = () => {
  if (!current) return;
  loadFrame($("pipFrame"), current);
  const f = $("playerFrame");
  f.srcdoc = ""; f.src = "about:blank";
  $("pipTitle").textContent = current.name;
  $("pipWin").classList.remove("hidden");
  toast("Picture-in-picture — drag the bar to move");
};
$("pipClose").onclick = () => {
  if (current) loadFrame($("playerFrame"), current);
  const pf = $("pipFrame");
  pf.srcdoc = ""; pf.src = "about:blank";
  $("pipWin").classList.add("hidden");
};
(function(){
  const win = $("pipWin"), bar = $("pipBar");
  let drag = null;
  bar.addEventListener("pointerdown", e => {
    if (e.target.closest("button")) return;
    drag = { x: e.clientX - win.offsetLeft, y: e.clientY - win.offsetTop };
    bar.setPointerCapture(e.pointerId);
  });
  bar.addEventListener("pointermove", e => {
    if (!drag) return;
    win.style.left = Math.max(0, e.clientX - drag.x) + "px";
    win.style.top = Math.max(0, e.clientY - drag.y) + "px";
    win.style.right = "auto";
  });
  bar.addEventListener("pointerup", () => drag = null);
})();
addEventListener("beforeunload", finalize);
document.addEventListener("visibilitychange", () => { if (document.hidden) finalize(); });

/* ---------- home view ---------- */
let activeChip = "All";
function renderHome(){
  const v = $("view-home");
  const games = effGames();
  const news = games.filter(g => g.isNew);
  const g = gotd();
  const q = ($("homeSearch")?.value || "").trim().toLowerCase();
  const filtered = games.filter(x => (activeChip === "All" || x.tag === activeChip) && (!q || x.name.toLowerCase().includes(q)));
  const recent = games.filter(x => lastPlayed[x.id]).sort((a,b) => lastPlayed[b.id] - lastPlayed[a.id]).slice(0, 8);
  const favs = games.filter(x => favorites.includes(x.id));
  const topId = topGameId(effGames());
  const lb = leaderboard();

  const card = x => `
    <div class="card" data-id="${esc(x.id)}">
      ${x.isNew ? '<span class="badge-new">NEW!</span>' : ""}
      ${x.id === topId ? `<span class="badge-crown">${ICONS.crown}<span>#1</span></span>` : ""}
      ${playtime[x.id] ? `<span class="pt-tag">${ICONS.clock}<span>${fmtTime(playtime[x.id])}</span></span>` : ""}
      ${x.icon ? `<img class="thumb" src="${esc(x.icon)}" alt="${esc(x.name)}" loading="lazy" onerror="this.outerHTML='<div class=thumb-fallback>${esc((x.name||'?')[0].toUpperCase())}</div>'">`
               : `<div class="thumb-fallback">${esc((x.name||'?')[0].toUpperCase())}</div>`}
      <button class="fav ${favorites.includes(x.id) ? "on" : ""}" data-fav="${esc(x.id)}" title="Favorite">${ICONS.star(favorites.includes(x.id))}</button>
      <div class="cname">${esc(x.name)}</div>
    </div>`;
  const qcard = x => `
    <div class="qcard" data-id="${esc(x.id)}">
      ${x.icon ? `<img src="${esc(x.icon)}" alt="" onerror="this.outerHTML='<div class=thumb-fallback>${esc((x.name||'?')[0].toUpperCase())}</div>'">` : `<div class="thumb-fallback">${esc((x.name||'?')[0].toUpperCase())}</div>`}
      <div class="qn">${esc(x.name)}</div>
    </div>`;
  const tags = ["All", ...new Set(games.map(x => x.tag).filter(Boolean))];

  v.innerHTML = `
    <div class="home-head">
      <div class="search-wrap" style="position:relative;max-width:430px">
        <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg></span>
        <input id="homeSearch" type="text" placeholder="Search games" value="${esc($("homeSearch")?.value || "")}" style="width:100%;padding:9px 13px 9px 36px;border-radius:11px;border:1px solid var(--line);background:var(--bg2);color:var(--text);outline:none;font-size:13px;font-weight:700;font-family:inherit">
      </div>
      <button id="surpriseBtn" class="surprise-btn">${ICONS.dice} Surprise Me</button>
    </div>
    <div class="chips">${tags.map(t => `<button class="chip ${t === activeChip ? "active" : ""}" data-chip="${esc(t)}">${esc(t)}</button>`).join("")}</div>
    ${g ? `<div class="gotd" data-id="${esc(g.id)}">
        ${g.icon ? `<img class="thumb" src="${esc(g.icon)}" alt="" onerror="this.outerHTML='<div class=thumb-fallback style=width:110px;height:110px;font-size:40px>${esc((g.name||'?')[0].toUpperCase())}</div>'">` : `<div class="thumb-fallback">${esc((g.name||'?')[0].toUpperCase())}</div>`}
        <div><div class="gotd-title">Game of the Day</div>
        <div style="font-weight:900;font-size:16px;margin-top:2px">${esc(g.name)}</div>
        <div class="gotd-sub">${esc(g.tag || "Featured pick")} · changes daily</div>
        <span class="mult-chip">2X XP + COINS TODAY</span></div>
      </div>` : ""}
    ${favs.length ? `<div class="section-title">Favorites</div><div class="qrow">${favs.map(qcard).join("")}</div>` : ""}
    ${recent.length ? `<div class="section-title">Recently Played</div><div class="qrow">${recent.map(qcard).join("")}</div>` : ""}
    ${news.length ? `<div class="section-title">New & Featured</div><div class="grid featured">${news.map(card).join("")}</div>` : ""}
    <div class="section-title">All Games</div>
    <div class="grid">${filtered.length ? filtered.map(card).join("") : `<div class="empty">No games here yet — the owner adds them in games.js on GitHub.</div>`}</div>
    <div class="section-title">Playtime Leaderboard</div>
    <div class="lb-panel">${lb.length ? lb.map((r, i) => `<div class="lb-row"><span class="rk">${i + 1}</span><span class="dot ${r.status}"></span><span>${esc(r.name)}</span>${r.clan ? `<span class="clan-tag">${esc(r.clan)}</span>` : ""}<span class="tm">${fmtTime(r.t)}</span></div>`).join("") : '<div class="lb-row">Play a game to hit the board.</div>'}</div>
  `;

  const openById = id => { const x = findEff(id); if (x) openGame(x); };
  v.querySelectorAll(".card[data-id], .qcard[data-id], .gotd[data-id]").forEach(c => c.onclick = () => openById(c.dataset.id));
  v.querySelectorAll("[data-fav]").forEach(b => b.onclick = e => {
    e.stopPropagation();
    const id = b.dataset.fav;
    favorites = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    store.set("fav", favorites); renderHome();
  });
  v.querySelectorAll("[data-chip]").forEach(c => c.onclick = () => { activeChip = c.dataset.chip; renderHome(); });
  $("homeSearch").addEventListener("input", renderHome);
  $("surpriseBtn").onclick = () => {
    const btn = $("surpriseBtn");
    btn.classList.add("shuffling");
    let n = 0;
    const iv = setInterval(() => {
      if (++n >= 7){
        clearInterval(iv); btn.classList.remove("shuffling");
        const pool = effGames(); if (pool.length) openGame(pool[Math.floor(Math.random()*pool.length)]);
      }
    }, 90);
  };
}
function topGameId(games){ let best = null, bt = 0;
  for (const x of games){ const t = playtime[x.id] || 0; if (t > bt){ bt = t; best = x.id; } } return best; }
function leaderboard(){
  const rows = [];
  const m = me();
  if (m){ const myT = Object.values(playtime).reduce((a,b) => a+b, 0);
    rows.push({ name: m.name, t: myT, status: m.status, clan: m.clan?.tag }); }
  const botTimes = { sol: 4210, luna: 3140, orbit: 2350, vex: 1640 };
  for (const b of BOTS) rows.push({ name: b.name, t: botTimes[b.user] || 600, status: b.status, clan: b.user === "sol" ? "[SOL]" : "" });
  return rows.sort((a,b) => b.t - a.t).slice(0, 6);
}
registerView("home", renderHome);

/* ---------- chests ---------- */
let chests = store.get("chests", []);
function renderChests(){
  document.querySelectorAll(".chest").forEach(c => c.remove());
  for (const c of chests){
    const el = document.createElement("div");
    el.className = "chest"; el.style.left = c.x + "%"; el.style.top = c.y + "%";
    el.innerHTML = ICONS.chest;
    el.title = "Open chest";
    el.onclick = () => claimChest(c.id);
    document.body.appendChild(el);
  }
}
function claimChest(id){
  const c = chests.find(x => x.id === id); if (!c) return;
  const m = me(); if (!m) return;
  chests = chests.filter(x => x.id !== id); store.set("chests", chests);
  if (c.loot.coins){ m.coins += c.loot.coins; toast(`Chest opened: +${c.loot.coins} coins`); }
  if (c.loot.badge){ m.cosmetics.badges.push(c.loot.badge); toast(`Chest opened: rare badge "${c.loot.badge}"`); }
  saveMe({});
  renderChests();
  if (currentView === "profile") switchView("profile");
}

/* ---------- release notes ---------- */
const NOTES = [
  { v: "8.0", d: "Full release", t: "Home, Chat, Inbox, Profile views. Game of the Day 2X, Surprise Me, PiP, blank-tab launch, mute. Chat slow mode (auto + manual), level badges, role badges, reports. Coins, dual XP, shop, clans. Dev board, chests, cloak, panic." },
  { v: "7.2", d: "Hotfix", t: "Accent color picker, ambient stars, favorites sync." },
];
$("notesBtn").onclick = () => openModal(`
  <div class="modal-head"><h2>Release notes</h2></div>
  ${NOTES.map(n => `<div style="margin-top:14px"><span class="mult-chip">v${n.v}</span> <b style="font-size:13px">${n.d}</b><p class="modal-sub" style="margin-top:5px">${n.t}</p></div>`).join("")}
  <button class="big-btn ghost" data-close style="margin-top:16px">Close</button>`);

/* ---------- settings modal ---------- */
$("settingsBtn").onclick = () => {
  const PRESET_CLOAK_OPTS = Object.entries(CLOAKS).map(([k, c]) => `<option value="${k}" ${settings.cloakPreset === k ? "selected" : ""}>${c.title}</option>`).join("");
  const PROF_OPTS = [["no","None"],["mod","Moderate"],["max","Max"]].map(([k, l]) => `<option value="${k}" ${settings.profanity === k ? "selected" : ""}>${l}</option>`).join("");
  const m = openModal(`
    <div class="modal-head"><h2>Settings</h2></div>
    <p class="modal-sub">Adjust the launcher. Reopen any time with the gear.</p>
    <div class="setting-label">GAME LIBRARY</div>
    <div class="lib-tabs">
      ${Object.entries(LIBS).map(([k, l]) => `<button class="lib-tab ${settings.lib === k ? "sel" : ""}" data-lib="${k}"><span class="lib-name">${esc(l.label || k)}</span><span class="lib-sub">${esc(l.sub || k + " library")}</span></button>`).join("")}
    </div>
    <div class="setting-label">ACCENT</div>
    <div class="accent-row">
      <div id="accentCurrent" class="accent-current" title="Custom color"></div>
      <div class="accent-pills" id="accentPills"></div>
    </div>
    <div id="picker" class="picker hidden">
      <div class="picker-top"><canvas id="pickCanvas" width="260" height="150"></canvas><div id="pickHandle" class="pick-handle"></div></div>
      <div class="picker-bottom">
        <button id="eyedropBtn" class="eyedrop" title="Pick from screen"><svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M12 2s6.5 6.6 6.5 11a6.5 6.5 0 1 1-13 0C5.5 8.6 12 2 12 2z"/></svg></button>
        <div class="hue-track" id="hueTrack"><div id="hueHandle" class="hue-handle"></div></div>
      </div>
      <div class="rgb-row">
        <div class="rgb-box"><input id="rVal" type="number" min="0" max="255"><span>R</span></div>
        <div class="rgb-box"><input id="gVal" type="number" min="0" max="255"><span>G</span></div>
        <div class="rgb-box"><input id="bVal" type="number" min="0" max="255"><span>B</span></div>
      </div>
    </div>
    <div class="setting-label">OPTIONS</div>
    <div class="opt-row"><div><div class="opt-name">Ghost Mode (tab cloak)</div><div class="opt-sub">Masks the tab as a safe utility.</div></div>
      <label class="switch"><input id="sCloak" type="checkbox" ${settings.cloak ? "checked" : ""}><span class="knob"></span></label></div>
    <label class="fld">Cloak preset<select id="sCloakPreset" class="inp">${PRESET_CLOAK_OPTS}</select></label>
    <div class="opt-row"><div><div class="opt-name">Ambient effects</div><div class="opt-sub">Moon glow &amp; twinkling stars.</div></div>
      <label class="switch"><input id="sFx" type="checkbox" ${settings.fx ? "checked" : ""}><span class="knob"></span></label></div>
    <div class="opt-row"><div><div class="opt-name">Message requests</div><div class="opt-sub">DMs from non-friends need approval.</div></div>
      <label class="switch"><input id="sMsgReq" type="checkbox" ${settings.msgRequests ? "checked" : ""}><span class="knob"></span></label></div>
    <label class="fld">Profanity filter<select id="sProf" class="inp">${PROF_OPTS}</select></label>
    <label class="fld">GIF provider key (Tenor, optional)<input id="sTenor" class="inp" value="${esc(settings.tenorKey)}" placeholder="paste API key"></label>
    <label class="fld">Panic redirect URL<div class="opt-sub">Double-tap ESC opens this instantly.</div><input id="sPanic" class="inp" value="${esc(settings.panicUrl)}"></label>
    <button class="big-btn" id="sSave">Save</button>
    <button class="big-btn ghost" data-close>Close</button>
  `);
  m.querySelectorAll(".lib-tab").forEach(t => t.onclick = () => {
    m.querySelectorAll(".lib-tab").forEach(x => x.classList.remove("sel"));
    t.classList.add("sel"); settings.lib = t.dataset.lib;
  });
  const cur = m.querySelector("#accentCurrent");
  cur.style.background = settings.accent;
  const pills = m.querySelector("#accentPills");
  function renderPills(){
    pills.innerHTML = "";
    PRESETS.forEach(c => {
      const p = document.createElement("div");
      p.className = "pill" + (c.toLowerCase() === settings.accent.toLowerCase() ? " sel" : "");
      p.style.background = c; p.style.color = c; p.title = c;
      p.onclick = () => { applyAccent(c); cur.style.background = c; renderPills(); syncPick(c); };
      pills.appendChild(p);
    });
  }
  renderPills();
  const pc = m.querySelector("#pickCanvas"), pctx = pc.getContext("2d");
  let hsv = hexToHsv(settings.accent);
  function hsvToRgb(h, s, v){ const f = (n, k = (n + h/60) % 6) => v - v*s*Math.max(Math.min(k, 4-k, 1), 0);
    return [Math.round(f(5)*255), Math.round(f(3)*255), Math.round(f(1)*255)]; }
  function rgbToHex(r, g, b){ return "#" + [r,g,b].map(x => x.toString(16).padStart(2,"0")).join(""); }
  function rgbToHsv(r, g, b){ r/=255; g/=255; b/=255;
    const mx = Math.max(r,g,b), mn = Math.min(r,g,b), d = mx-mn; let h = 0;
    if (d){ if (mx === r) h = ((g-b)/d)%6; else if (mx === g) h = (b-r)/d+2; else h = (r-g)/d+4; h *= 60; if (h < 0) h += 360; }
    return { h, s: mx ? d/mx : 0, v: mx }; }
  function hexToHsv(hex){ const x = hex.replace("#",""); return rgbToHsv(parseInt(x.slice(0,2),16), parseInt(x.slice(2,4),16), parseInt(x.slice(4,6),16)); }
  function drawPick(){
    const W = pc.width, H = pc.height;
    pctx.fillStyle = `hsl(${hsv.h},100%,50%)`; pctx.fillRect(0,0,W,H);
    let gr = pctx.createLinearGradient(0,0,W,0);
    gr.addColorStop(0,"#fff"); gr.addColorStop(1,"rgba(255,255,255,0)");
    pctx.fillStyle = gr; pctx.fillRect(0,0,W,H);
    gr = pctx.createLinearGradient(0,0,0,H);
    gr.addColorStop(0,"rgba(0,0,0,0)"); gr.addColorStop(1,"#000");
    pctx.fillStyle = gr; pctx.fillRect(0,0,W,H);
    const hnd = m.querySelector("#pickHandle");
    hnd.style.left = hsv.s*100 + "%"; hnd.style.top = (1-hsv.v)*100 + "%"; hnd.style.background = settings.accent;
    m.querySelector("#hueHandle").style.left = hsv.h/360*100 + "%";
    const [r, g2, b] = hsvToRgb(hsv.h, hsv.s, hsv.v);
    m.querySelector("#rVal").value = r; m.querySelector("#gVal").value = g2; m.querySelector("#bVal").value = b;
  }
  function commitPick(){
    const [r, g2, b] = hsvToRgb(hsv.h, hsv.s, hsv.v);
    applyAccent(rgbToHex(r, g2, b));
    cur.style.background = settings.accent; renderPills(); drawPick();
  }
  function syncPick(hex){ hsv = hexToHsv(hex); drawPick(); }
  let picking = false;
  const pickEv = e => { const r = pc.getBoundingClientRect();
    hsv.s = Math.min(1, Math.max(0, (e.clientX - r.left)/r.width));
    hsv.v = 1 - Math.min(1, Math.max(0, (e.clientY - r.top)/r.height)); commitPick(); };
  pc.addEventListener("pointerdown", e => { picking = true; pc.setPointerCapture(e.pointerId); pickEv(e); });
  pc.addEventListener("pointermove", e => { if (picking) pickEv(e); });
  pc.addEventListener("pointerup", () => picking = false);
  let hueing = false;
  const hueTrack = m.querySelector("#hueTrack");
  const hueEv = e => { const r = hueTrack.getBoundingClientRect();
    hsv.h = Math.min(360, Math.max(0, (e.clientX - r.left)/r.width*360)); commitPick(); };
  hueTrack.addEventListener("pointerdown", e => { hueing = true; hueTrack.setPointerCapture(e.pointerId); hueEv(e); });
  hueTrack.addEventListener("pointermove", e => { if (hueing) hueEv(e); });
  hueTrack.addEventListener("pointerup", () => hueing = false);
  ["rVal","gVal","bVal"].forEach(id => m.querySelector("#" + id).addEventListener("change", () => {
    const vals = ["rVal","gVal","bVal"].map(x => Math.min(255, Math.max(0, parseInt(m.querySelector("#" + x).value) || 0)));
    hsv = rgbToHsv(vals[0], vals[1], vals[2]); commitPick();
  }));
  m.querySelector("#eyedropBtn").onclick = async () => {
    if (!window.EyeDropper) return toast("Eyedropper not supported in this browser.", true);
    try { const r = await new window.EyeDropper().open(); syncPick(r.sRGBHex); commitPick(); } catch(e){}
  };
  cur.onclick = () => { const p = m.querySelector("#picker"); p.classList.toggle("hidden"); if (!p.classList.contains("hidden")) syncPick(settings.accent); };
  m.querySelector("#sSave").onclick = () => {
    settings.fx = m.querySelector("#sFx").checked;
    settings.cloak = m.querySelector("#sCloak").checked;
    settings.cloakPreset = m.querySelector("#sCloakPreset").value;
    settings.msgRequests = m.querySelector("#sMsgReq").checked;
    settings.profanity = m.querySelector("#sProf").value;
    settings.tenorKey = m.querySelector("#sTenor").value.trim();
    settings.panicUrl = m.querySelector("#sPanic").value.trim() || defaults.panicUrl;
    saveSettings();
    document.body.classList.toggle("nofx", !settings.fx);
    applyCloak();
    m.remove(); toast("Settings saved");
    if (currentView === "home") renderHome();
  };
};

/* ---------- announcement banner ---------- */
function showBanner(text){
  const b = $("banner");
  if (!text){ b.classList.add("hidden"); return; }
  b.classList.remove("hidden");
  b.innerHTML = `<span>${esc(text)}</span><button class="bx" id="bannerX">${ICONS.x}</button>`;
  $("bannerX").onclick = () => b.classList.add("hidden");
}

/* ---------- onboarding ---------- */
function onboarding(){
  const m = openModal(`
    <div class="modal-head"><h2>Create your account</h2></div>
    <p class="modal-sub">Display name, username, bio and picture.</p>
    <label class="fld">Display name<input id="oName" class="inp" maxlength="24" placeholder="e.g. Nova"></label>
    <label class="fld">Username (unique)<input id="oUser" class="inp" maxlength="20" placeholder="e.g. nova_r"></label>
    <label class="fld">About me<input id="oBio" class="inp" maxlength="120" placeholder="short bio"></label>
    <label class="fld">Profile picture URL (optional)<input id="oPfp" class="inp" placeholder="https://.../pic.png"></label>
    <button class="big-btn" id="oGo">Join Solaris Mini</button>
  `);
  m.querySelector("#oGo").onclick = () => {
    const name = m.querySelector("#oName").value.trim();
    const user = m.querySelector("#oUser").value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!name || !user) return toast("Name and username are required.", true);
    if (getUser(user)) return toast("That username is taken.", true);
    const rec = { ...blankUser(user, name), bio: m.querySelector("#oBio").value.trim(), pfp: m.querySelector("#oPfp").value.trim() };
    if (user === OWNER_USER) rec.role = "Owner";
    rec.coins += 150;
    users[user] = rec; store.set("users", users); store.set("me", { user });
    pushNotif(user, "Welcome to Solaris Mini! You got 150 starter coins.", "system");
    m.remove(); updateCoinChip(); toast("Welcome, " + name + "!");
    if (currentView === "home") renderHome();
  };
}

/* ---------- boot ---------- */
function boot(){
  document.title = BRAND;
  $("brandName").textContent = BRAND;
  applyAccent(settings.accent);
  document.body.classList.toggle("nofx", !settings.fx);
  updateCoinChip();
  showBanner(store.get("banner", ""));
  renderChests();
  switchView("home");
}

return { store, $, esc, toast, openModal, ic, ICONS, fmtTime, timeAgo,
  me, saveMe, getUser, registry, BOTS, blankUser, pushNotif, notifs: () => notifs,
  lvlFromXp, addXp, lvlBadge, updateCoinChip, settings, saveSettings,
  allGames, libGames, findGame, findEff, effGames, gotd, devGames: () => devGames, setDevGames: g => { devGames = g; store.set("devGames", g); },
  playtime, lastPlayed, favorites, streak,
  openGame, closePlayer, cloakLaunch, finalize,
  registerView, switchView, get currentView(){ return currentView; },
  renderHome, leaderboard, showBanner, claimChest, onboarding, boot,
  refreshChests: renderChests, applyAccent, dayKey };
})();
const OWNER_USER = "owner";
