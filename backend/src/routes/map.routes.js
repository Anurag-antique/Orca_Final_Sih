const express = require('express');
const router = express.Router();
const mapController = require('../controllers/map.controller');

router.get('/layers', mapController.getMapLayers);

module.exports = router;
