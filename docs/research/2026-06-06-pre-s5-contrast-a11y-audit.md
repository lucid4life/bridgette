# Pre-S5 Cold Review — Contrast & A11y Findings (2026-06-06)

A fresh-eyes review of the built `src/` before the S5 final-polish session. Contrast ratios computed from the actual `:root` hex values (alpha-blended for tinted backgrounds). WCAG AA: 4.5:1 normal text, 3:1 large/UI. **S5 must fix these; line numbers are approximate (verify in the current file).**

## 🔴 CRITICAL — the user-reported "can't see it near the matrix"

**Root cause:** the Quick Pairing Matrix (`#pairingMatrix`) renders inside `.section.dark` (`#pairing`), which sets `color: var(--cream)`. `.matrix` (styles.css ~627) sets `background: var(--cream)` but **no text color**, and `.matrix th, .matrix td` (~639) set only borders/padding. So `<td>` data cells inherit cream → **cream-on-cream ≈ 1.0:1 (invisible)**. Row headers survive only because `.matrix tbody th` (~655) explicitly sets `color: var(--ink)` — which is why dish names show but the pairing columns don't. The bare `<span>` flavor sub-line (app.js ~167) is invisible for the same reason. Striped even rows (`~675`, `rgba(30,56,75,.045)`) compound it.

**Fix (one rule, works in BOTH the dark Pairing matrix and the light Wine translator table):**
```css
.matrix td { color: var(--ink); }              /* #1e384b on #ffeed7 = 10.7:1 */
.section.dark .matrix { color: var(--ink); }    /* belt-and-suspenders for any inherited text */
```
Do NOT "fix" it by changing the section — the same `.matrix` markup is reused in the light Wine section and must keep working. After the fix, re-verify hover (`~678`) and striped rows now read ≥4.5:1 (they do, ~9–10:1).

## 🟡 Secondary contrast fixes

- **`.section-sub` muted text dips below AA on the section-head gradient (~4.35:1).** `--muted-paper` (#506272) on `.section:not(.dark) .section-head`'s orange-tinted left edge (`rgba(168,50,18,.08)`) falls under 4.5:1 for normal-size text. Fix: darken `--muted-paper` to ~`#45596b` (≈5.6:1) OR use `var(--brown)` for `.section-sub` in light sections.
- **Generic focus ring nearly invisible on dark surfaces (1.82:1).** `:focus-visible { outline: 3px solid var(--accent-dark) }` (#a83212) on ink is 1.82:1 (UI needs 3:1). It's overridden to gold for `.site-header`/`.top-nav`/`.section.dark` descendants, but confirm EVERY dark-surface focusable gets the gold outline — notably `.deck-tile:focus-visible` (~825) only swaps border/bg (no outline). Add `outline: 3px solid var(--gold); outline-offset: 2px;` there.
- **Correct-answer key glyph green-on-green (3.79:1).** `.choice-btn.correct .choice-key` (~880) uses `var(--green)` (#506f5f) on a green-tint bg. Use `var(--ink)` for the key text/border on the correct state (or deepen the green).

## 🟢 Polish / consistency

- **`.readiness-panel` / `.readiness-result` have NO CSS rules** (render unstyled in the light `#progress` section). Add a bordered container consistent with `.callout` (1px `--line-dark`, left accent) so the Readiness Check matches its siblings.
- Consider a `.section.dark .btn { color: var(--cream); }` baseline so future dark-section buttons can't fall back to unreadable light styling (relies today on a fragile `:not(.primary):not(.gold)` override).
- Consolidate light-section "muted" text on one accessible token (`--muted-paper` vs `--label-light` used inconsistently).

## Test coverage gap

`tests/check_dashboard_contrast.py` did NOT catch the matrix bug. **S5 should extend it** to assert the matrix data cells and the light Wine School section use dark-on-light (not cream-on-light / cream-on-cream), so this class of regression is caught automatically.

## Confirmed OK (no action)

`prefers-reduced-motion` handling (incl. a real flip-card fallback); matrix `scope` attributes + `role="region"`/`tabindex`/`aria-label` scroll wrappers; `aria-live` on `#cardFeedback` (assertive) and `#ioStatus`/`#readinessResult` (polite); matrix `<thead>` header (cream on ink, 10.7:1); translator `.say` (brown italic, 9.4:1).
