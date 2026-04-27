import { describe, expect, it } from 'vitest';
import {
  addMatchToState,
  aggregateBuilds,
  createBucketState,
  deserializeBucketState,
  displayRole,
  extractPurchasePaths,
  finalizeState,
  patchFromGameVersion,
  rolesByPopularity,
  serializeBucketState,
  type MatchDto,
  type MatchParticipant,
  type MatchTimelineDto,
  type TimelineEvent
} from './build-aggregator';

const BASE_OPTIONS = {
  region: 'EUW',
  queue: 'RANKED_SOLO_5x5',
  patch: '15.10',
  minGamesPerRole: 1,
  now: new Date('2026-04-26T00:00:00Z')
};

function p(overrides: Partial<MatchParticipant> = {}): MatchParticipant {
  return {
    championId: 32,
    championName: 'Amumu',
    teamPosition: 'JUNGLE',
    win: true,
    item0: 3157,
    item1: 6655,
    item2: 3020,
    item3: 4645,
    item4: 3135,
    item5: 0,
    item6: 3340,
    perks: {
      styles: [
        {
          style: 8200,
          description: 'primaryStyle',
          selections: [
            { perk: 8230, var1: 0, var2: 0, var3: 0 },
            { perk: 8226, var1: 0, var2: 0, var3: 0 },
            { perk: 8210, var1: 0, var2: 0, var3: 0 },
            { perk: 8237, var1: 0, var2: 0, var3: 0 }
          ]
        },
        {
          style: 8000,
          description: 'subStyle',
          selections: [
            { perk: 8009, var1: 0, var2: 0, var3: 0 },
            { perk: 8014, var1: 0, var2: 0, var3: 0 }
          ]
        }
      ]
    },
    summoner1Id: 4,
    summoner2Id: 12,
    ...overrides
  };
}

function match(participants: MatchParticipant[], gameVersion = '15.10.546.6713'): MatchDto {
  return {
    metadata: { matchId: `EUW1_${Math.random().toString(36).slice(2)}` },
    info: { queueId: 420, gameVersion, participants }
  };
}

function timeline(eventsByParticipant: Record<number, TimelineEvent[]>): MatchTimelineDto {
  const events: TimelineEvent[] = [];
  for (const list of Object.values(eventsByParticipant)) events.push(...list);
  events.sort((a, b) => a.timestamp - b.timestamp);
  return {
    metadata: { matchId: `EUW1_${Math.random().toString(36).slice(2)}` },
    info: { frames: [{ timestamp: 0, events }] }
  };
}

function purchase(participantId: number, itemId: number, ts: number): TimelineEvent {
  return { type: 'ITEM_PURCHASED', participantId, itemId, timestamp: ts };
}

function undo(
  participantId: number,
  beforeId: number,
  afterId: number,
  ts: number
): TimelineEvent {
  return { type: 'ITEM_UNDO', participantId, beforeId, afterId, timestamp: ts };
}

// Marksman legendaries for these tests: Statikk Shiv (6677), Phantom Dancer (3046),
// Infinity Edge (3031). Tier-2 boots: Berserker's Greaves (3006). Components like
// Long Sword (1036) are excluded by the predicate.
const TEST_LEGENDARY = new Set([6677, 3046, 3031, 3033, 3094]);
const TEST_BOOTS = new Set([3006, 3047, 3111, 3020, 3158]);
const isLegendary = (id: number) => TEST_LEGENDARY.has(id);
const isBoots = (id: number) => TEST_BOOTS.has(id);

