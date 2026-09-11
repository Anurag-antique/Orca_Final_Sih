const BaseProvider = require('../base/BaseProvider');

const SOURCE_URL = 'https://www.incois.gov.in/geoserver/PFZ_Automation/ows';
const WEBGIS_URL = 'https://www.incois.gov.in/MarineFisheries/PfzWebGis';
const SECTOR_STATES = {
  'Mumbai Coast': ['MAHARASHTRA', 'GOA', 'KARNATAKA'],
  'Kochi Harbor': ['KERALA'],
  'Chennai Offshore': ['SOUTH TAMILNADU', 'NORTH TAMILNADU'],
  Visakhapatnam: ['SOUTH ANDHRAPRADESH', 'NORTH ANDHRAPRADESH', 'ANDHRA PRADESH', 'ODISHA'],
  Porbandar: ['GUJARAT']
};

const dayOfYear = date => Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86400000);
const stamp = date => `${date.getUTCFullYear()}-${String(dayOfYear(date)).padStart(3, '0')}`;

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
        if (response.status !== 403 && response.status < 500) break;
      } catch (error) {
        lastError = error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
    if (!response) throw lastError || new Error('INCOIS PFZ WFS request failed');
    if (!response.ok) throw lastError || new Error(`INCOIS PFZ WFS returned HTTP ${response.status}`);
    const geojson = await response.json();
    if (geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) throw new Error('INCOIS PFZ WFS returned an invalid FeatureCollection');

    const states = SECTOR_STATES[sector];
    const features = geojson.features.filter(feature => !states || states.includes(String(feature.properties?.State_Name || '').toUpperCase()));
    const dates = [...new Set(features.map(feature => {
      const properties = feature.properties || {};
      return properties.Year && properties.Julian_day ? `${properties.Year}-${String(properties.Julian_day).padStart(3, '0')}` : null;
    }).filter(Boolean))];
    const acceptedDates = [-1, 0, 1].map(offset => stamp(new Date(date.getTime() + offset * 86400000)));
    if (features.length && (dates.length !== 1 || !acceptedDates.includes(dates[0]))) {
      throw new Error(`INCOIS PFZ data is dated ${dates.join(', ') || 'unknown'}; expected ${acceptedDates.join(', ')}`);
    }

    const zones = features.map(feature => {
      const properties = feature.properties || {};
      return {
        id: feature.id,
        name: `INCOIS PFZ ${properties.State_Name || ''} ${properties.Sno || ''}`.trim(),
        state: properties.State_Name,
        category: properties.Category,
        year: properties.Year,
        julianDay: properties.Julian_day,
        advisoryId: properties.UID,
        lengthKm: properties.Length,
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
      advisoryDate: dates[0] || null,
      isLive: true,
      isDemoData: false
    });
  }
}

module.exports = RealINCOISPFZProvider;
