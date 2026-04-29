/**
 * Build data fetcher backed by GCS, with module-level TTL cache and
 * in-flight Promise deduplication. Server-only.
 *
 * File layout in the bucket:
 *   meta.json                — header metadata + champion key list
 *   winrates.json            — per-champion summary for the /winrates page
 *   champions/{Key}.json     — full ChampionBuildStats per champion
 */

import { readJson } from './gcs';
import type { ChampionBuildStats } from './build-aggregator';

const TTL_MS = 10 * 60 * 1000;

export interface BuildsMeta {
  generatedAt: string;
  patch: string;
  region: string;
  queue: string;
  sampleSize: number;
  tiers?: string[];
  championKeys: string[];
}

export interface ChampionWinrateSummary {
  championId: number;
  championKey: string;
  championName: string;
  games: number;
  winrate: number;
  byRole: Record<string, { games: number; winrate: number }>;
}

export interface WinratesData {
  generatedAt: string;
  patch: string;
  sampleSize: number;
  tiers?: string[];
  champions: Record<string, ChampionWinrateSummary>;
}

interface CacheEntry<T> {
  data: T;
  expires: number;
}

let metaCache: CacheEntry<BuildsMeta | null> | null = null;
let metaInflight: Promise<BuildsMeta | null> | null = null;

let winratesCache: CacheEntry<WinratesData | null> | null = null;
let winratesInflight: Promise<WinratesData | null> | null = null;

const championCache = new Map<string, CacheEntry<ChampionBuildStats | null>>();
const championInflight = new Map<string, Promise<ChampionBuildStats | null>>();

export async function fetchMeta(): Promise<BuildsMeta | null> {
  if (metaCache && metaCache.expires > Date.now()) return metaCache.data;
  if (metaInflight) return metaInflight;
  metaInflight = (async () => {
    try {
      const data = await readJson<BuildsMeta>('meta.json');
      metaCache = { data, expires: Date.now() + TTL_MS };
      return data;
    } finally {
      metaInflight = null;
    }
  })();
  return metaInflight;
}

export async function fetchWinrates(): Promise<WinratesData | null> {
  if (winratesCache && winratesCache.expires > Date.now()) return winratesCache.data;
  if (winratesInflight) return winratesInflight;
  winratesInflight = (async () => {
    try {
      const data = await readJson<WinratesData>('winrates.json');
      winratesCache = { data, expires: Date.now() + TTL_MS };
      return data;
    } finally {
      winratesInflight = null;
    }
  })();
  return winratesInflight;
}

export async function fetchChampion(key: string): Promise<ChampionBuildStats | null> {
  const cached = championCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;
  let p = championInflight.get(key);
  if (!p) {
    p = (async () => {
      try {
        const data = await readJson<ChampionBuildStats>(`champions/${key}.json`);
        championCache.set(key, { data, expires: Date.now() + TTL_MS });
        return data;
      } finally {
        championInflight.delete(key);
      }
    })();
    championInflight.set(key, p);
  }
  return p;
}

/** Test-only: clear all cached state. */
export function _resetCachesForTest(): void {
  metaCache = null;
  metaInflight = null;
  winratesCache = null;
  winratesInflight = null;
  championCache.clear();
  championInflight.clear();
}
