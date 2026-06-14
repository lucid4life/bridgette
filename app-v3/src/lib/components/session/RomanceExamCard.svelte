<script lang="ts">
  // The Romance EXAM's face — the menu-test simulator's question card. Same
  // printed-menu look as RomanceCard (name set BIG, the model line to quote),
  // but the reveal is a STRUCTURED self-check graded to the real Monday bar:
  // tap the dish name once you've said it, then tap each official component you
  // actually delivered. A live verdict reads the bar (name + min(3, components));
  // "lock it in" reports the structured outcome — no vibe, no SRS write.
  import { tick } from 'svelte';
  import type { RomanceContent } from '$lib/journey/items';
  import type { RomanceExamOutcome } from '$lib/session';
  import DishPhoto from './DishPhoto.svelte';

  let {
    content,
    kicker = 'the menu exam — say it, then check yourself',
    ongrade
  }: {
    content: RomanceContent;
    kicker?: string;
    ongrade: (outcome: RomanceExamOutcome) => void;
  } = $props();

  const price = $derived(/^\d/.test(content.price) ? '$' + content.price : content.price);
  // The pass bar for this dish: min(3, official components). romanceTargets is
  // already the first-3 slice, so its length IS the bar — derived from the same
  // content the engine grades against (one rule, no second source, no extra lookup).
  const required = $derived(content.romanceTargets.length);
  // The headline-three the runner is coached toward (the same pass-bar set as
  // the daily drill); every official component is still tappable and counts.
  const headline = $derived(new Set(content.romanceTargets));

  let revealed = $state(false);
  let named = $state(false);
  let said = $state<Set<string>>(new Set());
  let qEl: HTMLElement | null = null;
  let rvEl = $state<HTMLElement | null>(null);

  const hits = $derived(said.size);
  const passed = $derived(named && hits >= required);
  // nailed (clears the bar) · partly (something, but short) · missed (nothing yet).
  // Parens are explicit: (named || hits > 0) is the 'partly' test, not part of
  // the inner ternary.
  const verdict = $derived(
    passed ? 'nailed' : (named || hits > 0) ? 'partly' : 'missed'
  );
  // How far from the bar, stated honestly (the gap can be more than one).
  const compShort = $derived(Math.max(0, required - hits));
  const partlyTail = $derived(
    !named && compShort === 0
      ? 'just say the name to clear'
      : !named
        ? `say the name + ${compShort} more`
        : `${compShort} more to clear`
  );

  $effect(() => {
    qEl?.focus();
  });

  function reveal(): void {
    revealed = true;
    void tick().then(() => rvEl?.focus());
  }

  function toggleComponent(ing: string): void {
    const next = new Set(said);
    if (next.has(ing)) next.delete(ing);
    else next.add(ing);
    said = next;
  }

  function lockIn(): void {
    ongrade({ named, componentsHit: hits });
  }

  function onKey(e: KeyboardEvent): void {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (revealed) return;
    const tgt = e.target;
    const interactive =
      tgt instanceof HTMLElement && !!tgt.closest('button, a, input, select, textarea');
    if ((e.key === 'Enter' || e.key === ' ') && !interactive) {
      e.preventDefault();
      reveal();
    }
  }
</script>

<svelte:window onkeydown={onKey} />

