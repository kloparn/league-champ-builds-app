<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** The element that activates the tooltip (icon, button, etc.). */
    children: Snippet;
    /** The popover content shown on hover/focus. */
    content: Snippet;
    /** Pixel width cap for the popover body. */
    width?: number;
    /** Preferred placement; may flip if there's no room. */
    placement?: 'top' | 'bottom';
    /** Optional CSS class added to the inline wrapper. */
    class?: string;
  }

  let { children, content, width = 280, placement = 'top', class: extraClass = '' }: Props =
    $props();

  let triggerEl = $state<HTMLSpanElement>();
  let popoverEl = $state<HTMLDivElement>();
  let supported = $state(false);

  $effect(() => {
    supported = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;
  });

  function reposition(): void {
    if (!popoverEl || !triggerEl) return;
    const t = triggerEl.getBoundingClientRect();
    const p = popoverEl.getBoundingClientRect();
    const margin = 6;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top: number;
    if (placement === 'top') {
      top = t.top - p.height - margin;
      if (top < 8) top = t.bottom + margin;
    } else {
      top = t.bottom + margin;
      if (top + p.height > vh - 8) top = t.top - p.height - margin;
    }

    let left = t.left + t.width / 2 - p.width / 2;
    left = Math.max(8, Math.min(left, vw - p.width - 8));

    popoverEl.style.top = `${Math.max(8, top)}px`;
    popoverEl.style.left = `${left}px`;
  }

  function show(): void {
    if (!supported || !popoverEl) return;
    try {
      popoverEl.showPopover();
      // Recompute after the popover is actually painted at its final size.
      requestAnimationFrame(reposition);
    } catch {
      // Either already open or unsupported — ignore.
    }
  }

  function hide(): void {
    if (!popoverEl) return;
    try {
      popoverEl.hidePopover();
    } catch {
      // Already closed — ignore.
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
  bind:this={triggerEl}
  class="tooltip-trigger {extraClass}"
  onmouseenter={show}
  onmouseleave={hide}
  onfocusin={show}
  onfocusout={hide}
>
  {@render children()}
</span>

<div
  bind:this={popoverEl}
  popover="manual"
  role="tooltip"
  class="tooltip-pop"
  style="width: {width}px; max-width: min({width}px, calc(100vw - 1rem));"
>
  {@render content()}
</div>

<style>
  .tooltip-trigger {
    position: relative;
    display: inline-flex;
  }

  /* The popover API places the element in the top layer; we just style it. */
  .tooltip-pop[popover] {
    margin: 0;
    inset: auto;
    padding: 0.625rem 0.75rem;
    border: 1px solid theme('colors.hex.border');
    border-radius: 4px;
    background-color: theme('colors.hex.panel');
    color: theme('colors.hex.parchment');
    font-size: 11px;
    line-height: 1.4;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55);
    pointer-events: none;
    /* Initial position is overwritten on show by reposition(). */
    top: 0;
    left: 0;
  }
</style>
