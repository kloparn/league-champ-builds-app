<script lang="ts">
  import { goto } from '$app/navigation';
  import { displayName } from '$lib/utils';
  import { squareIcon } from '$lib/ddragon';

  interface MiniChampion {
    id: string;
    name: string;
    title: string;
    image: { full: string };
  }

  interface Props {
    champions: MiniChampion[];
    version: string;
    excludeId?: string;
  }

  let { champions, version, excludeId }: Props = $props();

  const LISTBOX_ID = 'champion-quick-search-listbox';
  const optionId = (i: number) => `${LISTBOX_ID}-opt-${i}`;

  let query = $state('');
  let focused = $state(false);
  let activeIndex = $state(-1);
  let containerEl: HTMLDivElement | undefined = $state();
  let inputEl: HTMLInputElement | undefined = $state();

  const results = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return champions
      .filter((c) => c.id !== excludeId)
      .filter((c) => {
        const display = displayName(c.id, c.name).toLowerCase();
        return display.includes(q) || c.title.toLowerCase().includes(q);
      })
      .slice(0, 4);
  });

  const showResults = $derived(focused && query.trim().length > 0);

  // Reset highlight whenever the result set changes.
  $effect(() => {
    void results;
    activeIndex = -1;
  });

  function onWindowClick(e: MouseEvent) {
    if (!containerEl) return;
    if (!containerEl.contains(e.target as Node)) focused = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (!showResults || results.length === 0) {
      // Allow ArrowDown to open results if there's a query but nothing focused.
      if (e.key === 'ArrowDown' && results.length > 0) {
        e.preventDefault();
        focused = true;
        activeIndex = 0;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = activeIndex >= results.length - 1 ? 0 : activeIndex + 1;
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndex = activeIndex <= 0 ? results.length - 1 : activeIndex - 1;
        break;
      case 'Home':
        e.preventDefault();
        activeIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        activeIndex = results.length - 1;
        break;
      case 'Enter': {
        e.preventDefault();
        const target = results[activeIndex >= 0 ? activeIndex : 0];
        if (target) {
          goto(`/champion/${target.id}`);
          query = '';
          focused = false;
          inputEl?.blur();
        }
        break;
      }
      case 'Escape':
        e.preventDefault();
        if (query) {
          query = '';
        } else {
          focused = false;
          inputEl?.blur();
        }
        break;
    }
  }
</script>

<svelte:window onclick={onWindowClick} />

<div class="relative w-full sm:w-64" bind:this={containerEl}>
  <label
    class="flex items-center gap-2 rounded border border-hex-border bg-hex-shadow/80 px-3 py-1.5 backdrop-blur-sm transition-colors focus-within:border-hex-cyan"
  >
    <span class="sr-only">Jump to a champion</span>
    <svg
      class="h-4 w-4 shrink-0 text-hex-gold"
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
      bind:this={inputEl}
      type="search"
      placeholder="Jump to champion..."
      bind:value={query}
      onfocus={() => (focused = true)}
      onkeydown={onKeydown}
      class="w-full bg-transparent text-sm text-hex-parchment placeholder:text-hex-mist/60 focus:outline-none"
      role="combobox"
      aria-label="Jump to champion"
      aria-autocomplete="list"
      aria-controls={LISTBOX_ID}
      aria-expanded={showResults}
      aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
    />
  </label>

  {#if showResults}
    <ul
      id={LISTBOX_ID}
      role="listbox"
      aria-label="Champion search results"
      class="absolute right-0 top-full z-30 mt-1 w-full overflow-hidden rounded border border-hex-border bg-hex-deep/95 shadow-hex backdrop-blur-md sm:w-72"
    >
      {#if results.length === 0}
        <li class="px-3 py-3 text-center text-sm text-hex-mist" role="option" aria-selected="false">
          No matches
        </li>
      {:else}
        {#each results as champion, i (champion.id)}
          {@const active = i === activeIndex}
          <li id={optionId(i)} role="option" aria-selected={active}>
            <a
              href="/champion/{champion.id}"
              onmousemove={() => (activeIndex = i)}
              tabindex="-1"
              class="flex items-center gap-3 px-3 py-2 transition-colors {active
                ? 'bg-hex-panel/70'
                : 'hover:bg-hex-panel/60'}"
            >
              <img
                src={squareIcon(version, champion.image.full)}
                alt=""
                width="32"
                height="32"
                class="shrink-0 rounded border border-hex-gold/30"
                loading="lazy"
              />
              <div class="min-w-0 flex-1">
                <div class="truncate font-display text-sm text-hex-parchment">
                  {displayName(champion.id, champion.name)}
                </div>
                <div class="truncate text-[11px] text-hex-mist">{champion.title}</div>
              </div>
            </a>
          </li>
        {/each}
      {/if}
    </ul>
  {/if}
</div>
