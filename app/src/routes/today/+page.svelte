<script lang="ts">
  import { data } from '$lib/data/index';
  import * as engine from '$lib/engine/training.js';
  import GuestSearch from '$lib/components/GuestSearch.svelte';
  import BackupCard from '$lib/components/BackupCard.svelte';
  import { progressStore } from '$lib/state/progress.svelte';
  import { courseStore } from '$lib/state/course.svelte';
  import { onMount } from 'svelte';

  let mounted = $state(false);
  onMount(() => { mounted = true; });
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  })();

  const decks = Object.keys(engine.DECKS) as string[];
  const totalCards = $derived(engine.allCards(data).length);
  const due = $derived(progressStore.dueCount());
  const daily = $derived(progressStore.dailyStreak());
  const streak = $derived(daily.count);
  const studied = $derived(Object.keys(progressStore.value.cards).length > 0);

  const deckMastery = $derived(decks.map((d) => ({ d, label: (engine.DECKS as any)[d].label, m: progressStore.masteryFor(d) })));
  // UX-3: the fallback estimate must average the SAME decks buildReadiness scores —
  // it excludes self-graded pronunciation — so this number can't diverge from the gauntlet.
  const shiftReady = $derived(
    progressStore.readiness?.lastScore ??
      (() => {
        const obj = deckMastery.filter((x) => x.d !== 'pronunciation');
        return Math.round(obj.reduce((s, x) => s + x.m, 0) / (obj.length || 1));
      })()
  );
  const weakest = $derived([...deckMastery].sort((a, b) => a.m - b.m).slice(0, 2).map((x) => x.label));
  // Drill of the Day = your single weakest deck (a focused, always-available study action).
  const lowestDeck = $derived([...deckMastery].sort((a, b) => a.m - b.m)[0]);

  // Smart hero: pick the right next action based on what's due
  const nextMod = $derived(courseStore.nextModule());
  const courseProgress = $derived(`${courseStore.completedCount()} of ${courseStore.total} modules`);
  const heroMode = $derived(
    due > 0 ? 'review'
    : nextMod !== null ? 'course'
    : 'caught-up'
  ) as 'review' | 'course' | 'caught-up';
</script>

<svelte:head><title>Today · Bridgette Training</title></svelte:head>

