import { SITE_URL } from '$lib/site';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
  const body = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'content-type': 'text/plain',
      'cache-control': 'public, max-age=86400'
    }
  });
};
