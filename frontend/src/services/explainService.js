import api from './api';

export const explainService = {
  async getPackage(payload) {
    return await api.post('/explain/package', payload);
  }
};
