<script lang="ts">
  // Task H — /review: the daily review queue. Retrieval only (cued/free by
  // rank); a miss records 'again' immediately, reteaches next, and retries
  // until cleared. Entries are captured ONCE at session start — the due list
  // shifting underneath mid-session must not reshape the queue.
  import FlashReveal from '$lib/components/session/FlashReveal.svelte';
  import KeyHints from '$lib/components/session/KeyHints.svelte';
  import SessionHeader from '$lib/components/session/SessionHeader.svelte';
  import SessionSummary from '$lib/components/session/SessionSummary.svelte';
  import TeachCard from '$lib/components/session/TeachCard.svelte';
  import { nameOf, toStage1Entries } from '$lib/components/session/util';
  import { cuedFor, freeFor, teachFor } from '$lib/journey/items';
  import { createReviewSession, type ReviewSession, type ReviewSummary } from '$lib/session';
  import { progress } from '$lib/store/progress.svelte';

  let session: ReviewSession | null = $state(null);
  let empty = $state(false);
  let nonce = $state(0);
  let summary = $state<ReviewSummary | null>(null);
  let built = false; // plain — entries are captured exactly once

  $effect(() => {
    if (!progress.ready || built) return;
    built = true;
    const entries = toStage1Entries(progress.dueItems(), progress.state);
    if (entries.length === 0) {
      empty = true;
      return;
    }
    session = createReviewSession(entries, {
      // confidence is captured at grade time (the reveal's optional "shaky" tap)
      // and read here — keeps the session's onResult contract unchanged.
      onResult: (id, grade) => void progress.recordReview(id, grade, pendingConfidence)
    });
  });

  // The confidence the runner reported on the CURRENT card (default 'sure' — an
  // unflagged miss is a confident miss, the hypercorrection target).
  let pendingConfidence: 'sure' | 'shaky' = 'sure';

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
  function grade(gotIt: boolean, conf: 'sure' | 'shaky' = 'sure'): void {
    pendingConfidence = conf;
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

<svelte:head><title>Reviews · Bridgette Trainer</title></svelte:head>

<div class="screen">
  {#if !progress.ready || (!session && !empty && !summary)}
    <div aria-busy="true">
      <p class="visually-hidden" role="status">Loading your reviews</p>
      <div class="sk head-sk"></div>
      <div class="sk card-sk"></div>
    </div>
  {:else if empty}
    <p class="h-eyebrow">daily review</p>
    <h1>Reviews</h1>
    <p class="sub">Retrieval keeps it warm — the queue refills as items come due.</p>
    <div class="card light clear-card">
      <h3>all clear — nothing due</h3>
      <p class="meta">come back after your next lesson, or warm up your shaky calls anyway.</p>
      <div class="clear-actions">
        <a class="btn ghost" href="/">back to the path</a>
        <a class="btn ghost" href="/preshift">warm up anyway</a>
      </div>
    </div>
  {:else if summary}
    <SessionSummary
      eyebrow="review done"
      title="queue cleared"
      stats={[
        { label: 'cleared', value: summary.cleared },
        { label: 'misses', value: summary.misses }
      ]}
      note={summary.misses === 0
        ? 'clean sweep — everything came back on the first ask.'
        : 'missed ones are rescheduled sooner — they show up again tonight or tomorrow.'}
      missesTitle="they fought back today"
      misses={missList}
    >
      <a class="btn" href="/">back to the path</a>
    </SessionSummary>
  {:else if step && prog}
    <SessionHeader title="Daily review" {phase} position={prog.position} total={prog.total} />
    {#key prog.position}
      {#if step.type === 'quiz' && step.rung === 'cued'}
        {@const c = cuedFor(step.item)}
        <FlashReveal prompt={c.prompt} hint={c.hint} answer={c.answer} allergens={c.allergens} allergenNote={c.allergenNote} confirmLine={c.confirmLine} kicker="still warm? — with a hint" confidence ongrade={grade} note="honest call — misses come back tonight, not on the floor" />
      {:else if step.type === 'quiz'}
        {@const f = freeFor(step.item)}
        <FlashReveal prompt={f.prompt} answer={f.answer} detail={f.detail} allergens={f.allergens} allergenNote={f.allergenNote} confirmLine={f.confirmLine} kicker="still warm? — cold" confidence ongrade={grade} note="honest call — misses come back tonight, not on the floor" />
      {:else}
        <TeachCard teach={teachFor(step.item)} eyebrow="back to this one" oncontinue={continueStep} continueLabel="Got it — continue" />
      {/if}
    {/key}
    <KeyHints shaky={step.type === 'quiz'} />
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
