import buildsData from '../../static/builds.json';
import type { BuildsData, ChampionBuildStats } from './build-aggregator';

// On-disk shape may lag the current types between releases (e.g. a new field
// is added before the next refresh runs). Read defensively in the UI.
const data = buildsData as unknown as BuildsData;

export function getBuilds(): BuildsData {
  return data;
}

export function getBuildForChampion(championKey: string): ChampionBuildStats | undefined {
  return data.champions[championKey];
}
