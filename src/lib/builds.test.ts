import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./gcs', () => ({
  readJson: vi.fn()
}));

import { readJson } from './gcs';
import {
  _resetCachesForTest,
  fetchChampion,
  fetchMeta,
  fetchWinrates,
  type BuildsMeta
} from './builds';
import type { ChampionBuildStats } from './build-aggregator';

const readJsonMock = vi.mocked(readJson);

const sampleChampion: ChampionBuildStats = {
  championId: 122,
  championName: 'Darius',
  games: 100,
  wins: 50,
  winrate: 0.5,
  byRole: {}
};

const sampleMeta: BuildsMeta = {
  generatedAt: '2026-04-29T00:00:00Z',
  patch: '16.8',
  region: 'EUW',
  queue: 'RANKED_SOLO_5x5',
  sampleSize: 4276,
  championKeys: ['Aatrox', 'Ahri', 'Darius']
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-04-29T00:00:00Z'));
  readJsonMock.mockReset();
  _resetCachesForTest();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('fetchChampion', () => {
  it('fetches from the bucket on first call', async () => {
    readJsonMock.mockResolvedValueOnce(sampleChampion);
    const result = await fetchChampion('Darius');
    expect(result).toEqual(sampleChampion);
    expect(readJsonMock).toHaveBeenCalledOnce();
    expect(readJsonMock).toHaveBeenCalledWith('champions/Darius.json');
  });

  it('serves from cache within TTL without refetching', async () => {
    readJsonMock.mockResolvedValueOnce(sampleChampion);
    await fetchChampion('Darius');
    vi.advanceTimersByTime(9 * 60 * 1000); // 9 minutes — still inside 10-min TTL
    await fetchChampion('Darius');
    expect(readJsonMock).toHaveBeenCalledOnce();
  });

  it('refetches after TTL expires', async () => {
    readJsonMock.mockResolvedValueOnce(sampleChampion);
    readJsonMock.mockResolvedValueOnce(sampleChampion);
    await fetchChampion('Darius');
    vi.advanceTimersByTime(11 * 60 * 1000); // past TTL
    await fetchChampion('Darius');
    expect(readJsonMock).toHaveBeenCalledTimes(2);
  });

  it('caches null results so missing champions are not refetched on every miss', async () => {
    readJsonMock.mockResolvedValueOnce(null);
    const a = await fetchChampion('NonExistent');
    const b = await fetchChampion('NonExistent');
    expect(a).toBeNull();
    expect(b).toBeNull();
    expect(readJsonMock).toHaveBeenCalledOnce();
  });

  it('isolates cache by champion key', async () => {
    readJsonMock.mockResolvedValueOnce(sampleChampion);
    readJsonMock.mockResolvedValueOnce({ ...sampleChampion, championName: 'Ahri' });
    await fetchChampion('Darius');
    await fetchChampion('Ahri');
    expect(readJsonMock).toHaveBeenCalledTimes(2);
    expect(readJsonMock).toHaveBeenNthCalledWith(1, 'champions/Darius.json');
    expect(readJsonMock).toHaveBeenNthCalledWith(2, 'champions/Ahri.json');
  });

  it('dedupes concurrent calls for the same champion to one read', async () => {
    let resolveFn: (v: ChampionBuildStats | null) => void;
    const pending = new Promise<ChampionBuildStats | null>((res) => {
      resolveFn = res;
    });
    readJsonMock.mockReturnValueOnce(pending);

    const p1 = fetchChampion('Darius');
    const p2 = fetchChampion('Darius');
    const p3 = fetchChampion('Darius');

    resolveFn!(sampleChampion);
    const results = await Promise.all([p1, p2, p3]);

    expect(readJsonMock).toHaveBeenCalledOnce();
    expect(results).toEqual([sampleChampion, sampleChampion, sampleChampion]);
  });

  it('does not dedupe across different champions', async () => {
    let resolveDarius: (v: ChampionBuildStats | null) => void;
    let resolveAhri: (v: ChampionBuildStats | null) => void;
    readJsonMock.mockReturnValueOnce(
      new Promise<ChampionBuildStats | null>((res) => {
        resolveDarius = res;
      })
    );
    readJsonMock.mockReturnValueOnce(
      new Promise<ChampionBuildStats | null>((res) => {
        resolveAhri = res;
      })
    );

    const pDarius = fetchChampion('Darius');
    const pAhri = fetchChampion('Ahri');

    resolveDarius!(sampleChampion);
    resolveAhri!({ ...sampleChampion, championName: 'Ahri' });

    await Promise.all([pDarius, pAhri]);
    expect(readJsonMock).toHaveBeenCalledTimes(2);
  });
});

describe('fetchMeta', () => {
  it('caches and dedupes concurrent calls', async () => {
    let resolveFn: (v: BuildsMeta | null) => void;
    readJsonMock.mockReturnValueOnce(
      new Promise<BuildsMeta | null>((res) => {
        resolveFn = res;
      })
    );

    const p1 = fetchMeta();
    const p2 = fetchMeta();
    resolveFn!(sampleMeta);

    const [a, b] = await Promise.all([p1, p2]);
    expect(a).toEqual(sampleMeta);
    expect(b).toEqual(sampleMeta);
    expect(readJsonMock).toHaveBeenCalledOnce();
    expect(readJsonMock).toHaveBeenCalledWith('meta.json');

    // Second call within TTL is a cache hit
    const c = await fetchMeta();
    expect(c).toEqual(sampleMeta);
    expect(readJsonMock).toHaveBeenCalledOnce();
  });
});

describe('fetchWinrates', () => {
  it('reads from winrates.json and caches', async () => {
    const winrates = {
      generatedAt: sampleMeta.generatedAt,
      patch: sampleMeta.patch,
      sampleSize: sampleMeta.sampleSize,
      champions: {}
    };
    readJsonMock.mockResolvedValueOnce(winrates);

    const a = await fetchWinrates();
    const b = await fetchWinrates();
    expect(a).toEqual(winrates);
    expect(b).toEqual(winrates);
    expect(readJsonMock).toHaveBeenCalledOnce();
    expect(readJsonMock).toHaveBeenCalledWith('winrates.json');
  });
});
