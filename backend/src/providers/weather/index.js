const FallbackWeatherProvider = require('./FallbackWeatherProvider');
const MockWeatherProvider = require('./MockWeatherProvider');
const RealOpenMeteoWeatherProvider = require('./RealOpenMeteoWeatherProvider');

const activeWeatherProvider = new FallbackWeatherProvider();

module.exports = {
  activeWeatherProvider,
  FallbackWeatherProvider,
  MockWeatherProvider,
  RealOpenMeteoWeatherProvider
};
