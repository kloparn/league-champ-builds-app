import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockFetch, fixtures } from '../../tests/helpers/mock-fetch';
import {
  clearCache,
  getChampion,
  getChampions,
  getItems,
  getLatestVersion,
  getRunes,
  getSummonerSpells
} from './ddragon';

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';
const VERSION_TTL_MS = 60 * 60 * 1000;

beforeEach(() => {
  clearCache();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getLatestVersion', () => {
  it('returns the first entry from the versions endpoint', async () => {
    const { fetch, calls } = createMockFetch();

    const version = await getLatestVersion(fetch);

    expect(version).toBe(fixtures.versions[0]);
    expect(calls).toEqual([VERSIONS_URL]);
  });

  it('caches the version so subsequent calls do not refetch', async () => {
    const { fetch, calls } = createMockFetch();

    await getLatestVersion(fetch);
    await getLatestVersion(fetch);

    expect(calls).toHaveLength(1);
  });

  it('refetches once the cache TTL has expired', async () => {
    vi.useFakeTimers();
    const { fetch, calls } = createMockFetch();

    await getLatestVersion(fetch);
    vi.advanceTimersByTime(VERSION_TTL_MS + 1);
    await getLatestVersion(fetch);

    expect(calls).toHaveLength(2);
  });

  it('throws when the upstream returns a non-2xx status', async () => {
    const { fetch } = createMockFetch({
      handler: (url) =>
        url.endsWith('/api/versions.json')
          ? new Response('boom', { status: 500 })
          : undefined
    });

    await expect(getLatestVersion(fetch)).rejects.toThrow(/500/);
  });
});

describe('getChampions', () => {
  it('returns champions for the latest version, sorted by name', async () => {
    const { fetch } = createMockFetch();

    const { version, champions } = await getChampions(fetch);

    expect(version).toBe(fixtures.versions[0]);
    expect(champions[0]?.id).toBe('Ahri');
    expect(champions[1]?.id).toBe('Amumu');
  });
});

describe('getChampion', () => {
  it('returns the champion detail by id', async () => {
    const { fetch } = createMockFetch();

    const result = await getChampion('Amumu', fetch);

    expect(result).not.toBeNull();
    expect(result?.champion.id).toBe('Amumu');
    expect(result?.version).toBe(fixtures.versions[0]);
  });

  it('returns null when the champion endpoint 404s', async () => {
    const { fetch } = createMockFetch();

    const result = await getChampion('NotARealChamp', fetch);

    expect(result).toBeNull();
  });
});

describe('getSummonerSpells', () => {
  it('keys spells by their numeric id from the string `key` field', async () => {
    const { fetch } = createMockFetch();

    const { version, spells } = await getSummonerSpells(fetch);

    expect(version).toBe(fixtures.versions[0]);
    expect(spells[4]?.name).toBe('Flash');
    expect(spells[11]?.name).toBe('Smite');
  });

  it('caches the spells map across calls', async () => {
    const { fetch, calls } = createMockFetch();

    await getSummonerSpells(fetch);
    await getSummonerSpells(fetch);

    const spellRequests = calls.filter((u) => u.endsWith('/data/en_US/summoner.json'));
    expect(spellRequests).toHaveLength(1);
  });
});

describe('getRunes', () => {
  it('returns the rune style trees for the latest version', async () => {
    const { fetch } = createMockFetch();

    const { version, styles } = await getRunes(fetch);

    expect(version).toBe(fixtures.versions[0]);
    expect(styles.find((s) => s.id === 8000)?.name).toBe('Precision');
    expect(styles.find((s) => s.id === 8100)?.name).toBe('Domination');
  });

  it('caches the rune trees across calls', async () => {
    const { fetch, calls } = createMockFetch();

    await getRunes(fetch);
    await getRunes(fetch);

    const runeRequests = calls.filter((u) => u.endsWith('/data/en_US/runesReforged.json'));
    expect(runeRequests).toHaveLength(1);
  });
});

describe('getItems', () => {
  it('returns items keyed by string id with the id field set', async () => {
    const { fetch } = createMockFetch();

    const { items } = await getItems(fetch);

    expect(items['3157']?.name).toBe("Zhonya's Hourglass");
    expect(items['3157']?.id).toBe('3157');
    expect(items['1056']?.tags).toContain('Lane');
  });

  it('caches the item map across calls', async () => {
    const { fetch, calls } = createMockFetch();

    await getItems(fetch);
    await getItems(fetch);

    const itemRequests = calls.filter((u) => u.endsWith('/data/en_US/item.json'));
    expect(itemRequests).toHaveLength(1);
  });
});
