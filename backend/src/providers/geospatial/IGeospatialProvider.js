class IGeospatialProvider {
  async getGeospatialZones(location) {
    throw new Error('Method getGeospatialZones(location) must be implemented.');
  }
}

module.exports = IGeospatialProvider;
