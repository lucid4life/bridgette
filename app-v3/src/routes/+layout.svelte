<script lang="ts">
  import '../app.css';
  // Self-hosted Oswald (offline-safe; precached by the SW) — the brand display face.
  // Import ONLY the Latin subsets we use (drops cyrillic/cyrillic-ext/greek/vietnamese,
  // which the SW would otherwise precache despite the browser never fetching them).
  // latin-ext is required: the menu carries Löss / Grüner / Dürkheimer / Niederösterreich.
  // 300 + 700 are the two weights the brand site loads (light display titles / bold emphasis).
  import '@fontsource/oswald/latin-300.css';
  import '@fontsource/oswald/latin-ext-300.css';
  import '@fontsource/oswald/latin-400.css';
  import '@fontsource/oswald/latin-ext-400.css';
  import '@fontsource/oswald/latin-500.css';
  import '@fontsource/oswald/latin-ext-500.css';
  import '@fontsource/oswald/latin-600.css';
  import '@fontsource/oswald/latin-ext-600.css';
  import '@fontsource/oswald/latin-700.css';
  import '@fontsource/oswald/latin-ext-700.css';
  // Self-hosted Hanken Grotesk (offline-safe; precached by the SW) — the warm body face.
  // latin + latin-ext at the three weights the body uses (400/500/700); latin-ext carries
  // the accented wine names (Löss / Grüner / Dürkheimer / Niederösterreich).
  import '@fontsource/hanken-grotesk/latin-400.css';
  import '@fontsource/hanken-grotesk/latin-ext-400.css';
  import '@fontsource/hanken-grotesk/latin-500.css';
  import '@fontsource/hanken-grotesk/latin-ext-500.css';
  import '@fontsource/hanken-grotesk/latin-700.css';
  import '@fontsource/hanken-grotesk/latin-ext-700.css';

  let { children } = $props();
</script>

{@render children()}
