const express = require('express');
const router = express.Router();
const routeController = require('../controllers/route.controller');

router.post('/plan', routeController.planRoute);
router.get('/waypoints', routeController.getHarborsAndDestinations);

module.exports = router;
