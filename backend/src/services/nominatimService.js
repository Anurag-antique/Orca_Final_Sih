/**
 * Nominatim (OpenStreetMap) service.
 *
 * Policy compliance:
 *   - Identifying User-Agent (required by Nominatim usage policy)
 *   - Max 1 request per second to the public endpoint
 *   - Cache results for 5 minutes to avoid redundant requests
 *
 * Docs: https://operations.osmfoundation.org/policies/nominatim/
 */

const NOMINATIM_BASE =
  process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org";
const NOMINATIM_UA =
  process.env.NOMINATIM_USER_AGENT ||
  "ORCA-Marine-App/1.0 (https://github.com/Krushnakedar/Orca_Final_Sih)";
const NOMINATIM_EMAIL = process.env.NOMINATIM_EMAIL || "";
const REQUEST_TIMEOUT_MS = 6000;
const MIN_INTERVAL_MS = 1100; // 1 req/s policy + small buffer
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_LIMIT = 200;

const cache = new Map(); // key -> { at, value }

let queueTail = Promise.resolve();
let lastRequestAt = 0;

/** Serialise all Nominatim requests (1/s) */
function scheduleRequest(task) {
  const run = async () => {
    const now = Date.now();
    const wait = Math.max(0, MIN_INTERVAL_MS - (now - lastRequestAt));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return task();
  };
  const next = queueTail.then(run, run);
  queueTail = next.catch(() => {});
  return next;
}

function readCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function writeCache(key, value) {
  cache.set(key, { at: Date.now(), value });
  if (cache.size > CACHE_LIMIT) {
    cache.delete(cache.keys().next().value);
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const headers = { "User-Agent": NOMINATIM_UA, Accept: "application/json" };
    if (NOMINATIM_EMAIL) headers["From"] = NOMINATIM_EMAIL;
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) {
      const err = new Error(`Nominatim HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const nominatimService = {
  /**
   * Forward-geocode a free-text query.
   * Returns [] on no results. Throws on transport/HTTP errors.
   */
  async search(query, { limit = 6 } = {}) {
    const q = String(query || "").trim();
    if (q.length < 2) return [];

    const safeLimit = Math.max(1, Math.min(10, Number(limit) || 6));
    const key = `s|${q.toLowerCase()}|${safeLimit}`;
    const cached = readCache(key);
    if (cached) return cached;

    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=${safeLimit}&addressdetails=1`;

    const raw = await scheduleRequest(() => fetchJson(url));

    const results = (Array.isArray(raw) ? raw : [])
      .map((item, idx) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        return {
          id: item.place_id || `${lat},${lon},${idx}`,
          name:
            item.name || (item.display_name || "").split(",")[0] || "Unnamed",
          displayName: item.display_name || "",
          lat,
          lon,
          type: item.type || item.class || "place",
          importance: Number.isFinite(item.importance) ? item.importance : null,
        };
      })
      .filter(Boolean);

    writeCache(key, results);
    return results;
  },

  /**
   * Reverse-geocode a coordinate.
   * Returns null when Nominatim has no match. Throws on transport/HTTP errors.
   */
  async reverse(lat, lon) {
    const latN = Number(lat);
    const lonN = Number(lon);
    if (!Number.isFinite(latN) || !Number.isFinite(lonN)) return null;

    // Round to ~11 m grid to increase cache hits for nearly identical clicks.
    const key = `r|${latN.toFixed(4)}|${lonN.toFixed(4)}`;
    const cached = readCache(key);
    if (cached !== null && cached !== undefined) return cached;

    const url = `${NOMINATIM_BASE}/reverse?lat=${latN}&lon=${lonN}&format=jsonv2&zoom=10&addressdetails=1`;

    const raw = await scheduleRequest(() => fetchJson(url));

    if (!raw || raw.error) {
      writeCache(key, null);
      return null;
    }

    const result = {
      name:
        raw.name ||
        (raw.display_name || "").split(",")[0] ||
        "Unnamed location",
      displayName: raw.display_name || "",
      lat: parseFloat(raw.lat) || latN,
      lon: parseFloat(raw.lon) || lonN,
      type: raw.type || raw.class || "place",
    };

    writeCache(key, result);
    return result;
  },
};

module.exports = nominatimService;
