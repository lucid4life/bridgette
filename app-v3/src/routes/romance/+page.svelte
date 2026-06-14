<script lang="ts">
  // /romance — "Romance the menu": the say-it-aloud drill for the Sunday
  // shift. All 41 dishes, shakiest first then never-introduced then the rest,
  // categories interleaved; each dish is delivered OUT LOUD ("This is our X…"
  // + the first-3 components) and self-checked against the pass bar. Grades
  // are real review grades on the SAME dish:<foodId> items the path tracks —
  // romance is a presentation mode, not a new card set.
  import { page } from '$app/state';
  import Icon from '$lib/components/Icon.svelte';
  import CategoryChips from '$lib/components/session/CategoryChips.svelte';
  import KeyHints from '$lib/components/session/KeyHints.svelte';
  import RomanceCard from '$lib/components/session/RomanceCard.svelte';
  import SessionHeader from '$lib/components/session/SessionHeader.svelte';
  import SessionSummary from '$lib/components/session/SessionSummary.svelte';
  import TeachCard from '$lib/components/session/TeachCard.svelte';
  import { nameOf } from '$lib/components/session/util';
  import {
    allStage1Items,
    filterByCategory,
    pathCategories,
    romanceFor,
    teachFor
  } from '$lib/journey/items';
  import type { JourneyItem } from '$lib/journey/types';
  import {
    createRomanceSession,
    romanceOrder,
    type RomanceSession,
    type RomanceSummary
  } from '$lib/session';
  import { progress } from '$lib/store/progress.svelte';

  // Every dish on the path — service calls have no plate to romance.
  const DISHES: readonly JourneyItem[] = allStage1Items().filter((i) => i.kind === 'dish');
  const DISH_COUNT = DISHES.length; // 41
  const CATEGORIES = pathCategories();

  let session: RomanceSession | null = $state(null);
  let nonce = $state(0);
  let summary = $state<RomanceSummary | null>(null);
  let selectedCat = $state<string | null>(null);

  // Targeted entry from the mock test: /romance?drill=id1,id2 drills exactly
  // the dishes you just missed (the foodId, without the dish: prefix).
  const drillIds = $derived(
    (page.url.searchParams.get('drill') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const drillPool = $derived(
    drillIds.length > 0 ? DISHES.filter((i) => drillIds.includes(i.foodId!)) : null
  );

  /** Asking order from the CURRENT store state — deterministic per state. */
  function order(pool: readonly JourneyItem[]): JourneyItem[] {
    return romanceOrder(
      pool,
      progress.shakyItems(),
      (id) => !!progress.state.items[id],
      (item) => romanceFor(item).category
    );
  }

  function start(pool: readonly JourneyItem[] = DISHES): void {
    summary = null;
    nonce = 0;
    session = createRomanceSession(order(pool), {
      // Real grades into the real SRS. recordReview AUTO-INTRODUCES any dish
      // that hasn't been met on the path yet — which means this drill
      // deliberately BYPASSES the lessonsPerDay throttle. That is by design:
      // romancing every dish IS the shift-critical job task (Sunday's floor),
      // so the drill must always be able to cover the whole menu. The reverse
      // holds too: auto-introductions never consume the lesson allowance —
      // the throttle paces the lesson path only (see store.ts newToday).
      onResult: (id, grade) => void progress.recordReview(id, grade)
    });
  }

  /** Re-enter with only the just-missed dishes (re-ordered for the new state). */
  function runMisses(): void {
    if (!summary) return;
    const missed = new Set(summary.perItem.filter((r) => r.missed).map((r) => r.itemId));
    start(DISHES.filter((i) => missed.has(i.id)));
  }

  const step = $derived.by(() => {
    void nonce;
    return session ? session.current() : null;
  });
  const prog = $derived.by(() => {
    void nonce;
    return session ? session.progress() : null;
  });
  const phase = $derived(step?.type === 'reteach' ? 'a quick re-read' : 'say it out loud');

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

  // Auto-start a targeted drill when arriving from the mock test's miss list.
  $effect(() => {
    if (progress.ready && drillPool && drillPool.length > 0 && !session && !summary) start(drillPool);
  });
</script>

<svelte:head><title>Romance the menu · Bridgette Trainer</title></svelte:head>

<div class="screen">
  {#if !progress.ready}
    <div aria-busy="true">
      <p class="visually-hidden" role="status">Loading the romance drill</p>
      <div class="sk head-sk"></div>
      <div class="sk card-sk"></div>
    </div>
  {:else if summary}
    <SessionSummary
      eyebrow="drill done"
      title={`sunday-ready: ${clean}/${summary.perItem.length} clean`}
      stats={[
        { label: 'cleared', value: summary.cleared },
        { label: 'misses', value: summary.misses }
      ]}
      note={summary.misses === 0
        ? 'every line landed on the first say. walk in Sunday and deliver them exactly like that.'
        : 'a missed line here costs nothing — say the wobbly ones once more and they hold for the floor.'}
      missesTitle="say these ones again"
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
      title="Romance the menu"
      sub="every dish, delivered out loud"
      {phase}
      position={prog.position}
      total={prog.total}
      exitHref="/today"
      exitLabel="today"
    />
    {#key prog.position}
      {#if step.type === 'quiz'}
        <RomanceCard content={romanceFor(step.item)} ongrade={grade} />
      {:else}
        <TeachCard teach={teachFor(step.item)} eyebrow="back to this one" oncontinue={continueStep} continueLabel="Got it — continue" />
      {/if}
    {/key}
    <KeyHints />
  {:else}
    {@const pool = filterByCategory(DISHES, selectedCat)}
    <!-- deliberate entry: know what the drill asks before the first card -->
    <section class="intro on-cream">
      <span class="i-mark" aria-hidden="true"><Icon name="speaker" size={22} /></span>
      <p class="i-eyebrow">for the sunday shift</p>
      <h1 class="i-title">romance the menu</h1>
      <p class="i-line">
        {pool.length}
        {selectedCat ? (selectedCat === 'Main' ? 'mains' : selectedCat.toLowerCase()) : 'dishes'}
        {selectedCat ? '' : '· about 20 honest minutes'}
      </p>
      <ul class="i-rules">
        <li>see the name — say the line out loud: “This is our…” plus the components that matter — three where the dish has them</li>
        <li>then check yourself against the pass bar: name + the components on it, spoken like you mean it</li>
        <li>misses come back until you clear them — better here than at the table</li>
      </ul>
      <CategoryChips categories={CATEGORIES} bind:selected={selectedCat} />
      <div class="i-actions">
        <button type="button" class="btn" onclick={() => start(pool)}>
          {selectedCat ? `drill the ${selectedCat === 'Main' ? 'mains' : selectedCat.toLowerCase()}` : 'start the drill'}
        </button>
        <a class="btn ghost" href="/romance/exam">take the scored exam</a>
        <a class="btn ghost" href="/romance/guide">read the guide</a>
        <a class="btn ghost" href="/today">not yet — back to today</a>
      </div>
      <p class="i-exam">tested Monday? the <a href="/romance/exam">romance exam</a> scores you to the real bar — name + three components, every dish.</p>
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
    border-top: 3px solid var(--flash-edge); /* coral — this is a question face's room */
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
  .i-exam {
    margin: 14px auto 0;
    max-width: 40ch;
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--text-muted);
  }
  .i-exam a {
    color: var(--accent-text);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
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
