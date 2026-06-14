<script lang="ts">
  // /burst — "Sixty-second burst": a fast mixed-quiz over everything you've met
  // so far (any kind — dishes, flags, builds, pours, pairings, service calls).
  // Reward is retrieval only: how many calls you land in 60 seconds. No streak,
  // no leaderboard, no penalty — it never touches your reviews or your rank.
  // A warm-up game, one tap from Today.
  import Icon from '$lib/components/Icon.svelte';
  import { allItems, mcFor } from '$lib/journey/items';
  import { nameOf } from '$lib/components/session/util';
  import type { JourneyItem } from '$lib/journey/types';
  import { shuffled } from '$lib/rng';
  import { progress } from '$lib/store/progress.svelte';

  const DURATION = 60; // seconds

  // Everything the learner has actually met (a store record exists) — across all
  // stages and kinds. mcFor handles every kind, so any introduced item can be asked.
  const introduced = $derived.by(() =>
    progress.ready ? allItems().filter((i) => !!progress.state.items[i.id]) : []
  );

  type Phase = 'intro' | 'play' | 'done';
  let phase = $state<Phase>('intro');
  let pool = $state<JourneyItem[]>([]);
  let idx = $state(0);
  let cycle = $state(0); // bumps each time the pool re-shuffles → repeats vary
  let score = $state(0);
  let answered = $state(0);
  let chosen = $state<number | null>(null);
  let timeLeft = $state(DURATION);
  let misses = $state<string[]>([]); // item names missed (for a gentle "revisit" list)

  let tick: ReturnType<typeof setInterval> | null = null;
  let advanceT: ReturnType<typeof setTimeout> | null = null;

  function clearTimers(): void {
    if (tick) clearInterval(tick);
    if (advanceT) clearTimeout(advanceT);
    tick = null;
    advanceT = null;
  }

  const current = $derived(pool.length > 0 ? pool[idx % pool.length] : null);
  // `cycle` only changes when the pool re-shuffles (between cards), so mc is
  // stable for the card on screen but a repeated item gets a fresh question.
  const mc = $derived(current ? mcFor(current, cycle) : null);

  function start(): void {
    if (introduced.length === 0) return;
    pool = shuffled(introduced, Math.random);
    idx = 0;
    cycle = 0;
    score = 0;
    answered = 0;
    misses = [];
    chosen = null;
    timeLeft = DURATION;
    phase = 'play';
    const endAt = Date.now() + DURATION * 1000;
    clearTimers();
    tick = setInterval(() => {
      timeLeft = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      if (timeLeft <= 0) finish();
    }, 200);
  }

  function choose(i: number): void {
    if (phase !== 'play' || chosen !== null || !mc || !current) return;
    chosen = i;
    answered += 1;
    if (i === mc.answerIndex) score += 1;
    else if (misses.length < 12) misses = [...misses, nameOf(current.id)];
    // brief feedback, then next question (re-shuffle + reuse the pool if exhausted)
    advanceT = setTimeout(() => {
      chosen = null;
      idx += 1;
      if (idx >= pool.length) {
        pool = shuffled(introduced, Math.random);
        idx = 0;
        cycle += 1; // next lap through the deck asks fresh questions
      }
    }, 280);
  }

  function finish(): void {
    clearTimers();
    chosen = null;
    phase = 'done';
  }

  // tidy up if the user navigates away mid-game
  $effect(() => () => clearTimers());

  const missList = $derived([...new Set(misses)].slice(0, 8).map((label) => ({ label })));
</script>

<svelte:head><title>Sixty-second burst · Bridgette Trainer</title></svelte:head>

