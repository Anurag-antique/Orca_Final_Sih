import api from './api';

export const routeService = {
  async planRoute(origin, destination, vesselProfile, cruisingSpeedKnots = 8.5) {
    return await api.post('/routes/plan', {
      origin,
      destination,
      vesselProfile,
      cruisingSpeedKnots
    });
  },

  async getWaypoints() {
    return await api.get('/routes/waypoints');
  }
};
