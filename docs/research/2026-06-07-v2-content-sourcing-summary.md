# Bridgette v2 — Content Sourcing Summary (2026-06-07)

Human review doc for the full-menu content-sourcing pass. Structured data lives in
[`2026-06-07-v2-content-sourced.json`](./2026-06-07-v2-content-sourced.json) (fields already
parsed out of `fieldsJson` into real nested objects, grouped by `kind`).

**Counts:** 38 bottles · 17 beers · 29 fortifieds (incl. 3 deliberate dessert/digestif duplicates + 1 mead) · 10 translator rows = **94 records.**
**Confidence:** 80 `high` (10 clean / 70 high-but-flagged) · 13 `medium` · 1 `low`.

ACCURACY NOTE: every record carries `flags[]` and per-field `sources[]`. "high" means the core
facts (grape, region, structure, spelling) are web-verified; many high records still carry a
*minor* flag (vintage-on-label, dosage nuance, menu typo) that should be skimmed before serving.

---

## Cohort tables (item | confidence | key flags)

### Bubbly bottles
| Item | Conf | Key flags |
|---|---|---|
| Raventós i Blanc de Nit Rosé | high | Menu grape 'Monastrell' but really Xarel·lo-dominant; NOT Cava (left DO 2012); menu typo Anioa→Anoia; Extra Brut |
| Cirelli Frizzante Bianco | medium | Method corrected to ancestral/pét-nat (NOT charmat); climate warm vs moderate debate |
| Griesel Blanc de Noirs | high | Cool-but-mild Bergstraße; 2021 confirmed; vegan per menu 'v' |
| Christophe Mignon ADN de Meunier Brut Nature | high | Zero-dosage, austere; medium body for Champagne; NV base varies |

### Light & medium red bottles
| Item | Conf | Key flags |
|---|---|---|
| Terroir Sense Fronteres Negre de Montsant | high | 100% Grenache now vs older Garnacha/Cariñena blend; warm climate / cool style |
| Charlotte & Jean Baptiste Senat Amalgame | medium | Blend correction — not 3 Grenaches (Piquepoul/Counoise/Terret); body mapped 'low' |
| Malahierba Vinos Maleza | medium | Obscure Rufete, structure from varietal refs not this bottle; altitude-driven 'cool' |
| Alta Mora Etna Rosso | high | 'Cool by altitude' on Etna; tannin 'medium' (firmer than Pinot) |
| Pierre Thibert Chorey-les-Beaune | high | vegan null (no 'v'); small domaine, appellation well-sourced |
| Sandrine & Fabrice Gasnier Chinon Pierres Chaudes | high | Name transposed on menu (corrected); acidity 'medium' on this riper cuvée |
| Domaine de Colette Coteaux de Colette | high | Beaujolais-Villages from Morgon/Régnié old vines; body 'low' |
| Castello di Verduno Alba | high | = Barbera d'Alba (not Basadone Pelaverga) |

### Structured red bottles
| Item | Conf | Key flags |
|---|---|---|
| Brandini Langhe Filari Corti | high | family 'Structured' vs upgradeFrom 'Light reds' lane tension; vegan null |
| Kistler | high | RRV fog-driven 'moderate'; body may read fuller than lean Burgundy |
| Castello di Potentino Sacromonte | medium | IGT Toscana not a named DOC ('montecucco' alias approximate); no WSET grid; 2018 maturity |
| Fletcher Barbaresco Recta Pete | high | respell 'Pete'→PEH-teh (approx); cru-name error in original note (no field impact) |
| Texier Brézème | high | Leans 'cool'; Éric vs Martin Texier bottling ambiguity; vegan null |
| Algre Valgañón | high | Spelling: menu 'Algre Valgañon' → 'Alegre Valgañón'; cold high-altitude Fonzaleche |
| Gulfi Nerojbleo | medium | Body (high vs medium-full) AND acidity (medium vs medium-high) both contested; respell approx |
| Domaine Gour de Chaulé Gigondas Les Jardinières | high | 80/10/10 GSM; pronounce final 's' |
| Château Larose Perganson | high | 50/50 Cab/Merlot 2018; pyrazine note; vegan null |
| Whitehall Lane | high | Merlot-dominant (~82%); body 'high' upper-end; vegan null; Napa-Merlot translator answer |
| Aia Vecchia Sor Ugo Bolgheri Superiore | high | 57/23/12/8 blend (menu omits Petit Verdot); 2022 softer vintage |
| White Rock | high | Estate Napa Cab, not Stags Leap District AVA; vegan null; Napa-Cab translator answer |

