const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

router.post('/message', chatController.handleChatMessage);
router.get('/history', chatController.getChatHistory);
router.post('/reset', chatController.resetChatSession);

module.exports = router;
