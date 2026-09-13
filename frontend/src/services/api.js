import axios from 'axios';
import { isCacheable, putCached, getCached } from './offlineCache';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Notify the OfflineContext when we serve cached data.
// This is a custom event — the context subscribes, nothing else does.
function emitOfflineHit(detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('orca:offline-hit', { detail }));
  }
}

api.interceptors.response.use(
  async (response) => {
    // SUCCESS PATH — unchanged shape. Just opportunistically cache
    // whitelisted GETs so we have data if the network later drops.
    //
    // NOTE: we intentionally do NOT skip caching when the Authorization
    // header is present. AuthContext sets it globally, so this would
    // prevent caching for every logged-in user. Safety is enforced
    // elsewhere:
    //   1. isCacheable() refuses /auth/* and /health unconditionally.
    //   2. The service worker's cacheWillUpdate guard refuses to store
    //      authenticated responses in Cache Storage.
    //   3. IndexedDB only stores the endpoints in the CACHEABLE allowlist.
    try {
      const cfg = response.config || {};
      const method = (cfg.method || 'get').toLowerCase();
      if (method === 'get' && isCacheable(cfg.url)) {
        await putCached(cfg, response.data);
      }
    } catch {
      // Never let cache-write failures break a successful response.
    }
    return response.data;
  },

  async (error) => {
    const cfg = error.config || {};
    const method = (cfg.method || 'get').toLowerCase();

    // OFFLINE FALLBACK — only for whitelisted GETs, only on network failure.
    const isNetworkFailure =
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      (!error.response && error.request);

    if (isNetworkFailure && method === 'get' && isCacheable(cfg.url)) {
      try {
        const cached = await getCached(cfg);
        if (cached) {
          emitOfflineHit({
            url: cfg.url,
            cachedAt: cached.cachedAt,
            isStale: cached.isStale,
          });
          // Return the payload exactly as the server would have.
          // Offline state lives in OfflineContext, not here.
          return cached.data;
        }
      } catch {
        // fall through to normal error
      }
    }

    const customError = {
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred',
      status: error.response?.status || 0,
      data: error.response?.data || null,
      offline: isNetworkFailure,
    };
    return Promise.reject(customError);
  }
);

export default api;