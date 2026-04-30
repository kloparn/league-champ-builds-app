import { error } from '@sveltejs/kit';
import { getChampion, getChampions, getItems, getRunes, getSummonerSpells } from '$lib/ddragon';
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
    { champions: allChampions },
    { spells: summonerSpells },
    { styles: runeStyles },
    { items }
  ] = build
    ? await Promise.all([
        getChampions(fetch),
        getSummonerSpells(fetch),
        getRunes(fetch),
        getItems(fetch)
      ])
    : await Promise.all([
        getChampions(fetch),
        Promise.resolve({ spells: {} }),
        Promise.resolve({ styles: [] }),
        Promise.resolve({ items: {} })
      ]);

  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400'
  });

  return {
    version: result.version,
    champion: result.champion,
    allChampions: allChampions.map((c) => ({
      id: c.id,
      name: c.name,
      title: c.title,
      image: { full: c.image.full }
    })),
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
