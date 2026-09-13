const BaseAgent = require('./BaseAgent');
const ExplainabilityService = require('../services/explainability.service');
const groqService = require('../services/groq.service');
const LessonsService = require('../services/lessons.service');

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
  ta: 'Tamil',
  ml: 'Malayalam',
  gu: 'Gujarati'
};

const CHITCHAT_SYSTEM_PROMPT = `You are ORCA, a friendly, respectful AI marine safety assistant for Indian coastal fishermen and vessel operators.
The user just sent a casual/greeting message (not a marine data question).
- If the user greeted or asked how to greet you (e.g. "ram ram bolu ki namaskar", "hello", "namaskar"), respond warmly and naturally to their greeting (e.g. in Marathi: "नमस्कार! राम राम म्हणा किंवा नमस्कार, दोन्ही चालेल!", in Hindi: "राम राम! नमस्ते! आप दोनों में से कुछ भी कह सकते हैं").
- If the user introduced themselves or shared their name (e.g. "me abc", "mazha naav abc"), greet and remember them warmly (e.g. "नमस्कार abc भावा!").
- Reply briefly (1-3 sentences) in the requested language, then mention you are ready to help with:
  * Fishing voyage safety (today/tomorrow)
  * Potential fishing zones (PFZ)
  * Weather, wave & wind advisories
  * Restricted / sanctuary zones
- Keep it natural, warm, and conversational — do not invent any weather/ocean numbers.`;

const WEATHER_ONLY_SYSTEM_PROMPT = `You are ORCA, a friendly marine safety assistant for Indian coastal fishermen. The user asked a factual question about current weather/sea conditions (e.g. "mosoom ka kya halchal?", "how is the weather?").
You will be given a JSON object with the user's query ("userQuery"), sector name, and live weather/ocean data (some fields may be null if unavailable).
Reply in the requested language, in 2-4 short sentences, conversationally — like a knowledgeable harbour master or friendly co-pilot.
Include the 2-4 most relevant figures (e.g. temperature, wind speed/direction, wave height) that are actually present in the JSON.
Do NOT invent numbers for null/missing fields — just skip them or say that specific figure isn't available.
Do NOT include risk scores, headings, bullet lists, citations, or safety disclaimers — just a short natural answer.`;

const NARRATIVE_SYSTEM_PROMPT = `You are ORCA, an experienced, trustworthy AI marine safety co-pilot for Indian coastal fishermen and vessel operators.
You will be given:
- "userQuery": the mariner's actual message.
- "intent": the classified query intent.
- "sector": the target coastal sector.
- "riskLevel" & "riskScore": the deterministically pre-computed safety evaluation (LOW, MODERATE, HIGH, or CRITICAL, score 0-100).
- "evidence": JSON containing live weather, ocean, pfz, advisory, and geospatial data.

CRITICAL INSTRUCTIONS FOR YOUR RESPONSE:
1. DIRECT CONVERSATIONAL ANSWER FIRST:
   - Start immediately by directly answering what the mariner asked in 1-2 friendly, clear sentences.
   - If they asked whether they should go out or not (e.g. "jau ki nako?", "can I go?"):
     Give an explicit operational verdict right away based on the riskLevel (e.g., in Marathi: "नमस्कार भावा! उद्या समुद्रात मध्यम जोखीम (MODERATE RISK) आहे, त्यामुळे खोल समुद्रात जाणे टाळा किंवा १५ नॉटिकल मैलांच्या आत राहून सावधगिरी बाळगा." or in Hindi: "नमस्ते! कल समुद्र में मध्यम जोखिम है, इसलिए...").
     If the mariner mentioned their name or addressed you (e.g. "bhava", "me abc"), address them respectfully and warmly.
   - If they asked specifically about PFZ / fish catch (e.g. "pfz ka kya scene?", "where are the fish?"):
     Directly describe the nearest Potential Fishing Zone first (name, distance, bearing, target fish species like mackerel/trevally) and whether conditions allow reaching it safely.
2. OPERATIONAL SUMMARY:
   - Include a concise section heading:
     * In Marathi: "### सागरी सुरक्षा मूल्यांकन — [Sector]"
     * In Hindi: "### समुद्री सुरक्षा मूल्यांकन — [Sector]"
     * In English: "### Marine Safety Assessment — [Sector]"
   - State the official risk level and score clearly (e.g., **जोखीम पातळी:** **MODERATE RISK (४६/१००)** in Marathi / Hindi). NEVER alter or fabricate these numbers.
3. FOCUSED LIVE EVIDENCE:
   - Mention only the 3-5 most important conditions that matter to their question (waves, wind speed & gusts, tide, or PFZ).
   - Do NOT dump a massive 15-item list of irrelevant or null readings. Be punchy and practical.
4. PRACTICAL OPERATIONAL ADVICE:
   - Give actionable advice tailored to coastal fishermen (e.g. boat limits, safe return times before evening swells).
   - End with the standard one-line safety note: "AI निर्णय साहाय्य सल्ला आहे; प्रस्थान करण्यापूर्वी VHF चॅनल 16 वर पुष्टी करा." (or Hindi/English equivalent).
5. COMPLETENESS & FLOW:
   - Ensure the answer is fully written, grammatically natural in the requested language, and NEVER cut off mid-sentence.`;

