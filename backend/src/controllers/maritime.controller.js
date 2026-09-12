const maritimeRoutingService = require("../services/maritimeRoutingService");

/**
 * POST /api/maritime/route
 * Body: { origin: {lat, lon}, destination: {lat, lon} }
 *
 * Returns a genuine marine route (GeoJSON-compatible [lat,lon] polyline) or
 * an explicit unavailable state. Never returns a fake route.
 */
const computeRoute = async (req, res, next) => {
  try {
    const { origin, destination } = req.body || {};

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message:
          "Body must include { origin: {lat, lon}, destination: {lat, lon} }.",
      });
    }

    const result = await maritimeRoutingService.computeRoute(
      origin,
      destination,
    );

    if (!result.available) {
      return res.status(503).json({
        success: false,
        message: result.reason || "Unable to calculate a marine route.",
      });
    }

    return res.status(200).json({
      success: true,
      route: {
        geometry: result.geometry, // [[lat, lon], ...]
        distanceNm: result.distanceNm,
        origin: result.origin,
        destination: result.destination,
        provider: result.provider,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/maritime/status
 */
const getStatus = (_req, res) => {
  const available = maritimeRoutingService.isAvailable();
  return res.status(200).json({
    success: true,
    available,
    reason: available ? null : maritimeRoutingService.getUnavailableReason(),
  });
};

module.exports = { computeRoute, getStatus };
