const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[TEST PHASE 4] Running Data Provider tests against ${baseUrl}`);

  try {
    // 1. Weather Provider API
    console.log('1. Testing GET /api/weather...');
    const wRes = await fetch(`${baseUrl}/weather?lat=18.9220&lon=72.8347&sector=Mumbai%20Coast`);
    const wData = await wRes.json();
    console.log('   Weather Status:', wRes.status, 'Temp:', wData.data?.temperatureC, 'Wind:', wData.data?.windSpeedKmh, 'Provider:', wData.provider?.name);
    if (wRes.status !== 200 || !wData.data?.temperatureC) throw new Error('Weather API failed');

    // 2. Ocean Provider API
    console.log('2. Testing GET /api/ocean...');
    const oRes = await fetch(`${baseUrl}/ocean?lat=18.9220&lon=72.8347`);
    const oData = await oRes.json();
    console.log('   Ocean Status:', oRes.status, 'SST:', oData.data?.seaSurfaceTemperatureC, 'Wave Height:', oData.data?.significantWaveHeightM);
    if (oRes.status !== 200 || !oData.data?.seaSurfaceTemperatureC) throw new Error('Ocean API failed');

    // 3. PFZ Provider API
    console.log('3. Testing GET /api/pfz...');
    const pfzRes = await fetch(`${baseUrl}/pfz?lat=18.9220&lon=72.8347`);
    const pfzData = await pfzRes.json();
    console.log('   PFZ Status:', pfzRes.status, 'Zone Count:', pfzData.data?.zoneCount, 'Top Zone:', pfzData.data?.nearestZone?.name);
    if (pfzRes.status !== 200 || !pfzData.data?.zones) throw new Error('PFZ API failed');

    // 4. Advisory Provider API
    console.log('4. Testing GET /api/advisories...');
    const advRes = await fetch(`${baseUrl}/advisories?lat=18.9220&lon=72.8347`);
    const advData = await advRes.json();
    console.log('   Advisories Status:', advRes.status, 'Count:', advData.data?.advisoriesCount, 'Top Title:', advData.data?.advisories?.[0]?.title);
    if (advRes.status !== 200 || !advData.data?.advisories) throw new Error('Advisory API failed');

    // 5. Geospatial Zones Provider API
    console.log('5. Testing GET /api/geospatial/zones...');
    const geoRes = await fetch(`${baseUrl}/geospatial/zones?lat=18.9220&lon=72.8347`);
    const geoData = await geoRes.json();
    console.log('   Geospatial Status:', geoRes.status, 'EEZ State:', geoData.data?.zones?.eezBoundary?.state);
    if (geoRes.status !== 200 || !geoData.data?.zones) throw new Error('Geospatial zones API failed');

    // 6. Data Sources Catalog API
    console.log('6. Testing GET /api/sources...');
    const srcRes = await fetch(`${baseUrl}/sources`);
    const srcData = await srcRes.json();
    console.log('   Sources Status:', srcRes.status, 'Registered Providers:', srcData.registeredProvidersCount, 'All Healthy:', srcData.allHealthy);
    if (srcRes.status !== 200 || srcData.registeredProvidersCount !== 5) throw new Error('Sources catalog API failed');

    console.log('\n========================================');
    console.log('>>> ALL PHASE 4 BACKEND TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('Phase 4 backend test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