const SELF_CHECK_SYSTEM_PROMPT = `You are a fact-checking reviewer for ORCA, a marine safety assistant. You will be given the EXACT riskLevel and riskScore that must appear in a drafted response, the evidence JSON that was actually available, and the drafted text itself.

Check for exactly two error types, nothing else:
1. The risk level or score stated in the draft does not exactly match the given riskLevel/riskScore.
2. The draft states a specific numeric reading (temperature, wind speed, wave height, humidity, pressure, etc.) that does not appear anywhere in the evidence JSON — a fabricated number.

Do not flag stylistic choices, phrasing, tone, length, or recommendations — only these two factual error types.

Respond ONLY with a JSON object of this exact shape:
{
  "isValid": true or false,
  "issues": ["short description of each problem found, empty array if none"],
  "correctedText": "only present if isValid is false — the full corrected draft with ONLY the identified numeric/risk errors fixed, everything else preserved exactly as-is"
}`;

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
            userQuery: originalMessage || '',
            language: languageName,
            sector: targetSector,
            weather,
            ocean
          }),
          history,
          temperature: 0.3,
          maxTokens: 400
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
    const { weather, ocean, pfz, advisory, geofence: geospatial } = aggregatedEvidence.evidence;
    const { level, score } = riskAssessment;

    // Cross-session self-improvement: pull recent self-check corrections for
    // this intent so the model can avoid repeating a mistake it already made
    // in a past conversation. Retrieval-based, not model fine-tuning — no
    // training pipeline or dataset required.
    const recentLessons = await LessonsService.getRecentLessons(primaryIntent).catch(() => []);

    let text;
    let usedFallback = false;
    let selfCorrected = false;
    try {
      text = await groqService.chatText({
        system: NARRATIVE_SYSTEM_PROMPT + (recentLessons.length > 0
          ? `\n\nLessons from past mistakes on this exact intent — do not repeat these:\n- ${recentLessons.join('\n- ')}`
          : ''),
        user: JSON.stringify({
          userQuery: originalMessage || '',
          language: languageName,
          intent: primaryIntent,
          sector: targetSector,
          riskLevel: level,
          riskScore: score,
          evidence: { weather, ocean, pfz, advisory, geospatial }
        }),
        history,
        temperature: 0.3,
        maxTokens: 1200
      });
      if (!text) throw new Error('Empty response from LLM');

      // --- Self-correction pass: verify the draft's risk level/score and
      // numeric claims against ground truth before this ever reaches the user.
      try {
        const review = await groqService.chatJSON({
          system: SELF_CHECK_SYSTEM_PROMPT,
          user: JSON.stringify({
            riskLevel: level,
            riskScore: score,
            evidence: { weather, ocean, pfz, advisory, geospatial },
            draftText: text
          }),
          temperature: 0.1,
          maxTokens: 2000
        });

        if (review && review.isValid === false && review.correctedText) {
          console.warn(`[ExplainerAgent] Self-check found issues, applying correction: ${(review.issues || []).join('; ')}`);
          text = review.correctedText;
          selfCorrected = true;
          if (review.issues && review.issues.length > 0) {
            LessonsService.recordLesson(primaryIntent, review.issues.join('; ')).catch(() => {});
          }
        }
      } catch (reviewErr) {
        console.warn('[ExplainerAgent] Self-check pass failed (keeping original draft):', reviewErr.message);
      }
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
      synthesisMethod: usedFallback ? 'TEMPLATE_FALLBACK' : (selfCorrected ? 'LLM_GROQ_SELF_CORRECTED' : 'LLM_GROQ')
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
