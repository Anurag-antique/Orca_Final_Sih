const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[TEST PHASE 12] Running Safety Alerts & Notifications tests against ${baseUrl}`);

  try {
    // 1. Test Get Alerts List
    console.log('1. Testing GET /api/alerts...');
    const listRes = await fetch(`${baseUrl}/alerts`);
    const listData = await listRes.json();
    console.log('   Total Alerts Count:', listData.count);
    console.log('   Top Alert Severity:', listData.data?.[0]?.severity, 'Title:', listData.data?.[0]?.title);
    if (listRes.status !== 200 || listData.count < 3 || listData.data?.[0]?.severity !== 'EMERGENCY') {
      throw new Error('Alert list API failed');
    }

    // 2. Test Filter Alerts by Sector (Mumbai Coast)
    console.log('2. Testing GET /api/alerts?sector=Mumbai%20Coast...');
    const mumbaiRes = await fetch(`${baseUrl}/alerts?sector=Mumbai%20Coast`);
    const mumbaiData = await mumbaiRes.json();
    console.log('   Mumbai Alerts Count:', mumbaiData.count);
    if (mumbaiRes.status !== 200 || mumbaiData.count === 0) {
      throw new Error('Sector filter failed');
    }

    // 3. Test 1-Click Alert Simulation (Emergency Cyclone Alert)
    console.log('3. Testing POST /api/alerts/simulate (Emergency Cyclone)...');
    const simRes = await fetch(`${baseUrl}/alerts/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'EMERGENCY_CYCLONE' })
    });
    const simData = await simRes.json();
    console.log('   Simulated Alert Title:', simData.data?.title, 'Severity:', simData.data?.severity);
    if (simRes.status !== 200 || simData.data?.severity !== 'EMERGENCY') {
      throw new Error('Alert simulation failed');
    }

    const alertId = simData.data?.id;

    // 4. Test Acknowledge Alert
    console.log('4. Testing POST /api/alerts/acknowledge...');
    const ackRes = await fetch(`${baseUrl}/alerts/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: alertId })
    });
    const ackData = await ackRes.json();
    console.log('   Acknowledged Alert Status:', ackData.data?.status);
    if (ackRes.status !== 200 || ackData.data?.status !== 'ACKNOWLEDGED') {
      throw new Error('Acknowledge alert failed');
    }

    console.log('\n========================================');
    console.log('>>> ALL PHASE 12 ALERT TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('Phase 12 test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
