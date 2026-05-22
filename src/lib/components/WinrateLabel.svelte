<script lang="ts">
  interface Props {
    winrate: number;
    sampleSize: number;
    /** Fraction of the parent sample (e.g. role.games / champion.games for a role winrate,
     * or entry.pickRate for an item within a role). If omitted, the warning triangle never shows. */
    relativeShare?: number;
    /** Triangle threshold. Below this fraction, the slice is treated as off-meta. */
    lowConventionThreshold?: number;
    /** Tooltip context for the warning, e.g. "of this role's matches" or "of this champion's matches". */
    warningContext?: string;
    /** Tooltip noun for the sample, e.g. "games", "picks". */
    sampleLabel?: string;
    decimals?: number;
  }

  let {
    winrate,
    sampleSize,
    relativeShare,
    lowConventionThreshold = 0.05,
    warningContext = "of this champion's matches",
    sampleLabel = 'games',
    decimals = 1
  }: Props = $props();

  const pct = $derived((winrate * 100).toFixed(decimals));
  const offMeta = $derived(
    typeof relativeShare === 'number' && relativeShare < lowConventionThreshold
  );
  const sampleTooltip = $derived(
    `Based on ${sampleSize.toLocaleString()} ${sampleLabel}`
  );
  const warningTooltip = $derived(
    typeof relativeShare === 'number'
      ? `Only ${(relativeShare * 100).toFixed(1)}% ${warningContext} — off-meta pick`
      : ''
  );
</script>

<span class="inline-flex items-baseline gap-1 whitespace-nowrap">
  <span>{pct}%</span>
  <span class="mark info" tabindex="0" aria-label={sampleTooltip} role="img">
    <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.2" />
      <path
        d="M6.5 6.2c.2-1 1-1.6 1.7-1.6.9 0 1.5.6 1.5 1.4 0 .6-.3 1-.9 1.4-.5.3-.8.6-.8 1.2v.3"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linecap="round"
      />
      <circle cx="8" cy="11.2" r="0.7" fill="currentColor" />
    </svg>
    <span class="tip" role="tooltip">{sampleTooltip}</span>
  </span>
  {#if offMeta}
    <span class="mark warn" tabindex="0" aria-label={warningTooltip} role="img">
      <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 2.2 14.3 13.2H1.7L8 2.2Z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linejoin="round"
        />
        <path d="M8 7v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        <circle cx="8" cy="11.6" r="0.6" fill="currentColor" />
      </svg>
      <span class="tip" role="tooltip">{warningTooltip}</span>
    </span>
  {/if}
</span>

<style>
  .mark {
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: help;
    transform: translateY(1px);
  }

  .mark.info {
    color: theme('colors.hex.mist');
    opacity: 0.55;
    transition: opacity 120ms;
  }

  .mark.info:hover,
  .mark.info:focus-visible {
    opacity: 1;
  }

  .mark.warn {
    color: #f5b942;
  }

  .mark:focus-visible {
    outline: none;
  }

  .tip {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid theme('colors.hex.border');
    background-color: theme('colors.hex.shadow');
    color: theme('colors.hex.parchment');
    font-family: theme('fontFamily.sans');
    font-size: 11px;
    line-height: 1.3;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    z-index: 50;
    transition: opacity 120ms;
    transition-delay: 0ms;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  .mark:hover .tip,
  .mark:focus-visible .tip {
    opacity: 1;
    transition-delay: 500ms;
  }
</style>
