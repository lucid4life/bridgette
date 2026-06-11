import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // SPA: prerender the shell + emit an index.html fallback so client-side
    // routing works on any path. ssr is disabled in src/routes/+layout.ts.
    adapter: adapter({ fallback: 'index.html', strict: false }),
    alias: { $lib: 'src/lib' }
  }
};
export default config;
