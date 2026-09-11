const SOURCES = {
  eez: { workspace: 'PFZ_EEZ', typeName: 'PFZ_EEZ:indiaeez' },
  sectors: { workspace: 'PFZ_Sectors', typeName: 'PFZ_Sectors:sector_new' },
  landingCentres: { workspace: 'PFZ_LandingCentres', typeName: 'PFZ_LandingCentres:LandingCenters_29Apr2024' },
  bathymetry: { workspace: 'PFZ_Bathymetry', typeName: 'PFZ_Bathymetry:bathymetry' }
};
const ORIGIN = 'https://www.incois.gov.in/geoserver';
const WATER_TYPES = new Set(['bay', 'basin', 'lake', 'reservoir', 'sea', 'strait', 'water']);
const distanceKm = (aLat, aLon, bLat, bLon) => {
  const radians = value => value * Math.PI / 180;
  const dLat = radians(bLat - aLat);
  const dLon = radians(bLon - aLon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(value));
};

const classifyLocation = async (lat, lon) => {
  const params = new URLSearchParams({ format: 'jsonv2', lat, lon, zoom: '18', layer: 'address,natural' });
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'ORCA-Marine-Map/1.0' },
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (result.error) return { isLand: false, label: null, source: 'OpenStreetMap Nominatim' };
    const matchDistanceKm = distanceKm(lat, lon, Number(result.lat), Number(result.lon));
    // ponytail: nearest-feature heuristic; use a local land polygon if sub-kilometre shoreline precision becomes necessary.
    const isLand = !WATER_TYPES.has(result.type) && Number.isFinite(matchDistanceKm) && matchDistanceKm <= 2;
    return { isLand, label: result.display_name || null, matchDistanceKm, source: 'OpenStreetMap Nominatim' };
  } catch (error) {
    return { isLand: null, error: `Location check unavailable: ${error.message}`, source: 'OpenStreetMap Nominatim' };
  }
};

const query = async (source, lat, lon) => {
  const delta = source === SOURCES.landingCentres ? 0.25 : 0.12;
  const params = new URLSearchParams({
    service: 'WFS', version: '1.1.0', request: 'GetFeature',
    typeName: source.typeName, outputFormat: 'application/json', maxFeatures: '25',
    bbox: `${lon - delta},${lat - delta},${lon + delta},${lat + delta},EPSG:4326`
  });
  const response = await fetch(`${ORIGIN}/${source.workspace}/ows?${params}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'ORCA-Marine-Map/1.0' },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(`INCOIS ${source.typeName} returned HTTP ${response.status}`);
  const json = await response.json();
  return { ...json, features: Array.isArray(json.features) ? json.features : [] };
};

async function getContext({ lat, lon }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('A valid latitude and longitude are required.');
  const [entries, location] = await Promise.all([Promise.all(Object.entries(SOURCES).map(async ([key, source]) => {
    try { return [key, await query(source, lat, lon)]; }
    catch (error) { return [key, { features: [], error: error.message }]; }
  })), classifyLocation(lat, lon)]);
  return {
    data: Object.fromEntries(entries),
    location,
    source: {
      dataset: 'INCOIS Marine Fisheries WebGIS context layers',
      origin: ORIGIN,
      layers: Object.fromEntries(Object.entries(SOURCES).map(([key, source]) => [key, source.typeName])),
      isLive: true, isDemoData: false, retrievedAt: new Date().toISOString()
    }
  };
}

module.exports = { getContext, classifyLocation };
