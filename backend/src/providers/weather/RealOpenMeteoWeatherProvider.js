const BaseProvider = require("../base/BaseProvider");

class RealOpenMeteoWeatherProvider extends BaseProvider {
  constructor() {
    super("Real-OpenMeteo-WeatherProvider", "WEATHER", "1.0.0", false);
  }

  async getWeather(location) {
    const lat = parseFloat(location?.lat);
    const lon = parseFloat(location?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      const err = new Error(
        "Weather lookup requires valid lat/lon coordinates.",
      );
      err.code = "INVALID_LOCATION";
      throw err;
    }

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,` +
      `wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,cloud_cover`;

    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) {
      throw new Error(`Open-Meteo API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const cur = data.current || {};

    if (!Number.isFinite(cur.wind_speed_10m)) {
      throw new Error(
        "Open-Meteo returned no wind_speed_10m measurement for this point.",
      );
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

    const windDir = Number.isFinite(cur.wind_direction_10m)
      ? cur.wind_direction_10m
      : null;
    const windSpeedKmh = cur.wind_speed_10m;

    const weatherData = {
      location: {
        lat,
        lon,
        sectorName: location?.sectorName || null,
      },
      forecastTime: cur.time
        ? new Date(cur.time).toISOString()
        : new Date().toISOString(),
      temperatureC: Number.isFinite(cur.temperature_2m)
        ? cur.temperature_2m
        : null,
      apparentTemperatureC: Number.isFinite(cur.apparent_temperature)
        ? cur.apparent_temperature
        : null,
      windSpeedKmh,
      windSpeedKnots: Number.isFinite(windSpeedKmh)
        ? parseFloat((windSpeedKmh * 0.539957).toFixed(1))
        : null,
      windGustsKmh: Number.isFinite(cur.wind_gusts_10m)
        ? cur.wind_gusts_10m
        : null,
      windDirectionDegrees: windDir,
      windDirectionCardinal:
        windDir != null ? getCardinalDirection(windDir) : null,
      precipitationProbabilityPct: null, // not returned by the current endpoint
      precipitationMm: Number.isFinite(cur.precipitation)
        ? cur.precipitation
        : null,
      relativeHumidityPct: Number.isFinite(cur.relative_humidity_2m)
        ? cur.relative_humidity_2m
        : null,
      cloudCoverPct: Number.isFinite(cur.cloud_cover) ? cur.cloud_cover : null,
      surfacePressureHpa: Number.isFinite(cur.surface_pressure)
        ? cur.surface_pressure
        : null,
      visibilityKm: null,
      uvIndex: null,
      lightningRisk: null,
      cycloneAlert: null,
      // Derived from a real value — kept because the derivation is transparent.
      conditionsSummary: Number.isFinite(cur.cloud_cover)
        ? cur.cloud_cover > 50
          ? "Partly cloudy coastal skies"
          : "Clear coastal weather"
        : null,
    };

    return this.standardizeResponse(weatherData, {
      dataset: "Open-Meteo Global NWP & Satellite Observation Feed",
      origin: "Open-Meteo / WMO / DWD Multi-Model Ensemble (Live Feed)",
      accuracyEstimate: "High Resolution (1-11km)",
      updateFrequency: "Hourly Live Feed",
    });
  }
}

module.exports = RealOpenMeteoWeatherProvider;
