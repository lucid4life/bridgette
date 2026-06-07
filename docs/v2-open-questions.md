# v2 Open Questions — for Adrian's morning review

Facts the overnight build could **not** confidently verify, or that warrant a human/sommelier call. Nothing here was asserted in the app as fact; the safest reversible default was used and is noted. Sourcing detail: [content verification table](research/2026-06-07-v2-content-verification.md).

## Accuracy / content
1. **St. John Claret grapes.** Data says `grape: "Merlot & Cabernet Sauvignon"`. A fact-check flagged that the St. John house claret (Bordeaux AOC, blended with Maison Sichel) is a classic Bordeaux blend that typically also includes **Cabernet Franc** (and sometimes Malbec) and is often **Cabernet-led, not Merlot-led**. **Default kept** ("Merlot & Cabernet Sauvignon" — a fair beginner shorthand). *Decide:* leave as-is, or change to "Bordeaux blend (Cab-led: Cabernet Sauvignon, Merlot, Cabernet Franc)"? Changing it alters the Wine-Identity card answer (not the card id).

2. **Vegan — Blue Mountain Brut & Bindi Sergardi La Boncia.** Both have *sourced evidence of NOT being vegan* (Barnivore: Blue Mountain fines with **casein/bentonite**; Bindi estate sometimes uses **egg-white** fining). Per spec §12 we set `vegan: null` (unconfirmed) rather than `false`, and added a `veganNote` flagging the likely-not-vegan status so the "confirm with the team" rule kicks in. *Decide:* are you comfortable with `null` + note, or do you want explicit `vegan: false` for these two (would need the data contract + TS type to allow `false`)?

3. **Vegan — likely-vegan-but-uncertified.** Deinhard Deidesheim (importers say no fining/filtering), Bodega Cerrón Blanco & Tinto (retailer/distributor claims of vegan certification), Ameztoi (one retailer). All left `vegan: null` (unconfirmed at producer level). *Decide:* if you can confirm any with the rep/distributor, bump to `vegan: true`.

4. **Climate — medium confidence (used as-is, tentative):** Blue Mountain Brut (`cool` — Okanagan daytime heat is high but cool nights retain the acidity that defines the Brut), Fattoria Moretto (`warm` — sits on the moderate/warm line), Bindi Sergardi (`warm` — Chianti is Mediterranean but altitude moderates). All others are high-confidence.

5. **Gallina de Piel Neverwine origin.** Region left as the safe general "Spain". Albariño's structural home is cool-maritime Rías Baixas/Galicia (basis for `climate: cool`), but the producer doesn't tie this de-alcoholized cuvée to a specific DO and some retailers list Catalonia (the company HQ). *Decide:* keep "Spain", or set "Rías Baixas / Galicia" if you can confirm the base-wine origin.

6. **Optional appellation precision (not changed):** Fattoria Moretto could be "Lambrusco Grasparossa di Castelvetro DOC"; Hiedler's source subregion is Kamptal (bottled at Niederösterreich level). Left at the broader region for beginner simplicity.

## Notes (no action needed unless you disagree)
- **Family edge cases:** the sparkling Lambrusco (Fattoria Moretto) is bucketed under **"Bubbles & Rosé"** (served chilled, sparkling); the 0.0% Neverwine is under **"Bright & Crisp Whites"** as a white-style pour. Reasonable alternatives exist (e.g., a "Sparkling Reds" micro-family) but 5 buckets was the spec target.
- **Lambrusco** is kept framed "dry-ish, taste to confirm" (already in `structureNote`) — no hardening to "dry".
- **Wagner-Stempel** hyphen fix was synced across every reference (wine name, 2 translator rows, 4 food pairings) and integrity-checked so no card answer is orphaned.
- **Wagner-Stempel climate** corrected `moderate` → `cool` (ACC-01, 2026-06-07): Siefersheim is a cool porphyry site (GWC/VDP/Metrovino).

## Phase B full-menu sourcing — open questions (2026-06-07)

These came out of the full-menu web-sourcing pass (38 bottles + 17 beers + 25 fortifieds + 10 translator asks now in the app). Full per-field sources are in `docs/research/2026-06-07-v2-content-sourced.json`; the human review with every flag is `docs/research/2026-06-07-v2-content-sourcing-summary.md`. **80 records are high-confidence and integrated; the items below are the ones a server should confirm with the team / not over-assert.**

