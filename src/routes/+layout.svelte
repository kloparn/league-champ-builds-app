<script lang="ts">
  import '../app.css';
  import Footer from '$lib/components/Footer.svelte';
  import { page } from '$app/state';
  import { canonical, SITE_NAME, SITE_URL } from '$lib/site';
  import { env } from '$env/dynamic/public';

  let { children } = $props();

  const canonicalUrl = $derived(canonical(page.url.pathname));
  const verification = env.PUBLIC_GOOGLE_SITE_VERIFICATION ?? '';
</script>

<svelte:head>
  <link rel="canonical" href={canonicalUrl} />
  {#if verification}
    <meta name="google-site-verification" content={verification} />
  {/if}
  <meta name="description" content="Browse every League of Legends champion with up-to-date stats, abilities, lore, and skin splash art. Server-rendered and always on the latest patch." />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:domain" content={SITE_URL.replace(/^https?:\/\//, '')} />
</svelte:head>

<a
  href="#main"
  class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-hex-gold focus:px-3 focus:py-1.5 focus:text-hex-void"
>
  Skip to content
</a>

<div class="flex min-h-screen flex-col">
  <header class="border-b border-hex-border bg-hex-deep/95 backdrop-blur-md">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
      <a href="/" class="group flex items-center gap-2">
        <span
          class="flex h-8 w-8 items-center justify-center rounded-sm border border-hex-gold/60 font-display text-sm text-hex-gold transition-colors group-hover:border-hex-goldHi group-hover:text-hex-goldHi"
          aria-hidden="true"
        >
          ◆
        </span>
        <span class="font-display text-lg uppercase tracking-widest text-hex-goldHi">
          Champ Builds
        </span>
      </a>
      <nav class="flex items-center gap-5 text-sm">
        <a
          href="/"
          class="font-display text-xs uppercase tracking-widest hover:text-hex-gold"
          class:text-hex-gold={page.url.pathname === '/'}
          class:text-hex-mist={page.url.pathname !== '/'}
        >
          Champions
        </a>
        <a
          href="/winrates"
          class="font-display text-xs uppercase tracking-widest hover:text-hex-gold"
          class:text-hex-gold={page.url.pathname.startsWith('/winrates')}
          class:text-hex-mist={!page.url.pathname.startsWith('/winrates')}
        >
          Win rates
        </a>
        <a
          href="https://developer.riotgames.com/docs/lol#data-dragon"
          target="_blank"
          rel="noreferrer noopener"
          class="font-display text-xs uppercase tracking-widest text-hex-mist hover:text-hex-gold"
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
