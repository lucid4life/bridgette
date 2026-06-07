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
  it('preserves the v1 flashcard focus-outline fix', () => {
    expect(css).toContain('.section.dark .flashcard-face :focus-visible');
  });
});
