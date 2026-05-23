import { getChampions } from '$lib/ddragon';
import { getBuilds } from '$lib/builds';
import {
  championLanesFromStats,
  championScore,
  totalGamesByRole
} from '$lib/build-aggregator';
import type { PageServerLoad } from './$types';

export interface ChampionLaneStats {
  winrate: number;
  games: number;
  /** Hex Score 0–100 for this champion-in-this-role. */
  score: number;
  /** 1-indexed rank by Hex Score among all champions in this role (1 = highest). */
  rank: number;
}

export interface ChampionListSummary {
  winrate: number;
  games: number;
  /** Lane with the most games for this champion, or null if no build data. */
  topLane: string | null;
  /** Per-lane stats. Only includes lanes that survived MIN_GAMES_PER_ROLE. */
  byLane: Record<string, ChampionLaneStats>;
}

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
  const { version, champions } = await getChampions(fetch);
  const builds = getBuilds();

  const roleTotals = totalGamesByRole(builds.champions);

  const championLanes: Record<string, string[]> = {};
  const championSummary: Record<string, ChampionListSummary | null> = {};
  for (const c of champions) {
    const stats = builds.champions[c.id];
    if (!stats) {
      championLanes[c.id] = [];
      championSummary[c.id] = null;
      continue;
    }
    championLanes[c.id] = championLanesFromStats(stats);

    let topLane: string | null = null;
    let topGames = -1;
    const byLane: Record<string, ChampionLaneStats> = {};
    for (const [role, rb] of Object.entries(stats.byRole)) {
      if (rb.games > topGames) {
        topGames = rb.games;
        topLane = role;
      }
      byLane[role] = {
        winrate: rb.winrate,
        games: rb.games,
        score: championScore({
          wins: rb.wins,
          games: rb.games,
          rolePickShare: rb.games / (roleTotals[role] || 1)
        }),
        // Rank is filled in below once every champion in every role has a score.
        rank: 0
      };
    }
    championSummary[c.id] = {
      winrate: stats.winrate,
      games: stats.games,
      topLane,
      byLane
    };
  }

  // Assign per-role ranks: within each role, sort all participating champions by
  // Hex Score desc and number them 1..N. Ties get the same rank (1224-style).
  const scoredByRole: Record<string, { champId: string; score: number }[]> = {};
  for (const [champId, summary] of Object.entries(championSummary)) {
    if (!summary) continue;
    for (const [role, lane] of Object.entries(summary.byLane)) {
      (scoredByRole[role] ??= []).push({ champId, score: lane.score });
    }
  }
  for (const [role, list] of Object.entries(scoredByRole)) {
    list.sort((a, b) => b.score - a.score);
    let lastScore = -1;
    let lastRank = 0;
    for (let i = 0; i < list.length; i++) {
      const entry = list[i]!;
      const rank = entry.score === lastScore ? lastRank : i + 1;
      lastScore = entry.score;
      lastRank = rank;
      const summary = championSummary[entry.champId];
      if (summary) summary.byLane[role]!.rank = rank;
    }
  }

  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
  });

  return { version, champions, championLanes, championSummary };
};
