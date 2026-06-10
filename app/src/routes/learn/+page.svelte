<script lang="ts">
  import { data } from '$lib/data/index';
  import { deduce, DG_DIMS } from '$lib/engine/wineschool.js';
  import { DECKS, generateDeck } from '$lib/engine/training.js';
  import { courseStore } from '$lib/state/course.svelte';
  import { curriculum } from '$lib/data/curriculum';
  import type { CourseModule, CourseTrack } from '$lib/data/curriculum';
  import FamiliesView from '$lib/components/FamiliesView.svelte';
  import StyleMap from '$lib/components/StyleMap.svelte';
  import RegionMap from '$lib/components/RegionMap.svelte';
  import StructureMeter from '$lib/components/StructureMeter.svelte';
  import Icon from '$lib/components/Icon.svelte';

  // ── view / state machine ──────────────────────────────────────────────────
  let view = $state<'map' | 'module'>('map');
  let openModule = $state<CourseModule | null>(null);

  // quick-check gate state (per open module). picked = index chosen; null = unanswered.
  let picked = $state<number | null>(null);
  let justCompleted = $state(false); // shows the "module complete" confirmation beat

  // Re-render trigger so completedCount()/isUnlocked()/isCompleted() stay live after
  // courseStore.complete() mutates the store (the store is $state-backed, so reading
  // it inside the template is reactive; this bumps anything memoised on completion).
  let completionTick = $state(0);

  // ── track grouping (fixed display order) ──────────────────────────────────
  const TRACK_ORDER: CourseTrack[] = ['Foundations', 'Know the list', 'Floor moves', 'On the floor'];
  const byTrack = $derived(
    TRACK_ORDER
      .map((track) => ({ track, modules: curriculum.filter((m) => m.track === track) }))
      .filter((g) => g.modules.length > 0)
  );

  const nextUp = $derived.by(() => {
    completionTick; // re-derive after a completion
    return courseStore.nextModule();
  });

  // ── navigation ────────────────────────────────────────────────────────────
  function openMod(m: CourseModule) {
    openModule = m;
    picked = null;
    justCompleted = courseStore.isCompleted(m.id);
    view = 'module';
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }
  function backToMap() {
    view = 'map';
    openModule = null;
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }
  function continueCourse() {
    const n = courseStore.nextModule();
    openMod(n ?? curriculum[0]);
  }

  // ── per-module quick check (lesson-driven OR data-driven seed deck) ────────
  type QuickCheck = { q: string; choices: string[]; answer: number };

  function lessonFor(id: string | undefined) {
    if (!id) return null;
    return data.lessons.find((l) => l.id === id) ?? null;
  }

  const DECK_LABELS = DECKS as Record<string, { label: string; learnLink: string }>;
  function deckLabel(id: string): string {
    return DECK_LABELS[id]?.label ?? 'this deck';
  }

  function buildCheck(m: CourseModule): QuickCheck | null {
    const lesson = lessonFor(m.lessonId);
    if (lesson?.quickCheck) {
      return { q: lesson.quickCheck.q, choices: lesson.quickCheck.choices, answer: lesson.quickCheck.answer };
    }
    if (m.seedDeck) {
      const cards = generateDeck(m.seedDeck, data);
      const card = cards.find((c: any) => Array.isArray(c.choices) && c.choices.length > 0);
      if (card) {
        return { q: card.prompt, choices: card.choices, answer: card.choices.indexOf(card.answer) };
      }
    }
    return null;
  }

  const lesson = $derived(openModule ? lessonFor(openModule.lessonId) : null);
  const check = $derived(openModule ? buildCheck(openModule) : null);

  // gate: enabled once answered correctly, or if already completed
  const answeredCorrectly = $derived(check != null && picked === check.answer);
  const moduleDone = $derived(openModule != null && courseStore.isCompleted(openModule.id));
  const canComplete = $derived(answeredCorrectly || moduleDone);

  function markComplete() {
    if (!openModule || !canComplete) return;
    courseStore.complete(openModule.id);
    completionTick += 1;
    justCompleted = true;
  }

  // ── data-driven READ sections ─────────────────────────────────────────────
  const whiteWines = $derived(data.wines.filter((w) => w.category === 'White' || w.category === 'Bubbly'));
  const redWines = $derived(data.wines.filter((w) => w.category === 'Red' || w.category === 'Rosé'));
  const cocktailFoods = $derived(data.foods.filter((f) => f.cocktail).slice(0, 6));

  // ── deductive grid (ported from the previous Wine School page) ─────────────
  let clues = $state<Record<string, string>>({});
  const categories = $derived([...new Set(data.wines.map((w) => w.category))]);
  const LMH = ['low', 'medium', 'high'];
  const SWEET = ['dry', 'off-dry', 'medium-dry', 'medium-sweet', 'sweet'];
  const DG_LABEL: Record<string, string> = {
    category: 'Colour / style', acidity: 'Acidity', body: 'Body', tannin: 'Tannin', sweetness: 'Sweetness'
  };
  function optsFor(dim: string): string[] {
    if (dim === 'category') return categories;
    if (dim === 'sweetness') return SWEET;
    return LMH;
  }
  const activeClues = $derived(Object.fromEntries(Object.entries(clues).filter(([, v]) => v)));
  const hits = $derived(deduce(data.wines, activeClues));
  const anyClue = $derived(Object.keys(activeClues).length > 0);
  function resetGrid() { clues = {}; }
