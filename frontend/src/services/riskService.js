import api from './api';

export const riskService = {
  async evaluateRisk(payload) {
    return await api.post('/risk/evaluate', payload);
  },

  async getThresholds() {
    return await api.get('/risk/thresholds');
  }
};
