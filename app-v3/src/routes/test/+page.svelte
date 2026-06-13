<script lang="ts">
  // /test — "the food test": a mock of Monday night's menu test. One shuffled
  // pass over all 41 dishes; each dish is asked ONE of four ways (components
  // MC, allergen MC, reverse lookup, say-it-aloud), dealt round-robin from a
  // per-run rotation, scored at the same 0.85 bar as the shift check.
  // NO store writes — a mock never touches the SRS; the misses CTA hands you
  // to /romance, which already orders your shakiest dishes first from the
  // real review state.
  import Icon from '$lib/components/Icon.svelte';
  import FlashMc from '$lib/components/session/FlashMc.svelte';
  import KeyHints from '$lib/components/session/KeyHints.svelte';
  import RomanceCard from '$lib/components/session/RomanceCard.svelte';
  import SessionHeader from '$lib/components/session/SessionHeader.svelte';
  import SessionSummary from '$lib/components/session/SessionSummary.svelte';
  import { nameOf } from '$lib/components/session/util';
  import { allStage1Items, romanceFor } from '$lib/journey/items';
  import type { JourneyItem } from '$lib/journey/types';
  import {
    CHECKPOINT_PASS_RATIO,
    createMockTestSession,
    mockMcContentFor,
    mockQtypeOf,
    type MockQuestionType,
    type MockTestSession,
    type MockTestSummary
  } from '$lib/session';
  import { progress } from '$lib/store/progress.svelte';

  // Every dish on the path — the real test covers plates, not service calls.
  const DISHES: readonly JourneyItem[] = allStage1Items().filter((i) => i.kind === 'dish');
  const DISH_COUNT = DISHES.length; // 41
  const passPct = Math.round(CHECKPOINT_PASS_RATIO * 100);

  const TYPE_LABELS: Record<MockQuestionType, string> = {
    'components-mc': "what's on it",
    'allergen-mc': 'the flags',
    'safe-call': 'the safe call',
    'reverse-mc': 'which dish',
    romance: 'say it aloud',
    'description-mc': 'explain it',
    'mods-mc': 'can it come off'
  };
  const TYPE_KICKERS: Record<Exclude<MockQuestionType, 'romance'>, string> = {
    'components-mc': "the food test — what's on it",
    'allergen-mc': 'the food test — the flags',
    'safe-call': 'the food test — the safe call',
    'reverse-mc': 'the food test — which dish',
    'description-mc': 'the food test — explain it',
    'mods-mc': 'the food test — can it come off'
  };
  // one pass, no recycling — never promise a missed question "comes back around"
  const MISS_TEXT = 'not quite — the right call is marked. it counts, like the real thing.';

  let session: MockTestSession | null = $state(null);
  let nonce = $state(0);
  let summary = $state<MockTestSummary | null>(null);

  function start(): void {
    summary = null;
    nonce = 0;
    // default rng: every retake re-deals the order AND the question wheel
    session = createMockTestSession(DISHES);
  }

  const step = $derived.by(() => {
    void nonce;
    return session ? session.current() : null;
  });
  const prog = $derived.by(() => {
    void nonce;
    return session ? session.progress() : null;
  });
  const phase = $derived(
    step?.type === 'quiz' && step.rung === 'romance' ? 'say it aloud' : 'pick the right call'
  );

  function bump(): void {
    nonce += 1;
    if (session && session.isComplete() && !summary) summary = session.summary();
  }
  function answer(i: number) {
    return session!.answerMc(i); // the step stays current — FlashMc owns the feedback
  }
  function grade(gotIt: boolean): void {
    session?.selfGrade(gotIt);
    bump();
  }
  function continueStep(): void {
    session?.advance();
    bump();
  }

  const scorePct = $derived(summary ? Math.round(summary.score * 100) : 0);
  const typeRows = $derived(
    summary
      ? (Object.entries(summary.byType) as [MockQuestionType, { asked: number; correct: number }][])
          .filter(([, b]) => b.asked > 0)
          .map(([t, b]) => ({
            label: TYPE_LABELS[t],
            asked: b.asked,
            correct: b.correct,
            pct: Math.round((b.correct / b.asked) * 100)
          }))
      : []
  );
  const catRows = $derived(summary ? summary.byCategory : []);
  const missList = $derived(summary ? summary.missed.map((id) => ({ label: nameOf(id) })) : []);
  // Hand the misses to the romance drill as foodIds (strip the dish: prefix) so
  // "drill the misses out loud" drills EXACTLY the dishes that got away.
  const missDrillHref = $derived(
    summary && summary.missed.length > 0
      ? `/romance?drill=${summary.missed.map((id) => id.replace(/^dish:/, '')).join(',')}`
      : '/romance'
  );
