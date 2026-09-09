const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[TEST PHASE 7] Running Agent Orchestrator tests against ${baseUrl}`);

  try {
    // 1. Test Agent Architecture Metadata
    console.log('1. Testing GET /api/agents/architecture...');
    const archRes = await fetch(`${baseUrl}/agents/architecture`);
    const archData = await archRes.json();
    console.log('   Architecture Status:', archRes.status, 'Pipeline Stages:', archData.architecture?.pipeline?.length);
    if (archRes.status !== 200 || archData.architecture?.pipeline?.length !== 10) {
      throw new Error('Architecture API failed');
    }

    // 2. Test Direct Agent Orchestrator Pipeline Execution
    console.log('2. Testing POST /api/agents/execute...');
    const execRes = await fetch(`${baseUrl}/agents/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Is it safe to go fishing tomorrow morning near Mumbai?',
        sector: 'Mumbai Coast'
      })
    });
    const execData = await execRes.json();
    console.log('   Execute Status:', execRes.status);
    console.log('   Intent Output:', execData.data?.intent);
    console.log('   DAG Plan Tasks:', execData.data?.plan?.tasks?.length);
    console.log('   Trace Steps Count:', execData.data?.trace?.length);
    console.log('   Execution Duration:', execData.data?.totalExecutionTimeMs, 'ms');
    console.log('   Deterministic Risk Level:', execData.data?.riskAssessment?.riskLevel, 'Score:', execData.data?.riskAssessment?.riskScore);

    if (execRes.status !== 200 || !execData.data?.plan || execData.data?.trace?.length < 8) {
      throw new Error('Agent execution pipeline failed');
    }

    // 3. Test Chat Integration with Agent Orchestrator
    console.log('3. Testing POST /api/chat/message through Orchestrator...');
    const chatRes = await fetch(`${baseUrl}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Where is the nearest potentially favourable fishing zone near Kochi?'
      })
    });
    const chatData = await chatRes.json();
    console.log('   Chat Status:', chatRes.status, 'Sector Analyzed:', chatData.aiResponse?.sector, 'Intent:', chatData.aiResponse?.intent);
    if (chatRes.status !== 200 || chatData.aiResponse?.sector !== 'Kochi Harbor') {
      throw new Error('Orchestrator Chat integration failed');
    }

    console.log('\n========================================');
    console.log('>>> ALL PHASE 7 BACKEND TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('Phase 7 backend test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
