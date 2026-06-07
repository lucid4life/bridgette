<script lang="ts">
  import { data } from '$lib/data/index';
  import { deduce, DG_DIMS } from '$lib/engine/wineschool.js';
  import FamiliesView from '$lib/components/FamiliesView.svelte';
  import StyleMap from '$lib/components/StyleMap.svelte';
  import RegionMap from '$lib/components/RegionMap.svelte';

  // quick-check state per lesson id
  let picked = $state<Record<string, number | null>>({});

  // deductive grid clues
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

<section class="screen">
  <p class="h-eyebrow">Wine School</p>
  <h1>The fundamentals</h1>
  <p class="sub">Seven short lessons, each with a worked example and a quick check — taught with this list's own wines.</p>

  <section class="reasoning" id="families-geography" aria-labelledby="fg-h">
    <h2 id="fg-h" class="fg-h">Families &amp; geography</h2>
    <p class="meta">Five families to steer by, and the map + style grid that explain why each wine tastes the way it does.</p>
    <h3 class="sub-h">The 5 families</h3>
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

  <h2 class="fg-h">The seven lessons</h2>
  <div class="lessons">
    {#each data.lessons as l, i (l.id)}
      <article class="card lesson" id={l.id} aria-labelledby={l.id + '-h'}>
        <p class="lesson-num meta">Lesson {i + 1}</p>
        <h3 id={l.id + '-h'}>{l.title}</h3>
        <p class="lesson-body">{l.body}</p>
        <div class="we"><strong>Worked example:</strong> {l.workedExample}</div>

        <div class="qc" role="group" aria-label={'Quick check: ' + l.title}>
          <p class="qc-q"><span class="pill">Quick check</span> {l.quickCheck.q}</p>
          <div class="qc-choices">
            {#each l.quickCheck.choices as choice, ci}
              {@const chosen = picked[l.id]}
              {@const isAns = ci === l.quickCheck.answer}
              <button
                class="qc-choice"
                class:correct={chosen != null && isAns}
                class:wrong={chosen === ci && !isAns}
                type="button"
                aria-pressed={chosen === ci}
                disabled={chosen != null}
                onclick={() => (picked[l.id] = ci)}
              >
                <span class="qc-key" aria-hidden="true">{String.fromCharCode(65 + ci)}</span>
                <span>{choice}</span>
              </button>
            {/each}
          </div>
          <p class="qc-result" aria-live="polite">
            {#if picked[l.id] != null}
              {#if picked[l.id] === l.quickCheck.answer}
                Correct. {l.quickCheck.choices[l.quickCheck.answer]} is the answer.
              {:else}
                Not quite — the answer is {l.quickCheck.choices[l.quickCheck.answer]}. Re-read the worked example.
              {/if}
            {/if}
          </p>
        </div>
      </article>
    {/each}
  </div>

  <article class="card dg" id="deductive-grid-tool">
    <h3>Deductive grid — guess the grape from the clues</h3>
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
</section>

<style>
  .reasoning { margin: 0 0 30px; }
  .fg-h { font-size: clamp(20px, 2.4vw, 26px); margin: 18px 0 4px; color: var(--cream); }
  .sub-h { font-size: 15px; margin: 18px 0 10px; color: var(--gold); text-transform: uppercase; letter-spacing: .06em; }
  .maps { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 8px; }
  .map-card { background: rgba(255, 238, 215, .04); border: 1px solid var(--line); border-radius: var(--radius-card); padding: 16px; }
  @media (max-width: 800px) { .maps { grid-template-columns: 1fr; } }
  .lessons { display: grid; gap: 16px; }
  .lesson-num { margin: 0 0 2px; text-transform: uppercase; letter-spacing: .1em; font-size: 11px; }
  .lesson-body { margin: 6px 0; line-height: 1.55; }
  .qc { margin-top: 12px; border-top: 1px solid var(--line); padding-top: 12px; }
  .qc-q { margin: 0 0 8px; }
  .qc-choices { display: grid; gap: 8px; }
  .qc-choice {
    display: flex; align-items: center; gap: 10px; text-align: left; width: 100%;
    background: rgba(255, 238, 215, .05); color: var(--cream);
    border: 1px solid var(--line); border-radius: var(--radius-nav); padding: 10px 12px; min-height: 44px;
  }
  .qc-choice:hover:not(:disabled) { border-color: var(--gold); }
  .qc-choice.correct { background: rgba(63, 107, 84, .3); border-color: var(--green); }
  .qc-choice.wrong { background: rgba(168, 50, 18, .25); border-color: var(--accent-dark); }
  .qc-key { font-family: var(--font-display); font-weight: 800; opacity: .8; }
  .qc-result { margin: 8px 0 0; min-height: 1.2em; font-weight: 700; }
  .dg { margin-top: 22px; border-left: 4px solid var(--blue); }
  .dg-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 12px 0; }
  .dg-field { display: grid; gap: 4px; font-size: 13px; }
  .dg-field select { padding: 9px 10px; border-radius: var(--radius-nav); border: 1px solid var(--line); background: var(--ink-2); color: var(--cream); min-height: 42px; }
  .dg-actions { margin-bottom: 10px; }
  .dg-hits { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .dg-hit { display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--radius-nav); }
  .dg-hit.top { border-color: var(--gold); background: rgba(252, 181, 57, .08); }
  .dg-lead { font-family: var(--font-display); text-transform: uppercase; font-size: 12px; color: var(--gold); }
  .dg-grape { font-weight: 800; }
  .dg-name { color: var(--muted); }
</style>
