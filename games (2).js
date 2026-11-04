/* ============================================================
   SOLARIS MINI — game library (OWNER ONLY — edit on GitHub)
   ------------------------------------------------------------
   Games are added ONLY by editing this file on GitHub.

   Each game:
     num   -> order number (cards sort 1,2,3...)
     name  -> card title
     icon  -> image URL, "" = auto letter tile
     html  -> game code, saved inside the site (backticks).
              Escape any backtick in your code as \`
     url   -> optional, embed a link instead of html
     isNew -> true/false, you control the NEW! badge manually
     tag   -> optional filter chip
   Two libraries (the Settings tabs):
     gnmath -> "more known library"
     lumin  -> "bigger game library"
   ============================================================ */

const GAME_LIBRARY = {
  gnmath: {
    label: "gnmath",
    games: [
      // { num: 1, name: "My Game", icon: "", html: `<h1>hi</h1>`, isNew: true },
    ]
  },
  lumin: {
    label: "Lumin",
    games: [
      // { num: 1, name: "My Game", icon: "", url: "https://example.com", isNew: false, tag: "Puzzle" },
    ]
  }
};
