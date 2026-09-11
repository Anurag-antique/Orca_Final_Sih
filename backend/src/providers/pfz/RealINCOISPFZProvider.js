const BaseProvider = require('../base/BaseProvider');

const SOURCE_URL = 'https://www.incois.gov.in/geoserver/PFZ_Automation/ows';
const WEBGIS_URL = 'https://www.incois.gov.in/MarineFisheries/PfzWebGis';
const SECTOR_STATES = {
  'Mumbai Coast': ['MAHARASHTRA', 'GOA', 'KARNATAKA'],
  'Kochi Harbor': ['KERALA'],
  'Chennai Offshore': ['SOUTH TAMILNADU', 'NORTH TAMILNADU'],
  Visakhapatnam: ['ANDHRA PRADESH', 'ODISHA'],
  Porbandar: ['GUJARAT']
};

const dayOfYear = date => {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86400000);
};

class RealINCOISPFZProvider extends BaseProvider {
  constructor() {
    super('INCOIS-PFZ-WebGIS-WFS', 'POTENTIAL_FISHING_ZONE', '1.0.0', false);
  }

  async getPFZs(location, date = new Date()) {
    const sector = location?.sectorName || 'all';
    const query = new URLSearchParams({
      service: 'WFS', version: '1.1.0', request: 'GetFeature',
      typeName: 'PFZ_Automation:pfzlines', outputFormat: 'application/json'
    });
    let response;
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await fetch(`${SOURCE_URL}?${query}`, {
          headers: { Accept: 'application/json', 'User-Agent': 'ORCA-Marine-Map/1.0' },
          signal: AbortSignal.timeout(15000)
        });
        if (response.ok) break;
        lastError = new Error(`INCOIS PFZ WFS returned HTTP ${response.status}`);
        // Retry on 403 (transient WAF/rate-limit) and 5xx (server errors)
        if (response.status !== 403 && response.status < 500) break;
      } catch (error) {
        lastError = error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
    if (!response) throw lastError || new Error('INCOIS PFZ WFS request failed');
    if (!response.ok) throw new Error(`Request failed with status code ${response.status}`);
    const geojson = await response.json();
    if (geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
      throw new Error('INCOIS PFZ WFS returned an invalid FeatureCollection');
    }

    const states = SECTOR_STATES[sector];
    const features = geojson.features.filter(feature => !states || states.includes(String(feature.properties?.State_Name || '').toUpperCase()));
    const timestamps = features.map(feature => {
      const p = feature.properties || {};
      return p.Year && p.Julian_day ? `${p.Year}-${String(p.Julian_day).padStart(3, '0')}` : null;
    }).filter(Boolean);
    const current = new Date(date);
    const currentStamp = `${current.getUTCFullYear()}-${String(dayOfYear(current)).padStart(3, '0')}`;
    const dates = [...new Set(timestamps)];
    const sourceDate = dates[0] || null;
    // INCOIS publishes on IST (UTC+5:30). Between midnight IST and 05:30 IST,
    // the advisory date is one day ahead of UTC. Accept ±1 day to cover this.
    const yesterday = new Date(current.getTime() - 86400000);
    const yesterdayStamp = `${yesterday.getUTCFullYear()}-${String(dayOfYear(yesterday)).padStart(3, '0')}`;
    const tomorrow = new Date(current.getTime() + 86400000);
    const tomorrowStamp = `${tomorrow.getUTCFullYear()}-${String(dayOfYear(tomorrow)).padStart(3, '0')}`;
    if (!sourceDate || dates.length !== 1 || (sourceDate !== currentStamp && sourceDate !== yesterdayStamp && sourceDate !== tomorrowStamp) || timestamps.length !== features.length) {
      throw new Error(`INCOIS PFZ data is dated ${dates.join(', ') || 'unknown'}; current UTC day is ${currentStamp}`);
    }

    const zones = features.map(feature => {
      const p = feature.properties || {};
      return {
        id: feature.id,
        name: `INCOIS PFZ ${p.State_Name || ''} ${p.Sno || ''}`.trim(),
        state: p.State_Name,
        category: p.Category,
        year: p.Year,
        julianDay: p.Julian_day,
        advisoryId: p.UID,
        lengthKm: p.Length,
        geometry: feature.geometry
      };
    });

    return this.standardizeResponse({
      queryLocation: { lat: Number(location?.lat), lon: Number(location?.lon) },
      sector,
      zoneCount: zones.length,
      nearestZone: zones[0] || null,
      zones,
      geojson: { ...geojson, features }
    }, {
      dataset: 'INCOIS Potential Fishing Zone Advisory WebGIS',
      origin: SOURCE_URL,
      webgis: WEBGIS_URL,
      updateFrequency: 'Daily official advisory',
      advisoryDate: sourceDate,
      isLive: true
    });
  }
}

module.exports = RealINCOISPFZProvider;
