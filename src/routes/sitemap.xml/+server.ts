import { getChampions } from '$lib/ddragon';
import type { RequestHandler } from './$types';

const SITE_URL = 'https://leaguechampbuilds.netlify.app';

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
  const { champions } = await getChampions(fetch);

  const urls = [
    `${SITE_URL}/`,
    ...champions.map((c) => `${SITE_URL}/champion/${c.id}`)
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (loc) => `  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
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
