# Session Launch Prompts — Bridgette Training Tool

Paste one prompt into a **fresh Claude Code session** opened in `C:\Users\abeek\OneDrive\Documents\Bridgette Barr`. Run them in order. The **first word(s)** of each prompt set the Claude Code thinking budget — keep them.

**Effort levels (Opus 4.8 — set with `/effort <level>` at the start of each fresh session).** Five levels: low · medium · high · xhigh · max. On Opus 4.8 **`high` is the default and suits most coding**, so it's the baseline here; the research-heavy and logic-heavy sessions (S1b, S2, S5) bump to **`xhigh`** for deeper reasoning. `max` is session-only (can't be a settings default) — use it only if S2's engine logic stalls. Note: typed keywords don't set effort — use `/effort` (only `ultrathink` does anything, and just as a one-turn nudge).

| Session | Effort level | Set with | Runs | Slash commands |
|---|---|---|---|---|
| S1a Refactor + bundler + git | **high** | `/effort high` | first, alone | `/code-review` |
| S1b Data enrichment + accuracy | **xhigh** | `/effort xhigh` | after S1a | `/code-review` |
| S2 Engine + Practice + Progress | **xhigh** (→ max only if it stalls) | `/effort xhigh` | after S1b (∥ S3 w/ worktree) | `/code-review`, `/run` |
| S3 Wine School | **high** | `/effort high` | after S1b (∥ S2 w/ worktree) | `/code-review`, `/run` |
| S4 Decks + Readiness Check | **high** | `/effort high` | after S2 (& S3) | `/code-review`, `/run` |
| S4.5 Pronunciation audio (TTS) | **xhigh** | `/effort xhigh` | after S4, before S5 | `/code-review` |
| S5 Polish + a11y + final QA | **xhigh** | `/effort xhigh` | last, alone | `/code-review` |

`/security-review` is **not** needed anywhere (static app, no backend, no secrets).

## Before you paste ANY prompt (applies to all 6 sessions)

1. **Set effort first.** In the fresh session, type the session's `/effort <level>` (from the table) *before* pasting its prompt.
2. **Browser-verification fallback.** This machine has a history of local browser-automation crashes (`windows sandbox failed`). Each session's in-browser smoke test should try the Playwright or Claude-in-Chrome MCP first; **if automation fails, ASK Adrian to open the file and confirm the listed flows** — never skip the visual check or claim a pass that wasn't observed.
3. **Never guess a menu fact.** If a wine name, region, price, vintage, pronunciation, or allergen is ambiguous, check `source_menus/` or ASK Adrian — wrong facts get memorized.
4. **Report before stopping.** End each session with a short summary of what changed plus the passing verification output (per `superpowers:verification-before-completion`).

---

## S1a — Structural refactor + bundler + git

```
You are building Session 1a of the Bridgette Bar Calgary wine-training tool. (Effort: run /effort high in this session first.)

Read in full first:
- docs/superpowers/specs/2026-06-05-bridgette-calgary-training-tool-design.md
- docs/superpowers/plans/2026-06-05-bridgette-training-tool.md  (focus: "Conventions", "File structure", "The bundler", and "Session S1a")

Then use the superpowers:writing-plans skill to expand the S1a task list into a bite-sized TDD plan at docs/superpowers/plans/2026-06-05-session-S1a.md, then execute it with superpowers:executing-plans.

SCOPE — do ONLY this, no new features, no content changes:
Split the existing Bridgette_Bar_Calgary_Menu_Wine_Pairing_Dashboard.html into src/index.html + src/styles.css + src/data.js + src/app.js, behavior-identical. Move the WINE/FOOD/COCKTAILS/etc. arrays VERBATIM into window.BB.data (rename keys to wines/foods/cocktails/...) and add stable `id` slugs (the only addition). Write build_single_file.py (the complete code is in the master plan) that inlines src/ into dist/Bridgette_Training.html. git init with a .gitignore for dist/, verification/chrome-profile*/, __pycache__/. Create tests/check_training.py (data parses via Node --check, unique ids, wine names appear in source_menus/, bundler output byte-identical). Keep the legacy HTML at root for rollback.

MUST OBEY: no ES modules / no framework / classic <script src> only (must open from file:// offline). No menu strings in app.js — read from window.BB.data. Preserve the Bridgette palette and every existing feature (search, filters, notes, print, save).

WHEN DONE: run tests/check_dashboard.py, tests/check_dashboard_contrast.py, and tests/check_training.py; open src/index.html in a browser and confirm it looks and behaves identically to the legacy file. Use superpowers:verification-before-completion and SHOW the passing output before claiming done. Then run /code-review, fix findings, and commit.

This session runs ALONE and blocks all others. Do not start later sessions' work.
```

