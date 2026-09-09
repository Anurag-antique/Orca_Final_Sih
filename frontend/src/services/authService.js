import api from './api';

export const authService = {
  async login(credentials) {
    return await api.post('/auth/login', credentials);
  },

  async register(userData) {
    return await api.post('/auth/register', userData);
  },

  async getProfile() {
    return await api.get('/auth/me');
  },

  async logout() {
    try {
      return await api.post('/auth/logout');
    } catch {
      return { success: true };
    }
  }
};
