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

---

# S5 audit results (2026-06-06) — `accessibility` (WCAG 2.2) + `web-quality-audit` skills

Applied both skill checklists against the full `src/` read. **All §12 / §15 a11y criteria met after the S5 fixes below.**

## Fixed this session
- **A (contrast, CRITICAL):** matrix data cells — hotfix verified present + now guarded by a regression test (`check_dashboard_contrast.py` rule-aware check; temporarily removing the hotfix makes the test FAIL).
- **B (contrast):** `.section-sub` 4.35→5.09:1 (darkened `--muted-paper` to `#44586a`).
- **C (contrast):** correct-answer key glyph 4.09→≥7:1 (`--ink`).
- **D (focus-visible 2.4.7/1.4.11, NEW — not in the cold review):** focusables on the light cream **flashcard faces** sat inside `.section.dark`, so the cascade gave them a gold outline ≈1.4:1 on cream (invisible). Scoped `.flashcard-face :focus-visible { outline-color: var(--accent-dark) }` (≥4.5:1).
- **E (focus-visible):** explicit gold outline on `.deck-tile:focus-visible` (was cascade-only).
- **F (consistency):** styled the previously-ruleless `.readiness-panel`/`.readiness-result`.

## Verified compliant (POUR), no change needed
- **Perceivable:** no `<img>` (CSS/text/emoji UI); icon buttons (`🔊`, `★/☆`) have `aria-label`; decorative emoji (`🔥`) and meter segments are `aria-hidden`; rings + structure meters carry `role="img"` + text `aria-label` (§15 "text-equivalent labels"); pronunciation respelling is always shown as the card answer (audio is supplementary). **Not color-alone:** quiz result also uses `aria-live` text + answer-face flip; guided path uses Done/Do-next/Later text; meters show the word low/medium/high.
- **Operable:** every control is a native `<button>/<a>/<input>/<select>/<textarea>`; Practice keyboard (Space/1–4/Enter) layered over native activation without trapping Tab; inactive flashcard face is `inert` (out of tab order + a11y tree); skip-link → `#main`; `scroll-margin-top` clears the sticky nav (2.4.11); target sizes ≥40–46px on primary controls.
- **Understandable:** `<html lang="en">`; consistent single nav; all inputs labelled (search/selects/typed-input `aria-label`/notes); import errors surface via `aria-live`.
- **Robust:** native-first; correct ARIA (`role=region/group/img`, `aria-pressed/expanded/controls/describedby/labelledby`); multiple `aria-live` regions; logical h1→h2→h3 hierarchy; landmarks header/nav/main/footer + named `aside`.
- **web-quality / best-practices:** `<!doctype html>`, `charset` first, viewport set, fonts `display=swap`; no `document.write`/deprecated APIs; `localStorage` guarded in try/catch (file://-safe). SEO/HTTPS/CWV-network checks are N/A for an offline single-file study tool.

## Optional, low-priority (noted, not blocking AA — left to avoid scope creep)
- `.pron .speak-btn` (Reference cards) renders ≈24px tall — meets 2.5.8 only via the inline-target exception; could bump min-height for comfort.
- MC correct/wrong could add a ✓/✗ glyph for at-a-glance redundancy (already compliant via `aria-live` + flip).
- `≈` in `.smeter-note` is read aloud; could `aria-hidden` it.