describe('aggregateBuilds', () => {
  it('counts overall games and wins per champion', () => {
    const result = aggregateBuilds(
      [
        match([p({ win: true })]),
        match([p({ win: false })]),
        match([p({ win: true })])
      ],
      BASE_OPTIONS
    );

    const amumu = result.champions.Amumu;
    expect(amumu.games).toBe(3);
    expect(amumu.wins).toBe(2);
    expect(amumu.winrate).toBeCloseTo(2 / 3, 5);
  });

  it('buckets items, runes, and spells per role', () => {
    const result = aggregateBuilds(
      [
        match([p({ teamPosition: 'JUNGLE', item0: 3157 })]),
        match([p({ teamPosition: 'JUNGLE', item0: 3157 })]),
        match([p({ teamPosition: 'TOP', item0: 6655 })])
      ],
      BASE_OPTIONS
    );

    const amumu = result.champions.Amumu;
    expect(amumu.byRole.JUNGLE?.games).toBe(2);
    expect(amumu.byRole.TOP?.games).toBe(1);
    expect(amumu.byRole.JUNGLE?.topItems[0]?.itemId).toBe(3157);
    expect(amumu.byRole.TOP?.topItems[0]?.itemId).toBe(6655);
  });

  it('excludes empty slots and trinket from per-role item ranking', () => {
    const result = aggregateBuilds(
      [
        match([
          p({
            teamPosition: 'JUNGLE',
            item0: 3157,
            item1: 6655,
            item2: 0,
            item3: 0,
            item4: 0,
            item5: 0,
            item6: 3340
          })
        ])
      ],
      BASE_OPTIONS
    );

    const ids = result.champions.Amumu.byRole.JUNGLE?.topItems.map((i) => i.itemId) ?? [];
    expect(ids).toContain(3157);
    expect(ids).toContain(6655);
    expect(ids).not.toContain(0);
    expect(ids).not.toContain(3340);
  });

  it('omits roles below minGamesPerRole', () => {
    const result = aggregateBuilds(
      [
        match([p({ teamPosition: 'JUNGLE' })]),
        match([p({ teamPosition: 'JUNGLE' })]),
        match([p({ teamPosition: 'JUNGLE' })]),
        match([p({ teamPosition: 'TOP' })])
      ],
      { ...BASE_OPTIONS, minGamesPerRole: 2 }
    );

    const amumu = result.champions.Amumu;
    expect(amumu.byRole.JUNGLE).toBeDefined();
    expect(amumu.byRole.TOP).toBeUndefined();
    // overall stats still include the dropped role's games
    expect(amumu.games).toBe(4);
  });

  it('skips role aggregation for participants with empty teamPosition', () => {
    const result = aggregateBuilds(
      [
        match([p({ teamPosition: 'JUNGLE' })]),
        match([p({ teamPosition: '' })])
      ],
      BASE_OPTIONS
    );

    const amumu = result.champions.Amumu;
    expect(amumu.games).toBe(2);
    expect(Object.keys(amumu.byRole)).toEqual(['JUNGLE']);
    expect(amumu.byRole.JUNGLE?.games).toBe(1);
  });

  it('groups runes per role by primaryStyle + subStyle + keystone', () => {
    const conqueror = (over: Partial<MatchParticipant> = {}) =>
      p({
        teamPosition: 'JUNGLE',
        perks: {
          styles: [
            {
              style: 8000,
              description: 'primaryStyle',
              selections: [{ perk: 8010, var1: 0, var2: 0, var3: 0 }]
            },
            {
              style: 8400,
              description: 'subStyle',
              selections: [{ perk: 8429, var1: 0, var2: 0, var3: 0 }]
            }
          ]
        },
        ...over
      });

    const result = aggregateBuilds(
      [match([conqueror()]), match([conqueror()]), match([p({ teamPosition: 'JUNGLE' })])],
      BASE_OPTIONS
    );

    const runes = result.champions.Amumu.byRole.JUNGLE?.topRunes ?? [];
    expect(runes[0]).toMatchObject({ keystone: 8010, primaryStyle: 8000, count: 2 });
    expect(runes[1]).toMatchObject({ keystone: 8230, count: 1 });
  });

  it('normalizes summoner spell pairs by sorting', () => {
    const result = aggregateBuilds(
      [
        match([p({ summoner1Id: 4, summoner2Id: 12 })]),
        match([p({ summoner1Id: 12, summoner2Id: 4 })])
      ],
      BASE_OPTIONS
    );

    const spells = result.champions.Amumu.byRole.JUNGLE?.topSummonerSpells ?? [];
    expect(spells).toHaveLength(1);
    expect(spells[0]).toMatchObject({ spell1: 4, spell2: 12, count: 2 });
  });

  it('separates buckets per champion', () => {
    const result = aggregateBuilds(
      [
        match([p({ championId: 32, championName: 'Amumu' })]),
        match([p({ championId: 103, championName: 'Ahri', teamPosition: 'MIDDLE' })])
      ],
      BASE_OPTIONS
    );

    expect(result.champions.Amumu.byRole.JUNGLE?.games).toBe(1);
    expect(result.champions.Ahri.byRole.MIDDLE?.games).toBe(1);
  });

  it('produces metadata reflecting the input options', () => {
    const result = aggregateBuilds([match([p()])], BASE_OPTIONS);
    expect(result).toMatchObject({
      generatedAt: '2026-04-26T00:00:00.000Z',
      patch: '15.10',
      region: 'EUW',
      queue: 'RANKED_SOLO_5x5',
      sampleSize: 1
    });
  });

  it('returns an empty champions map for no matches', () => {
    const result = aggregateBuilds([], BASE_OPTIONS);
    expect(result.champions).toEqual({});
    expect(result.sampleSize).toBe(0);
  });
});

