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
