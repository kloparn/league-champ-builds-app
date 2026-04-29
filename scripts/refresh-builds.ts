/**
 * Fetches recent Challenger ranked-solo matches from Riot's MATCH-V5 API
 * (match + timeline), aggregates per-champion build stats, and writes
 * static/builds.json so SvelteKit can serve it.
 *
 * Incremental per patch: state is persisted between runs in
 *   data/builds-state.json.gz — accumulated bucket counts (full granularity, gzipped)
 *   data/seen-matches.bin     — match IDs already aggregated (8-byte uint64 BE each)
 * Both reset automatically when a new patch is detected. Legacy
 * builds-state.json / seen-matches.txt files are migrated on first load.
 *
 * Run locally:
 *   npm run refresh:builds        # reads .env via Node's --env-file-if-exists
 *
 * Run in CI: set RIOT_API_KEY in the workflow env.
 *
 * Rate limiting: respects Riot's standard registered-app limits
 * (20 req / 1s and 100 req / 120s). The 100/2min window is the binding
 * constraint, so the limiter ends up pacing at ~0.83 req/s sustained.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  addMatchToState,
  comparePatch,
  finalizeState,
  patchFromGameVersion
} from '../src/lib/build-aggregator.ts';
import type {
  EnrichedMatch,
  MatchDto,
  MatchTimelineDto
} from '../src/lib/build-aggregator.ts';
import { getItems, getLatestVersion } from '../src/lib/ddragon.ts';
import type { Item } from '../src/lib/types.ts';
import {
  appendSeenMatches,
  freshState,
  loadBucketState,
  loadSeenMatches,
  resetSeenMatches,
  saveBucketState
} from './state-store.ts';

const PLATFORM_HOST = 'https://euw1.api.riotgames.com';
const REGIONAL_HOST = 'https://europe.api.riotgames.com';
const QUEUE_ID = 420;
const QUEUE_NAME = 'RANKED_SOLO_5x5';
const REGION = 'EUW';

const FAST = process.argv.includes('--fast');
const GITHUB = process.argv.includes('--github');

const MODES: Record<'fast' | 'default' | 'github', ModeConfig> = {
  fast: {
    tiers: [
      { tier: 'CHALLENGER', limit: 10 },
      { tier: 'GRANDMASTER', limit: 10 },
      { tier: 'MASTER', limit: 10 },
      { tier: 'DIAMOND', division: 'I', limit: 10 }
    ],
    matchesPerSummoner: 10
  },
  default: {
    tiers: [
      { tier: 'CHALLENGER', limit: 300 },
      { tier: 'GRANDMASTER', limit: 200 }
    ],
    matchesPerSummoner: 25
  },
  github: {
    tiers: [
      { tier: 'CHALLENGER', limit: 300 },
      { tier: 'GRANDMASTER', limit: 700 },
      { tier: 'MASTER', limit: 1000 },
      { tier: 'DIAMOND', division: 'I', limit: 1000 }
    ],
    matchesPerSummoner: 100,
    maxMatchesPerRun: 8000
  }
};

const MODE_NAME: 'fast' | 'default' | 'github' = FAST ? 'fast' : GITHUB ? 'github' : 'default';
const MODE = MODES[MODE_NAME];
const MATCHES_PER_SUMMONER = parseInt(
  process.env.MATCHES_PER_SUMMONER ?? String(MODE.matchesPerSummoner),
  10
);

console.log(
  `→ mode: ${MODE_NAME}${MODE_NAME === 'github' ? ' (heavy)' : ''} — ` +
    `${MODE.tiers.map((t) => `${tierLabel(t)}:${t.limit}`).join(', ')} × ${MATCHES_PER_SUMMONER} matches`
);

function tierLabel(t: TierTarget): string {
  return t.division ? `${t.tier}-${t.division}` : t.tier;
}

const KEY = process.env.RIOT_API_KEY;
if (!KEY) {
  console.error('RIOT_API_KEY not set. Add it to .env or the runner environment.');
  process.exit(1);
}

interface LeagueListEntry {
  puuid?: string;
  summonerId?: string;
  leaguePoints: number;
}

interface LeagueList {
  entries: LeagueListEntry[];
}

interface LeagueEntryDto {
  puuid?: string;
  summonerId?: string;
  leaguePoints: number;
  tier?: string;
  rank?: string;
}

interface SummonerDto {
  puuid: string;
}

type ApexTier = 'CHALLENGER' | 'GRANDMASTER' | 'MASTER';

interface TierTarget {
  tier: ApexTier | 'DIAMOND';
  /** Required for non-apex tiers (Diamond → I/II/III/IV). */
  division?: 'I' | 'II' | 'III' | 'IV';
  /** Cap on entries pulled from this tier (sorted by LP desc). */
  limit: number;
}

