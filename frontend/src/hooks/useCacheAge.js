import { useEffect, useState } from 'react';
import { getCached } from '../services/offlineCache';

/**
 * Reads the age of a cached entry from IndexedDB.
 * `config` must match the shape that was passed to api.get():
 *   { url: '/weather', params: { lat, lon, sector } }
 *
 * Returns:
 *   null while loading, or if nothing is cached.
 *   { cachedAt, isStale, ageMinutes } when found.
 */
export function useCacheAge(config) {
  const [info, setInfo] = useState(null);

  // Stable stringification of params for the dependency array.
  const paramsKey = config?.params ? JSON.stringify(config.params) : '';

  useEffect(() => {
    let alive = true;
    if (!config?.url) return;

    getCached({ method: 'get', url: config.url, params: config.params })
      .then((entry) => {
        if (!alive) return;
        if (!entry) {
          setInfo(null);
          return;
        }
        setInfo({
          cachedAt: entry.cachedAt,
          isStale: entry.isStale,
          ageMinutes: Math.round((Date.now() - entry.cachedAt) / 60000),
        });
      })
      .catch(() => {
        if (alive) setInfo(null);
      });

    return () => {
      alive = false;
    };
  }, [config?.url, paramsKey]);

  return info;
}