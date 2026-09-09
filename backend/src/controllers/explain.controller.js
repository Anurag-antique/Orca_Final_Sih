const ExplainabilityService = require('../services/explainability.service');
const { RiskAssessmentEngine } = require('../engine');

const getExplainabilityPackage = (req, res, next) => {
  try {
    const { intent, sectorName, weather, ocean, pfz, advisory, geospatial, vesselProfile } = req.body;

    const riskAssessment = RiskAssessmentEngine.evaluate({
      weather: weather || {},
      ocean: ocean || {},
      advisory: advisory || {},
      geospatial: geospatial || {},
      vesselProfile: vesselProfile || {}
    });

    const pkg = ExplainabilityService.generatePackage({
      intent: intent || 'FISHING_VOYAGE_SAFETY_ASSESSMENT',
      sectorName: sectorName || 'Mumbai Coast',
      weather: weather || {},
      ocean: ocean || {},
      pfz: pfz || {},
      advisory: advisory || {},
      geospatial: geospatial || {},
      riskAssessment
    });

    return res.status(200).json({
      success: true,
      data: pkg
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExplainabilityPackage
};
