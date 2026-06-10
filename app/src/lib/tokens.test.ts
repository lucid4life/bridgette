import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('../app.css', import.meta.url)), 'utf8');

/* ------------------------------------------------------------------ helpers
   A tiny token resolver + WCAG 2.x contrast math (no deps). It understands the
   three value forms app.css uses: #rrggbb, rgba(r, g, b, a) and
   color-mix(in srgb, var(--x) N%, transparent). */

type RGBA = { r: number; g: number; b: number; a: number };
type Vars = Record<string, string>;

function block(selectorRe: RegExp): Vars {
  const m = css.match(selectorRe);
  if (!m) throw new Error(`block not found: ${selectorRe}`);
  const out: Vars = {};
  for (const line of m[1].split('\n')) {
    const d = line.match(/^\s*--([\w-]+):\s*(.+?);\s*(\/\*.*)?$/);
    if (d) out[`--${d[1]}`] = d[2].trim();
  }
  return out;
}

const root = block(/:root\s*\{([\s\S]*?)\n\}/);
const darkBlock = block(/html\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/);
const autoDarkBlock = block(/@media \(prefers-color-scheme: dark\)\s*\{\s*html:not\(\[data-theme\]\)\s*\{([\s\S]*?)\n {2}\}/);
const paper = block(/\.on-cream,\s*\.card\.light,\s*\.flash,\s*table\.matrix\s*\{([\s\S]*?)\n\}/);

function lookup(name: string, chain: Vars[]): string {
  for (const scope of chain) if (name in scope) return scope[name];
  throw new Error(`token not defined: ${name}`);
}

function resolve(value: string, chain: Vars[]): RGBA {
  value = value.trim();
  const v = value.match(/^var\((--[\w-]+)\)$/);
  if (v) return resolve(lookup(v[1], chain), chain);
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const rgba = value.match(/^rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*(\.?[\d.]+)\s*\)$/);
  if (rgba) return { r: +rgba[1], g: +rgba[2], b: +rgba[3], a: parseFloat(rgba[4]) };
  const mix = value.match(/^color-mix\(in srgb,\s*(var\(--[\w-]+\)|#[0-9a-f]{6})\s+([\d.]+)%,\s*transparent\)$/i);
  if (mix) {
    const c = resolve(mix[1], chain);
    return { ...c, a: (c.a * parseFloat(mix[2])) / 100 };
  }
  throw new Error(`unparseable colour: ${value}`);
}

function token(name: string, chain: Vars[]): RGBA {
  return resolve(lookup(name, chain), chain);
}

/** composite a (possibly translucent) fg over an opaque bg */
function over(fg: RGBA, bg: RGBA): RGBA {
  const a = fg.a;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1
  };
}

function luminance(c: RGBA): number {
  const lin = (u: number) => {
    const s = u / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

function contrast(fg: RGBA, bg: RGBA): number {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

const LIGHT = [root];
const DARK = [darkBlock, root];

/* ------------------------------------------------------------------ tests */

describe('design tokens (visual contract)', () => {
  const semantic = [
    '--surface-canvas', '--surface-card', '--surface-raised', '--surface-paper',
    '--surface-hover', '--surface-track', '--surface-bar', '--text-strong',
    '--text-body', '--text-muted', '--accent', '--accent-ink', '--accent-text',
    '--highlight', '--highlight-ink', '--highlight-line', '--ok', '--info',
    '--line', '--focus-ring', '--grain', '--font-display', '--radius-card',
    '--radius-flash', '--shadow-1', '--shadow-2', '--shadow-3', '--shadow-flash',
    '--bp-tablet', '--bp-mobile'
  ];
  it.each(semantic)('defines %s', (tok) => {
    expect(css).toContain(tok + ':');
  });

  it('keeps the verified brand bytes (cream, orange) and the proven rust action tone', () => {
    expect(css).toMatch(/--bb-cream:\s*#ffeed6/);
    expect(css).toMatch(/--bb-orange:\s*#f15825/);
    expect(css).toMatch(/--bb-rust:\s*#a83212/);
    expect(css).toMatch(/--bb-coral:\s*#f25c4d/);
  });

  it('retires navy and the unverified gold from all surfaces', () => {
    expect(css).not.toMatch(/#1e384b|#162d3d|#102230|#132b3b/i);
    expect(css).not.toMatch(/#fcb539/i);
    expect(css).not.toMatch(/rgba\(30,\s*56,\s*75/);
    expect(css).not.toMatch(/rgba\(255,\s*238,\s*215/);
  });

  it('light is the default theme (cream canvas) and dark is espresso, never navy', () => {
    expect(lookup('--surface-canvas', LIGHT)).toBe('var(--bb-cream)');
    expect(lookup('--surface-canvas', DARK)).toBe('var(--bb-espresso)');
  });

  it('the explicit dark block and the prefers-color-scheme auto block are identical', () => {
    expect(autoDarkBlock).toEqual(darkBlock);
    expect(css.match(/@media \(prefers-color-scheme: dark\)[\s\S]*?html:not\(\[data-theme\]\)/)).not.toBeNull();
  });

  it('the paper scope keeps the cream menu-card face in both themes', () => {
    expect(paper['--text-body']).toBe('var(--bb-ink)');
    expect(paper['--focus-ring']).toBe('var(--bb-rust)'); // v1 flashcard-face fix, token-routed
    expect(lookup('--surface-paper', DARK)).toBe('var(--bb-cream)');
  });

  // --- structural guards carried from v1/commit-1 ---
  it('buttons inherit their surface colour (UA default is dark text)', () => {
    expect(css).toMatch(/button\s*\{[^}]*color:\s*inherit/);
  });
  it('ghost buttons consume the scoped tokens', () => {
    expect(css).toMatch(/\.btn\.ghost\s*\{\s*background:\s*var\(--ghost-bg, transparent\);[^}]*color:\s*var\(--text-body\)/);
  });
  it('the active filter chip uses the contrast-safe accent (not raw orange)', () => {
    expect(css).toMatch(/\.chip\[aria-pressed="true"\]\s*\{\s*background:\s*var\(--accent\)/);
  });
  it(':focus-visible is token-routed', () => {
    expect(css).toMatch(/:focus-visible\s*\{\s*outline:\s*3px solid var\(--focus-ring\)/);
  });
});

describe.each([
  ['light', LIGHT],
  ['dark', DARK]
] as const)('WCAG contrast — %s theme', (name, theme) => {
  const canvas = token('--surface-canvas', theme);
  const card = over(token('--surface-card', theme), canvas);
  const paperChain = [paper, ...theme];
  const paperFace = token('--surface-paper', theme); // .flash / .card.light bg

  it('body text on canvas >= 4.5', () => {
    expect(contrast(token('--text-body', theme), canvas)).toBeGreaterThanOrEqual(4.5);
  });
  it('muted text on canvas and on cards >= 4.5', () => {
    expect(contrast(token('--text-muted', theme), canvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token('--text-muted', theme), card)).toBeGreaterThanOrEqual(4.5);
  });
  it('button: accent-ink on accent >= 4.5', () => {
    expect(contrast(token('--accent-ink', theme), token('--accent', theme))).toBeGreaterThanOrEqual(4.5);
  });
  it('highlight text (eyebrows, badges, active tab) on canvas and bar >= 4.5', () => {
    expect(contrast(token('--highlight', theme), canvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token('--highlight', theme), token('--surface-bar', theme))).toBeGreaterThanOrEqual(4.5);
  });
  it('btn.gold: highlight-ink on highlight >= 4.5', () => {
    expect(contrast(token('--highlight-ink', theme), token('--highlight', theme))).toBeGreaterThanOrEqual(4.5);
  });
  it('accent-coloured text on canvas (streak, low clock) >= 4.5', () => {
    expect(contrast(token('--accent-text', theme), canvas)).toBeGreaterThanOrEqual(4.5);
  });
  it('focus ring on canvas and on the paper face >= 3', () => {
    expect(contrast(token('--focus-ring', theme), canvas)).toBeGreaterThanOrEqual(3);
    expect(contrast(token('--focus-ring', paperChain), paperFace)).toBeGreaterThanOrEqual(3);
  });
  it('chips: body text on the chip surface >= 4.5', () => {
    expect(contrast(token('--text-body', theme), card)).toBeGreaterThanOrEqual(4.5);
  });
  it('pills: tone text over its own tint wash >= 4.5 (canvas cards + paper faces)', () => {
    const tone = token('--pill-tone', theme);
    const tint = parseFloat(lookup('--pill-tint', theme)) / 100;
    expect(contrast(tone, over({ ...tone, a: tint }, card))).toBeGreaterThanOrEqual(4.5);
    const pTone = token('--pill-tone', paperChain);
    const pTint = parseFloat(lookup('--pill-tint', paperChain)) / 100;
    expect(contrast(pTone, over({ ...pTone, a: pTint }, paperFace))).toBeGreaterThanOrEqual(4.5);
  });
  it('weak-deck pills: strong text over the accent wash >= 4.5', () => {
    const wash = over({ ...token('--accent', theme), a: 0.18 }, canvas);
    expect(contrast(token('--text-strong', theme), wash)).toBeGreaterThanOrEqual(4.5);
  });

  // the always-cream paper faces (flashcard, matrix, light cards) in this theme
  it('paper face: ink text + muted + accent + ok + label all >= 4.5', () => {
    expect(contrast(token('--text-body', paperChain), paperFace)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token('--text-muted', paperChain), paperFace)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token('--accent', paperChain), paperFace)).toBeGreaterThanOrEqual(4.5); // .ans, miss banner
    expect(contrast(token('--ok', paperChain), paperFace)).toBeGreaterThanOrEqual(4.5); // .feedback.ok
    expect(contrast(token('--text-label', paperChain), paperFace)).toBeGreaterThanOrEqual(4.5);
  });
  it('paper face: MC choice (ghost) text over the ghost veil >= 4.5', () => {
    const ghostBg = over(token('--ghost-bg', paperChain), paperFace);
    expect(contrast(token('--text-body', paperChain), ghostBg)).toBeGreaterThanOrEqual(4.5);
  });
  it('paper face: structure-meter active segment vs track >= 3 (non-text)', () => {
    const track = over(token('--surface-track', paperChain), paperFace);
    expect(contrast(token('--accent', paperChain), track)).toBeGreaterThanOrEqual(3);
  });
  it('matrix header: cream on the espresso head >= 4.5', () => {
    expect(contrast(token('--table-head-fg', theme), token('--table-head-bg', theme))).toBeGreaterThanOrEqual(4.5);
  });
});
