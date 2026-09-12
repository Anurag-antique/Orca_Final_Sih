/**
 * Maritime routing service.
 *
 * Uses the `searoute` npm package (Eurostat / Marine Regions EEZ + shipping lanes).
 * This is a genuine marine router — it avoids land and respects EEZ boundaries.
 * It is NOT a road-routing API.
 *
 * Secret / config: none required. The package is purely local (bundled data).
 *
 * If the package is not installed, or fails for any reason, the service
 * returns an explicit unavailable state. It never returns a fabricated route.
 */

let searouteLib = null;
let searouteLoadError = null;
try {
  // eslint-disable-next-line global-require
  searouteLib = require("searoute");
  // Handle both `module.exports = fn` and `module.exports.default = fn`.
  if (
    searouteLib &&
    typeof searouteLib !== "function" &&
    typeof searouteLib.default === "function"
  ) {
    searouteLib = searouteLib.default;
  }
} catch (err) {
  searouteLoadError = err.message;
}

const HAVERSINE_NM = (lat1, lon1, lat2, lon2) => {
  const R = 3440.065; // Earth radius in nautical miles
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const maritimeRoutingService = {
  isAvailable() {
    return typeof searouteLib === "function";
  },

  getUnavailableReason() {
    if (this.isAvailable()) return null;
    if (searouteLoadError) {
      return `Maritime routing engine failed to load: ${searouteLoadError}`;
    }
    return "Maritime routing engine is not installed. Run `npm install searoute` in backend/.";
  },

  /**
   * @param {{lat:number, lon:number}} origin
   * @param {{lat:number, lon:number}} destination
   * @returns {Promise<{
   *   available: boolean,
   *   reason?: string,
   *   geometry?: Array<[number, number]>,   // [[lat, lon], ...]  (Leaflet order)
   *   distanceNm?: number,
   *   origin?: {lat:number, lon:number},
   *   destination?: {lat:number, lon:number},
   *   provider?: string
   * }>}
   */
  async computeRoute(origin, destination) {
    if (!this.isAvailable()) {
      return { available: false, reason: this.getUnavailableReason() };
    }

    const oLat = Number(origin?.lat);
    const oLon = Number(origin?.lon);
    const dLat = Number(destination?.lat);
    const dLon = Number(destination?.lon);

    if (![oLat, oLon, dLat, dLon].every(Number.isFinite)) {
      return {
        available: false,
        reason:
          "Origin and destination must both be valid lat/lon coordinates.",
      };
    }

    // searoute expects [lon, lat] points.
    const oPt = [oLon, oLat];
    const dPt = [dLon, dLat];

    let result;
    try {
      result = searouteLib(oPt, dPt, {
        units: "nauticalmiles",
        returnPorts: false,
      });
    } catch (err) {
      return {
        available: false,
        reason: `Routing engine error: ${err.message || "unknown error"}`,
      };
    }

    if (!result) {
      return {
        available: false,
        reason: "Routing engine returned no route for these coordinates.",
      };
    }

    // Accept both a GeoJSON Feature and a bare geometry.
    const coords = result.geometry?.coordinates || result.coordinates || null;

    if (!Array.isArray(coords) || coords.length < 2) {
      return {
        available: false,
        reason: "Routing engine returned an empty route.",
      };
    }

    // Convert [lon, lat] → [lat, lon] for Leaflet.
    const geometry = coords.map(([lon, lat]) => [lat, lon]);

    // Prefer the distance reported by the engine. If absent, derive via haversine.
    let distanceNm = Number.isFinite(result.properties?.length)
      ? result.properties.length
      : Number.isFinite(result.length)
        ? result.length
        : null;

    if (!Number.isFinite(distanceNm)) {
      let sum = 0;
      for (let i = 1; i < geometry.length; i += 1) {
        sum += HAVERSINE_NM(
          geometry[i - 1][0],
          geometry[i - 1][1],
          geometry[i][0],
          geometry[i][1],
        );
      }
      distanceNm = parseFloat(sum.toFixed(2));
    }

    return {
      available: true,
      geometry,
      distanceNm: parseFloat(Number(distanceNm).toFixed(2)),
      origin: { lat: oLat, lon: oLon },
      destination: { lat: dLat, lon: dLon },
      provider: "searoute (Marine Regions EEZ + shipping lanes)",
    };
  },
};

module.exports = maritimeRoutingService;
