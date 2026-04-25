<script lang="ts">
  import type { ChampionSkin } from '$lib/types';
  import { splashArt } from '$lib/ddragon';

  interface Props {
    championId: string;
    championName: string;
    skins: ChampionSkin[];
  }

  let { championId, championName, skins }: Props = $props();

  let index = $state(0);
  const current = $derived(skins[index] ?? skins[0]);
  const currentSrc = $derived(splashArt(championId, current.num));

  let loadedSrc = $state('');
  const loading = $derived(loadedSrc !== currentSrc);

  function onImgLoad(event: Event) {
    loadedSrc = (event.currentTarget as HTMLImageElement).currentSrc;
  }

  function next() {
    index = (index + 1) % skins.length;
  }
  function prev() {
    index = (index - 1 + skins.length) % skins.length;
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') next();
    if (event.key === 'ArrowLeft') prev();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="hex-frame relative aspect-[1215/717] overflow-hidden rounded-md">
  <img
    src={currentSrc}
    alt="{championName} — {current.name === 'default' ? 'Classic' : current.name}"
    class="absolute inset-0 block h-full w-full object-cover transition-opacity duration-300"
    class:opacity-0={loading}
    class:opacity-100={!loading}
    loading="eager"
    decoding="async"
    onload={onImgLoad}
  />

  {#if loading}
    <div
      class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-hex-shadow via-hex-deep to-hex-void"
      aria-hidden="true"
    >
      <div class="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-hex-border/30 to-transparent"></div>
      <svg
        class="relative h-10 w-10 animate-spin text-hex-gold"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      </svg>
    </div>
    <span class="sr-only" role="status">Loading {current.name === 'default' ? 'Classic' : current.name} splash art</span>
  {/if}

  <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-hex-void/90 via-transparent to-transparent"></div>

  <div class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4">
    <button
      type="button"
      onclick={prev}
      class="hex-button pointer-events-auto !px-3 !py-1.5"
      aria-label="Previous skin"
    >
      ‹
    </button>
    <p class="pointer-events-auto rounded-sm border border-hex-border bg-hex-void/80 px-3 py-1.5 text-center font-display text-sm uppercase tracking-wider text-hex-goldHi backdrop-blur-sm">
      {current.name === 'default' ? 'Classic' : current.name}
      <span class="ml-2 text-xs text-hex-mist">
        {index + 1} / {skins.length}
      </span>
    </p>
    <button
      type="button"
      onclick={next}
      class="hex-button pointer-events-auto !px-3 !py-1.5"
      aria-label="Next skin"
    >
      ›
    </button>
  </div>
</div>
