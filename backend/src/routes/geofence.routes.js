const express = require('express');
const router = express.Router();
const geofenceController = require('../controllers/geofence.controller');

router.post('/check', geofenceController.checkLocation);
router.get('/zones', geofenceController.getZonesDatabase);
router.post('/simulate', geofenceController.simulateScenario);

module.exports = router;
