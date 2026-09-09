const { orchestrator } = require('../agents');

const executeAgentPipeline = async (req, res, next) => {
  try {
    const { query, sector, vesselProfile } = req.body;
    const result = await orchestrator.processQuery({
      message: query || 'Is it safe to go fishing tomorrow near Mumbai?',
      location: { sectorName: sector || 'Mumbai Coast' },
      vesselProfile
    });
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getAgentArchitecture = (req, res) => {
  return res.status(200).json({
    success: true,
    architecture: {
      framework: 'Autonomous Multi-Agent Task Decomposition Pipeline',
      pipeline: [
        { name: 'IntentAgent', type: 'Classifier', role: 'Deconstructs user queries & extracts entities' },
        { name: 'PlannerAgent', type: 'Scheduler', role: 'Constructs dynamic DAG execution plan for parallel workers' },
        { name: 'WeatherWorker', type: 'Worker', role: 'Gathers Open-Meteo & IMD NWP meteorological feeds' },
        { name: 'OceanWorker', type: 'Worker', role: 'Gathers ECMWF/Copernicus & INCOIS wave state & SST feeds' },
        { name: 'PFZWorker', type: 'Worker', role: 'Extracts satellite thermal gradient & chlorophyll bloom habitats' },
        { name: 'AdvisoryWorker', type: 'Worker', role: 'Retrieves high-wave & cyclone safety bulletins' },
        { name: 'GeofenceWorker', type: 'Worker', role: 'Audits distance to MPAs, territorial limits, & firing zones' },
        { name: 'AggregatorAgent', type: 'Aggregator', role: 'Normalizes multi-worker evidence into unified schema' },
        { name: 'RiskAssessmentEngine', type: 'Deterministic Engine', role: 'Computes objective safety score (0-100)' },
        { name: 'ExplainerAgent', type: 'Synthesizer', role: 'Generates explainable guidance with citations and disclaimers' }
      ],
      goldenRule: 'AI Orchestrates -> Data Provides Evidence -> Rules Calculate Risk -> AI Explains Result'
    }
  });
};

module.exports = {
  executeAgentPipeline,
  getAgentArchitecture
};