describe('rolesByPopularity', () => {
  it('returns roles sorted by games descending', () => {
    const empty = {
      wins: 0,
      winrate: 0,
      topItems: [],
      itemPath: [],
      topBoots: [],
      topRunes: [],
      topSummonerSpells: []
    };
    const order = rolesByPopularity({
      TOP: { games: 5, ...empty },
      JUNGLE: { games: 20, ...empty },
      MIDDLE: { games: 12, ...empty }
    });
    expect(order).toEqual(['JUNGLE', 'MIDDLE', 'TOP']);
  });
});

describe('extractPurchasePaths', () => {
  it('records legendary purchases per participant in order', () => {
    const tl = timeline({
      1: [
        purchase(1, 1036, 60_000), // Long Sword (component) — ignored
        purchase(1, 6677, 600_000), // Statikk Shiv
        purchase(1, 3006, 900_000), // Berserker's Greaves
        purchase(1, 3046, 1_200_000) // Phantom Dancer
      ]
    });

    const paths = extractPurchasePaths(tl, isLegendary, isBoots);
    expect(paths.get(1)?.legendaries).toEqual([6677, 3046]);
    expect(paths.get(1)?.boots).toEqual([3006]);
  });

  it('removes the most recent purchase on ITEM_UNDO', () => {
    const tl = timeline({
      1: [
        purchase(1, 6677, 600_000),
        purchase(1, 3046, 900_000),
        undo(1, 3046, 0, 905_000), // undo Phantom Dancer
        purchase(1, 3031, 1_200_000) // Infinity Edge
      ]
    });

    const paths = extractPurchasePaths(tl, isLegendary, isBoots);
    expect(paths.get(1)?.legendaries).toEqual([6677, 3031]);
  });

  it('separates participants', () => {
    const tl = timeline({
      1: [purchase(1, 6677, 600_000)],
      2: [purchase(2, 3031, 700_000)]
    });

    const paths = extractPurchasePaths(tl, isLegendary, isBoots);
    expect(paths.get(1)?.legendaries).toEqual([6677]);
    expect(paths.get(2)?.legendaries).toEqual([3031]);
  });
});

