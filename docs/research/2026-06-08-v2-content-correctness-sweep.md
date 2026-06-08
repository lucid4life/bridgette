# Bridgette Menu Data — Correctness Sweep (fix-list)

**Date:** 2026-06-08
**Method:** 7-agent read-only verification of the whole dataset (`app/src/lib/data/data.js`, `app/static/fullmenu.json`) against the printed `source_menus/*.txt` and producer/retailer web sources. Agents reported only; no data was edited. (The workflow's auto-synthesis step hit the account session limit, so this consolidation was written by hand from the agents' raw findings; nothing here is lost.)

**Headline:** the data is **mostly clean** — most records verified correct. But there are a handful of **server-facing errors a beginner would parrot to a guest**, including one guest-safety issue. Fix the critical + high items in Phase 0; route the "confirm with team" items to the sommelier.

---

## 🔴 CRITICAL — guest safety (fix immediately)

| Record | Field | From | To | Source |
|---|---|---|---|---|
| French Fries | `zero` | "Freixenet Sparkling Wine or Ol' Beautiful Okami Kasu Japanese Lager" | "Freixenet Sparkling Wine or Peroni Pilsner 0.0" | calgary-drink.txt L155-156 (Ol' Beautiful = 5.0% beer) vs L204-205 (Peroni 0.0%) |

The only full-strength alcoholic item leaking into any `zero` (non-alcoholic) field. **Add a build-time assertion** that every `foods[].zero` value resolves only to the verified N/A list below, so this can never recur.

**Verified real non-alcoholic list** (the only values `foods[].zero` may use):
- **True 0.0%:** Gallina de Piel Neverwine (0.0%), Peroni Pilsner 0.0 (0.0%), Redbull, Pop
- **<0.5%, menu-sold as "no alcohol":** Lovers Mountain (0.04%), Short Film (Caleño 0.5% / Floreale 0.0%), Sunrise Spritz (0.05%), Noughty Rouge (0.5%), Freixenet Sparkling Wine (0.05%)

---

## 🟠 HIGH

| Record | Field | Issue → Fix | Source |
|---|---|---|---|
| Translator "Moscato / sweet white" | `bottleOptions` | "Tawny Port" is a dropped/nonexistent product → **"Quevedo Tawny 10yr"** (real menu pour) | dessert-digestifs.txt L107-110; open-questions §30 |
| Fattoria Moretto Semprebon | `sweetness` / objection / say | Labeled **dry**, but the "Semprebon" cuvée is the **Amabile (off-dry/semi-sweet)**; the dry one is the separate "Canova" → set sweetness **off-dry**, rewrite "runs dry" → "gently off-dry, fruity — taste to confirm" *(or confirm which cuvée is actually poured)* | fattoriamoretto.it; Kenaston (CA importer); Vivino |
| Senat Amalgame | `grape` | "Grenache Noir, Grenache Blanc & Grenache Gris" is wrong → **field blend: Grenache Noir/Gris + Piquepoul, Counoise, Terret** | blog.lescaves.co.uk; epi-curieux.com |
| Raventós de Nit Rosé | `grape` | "Monastrell" is wrong → **Xarel·lo, Macabeu, Parellada & Monastrell** (Xarel·lo-dominant) | raventos.com |
| Uncommon Tropical Cider | `abv` | 6.0% → **6.8%** | albertabeerexchange.ca |
| Dandy The Julia | `abv` | 5.0% → **5.5%** | Untappd / BeerAdvocate |
| Fallentimber Honey Buck | (missing) | **Not in the data at all** but on the menu → add as **sparkling MEAD, 5.0%, gluten-free, Water Valley AB** (not a beer) | fallentimbermeadery.ca; calgary-drink.txt L183-184 |
| Wagyu Beef Carpaccio | `wine` + `why` | Paired with Ca' del Baio **Nebbiolo** but the why calls it "light-tannin" — Nebbiolo is **high-tannin**; teaches a false fact → swap to **Deinhard Deidesheim (Pinot)** or rewrite the why *(confirm with team)* | data.js cross-check |

---

## 🟡 MEDIUM

| Record | Field | Issue → Fix | Source |
|---|---|---|---|
| St. John Claret | `grape` | "Merlot & Cabernet Sauvignon" implies Merlot-led; it's **Cab-led** (49% Cab Sauv / 43% Merlot / 6% Cab Franc / 2% Malbec) → "Cabernet Sauvignon & Merlot" (or full Bordeaux blend) | nourishedcommunities.com (Maison Sichel) |
| Bindi Sergardi La Boncia | `region` | Producer page says **Chianti DOCG**, data + menu say **Chianti Classico** (legally distinct) → **confirm against the physical bottle** (Adrian previously re-verified Classico — documented disagreement) | bindisergardi.it; Wine Enthusiast |
| Gulfi Nerojbleo | `region` | "Sicilia DOC" → **Terre Siciliane IGT** | superiore.de |
| Michelob Ultra | `abv` | 4.0% → **4.2%** (printed menu also wrong — flag whether to match menu or reality) | michelobultra.com |
| Reference pairing matrix | route render | `slice(0,40)` over 42 dishes silently drops **Chocolate Pot de Crème** + **Matinee Snack Menu** → render all rows | reference/+page.svelte L57 |
| Food→cocktail "why" (systemic) | `why` | Each food's why is wine logic; the **cocktail pick is never justified** (sometimes contradicts) → author a cocktail-why lever per row *(this is also a Phase-1 content task)* | data.js foods |

---

## ⚪ LOW / disclosure / spelling

- **Low-alc disclosure:** Noughty Rouge (0.5%), Lovers Mountain (0.04%), Sunrise Spritz (0.05%), Freixenet (0.05%) are **not literally 0.0%** — server copy should say "de-alcoholized / under 0.5%", and reserve "true 0.0%" for Neverwine / Peroni 0.0 / Redbull / Pop. Consider tagging each `zero` pick TRUE-0.0 vs <0.5%. (Lovers Mountain is milk-washed → dairy note must travel with it.)
- Translator "Prosecco / Champagne" `bottleOptions`: remove **"Fattoria Moretto Lambrusco"** (a by-the-glass sparkling *red*, not a bubbly bottle upgrade).
- `wines[].pair`: "Oysters" → **"Oysters 1/2 dozen"** on Blue Mountain Brut, Darting Dürkheimer, Ameztoi, Neverwine (display consistency).
- Darting Dürkheimer Fronhof `sweetness`: off-dry → **"dry to off-dry (taste to confirm)"** (Fronhof is Kabinett Trocken; Feuerberg is the halbtrocken).
- Ol' Beautiful `style`: "lager" → **"Japanese-style rice ale"** (keep menu-printed name).
- Dessert spellings: Pouderoux "Vendage" → **"Vendange"** (+ "Maury"); ABV ~**14%** (16.5% is the separate Mise Tardive). Add menu-typo aliases (Maderia, Vendage, Henessey, Quevado, Montifaud XS) so printed-menu spellings still resolve in search.

---

## ✅ Confirm with the team / sommelier (only a human can settle)
1. **Bindi La Boncia** — Chianti **Classico** vs **DOCG** (check the physical bottle).
2. **Fattoria Moretto** — which cuvée is poured: Semprebon (amabile) vs Canova (secco)?
3. **Wagyu carpaccio** — swap the Nebbiolo for a Pinot, or keep + rewrite the why?
4. **Stella Artois** ABV 4.6 vs 4.8 (the can/keg stocked); **Michelob** 4.0 (menu) vs 4.2 (real) — print which?
5. **St. John Claret** grape — show the Cab-led reality or the menu shorthand?

*Most records verified CORRECT and need no change (13/17 glass wines, 23/25 digestifs, the bulk of bottles/beers, all vegan/climate notes checked).*
