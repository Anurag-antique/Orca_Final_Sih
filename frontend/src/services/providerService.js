import api from './api';

export const providerService = {
  async getWeather(lat = 18.9220, lon = 72.8347, sector = 'Mumbai Coast', date) {
    const params = new URLSearchParams({ lat, lon, sector });
    if (date) params.append('date', date);
    return await api.get(`/weather?${params.toString()}`);
  },

  async getOceanConditions(lat = 18.9220, lon = 72.8347, date) {
    const params = new URLSearchParams({ lat, lon });
    if (date) params.append('date', date);
    return await api.get(`/ocean?${params.toString()}`);
  },

  async getPFZs(lat = 18.9220, lon = 72.8347, sector = 'Mumbai Coast', date) {
    const params = new URLSearchParams({ lat, lon, sector });
    if (date) params.append('date', date);
    return await api.get(`/pfz?${params.toString()}`);
  },

  async getAdvisories(lat = 18.9220, lon = 72.8347) {
    return await api.get(`/advisories?lat=${lat}&lon=${lon}`);
  },

  async getGeospatialZones(lat = 18.9220, lon = 72.8347) {
    return await api.get(`/geospatial/zones?lat=${lat}&lon=${lon}`);
  },

  async getDataSources() {
    return await api.get('/sources');
  },

  async getMarineContext(lat, lon, sector = 'Mumbai Coast') {
    const params = new URLSearchParams({ lat, lon, sector });
    return await api.get(`/marine/context?${params.toString()}`);
  }
};