<div class="screen">
  {#if !progress.ready}
    <div aria-busy="true">
      <p class="visually-hidden" role="status">Loading the burst</p>
      <div class="sk head-sk"></div>
      <div class="sk card-sk"></div>
    </div>
  {:else if phase === 'play' && current && mc}
    <div class="hud">
      <span class="hud-time" aria-hidden="true">{timeLeft}s</span>
      <span class="hud-score">{score} <span class="hud-lbl">{score === 1 ? 'call' : 'calls'}</span></span>
    </div>
    <div class="bar" aria-hidden="true"><span class="bar-fill" style:width="{(timeLeft / DURATION) * 100}%"></span></div>
    <p class="visually-hidden" role="timer">{timeLeft} seconds left, {score} correct</p>

    {#key idx}
      <article class="bcard">
        <p class="b-q">{mc.prompt}</p>
        <div class="b-choices">
          {#each mc.choices as choice, i (i)}
            <button
              type="button"
              class="b-choice"
              class:right={chosen !== null && i === mc.answerIndex}
              class:wrong={chosen === i && i !== mc.answerIndex}
              disabled={chosen !== null}
              onclick={() => choose(i)}
            >
              {choice}
            </button>
          {/each}
        </div>
      </article>
    {/key}
    <p class="b-skip"><button type="button" class="linkish" onclick={finish}>end early</button></p>

  {:else if phase === 'done'}
    <section class="intro on-cream done">
      <span class="i-mark" aria-hidden="true"><Icon name="check" size={22} /></span>
      <p class="i-eyebrow">time</p>
      <h1 class="i-title">{score} {score === 1 ? 'call' : 'calls'} in {DURATION} seconds</h1>
      <p class="i-line">{answered} answered · {answered > 0 ? Math.round((score / answered) * 100) : 0}% landed</p>
      <p class="done-note">
        {score === 0
          ? 'warming up — every call you make sticks a little better. run it again.'
          : 'no streak, no leaderboard — just reps. the more you call, the faster they come.'}
      </p>
      {#if missList.length > 0}
        <div class="done-misses">
          <p class="dm-h">slipped — worth a look</p>
          <ul>{#each missList as m (m.label)}<li>{m.label}</li>{/each}</ul>
        </div>
      {/if}
      <div class="i-actions">
        <button type="button" class="btn" onclick={start}>run it again</button>
        <a class="btn ghost" href="/today">back to today</a>
      </div>
    </section>

  {:else}
    <!-- intro -->
    <section class="intro on-cream">
      <span class="i-mark" aria-hidden="true"><Icon name="exam" size={22} /></span>
      <p class="i-eyebrow">a sixty-second warm-up</p>
      <h1 class="i-title">the burst</h1>
      {#if introduced.length === 0}
        <p class="i-line">nothing to burst yet</p>
        <ul class="i-rules">
          <li>take a module or two first — the burst quizzes everything you've met</li>
        </ul>
        <div class="i-actions"><a class="btn" href="/">start a module</a></div>
      {:else}
        <p class="i-line">{introduced.length} calls in the deck · 60 seconds</p>
        <ul class="i-rules">
          <li>rapid-fire over everything you've met — dishes, flags, builds, pours, pairings</li>
          <li>tap the call, it flips straight to the next — how many can you land?</li>
          <li>no streak, no leaderboard, nothing touches your reviews — it's just reps</li>
        </ul>
        <div class="i-actions">
          <button type="button" class="btn" onclick={start}>start the burst</button>
          <a class="btn ghost" href="/today">not now</a>
        </div>
      {/if}
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
    border-top: 3px solid var(--accent-bright); /* the burst's room — the orange spark */
    box-shadow: var(--shadow-flash);
    text-align: center;
    animation: card-in 0.25s ease;
  }
  @keyframes card-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: none; }
  }
  .i-mark {
    width: 48px;
    height: 48px;
    margin: 0 auto;
    display: grid;
    place-items: center;
    border-radius: 14px;
    border: 2px solid var(--accent-bright);
    color: var(--accent-text);
    background: var(--bb-paper);
    box-shadow: var(--shadow-1);
  }
  .done .i-mark {
    border-color: var(--ok);
    color: var(--ok);
  }
  .i-eyebrow {
    margin: 14px 0 2px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--accent-text);
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
    color: var(--accent-text);
  }
  .i-rules {
    list-style: none;
    margin: 18px auto 0;
    padding: 14px 0 0;
    max-width: 42ch;
    border-top: 1px solid color-mix(in srgb, var(--accent-bright) 35%, transparent);
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
    background: var(--accent-bright);
  }
  .i-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 22px;
  }
  .done-note {
    margin: 12px auto 0;
    max-width: 40ch;
    font-size: 14px;
    color: var(--text-muted);
  }
  .done-misses {
    margin: 16px auto 0;
    max-width: 40ch;
    text-align: left;
    padding-top: 12px;
    border-top: 1px dashed var(--line);
  }
  .dm-h {
    margin: 0 0 6px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-label);
  }
  .done-misses ul {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 3px;
    font-size: 13.5px;
    color: var(--text-muted);
  }

  /* ---- the playing HUD ---- */
  .hud {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    max-width: 560px;
    margin: 0 auto;
  }
  .hud-time {
    font-family: var(--font-display);
    font-size: clamp(32px, 7vw, 44px);
    font-weight: 300;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
  }
  .hud-score {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 600;
    color: var(--accent-text);
  }
  .hud-lbl {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .bar {
    max-width: 560px;
    margin: 6px auto 18px;
    height: 6px;
    border-radius: 999px;
    background: var(--surface-track);
    overflow: hidden;
  }
  .bar-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--accent-bright);
    transition: width 0.2s linear;
  }
  .bcard {
    max-width: 560px;
    margin: 0 auto;
    padding: 22px 24px;
    background: var(--surface-card);
    border: 1px solid var(--line);
    border-radius: var(--radius-flash);
    box-shadow: var(--shadow-2);
    animation: card-in 0.16s ease;
  }
  .b-q {
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
    text-align: center;
    color: var(--text-strong);
  }
  .b-choices {
    display: grid;
    gap: 8px;
  }
  .b-choice {
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius-card);
    background: var(--surface-raised);
    color: var(--text-body);
    font: inherit;
    text-align: left;
    transition: background 0.12s ease, border-color 0.12s ease;
  }
  .b-choice:hover:not(:disabled) {
    background: var(--surface-hover);
    border-color: color-mix(in srgb, var(--accent-bright) 50%, transparent);
  }
  .b-choice.right {
    background: color-mix(in srgb, var(--ok) 18%, transparent);
    border-color: var(--ok);
    color: var(--text-strong);
  }
  .b-choice.wrong {
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    border-color: var(--accent);
    color: var(--text-strong);
  }
  .b-skip {
    text-align: center;
    margin-top: 16px;
  }
  .linkish {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 13px;
    text-decoration: underline dotted;
    text-underline-offset: 3px;
    min-height: 40px;
  }
  .linkish:hover {
    color: var(--accent-text);
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
    height: 64px;
  }
  .card-sk {
    max-width: 560px;
    height: 280px;
    border-radius: var(--radius-flash);
  }
  @keyframes sk-pulse {
    from { opacity: 0.55; }
    to { opacity: 1; }
  }
</style>
