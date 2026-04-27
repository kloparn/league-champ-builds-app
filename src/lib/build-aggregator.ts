/**
 * Aggregates Riot MATCH-V5 match payloads into per-champion build stats,
 * bucketed by role. Pure functions only — no I/O.
 *
 * When timeline data is provided alongside a match, we additionally
 * derive an ordered "build path" by walking ITEM_PURCHASED events and
 * filtering with the caller-supplied isLegendary / isBoots predicates.
 */

export interface MatchParticipant {
  championId: number;
  championName: string;
  teamPosition: string;
  win: boolean;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  perks: {
    styles: Array<{
      style: number;
      description: string;
      selections: Array<{ perk: number; var1: number; var2: number; var3: number }>;
    }>;
  };
  summoner1Id: number;
  summoner2Id: number;
}

export interface MatchDto {
  metadata: { matchId: string };
  info: {
    queueId: number;
    gameVersion: string;
    participants: MatchParticipant[];
  };
}

export type TimelineEvent =
  | { type: 'ITEM_PURCHASED'; timestamp: number; participantId: number; itemId: number }
  | { type: 'ITEM_SOLD'; timestamp: number; participantId: number; itemId: number }
  | { type: 'ITEM_DESTROYED'; timestamp: number; participantId: number; itemId: number }
  | {
      type: 'ITEM_UNDO';
      timestamp: number;
      participantId: number;
      beforeId: number;
      afterId: number;
    }
  | { type: string; timestamp: number; participantId?: number; [key: string]: unknown };

export interface MatchTimelineDto {
  metadata: { matchId: string };
  info: {
    frames: Array<{
      timestamp: number;
      events: TimelineEvent[];
    }>;
  };
}

export interface EnrichedMatch {
  match: MatchDto;
  timeline?: MatchTimelineDto | null;
}

export interface ItemEntry {
  itemId: number;
  count: number;
  pickRate: number;
  winrate: number;
}

export interface RuneSetup {
  primaryStyle: number;
  subStyle: number;
  keystone: number;
  count: number;
  winrate: number;
}

export interface SpellPair {
  spell1: number;
  spell2: number;
  count: number;
  winrate: number;
}

export interface RoleBuildStats {
  games: number;
  wins: number;
  winrate: number;
  topItems: ItemEntry[];
  /** Ordered build path: index 0 = first legendary completed, 1 = second, etc.
   * Each slot ranks items by frequency among matches that reached that slot. */
  itemPath: ItemEntry[][];
  topBoots: ItemEntry[];
  topRunes: RuneSetup[];
  topSummonerSpells: SpellPair[];
}

export interface ChampionBuildStats {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  winrate: number;
  /** Per-role breakdown. Keys are Riot's `teamPosition` values
   * (TOP / JUNGLE / MIDDLE / BOTTOM / UTILITY). Roles below
   * MIN_GAMES_PER_ROLE games are omitted to keep stats meaningful. */
  byRole: Record<string, RoleBuildStats>;
}

export interface BuildsData {
  generatedAt: string;
  patch: string;
  region: string;
  queue: string;
  sampleSize: number;
  /** Riot tier names sampled by the refresh script
   * (e.g. ["CHALLENGER", "GRANDMASTER", "MASTER", "DIAMOND"]). */
  tiers?: string[];
  champions: Record<string, ChampionBuildStats>;
}

export interface AggregateOptions {
  region: string;
  queue: string;
  patch: string;
  topItems?: number;
  topRunes?: number;
  topSpells?: number;
  /** Number of legendary slots to track in the build path. Default 4. */
  pathSlots?: number;
  /** Top-N items to keep per path slot. Default 3. */
  topPerSlot?: number;
  /** Minimum games for a role bucket to be included in `byRole`. Default 5. */
  minGamesPerRole?: number;
  /** Predicate identifying terminal "legendary" items (excluding boots). */
  isLegendary?: (itemId: number) => boolean;
  /** Predicate identifying tier-2 boots. */
  isBoots?: (itemId: number) => boolean;
  now?: Date;
}

interface ChampionBucket {
  championId: number;
  name: string;
  games: number;
  wins: number;
  byRole: Map<string, RoleBucket>;
}

interface RoleBucket {
  games: number;
  wins: number;
  items: Map<number, { count: number; wins: number }>;
  /** Per-slot: how often was each item the Nth completed legendary? */
  pathSlots: Array<Map<number, { count: number; wins: number }>>;
  /** Across all matches in this role, how often was the Nth legendary slot reached? */
  pathSlotReached: number[];
  boots: Map<number, { count: number; wins: number }>;
  bootsPicked: number;
  runes: Map<string, RuneBucketEntry>;
  spells: Map<string, SpellBucketEntry>;
}

