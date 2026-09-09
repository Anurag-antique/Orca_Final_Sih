const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[TEST PHASE 10] Running Geofencing & MPA tests against ${baseUrl}`);

  try {
    // 1. Test Geofence Zones Database
    console.log('1. Testing GET /api/geofence/zones...');
    const zonesRes = await fetch(`${baseUrl}/geofence/zones`);
    const zonesData = await zonesRes.json();
    console.log('   MPAs count:', zonesData.data?.marineProtectedAreas?.length);
    console.log('   Naval Zones count:', zonesData.data?.restrictedNavalZones?.length);
    console.log('   Hazards count:', zonesData.data?.submergedHazards?.length);
    console.log('   International Boundaries count:', zonesData.data?.internationalBoundaries?.length);

    if (zonesRes.status !== 200 || !zonesData.data?.marineProtectedAreas?.length) {
      throw new Error('Geofence zones API failed');
    }

    // 2. Test Clear Waters (Mumbai Offshore)
    console.log('2. Testing Clear Waters (Mumbai 18.9220°N, 72.8347°E)...');
    const clearRes = await fetch(`${baseUrl}/geofence/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: 18.9220, lon: 72.8347 })
    });
    const clearData = await clearRes.json();
    console.log('   Status:', clearData.data?.status, 'Alert Level:', clearData.data?.alertLevel);
    if (clearRes.status !== 200 || clearData.data?.status !== 'CLEAR_SAFE') {
      throw new Error('Clear check failed');
    }

    // 3. Test MPA Breach Simulation (Inside Malvan Marine Sanctuary)
    console.log('3. Testing MPA Breach (Malvan Sanctuary 16.0500°N, 73.4600°E)...');
    const mpaRes = await fetch(`${baseUrl}/geofence/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'MALVAN_MPA_BREACH' })
    });
    const mpaData = await mpaRes.json();
    console.log('   Status:', mpaData.data?.status, 'Breached Zones:', mpaData.data?.breachedZones?.map(z => z.name));
    if (mpaRes.status !== 200 || mpaData.data?.status !== 'CRITICAL_BREACH' || mpaData.data?.breachedZones?.length === 0) {
      throw new Error('MPA breach test failed');
    }

    // 4. Test Naval Firing Proximity Warning
    console.log('4. Testing Naval Firing Warning (INS Trata Proximity)...');
    const navRes = await fetch(`${baseUrl}/geofence/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'NAVAL_FIRING_WARNING' })
    });
    const navData = await navRes.json();
    console.log('   Status:', navData.data?.status, 'Warning Zones:', navData.data?.warningZones?.map(z => `${z.name} (${z.distanceKm} km)`));
    if (navRes.status !== 200 || navData.data?.status !== 'PROXIMITY_WARNING') {
      throw new Error('Naval proximity warning test failed');
    }

    // 5. Test Sir Creek IMBL Buffer Warning
    console.log('5. Testing Sir Creek IMBL Border Warning...');
    const imblRes = await fetch(`${baseUrl}/geofence/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'SIR_CREEK_IMBL_WARNING' })
    });
    const imblData = await imblRes.json();
    console.log('   Status:', imblData.data?.status, 'Boundary Warnings:', imblData.data?.boundaryWarnings?.map(z => `${z.name} (${z.distanceKm} km)`));
    if (imblRes.status !== 200 || imblData.data?.status !== 'BORDER_BUFFER_WARNING') {
      throw new Error('IMBL warning test failed');
    }

    console.log('\n========================================');
    console.log('>>> ALL PHASE 10 GEOFENCE TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('Phase 10 test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
