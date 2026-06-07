// app/src/lib/audio/playPronunciation.ts — MP3 → Web-Speech → (respelling shown by UI).
// Ported from src/audio.js; the clip source is now a static asset, not a base64 map.
// The on-screen respelling remains the visible source of truth regardless of audio.

let currentAudio: HTMLAudioElement | null = null;

export function audioUrl(wineId: string): string {
  return `/audio/${wineId}.mp3`;
}

/**
 * Play the pronunciation clip for a wine; fall back to Web Speech (with `lang`)
 * if the clip is missing, errors, or is blocked by autoplay policy. Stops any
 * prior clip/speech so rapid taps never overlap.
 */
export function playPronunciation(wineId: string, fallbackText: string, lang?: string): void {
  if (typeof window === 'undefined') return;

  const speak = (): void => {
    if (
      typeof window.speechSynthesis === 'undefined' ||
      typeof window.SpeechSynthesisUtterance === 'undefined' ||
      !fallbackText
    ) {
      return;
    }
    const u = new window.SpeechSynthesisUtterance(fallbackText);
    if (lang) u.lang = lang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  // Stop anything already playing/speaking.
  if (window.speechSynthesis?.cancel) window.speechSynthesis.cancel();
  if (currentAudio) {
    try { currentAudio.pause(); } catch { /* noop */ }
    currentAudio = null;
  }

  if (!wineId) { speak(); return; }

  try {
    const a = new Audio(audioUrl(wineId));
    currentAudio = a;
    let settled = false; // once the clip starts, a later error must NOT speak over it
    a.addEventListener('error', () => { if (!settled) { settled = true; speak(); } });
    const p = a.play();
    if (p && typeof p.then === 'function') {
      p.then(
        () => { settled = true; },
        () => { if (!settled) { settled = true; speak(); } }
      );
    }
  } catch {
    speak();
  }
}
