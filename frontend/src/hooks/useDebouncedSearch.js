import { useEffect, useState } from "react";
import { geocodingService } from "../services/geocodingService";

/**
 * Debounced location search against the backend Nominatim proxy.
 * - 350 ms debounce (spec §7: no request per keystroke)
 * - Aborts in-flight requests on query change
 * - In-memory LRU cache to keep free-tier friendly (spec §20)
 */
const CACHE = new Map();
const CACHE_LIMIT = 50;

export default function useDebouncedSearch(
  query,
  { delay = 350, minChars = 2, limit = 6 } = {},
) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = (query || "").trim();

    if (q.length < minChars) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const cacheKey = `${q}|${limit}`;
    if (CACHE.has(cacheKey)) {
      setResults(CACHE.get(cacheKey));
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await geocodingService.search(q, {
          limit,
          signal: controller.signal,
        });
        const items = Array.isArray(res?.results) ? res.results : [];
        if (!cancelled) {
          setResults(items);
          CACHE.set(cacheKey, items);
          if (CACHE.size > CACHE_LIMIT) {
            CACHE.delete(CACHE.keys().next().value);
          }
        }
      } catch (err) {
        if (
          !cancelled &&
          err?.status !== 0 &&
          err?.message !== "canceled" &&
          err?.message !== "CanceledError"
        ) {
          setError(err?.message || "Search failed");
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, delay, minChars, limit]);

  return { results, loading, error };
}
