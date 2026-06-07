import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('../app.css', import.meta.url)), 'utf8');

describe('design tokens (visual contract)', () => {
  const required = [
    '--cream', '--ink-3', '--orange', '--accent-dark', '--label-light',
    '--gold', '--blue', '--green', '--muted', '--muted-paper', '--font-display',
    '--radius-card', '--radius-flash', '--shadow-flash', '--bp-tablet', '--bp-mobile'
  ];
  it.each(required)('defines %s', (tok) => {
    expect(css).toContain(tok + ':');
  });
  it('keeps the contrast-safe accent value', () => {
    expect(css).toMatch(/--accent-dark:\s*#a83212/);
  });
  it('preserves the flashcard focus-outline fix (accent-dark on the light face)', () => {
    // v1 used `.section.dark .flashcard-face`; v2 scopes by `.flashcard-face` directly.
    // The contrast guarantee (dark accent outline on the cream face) is what matters.
    expect(css).toMatch(/\.flashcard-face :focus-visible\s*\{\s*outline-color:\s*var\(--accent-dark\)/);
  });

  // --- contrast regression guards (audited 2026-06-07; see chapter "Contrast audit + fixes") ---
  it('buttons inherit their surface colour (UA default is dark text)', () => {
    expect(css).toMatch(/button\s*\{[^}]*color:\s*inherit/);
  });
  it('ghost buttons flip to dark ink on light surfaces (no cream-on-cream)', () => {
    expect(css).toContain('.flash .btn.ghost');
    expect(css).toMatch(/\.flash \.btn\.ghost[^{]*,[\s\S]*?\{\s*color:\s*var\(--ink\)/);
  });
  it('chips and pills have light-surface variants', () => {
    expect(css).toContain('.flash .chip');
    expect(css).toContain('.card.light .pill');
  });
  it('the active filter chip uses the contrast-safe accent (not raw orange)', () => {
    expect(css).toMatch(/\.chip\[aria-pressed="true"\]\s*\{\s*background:\s*var\(--accent-dark\)/);
  });
});
