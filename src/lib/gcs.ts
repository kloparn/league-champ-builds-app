/**
 * Server-only GCS client for fetching build data from a private bucket.
 *
 * Reads credentials from env at first use:
 *   GCP_SA_KEY    base64-encoded service account JSON
 *   GCS_BUCKET    bucket name (e.g. "lol-champ-builds")
 */

import { Storage, type Bucket } from '@google-cloud/storage';
import { env } from '$env/dynamic/private';

let _bucket: Bucket | null = null;

function getBucket(): Bucket {
  if (_bucket) return _bucket;
  const sa = env.GCP_SA_KEY;
  if (!sa) throw new Error('GCP_SA_KEY env var not set');
  const bucketName = env.GCS_BUCKET;
  if (!bucketName) throw new Error('GCS_BUCKET env var not set');
  const credentials = JSON.parse(Buffer.from(sa, 'base64').toString('utf8'));
  const storage = new Storage({ credentials, projectId: credentials.project_id });
  _bucket = storage.bucket(bucketName);
  return _bucket;
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 404
  );
}

export async function readJson<T>(path: string): Promise<T | null> {
  try {
    const [buf] = await getBucket().file(path).download();
    return JSON.parse(buf.toString('utf8')) as T;
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}
