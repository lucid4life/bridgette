<script lang="ts">
  import { data } from '$lib/data/index';
  import * as engine from '$lib/engine/training.js';
  import { LEVERS } from '$lib/engine/pairing.js';
  import { progressStore } from '$lib/state/progress.svelte';
  import { playPronunciation } from '$lib/audio/playPronunciation';
  import Expandable from '$lib/components/Expandable.svelte';
  import StructureMeter from '$lib/components/StructureMeter.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import type { Card } from '$lib/data/types';
  import { tick, onMount } from 'svelte';
  import { page } from '$app/state';

  let revealEl = $state<HTMLDivElement | null>(null);
  let typedInput = $state<HTMLInputElement | null>(null);
  let qEl = $state<HTMLParagraphElement | null>(null);
  let hadMisses = $state(false);

  onMount(() => {
    // Today's cockpit CTAs + Progress weak-pills deep-link here with an intent (spec §5).
    // Learn's "Drill {deck} now" completion CTA deep-links with ?deck=<id> to focus one deck;
    // validate against the known decks so a bad param falls back to the home screen.
    const s = page.url.searchParams.get('start');
    const drillId = page.url.searchParams.get('drill');
    const deck = page.url.searchParams.get('deck');
    if (drillId) startDrillById(drillId);
    else if (deck && (Object.keys(engine.DECKS) as string[]).includes(deck)) startSession(deck);
    else if (s === 'readiness') startReadiness();
    else if (s === 'smart') startSession(null);
  });

  type View = 'home' | 'session' | 'summary';
  type Conf = 'sure' | 'shaky' | null;

  let view = $state<View>('home');
  let kind = $state<'practice' | 'readiness'>('practice');
  let deckId = $state<string | null>(null);
  let queue = $state<Card[]>([]);
  let idx = $state(0);
  let baseTotal = $state(0);
  let requeued = $state<Record<string, boolean>>({});
  let results = $state<{ id: string; correct: boolean; deck: string; confidence?: Conf }[]>([]);
  let correct = $state(0);
  let total = $state(0);

  let revealed = $state(false);
  let pendingCorrect = $state<boolean | null>(null);
  let confidence = $state<Conf>(null);
  let chosen = $state<string | null>(null);
  let typedValue = $state('');
  let shuffledChoices = $state<string[]>([]);
  let hypercorrection = $state(false);
  let summary = $state<{ correct: number; total: number; pct: number; weak: string[]; sureWrong?: number } | null>(null);
  let missed = $state<Card[]>([]);

  // UX-01: mobile tap-to-flip + swipe-to-grade. The buttons + window keyboard handler
  // remain the accessibility path (WCAG 2.5.7 dragging alternative); this is additive.
  let dragX = $state(0);
  let dragging = $state(false);
  let ptrStart: { x: number; y: number; id: number } | null = null;

  const card = $derived(queue[idx] as Card | undefined);
  const box = $derived(card ? (progressStore.value.cards[card.id]?.box ?? 1) : 1);
  const cardMode = $derived(card ? engine.modeForBox(card, box) : 'mc');
  const why = $derived(card ? engine.whyDisplay(card, box) : { label: '', text: '' });
  // Rich miss-feedback (spec §4c): you-said / correct / why + a generalised same-family
  // confusion beat — computed in the engine (engine.missFeedback), not the component.
  const feedback = $derived.by(() => {
    if (!revealed || !card) return null;
    const said = chosen ?? ((cardMode === 'typed' || cardMode === 'scenario') ? typedValue : null);
    return engine.missFeedback(card, said, data);
  });
  // The brief "You said / Correct" banner shows only when the learner committed a value.
  const showMissBanner = $derived(revealed && pendingCorrect === false && !!feedback && !!feedback.said);
  // The always-available Expand drawer (spec §4b): depth that's already in the data.
  const expanded = $derived(card ? engine.expandFor(card, data).sections : []);
  // Pairing-lever miss contrast: resolve a lever LABEL (the card answer/choice text)
  // back to its {label, script} so a miss can contrast the two levers' floor scripts.
  const leverByLabel: Record<string, { label: string; script: string }> = {};
  for (const k of Object.keys(LEVERS)) {
    const lv = (LEVERS as Record<string, { label: string; script: string }>)[k];
    leverByLabel[lv.label] = lv;
  }
  // A11Y-18: focus the typed/scenario input on card entry so you can type immediately.
  $effect(() => {
    if (view !== 'session' || revealed) return;
    // A11Y-18/N2: land focus on a new card so SR/keyboard never drop to <body>.
    if ((cardMode === 'typed' || cardMode === 'scenario') && typedInput) typedInput.focus();
    else if (qEl) qEl.focus(); // mc/flip: focus the prompt
  });
  const progressPct = $derived(baseTotal ? Math.round((Math.min(idx, baseTotal) / baseTotal) * 100) : 0);
  const focusDecks = (Object.keys(engine.DECKS) as string[]).filter((d) => d !== 'mystery');
  const weakCount = $derived(progressStore.weakCards().length);
  const streakCount = $derived(progressStore.dailyStreak().count);

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

  // CT-02: drill an explicit set of cards (the just-missed ones, or the persistent
  // weak list) — NOT a fresh Smart Review (which the "Drill the misses" button used to do).
  function startDrill(cards: Card[]) {
    if (!cards.length) return;
    kind = 'practice'; deckId = null; queue = [...cards]; idx = 0; baseTotal = cards.length;
    requeued = {}; results = []; correct = 0; total = 0; caughtUp = false;
    view = 'session'; reset();
  }
  // A11Y-07/UX-3: a Progress weak-pill drills THAT card, not a generic Smart Review.
  function startDrillById(id: string) {
    const card = engine.allCards(data).find((c) => c.id === id);
    if (card) startDrill([card]);
    else startSession(null);
  }

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
    pendingCorrect = null; // self-graded for pronounce / produce
    tick().then(() => revealEl?.focus());
  }
  // UX-3 (spec §6): self-rate a PRODUCED answer. Nailed → correct + sure; Close →
  // correct + shaky (re-shown sooner via the confidence weight); Missed → wrong.
  function rate(r: 'nailed' | 'close' | 'missed') {
    confidence = r === 'missed' ? 'shaky' : r === 'close' ? 'shaky' : 'sure';
    commit(r !== 'missed');
  }
  function doReveal(isCorrect: boolean) {
    revealed = true;
    pendingCorrect = isCorrect;
    if (kind !== 'readiness' && confidence === 'sure' && !isCorrect) hypercorrection = true; // loud correction (spec §9), practice only
    tick().then(() => revealEl?.focus()); // move focus to the answer (spec §6/§14)
  }

  function commit(isCorrect: boolean) {
    if (!card) return;
    const c = card;
    if (kind === 'readiness') {
      total += 1; if (isCorrect) correct += 1;
      results.push({ id: c.id, correct: isCorrect, deck: c.deck, confidence });
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
      const scored = engine.scoreReadiness(queue.map((cd, i) => ({ card: cd, correct: results[i]?.correct ?? false, confidence: results[i]?.confidence })));
      progressStore.recordReadiness(scored);
      summary = { correct: scored.correct, total: scored.total, pct: scored.score, weak: scored.weakAreas.slice(0, 6), sureWrong: scored.sureWrong };
    } else {
      const pct = total ? Math.round((correct / total) * 100) : 0;
      const byId = new Map(engine.allCards(data).map((c: Card) => [c.id, c] as const));
      const ids = [...new Set(results.filter((r) => !r.correct).map((r) => r.id))];
      missed = ids.map((id) => byId.get(id)).filter((c): c is Card => !!c);
      // UX-05: human labels ("Translator: St. John Claret"), never raw slugs.
      summary = { correct, total, pct, weak: missed.map((c) => `${(engine.DECKS as Record<string, { label: string }>)[c.deck]?.label ?? c.deck}: ${c.answer}`) };
    }
    hadMisses = results.some((r) => !r.correct);
    view = 'summary';
    // Signal a completed session so the PWA can offer a quiet, contextual install
    // prompt (spec §13 — after the first session, never on load).
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('bb:session-complete'));
  }
  function speakCard(rate?: number) {
    if (card?.wineId) playPronunciation(card.wineId, card.audioText ?? card.answer, card.lang, undefined, rate);
  }
  // CT-12: split a respelling ("VAHG-ner SHTEM-pel") into stress-marked syllable chunks.
  function respellChunks(respell: string) {
    return respell.split(/\s+/).filter(Boolean).map((word) =>
      word.split('-').map((syl) => ({ syl, stress: /[A-Z]/.test(syl) && syl === syl.toUpperCase() }))
    );
  }

  function onPointerDown(e: PointerEvent) {
    if (view !== 'session' || !card) return;
    ptrStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }
  function onPointerMove(e: PointerEvent) {
    if (!ptrStart || e.pointerId !== ptrStart.id || !revealed) return;
    const dx = e.clientX - ptrStart.x;
    const dy = e.clientY - ptrStart.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) { dragging = true; dragX = dx; }
  }
  function onPointerUp(e: PointerEvent) {
    if (!ptrStart || e.pointerId !== ptrStart.id) { ptrStart = null; return; }
    const dx = e.clientX - ptrStart.x;
    const dy = e.clientY - ptrStart.y;
    const onControl = !!(e.target as HTMLElement).closest('button, a, input, textarea, summary');
    const wasDrag = dragging;
    dragX = 0; dragging = false; ptrStart = null;
    // swipe-to-grade on the revealed card: right = got it, left = didn't (A11Y-N4: not when
    // the drag started on a control, so dragging off a button can't commit the wrong grade)
    if (revealed && wasDrag && !onControl && Math.abs(dx) > 90) {
      // produce cards self-rate so the swipe carries confidence (right = nailed, left = missed),
      // not a raw commit with null confidence; other modes commit objectively.
      if (cardMode === 'produce') rate(dx > 0 ? 'nailed' : 'missed');
      else commit(dx > 0);
      return;
    }
    // tap-to-flip a pronunciation card (small move, not on a control)
    if (!revealed && cardMode === 'flip' && !onControl && Math.abs(dx) < 10 && Math.abs(dy) < 10) flipReveal();
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
      if (cardMode === 'produce') {
        if (e.key === '1') { e.preventDefault(); rate('nailed'); }
        else if (e.key === '2') { e.preventDefault(); rate('close'); }
        else if (e.key === '3') { e.preventDefault(); rate('missed'); }
      } else if (cardMode === 'mc' && pendingCorrect != null) {
        if (e.key === 'Enter') { e.preventDefault(); commit(pendingCorrect); }
      } else if (e.key === '1') { e.preventDefault(); commit(true); }
      else if (e.key === '2') { e.preventDefault(); commit(false); }
      else if (e.key === 'Enter' && pendingCorrect != null) { e.preventDefault(); commit(pendingCorrect); }
    } else if ((e.code === 'Space' || e.key === ' ') && cardMode === 'flip') {
      e.preventDefault(); flipReveal();
    }
  }
