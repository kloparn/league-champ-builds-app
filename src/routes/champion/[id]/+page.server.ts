import { error } from '@sveltejs/kit';
import { getChampion, getItems, getRunes, getSummonerSpells } from '$lib/ddragon';
import { getBuildForChampion, getBuilds } from '$lib/builds';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
  const result = await getChampion(params.id, fetch);
  if (!result) {
    throw error(404, `Champion "${params.id}" not found`);
  }

  const build = getBuildForChampion(params.id) ?? null;
  const builds = getBuilds();

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
    buildsMeta: {
      patch: builds.patch,
      generatedAt: builds.generatedAt,
      sampleSize: builds.sampleSize,
      tiers: builds.tiers ?? []
    },
    summonerSpells,
    runeStyles,
    items
  };
};
