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

const STAT_SHARDS: Record<number, string> = {
  5001: 'Bonus Health',
  5002: 'Armor',
  5003: 'Magic Resist',
  5005: 'Attack Speed',
  5007: 'Ability Haste',
  5008: 'Adaptive Force',
  5010: 'Move Speed',
  5011: 'Health',
  5013: 'Tenacity & Slow Resist'
};

export function statShardLabel(id: number | undefined): string {
  if (!id) return '—';
  return STAT_SHARDS[id] ?? `#${id}`;
}

/** The three rows of stat shard options shown in the rune client. Index = row
 * (0 Offense, 1 Flex, 2 Defense); each row holds the three options users can
 * pick from. Mirrors what League actually shows. */
export const STAT_SHARD_ROWS: readonly [number, number, number][] = [
  [5008, 5005, 5007], // Offense: Adaptive · Attack Speed · Ability Haste
  [5008, 5010, 5001], // Flex:    Adaptive · Move Speed   · Bonus Health
  [5011, 5013, 5001]  // Defense: Health   · Tenacity     · Bonus Health
] as const;

const STAT_SHARD_ICON_PATHS: Record<number, string> = {
  5001: 'perk-images/StatMods/StatModsHealthScalingIcon.png',
  5002: 'perk-images/StatMods/StatModsArmorIcon.png',
  5003: 'perk-images/StatMods/StatModsMagicResIcon.MagicResist_Fix.png',
  5005: 'perk-images/StatMods/StatModsAttackSpeedIcon.png',
  5007: 'perk-images/StatMods/StatModsCDRScalingIcon.png',
  5008: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png',
  5010: 'perk-images/StatMods/StatModsMovementSpeedIcon.png',
  5011: 'perk-images/StatMods/StatModsHealthPlusIcon.png',
  5013: 'perk-images/StatMods/StatModsTenacityIcon.png'
};

export function statShardIconPath(id: number): string | undefined {
  return STAT_SHARD_ICON_PATHS[id];
}

const STAT_SHARD_DESCRIPTIONS: Record<number, string> = {
  5001: '+10–180 Bonus Health (based on level).',
  5005: '+10% Attack Speed.',
  5007: '+8 Ability Haste.',
  5008: '+9 Adaptive Force (AD or AP — whichever helps more).',
  5010: '+2% Move Speed.',
  5011: '+65 flat Health.',
  5013: '+10% Tenacity and Slow Resist.'
};

export function statShardDescription(id: number): string | undefined {
  return STAT_SHARD_DESCRIPTIONS[id];
}

const SKILL_LABELS = ['Q', 'W', 'E', 'R'] as const;

export function skillSlotLabel(slot: number): string {
  return SKILL_LABELS[slot - 1] ?? '·';
}

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
