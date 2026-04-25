import { describe, expect, it } from 'vitest';
import {
  difficultyFill,
  displayName,
  formatStat,
  statAtMaxLevel,
  statRange
} from './utils';

describe('statAtMaxLevel', () => {
  it('adds 17 levels of growth to base', () => {
    expect(statAtMaxLevel(615, 75)).toBe(615 + 75 * 17);
  });

  it('handles zero growth', () => {
    expect(statAtMaxLevel(335, 0)).toBe(335);
  });

  it('handles fractional growth', () => {
    expect(statAtMaxLevel(9, 0.85)).toBeCloseTo(9 + 0.85 * 17, 5);
  });
});

describe('formatStat', () => {
  it('returns integers without decimals', () => {
    expect(formatStat(615)).toBe('615');
  });

  it('strips trailing .00', () => {
    expect(formatStat(615.0)).toBe('615');
  });

  it('keeps two decimals when meaningful', () => {
    expect(formatStat(0.736)).toBe('0.74');
  });

  it('returns 0 for non-finite', () => {
    expect(formatStat(Number.NaN)).toBe('0');
    expect(formatStat(Number.POSITIVE_INFINITY)).toBe('0');
  });
});

describe('statRange', () => {
  it('formats base → max with arrow', () => {
    expect(statRange(615, 75)).toBe('615 → 1890');
  });
});

describe('displayName', () => {
  it('renames MonkeyKing to Wukong', () => {
    expect(displayName('MonkeyKing', 'Wukong')).toBe('Wukong');
  });

  it('passes through normal champion names', () => {
    expect(displayName('Amumu', 'Amumu')).toBe('Amumu');
    expect(displayName('LeeSin', 'Lee Sin')).toBe('Lee Sin');
  });
});

describe('difficultyFill', () => {
  it('returns 0% for zero value', () => {
    expect(difficultyFill(0)).toEqual({ pct: 0, tone: 'low' });
  });

  it('clamps values above max to 100%', () => {
    expect(difficultyFill(99, 10).pct).toBe(100);
  });

  it('clamps negatives to 0%', () => {
    expect(difficultyFill(-5).pct).toBe(0);
  });

  it('picks low tone below 5', () => {
    expect(difficultyFill(4).tone).toBe('low');
  });

  it('picks mid tone between 5 and 7', () => {
    expect(difficultyFill(5).tone).toBe('mid');
    expect(difficultyFill(7).tone).toBe('mid');
  });

  it('picks high tone at 8+', () => {
    expect(difficultyFill(8).tone).toBe('high');
    expect(difficultyFill(10).tone).toBe('high');
  });
});
