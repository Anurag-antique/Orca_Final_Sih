const BaseAgent = require('./BaseAgent');
const groqService = require('../services/groq.service');

const VALID_INTENTS = [
  'CHITCHAT',
  'GENERAL_MARINE_QUERY',
  'WEATHER_DATA_QUERY',
  'FISHING_VOYAGE_SAFETY_ASSESSMENT',
  'WEATHER_ADVISORY_EXPLANATION',
  'LOWER_RISK_ROUTE_PLANNING',
  'GEOFENCE_ZONE_QUERY',
  'PFZ_LOCATION_QUERY'
];

const WORKERS_BY_INTENT = {
  CHITCHAT: [],
  GENERAL_MARINE_QUERY: ['weather', 'ocean', 'advisory'],
  WEATHER_DATA_QUERY: ['weather', 'ocean'],
  FISHING_VOYAGE_SAFETY_ASSESSMENT: ['weather', 'ocean', 'advisory', 'pfz', 'geofence'],
  WEATHER_ADVISORY_EXPLANATION: ['weather', 'ocean', 'advisory', 'geofence'],
  LOWER_RISK_ROUTE_PLANNING: ['weather', 'ocean', 'advisory', 'pfz', 'geofence'],
  GEOFENCE_ZONE_QUERY: ['weather', 'ocean', 'advisory', 'geofence'],
  PFZ_LOCATION_QUERY: ['weather', 'ocean', 'advisory', 'pfz', 'geofence']
};

// Intents that only want a short, direct answer — not the full risk/citations narrative
const LIGHTWEIGHT_INTENTS = new Set(['WEATHER_DATA_QUERY']);

const SYSTEM_PROMPT = `You are the intent classification and tool-selection module for ORCA, a marine safety assistant used by Indian coastal fishermen and vessel operators.

Classify the user's message into exactly one of these intents:
- "CHITCHAT": greetings, thanks, small talk, or anything not about marine conditions/safety (e.g. "hello", "hi", "namaskar", "thanks", "how are you", "what can you do").
- "WEATHER_DATA_QUERY": a plain factual request for current weather/wave data with no safety judgement needed (e.g. "how is today's weather", "what's the wind speed", "temperature today").
- "GENERAL_MARINE_QUERY": a general/vague marine question with no specific safety, advisory, route, geofence, or PFZ focus.
- "FISHING_VOYAGE_SAFETY_ASSESSMENT": asking if it's safe to go fishing/sail now or at a future time.
- "WEATHER_ADVISORY_EXPLANATION": asking about warnings, alerts, cyclones, storms, high waves.
- "LOWER_RISK_ROUTE_PLANNING": asking about routes, navigation paths, waypoints, voyage planning.
- "GEOFENCE_ZONE_QUERY": asking about restricted/protected zones, boundaries, sanctuaries, MPAs.
- "PFZ_LOCATION_QUERY": asking about Potential Fishing Zones, favourable fishing spots, target species like tuna/mackerel.

Also decide "requiredTools": an array of which live data sources are genuinely needed to answer this specific message, chosen from: "weather", "ocean", "pfz", "advisory", "geofence".
- Weather and ocean are almost always relevant to any real marine safety question — include them unless the message is pure chitchat.
- Include "advisory" whenever warnings/alerts/storms matter, or whenever you need bulletins to judge overall safety.
- Include "pfz" only if the user is asking about fishing locations/zones.
- Include "geofence" only if boundaries/restricted areas/routes are relevant.
- For CHITCHAT, requiredTools must be an empty array.

Also detect:
- "detectedLanguage": ISO 639-1 code ("en", "hi", "mr", "ta", "ml", "gu").
  * Distinguish Marathi ("mr") vs Hindi ("hi") carefully, especially for Romanized / Latin script:
    - Marathi markers: "tula", "mala", "bhava", "bhau", "udya", "ahe", "aahe", "ky scene", "kay scene", "jau", "nako", "mashe", "mazha", "mazhe", "bolu ki", "sang", "kasa".
    - Hindi markers: "kya", "batao", "mujhe", "kal", "kaise", "mausam", "machli".
  * LANGUAGE CONTINUITY: If a user has previously spoken in Marathi in conversation history or if the request language is 'mr', DO NOT switch to Hindi on ambiguous messages like "ram ram bolu ki namaskar tula?" (which is Marathi because of "tula").
- "targetSector": nearest named Indian coastal sector/harbor mentioned (e.g. "Mumbai Coast", "Kochi Harbor", "Chennai Offshore", "Visakhapatnam", "Porbandar"). Default to "Mumbai Coast" if none mentioned, unless conversation history establishes a different sector already in focus.
- "temporalConstraint": "Next 24-48 Hours" if the message refers to tomorrow/future ("tomorrow", "udya", "kal"), otherwise "Current Timestamp".

You may be given prior conversation turns for context — use them to correctly interpret follow-up messages (e.g. "what about tomorrow?", "on google it shows different", short clarifications) that only make sense given what was just discussed.

Respond ONLY with a JSON object of this exact shape:
{
  "primaryIntent": "<one of the intents above>",
  "confidence": <number 0-1>,
  "detectedLanguage": "<code>",
  "targetSector": "<sector name>",
  "temporalConstraint": "<Current Timestamp | Next 24-48 Hours>",
  "requiredTools": ["weather", "ocean", ...]
}`;