</script>

<svelte:window onkeydown={onKey} />
<svelte:head><title>Practice · Bridgette Training</title></svelte:head>

<section class="screen on-dark">
  {#if view === 'home'}
    <p class="h-eyebrow">Practice</p>
    <h1>Build the muscle memory</h1>
    <p class="sub">Smart Review mixes what's due and weak. Or focus a single deck. Cards get harder as you master them.</p>

    <div class="basics-row">
      <div class="basics-toggle" role="group" aria-label="Study scope">
        <button class="chip" type="button" aria-pressed={progressStore.basicsOnly} onclick={() => progressStore.setBasicsOnly(true)}>Just the basics</button>
        <button class="chip" type="button" aria-pressed={!progressStore.basicsOnly} onclick={() => progressStore.setBasicsOnly(false)}>Study everything</button>
      </div>
      <p class="meta basics-note">{progressStore.basicsOnly ? 'Smart Review is drawing from the ~42 high-yield Floor Basics — switch to the full deck anytime.' : 'Smart Review is drawing from the full menu.'}</p>
    </div>

    <div class="grid cols-2" style="margin-bottom:24px">
      <div class="card">
        <h3><svg class="tile-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M13 3 5 13h5l-1 8 8-11h-5z"/></svg> Smart Review</h3>
        <p class="meta">{progressStore.dueCount()} due · mixed decks</p>
        <button class="btn" type="button" style="margin-top:10px" onclick={() => startSession(null)}>Start</button>
      </div>
      <div class="card">
        <h3><svg class="tile-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 5h16v10H9l-4 4z"/></svg> Guest Simulator</h3>
        <p class="meta">Ask → Match → Explain → Confirm</p>
        <a class="btn ghost" href="/practice/simulator" style="margin-top:10px">Start</a>
      </div>
      <div class="card">
        <h3><svg class="tile-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 21h8M12 15v6M7 3h10v5a5 5 0 0 1-10 0z"/></svg> Pairing Explorer</h3>
        <p class="meta">Dish ↔ wine, lever by lever</p>
        <a class="btn ghost" href="/practice/pairing" style="margin-top:10px">Explore</a>
      </div>
      <div class="card">
        <h3><svg class="tile-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 4l1.6 4.8L18 10l-4.4 1.2L12 16l-1.6-4.8L6 10l4.4-1.2z"/></svg> Mystery Pour</h3>
        <p class="meta">Read the structure → name the pour</p>
        <button class="btn ghost" type="button" style="margin-top:10px" onclick={() => startSession('mystery')}>Deduce</button>
      </div>
      <div class="card">
        <h3><svg class="tile-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 21V4M6 4h11l-2 4 2 4H6"/></svg> Readiness Check</h3>
        <p class="meta">Mixed exam → % shift-ready</p>
        <button class="btn ghost" type="button" style="margin-top:10px" onclick={startReadiness}>Run</button>
      </div>
      <div class="card">
        <h3><svg class="tile-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 3h6v3H9zM6 6h12v15H6zM9 11h6M9 15h4"/></svg> Mock Exam</h3>
        <p class="meta">30 timed questions · closed book</p>
        <a class="btn ghost" href="/practice/exam" style="margin-top:10px">Sit it</a>
      </div>
      <div class="card">
        <h3><svg class="tile-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.6-6.3M21 4v4h-4"/></svg> My Mistakes</h3>
        <p class="meta">{weakCount ? weakCount + ' to clean up' : 'Nothing to fix yet'}</p>
        <button class="btn ghost" type="button" style="margin-top:10px" onclick={() => startDrill(progressStore.weakCards())} disabled={weakCount === 0}>Drill</button>
      </div>
    </div>
    <h3 style="margin:0 0 10px"><svg class="tile-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg> Focus a deck</h3>
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

    <!-- persistent live region: must be mounted BEFORE its text changes so SRs announce the reveal -->
    <p class="visually-hidden" aria-live="polite" aria-atomic="true">
      {revealed
        ? (pendingCorrect === true ? 'Correct. ' : pendingCorrect === false ? 'Not quite. ' + (showMissBanner ? 'You said ' + feedback?.said + '. ' : '') + 'The answer is ' + card.answer + '. ' : 'Answer: ' + card.answer + '. ')
          + (feedback?.confusion ? 'Easy mix-up: ' + feedback.confusion.chose.name + ' versus ' + feedback.confusion.answer.name + '. ' : '')
          + (why.text ? why.label + ': ' + why.text : (box >= 4 && card.why ? 'The reason: ' + card.why : ''))
        : ''}
    </p>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="flash flashcard-face"
      class:dragging
      class:swipe-yes={dragging && dragX > 40}
      class:swipe-no={dragging && dragX < -40}
      style={`transform: translateX(${dragX}px)`}
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointercancel={onPointerUp}
    >
      <p class="q" tabindex="-1" bind:this={qEl}>{card.prompt}</p>

      {#if !revealed}
        {#if cardMode !== 'produce'}
          <div class="conf" role="group" aria-label="How sure are you?">
            <span class="meta">How sure?</span>
            <button class="chip" type="button" aria-pressed={confidence === 'sure'} onclick={() => (confidence = 'sure')}>Sure</button>
            <button class="chip" type="button" aria-pressed={confidence === 'shaky'} onclick={() => (confidence = 'shaky')}>Shaky</button>
          </div>
        {/if}

        {#if cardMode === 'produce'}
          <p class="meta gen-nudge">Say your pour and the one reason it works — out loud. Then reveal.</p>
          <div class="gradebar">
            <button class="btn gold" type="button" onclick={flipReveal}>Reveal answer</button>
          </div>
        {:else if cardMode === 'mc'}
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
            {#if card.audioText}<button class="btn ghost" type="button" onclick={() => speakCard()}><Icon name="speaker" /> Hear it</button>{/if}
            {#if card.audioText}<button class="btn ghost" type="button" aria-label="Hear it slowly" onclick={() => speakCard(0.7)}><Icon name="slow" /> Slow</button>{/if}
            <button class="btn gold" type="button" onclick={flipReveal}>Flip to answer</button>
          </div>
        {:else}
          {#if cardMode === 'scenario' && card.scenario}<p class="meta scenario">{card.scenario}</p>{/if}
          {#if box >= 4 && cardMode === 'typed'}<p class="meta gen-nudge">First, say the one structural reason it fits out loud — then check.</p>{/if}
          <div class="typed-row">
            <input type="text" bind:this={typedInput} bind:value={typedValue} aria-label="Type your answer" autocomplete="off"
              onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitTyped(); } }} />
            <button class="btn" type="button" onclick={submitTyped}>Check</button>
          </div>
        {/if}
      {:else}
        <div class="reveal" tabindex="-1" bind:this={revealEl}>
          {#if showMissBanner}
            <!-- Rich miss-feedback: what you said vs the correct answer (spec §4c). -->
            <div class="miss-banner">
              <p class="mb said"><svg class="mb-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg><span class="mb-k">You said</span> <span class="mb-v">{feedback?.said}</span></p>
              <p class="mb corr"><svg class="mb-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg><span class="mb-k">Correct</span> <span class="mb-v">{card.answer}</span></p>
            </div>
            {#if card.deck === 'pairing-principle' && feedback && leverByLabel[feedback.said] && leverByLabel[card.answer]}
              <!-- Lever contrast: a missed lever is a wrong MODEL — show both floor scripts side by side. -->
              <p class="confusion"><strong>You picked:</strong> {feedback.said} — {leverByLabel[feedback.said].script}</p>
              <p class="confusion"><strong>The lever here:</strong> {card.answer} — {leverByLabel[card.answer].script}</p>
            {/if}
          {:else}
            {#if card.kind === 'pronounce'}
              <p class="ans respell" aria-label={'Say: ' + card.answer}>{#each respellChunks(card.answer) as word, wi}{#if wi > 0}<span class="resp-gap"> </span>{/if}{#each word as part, pi}{#if pi > 0}<span class="resp-sep" aria-hidden="true">·</span>{/if}<span class="syl" class:stress={part.stress}>{part.syl}</span>{/each}{/each}</p>
            {:else}
              <p class="ans">{card.answer}</p>
            {/if}
            {#if pendingCorrect != null}
              <p class="feedback" class:ok={pendingCorrect} class:no={!pendingCorrect}>
                <span aria-hidden="true">{pendingCorrect ? '✓' : '•'}</span>
                {pendingCorrect ? 'Correct.' : 'Not quite — here’s the answer.'}
              </p>
            {/if}
          {/if}
          {#if feedback?.confusion}
            <p class="confusion"><strong>Easy mix-up</strong> — both are {feedback.confusion.answer.family}. {feedback.confusion.chose.name} is the wrong call here; {feedback.confusion.answer.name}: {feedback.confusion.answer.tenSecond}</p>
          {/if}
          {#if why.text}<p class="why"><strong>{why.label}:</strong> {why.text}</p>{/if}
          {#if box >= 4 && !why.text && card.why}<p class="why"><strong>The reason:</strong> {card.why}</p>{/if}
          {#if expanded.length}
            <Expandable label="Expand — the full card">
              {#each expanded as s (s.label)}
                <div class="exp-sect">
                  <div class="exp-h">{s.label}</div>
                  {#if s.text}
                    <p class="exp-t">{s.text}</p>
                  {:else if s.items}
                    <div class="exp-pills">{#each s.items as it}<span class="pill alt">{it}</span>{/each}</div>
                  {:else if s.structure}
                    <div class="exp-meters">
                      <StructureMeter label="Acidity" level={s.structure.acidity} />
                      <StructureMeter label="Body" level={s.structure.body} />
                      <StructureMeter label="Tannin" level={s.structure.tannin} />
                    </div>
                    <p class="exp-t sweet">Sweetness: {s.structure.sweetness}</p>
                  {:else if s.objections}
                    {#each s.objections as o}<p class="exp-obj"><strong>{o.cue}</strong> {o.reply}</p>{/each}
                  {:else if s.picks}
                    <div class="exp-picks">{#if s.picks.wine}<span><b>Wine</b> {s.picks.wine}</span>{/if}{#if s.picks.cocktail}<span><b>Cocktail</b> {s.picks.cocktail}</span>{/if}{#if s.picks.zero}<span><b>Zero-proof</b> {s.picks.zero}</span>{/if}</div>
                  {/if}
                </div>
              {/each}
            </Expandable>
          {/if}
          {#if card.learnLink}
            <p class="explain"><a class="explain-link" href={'/learn#' + card.learnLink}>Explain this <span aria-hidden="true">→</span></a></p>
          {/if}
          <div class="gradebar">
            {#if card.audioText}<button class="btn ghost" type="button" aria-label="Hear it" onclick={() => speakCard()}><Icon name="speaker" /></button>{/if}
            {#if card.audioText}<button class="btn ghost" type="button" aria-label="Hear it slowly" onclick={() => speakCard(0.7)}><Icon name="slow" /></button>{/if}
            {#if cardMode === 'produce'}
              <button class="btn" type="button" onclick={() => rate('nailed')}>Nailed it</button>
              <button class="btn ghost" type="button" onclick={() => rate('close')}>Close</button>
              <button class="btn ghost" type="button" onclick={() => rate('missed')}>Missed</button>
            {:else if cardMode === 'mc'}
              <button class="btn" type="button" onclick={() => commit(pendingCorrect!)}>Continue <span aria-hidden="true">→</span></button>
            {:else}
              <button class="btn" type="button" onclick={() => commit(true)}>I got it (1)</button>
              <button class="btn ghost" type="button" onclick={() => commit(false)}>I didn't (2)</button>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    {#if hypercorrection}
      <!-- A11Y-N7: polite, not assertive — the reveal region already announced the answer;
           this is added emphasis (also visually loud) and must not pre-empt it. -->
      <div class="hyper" role="status">
        <strong>Worth re-learning:</strong> you were confident but this one's <em>{card.answer}</em>. It'll come back this session.
      </div>
    {/if}

  {:else if view === 'summary' && summary}
    <p class="h-eyebrow">{kind === 'readiness' ? 'Readiness Check' : 'Session complete'}</p>
    <h1>{kind === 'readiness' ? `${summary.pct}% shift-ready` : caughtUp ? "You're caught up" : 'Nice work'}</h1>
    {#if caughtUp}
      <p class="sub">Nothing is due right now — rest is part of spacing. Tap Back to Practice to drill a deck.</p>
    {:else if kind === 'readiness'}
      <p class="sub">{summary.correct} of {summary.total} correct.{summary.weak.length ? ' Weak areas: ' + summary.weak.join(', ') + '.' : ''}</p>
    {:else}
      <div class="summary-hero">
        <div class="ring" role="img" aria-label={`${summary.pct}% correct this session`} style={`--p:${summary.pct}`}><span aria-hidden="true">{summary.pct}%</span></div>
        <div>
          <p class="sub" style="margin:0">{summary.correct} of {summary.total} correct.</p>
          <p class="meta" style="margin:6px 0 0"><span aria-hidden="true">🔥</span> {streakCount}-day streak{summary.weak.length ? ' · Weak: ' + summary.weak.join(', ') : ''}</p>
        </div>
      </div>
    {/if}
    {#if kind === 'readiness' && summary.sureWrong}
      <p class="meta"><span aria-hidden="true">⚠</span> You were sure but missed {summary.sureWrong} — those confident-wrong answers are the dangerous ones; re-learn them first.</p>
    {/if}
    {#if kind === 'readiness' && !caughtUp}
      <p class="meta">Confidence-weighted: a shaky-but-right answer counts less than a sure-and-right one — so this number is honest.</p>
    {/if}
    <div class="gradebar" style="justify-content:flex-start">
      {#if hadMisses && kind === 'practice'}
        <button class="btn" type="button" onclick={() => startDrill(missed)}>Drill the misses</button>
      {/if}
      <button class="btn ghost" type="button" onclick={() => (view = 'home')}>Back to Practice</button>
      <a class="btn ghost" href="/progress">See Progress</a>
    </div>
  {/if}
</section>

<style>
  .basics-row { margin: 0 0 22px; }
  .basics-toggle { display: inline-flex; gap: 8px; }
  .basics-note { margin: 8px 0 0; }
  .session-top { max-width: 520px; margin: 0 auto 12px; }
  .bar { height: 8px; border-radius: 999px; background: var(--surface-track); overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--highlight); transition: width .25s ease; }
  .conf { display: flex; align-items: center; gap: 8px; justify-content: center; }
  .choices { flex-direction: column; }
  .choice { justify-content: flex-start; }
  .choice .key { font-family: var(--font-display); font-weight: 800; margin-right: 8px; opacity: .7; }
  .typed-row { display: flex; gap: 8px; justify-content: center; }
  .typed-row input { flex: 1; max-width: 320px; padding: 11px 14px; border-radius: var(--radius-btn); border: 1px solid var(--line); font-size: 16px; }
  .scenario { font-style: italic; }
  .gen-nudge { border-left: 2px solid var(--highlight); padding-left: 8px; max-width: 480px; margin: 4px auto; text-align: left; }
  .feedback { font-weight: 800; margin: 0; }
  .feedback.ok { color: var(--ok); }
  .feedback.no { color: var(--accent); }
  .reveal:focus { outline: none; } /* focus moved here programmatically on reveal */
  .q:focus { outline: none; } /* prompt is focused programmatically on card entry (A11Y-N2) */
  .why { background: color-mix(in srgb, var(--info) 12%, transparent); border-radius: var(--radius-nav); padding: 10px; font-size: 14px; margin: 4px 0 0; }
  .confusion { background: color-mix(in srgb, var(--accent) 10%, transparent); border-radius: var(--radius-nav); padding: 8px 10px; font-size: 13px; margin: 6px 0 0; }
  /* Rich miss-feedback banner — you-said (accent) over correct (green). */
  .miss-banner { display: grid; max-width: 460px; margin: 0 auto; border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); border-radius: var(--radius-nav); overflow: hidden; text-align: left; }
  .mb { display: flex; align-items: center; gap: 8px; margin: 0; padding: 9px 12px; font-size: 16px; font-weight: 700; }
  .mb-ic { width: 18px; height: 18px; flex: none; }
  .mb-k { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; }
  .mb.said { background: color-mix(in srgb, var(--accent) 8%, transparent); color: var(--accent); }
  .mb.corr { background: color-mix(in srgb, var(--ok) 12%, transparent); color: var(--ok); border-top: 1px solid color-mix(in srgb, var(--ok) 22%, transparent); }
  /* Expand drawer sections (cream face). */
  .exp-sect { margin: 0 0 11px; text-align: left; }
  .exp-sect:last-child { margin-bottom: 0; }
  .exp-h { font-family: var(--font-display); text-transform: uppercase; letter-spacing: .05em; font-size: 10px; font-weight: 700; color: var(--accent); margin: 0 0 3px; }
  .exp-t { margin: 0; font-size: 14px; color: var(--text-strong); }
  .exp-t.sweet { margin-top: 4px; font-size: 13px; color: var(--text-muted); }
  .exp-pills { display: flex; flex-wrap: wrap; gap: 6px; }
  .exp-meters { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
  .exp-obj { margin: 0 0 6px; font-size: 13px; color: var(--text-strong); }
  .exp-obj strong { display: block; color: var(--accent); }
  .exp-picks { display: flex; flex-direction: column; gap: 4px; font-size: 14px; color: var(--text-strong); }
  .exp-picks b { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); margin-right: 6px; }
  .summary-hero { display: flex; align-items: center; gap: 18px; margin: 10px 0 4px; flex-wrap: wrap; animation: hero-in .35s ease both; }
  /* UX-04: the --p ring fill is static-correct (animating the registered --p property
     proved fragile across mount timing); a transform/opacity entrance is the reliable delight. */
  @keyframes hero-in { from { opacity: 0; transform: translateY(8px); } }
  @media (prefers-reduced-motion: reduce) { .summary-hero { animation: none; } }
  /* CT-12: respelling as stress-marked syllable chunks (stress = weight + gold underline;
     all syllables stay full-ink so contrast holds — colour is never the only cue). */
  .respell { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; justify-content: center; }
  .syl.stress { font-weight: 800; text-decoration: underline; text-decoration-color: var(--highlight); text-underline-offset: 3px; }
  .resp-sep { opacity: .4; margin: 0 1px; }
  .resp-gap { width: 10px; display: inline-block; }
  .explain { margin: 8px 0 0; }
  .explain-link { color: var(--accent); font-weight: 600; font-size: 14px; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px; min-height: 24px; }
  .hyper { max-width: 520px; margin: 14px auto 0; padding: 12px 16px; border: 2px solid var(--accent); border-radius: var(--radius-card); background: color-mix(in srgb, var(--accent) 14%, transparent); }
  .deck-tile { display: grid; gap: 4px; text-align: left; cursor: pointer; }
  .deck-name { font-family: var(--font-display); font-size: 17px; text-transform: uppercase; }
  /* UX-01 swipe-to-grade: card follows the finger; snap-back is gated by reduced-motion. */
  .flash { touch-action: pan-y; transition: transform .2s ease; }
  .flash.dragging { transition: none; }
  .flash.swipe-yes { box-shadow: inset 8px 0 0 -2px var(--ok); }
  .flash.swipe-no { box-shadow: inset -8px 0 0 -2px var(--accent); }
  @media (prefers-reduced-motion: reduce) { .flash { transition: none; } }
</style>
