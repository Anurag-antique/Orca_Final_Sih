const assert = require('node:assert/strict');
const service = require('./src/services/marineContext.service');

(async () => {
  const originalFetch = global.fetch;
  global.fetch = async url => {
    assert.match(String(url), /incois\.gov\.in\/geoserver/);
    return { ok: true, json: async () => ({ type: 'FeatureCollection', features: [] }) };
  };
  try {
    const result = await service.getContext({ lat: 18.9, lon: 72.8 });
    assert.deepEqual(Object.keys(result.data), ['eez', 'sectors', 'landingCentres', 'bathymetry']);
    assert.equal(result.source.isLive, true);
    await assert.rejects(() => service.getContext({ lat: NaN, lon: 72.8 }), /valid latitude/);
    console.log('PASS: marine context queries all four INCOIS layers and validates coordinates.');
  } finally {
    global.fetch = originalFetch;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
