<script lang="ts">
  import {
    displayRole,
    rolesByPopularity,
    type ChampionBuildStats,
    type ItemEntry
  } from '$lib/build-aggregator';
  import type { Item, Rune, RuneStyle, SummonerSpell } from '$lib/types';
  import { itemIcon, runeIcon, spellIcon } from '$lib/ddragon';
  import { tierSourceLabel } from '$lib/utils';

  interface Props {
    version: string;
    build: ChampionBuildStats;
    patch: string;
    generatedAt: string;
    tiers?: string[];
    summonerSpells: Record<number, SummonerSpell>;
    runeStyles: RuneStyle[];
    items: Record<string, Item>;
  }

  let {
    version,
    build,
    patch,
    generatedAt,
    tiers = [],
    summonerSpells,
    runeStyles,
    items
  }: Props = $props();

  const tierLabel = $derived(tierSourceLabel(tiers));

  /** Fallback for old builds.json without itemPath: pick top terminal items by pickrate.
   * Boots are shown separately, so we exclude them here. */
  function fallbackLegendaries(entries: ItemEntry[]): ItemEntry[] {
    return entries
      .filter((e) => {
        const item = items[String(e.itemId)];
        if (!item) return false;
        if (!item.gold.purchasable) return false;
        if ((item.into?.length ?? 0) > 0) return false;
        if (item.tags.includes('Trinket')) return false;
        if (item.tags.includes('Consumable')) return false;
        if (item.tags.includes('Vision')) return false;
        if (item.tags.includes('Boots')) return false;
        return true;
      })
      .slice(0, 4);
  }

  const roleOrder = $derived(rolesByPopularity(build.byRole ?? {}));
  let selectedRole = $state<string | null>(null);
  const activeRole = $derived(selectedRole ?? roleOrder[0] ?? null);
  const roleData = $derived(activeRole ? build.byRole?.[activeRole] : undefined);

  const stylesById = $derived(
    Object.fromEntries(runeStyles.map((s) => [s.id, s])) as Record<number, RuneStyle>
  );
  const keystonesById = $derived(
    Object.fromEntries(
      runeStyles.flatMap((s) => s.slots[0]?.runes ?? []).map((r) => [r.id, r])
    ) as Record<number, Rune>
  );

  const lastUpdated = $derived(new Date(generatedAt).toLocaleDateString());
  const topRune = $derived(roleData?.topRunes[0]);
  const topSpells = $derived(roleData?.topSummonerSpells[0]);
  const runePickRate = $derived(
    topRune && roleData ? (topRune.count / roleData.games) * 100 : 0
  );
  const spellsPickRate = $derived(
    topSpells && roleData ? (topSpells.count / roleData.games) * 100 : 0
  );

  /** First entry per slot, ignoring empty slots. Falls back to popularity ranking
   * for old builds.json files that don't have itemPath yet. */
  const pathTopPerSlot = $derived.by<ItemEntry[]>(() => {
    if (!roleData) return [];
    const path = roleData.itemPath ?? [];
    const fromPath = path.map((slot) => slot[0]).filter((e): e is ItemEntry => e != null);
    if (fromPath.length > 0) return fromPath;
    return fallbackLegendaries(roleData.topItems ?? []);
  });

  const topBoots = $derived(roleData?.topBoots?.[0]);
  const hasTimelinePath = $derived((roleData?.itemPath?.length ?? 0) > 0);
</script>

