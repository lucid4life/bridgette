# NEXT-SESSION KICKOFF PROMPT — Bridgette Training v2 (paste this whole file)

> Paste everything below the line into a new session. Recommended: `/effort xhigh` (or max), model Opus, and the message includes **ultracode** so multi-agent workflows are enabled.

---

ultracode. You are continuing **"Bridgette Training v2"** — an installable PWA that trains **Adrian** (a beginner server/bartender at **Bridgette Bar, Calgary**) to genuine fluency on the bar's menu so he is the **best possible server/bartender on the floor**. Effort: xhigh, model Opus. Work UNATTENDED-CAPABLE but ask me clarifying questions up front (see "Start here").

## Mission (what "best possible" means to me)
Make these **six core areas world-class** — they are the priority over everything else:
1. **Wine knowledge** — what each wine *is* (grape, region, climate, structure), what it tastes like, why it's special, the 10-second pitch.
2. **Food & wine pairings** — the best glass for each dish **and the structural "why"** (the WSET levers: acid cuts fat, tannin binds protein, sweet tames heat, salt softens tannin, match intensity, avoid tannin+spice).
3. **Food & cocktail pairings** — the best cocktail (and zero-proof) for each dish + the why; cocktail knowledge (what's in it, flavor, who it's for).
4. **Pronunciation** — say every wine/producer/region confidently (audio + always-visible respelling + fallback).
5. **Recommendations / the substitution translator** — the #1 floor skill: *"a guest asks for **Cabernet Sauvignon / Merlot / Malbec / Pinot Grigio / Sauvignon Blanc / Chardonnay** (and Rosé, Prosecco/Champagne, Pinot Noir, Chianti, Rioja, Zinfandel, Shiraz, Moscato…) → here's the by-the-glass pour, the bottle upgrade, one structural reason it fits, the point of difference, and how to handle 'is it sweet?' / 'we loved a Napa Cab' / 'something like Meiomi'."* This list is niche/obscure, so the translator is everything.
6. **Upselling** — glass→bottle: the upgrade ladders per lane, the economics (a bottle ≈ 5 glasses; pricing is in the data, e.g. `18 | 29 | 90`), ethical upsell language, and the menu's `exclusive` callouts.

Then **elevate the UX/UI**: I chose **refine the current Bridgette workbook identity to premium** (NOT a from-scratch redesign) — typography, spacing rhythm, motion/microinteractions, component craft, empty/loading states, delightful summary, install/onboarding polish. It must feel premium and effortless on **phone, tablet, desktop/laptop** — installable PWA, offline.

**Menu scope: the FULL menu** — by-the-glass wines, the **bottle list + upsell ladders**, **cocktails (with depth)**, **zero-proof**, and the **food menu**. The six core features should span the whole menu, not just the 17 by-the-glass wines.

**Do NOT deploy.** Build features only; I will deploy myself.

## Start here (read in full before doing anything)
The repo is at `C:\Users\abeek\OneDrive\Documents\Bridgette Barr` (Windows; PowerShell + Bash both available). The v2 app lives in `app/`. Read these first:
- `docs/superpowers/specs/2026-06-07-v2-app-design.md` — the design contract (§5 IA, §6 core loop, §7 simulator, §8 reasoning layer, §11 tokens, §12 data, §14 a11y, §16 testing, §17 acceptance).
- `docs/v2-phase3-status.md` — **what's already built + what's deferred** (start your audit here).
- `docs/v2-foundation-handoff.md` — the engine/data/tokens/fixtures contract.
- `docs/v2-open-questions.md` — sommelier facts NOT yet verified (resolve or keep flagging).
- `docs/research/2026-06-07-v2-content-verification.md` — per-wine climate/spelling/vegan sources.
- `docs/research/2026-06-07-v2-agent-team-findings.md` — the original 5-agent critique (still relevant: Guest Simulator as the spine, reasoning layer, accuracy fixes, AVOID list).
- `docs/research/2026-06-07-v2-phase3-adversarial-review.json` — the last adversarial review's full findings (several mediums/lows are still open — mine it).
- `docs/v2-mockup/bridgette-app-prototype.html` — the approved visual + the token source.
- `src/data.js` — the **canonical content** (v1 file; the app data is generated from it). `app/src/lib/data/*` — the typed app data + maps.
- Walk `app/src/` — routes (`routes/`), engine (`lib/engine/`), state (`lib/state/progress.svelte.ts`), components (`lib/components/`), audio (`lib/audio/`).
- Source menus for accuracy: `source_menus/*.txt` (the real Bridgette Calgary menus).

