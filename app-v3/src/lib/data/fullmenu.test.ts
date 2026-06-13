// loadFullMenu — the module-scoped promise cache, the null-on-failure retry, and
// the shape validation. Each test imports a FRESH module (reset cache) and stubs
// global fetch so the loader's contract is verified without the network.
import { afterEach, describe, expect, it, vi } from 'vitest';

const okMenu = { bottles: [{ id: 'a' }], beers: [], fortifieds: [] };

async function freshLoader() {
  vi.resetModules(); // clears the module-scoped cache between tests
  return (await import('./fullmenu')).loadFullMenu;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadFullMenu', () => {
  it('fetches /fullmenu.json once and reuses the cached result', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(okMenu) });
    vi.stubGlobal('fetch', fetchMock);
    const loadFullMenu = await freshLoader();
    const a = await loadFullMenu();
    const b = await loadFullMenu();
    expect(a).toBe(b); // same cached promise result
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/fullmenu.json');
  });

  it('rejects a non-ok response and nulls the cache so the next call retries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(okMenu) });
    vi.stubGlobal('fetch', fetchMock);
    const loadFullMenu = await freshLoader();
    await expect(loadFullMenu()).rejects.toThrow(/HTTP 500/);
    await expect(loadFullMenu()).resolves.toMatchObject({ bottles: [{ id: 'a' }] }); // retried
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects a malformed asset (missing arrays) instead of returning a bad object', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ wrong: 1 }) });
    vi.stubGlobal('fetch', fetchMock);
    const loadFullMenu = await freshLoader();
    await expect(loadFullMenu()).rejects.toThrow(/malformed/);
  });
});
