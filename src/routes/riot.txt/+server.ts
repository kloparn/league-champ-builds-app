import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
  return new Response('f0c9afe1-0f25-4e4e-9b44-7e3127fffb83\n', {
    headers: {
      'content-type': 'text/plain',
      'cache-control': 'public, max-age=86400'
    }
  });
};
