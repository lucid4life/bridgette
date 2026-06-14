<script lang="ts">
  // Task J — /playbook: the lookup-first reference tab. This is what the runner
  // opens BETWEEN tasks on the floor — speed-to-answer over everything: one
  // search box, one chip row, all 42 dishes client-side, zero navigation depth.
  import { SvelteSet } from 'svelte/reactivity';
  import { data } from '$lib/data/index';
  import type { Food } from '$lib/data/types';
  import { HOUSE_NOTES } from '$lib/journey/house-items';
  import { PRON_TERMS } from '$lib/journey/pronunciation';
  import { ALLERGEN_LEGEND, SEAT_RULES, TABLE_MAP } from '$lib/journey/reference';
  import TermSay from '$lib/components/session/TermSay.svelte';
  import DishPhoto from '$lib/components/session/DishPhoto.svelte';

  // Category chips come from the data in menu order (Snacks → Matinee / Late
  // Night); the long pseudo-category renders short on the chip and the pill.
  const CATS: string[] = ['All', ...new Set(data.foods.map((f) => f.category))];
  const catLabel = (c: string) => (c === 'Matinee / Late Night' ? 'Matinee' : c);

  // "9" → "$9"; "varies" stays as written.
  const price = (p: string) => (/^\d/.test(p) ? '$' + p : p);

  let q = $state('');
  let cat = $state('All');

  // "Quiz me" flip mode: cards collapse to name + price, the components/flags
  // hidden behind a per-card tap — a zero-commitment self-test over the lookup
  // grid (no SRS, no session). Switching mode or filtering clears reveals.
  let quizMode = $state(false);
  const revealed = new SvelteSet<string>();
  function toggleQuiz(): void {
    quizMode = !quizMode;
    revealed.clear();
  }
  function reveal(id: string): void {
    if (quizMode) revealed.add(id);
  }

  // Instant filter — no debounce, $derived recomputes per keystroke over 42
  // records. Matches name / ingredients / description (the three things a
  // runner actually greps for mid-shift).
  function matches(f: Food, needle: string): boolean {
    return [f.name, ...(f.ingredients ?? []), f.description ?? '']
      .join(' ')
      .toLowerCase()
      .includes(needle);
  }
  const shown = $derived.by(() => {
    const needle = q.trim().toLowerCase();
    return data.foods.filter((f) => (cat === 'All' || f.category === cat) && matches(f, needle));
  });

  // The guest-ask translator (the #1 floor skill): "they asked for X → pour Y".
  // Searchable by the ask + its aliases.
  let tq = $state('');
  const translator = $derived.by(() => {
    const needle = tq.trim().toLowerCase();
    if (!needle) return data.translator;
    return data.translator.filter((t) =>
      [t.ask, ...(t.aliases ?? [])].join(' ').toLowerCase().includes(needle)
    );
  });
</script>

<svelte:head><title>Playbook · Bridgette Trainer</title></svelte:head>

