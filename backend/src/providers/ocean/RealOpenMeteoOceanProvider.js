const BaseProvider = require("../base/BaseProvider");

class RealOpenMeteoOceanProvider extends BaseProvider {
  constructor() {
    super("Real-OpenMeteo-MarineProvider", "OCEANOGRAPHY", "1.0.0", false);
  }

  async getOceanConditions(location) {
    const lat = parseFloat(location?.lat);
    const lon = parseFloat(location?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      const err = new Error(
        "Marine lookup requires valid lat/lon coordinates.",
      );
      err.code = "INVALID_LOCATION";
      throw err;
    }

    const url =
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}` +
      `&current=wave_height,wave_direction,wave_period,wind_wave_height,` +
      `swell_wave_height,swell_wave_period,ocean_current_velocity,ocean_current_direction,sea_surface_temperature`;

    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) {
      throw new Error(`Open-Meteo Marine API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const cur = data.current || {};

    if (!Number.isFinite(cur.wave_height)) {
      const error = new Error(
        "No marine data is available at this location. Select a point over the sea.",
      );
      error.code = "LAND_LOCATION";
      throw error;
    }

    const getCardinalDirection = (deg) => {
      const directions = [
        "N",
        "NNE",
        "NE",
        "ENE",
        "E",
        "ESE",
        "SE",
        "SSE",
        "S",
        "SSW",
        "SW",
        "WSW",
        "W",
        "WNW",
        "NW",
        "NNW",
      ];
      return directions[Math.round(deg / 22.5) % 16];
    };

    const waveHeight = cur.wave_height;
    const waveDir = Number.isFinite(cur.wave_direction)
      ? cur.wave_direction
      : null;
    const currentSpeedMps = Number.isFinite(cur.ocean_current_velocity)
      ? parseFloat((cur.ocean_current_velocity / 3.6).toFixed(3))
      : null; // km/h → m/s
    const currentDir = Number.isFinite(cur.ocean_current_direction)
      ? cur.ocean_current_direction
      : null;

    const oceanData = {
      location: { lat, lon },
      observationTime: cur.time
        ? new Date(cur.time).toISOString()
        : new Date().toISOString(),
      seaSurfaceTemperatureC: Number.isFinite(cur.sea_surface_temperature)
        ? cur.sea_surface_temperature
        : null,
      chlorophyllMgM3: null, // no chlorophyll source in this API
      significantWaveHeightM: parseFloat(waveHeight.toFixed(2)),
      maxWaveHeightM: null, // not returned by this API
      wavePeriodSec: Number.isFinite(cur.wave_period) ? cur.wave_period : null,
      waveDirectionDegrees: waveDir,
      waveDirectionCardinal:
        waveDir != null ? getCardinalDirection(waveDir) : null,
      windWaveHeightM: Number.isFinite(cur.wind_wave_height)
        ? cur.wind_wave_height
        : null,
      swellHeightM: Number.isFinite(cur.swell_wave_height)
        ? cur.swell_wave_height
        : null,
      swellPeriodSec: Number.isFinite(cur.swell_wave_period)
        ? cur.swell_wave_period
        : null,
      tide: null, // no tide source configured — do not fabricate a tide phase
      current: {
        speedMps: currentSpeedMps,
        speedKnots:
          currentSpeedMps != null
            ? parseFloat((currentSpeedMps * 1.94384).toFixed(2))
            : null,
        directionDegrees: currentDir,
        directionCardinal:
          currentDir != null ? getCardinalDirection(currentDir) : null,
      },
      salinityPsu: null, // not returned by this API
      // Derived transparently from the real wave_height measurement.
      seaStateCode: waveHeight > 2.0 ? 5 : waveHeight > 1.25 ? 4 : 3,
      seaStateDescription:
        waveHeight > 2.0
          ? "Rough sea state with large breakers"
          : waveHeight > 1.25
            ? "Moderate sea condition with scattered whitecaps"
            : "Slight sea condition",
    };

    return this.standardizeResponse(oceanData, {
      dataset:
        "Open-Meteo Marine / Copernicus Marine Environment Monitoring Service (CMEMS)",
      origin:
        "European Centre for Medium-Range Weather Forecasts (ECMWF WAM & NEMO Live Model)",
      accuracyEstimate: "Mercator Ocean 0.083° Grid",
      updateFrequency: "Hourly Live Feed",
    });
  }
}

module.exports = RealOpenMeteoOceanProvider;
