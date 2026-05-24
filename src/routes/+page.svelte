<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import HeroCard from '$lib/components/HeroCard.svelte';
  import ChampionListHeader from '$lib/components/ChampionListHeader.svelte';
  import ChampionListRow from '$lib/components/ChampionListRow.svelte';
  import SearchBar, { type SortKey } from '$lib/components/SearchBar.svelte';
  import { displayName } from '$lib/utils';
  import { difficultyBucket, type DifficultyBucket, type Lane } from '$lib/types';
  import { viewMode, rankHint, dismissRankHint } from '$lib/view-mode.svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let query = $state('');
  let lane = $state<Lane | ''>('');
  let difficulty = $state<DifficultyBucket | ''>('');
  let sort = $state<SortKey>('name');
  let sortDir = $state<'asc' | 'desc'>('asc');

  function setSort(next: SortKey): void {
    if (next === sort) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sort = next;
      // Sensible default: alphabetical asc, everything else desc (best first).
      sortDir = next === 'name' ? 'asc' : 'desc';
    }
  }

  function resetSort(): void {
    sort = 'name';
    sortDir = 'asc';
  }

  function statsFor(id: string) {
    const summary = data.championSummary[id];
    if (!summary) return null;
    const targetLane = lane || summary.topLane;
    if (!targetLane) return null;
    return summary.byLane[targetLane] ?? null;
  }

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    const matched = data.champions.filter((c) => {
      if (lane) {
        const lanes = data.championLanes[c.id];
        if (!lanes || !lanes.includes(lane)) return false;
      }
      if (difficulty && difficultyBucket(c.info.difficulty) !== difficulty) return false;
      if (!q) return true;
      return (
        displayName(c.id, c.name).toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q)
      );
    });

    const dirMul = sortDir === 'asc' ? 1 : -1;

    if (sort === 'name') {
      // Names are unique and always present — straightforward locale-compare.
      return [...matched].sort(
        (a, b) =>
          dirMul * displayName(a.id, a.name).localeCompare(displayName(b.id, b.name))
      );
    }

    // For score/winrate/games: champions with no stats always sink to the bottom,
    // regardless of direction. Otherwise we'd push them to the top on asc, which
    // is misleading ("zero games" doesn't mean "lowest games played").
    return [...matched].sort((a, b) => {
      const sa = statsFor(a.id);
      const sb = statsFor(b.id);
      if (!sa && !sb) return displayName(a.id, a.name).localeCompare(displayName(b.id, b.name));
      if (!sa) return 1;
      if (!sb) return -1;
      let diff = 0;
      if (sort === 'score') diff = sa.score - sb.score;
      else if (sort === 'winrate') diff = sa.winrate - sb.winrate;
      else diff = sa.games - sb.games; // 'games'
      return dirMul * diff;
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
        {data.champions.length} champions, always live from Riot's Data Dragon. Filter by role or
        skill level, or sort by Hex Score to find what fits.
      </p>
    </div>

    <SearchBar bind:query bind:lane bind:difficulty bind:sort bind:sortDir count={filtered.length} />

    {#if filtered.length === 0}
      <p class="py-16 text-center text-hex-mist">No champions match your search.</p>
    {:else if viewMode.value === 'list'}
      {#if !rankHint.seen}
        <div
          role="note"
          aria-label="Tip: click rank to filter"
          transition:fly={{ y: -6, duration: 220, easing: cubicOut }}
          class="relative mb-3 inline-flex w-full max-w-md items-start gap-3 rounded-md border border-hex-cyan/40 bg-hex-panel/95 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur sm:ml-4"
        >
          <span
            class="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 border-b border-r border-hex-cyan/40 bg-hex-panel/95"
            aria-hidden="true"
          ></span>
          <span aria-hidden="true" class="mt-0.5 text-hex-cyan">▸</span>
          <div class="min-w-0 flex-1 pr-6">
            <p class="font-display text-xs uppercase tracking-widest text-hex-cyan">
              Click any rank
            </p>
            <p class="mt-1 text-[11px] leading-relaxed text-hex-parchment/90">
              The number filters the list to that champion's role. Try it on a row.
            </p>
          </div>
          <button
            type="button"
            onclick={dismissRankHint}
            aria-label="Dismiss tip"
            class="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-sm text-hex-mist transition-colors duration-100 hover:bg-hex-shadow/70 hover:text-hex-goldHi focus:outline-none focus-visible:ring-2 focus-visible:ring-hex-cyan/60"
          >
            ✕
          </button>
        </div>
      {/if}

      <div class="overflow-hidden rounded-md border border-hex-border shadow-hex">
        <ChampionListHeader {sort} {sortDir} onSort={setSort} onReset={resetSort} />
        <ul>
          {#each filtered as champion (champion.id)}
            <li class="animate-slide-up">
              <ChampionListRow
                {champion}
                version={data.version}
                summary={data.championSummary[champion.id]}
                {lane}
                patch={data.version}
                onSelectLane={(l) => {
                  lane = l;
                  dismissRankHint();
                }}
              />
            </li>
          {/each}
        </ul>
      </div>
    {:else}
      <ul
        class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      >
        {#each filtered as champion (champion.id)}
          <li class="animate-slide-up">
            <HeroCard {champion} {lane} />
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</section>
