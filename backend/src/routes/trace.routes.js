const express = require('express');
const router = express.Router();
const traceController = require('../controllers/trace.controller');

router.get('/', traceController.getTraces);
router.get('/metrics', traceController.getMetrics);
router.get('/export', traceController.exportAuditLog);
router.get('/:id', traceController.getTraceById);

module.exports = router;
