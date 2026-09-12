const aisStreamService = require("../services/aisStreamService");

/**
 * GET /api/vessels?bounds=south,west,north,east
 *
 * Returns the cached live vessel positions from the shared AIS connection.
 * If AIS is not configured or not connected, returns an explicit state
 * rather than fake data.
 */
const listVessels = (req, res) => {
  const status = aisStreamService.getStatus();

  if (!status.apiKeyConfigured) {
    return res.status(503).json({
      success: false,
      message:
        "Live vessel data is not configured on the server (AISSTREAM_API_KEY missing).",
      connected: false,
      count: 0,
      vessels: [],
      lastMessageAt: null,
    });
  }

  if (!status.connected) {
    return res.status(503).json({
      success: false,
      message:
        "Live vessel feed is currently disconnected. Retrying automatically.",
      connected: false,
      count: 0,
      vessels: [],
      lastMessageAt: status.lastMessageAt,
      lastError: status.lastError,
    });
  }

  let bounds = {};
  if (typeof req.query.bounds === "string" && req.query.bounds.length) {
    const parts = req.query.bounds.split(",").map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      bounds = {
        south: parts[0],
        west: parts[1],
        north: parts[2],
        east: parts[3],
      };
    }
  }

  const vessels = aisStreamService.getVessels(bounds);

  return res.status(200).json({
    success: true,
    connected: true,
    count: vessels.length,
    lastMessageAt: status.lastMessageAt,
    vessels,
  });
};

/**
 * GET /api/vessels/status
 */
const getStatus = (_req, res) => {
  return res.status(200).json({
    success: true,
    ...aisStreamService.getStatus(),
  });
};

module.exports = { listVessels, getStatus };