<article class="flash rom-exam">
  <p class="kicker">{kicker}</p>
  <p class="r-name" tabindex="-1" bind:this={qEl}>{content.name}</p>
  <p class="r-meta">{content.category}<span class="r-dot" aria-hidden="true"></span>{price}</p>
  <p class="r-prompt">
    “This is our {content.name}…” — the dish, plus the {required === 3 ? 'three' : required} component{required === 1 ? '' : 's'} that matter. Out loud.
  </p>

  {#if !revealed}
    <div class="act">
      <button type="button" class="btn" onclick={reveal}>Check yourself</button>
    </div>
    <p class="think">actually out loud — then mark what you said.</p>
  {:else}
    <div class="rv" tabindex="-1" bind:this={rvEl}>
      <!-- the plate, on the REVEAL only — it anchors the line as you self-check
           (showing it on the question face would give the answer away; §0b) -->
      <div class="r-photo"><DishPhoto photoId={content.photoId} name={content.name} /></div>

      <blockquote class="model">
        <p class="m-label">the line to land</p>
        <p class="m-line">“{content.modelLine}”</p>
      </blockquote>

      {#if content.memoryHook}
        <p class="hook"><span class="hook-label">the hook</span>{content.memoryHook}</p>
      {/if}

      <div class="check">
        <p class="c-label">tap what you actually said</p>

        <button
          type="button"
          class="tog name-tog"
          class:on={named}
          aria-pressed={named}
          onclick={() => (named = !named)}
        >
          <span class="tog-tick" aria-hidden="true"></span>
          <span class="tog-t">the name — “{content.name}”</span>
        </button>

        <p class="c-sub">components — {hits}/{required} for the pass · tap each one you named</p>
        <div class="chips">
          {#each content.ingredients as ing (ing)}
            <button
              type="button"
              class="tog chip"
              class:on={said.has(ing)}
              class:headline={headline.has(ing)}
              aria-pressed={said.has(ing)}
              onclick={() => toggleComponent(ing)}
            >
              <span class="tog-tick" aria-hidden="true"></span>
              <span class="tog-t">{ing}</span>
            </button>
          {/each}
        </div>
      </div>

      {#if content.allergens && content.allergens.length > 0}
        <div class="allerg">
          <div class="al-chips">
            {#each content.allergens as a (a)}<span class="pill alt">{a}</span>{/each}
          </div>
          {#if content.allergenNote}<p class="al-note">{content.allergenNote}</p>{/if}
          {#if content.confirmLine}<p class="al-confirm">{content.confirmLine}</p>{/if}
        </div>
      {/if}

      <div class="gradezone">
        <p class="verdict v-{verdict}">
          {#if verdict === 'nailed'}
            nailed it — name + {hits} component{hits === 1 ? '' : 's'}
          {:else if verdict === 'partly'}
            {named ? 'named it' : 'no name'} · {hits} of {required} component{required === 1 ? '' : 's'} — {partlyTail}
          {:else}
            nothing marked yet — be honest, then lock it in
          {/if}
        </p>
        <div class="gradebar">
          <button type="button" class="btn" class:gold={passed} onclick={lockIn}>lock it in</button>
        </div>
        <p class="note-line">graded to the real bar — name + {required} — nothing here touches your reviews</p>
      </div>
    </div>
  {/if}

  <!-- persistent live region: the verdict is announced as the runner taps -->
  <p class="visually-hidden" aria-live="polite" aria-atomic="true">
    {revealed
      ? `${named ? 'Named.' : 'Name not said.'} ${hits} of ${required} components. ${passed ? 'Clears the bar.' : 'Below the bar.'}`
      : ''}
  </p>
</article>

<style>
  .rom-exam {
    animation: card-in 0.22s ease;
  }
  @keyframes card-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .kicker {
    margin: 0;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-label);
  }
  .r-name {
    margin: 2px 0 0;
    font-family: var(--font-display);
    font-size: clamp(30px, 7vw, 42px);
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: 0.01em;
    color: var(--text-strong);
  }
  .r-name:focus,
  .rv:focus {
    outline: none;
  }
  .r-meta {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    font-family: var(--font-display);
    font-size: 12.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
  }
  .r-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--highlight-line);
  }
  .r-prompt {
    margin: 0;
    font-size: 14px;
    font-style: italic;
    color: var(--text-muted);
    max-width: 38ch;
    justify-self: center;
  }
  .act {
    display: flex;
    justify-content: center;
  }
  .think {
    margin: 0;
    font-size: 12.5px;
    font-style: italic;
    color: var(--text-muted);
  }

  /* ---- revealed ---- */
  .rv {
    display: grid;
    gap: 14px;
    animation: card-in 0.2s ease;
  }
  /* a contained, rounded plate (matches the daily romance reveal) */
  .r-photo {
    width: min(240px, 100%);
    margin: 0 auto;
    border-radius: var(--radius-card);
    overflow: hidden;
    box-shadow: var(--shadow-1);
  }

  .model {
    margin: 0;
    padding: 10px 14px;
    text-align: left;
    border-left: 3px solid var(--highlight-line);
    background: color-mix(in srgb, var(--highlight) 8%, transparent);
    border-radius: 0 10px 10px 0;
  }
  .m-label {
    margin: 0 0 3px;
    font-family: var(--font-display);
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--text-label);
  }
  .m-line {
    margin: 0;
    font-size: 13px;
    font-style: italic;
    line-height: 1.55;
    color: var(--text-body);
  }

  .hook {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-body);
    text-align: left;
  }
  .hook-label {
    font-family: var(--font-display);
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--highlight);
    margin-right: 8px;
  }

  /* ---- structured self-check ---- */
  .check {
    display: grid;
    gap: 9px;
    text-align: left;
  }
  .c-label {
    margin: 0;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--highlight);
  }
  .c-sub {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--text-muted);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }
  /* toggle chip: a printed checkbox that fills when you confirm you said it.
     Off-state ink is --text-body on cream (AA); on-state is strong ink on an
     accent wash with an accent border — both themes pass the token suite. */
  .tog {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 12px;
    border-radius: var(--radius-chip, 999px);
    border: 1.5px solid color-mix(in srgb, var(--text-label) 45%, transparent);
    background: var(--bb-paper);
    color: var(--text-body);
    font-family: var(--font-display);
    font-size: 13.5px;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: background 0.12s ease, border-color 0.12s ease;
  }
  .tog:hover {
    border-color: var(--accent-text);
  }
  .tog .tog-tick {
    width: 15px;
    height: 15px;
    border-radius: 4px;
    border: 1.5px solid color-mix(in srgb, var(--text-label) 55%, transparent);
    flex: none;
    position: relative;
  }
  .tog.on {
    background: color-mix(in srgb, var(--accent) 16%, var(--bb-paper));
    border-color: var(--accent-text);
    color: var(--text-strong);
  }
  .tog.on .tog-tick {
    background: var(--accent-text);
    border-color: var(--accent-text);
  }
  .tog.on .tog-tick::after {
    content: '';
    position: absolute;
    left: 4.5px;
    top: 1.5px;
    width: 4px;
    height: 8px;
    border: solid var(--bb-paper);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  /* the headline-three carry a small marigold underline cue (still fully tappable) */
  .tog.headline .tog-t {
    box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--highlight-line) 70%, transparent);
  }
  .name-tog {
    width: 100%;
    justify-content: flex-start;
    font-size: 14.5px;
  }

  /* ---- allergen framing (same compact treatment as RomanceCard) ---- */
  .allerg {
    display: grid;
    gap: 6px;
    justify-items: center;
  }
  .al-chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }
  .al-note {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.45;
    color: var(--accent-text);
  }
  .al-confirm {
    margin: 0;
    font-size: 12px;
    font-style: italic;
    color: var(--text-muted);
  }

  /* ---- verdict + lock-in ---- */
  .gradezone {
    display: grid;
    gap: 8px;
  }
  .verdict {
    margin: 0;
    font-family: var(--font-display);
    font-size: 13.5px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .v-nailed {
    color: color-mix(in srgb, var(--ok) 70%, var(--text-strong));
  }
  .v-partly {
    color: var(--accent-text);
  }
  .v-missed {
    color: var(--text-muted);
  }
  .gradebar {
    display: flex;
    justify-content: center;
  }
  .note-line {
    margin: 0;
    font-size: 12px;
    font-style: italic;
    color: var(--text-muted);
  }
</style>
