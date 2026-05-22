<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { consent, acceptAll, openConsentModal } from '$lib/consent.svelte';

  let mounted = $state(false);
  $effect(() => {
    // Small delay so the banner enters after the page has settled,
    // making the slide-up obvious instead of competing with first paint.
    const t = setTimeout(() => {
      mounted = true;
    }, 400);
    return () => clearTimeout(t);
  });

  const show = $derived(mounted && !consent.decided);
</script>

{#if show}
  <div
    role="region"
    aria-label="Cookie notice"
    transition:fly={{ y: 80, duration: 500, easing: cubicOut }}
    class="fixed inset-x-0 bottom-0 z-40 border-t border-hex-border bg-hex-deep/95 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md"
  >
    <div
      class="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8"
    >
      <div class="flex-1">
        <p class="font-display text-sm uppercase tracking-widest text-hex-gold">
          We use cookies
        </p>
        <p class="mt-1 text-xs leading-relaxed text-hex-mist">
          Only the essentials run by default. Enable analytics or marketing cookies if you want to
          help us improve the site or support future ads. You can change this any time from the
          footer.
        </p>
      </div>
      <div class="flex shrink-0 flex-wrap gap-2 md:flex-nowrap">
        <button
          type="button"
          onclick={openConsentModal}
          class="rounded-sm border border-hex-border bg-hex-shadow/60 px-4 py-2 font-display text-xs uppercase tracking-widest text-hex-mist transition-colors hover:border-hex-mist hover:text-hex-parchment focus:outline-none focus:ring-2 focus:ring-hex-cyan/60"
        >
          Manage
        </button>
        <button type="button" onclick={acceptAll} class="hex-button text-xs">
          Accept all
        </button>
      </div>
    </div>
  </div>
{/if}
