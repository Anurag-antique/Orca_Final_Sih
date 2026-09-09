import api from './api';

export const geofenceService = {
  async checkLocation(lat, lon, vesselHeading = 0, vesselSpeedKnots = 8.0) {
    return await api.post('/geofence/check', { lat, lon, vesselHeading, vesselSpeedKnots });
  },

  async getZones() {
    return await api.get('/geofence/zones');
  },

  async simulateScenario(scenario) {
    return await api.post('/geofence/simulate', { scenario });
  }
};
