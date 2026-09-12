import api from "./api";

export const vesselService = {
  async list(bounds, { signal } = {}) {
    const params = bounds
      ? {
          bounds: `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`,
        }
      : undefined;
    return await api.get("/vessels", { params, signal });
  },

  async status({ signal } = {}) {
    return await api.get("/vessels/status", { signal });
  },
};
