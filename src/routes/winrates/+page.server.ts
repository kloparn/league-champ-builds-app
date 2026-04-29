import { getChampions } from '$lib/ddragon';
import { fetchWinrates } from '$lib/builds';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
  const [winrates, ddragon] = await Promise.all([fetchWinrates(), getChampions(fetch)]);

  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400'
  });

  return {
    version: ddragon.version,
    champions: ddragon.champions,
    builds: winrates ?? {
      generatedAt: '',
      patch: '',
      sampleSize: 0,
      tiers: [] as string[],
      champions: {}
    }
  };
};
