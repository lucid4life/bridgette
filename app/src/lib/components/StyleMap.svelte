<script lang="ts">
  // Body × Acidity style map (spec §8 dual-coding): spatial memory for the list.
  // Dots coloured by family; the wine name reveals on hover/focus; a visually-hidden
  // list carries the same data for screen readers (colour is never the sole channel).
  import { data } from '$lib/data/index';
  import { styleMap, FAMILY_COLOR } from '$lib/data/maps';

  const byId = new Map(data.wines.map((w) => [w.id, w] as const));
  const dots = styleMap.wines
    .map((d) => ({ ...d, wine: byId.get(d.id)! }))
    .filter((d) => d.wine);
  const families = Object.keys(FAMILY_COLOR);
</script>

<figure class="stylemap">
  <figcaption class="meta">Where each wine sits by <strong>body</strong> (light → full) and <strong>acidity</strong> (low → high). Hover a dot for the name; the full list is below.</figcaption>
  <div class="plot-wrap">
    <span class="axis y">Acidity →</span>
    <div class="plot">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line x1="50" y1="0" x2="50" y2="100" class="grid" />
        <line x1="0" y1="50" x2="100" y2="50" class="grid" />
        {#each dots as d (d.id)}
          <g class="dot">
            <circle cx={d.x} cy={100 - d.y} r="3.4" fill={FAMILY_COLOR[d.wine.family]} />
            <text x={d.x} y={100 - d.y - 5} class="dot-label">{d.wine.name}</text>
            <title>{d.wine.name} — {d.wine.structure.body} body, {d.wine.structure.acidity} acidity</title>
          </g>
        {/each}
      </svg>
      <span class="axis x">Body →</span>
    </div>
  </div>
  <ul class="legend" aria-hidden="true">
    {#each families as f}
      <li><span class="swatch" style={`background:${FAMILY_COLOR[f]}`}></span>{f}</li>
    {/each}
  </ul>
  <ul class="visually-hidden">
    {#each dots as d (d.id)}
      <li>{d.wine.name}: {d.wine.structure.body} body, {d.wine.structure.acidity} acidity, {d.wine.family}</li>
    {/each}
  </ul>
</figure>

<style>
  .stylemap { margin: 0; }
  .plot-wrap { display: grid; grid-template-columns: auto 1fr; gap: 6px; align-items: stretch; }
  .axis { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .04em; }
  .axis.y { writing-mode: vertical-rl; transform: rotate(180deg); align-self: center; }
  .axis.x { display: block; text-align: right; margin-top: 2px; }
  .plot { display: grid; }
  svg { width: 100%; aspect-ratio: 1 / 1; background: var(--map-bg); border: 1px solid var(--line); border-radius: var(--radius-card); overflow: visible; }
  .grid { stroke: var(--map-grid); stroke-width: .5; }
  .dot-label { font-size: 3.4px; fill: var(--map-fg); paint-order: stroke; stroke: var(--map-edge); stroke-width: 1px; opacity: 0; pointer-events: none; text-anchor: middle; }
  .dot:hover .dot-label, .dot:focus-visible .dot-label { opacity: 1; }
  .dot circle { stroke: var(--map-edge); stroke-width: .6; cursor: pointer; }
  .dot:hover circle, .dot:focus-visible circle { stroke: var(--map-fg); stroke-width: 1.2; }
  .legend { list-style: none; display: flex; flex-wrap: wrap; gap: 6px 14px; padding: 0; margin: 12px 0 0; font-size: 12px; color: var(--text-muted); }
  .legend li { display: flex; align-items: center; gap: 6px; }
  .swatch { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
</style>
