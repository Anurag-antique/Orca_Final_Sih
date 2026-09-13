const BaseAgent = require('./BaseAgent');
const groqService = require('../services/groq.service');

const VALID_DOMAINS = new Set(['weather', 'ocean', 'pfz', 'advisory', 'geofence']);

const SYSTEM_PROMPT = `You are the evidence-sufficiency reviewer for ORCA, a marine safety assistant.
You will be given the user's original message, the classified intent, and a summary of which data domains were already fetched this turn (and whether each succeeded or degraded/failed).

Decide: is the evidence gathered so far enough to give an accurate, safe answer? Only flag a gap if a domain that was NOT already fetched would materially change the answer.

Rules:
- Never request a domain that was already attempted this turn, even if it degraded or failed — re-requesting it will not help.
- Only choose from: "weather", "ocean", "pfz", "advisory", "geofence".
- Be conservative: most of the time, if weather/ocean/advisory are already present, that is sufficient. Only flag a genuine, specific gap (e.g. a route-planning question with no geofence data fetched, or a fishing-zone question with no pfz data fetched).

Respond ONLY with JSON of this exact shape:
{
  "sufficient": true or false,
  "reason": "short reason",
  "additionalTools": ["only domains genuinely missing and needed, empty array if none"]
}`;

class EvidenceReviewAgent extends BaseAgent {
  constructor() {
    super('EvidenceReviewAgent', 'Observe-Act-Observe Evidence Sufficiency Reviewer (LLM-based, fail-safe)');
  }

  async execute({ message, intentResult, alreadyFetched }) {
    try {
      const review = await groqService.chatJSON({
        system: SYSTEM_PROMPT,
        user: JSON.stringify({
          message,
          intent: intentResult.primaryIntent,
          alreadyFetched
        }),
        temperature: 0.1,
        maxTokens: 300
      });

      const additionalTools = Array.isArray(review.additionalTools)
        ? [...new Set(review.additionalTools.filter(d => VALID_DOMAINS.has(d) && !(d in alreadyFetched)))]
        : [];

      return {
        sufficient: additionalTools.length === 0,
        reason: review.reason || '',
        additionalTools,
        method: 'LLM_GROQ'
      };
    } catch (err) {
      // Fail-safe: if the review call itself fails, proceed with whatever
      // evidence was already gathered rather than blocking the response.
      console.warn('[EvidenceReviewAgent] Review call failed, assuming evidence is sufficient (fail-safe):', err.message);
      return {
        sufficient: true,
        reason: 'Review unavailable — proceeding with evidence already gathered',
        additionalTools: [],
        method: 'FAILSAFE_SKIP'
      };
    }
  }
}

module.exports = EvidenceReviewAgent;