interface RuneBucketEntry {
  primaryStyle: number;
  subStyle: number;
  keystone: number;
  count: number;
  wins: number;
}

interface SpellBucketEntry {
  spell1: number;
  spell2: number;
  count: number;
  wins: number;
}

export type BucketState = Map<number, ChampionBucket>;

export interface SerializedBucketState {
  schemaVersion: 1;
  pathSlots: number;
  champions: Record<string, SerializedChampionBucket>;
}

interface SerializedChampionBucket {
  championId: number;
  name: string;
  games: number;
  wins: number;
  byRole: Record<string, SerializedRoleBucket>;
}

interface SerializedRoleBucket {
  games: number;
  wins: number;
  /** itemId -> [count, wins] */
  items: Record<string, [number, number]>;
  /** array of length pathSlots; each slot is itemId -> [count, wins] */
  pathSlots: Array<Record<string, [number, number]>>;
  pathSlotReached: number[];
  boots: Record<string, [number, number]>;
  bootsPicked: number;
  /** key "primaryStyle-subStyle-keystone" -> [count, wins] */
  runes: Record<string, [number, number]>;
  /** key "spell1-spell2" (sorted) -> [count, wins] */
  spells: Record<string, [number, number]>;
}

const ITEM_SLOTS_FINAL = ['item0', 'item1', 'item2', 'item3', 'item4', 'item5'] as const;

const alwaysFalse = (_: number): boolean => false;

export function createBucketState(): BucketState {
  return new Map();
}

export interface AddMatchOptions {
  pathSlots?: number;
  isLegendary?: (itemId: number) => boolean;
  isBoots?: (itemId: number) => boolean;
}

/** Mutates `state` to incorporate one enriched match. */
export function addMatchToState(
  state: BucketState,
  enriched: EnrichedMatch | MatchDto,
  options: AddMatchOptions = {}
): void {
  const pathSlots = options.pathSlots ?? 4;
  const isLegendary = options.isLegendary ?? alwaysFalse;
  const isBoots = options.isBoots ?? alwaysFalse;

  const { match, timeline } = 'match' in enriched ? enriched : { match: enriched, timeline: null };

  const purchaseLists = timeline
    ? extractPurchasePaths(timeline, isLegendary, isBoots)
    : new Map<number, { legendaries: number[]; boots: number[] }>();

  for (let i = 0; i < match.info.participants.length; i++) {
    const p = match.info.participants[i]!;
    const bucket = getOrCreateBucket(state, p);
    bucket.games += 1;
    if (p.win) bucket.wins += 1;

    if (!p.teamPosition) continue;
    const roleBucket = getOrCreateRoleBucket(bucket, p.teamPosition, pathSlots);
    roleBucket.games += 1;
    if (p.win) roleBucket.wins += 1;

    for (const slot of ITEM_SLOTS_FINAL) {
      const itemId = p[slot];
      if (itemId === 0) continue;
      const entry = roleBucket.items.get(itemId) ?? { count: 0, wins: 0 };
      entry.count += 1;
      if (p.win) entry.wins += 1;
      roleBucket.items.set(itemId, entry);
    }

    const path = purchaseLists.get(i + 1);
    if (path) {
      for (let slot = 0; slot < pathSlots && slot < path.legendaries.length; slot++) {
        const itemId = path.legendaries[slot]!;
        roleBucket.pathSlotReached[slot] = (roleBucket.pathSlotReached[slot] ?? 0) + 1;
        const entry = roleBucket.pathSlots[slot]!.get(itemId) ?? { count: 0, wins: 0 };
        entry.count += 1;
        if (p.win) entry.wins += 1;
        roleBucket.pathSlots[slot]!.set(itemId, entry);
      }
      const firstBoots = path.boots[0];
      if (firstBoots != null) {
        roleBucket.bootsPicked += 1;
        const entry = roleBucket.boots.get(firstBoots) ?? { count: 0, wins: 0 };
        entry.count += 1;
        if (p.win) entry.wins += 1;
        roleBucket.boots.set(firstBoots, entry);
      }
    }

    addRune(roleBucket, p);
    addSpells(roleBucket, p);
  }
}

export interface FinalizeOptions {
  region: string;
  queue: string;
  patch: string;
  sampleSize: number;
  tiers?: string[];
  topItems?: number;
  topRunes?: number;
  topSpells?: number;
  topPerSlot?: number;
  minGamesPerRole?: number;
  now?: Date;
}

