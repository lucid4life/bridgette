# V3 research digest — 2026-06-11

Five parallel research passes commissioned for the v3 ground-up redesign.
This file is the canonical input for the v3 build session — do not re-research.

---

## 1. Hypercritical UX/IA audit of v2 (fresh-eyes, first-principles)

1. **The user's actual job is invisible on mobile**: Food/Bar/Wine track hubs are sidebar-only, so on the phone he carries at work the food-runner playbook is unreachable from the nav — buried behind three buttons on /today.
2. **"On the Floor" contains zero food-runner content**: its only two views are wine substitutions and wine pairings, while seat numbers, the table map, and allergen rules live in /food, a page the tab bar can't reach.
3. **Home ('/') is a wine-exam launcher**: 5 of 7 hero cards (Mystery Pour, Pairing Explorer, Guest Simulator, Readiness, Mock Exam) are wine; Dish Components/Allergens/Builds are undifferentiated tiles in a 13-deck grid.
4. **Mock Exam tests a job he doesn't have, for an exam that doesn't exist**: EXAM_BLUEPRINT is 100% wine decks — zero components/allergens/builds — yet feeds the "shift-ready %" framing; the restaurant has no wine test (it has Wednesday tastings + assigned-bottle preshift presentations).
5. **"Continue your course" sends a day-one food runner to wine theory**: nextModule() walks by num; food modules are appended at 11–13 behind 10 wine modules.
6. **Five-plus entry points to the same drills, two competing homes** (Today vs Practice, plus hubs, Learn seedDecks, Progress weak-pills all deep-linking /?deck=).
7. **The learn→drill loop is broken at both ends**: highest-stakes day-one content (seat numbers, table map, FIFO) has no deck; wine modules link lessons that don't exist (deductive-grid alias) or have no lesson text.
8. **Jargon**: "Translator," "Mystery Pour," "Smart Review," visible Leitner internals ("box 3"), four near-identical pairing decks. Rename in guest language; collapse pairing decks.
9. **"Sommelier-lite" / "exam-day pressure" framing** serves the app's origin story, not the job. Tastings deserve a "prep my bottle" flow.

**From-scratch IA sketch (journey spine, not activity spine):** 4 tabs everywhere (mobile + desktop): home = today's role auto-staged (Week 1 Food Runner → Week 2 Bar → Week 3+ Wine); one daily-review button; merged lookup Playbook (Reference + On the Floor + Cram); mastery per stage. Lessons live inside each stage as step 1 of its drill, not a separate Learn tab.

---

## 2. Learning-science evidence brief

1. **Retrieval practice / testing effect** (Roediger & Karpicke 2006; Karpicke & Roediger 2007; Kang et al. 2007): test within the same session as first exposure; ≥70% of time testing / ≤30% studying; always show the answer as feedback.
2. **Spacing** (open-spaced-repetition benchmark ~350M reviews: FSRS-6 beats SM-2 for ~99.5% of users, ~20-30% fewer reviews — but the edge matters over months; over 14 days any 1–3-day-gap ladder captures most of the effect, Cepeda et al. 2008). **Successive relearning** (Rawson & Dunlosky 2011/2022): 3 correct recalls in session one, then 1 correct recall in ~3 spaced sessions. Use ts-fsrs (desired retention ~0.9) since it's cheap; don't block on it.
3. **Interleaving vs blocking** (Rohrer 2012; Carvalho & Goldstone): block by menu category for first exposure; switch to interleaved (look-alike dishes paired deliberately) once accuracy ~70–80% and for all review days.
4. **Cognitive load + chunking** (Cowan 2001; Sweller; Mayer; Paivio dual coding): first-exposure lessons = 4–6 dishes per chunk (41 dishes → ~8 mini-lessons); one dish per screen with photo; components in ≤4 sub-chunks; allergens as a fixed icon set. Cocktails: worked example → completion problems → full recall.
5. **Desirable difficulties + fluency illusion** (Koriat & Bjork 2005; Bjork; Kang 2007): prompt-fade per item MC → cued recall → free recall; promotion gated on correct answers, never views; no "mark as known" on read-only screens.
6. **Pretesting / errorful generation** (Kornell, Hays & Bjork 2009): open every new category with a 60-second guess-first pretest with instant reveal; frame errors as useful.
7. **Order**: Day 1 per chunk = pretest → study → test-to-criterion (3 correct). Days 2+ = retrieval only; the lesson screen reappears only after an error. Flashcards ARE the testing engine, not a separate later phase.
8. **Motivation**: streaks with one freeze (loss aversion, Duolingo data), goal-gradient progress bars, 5–15-min sessions; reward only retrieval successes; readiness % = items at criterion, not cards seen. Avoid leaderboards/points-for-rereading.