---

## S1b — Data enrichment + accuracy verification

```
You are building Session 1b of the Bridgette Bar Calgary wine-training tool. (Effort: run /effort xhigh in this session first.) Accuracy is the #1 priority — wrong data gets memorized as fact, so if any fact is ambiguous, check source_menus/ or ask Adrian rather than guess.

Read in full first:
- docs/superpowers/specs/2026-06-05-bridgette-calgary-training-tool-design.md  (esp. §6 data model, §13 accuracy safeguard)
- docs/superpowers/plans/2026-06-05-bridgette-training-tool.md  (focus: "The data contract" and "Session S1b")
- docs/research/2026-06-05-research-convergence.md
- source_menus/calgary-drink.txt and calgary-food.txt (ground truth for names/accents)

Then use superpowers:writing-plans to expand the S1b tasks into a TDD plan at docs/superpowers/plans/2026-06-05-session-S1b.md, then execute with superpowers:executing-plans.

SCOPE: enrich src/data.js to the full contract — for every wine add pronunciation.respell (VERIFY each against an authoritative wine-pronunciation source via web search; the respelling is the source of truth), structure as low/medium/high using the WSET 3-point scale (seed from grape/region norms; where you cannot confirm, keep conservative and avoid false precision), tenSecond pitch, optional mnemonic, country, vegan, pair as arrays. Fix all names/accents to match source_menus/ (e.g. Hiedler Löss, Dürkheimer, Cusumano). Convert the static "Common guest ask translator" HTML table into data.translator[] and render it from data in app.js (delete the static <table>). Add data.lessons[] stubs (ids + titles only) as learnLink anchors for later. For every food add a `why` (the structural pairing reason, WSET levers).

MUST OBEY: the convergence findings — structure is low/medium/high, NOT 1–5. Do not assert unverified sensory facts; label uncertain structure conservatively. Keep window.BB.data shape exactly as the master plan's contract.

WHEN DONE: extend tests/check_training.py (every wine has pronunciation+structure+tenSecond; structure values are in the allowed set; translator non-empty; names still match source); run all tests; spot-check 5 pronunciations and 5 structure ratings against your sources and show the citations. Use superpowers:verification-before-completion. Then /code-review, fix, commit.

Runs after S1a, alone. Blocks S2, S3, S4.
```

---

## S2 — Learning engine + Practice + Progress

