<script lang="ts">
  import { LANE_SLUG, LANES, type ChampionSummary, type Lane } from '$lib/types';
  import { displayName } from '$lib/utils';
  import { squareIcon } from '$lib/ddragon';
  import type { ChampionListSummary } from '../../routes/+page.server';

  interface Props {
    champion: ChampionSummary;
    version: string;
    summary: ChampionListSummary | null;
    /** Active lane filter; when set, stats shown are for THIS lane, not overall. */
    lane?: Lane | '';
    /** Patch identifier — shown in the score tooltip to remind users the score is patch-scoped. */
    patch?: string;
    /** Optional callback — clicking the rank cell forwards the row's lane here. */
    onSelectLane?: (lane: Lane) => void;
  }

  let { champion, version, summary, lane = '', patch = '', onSelectLane }: Props = $props();

  const name = $derived(displayName(champion.id, champion.name));
  const href = $derived(
    lane ? `/champion/${champion.id}?role=${LANE_SLUG[lane]}` : `/champion/${champion.id}`
  );
  const portrait = $derived(squareIcon(version, champion.image.full));

  const displayLane = $derived(lane || summary?.topLane || null);
  const displayLaneLabel = $derived(
    displayLane ? (LANES.find((l) => l.value === displayLane)?.label ?? null) : null
  );
  const laneStats = $derived(
    displayLane && summary?.byLane[displayLane] ? summary.byLane[displayLane] : null
  );
  const wrPct = $derived(
    laneStats && laneStats.games > 0 ? (laneStats.winrate * 100).toFixed(1) : null
  );
  const wrTone = $derived(
    laneStats && laneStats.games > 0
      ? laneStats.winrate >= 0.5
        ? 'positive'
        : 'negative'
      : 'neutral'
  );
  const score = $derived(laneStats?.score ?? null);
  const rank = $derived(laneStats?.rank ?? null);
  const scoreTooltip = $derived(
    score !== null && displayLaneLabel
      ? `Hex Score ${score}/100 in ${displayLaneLabel}${patch ? ` (patch ${patch})` : ''}. Patch-scoped — buffs/nerfs reshuffle this every patch.`
      : ''
  );
  const isRankClickable = $derived(
    rank !== null && !!displayLane && !!displayLaneLabel && !!onSelectLane
  );
  const rankTooltip = $derived(
    !displayLaneLabel || rank === null
      ? ''
      : isRankClickable
        ? `#${rank} in ${displayLaneLabel} — click to filter by ${displayLaneLabel}`
        : `#${rank} in ${displayLaneLabel} by Hex Score`
  );

  function handleRankClick(e: MouseEvent): void {
    if (!isRankClickable || !displayLane) return;
    e.preventDefault();
    e.stopPropagation();
    onSelectLane?.(displayLane as Lane);
  }
</script>

<a
  {href}
  class="group grid grid-cols-[2.5rem_3rem_minmax(0,1fr)_6rem_5rem_5rem] items-center border-b border-hex-border/30 bg-hex-shadow/40 transition-colors duration-100 hover:bg-hex-panel/70"
  aria-label="View {name}"
>
  {#if rank !== null && isRankClickable}
    <button
      type="button"
      onclick={handleRankClick}
      title={rankTooltip}
      aria-label={rankTooltip}
      class="flex h-full w-full cursor-pointer items-center justify-center self-stretch py-2.5 font-mono text-sm tabular-nums transition-colors duration-100 hover:bg-hex-gold/10 focus:outline-none focus-visible:bg-hex-gold/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hex-cyan/60"
    >
      <span
        class="underline decoration-hex-border decoration-dashed decoration-from-font underline-offset-[3px] transition-colors duration-100 group-hover:decoration-hex-border/60"
        class:text-hex-goldHi={rank <= 5}
        class:text-hex-gold={rank > 5 && rank <= 15}
        class:text-hex-mist={rank > 15}
      >
        {rank}
      </span>
    </button>
  {:else}
    <span
      class="flex items-center justify-center py-2.5 font-mono text-sm tabular-nums"
      title={rank !== null ? rankTooltip : ''}
    >
      {#if rank !== null}
        <span
          class="cursor-help underline decoration-hex-border decoration-dashed decoration-from-font underline-offset-[3px]"
          class:text-hex-goldHi={rank <= 5}
          class:text-hex-gold={rank > 5 && rank <= 15}
          class:text-hex-mist={rank > 15}
        >
          {rank}
        </span>
      {:else}
        <span class="text-hex-mist/40">—</span>
      {/if}
    </span>
  {/if}

  <span class="flex items-center justify-center py-2.5">
    <img
      src={portrait}
      alt=""
      loading="lazy"
      decoding="async"
      width="36"
      height="36"
      class="h-9 w-9 rounded-sm border border-hex-border object-cover transition-colors duration-100 group-hover:border-hex-gold/60"
    />
  </span>

  <div class="min-w-0 px-3 py-2.5 sm:px-4">
    <p class="truncate font-display text-sm uppercase tracking-wider text-hex-goldHi">
      {name}
    </p>
    <p class="truncate text-[11px] text-hex-mist">
      {#if displayLaneLabel}
        <span class="font-mono uppercase tracking-widest text-hex-cyan">{displayLaneLabel}</span>
        <span class="mx-1 text-hex-mist/50">·</span>
      {/if}
      <span class="italic">{champion.title}</span>
    </p>
  </div>

  <span class="flex items-center justify-end border-l border-hex-border/30 px-3 py-2.5 sm:px-4">
    {#if score !== null}
      <span
        class="inline-flex min-w-[2.5rem] cursor-help justify-center rounded-sm border border-hex-gold/40 bg-hex-gold/10 px-1.5 py-0.5 font-mono text-xs tabular-nums text-hex-goldHi transition-colors duration-100 hover:border-hex-gold hover:bg-hex-gold/20"
        title={scoreTooltip}
      >
        {score}
      </span>
    {:else}
      <span class="font-mono text-xs text-hex-mist/40">—</span>
    {/if}
  </span>

  <span
    class="flex items-center justify-end border-l border-hex-border/30 px-3 py-2.5 text-right font-mono text-xs tabular-nums sm:px-4"
  >
    {#if wrPct}
      <span
        class:text-hex-cyan={wrTone === 'positive'}
        class:text-rose-400={wrTone === 'negative'}
      >
        {wrPct}%
      </span>
    {:else}
      <span class="text-hex-mist/40">—</span>
    {/if}
  </span>

  <span
    class="flex items-center justify-end border-l border-hex-border/30 px-3 py-2.5 text-right font-mono text-xs tabular-nums text-hex-mist sm:px-4"
  >
    {#if laneStats && laneStats.games > 0}
      {laneStats.games.toLocaleString()}
    {:else}
      <span class="text-hex-mist/40">—</span>
    {/if}
  </span>
</a>
