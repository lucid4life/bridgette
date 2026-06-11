<!-- Bar track hub — the bartender playbook: official builds (Jan-2025 beverage
     syllabus) via the know-the-build lesson + Cocktail Builds deck, the arc of
     service, and the cocktail reference. -->
<script lang="ts">
  import { data } from '$lib/data/index';

  // Derived, not hardcoded — the same rule the cram sheet uses, so the two
  // surfaces can never disagree about which drinks lack an official spec.
  const noSpec = data.cocktails.filter((c) => !c.build?.length).map((c) => c.name);
</script>

<svelte:head><title>Bar Track · Bridgette Training</title></svelte:head>

<section class="screen">
  <p class="h-eyebrow">Training track</p>
  <h1>Bar track — Bartender</h1>
  <p class="sub">The official cocktail builds are in. Learn the build, drill it, then walk the arc of service.</p>

  <h2 class="section-h">Start here</h2>
  <div class="card plan-card">
    <ol class="plan">
      <li><a href="/learn#know-the-build">Lesson: Know the build</a> <span class="meta">— name + key components for every drink, allergen flags cold.</span></li>
      <li><a href="/?deck=builds">Drill: Cocktail Builds</a> <span class="meta">— the official specs, glass by glass.</span></li>
      <li><a href="/learn#arc-of-service">Lesson: The arc of service</a> <span class="meta">— every touchpoint from greet to goodbye.</span></li>
      <li><a href="/reference?filter=Cocktails">Reference: cocktails</a> <span class="meta">— builds, allergens, and the say-this line for each drink.</span></li>
    </ol>
  </div>

  <h2 class="section-h">Keep sharp</h2>
  <div class="grid cols-2">
    <a class="card link" href="/?deck=cocktail-pairing">
      <span class="pill">Drill</span>
      <h3 style="margin-top:10px">Cocktail Pairing</h3>
      <p class="meta">Dish → cocktail call, the lever behind it, and the zero-proof move.</p>
    </a>
    <a class="card link" href="/reference?filter=Cocktails">
      <span class="pill">Reference</span>
      <h3 style="margin-top:10px">Cocktails</h3>
      <p class="meta">Browse the cocktail list in the reference.</p>
    </a>
  </div>

  <h2 class="section-h">House facts</h2>
  <div class="grid cols-2">
    <div class="card fact">
      <h3>Matinee</h3>
      <p class="fact-line">Happy Hour is called <strong>Matinee</strong> — daily 2–5pm, 50% off all drinks.</p>
    </div>
    {#if noSpec.length}
      <div class="card fact">
        <h3>Drinks without a spec</h3>
        <p class="fact-line">No official spec yet for <strong>{noSpec.join(' and ')}</strong> (newer than the Jan-2025 syllabus) — ask for the current spec sheet / bar manuals.</p>
      </div>
    {/if}
  </div>
</section>

<style>
  .section-h { font-family: var(--font-display); text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); font-size: 14px; margin: 22px 0 12px; }
  .card.link { text-decoration: none; color: inherit; display: block; }
  .card.link:hover { border-color: var(--highlight); }
  .fact { border-left: 4px solid var(--highlight); }
  .fact-line { margin: 0; line-height: 1.5; }

  /* Start here — an ordered run sheet (same pattern as the food hub's plan). */
  .plan-card { border-left: 4px solid var(--highlight-line); }
  .plan { margin: 0; padding: 0 0 0 22px; display: grid; gap: 10px; }
  .plan li { line-height: 1.5; }
  .plan a { font-weight: 700; color: var(--text-strong); text-decoration-color: var(--highlight); }
  .plan a:hover { color: var(--highlight); }
</style>