/** Derive ranked BuildsData from a bucket state. */
export function finalizeState(state: BucketState, options: FinalizeOptions): BuildsData {
  const topItemsN = options.topItems ?? 20;
  const topRunesN = options.topRunes ?? 3;
  const topSpellsN = options.topSpells ?? 3;
  const topPerSlot = options.topPerSlot ?? 3;
  const minGamesPerRole = options.minGamesPerRole ?? 5;

  const champions: Record<string, ChampionBuildStats> = {};
  for (const bucket of state.values()) {
    const byRole: Record<string, RoleBuildStats> = {};
    for (const [role, rb] of bucket.byRole) {
      if (rb.games < minGamesPerRole) continue;
      byRole[role] = {
        games: rb.games,
        wins: rb.wins,
        winrate: ratio(rb.wins, rb.games),
        topItems: rankItems(rb, topItemsN),
        itemPath: rankPath(rb, topPerSlot),
        topBoots: rankBoots(rb, 3),
        topRunes: rankRunes(rb, topRunesN),
        topSummonerSpells: rankSpells(rb, topSpellsN)
      };
    }

    champions[bucket.name] = {
      championId: bucket.championId,
      championName: bucket.name,
      games: bucket.games,
      wins: bucket.wins,
      winrate: ratio(bucket.wins, bucket.games),
      byRole
    };
  }

  return {
    generatedAt: (options.now ?? new Date()).toISOString(),
    patch: options.patch,
    region: options.region,
    queue: options.queue,
    sampleSize: options.sampleSize,
    ...(options.tiers ? { tiers: options.tiers } : {}),
    champions
  };
}

export function serializeBucketState(state: BucketState, pathSlots = 4): SerializedBucketState {
  const champions: Record<string, SerializedChampionBucket> = {};
  for (const [championId, bucket] of state) {
    const byRole: Record<string, SerializedRoleBucket> = {};
    for (const [role, rb] of bucket.byRole) {
      byRole[role] = {
        games: rb.games,
        wins: rb.wins,
        items: serializeCountMap(rb.items),
        pathSlots: rb.pathSlots.map(serializeCountMap),
        pathSlotReached: [...rb.pathSlotReached],
        boots: serializeCountMap(rb.boots),
        bootsPicked: rb.bootsPicked,
        runes: serializeRuneMap(rb.runes),
        spells: serializeSpellMap(rb.spells)
      };
    }
    champions[String(championId)] = {
      championId: bucket.championId,
      name: bucket.name,
      games: bucket.games,
      wins: bucket.wins,
      byRole
    };
  }
  return { schemaVersion: 1, pathSlots, champions };
}

export function deserializeBucketState(serialized: SerializedBucketState): BucketState {
  const state: BucketState = new Map();
  for (const [championIdStr, sb] of Object.entries(serialized.champions)) {
    const byRole = new Map<string, RoleBucket>();
    for (const [role, sr] of Object.entries(sb.byRole)) {
      byRole.set(role, {
        games: sr.games,
        wins: sr.wins,
        items: deserializeCountMap(sr.items),
        pathSlots: sr.pathSlots.map(deserializeCountMap),
        pathSlotReached: [...sr.pathSlotReached],
        boots: deserializeCountMap(sr.boots),
        bootsPicked: sr.bootsPicked,
        runes: deserializeRuneMap(sr.runes),
        spells: deserializeSpellMap(sr.spells)
      });
    }
    state.set(parseInt(championIdStr, 10), {
      championId: sb.championId,
      name: sb.name,
      games: sb.games,
      wins: sb.wins,
      byRole
    });
  }
  return state;
}

function serializeCountMap(
  map: Map<number, { count: number; wins: number }>
): Record<string, [number, number]> {
  const out: Record<string, [number, number]> = {};
  for (const [id, { count, wins }] of map) out[String(id)] = [count, wins];
  return out;
}

function deserializeCountMap(
  obj: Record<string, [number, number]>
): Map<number, { count: number; wins: number }> {
  const map = new Map<number, { count: number; wins: number }>();
  for (const [id, [count, wins]] of Object.entries(obj)) {
    map.set(parseInt(id, 10), { count, wins });
  }
  return map;
}

function serializeRuneMap(map: Map<string, RuneBucketEntry>): Record<string, [number, number]> {
  const out: Record<string, [number, number]> = {};
  for (const [key, entry] of map) out[key] = [entry.count, entry.wins];
  return out;
}

function deserializeRuneMap(obj: Record<string, [number, number]>): Map<string, RuneBucketEntry> {
  const map = new Map<string, RuneBucketEntry>();
  for (const [key, [count, wins]] of Object.entries(obj)) {
    const [primary, sub, keystone] = key.split('-').map((n) => parseInt(n, 10));
    map.set(key, {
      primaryStyle: primary ?? 0,
      subStyle: sub ?? 0,
      keystone: keystone ?? 0,
      count,
      wins
    });
  }
  return map;
}

