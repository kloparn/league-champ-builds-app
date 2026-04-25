<script lang="ts">
  import { difficultyFill, type DifficultyTone } from '$lib/utils';

  interface Props {
    label: string;
    value: number;
    max?: number;
  }

  let { label, value, max = 10 }: Props = $props();
  const fill = $derived(difficultyFill(value, max));
  const gradient: Record<DifficultyTone, string> = {
    high: 'from-rose-500 to-amber-400',
    mid: 'from-amber-400 to-hex-gold',
    low: 'from-hex-cyan to-hex-cyanHi'
  };
</script>

<div class="space-y-1.5">
  <div class="flex items-center justify-between">
    <span class="font-display text-sm uppercase tracking-wider text-hex-mist">{label}</span>
    <span class="font-mono text-sm text-hex-goldHi">{value}/{max}</span>
  </div>
  <div
    class="h-2 w-full overflow-hidden rounded-full border border-hex-border bg-hex-void"
    role="progressbar"
    aria-label={label}
    aria-valuenow={value}
    aria-valuemin="0"
    aria-valuemax={max}
  >
    <div
      class="h-full bg-gradient-to-r {gradient[fill.tone]} transition-[width] duration-700"
      style:width="{fill.pct}%"
    ></div>
  </div>
</div>
