const IntentAgent = require('./IntentAgent');
const PlannerAgent = require('./PlannerAgent');
const EvidenceReviewAgent = require('./EvidenceReviewAgent');
const WeatherWorker = require('./workers/WeatherWorker');
const OceanWorker = require('./workers/OceanWorker');
const PFZWorker = require('./workers/PFZWorker');
const AdvisoryWorker = require('./workers/AdvisoryWorker');
const GeofenceWorker = require('./workers/GeofenceWorker');
const AggregatorAgent = require('./AggregatorAgent');
const ExplainerAgent = require('./ExplainerAgent');
const { RiskAssessmentEngine } = require('../engine');
const TraceService = require('../services/trace.service');
const MemoryService = require('../services/memory.service');

class AgentOrchestrator {
  constructor() {
    this.intentAgent = new IntentAgent();
    this.plannerAgent = new PlannerAgent();
    this.evidenceReviewAgent = new EvidenceReviewAgent();
    this.workers = {
      weather: new WeatherWorker(),
      ocean: new OceanWorker(),
      pfz: new PFZWorker(),
      advisory: new AdvisoryWorker(),
      geofence: new GeofenceWorker()
    };
    this.aggregatorAgent = new AggregatorAgent();
    this.explainerAgent = new ExplainerAgent();
  }

