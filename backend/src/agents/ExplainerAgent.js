const BaseAgent = require('./BaseAgent');
const ExplainabilityService = require('../services/explainability.service');
const groqService = require('../services/groq.service');

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
  ta: 'Tamil',
  ml: 'Malayalam',
  gu: 'Gujarati'
};

const CHITCHAT_SYSTEM_PROMPT = `You are ORCA, a friendly AI marine safety assistant for Indian coastal fishermen and vessel operators.
The user just sent a casual/greeting message (not a marine data question).
Reply warmly and briefly (1-3 sentences) in the requested language, then mention you can help with things like:
- whether it's safe to go fishing today/tomorrow
- nearby potential fishing zones (PFZ)
- current weather/wave advisories
- restricted/protected zone boundaries
Keep it short, natural, and conversational — do not invent any weather/ocean numbers.`;

const WEATHER_ONLY_SYSTEM_PROMPT = `You are ORCA, a marine assistant. The user asked a plain factual question about current weather/sea conditions — NOT a safety assessment.
You will be given a JSON object with sector name and live weather/ocean data (some fields may be null if unavailable).
Reply in the requested language, in 1-4 short sentences, conversationally — like answering a text message, not writing a report.
Include only the 2-4 most relevant figures (e.g. temperature, wind speed/direction, wave height) that are actually present in the JSON.
Do NOT invent numbers for null/missing fields — just skip them or say that specific figure isn't available.
Do NOT include risk scores, headings, bullet lists, citations, or safety disclaimers — just a short natural answer.`;

const NARRATIVE_SYSTEM_PROMPT = `You are ORCA, a marine safety intelligence assistant for Indian coastal fishermen and vessel operators.
You will be given: the user's intent, target sector, a JSON evidence object (weather, ocean, pfz, advisory, geospatial data — some fields may be missing/null), and a deterministically pre-computed risk assessment (level + score).

Write a clear, operational response in the requested language, in Markdown, following this general shape:
- A short heading naming the sector.
- The risk level and score (use EXACTLY the given level/score — never invent or change these numbers).
- The relevant evidence fields that are actually present in the JSON (do not invent numbers for fields that are null/missing — instead state that specific data point is unavailable).
- A short, practical safety/operational recommendation consistent with the given risk level.
- End with a one-line disclaimer that this is AI decision support and mariners should verify via VHF Channel 16 before departure.

Be concise (roughly 120-220 words). Never fabricate specific numeric readings that are not present in the evidence JSON.`;

class ExplainerAgent extends BaseAgent {
  constructor() {
    super('ExplainerAgent', 'Multilingual Explainable Synthesis & Disclaimers Generator (LLM-based, template fallback)');
  }

  async execute({ intentResult, aggregatedEvidence, riskAssessment, originalMessage, history = [] }) {
    const { primaryIntent, targetSector, detectedLanguage = 'en' } = intentResult;
    const languageName = LANGUAGE_NAMES[detectedLanguage] || 'English';

    // --- CHITCHAT: no evidence, no risk data, pure conversational reply ---
    if (primaryIntent === 'CHITCHAT') {
      let text;
      let usedFallback = false;
      try {
        text = await groqService.chatText({
          system: CHITCHAT_SYSTEM_PROMPT,
          user: `Reply in ${languageName}. User's message: "${originalMessage || ''}"`,
          history,
          temperature: 0.6,
          maxTokens: 200
        });
        if (!text) throw new Error('Empty response from LLM');
      } catch (err) {
        console.warn('[ExplainerAgent] Chitchat LLM call failed, using static fallback greeting:', err.message);
        text = "Hello! I'm ORCA, your marine safety assistant. Ask me things like \"Is it safe to go fishing tomorrow?\", \"Where is the nearest fishing zone?\", or \"Explain the current weather advisory.\"";
        usedFallback = true;
      }

      return {
        text,
        language: detectedLanguage,
        citations: [],
        explainabilityPackage: null,
        disclaimer: null,
        synthesisMethod: usedFallback ? 'TEMPLATE_FALLBACK' : 'LLM_GROQ'
      };
    }

    // --- WEATHER_DATA_QUERY: short, direct weather answer — no risk framework/citations ---
    if (primaryIntent === 'WEATHER_DATA_QUERY') {
      const { weather, ocean } = aggregatedEvidence.evidence;
      let text;
      let usedFallback = false;
      try {
        text = await groqService.chatText({
          system: WEATHER_ONLY_SYSTEM_PROMPT,
          user: JSON.stringify({
            language: languageName,
            sector: targetSector,
            weather,
            ocean
          }),
          history,
          temperature: 0.3,
          maxTokens: 200
        });
        if (!text) throw new Error('Empty response from LLM');
      } catch (err) {
        console.warn('[ExplainerAgent] Weather-only LLM call failed, using plain fallback:', err.message);
        text = weather
          ? `Current weather near ${targetSector}: ${weather.temperatureC ?? 'N/A'}°C, wind ${weather.windSpeedKmh ?? 'N/A'} km/h from ${weather.windDirectionCardinal ?? 'N/A'}. Wave height ${ocean?.significantWaveHeightM ?? 'N/A'}m.`
          : `Sorry, I couldn't fetch live weather data right now — please try again shortly.`;
        usedFallback = true;
      }

      return {
        text,
        language: detectedLanguage,
        citations: [],
        explainabilityPackage: null,
        disclaimer: null,
        synthesisMethod: usedFallback ? 'TEMPLATE_FALLBACK' : 'LLM_GROQ'
      };
    }

    // --- MARINE INTENTS: try LLM narrative synthesis over real evidence, fallback to static templates ---
    const { weather, ocean, pfz, advisory, geospatial } = aggregatedEvidence.evidence;
    const { level, score } = riskAssessment;

    let text;
    let usedFallback = false;
    try {
      text = await groqService.chatText({
        system: NARRATIVE_SYSTEM_PROMPT,
        user: JSON.stringify({
          language: languageName,
          intent: primaryIntent,
          sector: targetSector,
          riskLevel: level,
          riskScore: score,
          evidence: { weather, ocean, pfz, advisory, geospatial }
        }),
        history,
        temperature: 0.3,
        maxTokens: 700
      });
      if (!text) throw new Error('Empty response from LLM');
    } catch (err) {
      console.warn('[ExplainerAgent] Narrative LLM call failed, falling back to static template:', err.message);
      text = this._legacyTemplate({ intentResult, weather, ocean, pfz, advisory, level, score });
      usedFallback = true;
    }

    const explainabilityPackage = ExplainabilityService.generatePackage({
      intent: primaryIntent,
      sectorName: targetSector,
      weather,
      ocean,
      pfz,
      advisory,
      geospatial,
      riskAssessment
    });

    return {
      text,
      language: detectedLanguage,
      citations: explainabilityPackage.citations,
      explainabilityPackage,
      disclaimer: 'Decision support only. Conditions at sea are subject to rapid change.',
      synthesisMethod: usedFallback ? 'TEMPLATE_FALLBACK' : 'LLM_GROQ'
    };
  }

