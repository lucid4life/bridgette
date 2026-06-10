# Menu sync — keeping the app honest against the official menus

The training data must match what Bridgette Bar Calgary actually prints. This
loop re-verifies it in ~20 minutes whenever the menu changes (seasonal swaps,
price updates). Nothing is ever auto-applied — step 4 is always a human.

## The loop

```
1. python tools/menu_sync/fetch_menus.py
      finds the CURRENT PDF links on bridgettebar.com (filenames are versioned,
      e.g. BB-FoodMenu-87-0602.pdf) and downloads them to
      source_menus/pdfs/YYYY-MM-DD/  (kept in git for auditability)

2. python tools/menu_sync/parse_menus.py [YYYY-MM-DD]
      column-aware pdfplumber extraction -> source_menus/parsed/YYYY-MM-DD.json
      lines it can't classify land in unparsed[] (eyeball them, don't trust
      silence)

3. node tools/menu_sync/diff_menu.mjs [YYYY-MM-DD]
      compares against src/data.js + src/data-fullmenu.json ->
      docs/menu-sync/YYYY-MM-DD-report.md
      sections: added / removed / renamed / price changes / out-of-scope
      spirits / unparsed

4. Apply the report BY HAND to src/data.js and src/data-fullmenu.json:
      - RENAMED item: KEEP its existing id; add the new spelling to aliases.
      - REMOVED item: delete the record AND every reference to its name
        (wines' pair[], cocktails' pair strings, prose mentions in
        tenSecond/profile/say/objections, and app/src/lib/engine/basics.js).
        migrateProgress drops orphaned card progress safely.
      - NEW item: fresh slug id; author pairing (wine/cocktail/zero + why)
        from structure principles; add it to the relevant wines' pair[] lists.

5. node tools/build_app_data.mjs
   cd app && npm test && npm run check && npm run build && npx playwright test
```

## Notes

- The dessert PDF's spirits-by-the-ounce wall (vodka/gin/whisky…) is
  intentionally out of training scope; cognac/armagnac/calvados ARE in scope
  (the app teaches them as fortifieds/digestifs).
- Soft drinks and add-ons are ignored via IGNORE_MENU in diff_menu.mjs.
- The diff matches on normalized names + aliases (bigram fuzzy >=0.8 = probable
  rename; token containment = clean match, because the print shop shortens
  names like "Boulard XO" for "Boulard XO Calvados").
- Last full sync + applied corrections: docs/menu-sync/2026-06-09-report.md
  (3 food swaps: Brussels Sprouts/Winter Squash/Cod -> Asparagus/Snap
  Peas/Halibut; zero-proof Peroni 0.0/Noughty Rouge/Freixenet added as beer
  records; menu-typo aliases added).