  async processQuery({ message, location, vesselProfile, conversationId, language = 'en' }) {
    const overallStartTime = Date.now();
    const trace = [];

    // Resolve a stable conversation id up front so we can both read prior
    // turns and save this turn under the same id.
    const activeConversationId = conversationId || `conv_${Date.now()}`;

    // Pull recent turns (if any) so agents can resolve follow-ups like
    // "and tomorrow?" or "on google it shows different" correctly.
    const history = await MemoryService.getRecentMessages(activeConversationId);

    // 1. Multilingual Intent Classification (LLM-based, rule-based fallback)
    const intentRes = await this.intentAgent.run({ message, location, vesselProfile, language, history });
    trace.push({
      step: 1,
      agent: intentRes.agent,
      role: intentRes.role,
      action: `Classified query into intent "${intentRes.output.primaryIntent}" (Language: ${intentRes.output.detectedLanguage.toUpperCase()}, Method: ${intentRes.output.classificationMethod}) for sector "${intentRes.output.targetSector}" | Tools: [${intentRes.output.requiredWorkers.join(', ') || 'none'}] (${intentRes.output.toolSelectionMethod})`,
      status: intentRes.success ? 'COMPLETED' : 'FAILED',
      durationMs: intentRes.durationMs,
      timestamp: intentRes.timestamp,
      data: intentRes.output
    });

    // --- Short-circuit: pure chitchat/greeting needs no marine data pipeline ---
    if (intentRes.output.primaryIntent === 'CHITCHAT') {
      const expRes = await this.explainerAgent.run({
        intentResult: intentRes.output,
        aggregatedEvidence: { evidence: {} },
        riskAssessment: { level: 'N/A', score: null, factors: [] },
        originalMessage: message,
        history
      });

      trace.push({
        step: 2,
        agent: expRes.agent,
        role: expRes.role,
        action: `Generated conversational reply in [${intentRes.output.detectedLanguage.toUpperCase()}] (no marine worker pipeline triggered for chitchat)`,
        status: expRes.success ? 'COMPLETED' : 'FAILED',
        durationMs: expRes.durationMs,
        timestamp: expRes.timestamp
      });

      const totalDurationMs = Date.now() - overallStartTime;

      // Save this turn to memory (fire-and-forget safe — never throws)
      MemoryService.appendMessage(activeConversationId, 'user', message).catch(() => {});
      MemoryService.appendMessage(activeConversationId, 'assistant', expRes.output.text).catch(() => {});

      return {
        success: true,
        conversationId: activeConversationId,
        intent: intentRes.output.primaryIntent,
        language: intentRes.output.detectedLanguage,
        sector: intentRes.output.targetSector,
        riskAssessment: null,
        evidence: {},
        plan: null,
        text: expRes.output.text,
        citations: [],
        explainabilityPackage: null,
        trace,
        totalExecutionTimeMs: totalDurationMs,
        timestamp: new Date().toISOString()
      };
    }

    // 2. Planning DAG Scheduler (tool selection already folded into step 1's
    // classification call above — same LLM response now decides both intent
    // and which data sources are needed, saving one full round-trip per query)
    const planRes = await this.plannerAgent.run({
      intentResult: intentRes.output,
      location
    });
    trace.push({
      step: 2,
      agent: planRes.agent,
      role: planRes.role,
      action: `Constructed multi-agent execution DAG with ${planRes.output.tasks.length} parallel worker tasks`,
      status: planRes.success ? 'COMPLETED' : 'FAILED',
      durationMs: planRes.durationMs,
      timestamp: planRes.timestamp,
      data: planRes.output
    });

    // 3. Parallel Worker Execution
    const targetLocation = {
      lat: location?.lat || 18.9220,
      lon: location?.lon || 72.8347,
      sectorName: intentRes.output.targetSector
    };

    const workerTasks = planRes.output.tasks.map(async (task) => {
      const worker = this.workers[task.domain];
      if (!worker) {
        return [task.domain, { success: false, error: `Worker ${task.domain} not found` }];
      }
      const res = await worker.run({ location: targetLocation });
      return [task.domain, res];
    });

    const workerEntries = await Promise.all(workerTasks);
    const workerResults = Object.fromEntries(workerEntries);

    let workerStepIndex = 3;
    for (const [domain, res] of Object.entries(workerResults)) {
      trace.push({
        step: workerStepIndex++,
        agent: res.agent || `${domain}Worker`,
        role: res.role || `${domain} Telemetry Collection`,
        action: res.success 
          ? `Successfully retrieved ${domain} telemetry from provider` 
          : `Fallback active for ${domain}: ${res.error}`,
        status: res.success ? 'COMPLETED' : 'DEGRADED',
        durationMs: res.durationMs || 0,
        timestamp: res.timestamp || new Date().toISOString()
      });
    }

    // 4. Evidence Aggregation & Normalization
    let aggRes = await this.aggregatorAgent.run({ workerResults });
    trace.push({
      step: workerStepIndex++,
      agent: aggRes.agent,
      role: aggRes.role,
      action: `Aggregated evidence from ${aggRes.output.totalEvidencePoints} worker points into standardized evaluation schema`,
      status: aggRes.success ? 'COMPLETED' : 'FAILED',
      durationMs: aggRes.durationMs,
      timestamp: aggRes.timestamp
    });

    // 4b. Observe-Act-Observe loop: the model reviews what it actually
    // gathered (not just what it planned to gather) and can request genuinely
    // new tools if it spots a real gap. Skipped for lightweight intents to
    // control latency/token cost, and capped at one extra round-trip so this
    // can never loop indefinitely.
    if (!intentRes.output.isLightweight) {
      const alreadyFetched = Object.fromEntries(
        Object.entries(workerResults).map(([domain, res]) => [domain, res.success ? 'success' : 'degraded'])
      );

      const reviewRes = await this.evidenceReviewAgent.run({
        message,
        intentResult: intentRes.output,
        alreadyFetched
      });

      trace.push({
        step: workerStepIndex++,
        agent: reviewRes.agent,
        role: reviewRes.role,
        action: reviewRes.output.sufficient
          ? `Reviewed gathered evidence — sufficient to proceed (${reviewRes.output.method})`
          : `Reviewed gathered evidence — gap found, fetching additional tools [${reviewRes.output.additionalTools.join(', ')}] (${reviewRes.output.method}): ${reviewRes.output.reason}`,
        status: reviewRes.success ? 'COMPLETED' : 'FAILED',
        durationMs: reviewRes.durationMs,
        timestamp: reviewRes.timestamp
      });

      if (!reviewRes.output.sufficient && reviewRes.output.additionalTools.length > 0) {
        const additionalTasks = reviewRes.output.additionalTools.map(async (domain) => {
          const worker = this.workers[domain];
          if (!worker) return [domain, { success: false, error: `Worker ${domain} not found` }];
          const res = await worker.run({ location: targetLocation });
          return [domain, res];
        });

        const additionalEntries = await Promise.all(additionalTasks);
        for (const [domain, res] of additionalEntries) {
          workerResults[domain] = res;
          trace.push({
            step: workerStepIndex++,
            agent: res.agent || `${domain}Worker`,
            role: res.role || `${domain} Telemetry Collection`,
            action: res.success
              ? `(Loop 2) Successfully retrieved ${domain} telemetry from provider`
              : `(Loop 2) Fallback active for ${domain}: ${res.error}`,
            status: res.success ? 'COMPLETED' : 'DEGRADED',
            durationMs: res.durationMs || 0,
            timestamp: res.timestamp || new Date().toISOString()
          });
        }

        // Re-aggregate with the combined worker results
        aggRes = await this.aggregatorAgent.run({ workerResults });
        trace.push({
          step: workerStepIndex++,
          agent: aggRes.agent,
          role: aggRes.role,
          action: `Re-aggregated evidence after Loop 2 (${aggRes.output.totalEvidencePoints} total points)`,
          status: aggRes.success ? 'COMPLETED' : 'FAILED',
          durationMs: aggRes.durationMs,
          timestamp: aggRes.timestamp
        });
      }
    }

    // 5. Deterministic Risk Assessment Rule Evaluation
    const riskAssessment = RiskAssessmentEngine.evaluate({
      weather: aggRes.output.evidence.weather || {},
      ocean: aggRes.output.evidence.ocean || {},
      advisory: aggRes.output.evidence.advisory || {},
      geospatial: aggRes.output.evidence.geofence || {},
      vesselProfile: vesselProfile || {}
    });

    trace.push({
      step: workerStepIndex++,
      agent: 'RiskAssessmentEngine',
      role: 'Deterministic Marine Safety Threshold Evaluator',
      action: `Evaluated deterministic safety rules: Score ${riskAssessment.riskScore}/100 [${riskAssessment.riskLevel} RISK]`,
      status: 'COMPLETED',
      durationMs: 4,
      timestamp: new Date().toISOString(),
      data: riskAssessment
    });

    // 6. Multilingual Explainable Narrative Synthesis (LLM-based, template fallback)
    const expRes = await this.explainerAgent.run({
      intentResult: intentRes.output,
      aggregatedEvidence: aggRes.output,
      riskAssessment: {
        level: riskAssessment.riskLevel,
        score: riskAssessment.riskScore,
        factors: riskAssessment.primaryFactors
      },
      originalMessage: message,
      history
    });

    trace.push({
      step: workerStepIndex++,
      agent: expRes.agent,
      role: expRes.role,
      action: `Synthesized explainable response in [${intentRes.output.detectedLanguage.toUpperCase()}] (Method: ${expRes.output.synthesisMethod || 'LLM_GROQ'}) with citations and disclaimers`,
      status: expRes.success ? 'COMPLETED' : 'FAILED',
      durationMs: expRes.durationMs,
      timestamp: expRes.timestamp
    });

    const totalDurationMs = Date.now() - overallStartTime;

    const finalResult = {
      success: true,
      conversationId: activeConversationId,
      intent: intentRes.output.primaryIntent,
      language: intentRes.output.detectedLanguage,
      sector: intentRes.output.targetSector,
      riskAssessment,
      evidence: aggRes.output.evidence,
      plan: planRes.output,
      text: expRes.output.text,
      citations: expRes.output.citations,
      explainabilityPackage: expRes.output.explainabilityPackage,
      trace,
      totalExecutionTimeMs: totalDurationMs,
      timestamp: new Date().toISOString()
    };

    // Save this turn to memory (fire-and-forget safe — never throws)
    MemoryService.appendMessage(activeConversationId, 'user', message).catch(() => {});
    MemoryService.appendMessage(activeConversationId, 'assistant', expRes.output.text).catch(() => {});

    // Phase 14: Record in Persistent Trace Audit Registry
    try {
      TraceService.recordTrace({
        message,
        sector: intentRes.output.targetSector,
        language: intentRes.output.detectedLanguage,
        vesselProfile,
        totalExecutionTimeMs: totalDurationMs,
        success: true,
        riskAssessment,
        trace,
        plan: planRes.output,
        evidence: aggRes.output.evidence
      });
    } catch (err) {
      console.error('Failed to log trace record:', err);
    }

    return finalResult;
  }
}

const orchestrator = new AgentOrchestrator();

module.exports = {
  orchestrator,
  AgentOrchestrator
};
