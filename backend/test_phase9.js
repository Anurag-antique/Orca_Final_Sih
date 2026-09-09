const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[TEST PHASE 9] Running Explainability & Evidence tests against ${baseUrl}`);

  try {
    // 1. Test POST /api/explain/package
    console.log('1. Testing POST /api/explain/package...');
    const res = await fetch(`${baseUrl}/explain/package`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectorName: 'Mumbai Coast',
        weather: { windSpeedKmh: 28, visibilityKm: 8 },
        ocean: { significantWaveHeightM: 2.1 },
        vesselProfile: { vulnerabilityMultiplier: 1.2 }
      })
    });
    const data = await res.json();
    console.log('   Explainability Status:', res.status);
    console.log('   Operational Conclusion:', data.data?.operationalConclusion);
    console.log('   Causal Reasons Count:', data.data?.whyRecommended?.length);
    console.log('   Verified Citations Count:', data.data?.citations?.length);
    console.log('   Mandatory Disclaimers Count:', data.data?.mandatoryDisclaimers?.length);

    if (res.status !== 200 || !data.data?.whyRecommended || data.data?.citations?.length < 5 || data.data?.mandatoryDisclaimers?.length < 3) {
      throw new Error('Explainability package failed');
    }

    // 2. Test Explainer Agent Attachment in Chat
    console.log('2. Testing Chat Response with Explainability Package...');
    const chatRes = await fetch(`${baseUrl}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Is it safe to go fishing tomorrow near Mumbai?'
      })
    });
    const chatData = await chatRes.json();
    console.log('   Chat Status:', chatRes.status);
    console.log('   Attached Citations:', chatData.aiResponse?.citations?.length);
    console.log('   Explainability Package Attached:', Boolean(chatData.aiResponse?.explainabilityPackage || chatData.aiResponse?.citations));

    if (chatRes.status !== 200 || !chatData.aiResponse?.citations) {
      throw new Error('Chat explainability integration failed');
    }

    console.log('\n========================================');
    console.log('>>> ALL PHASE 9 EXPLAINABILITY TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('Phase 9 test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
