import api from './api';

export const dashboardService = {
  async getSummary(sector = 'Mumbai Coast') {
    return await api.get(`/dashboard?sector=${encodeURIComponent(sector)}`);
  }
};
