<script lang="ts">
  // Reachable progress backup (spec §9). The Export/Import UI used to live only on the
  // now-orphaned /progress page (reachable only after a session) — a real data-loss path
  // for a localStorage-only PWA. This card surfaces it on Today where stats already live.
  import { progressStore } from '$lib/state/progress.svelte';

  let ioStatus = $state('');
  let fileInput: HTMLInputElement;

  function doExport() {
    try {
      const blob = new Blob([progressStore.exportJson()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bridgette-progress.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      ioStatus = 'Progress exported to bridgette-progress.json.';
    } catch {
      ioStatus = 'Export not available in this browser.';
    }
  }

  function onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      ioStatus = progressStore.importJson(String(r.result))
        ? 'Progress imported and merged.'
        : 'Import failed — not valid progress JSON.';
    };
    r.onerror = () => { ioStatus = "Import failed — couldn't read that file."; };
    r.readAsText(f);
    (e.target as HTMLInputElement).value = '';
  }
</script>

<div class="card">
  <h3>Backup your progress</h3>
  <p class="meta">Your study history lives in this browser only. Export a copy so you never lose it — and to move it between your laptop, phone, and tablet.</p>
  <div class="gradebar" style="justify-content:flex-start;margin-top:12px">
    <button class="btn ghost" type="button" onclick={doExport}>Export</button>
    <button class="btn ghost" type="button" onclick={() => fileInput.click()}>Import</button>
    <input bind:this={fileInput} type="file" accept="application/json,.json" onchange={onFile} hidden />
  </div>
  <p class="meta" aria-live="polite" style="margin-top:8px">{ioStatus}</p>
</div>
