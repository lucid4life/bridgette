<script lang="ts">
  // A "say it right" chip: the fancy word + its respelling, tap to hear the
  // clip (/audio/terms/<slug>.mp3 — Sarah, the wine-list voice). Falls back to
  // Web Speech with the respelling if the clip can't play (offline-miss etc.).
  import type { PronTerm } from '$lib/journey/pronunciation';

  let { term }: { term: PronTerm } = $props();
  let playing = $state(false);

  function speakFallback(): void {
    try {
      const u = new SpeechSynthesisUtterance(term.respell.toLowerCase().replace(/-/g, ' '));
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    } catch {
      /* no speech available — the respelling text still shows */
    }
  }

  function play(): void {
    try {
      const el = new Audio(`/audio/terms/${term.slug}.mp3`);
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
  class="term"
  aria-pressed={playing}
  aria-label={`Pronounce ${term.term} — ${term.respell}`}
  onclick={play}
>
  <span class="t-word">{term.term}</span>
  <span class="t-say">{term.respell}</span>
  <span class="t-ico" aria-hidden="true">🔊</span>
</button>

<style>
  .term {
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
  .term:hover {
    background: var(--surface-hover);
  }
  .term[aria-pressed='true'] {
    border-color: var(--highlight);
    background: color-mix(in srgb, var(--highlight) 14%, transparent);
  }
  .t-word {
    font-weight: 700;
  }
  .t-say {
    color: var(--text-muted);
    font-size: 11.5px;
  }
  .t-ico {
    font-size: 12px;
  }
</style>