**Ideal first-exposure flow ("Starters", 5 dishes, ~12 min):** pretest 90s → teach 3 min (photo cards, ≤4 component groups, allergen icons) → MC round 2 min → cued→free recall to 3-correct per dish (~5 min, errors recycle) → mastery bar updates; scheduler queues tomorrow's interleaved review.

---

## 3. Best-in-class app teardowns — pattern stack

- **Duolingo**: single linear path (zero navigation paralysis); mistakes re-queued same-session until cleared; checkpoint test-out gates; review injected into the path. Avoid streak-guilt/hearts/leagues.
- **WaniKani**: hard Lessons-vs-Reviews separation (two buttons, two mindsets); level gating (~90% to unlock next) self-throttles workload; named SRS ranks (Apprentice→Guru→Master→Burned) make intervals legible; rank demotion on lapse. Avoid rigid 4-hour first-review timers (compress early ladder for a 2-week deadline).
- **Anki/FSRS**: NEW-cards/day is a choice, reviews/day is an obligation — never cap reviews, throttle intake; "due today" must be finishable; desired-retention as the single dial (~0.92–0.95 for a sprint). Don't expose scheduler internals.
- **Brainscape/Quizlet Learn**: confidence rating after self-reveal; question-type ladder MC → written; per-set fill meters. Accept fuzzy matching on free text.
- **Hospitality tools** (Speak Your Menu, Yelli, ShiftTrained, 1Huddle): quizzes auto-generated from structured menu data (we have this — keep frozen card IDs); "minutes before shift" framing; 60-second burst quizzes; "shaky items" list ranked by lapses.
- **Mochi/RemNote**: cards live IN the notes — the dish page IS the card source; entity templates stamp consistent card sets; tap an ingredient → every dish containing it.

**Pattern stack for Bridgette:** (1) Home = one big Continue + due-count + shaky strip. (2) Single linear path per role-phase, units gated ~85%. (3) Daily loop = reviews-first → capped new lessons (~8/day) → optional 60-sec burst. (4) Sessions 3–5 min, misses re-queued until cleared. (5) Ladder MC → cloze → free recall; allergens get confidence. (6) Named ranks + per-unit meters, demotion on lapse. (7) Never cap reviews. (8) Test-out per unit. (9) Pre-shift 2-min shaky-items mode. (10) All cards generated from menu data.

---

## 4. Tech stack verdict

1. **Keep SvelteKit 2 + Svelte 5 runes + adapter-static + vite-plugin-pwa.** iOS installed PWAs are exempt from Safari's 7-day storage cap (WebKit storage policy); iOS 16.4+ Web Push; navigator.storage.persist() since iOS 17. Switching to Expo/Flutter is all cost, no benefit for a solo offline phone user.
2. **Scheduler: ts-fsrs v5** (open-spaced-repetition org, mature, TS-native). Seed from box numbers; version-bumped progress key; keep Leitner math as fallback. Modest gain at 2 weeks — adopt because it's ~50 LOC, not because Leitner fails.
3. **Storage: IndexedDB via `idb` + storage.persist() + a compact localStorage snapshot mirror** (iOS IndexedDB has a corruption history; dual-write is cheap). Photos/audio blobs go in idb. Skip OPFS.
4. **Deployment: same repo, new `app-v3/` directory, second free Vercel project** (root = app-v3); v2 project (root = app/) stays untouched and live. Cut over a domain alias when v3 passes e2e.
5. **Reuse verbatim**: root src/data.js + tools/build_app_data.mjs + merge scripts; app/src/lib/engine/ pure-JS generators + engine vitest suites incl. 428 frozen card-id guard; types/maps; design tokens + tokens.test.ts; audio pipeline. **Rebuild**: routes/UI, progress store (FSRS+idb behind same interface), service-worker config; port Playwright specs as screens rebuild.
6. **2026 niceties**: Svelte {@attach} for card gestures, View Transitions API (Safari 18+), Web Speech as zero-cost pronunciation fallback, CSS scroll-driven animations as progressive enhancement.

---

## 5. Menu coverage audit (2026-06-11)

Fresh fetch+parse+diff: all four live PDFs **byte-identical to the 2026-06-09 sync**. Missing from app: NOTHING except the rotating "Bartender's Monthly Feature" (un-syncable by design; the PDF's own text layer truncates it). In-app-but-gone: none. Price changes: none. The user's "extra drinks on the website" hunch = the 57 spirits-by-the-ounce wall (out of training scope by design) and the monthly feature slot. Report: docs/menu-sync/2026-06-11-report.md. **No content gaps block v3.**
