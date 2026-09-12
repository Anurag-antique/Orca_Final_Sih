const { activeWeatherProvider } = require("./weather");
const { activeOceanProvider } = require("./ocean");
const { activePFZProvider } = require("./pfz");
const { activeAdvisoryProvider } = require("./advisory");
const { activeGeospatialProvider } = require("./geospatial");

class ProviderManager {
  constructor() {
    this.providers = {
      weather: activeWeatherProvider,
      ocean: activeOceanProvider,
      pfz: activePFZProvider,
      advisory: activeAdvisoryProvider,
      geospatial: activeGeospatialProvider,
    };
  }

  getRegisteredProvidersInfo() {
    return Object.entries(this.providers).map(([key, provider]) => ({
      domain: key,
      name: provider.name,
      type: provider.providerType,
      version: provider.version,
      isMock: provider.isMock,
      status: provider.status,
      // Real latency must be measured per request — not fabricated.
      latencyMs: null,
    }));
  }

  getWeatherProvider() {
    return this.providers.weather;
  }
  getOceanProvider() {
    return this.providers.ocean;
  }
  getPFZProvider() {
    return this.providers.pfz;
  }
  getAdvisoryProvider() {
    return this.providers.advisory;
  }
  getGeospatialProvider() {
    return this.providers.geospatial;
  }
}

const providerManager = new ProviderManager();

module.exports = {
  providerManager,
  activeWeatherProvider,
  activeOceanProvider,
  activePFZProvider,
  activeAdvisoryProvider,
  activeGeospatialProvider,
};
