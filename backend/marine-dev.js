// Local Marine Map demo: existing public APIs only; no account/database setup.
const express = require('express');
const app = express();
app.use(express.json());
for (const [prefix, route] of [['', 'health'], ['', 'provider'], ['/map', 'map'], ['/geofence', 'geofence'], ['/risk', 'risk'], ['/routes', 'route']]) {
  app.use(`/api${prefix}`, require(`./src/routes/${route}.routes`));
}
app.use(require('./src/middleware/errorHandler'));
if (require.main === module) app.listen(5001, '127.0.0.1', () => console.log('Marine Map public APIs: http://127.0.0.1:5001'));
module.exports = app;
