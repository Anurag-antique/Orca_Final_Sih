const GeofenceService = require('../services/geofence.service');

const checkLocation = (req, res, next) => {
  try {
    const { lat, lon, vesselHeading, vesselSpeedKnots } = req.body;
    const audit = GeofenceService.checkLocation({ lat, lon, vesselHeading, vesselSpeedKnots });
    return res.status(200).json({
      success: true,
      data: audit
    });
  } catch (error) {
    next(error);
  }
};

const getZonesDatabase = (req, res) => {
  const zones = GeofenceService.getZonesDatabase();
  return res.status(200).json({
    success: true,
    data: zones
  });
};

const simulateScenario = (req, res, next) => {
  try {
    const { scenario } = req.body;
    let coords = { lat: 18.9220, lon: 72.8347 }; // Default Mumbai Coast Clear

    if (scenario === 'MALVAN_MPA_BREACH') {
      coords = { lat: 16.0500, lon: 73.4600 }; // Inside Malvan Marine Sanctuary
    } else if (scenario === 'NAVAL_FIRING_WARNING') {
      coords = { lat: 18.8200, lon: 72.6800 }; // 4km from INS Trata Firing Zone
    } else if (scenario === 'SIR_CREEK_IMBL_WARNING') {
      coords = { lat: 23.4000, lon: 67.8500 }; // Close to Sir Creek IMBL
    } else if (scenario === 'ANGRIA_BANK_HAZARD') {
      coords = { lat: 16.6500, lon: 72.1000 }; // Inside Angria Bank shallow pinnacle
    }

    const audit = GeofenceService.checkLocation(coords);
    return res.status(200).json({
      success: true,
      scenario,
      data: audit
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkLocation,
  getZonesDatabase,
  simulateScenario
};
