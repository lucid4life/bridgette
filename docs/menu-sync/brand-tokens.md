# Verified Bridgette Bar brand tokens

Two research passes:
1. **2026-06-09** — the four official menu PDFs (pdfplumber char/rect colors) +
   a shallow read of the live-site CSS (caught only the 2 hard-coded hexes).
2. **2026-06-11 — FULL-SITE HSL AUDIT (supersedes pass 1's "not brand" claims).**
   The site is Squarespace 7.1; its entire palette lives in five HSL custom
   properties, which pass 1 missed. This is the ground truth for the v3 palette.

## The site's five-colour system (verbatim HSL vars → hex)

| Token | HSL (site var) | Hex | Roles on the live site |
|---|---|---|---|
| Cream ("white") | `--white-hsl: 34.5,100%,92.16%` | `#ffeed7` | page background (~60% of every page), header, button text |
| Slate ("black") | `--black-hsl: 205.33,42.86%,20.59%` | `#1e384b` | ALL headings/body/nav ink + the footer/newsletter dark bands + splash page |
| Orange (accent) | `--accent-hsl: 14.85,88.03%,54.12%` | `#f15623` | primary buttons, in-text links, nav hover (the site's ONE hand-written CSS rule), full "bright" menu bands |
| Marigold (lightAccent) | `--lightAccent-hsl: 38.15,97.01%,60.59%` | `#fcb539` | hero band backgrounds on every location page |
| Steel teal (darkAccent) | `--darkAccent-hsl: 197.25,37.38%,41.96%` | `#437c93` | configured palette slot, deployed on no fetched page (free for us) |

Page anatomy: marigold hero → cream body → solid-orange menus band → slate
newsletter band → slate footer (~60% cream / 20% saturated band / 20% slate).
Buttons: solid rounded orange, white text on coloured/dark sections.

## Print system (menu PDFs, pass 1 — still valid)

Near-black `#000` ink on cream stock; coral `#f25c4d` headings/accents;
terracotta `#e87a57` secondary; signal red-orange `#ff2e00` sparingly.
The web accent `#f15623` is hotter than the print corals — both are real.

## Typography (verified, both passes)

- Headings: self-hosted "standard" (StandardCT-Condensed) with **Oswald 300**
  fallback, letter-spacing −0.01em, **text-transform: lowercase** (the most
  recognizable brand trait — all site headings render lowercase).
- Body: "europa" via Adobe Typekit (not self-hostable) — Hanken Grotesk
  remains our defensible body face. Oswald loads weights 300 + 700 only.

## Corrections to pass 1 (what the v2 redesign got wrong)

- **"Navy appears nowhere" — FALSE.** Slate-navy `#1e384b` is literally the
  site's ink and dark-band colour (`--black-hsl`). v1's navy instinct was
  right; its mistake was using navy as EVERY surface instead of ink + bands.
- **"Gold #fcb539 not found in any official source" — FALSE.** It is the
  site's `--lightAccent-hsl` (the hero bands), to the byte.
- The v2 espresso/brass/wood set ("too brown") was OUR derivation, not brand.

## v3 primitives (app/src/app.css, contrast-engineered, tokens.test.ts enforced)

```css
--bb-cream: #ffeed7;     --bb-paper: #fff8ec;    /* canvas family */
--bb-slate: #1e384b;     --bb-slate-muted: #4a6478;
--bb-slate-mid: #1c3242; --bb-slate-deep: #14222d; --bb-slate-raised: #264457;
--bb-orange: #f15623;    --bb-orange-bright: #f4703f; /* dark-theme text */
--bb-ember: #b8420f;     --bb-ember-deep: #9c3a0c;    /* AA action tones on cream */
--bb-marigold: #fcb539;  --bb-ochre: #7a5410;         /* AA marigold text tone */
--bb-teal: #437c93;      --bb-teal-deep: #2e6075;
--bb-ink: #181512;       --bb-stone: #5c5346;         /* print faces only */
--bb-coral: #f25c4d;     --bb-terracotta: #e87a57;    /* print accents */
--bb-green: #3f5d4e;                                  /* status ok */
```

Recipe in the app: cream canvas + slate ink (light), deep-slate canvas + cream
ink (dark), the sidebar is the slate band in BOTH themes, flashcards stay
printed-menu faces (black-on-cream, coral rule) in both themes, h1/h2 lowercase.
Track identities (decorative hairlines): food=orange, bar=marigold, wine=teal.
