import { error } from '@sveltejs/kit';
import { getChampion } from '$lib/ddragon';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
  const result = await getChampion(params.id, fetch);
  if (!result) {
    throw error(404, `Champion "${params.id}" not found`);
  }

  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400'
  });

  return { version: result.version, champion: result.champion };
};
