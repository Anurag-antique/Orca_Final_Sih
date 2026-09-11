const express = require("express");
const router = express.Router();
const providerController = require("../controllers/provider.controller");

router.get('/weather', providerController.getWeather);
router.get('/ocean', providerController.getOceanConditions);
router.get('/pfz', providerController.getPFZs);
router.get('/advisories', providerController.getAdvisories);
router.get('/geospatial/zones', providerController.getGeospatialZones);https://github.com/Krushnakedar/Orca_Final_Sih/pull/4/conflict?name=backend%252Fsrc%252Froutes%252Fprovider.routes.js&ancestor_oid=8b1942622166549822e66001e173465a2584d177&base_oid=681bf71ef4741263e050d88f76cf066e27b78d6a&head_oid=db27791899b372fa9fbc284c24dcbcc986bc3c7d
router.get('/sources', providerController.getDataSources);
router.get('/marine/context', providerController.getMarineContext);

module.exports = router;
