# S1b Verification Log — Pronunciation + Structure Sources

**Date:** 2026-06-05
**Purpose:** Evidence for every enriched fact in `src/data.js` (Session S1b). The phonetic **respelling is the source of truth** for pronunciation; structure ratings use the **WSET 3-point low/medium/high** scale, seeded from grape/region norms. Anything that cannot be confirmed at bottle level (a specific wine's residual sugar, oak) is seeded conservatively AND flagged in `data.js` via `structureNote` ("…taste to confirm"), so the tool never asserts an unverified sensory fact (spec §13).

**Method:** web search against pronunciation authorities (Forvo native audio, HowToPronounce, Cambridge, Wikipedia/Wiktionary IPA) and grape-structure references (Wine Folly, Wine-Searcher, VinePair, Coravin, The Grape Grind, Wine Insiders). Producer surnames with no dedicated audio source are respelled by applying the verified language rules (German/Italian/Spanish/Basque/French/Portuguese) for the grape/region in the same name.

---

## Grape / region pronunciation anchors (authoritative)

| Token | Respelling used | Source |
|---|---|---|
| Grüner Veltliner | GROO-ner velt-LEE-ner | [Forvo](https://forvo.com/word/gr%C3%BCner_veltliner/), [HowToPronounce](https://www.howtopronounce.com/gruner-veltliner) |
| Löss (loess) | LURSS | German *ö* ≈ "ur"; per Grüner/German guide above |
| Weissburgunder | VICE-boor-goon-der | [HowToPronounce (German)](https://www.howtopronounce.com/german/wei%C3%9Fburgunder) |
| Riesling | REES-ling | [Cambridge](https://dictionary.cambridge.org/us/pronunciation/english/riesling), [MPW Wine](https://mpwwine.com/how-is-riesling-pronounced-a-quick-guide-to-perfect-pronunciation/) |
| Chenin Blanc | SHEN-in BLAHN | [Forvo](https://forvo.com/word/chenin_blanc/), [HowToPronounce](https://www.howtopronounce.com/chenin-blanc) |
| Nebbiolo | neb-BYOH-loh | [Forvo](https://forvo.com/word/nebbiolo/), [cfood](https://www.cfood.org/37165/how-to-pronounce-nebbiolo-correctly/) (3 syllables, stress 2nd) |
| Langhe | LAHN-geh | [HowToPronounce](https://www.howtopronounce.com/langhe-nebbiolo) |
| Sangiovese | san-joh-VEH-zeh | [HowToPronounce](https://www.howtopronounce.com/sangiovese), [pronounceitright](https://www.pronounceitright.com/pronunciation/sangiovese-4115) |
| Monastrell | moh-nah-STRELL | [Grape Experiences](https://www.grape-experiences.com/2024/01/how-pronounce-spanish-wine-terms-pro/) |
| Garnacha | gar-NAH-chah | [Wikipedia: Grenache](https://en.wikipedia.org/wiki/Grenache) (Sp. [ɡaɾˈnatʃa]) |
| Txakoli / Txakolina | chah-koh-LEE / chah-koh-LEE-nah | [Wine4Food](https://www.wine4food.com/editors-picks/spain-txakoli-wine-easy-drink/) |
| Getariako | geh-tar-ee-AH-koh | [Wine4Food](https://www.wine4food.com/editors-picks/spain-txakoli-wine-easy-drink/) ("Getar-e-ahko") |
| Albariño | ahl-bah-REE-nyoh | [HowToPronounce](https://www.howtopronounce.com/albarino), [Wikipedia](https://en.wikipedia.org/wiki/Albari%C3%B1o) |
| Lambrusco | lahm-BROOS-koh | [pronounceitright](https://www.pronounceitright.com/pronunciation/lambrusco-10903), [Forvo](https://forvo.com/word/lambrusco/) |
| Arinto | ah-REEN-toh | [Forvo](https://forvo.com/word/arinto/), [HowToPronounce](https://www.howtopronounce.com/arinto) |
| Branco | BRAHN-koo | [HowToPronounce/Forvo Arinto guide] (Pt. "white") |
| Montsant | moon-SAHN | [Wikipedia: Montsant DO](https://en.wikipedia.org/wiki/Montsant_DO) (Cat. [munˈsan]) |

---

## Per-wine table (respelling of the NAME + structure + flags)

Structure key: acidity / body / tannin / sweetness. `≈` = seeded from grape/region norm and flagged `structureNote` in data.

| Wine | respell (name) | acidity | body | tannin | sweetness | structureNote |
|---|---|---|---|---|---|---|
| Blue Mountain Brut | BLOO MOWN-tin BROOT | high | medium | low | dry | — (Brut = dry) |
| Fattoria Moretto Semprebon | fah-TOH-ree-ah moh-REH-toh sem-preh-BOHN | high | medium | medium | dry | ≈ Lambrusco sweetness varies (secco→amabile); this Grasparossa style runs dry — taste to confirm |
| Hiedler Löss | HEED-ler LURSS | high | medium | low | dry | — |
| Vini be Good Hip Hop Chenin | VEE-nee beh good hip hop SHEN-in | high | medium | low | dry | ≈ Loire Chenin ranges dry→off-dry — confirm before promising bone-dry |
| Wagner Stempel Weissburgunder | VAHG-ner SHTEM-pel VICE-boor-goon-der | medium | medium | low | dry | — |
| Darting Dürkheimer Fronhof | DAR-ting DEWRK-hy-mer FROHN-hohf | high | medium | low | off-dry | ≈ German Riesling sweetness varies dry↔off-dry — taste; don't oversell sweetness |
| Dona Matilde Branco | DOH-nah ma-TEEL-deh BRAHN-koo | medium | medium | low | dry | — |
| Bodega Cerrón Remordimiento Blanco | boh-DEH-gah seh-RROHN reh-mor-dee-MYEN-toh BLAHN-koh | medium | medium | low | dry | ≈ Oak/texture not confirmed — taste to gauge richness |
| Ameztoi Rubentis | ah-MES-toy roo-BEN-tees | high | low | low | dry | — (Txakoli, slight spritz) |
| Leitz Eins Zwei Dry Rosé | LITES ines tsvy dry roh-ZAY | high | low | low | dry | — |
| Deinhard Deidesheim | DINE-hart DY-des-hime | medium | medium | low | dry | — |
| Ca' del Baio Langhe | kah del BY-oh LAHN-geh | high | medium | high | dry | — (Nebbiolo: neb-BYOH-loh) |
| Sindicat la Figuera | sin-dee-KAHT lah fee-GEH-rah | medium | medium | medium | dry | — (Montsant Garnacha) |
| Bindi Sergardi La Boncia | BEEN-dee ser-GAR-dee lah BOHN-chah | high | medium | medium | dry | — (Sangiovese: san-joh-VEH-zeh) |
| Bodega Cerrón Remordimiento Tinto | boh-DEH-gah seh-RROHN reh-mor-dee-MYEN-toh TEEN-toh | medium | high | high | dry | — (Monastrell full body/high tannin) |
| St. John Claret | saynt jon KLA-ret | medium | medium | medium | dry | — (Bordeaux Merlot/Cab blend) |
| Gallina de Piel Neverwine | gah-YEE-nah deh pyel NEV-er-wine | medium | low | low | off-dry | ≈ Non-alcoholic (0.0%); de-alcoholized wine often reads slightly sweet/lighter — taste to confirm |

---

## Spot-check set (5 pronunciations + 5 structures, with citations)

**Pronunciations**
1. **Grüner Veltliner → GROO-ner velt-LEE-ner** — [Forvo](https://forvo.com/word/gr%C3%BCner_veltliner/), [HowToPronounce](https://www.howtopronounce.com/gruner-veltliner).
2. **Weissburgunder → VICE-boor-goon-der** — [HowToPronounce German](https://www.howtopronounce.com/german/wei%C3%9Fburgunder).
3. **Nebbiolo → neb-BYOH-loh** (3 syllables, stress 2nd) — [Forvo](https://forvo.com/word/nebbiolo/).
4. **Albariño → ahl-bah-REE-nyoh** — [HowToPronounce](https://www.howtopronounce.com/albarino), [Wikipedia](https://en.wikipedia.org/wiki/Albari%C3%B1o).
5. **Txakolina → chah-koh-LEE-nah / Getariako → geh-tar-ee-AH-koh** — [Wine4Food](https://www.wine4food.com/editors-picks/spain-txakoli-wine-easy-drink/).

**Structure ratings**
1. **Grüner Veltliner = high acidity, light–medium body, low/no tannin, dry** — [Wine Folly](https://winefolly.com/grapes/gruner-veltliner/), [Wine Insiders](https://wineinsiders.com/blogs/wine-101-types-of-wines-grapes/gruner-veltliner) ("light body, no tannins, high acidity… most wines bone dry").
2. **Nebbiolo = high tannin + high acidity, medium–full body** — [Wine-Searcher](https://www.wine-searcher.com/grape-316-nebbiolo), [Wine Folly](https://winefolly.com/deep-dive/guide-to-nebbiolo-wine/) ("high acidity and tannin levels, medium to full-bodied").
3. **Sangiovese = high acidity, medium-plus tannin, medium(-full) body** — [Wikipedia](https://en.wikipedia.org/wiki/Sangiovese), [Coravin](https://www.coravin.com/blogs/community/sangiovese-wine-guide) ("medium-plus tannins and high acidity"); mapped to medium tannin on the 3-point scale (conservative).
4. **Monastrell (Mourvèdre) = full body, high tannin, medium(-high) acidity** — [Wine Folly](https://winefolly.com/grapes/monastrell-mourvedre/) ("deeply colored, full-bodied with high tannins, medium to high acidity").
5. **Pinot Blanc = bright/medium acidity, light–medium body, minimal tannin, dry** — [The Grape Grind](https://www.thegrapegrind.com/grapes/all-you-need-to-know-about-pinot-blanc-a-quick-guide/) ("crisp, light-to-medium-bodied with bright acidity and minimal tannins").

---

## Notes on conservative calls

- **Sangiovese tannin** rounded medium-plus → **medium** (3-pt) to avoid overstating grip; acidity (high) is the dominant structural cue and is what the pairing logic leans on.
- **Riesling / Chenin / Lambrusco / NA Albariño sweetness** are the genuine unknowns at bottle level — each carries a `structureNote`; the 4 strict `structure` values stay inside the test's allowed set while the note carries the honesty.
- **Producer surnames** (Hiedler, Ameztoi, Bindi Sergardi, Sindicat, Deinhard, Darting, Wagner Stempel) are respelled by the verified language rules of the grape/region in the same name; the foreign grape/region anchors above are the cited authorities.