### Crisp white bottles
| Item | Conf | Key flags |
|---|---|---|
| Denizot Sancerre | high | No cuvée name on menu; regional/estate-typical note |
| Ciro Picariello Bru Emm | high | Inland 400m → 'moderate' not warm; IGP/DOP tier varies |
| Donnhoff Feinherb | high | off-dry 'feinherb'; respell Dönnhoff approx ('DUHN-hohf' closer) |
| Landron Muscadet-Sèvre et Maine Amphibolite | high | body corrected 'light'→'low' for house vocab |
| Claire Naudin Mallon | medium | 'Mallon' = artist-label Aligoté cuvée; vegan null; appellation framing editorial |
| Bideona Cabezadas | high | ~95% Viura blend; vine-age discrepancy (35 vs 70-80 yr); 'moderate' not warm |
| Cusumano Lucido | high | Menu typos Cusomano/Cataratto → Cusumano/Catarratto; DOC vs IGT varies |

### Textured/round white bottles
| Item | Conf | Key flags |
|---|---|---|
| Domaine Breton Pierres Rousses | high | Vouvray AOC (menu says Loire only); dropped <2 g/L RS claim; family judgment call |
| Maloof Where Ya Pjs At? | medium | Orange wine; blend ~80/20 PG/Riesling + odds-and-ends; tannin 'low' = light grip |
| Clos Bellane Valréas | high | Climate 'moderate' judgment call (400m tempers warm S. Rhône); vegan null |
| Domaine de la Rochette Mâcon-Bussières Mont Sard | medium | Mâconnais = warmest Burgundy ('moderate' could read 'warm'); cask 228L not 359L; 2022 notes for 2023 |
| Domaine Buisson-Charles Meursault Vieilles Vignes | high | Menu typo Merusault→Meursault; **body:'full' is outside 3-point vocab** (see delta); vegan null |
| Mount Eden Wolff Vineyard | high | Coolest CA AVA; full malo yet 'high' acid; oak ~8 mo; vegan null |
| Eleonore Moreau Petit Chablis | high | Filed 'Bright & Crisp' (unoaked steely); trimmed 12-18mo lees figure; vegan null |

### Beers
| Item | Conf | Key flags |
|---|---|---|
| Ol' Beautiful Okami Kasu Japanese Lager | high | Technically an ALE/rice ale, not lager (label says so) |
| Stella Artois | high | Menu 4.6% kept; Canada often cited ~4.8% — don't assert as universal |
| Banded Peak Mount Crushmore Pilsner | high | — |
| Banded Peak Approach Amber Lager | high | — |
| Village Wit | high | — |
| Brewsmith Signature Pub Ale | high | — |
| Establishment Afternoon Delight NEPA | high | — |
| 33 Acres Ocean Pale Ale | high | Menu shortens name ('33 Acres of Ocean') |
| Superflux Happyness IPA | medium | Style corrected: West Coast IPA w/ NEIPA character (not true hazy); ABV 6.5 vs 7% |
| Banded Peak Microburst Hazy IPA | high | 55 IBU — not 'low bitterness' |
| Four Winds Nectarous Dry-Hopped Sour | high | — |
| Dandy The Julia Peach Cobbler Sour | high | ABV menu 5.0% vs authoritative 5.5% |
| Polyrhythm Matinee Lemon Cream Tart Ale | high | — |
| Born Arm Candy Milk Stout | high | — |
| Uncommon Tropical Cider | high | CIDER not beer; gluten-free; ABV menu 6.0% vs cidery 6.8%; dropped off-dry claim |
| Chimay Blue | high | 9% strong sipper; 10oz pour |
| Michelob Ultra | high | 355ml (not draught oz); US 4.2% vs menu 4.0% |

