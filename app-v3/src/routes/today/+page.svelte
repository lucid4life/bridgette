<script lang="ts">
  // Task H interim — just enough to be honest until the full Today screen
  // (Task I): the live due count → /review, and the pre-shift warm-up door.
  import { progress } from '$lib/store/progress.svelte';

  const due = $derived(progress.ready ? progress.dueItems().length : 0);
  const shaky = $derived(progress.ready ? progress.shakyItems(12).length : 0);
</script>

<svelte:head><title>Today · Bridgette Trainer</title></svelte:head>

<section class="screen">
  <p class="h-eyebrow">keep it warm</p>
  <h1>Today</h1>
  <p class="sub">Two jobs a day: clear the queue, then warm up the shaky calls before your shift.</p>

  <div class="grid cols-2">
    <div class="card">
      <h3>Reviews</h3>
      <p class="meta">
        {#if !progress.ready}
          loading…
        {:else if due > 0}
          {due} {due === 1 ? 'item' : 'items'} due now
        {:else}
          all clear — nothing due
        {/if}
      </p>
      <p class="cta"><a class="btn" href="/review">start reviews</a></p>
    </div>
    <div class="card">
      <h3>Pre-shift warm-up</h3>
      <p class="meta">
        {#if !progress.ready}
          loading…
        {:else if shaky > 0}
          {shaky} shaky {shaky === 1 ? 'call' : 'calls'} to steady — two minutes
        {:else}
          your shakiest calls, two minutes — nothing wobbling yet
        {/if}
      </p>
      <p class="cta"><a class="btn ghost" href="/preshift">warm up</a></p>
    </div>
  </div>

  <p class="note">the full Today screen lands in the next build — reviews and the warm-up are live now.</p>
</section>

<style>
  .cta {
    margin: 14px 0 0;
  }
</style>
