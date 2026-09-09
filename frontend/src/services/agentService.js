import api from './api';

export const agentService = {
  async executePipeline(query, sector = 'Mumbai Coast', vesselProfile) {
    return await api.post('/agents/execute', { query, sector, vesselProfile });
  },

  async getArchitecture() {
    return await api.get('/agents/architecture');
  }
};