  /**
   * Original hardcoded per-language templates, kept as a safety-net fallback
   * so the assistant still returns a full marine safety response if Groq is
   * unreachable or GROQ_API_KEY is missing.
   */
  _legacyTemplate({ intentResult, weather, ocean, pfz, advisory, level, score }) {
    const { primaryIntent, targetSector, detectedLanguage = 'en' } = intentResult;
    const waveH = ocean?.significantWaveHeightM || 1.8;
    const windSpeed = weather?.windSpeedKmh || 18.0;

    if (detectedLanguage === 'hi') {
      const isLow = level === 'LOW';
      const riskLabel = level === 'LOW' ? 'कम जोखिम (LOW RISK)' : level === 'MODERATE' ? 'मध्यम जोखिम (MODERATE RISK)' : 'उच्च जोखिम (HIGH RISK)';
      return `### समुद्री सुरक्षा मूल्यांकन — ${targetSector}\n\n` +
        `**वर्तमान जोखिम स्तर:** **${riskLabel}** (गणना स्कोर: **${score}/100**)\n\n` +
        `- **समुद्री लहरें:** **${waveH} मीटर**\n` +
        `- **हवा की गति:** **${windSpeed} किमी/घंटा**\n\n` +
        (isLow
          ? 'वर्तमान स्थितियां तटीय मछली पकड़ने वाली नावों के लिए अनुकूल और सुरक्षित हैं।'
          : 'समुद्र में मध्यम लहरें हैं। सावधानी बरतें।') + '\n\n' +
        '> यह विश्लेषण एआई निर्णय सहायता के लिए है। समुद्र में जाने से पहले वीएचएफ चैनल 16 की पुष्टि करें।';
    }

    if (detectedLanguage === 'mr') {
      const isLow = level === 'LOW';
      const riskLabel = level === 'LOW' ? 'कमी धोका (LOW RISK)' : level === 'MODERATE' ? 'मध्यम धोका (MODERATE RISK)' : 'जास्त धोका (HIGH RISK)';
      return `### सागरी सुरक्षा मूल्यांकन — ${targetSector}\n\n` +
        `**सध्याची जोखीम पातळी:** **${riskLabel}** (स्कोर: **${score}/100**)\n\n` +
        `- **लाटांची उंची:** **${waveH} मीटर**\n` +
        `- **वाऱ्याचा वेग:** **${windSpeed} किमी/तास**\n\n` +
        (isLow
          ? 'सध्या समुद्रातील परिस्थिती अनुकूल आणि सुरक्षित आहे.'
          : 'समुद्रात मध्यम उसळी आहे. सावधगिरी बाळगा.') + '\n\n' +
        '> हा केवळ AI निर्णय साहाय्य सल्ला आहे. समुद्रात निघण्यापूर्वी VHF चॅनेल 16 वर खात्री करा.';
    }

    const isLow = level === 'LOW';
    const advText = (advisory?.advisories && advisory.advisories.length > 0)
      ? advisory.advisories.map(a => `- **${a.title}:** ${a.description}`).join('\n')
      : '- No active severe marine alerts in this coastal sector.';

    return `### Marine Safety Assessment — ${targetSector}\n\n` +
      `**Risk Level:** **${level} RISK** (Score: **${score}/100**)\n\n` +
      `- **Wave Height:** **${waveH}m**\n` +
      `- **Wind Speed:** **${windSpeed} km/h**\n\n` +
      `**Active Bulletins:**\n${advText}\n\n` +
      (isLow
        ? 'Current conditions are favourable for coastal fishing vessels.'
        : 'Sea conditions show moderate-to-elevated risk. Exercise caution.') + '\n\n' +
      `> AI decision support only. Verify VHF Marine Channel 16 before departure.\n\n` +
      (primaryIntent === 'PFZ_LOCATION_QUERY' && pfz?.nearestZone
        ? `**Nearest PFZ:** ${pfz.nearestZone.name || 'N/A'} — ${pfz.nearestZone.distanceKm || 'N/A'} km away.`
        : '');
  }
}

module.exports = ExplainerAgent;