function serializeSpellMap(map: Map<string, SpellBucketEntry>): Record<string, [number, number]> {
  const out: Record<string, [number, number]> = {};
  for (const [key, entry] of map) out[key] = [entry.count, entry.wins];
  return out;
}

function deserializeSpellMap(
  obj: Record<string, [number, number]>
): Map<string, SpellBucketEntry> {
  const map = new Map<string, SpellBucketEntry>();
  for (const [key, [count, wins]] of Object.entries(obj)) {
    const [s1, s2] = key.split('-').map((n) => parseInt(n, 10));
    map.set(key, { spell1: s1 ?? 0, spell2: s2 ?? 0, count, wins });
  }
  return map;
}

/** One-shot aggregation. Convenience wrapper around addMatchToState + finalizeState. */
export function aggregateBuilds(
  input: EnrichedMatch[] | MatchDto[],
  options: AggregateOptions
): BuildsData {
  const state = createBucketState();
  for (const m of input) {
    addMatchToState(state, m, {
      pathSlots: options.pathSlots,
      isLegendary: options.isLegendary,
      isBoots: options.isBoots
    });
  }
  return finalizeState(state, {
    region: options.region,
    queue: options.queue,
    patch: options.patch,
    sampleSize: input.length,
    topItems: options.topItems,
    topRunes: options.topRunes,
    topSpells: options.topSpells,
    topPerSlot: options.topPerSlot,
    minGamesPerRole: options.minGamesPerRole,
    now: options.now
  });
}

/**
 * Walk a timeline's events per participant, applying ITEM_UNDO corrections,
 * and return the ordered list of completed legendaries and boots that each
 * participant purchased. Boots use the first acquired pair only.
 */
export function extractPurchasePaths(
  timeline: MatchTimelineDto,
  isLegendary: (itemId: number) => boolean,
  isBoots: (itemId: number) => boolean
): Map<number, { legendaries: number[]; boots: number[] }> {
  const out = new Map<number, { legendaries: number[]; boots: number[] }>();

  for (const frame of timeline.info.frames) {
    for (const event of frame.events) {
      if (event.type === 'ITEM_PURCHASED' && typeof event.participantId === 'number') {
        const itemId = (event as { itemId?: number }).itemId;
        if (typeof itemId !== 'number') continue;
        const entry = getOrCreatePath(out, event.participantId);
        if (isLegendary(itemId)) entry.legendaries.push(itemId);
        else if (isBoots(itemId)) entry.boots.push(itemId);
      } else if (event.type === 'ITEM_UNDO' && typeof event.participantId === 'number') {
        const beforeId = (event as { beforeId?: number }).beforeId;
        if (typeof beforeId !== 'number') continue;
        const entry = getOrCreatePath(out, event.participantId);
        // Remove the most-recent matching entry from whichever list it belongs to.
        if (
          entry.legendaries.length > 0 &&
          entry.legendaries[entry.legendaries.length - 1] === beforeId
        ) {
          entry.legendaries.pop();
        } else if (entry.boots.length > 0 && entry.boots[entry.boots.length - 1] === beforeId) {
          entry.boots.pop();
        } else {
          // Fallback: scan from the end of either list and remove first match.
          const legIdx = entry.legendaries.lastIndexOf(beforeId);
          const bootIdx = entry.boots.lastIndexOf(beforeId);
          if (legIdx >= 0 && legIdx >= bootIdx) entry.legendaries.splice(legIdx, 1);
          else if (bootIdx >= 0) entry.boots.splice(bootIdx, 1);
        }
      }
    }
  }

  return out;
}

function getOrCreatePath(
  map: Map<number, { legendaries: number[]; boots: number[] }>,
  participantId: number
): { legendaries: number[]; boots: number[] } {
  let entry = map.get(participantId);
  if (!entry) {
    entry = { legendaries: [], boots: [] };
    map.set(participantId, entry);
  }
  return entry;
}

function getOrCreateBucket(
  buckets: Map<number, ChampionBucket>,
  p: MatchParticipant
): ChampionBucket {
  let bucket = buckets.get(p.championId);
  if (!bucket) {
    bucket = {
      championId: p.championId,
      name: p.championName,
      games: 0,
      wins: 0,
      byRole: new Map()
    };
    buckets.set(p.championId, bucket);
  }
  return bucket;
}