### Fortifieds — dessert pours
| Item | Conf | Key flags |
|---|---|---|
| Valdespino Cream Sherry "Isabela" | high | source_menus file absent — name from data.js food entry; ~75/25 & ~120 g/L approximate |
| Barbeito Madeira Rainwater Reserva 5yr | high | Producer labels 'Reserve' vs menu 'Reserva'; 80/20 Tinta Negra/Verdelho |
| Domaine Pouderoux Maury Vendange (dessert) | medium | Menu typo 'Vendage'; 'Mise Tardive' is a SEPARATE cuvée; ABV ~15-16% unresolved |
| Tawny Port | **low** | No producer/age named anywhere — ALL facts style-level placeholders |
| Fallentimber Honey Buck | high | On beer list but is a sparkling MEAD; gluten-free |

### Fortifieds — digestifs (sherry / port / amaro / cognac / calvados / armagnac / grappa)
| Item | Conf | Key flags |
|---|---|---|
| Domaine Pouderoux Maury Vendange (digestif) | medium | DUPLICATE of dessert record; ABV conflict 14% vs 15.5-16.5%; menu 'Vendage' |
| Barbeito Madeira Rainwater Reserva 5yr (digestif) | high | DUPLICATE; menu 'Maderia'→Madeira; 80/20 blend |
| Valdespino Cream Sherry Isabela (digestif) | high | DUPLICATE; 'less sweet than typical' caveat; Pale-Cream mislabel risk |
| Emilio Hidalgo Fino | high | Bone-dry aperitif-style (not sweet); pairs to olives/cashews/oysters |
| Valdespino Single Vineyard Amontillado Tio Diego | high | ABV corrected 18.5%→18%; ~18 yr avg; dry not sweet |
| Emilio Hidalgo Oloroso Gobernador | high | Dry oloroso (~3 g/L) — not a sweet cream |
| Kopke Late Bottled Vintage Port 2015 | high | 20% confirmed; unfiltered (sediment); Bread & Butter pairing weak |
| Quevedo Tawny 10yr | high | Menu typo 'Quevado'→Quevedo |
| Taylor Fladgate Tawny 40yr | high | Fully confirmed |
| Boulard XO Calvados | high | Now branded 'Boulard Auguste XO' (same wine) |
| Christian Drouin XO Calvados | high | ABV corrected 42%→40%; aging 'min 6 yrs' |
| Castarède XO Armagnac | high | Min ~20 yr; doubles as Apple Tatin ingredient match |
| Darroze 12yr Armagnac | high | 43% (higher proof) |
| Hennessy VS / VSOP / XO Cognac | high (×3) | Menu typo 'Henessey'→Hennessy; XO min 10 yr (2018 rule) |
| Château de Montifaud VS Cognac | medium | Menu 'XS' is not a real tier (likely VS typo); VS aging ~4-5 yr; ABV inferred 40% |
| Château de Montifaud VSOP Cognac | high | Best-seller, ~8-10 yr |
| Château de Montifaud XO Cognac | high | ~30 yr; ABV inferred 40% (confirm) |
| Marolo Milla Camomilla | high | Chamomile grappa LIQUEUR (off-dry); base = Nebbiolo pomace |
| Fernet Branca | high | 27 herbs; named botanicals trimmed to aloe/rhubarb/saffron |
| Averna | high | 29% (was 32%); 1868; Doctor Jones cocktail amaro |
| Amaro Montenegro | high | Year corrected 1895→1885; Spaghetti Western cocktail amaro |
| Nonino | high | Grape-distillate base (not neutral spirit); 35% |

