import { error } from '@sveltejs/kit';
import { getChampion, getItems, getRunes, getSummonerSpells } from '$lib/ddragon';
import { fetchChampion, fetchMeta } from '$lib/builds';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
  const result = await getChampion(params.id, fetch);
  if (!result) {
    throw error(404, `Champion "${params.id}" not found`);
  }

  const [build, meta] = await Promise.all([fetchChampion(params.id), fetchMeta()]);

  const [
    { spells: summonerSpells },
    { styles: runeStyles },
    { items }
  ] = build
    ? await Promise.all([getSummonerSpells(fetch), getRunes(fetch), getItems(fetch)])
    : [{ spells: {} }, { styles: [] }, { items: {} }];

  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400'
  });

  return {
    version: result.version,
    champion: result.champion,
    build,
    buildsMeta: meta
      ? {
          patch: meta.patch,
          generatedAt: meta.generatedAt,
          sampleSize: meta.sampleSize,
          tiers: meta.tiers ?? []
        }
      : { patch: '', generatedAt: '', sampleSize: 0, tiers: [] as string[] },
    summonerSpells,
    runeStyles,
    items
  };
};
