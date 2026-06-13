<script lang="ts">
  // A wine "say it right" chip: the pour name + its respelling, tap to hear the
  // clip (/audio/<wineId>.mp3 — Sarah, the wine-list voice). Falls back to Web
  // Speech with the respelling if the clip can't play (offline-miss etc.). Same
  // mechanic as TermSay, but keyed to the wine-clip path rather than terms/.
  let {
    name,
    respell,
    audioId,
    say
  }: { name: string; respell: string; audioId: string; say?: string } = $props();
  let playing = $state(false);

  function speakFallback(): void {
    try {
      const u = new SpeechSynthesisUtterance((say || respell).toLowerCase().replace(/-/g, ' '));
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    } catch {
      /* no speech available — the respelling text still shows */
    }
  }

  function play(): void {
    try {
      const el = new Audio(`/audio/${audioId}.mp3`);
      playing = true;
      el.onended = () => (playing = false);
      el.onerror = () => {
        playing = false;
        speakFallback();
      };
      void el.play().catch(() => {
        playing = false;
        speakFallback();
      });
    } catch {
      playing = false;
      speakFallback();
    }
  }
</script>

<button
  type="button"
  class="wsay"
  aria-pressed={playing}
  aria-label={`Pronounce ${name} — ${respell}`}
  onclick={play}
>
  <span class="w-say">{respell}</span>
  <span class="w-ico" aria-hidden="true">🔊</span>
</button>

<style>
  .wsay {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 11px;
    border: 1px solid var(--line);
    border-radius: var(--radius-chip);
    background: var(--surface-card);
    color: var(--text-body);
    font-size: 12.5px;
    min-height: 34px;
  }
  .wsay:hover {
    background: var(--surface-hover);
  }
  .wsay[aria-pressed='true'] {
    border-color: var(--info);
    background: color-mix(in srgb, var(--info) 14%, transparent);
  }
  .w-say {
    color: var(--text-muted);
  }
  .w-ico {
    font-size: 12px;
  }
</style>
