import api from './api';

export const checkHealth = async () => {
  return await api.get('/health');
};
