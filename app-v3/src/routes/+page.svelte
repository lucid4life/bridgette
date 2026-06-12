<script lang="ts">
  // Task G — THE home: the Path. One confident vertical journey — Stage 1
  // "Food Runner" open with its ten stations on a marigold spine, stages 2–5
  // as locked previews. All gating decisions live in $lib/journey/gating; this
  // page only reads the runes store through the ProgressView adapter.
  import StagePreview from '$lib/components/path/StagePreview.svelte';
  import UnitNode from '$lib/components/path/UnitNode.svelte';
  import { stageProgress, testOutAvailable, unitStatus } from '$lib/journey/gating';
  import { itemsForUnit } from '$lib/journey/items';
  import { STAGES } from '$lib/journey/stages';
  import { progress } from '$lib/store/progress.svelte';
  import { progressView } from '$lib/store/view';

  const stage1 = STAGES[0];
  const lockedStages = STAGES.filter((s) => s.locked);

  const view = $derived(progressView(progress.state));

  const rows = $derived.by(() => {
    let lessonN = 0;
    return stage1.units.map((unit) => {
      const items = itemsForUnit(unit.id);
      const studied = items.filter((it) => view.rankOf(it.id) !== 'new').length;
      const isCheckpoint = unit.kind === 'checkpoint';
      return {
        unit,
        status: unitStatus(unit.id, view),
        number: isCheckpoint ? null : ++lessonN,
        total: items.length,
        studied,
        meta: isCheckpoint
          ? `${items.length} items · the whole stage, cold`
          : items[0]?.kind === 'service'
            ? `${items.length} service calls`
            : `${items.length} dishes`,
        href: isCheckpoint ? `/checkpoint/${stage1.id}` : `/unit/${unit.id}`
      };
    });
  });

  // The ONE BIG CONTINUE: first started unit, else first available one.
  const next = $derived(
    rows.find((r) => r.status === 'started') ?? rows.find((r) => r.status === 'available') ?? null
  );
  const due = $derived(progress.ready ? progress.dueItems().length : 0);
  const sp = $derived(stageProgress(stage1.id, view));
  const stageTestOut = $derived(testOutAvailable(stage1.id, view));

  // lessonsPerDay throttle (NEW items only): when the continue-target would
  // mint past today's allowance, hint here — /unit's interstitial guards.
  const nextThrottled = $derived.by(() => {
    if (!progress.ready || !next || next.unit.kind === 'checkpoint') return false;
    const wouldMintNew = itemsForUnit(next.unit.id).some((i) => !progress.state.items[i.id]);
    return wouldMintNew && progress.newToday() >= progress.settings.lessonsPerDay;
  });
</script>

<svelte:head><title>The Path · Bridgette Trainer</title></svelte:head>