<section class="screen">
  <header class="pb-head">
    <p class="h-eyebrow">lookup</p>
    <h1>playbook</h1>
    <p class="sub">what's in it, what it costs, what to flag — fast.</p>
    <a class="cram-link" href="/playbook/cram">print the menu cram →</a>
    <a class="cram-link" href="/romance/guide">read the romance guide →</a>
  </header>

  <nav class="jump no-print" aria-label="Jump to a section">
    <a href="#pb-dishes">dishes</a>
    <a href="#pb-translator">guest asks</a>
    <a href="#pb-tables">table map</a>
    <a href="#pb-allergens">allergen key</a>
    <a href="#pb-pron">say it right</a>
  </nav>

  <label class="search">
    <span class="visually-hidden">Search dishes by name, ingredient, or description</span>
    <input type="search" bind:value={q} placeholder="search a dish…" autocomplete="off" />
  </label>

  <div class="chips" role="group" aria-label="Filter by menu category">
    {#each CATS as c (c)}
      <button class="chip" type="button" aria-pressed={cat === c} onclick={() => (cat = c)}>
        {catLabel(c)}
      </button>
    {/each}
  </div>

  <div class="count-row" id="pb-dishes">
    <p class="meta count" aria-live="polite">{shown.length} of {data.foods.length} dishes</p>
    <button type="button" class="quiz-toggle" aria-pressed={quizMode} onclick={toggleQuiz}>
      {quizMode ? 'quiz me: on' : 'quiz me'}
    </button>
  </div>

  {#if shown.length}
    <div class="grid cols-2 on-cream">
      {#each shown as f (f.id)}
        {@const hidden = quizMode && !revealed.has(f.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
        <article
          class="card light dish"
          class:quiz={quizMode}
          class:hidden
          onclick={() => reveal(f.id)}
        >
          <div class="pb-photo" aria-hidden="true"><DishPhoto photoId={f.id} name={f.name} /></div>
          <h3 class="dish-name">
            <span class="nm">{f.name}</span><span class="dots" aria-hidden="true"
            ></span><span class="price">{price(f.price)}</span>
          </h3>
          <div class="dish-tags">
            <span class="pill">{catLabel(f.category)}</span>
            {#if f.vegan === true}<span class="pill vegan">vegan</span>{/if}
          </div>
          {#if hidden}
            <p class="quiz-prompt">name it, then tap to check →</p>
          {:else}
            {#if f.menu}<p class="menu-line">{f.menu}</p>{/if}
            {#if f.description}<p class="desc">{f.description}</p>{/if}
            {#if f.ingredients?.length}
              <p class="comps"><span class="comps-label">Components:</span>
                {#each f.ingredients as ing, i}{#if i > 0}{', '}{/if}{#if i < 3}<b>{ing}</b>{:else}{ing}{/if}{/each}</p>
            {/if}
            {#if f.allergens?.length}
              <div class="allergens" role="list" aria-label="Allergens">
                {#each f.allergens as a (a)}<span class="pill alt" role="listitem">{a}</span>{/each}
              </div>
              {#if f.allergenNote}<p class="meta a-note">{f.allergenNote}</p>{/if}
              <p class="meta confirm">{data.confirm.allergens}</p>
            {/if}
          {/if}
        </article>
      {/each}
    </div>
  {:else}
    <p class="empty">no dish matches — <a href="/playbook/cram">check the cram sheet</a>.</p>
  {/if}

  <!-- Guest-ask translator — "they asked for X → pour Y" (the #1 floor skill). -->
  <section class="house on-cream" id="pb-translator" aria-labelledby="tr-h">
    <h2 id="tr-h" class="h-eyebrow">guest asked for…</h2>
    <label class="search tr-search">
      <span class="visually-hidden">Search a guest ask (grape or wine name)</span>
      <input type="search" bind:value={tq} placeholder="they asked for… (e.g. Cab, Pinot, Prosecco)" autocomplete="off" />
    </label>
    {#if translator.length}
      <div class="grid cols-2">
        {#each translator as t (t.ask)}
          <article class="card light tr">
            <h3 class="tr-ask">{t.ask}</h3>
            <p class="tr-pour"><span class="tr-label">pour:</span> {t.bestGlass}</p>
            {#if t.familiar}<p class="meta tr-why">{t.familiar}</p>{/if}
            {#if t.phrase}<p class="tr-say">“{t.phrase}”</p>{/if}
          </article>
        {/each}
      </div>
    {:else}
      <p class="empty">no match — every by-the-glass pour is in the dishes + wine reference.</p>
    {/if}
  </section>

  <!-- Table map — seat-numbering rule + the table-number ranges (day-one). -->
  <section class="house on-cream" id="pb-tables" aria-labelledby="tm-h">
    <h2 id="tm-h" class="h-eyebrow">table map &amp; seats</h2>
    <div class="card light tm">
      <ul class="seat-rules">
        {#each SEAT_RULES as r (r)}<li>{r}</li>{/each}
      </ul>
      <div class="zones">
        {#each TABLE_MAP as z (z.range)}
          <div class="zone">
            <span class="zone-range">{z.range}</span>
            <span class="zone-name">{z.zone}</span>
            {#if z.note}<span class="zone-note">{z.note}</span>{/if}
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Allergen legend — what each flag actually means on the floor. -->
  <section class="house on-cream" id="pb-allergens" aria-labelledby="al-h">
    <h2 id="al-h" class="h-eyebrow">allergen key</h2>
    <div class="card light al">
      <p class="meta confirm al-confirm">{data.confirm.allergens}</p>
      <dl class="legend">
        {#each ALLERGEN_LEGEND as a (a.token)}
          <div class="leg-row">
            <dt><span class="pill alt">{a.token}</span></dt>
            <dd>{a.read}</dd>
          </div>
        {/each}
      </dl>
    </div>
  </section>

  <!-- Say it right — the menu's fancy words: tap to hear (the wine-list voice). -->
  <section class="house on-cream" id="pb-pron" aria-labelledby="pron-h">
    <h2 id="pron-h" class="h-eyebrow">say it right</h2>
    <div class="card light pron-card">
      <div class="pron-chips">
        {#each PRON_TERMS as t (t.slug)}<TermSay term={t} />{/each}
      </div>
    </div>
  </section>

  <!-- House notes — the kitchen-concept facts the syllabus opens with (the
       "tell me about the restaurant" answers). Read-only reference. -->
  <section class="house on-cream" aria-labelledby="house-h">
    <h2 id="house-h" class="h-eyebrow">house notes</h2>
    <div class="grid cols-2">
      {#each HOUSE_NOTES as n (n.title)}
        <article class="card light hn">
          <h3>{n.title}</h3>
          <p class="meta">{n.body}</p>
        </article>
      {/each}
    </div>
  </section>
</section>

<style>
  .pb-head { position: relative; margin-bottom: 4px; }
  .house { margin-top: 34px; scroll-margin-top: 16px; }
  .house .hn h3 { text-transform: lowercase; }
  .pron-chips { display: flex; flex-wrap: wrap; gap: 8px; }

  /* section-jump nav */
  .jump {
    display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 16px;
  }
  .jump a {
    padding: 6px 12px; border-radius: var(--radius-chip); border: 1px solid var(--line);
    background: var(--surface-card); color: var(--text-body);
    font-size: 12.5px; font-weight: 700; text-transform: lowercase; text-decoration: none;
  }
  .jump a:hover { background: var(--surface-hover); }
  #pb-dishes { scroll-margin-top: 16px; }

  /* translator */
  .tr-search { margin: 4px 0 14px; }
  .tr-ask { margin: 0 0 4px; font-size: 17px; }
  .tr-pour { margin: 0 0 6px; font-size: 14px; font-weight: 700; color: var(--text-strong); }
  .tr-label { color: var(--text-label); font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: .06em; }
  .tr-why { margin: 0 0 6px; line-height: 1.5; }
  .tr-say { margin: 0; font-style: italic; color: var(--accent-text); font-size: 13.5px; }

  /* table map */
  .tm .seat-rules { margin: 0 0 14px; padding-left: 18px; display: grid; gap: 5px; }
  .tm .seat-rules li { font-size: 13.5px; line-height: 1.45; }
  .zones { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
  .zone {
    display: grid; gap: 1px; padding: 9px 11px; border-radius: var(--radius-nav);
    background: color-mix(in srgb, var(--bb-ink) 4%, transparent); border: 1px solid var(--line);
  }
  .zone-range { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--text-strong); }
  .zone-name { font-size: 12.5px; font-weight: 700; }
  .zone-note { font-size: 11.5px; color: var(--text-muted); }

  /* allergen legend */
  .al-confirm { margin: 0 0 12px; }
  .legend { margin: 0; display: grid; gap: 8px; }
  .leg-row { display: grid; grid-template-columns: 90px 1fr; gap: 10px; align-items: baseline; }
  .leg-row dd { margin: 0; font-size: 13px; line-height: 1.45; color: var(--text-body); }
  @media (max-width: 680px) { .leg-row { grid-template-columns: 80px 1fr; } }
  /* the quiet-but-findable escape hatch to the printable sheet */
  .cram-link {
    display: inline-block; margin: -12px 0 18px; font-size: 14px; font-weight: 700;
    color: var(--accent-text); text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--accent-text) 45%, transparent);
    text-underline-offset: 3px;
  }
  .cram-link:hover { text-decoration-color: var(--accent-text); }

  .search input {
    width: 100%; max-width: 480px; padding: 13px 16px; margin: 0 0 12px;
    border-radius: var(--radius-btn); border: 1px solid var(--line);
    background: var(--surface-card); color: var(--text-strong);
    font-size: 16px; /* ≥16px keeps iOS from zooming the viewport on focus */
  }
  .search input::placeholder { color: var(--text-muted); opacity: 1; }

  .chips { margin-bottom: 10px; }
  .count { margin: 0; }
  .count-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 12px;
  }
  .quiz-toggle {
    flex: none;
    padding: 7px 14px;
    border-radius: var(--radius-chip);
    border: 1px solid var(--line);
    background: var(--surface-card);
    color: var(--text-body);
    font-size: 12.5px;
    font-weight: 700;
    text-transform: lowercase;
    min-height: 34px;
  }
  .quiz-toggle[aria-pressed='true'] {
    background: var(--highlight);
    border-color: var(--highlight);
    color: var(--highlight-ink);
  }
  .dish.quiz {
    cursor: pointer;
  }
  .dish.hidden {
    background: color-mix(in srgb, var(--bb-ink) 3%, var(--surface-paper));
  }
  .quiz-prompt {
    margin: 10px 0 2px;
    font-size: 13px;
    font-style: italic;
    color: var(--text-muted);
  }

  .dish { display: flex; flex-direction: column; align-items: flex-start; }
  /* a small plate at the top-left of each card — see the dish at a glance in the
     lookup (decorative: the name is the h3 below, so the wrapper is aria-hidden) */
  .pb-photo {
    width: 64px;
    border-radius: 8px;
    overflow: hidden;
    margin: 0 0 10px;
    box-shadow: var(--shadow-1);
  }
  /* name … price — the printed menu's dotted leader */
  .dish-name {
    display: flex; align-items: baseline; width: 100%; margin: 0; font-size: 19px;
  }
  .dish-name .nm { font-weight: 600; }
  .dish-name .dots {
    flex: 1; min-width: 18px; margin: 0 7px;
    border-bottom: 2px dotted color-mix(in srgb, currentColor 35%, transparent);
    transform: translateY(-4px);
  }
  .dish-name .price {
    font-family: var(--font-display); font-size: 17px; font-weight: 500; white-space: nowrap;
  }
  .dish-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .pill.vegan {
    background: color-mix(in srgb, var(--ok) 14%, transparent);
    color: var(--ok);
    border-color: color-mix(in srgb, var(--ok) 40%, transparent);
  }
  /* the accompaniment line, set like the printed menu's sub-line */
  .menu-line {
    margin: 8px 0 0; font-size: 11.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted);
  }
  .desc { margin: 8px 0 0; font-size: 14px; line-height: 1.5; }
  .comps { margin: 8px 0 0; font-size: 14px; }
  .comps-label { color: var(--text-muted); font-size: 13px; }
  .comps b { color: var(--text-strong); } /* first three = the money components */

  .allergens { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .a-note { margin: 8px 0 0; font-size: 12.5px; }
  /* the non-negotiable, in small print but ALWAYS under the flags */
  .confirm {
    margin: 8px 0 0; padding-top: 7px; width: 100%;
    border-top: 1px dashed var(--line); font-size: 12px;
  }

  .empty { color: var(--text-muted); margin: 18px 0 0; }
  .empty a { color: var(--accent-text); font-weight: 700; }
</style>
