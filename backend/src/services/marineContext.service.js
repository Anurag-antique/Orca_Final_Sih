const SOURCES = {
  eez: { workspace: 'PFZ_EEZ', typeName: 'PFZ_Automation:indiaeez' },
  sectors: { workspace: 'PFZ_Sectors', typeName: 'PFZ_Sectors:sector_new' },
  landingCentres: { workspace: 'PFZ_LandingCentres', typeName: 'PFZ_LandingCentres:LandingCenters_29Apr2024' },
  bathymetry: { workspace: 'PFZ_Bathymetry', typeName: 'PFZ_Bathymetry:bathymetry' }
};
const ORIGIN = 'https://www.incois.gov.in/geoserver';

const query = async (source, lat, lon) => {
  const delta = source === SOURCES.landingCentres ? 0.25 : 0.12;
  const params = new URLSearchParams({
    service: 'WFS', version: '1.1.0', request: 'GetFeature',
    typeName: source.typeName, outputFormat: 'application/json', maxFeatures: '25',
    bbox: `${lon - delta},${lat - delta},${lon + delta},${lat + delta},EPSG:4326`
  });
  const response = await fetch(`${ORIGIN}/${source.workspace}/ows?${params}`, { headers: { Accept: 'application/json', 'User-Agent': 'ORCA-Marine-Map/1.0' } });
  if (!response.ok) throw new Error(`INCOIS ${source.typeName} returned HTTP ${response.status}`);
  const json = await response.json();
  return { ...json, features: Array.isArray(json.features) ? json.features : [] };
};

async function getContext({ lat, lon }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('A valid latitude and longitude are required.');
  const entries = await Promise.all(Object.entries(SOURCES).map(async ([key, source]) => {
    try { return [key, await query(source, lat, lon)]; }
    catch (error) { return [key, { features: [], error: error.message }]; }
  }));
  return {
    data: Object.fromEntries(entries),
    source: {
      dataset: 'INCOIS Marine Fisheries WebGIS context layers',
      origin: ORIGIN,
      layers: Object.fromEntries(Object.entries(SOURCES).map(([key, source]) => [key, source.typeName])),
      isLive: true, isDemoData: false, retrievedAt: new Date().toISOString()
    }
  };
}

module.exports = { getContext };
