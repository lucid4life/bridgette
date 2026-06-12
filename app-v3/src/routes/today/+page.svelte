<script lang="ts">
  // Task I — /today: the daily cockpit. ONE primary action chosen by state
  // (WaniKani's two-button law: reviews are an obligation, lessons a choice):
  // reviews lead whenever anything is due; with a clear queue the next lesson
  // steps up. Lessons are throttled to lessonsPerDay NEW items; reviews never
  // are. Three blocks, no feed: hero (primary + streak) · the other job · the
  // 2:45pm pre-shift door.
  import Icon from '$lib/components/Icon.svelte';
  import { nextUnit, stageStatus, unitHref, unitStatus } from '$lib/journey/gating';
  import { STAGES } from '$lib/journey/stages';
  import { progress } from '$lib/store/progress.svelte';
  import { progressView } from '$lib/store/view';

  const stage1 = STAGES[0];
  const view = $derived(progressView(progress.state));

  const due = $derived(progress.ready ? progress.dueItems().length : 0);
  const shaky = $derived(progress.ready ? progress.shakyItems(12).length : 0);
  const anyItems = $derived(Object.keys(progress.state.items).length > 0);

  // the lesson throttle — NEW items only; reviews are never capped
  const lessonsPerDay = $derived(progress.settings.lessonsPerDay);
  const lessonsLeft = $derived(Math.max(0, lessonsPerDay - (progress.ready ? progress.newToday() : 0)));

  // next stop on the path: the SAME shared selector the Path home consumes
  const next = $derived.by(() => {
    const unit = nextUnit(stage1.id, view);
    return unit ? { unit, status: unitStatus(unit.id, view) } : null;
  });
  const stageDone = $derived(stageStatus(stage1.id, view) === 'complete');
  const nextHref = $derived(next ? unitHref(stage1, next.unit) : '/');
  // the shift check re-tests known items — it mints nothing, so the throttle never blocks it
  const throttled = $derived(lessonsLeft === 0 && next?.unit.kind !== 'checkpoint');

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
  <section class="card" class:job={primary} class:quiet={!primary && (stageDone || throttled)}>
    {#if stageDone || !next}
      <h2 class={primary ? 'kicker' : 'card-h'}>lessons</h2>
      <p class="jobtitle" class:sm={!primary}>food runner — locked in</p>
      <p class="meta">the whole stage is at criterion. keep it warm in reviews.</p>
      <p class="cta"><a class="btn ghost" href="/">see the path</a></p>
    {:else if throttled}
      {#if primary}
        <!-- queue clear AND allowance spent: an earned rest, never a dead end -->
        <h2 class="kicker">done for today</h2>
        <p class="jobtitle">the day's work is in</p>
        <p class="meta">new items done, nothing due — that's the system working. tomorrow's lesson is waiting on the path.</p>
        <p class="allowance">{lessonsPerDay} new items/day · 0 left today</p>
        <p class="cta done-ctas">
          {#if shaky > 0}<a class="btn ghost" href="/preshift">warm up the shaky calls</a>{/if}
          <a class="btn ghost" href="/playbook">read the playbook</a>
          <a class="btn ghost" href="/">see the path</a>
        </p>
      {:else}
        <h2 class="card-h">lessons</h2>
        <p class="meta">today's new items are done — reviews only.</p>
        <p class="allowance">{lessonsPerDay} new items/day · 0 left today</p>
      {/if}
    {:else}
      <h2 class={primary ? 'kicker' : 'card-h'}>
        {primary ? `next lesson · ${next.status === 'started' ? 'continue' : 'start'}` : 'lessons'}
      </h2>
      <p class="jobtitle" class:sm={!primary}>{next.unit.title}</p>
      <p class="meta blurb">{next.unit.blurb}</p>
      <p class="allowance">
        {#if next.unit.kind === 'checkpoint'}
          no new items — the whole stage, cold
        {:else}
          {lessonsPerDay} new items/day · {lessonsLeft} left today
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
  .allowance {
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
  .done-ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
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
