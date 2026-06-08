<script lang="ts">
  import { data } from '$lib/data/index';
  import * as engine from '$lib/engine/training.js';
  import { progressStore } from '$lib/state/progress.svelte';
  import type { Wine, Card } from '$lib/data/types';
  import { tick } from 'svelte';

  let revealEl = $state<HTMLParagraphElement | null>(null);
  let promptEl = $state<HTMLParagraphElement | null>(null);
  let doneEl = $state<HTMLHeadingElement | null>(null);

  type BeatKind = 'ask' | 'match' | 'explain' | 'objection' | 'upsell';
  type Beat = {
    kind: BeatKind;
    prompt: string;
    guestLine?: string;
    choices: string[];
    answer: string;
    cardId?: string; // pairing card to grade in Leitner (match beat only)
  };
  type Turn = { guest: string; beats: Beat[] };

  const VIBES = ['a date night', 'a birthday table of 6', 'a quick after-work drink', 'a celebration', 'two regulars at the bar'];
  const CELEBRATION = new Set(['a celebration', 'a birthday table of 6']);
  // Spec §7 "asked first?" — a scored Ask beat that drills the gather-info-first habit.
  const ASK_BEATS = [
    { prompt: 'Before you recommend — what do you confirm first?', answer: 'A style they love and any allergies', wrong: ['Nothing — just pour your favourite', 'The priciest bottle they’ll take', 'Whether they look like wine people'] },
    { prompt: 'They haven’t said what they like. Your first move?', answer: 'Ask about a wine they’ve enjoyed before', wrong: ['Default to the house wine', 'Recommend the most expensive', 'Guess from how they’re dressed'] },
    { prompt: 'What gets you to the right pour fastest?', answer: 'A quick question about their taste and the dish', wrong: ['A long speech about the whole list', 'Upselling before they’ve chosen', 'Pouring without asking'] }
  ];

  function pick<T>(arr: T[], n: number, exclude: T[] = []): T[] {
    return engine.shuffle(arr.filter((x) => !exclude.includes(x)), Math.random).slice(0, n);
  }
  function familyHint(w: Wine): string {
    return w.family === 'Bright & Crisp Whites' ? 'crisp white'
      : w.family === 'Round Whites' ? 'rounder white'
      : w.family === 'Light Reds' ? 'lighter red'
      : w.family === 'Structured Reds' ? 'bigger red'
      : 'something sparkling or pink';
  }

  // Box-scaled difficulty (spec §7): box 1-2 the guest names the lane; box 3 neutral;
  // box 4-5 vague "surprise us". The Simulator now writes the match beat back to Leitner.
  function buildTurns(): Turn[] {
    const winesById = new Map(data.wines.map((w) => [w.name, w] as const));
    const usable = data.foods.filter((f) => f.wine && winesById.get(f.wine)?.objections?.length);
    const chosen = engine.shuffle(usable, Math.random).slice(0, 5) as typeof usable;
    const allUpgrades = data.wines.filter((w) => w.upgrade).map((w) => w.upgrade as string);
    const allWhys = data.foods.filter((f) => f.why).map((f) => f.why);
    return chosen.map((f, i) => {
      const w = winesById.get(f.wine!)!;
      const cardId = 'pairing:' + f.id + ':match';
      const box = progressStore.value.cards[cardId]?.box ?? 1;
      const vibe = VIBES[i % VIBES.length];

      let guest: string;
      if (box <= 2) guest = `Table's having the ${f.name} — they usually go for a ${familyHint(w)}. What's your by-the-glass pour?`;
      else if (box === 3) guest = `Table ordered the ${f.name} — it's ${vibe}. What's your by-the-glass pour?`;
      else guest = `Table ordered the ${f.name}. "Surprise us — something that just works." Your pour?`;

      const objection = w.objections[Math.floor(((i + 1) * 2654435761) % w.objections.length)];
      const otherReplies = pick(data.wines.flatMap((x) => (x.name === w.name ? [] : x.objections.map((o) => o.reply))), 3);

      const ask = ASK_BEATS[i % ASK_BEATS.length];
      const beats: Beat[] = [
        {
          kind: 'ask',
          prompt: ask.prompt,
          choices: engine.shuffle([ask.answer, ...ask.wrong], Math.random),
          answer: ask.answer
        },
        {
          kind: 'match',
          prompt: 'Match the dish to a by-the-glass pour:',
          choices: engine.shuffle([w.name, ...engine.wineDistractors(data, w.name, 3)], Math.random),
          answer: w.name,
          cardId
        },
        {
          kind: 'explain',
          prompt: 'In one line — why does it fit? (say it, then pick)',
          choices: engine.shuffle([f.why, ...pick(allWhys, 3, [f.why])], Math.random),
          answer: f.why
        },
        {
          kind: 'objection',
          prompt: 'Pick the best reply:',
          guestLine: objection.cue,
          choices: engine.shuffle([objection.reply, ...otherReplies], Math.random),
          answer: objection.reply
        }
      ];
      // Bottle-upsell beat (spec §7 "confirmed the bottle upgrade?") — on celebration
      // vibes or once the basics are mastered, so it rehearses the highest-revenue move.
      if (w.upgrade && (CELEBRATION.has(vibe) || box >= 4)) {
        beats.push({
          kind: 'upsell',
          prompt: 'They’re enjoying it — close the bottle upgrade:',
          guestLine: 'This is lovely… should we just get a bottle?',
          choices: engine.shuffle([w.upgrade, ...pick(allUpgrades, 3, [w.upgrade])], Math.random),
          answer: w.upgrade
        });
      }
      return { guest, beats };
    });
  }

  let turns = $state<Turn[]>(buildTurns());
  let ti = $state(0);
  let beatIdx = $state(0);
  let answered = $state(false);
  let picked = $state<string | null>(null);
  let score = $state(0);
  let done = $state(false);

  const turn = $derived(turns[ti]);
  const beat = $derived(turn?.beats[beatIdx]);
  const maxScore = $derived(turns.reduce((s, t) => s + t.beats.length, 0));
  const isLastBeat = $derived(turn ? beatIdx + 1 >= turn.beats.length : true);
  const isLastTurn = $derived(ti + 1 >= turns.length);
  const OK: Record<BeatKind, string> = { ask: 'Ask first — always.', match: 'Good pour.', explain: "That's the reason.", objection: 'Nailed the reply.', upsell: 'Great upsell.' };
  const NO: Record<BeatKind, string> = { ask: 'Gather info before the pour:', match: 'Not the best pour.', explain: 'The cleaner reason:', objection: 'The smoother reply:', upsell: 'The bottle move:' };
  const liveMsg = $derived(
    !answered || !beat ? '' : (picked === beat.answer ? OK[beat.kind] : NO[beat.kind] + ' ' + beat.answer)
  );

  function choose(c: string) {
    if (answered || !beat) return;
    picked = c;
    const correct = c === beat.answer;
    if (correct) score += 1;
    // Leitner write-back: the match beat IS the pairing (dish→wine) card (LS-06).
    if (beat.kind === 'match' && beat.cardId) {
      progressStore.recordWithConfidence({ id: beat.cardId } as unknown as Card, correct, null);
    }
    answered = true;
    tick().then(() => revealEl?.focus());
  }
  function advance() {
    if (!answered) return;
    if (!isLastBeat) { beatIdx += 1; answered = false; picked = null; }
    else if (!isLastTurn) { ti += 1; beatIdx = 0; answered = false; picked = null; }
    else { done = true; }
    // A11Y-N1/N5: land focus on the new beat prompt (or the done heading) so SR/keyboard
    // users aren't dropped to <body> on every advance.
    tick().then(() => { (done ? doneEl : promptEl)?.focus(); });
  }
  function restart() {
    turns = buildTurns(); ti = 0; beatIdx = 0; answered = false; picked = null; score = 0; done = false;
  }
  function onKey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (!answered && /^[1-4]$/.test(e.key)) {
      const i = parseInt(e.key, 10) - 1;
      if (beat?.choices[i]) { e.preventDefault(); choose(beat.choices[i]); }
    } else if (answered && e.key === 'Enter') { e.preventDefault(); advance(); }
  }