{#if !progress.ready}
  <!-- brief skeleton while the persisted state loads (idb → mirror → default) -->
  <div class="screen" aria-busy="true">
    <p class="visually-hidden" role="status">Loading your path</p>
    <div class="sk" style:width="38%" style:height="14px"></div>
    <div class="sk" style:width="56%" style:height="42px"></div>
    <div class="sk" style:max-width="580px" style:height="98px"></div>
    {#each [0, 1, 2] as i (i)}
      <div class="sk" style:height="84px"></div>
    {/each}
  </div>
{:else}
  <div class="screen">
    <header class="hero-strip">
      <p class="h-eyebrow">your two-week path</p>
      <h1>The Path</h1>
      <p class="sub">Learn it in stops, prove it at the shift check, keep it warm in reviews.</p>

      {#if next}
        <a class="continue" href={next.href}>
          <span class="c-text">
            <span class="c-kicker">{next.status === 'started' ? 'continue' : 'start'}</span>
            <span class="c-title">{next.unit.title}</span>
            <span class="c-meta">{next.meta}</span>
          </span>
          <svg class="c-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
        </a>
        {#if nextThrottled}
          <p class="throttle-hint">new items are done for today — this starts tomorrow's lesson</p>
        {/if}
      {:else}
        <a class="continue" href="/review">
          <span class="c-text">
            <span class="c-kicker">stage complete</span>
            <span class="c-title">Food Runner — locked in</span>
            <span class="c-meta">keep it warm in reviews</span>
          </span>
          <svg class="c-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
        </a>
      {/if}

      {#if due > 0}
        <p class="due">
          <a class="due-link" href="/review">{due} {due === 1 ? 'review' : 'reviews'} waiting →</a>
        </p>
      {/if}
    </header>

    <section class="stage" aria-labelledby="stage1-title">
      <header class="stage-head">
        <p class="h-eyebrow">stage one · the food track</p>
        <h2 id="stage1-title">{stage1.title}</h2>
        <p class="sub">{stage1.blurb}</p>
        <div class="meter">
          <span class="meter-bar" aria-hidden="true">
            <span class="meter-fill" style:width="{Math.round(sp.ratio * 100)}%"></span>
          </span>
          <span class="meter-text">{sp.itemsAtCriterion}/{sp.totalItems} at criterion</span>
        </div>
      </header>

      <ol class="path-list">
        {#each rows as row (row.unit.id)}
          <UnitNode
            unit={row.unit}
            status={row.status}
            number={row.number}
            total={row.total}
            studied={row.studied}
            meta={row.meta}
            href={row.href}
            current={next?.unit.id === row.unit.id}
            doneVia={view.unitDone[row.unit.id]}
            testOut={row.unit.kind === 'checkpoint' && stageTestOut}
          />
        {/each}
      </ol>
    </section>

    <section class="future" aria-labelledby="future-title">
      <h2 class="h-eyebrow" id="future-title">after the shift check</h2>
      <div class="grid cols-2">
        {#each lockedStages as stage, i (stage.id)}
          <StagePreview {stage} n={i + 2} />
        {/each}
      </div>
    </section>
  </div>
{/if}

<style>
  .hero-strip {
    margin-bottom: 42px;
  }

  /* THE one loud orange moment on the page — the continue card */
  .continue {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    max-width: 580px;
    margin-top: 16px;
    padding: 20px 22px;
    background: var(--accent);
    color: var(--accent-ink);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-2);
    text-decoration: none;
  }
  .continue:hover {
    filter: brightness(1.07);
  }
  .continue:hover .c-arrow {
    transform: translateX(4px);
  }
  .c-text {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .c-kicker {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }
  .c-title {
    font-family: var(--font-display);
    font-size: clamp(24px, 4vw, 32px);
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: 0.01em;
  }
  .c-meta {
    font-size: 13px;
    font-weight: 600;
    margin-top: 4px;
  }
  .c-arrow {
    width: 34px;
    height: 34px;
    flex: none;
    transition: transform 0.18s ease;
  }

  .throttle-hint {
    margin: 8px 0 0;
    max-width: 580px;
    font-size: 12.5px;
    font-style: italic;
    color: var(--text-muted);
  }

  .due {
    margin: 10px 0 0;
  }
  .due-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-size: 14px;
    font-weight: 700;
    color: var(--accent-text);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .stage {
    margin-bottom: 46px;
  }
  .stage-head .sub {
    margin-bottom: 14px;
  }
  .meter {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 420px;
  }
  .meter-bar {
    flex: 1;
    height: 6px;
    border-radius: 999px;
    background: var(--surface-track);
    overflow: hidden;
  }
  .meter-fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--highlight-line);
    transition: width 0.5s ease;
  }
  .meter-text {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .path-list {
    list-style: none;
    margin: 28px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 18px; /* the node spine segments (::before) reach up through this gap */
  }

  .future :global(.grid) {
    margin-top: 14px;
  }

  /* skeleton — quiet pulse; the global reduced-motion rule stills it */
  .sk {
    background: var(--surface-card);
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    margin-bottom: 14px;
    animation: sk-pulse 1.2s ease-in-out infinite alternate;
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
