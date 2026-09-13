const express = require("express");
const router = express.Router();
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const dashboardRoutes = require("./dashboard.routes");
const mapRoutes = require("./map.routes");
const providerRoutes = require("./provider.routes");
const chatRoutes = require("./chat.routes");
const agentRoutes = require("./agent.routes");
const riskRoutes = require("./risk.routes");
const explainRoutes = require("./explain.routes");
const geofenceRoutes = require("./geofence.routes");
const routeRoutes = require("./route.routes");
const alertRoutes = require("./alert.routes");
const traceRoutes = require("./trace.routes");

// Phase 1
const geocodeRoutes = require("./geocode.routes");
const vesselRoutes = require("./vessel.routes");
const maritimeRoutes = require("./maritime.routes");

// Phase 2A
const notificationRoutes = require("./notification.routes");

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/map", mapRoutes);
router.use("/chat", chatRoutes);
router.use("/agents", agentRoutes);
router.use("/risk", riskRoutes);
router.use("/explain", explainRoutes);
router.use("/geofence", geofenceRoutes);
router.use("/routes", routeRoutes);
router.use("/alerts", alertRoutes);
router.use("/traces", traceRoutes);
router.use("/geocode", geocodeRoutes);
router.use("/vessels", vesselRoutes);
router.use("/maritime", maritimeRoutes);
router.use("/notifications", notificationRoutes);
router.use("/", providerRoutes);

module.exports = router;
