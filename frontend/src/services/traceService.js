import api from './api';

export const traceService = {
  async getTraces(filters = {}) {
    const params = new URLSearchParams();
    if (filters.sector) params.append('sector', filters.sector);
    if (filters.language) params.append('language', filters.language);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    return await api.get(`/traces?${params.toString()}`);
  },

  async getTraceById(id) {
    return await api.get(`/traces/${id}`);
  },

  async getMetrics() {
    return await api.get('/traces/metrics');
  },

  getExportUrl() {
    return `${api.defaults.baseURL || '/api'}/traces/export`;
  }
};
