const app = require('./src/app');
const config = require('./src/config');

const PORT = config.port || 5000;

app.listen(PORT, () => {
  console.log(`[ORCA-BACKEND] Server listening on port ${PORT} in ${config.env} mode`);
  console.log(`[ORCA-BACKEND] Health endpoint: http://localhost:${PORT}/api/health`);
});
