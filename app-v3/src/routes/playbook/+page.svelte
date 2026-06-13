<script lang="ts">
  // Task J — /playbook: the lookup-first reference tab. This is what the runner
  // opens BETWEEN tasks on the floor — speed-to-answer over everything: one
  // search box, one chip row, all 42 dishes client-side, zero navigation depth.
  import { data } from '$lib/data/index';
  import type { Food } from '$lib/data/types';
  import { HOUSE_NOTES } from '$lib/journey/house-items';
  import { PRON_TERMS } from '$lib/journey/pronunciation';
  import TermSay from '$lib/components/session/TermSay.svelte';

  // Category chips come from the data in menu order (Snacks → Matinee / Late
  // Night); the long pseudo-category renders short on the chip and the pill.
  const CATS: string[] = ['All', ...new Set(data.foods.map((f) => f.category))];
  const catLabel = (c: string) => (c === 'Matinee / Late Night' ? 'Matinee' : c);

  // "9" → "$9"; "varies" stays as written.
  const price = (p: string) => (/^\d/.test(p) ? '$' + p : p);

  let q = $state('');
  let cat = $state('All');

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
</script>

<svelte:head><title>Playbook · Bridgette Trainer</title></svelte:head>

<section class="screen">
  <header class="pb-head">
    <p class="h-eyebrow">lookup</p>
    <h1>playbook</h1>
    <p class="sub">what's in it, what it costs, what to flag — fast.</p>
    <a class="cram-link" href="/playbook/cram">print the menu cram →</a>
  </header>

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

  <p class="meta count" aria-live="polite">{shown.length} of {data.foods.length} dishes</p>

  {#if shown.length}
    <div class="grid cols-2 on-cream">
      {#each shown as f (f.id)}
        <article class="card light dish">
          <h3 class="dish-name">
            <span class="nm">{f.name}</span><span class="dots" aria-hidden="true"
            ></span><span class="price">{price(f.price)}</span>
          </h3>
          <div class="dish-tags">
            <span class="pill">{catLabel(f.category)}</span>
            {#if f.vegan === true}<span class="pill vegan">vegan</span>{/if}
          </div>
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
        </article>
      {/each}
    </div>
  {:else}
    <p class="empty">no dish matches — <a href="/playbook/cram">check the cram sheet</a>.</p>
  {/if}

  <!-- Say it right — the menu's fancy words: tap to hear (the wine-list voice). -->
  <section class="house on-cream" aria-labelledby="pron-h">
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
  .house { margin-top: 34px; }
  .house .hn h3 { text-transform: lowercase; }
  .pron-chips { display: flex; flex-wrap: wrap; gap: 8px; }
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
  .count { margin: 0 0 12px; }

  .dish { display: flex; flex-direction: column; align-items: flex-start; }
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
