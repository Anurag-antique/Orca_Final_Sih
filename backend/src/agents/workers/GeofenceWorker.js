const BaseAgent = require('../BaseAgent');
const geospatialService = require('../../services/geospatial.service');

class GeofenceWorker extends BaseAgent {
  constructor() {
    super('GeofenceWorker', 'Maritime GIS Boundaries & Geofence Worker');
  }

  async execute({ location }) {
    const res = await geospatialService.getGeospatialZones(location);
    return res;
  }
}

module.exports = GeofenceWorker;
