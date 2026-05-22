import { getChampions } from '$lib/ddragon';
import { getBuilds } from '$lib/builds';
import { championLanesFromStats } from '$lib/build-aggregator';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
  const { version, champions } = await getChampions(fetch);
  const builds = getBuilds();

  const championLanes: Record<string, string[]> = {};
  for (const c of champions) {
    const stats = builds.champions[c.id];
    championLanes[c.id] = stats ? championLanesFromStats(stats) : [];
  }

  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
  });

  return { version, champions, championLanes };
};
