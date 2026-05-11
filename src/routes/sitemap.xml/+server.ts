import { getChampions } from '$lib/ddragon';
import { getBuilds } from '$lib/builds';
import type { RequestHandler } from './$types';

const SITE_URL = 'https://leaguechampions.org';

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
  const { champions } = await getChampions(fetch);
  const builds = getBuilds();

  const buildsLastmod = builds.generatedAt
    ? new Date(builds.generatedAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [
    { loc: `${SITE_URL}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/winrates`, lastmod: buildsLastmod, changefreq: 'daily', priority: '0.9' },
    ...champions.map((c) => ({
      loc: `${SITE_URL}/champion/${c.id}`,
      lastmod: buildsLastmod,
      changefreq: 'weekly',
      priority: '0.8'
    }))
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  setHeaders({
    'content-type': 'application/xml',
    'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
  });

  return new Response(body);
};