function getOrCreateRoleBucket(
  bucket: ChampionBucket,
  role: string,
  pathSlots: number
): RoleBucket {
  let rb = bucket.byRole.get(role);
  if (!rb) {
    rb = {
      games: 0,
      wins: 0,
      items: new Map(),
      pathSlots: Array.from({ length: pathSlots }, () => new Map()),
      pathSlotReached: Array.from({ length: pathSlots }, () => 0),
      boots: new Map(),
      bootsPicked: 0,
      runes: new Map(),
      spells: new Map()
    };
    bucket.byRole.set(role, rb);
  }
  return rb;
}

function addRune(rb: RoleBucket, p: MatchParticipant): void {
  const primary = p.perks.styles[0];
  const sub = p.perks.styles[1];
  if (!primary || !sub) return;
  const keystone = primary.selections[0]?.perk ?? 0;
  const key = `${primary.style}-${sub.style}-${keystone}`;
  const entry = rb.runes.get(key) ?? {
    primaryStyle: primary.style,
    subStyle: sub.style,
    keystone,
    count: 0,
    wins: 0
  };
  entry.count += 1;
  if (p.win) entry.wins += 1;
  rb.runes.set(key, entry);
}

function addSpells(rb: RoleBucket, p: MatchParticipant): void {
  const [spell1, spell2] = [p.summoner1Id, p.summoner2Id].sort((a, b) => a - b);
  const key = `${spell1}-${spell2}`;
  const entry = rb.spells.get(key) ?? { spell1, spell2, count: 0, wins: 0 };
  entry.count += 1;
  if (p.win) entry.wins += 1;
  rb.spells.set(key, entry);
}

function rankItems(rb: RoleBucket, n: number): ItemEntry[] {
  return [...rb.items.entries()]
    .map(([itemId, { count, wins }]) => ({
      itemId,
      count,
      pickRate: ratio(count, rb.games),
      winrate: ratio(wins, count)
    }))
    .sort(byCountDesc)
    .slice(0, n);
}

function rankPath(rb: RoleBucket, topPerSlot: number): ItemEntry[][] {
  return rb.pathSlots.map((slotMap, idx) => {
    const reached = rb.pathSlotReached[idx] ?? 0;
    if (reached === 0) return [];
    return [...slotMap.entries()]
      .map(([itemId, { count, wins }]) => ({
        itemId,
        count,
        pickRate: ratio(count, reached),
        winrate: ratio(wins, count)
      }))
      .sort(byCountDesc)
      .slice(0, topPerSlot);
  });
}

function rankBoots(rb: RoleBucket, n: number): ItemEntry[] {
  if (rb.bootsPicked === 0) return [];
  return [...rb.boots.entries()]
    .map(([itemId, { count, wins }]) => ({
      itemId,
      count,
      pickRate: ratio(count, rb.bootsPicked),
      winrate: ratio(wins, count)
    }))
    .sort(byCountDesc)
    .slice(0, n);
}

function rankRunes(rb: RoleBucket, n: number): RuneSetup[] {
  return [...rb.runes.values()]
    .map((r) => ({
      primaryStyle: r.primaryStyle,
      subStyle: r.subStyle,
      keystone: r.keystone,
      count: r.count,
      winrate: ratio(r.wins, r.count)
    }))
    .sort(byCountDesc)
    .slice(0, n);
}

function rankSpells(rb: RoleBucket, n: number): SpellPair[] {
  return [...rb.spells.values()]
    .map((s) => ({
      spell1: s.spell1,
      spell2: s.spell2,
      count: s.count,
      winrate: ratio(s.wins, s.count)
    }))
    .sort(byCountDesc)
    .slice(0, n);
}

function byCountDesc<T extends { count: number }>(a: T, b: T): number {
  return b.count - a.count;
}

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

/** Extract major.minor from a Riot gameVersion like "15.10.546.6713". */
export function patchFromGameVersion(gameVersion: string): string {
  const parts = gameVersion.split('.');
  if (parts.length < 2) return gameVersion;
  return `${parts[0]}.${parts[1]}`;
}

/** Format Riot's teamPosition values for display. */
export function displayRole(role: string): string {
  switch (role) {
    case 'TOP':
      return 'Top';
    case 'JUNGLE':
      return 'Jungle';
    case 'MIDDLE':
      return 'Mid';
    case 'BOTTOM':
      return 'Bot';
    case 'UTILITY':
      return 'Support';
    default:
      return role;
  }
}

/** Sort role keys by games descending — used for default-role selection in the UI. */
export function rolesByPopularity(byRole: Record<string, RoleBuildStats>): string[] {
  return Object.entries(byRole)
    .sort(([, a], [, b]) => b.games - a.games)
    .map(([role]) => role);
}
