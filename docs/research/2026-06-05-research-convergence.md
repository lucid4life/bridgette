# Research Convergence Pass — Bridgette Training Tool

**Date:** 2026-06-05
**Method:** `multi-layer-research-convergence` skill — four evidence layers gathered to validate/challenge the two load-bearing pillars of the [training-tool spec](../superpowers/specs/2026-06-05-bridgette-calgary-training-tool-design.md): (1) the **learning engine** and its numerical defaults, (2) **wine content accuracy** (substitutions, pairings, structure framing).
**Note:** parallel research subagents were rate-limited, so the layers were gathered inline via web search by the main agent. Findings and citations below.

---

## Layer 1 — Peer-reviewed / primary learning science

- **Algorithm choice matters less than consistency.** Leitner, SM-2, and FSRS all work; the differentiator is whether the learner shows up. ([Boost Flashcards summary](https://boostflashcards.com/spaced-repetition-system), [Brainscape Academy](https://www.brainscape.com/academy/comparing-spaced-repetition-algorithms/))
- **Optimal spacing gap ≈ 20% of the retention interval** for delays of a few weeks (falling toward ~5% for one-year retention). For a 2–4 week "get fluent" horizon, that's a ~3–6 day optimal gap — which our box intervals (1/3/7 days, with 14 as maintenance) bracket well. ([Cepeda et al. 2008, *Psychological Science*](https://laplab.ucsd.edu/articles/Cepeda%20et%20al%202008_psychsci.pdf); [Cepeda et al. big-data replication](https://www.yorku.ca/ncepeda/publications/KWWR2019.pdf))
- **Expanding intervals help most at short retention horizons**; equal intervals catch up for longer horizons (Karpicke & Roediger) — so expanding early in a cram phase is appropriate.
- **Retrieval practice + spaced practice are the two highest-utility techniques; rereading/highlighting are low utility.** ([Dunlosky et al. 2013](https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html))
- **Beginners need blocked practice first, then interleaving** for durable transfer. ([interleaving/sequence-learning research, 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8476370/))
- **Novices learn from worked examples; fade guidance as expertise grows** (worked-example & expertise-reversal effects). ([Worked-example effect](https://en.wikipedia.org/wiki/Worked-example_effect))

## Layer 2 — Industry / competitor survey

- **Leitner is appropriate for *small* decks; FSRS only meaningfully wins at exam scale** (hundreds–thousands of cards), where ~20–30% fewer reviews matter. Our deck is small (~hundreds of cards). ([FSRS vs SM-2](https://www.mindomax.com/fsrs-vs-sm2-spaced-repetition-algorithm), [Leitner 2026](https://imprimo.app/blog/leitner-system-flashcards-how-it-works))
- **SM-2 has "ease hell"** (ease factor spirals down, cards over-appear). A reason to avoid it for a casual learner; Leitner has no such failure mode.
- **Anki default = 20 new cards/day, which overwhelms most learners within ~2 weeks; recommended beginner start = 10.** New material should be ~10× smaller than the review limit. ([Anki Manual — Deck Options](https://docs.ankiweb.net/deck-options.html), [LeanAnki settings](https://leananki.com/best-settings/))
- **Repeating a card many times in one day does not meaningfully aid long-term memory** — keep relearning steps minimal. (Anki Manual)
- Typical Leitner intervals in the wild: 1/3/5/8/16/31 days — same order of magnitude as ours.

## Layer 3 — Real-world user behavior

- **"Review-pile anxiety" / backlog burnout is the #1 reason people quit** spaced-repetition apps. When daily reviews exceed ~30–60 min, users fall behind and abandon. ([flashcard-community syntheses, multiple])
- **Adding new cards too fast is a top quit driver.** Sustainable rhythm > volume.
- **Lenient streaks increase engagement; strict streaks cause anxiety and abandonment** (losing a long streak is discouraging; grace/freeze days keep people going). ([Duolingo habit research](https://blog.duolingo.com/how-duolingo-streak-builds-habit/))

## Layer 4 — Wine content accuracy

- **Grüner Veltliner is "perhaps the most universally accepted alternative to Sauvignon Blanc"** — crisp, high-acid, herb-forward; differs by a white-pepper bite and more lemon/lime vs tropical/grapefruit, with more weight. Our `Sauv Blanc → Hiedler Löss Grüner` mapping and its "less grassy, more white-peppery" note are **accurate**. ([Wine Enthusiast](https://www.wineenthusiast.com/basics/grapes-101/sauvignon-blanc-alternatives/), [Wine Folly](https://winefolly.com/tips/savvy-sauvignon-blanc-substitutes/))
- **Pinot Blanc (Weissburgunder) ↔ Pinot Grigio are "generally quite similar"**; Pinot Blanc softer/rounder/almond-floral, Pinot Grigio zestier/citrus. Our `Pinot Grigio → Wagner Stempel Weissburgunder` mapping and its "softer, calmer" note are **accurate**. ([Firstleaf](https://www.firstleaf.com/a/wine-directory/compare-wines/pinot-blanc-vs-pinot-grigio), [Jancis Robinson](https://www.jancisrobinson.com/learn/grape-varieties/white/pinot-blanc))
- **WSET pairing levers confirmed textbook-correct:** acidity cuts fat/refreshes; tannin binds protein & fat (Cab + steak); salt softens tannin & lifts fruit; off-dry Riesling tames chili heat; high-tannin red + spice amplifies heat (avoid). ([WSET four rules](https://www.wsetglobal.com/knowledge-centre/blog/2023/july/13/four-rules-to-masterful-food-and-wine-pairing))
- **WSET SAT teaches beginners on a 3-point low/medium/high scale, refining to 5-point later.** Our structure meters should use **low/medium/high**, not 1–5 — more authentic *and* lower false-precision/accuracy risk. ([WSET SAT explained](https://www.winewithseth.com/winewiki/wset-systematic-approach-to-tasting-sat-appearance-nose-palate-conclusions))

---

## Convergence check & resulting spec changes

**High-confidence LOCK — engine = Leitner.** All three engine layers converge: science (algorithm < consistency), industry (Leitner fine for small decks; FSRS only wins at exam scale), user-behavior (the killer is backlog, not the algorithm). Divergence from "modern apps use FSRS" is justified by deck size.

**Changes forced into the spec (the value of the pass — first-pass single-source defaults needed refinement):**

| # | Change | Layers that converged |
|---|--------|----------------------|
| 1 | **Separate new-card cap (~8–10/session) from total session size (~15–20).** Originally conflated. | Science (cognitive load) + Industry (Anki 20→overwhelm) + User (backlog = #1 quit) |
| 2 | **Soften lapse:** demote one box (reset to box 1 only after 2 consecutive misses), brief same-session re-show. | Industry (ease hell / relearning) + User (hard resets inflate the pile) |
| 3 | **Add backlog protection** + "you're caught up" framing; cap overdue carryover. | User-behavior |
| 4 | **Lenient streak** (grace/freeze day), never punitive. | User-behavior |
| 5 | **Structure scale → low/medium/high (WSET 3-point)**, not 1–5. | Wine + reduces accuracy risk |
| 6 | Keep intervals 0/1/3/7/14 (≈20%-of-delay rule); 14d = maintenance. | Science (confirm) |

**De-risked:** the substitution mappings and pairing "why" logic — the content I feared most — were *independently validated* against wine authorities. The accuracy safeguard in §13 still applies to per-wine structure ratings and pronunciations.

**Net:** like a textbook convergence pass, several load-bearing numeric defaults changed (items 1–5), the core architecture was confirmed (Leitner), and the highest-stakes content risk was substantially reduced.
