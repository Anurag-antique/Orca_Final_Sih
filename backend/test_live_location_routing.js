const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[TEST LIVE & TEMPLATES] Running tests against ${baseUrl}`);

  try {
    // 1. Test Route Templates
    console.log('1. Testing GET /api/routes/templates...');
    const tplRes = await fetch(`${baseUrl}/routes/templates`);
    const tplData = await tplRes.json();
    console.log('   Templates Count:', tplData.data?.length);
    if (tplRes.status !== 200 || !Array.isArray(tplData.data) || tplData.data.length < 5) {
      throw new Error('Templates API failed');
    }

    // 2. Test Dynamic Live Location Routing (e.g. vessel at GPS 18.922°N, 72.834°E near Gateway of India)
    console.log('2. Testing POST /api/routes/plan with Live Location...');
    const livePlanRes = await fetch(`${baseUrl}/routes/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        liveLocation: { lat: 18.9220, lon: 72.8347, accuracy: 15 },
        destination: 'mumbai_pfz_alpha',
        cruisingSpeedKnots: 9.0
      })
    });
    const livePlanData = await livePlanRes.json();
    console.log('   Live Plan Status:', livePlanRes.status);
    console.log('   Origin Name:', livePlanData.data?.origin?.name);
    console.log('   Is Live Origin:', livePlanData.data?.origin?.isLive);
    console.log('   Direct Route Distance:', livePlanData.data?.directBaselineRoute?.totalDistanceNm, 'NM');
    console.log('   Lower-Risk Route Distance:', livePlanData.data?.lowerRiskProposedRoute?.totalDistanceNm, 'NM');
    console.log('   Environmental Waves:', livePlanData.data?.lowerRiskProposedRoute?.environmentalParameters?.waveHeightM, 'm');
    console.log('   Safety Comparison:', livePlanData.data?.lowerRiskProposedRoute?.safetyComparison?.explanation);

    if (
      livePlanRes.status !== 200 ||
      !livePlanData.data?.origin?.isLive ||
      !livePlanData.data?.lowerRiskProposedRoute?.coordinates?.length
    ) {
      throw new Error('Live Location route planning failed');
    }

    console.log('\n=================================================');
    console.log('>>> ALL DYNAMIC LIVE & TEMPLATE TESTS PASSED <<<');
    console.log('=================================================\n');
  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
