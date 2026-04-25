<script lang="ts">
  import type { ChampionPassive, ChampionSpell } from '$lib/types';
  import { passiveIcon, spellIcon } from '$lib/ddragon';

  interface Props {
    version: string;
    passive: ChampionPassive;
    spells: ChampionSpell[];
    partype: string;
  }

  let { version, passive, spells, partype }: Props = $props();

  const slotKeys = ['Q', 'W', 'E', 'R'];
</script>

<section class="space-y-4">
  <h2 class="font-display text-2xl uppercase tracking-widest text-hex-gold">Abilities</h2>

  <article class="hex-frame flex flex-col gap-4 rounded-md p-4 sm:flex-row sm:items-start">
    <div class="flex shrink-0 items-center gap-3">
      <div class="relative">
        <img
          src={passiveIcon(version, passive.image.full)}
          alt="{passive.name} passive icon"
          class="h-16 w-16 rounded-sm border border-hex-gold/60 bg-hex-void"
          loading="lazy"
        />
        <span
          class="absolute -top-2 -left-2 rounded-sm border border-hex-gold bg-hex-void px-1.5 py-0.5 font-display text-xs uppercase tracking-wider text-hex-gold"
        >
          Passive
        </span>
      </div>
      <h3 class="font-display text-lg text-hex-goldHi sm:hidden">{passive.name}</h3>
    </div>
    <div class="min-w-0 flex-1 space-y-1">
      <h3 class="hidden font-display text-lg text-hex-goldHi sm:block">{passive.name}</h3>
      <p class="ddragon-html text-sm leading-relaxed text-hex-parchment/90">
        {@html passive.description}
      </p>
    </div>
  </article>

  <div class="grid gap-4 md:grid-cols-2">
    {#each spells as spell, i (spell.id)}
      <article class="hex-frame flex flex-col gap-3 rounded-md p-4">
        <header class="flex items-start gap-3">
          <div class="relative shrink-0">
            <img
              src={spellIcon(version, spell.image.full)}
              alt="{spell.name} icon"
              class="h-14 w-14 rounded-sm border border-hex-gold/60 bg-hex-void"
              loading="lazy"
            />
            <span
              class="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-sm border border-hex-gold bg-hex-void font-display text-xs font-bold text-hex-gold"
            >
              {slotKeys[i] ?? ''}
            </span>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-display text-base text-hex-goldHi">{spell.name}</h3>
            <div class="mt-1 flex flex-wrap gap-2 text-xs text-hex-mist">
              <span><span class="text-hex-gold">CD:</span> {spell.cooldownBurn}s</span>
              {#if spell.costBurn && spell.costBurn !== '0'}
                <span>
                  <span class="text-hex-gold">Cost:</span> {spell.costBurn} {partype}
                </span>
              {/if}
              {#if spell.rangeBurn && spell.rangeBurn !== '0' && spell.rangeBurn !== 'self'}
                <span><span class="text-hex-gold">Range:</span> {spell.rangeBurn}</span>
              {/if}
            </div>
          </div>
        </header>
        <p class="ddragon-html text-sm leading-relaxed text-hex-parchment/90">
          {@html spell.description}
        </p>
      </article>
    {/each}
  </div>
</section>
