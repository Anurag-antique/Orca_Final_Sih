const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller');

router.post('/execute', agentController.executeAgentPipeline);
router.get('/architecture', agentController.getAgentArchitecture);

module.exports = router;