</script>

<svelte:head><title>The food test · Bridgette Trainer</title></svelte:head>

<div class="screen">
  {#if !progress.ready}
    <div aria-busy="true">
      <p class="visually-hidden" role="status">Loading the food test</p>
      <div class="sk head-sk"></div>
      <div class="sk card-sk"></div>
    </div>
  {:else if summary}
    <SessionSummary
      eyebrow={summary.passed ? 'mock passed — at the real bar' : 'below the bar — that’s what mocks are for'}
      title={summary.passed ? 'monday-night ready' : 'keep drilling'}
      ringPct={scorePct}
      ringText={`${scorePct}%`}
      stats={[
        { label: 'correct', value: `${summary.correct}/${summary.total}` },
        { label: 'pass bar', value: `${passPct}%` }
      ]}
      note={summary.passed
        ? summary.missed.length === 0
          ? 'a clean sweep. walk in Monday and answer exactly like that.'
          : 'a pass with a few wobbles — say the missed ones out loud once and they’re gone.'
        : 'every miss below is one fix. drill them out loud and run it again — the retake deals new questions.'}
      missesTitle="the dishes that got away"
      misses={missList}
    >
      {#snippet extra()}
        <div class="brk">
          <p class="brk-t">by question type</p>
          <div class="bars">
            {#each typeRows as r (r.label)}
              <div class="bar-row">
                <span class="bar-label">{r.label}</span>
                <span class="bar" aria-hidden="true"><span class="bar-fill" style:width="{r.pct}%"></span></span>
                <span class="bar-n" class:clean={r.correct === r.asked}>{r.correct}/{r.asked}</span>
              </div>
            {/each}
          </div>
          <p class="brk-t">by category</p>
          <ul class="cats">
            {#each catRows as c (c.category)}
              <li>
                <span class="cat-name">{c.category}</span>
                <span class="cat-n" class:clean={c.correct === c.asked}>{c.correct}/{c.asked}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/snippet}
      {#if missList.length > 0}
        <a class="btn" href={missDrillHref}>drill the {missList.length} misses out loud</a>
        <button type="button" class="btn ghost" onclick={start}>take it again</button>
      {:else}
        <a class="btn" href="/today">back to today</a>
        <button type="button" class="btn ghost" onclick={start}>take it again</button>
      {/if}
      {#if missList.length > 0}
        <p class="rom-note">that drills exactly the {missList.length} you missed — say each one out loud till it holds.</p>
      {/if}
    </SessionSummary>
  {:else if step && prog}
    <SessionHeader
      title="The food test"
      sub="the mock — dealt fresh every run"
      {phase}
      position={prog.position}
      total={prog.total}
      exitHref="/today"
      exitLabel="today"
    />
    {#key prog.position}
      {#if step.type === 'quiz' && step.rung === 'romance'}
        <RomanceCard
          content={romanceFor(step.item)}
          kicker="the food test — say it aloud"
          ongrade={grade}
        />
      {:else if step.type === 'quiz'}
        <!-- mockMcContentFor IS what the session grades — render the same truth
             (the allergen slot alternates classic vs NOT-a-flag by item parity). -->
        {@const qtype = mockQtypeOf(step) as Exclude<MockQuestionType, 'romance'>}
        {@const mc = mockMcContentFor(step.item, qtype)}
        <FlashMc
          {mc}
          why={'why' in mc ? (mc.why as string) : undefined}
          confirmLine={'confirmLine' in mc ? (mc.confirmLine as string) : undefined}
          missText={MISS_TEXT}
          kicker={TYPE_KICKERS[qtype]}
          onanswer={answer}
          oncontinue={continueStep}
        />
      {/if}
    {/key}
    <KeyHints />
  {:else}
    <!-- deliberate entry: a test is walked into, not stumbled into -->
    <section class="intro on-cream">
      <span class="i-mark" aria-hidden="true"><Icon name="exam" size={22} /></span>
      <p class="i-eyebrow">for monday night · the mock</p>
      <h1 class="i-title">the food test</h1>
      <p class="i-line">{DISH_COUNT} dishes · scored like the real thing</p>
      <ul class="i-rules">
        <li>mixed questions — components, flags, safe calls for allergic guests, which-dish, explain-it, can-it-come-off, and say-it-aloud: every dish gets one, dealt fresh each run</li>
        <li>pass at {passPct}% — the same bar as the shift check</li>
        <li>nothing touches your reviews — a mock costs nothing, retake it as often as you like</li>
      </ul>
      <div class="i-actions">
        <button type="button" class="btn gold" onclick={start}>start the test</button>
        <a class="btn ghost" href="/today">not yet — back to today</a>
      </div>
    </section>
  {/if}
</div>

<style>
  .intro {
    max-width: 520px;
    margin: 0 auto;
    padding: 30px 28px;
    background: var(--surface-paper);
    color: var(--text-body);
    border-radius: var(--radius-flash);
    border-top: 3px solid var(--bb-marigold); /* gold — a test is a gate's room */
    box-shadow: var(--shadow-flash);
    text-align: center;
    animation: card-in 0.25s ease;
  }
  @keyframes card-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .i-mark {
    width: 48px;
    height: 48px;
    margin: 0 auto;
    display: grid;
    place-items: center;
    border-radius: 14px;
    border: 2px solid var(--highlight-line);
    color: var(--highlight);
    background: var(--bb-paper);
    box-shadow: var(--shadow-1);
  }
  .i-eyebrow {
    margin: 14px 0 2px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--highlight);
  }
  .i-title {
    margin: 0;
    font-size: clamp(28px, 5vw, 38px);
    font-weight: 300;
    letter-spacing: 0.02em;
    color: var(--text-strong);
  }
  .i-line {
    margin: 6px 0 0;
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--accent-text);
  }
  .i-rules {
    list-style: none;
    margin: 18px auto 0;
    padding: 14px 0 0;
    max-width: 40ch;
    border-top: 1px solid color-mix(in srgb, var(--highlight-line) 45%, transparent);
    display: grid;
    gap: 8px;
    text-align: left;
  }
  .i-rules li {
    position: relative;
    padding-left: 16px;
    font-size: 13.5px;
    line-height: 1.5;
    color: var(--text-muted);
  }
  .i-rules li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--highlight-line);
  }
  .i-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 22px;
  }

  /* ---- results breakdowns (rendered inside SessionSummary's extra slot,
         on the cream sum-card — print-ink tones, marigold rules) ---- */
  .brk {
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid color-mix(in srgb, var(--highlight-line) 45%, transparent);
    display: grid;
    gap: 10px;
  }
  .brk-t {
    margin: 0;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-label);
  }
  .bars {
    display: grid;
    gap: 7px;
  }
  .bar-row {
    display: grid;
    grid-template-columns: 92px 1fr 44px;
    align-items: center;
    gap: 10px;
  }
  .bar-label {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: lowercase;
    color: var(--text-body);
    text-align: left;
  }
  .bar {
    height: 8px;
    border-radius: 4px;
    background: color-mix(in srgb, var(--highlight-line) 28%, transparent);
    overflow: hidden;
  }
  .bar-fill {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--bb-marigold);
  }
  .bar-n,
  .cat-n {
    font-family: var(--font-display);
    font-size: 12.5px;
    font-weight: 700;
    color: var(--text-muted);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .bar-n.clean,
  .cat-n.clean {
    color: color-mix(in srgb, var(--ok) 70%, var(--text-strong));
  }
  .cats {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 22px;
  }
  .cats li {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: 13px;
  }
  .cat-name {
    color: var(--text-body);
  }
  .rom-note {
    flex-basis: 100%;
    margin: 4px 0 0;
    font-size: 12.5px;
    font-style: italic;
    color: var(--text-muted);
  }

  /* skeleton — quiet pulse; the global reduced-motion rule stills it */
  .sk {
    background: var(--surface-card);
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    margin: 0 auto 16px;
    animation: sk-pulse 1.2s ease-in-out infinite alternate;
  }
  .head-sk {
    max-width: 560px;
    height: 84px;
  }
  .card-sk {
    max-width: 520px;
    height: 320px;
    border-radius: var(--radius-flash);
  }
  @keyframes sk-pulse {
    from {
      opacity: 0.55;
    }
    to {
      opacity: 1;
    }
  }
</style>
