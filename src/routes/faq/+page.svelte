<script lang="ts">
  import { untrack } from 'svelte';
  import { slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { OFF_META_THRESHOLD } from '$lib/build-aggregator';
  import { SITE_URL } from '$lib/site';

  let openItems = $state(new Set<string>());

  function toggle(id: string): void {
    const next = new Set(openItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    openItems = next;
  }

  // Deep links like /faq#hex-score auto-open + scroll to the matching section.
  // untrack the openItems read so the effect doesn't re-run on toggles —
  // otherwise closing the deep-linked item immediately re-opens it.
  $effect(() => {
    if (typeof window === 'undefined') return;
    const applyHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      if (faqs.some((f) => f.id === hash)) {
        openItems = new Set([...untrack(() => openItems), hash]);
        // Wait for the slide transition to allocate height before scrolling.
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  });

  interface Faq {
    id: string;
    q: string;
    a: string;
  }

  const faqs: Faq[] = [
    {
      id: 'data-source',
      q: 'Where does the data come from?',
      a:
        "Aggregated from Riot's official Match API on solo queue, plus a handful of other " +
        'trusted community sources to fill in the gaps where Riot\'s own data is incomplete.'
    },
    {
      id: 'elo-bracket',
      q: 'Why only Diamond and above?',
      a:
        "Each match in Diamond+ has roughly twice the signal of a lower-elo match because " +
        "players execute builds more consistently, so the same number of matches gives a sharper " +
        "read of what actually works. We're starting here while the site is still finding its " +
        'feet — broader elo brackets (Emerald, Platinum, etc.) are on the roadmap as separate filters.'
    },
    {
      id: 'hex-score',
      q: 'What is the Hex Score?',
      a:
        "A 0–100 number that combines two things: how well a champion is performing (70% weight) " +
        "and how often they're picked (30% weight). The performance component uses a Wilson 95% " +
        "lower-bound on the win rate — that's the standard fix for 'a 70%-on-12-games champion " +
        "beats a 53%-on-1000-games champion'. The small-sample champion gets pulled down because " +
        "we can't trust their win rate yet. The presence component is the champion's share of all " +
        "games in the role, capped at 10% (tier-1 meta presence). Compare champions within the " +
        "same role for the cleanest reading."
    },
    {
      id: 'gptp',
      q: 'What does GPTP mean?',
      a:
        "Games Played This Patch — how many ranked games we've recorded with this champion in " +
        "the current role on the current patch. A bigger number means more confidence in the win " +
        "rate and Hex Score; tiny numbers (under ~100) get filtered out automatically. Resets " +
        'every time a new patch rolls over.'
    },
    {
      id: 'patch-scope',
      q: 'Is the Hex Score absolute or patch-specific?',
      a:
        "Patch-specific. A 30 today can be a 75 next patch if a champion gets buffed; a 70 today " +
        "can crash to 20 after a nerf. The score reflects how a champion performs in the meta " +
        "right now, not how good they are 'in general'. The patch number is shown in the " +
        'tooltip so you always know which patch you are reading.'
    },
    {
      id: 'data-freshness',
      q: 'How fresh is the data?',
      a:
        'Updated multiple times per day. When a new patch ships we hold the previous ' +
        "patch's stats up until we've gathered enough fresh games — so you never see near-empty " +
        'data during a rollover.'
    },
    {
      id: 'off-meta',
      q: 'Why does the Profile filter sometimes hide a champion from a role?',
      a:
        `For a champion to appear under a specific role in the filter, that role has to account ` +
        `for at least ${Math.round(OFF_META_THRESHOLD * 100)}% of their matches. ` +
        "A champion picked 3% of the time in jungle is technically a jungler, but in practice " +
        "it's off-meta — not the usual pick for that role — and its stats are too noisy to trust. " +
        'Those get filtered out so the role buckets stay meaningful.'
    },
    {
      id: 'tier-list',
      q: 'Why does the Hex Score disagree with other sites?',
      a:
        "Different formula and different framing. Each site weights win rate, pick rate, ban rate " +
        "and matchups differently, and most tier lists output S/A/B/C buckets — the Hex Score is a " +
        "single number 0–100 so you can sort cleanly. Treat it as a second opinion calibrated on a " +
        'higher-skill bracket.'
    },
    {
      id: 'no-build-data',
      q: 'Why does a champion show "no data" on the home page?',
      a:
        "Either the champion was released after our last refresh, or no matches with them were " +
        "captured in the current patch's sample. New champions usually accumulate enough data to " +
        "appear within 24–48 hours of the refresh script catching up. The champion page itself " +
        'will say "No build data available for this champion yet" in the same situation.'
    },
    {
      id: 'difficulty',
      q: 'What does the "Skill level" filter base difficulty on?',
      a:
        "Riot's own published difficulty rating, bucketed into Beginner / Intermediate / Expert. " +
        "Heads up: this rating doesn't always line up with the modern in-client classification " +
        '— a champion you think of as easy may land in Intermediate here.'
    },
  ];

  const faqJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  });
</script>

<svelte:head>
  <title>FAQ — League Champ Builds</title>
  <meta
    name="description"
    content="How we build the tier list, where our data comes from, what the Hex Score is, and why our numbers sometimes disagree with OP.GG."
  />
  <link rel="canonical" href="{SITE_URL}/faq" />
  {@html `<script type="application/ld+json">${faqJsonLd.replace(/</g, '\\u003c')}</script>`}
</svelte:head>

<section class="px-4 py-10 md:px-8">
  <div class="mx-auto max-w-3xl">
    <div class="mb-8 text-center">
      <p class="font-display text-xs uppercase tracking-[0.4em] text-hex-cyan">FAQ</p>
      <h1
        class="mt-2 font-display text-3xl uppercase tracking-widest text-hex-goldHi md:text-4xl"
      >
        How we do things
      </h1>
      <p class="mx-auto mt-3 max-w-2xl text-sm text-hex-mist">
        We do a few things differently from the other build sites. This page explains what and
        why.
      </p>
    </div>

    <div class="space-y-4">
      {#each faqs as faq (faq.id)}
        {@const isOpen = openItems.has(faq.id)}
        <div
          id={faq.id}
          class="hex-frame rounded-md transition-colors {isOpen ? 'bg-hex-panel/90' : ''}"
        >
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="{faq.id}-panel"
            onclick={() => toggle(faq.id)}
            class="flex w-full items-center gap-2 px-5 py-4 text-left font-display text-base uppercase tracking-wider text-hex-gold transition-colors hover:text-hex-goldHi focus:outline-none focus-visible:ring-2 focus-visible:ring-hex-cyan/60"
          >
            <span
              class="inline-block text-hex-cyan transition-transform duration-300"
              class:rotate-90={isOpen}
              aria-hidden="true">▸</span
            >
            <span class="flex-1">{faq.q}</span>
          </button>

          {#if isOpen}
            <div
              id="{faq.id}-panel"
              role="region"
              aria-labelledby="{faq.id}-trigger"
              transition:slide={{ duration: 250, easing: cubicOut }}
            >
              <p class="px-5 pb-5 text-sm leading-relaxed text-hex-parchment/90">{faq.a}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <p class="mt-10 text-center text-xs text-hex-mist/70">
      Question we missed? Open an issue or
      <a
        href="mailto:adam.hakanson@hotmail.com"
        class="text-hex-gold underline-offset-2 hover:text-hex-goldHi hover:underline"
        >drop us a line</a
      >.
    </p>
  </div>
</section>
