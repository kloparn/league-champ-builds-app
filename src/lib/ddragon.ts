import type {
  ChampionDetail,
  ChampionSummary,
  Item,
  RuneStyle,
  SummonerSpell
} from './types';

const DDRAGON = 'https://ddragon.leagueoflegends.com';
const VERSION_TTL_MS = 60 * 60 * 1000;
const CHAMPIONS_TTL_MS = 60 * 60 * 1000;
const CHAMPION_TTL_MS = 24 * 60 * 60 * 1000;
const SUMMONER_SPELLS_TTL_MS = 24 * 60 * 60 * 1000;
const RUNES_TTL_MS = 24 * 60 * 60 * 1000;
const ITEMS_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  value: T;
  expires: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCached<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expires: Date.now() + ttlMs });
}

async function fetchJson<T>(fetchFn: typeof fetch, url: string): Promise<T> {
  const res = await fetchFn(url);
  if (!res.ok) {
    throw new Error(`Data Dragon request failed (${res.status}): ${url}`);
  }
  return (await res.json()) as T;
}

export async function getLatestVersion(fetchFn: typeof fetch = fetch): Promise<string> {
  const cached = getCached<string>('version');
  if (cached) return cached;

  const versions = await fetchJson<string[]>(fetchFn, `${DDRAGON}/api/versions.json`);
  const latest = versions[0];
  setCached('version', latest, VERSION_TTL_MS);
  return latest;
}

export async function getChampions(
  fetchFn: typeof fetch
): Promise<{ version: string; champions: ChampionSummary[] }> {
  const version = await getLatestVersion(fetchFn);
  const cacheKey = `champions:${version}`;
  const cached = getCached<ChampionSummary[]>(cacheKey);
  if (cached) return { version, champions: cached };

  const data = await fetchJson<{ data: Record<string, ChampionSummary> }>(
    fetchFn,
    `${DDRAGON}/cdn/${version}/data/en_US/champion.json`
  );
  const champions = Object.values(data.data).sort((a, b) => a.name.localeCompare(b.name));
  setCached(cacheKey, champions, CHAMPIONS_TTL_MS);
  return { version, champions };
}

export async function getChampion(
  id: string,
  fetchFn: typeof fetch
): Promise<{ version: string; champion: ChampionDetail } | null> {
  const version = await getLatestVersion(fetchFn);
  const cacheKey = `champion:${version}:${id}`;
  const cached = getCached<ChampionDetail>(cacheKey);
  if (cached) return { version, champion: cached };

  const res = await fetchFn(`${DDRAGON}/cdn/${version}/data/en_US/champion/${id}.json`);
  if (res.status === 404 || res.status === 403) return null;
  if (!res.ok) throw new Error(`Data Dragon request failed (${res.status})`);

  const data = (await res.json()) as { data: Record<string, ChampionDetail> };
  const champion = data.data[id];
  if (!champion) return null;
  setCached(cacheKey, champion, CHAMPION_TTL_MS);
  return { version, champion };
}

export async function getSummonerSpells(
  fetchFn: typeof fetch
): Promise<{ version: string; spells: Record<number, SummonerSpell> }> {
  const version = await getLatestVersion(fetchFn);
  const cacheKey = `summoner:${version}`;
  const cached = getCached<Record<number, SummonerSpell>>(cacheKey);
  if (cached) return { version, spells: cached };

  const data = await fetchJson<{ data: Record<string, SummonerSpell> }>(
    fetchFn,
    `${DDRAGON}/cdn/${version}/data/en_US/summoner.json`
  );
  const spells: Record<number, SummonerSpell> = {};
  for (const spell of Object.values(data.data)) {
    const k = parseInt(spell.key, 10);
    if (!Number.isNaN(k)) spells[k] = spell;
  }
  setCached(cacheKey, spells, SUMMONER_SPELLS_TTL_MS);
  return { version, spells };
}

export async function getRunes(
  fetchFn: typeof fetch
): Promise<{ version: string; styles: RuneStyle[] }> {
  const version = await getLatestVersion(fetchFn);
  const cacheKey = `runes:${version}`;
  const cached = getCached<RuneStyle[]>(cacheKey);
  if (cached) return { version, styles: cached };

  const styles = await fetchJson<RuneStyle[]>(
    fetchFn,
    `${DDRAGON}/cdn/${version}/data/en_US/runesReforged.json`
  );
  setCached(cacheKey, styles, RUNES_TTL_MS);
  return { version, styles };
}

export async function getItems(
  fetchFn: typeof fetch
): Promise<{ version: string; items: Record<string, Item> }> {
  const version = await getLatestVersion(fetchFn);
  const cacheKey = `items:${version}`;
  const cached = getCached<Record<string, Item>>(cacheKey);
  if (cached) return { version, items: cached };

  const data = await fetchJson<{ data: Record<string, Omit<Item, 'id'>> }>(
    fetchFn,
    `${DDRAGON}/cdn/${version}/data/en_US/item.json`
  );
  const items: Record<string, Item> = {};
  for (const [id, info] of Object.entries(data.data)) {
    items[id] = { id, ...info };
  }
  setCached(cacheKey, items, ITEMS_TTL_MS);
  return { version, items };
}

export function squareIcon(version: string, image: string): string {
  return `${DDRAGON}/cdn/${version}/img/champion/${image}`;
}

export function itemIcon(version: string, itemId: number): string {
  return `${DDRAGON}/cdn/${version}/img/item/${itemId}.png`;
}

export function runeIcon(iconPath: string): string {
  return `${DDRAGON}/cdn/img/${iconPath}`;
}

export function loadingArt(championId: string, skinNum = 0): string {
  return `${DDRAGON}/cdn/img/champion/loading/${championId}_${skinNum}.jpg`;
}

export function splashArt(championId: string, skinNum = 0): string {
  return `${DDRAGON}/cdn/img/champion/splash/${championId}_${skinNum}.jpg`;
}

export function spellIcon(version: string, spellImage: string): string {
  return `${DDRAGON}/cdn/${version}/img/spell/${spellImage}`;
}

export function passiveIcon(version: string, passiveImage: string): string {
  return `${DDRAGON}/cdn/${version}/img/passive/${passiveImage}`;
}

export function clearCache(): void {
  cache.clear();
}
