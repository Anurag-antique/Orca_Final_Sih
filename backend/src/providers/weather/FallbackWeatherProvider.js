const BaseProvider = require('../base/BaseProvider');
const RealOpenMeteoWeatherProvider = require('./RealOpenMeteoWeatherProvider');
const MockWeatherProvider = require('./MockWeatherProvider');

class FallbackWeatherProvider extends BaseProvider {
  constructor() {
    super('Resilient-WeatherProvider-Orchestrator', 'WEATHER', '1.0.0', false);
    this.primaryProvider = new RealOpenMeteoWeatherProvider();
    this.fallbackProvider = new MockWeatherProvider();
  }

  async getWeather(location, datetime = new Date()) {
    try {
      // 1. Try Primary Real Open-Meteo API
      const result = await this.primaryProvider.getWeather(location, datetime);
      return result;
    } catch (primaryError) {
      console.warn(`[WeatherProvider Fallback Triggered] ${primaryError.message}. Switching to Mock Weather Model.`);
      
      // 2. Seamlessly Fallback to Mock Provider
      const fallbackResult = await this.fallbackProvider.getWeather(location, datetime);
      
      // Explicitly mark provenance as fallback demo data
      fallbackResult.source.isFallback = true;
      fallbackResult.source.fallbackReason = primaryError.message;
      fallbackResult.source.dataset = `${fallbackResult.source.dataset} (Fallback Active)`;
      return fallbackResult;
    }
  }
}

module.exports = FallbackWeatherProvider;
