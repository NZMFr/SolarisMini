# Solaris Mini (v8.0)

Dark moon-lit gaming site with 4 views (Home, Chat, Inbox, Profile) on a floating
bottom pill bar, all-white hand-drawn SVG icons (zero emojis), and an owner-only
developer board. Static site — deploys free on GitHub + Vercel, no server needed.
Social systems (chat, DMs, reports, chests, clans) run on localStorage +
BroadcastChannel, so they work across your tabs for real.

## Views
- **Home** — search, filter chips, Game of the Day (2X XP + coins), Surprise Me shuffle,
  Favorites + Recently Played rows, NEW! badges, playtime tags, #1 crown, playtime leaderboard.
- **Chat** — public feed + private clan "cc" channel, adaptive slow mode (1s idle → 10s flooded,
  or admin-locked), Owner (blue) / Beta Tester (lime) role badges, level badges that evolve
  Bronze → Silver → Gold → Sapphire every 5–10 levels, SVG reactions, GIF picker (optional Tenor key),
  click any user for Friend Request / DM / Profile / Report.
- **Inbox** — Chats, Message Requests (toggleable), Alerts; incognito DMs self-destruct 10s after viewing.
- **Profile** — display name, username, bio, PFP, presence dots (Online/Idle/DND/Offline), Now Playing tag,
  dual leveling (Chat Level + per-game levels), +100 coins per level, streak, cosmetic shop
  (animated PFP frames, neon/shadow/rainbow text looks, limited-time badges, profile themes), clans (5,000 coins).

## Evasion utilities
- **Ghost Mode** — tab title + favicon swap (Google Docs / Drive / Classroom presets)
- **Panic button** — double-tap ESC instantly redirects to your chosen URL
- Player: Fullscreen, PiP (draggable floating window), about:blank launch, Mute (audio suspend)

## Developer Board (owner only)
Register with the username `owner` — the code icon appears in the top bar.
Coin injection, local game injection + hide, Game of the Day forcing, user & role manager
(+1000 XP, shadow-ban toggle), announcement banner broadcast, chat slow-mode lock,
limited-time shop items, global chest loot events, and the live report queue with
Dismiss / Warn / Mute 1h/24h / Shadow-ban / Hard Ban + official reasoning log that
writes to the user's record and their inbox.

## Games — owner only (games.js on GitHub)
```js
gnmath: { games: [
  { num: 1, name: "My Game", icon: "", html: `<h1>game code</h1>`, isNew: true },
]}
```
`num` = order, `html` = saved inside the site, `isNew` = you flip the NEW! badge on/off.
Optional: `url` (link instead of html), `tag` (filter chip). Two libraries: `gnmath` + `lumin`.

## Deploy
GitHub repo → upload all files → Vercel → Add New → Project → Framework: **Other** → Deploy.
Every push to `games.js` auto-redeploys.

## Files
`index.html` · `style.css` · `app.js` (core) · `chat.js` · `social.js` · `admin.js` · `games.js` (your games)

## Notes
- Data is per-browser (localStorage). Clear site data to reset.
- Change the site name: `BRAND` at the top of `app.js`.
