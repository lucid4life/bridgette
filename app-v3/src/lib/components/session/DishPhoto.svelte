<script lang="ts">
  // The dish-photo band — a square 1:1 plate shot with a branded no-photo
  // placeholder. Renders the real <img> only when photoId is in PHOTO_IDS
  // (the id set is DERIVED from static/img/manifest.json), so a missing file
  // never 404s; the onerror fallback still covers a stale manifest entry, and
  // everything without a photo keeps the placeholder. Shared by the teach card
  // and BOTH romance reveals so the plate anchors the dish wherever it's taught
  // or said (§0b dual coding) — one gate, one fade, one placeholder, no drift.
  // Bare (the default) it's a full-bleed band and the parent owns any outer
  // width/radius (TeachCard). Pass `framed` for the contained treatment — a
  // centred, rounded, shadowed 240px plate — used by both romance reveals so
  // that wrapper CSS lives here once. This owns the band, the gate, and the
  // load-in fade. The placeholder is aria-hidden — the only a11y-relevant text
  // is the image's alt (the name).
  import { PHOTO_IDS } from './photos';

  let {
    photoId,
    name,
    framed = false,
    thumb = false
  }: { photoId: string; name: string; framed?: boolean; thumb?: boolean } = $props();

  let imgFailed = $state(false);
  let imgLoaded = $state(false);
  const hasPhoto = $derived(PHOTO_IDS.has(photoId) && !imgFailed);
</script>

<div class="dp" class:framed class:thumb>
  {#if hasPhoto}
    <img
      src="/img/{photoId}.webp"
      alt={name}
      class:show={imgLoaded}
      onload={() => (imgLoaded = true)}
      onerror={() => (imgFailed = true)}
    />
  {/if}
  {#if !hasPhoto || !imgLoaded}
    <div class="dp-noimg" aria-hidden="true">
      <span class="dp-initial">{name.charAt(0)}</span>
      <svg class="dp-cutlery" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 4v4a2 2 0 0 0 4 0V4" />
        <path d="M9 10v10" />
        <path d="M15.5 4c2.6 2.4 2.6 6.6 0 9v7" />
      </svg>
      <span class="dp-noimg-label">photo coming</span>
    </div>
  {/if}
</div>

<style>
  /* Square band: the dish photos are overhead shots of round, centred plates —
     a 1:1 frame shows the whole plate (a 16:9 letterbox sliced it in half).
     The parent controls the outer width/radius. */
  .dp {
    position: relative;
    aspect-ratio: 1 / 1;
    width: 100%;
    background: color-mix(in srgb, var(--bb-ink) 6%, var(--bb-paper));
    overflow: hidden;
  }
  /* the contained "framed" treatment (both romance reveals): a centred, rounded,
     shadowed plate that reinforces the line just said without crowding the pass
     bar. TeachCard omits `framed` and keeps the full-bleed band. */
  .dp.framed {
    width: min(240px, 100%);
    margin: 0 auto;
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-1);
  }
  /* the compact "thumb" treatment — a small centred plate peek above a flash
     card's question, so the dish you'd see at the drop rides along on the prompt
     without crowding the choices/answer below. */
  .dp.thumb {
    width: min(150px, 56%);
    margin: 0 auto;
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-1);
  }
  .dp img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  .dp img.show {
    opacity: 1;
  }
  .dp-noimg {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 2px;
    color: var(--bb-stone);
  }
  .dp-initial {
    font-family: var(--font-display);
    font-size: 56px;
    font-weight: 300;
    line-height: 1;
    color: color-mix(in srgb, var(--bb-ochre) 55%, transparent);
  }
  .dp-cutlery {
    width: 22px;
    height: 22px;
    color: color-mix(in srgb, var(--bb-stone) 70%, transparent);
  }
  .dp-noimg-label {
    font-family: var(--font-display);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    /* solid muted-print token (~6.3:1 on the band): a 75%-opacity wash here read
       3.59:1 — under AA for this 10px bold caption (axe-caught on a no-photo
       reveal; the teach placeholder shared the bug but was never scanned). */
    color: var(--bb-stone);
  }
</style>
