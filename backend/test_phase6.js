const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[TEST PHASE 6] Running Chat API tests against ${baseUrl}`);

  try {
    // 1. Test Safety Query
    console.log('1. Testing POST /api/chat/message (Safety Query)...');
    const msg1Res = await fetch(`${baseUrl}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Is it safe to go fishing tomorrow morning near Mumbai?',
        location: { sectorName: 'Mumbai Coast' }
      })
    });
    const msg1Data = await msg1Res.json();
    console.log('   Chat 1 Status:', msg1Res.status);
    console.log('   Conversation ID:', msg1Data.conversationId);
    console.log('   Intent Identified:', msg1Data.aiResponse?.intent);
    console.log('   Agent Trace Steps:', msg1Data.aiResponse?.trace?.length);
    console.log('   Risk Evaluated:', msg1Data.aiResponse?.riskAssessment?.level, 'Score:', msg1Data.aiResponse?.riskAssessment?.score);
    if (msg1Res.status !== 200 || !msg1Data.aiResponse?.text || msg1Data.aiResponse?.trace?.length < 5) {
      throw new Error('Safety query failed');
    }

    const convId = msg1Data.conversationId;

    // 2. Test PFZ Query in Same Conversation
    console.log('2. Testing POST /api/chat/message (PFZ Query in same convId)...');
    const msg2Res = await fetch(`${baseUrl}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: convId,
        message: 'Where is the nearest potentially favourable fishing zone?'
      })
    });
    const msg2Data = await msg2Res.json();
    console.log('   Chat 2 Status:', msg2Res.status, 'Intent:', msg2Data.aiResponse?.intent);
    if (msg2Res.status !== 200 || msg2Data.aiResponse?.intent !== 'PFZ_LOCATION_QUERY') {
      throw new Error('PFZ query failed');
    }

    // 3. Test Get Chat History
    console.log('3. Testing GET /api/chat/history...');
    const histRes = await fetch(`${baseUrl}/chat/history?conversationId=${convId}`);
    const histData = await histRes.json();
    console.log('   History Status:', histRes.status, 'Total messages recorded:', histData.messages?.length);
    if (histRes.status !== 200 || histData.messages?.length !== 4) {
      throw new Error('Chat history failed');
    }

    console.log('\n========================================');
    console.log('>>> ALL PHASE 6 BACKEND TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('Phase 6 backend test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
