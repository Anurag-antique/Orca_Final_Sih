const RoutePlanningService = require('../services/route.service');

const planRoute = (req, res, next) => {
  try {
    const { origin, destination, vesselProfile, cruisingSpeedKnots } = req.body;
    const routePlan = RoutePlanningService.planRoute({
      origin,
      destination,
      vesselProfile,
      cruisingSpeedKnots
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

module.exports = {
  planRoute,
  getHarborsAndDestinations
};
