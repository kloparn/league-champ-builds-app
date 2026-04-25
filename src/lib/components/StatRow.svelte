<script lang="ts">
  import { formatStat, statAtMaxLevel } from '$lib/utils';

  interface Props {
    label: string;
    base: number;
    perLevel?: number;
  }

  let { label, base, perLevel }: Props = $props();
  const max = $derived(perLevel !== undefined ? statAtMaxLevel(base, perLevel) : undefined);
</script>

<div class="flex items-center justify-between border-b border-hex-border/50 py-1.5 text-sm">
  <span class="text-hex-mist">{label}</span>
  <span class="font-mono text-hex-parchment">
    <span class="text-hex-goldHi">{formatStat(base)}</span>
    {#if perLevel !== undefined && max !== undefined}
      <span class="text-hex-mist"> → </span>
      <span class="text-hex-cyan">{formatStat(max)}</span>
      <span class="text-hex-mist/70"> (+{formatStat(perLevel)}/lvl)</span>
    {/if}
  </span>
</div>
