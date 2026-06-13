<script lang="ts">
  // /romance/exam — "the Romance Exam": the scored simulator of Monday night's
  // MENU test. One shuffled pass over all 41 dishes; each one is romanced cold
  // (name + the dish + up to three components, OUT LOUD) and graded by a
  // structured self-check against the real bar. It READS readiness — NO store
  // writes — and hands the shaky dishes to /romance for a one-tap re-drill.
  import Icon from '$lib/components/Icon.svelte';
  import KeyHints from '$lib/components/session/KeyHints.svelte';
  import RomanceExamCard from '$lib/components/session/RomanceExamCard.svelte';
  import SessionHeader from '$lib/components/session/SessionHeader.svelte';
  import SessionSummary from '$lib/components/session/SessionSummary.svelte';
  import { nameOf } from '$lib/components/session/util';
  import { allStage1Items, romanceFor } from '$lib/journey/items';
  import type { JourneyItem } from '$lib/journey/types';
  import {
    CHECKPOINT_PASS_RATIO,
    createRomanceExamSession,
    type RomanceExamSession,
    type RomanceExamSummary
  } from '$lib/session';
  import { progress } from '$lib/store/progress.svelte';

  // Every dish on the path — the menu test covers plates, not service calls.
  const DISHES: readonly JourneyItem[] = allStage1Items().filter((i) => i.kind === 'dish');
  const DISH_COUNT = DISHES.length; // 41
  const passPct = Math.round(CHECKPOINT_PASS_RATIO * 100);

  let session: RomanceExamSession | null = $state(null);
  let nonce = $state(0);
  let summary = $state<RomanceExamSummary | null>(null);

  function start(): void {
    summary = null;
    nonce = 0;
    session = createRomanceExamSession(DISHES); // default rng — fresh deal each run
  }

  const step = $derived.by(() => {
    void nonce;
    return session ? session.current() : null;
  });
  const prog = $derived.by(() => {
    void nonce;
    return session ? session.progress() : null;
  });

  function bump(): void {
    nonce += 1;
    if (session && session.isComplete() && !summary) summary = session.summary();
  }
  function grade(outcome: { named: boolean; componentsHit: number }): void {
    session?.grade(outcome);
    bump();
  }

  const scorePct = $derived(summary ? Math.round(summary.score * 100) : 0);
  const catRows = $derived(summary ? summary.byCategory : []);
  const missList = $derived(summary ? summary.missed.map((id) => ({ label: nameOf(id) })) : []);
  // Hand the shaky dishes to the romance drill as foodIds (strip the dish:
  // prefix) so "drill them out loud" drills EXACTLY the ones below the bar.
  const missDrillHref = $derived(
    summary && summary.missed.length > 0
      ? `/romance?drill=${summary.missed.map((id) => id.replace(/^dish:/, '')).join(',')}`
      : '/romance'
  );
</script>

<svelte:head><title>The Romance Exam · Bridgette Trainer</title></svelte:head>

<div class="screen">
  {#if !progress.ready}
    <div aria-busy="true">
      <p class="visually-hidden" role="status">Loading the romance exam</p>
      <div class="sk head-sk"></div>
      <div class="sk card-sk"></div>
    </div>
  {:else if summary}
    <SessionSummary
      eyebrow={summary.passed ? 'romanced clean — at the real bar' : 'below the bar — that’s what the exam is for'}
      title={summary.passed ? 'monday-ready' : 'keep romancing'}
      ringPct={scorePct}
      ringText={`${scorePct}%`}
      stats={[
        { label: 'romanced clean', value: `${summary.clean}/${summary.total}` },
        { label: 'pass bar', value: `${passPct}%` }
      ]}
      note={summary.passed
        ? summary.missed.length === 0
          ? 'every dish, clean — name and components. walk in Monday and romance them exactly like that.'
          : 'a pass with a few wobbles — say the shaky ones out loud once and they hold.'
        : 'each dish below is one fix. drill them out loud and run it again — the exam costs nothing.'}
      missesTitle="the shaky dishes — say these again"
      misses={missList}
    >
      {#snippet extra()}
        <div class="brk">
          <p class="brk-t">by section</p>
          <ul class="cats">
            {#each catRows as c (c.category)}
              <li>
                <span class="cat-name">{c.category}</span>
                <span class="cat-n" class:clean={c.clean === c.asked}>{c.clean}/{c.asked}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/snippet}
      {#if missList.length > 0}
        <a class="btn" href={missDrillHref}>drill the {missList.length} shaky out loud</a>
        <button type="button" class="btn ghost" onclick={start}>run the exam again</button>
        <p class="rom-note">that drills exactly the {missList.length} below the bar — say each till it holds, then re-run.</p>
      {:else}
        <a class="btn" href="/today">back to today</a>
        <button type="button" class="btn ghost" onclick={start}>run it again</button>
      {/if}
    </SessionSummary>
  {:else if step && prog}
    <SessionHeader
      title="The Romance Exam"
      sub="every dish, cold — the Monday-test bar"
      phase="say it, then check yourself"
      position={prog.position}
      total={prog.total}
      exitHref="/today"
      exitLabel="today"
    />
    {#key prog.position}
      <RomanceExamCard content={romanceFor(step.item)} ongrade={grade} />
    {/key}
    <KeyHints />
  {:else}
    <!-- deliberate entry: an exam is walked into, not stumbled into -->
    <section class="intro on-cream">
      <span class="i-mark" aria-hidden="true"><Icon name="exam" size={22} /></span>
      <p class="i-eyebrow">for monday night · the menu test</p>
      <h1 class="i-title">the romance exam</h1>
      <p class="i-line">{DISH_COUNT} dishes · scored to the real bar</p>
      <ul class="i-rules">
        <li>every dish, cold, one pass — romance it out loud: “This is our…” plus the dish and the three components that matter</li>
        <li>then check yourself honestly: tap the name and each component you actually said — pass is name + three (or all, on the short dishes)</li>
        <li>it reads your readiness and hands you the shaky ones — nothing here touches your reviews</li>
      </ul>
      <div class="i-actions">
        <button type="button" class="btn gold" onclick={start}>start the exam</button>
        <a class="btn ghost" href="/romance">just drill it instead</a>
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
    border-top: 3px solid var(--bb-marigold); /* gold — a scored test is a gate's room */
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
    max-width: 42ch;
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

  /* ---- results breakdown (rendered inside SessionSummary's extra slot) ---- */
  .brk {
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid color-mix(in srgb, var(--highlight-line) 45%, transparent);
    display: grid;
    gap: 10px;
  }
  .brk-t {
    margin: 0;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-label);
  }
  .cats {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 22px;
  }
  .cats li {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: 13px;
  }
  .cat-name {
    color: var(--text-body);
  }
  .cat-n {
    font-family: var(--font-display);
    font-size: 12.5px;
    font-weight: 700;
    color: var(--text-muted);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .cat-n.clean {
    color: color-mix(in srgb, var(--ok) 70%, var(--text-strong));
  }
  .rom-note {
    flex-basis: 100%;
    margin: 4px 0 0;
    font-size: 12.5px;
    font-style: italic;
    color: var(--text-muted);
  }

  /* skeleton — quiet pulse; the global reduced-motion rule stills it */
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
