<script lang="ts">
  // /build — "Build the bar": the make-the-drink say-it drill for bar shifts.
  // Every cocktail with an official build, shakiest first then never-introduced
  // then the rest, flavour families interleaved; each drink is BUILT OUT LOUD
  // from memory and self-checked against the official build. Grades are real
  // review grades on the SAME build:<cocktailId> items the path tracks — this is
  // a presentation mode, not a new card set.
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
  import { allItems, categoryOf, freeFor, teachFor, FIRST_SHIFT_COCKTAIL_IDS } from '$lib/journey/items';
  import type { JourneyItem } from '$lib/journey/types';
  import {
    createBuildSession,
    romanceOrder,
    type BuildSession,
    type BuildSummary
  } from '$lib/session';
  import { progress } from '$lib/store/progress.svelte';
  import { progressView } from '$lib/store/view';

  // Every cocktail with an official build (the build-less drinks mint no item).
  const BUILDS: readonly JourneyItem[] = allItems().filter((i) => i.kind === 'build');
  const BUILD_COUNT = BUILDS.length; // every cocktail with an official build (14)

  // The pinned "First shift" set: /build?shift=1 drills just the priority drinks
  // and is reachable BEFORE the bar stage unlocks (deliberate pre-shift cram).
  const firstShift = $derived(page.url.searchParams.get('shift') === '1');

  // Behind the Bar is a sequentially-gated stage: this drill grades real reviews
  // (auto-introducing build items), so — like /checkpoint — it is unreachable
  // until the stage is unlocked, or drilling early would desync path gating.
  $effect(() => {
    if (!progress.ready) return;
    if (firstShift) return; // the priority-7 cram is reachable before the stage unlocks
    if (stageStatus('behind-the-bar', progressView(progress.state)) === 'locked') void goto('/');
  });

  let session: BuildSession | null = $state(null);
  let nonce = $state(0);
  let summary = $state<BuildSummary | null>(null);

  // Targeted entry: /build?drill=id1,id2 drills exactly the cocktails you just
  // missed (the cocktailId, without the build: prefix).
  const drillIds = $derived(
    (page.url.searchParams.get('drill') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const drillPool = $derived(
    firstShift
      ? BUILDS.filter((i) => (FIRST_SHIFT_COCKTAIL_IDS as readonly string[]).includes(i.cocktailId!))
      : drillIds.length > 0
        ? BUILDS.filter((i) => drillIds.includes(i.cocktailId!))
        : null
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

  function start(pool: readonly JourneyItem[] = BUILDS): void {
    summary = null;
    nonce = 0;
    // Real grades into the real SRS. recordReview AUTO-INTRODUCES any build that
    // hasn't been met on the path yet — the drill deliberately BYPASSES the
    // lesson throttle (building every drink IS the bar-shift job task), and
    // auto-introductions never consume the lesson allowance (see store.ts).
    session = createBuildSession(order(pool), {
      onResult: (id, grade) => void progress.recordReview(id, grade)
    });
  }

  /** Re-enter with only the just-missed builds (re-ordered for the new state). */
  function runMisses(): void {
    if (!summary) return;
    const missed = new Set(summary.perItem.filter((r) => r.missed).map((r) => r.itemId));
    start(BUILDS.filter((i) => missed.has(i.id)));
  }

  const step = $derived.by(() => {
    void nonce;
    return session ? session.current() : null;
  });
  const prog = $derived.by(() => {
    void nonce;
    return session ? session.progress() : null;
  });
  const phase = $derived(step?.type === 'reteach' ? 'a quick re-read' : 'build it out loud');

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

<svelte:head><title>Build the bar · Bridgette Trainer</title></svelte:head>

<div class="screen">
  {#if !progress.ready}
    <div aria-busy="true">
      <p class="visually-hidden" role="status">Loading the build drill</p>
      <div class="sk head-sk"></div>
      <div class="sk card-sk"></div>
    </div>
  {:else if summary}
    <SessionSummary
      eyebrow="drill done"
      title={`bar-ready: ${clean}/${summary.perItem.length} clean`}
      stats={[
        { label: 'cleared', value: summary.cleared },
        { label: 'misses', value: summary.misses }
      ]}
      note={summary.misses === 0
        ? 'every build landed on the first try. step behind the bar and make them exactly like that.'
        : 'a missed build here costs nothing — build the wobbly ones once more and they hold for the rail.'}
      missesTitle="build these ones again"
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
      title={firstShift ? 'First shift' : 'Build the bar'}
      sub={firstShift ? 'the 7 you make first — from memory' : 'every cocktail, built from memory'}
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
          allergens={f.allergens}
          allergenNote={f.allergenNote}
          confirmLine={f.confirmLine}
          kicker="say the build out loud, then check"
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
      <p class="i-eyebrow">for your bar shifts</p>
      <h1 class="i-title">build the bar</h1>
      <p class="i-line">{BUILD_COUNT} cocktails · about 10 honest minutes</p>
      <ul class="i-rules">
        <li>see the name — build it out loud from memory: every spirit, liqueur, and modifier in the glass</li>
        <li>then check yourself against the official build, in order — flags and the bar-confirm rule ride along</li>
        <li>misses come back until you clear them — better here than behind the rail</li>
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
    border-top: 3px solid var(--highlight-line); /* marigold — the bar's room */
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
