<script lang="ts">
  import { displayRole } from '$lib/build-aggregator';
  import { squareIcon } from '$lib/ddragon';
  import { displayName } from '$lib/utils';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  type RoleKey = 'ALL' | 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';
  const ROLES: Array<{ key: RoleKey; label: string }> = [
    { key: 'ALL', label: 'All' },
    { key: 'TOP', label: 'Top' },
    { key: 'JUNGLE', label: 'Jungle' },
    { key: 'MIDDLE', label: 'Mid' },
    { key: 'BOTTOM', label: 'Bot' },
    { key: 'UTILITY', label: 'Support' }
  ];

  const MIN_GAMES = 10;

  let selectedRole = $state<RoleKey>('ALL');

  const rows = $derived.by(() => {
    return data.champions
      .map((c) => {
        const build = data.builds.champions[c.id];
        if (!build) return null;

        if (selectedRole === 'ALL') {
          if (build.games < MIN_GAMES) return null;
          return { champion: c, winrate: build.winrate, games: build.games };
        }

        const roleStats = build.byRole?.[selectedRole];
        if (!roleStats || roleStats.games < MIN_GAMES) return null;
        return { champion: c, winrate: roleStats.winrate, games: roleStats.games };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.winrate - a.winrate);
  });

  const meta = $derived(data.builds);
  const lastUpdated = $derived(
    meta.generatedAt ? new Date(meta.generatedAt).toLocaleDateString() : ''
  );
  const description = $derived(
    `Champion win rates by role from recent Challenger ranked-solo games on patch ${meta.patch || 'live'}.`
  );
</script>

<svelte:head>
  <title>Win rates — League Champ Builds (Patch {meta.patch})</title>
  <meta name="description" content={description} />
  <meta property="og:title" content="Win rates — League Champ Builds" />
  <meta property="og:description" content={description} />
  <meta property="twitter:title" content="Win rates — League Champ Builds" />
  <meta property="twitter:description" content={description} />
</svelte:head>

<section class="px-4 py-6 md:px-8">
  <div class="mx-auto max-w-4xl">
    <div class="mb-6 flex flex-col gap-2 text-center">
      <p class="font-display text-xs uppercase tracking-[0.4em] text-hex-cyan">
        Patch {meta.patch}
      </p>
      <h1 class="font-display text-3xl uppercase tracking-widest text-hex-goldHi md:text-5xl">
        Win rates
      </h1>
      <p class="mx-auto max-w-2xl text-sm text-hex-mist">
        Sorted high to low. Updated {lastUpdated}.
      </p>
    </div>

    <div class="mb-6 flex flex-wrap justify-center gap-2">
      {#each ROLES as role (role.key)}
        <button
          type="button"
          onclick={() => (selectedRole = role.key)}
          class="rounded border px-3 py-1.5 font-display text-xs uppercase tracking-widest transition-colors"
          class:border-hex-gold={selectedRole === role.key}
          class:text-hex-gold={selectedRole === role.key}
          class:bg-hex-gold={false}
          class:border-hex-border={selectedRole !== role.key}
          class:text-hex-mist={selectedRole !== role.key}
          class:hover:text-hex-gold={selectedRole !== role.key}
        >
          {role.label}
        </button>
      {/each}
    </div>

    {#if rows.length === 0}
      <p class="py-16 text-center text-hex-mist">
        No data yet for {ROLES.find((r) => r.key === selectedRole)?.label}.
      </p>
    {:else}
      <ol class="hex-frame divide-y divide-hex-border/40 rounded-md">
        {#each rows as row, i (row.champion.id)}
          <li>
            <a
              href={`/champion/${row.champion.id}`}
              class="flex items-center gap-4 px-4 py-2 transition-colors hover:bg-hex-deep/60"
            >
              <span class="w-8 text-right font-mono text-xs text-hex-mist">{i + 1}</span>
              <img
                src={squareIcon(data.version, row.champion.image.full)}
                alt=""
                width="40"
                height="40"
                class="rounded border border-hex-gold/30"
                loading="lazy"
              />
              <div class="flex-1">
                <div class="text-sm text-hex-parchment">
                  {displayName(row.champion.id, row.champion.name)}
                </div>
                <div class="text-[11px] text-hex-mist">{row.champion.title}</div>
              </div>
              <div class="text-right font-mono text-sm text-hex-cyan">
                {(row.winrate * 100).toFixed(1)}%
              </div>
            </a>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</section>