### Current state (summary; verify against the code)
Stack: **SvelteKit 2 + Svelte 5 runes**, `adapter-static` SPA (`ssr=false`+prerender), `@vite-pwa/sveltekit` (`registerType:'prompt'`), Vitest, Playwright + `@axe-core/playwright`, `@fontsource/oswald`, TypeScript. Branch **`v2-app`** (~18 commits ahead of `main`).
Built + verified: responsive shell (sidebar→rail→tab-bar); Practice core loop (Smart Review/Focus/Readiness/**Mystery Pour**/**Guest Simulator**) with box-adaptive cards, confidence tap + hypercorrection, focus-to-reveal, aria-live; reasoning layer (families, body×acidity style map, region map, dual-coding structure meters); Today cockpit + first-run onboarding; Reference (chips, search, mobile-stacked matrix); Wine School (7 quick-checks + deductive grid); Progress (animated rings, drillable weak list, daily-grace + silent-freeze + weekly-goal streak); PWA (branded icons, install/update toast). Gates green: 116 Vitest, svelte-check 0, **Playwright smoke/axe-WCAG-AA-per-route/offline**, build. The 17 by-the-glass wines have real MP3 pronunciation; the translator has ~20 guest-ask rows; foods carry wine+cocktail+zero pairings with structural `why`.

