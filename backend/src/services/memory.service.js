const supabase = require('../config/supabase');

const DEFAULT_HISTORY_LIMIT = 6; // last ~3 user+assistant turns

class MemoryService {
  /**
   * Fetch the most recent messages for a conversation, in chronological order.
   * Returns [] (never throws) so a memory read failure never breaks a chat reply.
   */
  static async getRecentMessages(conversationId, limit = DEFAULT_HISTORY_LIMIT) {
    if (!conversationId) return [];

    const { data, error } = await supabase
      .from('conversation_messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[MemoryService] Failed to fetch history:', error.message);
      return [];
    }

    return (data || []).reverse().map(m => ({ role: m.role, content: m.content }));
  }

  /**
   * Store one message. Fire-and-forget safe: failures are logged, never thrown,
   * so a Supabase hiccup never breaks the chat response itself.
   */
  static async appendMessage(conversationId, role, content) {
    if (!conversationId || !content) return;

    const { error } = await supabase
      .from('conversation_messages')
      .insert({ conversation_id: conversationId, role, content });

    if (error) {
      console.warn('[MemoryService] Failed to store message:', error.message);
    }
  }

  /**
   * Wipe all history for one conversation (e.g. a "clear chat" button).
   */
  static async clearConversation(conversationId) {
    if (!conversationId) return;

    const { error } = await supabase
      .from('conversation_messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (error) {
      console.warn('[MemoryService] Failed to clear conversation:', error.message);
    }
  }
}

module.exports = MemoryService;
