<script lang="ts">
  import { data } from '$lib/data/index';
  import * as engine from '$lib/engine/training.js';
  import { progressStore } from '$lib/state/progress.svelte';
  import BackupCard from '$lib/components/BackupCard.svelte';
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
  // Mock Exams: latest score + last-5 trend + the latest exam's per-deck table.
  const exams = $derived(progressStore.value.examHistory ?? []);
  const lastExam = $derived(exams.length ? exams[exams.length - 1] : null);
  const examTrend = $derived(exams.slice(-5));
  const examWeakDecks = $derived(
    lastExam
      ? Object.keys(lastExam.byDeck).filter((d) => lastExam.byDeck[d].correct < lastExam.byDeck[d].total)
      : []
  );

  function ringColor(p: number) { return p >= 80 ? 'var(--ok)' : p >= 40 ? 'var(--highlight)' : 'var(--accent)'; }

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
          style={`--p:${mounted ? r.pct : 0}; background:conic-gradient(${ringColor(r.pct)} calc(var(--p) * 3.6deg), var(--surface-track) 0)`}>
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
          style={`--p:${mounted ? r.pct : 0}; background:conic-gradient(${ringColor(r.pct)} calc(var(--p) * 3.6deg), var(--surface-track) 0)`}>
          <span aria-hidden="true">{r.pct}%</span>
        </div>
        <div class="ring-label">{r.label}</div>
      </div>
    {/each}
  </div>

  {#if lastExam}
    <h2 class="section-h" style="margin-top:22px">Exams</h2>
    <div class="grid cols-2">
      <div class="card">
        <h3>Mock Exam</h3>
        <div class="exam-hero">
          <div class="ring small" role="img" aria-label={`Latest exam: ${lastExam.score}%`}
            style={`--p:${mounted ? lastExam.score : 0}; background:conic-gradient(${ringColor(lastExam.score)} calc(var(--p) * 3.6deg), var(--surface-track) 0)`}>
            <span aria-hidden="true">{lastExam.score}%</span>
          </div>
          <div>
            <p class="meta" style="margin:0">Latest: {lastExam.score}% · {lastExam.total} questions.</p>
            <div class="trend" role="img" aria-label={`Last ${examTrend.length} exam scores: ${examTrend.map((e) => e.score + '%').join(', ')}`}>
              {#each examTrend as e, i (i)}
                <span class="trend-bar" style={`height:${Math.max(8, e.score)}%; background:${ringColor(e.score)}`}></span>
              {/each}
            </div>
            <p class="meta" style="margin:4px 0 0">Last {examTrend.length} exam{examTrend.length === 1 ? '' : 's'}.</p>
          </div>
        </div>
        {#if examWeakDecks.length}
          <div class="weak-list" style="margin-top:10px">
            {#each examWeakDecks as d}
              <a class="weak-pill" href={'/?deck=' + encodeURIComponent(d)} aria-label={`Drill the ${(engine.DECKS as any)[d]?.label ?? d} deck`}>{(engine.DECKS as any)[d]?.label ?? d}</a>
            {/each}
          </div>
        {/if}
      </div>
      <div class="card">
        <h3>Latest exam by deck</h3>
        <table class="exam-table">
          <thead><tr><th scope="col">Deck</th><th scope="col">Score</th></tr></thead>
          <tbody>
            {#each Object.keys(lastExam.byDeck) as d}
              <tr><th scope="row">{(engine.DECKS as any)[d]?.label ?? d}</th><td>{lastExam.byDeck[d].correct}/{lastExam.byDeck[d].total}</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

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

  <div style="margin-top:16px"><BackupCard /></div>
</section>

<style>
  .section-h { font-size: 15px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .06em; color: var(--highlight); }
  .goal-toggle { display: flex; gap: 8px; margin: 0 0 10px; }
  .rings { display: flex; flex-wrap: wrap; gap: 16px; }
  .ring-card { display: grid; justify-items: center; gap: 6px; }
  .ring.small { width: 92px; height: 92px; }
  .ring.small span { width: 68px; height: 68px; font-size: 22px; }
  .ring-label { font-size: 13px; color: var(--text-muted); text-transform: capitalize; }
  .weak-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .weak-pill { display: inline-block; font-size: 12px; padding: 6px 11px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 18%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent); color: var(--text-strong); text-decoration: none; }
  .weak-pill:hover { background: color-mix(in srgb, var(--accent) 30%, transparent); }
  .exam-hero { display: flex; align-items: center; gap: 14px; }
  .trend { display: flex; align-items: flex-end; gap: 4px; height: 40px; margin-top: 6px; }
  .trend-bar { display: inline-block; width: 10px; border-radius: 3px 3px 0 0; }
  .exam-table { border-collapse: collapse; width: 100%; }
  .exam-table th, .exam-table td { text-align: left; padding: 5px 12px 5px 0; font-size: 13px; border-bottom: 1px solid var(--surface-track); }
  .exam-table thead th { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); }
  .exam-table tbody th { font-weight: 600; color: var(--text-strong); }
</style>
