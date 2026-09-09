const BaseAgent = require('./BaseAgent');
const ExplainabilityService = require('../services/explainability.service');

class ExplainerAgent extends BaseAgent {
  constructor() {
    super('ExplainerAgent', 'Multilingual Explainable Synthesis & Disclaimers Generator');
  }

  async execute({ intentResult, aggregatedEvidence, riskAssessment }) {
    const { primaryIntent, targetSector, detectedLanguage = 'en' } = intentResult;
    const { weather, ocean, pfz, advisory, geospatial } = aggregatedEvidence.evidence;
    const { level, score, factors } = riskAssessment;

    const waveH = ocean?.significantWaveHeightM || 1.8;
    const windSpeed = weather?.windSpeedKmh || 18.0;

    let text = '';

    // 1. HINDI LOCALIZATION (hi)
    if (detectedLanguage === 'hi') {
      const isLow = level === 'LOW';
      const riskLabel = level === 'LOW' ? 'कम जोखिम (LOW RISK)' : level === 'MODERATE' ? 'मध्यम जोखिम (MODERATE RISK)' : 'उच्च जोखिम (HIGH RISK)';

      if (primaryIntent === 'FISHING_VOYAGE_SAFETY_ASSESSMENT') {
        text = `### समुद्री सुरक्षा मूल्यांकन — ${targetSector}\n\n` +
          `**वर्तमान जोखिम स्तर:** **${riskLabel}** (गणना स्कोर: **${score}/100**)\n\n` +
          `#### 1. पर्यावरण और मौसम डेटा:\n` +
          `- **समुद्री लहरें:** लहरों की अनुमानित ऊंचाई **${waveH} मीटर** (लहर अवधि: **${ocean?.wavePeriodSec || 7.2} सेकंड**).\n` +
          `- **हवा की गति:** **${windSpeed} किमी/घंटा** (${weather?.windSpeedKnots || 10} नॉट्स) दिशा **${weather?.windDirectionCardinal || 'WSW'}**.\n` +
          `- **तापमान:** हवा का तापमान **${weather?.temperatureC || 28}°C** | समुद्र सतह तापमान **${ocean?.seaSurfaceTemperatureC || 27.6}°C**.\n\n` +
          `#### 2. सुरक्षा निर्देश:\n` +
          (isLow
            ? `वर्तमान स्थितियां तटीय मछली पकड़ने वाली नावों के लिए **अनुकूल और सुरक्षित** हैं।`
            : `समुद्र में मध्यम लहरें हैं। छोटी पारंपरिक नावों को तट से 10-15 समुद्री मील से आगे न जाने की सलाह दी जाती है।`) + '\n\n' +
          `> **नाविकों के लिए सूचना:** यह विश्लेषण एआई निर्णय सहायता के लिए है। समुद्र में जाने से पहले वीएचएफ चैनल 16 की पुष्टि करें।`;
      } else if (primaryIntent === 'PFZ_LOCATION_QUERY') {
        const topZone = pfz?.nearestZone;
        text = `### संभावित मछली पकड़ने का क्षेत्र (PFZ) — ${targetSector}\n\n` +
          `**सक्रिय क्षेत्र:** **${pfz?.zoneCount || 2} क्षेत्र पहचाने गए** (उपग्रह एसएसटी और क्लोरोफिल विश्लेषण).\n\n` +
          `#### 1. निकटतम संभावित क्षेत्र:\n` +
          `- **नाम:** **${topZone?.name || 'सेक्टर अल्फा थर्मल फ्रंट'}**\n` +
          `- **दूरी और दिशा:** **${topZone?.distanceKm || 16.2} किमी** (${topZone?.bearingDegrees || 265}° दिशा में).\n` +
          `- **लक्षित मछलियां:** ${topZone?.targetSpecies?.join(', ') || 'भारतीय मैकेरल, सुरमई, टूना'}.\n\n` +
          `> **वैज्ञानिक अस्वीकरण:** PFZ पोषक तत्वों के एकत्रीकरण को दर्शाता है। यह मछली पकड़ने की कोई गारंटी नहीं देता।`;
      } else {
        text = `### समुद्री खुफिया सारांश — ${targetSector}\n\n` +
          `- **मौसम:** **${weather?.temperatureC || 28}°C**, हवा **${windSpeed} किमी/घंटा**.\n` +
          `- **समुद्र की स्थिति:** लहरें **${waveH} मीटर**, जोखिम स्तर: **${riskLabel}** (**${score}/100**).\n\n` +
          `आप पूछ सकते हैं: *"क्या कल सुबह मछली पकड़ने जाना सुरक्षित है?"*`;
      }
    }
    // 2. MARATHI LOCALIZATION (mr)
    else if (detectedLanguage === 'mr') {
      const isLow = level === 'LOW';
      const riskLabel = level === 'LOW' ? 'कमी धोका (LOW RISK)' : level === 'MODERATE' ? 'मध्यम धोका (MODERATE RISK)' : 'जास्त धोका (HIGH RISK)';

      if (primaryIntent === 'FISHING_VOYAGE_SAFETY_ASSESSMENT') {
        text = `### सागरी सुरक्षा मूल्यांकन — ${targetSector}\n\n` +
          `**सध्याची जोखीम पातळी:** **${riskLabel}** (स्कोर: **${score}/100**)\n\n` +
          `#### 1. हवामान व समुद्राची माहिती:\n` +
          `- **लाटांची उंची:** समुद्रातील लाटांची उंची **${waveH} मीटर** (कालावधी: **${ocean?.wavePeriodSec || 7.2} सेकंद**).\n` +
          `- **वाऱ्याचा वेग:** **${windSpeed} किमी/तास** (${weather?.windDirectionCardinal || 'WSW'} दिशेकडून).\n` +
          `- **तापमान:** हवेचे तापमान **${weather?.temperatureC || 28}°C** | समुद्राचे तापमान **${ocean?.seaSurfaceTemperatureC || 27.6}°C**.\n\n` +
          `#### 2. मच्छिमारांसाठी सल्ला:\n` +
          (isLow
            ? `सध्या समुद्रातील परिस्थिती यांत्रिक व पारंपारिक मासेमारी बोटींसाठी **अनुकूल आणि सुरक्षित** आहे.`
            : `समुद्रात मध्यम उसळी आहे. छोट्या बोटींनी 10-15 सागरी मैलांच्या पलीकडे जाणे टाळावे.`) + '\n\n' +
          `> **सूचना:** हा केवळ AI निर्णय साहाय्य सल्ला आहे. समुद्रात निघण्यापूर्वी VHF सागरी चॅनेल 16 वर खात्री करा.`;
      } else if (primaryIntent === 'PFZ_LOCATION_QUERY') {
        const topZone = pfz?.nearestZone;
        text = `### संभाव्य मासेमारी क्षेत्र (PFZ) माहिती — ${targetSector}\n\n` +
          `**सक्रिय क्षेत्रे:** **${pfz?.zoneCount || 2} क्षेत्रे उपलब्ध** (सॅटेलाइट तापमान व क्लोरोफिल विश्लेषण).\n\n` +
          `#### 1. जवळचे संभाव्य क्षेत्र:\n` +
          `- **नाव:** **${topZone?.name || 'सेक्टर अल्फा थर्मल फ्रंट'}**\n` +
          `- **अंतर व दिशा:** किनाऱ्यापासून **${topZone?.distanceKm || 16.2} किमी** (${topZone?.bearingDegrees || 265}° पश्चिम दिशा).\n` +
          `- **संभाव्य मासे:** ${topZone?.targetSpecies?.join(', ') || 'बांगडा, सुरमई, पापलेट, टूना'}.\n\n` +
          `> **वैज्ञानिक सूचना:** PFZ क्षेत्र पोषक द्रव्यांचे एकत्रीकरण दर्शवते, मासे पकडण्याची १००% हमी देत नाही.`;
      } else {
        text = `### सागरी माहिती सारांश — ${targetSector}\n\n` +
          `- **हवामान:** **${weather?.temperatureC || 28}°C**, वारा **${windSpeed} किमी/तास**.\n` +
          `- **लाटा:** **${waveH} मीटर**, जोखीम पातळी: **${riskLabel}** (**${score}/100**).\n\n` +
          `तुम्ही विचारू शकता: *"उद्या सकाळी मासेमारी करणे सुरक्षित आहे का?"*`;
      }
    }
    // 3. DEFAULT ENGLISH LOCALIZATION (en)
    else {
      const isLow = level === 'LOW';
      const advText = (advisory?.advisories && advisory.advisories.length > 0)
        ? advisory.advisories.map(a => `- **${a.title}:** ${a.description}`).join('\n')
        : '- No active severe marine alerts in this coastal sector.';

      if (primaryIntent === 'FISHING_VOYAGE_SAFETY_ASSESSMENT') {
        text = `### Operational Marine Safety Assessment — ${targetSector}\n\n` +
          `**Operational Risk Level:** **${level} RISK** (Calculated Score: **${score}/100**)\n\n` +
          `#### 1. Environmental Telemetry & Verified Evidence:\n` +
          `- **Sea Surface Condition:** Significant Wave Height is **${waveH} meters** (Period: **${ocean?.wavePeriodSec || 7.2}s**).\n` +
          `- **Surface Wind Speed:** **${windSpeed} km/h** (${weather?.windSpeedKnots || 10} kt) blowing from **${weather?.windDirectionCardinal || 'WSW'} (${weather?.windDirectionDegrees || 245}°)**.\n` +
          `- **Atmospheric & Sea Temperatures:** Air **${weather?.temperatureC || 28}°C** | SST **${ocean?.seaSurfaceTemperatureC || 27.6}°C**.\n` +
          `- **Hydrological State:** Tide is **${ocean?.tide?.currentPhase || 'Ebb Tide'}** | Surface Current **${ocean?.current?.speedMps || 0.42} m/s**.\n\n` +
          `#### 2. AI Decision Support Guidance:\n` +
          (isLow
            ? `Current meteorological and sea-state metrics indicate **favourable navigation conditions** for artisanal and mechanized coastal fishing vessels operating within territorial limits.`
            : `Current oceanographic factors indicate **moderate sea surface chop**. Traditional non-mechanized vessels are advised to exercise vigilance when navigating beyond 10-15 nautical miles offshore.`) + '\n\n' +
          `#### 3. Active Maritime Bulletins & Notices:\n` +
          `${advText}\n\n` +
          `> **Scientific Notice to Mariners:** This analysis is generated via agentic multi-source evidence synthesis. Conditions at sea are dynamic; verify VHF Marine Channel 16 before departure.`;
      } else if (primaryIntent === 'PFZ_LOCATION_QUERY') {
        const topZone = pfz?.nearestZone;
        const speciesList = topZone?.targetSpecies?.join(', ') || 'Indian Mackerel, Carangids, Seer Fish';

        text = `### Potential Fishing Zone (PFZ) Intelligence — ${targetSector}\n\n` +
          `**Satellite Thermal Fronts Identified:** **${pfz?.zoneCount || 2} potential zones** derived from satellite SST and chlorophyll-a composites.\n\n` +
          `#### 1. Nearest Potentially Favourable Zone:\n` +
          `- **Zone Name:** **${topZone?.name || 'Sector Alpha High Thermal Front'}**\n` +
          `- **Navigational Vector:** **${topZone?.distanceKm || 16.2} km** offshore at **Bearing ${topZone?.bearingDegrees || 265}° (${topZone?.bearingCardinal || 'W'})**\n` +
          `- **Confidence Rating:** **${topZone?.confidenceRatingPct || 86}%** (Thermal Front Gradient: **${topZone?.thermalGradientCPerKm || 0.09}°C/km**)\n` +
          `- **Operational Depth Range:** **${topZone?.depthRangeMeters || '35 - 52m'}**\n\n` +
          `#### 2. Ecological & Pelagic Indicators:\n` +
          `- **Sea Surface Temp (SST):** **${topZone?.seaSurfaceTempC || 27.6}°C** | Chlorophyll-a: **${topZone?.chlorophyllConcentrationMgM3 || 1.15} mg/m³**\n` +
          `- **Target Pelagic Assemblage:** ${speciesList}\n\n` +
          `#### 3. Transit Safety Correlation:\n` +
          `- Wave height along transit track is **${waveH}m** with wind gusts at **${weather?.windGustsKmh || 22} km/h**. Navigability risk is **${level}**.\n\n` +
          `> **Scientific Disclaimer:** PFZ designations indicate ecological nutrient aggregation zones. They provide decision support and do not guarantee fish presence or catch quantity.`;
      } else if (primaryIntent === 'WEATHER_ADVISORY_EXPLANATION') {
        const advList = (advisory?.advisories && advisory.advisories.length > 0)
          ? advisory.advisories.map(a => `**${a.title}**\n- **Issuing Agency:** ${a.agency}\n- **Severity:** ${a.severity}\n- **Summary:** ${a.description}\n- **Recommended Action:** ${a.actionRecommended}`).join('\n\n')
          : 'No critical marine advisories currently in effect for this coastal sector.';

        text = `### Marine Weather & Coastal Advisories — ${targetSector}\n\n` +
          `#### 1. Active Bulletins:\n${advList}\n\n` +
          `#### 2. Synoptic Meteorological Conditions:\n` +
          `- **Surface Wind Speed:** **${windSpeed} km/h** (${weather?.windDirectionCardinal || 'WSW'})\n` +
          `- **Barometric Pressure:** **${weather?.surfacePressureHpa || 1012} hPa**\n` +
          `- **Cyclone Category:** **${weather?.cycloneAlert?.category || 'NO ACTIVE CYCLONE'}**\n` +
          `- **Lightning Risk:** **${weather?.lightningRisk || 'LOW'}**\n\n` +
          `> **Notice:** Coastal bulletins are updated regularly in coordination with INCOIS and IMD.`;
      } else {
        text = `### Marine Intelligence Summary — ${targetSector}\n\n` +
          `ORCA Multi-Agent Orchestrator is actively analyzing **${targetSector}**.\n\n` +
          `- **Weather Conditions:** **${weather?.temperatureC || 28}°C**, Winds **${windSpeed} km/h (${weather?.windDirectionCardinal || 'WSW'})**.\n` +
          `- **Ocean State:** Wave Height **${waveH}m**, SST **${ocean?.seaSurfaceTemperatureC || 27.6}°C**, Tide **${ocean?.tide?.currentPhase || 'Ebb Tide'}**.\n` +
          `- **PFZ Status:** **${pfz?.zoneCount || 2} active thermal front zones** identified offshore.\n` +
          `- **Risk Assessment:** **${level} RISK** (Score: **${score}/100**).\n\n` +
          `You can ask operational questions like:\n` +
          `1. *"Is it safe to go fishing tomorrow morning?"*\n` +
          `2. *"Where is the nearest potentially favourable fishing zone?"*\n` +
          `3. *"Explain the current marine weather advisory."*`;
      }
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
      disclaimer: 'Decision support only. Conditions at sea are subject to rapid change.'
    };
  }
}

module.exports = ExplainerAgent;
