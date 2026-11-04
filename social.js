/* =====================================================
   SOLARIS MINI — social (social.js)
   Inbox (conversations, message requests, incognito
   self-destruct, alerts), Profile (presence, dual XP,
   shop, clans), public profile cards.
   ===================================================== */
"use strict";
(() => {
const { store, $, esc, toast, openModal, ICONS, timeAgo, lvlFromXp, lvlBadge, fmtTime } = SM;
const me = () => SM.me();
const threadId = (a, b) => [a, b].sort().join("|");
function loadDms(){ return store.get("dms", {}); }
function saveDms(d){ store.set("dms", d); }
function getThread(id){ const d = loadDms(); return d[id] || []; }
function pushMsg(id, msg){ const d = loadDms(); (d[id] = d[id] || []).push(msg); saveDms(d); }
function setThread(id, arr){ const d = loadDms(); d[id] = arr; saveDms(d); }

/* ================= SHOP ================= */
const SHOP = [
  { id: "frame_pulse",  type: "frame",   name: "Pulse Ring",      desc: "Animated ring around your avatar", price: 300, icon: "paint" },
  { id: "text_neon",    type: "textFx",  name: "Neon Glow",       desc: "Cyan neon username in chat",       price: 400, icon: "text" },
  { id: "text_shadow",  type: "textFx",  name: "Drop Shadow",     desc: "Bold layered shadow text",         price: 350, icon: "text" },
  { id: "text_rainbow", type: "textFx",  name: "Rainbow Cycle",   desc: "Animated rainbow username",        price: 700, icon: "text" },
  { id: "badge_founder",type: "badge",   name: "Star Founder",    desc: "Limited founder badge",            price: 250, icon: "star", iconFill: true },
  { id: "theme_nebula", type: "theme",   name: "Nebula Profile",  desc: "Deep space profile background",    price: 450, icon: "spark" },
  { id: "theme_grid",   type: "theme",   name: "Neon Grid",       desc: "Geometric grid profile skin",      price: 450, icon: "chart" },
];
function shopItems(){
  const extra = store.get("shopItems", []).filter(i => !i.expiresAt || i.expiresAt > Date.now());
  return [...SHOP, ...extra];
}

/* ================= PROFILE VIEW ================= */
function renderProfile(){
  const v = $("view-profile");
  const m = me(); if (!m){ v.innerHTML = ""; return; }
  const chatLvl = lvlFromXp(m.chatXp);
  const gameLvls = Object.entries(m.gameXp).map(([gid, xp]) => {
    const g = SM.findEff(gid);
    return { name: g ? g.name : gid, lvl: lvlFromXp(xp), t: SM.playtime[gid] || 0 };
  }).sort((a, b) => b.lvl - a.lvl).slice(0, 5);
  const items = shopItems();
  const owned = m.cosmetics;
  const clan = m.clan;

  v.innerHTML = `
    <div class="prof-card">
      ${owned.theme === "theme_nebula" ? '<div class="prof-bg" style="background:radial-gradient(circle at 30% 20%,#3b2a7e,transparent 60%),radial-gradient(circle at 80% 80%,#6f5fc0,transparent 55%)"></div>' : ""}
      ${owned.theme === "theme_grid" ? '<div class="prof-bg" style="background:repeating-linear-gradient(0deg,transparent 0 23px,rgba(160,140,255,.25) 23px 24px),repeating-linear-gradient(90deg,transparent 0 23px,rgba(160,140,255,.25) 23px 24px)"></div>' : ""}
      <div class="prof-top">
        <div class="prof-pfp ${owned.frame ? "framed" : ""}"><span class="dot ${esc(m.status)}"></span>
          ${m.pfp ? `<img src="${esc(m.pfp)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover" onerror="this.remove()">` : esc(m.name[0].toUpperCase())}</div>
        <div style="flex:1">
          <div class="prof-name">${esc(m.name)} ${m.role ? `<span class="role-badge role-${esc(m.role.replace(/\s/g,""))}">${esc(m.role)}</span>` : ""} ${lvlBadge(chatLvl)}
            ${(owned.badges || []).map(b => `<span class="lvl-badge" style="background:#ffd35c22;color:#ffd35c;border:1px solid #ffd35c66">${esc(b)}</span>`).join("")}</div>
          <div class="prof-user">@${esc(m.user)} ${clan ? `<span class="clan-tag">${esc(clan.tag)}</span>` : ""}</div>
          ${m.nowPlaying ? (() => { const g = SM.findEff(m.nowPlaying);
            return g ? `<div class="now-playing" id="profNow" style="margin-top:5px;font-size:12px">${ICONS.gamepad} Now Playing: <b>${esc(g.name)}</b></div>` : ""; })() : ""}
          <p class="prof-bio">${esc(m.bio || "No bio yet.")}</p>
        </div>
        <button class="cibtn" id="editProf" title="Edit profile"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>
      </div>
      <div class="prof-stats">
        <div class="pstat"><div class="n">${chatLvl}</div><div class="l">CHAT LEVEL</div></div>
        <div class="pstat"><div class="n">${Object.keys(m.gameXp).length}</div><div class="l">GAMES LEVELED</div></div>
        <div class="pstat"><div class="n">${m.coins.toLocaleString()}</div><div class="l">COINS</div></div>
        <div class="pstat"><div class="n">${SM.streak.count}</div><div class="l">DAY STREAK</div></div>
        <div class="pstat"><div class="n">${fmtTime(Object.values(SM.playtime).reduce((a,b)=>a+b,0))}</div><div class="l">PLAYTIME</div></div>
      </div>
      <div class="status-row">
        ${["Online","Idle","DND","Offline"].map(s => `<button class="status-pick ${m.status === s ? "sel" : ""}" data-st="${s}"><span class="dot ${s}"></span>${s === "DND" ? "Do Not Disturb" : s}</button>`).join("")}
      </div>
    </div>

    ${gameLvls.length ? `<div class="section-title">Game Levels</div>
      <div class="lb-panel">${gameLvls.map(g => `<div class="lb-row"><span style="font-weight:800">${esc(g.name)}</span>${lvlBadge(g.lvl)}<span class="tm">${fmtTime(g.t)}</span></div>`).join("")}</div>` : ""}

    <div class="section-title">Cosmetic Shop</div>
    <div class="shop-grid">${items.map(it => shopCard(it, m)).join("")}</div>

    <div class="section-title">Clan</div>
    ${clan ? `
      <div class="clan-box">
        <div style="display:flex;align-items:center;gap:10px"><span class="clan-tag" style="font-size:13px">${esc(clan.tag)}</span>
        <b style="font-size:15px">${esc(clan.name)}</b>
        <span class="modal-sub" style="margin-left:auto">${ICONS.chart} clan leaderboard rank by playtime</span></div>
        <div class="clan-members">${clan.members.map(u => { const r = SM.getUser(u);
          return `<span class="status-pick" data-mu="${esc(u)}"><span class="dot ${r?.status || "Offline"}"></span>${esc(r?.name || u)}</span>`; }).join("")}
        ${m.friends.filter(f => !clan.members.includes(f)).map(f => `<button class="status-pick" data-invite="${esc(f)}" title="Invite">+ invite ${esc(SM.getUser(f)?.name || f)}</button>`).join("")}
        </div>
      </div>` : `
      <div class="clan-box">
        <b style="font-size:14px">Create a clan</b>
        <p class="modal-sub" style="margin:5px 0 10px">Premium clan creation costs <b style="color:var(--gold)">5,000 coins</b>. Includes a custom tag, invites, and a private clan chat ("cc") tied to the leaderboard.</p>
        <label class="fld">Clan name<input id="clanName" class="inp" maxlength="24" placeholder="e.g. Solar Vanguard"></label>
        <label class="fld">Clan tag (max 4 chars)<input id="clanTag" class="inp" maxlength="4" placeholder="[V1P]"></label>
        <button class="big-btn" id="clanGo">Create Clan — 5,000 coins</button>
      </div>`}
  `;

  v.querySelectorAll("[data-st]").forEach(b => b.onclick = () => { SM.saveMe({ status: b.dataset.st }); renderProfile(); });
  $("editProf").onclick = editProfile;
  const np = $("profNow");
  if (np) np.onclick = () => { const g = SM.findEff(m.nowPlaying); if (g) SM.openGame(g); };
  v.querySelectorAll("[data-buy]").forEach(b => b.onclick = () => buyItem(b.dataset.buy));
  v.querySelectorAll("[data-equip]").forEach(b => b.onclick = () => equipItem(b.dataset.equip));
  const cg = $("clanGo");
  if (cg) cg.onclick = () => {
    const name = $("clanName").value.trim();
    let tag = $("clanTag").value.trim().toUpperCase();
    if (!name || !tag) return toast("Clan name and tag are required.", true);
    if (m.coins < 5000) return toast("Clans cost 5,000 coins — level up to earn more.", true);
    SM.saveMe({ coins: m.coins - 5000, clan: { name, tag, members: [m.user] } });
    toast(`Clan ${tag} created!`);
    renderProfile();
  };
  v.querySelectorAll("[data-invite]").forEach(b => b.onclick = () => {
    const u = b.dataset.invite;
    const clan = me().clan;
    clan.members.push(u); SM.saveMe({ clan });
    SM.pushNotif(u, `You were invited to clan ${clan.tag} by ${me().name}.`, "system");
    toast("Invited " + (SM.getUser(u)?.name || u));
    renderProfile();
  });
  v.querySelectorAll("[data-mu]").forEach(b => b.onclick = () => viewProfile(b.dataset.mu));
}
function shopCard(it, m){
  const ownedList = m.cosmetics;
  const isOwned = (it.type === "badge" ? ownedList.badges.includes(it.name) : ownedList[it.type] === it.id || ownedList.owned?.includes(it.id));
  const equipped = it.type === "badge" ? false : ownedList[it.type] === it.id;
  return `<div class="shop-item">
    <div class="si-ic">${it.iconFill ? ICONS.star(true) : ICONS[it.icon] || ICONS.spark}</div>
    <div class="si-n">${esc(it.name)}</div>
    <div class="si-d">${esc(it.desc)}${it.expiresAt ? " · limited time" : ""}</div>
    <div class="si-p">${it.price} coins</div>
    ${isOwned
      ? (it.type === "badge" ? '<button class="shop-btn owned" disabled>Owned</button>'
        : `<button class="shop-btn ${equipped ? "equipped" : ""}" data-equip="${it.id}">${equipped ? "Equipped" : "Equip"}</button>`)
      : `<button class="shop-btn" data-buy="${it.id}">Buy</button>`}
  </div>`;
}
function buyItem(id){
  const m = me(); const it = shopItems().find(x => x.id === id); if (!it) return;
  if (m.coins < it.price) return toast("Not enough coins — earn 100 per level.", true);
  m.coins -= it.price;
  if (it.type === "badge") m.cosmetics.badges.push(it.name);
  else { m.cosmetics.owned = m.cosmetics.owned || []; m.cosmetics.owned.push(it.id); m.cosmetics[it.type] = it.id; }
  SM.saveMe({}); toast(`Purchased: ${it.name}`);
  renderProfile();
}
function equipItem(id){
  const m = me(); const it = shopItems().find(x => x.id === id);
  if (m.cosmetics[it.type] === id) m.cosmetics[it.type] = "";
  else m.cosmetics[it.type] = id;
  SM.saveMe({}); renderProfile();
}
function editProfile(){
  const m = me();
  const d = openModal(`
    <div class="modal-head"><h2>Edit profile</h2></div>
    <label class="fld">Display name<input id="eName" class="inp" value="${esc(m.name)}" maxlength="24"></label>
    <label class="fld">About me<input id="eBio" class="inp" value="${esc(m.bio)}" maxlength="120"></label>
    <label class="fld">Profile picture URL<input id="ePfp" class="inp" value="${esc(m.pfp)}" placeholder="https://..."></label>
    <button class="big-btn" id="eGo">Save</button>
  `);
  d.querySelector("#eGo").onclick = () => {
    SM.saveMe({ name: d.querySelector("#eName").value.trim() || m.name,
      bio: d.querySelector("#eBio").value.trim(), pfp: d.querySelector("#ePfp").value.trim() });
    d.remove(); renderProfile(); toast("Profile saved");
  };
}
function viewProfile(u){
  const r = SM.getUser(u); if (!r) return;
  const lvl = lvlFromXp(r.chatXp || 0);
  const isMe = me() && me().user === u;
  openModal(`
    <div class="prof-card" style="padding:16px">
      <div class="prof-top">
        <div class="prof-pfp ${r.cosmetics?.frame ? "framed" : ""}"><span class="dot ${esc(r.status)}"></span>
          ${r.pfp ? `<img src="${esc(r.pfp)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover" onerror="this.remove()">` : esc(r.name[0].toUpperCase())}</div>
        <div><div class="prof-name" style="font-size:17px">${esc(r.name)} ${r.role ? `<span class="role-badge role-${esc(r.role.replace(/\s/g,""))}">${esc(r.role)}</span>` : ""} ${lvlBadge(lvl)}</div>
        <div class="prof-user">@${esc(r.user)} ${r.clan ? `<span class="clan-tag">${esc(r.clan.tag)}</span>` : ""}</div>
        ${r.nowPlaying ? (() => { const g = SM.findEff(r.nowPlaying);
          return g ? `<div class="now-playing" data-pj="${esc(r.nowPlaying)}" style="margin-top:5px;font-size:12px">${ICONS.gamepad} Now Playing: <b>${esc(g.name)}</b></div>` : ""; })() : ""}
        <p class="prof-bio">${esc(r.bio || "No bio.")}</p>
        <div style="display:flex;gap:6px;margin-top:7px;flex-wrap:wrap">${(r.cosmetics?.badges || []).map(b =>
          `<span class="lvl-badge" style="background:#ffd35c22;color:#ffd35c;border:1px solid #ffd35c66">${esc(b)}</span>`).join("")}</div>
        </div>
      </div>
    </div>
    ${isMe ? "" : `<button class="big-btn" id="pvDM">Direct Message</button>`}
    <button class="big-btn ghost" data-close style="margin-top:8px">Close</button>
  `).querySelectorAll("[data-pj]").forEach(x => x.onclick = () => {
    const g = SM.findEff(x.dataset.pj); if (g){ x.closest(".modal").remove(); SM.openGame(g); }
  });
  const pv = document.querySelector("#pvDM");
  if (pv) pv.onclick = () => { document.querySelector(".modal").remove(); SM.switchView("inbox"); SM.openDMWith(u); };
}

/* ================= INBOX ================= */
let inboxTab = "chats";
function renderInbox(){
  const v = $("view-inbox");
  const m = me(); if (!m){ v.innerHTML = ""; return; }
  const d = loadDms();
  const threads = Object.entries(d).map(([tid, msgs]) => {
    const other = tid.split("|").find(u => u !== m.user) || m.user;
    const last = msgs[msgs.length - 1];
    return { tid, other, last, msgs };
  }).filter(t => t.last);
  const accepted = store.get("dmAccept", {});
  const isFriend = u => m.friends.includes(u) || (SM.getUser(u)?.friends || []).includes(m.user);
  const convos = threads.filter(t => accepted[t.tid] || isFriend(t.other));
  const reqs = SM.settings.msgRequests ? threads.filter(t => !accepted[t.tid] && !isFriend(t.other)) : [];
  const myNotifs = SM.notifs().filter(n => n.user === m.user);
  const unread = myNotifs.filter(n => !n.read).length;

  const convoRow = t => {
    const r = SM.getUser(t.other) || SM.blankUser(t.other);
    const inc = t.last.incognito ? '<span style="color:var(--red);font-weight:800">[incognito]</span> ' : "";
    return `<div class="convo" data-tid="${esc(t.tid)}">
      <div class="pfp" style="cursor:default">${r.pfp ? `<img src="${esc(r.pfp)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : esc((r.name || "?")[0].toUpperCase())}</div>
      <div style="min-width:0"><div class="cn">${esc(r.name || t.other)} <span class="modal-sub">@${esc(t.other)}</span></div>
      <div class="cl">${inc}${t.last.destroyed ? "<i>message destroyed</i>" : esc(t.last.text || (t.last.gif ? "[GIF]" : ""))}</div></div>
      <span class="ct">${timeAgo(t.last.ts)}</span>
    </div>`;
  };

  v.innerHTML = `
    <div class="inbox-tabs">
      <button class="chip ${inboxTab === "chats" ? "active" : ""}" data-it="chats">Chats</button>
      <button class="chip ${inboxTab === "reqs" ? "active" : ""}" data-it="reqs">Requests${reqs.length ? `<span class="pill-n">${reqs.length}</span>` : ""}</button>
      <button class="chip ${inboxTab === "alerts" ? "active" : ""}" data-it="alerts">Alerts${unread ? `<span class="pill-n">${unread}</span>` : ""}</button>
    </div>
    ${inboxTab === "chats" ? (convos.length ? convos.map(convoRow).join("") : '<div class="empty">No conversations. Open someone\u2019s profile from chat.</div>') : ""}
    ${inboxTab === "reqs" ? (reqs.length ? reqs.map(t => {
        const r = SM.getUser(t.other) || SM.blankUser(t.other);
        return `<div class="convo"><div class="pfp" style="cursor:default">${esc((r.name || "?")[0].toUpperCase())}</div>
        <div style="flex:1;min-width:0"><div class="cn">${esc(r.name || t.other)} <span class="modal-sub">@${esc(t.other)} wants to message you</span></div>
        <div class="cl">${esc(t.last.text || "[message]")}</div></div>
        <button class="shop-btn" style="width:auto;padding:7px 14px" data-accept="${esc(t.tid)}">Accept</button>
        <button class="shop-btn owned" style="width:auto;padding:7px 14px" data-decline="${esc(t.tid)}">Decline</button></div>`;
      }).join("") : '<div class="empty">No message requests.</div>') : ""}
    ${inboxTab === "alerts" ? (myNotifs.length ? myNotifs.map(n => `
      <div class="convo" style="cursor:default">
        <div style="flex:1"><div class="cn" style="font-size:12.5px">${esc(n.text)}</div>
        <div class="cl">${new Date(n.ts).toLocaleString()}</div></div>
        ${n.type === "friend" && !m.friends.includes((n.text.match(/@([a-z0-9_]+)/) || [])[1] || "") ?
          `<button class="shop-btn" style="width:auto;padding:7px 14px" data-faccept="${esc((n.text.match(/@([a-z0-9_]+)/) || [])[1] || "")}">Accept</button>` : ""}
      </div>`).join("") : '<div class="empty">No alerts yet.</div>') : ""}
  `;
  v.querySelectorAll("[data-it]").forEach(b => b.onclick = () => { inboxTab = b.dataset.it; renderInbox(); });
  v.querySelectorAll("[data-tid]").forEach(c => c.onclick = () => openThread(c.dataset.tid));
  v.querySelectorAll("[data-accept]").forEach(b => b.onclick = e => { e.stopPropagation(); acceptReq(b.dataset.accept); });
  v.querySelectorAll("[data-decline]").forEach(b => b.onclick = e => { e.stopPropagation();
    const a = store.get("dmAccept", {}); a[b.dataset.decline] = false; store.set("dmAccept", a); renderInbox(); });
  v.querySelectorAll("[data-faccept]").forEach(b => b.onclick = () => {
    const u = b.dataset.faccept; if (!u) return;
    befriend(u); b.remove();
  });
  myNotifs.forEach(n => n.read = true); store.set("notifs", SM.notifs());
}
function befriend(u){
  const m = me();
  if (!m.friends.includes(u)) m.friends.push(u);
  const other = SM.getUser(u);
  if (other && !other.friends.includes(m.user)) other.friends.push(m.user);
  SM.saveMe({}); if (other.user) { SM.registry()[u] = other; store.set("users", SM.registry()); }
  toast("You are now friends with " + (other?.name || u));
}
function acceptReq(tid){
  const a = store.get("dmAccept", {}); a[tid] = true; store.set("dmAccept", a);
  const other = tid.split("|").find(u => u !== me().user);
  befriend(other);
  renderInbox();
}

/* ---------- DM thread ---------- */
let openTid = null;
function openThread(tid, withUser){
  const m = me();
  if (withUser){ tid = threadId(m.user, withUser); }
  openTid = tid;
  const other = tid.split("|").find(u => u !== m.user);
  const r = SM.getUser(other) || SM.blankUser(other);
  const d = openModal(`
    <div class="modal-head"><h2>${esc(r.name || other)}</h2><span class="modal-sub">@${esc(other)} · ${esc(r.status || "Offline")}</span></div>
    <div class="dm-wrap">
      <div class="dm-feed" id="dmFeed"></div>
      <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
        <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);font-weight:800;cursor:pointer;flex-shrink:0">
          <input type="checkbox" id="incToggle"> incognito</label>
        <input id="dmInput" class="inp" style="margin-top:0" placeholder="Message..." maxlength="300">
        <button class="shop-btn" id="dmSend" style="width:auto;padding:10px 16px">Send</button>
      </div>
    </div>
  `, true);
  const feed = d.querySelector("#dmFeed");
  function draw(){
    const msgs = getThread(tid);
    feed.innerHTML = msgs.length ? msgs.map(msg => {
      const mine = msg.from === m.user;
      if (msg.incognito && !mine && !msg.viewed){
        return `<div class="dm-b theirs"><button class="shop-btn" style="width:auto;padding:6px 12px" data-view="${esc(msg.id)}">View once — self-destructs in 10s</button></div>`;
      }
      if (msg.incognito && !mine && msg.viewed && !msg.destroyed){
        return `<div class="dm-b theirs">${msg.gif ? `<img src="${esc(msg.gif)}">` : esc(msg.text)}
          <div class="destroy-timer" data-left="${esc(msg.id)}">purging...</div></div>`;
      }
      if (msg.incognito && msg.destroyed){
        return `<div class="dm-b ${mine ? "mine" : "theirs"}" style="opacity:.55;font-style:italic">message destroyed</div>`;
      }
      return `<div class="dm-b ${mine ? "mine" : "theirs"}">${msg.gif ? `<img src="${esc(msg.gif)}">` : esc(msg.text)}</div>`;
    }).join("") : '<div class="empty" style="border:none">Say something.</div>';
    feed.scrollTop = feed.scrollHeight;
    feed.querySelectorAll("[data-view]").forEach(b => b.onclick = () => viewIncognito(tid, b.dataset.view, draw));
  }
  d.querySelector("#dmSend").onclick = () => {
    const text = d.querySelector("#dmInput").value.trim(); if (!text) return;
    pushMsg(tid, { id: "d" + Date.now(), from: m.user, to: other, text, ts: Date.now(),
      incognito: d.querySelector("#incToggle").checked, viewed: false, destroyed: false });
    d.querySelector("#dmInput").value = "";
    draw(); renderInbox();
  };
  d.querySelector("#dmInput").addEventListener("keydown", e => { if (e.key === "Enter") d.querySelector("#dmSend").click(); });
  draw();
}
function viewIncognito(tid, mid, draw){
  const msgs = getThread(tid);
  const msg = msgs.find(x => x.id === mid); if (!msg || msg.viewed) return;
  msg.viewed = true;
  setThread(tid, msgs);
  const end = Date.now() + 10000;
  const iv = setInterval(() => {
    const left = end - Date.now();
    const el = document.querySelector(`[data-left="${mid}"]`);
    if (el) el.textContent = "purging in " + Math.ceil(left / 1000) + "s";
    if (left <= 0){
      clearInterval(iv);
      const cur = getThread(tid);
      const target = cur.find(x => x.id === mid);
      if (target){ target.destroyed = true; target.text = ""; target.gif = ""; setThread(tid, cur); }
      draw();
    }
  }, 250);
  draw();
}
SM.openDMWith = u => openThread(null, u);

SM.onInboxChange = () => { if (SM.currentView === "inbox") renderInbox(); };
SM.registerView("inbox", renderInbox);
SM.registerView("profile", renderProfile);
SM.viewProfile = viewProfile;
SM.renderShopOnly = () => {};
})();
