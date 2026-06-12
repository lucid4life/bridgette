<script lang="ts">
  // Task H — /checkpoint/[stageId]: "Shift check: Food" — the stage gate AND
  // the test-out, taken cold. Deliberate entry (intro screen + start button);
  // the engine emits NO store events during the run — pass/fail effects are
  // applied HERE from summary(): the checkpoint itself records as a 'gate'
  // pass; any still-unfinished lesson units record as 'test-out'.
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Icon from '$lib/components/Icon.svelte';
  import FlashMc from '$lib/components/session/FlashMc.svelte';
  import FlashReveal from '$lib/components/session/FlashReveal.svelte';
  import KeyHints from '$lib/components/session/KeyHints.svelte';
  import SessionHeader from '$lib/components/session/SessionHeader.svelte';
  import SessionSummary from '$lib/components/session/SessionSummary.svelte';
  import TeachCard from '$lib/components/session/TeachCard.svelte';
  import { stage1ItemById } from '$lib/components/session/util';
  import { CHECKPOINT_PASS_RATIO, unitComplete } from '$lib/journey/gating';
  import { allStage1Items, cuedFor, freeFor, mcFor, teachFor } from '$lib/journey/items';
  import { CHECKPOINT_UNIT_ID, stageById } from '$lib/journey/stages';
  import {
    createCheckpointSession,
    type CheckpointSession,
    type CheckpointSummary
  } from '$lib/session';
  import { progress } from '$lib/store/progress.svelte';
  import { progressView } from '$lib/store/view';

  const STAGE_ID = 'food-runner';
  const stageId = $derived(page.params.stageId ?? '');

  // Only the food-runner checkpoint exists in Phase 1.
  $effect(() => {
    if (stageId !== STAGE_ID) void goto('/');
  });

  const itemCount = allStage1Items().length;
  const passPct = Math.round(CHECKPOINT_PASS_RATIO * 100);

  let session: CheckpointSession | null = $state(null);
  let nonce = $state(0);
  let summary = $state<CheckpointSummary | null>(null);

  function start(): void {
    summary = null;
    nonce = 0;
    session = createCheckpointSession(allStage1Items());
  }

  const step = $derived.by(() => {
    void nonce;
    return session ? session.current() : null;
  });
  const prog = $derived.by(() => {
    void nonce;
    return session ? session.progress() : null;
  });

  function bump(): void {
    nonce += 1;
    if (session && session.isComplete() && !summary) {
      const s = session.summary();
      applyOutcome(s);
      summary = s;
    }
  }
  function answer(i: number) {
    return session!.answerMc(i);
  }
  function grade(gotIt: boolean): void {
    session?.selfGrade(gotIt);
    bump();
  }
  function continueStep(): void {
    session?.advance();
    bump();
  }

  /** Pass → the checkpoint records as 'gate' ALWAYS (it was just SAT — it is
   * the one unit that can never be tested out of, it IS the test); any lesson
   * units still incomplete were skipped over, so they record as 'test-out'. */
  function applyOutcome(s: CheckpointSummary): void {
    if (!s.passed) return;
    const view = progressView(progress.state);
    const stage = stageById(STAGE_ID);
    void progress.completeUnit(CHECKPOINT_UNIT_ID, 'gate');
    for (const u of stage.units) {
      if (u.id === CHECKPOINT_UNIT_ID) continue;
      if (!unitComplete(u.id, view)) void progress.completeUnit(u.id, 'test-out');
    }
  }

  /** Misses grouped by home unit — "revisit: Pasta (2 misses)" → /unit/pasta. */
  const missRows = $derived.by(() => {
    if (!summary) return [];
    const counts = new Map<string, number>();
    for (const r of summary.perItem) {
      if (r.correct) continue;
      const item = stage1ItemById(r.itemId);
      if (!item) continue;
      counts.set(item.unitId, (counts.get(item.unitId) ?? 0) + 1);
    }
    return stageById(STAGE_ID)
      .units.filter((u) => counts.has(u.id))
      .map((u) => {
        const n = counts.get(u.id) ?? 0;
        return {
          label: `revisit: ${u.title} (${n} ${n === 1 ? 'miss' : 'misses'})`,
          href: `/unit/${u.id}`
        };
      });
  });
  const scorePct = $derived(summary ? Math.round(summary.score * 100) : 0);
