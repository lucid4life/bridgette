<script lang="ts">
  import { data } from '$lib/data/index';
  import * as engine from '$lib/engine/training.js';
  import { progressStore } from '$lib/state/progress.svelte';

  const decks = Object.keys(engine.DECKS) as string[];
  const totalCards = $derived(engine.allCards(data).length);
  const due = $derived(progressStore.dueCount());
  const daily = $derived(progressStore.dailyStreak());
  const streak = $derived(daily.count);
  const studied = $derived(Object.keys(progressStore.value.cards).length > 0);

  const deckMastery = $derived(decks.map((d) => ({ d, label: (engine.DECKS as any)[d].label, m: progressStore.masteryFor(d) })));
  const shiftReady = $derived(
    progressStore.readiness?.lastScore ??
      Math.round(deckMastery.reduce((s, x) => s + x.m, 0) / (deckMastery.length || 1))
  );
  const weakest = $derived([...deckMastery].sort((a, b) => a.m - b.m).slice(0, 2).map((x) => x.label));
</script>

<section class="screen on-dark">
  <p class="h-eyebrow">Source checked Jun 7 · v2</p>
  <h1>Good evening, Adrian</h1>
  <p class="sub">Here's your launchpad. Small, consistent sessions beat cramming — let's keep the streak alive.</p>

  {#if !studied}
    <div class="card onboard">
      <span class="pill">Start here</span>
      <h3 style="margin-top:10px">One quick win — 30 seconds</h3>
      <p class="meta">A guest asks for a <strong>Cabernet</strong>. Your move: pour the <strong>St. John Claret</strong> (the safe Bordeaux steak red). That's the whole job — match the lane, give one reason.</p>
      <p style="margin:14px 0 0"><a class="btn" href="/">▶ Try a real card</a></p>
    </div>
  {/if}

  <div class="hero">
    <div class="card">
      <h3>Ready to study</h3>
      <div class="stat">
        <div><b>{due}</b><span class="meta">cards due</span></div>
        <div><b class="streak">{streak}</b><span class="meta">day streak {daily.protectedRecently ? '🔥❄️' : '🔥'}</span></div>
        <div><b>{totalCards}</b><span class="meta">cards total</span></div>
      </div>
      <p style="margin:16px 0 0"><a class="btn" href="/">▶ Start Smart Review</a></p>
      <p class="meta" style="margin-top:14px">Weakest decks: <strong style="color:var(--cream)">{weakest.join(', ')}</strong></p>
    </div>
    <div class="card" style="text-align:center">
      <h3 style="text-align:left">Shift-ready</h3>
      <div class="ring" style={`--p:${shiftReady}`}><span>{shiftReady}%</span></div>
      <p class="meta">{progressStore.readiness ? 'From your last Readiness Check' : 'Estimate from deck mastery'}</p>
      <a class="btn ghost" href="/" style="margin-top:6px">Run Readiness Check</a>
    </div>
  </div>

  <div class="grid cols-3">
    <a class="card link" href="/school#common-substitutions"><span class="pill">Guided path</span><h3 style="margin-top:10px">The Substitution Translator</h3><p class="meta">Cab → Claret, Sauv Blanc → Grüner. Your #1 on-the-floor skill.</p></a>
    <a class="card link" href="/school#pairing-levers"><span class="pill">Wine School</span><h3 style="margin-top:10px">Pairing levers</h3><p class="meta">Acid cuts fat · tannin needs protein · sweet tames heat.</p></a>
    <div class="card"><span class="pill">Tip</span><h3 style="margin-top:10px">Taste before you call it dry</h3><p class="meta">Riesling sweetness varies — confirm with the team. Same for allergens: never guess.</p></div>
  </div>
</section>

<style>
  .onboard { border-left: 4px solid var(--gold); margin-bottom: 18px; }
  .card.link { text-decoration: none; color: inherit; display: block; }
  .card.link:hover { border-color: var(--gold); }
</style>
