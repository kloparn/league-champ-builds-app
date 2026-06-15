/**
 * Canonical production origin — the single source of truth for the public URL.
 *
 * Used for <link rel="canonical">, og:url, JSON-LD, sitemap.xml and robots.txt.
 * Keep this as the ONLY definition: if any of those drift to a different host,
 * search engines see duplicate content / a canonical pointing at a host that
 * doesn't serve the page, and stop indexing.
 */
export const SITE_URL = 'https://leaguebuilds.org';
