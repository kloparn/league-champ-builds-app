import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
  env: {}
}));

import { canonical, SITE_URL } from './site';

describe('SITE_URL', () => {
  it('falls back to the production URL when env is unset', () => {
    expect(SITE_URL).toBe('https://leaguechampbuilds.netlify.app');
  });

  it('has no trailing slash', () => {
    expect(SITE_URL.endsWith('/')).toBe(false);
  });
});

describe('canonical', () => {
  it('returns SITE_URL with no trailing slash for the root path', () => {
    expect(canonical('/')).toBe(SITE_URL);
  });

  it('joins absolute paths cleanly', () => {
    expect(canonical('/champion/Darius')).toBe(`${SITE_URL}/champion/Darius`);
  });

  it('prepends a leading slash if the input lacks one', () => {
    expect(canonical('winrates')).toBe(`${SITE_URL}/winrates`);
  });

  it('preserves nested paths', () => {
    expect(canonical('/champion/MonkeyKing')).toBe(`${SITE_URL}/champion/MonkeyKing`);
  });
});
