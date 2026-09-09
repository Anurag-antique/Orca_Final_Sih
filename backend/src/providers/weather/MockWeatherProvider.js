const BaseProvider = require('../base/BaseProvider');
const IWeatherProvider = require('./IWeatherProvider');

class MockWeatherProvider extends BaseProvider {
  constructor() {
    super('Mock-IMD-OpenMeteo-WeatherProvider', 'WEATHER', '1.0.0', true);
  }

  async getWeather(location, datetime = new Date()) {
    try {
      const lat = parseFloat(location?.lat) || 18.9220;
      const lon = parseFloat(location?.lon) || 72.8347;

      // Deterministic variations based on sector coordinates
      const isWesternCoast = lon < 78.0;
      const isKochiSector = lat < 12.0;

      const baseTemp = isKochiSector ? 29.2 : 28.4;
      const baseWind = isWesternCoast ? 18.5 : 14.2;

      const weatherData = {
        location: {
          lat,
          lon,
          sectorName: location?.sectorName || (isKochiSector ? 'Kochi Harbor Sector' : 'Mumbai Coastal Sector')
        },
        forecastTime: new Date(datetime).toISOString(),
        temperatureC: baseTemp,
        apparentTemperatureC: baseTemp + 3.2,
        windSpeedKmh: baseWind,
        windSpeedKnots: parseFloat((baseWind * 0.539957).toFixed(1)),
        windGustsKmh: parseFloat((baseWind * 1.35).toFixed(1)),
        windDirectionDegrees: isWesternCoast ? 245 : 95,
        windDirectionCardinal: isWesternCoast ? 'WSW' : 'E',
        precipitationProbabilityPct: isKochiSector ? 45 : 15,
        precipitationMm: isKochiSector ? 3.4 : 0.2,
        relativeHumidityPct: 78,
        cloudCoverPct: isKochiSector ? 60 : 25,
        surfacePressureHpa: 1011.5,
        visibilityKm: 8.5,
        uvIndex: 7,
        lightningRisk: 'LOW',
        cycloneAlert: {
          active: false,
          category: 'NO_CYCLONE_THREAT',
          message: 'No active cyclonic storms within 250 NM radius.'
        },
        conditionsSummary: isKochiSector ? 'Scattered coastal clouds with moderate onshore breeze' : 'Clear skies with moderate offshore chop'
      };

      return this.standardizeResponse(weatherData, {
        dataset: 'IMD Coastal Forecast & NWP Gridded Model (Prototype Simulation)',
        origin: 'India Meteorological Department / Open-Meteo Integration Architecture',
        updateFrequency: 'Every 3 Hours'
      });
    } catch (err) {
      return this.handleError(err, 'getWeather');
    }
  }
}

module.exports = MockWeatherProvider;
