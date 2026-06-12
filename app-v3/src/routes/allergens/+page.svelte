<script lang="ts">
  // /allergens — "the allergen sweep": every flagged dish's allergen MC, the
  // part of Monday's test you can't bluff. Feedback teaches back the official
  // flags + note and ALWAYS shows the standing confirm line; a miss reteaches
  // (the full menu card) and recycles until cleared. Grades are real review
  // grades on the SAME dish:<foodId> items the path tracks.
  import Icon from '$lib/components/Icon.svelte';
  import FlashMc from '$lib/components/session/FlashMc.svelte';
  import KeyHints from '$lib/components/session/KeyHints.svelte';
  import SessionHeader from '$lib/components/session/SessionHeader.svelte';
  import SessionSummary from '$lib/components/session/SessionSummary.svelte';
  import TeachCard from '$lib/components/session/TeachCard.svelte';
  import { nameOf } from '$lib/components/session/util';
  import { allStage1Items, allergenMcFor, hasAllergenMc, romanceFor, teachFor } from '$lib/journey/items';
  import type { JourneyItem } from '$lib/journey/types';
  import {
    createAllergenSession,
    romanceOrder,
    type AllergenSession,
    type AllergenSummary
  } from '$lib/session';
  import { progress } from '$lib/store/progress.svelte';

  // Every flagged dish on the path (today: all 41 — the one flagless food is
  // off-path; the filter keeps a future menu change from crashing the drill).
  const FLAGGED: readonly JourneyItem[] = allStage1Items().filter(
    (i) => i.kind === 'dish' && hasAllergenMc(i)
  );
  const FLAGGED_COUNT = FLAGGED.length;

  let session: AllergenSession | null = $state(null);
  let nonce = $state(0);
  let summary = $state<AllergenSummary | null>(null);

  /** Asking order from the CURRENT store state — shakiest first, categories
   * interleaved (the same policy the romance drill uses). */
  function order(pool: readonly JourneyItem[]): JourneyItem[] {
    return romanceOrder(
      pool,
      progress.shakyItems(),
      (id) => !!progress.state.items[id],
      (item) => romanceFor(item).category
    );
  }

  function start(pool: readonly JourneyItem[] = FLAGGED): void {
    summary = null;
    nonce = 0;
    session = createAllergenSession(order(pool), {
      // Real grades into the real SRS — same auto-introduce rationale as the
      // romance drill: knowing every dish's flags IS the job task, so the
      // sweep always covers the whole menu (and never consumes the
      // lessonsPerDay allowance — that throttle paces the lesson path only).
      onResult: (id, grade) => void progress.recordReview(id, grade)
    });
  }

  /** Re-enter with only the just-missed dishes (re-ordered for the new state). */
  function runMisses(): void {
    if (!summary) return;
    const missed = new Set(summary.perItem.filter((r) => r.missed).map((r) => r.itemId));
    start(FLAGGED.filter((i) => missed.has(i.id)));
  }

  const step = $derived.by(() => {
    void nonce;
    return session ? session.current() : null;
  });
  const prog = $derived.by(() => {
    void nonce;
    return session ? session.progress() : null;
  });
  const phase = $derived(step?.type === 'reteach' ? 'a quick re-read' : 'call the flags');

  function bump(): void {
    nonce += 1;
    if (session && session.isComplete() && !summary) summary = session.summary();
  }
  function answer(i: number) {
    return session!.answerMc(i); // the step stays current — FlashMc owns the feedback
  }
  function continueStep(): void {
    session?.advance();
    bump();
  }

  const missList = $derived(
    summary ? summary.perItem.filter((r) => r.missed).map((r) => ({ label: nameOf(r.itemId) })) : []
  );
  const clean = $derived(summary ? summary.perItem.filter((r) => !r.missed).length : 0);
</script>

<svelte:head><title>The allergen sweep · Bridgette Trainer</title></svelte:head>

<div class="screen">
  {#if !progress.ready}
    <div aria-busy="true">
      <p class="visually-hidden" role="status">Loading the allergen sweep</p>
      <div class="sk head-sk"></div>
      <div class="sk card-sk"></div>
    </div>
  {:else if summary}
    <SessionSummary
      eyebrow="sweep done"
      title={`flags clean: ${clean}/${summary.perItem.length}`}
      stats={[
        { label: 'cleared', value: summary.cleared },
        { label: 'misses', value: summary.misses }
      ]}
      note={summary.misses === 0
        ? 'every flag called on the first look — that’s the safety half of the test banked.'
        : 'a missed flag here is the cheap kind — re-run the wobbly ones and they hold.'}
      missesTitle="call these flags again"
      misses={missList}
    >
      {#if missList.length > 0}
        <button type="button" class="btn" onclick={runMisses}>run the misses again</button>
        <a class="btn ghost" href="/test">take the food test</a>
      {:else}
        <a class="btn" href="/test">take the food test</a>
        <a class="btn ghost" href="/today">back to today</a>
      {/if}
    </SessionSummary>
  {:else if step && prog}
    <SessionHeader
      title="The allergen sweep"
      sub="every dish's flags, button-graded"
      {phase}
      position={prog.position}
      total={prog.total}
      exitHref="/today"
      exitLabel="today"
    />
    {#key prog.position}
      {#if step.type === 'quiz'}
        {@const mc = allergenMcFor(step.item)}
        <FlashMc {mc} why={mc.why} confirmLine={mc.confirmLine} kicker="the allergen sweep" onanswer={answer} oncontinue={continueStep} />
      {:else}
        <TeachCard teach={teachFor(step.item)} eyebrow="back to this one" oncontinue={continueStep} continueLabel="Got it — continue" />
      {/if}
    {/key}
    <KeyHints />
  {:else}
    <!-- deliberate entry: know what the sweep asks before the first card -->
    <section class="intro on-cream">
      <span class="i-mark" aria-hidden="true"><Icon name="shield" size={22} /></span>
      <p class="i-eyebrow">safety-critical · for monday night</p>
      <h1 class="i-title">the allergen sweep</h1>
      <p class="i-line">{FLAGGED_COUNT} dishes · every flag they carry</p>
      <ul class="i-rules">
        <li>every dish's flags — the part of the test you can't bluff</li>
        <li>four choices, button-graded; the feedback teaches back the official flags every time</li>
        <li>misses get the menu card again and come back until they're clean</li>
      </ul>
      <div class="i-actions">
        <button type="button" class="btn" onclick={() => start()}>start the sweep</button>
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
    border-top: 3px solid var(--bb-teal); /* teal — the allergen chips' own color */
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
  /* the shield mark keeps the teal identity (the i-mark frame stays marigold
     elsewhere — this room is the safety room) */
  .i-mark {
    width: 48px;
    height: 48px;
    margin: 0 auto;
    display: grid;
    place-items: center;
    border-radius: 14px;
    border: 2px solid color-mix(in srgb, var(--bb-teal) 55%, transparent);
    color: var(--bb-teal-deep);
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
    color: var(--bb-teal-deep);
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
    border-top: 1px solid color-mix(in srgb, var(--bb-teal) 35%, transparent);
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
    background: var(--bb-teal);
  }
  .i-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 22px;
  }
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