### Translator rows
| Item | Conf | Key flags |
|---|---|---|
| Gamay / Beaujolais | high | Glass = Pfalz Pinot (lane, not grape); true Gamay bottle-only |
| Viognier / white Rhône | high | No Viognier by glass; bottle is a Marsanne-Viognier-Roussanne blend; Valréas accent |
| Gewürztraminer / aromatic white | high | No Gewürz; Riesling stand-in (higher acid, no lychee/rose) |
| Albariño | high | Only Albariño is the 0.0% Neverwine; Doña Matilde grapes named/corrected |
| Barolo / Barbaresco | high | Strongest record — all Nebbiolo, empty flags |
| Cava | high | Raventós left Cava DO 2012; menu grape 'Monastrell' misleading; Anioa→Anoia |
| Sweet / plush red (Meiomi/Apothic/19 Crimes) | high | **Expectation-setting case — cellar has NO sweetened reds** |
| Beaujolais Nouveau / light juicy red | high | No carbonic wine by glass; Alta Mora is Nerello (same shape, not Gamay) |
| Sancerre | high | Glass = Grüner (same lane); exact grape bottle-only (Denizot) |
| Vermentino / coastal Italian white | medium | No Vermentino; stand-ins are Catarratto/Falanghina; menu typos Cusomano/Cataratto |

---

## OPEN QUESTIONS DELTA — must go into `docs/v2-open-questions.md` before asserting

Every item below is either `low`/`medium` confidence OR a `high` record carrying a flag that
changes what a server should *say* or that an integrator must resolve against the schema.

### A. Schema/vocab blockers (fix before integration)
1. **Buisson-Charles Meursault — `structure.body` is `"full"`**, which is outside the house
   `low | medium | high` vocabulary. Decide the mapping (recommend `high`) before importing, or
   the structure widget may break.
2. **Body-word mappings already applied** (`light`→`low`) on Landron Muscadet, Senat Amalgame,
   Malahierba, Domaine de Colette — confirm the house team is happy treating WSET "light" as `low`.

### B. Climate calls that are judgment, not fact (log the reasoning)
3. **Cirelli Frizzante** — `warm` vs `moderate` (Adriatic/Apennine cooling drives the acidity).
4. **Brézème (Texier)** — kept `moderate` but the wine drinks `cool`; defensible either way.
5. **Clos Bellane Valréas** — `moderate` is the *net* of warm S. Rhône + 400m limestone; explicit judgment call.
6. **Rochette Mâcon-Bussières Mont Sard** — `moderate` is soft; Mâconnais is the warmest part of Burgundy and a somm could argue `warm`. Do NOT assert `cool`.
7. **Raventós de Nit** — sea-moderated Mediterranean; `moderate` kept, summers arguably `warm`.

### C. Structure guesses without a WSET grid / contested (taste to confirm)
8. **Gulfi Nerojbleo** — body (`high` vs medium-full) AND acidity (`medium` vs medium-high) both contested; kept `medium` confidence.
9. **Castello di Potentino Sacromonte** — structure inferred from descriptors; no published grid; 2018 is mature.
10. **Malahierba Maleza (Rufete)** — obscure grape; structure from varietal references, not this bottle.
11. **Gasnier Chinon Pierres Chaudes** — acidity `medium` on this riper cuvée; a leaner Chinon reads higher-acid.

### D. Spelling / name doubts (menu prints vs verified gazetteer)
12. **Alegre Valgañón** — menu prints 'Algre Valgañon' (missing 'e' + tilde). Name field keeps menu form; everything else uses correct 'Alegre Valgañón'.
13. **Gasnier Chinon** — menu transposes words ('Chinon Gasnier'); corrected to 'Gasnier … Les Pierres Chaudes'.
14. **Meursault** — menu typo 'Merusault'.
15. **Cusumano / Catarratto** — menu typos 'Cusomano' / 'Cataratto' (also surfaces in the Vermentino translator).
16. **Raventós appellation** — menu 'Conca del Riu Anioa' → 'Anoia'.
17. **Digestif menu typos** — 'Vendage'→Vendange, 'Maderia'→Madeira, 'Quevado'→Quevedo, 'Henessey'→Hennessy, Montifaud **'XS'** (not a real cognac tier — confirm it is the VS).

