import api from "./api";

export const notificationService = {
  async list({ unreadOnly = false, limit = 50 } = {}) {
    const params = { limit };
    if (unreadOnly) params.unread = "true";
    return await api.get("/notifications", { params });
  },

  async markRead(id) {
    return await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead() {
    return await api.post("/notifications/read-all");
  },

  /**
   * Open the SSE stream. Returns a cleanup function.
   * The token must be passed explicitly — EventSource cannot set headers.
   * The backend accepts ?token= ONLY for /notifications/stream.
   */
  openStream(token, onNotification, onError) {
    if (!token) return () => {};

    const url = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.addEventListener("notification", (e) => {
      try {
        onNotification?.(JSON.parse(e.data));
      } catch {
        /* ignore malformed frame */
      }
    });

    es.onerror = (err) => {
      onError?.(err);
      // EventSource reconnects automatically.
    };

    return () => es.close();
  },
};
