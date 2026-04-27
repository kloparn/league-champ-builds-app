import { getChampions } from '$lib/ddragon';
import { getBuilds } from '$lib/builds';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
  const builds = getBuilds();
  const { version, champions } = await getChampions(fetch);

  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400'
  });

  return {
    version,
    champions,
    builds
  };
};
