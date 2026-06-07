<script lang="ts">
  import { data } from '$lib/data/index';
  import * as engine from '$lib/engine/training.js';
  import type { Wine } from '$lib/data/types';
  import { tick } from 'svelte';

  let revealEl = $state<HTMLParagraphElement | null>(null);

  type Turn = {
    guest: string;
    answerWine: string;
    why: string;
    objection: { cue: string; reply: string };
    wineChoices: string[];
    replyChoices: string[];
  };

  const VIBES = ['a date night', 'a birthday table of 6', 'a quick after-work drink', 'a celebration', 'two regulars at the bar'];
  const wineNames = data.wines.map((w) => w.name);

  function pick<T>(arr: T[], n: number, exclude: T[] = []): T[] {
    const pool = engine.shuffle(arr.filter((x) => !exclude.includes(x)), Math.random);
    return pool.slice(0, n);
  }

  function buildTurns(): Turn[] {
    // foods that name a by-the-glass wine which itself has objections
    const winesById = new Map(data.wines.map((w) => [w.name, w] as const));
    const usable = data.foods.filter((f) => f.wine && winesById.get(f.wine)?.objections?.length);
    const chosen = engine.shuffle(usable, Math.random).slice(0, 5) as typeof usable;
    return chosen.map((f, i: number) => {
      const w = winesById.get(f.wine!) as Wine;
      const obj = w.objections[Math.floor(((i + 1) * 2654435761) % w.objections.length)];
      const otherReplies = pick(
        data.wines.flatMap((x) => (x.name === w.name ? [] : x.objections.map((o) => o.reply))),
        3
      );
      return {
        guest: `Table ordered the ${f.name} — it's ${VIBES[i % VIBES.length]}. What's your by-the-glass pour?`,
        answerWine: w.name,
        why: f.why,
        objection: obj,
        wineChoices: engine.shuffle([w.name, ...pick(wineNames, 3, [w.name])], Math.random),
        replyChoices: engine.shuffle([obj.reply, ...otherReplies], Math.random)
      };
    });
  }

  let turns = $state<Turn[]>(buildTurns());
  let ti = $state(0);
  let phase = $state<'pick' | 'pickDone' | 'objection' | 'objectionDone' | 'done'>('pick');
  let score = $state(0);
  let pickedWine = $state<string | null>(null);
  let pickedReply = $state<string | null>(null);

  const turn = $derived(turns[ti]);
  const liveMsg = $derived(
    !turn
      ? ''
      : phase === 'pickDone' || phase === 'objection'
        ? pickedWine === turn.answerWine
          ? 'Correct pour: ' + turn.answerWine + '.'
          : 'Not the best pour; the answer is ' + turn.answerWine + '.'
        : phase === 'objectionDone'
          ? pickedReply === turn.objection.reply
            ? 'Good reply.'
            : 'A smoother reply was suggested.'
          : ''
  );

  function choose(w: string) {
    if (phase !== 'pick') return;
    pickedWine = w;
    if (w === turn.answerWine) score += 1;
    phase = 'pickDone';
    tick().then(() => revealEl?.focus());
  }
  function toObjection() { phase = 'objection'; }
  function chooseReply(r: string) {
    if (phase !== 'objection') return;
    pickedReply = r;
    if (r === turn.objection.reply) score += 1;
    phase = 'objectionDone';
    tick().then(() => revealEl?.focus());
  }
  function next() {
    if (ti + 1 >= turns.length) { phase = 'done'; return; }
    ti += 1; phase = 'pick'; pickedWine = null; pickedReply = null;
  }
  function restart() {
    turns = buildTurns(); ti = 0; phase = 'pick'; score = 0; pickedWine = null; pickedReply = null;
  }
  function onKey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (phase === 'pick' && /^[1-4]$/.test(e.key)) {
      const i = parseInt(e.key, 10) - 1;
      if (turn.wineChoices[i]) { e.preventDefault(); choose(turn.wineChoices[i]); }
    } else if (phase === 'objection' && /^[1-4]$/.test(e.key)) {
      const i = parseInt(e.key, 10) - 1;
      if (turn.replyChoices[i]) { e.preventDefault(); chooseReply(turn.replyChoices[i]); }
    } else if (e.key === 'Enter') {
      if (phase === 'pickDone') { e.preventDefault(); toObjection(); }
      else if (phase === 'objectionDone') { e.preventDefault(); next(); }
    }
  }
