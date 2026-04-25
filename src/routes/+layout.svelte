<script lang="ts">
  import '../app.css';
  import Footer from '$lib/components/Footer.svelte';
  import { page } from '$app/state';

  let { children } = $props();
</script>

<svelte:head>
  <meta name="description" content="Browse every League of Legends champion with up-to-date stats, abilities, lore, and skin splash art. Server-rendered and always on the latest patch." />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="League Champ Builds" />
  <meta property="og:url" content={page.url.href} />
  <meta property="twitter:card" content="summary_large_image" />
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
      <nav class="text-sm">
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
