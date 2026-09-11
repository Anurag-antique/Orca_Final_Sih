const assert = require('node:assert/strict');
const service = require('./src/services/marineContext.service');
const Ocean = require('./src/providers/ocean/FallbackOceanProvider');
const PFZ = require('./src/providers/pfz/RealINCOISPFZProvider');

(async () => {
  const originalFetch = global.fetch;
  global.fetch = async url => {
    if (String(url).includes('nominatim')) return { ok: true, json: async () => ({ lat: '18.9001', lon: '72.8001', type: 'road', display_name: 'Mumbai, India' }) };
    assert.match(String(url), /incois\.gov\.in\/geoserver/);
    return { ok: true, json: async () => ({ type: 'FeatureCollection', features: [] }) };
  };
  try {
    const result = await service.getContext({ lat: 18.9, lon: 72.8 });
    assert.deepEqual(Object.keys(result.data), ['eez', 'sectors', 'landingCentres', 'bathymetry']);
    assert.equal(result.source.isLive, true);
    assert.equal(result.location.isLand, true);
    global.fetch = async () => ({ ok: true, json: async () => ({ lat: '22.3511148', lon: '78.6677428', type: 'administrative', display_name: 'India' }) });
    const offshore = await service.classifyLocation(16.7290, 82.5428);
    assert.equal(offshore.isLand, false, 'A distant administrative match must not turn offshore water into land');
    await assert.rejects(() => service.getContext({ lat: NaN, lon: 72.8 }), /valid latitude/);

    const ocean = new Ocean();
    let usedFallback = false;
    ocean.primaryProvider.getOceanConditions = async () => { const error = new Error('land'); error.code = 'LAND_LOCATION'; throw error; };
    ocean.fallbackProvider.getOceanConditions = async () => { usedFallback = true; };
    await assert.rejects(() => ocean.getOceanConditions({ lat: 19.1, lon: 72.9 }), /land/);
    assert.equal(usedFallback, false, 'Land must not receive mock wave data');

    const now = new Date();
    const start = Date.UTC(now.getUTCFullYear(), 0, 0);
    global.fetch = async () => ({ ok: true, json: async () => ({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature', id: 'live-pfz',
        properties: { State_Name: 'SOUTH ANDHRAPRADESH', Year: now.getUTCFullYear(), Julian_day: Math.floor((now - start) / 86400000), Sno: 1 },
        geometry: { type: 'MultiLineString', coordinates: [[[83, 17], [84, 18]]] }
      }]
    }) });
    const pfz = await new PFZ().getPFZs({ lat: 17.7, lon: 83.2, sectorName: 'Visakhapatnam' }, now);
    assert.equal(pfz.data.geojson.features.length, 1);
    assert.equal(pfz.source.isLive, true);
    console.log('PASS: INCOIS PFZ lines, marine context, and land-click rejection.');
  } finally {
    global.fetch = originalFetch;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
