<script lang="ts">
  import AbilityContainer from '$lib/components/AbilityContainer.svelte';
  import BuildRecommendation from '$lib/components/BuildRecommendation.svelte';
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

  type Tab = 'build' | 'champion';
  let activeTab = $state<Tab>('build');
</script>

<svelte:head>
  <title>{name}, {c.title} — League Champ Builds</title>
  <meta name="description" content={description} />
  <meta property="og:title" content="{name} — {c.title}" />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={splash} />
  <meta property="twitter:image" content={splash} />
</svelte:head>

<div
  class="splash-watermark"
  style:background-image="url({splash})"
  aria-hidden="true"
></div>

<article class="relative">
  <header class="relative isolate overflow-hidden">
    <div
      class="absolute inset-0 -z-10 bg-cover bg-center"
      style:background-image="url({splash})"
      aria-hidden="true"
    ></div>
    <div
      class="absolute inset-0 -z-10 bg-gradient-to-b from-hex-void/30 via-hex-void/70 to-hex-void"
      aria-hidden="true"
    ></div>
    <div
      class="absolute inset-y-0 left-0 -z-10 w-1/3 bg-gradient-to-r from-hex-void/80 to-transparent"
      aria-hidden="true"
    ></div>
    <div
      class="absolute inset-y-0 right-0 -z-10 w-1/3 bg-gradient-to-l from-hex-void/80 to-transparent"
      aria-hidden="true"
    ></div>

    <div class="mx-auto max-w-6xl px-4 pt-6 pb-16 md:px-8 md:pt-8 md:pb-24">
      <a href="/" class="hex-button mb-10 !py-1.5 text-xs">← All champions</a>

      <div class="space-y-3 text-center">
        <p class="font-display text-xs uppercase tracking-[0.4em] text-hex-cyan drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {c.tags.join(' · ')}
        </p>
        <h1
          class="font-display text-5xl uppercase tracking-widest text-hex-goldHi drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] md:text-7xl"
        >
          {name}
        </h1>
        <p class="font-display text-lg italic text-hex-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] md:text-xl">
          {c.title}
        </p>
      </div>
    </div>
  </header>

  <div class="relative mx-auto max-w-6xl px-4 pb-12 md:px-8">
    <div
      role="tablist"
      aria-label="Champion sections"
      class="-mt-8 mb-6 grid grid-cols-2 overflow-hidden rounded-md border border-hex-gold/40 bg-hex-panel/90 shadow-hex backdrop-blur-md"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'build'}
        aria-controls="tab-build"
        id="tab-build-trigger"
        onclick={() => (activeTab = 'build')}
        class="tab-btn"
        class:tab-active={activeTab === 'build'}
      >
        <span class="flex items-center justify-center gap-2">
          <span aria-hidden="true">⚔</span>
          Build &amp; Stats
        </span>
        {#if activeTab === 'build'}
          <span class="tab-indicator" aria-hidden="true"></span>
        {/if}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'champion'}
        aria-controls="tab-champion"
        id="tab-champion-trigger"
        onclick={() => (activeTab = 'champion')}
        class="tab-btn border-l border-hex-border"
        class:tab-active={activeTab === 'champion'}
      >
        <span class="flex items-center justify-center gap-2">
          <span aria-hidden="true">✦</span>
          Abilities &amp; Lore
        </span>
        {#if activeTab === 'champion'}
          <span class="tab-indicator" aria-hidden="true"></span>
        {/if}
      </button>
    </div>

    {#if activeTab === 'build'}
      <div
        id="tab-build"
        role="tabpanel"
        aria-labelledby="tab-build-trigger"
        class="grid gap-6 lg:grid-cols-[3fr_2fr]"
      >
        <div class="space-y-6">
          {#if data.build}
            <BuildRecommendation
              version={data.version}
              build={data.build}
              patch={data.buildsMeta.patch}
              generatedAt={data.buildsMeta.generatedAt}
              tiers={data.buildsMeta.tiers}
              summonerSpells={data.summonerSpells}
              runeStyles={data.runeStyles}
              items={data.items}
            />
          {:else}
            <section class="hex-frame rounded-md p-5">
              <h2 class="mb-2 font-display text-xl uppercase tracking-widest text-hex-gold">
                Recommended Build
              </h2>
              <p class="text-sm text-hex-mist">
                No build data available for this champion yet.
              </p>
            </section>
          {/if}
        </div>

        <aside class="space-y-6">
          <section class="hex-frame rounded-md p-5">
            <h2 class="mb-4 font-display text-xl uppercase tracking-widest text-hex-gold">
              Profile
            </h2>
            <div class="space-y-4">
              <DifficultyBar label="Attack" value={c.info.attack} />
              <DifficultyBar label="Defense" value={c.info.defense} />
              <DifficultyBar label="Magic" value={c.info.magic} />
              <DifficultyBar label="Difficulty" value={c.info.difficulty} />
            </div>
          </section>

          <section class="hex-frame rounded-md p-5">
            <h2 class="mb-3 font-display text-xl uppercase tracking-widest text-hex-gold">
              Stats
            </h2>
            <p class="mb-3 font-mono text-xs text-hex-mist">Base → Level 18</p>
            <div class="space-y-0.5">
              <StatRow label="Health" base={c.stats.hp} perLevel={c.stats.hpperlevel} />
              <StatRow
                label="Health Regen"
                base={c.stats.hpregen}
                perLevel={c.stats.hpregenperlevel}
              />
              <StatRow label={c.partype} base={c.stats.mp} perLevel={c.stats.mpperlevel} />
              <StatRow label="Armor" base={c.stats.armor} perLevel={c.stats.armorperlevel} />
              <StatRow
                label="Magic Resist"
                base={c.stats.spellblock}
                perLevel={c.stats.spellblockperlevel}
              />
              <StatRow
                label="Attack Damage"
                base={c.stats.attackdamage}
                perLevel={c.stats.attackdamageperlevel}
              />
              <StatRow label="Attack Range" base={c.stats.attackrange} />
              <StatRow label="Move Speed" base={c.stats.movespeed} />
            </div>
          </section>
        </aside>
      </div>
    {:else}
      <div
        id="tab-champion"
        role="tabpanel"
        aria-labelledby="tab-champion-trigger"
        class="space-y-6"
      >
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
    {/if}
  </div>
</article>

<style>
  .splash-watermark {
    position: fixed;
    inset: 0;
    z-index: -10;
    background-size: cover;
    background-position: center;
    opacity: 0.18;
    filter: blur(6px) saturate(1.1);
    pointer-events: none;
  }

  .splash-watermark::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(1, 10, 19, 0.7),
      rgba(1, 10, 19, 0.92)
    );
  }

  .tab-btn {
    position: relative;
    padding: 0.85rem 1rem;
    font-family: theme('fontFamily.display');
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: theme('colors.hex.mist');
    transition: color 200ms, background-color 200ms;
  }

  @media (min-width: 768px) {
    .tab-btn {
      font-size: 1rem;
    }
  }

  .tab-btn:hover {
    color: theme('colors.hex.gold');
  }

  .tab-btn.tab-active {
    color: theme('colors.hex.goldHi');
    background-color: rgba(200, 170, 110, 0.08);
  }

  .tab-indicator {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    height: 2px;
    background-color: theme('colors.hex.gold');
  }
</style>