describe('aggregateBuilds with timelines', () => {
  it('emits an itemPath ranking per slot using purchase order', () => {
    const m1 = match([p({ teamPosition: 'BOTTOM', win: true })]);
    const m2 = match([p({ teamPosition: 'BOTTOM', win: true })]);
    const m3 = match([p({ teamPosition: 'BOTTOM', win: false })]);

    const t1 = timeline({
      1: [purchase(1, 6677, 100), purchase(1, 3046, 200), purchase(1, 3031, 300)]
    });
    const t2 = timeline({
      1: [purchase(1, 6677, 100), purchase(1, 3031, 200)]
    });
    const t3 = timeline({
      1: [purchase(1, 3031, 100), purchase(1, 3046, 200)]
    });

    const result = aggregateBuilds(
      [
        { match: m1, timeline: t1 },
        { match: m2, timeline: t2 },
        { match: m3, timeline: t3 }
      ],
      { ...BASE_OPTIONS, isLegendary, isBoots }
    );

    const path = result.champions.Amumu.byRole.BOTTOM?.itemPath;
    expect(path).toBeDefined();
    // Slot 0: Statikk x2, Infinity Edge x1 → Statikk leads.
    expect(path?.[0]?.[0]?.itemId).toBe(6677);
    expect(path?.[0]?.[0]?.count).toBe(2);
    expect(path?.[0]?.[0]?.pickRate).toBeCloseTo(2 / 3, 5);
    // Slot 1: Phantom Dancer x2, Infinity Edge x1 → Phantom Dancer leads.
    expect(path?.[1]?.[0]?.itemId).toBe(3046);
    expect(path?.[1]?.[0]?.count).toBe(2);
    // Slot 2: only m1 reached it (Infinity Edge); pickRate is over those who reached.
    expect(path?.[2]?.[0]?.itemId).toBe(3031);
    expect(path?.[2]?.[0]?.pickRate).toBeCloseTo(1, 5);
  });

  it('emits topBoots from the first boots purchased per match', () => {
    const m1 = match([p({ teamPosition: 'BOTTOM' })]);
    const m2 = match([p({ teamPosition: 'BOTTOM' })]);

    const t1 = timeline({ 1: [purchase(1, 3006, 600_000)] });
    const t2 = timeline({ 1: [purchase(1, 3006, 600_000)] });

    const result = aggregateBuilds(
      [
        { match: m1, timeline: t1 },
        { match: m2, timeline: t2 }
      ],
      { ...BASE_OPTIONS, isLegendary, isBoots }
    );

    const boots = result.champions.Amumu.byRole.BOTTOM?.topBoots;
    expect(boots?.[0]?.itemId).toBe(3006);
    expect(boots?.[0]?.count).toBe(2);
  });

  it('falls back to empty path/boots when no timeline is supplied', () => {
    const m = match([p({ teamPosition: 'JUNGLE' })]);
    const result = aggregateBuilds([{ match: m }], {
      ...BASE_OPTIONS,
      isLegendary,
      isBoots
    });

    const role = result.champions.Amumu.byRole.JUNGLE;
    expect(role?.itemPath).toEqual([[], [], [], []]);
    expect(role?.topBoots).toEqual([]);
  });

  it('still accepts plain MatchDto[] for backward compatibility', () => {
    const result = aggregateBuilds([match([p()])], BASE_OPTIONS);
    expect(result.champions.Amumu.games).toBe(1);
    expect(result.champions.Amumu.byRole.JUNGLE?.itemPath).toEqual([[], [], [], []]);
  });
});

describe('displayRole', () => {
  it('renders Riot teamPosition values as friendly labels', () => {
    expect(displayRole('TOP')).toBe('Top');
    expect(displayRole('JUNGLE')).toBe('Jungle');
    expect(displayRole('MIDDLE')).toBe('Mid');
    expect(displayRole('BOTTOM')).toBe('Bot');
    expect(displayRole('UTILITY')).toBe('Support');
  });

  it('falls back to the raw value when unknown', () => {
    expect(displayRole('FOOBAR')).toBe('FOOBAR');
  });
});

describe('patchFromGameVersion', () => {
  it('returns major.minor from a full version', () => {
    expect(patchFromGameVersion('15.10.546.6713')).toBe('15.10');
  });

  it('returns the input when too short', () => {
    expect(patchFromGameVersion('15')).toBe('15');
  });
});

