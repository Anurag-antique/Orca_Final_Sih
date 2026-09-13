import api from './api';

export const routeService = {
  async planRoute(origin, destination, vesselProfile, cruisingSpeedKnots = 8.5, liveLocation = null) {
    return await api.post(
      '/routes/plan',
      {
        origin,
        destination,
        vesselProfile,
        cruisingSpeedKnots,
        liveLocation
      },
      {
        timeout: 15000
      }
    );
  },

  async getWaypoints() {
    return await api.get('/routes/waypoints');
  },

  async getTemplates() {
    return await api.get('/routes/templates');
  }
};
