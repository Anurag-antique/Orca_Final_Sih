const BaseAgent = require('./BaseAgent');
const groqService = require('../services/groq.service');
const { WORKERS_BY_INTENT } = require('./IntentAgent');

// Tool (function) definitions the model can autonomously choose to call.
// This is what makes worker selection agentic instead of a fixed lookup table:
// the LLM reads these descriptions and decides, per-query, which are relevant.
const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Fetch live meteorological data for the target coastal sector: temperature, wind speed, wind direction, pressure, gusts.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_ocean_conditions',
      description: 'Fetch live oceanographic/hydrodynamic data: significant wave height, wave period, sea surface temperature, tide state, currents.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_pfz_zones',
      description: 'Fetch Potential Fishing Zone (PFZ) locations, distances, and target species near the sector. Use only when the user is asking about where to fish or favourable fishing spots.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_marine_advisories',
      description: 'Fetch active marine advisories/warnings/bulletins for the sector: cyclone watches, high wave warnings, storm alerts, squall forecasts.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_geofence_zones',
      description: 'Fetch restricted/protected zone boundaries near the sector: marine protected areas (MPAs), naval exercise zones, international/EEZ boundaries, sanctuaries.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  }
];

const TOOL_NAME_TO_DOMAIN = {
  get_weather: 'weather',
  get_ocean_conditions: 'ocean',
  get_pfz_zones: 'pfz',
  get_marine_advisories: 'advisory',
  get_geofence_zones: 'geofence'
};

// Non-negotiable floor for real (non-chitchat) marine queries: weather, ocean,
// and advisory directly feed the deterministic RiskAssessmentEngine, so an
// under-selecting LLM call must never be allowed to skip them for a safety
// question. PFZ/geofence remain genuinely autonomous — the model adds them
// on top of this floor only when relevant.
const SAFETY_FLOOR_DOMAINS = ['weather', 'ocean', 'advisory'];
const NO_FLOOR_INTENTS = new Set(['CHITCHAT', 'WEATHER_DATA_QUERY']); // handled separately, lighter-weight by design

const SYSTEM_PROMPT = `You are the tool-selection module for ORCA, a marine safety assistant.
Given the user's message, decide which of the available tools need to be called to answer it accurately and safely.

Guidelines:
- Call every tool whose data is genuinely relevant — do not guess or estimate values yourself, only real tool calls provide real numbers.
- Weather and ocean conditions are almost always relevant to any marine safety question — call them unless the message is pure chitchat.
- Only call get_pfz_zones if the user is asking about fishing locations/zones.
- Only call get_marine_advisories if warnings/alerts/storms are relevant, or if you need bulletins to assess overall safety.
- Only call get_geofence_zones if boundaries/restricted areas/routes are relevant.
- If the message is casual conversation/greeting with no marine data need, call no tools at all.`;

class ToolSelectorAgent extends BaseAgent {
  constructor() {
    super('ToolSelectorAgent', 'Autonomous Tool Selection (LLM function-calling, intent-map fallback)');
  }

  async execute({ message, intentResult, history = [] }) {
    let selectedDomains;
    let usedFallback = false;

    try {
      const assistantMessage = await groqService.chatWithTools({
        system: SYSTEM_PROMPT,
        user: message || '',
        tools: TOOL_DEFINITIONS,
        history,
        temperature: 0.1,
        maxTokens: 300
      });

      const toolCalls = assistantMessage.tool_calls || [];
      selectedDomains = toolCalls
        .map(tc => TOOL_NAME_TO_DOMAIN[tc.function?.name])
        .filter(Boolean);

      // De-duplicate while preserving order
      selectedDomains = [...new Set(selectedDomains)];

      // Enforce the safety floor for real marine queries — the model can add
      // pfz/geofence autonomously, but can never drop weather/ocean/advisory
      // for a genuine safety-relevant question.
      if (!NO_FLOOR_INTENTS.has(intentResult.primaryIntent)) {
        const missingFloor = SAFETY_FLOOR_DOMAINS.filter(d => !selectedDomains.includes(d));
        if (missingFloor.length > 0) {
          console.warn(`[ToolSelectorAgent] LLM under-selected tools for intent "${intentResult.primaryIntent}" (missing: ${missingFloor.join(', ')}) — adding safety floor.`);
          selectedDomains = [...new Set([...selectedDomains, ...SAFETY_FLOOR_DOMAINS])];
        }
      }
    } catch (err) {
      console.warn('[ToolSelectorAgent] LLM tool selection failed, falling back to intent-based worker map:', err.message);
      selectedDomains = WORKERS_BY_INTENT[intentResult.primaryIntent] || ['weather', 'ocean', 'advisory'];
      usedFallback = true;
    }

    return {
      selectedTools: selectedDomains,
      selectionMethod: usedFallback ? 'INTENT_MAP_FALLBACK' : 'LLM_AUTONOMOUS_TOOL_CALLING'
    };
  }
}

module.exports = ToolSelectorAgent;
