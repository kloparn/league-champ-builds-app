<script lang="ts">
  import '../app.css';
  import Footer from '$lib/components/Footer.svelte';
  import { page } from '$app/state';

  let { children } = $props();

  const SITE_URL = 'https://leaguechampions.org';
  const DEFAULT_OG_IMAGE = `${SITE_URL}/league-background.png`;

  const canonicalUrl = $derived(`${SITE_URL}${page.url.pathname}`);

  const websiteJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'League Champ Builds',
    url: SITE_URL,
    description:
      'League of Legends champion builds, runes, items, abilities, and win rates — always on the latest patch.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  });
</script>

<svelte:head>
  <link rel="canonical" href={canonicalUrl} />
  <meta name="description" content="Browse every League of Legends champion with up-to-date builds, runes, items, abilities, and win rates. Always on the latest patch." />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="League Champ Builds" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={DEFAULT_OG_IMAGE} />
  <meta property="og:image:alt" content="League Champ Builds" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
  {@html `<script type="application/ld+json">${websiteJsonLd}</script>`}
</svelte:head>

<a
  href="#main"
  class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-hex-gold focus:px-3 focus:py-1.5 focus:text-hex-void"
>
  Skip to content
</a>

<div class="flex min-h-screen flex-col">
  <header class="border-b border-hex-border bg-hex-deep/95 backdrop-blur-md">
    <div
      class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:gap-6 md:px-8"
    >
      <a href="/" class="group flex shrink-0 items-center gap-2">
        <span
          class="flex h-8 w-8 items-center justify-center rounded-sm border border-hex-gold/60 font-display text-sm text-hex-gold transition-colors group-hover:border-hex-goldHi group-hover:text-hex-goldHi"
          aria-hidden="true"
        >
          ◆
        </span>
        <span
          class="hidden font-display uppercase tracking-widest text-hex-goldHi sm:inline sm:text-lg"
        >
          Champ Builds
        </span>
      </a>
      <nav class="flex items-center gap-3 text-sm sm:gap-5">
        <a
          href="/"
          class="whitespace-nowrap font-display text-xs uppercase tracking-widest hover:text-hex-gold"
          class:text-hex-gold={page.url.pathname === '/'}
          class:text-hex-mist={page.url.pathname !== '/'}
        >
          Champions
        </a>
        <a
          href="/winrates"
          class="whitespace-nowrap font-display text-xs uppercase tracking-widest hover:text-hex-gold"
          class:text-hex-gold={page.url.pathname.startsWith('/winrates')}
          class:text-hex-mist={!page.url.pathname.startsWith('/winrates')}
        >
          Win rates
        </a>
        <a
          href="https://developer.riotgames.com/docs/lol#data-dragon"
          target="_blank"
          rel="noreferrer noopener"
          class="hidden whitespace-nowrap font-display text-xs uppercase tracking-widest text-hex-mist hover:text-hex-gold sm:inline"
        >
          Data Dragon ↗
        </a>
      </nav>
    </div>
  </header>

  <main id="main" class="flex-1">
    {@render children()}
  </main>

  <Footer />
</div>
