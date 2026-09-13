import { openDB } from 'idb';

const DB_NAME = 'orca-offline';
const DB_VERSION = 1;
const STORE = 'api-cache';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Endpoints allowed to be stored in IndexedDB.
 * Each entry: [regex matching the url path, TTL in seconds].
 * Everything not listed here is never persisted.
 */
const CACHEABLE = [
  // Tier A — public reference, long TTL
  [/^\/map\/layers/, 60 * 60],
  [/^\/geospatial\/zones/, 60 * 60 * 6],
  [/^\/risk\/thresholds/, 60 * 60 * 24],
  [/^\/agents\/architecture/, 60 * 60 * 24],
  [/^\/routes\/waypoints/, 60 * 60 * 24],
  [/^\/sources/, 60 * 60 * 24],

  // Tier B — live/safety data, short TTL, must show stale badge
  [/^\/weather/, 30 * 60],
  [/^\/ocean/, 60 * 60],
  [/^\/pfz/, 60 * 60 * 6],
  [/^\/advisories/, 60 * 60],
  [/^\/dashboard/, 15 * 60],
  [/^\/geofence\/zones/, 60 * 60 * 24],
  [/^\/alerts/, 5 * 60],
  [/^\/traces(\/metrics)?$/, 15 * 60],
];

export function isCacheable(path) {
  if (!path) return false;
  // Never cache anything auth-related, regardless of allowlist.
  if (path.startsWith('/auth/')) return false;
  if (path.startsWith('/health')) return false;
  return CACHEABLE.some(([re]) => re.test(path));
}

export function ttlFor(path) {
  const hit = CACHEABLE.find(([re]) => re.test(path));
  return hit ? hit[1] : 60;
}

/** Build a stable key from method + url + query. */
function keyOf(config) {
  const url = config.url || '';
  const params = config.params
    ? '?' + new URLSearchParams(config.params).toString()
    : '';
  return `${(config.method || 'get').toUpperCase()} ${url}${params}`;
}

export async function putCached(config, data) {
  const key = keyOf(config);
  const ttl = ttlFor(config.url || '');
  const now = Date.now();
  const db = await getDB();
  await db.put(
    STORE,
    { data, cachedAt: now, expiresAt: now + ttl * 1000 },
    key
  );
}

export async function getCached(config) {
  const key = keyOf(config);
  const db = await getDB();
  const entry = await db.get(STORE, key);
  if (!entry) return null;
  return {
    data: entry.data,
    cachedAt: entry.cachedAt,
    isStale: Date.now() > entry.expiresAt,
  };
}

/** Called on logout and on SW update. */
export async function clearAll() {
  const db = await getDB();
  await db.clear(STORE);
}