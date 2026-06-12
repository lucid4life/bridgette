<script lang="ts">
  // Task H — /unit/[unitId]: the learn session. Pretest (warm-up guesses) →
  // teach (the menu pages) → quiz (test-to-criterion ladder). Binds exactly to
  // the session-engine step surface ($lib/session/types.ts); store events are
  // wired through deps — onIntroduce never resets an already-known item.
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import FlashMc from '$lib/components/session/FlashMc.svelte';
  import FlashReveal from '$lib/components/session/FlashReveal.svelte';
  import KeyHints from '$lib/components/session/KeyHints.svelte';
  import SessionHeader from '$lib/components/session/SessionHeader.svelte';
  import SessionSummary from '$lib/components/session/SessionSummary.svelte';
  import TeachCard from '$lib/components/session/TeachCard.svelte';
  import { nameOf } from '$lib/components/session/util';
  import { unitComplete, unitStatus } from '$lib/journey/gating';
  import { cuedFor, freeFor, itemsForUnit, mcFor, teachFor } from '$lib/journey/items';
  import { unitById } from '$lib/journey/stages';
  import { createLearnSession, type LearnSession, type LearnSummary } from '$lib/session';
  import { progress } from '$lib/store/progress.svelte';
  import { progressView } from '$lib/store/view';

  const unitId = $derived(page.params.unitId ?? '');

  let session: LearnSession | null = $state(null);
  let title = $state('');
  let nonce = $state(0); // bumped after every engine mutation → deriveds refresh
  let finished = $state<{ summary: LearnSummary; complete: boolean } | null>(null);
  let throttled = $state(false); // lessonsPerDay reached AND this unit would mint new items
  let builtFor: string | null = null; // plain — one build per unitId

  $effect(() => {
    if (!progress.ready || builtFor === unitId) return;
    builtFor = unitId;
    finished = null;
    nonce = 0;
    session = null;
    throttled = false;

    let resolved: ReturnType<typeof unitById>;
    try {
      resolved = unitById(unitId);
    } catch {
      void goto('/'); // unknown unit
      return;
    }
    if (resolved.unit.kind === 'checkpoint') {
      void goto(`/checkpoint/${resolved.stage.id}`); // checkpoints have their own surface
      return;
    }
    if (unitStatus(unitId, progressView(progress.state)) === 'locked') {
      void goto('/');
      return;
    }
    title = resolved.unit.title;
    // The lessonsPerDay throttle: NEW items only. A unit with un-introduced
    // items would mint past today's allowance — show the interstitial instead.
    // Re-studying a fully-introduced unit mints nothing and stays allowed.
    const wouldMintNew = itemsForUnit(unitId).some((i) => !progress.state.items[i.id]);
    if (wouldMintNew && progress.newToday() >= progress.settings.lessonsPerDay) {
      throttled = true;
      return;
    }
    session = createLearnSession(itemsForUnit(unitId), {
      onIntroduce: (id) => {
        // Re-studying a unit must NOT reset existing srs state: only truly new
        // ids are introduced (the store no-ops too — this keeps intent local).
        if (!progress.state.items[id]) void progress.introduceItem(id);
      },
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
    step?.type === 'pretest-mc' ? 'warm-up guesses' : step?.type === 'quiz' ? 'prove it' : 'learn'
  );

  function bump(): void {
    nonce += 1;
    if (session && session.isComplete() && !finished) {
      finished = {
        summary: session.summary(),
        complete: unitComplete(unitId, progressView(progress.state))
      };
    }
  }
  function answer(i: number) {
    return session!.answerMc(i);
  }
  function continueStep(): void {
    session?.advance();
    bump();
  }
  function grade(gotIt: boolean): void {
    session?.selfGrade(gotIt);
    bump();
  }

  const missList = $derived(
    finished
      ? finished.summary.perItem
          .filter((r) => r.misses > 0)
          .map((r) => ({ label: `${nameOf(r.itemId)} — ${r.misses === 1 ? '1 miss' : `${r.misses} misses`}` }))
      : []
  );
  const due = $derived(progress.ready ? progress.dueItems().length : 0);
</script>

<svelte:head><title>{title || 'Unit'} · Bridgette Trainer</title></svelte:head>

<div class="screen">
  {#if !progress.ready || (!session && !finished && !throttled)}
    <div aria-busy="true">
      <p class="visually-hidden" role="status">Loading the unit</p>
      <div class="sk head-sk"></div>
      <div class="sk card-sk"></div>
    </div>
  {:else if throttled}
    <!-- the lessonsPerDay throttle: kind interstitial, never a session -->
    <section class="card light throttle">
      <p class="th-eyebrow">{title}</p>
      <h1 class="th-title">today's new items are done</h1>
      <p class="meta">
        {progress.settings.lessonsPerDay} new items a day is the pace that sticks — this lesson
        starts fresh tomorrow. reviews are never capped.
      </p>
      <div class="th-actions">
        {#if due > 0}
          <a class="btn" href="/review">start reviews ({due})</a>
        {/if}
        <a class="btn ghost" href="/preshift">warm up the shaky calls</a>
        <a class="btn ghost" href="/">back to the path</a>
      </div>
    </section>
  {:else if finished}
    <SessionSummary
      eyebrow={finished.complete ? `unit complete — ${title}` : title}
      title={finished.complete ? "it's on the path" : 'good run — almost there'}
      stats={[
        { label: 'graduated', value: finished.summary.graduated },
        { label: 'misses', value: finished.summary.misses }
      ]}
      note={finished.summary.misses === 0
        ? 'a clean run — every item landed first try at every rung.'
        : 'misses graduate harder — they come back sooner in reviews.'}
      missesTitle="they fought back"
      misses={missList}
    >
      {#if finished.complete}
        <a class="btn" href="/">back to the path</a>
      {:else}
        <a class="btn ghost" href="/">back to the path</a>
      {/if}
    </SessionSummary>
  {:else if step && prog}
    <SessionHeader {title} {phase} position={prog.position} total={prog.total} />
    {#key prog.position}
      {#if step.type === 'pretest-mc'}
        <FlashMc mc={mcFor(step.item)} warm kicker="warm-up — a guess is the point" onanswer={answer} oncontinue={continueStep} />
      {:else if step.type === 'quiz' && step.rung === 'mc'}
        <FlashMc mc={mcFor(step.item)} kicker="prove it — round one" onanswer={answer} oncontinue={continueStep} />
      {:else if step.type === 'quiz' && step.rung === 'cued'}
        {@const c = cuedFor(step.item)}
        <FlashReveal prompt={c.prompt} hint={c.hint} answer={c.answer} allergens={c.allergens} allergenNote={c.allergenNote} confirmLine={c.confirmLine} kicker="prove it — with a hint" ongrade={grade} note="honest call — a miss just brings it back around" />
      {:else if step.type === 'quiz' && step.rung === 'free'}
        {@const f = freeFor(step.item)}
        <FlashReveal prompt={f.prompt} answer={f.answer} detail={f.detail} allergens={f.allergens} allergenNote={f.allergenNote} confirmLine={f.confirmLine} kicker="prove it — cold" ongrade={grade} note="honest call — a miss just brings it back around" />
      {:else}
        <TeachCard
          teach={teachFor(step.item)}
          eyebrow={step.type === 'reteach' ? 'back to this one' : undefined}
          oncontinue={continueStep}
        />
      {/if}
    {/key}
    <KeyHints />
  {/if}
</div>

<style>
  /* the throttle interstitial — a calm card, not an error */
  .throttle {
    max-width: 520px;
    margin: 0 auto;
    text-align: center;
  }
  .th-eyebrow {
    margin: 0 0 2px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-label);
  }
  .th-title {
    margin: 0 0 8px;
    font-family: var(--font-display);
    font-size: clamp(24px, 5vw, 32px);
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--text-strong);
  }
  .throttle .meta {
    max-width: 44ch;
    margin: 0 auto;
  }
  .th-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
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
