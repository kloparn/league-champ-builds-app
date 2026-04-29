import { describe, expect, it } from 'vitest';
import { splitBuilds } from './builds-split';
import type { BuildsData, ChampionBuildStats } from './build-aggregator';

function makeChampion(
  championId: number,
  championName: string,
  overrides: Partial<ChampionBuildStats> = {}
): ChampionBuildStats {
  return {
    championId,
    championName,
    games: 100,
    wins: 50,
    winrate: 0.5,
    byRole: {
      MIDDLE: {
        games: 60,
        wins: 30,
        winrate: 0.5,
        topItems: [{ itemId: 3001, count: 30, pickRate: 0.5, winrate: 0.5 }],
        itemPath: [],
        topBoots: [],
        topRunes: [],
        topSummonerSpells: [],
        skillOrder: []
      }
    },
    ...overrides
  };
}

const sampleBuilds: BuildsData = {
  generatedAt: '2026-04-29T00:00:00Z',
  patch: '16.8',
  region: 'EUW',
  queue: 'RANKED_SOLO_5x5',
  sampleSize: 4276,
  tiers: ['CHALLENGER', 'GRANDMASTER'],
  champions: {
    Zed: makeChampion(238, 'Zed'),
    Aatrox: makeChampion(266, 'Aatrox'),
    Darius: makeChampion(122, 'Darius')
  }
};

describe('splitBuilds', () => {
  it('emits meta + winrates + one file per champion', () => {
    const files = splitBuilds(sampleBuilds);
    expect(files).toHaveLength(2 + 3); // meta + winrates + 3 champions
    const paths = files.map((f) => f.path);
    expect(paths).toContain('meta.json');
    expect(paths).toContain('winrates.json');
    expect(paths).toContain('champions/Aatrox.json');
    expect(paths).toContain('champions/Darius.json');
    expect(paths).toContain('champions/Zed.json');
  });

  it('sorts championKeys in meta.json deterministically', () => {
    const files = splitBuilds(sampleBuilds);
    const meta = JSON.parse(files.find((f) => f.path === 'meta.json')!.body);
    expect(meta.championKeys).toEqual(['Aatrox', 'Darius', 'Zed']);
  });

  it('preserves header fields in meta.json', () => {
    const files = splitBuilds(sampleBuilds);
    const meta = JSON.parse(files.find((f) => f.path === 'meta.json')!.body);
    expect(meta.generatedAt).toBe(sampleBuilds.generatedAt);
    expect(meta.patch).toBe(sampleBuilds.patch);
    expect(meta.region).toBe(sampleBuilds.region);
    expect(meta.queue).toBe(sampleBuilds.queue);
    expect(meta.sampleSize).toBe(sampleBuilds.sampleSize);
    expect(meta.tiers).toEqual(sampleBuilds.tiers);
  });

  it('omits tiers from meta when not provided', () => {
    const { tiers: _omit, ...rest } = sampleBuilds;
    const files = splitBuilds(rest);
    const meta = JSON.parse(files.find((f) => f.path === 'meta.json')!.body);
    expect(meta).not.toHaveProperty('tiers');
  });

  it('strips heavy build fields from winrates.json (no items, runes, paths)', () => {
    const files = splitBuilds(sampleBuilds);
    const winrates = JSON.parse(files.find((f) => f.path === 'winrates.json')!.body);
    const darius = winrates.champions.Darius;
    expect(darius.championId).toBe(122);
    expect(darius.championKey).toBe('Darius');
    expect(darius.championName).toBe('Darius');
    expect(darius.games).toBe(100);
    expect(darius.winrate).toBe(0.5);
    expect(darius.byRole.MIDDLE).toEqual({ games: 60, winrate: 0.5 });
    // crucially: no topItems / itemPath / topRunes / topSummonerSpells / skillOrder
    expect(darius.byRole.MIDDLE).not.toHaveProperty('topItems');
    expect(darius.byRole.MIDDLE).not.toHaveProperty('itemPath');
    expect(darius.byRole.MIDDLE).not.toHaveProperty('topRunes');
  });

  it('keeps full ChampionBuildStats in per-champion files', () => {
    const files = splitBuilds(sampleBuilds);
    const dariusFile = files.find((f) => f.path === 'champions/Darius.json')!;
    const darius = JSON.parse(dariusFile.body);
    expect(darius.championId).toBe(122);
    expect(darius.byRole.MIDDLE.topItems).toEqual([
      { itemId: 3001, count: 30, pickRate: 0.5, winrate: 0.5 }
    ]);
  });

  it('produces valid JSON in every file body', () => {
    const files = splitBuilds(sampleBuilds);
    for (const file of files) {
      expect(() => JSON.parse(file.body)).not.toThrow();
    }
  });

  it('handles an empty champions map', () => {
    const empty: BuildsData = { ...sampleBuilds, champions: {} };
    const files = splitBuilds(empty);
    expect(files).toHaveLength(2); // just meta + winrates
    const meta = JSON.parse(files[0]!.body);
    expect(meta.championKeys).toEqual([]);
  });
});
