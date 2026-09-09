const config = require('../config');

const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: "ORCA API is running",
    timestamp: new Date().toISOString(),
    version: config.apiVersion,
    environment: config.env
  });
};

module.exports = {
  getHealthStatus,
};
