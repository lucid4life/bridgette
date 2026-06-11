<!-- Wine track hub — the deepest track: all nine wine drills plus the pairing
     explorer, mock exams, and the per-bottle deep-dive pages. -->
<svelte:head><title>Wine Track · Bridgette Training</title></svelte:head>

<section class="screen">
  <p class="h-eyebrow">Training track</p>
  <h1>Wine track — Sommelier-lite</h1>
  <p class="sub">Nine drills, a pairing explorer, timed mock exams, and a deep-dive page for every bottle we pour.</p>

  <h2 class="section-h">Drills</h2>
  <div class="card">
    <ul class="drills">
      <li><a class="btn ghost" href="/?deck=wine-identity">Wine Identity</a></li>
      <li><a class="btn ghost" href="/?deck=structure">Structure</a></li>
      <li><a class="btn ghost" href="/?deck=pronunciation">Pronunciation</a></li>
      <li><a class="btn ghost" href="/?deck=translator">Translator</a></li>
      <li><a class="btn ghost" href="/?deck=pairing">Pairing &amp; Why</a></li>
      <li><a class="btn ghost" href="/?deck=pairing-principle">Pairing Levers</a></li>
      <li><a class="btn ghost" href="/?deck=mystery">Mystery Pour</a></li>
      <li><a class="btn ghost" href="/?deck=wine-dish">Wine → Dish</a></li>
      <li><a class="btn ghost" href="/?deck=upsell">Upselling</a></li>
    </ul>
  </div>

  <h2 class="section-h">Tools</h2>
  <div class="grid cols-3">
    <a class="card link" href="/practice/pairing">
      <span class="pill">Explore</span>
      <h3 style="margin-top:10px">Pairing explorer</h3>
      <p class="meta">Start from a dish or a wine and see the match both ways.</p>
    </a>
    <a class="card link" href="/practice/exam">
      <span class="pill">Test</span>
      <h3 style="margin-top:10px">Mock exams</h3>
      <p class="meta">Timed and scored — exam-day pressure on demand.</p>
    </a>
    <a class="card link" href="/reference">
      <span class="pill">Read</span>
      <h3 style="margin-top:10px">Wine deep dives</h3>
      <p class="meta">In the reference, each wine name opens its full page.</p>
    </a>
  </div>

  <h2 class="section-h">Preshift</h2>
  <div class="card fact">
    <h3>Preshift bottle presentations</h3>
    <p class="fact-line">Wednesday FOH wine tastings with the sommelier — and every server and bartender gets assigned a bottle to research and present at preshift. Prep with the <a href="/reference">wine deep-dive pages</a>.</p>
  </div>
</section>

<style>
  /* Wine-track identity: the site's steel teal (the configured-but-unused
     palette slot) carries this hub's hairlines/spines. Decorative only —
     text tokens stay theme-managed. */
  section.screen { --highlight-line: var(--bb-teal); }
  .section-h { font-family: var(--font-display); text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); font-size: 14px; margin: 22px 0 12px; }
  .card.link { text-decoration: none; color: inherit; display: block; }
  .card.link:hover { border-color: var(--highlight); }
  .drills { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 10px; }
  .fact { border-left: 4px solid var(--highlight-line); }
  .fact-line { margin: 0; line-height: 1.5; }
  .fact-line a { font-weight: 700; color: var(--text-strong); text-decoration-color: var(--highlight); }
  .fact-line a:hover { color: var(--highlight); }
</style>
