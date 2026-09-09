const BaseAgent = require('./BaseAgent');

class IntentAgent extends BaseAgent {
  constructor() {
    super('IntentAgent', 'Multilingual Intent Classification & Entity Extraction');
  }

  async execute({ message, location, vesselProfile, language = 'en' }) {
    const q = (message || '').toLowerCase();

    let primaryIntent = 'GENERAL_MARINE_QUERY';
    let confidence = 0.94;
    let detectedLanguage = language;
    const requiredWorkers = ['weather', 'ocean', 'advisory'];

    // Multilingual Term Dictionaries
    const isHindi = /[\u0900-\u097F]/.test(q);
    const isTamil = /[\u0B80-\u0BFF]/.test(q);
    const isMalayalam = /[\u0D00-\u0D7F]/.test(q);
    const isGujarati = /[\u0A80-\u0AFF]/.test(q);

    if (isHindi) {
      if (q.includes('आहे का') || q.includes('मासेमारी') || q.includes('लाटा') || q.includes('वारा') || q.includes('उद्या')) {
        detectedLanguage = 'mr';
      } else {
        detectedLanguage = 'hi';
      }
    } else if (isTamil) {
      detectedLanguage = 'ta';
    } else if (isMalayalam) {
      detectedLanguage = 'ml';
    } else if (isGujarati) {
      detectedLanguage = 'gu';
    }

    const safetyKeywords = [
      'safe', 'safety', 'tomorrow', 'sail', 'go out', 'can i',
      'सुरक्षित', 'सुरक्षा', 'जा सकते हैं', 'सुरक्षित आहे का', 'उद्या', 'பாதுகாப்பானதா', 'സുരക്ഷിതമാണോ', 'સલામત છે'
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
      'मछली क्षेत्र', 'मत्स्य क्षेत्र', 'मासेमारी क्षेत्र', 'मीன்பிடி மண்டலம்', 'മത്സ്യബന്ധന മേഖല', 'માછીમારી ક્ષેત્ર'
    ];

    // Priority Check: Safety > Advisory > Route > Geofence > PFZ
    if (safetyKeywords.some(kw => q.includes(kw))) {
      primaryIntent = 'FISHING_VOYAGE_SAFETY_ASSESSMENT';
      requiredWorkers.push('pfz', 'geofence');
    } else if (advisoryKeywords.some(kw => q.includes(kw))) {
      primaryIntent = 'WEATHER_ADVISORY_EXPLANATION';
      requiredWorkers.push('geofence');
    } else if (routeKeywords.some(kw => q.includes(kw))) {
      primaryIntent = 'LOWER_RISK_ROUTE_PLANNING';
      requiredWorkers.push('pfz', 'geofence');
    } else if (geofenceKeywords.some(kw => q.includes(kw))) {
      primaryIntent = 'GEOFENCE_ZONE_QUERY';
      requiredWorkers.push('geofence');
    } else if (pfzKeywords.some(kw => q.includes(kw)) || q.includes('मछली') || q.includes('मासे')) {
      primaryIntent = 'PFZ_LOCATION_QUERY';
      requiredWorkers.push('pfz', 'geofence');
    }

    // Extract Sector entities across languages
    let extractedSector = location?.sectorName || 'Mumbai Coast';
    if (q.includes('kochi') || q.includes('kerala') || q.includes('cochin') || q.includes('कोच्चि') || q.includes('केरल') || q.includes('கொச்சி')) {
      extractedSector = 'Kochi Harbor';
    } else if (q.includes('chennai') || q.includes('tamil nadu') || q.includes('चेन्नई') || q.includes('சென்னை')) {
      extractedSector = 'Chennai Offshore';
    } else if (q.includes('vizag') || q.includes('visakhapatnam') || q.includes('विशाखापट्टनम')) {
      extractedSector = 'Visakhapatnam';
    } else if (q.includes('porbandar') || q.includes('gujarat') || q.includes('पोरबंदर') || q.includes('પોરબંદર')) {
      extractedSector = 'Porbandar';
    } else if (q.includes('mumbai') || q.includes('bombay') || q.includes('मुंबई') || q.includes('बॉम्बे')) {
      extractedSector = 'Mumbai Coast';
    }

    return {
      primaryIntent,
      confidence,
      detectedLanguage,
      targetSector: extractedSector,
      temporalConstraint: (q.includes('tomorrow') || q.includes('कल') || q.includes('उद्या')) ? 'Next 24-48 Hours' : 'Current Timestamp',
      vesselProfile: vesselProfile || { type: 'Mechanized Coastal Fishery Craft', lengthM: 14.5 },
      requiredWorkers: Array.from(new Set(requiredWorkers))
    };
  }
}

module.exports = IntentAgent;
