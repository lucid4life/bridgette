<script lang="ts">
  // /pour — "Pour the room": the call-the-pairing say-it drill for the floor.
  // Every pairing dish, shakiest first then never-introduced then the rest,
  // categories interleaved; each dish's pour + the why is CALLED OUT LOUD and
  // self-checked against the official pairing. Grades are real review grades on
  // the SAME pairing:<foodId> items the path tracks — a presentation mode, not a
  // new card set.
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Icon from '$lib/components/Icon.svelte';
  import FlashReveal from '$lib/components/session/FlashReveal.svelte';
  import KeyHints from '$lib/components/session/KeyHints.svelte';
  import SessionHeader from '$lib/components/session/SessionHeader.svelte';
  import SessionSummary from '$lib/components/session/SessionSummary.svelte';
  import TeachCard from '$lib/components/session/TeachCard.svelte';
  import { nameOf } from '$lib/components/session/util';
  import { stageStatus } from '$lib/journey/gating';
  import { allItems, categoryOf, freeFor, teachFor } from '$lib/journey/items';
  import type { JourneyItem } from '$lib/journey/types';
  import {
    createPairingDrillSession,
    romanceOrder,
    type PourSession,
    type PourSummary
  } from '$lib/session';
  import { progress } from '$lib/store/progress.svelte';
  import { progressView } from '$lib/store/view';

  // Every dish that carries an official pairing (Stage 5 roster).
  const POURS: readonly JourneyItem[] = allItems().filter((i) => i.kind === 'pairing');
  const POUR_COUNT = POURS.length;

  // Pairings is the last sequentially-gated stage: this drill grades real reviews
  // (auto-introducing pairing items), so — like /checkpoint and /build — it is
  // unreachable until the stage unlocks, or drilling early would desync gating.
  $effect(() => {
    if (!progress.ready) return;
    if (stageStatus('pairings', progressView(progress.state)) === 'locked') void goto('/');
  });

  let session: PourSession | null = $state(null);
  let nonce = $state(0);
  let summary = $state<PourSummary | null>(null);

  // Targeted entry: /pour?drill=id1,id2 drills exactly the dishes you just missed
  // (the foodId, without the pairing: prefix).
  const drillIds = $derived(
    (page.url.searchParams.get('drill') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const drillPool = $derived(
    drillIds.length > 0 ? POURS.filter((i) => drillIds.includes(i.foodId!)) : null
  );

  /** Asking order from the CURRENT store state — deterministic per state. */
  function order(pool: readonly JourneyItem[]): JourneyItem[] {
    return romanceOrder(
      pool,
      progress.shakyItems(),
      (id) => !!progress.state.items[id],
      (item) => categoryOf(item)
    );
  }

  function start(pool: readonly JourneyItem[] = POURS): void {
    summary = null;
    nonce = 0;
    // Real grades into the real SRS. recordReview AUTO-INTRODUCES any pairing not
    // met on the path yet — the drill deliberately BYPASSES the lesson throttle
    // (calling every pour IS the floor job task); auto-introductions never consume
    // the lesson allowance (see store.ts).
    session = createPairingDrillSession(order(pool), {
      onResult: (id, grade) => void progress.recordReview(id, grade)
    });
  }

  /** Re-enter with only the just-missed pours (re-ordered for the new state). */
  function runMisses(): void {
    if (!summary) return;
    const missed = new Set(summary.perItem.filter((r) => r.missed).map((r) => r.itemId));
    start(POURS.filter((i) => missed.has(i.id)));
  }

  const step = $derived.by(() => {
    void nonce;
    return session ? session.current() : null;
  });
  const prog = $derived.by(() => {
    void nonce;
    return session ? session.progress() : null;
  });
  const phase = $derived(step?.type === 'reteach' ? 'a quick re-read' : 'call it out loud');

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
  const clean = $derived(summary ? summary.perItem.filter((r) => !r.missed).length : 0);

  // Auto-start a targeted drill when arriving from a miss list.
  $effect(() => {
    if (progress.ready && drillPool && drillPool.length > 0 && !session && !summary) start(drillPool);
  });
</script>

<svelte:head><title>Pour the room · Bridgette Trainer</title></svelte:head>

<div class="screen">
  {#if !progress.ready}
    <div aria-busy="true">
      <p class="visually-hidden" role="status">Loading the pairing drill</p>
      <div class="sk head-sk"></div>
      <div class="sk card-sk"></div>
    </div>
  {:else if summary}
    <SessionSummary
      eyebrow="drill done"
      title={`floor-ready: ${clean}/${summary.perItem.length} clean`}
      stats={[
        { label: 'cleared', value: summary.cleared },
        { label: 'misses', value: summary.misses }
      ]}
      note={summary.misses === 0
        ? 'every pour landed on the first call. work the floor and pour them exactly like that.'
        : 'a missed call here costs nothing — call the wobbly ones once more and they hold for the table.'}
      missesTitle="call these ones again"
      misses={missList}
    >
      {#if missList.length > 0}
        <button type="button" class="btn" onclick={runMisses}>run the misses again</button>
        <a class="btn ghost" href="/today">back to today</a>
      {:else}
        <a class="btn" href="/today">back to today</a>
        <button type="button" class="btn ghost" onclick={() => start()}>run it again</button>
      {/if}
    </SessionSummary>
  {:else if step && prog}
    <SessionHeader
      title="Pour the room"
      sub="every dish, the pour called from memory"
      {phase}
      position={prog.position}
      total={prog.total}
      exitHref="/today"
      exitLabel="today"
    />
    {#key prog.position}
      {#if step.type === 'quiz'}
        {@const f = freeFor(step.item)}
        <FlashReveal
          prompt={f.prompt}
          answer={f.answer}
          detail={f.detail}
          kicker="call the pour + the why out loud, then check"
          note="honest call — a miss just brings it back around"
          ongrade={grade}
        />
      {:else}
        <TeachCard teach={teachFor(step.item)} eyebrow="back to this one" oncontinue={continueStep} continueLabel="Got it — continue" />
      {/if}
    {/key}
    <KeyHints />
  {:else}
    <!-- deliberate entry: know what the drill asks before the first card -->
    <section class="intro on-cream">
      <span class="i-mark" aria-hidden="true"><Icon name="speaker" size={22} /></span>
      <p class="i-eyebrow">for the dining room</p>
      <h1 class="i-title">pour the room</h1>
      <p class="i-line">{POUR_COUNT} pairings · about 10 honest minutes</p>
      <ul class="i-rules">
        <li>see the dish — call its by-the-glass pour out loud, then say WHY it works (the lever) and the non-drinker option</li>
        <li>then check yourself against the official pour + the lever that makes it land</li>
        <li>misses come back until you clear them — better here than at the table</li>
      </ul>
      <div class="i-actions">
        <button type="button" class="btn" onclick={() => start()}>start the drill</button>
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
    border-top: 3px solid var(--bb-coral); /* coral — the pairings track's room */
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
    background: var(--bb-coral);
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
