const BaseAgent = require('./BaseAgent');

class PlannerAgent extends BaseAgent {
  constructor() {
    super('PlannerAgent', 'Dynamic Multi-Agent Task Decomposition & DAG Scheduler');
  }

  async execute({ intentResult, location }) {
    const { primaryIntent, targetSector, requiredWorkers } = intentResult;

    const tasks = requiredWorkers.map((domain, index) => {
      let priority = 'MEDIUM';
      let description = '';

      if (domain === 'weather') {
        priority = 'CRITICAL';
        description = 'Fetch meteorological NWP forecasts (wind speed, gusts, direction, precipitation, cyclone tracking)';
      } else if (domain === 'ocean') {
        priority = 'CRITICAL';
        description = 'Fetch hydrodynamic ocean state (significant wave height, wave period, SST, tidal state, currents)';
      } else if (domain === 'pfz') {
        priority = 'HIGH';
        description = 'Query satellite thermal fronts and chlorophyll upwelling index for pelagic aggregation zones';
      } else if (domain === 'advisory') {
        priority = 'HIGH';
        description = 'Retrieve active INCOIS High Wave & IMD coastal safety bulletins';
      } else if (domain === 'geofence') {
        priority = 'HIGH';
        description = 'Inspect proximity to territorial boundaries (12 NM), EEZ limits, MPAs, and naval firing zones';
      }

      return {
        taskId: `task_${domain}_${Date.now()}_${index}`,
        domain,
        targetSector,
        priority,
        executionMode: 'PARALLEL_ASYNC',
        description
      };
    });

    const executionPlan = {
      planId: `plan_${Date.now()}`,
      intent: primaryIntent,
      sector: targetSector,
      dagSteps: [
        { phase: 1, name: 'Parallel Worker Data Collection', tasks: tasks.map(t => t.taskId) },
        { phase: 2, name: 'Evidence Aggregation & Normalization', dependsOn: ['phase_1'] },
        { phase: 3, name: 'Deterministic Risk Evaluation', dependsOn: ['phase_2'] },
        { phase: 4, name: 'Explainable Narrative Synthesis', dependsOn: ['phase_3'] }
      ],
      tasks
    };

    return executionPlan;
  }
}

module.exports = PlannerAgent;
