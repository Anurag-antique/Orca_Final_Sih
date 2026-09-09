import api from './api';

export const chatService = {
  async sendMessage(message, location, conversationId, language = 'en') {
    return await api.post('/chat/message', {
      message,
      location,
      conversationId,
      language
    });
  },

  async getHistory(conversationId) {
    return await api.get(`/chat/history?conversationId=${encodeURIComponent(conversationId)}`);
  },

  async resetSession(conversationId) {
    return await api.post('/chat/reset', { conversationId });
  }
};
