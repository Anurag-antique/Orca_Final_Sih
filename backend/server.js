// const app = require('./src/app');
// const config = require('./src/config');

// const PORT = config.port || 5000;

// app.listen(PORT, () => {
//   console.log(`[ORCA-BACKEND] Server listening on port ${PORT} in ${config.env} mode`);
//   console.log(`[ORCA-BACKEND] Health endpoint: http://localhost:${PORT}/api/health`);
// });

const app = require("./src/app");
const config = require("./src/config");
const { runMigrations, seedDemoUser } = require("./src/db/migrate");

const PORT = config.port || 5000;

async function start() {
  try {
    console.log("[ORCA-BACKEND] Running database migrations...");
    await runMigrations();

    console.log("[ORCA-BACKEND] Seeding demo user...");
    await seedDemoUser();
  } catch (err) {
    console.warn("[ORCA-BACKEND] ⚠️ Database migration skipped:", err.message);
  }

  app.listen(PORT, () => {
    console.log(
      `[ORCA-BACKEND] Server listening on port ${PORT} in ${config.env} mode`,
    );
    console.log(
      `[ORCA-BACKEND] Health endpoint: http://localhost:${PORT}/api/health`,
    );
  });
}

start();
