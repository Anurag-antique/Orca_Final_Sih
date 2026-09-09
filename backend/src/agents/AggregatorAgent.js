const BaseAgent = require('./BaseAgent');

class AggregatorAgent extends BaseAgent {
  constructor() {
    super('AggregatorAgent', 'Multi-Worker Evidence Aggregation & Normalization');
  }

  async execute({ workerResults }) {
    const evidence = {
      weather: null,
      ocean: null,
      pfz: null,
      advisory: null,
      geospatial: null,
      workerAudits: []
    };

    let totalEvidencePoints = 0;

    for (const [key, result] of Object.entries(workerResults)) {
      if (result && result.success && result.output) {
        evidence[key] = result.output.data;
        totalEvidencePoints += 1;
        evidence.workerAudits.push({
          worker: result.agent,
          status: 'SUCCESS',
          source: result.output.source?.origin || 'Verified Provider',
          durationMs: result.durationMs
        });
      } else {
        evidence.workerAudits.push({
          worker: key,
          status: 'FALLBACK_OR_DEGRADED',
          error: result?.error || 'Worker returned empty data',
          durationMs: result?.durationMs || 0
        });
      }
    }

    return {
      aggregatedAt: new Date().toISOString(),
      totalEvidencePoints,
      allWorkersCompleted: evidence.workerAudits.every(a => a.status === 'SUCCESS'),
      evidence
    };
  }
}

module.exports = AggregatorAgent;
