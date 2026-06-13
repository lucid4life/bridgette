<script lang="ts">
  // Task K — /progress: the honest read. Readiness = items at criterion (the
  // gating ratio), never cards seen; the SRS speaks only in RANKS here — no
  // intervals, dates, or ease anywhere. Four blocks: stage readiness ring ·
  // rank distribution · shaky list · the habit (streak/freeze/study days).
  import Icon from '$lib/components/Icon.svelte';
  import { nameOf, stage1ItemById } from '$lib/components/session/util';
  import { stageProgress, stageStatus } from '$lib/journey/gating';
  import { STAGES, unitById } from '$lib/journey/stages';
  import type { Rank } from '$lib/srs/scheduler';
  import { progress } from '$lib/store/progress.svelte';
  import { progressView } from '$lib/store/view';

  const view = $derived(progressView(progress.state));

  // Per-stage readiness, computed for every stage (locked stages report 0/0).
  const stageRows = $derived(
    STAGES.map((s, i) => ({
      stage: s,
      n: i + 1,
      status: stageStatus(s.id, view),
      sp: stageProgress(s.id, view)
    }))
  );
  const unlocked = $derived(stageRows.filter((r) => r.status !== 'locked'));
  const lockedStages = $derived(stageRows.filter((r) => r.status === 'locked'));
  // The ring tracks the stage you're working now: the first unlocked one not yet
  // complete, else the furthest unlocked (everything done so far).
  const focus = $derived(
    unlocked.find((r) => r.status !== 'complete') ?? unlocked[unlocked.length - 1] ?? stageRows[0]
  );
  const pct = $derived(Math.round(focus.sp.ratio * 100));

  // guest language only — what each rank means on the floor
  const RANK_ROWS: { rank: Rank; label: string }[] = [
    { rank: 'new', label: 'new' },
    { rank: 'learning', label: 'learning' },
    { rank: 'solid', label: 'solid' },
    { rank: 'locked-in', label: 'locked-in' }
  ];
  const counts = $derived(progress.rankCounts());
  const introduced = $derived(RANK_ROWS.reduce((t, r) => t + counts[r.rank], 0));
  // bars scale against every unlocked stage's items so the dashboard fills as the path does
  const totalUnlocked = $derived(unlocked.reduce((t, r) => t + r.sp.totalItems, 0));
  const denom = $derived(Math.max(totalUnlocked, introduced, 1));

  const shaky = $derived.by(() => {
    if (!progress.ready) return [];
    return progress.shakyItems(10).flatMap((id) => {
      const item = stage1ItemById(id); // resolves any introduced item, all stages
      if (!item) return []; // unresolvable id — nothing to render
      return [
        {
          id,
          name: nameOf(id),
          lapses: progress.state.items[id]?.lapses ?? 0,
          unitId: item.unitId,
          unitTitle: unitById(item.unitId).unit.title
        }
      ];
    });
  });

  const streak = $derived(progress.streak);
  const freezeFree = $derived(progress.freezeAvailable());
  const studyDays = $derived(Object.keys(progress.state.meta.dayLog).length);
</script>

<svelte:head><title>Progress · Bridgette Trainer</title></svelte:head>