/**
 * Whole-word keyword match — avoids false positives like "hi" matching
 * inside "fishing", "this", "which", etc.
 */
function hasWord(text, word) {
  // Non-Latin scripts (Hindi/Marathi/Tamil/etc.) don't have \b word boundaries
  // that behave reliably in JS regex, so fall back to substring match for those.
  if (/[^\x00-\x7F]/.test(word)) {
    return text.includes(word);
  }
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

// Non-negotiable floor for real (non-chitchat) marine queries: weather, ocean,
// and advisory directly feed the deterministic RiskAssessmentEngine, so an
// under-selecting LLM call must never be allowed to skip them for a safety
// question. PFZ/geofence remain genuinely autonomous choices.
const SAFETY_FLOOR_DOMAINS = ['weather', 'ocean', 'advisory'];
const NO_FLOOR_INTENTS = new Set(['CHITCHAT', 'WEATHER_DATA_QUERY']);
const VALID_DOMAINS = new Set(['weather', 'ocean', 'pfz', 'advisory', 'geofence']);

class IntentAgent extends BaseAgent {
  constructor() {
    super('IntentAgent', 'Multilingual Intent Classification & Autonomous Tool Selection (single LLM call, rule-based fallback)');
  }

  async execute({ message, location, vesselProfile, language = 'en', history = [] }) {
    let parsed;
    let usedFallback = false;

    try {
      parsed = await groqService.chatJSON({
        system: SYSTEM_PROMPT,
        user: message || '',
        history,
        temperature: 0.1,
        maxTokens: 400
      });

      if (!VALID_INTENTS.includes(parsed.primaryIntent)) {
        throw new Error(`LLM returned invalid intent: ${parsed.primaryIntent}`);
      }
    } catch (err) {
      console.warn('[IntentAgent] LLM classification failed, falling back to rule-based logic:', err.message);
      parsed = this._legacyClassify({ message, location, language });
      usedFallback = true;
    }

    const primaryIntent = parsed.primaryIntent;

    // Resolve required tools: prefer the model's own selection from this same
    // call (genuinely autonomous, no extra round-trip); fall back to the
    // static intent->tools map only if the LLM call failed entirely.
    let requiredWorkers;
    let toolSelectionMethod;
    if (usedFallback) {
      requiredWorkers = WORKERS_BY_INTENT[primaryIntent] || ['weather', 'ocean', 'advisory'];
      toolSelectionMethod = 'INTENT_MAP_FALLBACK';
    } else {
      let selected = Array.isArray(parsed.requiredTools)
        ? [...new Set(parsed.requiredTools.filter(d => VALID_DOMAINS.has(d)))]
        : [];
      if (!NO_FLOOR_INTENTS.has(primaryIntent)) {
        const missingFloor = SAFETY_FLOOR_DOMAINS.filter(d => !selected.includes(d));
        if (missingFloor.length > 0) {
          console.warn(`[IntentAgent] LLM under-selected tools for intent "${primaryIntent}" (missing: ${missingFloor.join(', ')}) — adding safety floor.`);
          selected = [...new Set([...selected, ...SAFETY_FLOOR_DOMAINS])];
        }
      }
      requiredWorkers = selected.length > 0 ? selected : (WORKERS_BY_INTENT[primaryIntent] || ['weather', 'ocean', 'advisory']);
      toolSelectionMethod = 'LLM_AUTONOMOUS_TOOL_SELECTION';
    }

    let detectedLanguage = parsed.detectedLanguage || language || 'en';
    const qLower = (message || '').toLowerCase();
    const marathiClues = ['tula', 'bhava', 'bhau', 'udya', 'mashe', 'nako', 'jau', 'mazha', 'mazhe', 'aahe', 'ahe', 'bolu', 'बोलू', 'तुला', 'भावा', 'भाऊ', 'उद्या', 'मासे', 'नको', 'जाऊ'];
    if (detectedLanguage === 'hi' && marathiClues.some(clue => qLower.includes(clue))) {
      detectedLanguage = 'mr';
    }

    return {
      primaryIntent,
      confidence: parsed.confidence ?? (usedFallback ? 0.7 : 0.9),
      detectedLanguage,
      targetSector: parsed.targetSector || location?.sectorName || 'Mumbai Coast',
      temporalConstraint: parsed.temporalConstraint || 'Current Timestamp',
      vesselProfile: vesselProfile || { type: 'Mechanized Coastal Fishery Craft', lengthM: 14.5 },
      requiredWorkers,
      toolSelectionMethod,
      isLightweight: LIGHTWEIGHT_INTENTS.has(primaryIntent),
      classificationMethod: usedFallback ? 'RULE_BASED_FALLBACK' : 'LLM_GROQ'
    };
  }

  /**
   * Original keyword/regex based classifier, kept as a safety-net fallback
   * so the assistant still works if Groq is unreachable or GROQ_API_KEY is missing.
   * Uses whole-word matching for Latin-script keywords to avoid substring
   * false positives (e.g. "hi" no longer matches inside "fishing").
   */
  _legacyClassify({ message, location, language }) {
    const q = (message || '').toLowerCase();

    let primaryIntent = 'GENERAL_MARINE_QUERY';
    let detectedLanguage = language;

    const isDevanagari = /[\u0900-\u097F]/.test(q);
    const isTamil = /[\u0B80-\u0BFF]/.test(q);
    const isMalayalam = /[\u0D00-\u0D7F]/.test(q);
    const isGujarati = /[\u0A80-\u0AFF]/.test(q);

    const marathiDevanagari = ['आहे का', 'मासेमारी', 'मासे', 'लाटा', 'वारा', 'उद्या', 'तुला', 'भावा', 'भाऊ', 'नको', 'जाऊ', 'काय', 'सागरी'];
    const marathiRomanized = ['tula', 'bhava', 'bhau', 'udya', 'mashe', 'nako', 'jau', 'mazha', 'mazhe', 'aahe', 'ahe', 'bolu ki', 'ky scene', 'kay scene'];

    if (isDevanagari) {
      if (marathiDevanagari.some(w => q.includes(w)) || language === 'mr') {
        detectedLanguage = 'mr';
      } else {
        detectedLanguage = 'hi';
      }
    } else if (marathiRomanized.some(w => q.includes(w))) {
      detectedLanguage = 'mr';
    } else if (isTamil) {
      detectedLanguage = 'ta';
    } else if (isMalayalam) {
      detectedLanguage = 'ml';
    } else if (isGujarati) {
      detectedLanguage = 'gu';
    } else if (language && ['mr', 'hi', 'ta', 'ml', 'gu', 'en'].includes(language)) {
      detectedLanguage = language;
    }

    const chitchatKeywords = [
      'hello', 'hi', 'hey', 'thanks', 'thank you', 'how are you', 'good morning',
      'good evening', 'what can you do', 'who are you', 'namaskar', 'namaste',
      'नमस्कार', 'नमस्ते', 'धन्यवाद', 'வணக்கம்', 'നമസ്കാരം', 'નમસ્તે',
      'ram ram', 'राम राम', 'mazha naav', 'माझं नाव', 'माझे नाव', 'mera naam', 'my name'
    ];
    const weatherDataKeywords = [
      'weather', 'forecast', 'temperature', 'wind speed', 'how hot', 'how cold', 'rain',
      'मौसम', 'हवामान', 'तापमान', 'வானிலை', 'കാലാവസ്ഥ', 'હવામાન', 'mosoom'
    ];
    const safetyKeywords = [
      'safe', 'safety', 'tomorrow', 'sail', 'go out', 'can i',
      'सुरक्षित', 'सुरक्षा', 'जा सकते हैं', 'सुरक्षित आहे का', 'उद्या', 'பாதுகாப்பானதா', 'സുരക്ഷിതമാണോ', 'સલામત છે',
      'jau ki nako', 'ky scene', 'kay scene', 'जाऊ की नको'
    ];
    const advisoryKeywords = [
      'advisory', 'warning', 'alert', 'cyclone', 'high wave', 'storm',
      'चेतावनी', 'अलर्ट', 'तूफान', 'चक्रवात', 'इशारा', 'वादळ', 'எச்சரிக்கை', 'புயல்', 'മുന്നറിയിപ്പ്', 'ചുഴലിക്കാറ്റ്', 'ચેતવણી', 'વાવાઝોડું'
    ];
    const routeKeywords = [
      'route', 'navigate', 'path', 'waypoint', 'voyage',
      'मार्ग', 'रास्ता', 'दिशा', 'வழி', 'പാത', 'માર્ગ'
    ];
    const geofenceKeywords = [
      'protected', 'restricted', 'mpa', 'boundary', 'border', 'sanctuary',
      'प्रतिबंधित', 'सीमा', 'अभयारण्य', 'हद्द', 'பாதுகாக்கப்பட்ட', 'നിരോധിത', 'પ્રતિબંધિત'
    ];
    const pfzKeywords = [
      'pfz', 'favourable', 'nearest zone', 'fish catch', 'tuna', 'mackerel',
      'मछली क्षेत्र', 'मत्स्य क्षेत्र', 'मासेमारी क्षेत्र', 'மீன்பிடி மண்டலம்', 'മത്സ്യബന്ധന മേഖല', 'માછીમારી ક્ષેત્ર'
    ];

    // Priority: chitchat > safety > advisory > route > geofence > pfz > weather-data > general
    if (chitchatKeywords.some(kw => hasWord(q, kw))) {
      primaryIntent = 'CHITCHAT';
    } else if (safetyKeywords.some(kw => hasWord(q, kw))) {
      primaryIntent = 'FISHING_VOYAGE_SAFETY_ASSESSMENT';
    } else if (advisoryKeywords.some(kw => hasWord(q, kw))) {
      primaryIntent = 'WEATHER_ADVISORY_EXPLANATION';
    } else if (routeKeywords.some(kw => hasWord(q, kw))) {
      primaryIntent = 'LOWER_RISK_ROUTE_PLANNING';
    } else if (geofenceKeywords.some(kw => hasWord(q, kw))) {
      primaryIntent = 'GEOFENCE_ZONE_QUERY';
    } else if (pfzKeywords.some(kw => hasWord(q, kw)) || hasWord(q, 'मछली') || hasWord(q, 'मासे') || hasWord(q, 'fish')) {
      primaryIntent = 'PFZ_LOCATION_QUERY';
    } else if (weatherDataKeywords.some(kw => hasWord(q, kw))) {
      primaryIntent = 'WEATHER_DATA_QUERY';
    }

    let extractedSector = location?.sectorName || 'Mumbai Coast';
    if (hasWord(q, 'kochi') || hasWord(q, 'kerala') || hasWord(q, 'cochin') || q.includes('कोच्चि') || q.includes('केरल') || q.includes('கொச்சி')) {
      extractedSector = 'Kochi Harbor';
    } else if (hasWord(q, 'chennai') || hasWord(q, 'tamil nadu') || q.includes('चेन्नई') || q.includes('சென்னை')) {
      extractedSector = 'Chennai Offshore';
    } else if (hasWord(q, 'vizag') || hasWord(q, 'visakhapatnam') || q.includes('विशाखापट्टनम')) {
      extractedSector = 'Visakhapatnam';
    } else if (hasWord(q, 'porbandar') || hasWord(q, 'gujarat') || q.includes('पोरबंदर') || q.includes('પોરબંદર')) {
      extractedSector = 'Porbandar';
    } else if (hasWord(q, 'mumbai') || hasWord(q, 'bombay') || q.includes('मुंबई') || q.includes('बॉम्बे')) {
      extractedSector = 'Mumbai Coast';
    }

    return {
      primaryIntent,
      confidence: 0.7,
      detectedLanguage,
      targetSector: extractedSector,
      temporalConstraint: (hasWord(q, 'tomorrow') || q.includes('कल') || q.includes('उद्या') || hasWord(q, 'udya')) ? 'Next 24-48 Hours' : 'Current Timestamp'
    };
  }
}

module.exports = IntentAgent;
module.exports.WORKERS_BY_INTENT = WORKERS_BY_INTENT;
