<script lang="ts">
  import AbilityContainer from '$lib/components/AbilityContainer.svelte';
  import DifficultyBar from '$lib/components/DifficultyBar.svelte';
  import SkinCarousel from '$lib/components/SkinCarousel.svelte';
  import StatRow from '$lib/components/StatRow.svelte';
  import { displayName } from '$lib/utils';
  import { splashArt } from '$lib/ddragon';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  const c = $derived(data.champion);
  const name = $derived(displayName(c.id, c.name));
  const splash = $derived(splashArt(c.id, 0));
  const description = $derived(
    `${c.lore.slice(0, 200)}${c.lore.length > 200 ? '…' : ''}`
  );
</script>

<svelte:head>
  <title>{name}, {c.title} — League Champ Builds</title>
  <meta name="description" content={description} />
  <meta property="og:title" content="{name} — {c.title}" />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={splash} />
  <meta property="twitter:image" content={splash} />
</svelte:head>

<article class="relative">
  <div
    class="absolute inset-x-0 top-0 -z-10 h-[60vh] bg-cover bg-center"
    style:background-image="url({splash})"
    aria-hidden="true"
  >
    <div class="absolute inset-0 bg-gradient-to-b from-hex-void/40 via-hex-void/80 to-hex-void"></div>
  </div>

  <div class="mx-auto max-w-6xl px-4 py-6 md:px-8">
    <a href="/" class="hex-button mb-6 !py-1.5 text-xs">← All champions</a>

    <header class="mb-8 space-y-2 text-center">
      <p class="font-display text-xs uppercase tracking-[0.4em] text-hex-cyan">
        {c.tags.join(' · ')}
      </p>
      <h1 class="font-display text-4xl uppercase tracking-widest text-hex-goldHi md:text-6xl">
        {name}
      </h1>
      <p class="font-display text-lg italic text-hex-gold">{c.title}</p>
    </header>

    <div class="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div class="space-y-6">
        <SkinCarousel championId={c.id} championName={name} skins={c.skins} />

        <section class="hex-frame rounded-md p-5">
          <h2 class="mb-3 font-display text-xl uppercase tracking-widest text-hex-gold">Lore</h2>
          <p class="text-sm leading-relaxed text-hex-parchment/90">{c.lore}</p>
        </section>

        <AbilityContainer
          version={data.version}
          passive={c.passive}
          spells={c.spells}
          partype={c.partype}
        />

        {#if c.allytips.length > 0 || c.enemytips.length > 0}
          <section class="grid gap-4 md:grid-cols-2">
            {#if c.allytips.length > 0}
              <div class="hex-frame rounded-md p-5">
                <h3 class="mb-3 font-display text-base uppercase tracking-widest text-hex-cyan">
                  Playing as {name}
                </h3>
                <ul class="space-y-2 text-sm text-hex-parchment/90">
                  {#each c.allytips as tip (tip)}
                    <li class="flex gap-2">
                      <span class="mt-1 text-hex-cyan" aria-hidden="true">▸</span>
                      <span>{tip}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
            {#if c.enemytips.length > 0}
              <div class="hex-frame rounded-md p-5">
                <h3 class="mb-3 font-display text-base uppercase tracking-widest text-rose-400">
                  Playing against {name}
                </h3>
                <ul class="space-y-2 text-sm text-hex-parchment/90">
                  {#each c.enemytips as tip (tip)}
                    <li class="flex gap-2">
                      <span class="mt-1 text-rose-400" aria-hidden="true">▸</span>
                      <span>{tip}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </section>
        {/if}
      </div>

      <aside class="space-y-6">
        <section class="hex-frame rounded-md p-5">
          <h2 class="mb-4 font-display text-xl uppercase tracking-widest text-hex-gold">Profile</h2>
          <div class="space-y-4">
            <DifficultyBar label="Attack" value={c.info.attack} />
            <DifficultyBar label="Defense" value={c.info.defense} />
            <DifficultyBar label="Magic" value={c.info.magic} />
            <DifficultyBar label="Difficulty" value={c.info.difficulty} />
          </div>
        </section>

        <section class="hex-frame rounded-md p-5">
          <h2 class="mb-3 font-display text-xl uppercase tracking-widest text-hex-gold">Stats</h2>
          <p class="mb-3 font-mono text-xs text-hex-mist">Base → Level 18</p>
          <div class="space-y-0.5">
            <StatRow label="Health" base={c.stats.hp} perLevel={c.stats.hpperlevel} />
            <StatRow label="Health Regen" base={c.stats.hpregen} perLevel={c.stats.hpregenperlevel} />
            <StatRow label={c.partype} base={c.stats.mp} perLevel={c.stats.mpperlevel} />
            <StatRow label="Armor" base={c.stats.armor} perLevel={c.stats.armorperlevel} />
            <StatRow label="Magic Resist" base={c.stats.spellblock} perLevel={c.stats.spellblockperlevel} />
            <StatRow label="Attack Damage" base={c.stats.attackdamage} perLevel={c.stats.attackdamageperlevel} />
            <StatRow label="Attack Range" base={c.stats.attackrange} />
            <StatRow label="Move Speed" base={c.stats.movespeed} />
          </div>
        </section>
      </aside>
    </div>
  </div>
</article>
