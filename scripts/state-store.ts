/**
 * Persistence layer for the incremental refresh-builds pipeline.
 *
 * Two files at the repo root:
 *   data/builds-state.json   — full per-champion bucket counts, accumulated across runs
 *   data/seen-matches.txt    — newline-delimited match IDs already aggregated
 *
 * Both reset when the canonical patch changes, so the data set is always
 * scoped to the active patch.
 */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs';
import { dirname } from 'node:path';
import {
  createBucketState,
  deserializeBucketState,
  serializeBucketState,
  type BucketState,
  type SerializedBucketState
} from '../src/lib/build-aggregator.ts';

export interface PersistedState {
  patch: string;
  sampleSize: number;
  state: BucketState;
}

export interface StateFileShape {
  schemaVersion: 1;
  patch: string;
  sampleSize: number;
  buckets: SerializedBucketState;
}

export function loadSeenMatches(path: string): Set<string> {
  if (!existsSync(path)) return new Set();
  const text = readFileSync(path, 'utf8');
  const ids = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return new Set(ids);
}

export function appendSeenMatches(path: string, ids: Iterable<string>): void {
  const arr = [...ids];
  if (arr.length === 0) return;
  ensureDir(path);
  appendFileSync(path, arr.join('\n') + '\n');
}

export function resetSeenMatches(path: string): void {
  ensureDir(path);
  writeFileSync(path, '');
}

export function loadBucketState(path: string): PersistedState | null {
  if (!existsSync(path)) return null;
  const text = readFileSync(path, 'utf8');
  if (text.trim().length === 0) return null;
  const parsed = JSON.parse(text) as StateFileShape;
  if (parsed.schemaVersion !== 1) {
    throw new Error(
      `Unsupported state schemaVersion ${parsed.schemaVersion} in ${path} — delete the file to start fresh.`
    );
  }
  return {
    patch: parsed.patch,
    sampleSize: parsed.sampleSize,
    state: deserializeBucketState(parsed.buckets)
  };
}

export function saveBucketState(
  path: string,
  patch: string,
  sampleSize: number,
  state: BucketState,
  pathSlots = 4
): void {
  ensureDir(path);
  const payload: StateFileShape = {
    schemaVersion: 1,
    patch,
    sampleSize,
    buckets: serializeBucketState(state, pathSlots)
  };
  writeFileSync(path, JSON.stringify(payload) + '\n');
}

/** Empty state for the start of a new patch. */
export function freshState(patch: string): PersistedState {
  return { patch, sampleSize: 0, state: createBucketState() };
}

function ensureDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}
