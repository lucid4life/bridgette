import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('../app.css', import.meta.url)), 'utf8');

describe('design tokens (visual contract)', () => {
  // The semantic layer is the contract: components consume ONLY these.
  const semantic = [
    '--surface-canvas', '--surface-card', '--surface-raised', '--surface-paper',
    '--surface-hover', '--surface-track', '--text-strong', '--text-body',
    '--text-muted', '--accent', '--accent-ink', '--highlight', '--highlight-ink',
    '--ok', '--info', '--line', '--focus-ring',
    '--font-display', '--radius-card', '--radius-flash',
    '--shadow-1', '--shadow-2', '--shadow-3', '--shadow-flash',
    '--bp-tablet', '--bp-mobile'
  ];
  it.each(semantic)('defines %s', (tok) => {
    expect(css).toContain(tok + ':');
  });

  it('keeps the contrast-safe accent value', () => {
    expect(css).toMatch(/--accent-dark:\s*#a83212/);
    expect(css).toMatch(/--accent:\s*var\(--accent-dark\)/);
  });

  it('the paper scope flips the focus ring to the contrast-safe accent (v1 flashcard fix)', () => {
    // v1 used `.section.dark .flashcard-face`; v2 scopes by tokens: the cream
    // surfaces (.flash et al) re-map --focus-ring to the dark accent.
    const scope = css.match(/\.on-cream,\s*\.card\.light,\s*\.flash,\s*table\.matrix\s*\{[\s\S]*?\n\}/);
    expect(scope).not.toBeNull();
    expect(scope![0]).toMatch(/--focus-ring:\s*var\(--accent-dark\)/);
    expect(css).toMatch(/:focus-visible\s*\{\s*outline:\s*3px solid var\(--focus-ring\)/);
  });

  // --- contrast regression guards (audited 2026-06-07; see chapter "Contrast audit + fixes") ---
  it('buttons inherit their surface colour (UA default is dark text)', () => {
    expect(css).toMatch(/button\s*\{[^}]*color:\s*inherit/);
  });
  it('the paper scope remaps text/line/ghost tokens (no cream-on-cream ghosts)', () => {
    const scope = css.match(/\.on-cream,\s*\.card\.light,\s*\.flash,\s*table\.matrix\s*\{[\s\S]*?\n\}/)![0];
    expect(scope).toMatch(/--text-body:\s*var\(--ink\)/);
    expect(scope).toMatch(/--text-muted:\s*var\(--muted-paper\)/);
    expect(scope).toMatch(/--line:\s*var\(--line-dark\)/);
    expect(scope).toMatch(/--ghost-bg:/);
    expect(scope).toMatch(/--pill-tone:\s*var\(--accent\)/);
  });
  it('ghost buttons consume the scoped tokens', () => {
    expect(css).toMatch(/\.btn\.ghost\s*\{\s*background:\s*var\(--ghost-bg, transparent\);[^}]*color:\s*var\(--text-body\)/);
  });
  it('the active filter chip uses the contrast-safe accent (not raw orange)', () => {
    expect(css).toMatch(/\.chip\[aria-pressed="true"\]\s*\{\s*background:\s*var\(--accent\)/);
  });
});
