import { getChampions } from '$lib/ddragon';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
  const { version, champions } = await getChampions(fetch);

  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
  });

  return { version, champions };
};
