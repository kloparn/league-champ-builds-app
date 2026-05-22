<script lang="ts">
  import { LANES, type Lane } from '$lib/types';

  interface Props {
    query: string;
    lane: Lane | '';
    count: number;
  }

  let { query = $bindable(), lane = $bindable(), count }: Props = $props();
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
          class="hex-input min-w-[8rem] appearance-none bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat pr-8"
          style="background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22 fill=%22none%22 stroke=%22%23C8AA6E%22 stroke-width=%221.5%22><path d=%22m3 4.5 3 3 3-3%22/></svg>');"
        >
          <option value="">All roles</option>
          {#each LANES as l (l.value)}
            <option value={l.value}>{l.label}</option>
          {/each}
        </select>
      </label>
      <span
        class="hidden whitespace-nowrap font-mono text-sm text-hex-mist sm:inline"
        aria-live="polite"
      >
        {count} champion{count === 1 ? '' : 's'}
      </span>
    </div>
  </div>
</div>
