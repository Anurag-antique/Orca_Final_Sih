const Groq = require('groq-sdk');
const config = require('../config');

class GroqService {
  constructor() {
    this.enabled = !!config.groqApiKey;
    this.model = config.groqModel;
    this.client = this.enabled ? new Groq({ apiKey: config.groqApiKey }) : null;
    if (!this.enabled) {
      console.warn('[GroqService] GROQ_API_KEY not set — LLM calls will be skipped and callers should fall back to rule-based logic.');
    }
  }

  _buildMessages(system, history, user) {
    const messages = [{ role: 'system', content: system }];
    for (const turn of history || []) {
      if (turn && turn.role && turn.content) {
        messages.push({ role: turn.role, content: turn.content });
      }
    }
    messages.push({ role: 'user', content: user });
    return messages;
  }

  /**
   * Ask the model to return strict JSON. Throws if Groq is not configured
   * or the call fails — callers are expected to catch and fall back.
   * `history` (optional): prior [{role: 'user'|'assistant', content}] turns
   * for conversational context (e.g. resolving "and tomorrow?" style follow-ups).
   */
  async chatJSON({ system, user, history = [], temperature = 0.2, maxTokens = 600, reasoningEffort = 'low' }) {
    if (!this.enabled) {
      throw new Error('Groq not configured (missing GROQ_API_KEY)');
    }
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature,
      max_tokens: maxTokens,
      reasoning_effort: reasoningEffort,
      response_format: { type: 'json_object' },
      messages: this._buildMessages(system, history, user)
    });
    const raw = completion.choices?.[0]?.message?.content || '{}';
    return JSON.parse(raw);
  }

  /**
   * Ask the model for a plain text reply (used for narrative synthesis / chitchat).
   * `history` (optional): prior conversation turns, same shape as above.
   */
  async chatText({ system, user, history = [], temperature = 0.4, maxTokens = 900, reasoningEffort = 'low' }) {
    if (!this.enabled) {
      throw new Error('Groq not configured (missing GROQ_API_KEY)');
    }
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature,
      max_tokens: maxTokens,
      reasoning_effort: reasoningEffort,
      messages: this._buildMessages(system, history, user)
    });
    return completion.choices?.[0]?.message?.content?.trim() || '';
  }

  /**
   * Ask the model to autonomously choose which tools (functions) to call,
   * given their descriptions. Returns the raw assistant message so the
   * caller can inspect message.tool_calls. Used for autonomous worker/tool
   * selection instead of a hardcoded intent->tools lookup table.
   * `history` (optional): prior conversation turns, same shape as above.
   */
  async chatWithTools({ system, user, tools, history = [], temperature = 0.1, maxTokens = 600, reasoningEffort = 'low' }) {
    if (!this.enabled) {
      throw new Error('Groq not configured (missing GROQ_API_KEY)');
    }
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature,
      max_tokens: maxTokens,
      reasoning_effort: reasoningEffort,
      tools,
      tool_choice: 'auto',
      messages: this._buildMessages(system, history, user)
    });
    return completion.choices?.[0]?.message || { content: '', tool_calls: [] };
  }
}

module.exports = new GroqService();