</script>

<svelte:window onkeydown={onKey} />
<svelte:head><title>Guest Simulator · Bridgette Training</title></svelte:head>

<section class="screen on-dark">
  <p class="h-eyebrow"><a href="/" class="back">← Practice</a> · Guest Simulator</p>
  <h1>Talk to the table</h1>
  <p class="sub">Ask first → match the pour → explain the why → handle the curveball → close the bottle. Difficulty scales to your level; the match counts toward your decks. {turns.length} tables.</p>

  {#if !done && turn && beat}
    <p class="meta">Table {ti + 1} of {turns.length} · beat {beatIdx + 1}/{turn.beats.length} · score {score}</p>
    <p class="visually-hidden" aria-live="polite" aria-atomic="true">{liveMsg}</p>
    <div class="flash flashcard-face sim">
      <p class="guest"><span class="who">Guest:</span> {turn.guest}</p>
      {#if beat.guestLine}<p class="guest"><span class="who">Guest:</span> "{beat.guestLine}"</p>{/if}

      {#if !answered}
        <p class="meta beat-prompt" tabindex="-1" bind:this={promptEl}>{beat.prompt}</p>
        <div class="gradebar choices">
          {#each beat.choices as c, i}
            <button class="btn ghost choice" class:reply={beat.kind !== 'match'} type="button" onclick={() => choose(c)}>
              <span class="key" aria-hidden="true">{i + 1}</span>{c}
            </button>
          {/each}
        </div>
      {:else}
        <p class="ans" tabindex="-1" bind:this={revealEl}>{beat.answer}</p>
        <p class="feedback" class:ok={picked === beat.answer} class:no={picked !== beat.answer}>
          <span aria-hidden="true">{picked === beat.answer ? '✓' : '•'}</span>
          {picked === beat.answer ? OK[beat.kind] : NO[beat.kind]}{picked !== beat.answer && beat.kind === 'match' ? ` — you said ${picked}` : ''}
        </p>
        <button class="btn" type="button" onclick={advance}>{isLastBeat && isLastTurn ? 'Finish' : isLastBeat ? 'Next table →' : 'Next →'}</button>
      {/if}
    </div>
  {:else}
    <h1 tabindex="-1" bind:this={doneEl}>Round complete</h1>
    <p class="score">{score} / {maxScore}</p>
    <p class="sub">Every beat is a point: the pour, the reason, the comeback, the bottle. Run it again — the tables and the difficulty change with you.</p>
    <div class="gradebar" style="justify-content:flex-start">
      <button class="btn" type="button" onclick={restart}>New round</button>
      <a class="btn ghost" href="/">Back to Practice</a>
    </div>
  {/if}
</section>

<style>
  .back { color: var(--gold); text-decoration: none; }
  .sim { text-align: left; }
  .guest { font-size: 17px; }
  .who { font-family: var(--font-display); text-transform: uppercase; color: var(--accent-dark); font-size: 13px; margin-right: 6px; }
  .choices { flex-direction: column; align-items: stretch; }
  .choice { justify-content: flex-start; text-align: left; }
  .choice .key { font-family: var(--font-display); font-weight: 800; margin-right: 8px; opacity: .7; }
  .choice.reply { font-weight: 600; text-transform: none; letter-spacing: 0; font-size: 13px; line-height: 1.4; }
  .ans { font-weight: 600; }
  .ans:focus { outline: none; }
  .feedback { font-weight: 800; margin: 4px 0 0; }
  .feedback.ok { color: var(--green); }
  .feedback.no { color: var(--accent-dark); }
  .score { font-size: clamp(40px, 8vw, 72px); margin: 4px 0; }
  h1:focus, .beat-prompt:focus { outline: none; } /* focused programmatically (A11Y-N1/N5) */
</style>
