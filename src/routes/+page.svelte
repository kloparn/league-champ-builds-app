<script lang="ts">
  import HeroCard from '$lib/components/HeroCard.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import { displayName } from '$lib/utils';
  import { SITE_NAME, SITE_URL } from '$lib/site';
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

  const websiteJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Up-to-date League of Legends champion stats, builds, runes, abilities and lore.'
  });
</script>

<svelte:head>
  <title>{SITE_NAME} — All Champions (Patch {data.version})</title>
  <meta
    name="description"
    content="Browse every League of Legends champion. Up-to-date stats, abilities, and lore on patch {data.version}. Filter by role and search by name."
  />
  <meta property="og:title" content="{SITE_NAME} — All Champions" />
  <meta property="og:description" content="Browse every League of Legends champion on patch {data.version}." />
  <meta property="twitter:title" content="{SITE_NAME} — All Champions" />
  <meta property="twitter:description" content="Browse every League of Legends champion on patch {data.version}." />
  {@html `<script type="application/ld+json">${websiteJsonLd}</script>`}
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
