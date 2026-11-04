/* =====================================================
   SOLARIS MINI — developer board (admin.js)
   Owner-only dashboard: coin injection, game management,
   user/role manager, limited shop, chest drops, chat
   overrides, announcements, report queue with actions.
   ===================================================== */
"use strict";
(() => {
const { store, $, esc, toast, openModal, ICONS, fmtTime } = SM;

const isOwner = () => { const m = SM.me(); return m && (m.user === "owner" || m.role === "Owner"); };

/* ---------- report queue ---------- */
function ticketsHtml(){
  const reports = store.get("reports", []).filter(r => r.status === "open");
  if (!reports.length) return '<div class="modal-sub">Queue is clear. Reports from chat land here.</div>';
  return reports.map(r => {
    const rep = SM.getUser(r.reporter), acc = SM.getUser(r.accused);
    return `<div class="ticket" data-rid="${esc(r.id)}">
      <div class="tt">${esc(rep?.name || r.reporter)} reported ${esc(acc?.name || r.accused)}</div>
      <div class="ts">Category: <b>${esc(r.reason)}</b>${r.comment ? " · " + esc(r.comment) : ""} · ${new Date(r.ts).toLocaleString()}</div>
      ${r.snippet ? `<div class="tq">${esc(r.snippet)}</div>` : ""}
      <label class="fld">Official response / reasoning log<input class="inp admin-note" placeholder="e.g. Repeatedly bypassing filter thresholds"></label>
      <div class="ticket-actions">
        <button data-act="dismiss">Dismiss</button>
        <button data-act="warn">Warn</button>
        <button data-act="mute1">Mute 1hr</button>
        <button data-act="mute24">Mute 24hr</button>
        <button data-act="shadow">Shadow-ban</button>
        <button data-act="ban" class="ban">Hard Ban</button>
      </div>
    </div>`;
  }).join("");
}
function actOnReport(rid, act, note, card){
  const reports = store.get("reports", []);
  const r = reports.find(x => x.id === rid); if (!r) return;
  const target = SM.registry()[r.accused] || SM.getUser(r.accused);
  if (!target){ toast("Target account not found in this browser.", true); return; }
  const stamp = new Date().toLocaleString() + " — " + (note || "no note");
  if (act === "dismiss"){ r.status = "dismissed"; }
  if (act === "warn"){
    SM.pushNotif(r.accused, `Official warning from staff: ${note || "policy violation"}.`);
    target.log.push("WARN " + stamp); r.status = "actioned";
  }
  if (act === "mute1"){ target.mutedUntil = Date.now() + 3600e3;
    SM.pushNotif(r.accused, `You were muted for 1 hour. Note: ${note || "policy violation"}`);
    target.log.push("MUTE 1h " + stamp); r.status = "actioned"; }
  if (act === "mute24"){ target.mutedUntil = Date.now() + 86400e3;
    SM.pushNotif(r.accused, `You were muted for 24 hours. Note: ${note || "policy violation"}`);
    target.log.push("MUTE 24h " + stamp); r.status = "actioned"; }
  if (act === "shadow"){ target.shadow = !target.shadow;
    SM.pushNotif(r.accused, target.shadow ? "Your account is under review (shadow-ban active)." : "Your account review has ended.");
    target.log.push("SHADOW " + (target.shadow ? "ON " : "OFF ") + stamp); r.status = "actioned"; }
  if (act === "ban"){ target.banned = true;
    SM.pushNotif(r.accused, `You have been banned. Note: ${note || "policy violation"}`);
    target.log.push("BAN " + stamp); r.status = "actioned"; }
  SM.registry()[r.accused] = target; store.set("users", SM.registry());
  store.set("reports", reports);
  toast("Action executed" + (note ? " — logged" : ""));
  card.remove();
}

/* ---------- dev board modal ---------- */
function openDev(){
  if (!isOwner()) return toast("Owner access only.", true);
  const reports = store.get("reports", []);
  const users = SM.registry();
  const d = openModal(`
    <div class="modal-head">${'<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13 5l-2 14"/></svg>'}<h2>Developer Board</h2></div>
    <div class="dev-grid">

      <div class="dev-panel"><h3>${ICONS.coin} Coin injection</h3>
        <input class="inp" id="dvTarget" placeholder="target username">
        <div class="dev-row"><input class="inp" id="dvAmount" type="number" placeholder="amount" min="1">
        <button class="big-btn" id="dvGrant">Grant</button></div>
      </div>

      <div class="dev-panel"><h3>${ICONS.dice} Game hub (local inject)</h3>
        <input class="inp" id="dvGTitle" placeholder="Title">
        <input class="inp" id="dvGUrl" placeholder="Iframe / game URL">
        <input class="inp" id="dvGIcon" placeholder="Thumbnail URL (optional)">
        <div class="dev-row"><button class="big-btn" id="dvGAdd">Add Game</button></div>
        <div id="dvGList" style="margin-top:9px"></div>
      </div>

      <div class="dev-panel"><h3>${ICONS.star} Game of the Day</h3>
        <select class="inp" id="dvGotd"></select>
        <button class="big-btn ghost" id="dvGotdClear">Reset to daily rotation</button>
      </div>

      <div class="dev-panel"><h3>${ICONS.users} User &amp; role manager</h3>
        <input class="inp" id="dvUser" placeholder="username">
        <div class="dev-row">
          <select class="inp" id="dvRole"><option value="">no role</option><option>Owner</option><option>Beta Tester</option></select>
          <button class="big-btn" id="dvRoleGo">Set</button>
        </div>
        <div class="dev-row">
          <button class="big-btn ghost" id="dvXp">+1000 XP</button>
          <button class="big-btn ghost" id="dvShadow" style="color:#ff6b81">Toggle shadow</button>
        </div>
      </div>

      <div class="dev-panel"><h3>${ICONS.megaphone} Announcement banner</h3>
        <input class="inp" id="dvBanner" placeholder="e.g. Server maintenance in 10 minutes">
        <button class="big-btn" id="dvBannerGo">Broadcast to all tabs</button>
      </div>

      <div class="dev-panel"><h3>${ICONS.timer} Chat overrides</h3>
        <select class="inp" id="dvSlow">
          <option value="auto">Auto adaptive</option>
          ${[1,2,3,4,5,6,7,8,9,10].map(s => `<option value="${s}">Lock: ${s}s</option>`).join("")}
        </select>
        <button class="big-btn" id="dvSlowGo">Apply slow mode</button>
      </div>

      <div class="dev-panel"><h3>${ICONS.gift || ICONS.spark} Limited-time shop</h3>
        <input class="inp" id="dvSName" placeholder="Badge name">
        <input class="inp" id="dvSDesc" placeholder="Description">
        <div class="dev-row"><input class="inp" id="dvSPrice" type="number" placeholder="price" min="1">
        <input class="inp" id="dvSHours" type="number" placeholder="hours" min="1"></div>
        <button class="big-btn" id="dvSGo">Publish limited badge</button>
      </div>

      <div class="dev-panel"><h3>${ICONS.chest.replace('width="46" height="46"','width="15" height="15"')} Chest drops</h3>
        <div class="dev-row"><input class="inp" id="dvCCount" type="number" value="5" min="1" max="20" title="chests">
        <input class="inp" id="dvCCoins" type="number" value="250" min="1" title="coins per chest"></div>
        <input class="inp" id="dvCBadge" placeholder="rare badge name (optional)">
        <input class="inp" id="dvCChance" type="number" value="15" min="0" max="100" title="badge drop %">
        <button class="big-btn" id="dvCLaunch">Launch global loot event</button>
      </div>
    </div>

    <div class="setting-label" style="margin-top:20px">REPORT QUEUE (${reports.filter(r => r.status === "open").length} open)</div>
    <div id="dvReports">${ticketsHtml()}</div>
    <button class="big-btn ghost" data-close style="margin-top:14px">Close</button>
  `, true);

  /* coin injection */
  d.querySelector("#dvGrant").onclick = () => {
    const u = d.querySelector("#dvTarget").value.trim().toLowerCase();
    const amt = parseInt(d.querySelector("#dvAmount").value) || 0;
    const rec = SM.registry()[u];
    if (!rec || amt <= 0) return toast("User not found or bad amount.", true);
    rec.coins += amt; SM.registry()[u] = rec; store.set("users", SM.registry());
    SM.pushNotif(u, `${amt} coins were credited to your account by staff.`);
    toast(`Granted ${amt} coins to @${u}`);
  };
  /* games */
  const listEl = d.querySelector("#dvGList");
  function drawGames(){
    const dev = SM.devGames();
    listEl.innerHTML = dev.length ? dev.map(g => `
      <div class="dev-row" style="align-items:center">
        <span style="flex:1;font-size:12px;font-weight:700">${esc(g.name)}${g.hidden ? " (hidden)" : ""}</span>
        <button class="big-btn ghost" data-hide="${esc(g.id)}" style="padding:5px 10px;font-size:11px">${g.hidden ? "Show" : "Hide"}</button>
      </div>`).join("") : '<div class="modal-sub">No injected games. Permanent games go in games.js on GitHub.</div>';
    listEl.querySelectorAll("[data-hide]").forEach(b => b.onclick = () => {
      const g = SM.devGames().find(x => x.id === b.dataset.hide);
      g.hidden = !g.hidden; SM.setDevGames(SM.devGames());
      drawGames();
    });
  }
  drawGames();
  d.querySelector("#dvGAdd").onclick = () => {
    const name = d.querySelector("#dvGTitle").value.trim();
    const url = d.querySelector("#dvGUrl").value.trim();
    if (!name || !url) return toast("Title and URL required.", true);
    const list = SM.devGames();
    list.push({ id: "dev:" + Date.now(), num: 100 + list.length, name, url,
      icon: d.querySelector("#dvGIcon").value.trim(), isNew: true });
    SM.setDevGames(list); drawGames(); SM.renderHome();
    toast("Game injected (this browser). Add to games.js for everyone.");
  };
  /* gotd */
  const gotdSel = d.querySelector("#dvGotd");
  gotdSel.innerHTML = '<option value="">— choose —</option>' + SM.effGames().map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join("");
  gotdSel.onchange = () => { store.set("gotdForce", gotdSel.value); toast("Game of the Day forced."); SM.renderHome(); };
  d.querySelector("#dvGotdClear").onclick = () => { store.set("gotdForce", ""); gotdSel.value = ""; toast("Rotation reset."); SM.renderHome(); };
  /* user manager */
  d.querySelector("#dvRoleGo").onclick = () => {
    const u = d.querySelector("#dvUser").value.trim().toLowerCase();
    const rec = SM.registry()[u]; if (!rec) return toast("User not found.", true);
    rec.role = d.querySelector("#dvRole").value; SM.registry()[u] = rec; store.set("users", SM.registry());
    toast(`Role updated for @${u}`);
  };
  d.querySelector("#dvXp").onclick = () => {
    const u = d.querySelector("#dvUser").value.trim().toLowerCase();
    const rec = SM.registry()[u]; if (!rec) return toast("User not found.", true);
    rec.chatXp += 1000; SM.registry()[u] = rec; store.set("users", SM.registry());
    toast("+1000 chat XP for @" + u);
  };
  d.querySelector("#dvShadow").onclick = () => {
    const u = d.querySelector("#dvUser").value.trim().toLowerCase();
    const rec = SM.registry()[u]; if (!rec) return toast("User not found.", true);
    rec.shadow = !rec.shadow; SM.registry()[u] = rec; store.set("users", SM.registry());
    toast(`Shadow-ban ${rec.shadow ? "ON" : "OFF"} for @${u} — they can type but no one sees it.`);
  };
  /* banner */
  d.querySelector("#dvBannerGo").onclick = () => {
    const t = d.querySelector("#dvBanner").value.trim();
    store.set("banner", t); SM.showBanner(t);
    if (SM.chatApi) SM.chatApi.broadcastAdmin({ banner: t });
    toast(t ? "Banner broadcast." : "Banner cleared.");
  };
  /* slow override */
  d.querySelector("#dvSlowGo").onclick = () => {
    const v = d.querySelector("#dvSlow").value;
    SM.settings.slowOverride = v; SM.saveSettings();
    if (SM.chatApi) SM.chatApi.broadcastAdmin({ slow: v });
    toast(v === "auto" ? "Slow mode back to auto." : `Slow mode locked at ${v}s`);
  };
  /* limited shop */
  d.querySelector("#dvSGo").onclick = () => {
    const name = d.querySelector("#dvSName").value.trim();
    if (!name) return toast("Badge name required.", true);
    const items = store.get("shopItems", []);
    items.push({ id: "lim:" + Date.now(), type: "badge", name,
      desc: d.querySelector("#dvSDesc").value.trim() || "Limited-time badge",
      price: parseInt(d.querySelector("#dvSPrice").value) || 300,
      icon: "star", iconFill: true,
      expiresAt: Date.now() + (parseInt(d.querySelector("#dvSHours").value) || 24) * 3600e3 });
    store.set("shopItems", items);
    if (SM.chatApi) SM.chatApi.broadcastAdmin({ shop: true });
    toast(`Limited badge "${name}" is live in the shop.`);
  };
  /* chests */
  d.querySelector("#dvCLaunch").onclick = () => {
    const n = Math.min(20, Math.max(1, parseInt(d.querySelector("#dvCCount").value) || 5));
    const coins = Math.max(1, parseInt(d.querySelector("#dvCCoins").value) || 250);
    const badge = d.querySelector("#dvCBadge").value.trim();
    const chance = Math.min(100, Math.max(0, parseInt(d.querySelector("#dvCChance").value) || 0));
    let chests = store.get("chests", []);
    for (let i = 0; i < n; i++){
      chests.push({ id: "c" + Date.now() + i,
        x: 5 + Math.random() * 85, y: 18 + Math.random() * 62,
        loot: badge && Math.random() * 100 < chance ? { badge } : { coins: Math.round(coins * (0.5 + Math.random())) } });
    }
    store.set("chests", chests);
    SM.refreshChests();
    if (SM.chatApi) SM.chatApi.broadcastAdmin({ chests: true });
    toast(`Loot event live: ${n} chests dropped on the site.`);
  };
  /* reports */
  d.querySelectorAll(".ticket").forEach(card => {
    const rid = card.dataset.rid;
    card.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
      actOnReport(rid, b.dataset.act, card.querySelector(".admin-note").value.trim(), card);
    });
  });
}

$("devBtn").onclick = openDev;

/* boot extras: onboarding + dev button visibility */
function bootExtras(){
  const m = SM.me();
  $("devBtn").classList.toggle("hidden", !(m && (m.user === "owner" || m.role === "Owner")));
  if (!m) SM.onboarding();
  else if (m.user === "owner" && !m.role){ SM.saveMe({ role: "Owner" }); $("devBtn").classList.remove("hidden"); }
}
SM.registerView("__devboot", () => {});
const origSwitch = SM.switchView;
SM.boot();
bootExtras();
})();