<section class="screen on-dark">
  <p class="h-eyebrow">Your launchpad · v2</p>
  <h1>{greeting}, Adrian</h1>
  <p class="sub">Small, consistent sessions beat cramming — let's keep the streak alive.</p>

  <div class="today-search"><GuestSearch /></div>

  {#if !studied}
    <div class="card onboard">
      <span class="pill">Start here</span>
      <h3 style="margin-top:10px">One quick win — 30 seconds</h3>
      <p class="meta">A guest asks for a <strong>Cabernet</strong>. Your move: pour the <strong>St. John Claret</strong> (the safe Bordeaux steak red). That's the whole job — match the lane, give one reason.</p>
      <p style="margin:14px 0 0"><a class="btn" href="/?start=smart"><svg class="cta-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg> Try a real card</a></p>
    </div>
  {/if}

  {#if studied}
    <h2 class="visually-hidden">Your session</h2>
    <div class="hero">
      {#if heroMode === 'review'}
        <div class="card">
          <h3>Ready to study</h3>
          <div class="stat" aria-live="polite">
            <div><b>{due}</b><span class="meta">cards due</span></div>
            <div><b class="streak">{streak}</b><span class="meta">day streak <span aria-hidden="true">{daily.protectedRecently ? '🔥❄️' : '🔥'}</span>{#if daily.protectedRecently}<span class="visually-hidden"> — a missed day was forgiven</span>{/if}</span></div>
            <div><b>{totalCards}</b><span class="meta">cards total</span></div>
          </div>
          <p style="margin:16px 0 0"><a class="btn" href="/?start=smart"><svg class="cta-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg> Start Smart Review</a></p>
          {#if weakest.length}<p class="meta" style="margin-top:14px">Weakest decks: <strong style="color:var(--cream)">{weakest.join(', ')}</strong></p>{/if}
        </div>
      {:else if heroMode === 'course'}
        <div class="card">
          <h3>Continue your course</h3>
          <p style="margin:10px 0 4px"><strong>Module {nextMod!.num} · {nextMod!.title}</strong></p>
          <p class="meta">{courseProgress} complete · reviews are clear</p>
          <p style="margin:16px 0 0"><a class="btn" href="/learn"><svg class="cta-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg> Resume the course</a></p>
        </div>
      {:else}
        <div class="card">
          <h3>You're all caught up</h3>
          <p class="meta">Course complete and no reviews due — rest is part of spacing. Run a Readiness Check anytime, or sit a timed Mock Exam.</p>
          <p style="margin:16px 0 0"><a class="btn ghost" href="/?start=readiness">Run Readiness Check</a> <a class="btn ghost" href="/practice/exam">Mock Exam</a></p>
        </div>
      {/if}
      <div class="card" style="text-align:center">
        <h3 style="text-align:left">Shift-ready</h3>
        <div class="ring" role="img" aria-label={`${shiftReady}% shift-ready`} style={`--p:${mounted ? shiftReady : 0}`}><span aria-hidden="true">{shiftReady}%</span></div>
        <p class="meta">
          {#if progressStore.readiness}From your last Readiness Check
          {:else if shiftReady < 25}Early days — this climbs fast as you learn. Run a quick check anytime.
          {:else}Estimate from deck mastery{/if}
        </p>
        <a class="btn ghost" href="/?start=readiness" style="margin-top:6px">Run Readiness Check</a>
      </div>
    </div>
  {/if}

  {#if studied}
    <h2 class="section-h">Keep the reflex sharp</h2>
    <div class="grid cols-2" style="margin-bottom:22px">
      <a class="card link" href={'/?deck=' + lowestDeck.d}>
        <span class="pill">Drill of the day</span>
        <h3 style="margin-top:10px">{lowestDeck.label}</h3>
        <p class="meta">Your weakest deck right now — a focused few minutes here moves the needle most. {lowestDeck.m}% mastered.</p>
      </a>
      <a class="card link" href="/?start=smart">
        <span class="pill">Study now</span>
        <h3 style="margin-top:10px">Smart Review</h3>
        <p class="meta">{due > 0 ? due + ' due' : 'Nothing due — a quick mixed refresher'} · what's due and weak, interleaved.</p>
      </a>
    </div>
  {/if}

  <h2 class="section-h">Your 3 floor moves</h2>
  <div class="grid cols-3" style="margin-bottom:22px">
    <a class="card link" href="/on-the-floor?view=substitutions">
      <span class="pill">Floor move</span>
      <h3 style="margin-top:10px">Substitute a wine</h3>
      <p class="meta">A guest orders a grape we don't pour — your pour, and the one reason it fits.</p>
    </a>
    <a class="card link" href="/on-the-floor?view=pairings">
      <span class="pill">Floor move</span>
      <h3 style="margin-top:10px">Pair food → wine</h3>
      <p class="meta">What wine goes with their dish — and the lever that makes it work, both directions.</p>
    </a>
    <a class="card link" href="/on-the-floor?view=pairings">
      <span class="pill">Floor move</span>
      <h3 style="margin-top:10px">Pair a cocktail</h3>
      <p class="meta">Not drinking wine? The cocktail and the zero-proof move, with the why.</p>
    </a>
  </div>

  <h2 class="visually-hidden">Keep learning</h2>
  <div class="grid cols-3">
    <a class="card link" href="/learn#common-substitutions"><span class="pill">Guided path</span><h3 style="margin-top:10px">The Substitution Translator</h3><p class="meta">Cab → Claret, Sauv Blanc → Grüner. Your #1 on-the-floor skill.</p></a>
    <a class="card link" href="/learn#pairing-levers"><span class="pill">Wine School</span><h3 style="margin-top:10px">Pairing levers</h3><p class="meta">Acid cuts fat · tannin needs protein · sweet tames heat.</p></a>
    <div class="card"><span class="pill">Tip</span><h3 style="margin-top:10px">Taste before you call it dry</h3><p class="meta">Riesling sweetness varies — confirm with the team. Same for allergens: never guess.</p></div>
  </div>

  <h2 class="section-h" style="margin-top:26px">Your data</h2>
  <BackupCard />
</section>

<style>
  .onboard { border-left: 4px solid var(--gold); margin-bottom: 18px; }
  .card.link { text-decoration: none; color: inherit; display: block; }
  .card.link:hover { border-color: var(--gold); }
  .today-search { max-width: 520px; margin: 0 0 22px; }
  .section-h { font-family: var(--font-display); text-transform: uppercase; letter-spacing: .06em; color: var(--muted); font-size: 14px; margin: 0 0 12px; }
</style>
