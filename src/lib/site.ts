/**
 * Site-wide constants used for SEO (canonical URLs, sitemap, OG tags).
 * Override SITE_URL via env when deploying to a custom domain.
 */

import { env as publicEnv } from '$env/dynamic/public';

export const SITE_URL =
  publicEnv.PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://leaguechampbuilds.netlify.app';

export const SITE_NAME = 'League Champ Builds';

export function canonical(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${SITE_URL}${path === '/' ? '' : path}`;
}
