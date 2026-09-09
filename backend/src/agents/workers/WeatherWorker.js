const BaseAgent = require('../BaseAgent');
const weatherService = require('../../services/weather.service');

class WeatherWorker extends BaseAgent {
  constructor() {
    super('WeatherWorker', 'Meteorological & Atmospheric Telemetry Worker');
  }

  async execute({ location }) {
    const res = await weatherService.getWeather(location);
    return res;
  }
}

module.exports = WeatherWorker;