### Resolved at integration (FYI)
- **Buisson-Charles Meursault** `structure.body: "full"` was outside the house low/med/high scale → mapped to **high**. WSET "light" was mapped to **low** on Landron Muscadet, Senat Amalgame, Malahierba, Domaine de Colette — confirm the team is OK treating "light" as low.
- **3 duplicate dessert/digestif records** (Pouderoux Maury, Barbeito Madeira, Valdespino Cream Isabela) de-duped to one each. **Tawny Port** dropped (low confidence — no producer/age named on the menu; identify the actual house tawny before teaching specifics).

### Climate calls that are judgment, not fact (don't over-assert)
- **Cirelli Frizzante** warm-vs-moderate; **Texier Brézème** kept moderate but drinks cool; **Clos Bellane Valréas** moderate (net of warm S. Rhône + 400 m); **Rochette Mâcon-Bussières** moderate but a somm could argue warm; **Raventós de Nit** moderate, summers arguably warm. None should be asserted as the *other* value.

### Contested structure (taste to confirm)
- **Gulfi Nerojbleo** (body high-vs-medium AND acidity medium-vs-medium-high), **Castello di Potentino Sacromonte** (no published grid; 2018 mature), **Malahierba Maleza** (obscure Rufete, structure from varietal refs), **Gasnier Chinon** (acidity medium on this riper cuvée) — all `medium` confidence.

### Menu print vs verified spelling/blend (say the verified one if asked)
- Spelling: menu "Algre Valgañon" → **Alegre Valgañón**; "Merusault" → **Meursault**; "Cusomano/Cataratto" → **Cusumano/Catarratto**; "Quevado" → **Quevedo**; "Henessey" → **Hennessy**; Montifaud **"XS"** is not a real cognac tier (confirm it's the VS); Raventós "Anioa" → **Anoia**; digestif "Vendage"→Vendange, "Maderia"→Madeira.
- Blend reality the menu simplifies: **Raventós de Nit** is Xarel·lo-dominant (~49/34/9/7), NOT Monastrell, and left Cava DO in 2012 (it's *not* Cava); **Senat Amalgame** is Grenache + Piquepoul/Counoise/Terret (not "3 Grenaches"); **Terroir Sense Fronteres** is now 100% Grenache; **Aia Vecchia Sor Ugo** menu omits the 8% Petit Verdot; **Whitehall Lane** is ~82% Merlot (+ small Cab/Malbec/PV/Cab Franc); **Maloof PJs** is an orange-wine ~80/20 Pinot Gris/Riesling.

### ABV / sweetness — don't quote a hard number, confirm on the bottle
- **Pouderoux Maury Vendange** ABV unresolved (14% vs 15.5–16.5%); **Stella Artois** 4.6% menu vs ~4.8% CA; **Dandy The Julia** 5.0% vs 5.5%; **Uncommon Tropical Cider** 6.0% vs 6.8% (and it's a CIDER, gluten-free); **Michelob Ultra** 4.0% vs 4.2% (355 ml can); **Superflux Happyness** 6.5% vs 7% (reclassed West Coast IPA). Several "beers" are not what the menu says: **Ol' Beautiful** is a rice ALE (not lager), **Uncommon** is cider, **Fallentimber Honey Buck** is a sparkling MEAD.

### The "sweet / plush red" case (handle, don't fake)
- The cellar pours **no sweetened reds**. Meiomi (~19–20 g/L) and Apothic (~16 g/L) are deliberately sweetened. The translator row sets expectations honestly and steers to the smoothest *dry* reds (St. John Claret / Cerrón Tinto) — it is logged as a deliberate "no true match," not an equivalence.

### Source data to locate
- `source_menus/calgary-dessert-digestifs.txt` **does exist at the repo root** (the Phase B agents ran with cwd=`app/` and couldn't see it); re-verify dessert-pour spellings against it on the next content pass.

### Vegan deferrals (menu 'v' only → otherwise null)
- `vegan: null` (no menu 'v') on the new bottles: Pierre Thibert, Brandini, Castello di Potentino, Texier, Château Larose Perganson, Whitehall Lane, White Rock, Claire Naudin, Clos Bellane, Rochette, Buisson-Charles, Mount Eden, Eleonore Moreau. Tell a vegan guest you'll check — never assert vegan without the 'v'.