### E. Grape/blend labelling (menu simplification vs real blend)
18. **Raventós de Nit** — menu 'Monastrell' only; really Xarel·lo-dominant (~49/34/9/7). Staff should know the real blend if asked (also in the Cava translator).
19. **Senat Amalgame** — menu '3 Grenaches'; really Grenache Noir/Gris + Piquepoul/Counoise/Terret.
20. **Terroir Sense Fronteres** — 100% Grenache (current) vs older 75/25 Garnacha/Cariñena.
21. **Aia Vecchia Sor Ugo** — menu omits the 8% Petit Verdot.
22. **Whitehall Lane** — menu 'Merlot'; really ~82% Merlot with small Cab/Malbec/PV/Cab Franc.
23. **Maloof PJs** — orange-wine blend ~80/20 Pinot Gris/Riesling + minor odds-and-ends.
24. **Doña Matilde Branco** (Albariño + Vermentino translators) — named Douro grapes Arinto/Rabigato/Viosinho/Gouveio, not a generic 'blend'.

### F. ABV / sweetness uncertainties (confirm on the bottle; don't quote a hard number)
25. **Pouderoux Maury Vendange** (BOTH dessert + digestif records) — ABV unresolved: 14% (WoodWinters) vs 15.5-16.5% (norm/Mise Tardive). Residual sugar unpublished.
26. **Stella Artois** — 4.6% (menu) vs ~4.8% Canadian elsewhere.
27. **Dandy The Julia** — 5.0% (menu) vs 5.5% (authoritative).
28. **Uncommon Tropical Cider** — 6.0% (menu) vs 6.8% (cidery); sweetness level unverified (off-dry claim dropped).
29. **Michelob Ultra** — 4.0% (menu) vs 4.2% (US).
30. **Superflux Happyness** — 6.5% (menu) vs 7% (some retailers); style reclassified to West Coast IPA.

### G. The sweet-red expectation case (handle, don't fake a match)
31. **"Sweet / plush red" translator** — the cellar pours **no sweetened reds**. Meiomi (~19-20 g/L)
    and Apothic (~16 g/L) carry deliberate residual sugar; the honest play is to set expectations
    and steer to the smoothest *dry* reds (St. John Claret, Cerrón Tinto). This row must be logged
    as a deliberate "no true match" answer, not an equivalence.

### H. Missing/placeholder source data
32. **Tawny Port (`low`)** — no producer/age statement anywhere in the menu data; every fact is
    style-level placeholder. Identify the actual house tawny (10yr vs Reserve, producer) before
    teaching any specifics.
33. **`source_menus/calgary-dessert-digestifs.txt` is ABSENT from the repo.** All dessert/digestif
    names were taken from `app/src/lib/data/data.js` `foods[].wine` and `translator[].bottleOptions`.
    Locate or recreate that menu file to verify dessert-pour spellings against the printed list.

### I. Vegan deferrals (menu 'v' drives the flag; otherwise null)
34. `vegan: null` (no menu 'v') on: Pierre Thibert, Brandini, Castello di Potentino, Texier,
    Château Larose Perganson, Whitehall Lane, White Rock, Claire Naudin Mallon, Clos Bellane,
    Rochette Mont Sard, Buisson-Charles Meursault, Mount Eden, Eleonore Moreau. Tell a vegan guest
    you'll check; never assert vegan without the 'v' mark.

### J. Duplicate records to reconcile at integration
35. **Pouderoux Maury, Barbeito Madeira Rainwater, Valdespino Cream Isabela** each appear TWICE
    (dessert cohort + digestif cohort verification passes). Integrate ONE canonical entry per wine;
    both passes reach the same conclusions (the digestif Barbeito uses sweetness `off-dry`, the
    dessert one says `medium dry (~72 g/L)` — same wine, pick one wording).

---

## READY TO INTEGRATE (high-confidence)

All 80 `high`-confidence records below are web-verified on core facts. Those marked † carry a
minor flag (vintage-on-label, dosage nuance, menu typo already corrected, or a vegan-null note)
that does not block integration but is worth a glance.

