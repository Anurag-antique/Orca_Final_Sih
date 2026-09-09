const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[TEST PHASE 14] Running Admin & Agent Trace Visualizer tests against ${baseUrl}`);

  try {
    // 1. Test Performance Metrics API
    console.log('1. Testing GET /api/traces/metrics...');
    const metricsRes = await fetch(`${baseUrl}/traces/metrics`);
    const metricsData = await metricsRes.json();
    console.log('   Total Inquiries:', metricsData.data?.totalInquiriesLogged);
    console.log('   Avg Pipeline Latency:', metricsData.data?.avgPipelineLatencyMs, 'ms');
    console.log('   Subagent stats count:', Object.keys(metricsData.data?.subagentStats || {}).length);
    console.log('   Zero-Hallucination Compliance:', metricsData.data?.zeroHallucinationCompliance);

    if (metricsRes.status !== 200 || !metricsData.data?.subagentStats) {
      throw new Error('Metrics API failed');
    }

    // 2. Test Get Traces List
    console.log('2. Testing GET /api/traces...');
    const listRes = await fetch(`${baseUrl}/traces`);
    const listData = await listRes.json();
    console.log('   Traces Count:', listData.count);
    console.log('   Latest Trace ID:', listData.data?.[0]?.traceId, 'Query:', listData.data?.[0]?.query);

    if (listRes.status !== 200 || listData.count === 0) {
      throw new Error('Traces list API failed');
    }

    const testTraceId = listData.data[0].traceId;

    // 3. Test Get Trace by ID
    console.log(`3. Testing GET /api/traces/${testTraceId}...`);
    const itemRes = await fetch(`${baseUrl}/traces/${testTraceId}`);
    const itemData = await itemRes.json();
    console.log('   Trace Steps:', itemData.data?.stepsCount);
    if (itemRes.status !== 200 || !itemData.data?.steps) {
      throw new Error('Trace detail API failed');
    }

    // 4. Test Export Regulatory Compliance Audit Log
    console.log('4. Testing GET /api/traces/export...');
    const expRes = await fetch(`${baseUrl}/traces/export`);
    const expData = await expRes.json();
    console.log('   Audit Log Export Standard:', expData.complianceStandard);
    console.log('   Exported Records:', expData.totalRecords);

    if (expRes.status !== 200 || expData.totalRecords === 0) {
      throw new Error('Trace export API failed');
    }

    console.log('\n========================================');
    console.log('>>> ALL PHASE 14 TRACE TESTS PASSED <<<');
    console.log('========================================\n');
  } catch (err) {
    console.error('Phase 14 test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
