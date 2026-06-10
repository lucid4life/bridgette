// Dynamic deep-dive route: MUST NOT be prerendered — adapter-static can't enumerate
// [id] at build time; the SPA fallback (index.html) serves it client-side on Vercel.
import type { PageLoad } from './$types';

export const prerender = false;
export const ssr = false;

export const load: PageLoad = ({ params }) => ({ id: params.id });
