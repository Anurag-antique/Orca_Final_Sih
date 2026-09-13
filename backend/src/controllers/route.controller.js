const RoutePlanningService = require('../services/route.service');

const planRoute = async (req, res, next) => {
  try {
    const { origin, destination, vesselProfile, cruisingSpeedKnots, liveLocation } = req.body;
    const routePlan = await RoutePlanningService.planRoute({
      origin,
      destination,
      vesselProfile,
      cruisingSpeedKnots,
      liveLocation
    });

    return res.status(200).json({
      success: true,
      data: routePlan
    });
  } catch (error) {
    next(error);
  }
};

const getHarborsAndDestinations = (req, res) => {
  const harbors = RoutePlanningService.getHarbors();
  const destinations = RoutePlanningService.getDestinations();

  return res.status(200).json({
    success: true,
    data: {
      harbors,
      destinations
    }
  });
};

const getRouteTemplates = (req, res) => {
  const templates = RoutePlanningService.getRouteTemplates();

  return res.status(200).json({
    success: true,
    data: templates
  });
};

module.exports = {
  planRoute,
  getHarborsAndDestinations,
  getRouteTemplates
};