## Hard guardrails (non-negotiable)
- Work on **`v2-app`**. **Never commit to `main`. Never merge. Never deploy.** Commit frequently with the trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Preserve the engine contract:** the card-`id` slug scheme and the `bb_progress_v1` localStorage key are **byte-for-byte frozen** (changing them wipes a real user's Leitner progress). The migration test + card-ID snapshot in `app/src/lib/engine/__fixtures__/` must stay green. If you add decks/cards, **regenerate the card-ID snapshot deliberately** and keep the golden-progress migration test passing.
- **Data is generated:** edit `src/data.js` (canonical), then run `node tools/build_app_data.mjs` to regenerate `app/src/lib/data/data.js`. Keep `tests/check_training.py` (v1 contract) green; keep the v1 Node suite green.
- **Accuracy is sacred** (a beginner memorizes this as fact): web-verify every sommelier claim against authoritative sources (Jancis Robinson, GuildSomm, Wine-Searcher, Wine Folly, producer/importer). Anything you cannot confidently verify → append to `docs/v2-open-questions.md` and do NOT assert it. Keep the §12 accuracy fixes (vegan true/null only, softened folklore, Claret/Cerrón lead the ribeye, gazetteer spellings).
- **Tokens are the visual contract:** `app/src/app.css` `:root`. Refine it but keep the Bridgette workbook identity (deep ink + cream + orange/gold + Oswald/Arial). No generic-AI gradients. Maintain WCAG AA contrast (axe is a gate).
- **Keep all gates green at every commit:** `cd app && npm run test` (Vitest), `npm run check` (svelte-check), `npx playwright test` (smoke/axe/offline), `npm run build`. Use the preview tools to verify UI in a real browser (screenshots may be flaky in this env — fall back to accessibility snapshots + `preview_eval` computed-style checks; that's how the contrast audit was done).
- **Don't violate the AVOID list** (from the findings): no leaderboards/XP/guilt-streaks, no timed speed-match, don't drill taste/aroma in software, keep Leitner (not SM-2/FSRS), don't paywall, don't strip mnemonics/audio, don't port the 664KB base64 audio (MP3s are static).

## How to work (ultracode — orchestrate; don't go solo on big things)
Use the **Workflow tool** for every substantive phase; use subagents/agent-teams for parallel research, content sourcing, and adversarial verification; build coupled UI yourself (sequentially) to avoid design drift, then adversarially review. Token cost is not a constraint — optimize for the most correct, thorough result. Lean on these skills/plugins (invoke the ones that fit each step):
- **superpowers:** `brainstorming` (before new features), `writing-plans` (bite-sized TDD plan), `subagent-driven-development` (execute), `verification-before-completion` (evidence before claims), `systematic-debugging`, `requesting-code-review`, `dispatching-parallel-agents`.
- **Research:** `deep-research` and `multi-layer-research-convergence` (for high-stakes UX/architecture decisions — converge peer-reviewed learning science + competitor teardown + real user behavior).
- **Design/quality:** `interface-design:critique`, `interface-design:audit`, `frontend-design`, `accessibility` (WCAG 2.2), `web-quality-audit`, `core-web-vitals`, `performance`. (`taste-design`/`stitch-*` only if you prototype components — but keep the existing identity.)
- **Review:** `code-review`, `comprehensive-review:full-review`, `security-review` (light).
- **Tools/MCP:** Playwright + `@axe-core/playwright` (gates), **ElevenLabs MCP** (generate any new pronunciation clips — voice Sarah `EXAVITQu4vr4xnSDxMaL`, model `eleven_multilingual_v2`; screen with `speech_to_text`; see `tools/README-audio.md`), `context7` (library docs), `humanizer` (server-facing copy), `svg-logo-designer` (icons).
- **The `grill-me` skill / AskUserQuestion** — grill me on priorities and trade-offs whenever a decision is genuinely mine.

## Execute in phases (each a workflow + a checkpoint)

**Phase A — Hypercritical full audit (do this first).** Run a multi-angle adversarial audit workflow over the running app + source, each agent schema-validated, then synthesize a prioritized backlog. Angles: (1) UX/interaction & information architecture; (2) accessibility WCAG 2.2 (per route + every interactive state); (3) sommelier/content accuracy & completeness across the **full menu**; (4) learning-science efficacy (retrieval, spacing, interleaving, generation, dual-coding, hypercorrection — is each feature actually teaching?); (5) performance / Core Web Vitals / bundle / offline; (6) competitive teardown vs the best language-learning apps (Duolingo/Anki/Brainscape) AND sommelier/menu apps — what would make THIS the best. Verify findings adversarially (don't trust a single agent). Produce `docs/research/<date>-v2-audit.md`.

**Phase B — Research the best way to build the six areas.** Use deep-research / multi-layer convergence on: restaurant beverage-training pedagogy; how great servers learn substitutions + upsells; pronunciation-learning UX (audio + phonetic respelling + syllable breakdown); food↔wine and food↔cocktail pairing teaching frameworks; mobile-first microlearning UX; premium beverage/menu app patterns. Separately, run a **parallel content-sourcing workflow** (one agent per menu item) to enrich the FULL menu with web-verified fields the features need — for wines/bottles: grape, region, climate, structure (WSET low/med/high), tasting profile, the pairing "why", pronunciation respell, upsell ladder, `exclusive`; for cocktails: build, flavor profile, who-it's-for, dish pairings, zero-proof analog; for foods: the structural pairing logic. Flag every uncertainty to open-questions.

**Phase C — Plan + build (writing-plans → subagent-driven-development).** Translate the audit + research into a TDD plan, then build. Concretely (adjust per audit):
- **Data:** extend `src/data.js` to the full menu (bottles via `bottleLadders`/`bottleMap`, cocktail depth, zero-proof, foods) with the fields above; regenerate app data + types; keep contracts green.
- **Recommendations (the marquee feature):** a first-class, instant **"Guest asks for ___"** experience — search/lookup by grape/style → pour + bottle upgrade + one-line why + point-of-difference + objection handling; tightly drilled by the Guest Simulator (scale difficulty by Leitner box; add budget/non-drinker/"is it sweet?"/"something like Meiomi" curveballs). Cover all the common asks I listed.
- **Food↔wine & food↔cocktail:** a pairing decision tool ("dish → glass + cocktail + zero-proof + the why"), the readable matrix (mobile = dish cards), the 6 levers taught and drilled, full-menu coverage.
- **Pronunciation:** extend audio/respell to any new names (ElevenLabs); add a focused pronunciation drill (say-it → check), maybe syllable breakdown + slow playback; keep respelling the visible source of truth.
- **Wine knowledge & upselling:** deepen per-item profiles; the families/style/region/Mystery Pour reasoning layer; a glass→bottle upsell ladder + economics + ethical-language drill; surface `exclusive`.
- **UX/UI elevation (refine identity):** premium type scale & rhythm, spacing system, ≤250ms transform/opacity microinteractions (full reduced-motion branch), card depth/shadow polish, skeleton/empty/loading states, mobile flashcard flip + swipe-to-grade, ≥44px targets, delightful animated summary, refined onboarding + install. Verify at all 3 breakpoints + dark/light + reduced-motion.

**Phase D — Verify (evidence before claims).** Every commit keeps the gates green. Add **visual-regression** (Playwright `toHaveScreenshot` at the 3 breakpoints) once you settle the look. Re-run the **adversarial self-review** pass and fix. Close out: `docs/` status update + the open-questions list for me.

## Known open items to fold in (from the last review/status)
- Visual-regression baselines not yet committed (Playwright is wired).
- Readiness "% shift-ready" is not yet confidence-weighted (spec §9).
- Guest Simulator is not yet Leitner-box-scaled (spec §7).
- Low-severity a11y polish: goal toggle radiogroup semantics, map hover-label px sizing on phones, weekly-mode snowflake parity, guided-card "View →" cue, the harmless `/practice/sw.js` scope-probe 404.
- Mine `docs/research/2026-06-07-v2-phase3-adversarial-review.json` for the remaining mediums/lows.

## Start here — ASK ME these before building (and any others you surface)
1. **My weakest areas / what to drill hardest first** (so the app prioritizes my real gaps).
2. **How I'll use it** — study at home, quick floor reference on my phone mid-shift, or both? (Shapes whether we add a "shift mode" fast-reference.)
3. **Bottle-list accuracy source** — is `src/data.js` `bottleLadders`/`bottleMap` current, and is there a manager/somm who can confirm uncertain facts, or should you self-source + flag everything?
4. **Cocktail depth** — how much cocktail knowledge do I need (full builds + technique, or just "what to recommend with what")?
5. **Copy tone** — confident-casual server voice, or more formal? Any words/claims to avoid for compliance (allergens, ABV, sweetness)?
6. **Scope of the full-menu expansion** — all bottles, or just the upsell-ladder bottles? Dessert/digestif/beer too?
7. Anything you've noticed using it so far that feels off.

## Definition of done (for this build-out)
The six core areas are deep, accurate (web-verified or flagged), and genuinely teach me; the full menu is covered; recommendations + upselling are instant and drillable; pronunciation is confident; the UX feels premium and works flawlessly on phone/tablet/desktop, installable + offline; all gates green (Vitest, svelte-check, Playwright axe/offline/smoke/visual-regression, build); adversarial self-review clean; `main` untouched; nothing deployed (I deploy). Use `superpowers:verification-before-completion` and show evidence for every "done."
