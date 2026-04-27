import type {
  ChampionDetail,
  ChampionSummary,
  Item,
  RuneStyle,
  SummonerSpell
} from '../../src/lib/types';
import versionsFixture from '../fixtures/ddragon/versions.json';
import championsFixture from '../fixtures/ddragon/champions.json';
import amumuFixture from '../fixtures/ddragon/Amumu.json';
import summonerFixture from '../fixtures/ddragon/summoner.json';
import runesFixture from '../fixtures/ddragon/runes.json';
import itemsFixture from '../fixtures/ddragon/items.json';

interface ChampionListPayload {
  data: Record<string, ChampionSummary>;
}

interface ChampionDetailPayload {
  data: Record<string, ChampionDetail>;
}

interface SummonerSpellsPayload {
  data: Record<string, SummonerSpell>;
}

interface ItemsPayload {
  data: Record<string, Omit<Item, 'id'>>;
}

export const fixtures = {
  versions: versionsFixture as string[],
  champions: championsFixture as ChampionListPayload,
  champion: { Amumu: amumuFixture as ChampionDetailPayload } as Record<string, ChampionDetailPayload>,
  summonerSpells: summonerFixture as SummonerSpellsPayload,
  runes: runesFixture as RuneStyle[],
  items: itemsFixture as ItemsPayload
};

export interface MockFetchOptions {
  /** Custom URL→Response handler. Returning undefined falls through to default fixtures. */
  handler?: (url: string) => Response | Promise<Response> | undefined;
}

export interface MockFetchResult {
  fetch: typeof fetch;
  calls: string[];
}

export function createMockFetch(options: MockFetchOptions = {}): MockFetchResult {
  const calls: string[] = [];

  const fetchFn = (async (input: RequestInfo | URL) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    calls.push(url);

    if (options.handler) {
      const overridden = await options.handler(url);
      if (overridden) return overridden;
    }

    if (url.endsWith('/api/versions.json')) {
      return jsonResponse(fixtures.versions);
    }
    if (/\/data\/en_US\/champion\.json$/.test(url)) {
      return jsonResponse(fixtures.champions);
    }
    if (/\/data\/en_US\/summoner\.json$/.test(url)) {
      return jsonResponse(fixtures.summonerSpells);
    }
    if (/\/data\/en_US\/runesReforged\.json$/.test(url)) {
      return jsonResponse(fixtures.runes);
    }
    if (/\/data\/en_US\/item\.json$/.test(url)) {
      return jsonResponse(fixtures.items);
    }
    const championMatch = url.match(/\/data\/en_US\/champion\/([^/]+)\.json$/);
    if (championMatch) {
      const id = championMatch[1];
      const champ = fixtures.champion[id];
      if (!champ) return new Response('not found', { status: 404 });
      return jsonResponse(champ);
    }

    return new Response(`mock-fetch: unhandled url ${url}`, { status: 500 });
  }) as typeof fetch;

  return { fetch: fetchFn, calls };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}
