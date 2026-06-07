<script lang="ts">
  import { data } from '$lib/data/index';
  import * as engine from '$lib/engine/training.js';
  import { progressStore } from '$lib/state/progress.svelte';
  import { playPronunciation } from '$lib/audio/playPronunciation';
  import type { Card } from '$lib/data/types';

  type View = 'home' | 'session' | 'summary';
  type Conf = 'sure' | 'shaky' | null;

  let view = $state<View>('home');
  let kind = $state<'practice' | 'readiness'>('practice');
  let deckId = $state<string | null>(null);
  let queue = $state<Card[]>([]);
  let idx = $state(0);
  let baseTotal = $state(0);
  let requeued = $state<Record<string, boolean>>({});
  let results = $state<{ id: string; correct: boolean; deck: string }[]>([]);
  let correct = $state(0);
  let total = $state(0);

  let revealed = $state(false);
  let pendingCorrect = $state<boolean | null>(null);
  let confidence = $state<Conf>(null);
  let chosen = $state<string | null>(null);
  let typedValue = $state('');
  let shuffledChoices = $state<string[]>([]);
  let hypercorrection = $state(false);
  let summary = $state<{ correct: number; total: number; pct: number; weak: string[] } | null>(null);

  const card = $derived(queue[idx] as Card | undefined);
  const box = $derived(card ? (progressStore.value.cards[card.id]?.box ?? 1) : 1);
  const cardMode = $derived(card ? engine.modeForBox(card, box) : 'mc');
  const why = $derived(card ? engine.whyDisplay(card, box) : { label: '', text: '' });
  const progressPct = $derived(baseTotal ? Math.round((Math.min(idx, baseTotal) / baseTotal) * 100) : 0);
  const focusDecks = Object.keys(engine.DECKS) as string[];

  function reset() {
    revealed = false; pendingCorrect = null; confidence = null; chosen = null;
    typedValue = ''; hypercorrection = false;
    if (card && cardMode === 'mc') shuffledChoices = engine.shuffle(card.choices ?? [card.answer], Math.random);
  }

  function startSession(d: string | null) {
    const cards = engine.buildSession(d, { data, progress: progressStore.value });
    if (!cards.length) { summary = { correct: 0, total: 0, pct: 0, weak: [] }; view = 'summary'; caughtUp = true; return; }
    kind = 'practice'; deckId = d; queue = cards; idx = 0; baseTotal = cards.length;
    requeued = {}; results = []; correct = 0; total = 0; caughtUp = false;
    view = 'session'; reset();
  }
  let caughtUp = $state(false);

  function startReadiness() {
    const cards = engine.buildReadiness(data, {});
    kind = 'readiness'; deckId = null; queue = cards; idx = 0; baseTotal = cards.length;
    requeued = {}; results = []; correct = 0; total = 0; caughtUp = false;
    view = 'session'; reset();
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
  function flipReveal() {
    if (!card) return;
    revealed = true;
    pendingCorrect = null; // self-graded for pronounce
  }
  function doReveal(isCorrect: boolean) {
    revealed = true;
    pendingCorrect = isCorrect;
    if (confidence === 'sure' && !isCorrect) hypercorrection = true; // loud correction (spec §9)
  }

  function commit(isCorrect: boolean) {
    if (!card) return;
    const c = card;
    if (kind === 'readiness') {
      total += 1; if (isCorrect) correct += 1;
      results.push({ id: c.id, correct: isCorrect, deck: c.deck });
      advance();
      return;
    }
    const isReshow = !!requeued[c.id];
    if (!isReshow) {
      progressStore.recordWithConfidence(c, isCorrect, confidence);
      total += 1; if (isCorrect) correct += 1;
      results.push({ id: c.id, correct: isCorrect, deck: c.deck });
      if (!isCorrect) { requeued[c.id] = true; queue = [...queue, c]; } // gentle same-session re-show
    }
    advance();
  }
  function advance() {
    idx += 1;
    if (idx >= queue.length) finish();
    else reset();
  }
  function finish() {
    if (kind === 'readiness') {
      const scored = engine.scoreReadiness(queue.map((cd, i) => ({ card: cd, correct: results[i]?.correct ?? false })));
      progressStore.recordReadiness(scored);
      summary = { correct: scored.correct, total: scored.total, pct: scored.score, weak: scored.weakAreas.slice(0, 6) };
    } else {
      const pct = total ? Math.round((correct / total) * 100) : 0;
      const weak = results.filter((r) => !r.correct).map((r) => r.id);
      summary = { correct, total, pct, weak: [] };
    }
    view = 'summary';
  }
  function speakCard() {
    if (card?.wineId) playPronunciation(card.wineId, card.audioText ?? card.answer, card.lang);
  }

  function onKey(e: KeyboardEvent) {
    if (view !== 'session' || !card) return;
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (!revealed && cardMode === 'mc' && /^[1-4]$/.test(e.key)) {
      const i = parseInt(e.key, 10) - 1;
      if (shuffledChoices[i]) { e.preventDefault(); chooseMC(shuffledChoices[i]); }
      return;
    }
    if (revealed) {
      if (e.key === '1') { e.preventDefault(); commit(true); }
      else if (e.key === '2') { e.preventDefault(); commit(false); }
      else if (e.key === 'Enter' && pendingCorrect != null) { e.preventDefault(); commit(pendingCorrect); }
    } else if ((e.code === 'Space' || e.key === ' ') && cardMode === 'flip') {
      e.preventDefault(); flipReveal();
    }
  }
</script>

<svelte:window onkeydown={onKey} />

<section class="screen on-dark">
  {#if view === 'home'}
    <p class="h-eyebrow">Practice</p>
    <h1>Build the muscle memory</h1>
    <p class="sub">Smart Review mixes what's due and weak. Or focus a single deck. Cards get harder as you master them.</p>
    <div class="grid cols-3" style="margin-bottom:24px">
      <div class="card">
        <h3>⚡ Smart Review</h3>
        <p class="meta">{progressStore.dueCount()} due · mixed decks</p>
        <button class="btn" type="button" style="margin-top:10px" onclick={() => startSession(null)}>Start</button>
      </div>
      <div class="card">
        <h3>🏁 Readiness Check</h3>
        <p class="meta">Mixed exam → % shift-ready</p>
        <button class="btn ghost" type="button" style="margin-top:10px" onclick={startReadiness}>Run</button>
      </div>
      <div class="card">
        <h3>🍷 Guest Simulator</h3>
        <p class="meta">Ask → Match → Explain → Confirm</p>
        <a class="btn ghost" href="/practice/simulator" style="margin-top:10px">Start</a>
      </div>
    </div>
    <h3 style="margin:0 0 10px">🎯 Focus a deck</h3>
    <div class="grid cols-3">
      {#each focusDecks as d}
        {@const m = progressStore.masteryFor(d)}
        <button class="card deck-tile" type="button" onclick={() => startSession(d)}>
          <span class="deck-name">{(engine.DECKS as any)[d].label}</span>
          <span class="meta">{engine.generateDeck(d, data).length} cards · {m}% mastered</span>
        </button>
      {/each}
    </div>

  {:else if view === 'session' && card}
    <div class="session-top">
      <p class="meta">
        {kind === 'readiness'
          ? `Readiness ${Math.min(idx + 1, baseTotal)} of ${baseTotal}`
          : idx >= baseTotal
            ? `Quick review`
            : `Card ${idx + 1} of ${baseTotal}`}
        · {(engine.DECKS as any)[card.deck]?.label ?? card.deck} · box {box}
      </p>
      <div class="bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Session progress">
        <span style={`width:${progressPct}%`}></span>
      </div>
    </div>

    <div class="flash flashcard-face">
      <p class="q">{card.prompt}</p>

      {#if !revealed}
        {#if kind !== 'readiness'}
          <div class="conf" role="group" aria-label="How sure are you?">
            <span class="meta">How sure?</span>
            <button class="chip" type="button" aria-pressed={confidence === 'sure'} onclick={() => (confidence = 'sure')}>Sure</button>
            <button class="chip" type="button" aria-pressed={confidence === 'shaky'} onclick={() => (confidence = 'shaky')}>Shaky</button>
          </div>
        {/if}

        {#if cardMode === 'mc'}
          <div class="gradebar choices">
            {#each shuffledChoices as choice, i}
              <button class="btn ghost choice" type="button" onclick={() => chooseMC(choice)}>
                <span class="key" aria-hidden="true">{i + 1}</span>{choice}
              </button>
            {/each}
          </div>
        {:else if cardMode === 'flip'}
          <p class="meta">Say it out loud, then flip to check the respelling.</p>
          <div class="gradebar">
            {#if card.audioText}<button class="btn ghost" type="button" onclick={speakCard}>🔊 Hear it</button>{/if}
            <button class="btn gold" type="button" onclick={flipReveal}>Flip to answer</button>
          </div>
        {:else}
          {#if cardMode === 'scenario' && card.scenario}<p class="meta scenario">{card.scenario}</p>{/if}
          <div class="typed-row">
            <input type="text" bind:value={typedValue} aria-label="Type your answer" autocomplete="off"
              onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitTyped(); } }} />
            <button class="btn" type="button" onclick={submitTyped}>Check</button>
          </div>
        {/if}
      {:else}
        <p class="ans">{card.answer}</p>
        {#if pendingCorrect != null}
          <p class="feedback" class:ok={pendingCorrect} class:no={!pendingCorrect} aria-live="polite">
            {pendingCorrect ? 'Correct.' : 'Not quite — here’s the answer.'}
          </p>
        {/if}
        {#if why.text}<p class="why"><strong>{why.label}:</strong> {why.text}</p>{/if}
        <div class="gradebar">
          {#if card.audioText}<button class="btn ghost" type="button" onclick={speakCard}>🔊</button>{/if}
          <button class="btn" type="button" onclick={() => commit(true)}>I got it (1)</button>
          <button class="btn ghost" type="button" onclick={() => commit(false)}>I didn't (2)</button>
        </div>
      {/if}
    </div>

    {#if hypercorrection}
      <div class="hyper" role="alert">
        <strong>Worth re-learning:</strong> you were confident but this one's <em>{card.answer}</em>. It'll come back this session.
      </div>
    {/if}

  {:else if view === 'summary' && summary}
    <p class="h-eyebrow">{kind === 'readiness' ? 'Readiness Check' : 'Session complete'}</p>
    <h1>{kind === 'readiness' ? `${summary.pct}% shift-ready` : caughtUp ? "You're caught up" : `${summary.pct}% this session`}</h1>
    {#if caughtUp}
      <p class="sub">Nothing is due right now — rest is part of spacing. Drill a deck below or come back later.</p>
    {:else}
      <p class="sub">{summary.correct} of {summary.total} correct.{summary.weak.length ? ' Weak areas: ' + summary.weak.join(', ') + '.' : ''}</p>
    {/if}
    <div class="gradebar" style="justify-content:flex-start">
      <button class="btn" type="button" onclick={() => (view = 'home')}>Back to Practice</button>
      <a class="btn ghost" href="/progress">See Progress</a>
    </div>
  {/if}
</section>

<style>
  .session-top { max-width: 520px; margin: 0 auto 12px; }
  .bar { height: 8px; border-radius: 999px; background: rgba(255, 238, 215, .12); overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--gold); transition: width .25s ease; }
  .conf { display: flex; align-items: center; gap: 8px; justify-content: center; }
  .choices { flex-direction: column; }
  .choice { justify-content: flex-start; }
  .choice .key { font-family: var(--font-display); font-weight: 800; margin-right: 8px; opacity: .7; }
  .typed-row { display: flex; gap: 8px; justify-content: center; }
  .typed-row input { flex: 1; max-width: 320px; padding: 11px 14px; border-radius: var(--radius-btn); border: 1px solid var(--line-dark); font-size: 16px; }
  .scenario { font-style: italic; }
  .feedback { font-weight: 800; margin: 0; }
  .feedback.ok { color: var(--green); }
  .feedback.no { color: var(--accent-dark); }
  .why { background: rgba(67, 124, 147, .12); border-radius: var(--radius-nav); padding: 10px; font-size: 14px; margin: 4px 0 0; }
  .hyper { max-width: 520px; margin: 14px auto 0; padding: 12px 16px; border: 2px solid var(--accent-dark); border-radius: var(--radius-card); background: rgba(168, 50, 18, .14); }
  .deck-tile { display: grid; gap: 4px; text-align: left; cursor: pointer; }
  .deck-name { font-family: var(--font-display); font-size: 17px; text-transform: uppercase; }
</style>
