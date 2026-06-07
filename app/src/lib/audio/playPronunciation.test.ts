import { describe, it, expect, beforeEach, vi } from 'vitest';

type Calls = { audio: string[]; speak: any[]; cancel: number; paused: number };
let calls: Calls;

function install(opts: { rejectPlay?: boolean } = {}) {
  calls = { audio: [], speak: [], cancel: 0, paused: 0 };
  class FakeAudio {
    src: string;
    private listeners: Record<string, () => void> = {};
    constructor(src: string) { this.src = src; calls.audio.push(src); }
    addEventListener(ev: string, cb: () => void) { this.listeners[ev] = cb; }
    pause() { calls.paused++; }
    play() { return opts.rejectPlay ? Promise.reject(new Error('blocked')) : Promise.resolve(); }
  }
  class FakeUtter { text: string; lang = ''; constructor(t: string) { this.text = t; } }
  (globalThis as any).window = globalThis;
  (globalThis as any).Audio = FakeAudio;
  (globalThis as any).SpeechSynthesisUtterance = FakeUtter;
  (globalThis as any).speechSynthesis = {
    cancel() { calls.cancel++; },
    speak(u: any) { calls.speak.push(u); }
  };
}

describe('playPronunciation fallback chain', () => {
  beforeEach(() => { vi.resetModules(); });

  it('points at the static asset URL', async () => {
    install();
    const { audioUrl } = await import('./playPronunciation');
    expect(audioUrl('hiedler-loss')).toBe('/audio/hiedler-loss.mp3');
  });

  it('plays the MP3 via Audio (not Web Speech) on the happy path', async () => {
    install();
    const { playPronunciation } = await import('./playPronunciation');
    playPronunciation('hiedler-loss', 'Hiedler Loess', 'de-AT');
    expect(calls.audio.length).toBe(1);
    expect(calls.audio[0]).toBe('/audio/hiedler-loss.mp3');
    expect(calls.speak.length).toBe(0);
  });

  it('falls back to Web Speech with lang when play() is blocked', async () => {
    install({ rejectPlay: true });
    const { playPronunciation } = await import('./playPronunciation');
    playPronunciation('hiedler-loss', 'Hiedler Loess', 'de-AT');
    await new Promise((r) => setTimeout(r, 10));
    expect(calls.audio.length).toBe(1);
    expect(calls.speak.length).toBe(1);
    expect(calls.speak[0].text).toBe('Hiedler Loess');
    expect(calls.speak[0].lang).toBe('de-AT');
  });

  it('falls back to Web Speech with no wineId', async () => {
    install();
    const { playPronunciation } = await import('./playPronunciation');
    playPronunciation('', 'Spoken Name', 'en-US');
    expect(calls.audio.length).toBe(0);
    expect(calls.speak.length).toBe(1);
  });
});
