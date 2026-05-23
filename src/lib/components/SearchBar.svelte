<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { DIFFICULTY_BUCKETS, LANES, type DifficultyBucket, type Lane } from '$lib/types';
  import {
    viewMode,
    setViewMode,
    viewHint,
    dismissViewHint
  } from '$lib/view-mode.svelte';

  export type SortKey = 'name' | 'score' | 'winrate' | 'games';

  interface Props {
    query: string;
    lane: Lane | '';
    difficulty: DifficultyBucket | '';
    sort: SortKey;
    count: number;
  }

  let {
    query = $bindable(),
    lane = $bindable(),
    difficulty = $bindable(),
    sort = $bindable(),
    count
  }: Props = $props();

  const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'name', label: 'Name (A→Z)' },
    { value: 'score', label: 'Hex Score' },
    { value: 'winrate', label: 'Win rate' },
    { value: 'games', label: 'Most played' }
  ];

  // Show the "try detailed view" hint only after the client mounts, only for users
  // who haven't dismissed it, and only while they're still on the splash view.
  let mounted = $state(false);
  $effect(() => {
    const t = setTimeout(() => (mounted = true), 800);
    return () => clearTimeout(t);
  });
  const showHint = $derived(mounted && !viewHint.seen && viewMode.value === 'splash');
</script>

<div
  class="sticky top-0 z-20 -mx-4 mb-6 border-b border-hex-border bg-hex-deep/85 px-4 py-4 backdrop-blur-md md:-mx-8 md:px-8"
>
  <div class="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center">
    <label class="flex flex-1 items-center gap-3">
      <span class="sr-only">Search champion</span>
      <svg
        class="h-5 w-5 shrink-0 text-hex-gold"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        placeholder="Search a champion..."
        bind:value={query}
        class="hex-input"
        aria-label="Search champion by name"
      />
    </label>

    <div class="flex items-center gap-3">
      <label class="flex items-center gap-2">
        <span class="font-display text-xs uppercase tracking-widest text-hex-mist">Role</span>
        <select
          bind:value={lane}
          aria-label="Role filter"
          class="hex-input min-w-[8rem] appearance-none bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat pr-8"
          style="background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22 fill=%22none%22 stroke=%22%23C8AA6E%22 stroke-width=%221.5%22><path d=%22m3 4.5 3 3 3-3%22/></svg>');"
        >
          <option value="">All roles</option>
          {#each LANES as l (l.value)}
            <option value={l.value}>{l.label}</option>
          {/each}
        </select>
      </label>

      <label class="flex items-center gap-2">
        <span class="whitespace-nowrap font-display text-xs uppercase tracking-widest text-hex-mist"
          >Skill level</span
        >
        <select
          bind:value={difficulty}
          aria-label="Skill level filter"
          class="hex-input min-w-[8rem] appearance-none bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat pr-8"
          style="background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22 fill=%22none%22 stroke=%22%23C8AA6E%22 stroke-width=%221.5%22><path d=%22m3 4.5 3 3 3-3%22/></svg>');"
        >
          <option value="">Any level</option>
          {#each DIFFICULTY_BUCKETS as d (d.value)}
            <option value={d.value}>{d.label}</option>
          {/each}
        </select>
      </label>

      {#if viewMode.value !== 'list'}
        <label class="flex items-center gap-2">
          <span class="font-display text-xs uppercase tracking-widest text-hex-mist">Sort</span>
          <select
            bind:value={sort}
            aria-label="Sort order"
            class="hex-input min-w-[8rem] appearance-none bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat pr-8"
            style="background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22 fill=%22none%22 stroke=%22%23C8AA6E%22 stroke-width=%221.5%22><path d=%22m3 4.5 3 3 3-3%22/></svg>');"
          >
            {#each SORT_OPTIONS as opt (opt.value)}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </label>
      {/if}
      <span
        class="hidden whitespace-nowrap font-mono text-sm text-hex-mist sm:inline"
        aria-live="polite"
      >
        {count} champion{count === 1 ? '' : 's'}
      </span>

      <div class="relative ml-auto sm:ml-0">
        <div
          role="group"
          aria-label="View mode"
          class="flex overflow-hidden rounded-sm border border-hex-border {showHint
            ? 'ring-2 ring-hex-cyan/40'
            : ''}"
        >
          <button
            type="button"
            aria-pressed={viewMode.value === 'splash'}
            aria-label="Splash card view"
            onclick={() => setViewMode('splash')}
            class="px-2.5 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-hex-cyan/60 {viewMode.value ===
            'splash'
              ? 'bg-hex-gold/15 text-hex-goldHi'
              : 'text-hex-mist hover:text-hex-gold'}"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="1.5" y="1.5" width="5.5" height="13" rx="0.8" stroke="currentColor" stroke-width="1.2" />
              <rect x="9" y="1.5" width="5.5" height="13" rx="0.8" stroke="currentColor" stroke-width="1.2" />
            </svg>
          </button>
          <button
            type="button"
            aria-pressed={viewMode.value === 'list'}
            aria-label="List view"
            onclick={() => setViewMode('list')}
            class="relative border-l border-hex-border px-2.5 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-hex-cyan/60 {viewMode.value ===
            'list'
              ? 'bg-hex-gold/15 text-hex-goldHi'
              : 'text-hex-mist hover:text-hex-gold'}"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            </svg>
            {#if showHint}
              <span
                class="absolute -right-0.5 -top-0.5 inline-flex h-2 w-2 animate-ping rounded-full bg-hex-cyan"
                aria-hidden="true"
              ></span>
              <span
                class="absolute -right-0.5 -top-0.5 inline-flex h-2 w-2 rounded-full bg-hex-cyanHi"
                aria-hidden="true"
              ></span>
            {/if}
          </button>
        </div>

        {#if showHint}
          <div
            role="note"
            aria-label="Tip: detailed view"
            transition:fly={{ y: -6, duration: 220, easing: cubicOut }}
            class="absolute right-0 top-full z-30 mt-3 w-64 rounded-md border border-hex-cyan/40 bg-hex-panel/95 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.55)] backdrop-blur"
          >
            <span
              class="absolute -top-1.5 right-3 h-3 w-3 rotate-45 border-l border-t border-hex-cyan/40 bg-hex-panel/95"
              aria-hidden="true"
            ></span>
            <button
              type="button"
              onclick={dismissViewHint}
              aria-label="Dismiss tip"
              class="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-sm text-hex-mist transition-colors hover:bg-hex-shadow/70 hover:text-hex-goldHi focus:outline-none focus-visible:ring-2 focus-visible:ring-hex-cyan/60"
            >
              ✕
            </button>
            <p
              class="pr-4 font-display text-xs uppercase tracking-widest text-hex-cyan"
            >
              Try the detailed view
            </p>
            <p class="mt-1 text-[11px] leading-relaxed text-hex-parchment/90">
              See Hex Score, win rate &amp; games played per champion. Click any column to sort.
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
