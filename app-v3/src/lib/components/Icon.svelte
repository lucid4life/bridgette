<script lang="ts">
  // Small inline-SVG icon set replacing the last functional emoji (🔊 speaker, 🐢 slow,
  // 🔒 lock). Matches the nav/.tile-ico convention: 24-grid, fill=none, stroke=currentColor,
  // aria-hidden (every caller carries its own visible text or aria-label).
  // 'check' + 'flag' added for the Path's unit nodes (complete tick, shift-check pennant).
  type IconName = 'speaker' | 'slow' | 'lock' | 'check' | 'flag';
  let { name, size = 18 }: { name: IconName; size?: number } = $props();

  const ICONS: Record<IconName, string[]> = {
    speaker: ['M3 9.5v5h3.8L11 18.5v-13L6.8 9.5z', 'M15 9.5a4 4 0 010 5', 'M17.6 7a8 8 0 010 10'],
    slow: ['M3.5 15a5.5 4 0 0 1 11 0', 'M3.5 15h11', 'M14.5 13.4c1-.2 1.7.2 2.8.2', 'M6 15.2v1.8', 'M9 16v2', 'M12.5 15.2v1.8', 'M7.5 11.6v3', 'M11 11.6v3'],
    lock: ['M6 11h12v9H6z', 'M9 11V8a3 3 0 0 1 6 0v3'],
    check: ['M5 12.5l4.5 4.5L19 7.5'],
    flag: ['M6 21V4', 'M6 4.5h11.5l-3 4 3 4H6']
  };
</script>

<svg class="bb-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#each ICONS[name] as d}<path {d} />{/each}
</svg>

<style>
  .bb-icon { display: inline-block; vertical-align: -3px; flex: none; }
</style>
