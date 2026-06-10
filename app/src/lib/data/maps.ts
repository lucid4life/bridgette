// app/src/lib/data/maps.ts — verified coordinates for the reasoning-layer visuals
// (region map + body×acidity style map). Derived + adversarially web-verified by the
// v2-reasoning-layer-specs workflow (run wf_46060529-81e, 2026-06-07). 0-100 grids.

export interface Dot {
  id: string;
  x: number;
  y: number;
}

// Stylized Western/Central Europe panel. Relative positions match real geography.
// Canada (blue-mountain-brut) is intentionally OFF-PANEL — shown as a chip.
export const regionMap: {
  viewBox: string;
  countries: { country: string; x: number; y: number }[];
  wineDots: (Dot & { regionLabel: string })[];
  offPanel: { id: string; label: string };
} = {
  viewBox: '0 0 100 100',
  countries: [
    { country: 'Portugal', x: 7, y: 44 },
    { country: 'Spain', x: 20, y: 58 },
    { country: 'France', x: 34, y: 33 },
    { country: 'Germany', x: 51, y: 17 },
    { country: 'Austria', x: 73, y: 23 },
    { country: 'Italy', x: 62, y: 52 }
  ],
  wineDots: [
    { id: 'dona-matilde-branco', x: 9, y: 39, regionLabel: 'Douro, N Portugal' },
    { id: 'vini-be-good-hip-hop-chenin', x: 31, y: 30, regionLabel: 'Loire Valley, France' },
    { id: 'st-john-claret', x: 26, y: 41, regionLabel: 'Bordeaux, SW France' },
    { id: 'ameztoi-rubentis', x: 23, y: 47, regionLabel: 'Getariako Txakolina, Basque coast' },
    { id: 'sindicat-la-figuera', x: 30, y: 54, regionLabel: 'Montsant, Catalonia' },
    { id: 'gallina-de-piel-neverwine', x: 14, y: 63, regionLabel: 'Spain (de-alcoholized)' },
    { id: 'bodega-cerron-remordimiento-blanco', x: 26, y: 69, regionLabel: 'Jumilla, SE Spain' },
    { id: 'bodega-cerron-remordimiento-tinto', x: 29, y: 71, regionLabel: 'Jumilla, SE Spain' },
    { id: 'leitz-eins-zwei-dry-rose', x: 49, y: 14, regionLabel: 'Rheingau, Germany' },
    { id: 'wagner-stempel-weissburgunder', x: 48, y: 17, regionLabel: 'Rheinhessen, Germany' },
    { id: 'darting-durkheimer-fronhof', x: 47, y: 21, regionLabel: 'Pfalz, Germany' },
    { id: 'deinhard-deidesheim', x: 50, y: 22, regionLabel: 'Pfalz (Deidesheim), Germany' },
    { id: 'hiedler-loss', x: 72, y: 21, regionLabel: 'Niederösterreich (Kamptal)' },
    { id: 'ca-del-baio-langhe', x: 55, y: 47, regionLabel: 'Piedmont (Langhe), Italy' },
    { id: 'fattoria-moretto-semprebon', x: 62, y: 49, regionLabel: 'Emilia-Romagna, Italy' },
    { id: 'bindi-sergardi-la-boncia', x: 64, y: 55, regionLabel: 'Chianti, Tuscany' }
  ],
  offPanel: { id: 'blue-mountain-brut', label: 'Okanagan Falls, BC, Canada' }
};

// Body (x: light→full) × Acidity (y: high at top). De-collided; min pairwise 6.4.
export const styleMap: { wines: Dot[] } = {
  wines: [
    { id: 'blue-mountain-brut', x: 50, y: 86 },
    { id: 'fattoria-moretto-semprebon', x: 55, y: 79 },
    { id: 'hiedler-loss', x: 42, y: 82 },
    { id: 'vini-be-good-hip-hop-chenin', x: 44, y: 90 },
    { id: 'wagner-stempel-weissburgunder', x: 44, y: 48 },
    { id: 'darting-durkheimer-fronhof', x: 51, y: 74 },
    { id: 'dona-matilde-branco', x: 52, y: 56 },
    { id: 'bodega-cerron-remordimiento-blanco', x: 58, y: 45 },
    { id: 'ameztoi-rubentis', x: 15, y: 89 },
    { id: 'leitz-eins-zwei-dry-rose', x: 25, y: 80 },
    { id: 'deinhard-deidesheim', x: 43, y: 60 },
    { id: 'ca-del-baio-langhe', x: 64, y: 86 },
    { id: 'sindicat-la-figuera', x: 50, y: 43 },
    { id: 'bindi-sergardi-la-boncia', x: 63, y: 74 },
    { id: 'bodega-cerron-remordimiento-tinto', x: 83, y: 49 },
    { id: 'st-john-claret', x: 60, y: 52 },
    { id: 'gallina-de-piel-neverwine', x: 21, y: 56 }
  ]
};

export const CLIMATE_COLOR: Record<string, string> = {
  cool: '#5fa3bd',
  moderate: '#fcb539', // data encoding (not chrome): dark-panel gold
  warm: '#e0613f'
};

// Distinct, dark-panel-legible family colours (dual-coded with labels, never colour
// alone). Order matches the 5 buckets.
export const FAMILY_COLOR: Record<string, string> = {
  'Bubbles & Rosé': '#fcb539', // data encoding (not chrome): dark-panel gold
  'Bright & Crisp Whites': '#5fa3bd',
  'Round Whites': '#7faa8e',
  'Light Reds': '#f0884f',
  'Structured Reds': '#e0563a'
};