<section class="hex-frame rounded-md p-5">
  <h2 class="mb-1 font-display text-xl uppercase tracking-widest text-hex-gold">
    Recommended Build
  </h2>
  <p class="mb-3 text-xs text-hex-mist">
    Patch {patch}
    {#if tierLabel}
      · <span class="text-hex-cyan">{tierLabel}</span> Solo Queue
    {/if}
    · Updated {lastUpdated}
  </p>

  {#if roleOrder.length === 0 || !roleData || !activeRole}
    <p class="text-sm text-hex-mist">Not enough sample data for this champion yet.</p>
  {:else}
    <div class="mb-4 flex flex-wrap gap-1">
      {#each roleOrder as role (role)}
        <button
          type="button"
          onclick={() => (selectedRole = role)}
          class="rounded border px-2 py-1 font-display text-[11px] uppercase tracking-widest transition-colors"
          class:border-hex-gold={role === activeRole}
          class:text-hex-gold={role === activeRole}
          class:border-hex-border={role !== activeRole}
          class:text-hex-mist={role !== activeRole}
          class:hover:text-hex-gold={role !== activeRole}
        >
          {displayRole(role)}
        </button>
      {/each}
    </div>

    <p class="mb-4 font-mono text-xs text-hex-mist">
      <span class="text-hex-cyan">{(roleData.winrate * 100).toFixed(1)}%</span> wr in {displayRole(
        activeRole
      )}
    </p>

    {#if pathTopPerSlot.length > 0 || topBoots}
      <h3 class="mb-2 font-display text-sm uppercase tracking-widest text-hex-cyan">
        Build path
      </h3>
      <div class="mb-2 flex flex-wrap items-start gap-x-1 gap-y-3">
        {#if topBoots}
          {@const meta = items[String(topBoots.itemId)]}
          <div
            class="flex w-16 flex-col items-center"
            title={meta?.name
              ? `${meta.name} — ${(topBoots.winrate * 100).toFixed(1)}% wr`
              : `${(topBoots.winrate * 100).toFixed(1)}% wr`}
          >
            <span class="mb-1 font-display text-[10px] uppercase tracking-widest text-hex-mist">
              Boots
            </span>
            <img
              src={itemIcon(version, topBoots.itemId)}
              alt={meta?.name ?? `Item ${topBoots.itemId}`}
              width="48"
              height="48"
              class="rounded border border-hex-gold/40 bg-hex-void/40"
              loading="lazy"
            />
            <span
              class="mt-1 line-clamp-2 text-center font-display text-[11px] leading-tight text-hex-goldHi"
            >
              {meta?.name ?? `#${topBoots.itemId}`}
            </span>
            <span class="mt-0.5 font-mono text-[11px] text-hex-mist">
              {(topBoots.pickRate * 100).toFixed(0)}%
            </span>
          </div>
          {#if pathTopPerSlot.length > 0}
            <span class="mt-7 px-1 text-hex-mist/60" aria-hidden="true">|</span>
          {/if}
        {/if}

        {#each pathTopPerSlot as entry, idx (idx)}
          {@const meta = items[String(entry.itemId)]}
          <div
            class="flex w-16 flex-col items-center"
            title={meta?.name
              ? `${meta.name} — ${(entry.winrate * 100).toFixed(1)}% wr`
              : `${(entry.winrate * 100).toFixed(1)}% wr`}
          >
            <span class="mb-1 font-display text-[10px] uppercase tracking-widest text-hex-mist">
              {idx + 1}
              {#if idx === 0}st{:else if idx === 1}nd{:else if idx === 2}rd{:else}th{/if}
            </span>
            <img
              src={itemIcon(version, entry.itemId)}
              alt={meta?.name ?? `Item ${entry.itemId}`}
              width="48"
              height="48"
              class="rounded border border-hex-gold/40 bg-hex-void/40"
              loading="lazy"
            />
            <span
              class="mt-1 line-clamp-2 text-center font-display text-[11px] leading-tight text-hex-goldHi"
            >
              {meta?.name ?? `#${entry.itemId}`}
            </span>
            <span class="mt-0.5 font-mono text-[11px] text-hex-mist">
              {(entry.pickRate * 100).toFixed(0)}%
            </span>
          </div>
          {#if idx < pathTopPerSlot.length - 1}
            <span class="mt-7 text-hex-gold/70" aria-hidden="true">→</span>
          {/if}
        {/each}
      </div>
      {#if !hasTimelinePath}
        <p class="mb-4 font-mono text-[10px] italic text-hex-mist/70">
          Order inferred from popularity — refresh build data for purchase-order timeline.
        </p>
      {:else}
        <p class="mb-4 font-mono text-[10px] text-hex-mist/70">
          Most-built legendary at each step (purchase order).
        </p>
      {/if}
    {/if}

    {#if topSpells}
      {@const s1 = summonerSpells[topSpells.spell1]}
      {@const s2 = summonerSpells[topSpells.spell2]}
      <h3 class="mb-2 font-display text-sm uppercase tracking-widest text-hex-cyan">
        Summoner spells
      </h3>
      <div class="mb-5 flex items-center gap-3">
        {#if s1}
          <img
            src={spellIcon(version, s1.image.full)}
            alt={s1.name}
            width="40"
            height="40"
            class="rounded border border-hex-gold/30"
            loading="lazy"
          />
        {/if}
        <span class="text-sm text-hex-parchment/90">{s1?.name ?? `#${topSpells.spell1}`}</span>
        <span class="text-hex-mist">+</span>
        {#if s2}
          <img
            src={spellIcon(version, s2.image.full)}
            alt={s2.name}
            width="40"
            height="40"
            class="rounded border border-hex-gold/30"
            loading="lazy"
          />
        {/if}
        <span class="text-sm text-hex-parchment/90">{s2?.name ?? `#${topSpells.spell2}`}</span>
        <span class="ml-auto font-mono text-[11px] text-hex-mist">
          {spellsPickRate.toFixed(0)}% · {(topSpells.winrate * 100).toFixed(1)}% wr
        </span>
      </div>
    {/if}

    {#if topRune}
      {@const primary = stylesById[topRune.primaryStyle]}
      {@const sub = stylesById[topRune.subStyle]}
      {@const keystone = keystonesById[topRune.keystone]}
      <h3 class="mb-2 font-display text-sm uppercase tracking-widest text-hex-cyan">Runes</h3>
      <div class="flex items-center gap-3">
        {#if keystone}
          <img
            src={runeIcon(keystone.icon)}
            alt={keystone.name}
            width="48"
            height="48"
            class="rounded-full border border-hex-gold/30 bg-hex-void/40"
            loading="lazy"
          />
        {/if}
        <div class="flex-1 text-sm">
          <div class="text-hex-parchment/90">
            {keystone?.name ?? `Keystone #${topRune.keystone}`}
          </div>
          <div class="flex items-center gap-1.5 text-xs text-hex-mist">
            {#if primary}
              <img
                src={runeIcon(primary.icon)}
                alt={primary.name}
                width="14"
                height="14"
                loading="lazy"
              />
            {/if}
            <span>{primary?.name ?? `#${topRune.primaryStyle}`}</span>
            <span class="text-hex-mist/60">+</span>
            {#if sub}
              <img src={runeIcon(sub.icon)} alt={sub.name} width="14" height="14" loading="lazy" />
            {/if}
            <span>{sub?.name ?? `#${topRune.subStyle}`}</span>
          </div>
        </div>
        <div class="text-right font-mono text-[11px] text-hex-mist">
          <div>{runePickRate.toFixed(0)}%</div>
          <div>{(topRune.winrate * 100).toFixed(1)}% wr</div>
        </div>
      </div>
    {/if}
  {/if}
</section>
