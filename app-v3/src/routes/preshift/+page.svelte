<script lang="ts">
  // Task H — /preshift: the 2:45pm special. A two-minute review session over
  // your 12 shakiest (lapse-ranked) items. Grades DO record — this is real
  // retrieval practice, just aimed at the wobbliest calls before the floor.
  import FlashReveal from '$lib/components/session/FlashReveal.svelte';
  import KeyHints from '$lib/components/session/KeyHints.svelte';
  import SessionHeader from '$lib/components/session/SessionHeader.svelte';
  import SessionSummary from '$lib/components/session/SessionSummary.svelte';
  import TeachCard from '$lib/components/session/TeachCard.svelte';
  import { nameOf, toStage1Entries } from '$lib/components/session/util';
  import { cuedFor, freeFor, teachFor } from '$lib/journey/items';
  import { createReviewSession, type ReviewSession, type ReviewSummary } from '$lib/session';
  import { progress } from '$lib/store/progress.svelte';
  import { progressView } from '$lib/store/view';

  const SHAKY_COUNT = 12;

  let session: ReviewSession | null = $state(null);
  let empty = $state(false);
  let nonce = $state(0);
  let summary = $state<ReviewSummary | null>(null);
  let built = false;

  $effect(() => {
    if (!progress.ready || built) return;
    built = true;
    // lapse-ranked shakiest; ids outside Stage 1 are skipped (Phase 1)
    const entries = toStage1Entries(progress.shakyItems(SHAKY_COUNT), progressView(progress.state));
    if (entries.length === 0) {
      empty = true;
      return;
    }
    session = createReviewSession(entries, {
      onResult: (id, grade) => void progress.recordReview(id, grade)
    });
  });

  const step = $derived.by(() => {
    void nonce;
    return session ? session.current() : null;
  });
  const prog = $derived.by(() => {
    void nonce;
    return session ? session.progress() : null;
  });
  const phase = $derived(
    step?.type === 'reteach'
      ? 'a quick re-read'
      : step?.type === 'quiz' && step.rung === 'cued'
        ? 'with a hint'
        : 'cold recall'
  );

  function bump(): void {
    nonce += 1;
    if (session && session.isComplete() && !summary) summary = session.summary();
  }
  function grade(gotIt: boolean): void {
    session?.selfGrade(gotIt);
    bump();
  }
  function continueStep(): void {
    session?.advance();
    bump();
  }

  const missList = $derived(
    summary ? summary.perItem.filter((r) => r.missed).map((r) => ({ label: nameOf(r.itemId) })) : []
  );
</script>

<svelte:head><title>Pre-shift warm-up · Bridgette Trainer</title></svelte:head>

<div class="screen">
  {#if !progress.ready || (!session && !empty && !summary)}
    <div aria-busy="true">
      <p class="visually-hidden" role="status">Loading your warm-up</p>
      <div class="sk head-sk"></div>
      <div class="sk card-sk"></div>
    </div>
  {:else if empty}
    <p class="h-eyebrow">the 2:45 special</p>
    <h1>Pre-shift warm-up</h1>
    <p class="sub">Your shakiest calls, two minutes — right before the floor.</p>
    <div class="card light clear-card">
      <h3>nothing shaky yet</h3>
      <p class="meta">walk the path first — once an item wobbles in a quiz or review, it shows up here.</p>
      <div class="clear-actions">
        <a class="btn ghost" href="/">back to the path</a>
      </div>
    </div>
  {:else if summary}
    <SessionSummary
      eyebrow="warm-up done"
      title="walk on the floor warm"
      stats={[
        { label: 'cleared', value: summary.cleared },
        { label: 'misses', value: summary.misses }
      ]}
      note={summary.misses === 0
        ? 'every shaky call held — good sign for tonight.'
        : 'the ones that slipped are rescheduled sooner — better here than at a table.'}
      missesTitle="still wobbly"
      misses={missList}
    >
      <a class="btn" href="/today">back to today</a>
    </SessionSummary>
  {:else if step && prog}
    <SessionHeader
      title="Pre-shift warm-up"
      sub="your shakiest calls, two minutes"
      {phase}
      position={prog.position}
      total={prog.total}
      exitHref="/today"
      exitLabel="today"
    />
    {#key prog.position}
      {#if step.type === 'quiz' && step.rung === 'cued'}
        {@const c = cuedFor(step.item)}
        <FlashReveal prompt={c.prompt} hint={c.hint} answer={c.answer} allergens={c.allergens} allergenNote={c.allergenNote} confirmLine={c.confirmLine} kicker="shaky call — with a hint" ongrade={grade} note="honest call — misses come back tonight, not on the floor" />
      {:else if step.type === 'quiz'}
        {@const f = freeFor(step.item)}
        <FlashReveal prompt={f.prompt} answer={f.answer} detail={f.detail} allergens={f.allergens} allergenNote={f.allergenNote} confirmLine={f.confirmLine} kicker="shaky call — cold" ongrade={grade} note="honest call — misses come back tonight, not on the floor" />
      {:else}
        <TeachCard teach={teachFor(step.item)} eyebrow="back to this one" oncontinue={continueStep} continueLabel="Got it — continue" />
      {/if}
    {/key}
    <KeyHints />
  {/if}
</div>

<style>
  .clear-card {
    max-width: 520px;
  }
  .clear-card h3 {
    font-family: var(--font-display);
    letter-spacing: 0.02em;
  }
  .clear-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
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
    height: 280px;
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
