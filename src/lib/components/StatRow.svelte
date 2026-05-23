<script lang="ts">
  import { formatStat, statAtMaxLevel } from '$lib/utils';

  interface Props {
    label: string;
    base: number;
    perLevel?: number;
  }

  let { label, base, perLevel }: Props = $props();
  const max = $derived(
    perLevel !== undefined && perLevel !== 0 ? statAtMaxLevel(base, perLevel) : undefined
  );
  const showsScaling = $derived(
    perLevel !== undefined && perLevel !== 0 && max !== undefined
  );
</script>

<div
  class="grid grid-cols-[1fr_auto_1.25rem_auto_3rem] items-baseline gap-x-2 border-b border-hex-border/40 py-1.5 text-xs"
>
  <span class="truncate text-hex-mist">{label}</span>
  <span class="text-right font-mono tabular-nums text-hex-goldHi">{formatStat(base)}</span>
  <span class="text-center text-hex-mist/60" aria-hidden="true">
    {showsScaling ? '→' : ''}
  </span>
  <span class="text-right font-mono tabular-nums text-hex-cyan">
    {showsScaling ? formatStat(max!) : ''}
  </span>
  <span class="text-right font-mono tabular-nums text-hex-mist/60">
    {showsScaling ? `+${formatStat(perLevel!)}` : ''}
  </span>
</div>
