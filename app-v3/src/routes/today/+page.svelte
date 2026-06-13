<script lang="ts">
  // Task I — /today: the daily cockpit. ONE primary action chosen by state
  // (WaniKani's two-button law: reviews are an obligation, modules a choice):
  // reviews lead whenever anything is due; with a clear queue the next module
  // steps up. Modules are self-paced — no per-day cap; reviews are never capped
  // either. Three blocks, no feed: hero (primary + streak) · the other job ·
  // the 2:45pm pre-shift door.
  import Icon from '$lib/components/Icon.svelte';
  import { nextUnit, stageStatus, unitHref, unitStatus } from '$lib/journey/gating';
  import { STAGES } from '$lib/journey/stages';
  import { progress } from '$lib/store/progress.svelte';
  import { progressView } from '$lib/store/view';

  const view = $derived(progressView(progress.state));

  const due = $derived(progress.ready ? progress.dueItems().length : 0);
  const shaky = $derived(progress.ready ? progress.shakyItems(12).length : 0);
  const anyItems = $derived(Object.keys(progress.state.items).length > 0);

  // next stop on the path: walk unlocked stages in order (same rule + cross-
  // stage reach as the Path home), carrying the unit's home stage for the href.
  const next = $derived.by(() => {
    for (const stage of STAGES) {
      if (stageStatus(stage.id, view) === 'locked') continue;
      const unit = nextUnit(stage.id, view);
      if (unit) return { unit, stage, status: unitStatus(unit.id, view) };
    }
    return null;
  });
  // "everything built so far is done" — every non-locked stage complete.
  const stageDone = $derived(
    STAGES.every((s) => stageStatus(s.id, view) === 'locked' || stageStatus(s.id, view) === 'complete')
  );
  const nextHref = $derived(next ? unitHref(next.stage, next.unit) : '/');
  // The furthest stage that's been finished (for the "— locked in" line).
  const lastComplete = $derived([...STAGES].reverse().find((s) => stageStatus(s.id, view) === 'complete'));
  // Behind-the-Bar drill surfaces once that stage is reachable (Stages 1+2 done).
  const barReachable = $derived(stageStatus('behind-the-bar', view) !== 'locked');
  // Prep-my-bottle surfaces once the Wine stage is reachable (Stages 1-3 done).
  const wineReachable = $derived(stageStatus('wine', view) !== 'locked');

  const streak = $derived(progress.streak);
  const freezeFree = $derived(progress.freezeAvailable());
</script>

<svelte:head><title>Today · Bridgette Trainer</title></svelte:head>

