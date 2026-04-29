import { SITE_URL } from '$lib/site';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
  const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
Host: ${SITE_URL.replace(/^https?:\/\//, '')}
`;

  return new Response(body, {
    headers: {
      'content-type': 'text/plain',
      'cache-control': 'public, max-age=86400'
    }
  });
};
