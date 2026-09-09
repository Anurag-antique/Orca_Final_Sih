const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  console.log('[SMOKE TEST] Test server listening on ephemeral port:', port);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    const status = res.status;
    const body = await res.json();
    console.log('[SMOKE TEST] Status Code:', status);
    console.log('[SMOKE TEST] Response Body:', JSON.stringify(body, null, 2));

    if (status === 200 && body.success === true && body.message === 'ORCA API is running') {
      console.log('>>> HEALTH ENDPOINT VALIDATION: PASSED <<<');
    } else {
      console.error('>>> HEALTH ENDPOINT VALIDATION: FAILED <<<');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('[SMOKE TEST] Error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
