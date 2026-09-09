const IntentAgent = require('./IntentAgent');
const PlannerAgent = require('./PlannerAgent');
const WeatherWorker = require('./workers/WeatherWorker');
const OceanWorker = require('./workers/OceanWorker');
const PFZWorker = require('./workers/PFZWorker');
const AdvisoryWorker = require('./workers/AdvisoryWorker');
const GeofenceWorker = require('./workers/GeofenceWorker');
const AggregatorAgent = require('./AggregatorAgent');
const ExplainerAgent = require('./ExplainerAgent');
const { RiskAssessmentEngine } = require('../engine');
const TraceService = require('../services/trace.service');

class AgentOrchestrator {
  constructor() {
    this.intentAgent = new IntentAgent();
    this.plannerAgent = new PlannerAgent();
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

    // 1. Multilingual Intent Classification
    const intentRes = await this.intentAgent.run({ message, location, vesselProfile, language });
    trace.push({
      step: 1,
      agent: intentRes.agent,
      role: intentRes.role,
      action: `Classified query into intent "${intentRes.output.primaryIntent}" (Language: ${intentRes.output.detectedLanguage.toUpperCase()}) for sector "${intentRes.output.targetSector}"`,
      status: intentRes.success ? 'COMPLETED' : 'FAILED',
      durationMs: intentRes.durationMs,
      timestamp: intentRes.timestamp,
      data: intentRes.output
    });

    // 2. Planning DAG Scheduler
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
    const aggRes = await this.aggregatorAgent.run({ workerResults });
    trace.push({
      step: workerStepIndex++,
      agent: aggRes.agent,
      role: aggRes.role,
      action: `Aggregated evidence from ${aggRes.output.totalEvidencePoints} worker points into standardized evaluation schema`,
      status: aggRes.success ? 'COMPLETED' : 'FAILED',
      durationMs: aggRes.durationMs,
      timestamp: aggRes.timestamp
    });

    // 5. Deterministic Risk Assessment Rule Evaluation
    const riskAssessment = RiskAssessmentEngine.evaluate({
      weather: aggRes.output.evidence.weather || {},
      ocean: aggRes.output.evidence.ocean || {},
      advisory: aggRes.output.evidence.advisory || {},
      geospatial: aggRes.output.evidence.geospatial || {},
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

    // 6. Multilingual Explainable Narrative Synthesis
    const expRes = await this.explainerAgent.run({
      intentResult: intentRes.output,
      aggregatedEvidence: aggRes.output,
      riskAssessment: {
        level: riskAssessment.riskLevel,
        score: riskAssessment.riskScore,
        factors: riskAssessment.primaryFactors
      }
    });

    trace.push({
      step: workerStepIndex++,
      agent: expRes.agent,
      role: expRes.role,
      action: `Synthesized explainable response in [${intentRes.output.detectedLanguage.toUpperCase()}] with citations and disclaimers`,
      status: expRes.success ? 'COMPLETED' : 'FAILED',
      durationMs: expRes.durationMs,
      timestamp: expRes.timestamp
    });

    const totalDurationMs = Date.now() - overallStartTime;

    const finalResult = {
      success: true,
      conversationId: conversationId || `conv_${Date.now()}`,
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