```
You are building Session 2 of the Bridgette Bar Calgary wine-training tool — the Leitner engine and Practice/Progress UI. This is the most logic-heavy session. (Effort: run /effort xhigh first; switch to /effort max only if the engine logic stalls.)

Read in full first:
- docs/superpowers/specs/2026-06-05-bridgette-calgary-training-tool-design.md  (esp. §6, §8, §12)
- docs/superpowers/plans/2026-06-05-bridgette-training-tool.md  (focus: "Session S2" with the engine interfaces)
- docs/research/2026-06-05-research-convergence.md  (the corrected numeric defaults)

Then use superpowers:writing-plans to expand S2 into a TDD plan at docs/superpowers/plans/2026-06-05-session-S2.md. Use superpowers:test-driven-development for the engine (it is highly testable), then executing-plans. Use the frontend-design skill for the Practice/Progress UI and the accessibility skill for keyboard + aria — but EXTEND the existing Bridgette design system, never replace it.

SCOPE: create src/training.js — Leitner 5-box engine with BOX_DUE_DAYS {1:0,2:1,3:3,4:7,5:14}; correct→+1 box; wrong→demote ONE box, reset to box 1 only after two consecutive misses; day-based due dates. buildSession(deckId|null) capping NEW cards at ~9 and total at ~18 (Smart Review = mixed due+weak when deckId null). Adaptive difficulty by box: 1–2 multiple-choice + worked example, 3–4 typed (normalizeAnswer + alias/token match + an "I got it / I didn't" self-override), 5 scenario. Practice UI: flashcard flip (fade fallback under prefers-reduced-motion), quiz, keyboard (Space flip, 1–4 choose/grade, Enter next), aria-live feedback. Progress surface: mastery rings per deck AND per tag (with text-equivalent aria labels), weak list, LENIENT streak (1 grace day), guided first-run path, Export/Import progress (JSON). Persist to localStorage bb_progress_v1 with schema-migration on load (new ids → box 1, orphan ids dropped).

MUST OBEY: vanilla JS, classic script, file://-safe; cap new cards separately from session size; lenient lapse + lenient streak per the research; no hard reset on a single miss.

WHEN DONE: run engine unit tests (grade, isDue, buildSession, normalizeAnswer, gradeTyped) + all Python checks; in a browser, run one Focus and one Mixed session, reload and confirm box/due/mastery/streak persisted, and export→import round-trips. Use /run or /verify to drive it, and superpowers:verification-before-completion. Then /code-review, fix, commit.

Depends on S1b. CAN run in parallel with S3 ONLY if you are in a dedicated git worktree (you both touch index.html/styles.css). If not in a worktree, run S2 and S3 back-to-back. Build only S2.
```

---

## S3 — Wine School fundamentals

```
You are building Session 3 of the Bridgette Bar Calgary wine-training tool — the Wine School lessons for a beginner. (Effort: run /effort high in this session first.)

Read in full first:
- docs/superpowers/specs/2026-06-05-bridgette-calgary-training-tool-design.md  (esp. §10, §3 pedagogy)
- docs/superpowers/plans/2026-06-05-bridgette-training-tool.md  (focus: "Session S3")
- docs/research/2026-06-05-research-convergence.md  (WSET levers + 3-point scale)

Then use superpowers:writing-plans to expand S3 into a TDD plan at docs/superpowers/plans/2026-06-05-session-S3.md, then executing-plans. Use the frontend-design + accessibility skills for the lesson UI, extending the existing Bridgette design system.

SCOPE: create src/wineschool.js and fill data.lessons[] bodies. Lessons (each = short body + worked example + one quick check): what the structure words mean (acidity/body/tannin/sweetness, using THIS list's wines as examples); how to taste in 4 steps; the 6 pairing levers with exact WSET phrasings (acidity cuts fat; tannin binds protein & fat; salt softens tannin & lifts fruit; sweetness tames chili heat; avoid high-tannin red with spice; match intensity); a pronunciation primer for the sounds in these names; and "talking to a guest" (Ask → Match → Explain → Confirm). Add the beginner deductive-grid tool (pick structure clues → reveal a likely grape/style from the list). Ensure each lesson id is a stable learnLink target for S4's cards.

MUST OBEY: vanilla JS, classic script, file://-safe; 3-point low/medium/high framing (not 1–5); aria-live on quick-check results; keyboard-operable interactive bits.

WHEN DONE: confirm every §10 lesson renders with a worked example + working quick check, and the deductive grid returns sensible results; run all Python checks; drive it with /run. Use superpowers:verification-before-completion, then /code-review, fix, commit.

Depends on S1b. CAN run parallel with S2 ONLY in a separate git worktree; otherwise run after S2. Build only S3.
```

---

## S4 — Decks, content depth & Readiness Check