</script>

<svelte:head><title>Shift check: Food · Bridgette Trainer</title></svelte:head>

<div class="screen">
  {#if !progress.ready}
    <div aria-busy="true">
      <p class="visually-hidden" role="status">Loading the shift check</p>
      <div class="sk card-sk"></div>
    </div>
  {:else if summary}
    <SessionSummary
      eyebrow={summary.passed ? 'shift check passed' : 'not this time — and that’s fine'}
      title={summary.passed ? 'food runner — locked in' : 'keep walking the path'}
      ringPct={scorePct}
      ringText={`${scorePct}%`}
      stats={[
        { label: 'correct', value: `${summary.correct}/${summary.total}` },
        { label: 'pass bar', value: `${passPct}%` }
      ]}
      note={summary.passed
        ? 'the whole food stage is marked done behind you — reviews keep it warm from here.'
        : `you need ${passPct}% — closer than it feels. the units below are where the points went.`}
      missesTitle={summary.passed ? 'worth a revisit anyway' : 'where the misses live'}
      misses={missRows}
    >
      {#if summary.passed}
        <a class="btn" href="/">back to the path</a>
      {:else}
        <a class="btn" href="/">keep walking the path</a>
        <button type="button" class="btn ghost" onclick={start}>run it again</button>
      {/if}
    </SessionSummary>
  {:else if step && prog}
    <SessionHeader
      title="Shift check: Food"
      phase="cold — self-graded"
      position={prog.position}
      total={prog.total}
    />
    {#key prog.position}
      {#if step.type === 'quiz' && step.rung === 'cued'}
        {@const c = cuedFor(step.item)}
        <FlashReveal prompt={c.prompt} hint={c.hint} answer={c.answer} allergens={c.allergens} allergenNote={c.allergenNote} confirmLine={c.confirmLine} kicker="shift check — service call" ongrade={grade} note="grade it like a chef is listening" />
      {:else if step.type === 'quiz' && step.rung === 'free'}
        {@const f = freeFor(step.item)}
        <FlashReveal prompt={f.prompt} answer={f.answer} detail={f.detail} allergens={f.allergens} allergenNote={f.allergenNote} confirmLine={f.confirmLine} kicker="shift check — dish, cold" ongrade={grade} note="grade it like a chef is listening" />
      {:else if step.type === 'quiz' || step.type === 'pretest-mc'}
        <!-- the engine never serves MC here; rendered for step-matrix totality -->
        <FlashMc mc={mcFor(step.item)} onanswer={answer} oncontinue={continueStep} />
      {:else}
        <TeachCard teach={teachFor(step.item)} oncontinue={continueStep} />
      {/if}
    {/key}
    <KeyHints />
  {:else}
    <!-- deliberate entry: a checkpoint is walked into, not stumbled into -->
    <section class="intro on-cream">
      <span class="i-flag" aria-hidden="true"><Icon name="flag" size={22} /></span>
      <p class="i-eyebrow">stage gate · take it cold</p>
      <h1 class="i-title">shift check: food</h1>
      <p class="i-line">{itemCount} items, cold. pass at {passPct}%.</p>
      <ul class="i-rules">
        <li>every dish and every day-one call, shuffled — no hints held back, no reteaching</li>
        <li>self-graded: say it out loud, reveal, be honest</li>
        <li>nothing touches your reviews during the run — pass, and the whole stage is marked done behind you</li>
      </ul>
      <div class="i-actions">
        <button type="button" class="btn gold" onclick={start}>start the shift check</button>
        <a class="btn ghost" href="/">not yet — back to the path</a>
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
    border-top: 3px solid var(--bb-marigold);
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
  /* the checkpoint marker from the path, carried into its own room */
  .i-flag {
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
  .sk {
    background: var(--surface-card);
    border: 1px solid var(--line);
    border-radius: var(--radius-flash);
    margin: 0 auto 16px;
    animation: sk-pulse 1.2s ease-in-out infinite alternate;
  }
  .card-sk {
    max-width: 520px;
    height: 320px;
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
