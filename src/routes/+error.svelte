<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.status} — League Champ Builds</title>
</svelte:head>

<section class="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
  <p class="font-display text-7xl text-hex-gold">{page.status}</p>
  <h1 class="font-display text-2xl uppercase tracking-widest text-hex-goldHi">
    {page.error?.message ?? 'Something went wrong'}
  </h1>
  <a href="/" class="hex-button mt-4">Back to champions</a>
</section>
