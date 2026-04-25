<script lang="ts">
  import type { ChampionSummary } from '$lib/types';
  import { displayName } from '$lib/utils';
  import { loadingArt } from '$lib/ddragon';

  interface Props {
    champion: ChampionSummary;
  }

  let { champion }: Props = $props();
  const name = $derived(displayName(champion.id, champion.name));
</script>

<a
  href="/champion/{champion.id}"
  class="group relative block overflow-hidden rounded-md border border-hex-border bg-hex-shadow transition-all duration-300 hover:-translate-y-1 hover:border-hex-gold/80 hover:shadow-hexHover"
  aria-label="View {name}"
>
  <div class="relative aspect-[3/5] overflow-hidden">
    <img
      src={loadingArt(champion.id)}
      alt="{name} splash art"
      loading="lazy"
      decoding="async"
      class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-gradient-to-t from-hex-void via-hex-void/40 to-transparent"
    ></div>
  </div>

  <div class="absolute inset-x-0 bottom-0 p-3">
    <p class="font-display text-base font-semibold uppercase tracking-wider text-hex-goldHi">
      {name}
    </p>
    <p class="truncate text-xs italic text-hex-mist">{champion.title}</p>
    <div class="mt-2 flex flex-wrap gap-1">
      {#each champion.tags as tag (tag)}
        <span
          class="rounded-sm border border-hex-gold/40 bg-hex-void/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-hex-gold"
        >
          {tag}
        </span>
      {/each}
    </div>
  </div>
</a>
