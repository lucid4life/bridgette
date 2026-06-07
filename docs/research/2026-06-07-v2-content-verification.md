# v2 Content Verification — per-wine source table (2026-06-07)

Produced by a 17-agent parallel web-verification workflow (run `wf_702b0cdd-c22`). Each wine was checked against authoritative sources (Jancis Robinson, GuildSomm, Wine-Searcher, Wikipedia/region bodies, producer/importer sites) — **not** the restaurant menu (spec §12). Climate is mapped to the 3-point cool/moderate/warm axis that explains structure.

| Wine | Climate (conf) | Spelling | Vegan finding | Source highlights |
|---|---|---|---|---|
| Blue Mountain Brut | **cool** (med) | ok | **Not vegan** — Barnivore: bentonite + **casein** fining | BC Wine Authority Okanagan Falls Sub-GI; warm days / cool lake-moderated nights drive acidity |
| Fattoria Moretto Semprebon | **warm** (med) | ok (precise DOC = Lambrusco Grasparossa di Castelvetro) | unconfirmed (organic since 1997) | Wine-Searcher; Consorzio Lambrusco — continental, Apennine foothills S of Modena |
| Hiedler Löss | **cool** (high) | ok (source subregion = Kamptal) | unconfirmed (organic/native-yeast) | austrianwine.com (Kamptal), Wine-Searcher |
| Vini be Good Hip Hop Chenin | **cool** (high) | ok (Loire collective; Vin de France) | unconfirmed (often unfined) | The Wine Doctor; Wine Folly — Loire cool-climate |
| Wagner-Stempel Weissburgunder | **cool** (high) — *corrected 2026-06-07 from "moderate" (ACC-01): Siefersheim is a cool porphyry pocket* | **FIX: producer → "Wagner-Stempel" (hyphen)** | unconfirmed (organic since 2008) | GWC (thegwc.com/wagner-stempel: "cool climate… inordinately cool by Rheinhessen standards"); VDP Rheinhessen; Metrovino porphyry note |
| Darting Dürkheimer Fronhof | **warm** (high) | ok | unconfirmed | Wine-Searcher/wein.plus — Pfalz, Haardt rain-shadow, near-Mediterranean |
| Dona Matilde Branco | **warm** (high) | ok (4 grapes confirmed) | unconfirmed | Wikipedia Douro DOC; Jancis Robinson — hot dry summers (40°C+) |
| Bodega Cerrón Remordimiento Blanco | **warm** (high) | ok (ñ/é correct) | reported vegan by retailers, unconfirmed at producer | Wikipedia Jumilla DO; ~840m altitude tempers warmth |
| Ameztoi Rubentis | **cool** (high) | ok (Basque names; no diacritics) | unconfirmed (one retailer says vegan) | Wikipedia Getariako Txakolina — cool maritime, Bay of Biscay |
| Leitz Eins Zwei Dry Rosé | **cool** (high) | ok | unconfirmed (don't confuse with the non-alc "Eins Zwei Zero", which IS stated vegan) | Wines of Germany/DWI Rheingau; Wine-Searcher |
| Deinhard Deidesheim | **warm** (high) | ok (Weingut Dr. Deinhard → von Winning since 2008) | **likely vegan** (importers: no fining/filtering) but no certification | Jancis Robinson — Pfalz, warmest German Pinot Noir region |
| Ca' del Baio Langhe | **moderate** (high) | ok (apostrophe correct) | unconfirmed (gentle fining) | Wine-Searcher Langhe; continental, foggy autumns, big diurnal swings |
| Sindicat la Figuera | **warm** (high) | ok ("Sindicat la Figuera" is a legit commercial name; some labels "Sindicat de la Figuera") | unconfirmed (Mas Martinet, organic) | Wikipedia Montsant DO; ICEX — Mediterranean, ~550m altitude |
| Bindi Sergardi La Boncia | **warm** (med) | **FIX: region → "Chianti DOCG" (not Chianti Classico)** | **Not vegan** — Barnivore: estate sometimes uses egg-white (albumen) fining | Producer site + Broadbent label it Chianti DOCG; Wine Folly/SevenFifty Tuscany |
| Bodega Cerrón Remordimiento Tinto | **warm** (high) | ok (85% Monastrell / 15% Garnacha; bottled DOP Jumilla) | reported vegan-certified by one distributor, unconfirmed at producer | Wikipedia Jumilla DO; high-altitude 800–920m parcels |
| St. John Claret | **moderate** (high) | ok (grapes incomplete — see open questions: also Cab Franc, Cab-led) | unconfirmed | Jancis Robinson Bordeaux (moderate maritime); St. John × Maison Sichel |
| Gallina de Piel Neverwine | **cool** (high) | ok (Albariño ñ; region left "Spain") | unconfirmed (de-alcoholized; stabilizers, no fining disclosure) | Rías Baixas DO (Albariño's cool-maritime home) — see open questions on base-wine origin |

## Applied to `src/data.js`
- `climate` set per the table above for all 17 wines.
- Spelling fixes applied: **Wagner-Stempel** (hyphen, synced across the wine name, both translator `bestGlass` rows, and 4 food `wine` references); **Bindi Sergardi region → "Chianti DOCG, Tuscany, Italy"**.
- `vegan`: `true` for the 5 menu-`v` wines, `null` (unconfirmed) for the other 12 (spec §12 — stop asserting `vegan:false`). Sourced **not-vegan** findings for Blue Mountain Brut and Bindi Sergardi captured in a `veganNote` field + open questions (kept `vegan:null` per spec, with the note flagging the risk so the confirm rule is invoked).

## Confidence flags carried to open questions
- Medium-confidence climate: Blue Mountain Brut, Fattoria Moretto, Bindi Sergardi (all used as-is, marked tentative).
