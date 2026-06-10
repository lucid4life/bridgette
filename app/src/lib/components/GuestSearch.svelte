<script lang="ts">
  // Global "Guest asked for…" search (spec §recognition-over-recall): the load-bearing
  // entry point that resolves a guest's *words* to the right floor SURFACE. It does not
  // re-author content — it deep-links into /on-the-floor with view + q params so the
  // Substitutions/Pairings surface opens pre-filtered. Plain results list (NOT a floating
  // combobox) for robust a11y: implicit list/listitem roles, each link discernible.
  import { data } from '$lib/data/index';
  import { goto } from '$app/navigation';

  let {
    placeholder = 'Guest asked for… Cab, lamb, Barolo, something sweet…',
    autofocus = false
  }: { placeholder?: string; autofocus?: boolean } = $props();

  let query = $state('');

  // Zero-proof drinks the menu prints in pairings (inverted from foods[].zero) so the
  // global search can surface them — they land in Reference's Zero-proof section.
  const ZERO_PROOF_NAMES = (() => {
    const set = new Set<string>();
    for (const f of data.foods) {
      if (!f.zero) continue;
      for (const d of f.zero.split(/\s+or\s+/i).map((s) => s.trim()).filter(Boolean)) set.add(d);
    }
    return [...set];
  })();

  type Result = { label: string; kind: 'Substitution' | 'Pairing' | 'Wine' | 'Zero-proof'; href: string };

  // Top ~6, case-insensitive `includes`, ordered Substitution → Pairing → Wine, deduped by href.
  const results = $derived.by<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const subs: Result[] = data.translator
      .filter((t) => {
        const hay = [t.ask, ...(t.aliases ?? [])];
        return hay.some((s) => s.toLowerCase().includes(q));
      })
      .map((t) => ({
        label: t.ask,
        kind: 'Substitution' as const,
        href: '/on-the-floor?view=substitutions&q=' + encodeURIComponent(t.ask)
      }));

    const pairs: Result[] = data.foods
      .filter((f) => f.name.toLowerCase().includes(q))
      .map((f) => ({
        label: f.name,
        kind: 'Pairing' as const,
        href: '/on-the-floor?view=pairings&q=' + encodeURIComponent(f.name)
      }));

    const wines: Result[] = data.wines
      .filter((w) => w.name.toLowerCase().includes(q) || (w.grape ?? '').toLowerCase().includes(q))
      .map((w) => ({
        label: w.name,
        kind: 'Wine' as const,
        href: '/on-the-floor?view=substitutions&q=' + encodeURIComponent(w.name)
      }));

    const zeros: Result[] = ZERO_PROOF_NAMES
      .filter((n) => n.toLowerCase().includes(q))
      .map((n) => ({
        label: n,
        kind: 'Zero-proof' as const,
        href: '/reference?filter=Zero-proof&q=' + encodeURIComponent(n)
      }));

    const seen = new Set<string>();
    const out: Result[] = [];
    for (const r of [...subs, ...pairs, ...wines, ...zeros]) {
      if (seen.has(r.href)) continue;
      seen.add(r.href);
      out.push(r);
      if (out.length === 6) break;
    }
    return out;
  });

  function onKeydown(e: KeyboardEvent) {
    // Enter jumps to the best match — recognition-over-recall: no need to mouse to it.
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      goto(results[0].href);
    }
  }
</script>

<div class="guest-search">
  <label>
    <span class="visually-hidden">Search what a guest asked for — a grape, a dish, a wine, or a style</span>
    <!-- svelte-ignore a11y_autofocus -->
    <input
      type="search"
      bind:value={query}
      onkeydown={onKeydown}
      {placeholder}
      autocomplete="off"
      autofocus={autofocus}
    />
  </label>

  {#if query.trim() && results.length}
    <ul class="results">
      {#each results as r (r.href)}
        <li>
          <a href={r.href}>
            <span class="label">{r.label}</span>
            <span class="kind">{r.kind}</span>
          </a>
        </li>
      {/each}
    </ul>
  {:else if query.trim()}
    <p class="empty">No match for “{query.trim()}”. Try a grape, a dish, or a style.</p>
  {/if}
</div>

<style>
  .guest-search { width: 100%; max-width: 480px; }

  /* Matches the existing `.search input` look (cream text on translucent dark). */
  input {
    width: 100%; padding: 12px 15px;
    border-radius: var(--radius-btn); border: 1px solid var(--line);
    background: rgba(255, 238, 215, .05); color: var(--cream); font-size: 16px;
  }
  input::placeholder { color: var(--muted); opacity: 1; }

  .results {
    list-style: none; margin: 8px 0 0; padding: 4px;
    background: rgba(255, 238, 215, .04); border: 1px solid var(--line);
    border-radius: var(--radius-nav);
  }
  .results li { margin: 0; }

  /* Subtle row; 44px min touch target; cream/muted text = AA on the dark surface. */
  .results a {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    min-height: 44px; padding: 8px 12px;
    border-radius: var(--radius-nav);
    color: var(--cream); text-decoration: none;
  }
  .results a:hover { background: rgba(255, 238, 215, .08); }
  .results a:focus-visible { outline: 2px solid var(--gold); outline-offset: -2px; }

  .label { font-size: 15px; font-weight: 600; }
  .kind {
    flex: none; font-size: 11px; font-weight: 800;
    text-transform: uppercase; letter-spacing: .06em; color: var(--gold);
  }

  .empty { margin: 8px 0 0; color: var(--muted); font-size: 14px; }
</style>