```
You are building Session 4 of the Bridgette Bar Calgary wine-training tool — the five practice decks and the Readiness Check. (Effort: run /effort high in this session first.)

Read in full first:
- docs/superpowers/specs/2026-06-05-bridgette-calgary-training-tool-design.md  (esp. §9)
- docs/superpowers/plans/2026-06-05-bridgette-training-tool.md  (focus: "Session S4")

Then use superpowers:writing-plans to expand S4 into a TDD plan at docs/superpowers/plans/2026-06-05-session-S4.md. Use superpowers:test-driven-development for the deck generators, then executing-plans.

SCOPE: in src/training.js add five pure deck generators (data → Card[]): Translator (ask → bestGlass + phrase), Wine Identity (name↔grape/region/style + structure), Pronunciation (name → respell + speak button via Web Speech API with utterance.lang from wine.country, respelling always visible), Pairing+why (dish → BTG AND the structural reason; box-5 = open scenario), Structure (low/med/high discrimination). Every generated card sets learnLink to the relevant Wine School lesson id. Add the Readiness Check: sample cards across all live decks, score % shift-ready, compute weak areas by tag, write results to progress.readiness.

MUST OBEY: decks are pure functions reading window.BB.data; feed the S2 engine (don't fork it); cards carry learnLink; pronunciation never relies on audio alone.

WHEN DONE: run the deck assertions in tests/check_training.py (each deck ≥1 valid card, correct answer keys) + all Python checks; in a browser, drill each deck end-to-end through the engine and run a Readiness Check (confirm score + weak-area list); /run to verify the speak button. Use superpowers:verification-before-completion, then /code-review, fix, commit.

Depends on S2 + S1b + S3. Build only S4.
```

---

## S4.5 — Pronunciation audio (human-sounding TTS)

```
You are building Session 4.5 of the Bridgette Bar Calgary wine-training tool — replacing the robotic browser text-to-speech with high-quality, human-sounding, CORRECTLY pronounced audio for every wine name. (Effort: run /effort xhigh in this session first.)

Read in full first:
- docs/superpowers/specs/2026-06-05-bridgette-calgary-training-tool-design.md  (esp. §9 Pronunciation deck, §12 audio accessibility)
- docs/superpowers/plans/2026-06-05-bridgette-training-tool.md
- docs/research/2026-06-05-pronunciation-structure-sources.md  (the verified respellings + citations from S1b)
- the project memory note (build status: S1a–S4 should be complete before this runs)

Then use superpowers:writing-plans to expand this into a TDD-style plan at docs/superpowers/plans/2026-06-05-session-S4_5.md, then execute with superpowers:executing-plans.

ARCHITECTURE (critical — read twice): the app is offline, single-file-shippable, no backend. We must NOT call a TTS API at runtime (an API key in a shared file would be exposed, and it would need internet every play). Instead we PRE-GENERATE one audio clip per wine ONCE and base64-embed them in a new src/audio.js as window.BB.audio = { "<wine-id>": "data:audio/mpeg;base64,..." }. The app plays the clip and falls back to the existing Web Speech API only when a clip is missing or fails to load. The bundler already inlines src/audio.js into the single dist file, so this keeps it offline + one-file shareable.

TTS TOOL — Adrian will choose; default ElevenLabs:
- ElevenLabs (best human quality, eleven_multilingual_v2): Adrian provides a free API key. Use it ONLY at generation time via an environment variable or an untracked local file — NEVER commit the key or put it in the app. The free tier easily covers a one-time batch of ~30 short names.
- Kokoro (Apache-2.0, free, local, no account): pip-install and run it locally to generate clips; no key; cleanest licensing for sharing.
- Google Cloud TTS (Chirp 3 HD / Neural2) is the alternative if Adrian wants per-language native voices (de-DE, fr-FR, it-IT, es-ES) for maximum correctness; 1M chars/month free.
Do NOT use Groq — its standard TTS is English/Arabic only and will mispronounce the European names.

PRONUNCIATION CORRECTNESS (before generating):
1. For every wine in data.wines (all by-the-glass + any bottle wines the pronunciation deck or wine cards reference) and the distinct grape/region terms, confirm the target pronunciation against the S1b respellings plus an authoritative source (web search). Fix any that are wrong.
2. STYLE: the goal is the confident, recognizable pronunciation a sommelier uses with English-speaking Calgary guests — lightly anglicized and correct, NOT a thick native accent. Use a multilingual/native voice for authenticity but validate it serves an English-speaking floor; if a native rendering is too thick to be useful, generate that name from its respelling (or SSML/IPA where the tool supports it) instead.
3. The on-screen respelling stays the always-visible source of truth.

GENERATION (human-in-the-loop — you cannot judge audio yourself):
1. Write a small reusable generation script (tools/generate_audio.py or .js) that reads the wine list, calls the chosen TTS, and writes clips. Keep the script; .gitignore any key file.
2. Generate a SMALL preview batch first — the four hardest names (Hiedler Löss Grüner Veltliner, Ameztoi Rubentis Txakolina, Ca' del Baio Nebbiolo, Domaine Gour de Chaulé Gigondas). Have ADRIAN LISTEN and approve the voice + style before generating the rest.
3. Generate all clips. Have Adrian spot-check and flag any that sound wrong; regenerate those (different voice or phonetic input) until he approves.

INTEGRATION:
1. Create src/audio.js with the base64 clips on window.BB.audio.
2. Add <script src="audio.js"></script> to index.html before training.js.
3. Add ONE helper, e.g. playPronunciation(wineId): if window.BB.audio[wineId] exists, play it via new Audio(dataUri); on missing or error, fall back to the existing speechSynthesis path. Route EVERY existing speak button (wine cards AND the pronunciation deck) through it. Keep the aria labels and the visible respelling.

VERIFY / WHEN DONE:
- Rebuild and confirm the single dist/Bridgette_Training.html plays the human audio offline by file:// double-click, and the bundler byte-diff test passes.
- Extend tests/check_training.py: every wine that has a pronunciation also has an audio clip (or is explicitly whitelisted as Web-Speech-fallback); src/audio.js parses.
- Grep the whole tree to confirm NO API key was committed.
- Adrian confirms by ear that the clips sound human and correct — this is the real acceptance; ask him, do not claim it yourself. Use superpowers:verification-before-completion.
- Then /code-review, fix, commit.

Runs AFTER S4 and BEFORE S5. Build only Session 4.5.
```

