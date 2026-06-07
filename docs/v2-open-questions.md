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
