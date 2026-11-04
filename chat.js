/* =====================================================
   SOLARIS MINI — chat (chat.js)
   Public feed + clan "cc" channel, adaptive slow mode,
   profanity filter (3-way), slur hard-block, level/role
   badges, text cosmetics, reactions, GIFs, reports.
   Real-time across tabs via BroadcastChannel + localStorage.
   ===================================================== */
"use strict";
(() => {
const { store, $, esc, toast, openModal, ICONS, timeAgo, lvlFromXp, lvlBadge } = SM;

const CHAT_XP = 6;
const CURSE = ["fuck","shit","bitch","asshole","bastard","damn","dick","pussy","cunt","whore","slut"];
const SLURS = ["nigg","fagg","kike","chink","retard"];
const REACTS = { th: ICONS.th, heart: ICONS.heart, star: ICONS.star, smile: ICONS.smile, wow: ICONS.wow, flame: ICONS.flame };
const BOTLINES = [
  "anyone on the leaderboard yet?", "that new game slaps ngl", "grinding xp rn",
  "gg earlier", "daily streak secured", "who tryna clan up", "2x day lets gooo",
  "this site is lowkey clean", "chest event when", "chat level grind never ends"
];

let channel = "public";
let bc = null;
try { bc = new BroadcastChannel("solaris_chat_v1"); } catch(e){}

function chatKey(){ return channel === "public" ? "chat" : "chat_cc_" + (SM.me()?.clan?.tag || ""); }
function loadMsgs(){ return store.get(chatKey(), []); }
function saveMsgs(m){ store.set(chatKey(), m.slice(-200)); }

/* ---------- profanity ---------- */
function maskWord(w, mode){
  if (mode === "no") return w;
  if (mode === "max") return '<span class="censored">' + esc(w) + "</span>";
  return esc(w[0]) + "*".repeat(Math.max(1, w.length - 1));
}
function filterText(text){
  const mode = SM.settings.profanity;
  return text.split(/(\s+)/).map(part => {
    const low = part.toLowerCase().replace(/[^a-z]/g, "");
    if (low && CURSE.includes(low)) return maskWord(part, mode);
    return esc(part);
  }).join("");
}
function isSlur(text){
  const low = text.toLowerCase();
  return SLURS.some(s => low.includes(s));
}

/* ---------- slow mode ---------- */
function msgRate(){ // msgs in last 60s across storage
  const cut = Date.now() - 60e3;
  return loadMsgs().filter(m => m.ts > cut).length;
}
function currentSlow(){
  const o = SM.settings.slowOverride;
  if (o && o !== "auto") return parseInt(o);
  const r = msgRate();
  if (r < 5) return 1; if (r < 15) return 3; if (r < 30) return 6; return 10;
}

/* ---------- user node rendering ---------- */
function userNode(u, msgUser){
  const rec = SM.getUser(msgUser);
  if (!rec) return `<span class="uname">ghost</span>`;
  const lvl = lvlFromXp(rec.chatXp || 0);
  const roleBadge = rec.role ? `<span class="role-badge role-${esc(rec.role.replace(/\s/g,""))}">${esc(rec.role)}</span>` : "";
  const fx = rec.cosmetics?.textFx ? " fx-" + rec.cosmetics.textFx : "";
  const clan = rec.clan ? `<span class="clan-tag">${esc(rec.clan.tag)}</span>` : "";
  const np = rec.nowPlaying ? (() => {
    const g = SM.findEff(rec.nowPlaying);
    return g ? `<span class="now-playing" data-join="${esc(rec.nowPlaying)}">${ICONS.gamepad} Now Playing: ${esc(g.name)}</span>` : "";
  })() : "";
  return `<span class="uname${fx}" data-user="${esc(rec.user)}">${esc(rec.name)}</span>${roleBadge}${lvlBadge(lvl)}${clan}${np}`;
}
function pfpHtml(rec, framed){
  const inner = rec?.pfp ? `<img src="${esc(rec.pfp)}" alt="">` : esc((rec?.name || "?")[0].toUpperCase());
  return `<div class="pfp ${framed ? "framed" : ""}" data-user="${esc(rec?.user || "")}">${inner}</div>`;
}

/* ---------- context menu ---------- */
function openUserMenu(u){
  const rec = SM.getUser(u); if (!rec) return;
  const m = SM.me();
  const isMe = m && m.user === u;
  const lvl = lvlFromXp(rec.chatXp || 0);
  const d = openModal(`
    <div style="display:flex;align-items:center;gap:13px">
      ${pfpHtml(rec, rec.cosmetics?.frame)}
      <div><div style="font-weight:900;font-size:16px">${esc(rec.name)} ${rec.role ? `<span class="role-badge role-${esc(rec.role.replace(/\s/g,""))}">${esc(rec.role)}</span>` : ""}</div>
      <div class="modal-sub">@${esc(rec.user)} · Chat LV ${lvl}</div></div>
    </div>
    ${rec.bio ? `<p style="margin-top:11px;font-size:13px;font-weight:600">${esc(rec.bio)}</p>` : ""}
    ${rec.nowPlaying ? (() => { const g = SM.findEff(rec.nowPlaying);
      return g ? `<div class="now-playing" data-join="${esc(rec.nowPlaying)}" style="margin-top:9px;font-size:12px">${ICONS.gamepad} Now Playing: <b>${esc(g.name)}</b> — click to join</div>` : ""; })() : ""}
    ${isMe ? "" : `
    <button class="big-btn" id="uFriend">Send Friend Request</button>
    <button class="big-btn ghost" id="uDM">Open Direct Message</button>`}
    <button class="big-btn ghost" id="uView">View Full Profile</button>
    ${isMe ? "" : `<button class="big-btn" id="uReport" style="background:#ff4757;color:#fff">Report User</button>`}
    <button class="big-btn ghost" data-close style="margin-top:8px">Close</button>
  `);
  d.querySelectorAll("[data-join]").forEach(x => x.onclick = () => { const g = SM.findEff(x.dataset.join); if (g){ d.remove(); SM.openGame(g); } });
  const fr = d.querySelector("#uFriend");
  if (fr) fr.onclick = () => {
    const me = SM.me();
    if (me.friends.includes(u)) return toast("Already friends.", true);
    if (SM.getUser(u).friends.includes(me.user)) return toast("Already friends.", true);
    SM.pushNotif(u, `${me.name} (@${me.user}) sent you a friend request.`, "friend");
    toast("Friend request sent"); d.remove();
  };
  const dm = d.querySelector("#uDM");
  if (dm) dm.onclick = () => { d.remove(); SM.switchView("inbox"); if (SM.openDMWith) SM.openDMWith(u); };
  d.querySelector("#uView").onclick = () => { d.remove(); if (SM.viewProfile) SM.viewProfile(u); };
  const rp = d.querySelector("#uReport");
  if (rp) rp.onclick = () => { d.remove(); reportForm(u); };
}

/* ---------- report form ---------- */
function reportForm(u){
  const d = openModal(`
    <div class="modal-head"><h2>Report @${esc(u)}</h2></div>
    <label class="fld">Reason<select id="rpReason" class="inp">
      <option>Spam</option><option>Harassment</option><option>Slurs</option><option>Inappropriate Profile Picture</option>
    </select></label>
    <label class="fld">Comments (optional)<textarea id="rpComment" class="inp" rows="3" placeholder="extra detail..."></textarea></label>
    <button class="big-btn" id="rpGo" style="background:#ff4757;color:#fff">Submit Report</button>
    <button class="big-btn ghost" data-close>Cancel</button>
  `);
  d.querySelector("#rpGo").onclick = () => {
    const me = SM.me();
    const reports = store.get("reports", []);
    reports.unshift({ id: "r" + Date.now(), reporter: me.user, accused: u,
      reason: d.querySelector("#rpReason").value, comment: d.querySelector("#rpComment").value.trim(),
      snippet: "", ts: Date.now(), status: "open" });
    store.set("reports", reports);
    SM.pushNotif(OWNER_USER_REF(), `New report: @${me.user} reported @${u} (${d.querySelector("#rpReason").value}).`, "report");
    d.remove(); toast("Report submitted — routed to the dev board.");
  };
}
function OWNER_USER_REF(){ return "owner"; }

/* ---------- gif picker ---------- */
let gifOpen = false;
async function loadGifs(q){
  const key = SM.settings.tenorKey;
  const panel = $("gifPanel"); if (!panel) return;
  if (!key){ panel.innerHTML = `<div class="modal-sub" style="grid-column:1/-1;padding:8px">Add a Tenor API key in Settings to load GIFs.</div>`; return; }
  panel.innerHTML = `<div class="modal-sub" style="grid-column:1/-1;padding:8px">Loading...</div>`;
  try {
    const url = `https://g.tenor.com/v1/${q ? "search?q=" + encodeURIComponent(q) : "trending"}&key=${encodeURIComponent(key)}&limit=12`;
    const r = await fetch(url); const j = await r.json();
    panel.innerHTML = (j.results || []).map(g =>
      `<img src="${esc(g.content_item?.body?.preview || g.content_item?.gif?.preview || g.media?.[0]?.tinygif?.url || "")}" data-full="${esc(g.content_item?.gif?.body || g.media?.[0]?.gif?.url || "")}" alt="">`).join("")
      || `<div class="modal-sub" style="grid-column:1/-1;padding:8px">No GIFs found.</div>`;
    panel.querySelectorAll("img[data-full]").forEach(im => im.onclick = () => sendMessage("", im.dataset.full));
  } catch(e){ panel.innerHTML = `<div class="modal-sub" style="grid-column:1/-1;padding:8px">GIF load failed.</div>`; }
}

/* ---------- send ---------- */
let lastSent = 0, cooldownIv = null;
function sendMessage(text, gif){
  const me = SM.me(); if (!me) return;
  if (me.banned) return toast("You are banned from chat.", true);
  if (Date.now() < me.mutedUntil) return toast(`Muted for ${Math.ceil((me.mutedUntil - Date.now())/60000)} more min.`, true);
  const slow = currentSlow();
  const wait = slow * 1000 - (Date.now() - lastSent);
  if (wait > 0) return toast(`Slow mode: wait ${(wait/1000).toFixed(1)}s`, true);
  text = (text ?? "").trim();
  if (!text && !gif) return;
  if (isSlur(text)){ toast("Message blocked: hate speech is not allowed.", true); return; }
  const msgs = loadMsgs();
  const msg = { id: "m" + Date.now() + Math.random().toString(36).slice(2,5), user: me.user,
    text, gif: gif || "", ts: Date.now(), reactions: {} };
  msgs.push(msg); saveMsgs(msgs);
  lastSent = Date.now();
  if (text) SM.addXp("chat", CHAT_XP);
  if (bc) bc.postMessage({ t: "msg", channel: chatKey() });
  renderFeed(true);
  const inp = $("chatInput"); if (inp) inp.value = "";
  startCooldownBar(slow);
}
function startCooldownBar(slow){
  const bar = $("coolBar"); if (!bar) return;
  clearInterval(cooldownIv);
  const end = lastSent + slow * 1000;
  cooldownIv = setInterval(() => {
    const left = end - Date.now();
    bar.style.width = left > 0 ? (left / (slow * 1000) * 100) + "%" : "0%";
    if (left <= 0) clearInterval(cooldownIv);
  }, 100);
}

/* ---------- render ---------- */
function renderFeed(keepScroll){
  const feed = $("chatFeed"); if (!feed) return;
  const me = SM.me();
  const atBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 60;
  const msgs = loadMsgs();
  feed.innerHTML = msgs.length ? msgs.map(m => {
    const rec = SM.getUser(m.user) || SM.blankUser(m.user);
    const mine = me && m.user === me.user;
    const shadow = me && me.shadow; // shadowed user's own messages render (fake); others never see them
    const re = Object.entries(m.reactions || {}).filter(([, users]) => users.length);
    return `<div class="msg ${m.ts > Date.now() - 4000 ? "popped" : ""}" data-mid="${esc(m.id)}">
      ${pfpHtml(rec, rec.cosmetics?.frame)}
      <div class="msg-body">
        <div class="msg-top">${userNode(me, m.user)} <span class="msg-time">${timeAgo(m.ts)} ago</span></div>
        ${m.text ? `<div class="msg-text">${filterText(m.text)}</div>` : ""}
        ${m.gif ? `<div class="msg-text"><img src="${esc(m.gif)}" alt="gif" loading="lazy"></div>` : ""}
        <div class="msg-meta">
          <span class="react-bar">${re.map(([k, users]) =>
            `<span class="react-pill" data-react="${k}" data-mid="${esc(m.id)}" title="${esc(users.join(", "))}">${REACTS[k] || ""} ${users.length}</span>`).join("")}</span>
          <span class="react-pill" data-addreact="${esc(m.id)}" title="React">+</span>
        </div>
      </div>
    </div>`;
  }).join("") : `<div class="empty" style="border:none">No messages yet — say hi.</div>`;
  if (atBottom || keepScroll) feed.scrollTop = feed.scrollHeight;
  bindFeed();
}
function bindFeed(){
  const feed = $("chatFeed"); if (!feed) return;
  feed.querySelectorAll(".pfp, .uname").forEach(el =>
    el.onclick = () => openUserMenu(el.dataset.user));
  feed.querySelectorAll("[data-join]").forEach(el =>
    el.onclick = () => { const g = SM.findEff(el.dataset.join); if (g) SM.openGame(g); });
  feed.querySelectorAll("[data-react]").forEach(el => el.onclick = () => addReaction(el.dataset.mid, el.dataset.react));
  feed.querySelectorAll("[data-addreact]").forEach(el => el.onclick = () => {
    const ex = el.parentElement.querySelector(".react-pick");
    if (ex){ ex.remove(); return; }
    const pick = document.createElement("div");
    pick.className = "react-pick";
    pick.innerHTML = Object.entries(REACTS).map(([k, svg]) => `<button data-k="${k}">${svg}</button>`).join("");
    pick.querySelectorAll("button").forEach(b => b.onclick = () => { addReaction(el.dataset.addreact, b.dataset.k); pick.remove(); });
    el.parentElement.appendChild(pick);
  });
}
function addReaction(mid, key){
  const me = SM.me(); if (!me) return;
  const msgs = loadMsgs();
  const msg = msgs.find(x => x.id === mid); if (!msg) return;
  msg.reactions = msg.reactions || {};
  for (const users of Object.values(msg.reactions)){
    const i = users.indexOf(me.user); if (i > -1) users.splice(i, 1);
  }
  (msg.reactions[key] = msg.reactions[key] || []).push(me.user);
  saveMsgs(msgs);
  if (bc) bc.postMessage({ t: "msg", channel: chatKey() });
  renderFeed();
}

/* ---------- chat view ---------- */
function renderChat(){
  const v = $("view-chat");
  const me = SM.me();
  const clan = me?.clan;
  channel = v.dataset.channel || "public";
  if (channel !== "public" && !clan) channel = "public";
  const slow = currentSlow();
  v.innerHTML = `
    <div class="chips" style="padding:0">
      <button class="chip ${channel === "public" ? "active" : ""}" data-ch="public">Public</button>
      ${clan ? `<button class="chip ${channel !== "public" ? "active" : ""}" data-ch="cc">${esc(clan.tag)} clan chat</button>` : ""}
    </div>
    <div class="chat-view-wrap" style="margin-top:10px">
      <div class="chat-wrap">
        <div class="chat-head">
          <span class="ttl">${channel === "public" ? "Public Chat" : esc(clan.tag) + " Clan Chat"}</span>
          <span class="slow">${ICONS.timer} slow mode: ${slow}s ${SM.settings.slowOverride !== "auto" ? "(locked by admin)" : "(auto)"}</span>
        </div>
        <div class="chat-feed" id="chatFeed"></div>
        <div style="height:3px;background:var(--card)"><div id="coolBar" style="height:100%;width:0;background:var(--accent);border-radius:3px"></div></div>
        <div class="chat-input">
          <button class="cibtn" id="gifBtn" title="GIFs">${ICONS.gif}</button>
          <input id="chatInput" placeholder="Message ${channel === "public" ? "#public" : esc(clan.tag)}" maxlength="300" autocomplete="off">
          <button class="cibtn" id="chatSend" title="Send" style="background:var(--accent);color:#191430;border-color:transparent">${ICONS.send}</button>
        </div>
        <div id="gifPanel" class="gif-panel hidden"></div>
      </div>
    </div>`;
  renderFeed();
  $("chatSend").onclick = () => sendMessage($("chatInput").value);
  $("chatInput").addEventListener("keydown", e => { if (e.key === "Enter") sendMessage($("chatInput").value); });
  v.querySelectorAll("[data-ch]").forEach(c => c.onclick = () => {
    channel = c.dataset.ch; v.dataset.channel = channel; renderChat();
  });
  $("gifBtn").onclick = () => {
    gifOpen = !gifOpen;
    $("gifPanel").classList.toggle("hidden", !gifOpen);
    if (gifOpen) loadGifs();
  };
}

/* ---------- cross-tab sync ---------- */
if (bc) bc.onmessage = e => {
  if (e.data && e.data.t === "msg" && e.data.channel === chatKey()){
    renderFeed(); const s = $("chatHeadSlow"); 
    if (SM.currentView === "chat") renderChat();
  }
  if (e.data && e.data.t === "admin"){
    if (e.data.banner != null) SM.showBanner(e.data.banner);
    if (e.data.slow != null){ SM.settings.slowOverride = e.data.slow; SM.saveSettings(); if (SM.currentView === "chat") renderChat(); }
    if (e.data.chests){ SM.refreshChests(); }
    if (e.data.shop){ /* profile re-render picks it up */ }
  }
};
function broadcastAdmin(patch){ if (bc) bc.postMessage({ t: "admin", ...patch }); }

/* ---------- bot chatter (one tab only, lock via storage) ---------- */
setInterval(() => {
  if (SM.currentView !== "chat" && Math.random() > .3) return;
  const lock = store.get("botlock", 0);
  if (Date.now() - lock < 8000) return;
  store.set("botlock", Date.now());
  const b = SM.BOTS[Math.floor(Math.random() * SM.BOTS.length)];
  const msgs = loadMsgs();
  msgs.push({ id: "m" + Date.now(), user: b.user, text: BOTLINES[Math.floor(Math.random() * BOTLINES.length)],
    gif: "", ts: Date.now(), reactions: {} });
  saveMsgs(msgs);
  if (bc) bc.postMessage({ t: "msg", channel: chatKey() });
  if (SM.currentView === "chat") renderFeed();
}, 14000);

SM.registerView("chat", renderChat);
SM.chatApi = { sendMessage, renderFeed, broadcastAdmin, loadMsgs, saveMsgs, chatKey: () => chatKey, currentSlow };
})();
