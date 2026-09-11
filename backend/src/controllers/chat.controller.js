const { orchestrator } = require('../agents');
const MemoryService = require('../services/memory.service');

// In-memory conversation session store
const conversationSessions = new Map();

const handleChatMessage = async (req, res, next) => {
  try {
    const { message, conversationId, location, vesselProfile, language = 'en' } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const convId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Execute query through real Agent Orchestrator Pipeline:
    // IntentAgent -> PlannerAgent -> Parallel Workers -> AggregatorAgent -> RiskEngine -> ExplainerAgent
    const aiResponse = await orchestrator.processQuery({
      message,
      location,
      vesselProfile,
      conversationId: convId,
      language
    });

    const userMsgObj = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };

    const aiMsgObj = {
      id: `msg_a_${Date.now()}`,
      sender: 'ai',
      ...aiResponse
    };

    if (!conversationSessions.has(convId)) {
      conversationSessions.set(convId, []);
    }
    const sessionHistory = conversationSessions.get(convId);
    sessionHistory.push(userMsgObj, aiMsgObj);

    return res.status(200).json({
      success: true,
      conversationId: convId,
      userMessage: userMsgObj,
      aiResponse: aiMsgObj
    });
  } catch (error) {
    next(error);
  }
};

const getChatHistory = (req, res, next) => {
  try {
    const convId = req.query.conversationId;
    if (!convId || !conversationSessions.has(convId)) {
      return res.status(200).json({
        success: true,
        conversationId: convId || 'default',
        messages: []
      });
    }

    return res.status(200).json({
      success: true,
      conversationId: convId,
      messages: conversationSessions.get(convId)
    });
  } catch (error) {
    next(error);
  }
};

const resetChatSession = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    if (conversationId && conversationSessions.has(conversationId)) {
      conversationSessions.delete(conversationId);
    }
    if (conversationId) {
      await MemoryService.clearConversation(conversationId);
    }
    return res.status(200).json({
      success: true,
      message: 'Conversation history reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleChatMessage,
  getChatHistory,
  resetChatSession
};
