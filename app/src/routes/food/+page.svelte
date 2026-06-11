<!-- Food track hub — the food-runner playbook. Static content from the official
     onboarding package + service guide; links route into the cram sheet, the
     two food lessons, and the components/allergens drill decks. -->
<svelte:head><title>Food Track · Bridgette Training</title></svelte:head>

<section class="screen">
  <p class="h-eyebrow">Training track</p>
  <h1>Food track — Food Runner</h1>
  <p class="sub">First three shifts: run food to the right seat at the correct table while accurately describing each dish.</p>

  <h2 class="section-h">Tonight's plan</h2>
  <div class="card plan-card">
    <ol class="plan">
      <li><a href="/reference/cram">Cram sheet</a> <span class="meta">— every dish: components, allergens, price. Printable.</span></li>
      <li><a href="/learn#know-the-dish">Lesson: Know the dish</a> <span class="meta">— how to describe a plate you're carrying.</span></li>
      <li><a href="/learn#running-food">Lesson: Running food</a> <span class="meta">— seats, chits, and the floor.</span></li>
      <li><a href="/?deck=components">Drill: Dish Components</a> <span class="meta">— name the dish + what's in it.</span></li>
      <li><a href="/?deck=allergens">Drill: Allergen Flags</a> <span class="meta">— which flags each dish carries.</span></li>
    </ol>
  </div>

  <h2 class="section-h">The romance formula</h2>
  <div class="card formula">
    <p class="formula-line">Name the dish + three components.</p>
    <p class="meta">Exactly what the Dish Components drill trains — "This is our grilled octopus salad, with fennel and orange in a sherry vinaigrette."</p>
  </div>

  <h2 class="section-h">Runner's checklist</h2>
  <div class="card">
    <ul class="checklist">
      <li><strong>Seat numbers:</strong> seat 1 = your left as you approach; numbers run clockwise; seat 1 on the banquette; shared items = seat 0.</li>
      <li><strong>Never auction</strong> — the chit's seat numbers say who gets what.</li>
      <li><strong>Sharing cutlery</strong> travels with every dish.</li>
      <li><strong>Drinks:</strong> first-made-first-run, anything sitting over a minute you take; guest's right, garnish facing right, stem/base only.</li>
      <li><strong>Allergies</strong> are flagged on every item incl. seat-0 shares — when in doubt, confirm with the kitchen.</li>
      <li><strong>Clearing:</strong> only when the whole table's done (unless a plate's pushed aside); stack away from the guest, glassware on a tray.</li>
      <li><strong>Never reach</strong> across a guest; open hand, never point.</li>
      <li><strong>Side station</strong> fully stocked is the first and last job of every shift.</li>
    </ul>
  </div>

  <h2 class="section-h">Table map</h2>
  <div class="card">
    <ul class="tmap">
      <li><b>101–108</b> <span class="meta">bar top</span></li>
      <li><b>121–126</b> <span class="meta">bar tables</span></li>
      <li><b>131–135</b> <span class="meta">loft</span></li>
      <li><b>201–212</b> <span class="meta">east</span></li>
      <li><b>221</b> <span class="meta">high top</span></li>
      <li><b>301–309 / 311–316 / 321–326</b> <span class="meta">west</span></li>
      <li><b>401</b> <span class="meta">PDR</span></li>
      <li><b>141–144</b> <span class="meta">patio</span></li>
    </ul>
  </div>

  <h2 class="section-h">Day one</h2>
  <div class="card">
    <ul class="checklist">
      <li>Arrive 15 min early — scheduled time = on the job, not at the door.</li>
      <li>Back door, ring the bell.</li>
      <li>Clock in on the 7shifts iPad.</li>
      <li>Pre-shift meeting in the dining room.</li>
      <li>Kit: 2 pens, lighter, wine opener, notepad.</li>
      <li>Phone never visible on the floor.</li>
    </ul>
  </div>

  <p class="ref-row"><a class="btn ghost" href="/reference">Full food reference — every dish in detail</a></p>
</section>

<style>
  /* Food-track identity: the brand orange carries this hub's hairlines/spines. */
  section.screen { --highlight-line: var(--bb-orange); }
  .section-h { font-family: var(--font-display); text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); font-size: 14px; margin: 22px 0 12px; }

  /* Tonight's plan — an ordered run sheet. */
  .plan-card { border-left: 4px solid var(--highlight-line); }
  .plan { margin: 0; padding: 0 0 0 22px; display: grid; gap: 10px; }
  .plan li { line-height: 1.5; }
  .plan a { font-weight: 700; color: var(--text-strong); text-decoration-color: var(--highlight); }
  .plan a:hover { color: var(--highlight); }

  /* The romance formula callout. */
  .formula { border-left: 4px solid var(--highlight); }
  .formula-line { margin: 0 0 6px; font-family: var(--font-display); font-size: clamp(20px, 2.4vw, 26px); color: var(--text-strong); }

  /* Compact fact lists (checklist + day one). */
  .checklist { margin: 0; padding: 0 0 0 18px; display: grid; gap: 8px; }
  .checklist li { line-height: 1.5; font-size: 14px; }
  .checklist strong { color: var(--text-strong); }

  /* Table map — a scannable grid of range → area. */
  .tmap { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px 16px; }
  .tmap li { display: flex; align-items: baseline; gap: 8px; padding: 6px 0; border-bottom: 1px dashed var(--line); }
  .tmap b { font-family: var(--font-display); color: var(--text-strong); white-space: nowrap; }

  .ref-row { margin: 22px 0 0; }
</style>
