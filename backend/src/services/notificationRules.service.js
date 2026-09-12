const notificationService = require("./notification.service");

/**
 * Deterministic notification rules.
 *
 * Evaluated against real telemetry from the existing providers. Only emits
 * notifications when a threshold is actually crossed. No fabricated alerts.
 *
 * Thresholds are conservative — adjust if ORCA's risk engine already handles
 * a given condition, to avoid duplicate signalling.
 */
const RULES = [
  {
    id: "high_wind",
    type: "weather",
    severity: "WARNING",
    title: "High wind advisory",
    test: (t) =>
      Number.isFinite(t?.weather?.windSpeedKmh) && t.weather.windSpeedKmh >= 40,
    message: (t) =>
      `Wind is ${t.weather.windSpeedKmh} km/h${t.weather.windDirection ? ` from ${t.weather.windDirection}` : ""}.`,
  },
  {
    id: "gale_wind",
    type: "weather",
    severity: "CRITICAL",
    title: "Gale-force wind warning",
    test: (t) =>
      Number.isFinite(t?.weather?.windSpeedKmh) && t.weather.windSpeedKmh >= 62,
    message: (t) =>
      `Gale-force winds at ${t.weather.windSpeedKmh} km/h. Do not depart.`,
  },
  {
    id: "high_waves",
    type: "ocean",
    severity: "WARNING",
    title: "High sea state",
    test: (t) =>
      Number.isFinite(t?.ocean?.significantWaveHeightM) &&
      t.ocean.significantWaveHeightM >= 2.5,
    message: (t) =>
      `Significant wave height ${t.ocean.significantWaveHeightM} m.`,
  },
  {
    id: "rough_waves",
    type: "ocean",
    severity: "CRITICAL",
    title: "Rough sea warning",
    test: (t) =>
      Number.isFinite(t?.ocean?.significantWaveHeightM) &&
      t.ocean.significantWaveHeightM >= 4.0,
    message: (t) =>
      `Rough sea — wave height ${t.ocean.significantWaveHeightM} m. Return to port.`,
  },
  {
    id: "geofence_breach",
    type: "geofence",
    severity: "CRITICAL",
    title: "Geofence breach",
    test: (t) => t?.geofence?.status === "CRITICAL_BREACH",
    message: (t) =>
      t?.geofence?.statusDescription || "Vessel entered a restricted zone.",
  },
  {
    id: "border_warning",
    type: "geofence",
    severity: "WARNING",
    title: "International boundary proximity",
    test: (t) => t?.geofence?.status === "BORDER_BUFFER_WARNING",
    message: (t) =>
      t?.geofence?.statusDescription ||
      "Vessel is approaching an international boundary.",
  },
  {
    id: "official_advisory",
    type: "advisory",
    severity: "INFO",
    title: "Official marine advisory",
    test: (t) => Array.isArray(t?.alerts) && t.alerts.length > 0,
    message: (t) => t.alerts[0]?.title || "A new marine advisory is active.",
  },
];

async function evaluate(telemetry, { sector = null } = {}) {
  if (!telemetry || typeof telemetry !== "object") return [];

  const created = [];
  for (const rule of RULES) {
    let triggered = false;
    try {
      triggered = rule.test(telemetry);
    } catch {
      triggered = false;
    }
    if (!triggered) continue;

    // Suppress repeats within 30 min for the same rule + sector.
    const dup = await notificationService.isDuplicate({
      type: rule.type,
      title: rule.title,
      sector,
    });
    if (dup) continue;

    try {
      const row = await notificationService.createNotification({
        userId: null, // broadcast — marine conditions are sector-wide
        type: rule.type,
        severity: rule.severity,
        title: rule.title,
        message: rule.message(telemetry),
        sector,
        metadata: { ruleId: rule.id },
      });
      created.push(row);
    } catch (err) {
      console.error(`[Notify] Rule ${rule.id} failed:`, err.message);
    }
  }
  return created;
}

module.exports = { evaluate, RULES };