describe('incremental state aggregation', () => {
  it('addMatchToState in two batches matches one-shot aggregateBuilds', () => {
    const m1 = match([p({ teamPosition: 'JUNGLE', win: true, item0: 3157 })]);
    const m2 = match([p({ teamPosition: 'JUNGLE', win: false, item0: 6655 })]);
    const m3 = match([p({ teamPosition: 'JUNGLE', win: true, item0: 3157 })]);

    const t1 = timeline({ 1: [purchase(1, 6677, 100), purchase(1, 3046, 200)] });
    const t2 = timeline({ 1: [purchase(1, 3031, 100)] });
    const t3 = timeline({ 1: [purchase(1, 6677, 100), purchase(1, 3031, 200)] });

    const oneShot = aggregateBuilds(
      [
        { match: m1, timeline: t1 },
        { match: m2, timeline: t2 },
        { match: m3, timeline: t3 }
      ],
      { ...BASE_OPTIONS, isLegendary, isBoots }
    );

    const state = createBucketState();
    addMatchToState(
      state,
      { match: m1, timeline: t1 },
      { isLegendary, isBoots, pathSlots: 4 }
    );
    addMatchToState(
      state,
      { match: m2, timeline: t2 },
      { isLegendary, isBoots, pathSlots: 4 }
    );
    addMatchToState(
      state,
      { match: m3, timeline: t3 },
      { isLegendary, isBoots, pathSlots: 4 }
    );
    const incremental = finalizeState(state, {
      region: BASE_OPTIONS.region,
      queue: BASE_OPTIONS.queue,
      patch: BASE_OPTIONS.patch,
      sampleSize: 3,
      minGamesPerRole: BASE_OPTIONS.minGamesPerRole,
      now: BASE_OPTIONS.now
    });

    expect(incremental).toEqual(oneShot);
  });

  it('serializeBucketState round-trips through deserializeBucketState', () => {
    const state = createBucketState();
    const m1 = match([p({ teamPosition: 'JUNGLE', win: true, item0: 3157 })]);
    const t1 = timeline({
      1: [purchase(1, 6677, 100), purchase(1, 3006, 150), purchase(1, 3046, 200)]
    });
    addMatchToState(state, { match: m1, timeline: t1 }, { isLegendary, isBoots, pathSlots: 4 });

    // Re-serializing the restored state should yield identical JSON, regardless
    // of internal Map iteration order.
    const serialized = serializeBucketState(state, 4);
    const restored = deserializeBucketState(JSON.parse(JSON.stringify(serialized)));
    expect(serializeBucketState(restored, 4)).toEqual(serialized);
  });

  it('persists per-slot path data through serialize round-trip', () => {
    const state = createBucketState();
    const m = match([p({ teamPosition: 'BOTTOM', win: true })]);
    const t = timeline({
      1: [purchase(1, 6677, 100), purchase(1, 3046, 200), purchase(1, 3031, 300)]
    });
    addMatchToState(state, { match: m, timeline: t }, { isLegendary, isBoots, pathSlots: 4 });

    const restored = deserializeBucketState(
      JSON.parse(JSON.stringify(serializeBucketState(state, 4)))
    );
    const result = finalizeState(restored, {
      region: BASE_OPTIONS.region,
      queue: BASE_OPTIONS.queue,
      patch: BASE_OPTIONS.patch,
      sampleSize: 1,
      minGamesPerRole: BASE_OPTIONS.minGamesPerRole,
      now: BASE_OPTIONS.now
    });

    const path = result.champions.Amumu.byRole.BOTTOM?.itemPath;
    expect(path?.[0]?.[0]?.itemId).toBe(6677);
    expect(path?.[1]?.[0]?.itemId).toBe(3046);
    expect(path?.[2]?.[0]?.itemId).toBe(3031);
  });
});
