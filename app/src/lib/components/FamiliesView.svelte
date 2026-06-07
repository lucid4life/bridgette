<script lang="ts">
  // Wine families (spec §8): ~5 steerable buckets that back the translator and let a
  // beginner improvise. Steers verified by the reasoning-layer workflow.
  import { data } from '$lib/data/index';
  import { FAMILY_COLOR } from '$lib/data/maps';

  const STEER: Record<string, string> = {
    'Bubbles & Rosé': 'High-acid, low-tannin sparklers and dry rosés — aperitifs and palate-cutters for fried, salty, and briny plates.',
    'Bright & Crisp Whites': 'Zippy, high-acid, mostly dry whites — the refreshers for shellfish, salads, goat cheese, and anything that wants lemon.',
    'Round Whites': 'Medium-acid, medium-bodied whites with a softer mouthfeel — for roast chicken, creamy sauces, and richer fish.',
    'Light Reds': 'Low-to-medium tannin reds you can lightly chill — gentle and food-flexible, great for charcuterie, mushrooms, or red-curious white drinkers.',
    'Structured Reds': 'Firm-tannin, grippy reds with body — for grilled and braised red meats, hard cheeses, and rich tomato dishes.'
  };
  const order = Object.keys(FAMILY_COLOR);
  const families = order.map((name) => ({
    name,
    steer: STEER[name],
    members: data.wines.filter((w) => w.family === name)
  }));
</script>

<div class="families">
  {#each families as f (f.name)}
    <article class="card family" style={`--fam:${FAMILY_COLOR[f.name]}`}>
      <h3>{f.name}</h3>
      <p class="meta steer">{f.steer}</p>
      <div class="members">
        {#each f.members as w (w.id)}
          <span class="member">{w.name}</span>
        {/each}
      </div>
    </article>
  {/each}
</div>

<style>
  .families { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
  .family { border-left: 4px solid var(--fam); }
  .steer { margin: 4px 0 10px; line-height: 1.5; }
  .members { display: flex; flex-wrap: wrap; gap: 6px; }
  .member { font-size: 12px; font-weight: 700; padding: 4px 9px; border-radius: 999px; background: rgba(255, 238, 215, .07); border: 1px solid var(--line); }
</style>
