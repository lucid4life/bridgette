# v2 App — Agent-Team Findings & Upgrade Plan (2026-06-07)

Five parallel specialist agents (learning-science, UX/interaction, competitive teardown, sommelier/content, frontend-architecture/build-risk) hypercritically reviewed the v2 plan + mockup + `src/`. This is the synthesis. **Items flagged by 2+ agents are high-confidence.**

## Headline verdict
The mockup is a solid, on-brand *shell* — but as designed, v2 would be **"flashcards in a nicer wrapper"** and **"a layout, not a loop."** The engine trains *isolated facts*; the job (a fluent, branching guest interaction under pressure) is never directly practiced. The 30-second core loop (answer→feedback→next→summary) — where "premium app vs styled dashboard" is decided — doesn't exist in the mockup yet.

## TIER 1 — transformative (multiple agents converged; do these)
1. **Guest-Interaction Simulator as the SPINE of Practice** (not a box-5 afterthought). A role-play loop running the Ask→Match→Explain→Confirm rhythm with injected curveballs/objections ("is it sweet?", "we loved a Napa Cab", "something like Meiomi", "a white with steak", budget cues, the non-drinker). The data already has `say`/`pair`/`avoid`/`upgrade`/`phrase`/`why`; add an `objections[]` field. *The scenario IS the skill; facts are its components.* (learning-science #1, domain [H], competitive, UX)
2. **Build the core LOOP + feedback layer** — instant correct/wrong states with the *why* revealed (never a red "WRONG"), an advancing session progress bar, and a rewarding end-of-session summary where mastery rings *animate up* and the streak ticks. (~+30% completion from instant feedback — Duolingo.) (UX #1, learning-science, tech)
3. **Action-first onboarding + make Practice the default.** First run = one win in ~30s ("guest asked for Cab → say St. John Claret") before any dashboard; returning users land ≤1 tap from a card. Demote "Today" to a real cockpit (live, actionable) or fold it in. (UX [H], competitive #1)
4. **A reasoning / mental-model layer** so he can IMPROVISE and it survives menu changes: "wine families" buckets (Bold&Fruity / Bright&Crisp…), a **climate/geography** axis (cool↔warm explains every structure meter), grape-family logic (Garnacha=Grenache, Monastrell=Mourvèdre), and a body×acidity **style map**. Also the backbone of the substitution translator. (domain [H]×3, competitive #2, learning-science 5)

## TIER 2 — high value, mostly cheap
- **Confidence tap ("Sure / Shaky")** before reveal → hypercorrection handling (loud correction for confident-wrong, the dangerous beliefs) AND makes the "shift-ready %" honest (lucky guesses don't inflate it). (learning-science [H], competitive — Brainscape CBR)
- **Dual-coding visuals:** graphic structure meters (not text), an SVG region map, and promote the deductive grid to a daily **"Mystery Pour"** generative card (structure fingerprint → name the grape + our wine; generation effect). (learning-science, domain, tech, competitive)
- **Forgiving streak UI for a shift worker:** weekly-goal option + silent streak-freeze. Adrian works weekends — rigid daily streaks are a known dealbreaker; guilt-streaks drive quitting. (UX [H], competitive)
- **Elaborative "why first"** (ask the reason before revealing it — self-generated beats provided) + **interleave confusable wines** (Claret/Sangiovese/Cerrón Tinto; Grüner/Pinot Blanc) for discriminative contrast. (learning-science)
- **Miss → one-tap "Explain this"** deep-link to the relevant lesson (the spec's learnLink, surfaced). (UX, competitive)
- **Multi-entry guest lookup** for the translator: query by grape / style / food / region → "your match + the why." (competitive #3, domain)

## CONTENT DEPTH (sommelier agent — makes him genuinely knowledgeable)
- **[H] Service ritual** — serving temperature, glassware, decant, pour size (menu says 5oz/8oz), order of service. *What a beginner is judged on night one* and currently absent. These specific wines transform with it (chill the Deinhard Pinot; ice-cold the Txakoli/Riesling; don't over-warm the Monastrell). Add `serviceTemp`/`glass` per wine + a lesson.
- **[H] Glass→bottle upsell economics + ethical language** — bottle ≈ 5 glasses; the pricing math is *already in the data* (`18 | 29 | 90`). Highest-revenue server skill; currently zero coverage.
- **[H] Deeper guest-scenario deck** — objections, budget cues, "something like Meiomi" (a *sweetened* Pinot — reframe, don't fake-match), "white with steak", "surprise us", the non-drinker.
- **[M] Promote the Safety/allergy deck into v1** (the team's strongest pushback on a deferral): ambulance-level stakes; flags already in data; Canada treats **sesame AND mustard** as priority allergens — both on this menu. Add a hard "always confirm with the kitchen, never guess" rule.
- **[M] Producer "exclusive" callouts** (menu marks several `exclusive` — a ready-made upsell), tasting-vocabulary builder (WSET SAT lexicon), pairing decision-tree (improvise vs 35 memorized pairs).

## ACCURACY FIXES (a beginner memorizes these as fact — fix in the data v2 ports)
- **`vegan:false` is overclaimed** — the menu only marks `v` (vegan); it never marks non-vegan. Use `vegan:true` for `v`-marked, `null`/"unconfirmed" otherwise + "confirm" rule.
- Soften folklore mnemonics presented as fact: Monastrell "dog-strangler" (that's Mourvèdre lore), Sangiovese "blood of Jove" (disputed) → label as memory hooks.
- Nebbiolo + 26oz ribeye is slightly oversold (Ca' del Baio Langhe is medium-bodied) → make Claret/Cerrón the ribeye lead, Nebbiolo → strip/lamb.
- Audit every region/producer spelling against a gazetteer (Jancis Robinson/GuildSomm), NOT the menu (the menu has typos: Phaltz→Pfalz, etc.).
- Keep Lambrusco framed "dry-ish, taste to confirm" (don't harden to "dry").

## AVOID (all agents agreed)
No leaderboards / XP-farming / guilt-streaks; no timed speed-match (rewards shallow recognition); **don't drill taste/aroma in software** (verbal-overshadowing risk — keep tasting as a real-world checklist); keep **Leitner** (don't switch to SM-2/FSRS); don't paywall; don't strip mnemonics/audio; don't expose algorithm settings; **don't port the 664KB base64 `audio.js`** — ship the 17 MP3s as static, service-worker-cached assets (~0.5MB) with the MP3→Web-Speech→respelling fallback chain.

## BUILD-PROCESS — de-risk the "autonomous overnight" run (architecture agent, Part B)
A *pure* hands-off overnight build is the riskiest path: agents **drift to generic AI/Tailwind defaults** (the #1 failure) and **silently break** offline/a11y/progress (no error in dev). The fix:
- **Lock the human-approved foundation FIRST (tonight, with Adrian):** (1) design tokens extracted from the mockup → `app.css` `:root` as the visual contract; (2) pinned `package.json` + lockfile + a *verified* scaffold (`npm ci` + `playwright install` proven to work); (3) the **pure v1 engine ported to ESM with its ~50 tests green** (it's already DOM-decoupled — "port the brain, rewrite the shell"); (4) TS data-model interfaces + a **frozen card-ID snapshot + golden progress fixture** (changing an `id` silently wipes Leitner state); (5) content + accuracy fixes done.
- **Then the overnight workflow builds only the UI to that frozen design,** with HARD CI gates: Playwright **visual-regression** at 3 breakpoints vs the mockup baseline, an **offline e2e** test (setOffline → app + flashcard + audio work), **axe a11y** on every route+state, and the **progress-migration golden fixture**. Plus an **adversarial self-review pass** (screenshot each screen → diff vs mockup → list every generic-default/missing-interaction/unlabeled control → fix), wiring the repo's `interface-design:critique` / `web-quality-audit` / `accessibility` skills.
- **Mandatory morning human checkpoint** on a real phone + laptop: visual fidelity, screen-reader focus order, real-device offline, "does a session feel good." Axe tops out at ~30–40% of WCAG by criterion; automation can't certify "feels premium."

## Scope reality
This is **bigger than one overnight workflow.** Decompose into phases: **(1) Content + accuracy** (accuracy-sensitive, checkpointed) → **(2) Foundation** (scaffold + engine port + tokens + pinned deps; human-verified Step 0) → **(3) Autonomous overnight UI build** to the locked design with hard gates → **(4) Morning verify + deploy** (Cloudflare Pages).

## Key sources
Dunlosky 2013 (retrieval/spacing high-utility); generation effect (Slamecka & Graf; d≈0.40); hypercorrection (Butterfield & Metcalfe); interleaving (Kornell & Bjork 59% vs 36%); dual-coding (Paivio/Mayer); verbal overshadowing in wine cognition; Duolingo onboarding/feedback/streak research; Brainscape CBR; vite-pwa SvelteKit + adapter-static SPA; Svelte 5 runes; vitest-browser-svelte + axe-core/playwright; 2026 autonomous-AI-build risk (RAIL, Verdent). (Full URLs in the agent transcripts.)
