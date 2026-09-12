import api from "./api";

/**
 * Geocoding + reverse-geocoding via the ORCA backend proxy.
 *
 * Why a proxy?
 *  - Nominatim requires an identifying User-Agent, which browsers cannot set.
 *  - Proxying lets the backend respect Nominatim's usage policy
 *    (1 req/s, no autocomplete spam, honest UA).
 *
 * Backend endpoints required (to be created in Batch 2):
 *   GET /api/geocode/search?q=&limit=
 *   GET /api/geocode/reverse?lat=&lon=
 *
 * Expected response shapes:
 *   search → { results: [{ id, name, displayName, lat, lon, type, importance }] }
 *   reverse → { result: { name, displayName, lat, lon, type } | null }
 */
export const geocodingService = {
  async search(query, { limit = 6, signal } = {}) {
    if (!query || query.trim().length < 2) return { results: [] };
    return await api.get("/geocode/search", {
      params: { q: query.trim(), limit },
      signal,
    });
  },

  async reverse(lat, lon, { signal } = {}) {
    if (lat == null || lon == null) return { result: null };
    return await api.get("/geocode/reverse", {
      params: { lat, lon },
      signal,
    });
  },
};
