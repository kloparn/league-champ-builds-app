const MAX_LEVEL = 18;
const LEVEL_INCREMENTS = MAX_LEVEL - 1;

export function statAtMaxLevel(base: number, perLevel: number): number {
  return base + perLevel * LEVEL_INCREMENTS;
}

export function formatStat(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (Number.isInteger(value)) return value.toString();
  const fixed = value.toFixed(2);
  return fixed.endsWith('.00') ? fixed.slice(0, -3) : fixed;
}

export function statRange(base: number, perLevel: number): string {
  return `${formatStat(base)} → ${formatStat(statAtMaxLevel(base, perLevel))}`;
}

export function displayName(id: string, name: string): string {
  return id === 'MonkeyKing' ? 'Wukong' : name;
}

export function classNames(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}

export type DifficultyTone = 'low' | 'mid' | 'high';

export interface DifficultyFill {
  pct: number;
  tone: DifficultyTone;
}

export function difficultyFill(value: number, max = 10): DifficultyFill {
  const clamped = Math.max(0, Math.min(max, value));
  const pct = (clamped / max) * 100;
  const tone: DifficultyTone = value >= 8 ? 'high' : value >= 5 ? 'mid' : 'low';
  return { pct, tone };
}

const TIER_RANK: Record<string, number> = {
  CHALLENGER: 0,
  GRANDMASTER: 1,
  MASTER: 2,
  DIAMOND: 3,
  EMERALD: 4,
  PLATINUM: 5,
  GOLD: 6,
  SILVER: 7,
  BRONZE: 8,
  IRON: 9
};

const TIER_LABEL: Record<string, string> = {
  CHALLENGER: 'Challenger',
  GRANDMASTER: 'Grandmaster',
  MASTER: 'Master',
  DIAMOND: 'Diamond',
  EMERALD: 'Emerald',
  PLATINUM: 'Platinum',
  GOLD: 'Gold',
  SILVER: 'Silver',
  BRONZE: 'Bronze',
  IRON: 'Iron'
};

/** Render a tier list as a "lowest+" label (e.g. ["CHALLENGER","DIAMOND"] → "Diamond+"). */
export function tierSourceLabel(tiers: string[] | undefined): string | null {
  if (!tiers || tiers.length === 0) return null;
  const ranked = tiers
    .map((t) => t.toUpperCase())
    .filter((t) => t in TIER_RANK)
    .sort((a, b) => TIER_RANK[a]! - TIER_RANK[b]!);
  if (ranked.length === 0) return null;
  if (ranked.length === 1) return TIER_LABEL[ranked[0]!]!;
  const lowest = ranked[ranked.length - 1]!;
  return `${TIER_LABEL[lowest]}+`;
}
