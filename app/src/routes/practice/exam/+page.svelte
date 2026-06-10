<script lang="ts">
  import { data } from '$lib/data/index';
  import * as engine from '$lib/engine/training.js';
  import { buildExam, EXAM_MINUTES } from '$lib/engine/exam.js';
  import { progressStore } from '$lib/state/progress.svelte';
  import type { Card } from '$lib/data/types';
  import { tick, onDestroy } from 'svelte';

  // Question loop intentionally mirrors the root practice page's MC + typed
  // interaction (same classes, same reveal flow) — duplicated minimally rather
  // than extracted: the root loop is entangled with confidence chips, swipe-to-
  // grade, produce/flip modes and same-session requeue, none of which belong in
  // a timed exam (plain right/wrong, no confidence, no re-show).
  type View = 'preflight' | 'session' | 'summary';
  let view = $state<View>('preflight');
  let half = $state(false);
  let queue = $state<Card[]>([]);
  let idx = $state(0);
  let results = $state<{ card: Card; correct: boolean }[]>([]);

  let revealed = $state(false);
  let pendingCorrect = $state<boolean | null>(null);
  let chosen = $state<string | null>(null);
  let typedValue = $state('');
  let shuffledChoices = $state<string[]>([]);
  let revealEl = $state<HTMLDivElement | null>(null);
  let qEl = $state<HTMLParagraphElement | null>(null);
  let typedInput = $state<HTMLInputElement | null>(null);

  // Countdown (timer lives here, not in the engine): 12 min full / 6 min quick.
  let secondsLeft = $state(0);
  let durationSec = $state(0);
  let clockAnnounce = $state(''); // aria-live, updated at minute marks only
  let timerId: ReturnType<typeof setInterval> | null = null;
  function stopTimer() {
    if (timerId != null) clearInterval(timerId);
    timerId = null;
  }
  onDestroy(stopTimer);

  const card = $derived(queue[idx] as Card | undefined);
  // Exam mode is OBJECTIVE: discriminate cards are always MC; recall cards are MC
  // in the beginner boxes and typed once known (the root page's progression, minus
  // the self-graded produce/scenario modes).
  const box = $derived(card ? (progressStore.value.cards[card.id]?.box ?? 1) : 1);
  const cardMode = $derived(card && card.kind === 'recall' && box >= 3 ? 'typed' : 'mc');
  const clock = $derived(`${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`);
  const summary = $derived.by(() => {
    if (view !== 'summary') return null;
    const scored = engine.scoreReadiness(results);
    const weakDecks = Object.keys(scored.byDeck)
      .filter((d) => scored.byDeck[d].correct < scored.byDeck[d].total)
      .sort((a, b) => (scored.byDeck[a].correct / scored.byDeck[a].total) - (scored.byDeck[b].correct / scored.byDeck[b].total));
    return { ...scored, weakDecks };
  });

  $effect(() => {
    if (view !== 'session' || revealed) return;
    if (cardMode === 'typed' && typedInput) typedInput.focus();
    else if (qEl) qEl.focus();
  });

  function reset() {
    revealed = false; pendingCorrect = null; chosen = null; typedValue = '';
    if (card && cardMode === 'mc') shuffledChoices = engine.shuffle(card.choices ?? [card.answer], Math.random);
  }

  function startExam(quick: boolean) {
    half = quick;
    queue = buildExam(data, { half: quick });
    idx = 0; results = [];
    durationSec = (quick ? EXAM_MINUTES.half : EXAM_MINUTES.full) * 60;
    secondsLeft = durationSec;
    clockAnnounce = '';
    stopTimer();
    timerId = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) { expire(); return; }
      // SR-polite clock: announce at minute marks only (don't spam).
      if (secondsLeft % 60 === 0) clockAnnounce = `${secondsLeft / 60} minute${secondsLeft === 60 ? '' : 's'} remaining`;
    }, 1000);
    view = 'session';
    reset();
  }

  function chooseMC(choice: string) {
    if (revealed) return;
    chosen = choice;
    doReveal(choice === card!.answer);
  }
  function submitTyped() {
    if (revealed || !card) return;
    doReveal(engine.gradeTyped(card, typedValue));
  }
  function doReveal(isCorrect: boolean) {
    if (!card) return;
    revealed = true;
    pendingCorrect = isCorrect;
    // Exam answers also grade into Leitner — plain right/wrong, no confidence.
    progressStore.record(card, isCorrect);
    results.push({ card, correct: isCorrect });
    tick().then(() => revealEl?.focus());
  }
  function next() {
    idx += 1;
    if (idx >= queue.length) finish();
    else reset();
  }
  // Time's up: unanswered questions count as wrong (it's an exam), then auto-submit.
  function expire() {
    const from = revealed ? idx + 1 : idx;
    for (let i = from; i < queue.length; i++) results.push({ card: queue[i], correct: false });
    finish();
  }
  function finish() {
    stopTimer();
    const scored = engine.scoreReadiness(results);
    progressStore.recordExam(scored, durationSec - Math.max(0, secondsLeft), queue.length);
    view = 'summary';
  }

  function onKey(e: KeyboardEvent) {
    if (view !== 'session' || !card) return;
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (!revealed && cardMode === 'mc' && /^[1-4]$/.test(e.key)) {
      const i = parseInt(e.key, 10) - 1;
      if (shuffledChoices[i]) { e.preventDefault(); chooseMC(shuffledChoices[i]); }
    } else if (revealed && e.key === 'Enter') { e.preventDefault(); next(); }
  }