</script>

<svelte:head><title>Learn · Bridgette Training</title></svelte:head>

{#if view === 'map'}
  <!-- ═══════════════════ MAP VIEW ═══════════════════ -->
  <section class="screen">
    <p class="h-eyebrow">Learn</p>
    <h1>Your wine course</h1>
    <p class="sub">Ten modules, foundations first. Pass each to unlock the next — or jump ahead anytime.</p>

    <div class="course-top">
      <p class="progress-line" aria-live="polite">
        {courseStore.completedCount()} of {courseStore.total} modules complete
      </p>
      {#if nextUp}
        <button class="btn continue" type="button" onclick={continueCourse}>
          Continue → {nextUp.title}
        </button>
      {/if}
    </div>

    {#each byTrack as group (group.track)}
      <h2 class="fg-h">{group.track}</h2>
      <div class="mod-grid">
        {#each group.modules as m (m.id)}
          {@const done = courseStore.isCompleted(m.id)}
          {@const unlocked = courseStore.isUnlocked(m.id)}
          {@const isNext = nextUp?.id === m.id}
          <button
            class="mod-card"
            class:done
            class:locked={!unlocked && !done}
            type="button"
            onclick={() => openMod(m)}
          >
            <span class="mod-num meta">Module {m.num}</span>
            <h3 class="mod-title">{m.title}</h3>
            <span class="mod-blurb">{m.blurb}</span>
            <span class="mod-foot">
              {#if done}
                <span class="badge badge-done">✓ Completed</span>
              {:else if unlocked}
                <span class="badge badge-go">{isNext ? 'Current' : 'Start'}</span>
              {:else}
                <span class="badge badge-locked"><Icon name="lock" size={13} /> Locked</span>
                <span class="jump-hint meta">Jump ahead</span>
              {/if}
            </span>
          </button>
        {/each}
      </div>
    {/each}
  </section>

{:else if openModule}
  <!-- ═══════════════════ MODULE VIEW ═══════════════════ -->
  {@const m = openModule}
  <section class="screen module-view">
    <button class="btn ghost back" type="button" onclick={backToMap}>← All modules</button>

    <p class="h-eyebrow">{m.track}</p>
    <h1>Module {m.num} · {m.title}</h1>
    {#if courseStore.isCompleted(m.id)}<span class="badge badge-done inline">✓ Completed</span>{/if}
    <p class="sub">{m.blurb}</p>

    <!-- ── READ ─────────────────────────────────────────────────────────── -->
    <h2 class="fg-h">Learn it</h2>

    {#if m.lessonId && lesson}
      <article class="card lesson read-block">
        <h3>{lesson.title}</h3>
        <p class="lesson-body">{lesson.body}</p>
        <div class="we"><strong>What you'd say:</strong> {lesson.workedExample}</div>
      </article>

      {#if m.lessonId === 'how-to-taste'}
        <!-- ported deductive-grid tool -->
        <article class="card dg" id="deductive-grid-tool" aria-label="Deductive grid tool">
          <h3>Guess the grape from the clues</h3>
          <p class="meta">Set the clues you taste, then reveal the likely grape and the exact glass.</p>
          <div class="dg-fields">
            {#each DG_DIMS as dim}
              <label class="dg-field">
                <span>{DG_LABEL[dim]}</span>
                <select bind:value={clues[dim]}>
                  <option value="">Any</option>
                  {#each optsFor(dim) as o}<option value={o}>{o}</option>{/each}
                </select>
              </label>
            {/each}
          </div>
          <div class="dg-actions">
            <button class="btn ghost" type="button" onclick={resetGrid}>Reset clues</button>
          </div>
          <div class="dg-result" aria-live="polite">
            {#if !anyClue}
              <p class="meta">Pick at least one clue to see a likely match.</p>
            {:else if hits.length === 0}
              <p class="meta">No wine on this list matches those clues — try loosening one.</p>
            {:else}
              <ul class="dg-hits">
                {#each hits.slice(0, 4) as r, i}
                  <li class="dg-hit" class:top={i === 0}>
                    <span class="dg-lead">{i === 0 ? (r.exact ? 'Most likely' : 'Closest') : 'Also possible'}</span>
                    <span class="dg-grape">{r.wine.grape}</span>
                    <span class="dg-name">{r.wine.name}</span>
                    <span class="meta">matches {r.matched} of {r.total} clues</span>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </article>
      {/if}

    {:else if m.content === 'families'}
      <section class="reasoning" aria-labelledby="fam-h">
        <p class="read-intro">Five families to steer by, plus the map and style grid that explain why each wine tastes the way it does.</p>
        <h3 id="fam-h" class="sub-h">The 5 families</h3>
        <FamiliesView />
        <div class="maps">
          <div class="map-card">
            <h3 class="sub-h">Style map — body × acidity</h3>
            <StyleMap />
          </div>
          <div class="map-card">
            <h3 class="sub-h">Where it's from</h3>
            <RegionMap />
          </div>
        </div>
      </section>

    {:else if m.content === 'whites'}
      <p class="read-intro">The crisp, round, and sparkling pours by the glass — read each one's structure, then say it out loud.</p>
      <div class="grid cols-2 on-cream">
        {#each whiteWines as w (w.id)}
          <article class="card light winecard">
            <h3 class="name">{w.name}</h3>
            <div class="meta">{w.grape} · {w.category}</div>
            <div class="meters">
              <StructureMeter label="Acidity" level={w.structure.acidity} />
              <StructureMeter label="Body" level={w.structure.body} />
              <StructureMeter label="Tannin" level={w.structure.tannin} />
            </div>
            <p class="winecard-pron meta">Say: <strong>{w.pronunciation.respell}</strong></p>
            <p class="winecard-body">{w.tenSecond}</p>
          </article>
        {/each}
      </div>

    {:else if m.content === 'reds'}
      <p class="read-intro">The light and structured reds plus rosé — read body and tannin, then say it out loud.</p>
      <div class="grid cols-2 on-cream">
        {#each redWines as w (w.id)}
          <article class="card light winecard">
            <h3 class="name">{w.name}</h3>
            <div class="meta">{w.grape} · {w.category}</div>
            <div class="meters">
              <StructureMeter label="Acidity" level={w.structure.acidity} />
              <StructureMeter label="Body" level={w.structure.body} />
              <StructureMeter label="Tannin" level={w.structure.tannin} />
            </div>
            <p class="winecard-pron meta">Say: <strong>{w.pronunciation.respell}</strong></p>
            <p class="winecard-body">{w.tenSecond}</p>
          </article>
        {/each}
      </div>

    {:else if m.content === 'cocktails'}
      <p class="read-intro">When the guest isn't drinking wine, the same levers apply — acid cuts fat, sweet tames heat, intensity matches intensity — you just reach for a different glass. Each dish below shows the cocktail call and the lever behind it.</p>
      <div class="grid cols-2 on-cream">
        {#each cocktailFoods as f (f.id)}
          <article class="card light">
            <h3>{f.name}</h3>
            <p class="winecard-body">→ <strong>{f.cocktail}</strong></p>
            <p class="meta">{f.why}</p>
            {#if f.zero}<p class="meta">Zero-proof: <strong>{f.zero}</strong></p>{/if}
          </article>
        {/each}
      </div>
    {/if}

    <!-- ── QUICK CHECK (the gate) ────────────────────────────────────────── -->
    <h2 class="fg-h">Check yourself</h2>
    {#if check}
      <div class="qc" role="group" aria-label="Quick check">
        <p class="qc-q"><span class="pill">Quick check</span> {check.q}</p>
        <div class="qc-choices">
          {#each check.choices as choice, ci}
            {@const isAns = ci === check.answer}
            <button
              class="qc-choice"
              class:correct={picked != null && isAns}
              class:wrong={picked === ci && !isAns}
              type="button"
              aria-pressed={picked === ci}
              disabled={picked != null}
              onclick={() => (picked = ci)}
            >
              <span class="qc-key" aria-hidden="true">{String.fromCharCode(65 + ci)}</span>
              <span>{choice}</span>
              {#if picked != null && isAns}<span class="qc-glyph" aria-hidden="true">✓</span>{:else if picked === ci}<span class="qc-glyph" aria-hidden="true">✗</span>{/if}
            </button>
          {/each}
        </div>
        <p class="qc-result" aria-live="polite">
          {#if picked != null}
            {#if picked === check.answer}
              Correct. {check.choices[check.answer]} is the answer.
            {:else}
              Not quite — the answer is {check.choices[check.answer]}. Re-read the lesson above, then try again.
            {/if}
          {/if}
        </p>
        {#if picked != null && picked !== check.answer}
          <button class="btn ghost qc-retry" type="button" onclick={() => (picked = null)}>Try again</button>
        {/if}
      </div>
    {:else}
      <p class="meta">No quick check for this module — mark it complete when you're ready.</p>
    {/if}

    <!-- ── COMPLETE control ──────────────────────────────────────────────── -->
    <div class="complete-row">
      <button class="btn complete-btn" type="button" disabled={check != null && !canComplete} onclick={markComplete}>
        Mark complete &amp; continue
      </button>
      {#if check != null && !canComplete}
        <span class="meta">Answer the quick check correctly to unlock this.</span>
      {/if}
    </div>

    {#if justCompleted}
      <div class="done-card" role="status">
        <p class="done-head">✓ Module complete — next unlocked</p>
        <div class="done-links">
          {#if m.seedDeck}
            <a class="btn ghost" href={'/?deck=' + m.seedDeck}>
              Drill {deckLabel(m.seedDeck)} now
            </a>
          {/if}
          <button class="btn gold" type="button" onclick={() => { const n = courseStore.nextModule(); if (n) openMod(n); else backToMap(); }}>
            {courseStore.nextModule() ? 'Next module →' : 'Back to all modules'}
          </button>
        </div>
      </div>
    {/if}
  </section>
{/if}

<style>
  /* ── shared section headers (ported) ── */
  .fg-h { font-size: clamp(20px, 2.4vw, 26px); margin: 22px 0 10px; color: var(--text-strong); }
  .sub-h { font-size: 15px; margin: 18px 0 10px; color: var(--highlight); text-transform: uppercase; letter-spacing: .06em; }

  /* ── MAP: course top ── */
  .course-top { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin: 0 0 8px; }
  .progress-line { margin: 0; font-weight: 700; color: var(--text-strong); }
  .btn.continue { background: var(--highlight); border-color: var(--highlight); color: var(--highlight-ink); }

  /* ── MAP: module cards ── */
  .mod-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  @media (max-width: 720px) { .mod-grid { grid-template-columns: 1fr; } }
  .mod-card {
    display: flex; flex-direction: column; gap: 4px; text-align: left; width: 100%;
    background: var(--surface-card); color: var(--text-strong);
    border: 1px solid var(--line); border-radius: var(--radius-card); padding: 16px; min-height: 120px;
  }
  .mod-card:hover { border-color: var(--highlight); }
  .mod-card.done { border-color: var(--ok); background: color-mix(in srgb, var(--ok) 12%, transparent); }
  /* Locked cards read as dimmed via a darker fill + dashed border, NOT parent
     opacity — opacity composites text against the page and would drop the badge
     below AA contrast (axe wcag143). Text colours below stay full-contrast. */
  .mod-card.locked { background: var(--surface-card-faint); border-style: dashed; }
  .mod-card.locked .mod-blurb { color: var(--text-muted); }
  .mod-num { text-transform: uppercase; letter-spacing: .1em; font-size: 11px; margin: 0; color: var(--highlight); }
  .mod-title { margin: 2px 0; font-size: 18px; color: var(--text-strong); }
  .mod-blurb { font-size: 14px; line-height: 1.5; color: var(--text-muted); }
  .mod-foot { margin-top: auto; padding-top: 8px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .jump-hint { font-style: italic; }

  /* ── state badges ── */
  .badge { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-display); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; padding: 3px 10px; border-radius: var(--radius-chip); }
  .badge-done { background: color-mix(in srgb, var(--ok) 28%, transparent); color: var(--text-strong); border: 1px solid var(--ok); }
  .badge-go { background: color-mix(in srgb, var(--highlight) 18%, transparent); color: var(--highlight); border: 1px solid color-mix(in srgb, var(--highlight) 50%, transparent); }
  .badge-locked { background: var(--surface-hover); color: var(--text-strong); border: 1px solid var(--line); }
  .badge.inline { margin: 0 0 6px; }

  /* ── MODULE view ── */
  .module-view .back { margin-bottom: 14px; }
  .read-intro { color: var(--text-muted); margin: 0 0 14px; max-width: 70ch; line-height: 1.55; }
  .read-block { border-left: 4px solid var(--highlight); }
  .read-block h3 { margin: 0 0 6px; color: var(--text-strong); }
  .lesson-body { margin: 6px 0; line-height: 1.55; }
  .we { background: color-mix(in srgb, var(--highlight) 10%, transparent); border: 1px solid color-mix(in srgb, var(--highlight) 30%, transparent); border-radius: var(--radius-nav); padding: 10px 12px; margin-top: 10px; font-size: 14px; line-height: 1.5; }

  /* ── reasoning maps (ported) ── */
  .reasoning { margin: 0 0 8px; }
  .maps { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 8px; }
  .map-card { background: var(--surface-card-soft); border: 1px solid var(--line); border-radius: var(--radius-card); padding: 16px; }
  @media (max-width: 800px) { .maps { grid-template-columns: 1fr; } }

  /* ── wine read cards ── */
  .winecard .name { font-family: var(--font-display); font-size: 20px; margin: 0; }
  .meters { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; margin: 6px 0; }
  @media (max-width: 420px) { .meters { grid-template-columns: 1fr; } }
  .winecard-pron { margin: 4px 0 0; }
  .winecard-body { margin: 6px 0 0; font-size: 14px; }

  /* ── quick check (ported) ── */
  .qc { margin-top: 4px; border-top: 1px solid var(--line); padding-top: 14px; }
  .qc-q { margin: 0 0 8px; }
  .qc-choices { display: grid; gap: 8px; max-width: 640px; }
  .qc-choice {
    display: flex; align-items: center; gap: 10px; text-align: left; width: 100%;
    background: var(--surface-card); color: var(--text-strong);
    border: 1px solid var(--line); border-radius: var(--radius-nav); padding: 10px 12px; min-height: 44px;
  }
  .qc-choice:hover:not(:disabled) { border-color: var(--highlight); }
  .qc-choice.correct { background: color-mix(in srgb, var(--ok) 30%, transparent); border-color: var(--ok); }
  .qc-choice.wrong { background: color-mix(in srgb, var(--accent) 25%, transparent); border-color: var(--accent); }
  .qc-key { font-family: var(--font-display); font-weight: 800; opacity: .8; }
  .qc-glyph { font-weight: 800; margin-left: 6px; }
  .qc-result { margin: 8px 0 0; min-height: 1.2em; font-weight: 700; }
  .qc-retry { margin-top: 8px; }

  /* ── complete control + confirmation ── */
  .complete-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 18px; }
  .btn.complete-btn:disabled { opacity: .5; cursor: not-allowed; }
  .done-card { margin-top: 16px; padding: 16px; border: 1px solid var(--ok); background: color-mix(in srgb, var(--ok) 14%, transparent); border-radius: var(--radius-card); }
  .done-head { margin: 0 0 12px; font-weight: 800; color: var(--text-strong); }
  .done-links { display: flex; flex-wrap: wrap; gap: 12px; }

  /* ── deductive grid (ported) ── */
  .dg { margin-top: 16px; border-left: 4px solid var(--info); }
  .dg h3 { margin: 0 0 4px; color: var(--text-strong); }
  .dg-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 12px 0; }
  .dg-field { display: grid; gap: 4px; font-size: 13px; }
  .dg-field select { padding: 9px 10px; border-radius: var(--radius-nav); border: 1px solid var(--line); background: var(--surface-raised); color: var(--text-strong); min-height: 42px; }
  .dg-actions { margin-bottom: 10px; }
  .dg-hits { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .dg-hit { display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--radius-nav); }
  .dg-hit.top { border-color: var(--highlight); background: color-mix(in srgb, var(--highlight) 8%, transparent); }
  .dg-lead { font-family: var(--font-display); text-transform: uppercase; font-size: 12px; color: var(--highlight); }
  .dg-grape { font-weight: 800; }
  .dg-name { color: var(--text-muted); }
</style>
