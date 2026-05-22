<script lang="ts">
  import {
    consent,
    consentUi,
    closeConsentModal,
    acceptAll,
    rejectAll,
    saveChoices,
    getConsentExpiry
  } from '$lib/consent.svelte';

  let analytics = $state(consent.analytics);
  let marketing = $state(consent.marketing);
  let dialog: HTMLDivElement | undefined = $state();
  let closeButton: HTMLButtonElement | undefined = $state();

  const onClose = closeConsentModal;

  $effect(() => {
    if (consentUi.modalOpen) {
      analytics = consent.analytics;
      marketing = consent.marketing;
      const previouslyFocused = document.activeElement as HTMLElement | null;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', onKey);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      queueMicrotask(() => closeButton?.focus());
      return () => {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = prevOverflow;
        previouslyFocused?.focus?.();
      };
    }
  });

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function onAcceptAll() {
    acceptAll();
    onClose();
  }
  function onRejectAll() {
    rejectAll();
    onClose();
  }
  function onSave() {
    saveChoices({ analytics, marketing });
    onClose();
  }
</script>

{#if consentUi.modalOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-hex-void/80 px-4 py-8 backdrop-blur-sm"
    role="presentation"
    onclick={handleBackdrop}
  >
    <div
      bind:this={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      aria-describedby="consent-desc"
      class="hex-frame relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md p-6 shadow-2xl"
    >
      <div class="mb-4 flex items-start justify-between gap-4">
        <h2
          id="consent-title"
          class="font-display text-xl uppercase tracking-widest text-hex-gold"
        >
          Cookie Preferences
        </h2>
        <button
          bind:this={closeButton}
          type="button"
          aria-label="Close cookie preferences"
          onclick={onClose}
          class="rounded-sm border border-hex-border bg-hex-shadow/60 px-2 py-1 text-hex-mist transition-colors hover:border-hex-gold/60 hover:text-hex-goldHi focus:outline-none focus:ring-2 focus:ring-hex-cyan/60"
        >
          ✕
        </button>
      </div>

      <p id="consent-desc" class="mb-5 text-sm leading-relaxed text-hex-parchment/85">
        We use the minimum needed to run this site. Below are categories you can enable for any
        future tooling — none are active until you opt in.
      </p>

      <div class="space-y-3">
        <div class="rounded-sm border border-hex-border bg-hex-shadow/40 p-4">
          <div class="flex items-center justify-between gap-3">
            <span class="font-display text-sm uppercase tracking-wider text-hex-gold">
              Necessary
            </span>
            <span class="font-mono text-xs uppercase tracking-widest text-hex-cyan">
              Always active
            </span>
          </div>
          <p class="mt-1.5 text-xs leading-relaxed text-hex-mist">
            Required for the site to load and remember your tab/section. Cannot be turned off.
          </p>
        </div>

        <label
          class="flex cursor-pointer items-start gap-3 rounded-sm border border-hex-border bg-hex-shadow/40 p-4 transition-colors hover:border-hex-gold/40"
        >
          <input
            type="checkbox"
            bind:checked={analytics}
            class="mt-0.5 h-4 w-4 shrink-0 accent-hex-gold"
          />
          <span class="flex-1">
            <span class="block font-display text-sm uppercase tracking-wider text-hex-parchment">
              Analytics
            </span>
            <span class="mt-1 block text-xs leading-relaxed text-hex-mist">
              Anonymous page-view + usage stats so we know which champions get visited. Reserved
              for future use.
            </span>
          </span>
        </label>

        <label
          class="flex cursor-pointer items-start gap-3 rounded-sm border border-hex-border bg-hex-shadow/40 p-4 transition-colors hover:border-hex-gold/40"
        >
          <input
            type="checkbox"
            bind:checked={marketing}
            class="mt-0.5 h-4 w-4 shrink-0 accent-hex-gold"
          />
          <span class="flex-1">
            <span class="block font-display text-sm uppercase tracking-wider text-hex-parchment">
              Marketing &amp; Ads
            </span>
            <span class="mt-1 block text-xs leading-relaxed text-hex-mist">
              Personalised ads or remarketing pixels. Reserved for future use; nothing runs today.
            </span>
          </span>
        </label>
      </div>

      {#if consent.decided && consent.decidedAt}
        {@const expiry = getConsentExpiry(consent.decidedAt)}
        <p class="mt-4 font-mono text-[11px] text-hex-mist/70">
          Saved {new Date(consent.decidedAt).toLocaleDateString()}{#if expiry}
            · expires {expiry.toLocaleDateString()}{/if}.
        </p>
      {/if}

      <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onclick={onRejectAll}
          class="rounded-sm border border-hex-border bg-hex-shadow/60 px-4 py-2 font-display text-sm uppercase tracking-widest text-hex-mist transition-colors hover:border-hex-mist hover:text-hex-parchment focus:outline-none focus:ring-2 focus:ring-hex-cyan/60"
        >
          Reject all
        </button>
        <button
          type="button"
          onclick={onSave}
          class="rounded-sm border border-hex-border bg-hex-shadow/60 px-4 py-2 font-display text-sm uppercase tracking-widest text-hex-cyan transition-colors hover:border-hex-cyan hover:text-hex-cyanHi focus:outline-none focus:ring-2 focus:ring-hex-cyan/60"
        >
          Save selected
        </button>
        <button type="button" onclick={onAcceptAll} class="hex-button"> Accept all </button>
      </div>
    </div>
  </div>
{/if}
