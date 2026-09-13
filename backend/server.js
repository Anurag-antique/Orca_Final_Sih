const app = require("./src/app");
const config = require("./src/config");
const { runMigrations, seedDemoUser } = require("./src/db/migrate");
const aisStreamService = require("./src/services/aisStreamService");

const PORT = config.port || 5000;

async function start() {
  // --- Migrations ---
  try {
    console.log("[ORCA-BACKEND] Running database migrations…");
    await runMigrations();
  } catch (err) {
    console.warn("[ORCA-BACKEND] ⚠️ Database migration skipped:", err.message);
  }

  // --- Demo seed: development only (spec §13 / §19) ---
  if (config.env !== "production") {
    try {
      console.log("[ORCA-BACKEND] Seeding demo user (dev only)…");
      await seedDemoUser();
    } catch (err) {
      console.warn("[ORCA-BACKEND] ⚠️ Demo user seed skipped:", err.message);
    }
  }

  // --- HTTP server ---
  const server = app.listen(PORT, () => {
    console.log(
      `[ORCA-BACKEND] Server listening on port ${PORT} in ${config.env} mode`,
    );
    console.log(
      `[ORCA-BACKEND] Health endpoint: http://localhost:${PORT}/api/health`,
    );

    // Start the single shared AIS WebSocket only after HTTP is up.
    aisStreamService.start();
  });

  // --- Graceful shutdown (fixes WS leak) ---
  const shutdown = (signal) => {
    console.log(`[ORCA-BACKEND] ${signal} received — shutting down…`);
    try {
      aisStreamService.stop();
    } catch (err) {
      console.warn("[ORCA-BACKEND] AIS stop error:", err.message);
    }
    server.close(() => process.exit(0));
    // Hard kill if connections don't drain within 5s.
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();
