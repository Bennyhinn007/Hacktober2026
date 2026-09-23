/**
 * Repository Selector — Production-safe data layer routing.
 *
 * PRODUCTION (Vercel / any env with MONGODB_URI set):
 *   → Uses mongoRepository (MongoDB Atlas, zero filesystem access)
 *
 * LOCAL DEVELOPMENT (MONGODB_URI absent, optional):
 *   → Falls back to the local JSON file-based repository
 *
 * All API routes and tests should import `dbRepository` from THIS module
 * (or from '@/lib/db/repository' which re-exports from here) — NOT directly
 * from mongo-repository.ts or the legacy repository.ts.
 */

import { mongoRepository } from './mongo-repository';
import { dbRepository as localRepository } from './repository';

/**
 * Returns true if MongoDB Atlas is configured and should be used.
 * In production on Vercel, MONGODB_URI is always set via environment variables.
 */
function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim().length > 0);
}

/**
 * The active repository instance.
 *
 * At module load time we select:
 * - mongoRepository   → when MONGODB_URI is present (production / staging)
 * - localRepository   → when MONGODB_URI is absent (local dev without Atlas)
 *
 * The selection is logged once to the server console for observability.
 */
let _repo: typeof mongoRepository | typeof localRepository;

if (isMongoConfigured()) {
  _repo = mongoRepository;
  console.log('[repository-selector] Using MongoDB Atlas repository (production mode).');
} else {
  _repo = localRepository;
  console.warn(
    '[repository-selector] MONGODB_URI not set — falling back to LOCAL JSON file repository. ' +
    'This mode is NOT supported on Vercel. Set MONGODB_URI in your environment variables.'
  );
}

export const repository = _repo;

/**
 * Convenience re-export so existing `import { dbRepository } from …/repository-selector`
 * calls work without renaming every import site.
 */
export { _repo as dbRepository };

export default repository;
