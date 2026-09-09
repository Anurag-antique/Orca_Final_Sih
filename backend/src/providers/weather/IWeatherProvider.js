class IWeatherProvider {
  async getWeather(location, datetime) {
    throw new Error('Method getWeather(location, datetime) must be implemented.');
  }
}

module.exports = IWeatherProvider;
