const express = require('express');
const router = express.Router();
const explainController = require('../controllers/explain.controller');

router.post('/package', explainController.getExplainabilityPackage);

module.exports = router;
