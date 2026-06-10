<script lang="ts">
  // Stylized origin map (spec §8): not cartography — relative positions match real
  // geography (web-verified). Dots coloured by climate to reinforce the cool↔warm
  // axis that explains structure. Canada sits off-panel as a chip. SR list mirrors it.
  import { data } from '$lib/data/index';
  import { regionMap, CLIMATE_COLOR } from '$lib/data/maps';

  const byId = new Map(data.wines.map((w) => [w.id, w] as const));
  const dots = regionMap.wineDots.map((d) => ({ ...d, wine: byId.get(d.id)! })).filter((d) => d.wine);
  const bcWine = byId.get(regionMap.offPanel.id);
  const climates: ('cool' | 'moderate' | 'warm')[] = ['cool', 'moderate', 'warm'];
</script>

<figure class="regionmap">
  <figcaption class="meta">Where the list comes from — colour shows the climate (cool → warm) that shapes each wine. Hover a dot; the full list is below.</figcaption>
  <div class="map">
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {#each regionMap.countries as c (c.country)}
        <text x={c.x} y={c.y} class="country">{c.country}</text>
      {/each}
      {#each dots as d (d.id)}
        <g class="dot">
          <circle cx={d.x} cy={d.y} r="2.6" fill={CLIMATE_COLOR[d.wine.climate]} />
          <text x={d.x} y={d.y - 3.5} class="dot-label">{d.wine.name}</text>
          <title>{d.wine.name} — {d.regionLabel} ({d.wine.climate})</title>
        </g>
      {/each}
    </svg>
  </div>
  {#if bcWine}
    <p class="offpanel">
      <span class="chip-dot" style={`background:${CLIMATE_COLOR[bcWine.climate]}`}></span>
      <strong>{bcWine.name}</strong> · {regionMap.offPanel.label} — across the globe ({bcWine.climate})
    </p>
  {/if}
  <ul class="legend" aria-hidden="true">
    {#each climates as c}
      <li><span class="swatch" style={`background:${CLIMATE_COLOR[c]}`}></span>{c}</li>
    {/each}
  </ul>
  <ul class="visually-hidden">
    {#each dots as d (d.id)}<li>{d.wine.name}: {d.regionLabel}, {d.wine.climate} climate</li>{/each}
    {#if bcWine}<li>{bcWine.name}: {regionMap.offPanel.label}, {bcWine.climate} climate</li>{/if}
  </ul>
</figure>

<style>
  .regionmap { margin: 0; }
  svg { width: 100%; aspect-ratio: 5 / 4; background: var(--map-bg); border: 1px solid var(--line); border-radius: var(--radius-card); }
  /* UX-15: was opacity .65 (= 4.09:1, a 1.4.3 AA fail); full opacity makes it ~7.6:1. */
  .country { font-size: 4px; fill: var(--map-muted); font-family: var(--font-display); text-transform: uppercase; letter-spacing: .04em; text-anchor: middle; }
  .dot circle { stroke: var(--map-edge); stroke-width: .6; cursor: pointer; }
  .dot:hover circle, .dot:focus-visible circle { stroke: var(--map-fg); stroke-width: 1.2; }
  .dot-label { font-size: 3px; fill: var(--map-fg); paint-order: stroke; stroke: var(--map-edge); stroke-width: 1px; opacity: 0; pointer-events: none; text-anchor: middle; }
  .dot:hover .dot-label, .dot:focus-visible .dot-label { opacity: 1; }
  .offpanel { display: flex; align-items: center; gap: 8px; margin: 10px 0 0; font-size: 13px; color: var(--text-muted); }
  .chip-dot { width: 11px; height: 11px; border-radius: 50%; flex: none; }
  .legend { list-style: none; display: flex; gap: 6px 14px; padding: 0; margin: 10px 0 0; font-size: 12px; color: var(--text-muted); text-transform: capitalize; }
  .legend li { display: flex; align-items: center; gap: 6px; }
  .swatch { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
</style>
