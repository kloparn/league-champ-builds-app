<script lang="ts">
  import type { SortKey } from '$lib/components/SearchBar.svelte';

  interface Props {
    sort: SortKey;
    sortDir: 'asc' | 'desc';
    onSort: (key: SortKey) => void;
    onReset?: () => void;
  }

  let { sort, sortDir, onSort, onReset }: Props = $props();

  const COLUMNS: {
    key: SortKey;
    label: string;
    title?: string;
    align: 'left' | 'right';
    helpHash?: string;
    helpLabel?: string;
  }[] = [
    { key: 'name', label: 'Name', align: 'left' },
    {
      key: 'score',
      label: 'Hex Score',
      align: 'right',
      helpHash: 'hex-score',
      helpLabel: 'What is the Hex Score?'
    },
    { key: 'winrate', label: 'Win rate', align: 'right' },
    {
      key: 'games',
      label: 'GPTP',
      title: 'Games played this patch',
      align: 'right',
      helpHash: 'gptp',
      helpLabel: 'What is GPTP?'
    }
  ];

  const isDefault = $derived(sort === 'name' && sortDir === 'asc');

  function arrow(key: SortKey): string {
    if (key !== sort) return '';
    return sortDir === 'asc' ? '▲' : '▼';
  }
</script>

<div class="border-b border-hex-border bg-hex-deep/70">
  <div
    class="grid grid-cols-[2.5rem_3rem_minmax(0,1fr)_7.5rem_6rem_5rem] items-stretch text-[11px] uppercase tracking-wider text-hex-mist"
  >
    <button
      type="button"
      onclick={() => onSort('score')}
      aria-pressed={sort === 'score'}
      title="Rank reflects Hex Score — click to sort"
      class="flex items-center justify-center px-1 py-2.5 font-display uppercase tracking-wider transition-colors duration-100 hover:bg-hex-panel/40 hover:text-hex-goldHi focus:outline-none focus-visible:bg-hex-panel/40 focus-visible:text-hex-goldHi {sort ===
      'score'
        ? 'text-hex-gold'
        : ''}"
    >
      Rank
    </button>
    <span aria-hidden="true"></span>

    {#each COLUMNS as col, i (col.key)}
      {@const active = col.key === sort}
      <button
        type="button"
        onclick={() => onSort(col.key)}
        aria-pressed={active}
        title={col.title ?? col.label}
        class="flex items-center gap-1 overflow-hidden px-2 py-2.5 font-display uppercase tracking-wider transition-colors hover:bg-hex-panel/40 hover:text-hex-goldHi focus:outline-none focus-visible:bg-hex-panel/40 focus-visible:text-hex-goldHi sm:px-3 {i >
        0
          ? 'border-l border-hex-border/40'
          : ''} {col.align === 'right' ? 'justify-end text-right' : 'text-left'} {active
          ? 'text-hex-gold'
          : ''}"
      >
        <span class="whitespace-nowrap">{col.label}</span>
        {#if col.helpHash}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <a
            href="/faq#{col.helpHash}"
            aria-label={col.helpLabel ?? `Learn more about ${col.label}`}
            title={col.helpLabel ?? `Learn more about ${col.label}`}
            onclick={(e) => e.stopPropagation()}
            class="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-hex-border text-[10px] text-hex-mist transition-colors duration-100 hover:border-hex-gold hover:text-hex-goldHi focus:outline-none focus-visible:ring-2 focus-visible:ring-hex-cyan/60"
          >
            ?
          </a>
        {/if}
        <span class="w-2 shrink-0 text-hex-cyan" aria-hidden="true">{arrow(col.key)}</span>
      </button>
    {/each}
  </div>

  {#if !isDefault && onReset}
    <div class="flex justify-end border-t border-hex-border/30 bg-hex-shadow/40 px-3 py-1.5 sm:px-4">
      <button
        type="button"
        onclick={onReset}
        class="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-hex-mist transition-colors hover:text-hex-goldHi focus:outline-none focus-visible:text-hex-goldHi"
      >
        <span aria-hidden="true">↺</span> Reset sort
      </button>
    </div>
  {/if}
</div>
