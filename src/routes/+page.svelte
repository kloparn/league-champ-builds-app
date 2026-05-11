<script lang="ts">
  import HeroCard from '$lib/components/HeroCard.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import { displayName } from '$lib/utils';
  import type { ChampionRole } from '$lib/types';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let query = $state('');
  let role = $state<ChampionRole | ''>('');

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return data.champions.filter((c) => {
      if (role && !c.tags.includes(role)) return false;
      if (!q) return true;
      return (
        displayName(c.id, c.name).toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q)
      );
    });
  });
</script>

<svelte:head>
  <title>League of Legends Champions, Builds & Win Rates — Patch {data.version}</title>
  <meta
    name="description"
    content="All {data.champions.length} League of Legends champions with up-to-date builds, runes, items, abilities, stats, and win rates on patch {data.version}. Search by name and filter by role."
  />
  <meta name="keywords" content="League of Legends, LoL, champions, builds, runes, items, win rates, patch {data.version}, Data Dragon" />
  <meta property="og:title" content="League of Legends Champions, Builds & Win Rates — Patch {data.version}" />
  <meta property="og:description" content="All {data.champions.length} LoL champions with builds, runes, items, and win rates on patch {data.version}." />
</svelte:head>

<section class="px-4 py-6 md:px-8">
  <div class="mx-auto max-w-6xl">
    <div class="mb-6 flex flex-col gap-2 text-center">
      <p class="font-display text-xs uppercase tracking-[0.4em] text-hex-cyan">
        Patch {data.version}
      </p>
      <h1 class="font-display text-3xl uppercase tracking-widest text-hex-goldHi md:text-5xl">
        Champions of the Rift
      </h1>
      <p class="mx-auto max-w-2xl text-sm text-hex-mist">
        {data.champions.length} champions, always live from Riot's Data Dragon. Search by name or
        filter by role.
      </p>
    </div>

    <SearchBar bind:query bind:role count={filtered.length} />

    {#if filtered.length === 0}
      <p class="py-16 text-center text-hex-mist">No champions match your search.</p>
    {:else}
      <ul
        class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      >
        {#each filtered as champion (champion.id)}
          <li class="animate-slide-up">
            <HeroCard {champion} />
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</section>
