const { activeGeospatialProvider } = require('../providers/geospatial');

class GeospatialService {
  constructor(provider = activeGeospatialProvider) {
    this.provider = provider;
  }

  async getGeospatialZones(location) {
    return await this.provider.getGeospatialZones(location);
  }
}

module.exports = new GeospatialService();
