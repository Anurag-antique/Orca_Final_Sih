const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[TEST PHASE 5] Running Integration tests against ${baseUrl}`);

  try {
    // 1. Test Weather Provider with Open-Meteo & Fallback
    console.log('1. Testing Live Weather Provider (Open-Meteo / Fallback)...');
    const wRes = await fetch(`${baseUrl}/weather?lat=18.9220&lon=72.8347&sector=Mumbai%20Coast`);
    const wData = await wRes.json();
    console.log('   Weather Status:', wRes.status, 'Temp:', wData.data?.temperatureC, 'Source:', wData.source?.origin, 'IsDemo:', wData.source?.isDemoData);
    if (wRes.status !== 200 || !wData.data?.temperatureC) throw new Error('Weather API failed');

    // 2. Test Ocean Provider with Marine API & Fallback
    console.log('2. Testing Live Ocean Provider (Marine Open-Meteo / Fallback)...');
    const oRes = await fetch(`${baseUrl}/ocean?lat=18.9220&lon=72.8347`);
    const oData = await oRes.json();
    console.log('   Ocean Status:', oRes.status, 'SST:', oData.data?.seaSurfaceTemperatureC, 'Wave Height:', oData.data?.significantWaveHeightM, 'Source:', oData.source?.origin);
    if (oRes.status !== 200 || !oData.data?.seaSurfaceTemperatureC) throw new Error('Ocean API failed');

    // 3. Test Dashboard Aggregated Live Telemetry Endpoint
    console.log('3. Testing Dashboard Live Telemetry (Mumbai Coast)...');
    const dRes = await fetch(`${baseUrl}/dashboard?sector=Mumbai%20Coast`);
    const dData = await dRes.json();
    console.log('   Dashboard Status:', dRes.status);
    console.log('   Dashboard Weather Temp:', dData.data?.weather?.temperatureC, 'Wind:', dData.data?.weather?.windSpeedKmh, 'Source:', dData.data?.weather?.sourceOrigin);
    console.log('   Dashboard Ocean SST:', dData.data?.ocean?.sstCelsius, 'Wave:', dData.data?.ocean?.significantWaveHeightM);
    console.log('   Dashboard PFZ Rating:', dData.data?.pfz?.potentialRating, 'Distance:', dData.data?.pfz?.nearestZoneDistanceKm, 'Species:', dData.data?.pfz?.targetSpecies?.join(', '));
    console.log('   Dashboard Risk Level:', dData.data?.riskAssessment?.riskLevel, 'Score:', dData.data?.riskAssessment?.riskScore);

    if (dRes.status !== 200 || !dData.data?.weather || !dData.data?.ocean || !dData.data?.pfz) {
      throw new Error('Dashboard aggregated telemetry failed');
    }

    console.log('\n========================================');
    console.log('>>> ALL PHASE 5 BACKEND TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('Phase 5 backend test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