</script>

<svelte:window onkeydown={onKey} />
<svelte:head><title>Mock Exam · Bridgette Training</title></svelte:head>

<section class="screen on-dark">
  {#if view === 'preflight'}
    <p class="h-eyebrow"><a href="/" class="back">← Practice</a> · Mock Exam</p>
    <h1>Mock menu test</h1>
    <p class="sub">A timed run at the real thing: 30 mixed questions across every objective deck, suggested 12 minutes, closed book — no peeking at Reference. Plain right or wrong, and every answer still counts toward your decks.</p>
    <div class="card preflight">
      <h3>Before you start</h3>
      <ul class="rules">
        <li><strong>30 questions</strong> — identity, pairing, levers, structure, translator, mystery, upsell.</li>
        <li><strong>12 minutes</strong> suggested — it auto-submits when time runs out.</li>
        <li><strong>Closed book</strong> — answer from memory, like on the floor.</li>
      </ul>
      <div class="gradebar" style="justify-content:flex-start">
        <button class="btn" type="button" onclick={() => startExam(false)}>Full exam (30)</button>
        <button class="btn ghost" type="button" onclick={() => startExam(true)}>Quick exam (16)</button>
      </div>
    </div>

  {:else if view === 'session' && card}
    <div class="session-top">
      <p class="meta">
        Question {idx + 1} of {queue.length}
        · {(engine.DECKS as Record<string, { label: string }>)[card.deck]?.label ?? card.deck}
        · <span class="clock" class:low={secondsLeft <= 60}>{clock}</span>
      </p>
      <div class="bar" role="progressbar" aria-valuenow={Math.round((idx / queue.length) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Exam progress">
        <span style={`width:${Math.round((idx / queue.length) * 100)}%`}></span>
      </div>
    </div>

    <!-- minute-mark clock announcements only (SR-polite) -->
    <p class="visually-hidden" aria-live="polite" aria-atomic="true">{clockAnnounce}</p>
    <!-- reveal announcement, same persistent-region pattern as the root practice page -->
    <p class="visually-hidden" aria-live="polite" aria-atomic="true">
      {revealed ? (pendingCorrect ? 'Correct. ' : 'Not quite. The answer is ' + card.answer + '. ') : ''}
    </p>

    <div class="flash flashcard-face">
      <p class="q" tabindex="-1" bind:this={qEl}>{card.prompt}</p>

      {#if !revealed}
        {#if cardMode === 'mc'}
          <div class="gradebar choices">
            {#each shuffledChoices as choice, i}
              <button class="btn ghost choice" type="button" onclick={() => chooseMC(choice)}>
                <span class="key" aria-hidden="true">{i + 1}</span>{choice}
              </button>
            {/each}
          </div>
        {:else}
          <div class="typed-row">
            <input type="text" bind:this={typedInput} bind:value={typedValue} aria-label="Type your answer" autocomplete="off"
              onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitTyped(); } }} />
            <button class="btn" type="button" onclick={submitTyped}>Check</button>
          </div>
        {/if}
      {:else}
        <div class="reveal" tabindex="-1" bind:this={revealEl}>
          {#if pendingCorrect === false && (chosen ?? typedValue)}
            <div class="miss-banner">
              <p class="mb said"><svg class="mb-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg><span class="mb-k">You said</span> <span class="mb-v">{chosen ?? typedValue}</span></p>
              <p class="mb corr"><svg class="mb-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg><span class="mb-k">Correct</span> <span class="mb-v">{card.answer}</span></p>
            </div>
          {:else}
            <p class="ans">{card.answer}</p>
            <p class="feedback" class:ok={pendingCorrect === true} class:no={pendingCorrect === false}>
              <span aria-hidden="true">{pendingCorrect ? '✓' : '•'}</span>
              {pendingCorrect ? 'Correct.' : 'Not quite — here’s the answer.'}
            </p>
          {/if}
          <div class="gradebar">
            <button class="btn" type="button" onclick={next}>{idx + 1 >= queue.length ? 'Finish' : 'Next'} <span aria-hidden="true">→</span></button>
          </div>
        </div>
      {/if}
    </div>

  {:else if view === 'summary' && summary}
    <p class="h-eyebrow">Mock Exam</p>
    <h1>{summary.score}% — {half ? 'quick' : 'full'} exam</h1>
    <div class="summary-hero">
      <div class="ring" role="img" aria-label={`${summary.score}% on this exam`} style={`--p:${summary.score}`}><span aria-hidden="true">{summary.score}%</span></div>
      <div>
        <p class="sub" style="margin:0">{summary.correct} of {summary.total} correct.</p>
        {#if summary.weakAreas.length}<p class="meta" style="margin:6px 0 0">Weak areas: {summary.weakAreas.slice(0, 6).join(', ')}.</p>{/if}
      </div>
    </div>

    <h2 class="section-h">By deck</h2>
    <table class="exam-table">
      <thead><tr><th scope="col">Deck</th><th scope="col">Score</th></tr></thead>
      <tbody>
        {#each Object.keys(summary.byDeck) as d}
          <tr><th scope="row">{(engine.DECKS as Record<string, { label: string }>)[d]?.label ?? d}</th><td>{summary.byDeck[d].correct}/{summary.byDeck[d].total}</td></tr>
        {/each}
      </tbody>
    </table>

    {#if summary.weakDecks.length}
      <h2 class="section-h">Drill what you missed</h2>
      <div class="weak-list">
        {#each summary.weakDecks as d}
          <a class="weak-pill" href={'/?deck=' + encodeURIComponent(d)}>{(engine.DECKS as Record<string, { label: string }>)[d]?.label ?? d}</a>
        {/each}
      </div>
    {/if}

    <div class="gradebar" style="justify-content:flex-start; margin-top:18px">
      <button class="btn" type="button" onclick={() => (view = 'preflight')}>Take another</button>
      <a class="btn ghost" href="/progress">See Progress</a>
      <a class="btn ghost" href="/">Back to Practice</a>
    </div>
  {/if}
</section>

<style>
  .back { color: var(--highlight); text-decoration: none; }
  .preflight { max-width: 520px; }
  .rules { margin: 8px 0 14px; padding-left: 18px; }
  .rules li { margin: 0 0 6px; font-size: 14px; color: var(--text-muted); }
  .session-top { max-width: 520px; margin: 0 auto 12px; }
  .bar { height: 8px; border-radius: 999px; background: var(--surface-track); overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--highlight); transition: width .25s ease; }
  .clock { font-variant-numeric: tabular-nums; font-weight: 700; }
  .clock.low { color: var(--accent-text); }
  .choices { flex-direction: column; }
  .choice { justify-content: flex-start; }
  .choice .key { font-family: var(--font-display); font-weight: 800; margin-right: 8px; opacity: .7; }
  .typed-row { display: flex; gap: 8px; justify-content: center; }
  .typed-row input { flex: 1; max-width: 320px; padding: 11px 14px; border-radius: var(--radius-btn); border: 1px solid var(--line); font-size: 16px; }
  .feedback { font-weight: 800; margin: 0; }
  .feedback.ok { color: var(--ok); }
  .feedback.no { color: var(--accent); }
  .reveal:focus { outline: none; }
  .q:focus { outline: none; }
  .miss-banner { display: grid; max-width: 460px; margin: 0 auto; border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); border-radius: var(--radius-nav); overflow: hidden; text-align: left; }
  .mb { display: flex; align-items: center; gap: 8px; margin: 0; padding: 9px 12px; font-size: 16px; font-weight: 700; }
  .mb-ic { width: 18px; height: 18px; flex: none; }
  .mb-k { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; }
  .mb.said { background: color-mix(in srgb, var(--accent) 8%, transparent); color: var(--accent); }
  .mb.corr { background: color-mix(in srgb, var(--ok) 12%, transparent); color: var(--ok); border-top: 1px solid color-mix(in srgb, var(--ok) 22%, transparent); }
  .summary-hero { display: flex; align-items: center; gap: 18px; margin: 10px 0 18px; flex-wrap: wrap; }
  .section-h { font-size: 15px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .06em; color: var(--highlight); }
  .exam-table { border-collapse: collapse; margin: 0 0 18px; min-width: 260px; }
  .exam-table th, .exam-table td { text-align: left; padding: 6px 16px 6px 0; font-size: 14px; border-bottom: 1px solid var(--surface-track); }
  .exam-table thead th { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); }
  .exam-table tbody th { font-weight: 600; color: var(--text-strong); }
  .weak-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .weak-pill { display: inline-block; font-size: 12px; padding: 6px 11px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 18%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent); color: var(--text-strong); text-decoration: none; }
  .weak-pill:hover { background: color-mix(in srgb, var(--accent) 30%, transparent); }
</style>
