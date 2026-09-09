import api from './api';

export const mapService = {
  async getLayers(sector = 'all') {
    return await api.get(`/map/layers?sector=${encodeURIComponent(sector)}`);
  }
};
