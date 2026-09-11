// Run: node backend/test_marine_map.js — no database or test dependencies.
const assert = require('node:assert/strict');
const app = require('./marine-dev');
const Weather = require('./src/providers/weather/FallbackWeatherProvider');
const Ocean = require('./src/providers/ocean/FallbackOceanProvider');
const server = app.listen(0, '127.0.0.1', async () => {
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (path, body) => {
    const response = await fetch(base + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
    assert.equal(response.status, 200);
    return response.json();
  };
  try {
    const { data: layers } = await request('/map/layers');
    for (const key of ['pfz', 'protected', 'restricted', 'hazards', 'imbl']) {
      assert.equal(layers[key].type, 'FeatureCollection');
      assert(layers[key].features.length > 0);
    }
    for (const [scenario, status] of [['MALVAN_MPA_BREACH', 'CRITICAL_BREACH'], ['NAVAL_FIRING_WARNING', 'PROXIMITY_WARNING'], ['SIR_CREEK_IMBL_WARNING', 'BORDER_BUFFER_WARNING'], ['CLEAR', 'CLEAR_SAFE']]) {
      const { data } = await request('/geofence/simulate', { scenario });
      assert.equal(data.status, status);
      assert(Number.isFinite(data.vesselPosition.lat));
      for (const zone of [...data.breachedZones, ...data.warningZones, ...data.boundaryWarnings]) {
        const feature = Object.values(layers).flatMap(l => l.features || []).find(f => f.id === zone.id);
        assert(feature, `Missing displayed boundary: ${zone.id}`);
        assert.deepEqual(feature.geometry.type === 'Polygon' ? feature.geometry.coordinates[0] : feature.geometry.coordinates,
          (zone.coordinates || zone.lineCoordinates).map(([lat, lon]) => [lon, lat]));
      assert(Number.isFinite(zone.distanceKm));
      }
    }
    const { data: pfz, source: pfzSource } = await request('/pfz?lat=18.922&lon=72.8347&sector=Mumbai%20Coast');
    assert.equal(pfzSource.isLive, true);
    assert.equal(pfzSource.isDemoData, false);
    assert.match(pfzSource.origin, /incois\.gov\.in\/geoserver\/PFZ_Automation\/ows/);
    assert.match(pfzSource.advisoryDate, /^\d{4}-\d{3}$/);
    assert(pfz.zoneCount > 0);
    assert(pfz.geojson.features.every(feature => ['LineString', 'MultiLineString'].includes(feature.geometry.type)));
    const context = await request('/marine/context?lat=18.9&lon=72.8&sector=Mumbai%20Coast');
    assert.equal(context.source.isLive, true);
    assert.equal(context.source.isDemoData, false);
    for (const key of ['eez', 'sectors', 'landingCentres', 'bathymetry']) assert(key in context.data);
    for (const [wind, wave, level] of [[5, 0.5, 'LOW'], [25, 2, 'MODERATE'], [45, 3.4, 'HIGH'], [60, 4, 'CRITICAL']]) {
      const { data } = await request('/risk/evaluate', { weather: { windSpeedKmh: wind }, ocean: { significantWaveHeightM: wave } });
      assert.equal(data.riskLevel, level);
    }
    const Cyclone = require('./src/engine/rules/CycloneAlertRule');
    assert.equal(Cyclone.evaluate({ active: false, category: 'NO_CYCLONE_THREAT' }).isOverrideTrigger, false);
    assert.equal(Cyclone.evaluate({ category: 'NO_CYCLONE_THREAT' }).isOverrideTrigger, false);
    assert.equal(Cyclone.evaluate({ active: true, category: 'CYCLONE' }).isOverrideTrigger, true);
    assert.equal(Cyclone.evaluate({ category: 'DEPRESSION' }).isOverrideTrigger, true);
    const canoe = await request('/risk/evaluate', { weather: { windSpeedKmh: 30 }, ocean: { significantWaveHeightM: 2 }, vesselProfile: { typeKey: 'traditional_unmotorized' } });
    const deep = await request('/risk/evaluate', { weather: { windSpeedKmh: 30 }, ocean: { significantWaveHeightM: 2 }, vesselProfile: { typeKey: 'deep_sea_vessel' } });
    assert(canoe.data.riskScore > deep.data.riskScore);
    for (const [Provider, method] of [[Weather, 'getWeather'], [Ocean, 'getOceanConditions']]) {
      const provider = new Provider();
      provider.primaryProvider[method] = async () => { throw new Error('simulated outage'); };
      const fallback = await provider[method]({ lat: 18.9, lon: 72.5 });
      assert.equal(fallback.source.isFallback, true);
    }
    const originalFetch = global.fetch;
    try {
      global.fetch = async () => ({ ok: true, json: async () => ({ current: {} }) });
      for (const [Provider, method] of [[Weather, 'getWeather'], [Ocean, 'getOceanConditions']]) {
        const result = await new Provider()[method]({ lat: 0, lon: 0 });
        assert.equal(result.source.isFallback, true, 'Missing measurements must not look live');
      }
    } finally { global.fetch = originalFetch; }
    console.log('PASS: five GIS layers; four simulations and matching geometry; four risk levels; vessel modifiers; provider fallback provenance.');
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { server.close(); }
});
