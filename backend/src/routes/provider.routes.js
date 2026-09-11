const express = require('express');
const router = express.Router();
const providerController = require('../controllers/provider.controller');

router.get('/weather', providerController.getWeather);
router.get('/ocean', providerController.getOceanConditions);
router.get('/pfz', providerController.getPFZs);
router.get('/advisories', providerController.getAdvisories);
router.get('/geospatial/zones', providerController.getGeospatialZones);
router.get('/sources', providerController.getDataSources);
router.get('/marine/context', providerController.getMarineContext);

module.exports = router;
