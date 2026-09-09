const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[TEST PHASE 11] Running Lower-Risk Route Planning tests against ${baseUrl}`);

  try {
    // 1. Test Harbors & Destinations Waypoints API
    console.log('1. Testing GET /api/routes/waypoints...');
    const wpRes = await fetch(`${baseUrl}/routes/waypoints`);
    const wpData = await wpRes.json();
    console.log('   Harbors Count:', wpData.data?.harbors?.length);
    console.log('   Destinations Count:', wpData.data?.destinations?.length);
    if (wpRes.status !== 200 || wpData.data?.harbors?.length < 5 || wpData.data?.destinations?.length < 5) {
      throw new Error('Waypoints API failed');
    }

    // 2. Test Route Planning (Mumbai Sassoon Dock -> Mumbai PFZ Alpha)
    console.log('2. Testing POST /api/routes/plan (Sassoon Dock -> PFZ Alpha)...');
    const planRes = await fetch(`${baseUrl}/routes/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'mumbai_sassoon_dock',
        destination: 'mumbai_pfz_alpha',
        cruisingSpeedKnots: 8.5
      })
    });
    const planData = await planRes.json();
    console.log('   Plan Status:', planRes.status);
    console.log('   Direct Route Distance:', planData.data?.directBaselineRoute?.totalDistanceNm, 'NM, Risk Score:', planData.data?.directBaselineRoute?.riskScore);
    console.log('   Lower-Risk Route Distance:', planData.data?.lowerRiskProposedRoute?.totalDistanceNm, 'NM, Risk Score:', planData.data?.lowerRiskProposedRoute?.riskScore);
    console.log('   Detour Overhead:', planData.data?.lowerRiskProposedRoute?.detourAdditionalMinutes, 'minutes');
    console.log('   Turn Directives Count:', planData.data?.lowerRiskProposedRoute?.turnByTurnDirectives?.length);

    // Verify lower-risk route has lower risk score than direct route
    if (
      planRes.status !== 200 ||
      !planData.data?.lowerRiskProposedRoute?.coordinates?.length ||
      planData.data?.lowerRiskProposedRoute?.riskScore >= planData.data?.directBaselineRoute?.riskScore
    ) {
      throw new Error('Route planning comparison failed: lower-risk route should have lower risk score than direct route');
    }

    console.log('\n========================================');
    console.log('>>> ALL PHASE 11 ROUTE TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('Phase 11 test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
