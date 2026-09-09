const { RiskAssessmentEngine, thresholds } = require('../engine');

const evaluateRisk = (req, res, next) => {
  try {
    const { weather, ocean, advisory, geospatial, vesselProfile } = req.body;

    const evaluation = RiskAssessmentEngine.evaluate({
      weather: weather || {},
      ocean: ocean || {},
      advisory: advisory || {},
      geospatial: geospatial || {},
      vesselProfile: vesselProfile || {}
    });

    return res.status(200).json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    next(error);
  }
};

const getThresholds = (req, res) => {
  return res.status(200).json({
    success: true,
    data: thresholds
  });
};

module.exports = {
  evaluateRisk,
  getThresholds
};
