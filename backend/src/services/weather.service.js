const { activeWeatherProvider } = require('../providers/weather');

class WeatherService {
  constructor(provider = activeWeatherProvider) {
    this.provider = provider;
  }

  async getWeather(location, datetime) {
    return await this.provider.getWeather(location, datetime);
  }
}

module.exports = new WeatherService();
