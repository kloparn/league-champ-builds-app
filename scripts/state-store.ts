/**
 * Persistence layer for the incremental refresh-builds pipeline.
 *
 * Two files at the repo root:
 *   data/builds-state.json.gz   — gzipped per-champion bucket counts, accumulated across runs
 *   data/seen-matches.bin       — 8-byte uint64 BE per match ID (numeric suffix, EUW1_ prefix implicit)
 *
 * Both reset when the canonical patch changes, so the data set is always
 * scoped to the active patch.
 *
 * Migrations from the previous text/JSON formats run automatically on load
 * if a legacy file is present and the new file is not.
 */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { dirname } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
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

const SEEN_PREFIX = 'EUW1_';
const SEEN_RECORD_BYTES = 8;

export function loadSeenMatches(binPath: string, legacyTxtPath?: string): Set<string> {
  if (legacyTxtPath && existsSync(legacyTxtPath) && !existsSync(binPath)) {
    const legacyIds = readFileSync(legacyTxtPath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    appendSeenMatches(binPath, legacyIds);
    rmSync(legacyTxtPath);
    console.log(
      `→ migrated ${legacyIds.length} seen match IDs from ${legacyTxtPath} to ${binPath}`
    );
  }

  if (!existsSync(binPath)) return new Set();
  const buf = readFileSync(binPath);
  const out = new Set<string>();
  for (let i = 0; i + SEEN_RECORD_BYTES <= buf.length; i += SEEN_RECORD_BYTES) {
    const num = buf.readBigUInt64BE(i);
    out.add(`${SEEN_PREFIX}${num}`);
  }
  return out;
}

export function appendSeenMatches(path: string, ids: Iterable<string>): void {
  const arr = [...ids];
  if (arr.length === 0) return;
  ensureDir(path);
  const buf = Buffer.alloc(SEEN_RECORD_BYTES * arr.length);
  for (let i = 0; i < arr.length; i++) {
    const id = arr[i]!;
    if (!id.startsWith(SEEN_PREFIX)) {
      throw new Error(
        `Match ID ${id} does not start with expected prefix ${SEEN_PREFIX}; bin format assumes single-region`
      );
    }
    const num = BigInt(id.slice(SEEN_PREFIX.length));
    buf.writeBigUInt64BE(num, i * SEEN_RECORD_BYTES);
  }
  appendFileSync(path, buf);
}

export function resetSeenMatches(path: string): void {
  ensureDir(path);
  writeFileSync(path, Buffer.alloc(0));
}

export function loadBucketState(
  gzPath: string,
  legacyJsonPath?: string
): PersistedState | null {
  if (legacyJsonPath && existsSync(legacyJsonPath) && !existsSync(gzPath)) {
    const legacyText = readFileSync(legacyJsonPath, 'utf8');
    if (legacyText.trim().length > 0) {
      ensureDir(gzPath);
      writeFileSync(gzPath, gzipSync(legacyText));
      console.log(`→ migrated bucket state from ${legacyJsonPath} to ${gzPath}`);
    }
    rmSync(legacyJsonPath);
  }

  if (!existsSync(gzPath)) return null;
  const buf = readFileSync(gzPath);
  if (buf.length === 0) return null;
  const text = gunzipSync(buf).toString('utf8');
  if (text.trim().length === 0) return null;
  const parsed = JSON.parse(text) as StateFileShape;
  if (parsed.schemaVersion !== 1) {
    throw new Error(
      `Unsupported state schemaVersion ${parsed.schemaVersion} in ${gzPath} — delete the file to start fresh.`
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
  writeFileSync(path, gzipSync(JSON.stringify(payload)));
}

/** Empty state for the start of a new patch. */
export function freshState(patch: string): PersistedState {
  return { patch, sampleSize: 0, state: createBucketState() };
}

function ensureDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}
