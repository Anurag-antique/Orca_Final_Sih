import api from "./api";

export const maritimeRoutingService = {
  async computeRoute({ origin, destination }, { signal } = {}) {
    return await api.post(
      "/maritime/route",
      {
        origin: { lat: origin.lat, lon: origin.lon },
        destination: { lat: destination.lat, lon: destination.lon },
      },
      { signal },
    );
  },

  async getStatus({ signal } = {}) {
    return await api.get("/maritime/status", { signal });
  },
};
