<script lang="ts">
  import {
    displayRole,
    rolesByPopularity,
    type ChampionBuildStats,
    type ItemEntry
  } from '$lib/build-aggregator';
  import type { ChampionSpell, Item, Rune, RuneStyle, SummonerSpell } from '$lib/types';
  import { itemIcon, runeIcon, spellIcon } from '$lib/ddragon';
  import { skillSlotLabel, statShardLabel, tierSourceLabel } from '$lib/utils';
  import SampleDataNotice from './SampleDataNotice.svelte';

  interface Props {
    version: string;
    build: ChampionBuildStats;
    patch: string;
    generatedAt: string;
    tiers?: string[];
    /** Champion's Q/W/E/R spells, in slot order. */
    championSpells: ChampionSpell[];
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
    championSpells,
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
  /** Every rune across every tree+slot, indexed by id. */
  const runesById = $derived(
    Object.fromEntries(
      runeStyles.flatMap((s) => s.slots.flatMap((slot) => slot.runes)).map((r) => [r.id, r])
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

  /** Min pickrate for an alternative to show alongside the top pick at a slot.
   * Top pick always shows; alternatives below this threshold are dropped as noise. */
  const ALT_PICKRATE_THRESHOLD = 0.1;
  const MAX_ALTS_PER_SLOT = 3;

  /** Top-N entries per slot (with the alt threshold applied), ignoring empty slots.
   * Falls back to popularity ranking for old builds.json files that don't have itemPath. */
  const pathPerSlot = $derived.by<ItemEntry[][]>(() => {
    if (!roleData) return [];
    const path = roleData.itemPath ?? [];
    const fromPath = path
      .map((slot) => {
        if (slot.length === 0) return [];
        const top = slot[0]!;
        const alts = slot
          .slice(1, MAX_ALTS_PER_SLOT)
          .filter((e) => e.pickRate >= ALT_PICKRATE_THRESHOLD);
        return [top, ...alts];
      })
      .filter((slot) => slot.length > 0);
    if (fromPath.length > 0) return fromPath;
    return fallbackLegendaries(roleData.topItems ?? []).map((e) => [e]);
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

  <SampleDataNotice />

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

    {#if pathPerSlot.length > 0 || topBoots}
      <h3 class="mb-3 font-display text-sm uppercase tracking-widest text-hex-cyan">
        Build path
      </h3>
      <ol
        class="mb-2 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-stretch md:gap-2.5"
      >
        {#if topBoots}
          {@const meta = items[String(topBoots.itemId)]}
          <li
            class="rounded border border-hex-border/60 bg-hex-void/30 p-2.5 md:min-w-[180px] md:flex-1 md:basis-[180px]"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="font-display text-[11px] uppercase tracking-widest text-hex-cyan">
                Boots
              </span>
              <span class="font-mono text-[10px] text-hex-mist/70">any step</span>
            </div>
            <div
              class="flex items-center gap-3"
              title={meta?.name
                ? `${meta.name} — ${(topBoots.winrate * 100).toFixed(1)}% wr`
                : `${(topBoots.winrate * 100).toFixed(1)}% wr`}
            >
              <img
                src={itemIcon(version, topBoots.itemId)}
                alt={meta?.name ?? `Item ${topBoots.itemId}`}
                width="44"
                height="44"
                class="shrink-0 rounded border border-hex-gold/40 bg-hex-void/40"
                loading="lazy"
              />
              <div class="min-w-0 flex-1">
                <div class="font-display text-sm leading-tight text-hex-goldHi">
                  {meta?.name ?? `#${topBoots.itemId}`}
                </div>
                <div class="mt-0.5 font-mono text-[11px] text-hex-mist">
                  {(topBoots.pickRate * 100).toFixed(0)}% pick · {(
                    topBoots.winrate * 100
                  ).toFixed(1)}% wr
                </div>
              </div>
            </div>
          </li>
        {/if}

        {#each pathPerSlot as slot, slotIdx (slotIdx)}
          <li
            class="rounded border border-hex-border/60 bg-hex-void/30 p-2.5 md:min-w-[180px] md:flex-1 md:basis-[180px]"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="font-display text-[11px] uppercase tracking-widest text-hex-cyan">
                Item {slotIdx + 1}
              </span>
              {#if slot.length > 1}
                <span class="font-mono text-[10px] text-hex-mist/70">
                  {slot.length} options
                </span>
              {/if}
            </div>
            <ul class="flex flex-col gap-1.5">
              {#each slot as entry, altIdx (entry.itemId)}
                {@const meta = items[String(entry.itemId)]}
                {@const isPrimary = altIdx === 0}
                <li
                  class="flex items-center gap-3"
                  title={meta?.name
                    ? `${meta.name} — ${(entry.winrate * 100).toFixed(1)}% wr`
                    : `${(entry.winrate * 100).toFixed(1)}% wr`}
                >
                  <img
                    src={itemIcon(version, entry.itemId)}
                    alt={meta?.name ?? `Item ${entry.itemId}`}
                    width={isPrimary ? 44 : 32}
                    height={isPrimary ? 44 : 32}
                    class="shrink-0 rounded border bg-hex-void/40 {isPrimary
                      ? 'border-hex-gold/40'
                      : 'ml-3 border-hex-border/60 opacity-80'}"
                    loading="lazy"
                  />
                  <div class="min-w-0 flex-1">
                    <div
                      class="font-display leading-tight {isPrimary
                        ? 'text-sm text-hex-goldHi'
                        : 'text-xs text-hex-parchment/80'}"
                    >
                      {#if !isPrimary}
                        <span class="mr-1 text-hex-mist/60">or</span>
                      {/if}
                      {meta?.name ?? `#${entry.itemId}`}
                    </div>
                    <div class="mt-0.5 font-mono text-[11px] text-hex-mist">
                      {(entry.pickRate * 100).toFixed(0)}% pick · {(entry.winrate * 100).toFixed(
                        1
                      )}% wr
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          </li>
        {/each}
      </ol>
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

    {@const skillOrder = roleData.skillOrder ?? []}
    {#if skillOrder.some((s) => s.slot > 0)}
      <h3 class="mb-2 font-display text-sm uppercase tracking-widest text-hex-cyan">
        Skill order
      </h3>
      <div class="mb-5 overflow-x-auto">
        <div
          class="grid items-center gap-0.5 text-center"
          style="grid-template-columns: auto repeat(18, minmax(1.4rem, 1fr));"
        >
          <div></div>
          {#each Array(18) as _, idx (idx)}
            <div class="font-mono text-[9px] text-hex-mist/60">{idx + 1}</div>
          {/each}

          {#each [1, 2, 3, 4] as slot (slot)}
            {@const spell = championSpells[slot - 1]}
            <div class="flex items-center gap-1.5 pr-2">
              {#if spell}
                <img
                  src={spellIcon(version, spell.image.full)}
                  alt={spell.name}
                  width="22"
                  height="22"
                  class="rounded-sm border border-hex-gold/30"
                  loading="lazy"
                />
              {/if}
              <span class="font-display text-[11px] font-bold text-hex-gold">
                {skillSlotLabel(slot)}
              </span>
            </div>
            {#each skillOrder as pick, level (level)}
              {@const active = pick.slot === slot}
              <div
                class={active
                  ? 'flex h-6 items-center justify-center rounded-sm border border-hex-gold bg-hex-gold/10 font-display text-[10px] font-bold text-hex-goldHi'
                  : 'flex h-6 items-center justify-center rounded-sm border border-hex-border/40 text-transparent'}
                title={active ? `${spell?.name ?? skillSlotLabel(slot)} — Lv ${level + 1}` : ''}
              >
                {active ? level + 1 : ''}
              </div>
            {/each}
          {/each}
        </div>
      </div>
    {/if}

    {#if topRune}
      {@const primary = stylesById[topRune.primaryStyle]}
      {@const sub = stylesById[topRune.subStyle]}
      {@const primaryPicks = new Set([topRune.keystone, ...(topRune.primaryMinors ?? [])])}
      {@const subPicks = new Set(topRune.subRunes ?? [])}
      <div class="mb-2 flex items-baseline justify-between">
        <h3 class="font-display text-sm uppercase tracking-widest text-hex-cyan">Runes</h3>
        <div class="font-mono text-[11px] text-hex-mist">
          {runePickRate.toFixed(0)}% · {(topRune.winrate * 100).toFixed(1)}% wr
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        {#if primary}
          <div class="hex-frame rounded-md p-3">
            <header class="mb-2 flex items-center gap-2">
              <img src={runeIcon(primary.icon)} alt={primary.name} width="22" height="22" loading="lazy" />
              <span class="font-display text-xs uppercase tracking-widest text-hex-goldHi">
                {primary.name}
              </span>
            </header>
            {#each primary.slots as slot, slotIdx (slotIdx)}
              <div class="mb-1.5 flex items-center justify-around gap-1">
                {#each slot.runes as r (r.id)}
                  {@const picked = primaryPicks.has(r.id)}
                  {@const big = slotIdx === 0}
                  <div
                    class={picked
                      ? 'rune-cell rune-on'
                      : 'rune-cell rune-off'}
                    title={r.name + (picked ? ' — selected' : '')}
                  >
                    <img
                      src={runeIcon(r.icon)}
                      alt={r.name}
                      width={big ? 36 : 26}
                      height={big ? 36 : 26}
                      class="rounded-full"
                      loading="lazy"
                    />
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        {/if}

        {#if sub}
          <div class="hex-frame rounded-md p-3">
            <header class="mb-2 flex items-center gap-2">
              <img src={runeIcon(sub.icon)} alt={sub.name} width="22" height="22" loading="lazy" />
              <span class="font-display text-xs uppercase tracking-widest text-hex-cyan">
                {sub.name}
              </span>
            </header>
            <!-- secondary tree shows slots 1-3 (no keystone row) -->
            {#each sub.slots.slice(1) as slot, slotIdx (slotIdx)}
              <div class="mb-1.5 flex items-center justify-around gap-1">
                {#each slot.runes as r (r.id)}
                  {@const picked = subPicks.has(r.id)}
                  <div
                    class={picked
                      ? 'rune-cell rune-on'
                      : 'rune-cell rune-off'}
                    title={r.name + (picked ? ' — selected' : '')}
                  >
                    <img
                      src={runeIcon(r.icon)}
                      alt={r.name}
                      width="26"
                      height="26"
                      class="rounded-full"
                      loading="lazy"
                    />
                  </div>
                {/each}
              </div>
            {/each}

            {#if (topRune.statShards ?? []).some((id) => id > 0)}
              <div class="mt-3 border-t border-hex-border/60 pt-2">
                <p class="mb-1 font-display text-[10px] uppercase tracking-widest text-hex-mist">
                  Stat shards
                </p>
                <ul class="space-y-0.5 font-mono text-[11px] text-hex-parchment/90">
                  {#each topRune.statShards as shardId, idx (idx)}
                    {@const labels = ['Offense', 'Flex', 'Defense']}
                    <li>
                      <span class="text-hex-mist">{labels[idx]}:</span>
                      {statShardLabel(shardId)}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</section>

<style>
  .rune-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    padding: 2px;
    transition: opacity 150ms, box-shadow 150ms;
  }

  .rune-on {
    box-shadow: 0 0 0 2px theme('colors.hex.gold'), 0 0 12px theme('colors.hex.gold' / 50%);
    background-color: rgba(200, 170, 110, 0.12);
  }

  .rune-off {
    opacity: 0.32;
    filter: grayscale(0.55);
  }

  .rune-off:hover {
    opacity: 0.55;
    filter: grayscale(0.2);
  }
</style>
