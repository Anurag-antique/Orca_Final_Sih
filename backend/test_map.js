const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  console.log('[TEST MAP API] Listening on port:', port);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/map/layers`);
    const data = await res.json();
    console.log('[TEST MAP API] Status:', res.status);
    console.log('[TEST MAP API] PFZ Features count:', data.data?.pfz?.features?.length);
    console.log('[TEST MAP API] Restricted count:', data.data?.restricted?.features?.length);
    console.log('[TEST MAP API] Protected count:', data.data?.protected?.features?.length);
    console.log('[TEST MAP API] Hazards count:', data.data?.hazards?.features?.length);
    console.log('[TEST MAP API] Buoys count:', data.data?.buoys?.features?.length);
    console.log('[TEST MAP API] Ports count:', data.data?.ports?.features?.length);

    if (res.status === 200 && data.data?.pfz?.features?.length > 0) {
      console.log('>>> MAP API VALIDATION: PASSED <<<');
    } else {
      console.error('>>> MAP API VALIDATION: FAILED <<<');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