---

## S5 — Visual polish, accessibility & final QA

```
You are building Session 5 — the final polish, accessibility pass, and QA for the Bridgette Bar Calgary wine-training tool. (Effort: run /effort xhigh first; for the accessibility/QA audit pass specifically, /effort max if it needs more depth.)

Read in full first:
- docs/superpowers/specs/2026-06-05-bridgette-calgary-training-tool-design.md  (esp. §11, §12, §15 acceptance criteria)
- docs/superpowers/plans/2026-06-05-bridgette-training-tool.md  (focus: "Session S5")

Then use superpowers:writing-plans to expand S5 into a plan at docs/superpowers/plans/2026-06-05-session-S5.md, then executing-plans.

SCOPE: visual refinement within the Bridgette design system (progress rings, flashcard flip, quiz feedback states, focused study screen, structure meters low/med/high, deductive grid — laptop-first depth, no generic-AI gradients). Run a real accessibility audit using the accessibility and web-quality-audit skills (landmarks, focus order, no keyboard traps, aria-live regions, text-equivalent labels on rings/meters, contrast including gold-on-ink and the orange-on-cream rule). Verify prefers-reduced-motion everywhere. Confirm print modes still work. Rebuild dist/Bridgette_Training.html and confirm the bundler byte-diff test passes. Optionally delete the legacy root HTML once parity is confirmed.

MUST OBEY: extend, don't replace, the Bridgette system; every spec §15 acceptance criterion must be demonstrably met.

WHEN DONE: run the FULL manual smoke test from spec §13 (search, Focus session, Mixed session, Readiness Check, export→import, notes persist on reload, a Wine School quick check, a pronunciation speak button, all print modes) and ALL Python checks. Use superpowers:verification-before-completion and show evidence for each §15 criterion. Then /code-review, fix, final commit.

Runs last, alone. Depends on all prior sessions.
```
