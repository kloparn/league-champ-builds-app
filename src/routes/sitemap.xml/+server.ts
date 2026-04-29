import { getChampions } from '$lib/ddragon';
import { fetchMeta } from '$lib/builds';
import { SITE_URL } from '$lib/site';
import type { RequestHandler } from './$types';

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: string;
}

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
  const [{ champions }, meta] = await Promise.all([getChampions(fetch), fetchMeta()]);

  const lastmod = meta?.generatedAt ? new Date(meta.generatedAt).toISOString() : undefined;

  const entries: UrlEntry[] = [
    { loc: `${SITE_URL}/`, lastmod, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/winrates`, lastmod, changefreq: 'daily', priority: '0.9' },
    ...champions.map((c) => ({
      loc: `${SITE_URL}/champion/${encodeURIComponent(c.id)}`,
      lastmod,
      changefreq: 'daily' as const,
      priority: '0.8'
    }))
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((e) => {
    const parts = [`    <loc>${e.loc}</loc>`];
    if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
    if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
    if (e.priority) parts.push(`    <priority>${e.priority}</priority>`);
    return `  <url>\n${parts.join('\n')}\n  </url>`;
  })
  .join('\n')}
</urlset>`;

  setHeaders({
    'content-type': 'application/xml',
    'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
  });

  return new Response(body);
};
