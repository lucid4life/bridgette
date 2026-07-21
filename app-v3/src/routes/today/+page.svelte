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
  import { dayNumber, daysUntil } from '$lib/store/store';
  import { progressView } from '$lib/store/view';

  const view = $derived(progressView(progress.state));

  const due = $derived(progress.ready ? progress.dueItems().length : 0);
  // One shaky sort per tick, shared by the pre-shift count + the cram plan.
  const allShaky = $derived(progress.ready ? progress.shakyItems() : []);
  const shaky = $derived(Math.min(12, allShaky.length));
  const anyItems = $derived(Object.keys(progress.state.items).length > 0);

  // §0c cram-to-a-date: set a test date → a countdown + a shakiest-first plan.
  const shakyDishIds = $derived(allShaky.filter((id) => id.startsWith('dish:')));
  const examTarget = $derived(progress.examTarget);
  const daysToTest = $derived(examTarget != null ? daysUntil(examTarget, new Date()) : null);
  const cramLabel = $derived.by(() => {
    const d = daysToTest;
    if (d == null) return '';
    if (d > 1) return `${d} days to the menu test`;
    if (d === 1) return 'menu test tomorrow';
    if (d === 0) return 'menu test today';
    return `menu test was ${-d} ${-d === 1 ? 'day' : 'days'} ago`;
  });
  const shakyDrillHref = $derived(
    shakyDishIds.length > 0 ? `/romance?drill=${shakyDishIds.map((id) => id.slice(5)).join(',')}` : '/romance'
  );
  // Announced via a persistent live region so screen-reader users hear the
  // countdown when they set/clear the date (it changes outside their focus).
  const cramAnnounce = $derived(
    daysToTest == null
      ? ''
      : `${cramLabel}${shakyDishIds.length > 0 ? `, ${shakyDishIds.length} ${shakyDishIds.length === 1 ? 'dish' : 'dishes'} still shaky` : ''}`
  );
  function onSetTestDate(e: Event): void {
    const v = (e.currentTarget as HTMLInputElement).value;
    if (!v) return;
    const [y, mo, da] = v.split('-').map(Number);
    // dayNumber is THE calendar-day formula (date-only, DST-immune) — reuse it,
    // never re-inline, so the set day and the countdown can't drift apart.
    void progress.setExamTarget(dayNumber(new Date(y, mo - 1, da)));
  }

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
  // Pour-the-room surfaces once the Pairings stage is reachable (Stages 1-4 done).
  const pairingsReachable = $derived(stageStatus('pairings', view) !== 'locked');

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

    <!-- pinned first-shift drill: the priority cocktails made earliest on the
         rail — a deliberate pre-shift cram, reachable before the bar stage
         unlocks (the full build drill stays gated with the stage) -->
    <section class="card firstshift">
      <div class="fs-text">
        <h2 class="kicker fs-kicker">first shift · 7 drinks</h2>
        <p class="jobtitle sm">the cocktails you'll make first</p>
        <p class="meta fs-meta">Heartbreak Mountain · Eat Aprés Love · Cruel Summer · Rolling Canoe · Paradise City · Cloud 9 · Spaghetti Western — full recipe, built from memory.</p>
      </div>
      <p class="cta"><a class="btn" href="/build?shift=1">drill these 7</a></p>
    </section>

    <!-- this week's job tasks: shift Sunday, food test Monday night. One tight
         card ABOVE the pre-shift door, without touching the reviews-first hero -->
    <section class="card week">
      <div class="wk-text">
        <h2 class="kicker wk-kicker">this week</h2>
        <p class="jobtitle sm">shift sunday · test monday night</p>
        <p class="meta wk-meta">say it out loud, sweep the flags, then sit the mock — that's the whole prep.</p>
        {#if daysToTest != null}
          <p class="cram">
            <span class="cram-count" class:soon={daysToTest >= 0 && daysToTest <= 1} class:past={daysToTest < 0}>{cramLabel}</span>
            {#if shakyDishIds.length > 0}
              <span class="cram-sep" aria-hidden="true">·</span><a class="cram-shaky" href={shakyDrillHref}>{shakyDishIds.length} {shakyDishIds.length === 1 ? 'dish' : 'dishes'} still shaky</a>
            {:else if anyItems}
              <span class="cram-sep" aria-hidden="true">·</span><a class="cram-shaky" href="/romance/exam">check your readiness</a>
            {/if}
            <button type="button" class="cram-clear" onclick={() => void progress.setExamTarget(null)}>clear date</button>
          </p>
        {:else}
          <p class="cram-set">
            <label>tested soon? <input type="date" onchange={onSetTestDate} aria-label="Set your test date for a countdown" /></label>
          </p>
        {/if}
        <!-- persistent live region: announces the countdown when set/cleared -->
        <p class="visually-hidden" aria-live="polite" aria-atomic="true">{cramAnnounce}</p>
      </div>
      <nav class="wk-links" aria-label="Test prep">
        <a class="btn ghost" href="/romance">romance the menu</a>
        <a class="btn ghost" href="/romance/guide">the romance guide</a>
        <a class="btn ghost" href="/allergens">the allergen sweep</a>
        {#if barReachable}<a class="btn ghost" href="/build">build the bar</a>{/if}
        {#if wineReachable}<a class="btn ghost" href="/prep">prep my bottle</a>{/if}
        {#if pairingsReachable}<a class="btn ghost" href="/pour">pour the room</a>{/if}
        <a class="btn ghost" href="/burst">60-second burst</a>
        <a class="btn ghost" href="/test">the food test</a>
        <a class="btn" href="/romance/exam">the romance exam</a>
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

  /* ---- pinned first-shift drill (marigold spine — the bar's room) ---- */
  .firstshift {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px 18px;
    margin-top: 16px;
    border-left: 4px solid var(--highlight-line);
  }
  .fs-kicker {
    color: var(--highlight);
  }
  .fs-text .fs-meta {
    margin: 4px 0 0;
    max-width: 60ch;
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
  /* cram-to-a-date countdown */
  .cram {
    margin: 10px 0 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 13px;
  }
  .cram-count {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--highlight); /* marigold — same as .wk-kicker, AA on this card both themes */
  }
  .cram-count.soon {
    color: var(--accent-text); /* ember action ink — the urgent days */
  }
  .cram-count.past {
    color: var(--text-muted);
  }
  .cram-sep {
    color: var(--text-muted);
  }
  .cram-shaky {
    color: var(--accent-text);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .cram-clear {
    margin-left: auto;
    background: none;
    border: none;
    padding: 2px 4px;
    font-size: 12px;
    color: var(--text-muted);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .cram-clear:hover {
    color: var(--text-body);
  }
  .cram-set {
    margin: 10px 0 0;
    font-size: 13px;
    color: var(--text-muted);
  }
  .cram-set label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .cram-set input {
    font: inherit;
    padding: 4px 8px;
    border-radius: var(--radius-chip, 8px);
    border: 1px solid var(--line);
    background: var(--surface-card-faint, var(--surface-card));
    color: var(--text-body);
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
