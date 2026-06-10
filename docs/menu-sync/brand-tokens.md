# Verified Bridgette Bar brand tokens — eyedropped 2026-06-09

Sources: the four official menu PDFs (source_menus/pdfs/2026-06-09/, extracted
via pdfplumber char/rect colors) and the live bridgettebar.com/calgary CSS.
This is the ground truth for the Phase 6 redesign primitives.

## Verified digital brand colors

| Token | Hex | Source | Notes |
|---|---|---|---|
| Cream | `#ffeed6` | live site CSS (1 of only 2 hexes on the page) | canonical canvas — matches our existing `--cream` |
| Orange | `#f15825` | live site CSS | canonical accent — matches our existing `--orange` |
| Ink (true) | `#000000` | all 4 menu PDFs (body text) | the printed menus use BLACK text on cream stock, not navy |
| Coral | `#f25c4d` | all 4 menu PDFs (headings/accents; 127–171 chars per menu) | the print accent — warmer/pinker than the web orange |
| Terracotta | `#e87a57` | drinks PDF (45 chars) | secondary print accent |
| Signal red-orange | `#ff2e00` | matinée PDF (30 chars) | used sparingly for emphasis |

## Typography (verified)

- **Oswald** weights 300 + 700, loaded from Google Fonts by the official site —
  our `--font-display` is correct, and we should use BOTH weights (light 300
  for elegance, 700 for emphasis), not just one.
- Body face on the site is a Squarespace/system stack; no paid brand body font
  is exposed. Hanken Grotesk remains a defensible self-hosted choice.

## NOT verified as brand (implications for the redesign)

- **Navy ink `#1e384b` / `#162d3d` / `#102230`** (the current app shell):
  appears NOWHERE in the menus or site CSS. The "too blue" feeling is real —
  the brand's dark is plain black on warm cream. Retire navy from all surfaces.
- **Gold `#fcb539`**: not found in any official source. If we keep a
  gold/brass accent it is OUR derived token, not a brand byte — consider
  deriving warm brass from the coral/terracotta family instead.
- **Deep green / wood / brass** of the physical room (Frank Architecture
  interior: green marble bar, teak, brass fixtures, orange chairs) are
  photographic/interior brand, fine as SUPPORTING tones picked to harmonize
  with the verified set above.

## Recommended Phase 6 primitives

```css
--bb-cream:   #ffeed6;  /* verified canvas */
--bb-paper:   #fff8ec;  /* derived lighter cream (keep) */
--bb-ink:     #181512;  /* near-black with a warm cast (print is #000) */
--bb-orange:  #f15825;  /* verified accent */
--bb-coral:   #f25c4d;  /* verified print accent */
--bb-terracotta: #e87a57; /* verified secondary */
--bb-green:   #3f5d4e;  /* supporting: the marble-bar green, tuned warm */
--bb-brass:   #b08d4a;  /* supporting: brass fixtures, replaces unverified gold */
--bb-espresso: #221b15; /* dark-mode canvas: warm brown-black, never navy */
```