</script>

<svelte:window onkeydown={onKey} />
<svelte:head><title>Guest Simulator · Bridgette Training</title></svelte:head>

<section class="screen on-dark">
  <p class="h-eyebrow"><a href="/" class="back">← Practice</a> · Guest Simulator</p>
  <h1>Talk to the table</h1>
  <p class="sub">Ask → Match → Explain → Confirm. Pick the pour, then handle the curveball. {turns.length} turns.</p>

  {#if phase !== 'done'}
    <p class="meta">Turn {ti + 1} of {turns.length} · score {score}</p>
    <p class="visually-hidden" aria-live="polite" aria-atomic="true">{liveMsg}</p>
    <div class="flash flashcard-face sim">
      <p class="guest"><span class="who">Guest:</span> {turn.guest}</p>

      {#if phase === 'pick'}
        <p class="meta">Match the dish to a by-the-glass pour:</p>
        <div class="gradebar choices">
          {#each turn.wineChoices as w, i}
            <button class="btn ghost choice" type="button" onclick={() => choose(w)}><span class="key" aria-hidden="true">{i + 1}</span>{w}</button>
          {/each}
        </div>
      {:else}
        <p class="ans" tabindex="-1" bind:this={revealEl}>{turn.answerWine}{pickedWine === turn.answerWine ? ' ✓' : ` (you said ${pickedWine})`}</p>
        <p class="why"><strong>Why:</strong> {turn.why}</p>
        {#if phase === 'pickDone'}
          <button class="btn" type="button" onclick={toObjection}>Then the guest pushes back →</button>
        {:else}
          <p class="guest"><span class="who">Guest:</span> "{turn.objection.cue}"</p>
          {#if phase === 'objection'}
            <p class="meta">Pick the best reply:</p>
            <div class="gradebar choices">
              {#each turn.replyChoices as r, i}
                <button class="btn ghost choice reply" type="button" onclick={() => chooseReply(r)}><span class="key" aria-hidden="true">{i + 1}</span>{r}</button>
              {/each}
            </div>
          {:else}
            <p class="feedback" class:ok={pickedReply === turn.objection.reply} class:no={pickedReply !== turn.objection.reply}>
              <span aria-hidden="true">{pickedReply === turn.objection.reply ? '✓' : '•'}</span>
              {pickedReply === turn.objection.reply ? 'Nailed it.' : 'The smoother reply:'}
            </p>
            <p class="why">{turn.objection.reply}</p>
            <button class="btn" type="button" onclick={next}>{ti + 1 >= turns.length ? 'Finish' : 'Next table →'}</button>
          {/if}
        {/if}
      {/if}
    </div>
  {:else}
    <h1 class="score">{score} / {turns.length * 2}</h1>
    <p class="sub">Two points per table: the right pour + the right comeback. Run it again — the tables change.</p>
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
  .ans:focus { outline: none; }
  .reply { font-weight: 600; text-transform: none; letter-spacing: 0; font-size: 13px; line-height: 1.4; }
  .why { background: rgba(67, 124, 147, .12); border-radius: var(--radius-nav); padding: 10px; font-size: 14px; margin: 4px 0; }
  .feedback { font-weight: 800; margin: 4px 0 0; }
  .feedback.ok { color: var(--green); }
  .feedback.no { color: var(--accent-dark); }
  .score { font-size: clamp(40px, 8vw, 72px); }
</style>