{#snippet reviewsCard(primary: boolean)}
  {#if primary}
    <section class="card job">
      <h2 class="kicker">first job · reviews</h2>
      <p class="bignum">{due}</p>
      <p class="jobline">{due === 1 ? 'review' : 'reviews'} waiting — they're how it sticks.</p>
      <p class="meta">never capped, always finishable.</p>
      <p class="cta"><a class="btn" href="/review">start reviews</a></p>
    </section>
  {:else}
    <section class="card quiet">
      <h2 class="card-h">reviews</h2>
      <p class="meta">
        {#if anyItems}
          all clear — nothing due right now. the queue refills as time passes.
        {:else}
          none yet — they appear after your first lesson.
        {/if}
      </p>
    </section>
  {/if}
{/snippet}

{#snippet lessonsCard(primary: boolean)}
  <section class="card" class:job={primary} class:quiet={!primary && stageDone}>
    {#if stageDone || !next}
      <h2 class={primary ? 'kicker' : 'card-h'}>modules</h2>
      <p class="jobtitle" class:sm={!primary}>{(lastComplete?.title ?? 'the path').toLowerCase()} — locked in</p>
      <p class="meta">the whole stage is at criterion. keep it warm in reviews.</p>
      <p class="cta"><a class="btn ghost" href="/">see the path</a></p>
    {:else}
      <h2 class={primary ? 'kicker' : 'card-h'}>
        {primary ? `next module · ${next.status === 'started' ? 'continue' : 'start'}` : 'modules'}
      </h2>
      <p class="jobtitle" class:sm={!primary}>{next.unit.title}</p>
      <p class="meta blurb">{next.unit.blurb}</p>
      <p class="meta hint">
        {#if next.unit.kind === 'checkpoint'}
          no new items — the whole stage, cold
        {:else}
          self-paced — take as many modules as you like
        {/if}
      </p>
      <p class="cta">
        <a class="btn" class:ghost={!primary} href={nextHref}>
          {#if next.unit.kind === 'checkpoint'}
            take the shift check
          {:else}
            {next.status === 'started' ? 'continue' : 'start'}: {next.unit.title}
          {/if}
        </a>
      </p>
    {/if}
  </section>
{/snippet}

{#if !progress.ready}
  <div class="screen" aria-busy="true">
    <p class="visually-hidden" role="status">Loading your day</p>
    <div class="sk" style:width="34%" style:height="14px"></div>
    <div class="sk" style:width="48%" style:height="42px"></div>
    <div class="sk" style:height="190px"></div>
    <div class="sk" style:height="110px"></div>
  </div>
{:else}
  <div class="screen">
    <p class="h-eyebrow">the daily loop</p>
    <h1>Today</h1>
    <p class="sub">Clear the queue, take today's new items, steady the shaky calls before service.</p>

    <div class="hero">
      {#if due > 0}{@render reviewsCard(true)}{:else}{@render lessonsCard(true)}{/if}

      <section class="card streaks">
        <h2 class="kicker">streak</h2>
        <p class="bignum sm">{streak.current}<span class="unit">{streak.current === 1 ? 'day' : 'days'}</span></p>
        <p class="freeze" class:spent={!freezeFree}>
          <Icon name="freeze" size={13} />
          {freezeFree ? '1 freeze left this week' : 'freeze used this week'}
        </p>
        <p class="meta">the target is 8 good minutes a day — that's the whole job.</p>
      </section>
    </div>

    <!-- this week's job tasks: shift Sunday, food test Monday night. One tight
         card ABOVE the pre-shift door, without touching the reviews-first hero -->
    <section class="card week">
      <div class="wk-text">
        <h2 class="kicker wk-kicker">this week</h2>
        <p class="jobtitle sm">shift sunday · test monday night</p>
        <p class="meta wk-meta">say it out loud, sweep the flags, then sit the mock — that's the whole prep.</p>
      </div>
      <nav class="wk-links" aria-label="Test prep">
        <a class="btn ghost" href="/romance">romance the menu</a>
        <a class="btn ghost" href="/allergens">the allergen sweep</a>
        {#if barReachable}<a class="btn ghost" href="/build">build the bar</a>{/if}
        {#if wineReachable}<a class="btn ghost" href="/prep">prep my bottle</a>{/if}
        <a class="btn" href="/test">take the food test</a>
      </nav>
    </section>

    <div class="grid cols-2 below">
      {#if due > 0}{@render lessonsCard(false)}{:else}{@render reviewsCard(false)}{/if}

      <section class="card preshift">
        <div class="ps-text">
          <h2 class="card-h">the 2:45pm special</h2>
          <p class="meta">two minutes on your shakiest calls before service.</p>
          <p class="shaky-line" class:none={shaky === 0}>
            {shaky > 0 ? `${shaky} shaky ${shaky === 1 ? 'item' : 'items'}` : 'nothing shaky yet'}
          </p>
        </div>
        <p class="cta"><a class="btn ghost" href="/preshift">warm up</a></p>
      </section>
    </div>
  </div>
{/if}

<style>
  /* ---- hero cards ---- */
  .job {
    border-left: 4px solid var(--accent-bright); /* the one job — the orange spine */
    padding: 20px 22px;
  }
  .kicker {
    margin: 0 0 6px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-label);
  }
  .streaks .kicker {
    color: var(--text-muted);
  }
  .bignum {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(56px, 11vw, 74px);
    font-weight: 300;
    line-height: 0.95;
    color: var(--text-strong);
  }
  .bignum.sm {
    font-size: clamp(40px, 8vw, 54px);
  }
  .bignum .unit {
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-left: 8px;
  }
  .jobline {
    margin: 8px 0 2px;
    font-size: 15px;
    font-weight: 600;
    max-width: 38ch;
  }
  .jobtitle {
    margin: 0 0 2px;
    font-family: var(--font-display);
    font-size: clamp(26px, 5vw, 34px);
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: 0.01em;
    text-transform: lowercase;
    color: var(--text-strong);
  }
  .jobtitle.sm {
    font-size: 19px;
  }
  .blurb {
    max-width: 52ch;
  }
  .hint {
    margin: 10px 0 0;
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .cta {
    margin: 14px 0 0;
  }
  .job .cta {
    margin-top: 18px;
  }

  /* ---- streak card ---- */
  .streaks {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .streaks .meta {
    max-width: 26ch;
  }
  .freeze {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 2px 0 0;
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

  /* ---- the week's prep door (marigold spine — Sunday's shift, Monday's test) ---- */
  .week {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px 18px;
    margin-top: 16px;
    border-left: 4px solid var(--highlight-line);
  }
  .wk-kicker {
    color: var(--highlight);
  }
  .wk-text .wk-meta {
    margin: 4px 0 0;
    max-width: 52ch;
  }
  .wk-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  /* ---- the secondary row ---- */
  .below {
    margin-top: 16px;
  }
  .card-h {
    margin: 0 0 6px;
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--text-strong);
  }
  .quiet {
    background: var(--surface-card-faint);
    box-shadow: none;
  }
  .quiet .card-h {
    color: var(--text-muted);
  }
  .preshift .ps-text .meta {
    margin: 0;
  }
  .shaky-line {
    margin: 8px 0 0;
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--accent-text);
  }
  .shaky-line.none {
    color: var(--text-muted);
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