{#if !progress.ready}
  <div class="screen" aria-busy="true">
    <p class="visually-hidden" role="status">Loading your progress</p>
    <div class="sk" style:width="34%" style:height="14px"></div>
    <div class="sk" style:width="48%" style:height="42px"></div>
    <div class="sk" style:height="200px"></div>
    <div class="sk" style:height="150px"></div>
  </div>
{:else}
  <div class="screen">
    <p class="h-eyebrow">the honest read</p>
    <h1>Progress</h1>
    <p class="sub">Readiness counts items at criterion — what you can actually call on the floor, not cards you've seen.</p>

    <section class="card ready">
      <div class="ready-grid">
        <div class="ready-text">
          <p class="kicker">stage {focus.n} · {focus.stage.track} track</p>
          <h2>{focus.stage.title}</h2>
          <p class="ready-line"><b>{pct}%</b> shift-ready</p>
          <p class="crit">{focus.sp.itemsAtCriterion}/{focus.sp.totalItems} items at criterion</p>
        </div>
        <div class="ring" style:--p={pct} role="img" aria-label="{pct} percent shift-ready">
          <span>{pct}%</span>
        </div>
      </div>

      {#if unlocked.length > 1}
        <ul class="stage-strip">
          {#each unlocked as r (r.stage.id)}
            <li class:isfocus={r.stage.id === focus.stage.id}>
              <span class="ss-t">{r.stage.title}</span>
              <span class="ss-bar" aria-hidden="true">
                <span class="ss-fill" style:width="{Math.round(r.sp.ratio * 100)}%"></span>
              </span>
              <b class="ss-pct">{Math.round(r.sp.ratio * 100)}%</b>
            </li>
          {/each}
        </ul>
      {/if}

      {#if lockedStages.length > 0}
        <ul class="locked-rows">
          {#each lockedStages as r (r.stage.id)}
            <li>
              <Icon name="lock" size={13} />
              <span class="lr-n">stage {r.n}</span>
              <span class="lr-t">{r.stage.title}</span>
              <span class="visually-hidden">— locked, opens after the stage before it</span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <div class="grid cols-2 mid">
      <section class="card">
        <h2 class="card-h">ranks</h2>
        <ul class="ranks">
          {#each RANK_ROWS as row (row.rank)}
            <li class="rk rk-{row.rank}">
              <span class="rk-label">{row.label}</span>
              <span class="rk-bar" aria-hidden="true">
                <span class="rk-fill" style:width="{Math.round((counts[row.rank] / denom) * 100)}%"></span>
              </span>
              <b class="rk-count">{counts[row.rank]}</b>
            </li>
          {/each}
        </ul>
        <p class="meta legend">
          learning = it's in the door · solid = it holds between shifts · locked-in = it'll survive a Saturday rush.
        </p>
      </section>

      <section class="card" class:quiet={shaky.length === 0}>
        <h2 class="card-h">shaky calls</h2>
        {#if shaky.length === 0}
          <p class="meta">nothing shaky — keep walking.</p>
        {:else}
          <p class="meta">the ones that slipped, wobbliest first.</p>
          <ul class="shaky-list">
            {#each shaky as s (s.id)}
              <li>
                <span class="sh-name">{s.name}</span>
                <span class="sh-lapses">{s.lapses}&times; slipped</span>
                <a class="sh-unit" href="/unit/{s.unitId}">{s.unitTitle}</a>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>

    <section class="card habit">
      <h2 class="card-h">the habit</h2>
      <div class="stat">
        <div><b>{streak.current}</b><span class="stat-l">day streak</span></div>
        <div><b>{studyDays}</b><span class="stat-l">study {studyDays === 1 ? 'day' : 'days'}</span></div>
      </div>
      <p class="freeze" class:spent={!freezeFree}>
        <Icon name="freeze" size={13} />
        {freezeFree ? '1 freeze left this week' : 'freeze used this week'}
      </p>
    </section>
  </div>
{/if}

<style>
  /* ---- stage readiness ---- */
  .ready {
    border-left: 4px solid var(--highlight-line); /* the workbook's marigold rule */
    padding: 20px 22px;
    box-shadow: var(--shadow-2);
    margin-bottom: 16px;
  }
  .ready-grid {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    flex-wrap: wrap;
  }
  .kicker {
    margin: 0 0 6px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-label);
    font-family: var(--font-display);
  }
  .ready h2 {
    margin: 0 0 6px;
    font-size: clamp(26px, 5vw, 34px);
    font-weight: 600;
    line-height: 1.05;
    color: var(--text-strong);
  }
  .ready-line {
    margin: 0;
    font-size: 15px;
    color: var(--text-body);
  }
  .ready-line b {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 600;
    color: var(--accent-text);
    margin-right: 4px;
  }
  .crit {
    margin: 6px 0 0;
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .ring {
    margin: 0; /* global .ring centres itself; here it sits flush right */
    flex: none;
  }

  /* per-stage readiness strip (shown once a second stage is unlocked) */
  .stage-strip {
    list-style: none;
    margin: 16px 0 0;
    padding: 14px 0 0;
    border-top: 1px solid color-mix(in srgb, var(--highlight-line) 40%, transparent);
    display: grid;
    gap: 9px;
  }
  .stage-strip li {
    display: grid;
    grid-template-columns: minmax(8ch, 14ch) 1fr auto;
    align-items: center;
    gap: 10px;
  }
  .ss-t {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
  }
  .stage-strip li.isfocus .ss-t {
    color: var(--text-strong);
  }
  .ss-bar {
    height: 7px;
    border-radius: 999px;
    background: var(--surface-track);
    overflow: hidden;
  }
  .ss-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: color-mix(in srgb, var(--highlight-line) 70%, transparent);
  }
  .stage-strip li.isfocus .ss-fill {
    background: var(--highlight-line);
  }
  .ss-pct {
    font-family: var(--font-display);
    font-size: 12.5px;
    font-weight: 700;
    color: var(--text-muted);
    min-width: 4ch;
    text-align: right;
  }

  .locked-rows {
    list-style: none;
    margin: 18px 0 0;
    padding: 12px 0 0;
    border-top: 1px dashed var(--line);
    display: grid;
    gap: 8px;
  }
  .locked-rows li {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-muted);
    font-size: 13.5px;
  }
  .lr-n {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .lr-t {
    font-weight: 600;
  }

  /* ---- ranks ---- */
  .mid {
    margin-bottom: 16px;
  }
  .card-h {
    margin: 0 0 8px;
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--text-strong);
  }
  .ranks {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .rk {
    display: grid;
    grid-template-columns: 76px 1fr 34px;
    align-items: center;
    gap: 10px;
  }
  .rk-label {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .rk-bar {
    height: 8px;
    border-radius: 999px;
    background: var(--surface-track);
    overflow: hidden;
  }
  .rk-fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    transition: width 0.5s ease;
  }
  /* rank hues from the brand's own status colours — no scheduler talk, just temperature */
  .rk-new .rk-fill {
    background: var(--text-muted);
  }
  .rk-learning .rk-fill {
    background: var(--info);
  }
  .rk-solid .rk-fill {
    background: var(--highlight-line);
  }
  .rk-locked-in .rk-fill {
    background: color-mix(in srgb, var(--ok) 55%, var(--text-strong));
  }
  .rk-count {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    text-align: right;
  }
  .legend {
    margin: 14px 0 0;
    max-width: 52ch;
  }

  /* ---- shaky list ---- */
  .quiet {
    background: var(--surface-card-faint);
    box-shadow: none;
  }
  .quiet .card-h {
    color: var(--text-muted);
  }
  .shaky-list {
    list-style: none;
    margin: 10px 0 0;
    padding: 0;
  }
  .shaky-list li {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
    padding: 9px 0;
    border-top: 1px solid var(--line);
  }
  .sh-name {
    font-weight: 700;
    flex: 1 1 auto;
    min-width: 0;
  }
  .sh-lapses {
    font-family: var(--font-display);
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--accent-text);
    white-space: nowrap;
  }
  .sh-unit {
    font-size: 13px;
    color: var(--text-muted);
    text-decoration: underline dotted;
    text-underline-offset: 3px;
    white-space: nowrap;
  }
  .sh-unit:hover {
    color: var(--accent-text);
  }

  /* ---- the habit ---- */
  .habit .stat {
    margin-top: 4px;
  }
  .stat-l {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .freeze {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 14px 0 0;
    padding: 4px 10px;
    border-radius: var(--radius-chip);
    font-size: 11.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-strong); /* pill.alt treatment — teal wash, strong ink (AA both themes) */
    background: color-mix(in srgb, var(--info) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--info) 40%, transparent);
  }
  .freeze.spent {
    color: var(--text-muted);
    background: var(--surface-card-faint);
    border-color: var(--line);
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
