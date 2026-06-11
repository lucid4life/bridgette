<!-- Bar track hub — slim for now; grows once the official beverage syllabus
     lands (cocktail builds deck is the next phase). -->
<svelte:head><title>Bar Track · Bridgette Training</title></svelte:head>

<section class="screen">
  <p class="h-eyebrow">Training track</p>
  <h1>Bar track — Bartender</h1>
  <p class="sub">This track expands after your first shifts. For now, keep the cocktail reflex warm.</p>

  <h2 class="section-h">Keep sharp</h2>
  <div class="grid cols-2">
    <a class="card link" href="/?deck=cocktail-pairing">
      <span class="pill">Drill</span>
      <h3 style="margin-top:10px">Cocktail Pairing</h3>
      <p class="meta">Dish → cocktail call, the lever behind it, and the zero-proof move.</p>
    </a>
    <a class="card link" href="/reference">
      <span class="pill">Reference</span>
      <h3 style="margin-top:10px">Cocktails</h3>
      <p class="meta">Browse the cocktail list in the reference.</p>
    </a>
  </div>

  <h2 class="section-h">House fact</h2>
  <div class="card fact">
    <h3>Matinee</h3>
    <p class="fact-line">Happy Hour is called <strong>Matinee</strong> — daily 2–5pm, 50% off all drinks.</p>
  </div>

  <p class="meta coming">Coming next: official cocktail builds deck from the beverage syllabus.</p>
</section>

<style>
  .section-h { font-family: var(--font-display); text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); font-size: 14px; margin: 22px 0 12px; }
  .card.link { text-decoration: none; color: inherit; display: block; }
  .card.link:hover { border-color: var(--highlight); }
  .fact { border-left: 4px solid var(--highlight); }
  .fact-line { margin: 0; line-height: 1.5; }
  .coming { margin: 18px 0 0; font-style: italic; }
</style>
