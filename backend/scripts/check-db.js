require("dotenv").config();
const { runMigrations, seedDemoUser } = require("../src/db/migrate");

(async () => {
  try {
    await runMigrations();
    await seedDemoUser();
    console.log("✅ DB check passed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ DB check failed:", err.message);
    process.exit(1);
  }
})();