**Bubbly (3):** Griesel Blanc de Noirs† · Christophe Mignon ADN de Meunier Brut Nature† · Raventós i Blanc de Nit Rosé†

**Light/medium reds (6):** Terroir Sense Fronteres Negre de Montsant† · Alta Mora Etna Rosso† · Pierre Thibert Chorey-les-Beaune† · Sandrine & Fabrice Gasnier Chinon Pierres Chaudes† · Domaine de Colette Coteaux de Colette† · Castello di Verduno Alba†

**Structured reds (9):** Brandini Langhe Filari Corti† · Kistler† · Fletcher Barbaresco Recta Pete† · Texier Brézème† · Algre/Alegre Valgañón† · Domaine Gour de Chaulé Gigondas Les Jardinières† · Château Larose Perganson† · Whitehall Lane† · Aia Vecchia Sor Ugo Bolgheri Superiore† · White Rock†

**Crisp whites (5):** Denizot Sancerre† · Ciro Picariello Bru Emm† · Donnhoff Feinherb† · Landron Muscadet Amphibolite† · Bideona Cabezadas† · Cusumano Lucido†

**Round whites (5):** Domaine Breton Pierres Rousses† · Clos Bellane Valréas† · Buisson-Charles Meursault VV† (resolve `body:'full'` first) · Mount Eden Wolff Vineyard† · Eleonore Moreau Petit Chablis†

**Beers (15):** Ol' Beautiful Okami Kasu† · Stella Artois† · Banded Peak Mount Crushmore Pilsner · Banded Peak Approach Amber Lager · Village Wit · Brewsmith Signature Pub Ale · Establishment Afternoon Delight NEPA · 33 Acres Ocean Pale Ale† · Banded Peak Microburst Hazy IPA† · Four Winds Nectarous · Dandy The Julia† · Polyrhythm Matinee · Born Arm Candy Milk Stout · Uncommon Tropical Cider† · Chimay Blue† · Michelob Ultra†

**Fortifieds — dessert (3):** Valdespino Cream Sherry "Isabela"† · Barbeito Madeira Rainwater Reserva 5yr† · Fallentimber Honey Buck†

**Fortifieds — digestifs (20):** Emilio Hidalgo Fino · Valdespino Amontillado Tio Diego† · Emilio Hidalgo Oloroso Gobernador · Kopke LBV Port 2015† · Quevedo Tawny 10yr† · Taylor Fladgate Tawny 40yr · Boulard XO Calvados† · Christian Drouin XO Calvados† · Castarède XO Armagnac · Darroze 12yr Armagnac† · Hennessy VS† · Hennessy VSOP† · Hennessy XO† · Château de Montifaud VSOP† · Château de Montifaud XO† · Marolo Milla Camomilla† · Fernet Branca† · Averna† · Amaro Montenegro† · Nonino · (plus the duplicate digestif passes of Barbeito & Valdespino)

**Translator rows (9):** Gamay / Beaujolais · Viognier / white Rhône · Gewürztraminer / aromatic white · Albariño · Barolo / Barbaresco (cleanest, zero flags) · Cava · Sweet / plush red (high-confidence as an *expectation-setting* answer) · Beaujolais Nouveau / light juicy red · Sancerre

---

## NOT ready — hold for open-questions resolution

- **Tawny Port** (`low`) — placeholder until the actual house tawny is identified.
- **Pouderoux Maury Vendange** (`medium`, ×2) — pin the ABV on the bottle; reconcile the duplicate.
- **Château de Montifaud VS** (`medium`) — confirm the 'XS' menu print is the VS tier.
- **Cirelli Frizzante, Senat Amalgame, Malahierba Maleza, Castello di Potentino Sacromonte,
  Gulfi Nerojbleo, Claire Naudin Mallon, Maloof PJs, Rochette Mont Sard, Superflux Happyness,
  Vermentino translator** (`medium`) — integrate-able, but the medium flag (climate call,
  contested structure, blend uncertainty, or stand-in honesty) should be in open-questions first.
