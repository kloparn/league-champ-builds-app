/**
 * Pure transformation: BuildsData → array of {path, body} files for upload.
 * No side effects, no env dependencies. Imported by the refresh script and
 * exercised in tests.
 */

import type { BuildsData } from './build-aggregator';

export interface UploadFile {
  path: string;
  body: string;
}

export function splitBuilds(builds: BuildsData): UploadFile[] {
  const championKeys = Object.keys(builds.champions).sort();

  const meta = {
    generatedAt: builds.generatedAt,
    patch: builds.patch,
    region: builds.region,
    queue: builds.queue,
    sampleSize: builds.sampleSize,
    ...(builds.tiers ? { tiers: builds.tiers } : {}),
    championKeys
  };

  const winrates = {
    generatedAt: builds.generatedAt,
    patch: builds.patch,
    sampleSize: builds.sampleSize,
    ...(builds.tiers ? { tiers: builds.tiers } : {}),
    champions: Object.fromEntries(
      championKeys.map((key) => {
        const c = builds.champions[key]!;
        return [
          key,
          {
            championId: c.championId,
            championKey: key,
            championName: c.championName,
            games: c.games,
            winrate: c.winrate,
            byRole: Object.fromEntries(
              Object.entries(c.byRole).map(([role, rb]) => [
                role,
                { games: rb.games, winrate: rb.winrate }
              ])
            )
          }
        ];
      })
    )
  };

  const files: UploadFile[] = [
    { path: 'meta.json', body: JSON.stringify(meta) },
    { path: 'winrates.json', body: JSON.stringify(winrates) }
  ];
  for (const key of championKeys) {
    files.push({
      path: `champions/${key}.json`,
      body: JSON.stringify(builds.champions[key])
    });
  }
  return files;
}