interface ModeConfig {
  tiers: TierTarget[];
  matchesPerSummoner: number;
  /** Hard cap on match-detail+timeline calls per run. Holds runtime stable across patch cycles. */
  maxMatchesPerRun?: number;
}

class RateLimiter {
  private shortWindow: number[] = [];
  private longWindow: number[] = [];

  async acquire(): Promise<void> {
    while (true) {
      const now = Date.now();
      this.shortWindow = this.shortWindow.filter((t) => now - t < 1000);
      this.longWindow = this.longWindow.filter((t) => now - t < 120_000);

      if (this.shortWindow.length < 20 && this.longWindow.length < 100) {
        this.shortWindow.push(now);
        this.longWindow.push(now);
        return;
      }

      const shortWait =
        this.shortWindow.length >= 20 ? 1000 - (now - this.shortWindow[0]!) + 25 : 0;
      const longWait =
        this.longWindow.length >= 100 ? 120_000 - (now - this.longWindow[0]!) + 25 : 0;
      await sleep(Math.max(shortWait, longWait, 50));
    }
  }
}

const limiter = new RateLimiter();

const MAX_TRANSIENT_RETRIES = 5;

async function call<T>(url: string): Promise<T | null> {
  let transientAttempt = 0;
  while (true) {
    await limiter.acquire();
    let res: Response;
    try {
      res = await fetch(url, { headers: { 'X-Riot-Token': KEY! } });
    } catch (err) {
      if (transientAttempt >= MAX_TRANSIENT_RETRIES) {
        throw new Error(
          `Network failure on ${shortUrl(url)} after ${MAX_TRANSIENT_RETRIES + 1} attempts: ${errMsg(err)}`
        );
      }
      const delay = Math.min(30_000, 1000 * 2 ** transientAttempt);
      console.warn(
        `  network error on ${shortUrl(url)} (${errMsg(err)}) — sleeping ${delay / 1000}s`
      );
      await sleep(delay);
      transientAttempt++;
      continue;
    }

    if (res.status === 429) {
      const retry = parseInt(res.headers.get('retry-after') ?? '5', 10);
      console.warn(`  429 from ${shortUrl(url)} — sleeping ${retry}s`);
      await sleep(retry * 1000);
      continue;
    }
    if (res.status >= 500 && res.status <= 599) {
      if (transientAttempt >= MAX_TRANSIENT_RETRIES) {
        throw new Error(
          `${res.status} on ${shortUrl(url)} after ${MAX_TRANSIENT_RETRIES + 1} attempts`
        );
      }
      const delay = Math.min(30_000, 1000 * 2 ** transientAttempt);
      console.warn(`  ${res.status} from ${shortUrl(url)} — sleeping ${delay / 1000}s`);
      await sleep(delay);
      transientAttempt++;
      continue;
    }
    if (res.status === 404) return null;
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${res.status} ${res.statusText} on ${url}\n${body.slice(0, 300)}`);
    }
    return (await res.json()) as T;
  }
}

function errMsg(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as Error & { cause?: { code?: string } }).cause;
    return cause?.code ? `${err.message} [${cause.code}]` : err.message;
  }
  return String(err);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function shortUrl(url: string): string {
  return url.replace(PLATFORM_HOST, '').replace(REGIONAL_HOST, '');
}

async function fetchApexLeague(tier: ApexTier): Promise<LeagueListEntry[]> {
  const path =
    tier === 'CHALLENGER'
      ? 'challengerleagues'
      : tier === 'GRANDMASTER'
        ? 'grandmasterleagues'
        : 'masterleagues';
  const league = await call<LeagueList>(
    `${PLATFORM_HOST}/lol/league/v4/${path}/by-queue/RANKED_SOLO_5x5`
  );
  return league?.entries ?? [];
}

const ENTRIES_PAGE_SIZE = 205;

async function fetchTierEntries(
  tier: 'DIAMOND',
  division: 'I' | 'II' | 'III' | 'IV',
  limit: number
): Promise<LeagueEntryDto[]> {
  const out: LeagueEntryDto[] = [];
  for (let page = 1; out.length < limit; page++) {
    const entries = await call<LeagueEntryDto[]>(
      `${PLATFORM_HOST}/lol/league/v4/entries/RANKED_SOLO_5x5/${tier}/${division}?page=${page}`
    );
    if (!entries || entries.length === 0) break;
    out.push(...entries);
    if (entries.length < ENTRIES_PAGE_SIZE) break;
  }
  return out;
}

async function entriesForTier(target: TierTarget): Promise<LeagueEntryDto[]> {
  if (target.tier === 'DIAMOND') {
    if (!target.division) throw new Error('Diamond target requires a division');
    return fetchTierEntries(target.tier, target.division, target.limit);
  }
  return fetchApexLeague(target.tier);
}

async function resolvePuuid(entry: LeagueEntryDto): Promise<string | null> {
  if (entry.puuid) return entry.puuid;
  if (!entry.summonerId) return null;
  const summoner = await call<SummonerDto>(
    `${PLATFORM_HOST}/lol/summoner/v4/summoners/${entry.summonerId}`
  );
  return summoner?.puuid ?? null;
}

async function fetchPuuids(): Promise<{ puuids: string[]; tiersFound: string[] }> {
  const puuids: string[] = [];
  const tiersFound: string[] = [];

  for (const target of MODE.tiers) {
    console.log(`→ ${tierLabel(target)} leaderboard (cap ${target.limit})`);
    const entries = await entriesForTier(target);
    if (entries.length === 0) {
      console.warn(`  no entries returned for ${tierLabel(target)}`);
      continue;
    }
    const sorted = [...entries].sort((a, b) => b.leaguePoints - a.leaguePoints);
    const top = sorted.slice(0, target.limit);
    let resolved = 0;
    for (const entry of top) {
      const puuid = await resolvePuuid(entry);
      if (puuid) {
        puuids.push(puuid);
        resolved++;
      }
    }
    console.log(`  ${resolved} puuids from ${tierLabel(target)} (of ${top.length} entries)`);
    if (resolved > 0) tiersFound.push(target.tier);
  }

  // Dedup in case a smurf appears in multiple tiers (unusual).
  const unique = [...new Set(puuids)];
  console.log(`→ ${unique.length} unique puuids across ${tiersFound.length} tiers`);
  return { puuids: unique, tiersFound: [...new Set(tiersFound)] };
}

async function fetchMatchIdsForPuuid(
  puuid: string,
  start: number,
  count: number
): Promise<string[]> {
  const url = `${REGIONAL_HOST}/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=${QUEUE_ID}&start=${start}&count=${count}`;
  return (await call<string[]>(url)) ?? [];
}

const PAGINATE_THRESHOLD = 0.8;
const MAX_PAGES_PER_PUUID = 2;

async function fetchMatchIds(puuid: string, seen: Set<string>): Promise<string[]> {
  const out: string[] = [];
  for (let page = 0; page < MAX_PAGES_PER_PUUID; page++) {
    const ids = await fetchMatchIdsForPuuid(
      puuid,
      page * MATCHES_PER_SUMMONER,
      MATCHES_PER_SUMMONER
    );
    if (ids.length === 0) break;
    out.push(...ids);

    // Only paginate further if this page is mostly already-seen — saves
    // calls for active players whose first page already gives us new IDs.
    const seenRatio = ids.filter((id) => seen.has(id)).length / ids.length;
    if (seenRatio < PAGINATE_THRESHOLD) break;
  }
  return out;
}

async function fetchMatch(matchId: string): Promise<MatchDto | null> {
  return call<MatchDto>(`${REGIONAL_HOST}/lol/match/v5/matches/${matchId}`);
}

async function fetchTimeline(matchId: string): Promise<MatchTimelineDto | null> {
  return call<MatchTimelineDto>(`${REGIONAL_HOST}/lol/match/v5/matches/${matchId}/timeline`);
}

function isLegendary(items: Record<string, Item>, itemId: number): boolean {
  const item = items[String(itemId)];
  if (!item) return false;
  if (!item.gold.purchasable) return false;
  if ((item.into?.length ?? 0) > 0) return false;
  if (item.tags.includes('Trinket')) return false;
  if (item.tags.includes('Consumable')) return false;
  if (item.tags.includes('Vision')) return false;
  if (item.tags.includes('Boots')) return false;
  return true;
}

function isBoots(items: Record<string, Item>, itemId: number): boolean {
  const item = items[String(itemId)];
  if (!item) return false;
  if (!item.gold.purchasable) return false;
  if (!item.tags.includes('Boots')) return false;
  if ((item.into?.length ?? 0) > 0) return false;
  return true;
}

const MIN_NEW_MATCHES_TO_WRITE = 25;
const PATH_SLOTS = 4;
const CHECKPOINT_EVERY = 100;

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATE_PATH = join(REPO_ROOT, 'data', 'builds-state.json.gz');
const LEGACY_STATE_PATH = join(REPO_ROOT, 'data', 'builds-state.json');
const SEEN_PATH = join(REPO_ROOT, 'data', 'seen-matches.bin');
const LEGACY_SEEN_PATH = join(REPO_ROOT, 'data', 'seen-matches.txt');
const BUILDS_PATH = join(REPO_ROOT, 'static', 'builds.json');

async function main() {
  const startTs = Date.now();

  const seen = loadSeenMatches(SEEN_PATH, LEGACY_SEEN_PATH);
  const persisted = loadBucketState(STATE_PATH, LEGACY_STATE_PATH);
  if (persisted) {
    console.log(
      `→ resumed state: patch ${persisted.patch}, ${persisted.sampleSize} matches, ${seen.size} seen IDs`
    );
  } else {
    console.log('→ no prior state — starting fresh');
  }

  const { puuids, tiersFound } = await fetchPuuids();

  console.log(`→ match IDs for ${puuids.length} summoners`);
  const matchIds = new Set<string>();
  let matchIdFailures = 0;
  for (let i = 0; i < puuids.length; i++) {
    try {
      const ids = await fetchMatchIds(puuids[i]!, seen);
      for (const id of ids) matchIds.add(id);
    } catch (err) {
      matchIdFailures++;
      console.warn(`  skipping match-ids for puuid #${i}: ${errMsg(err)}`);
    }
    if ((i + 1) % 10 === 0) {
      console.log(`  ${i + 1}/${puuids.length} (${matchIds.size} unique so far)`);
    }
  }
  console.log(
    `  ${matchIds.size} unique match IDs${matchIdFailures ? ` (${matchIdFailures} summoners skipped)` : ''}`
  );

  let newIds = [...matchIds].filter((id) => !seen.has(id));
  console.log(`  ${newIds.length} new (skipping ${matchIds.size - newIds.length} already seen)`);

  if (newIds.length === 0) {
    console.log('→ nothing new to fetch — exiting');
    return;
  }

  if (MODE.maxMatchesPerRun && newIds.length > MODE.maxMatchesPerRun) {
    console.log(
      `  capping at ${MODE.maxMatchesPerRun} this run (deferring ${newIds.length - MODE.maxMatchesPerRun} to next run)`
    );
    newIds = newIds.slice(0, MODE.maxMatchesPerRun);
  }

  console.log(`→ DDragon`);
  const ddragonVersion = await getLatestVersion(fetch);
  const ddragonPatch = patchFromGameVersion(ddragonVersion);
  const { items } = await getItems(fetch);
  console.log(
    `  version ${ddragonVersion} (DDragon → ${ddragonPatch}), ${Object.keys(items).length} items`
  );

  // Probe phase — fetch a small sample of match details to determine what
  // patch the regional servers are actually serving. DDragon flips ahead of
  // game-server rollout during patch turnover, so trust match.gameVersion
  // over ddragonPatch. Cached results are reused in the main loop below.
  const PROBE_SIZE = Math.min(30, newIds.length);
  const probedMatches = new Map<string, MatchDto>();
  const probeHist = new Map<string, number>();
  console.log(`→ probing ${PROBE_SIZE} matches to detect canonical patch`);
  for (const id of newIds.slice(0, PROBE_SIZE)) {
    let match: MatchDto | null = null;
    try {
      match = await fetchMatch(id);
    } catch (err) {
      console.warn(`  probe skip ${id}: ${errMsg(err)}`);
      continue;
    }
    if (!match) continue;
    probedMatches.set(id, match);
    const p = patchFromGameVersion(match.info.gameVersion);
    probeHist.set(p, (probeHist.get(p) ?? 0) + 1);
  }
  const probeTotal = [...probeHist.values()].reduce((a, b) => a + b, 0);
  const probeReport =
    [...probeHist.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([p, c]) => `${p}:${c}`)
      .join(', ') || '(empty)';
  console.log(`  probe histogram (${probeTotal}): ${probeReport}`);

  // Pick canonical patch:
  //   - if no prior state, use the probe mode (whatever's most common right now).
  //   - if we have prior state, flip forward to a newer patch as soon as it
  //     reaches MIN_PROBE_MATCHES_TO_FLIP samples in the probe. We don't wait
  //     for the new patch to dominate — even a small but non-trivial sample is
  //     enough to start aggregating, because the soft-skip write guard below
  //     keeps the public builds.json on the old data until the new state
  //     crosses MIN_NEW_MATCHES_TO_WRITE. So flipping early is safe.
  //   - we never flip backward; lingering pre-deploy matches in the probe
  //     don't drag canonical back to an older patch.
  const MIN_PROBE_MATCHES_TO_FLIP = 5;
  let canonicalPatch: string;
  if (probeTotal === 0) {
    canonicalPatch = persisted?.patch ?? ddragonPatch;
    console.log(`  no probe data — falling back to ${canonicalPatch}`);
  } else if (!persisted) {
    canonicalPatch = [...probeHist.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  } else {
    const newerWithEnough = [...probeHist.entries()]
      .filter(
        ([p, c]) => comparePatch(p, persisted.patch) > 0 && c >= MIN_PROBE_MATCHES_TO_FLIP
      )
      .sort((a, b) => comparePatch(b[0], a[0]))[0];
    if (newerWithEnough) {
      canonicalPatch = newerWithEnough[0];
      console.log(
        `  flipping ${persisted.patch} → ${canonicalPatch} (${newerWithEnough[1]} of ${probeTotal} probe matches on new patch)`
      );
    } else {
      canonicalPatch = persisted.patch;
      const newer = [...probeHist.entries()]
        .filter(([p]) => comparePatch(p, persisted.patch) > 0)
        .map(([p, c]) => `${p}:${c}`)
        .join(', ');
      if (newer) {
        console.log(
          `  staying on ${persisted.patch} — newer patches (${newer}) below floor of ${MIN_PROBE_MATCHES_TO_FLIP}`
        );
      } else {
        console.log(`  staying on ${persisted.patch}`);
      }
    }
  }

  // Reset state only if the canonical patch has actually rolled over.
  let pState = persisted;
  if (pState && pState.patch !== canonicalPatch) {
    console.log(
      `→ patch changed (${pState.patch} → ${canonicalPatch}) — resetting state and seen-matches`
    );
    pState = freshState(canonicalPatch);
    seen.clear();
    resetSeenMatches(SEEN_PATH);
  } else if (!pState) {
    pState = freshState(canonicalPatch);
  }

  console.log(`→ match details + timelines (checkpoint every ${CHECKPOINT_EVERY})`);
  let matchFailures = 0;
  let timelineFailures = 0;
  let droppedCount = 0;
  let usedCount = 0;
  let pendingIds: string[] = [];
  const droppedHist = new Map<string, number>();

  const flush = (final: boolean) => {
    if (pendingIds.length === 0) return;
    saveBucketState(STATE_PATH, canonicalPatch, pState!.sampleSize, pState!.state, PATH_SLOTS);
    appendSeenMatches(SEEN_PATH, pendingIds);
    pendingIds = [];
    if (!final) {
      console.log(
        `  ✓ checkpoint at ${usedCount} on-patch / ${droppedCount} off-patch (sample ${pState!.sampleSize})`
      );
    }
  };

  for (let i = 0; i < newIds.length; i++) {
    const id = newIds[i]!;
    let match: MatchDto | null = probedMatches.get(id) ?? null;
    if (!match) {
      try {
        match = await fetchMatch(id);
      } catch (err) {
        matchFailures++;
        console.warn(`  skipping match ${id}: ${errMsg(err)}`);
        continue;
      }
    }
    if (!match) continue;

    const matchPatch = patchFromGameVersion(match.info.gameVersion);
    if (matchPatch !== canonicalPatch) {
      droppedCount++;
      droppedHist.set(matchPatch, (droppedHist.get(matchPatch) ?? 0) + 1);
      pendingIds.push(id); // mark seen so we don't re-fetch
      if (pendingIds.length >= CHECKPOINT_EVERY) flush(false);
      continue;
    }

    let tl: MatchTimelineDto | null = null;
    try {
      tl = await fetchTimeline(id);
    } catch (err) {
      timelineFailures++;
      console.warn(`  no timeline for ${id}: ${errMsg(err)}`);
    }

    addMatchToState(
      pState.state,
      { match, timeline: tl } satisfies EnrichedMatch,
      {
        pathSlots: PATH_SLOTS,
        isLegendary: (itemId) => isLegendary(items, itemId),
        isBoots: (itemId) => isBoots(items, itemId)
      }
    );
    pState.sampleSize += 1;
    usedCount++;
    pendingIds.push(id);

    if (pendingIds.length >= CHECKPOINT_EVERY) flush(false);

    if ((i + 1) % 50 === 0) {
      console.log(
        `  ${i + 1}/${newIds.length} (used ${usedCount}, dropped ${droppedCount}` +
          (matchFailures || timelineFailures
            ? `, ${matchFailures} match / ${timelineFailures} timeline failed`
            : '') +
          ')'
      );
    }
  }

  flush(true);

  const droppedReport =
    [...droppedHist.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([p, c]) => `${p}:${c}`)
      .join(', ') || '';
  console.log(
    `  total: ${usedCount} on-patch (${canonicalPatch}) aggregated, ${droppedCount} off-patch dropped` +
      (droppedReport ? ` [${droppedReport}]` : '') +
      (matchFailures || timelineFailures
        ? ` — ${matchFailures} match / ${timelineFailures} timeline failed`
        : '')
  );

  // First-ever run must seed state with enough data; fail loudly otherwise.
  if (persisted == null && pState.sampleSize < MIN_NEW_MATCHES_TO_WRITE) {
    throw new Error(
      `Only ${pState.sampleSize} on-patch matches on first run (minimum ${MIN_NEW_MATCHES_TO_WRITE}) — refusing to seed state with too little data.`
    );
  }

  // Soft-skip: state too small to publish (e.g. just after a patch flip).
  // Keep accumulating in data/builds-state.json.gz; don't overwrite the
  // existing builds.json with near-empty data.
  if (pState.sampleSize < MIN_NEW_MATCHES_TO_WRITE) {
    console.warn(
      `\nState has only ${pState.sampleSize} samples on patch ${canonicalPatch} (minimum ${MIN_NEW_MATCHES_TO_WRITE} to publish) — preserving existing ${BUILDS_PATH}.`
    );
    return;
  }

  const builds = finalizeState(pState.state, {
    region: REGION,
    queue: QUEUE_NAME,
    patch: canonicalPatch,
    sampleSize: pState.sampleSize,
    tiers: tiersFound
  });

  mkdirSync(dirname(BUILDS_PATH), { recursive: true });
  writeFileSync(BUILDS_PATH, JSON.stringify(builds, null, 2) + '\n');

  const seconds = ((Date.now() - startTs) / 1000).toFixed(1);
  console.log(
    `\n✓ ${BUILDS_PATH}\n  ${Object.keys(builds.champions).length} champions, ${pState.sampleSize} cumulative matches, patch ${canonicalPatch} (${seconds}s)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
