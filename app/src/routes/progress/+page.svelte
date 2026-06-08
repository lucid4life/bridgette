<script lang="ts">
  import { data } from '$lib/data/index';
  import * as engine from '$lib/engine/training.js';
  import { progressStore } from '$lib/state/progress.svelte';
  import type { Card } from '$lib/data/types';
  import { onMount } from 'svelte';

  let mounted = $state(false);
  onMount(() => { mounted = true; }); // rings animate 0 → value (spec §6); reduced-motion zeroes the transition

  const decks = Object.keys(engine.DECKS) as string[];
  const TAGS = ['acidity', 'tannin', 'body', 'white', 'red', 'rose', 'spice', 'seafood', 'steak'];

  const deckRings = $derived(decks.map((d) => ({ label: (engine.DECKS as any)[d].label, pct: progressStore.masteryFor(d) })));
  const tagRings = $derived(TAGS.map((t) => ({ label: t, pct: progressStore.masteryFor(t) })));
  const weak = $derived(progressStore.weakCards());
  const goal = $derived(progressStore.goal);
  const daily = $derived(progressStore.dailyStreak());
  const weekly = $derived(progressStore.weeklyStreak());

  function ringColor(p: number) { return p >= 80 ? 'var(--green)' : p >= 40 ? 'var(--gold)' : 'var(--accent-dark)'; }

  let ioStatus = $state('');
  function doExport() {
    try {
      const blob = new Blob([progressStore.exportJson()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'bridgette-progress.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      ioStatus = 'Progress exported to bridgette-progress.json.';
    } catch { ioStatus = 'Export not available in this browser.'; }
  }
  let fileInput: HTMLInputElement;
  function onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { ioStatus = progressStore.importJson(String(r.result)) ? 'Progress imported and merged.' : 'Import failed — not valid progress JSON.'; };
    r.onerror = () => { ioStatus = "Import failed — couldn't read that file."; };
    r.readAsText(f);
    (e.target as HTMLInputElement).value = '';
  }
</script>

<svelte:head><title>Progress · Bridgette Training</title></svelte:head>

<section class="screen on-dark">
  <p class="h-eyebrow">Progress</p>
  <h1>Where you stand</h1>
  <p class="sub">Mastery by deck and by topic, your weak list, and a JSON backup so you never lose progress.</p>

  <h2 class="section-h">By deck</h2>
  <div class="rings">
    {#each deckRings as r}
      <div class="ring-card">
        <div class="ring small" role="img" aria-label={`${r.label}: ${r.pct}% mastered`}
          style={`--p:${mounted ? r.pct : 0}; background:conic-gradient(${ringColor(r.pct)} calc(var(--p) * 3.6deg), rgba(255,238,215,.12) 0)`}>
          <span aria-hidden="true">{r.pct}%</span>
        </div>
        <div class="ring-label">{r.label}</div>
      </div>
    {/each}
  </div>

  <h2 class="section-h" style="margin-top:22px">By topic</h2>
  <div class="rings">
    {#each tagRings as r}
      <div class="ring-card">
        <div class="ring small" role="img" aria-label={`${r.label}: ${r.pct}% mastered`}
          style={`--p:${mounted ? r.pct : 0}; background:conic-gradient(${ringColor(r.pct)} calc(var(--p) * 3.6deg), rgba(255,238,215,.12) 0)`}>
          <span aria-hidden="true">{r.pct}%</span>
        </div>
        <div class="ring-label">{r.label}</div>
      </div>
    {/each}
  </div>

  <h2 class="visually-hidden">Streak, weak spots, and backup</h2>
  <div class="grid cols-2" style="margin-top:22px">
    <div class="card">
      <h3>Streak</h3>
      <div class="goal-toggle" role="group" aria-label="Streak goal">
        <button class="chip" type="button" aria-pressed={goal === 'daily'} onclick={() => progressStore.setGoal('daily')}>Daily</button>
        <button class="chip" type="button" aria-pressed={goal === 'weekly'} onclick={() => progressStore.setGoal('weekly')}>Weekly goal</button>
      </div>
      {#if goal === 'daily'}
        {#if daily.count > 0}
          <p class="meta"><span aria-hidden="true">🔥</span> {daily.count}-day streak{daily.protectedRecently ? ' · ❄️ a missed day was forgiven' : ''}. A single missed day is always forgiven — no guilt.</p>
        {:else}
          <p class="meta">No active streak — study today to start one. Missed days are forgiven generously.</p>
        {/if}
      {:else}
        <p class="meta"><span aria-hidden="true">📅</span> {weekly.weeks} week{weekly.weeks === 1 ? '' : 's'} hitting your goal. This week: {weekly.thisWeek}/{weekly.target} days{weekly.thisWeek >= weekly.target ? ' ✓' : ''}. Built for weekend shifts.</p>
      {/if}
      {#if progressStore.readiness}
        <p class="meta">Last Readiness: {progressStore.readiness.lastScore}% shift-ready{progressStore.readiness.weakAreas.length ? ' · weak: ' + progressStore.readiness.weakAreas.slice(0, 5).join(', ') : ''}.</p>
      {/if}
    </div>
    <div class="card">
      <h3>Weak spots</h3>
      {#if weak.length}
        <div class="weak-list">
          {#each weak.slice(0, 24) as c (c.id)}
            <a class="weak-pill" href={'/?drill=' + encodeURIComponent(c.id)} aria-label={`Drill ${(engine.DECKS as any)[c.deck].label}: ${c.prompt}`}>{(engine.DECKS as any)[c.deck].label}: {c.answer}</a>
          {/each}
        </div>
      {:else}
        <p class="meta">Nothing flagged weak yet — good sign, or just early.</p>
      {/if}
    </div>
  </div>

  <div class="card" style="margin-top:16px">
    <h3>Backup</h3>
    <p class="meta">Keep your progress safe across devices.</p>
    <div class="gradebar" style="justify-content:flex-start;margin-top:10px">
      <button class="btn ghost" type="button" onclick={doExport}>Export</button>
      <button class="btn ghost" type="button" onclick={() => fileInput.click()}>Import</button>
      <input bind:this={fileInput} type="file" accept="application/json,.json" onchange={onFile} hidden />
    </div>
    <p class="meta" aria-live="polite" style="margin-top:8px">{ioStatus}</p>
  </div>
</section>

<style>
  .section-h { font-size: 15px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .06em; color: var(--gold); }
  .goal-toggle { display: flex; gap: 8px; margin: 0 0 10px; }
  .rings { display: flex; flex-wrap: wrap; gap: 16px; }
  .ring-card { display: grid; justify-items: center; gap: 6px; }
  .ring.small { width: 92px; height: 92px; }
  .ring.small span { width: 68px; height: 68px; font-size: 22px; }
  .ring-label { font-size: 13px; color: var(--muted); text-transform: capitalize; }
  .weak-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .weak-pill { display: inline-block; font-size: 12px; padding: 6px 11px; border-radius: 999px; background: rgba(168, 50, 18, .18); border: 1px solid rgba(168, 50, 18, .4); color: var(--cream); text-decoration: none; }
  .weak-pill:hover { background: rgba(168, 50, 18, .3); }
</style>
