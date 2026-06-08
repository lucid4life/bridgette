// app/src/lib/data/fullmenu.ts — typed wrapper for the Reference-only full-menu data
// (bottles / beers / fortifieds). Code-split off the shared `data` chunk (PERF-03): only
// the Reference route imports this, so every other route stays ~100 KB lighter.
// fullmenu.data.js is generated from src/data-fullmenu.json by tools/build_app_data.mjs.
import { bottles as rawBottles, beers as rawBeers, fortifieds as rawFortifieds } from './fullmenu.data.js';
import type { Bottle, Beer, Fortified } from './types';

export const bottles = rawBottles as unknown as Bottle[];
export const beers = rawBeers as unknown as Beer[];
export const fortifieds = rawFortifieds as unknown as Fortified[];
