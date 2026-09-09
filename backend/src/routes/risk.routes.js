const express = require('express');
const router = express.Router();
const riskController = require('../controllers/risk.controller');

router.post('/evaluate', riskController.evaluateRisk);
router.get('/thresholds', riskController.getThresholds);

module.exports = router;
