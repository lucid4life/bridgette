<script lang="ts">
  // Foundation: the layout only imports the design tokens. Screens/shell come in Phase 3.
  import '../app.css';
  let { children } = $props();
</script>

{@render children()}
