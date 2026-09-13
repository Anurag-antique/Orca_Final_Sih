/**
 * AISStream.io WebSocket service.
 *
 * Design (per spec §9 & §20):
 *   - ONE WebSocket connection shared by all browser clients.
 *   - Subscribes only to the configured bounding box.
 *   - Normalises messages into ORCA's vessel shape.
 *   - Keeps the latest position per MMSI in an in-memory Map.
 *   - Auto-reconnect with exponential backoff.
 *
 * NOTE ON COORDINATE ORDER:
 *   AISStream's docs and examples disagree on bounding-box order.
 *   Empirically, the server parses BoundingBoxes as [[lon, lat], [lon, lat]].
 *   We store bounds internally as [lat, lon] (human-friendly) and convert
 *   when sending the subscription.
 */

const WebSocket = require("ws");

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";
const STALE_AFTER_MS = 10 * 60 * 1000;
const PRUNE_AFTER_MS = 30 * 60 * 1000;
const MAX_VESSELS = 5000;

// Internally stored as [lat, lon] pairs — SW corner first.
// Covers the Indian EEZ and surrounding waters.
const DEFAULT_BOUNDS_LATLON = [
  [5.0, 65.0], // SW corner: 5°N, 65°E
  [25.0, 95.0], // NE corner: 25°N, 95°E
];

const SUPPORTED_POSITION_TYPES = new Set([
  "PositionReport",
  "ExtendedClassBPositionReport",
  "StandardClassBPositionReport",
]);

const CONTROL_TYPES = new Set(["SubscriptionConfirmation", "Welcome", "Error"]);

class AISStreamService {
  constructor() {
    this.ws = null;
    this.vessels = new Map();
    this.staticData = new Map();
    this.connected = false;
    this.lastMessageAt = null;
    this.lastError = null;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.pruneTimer = null;
    this.starting = false;
    this.messageCounters = Object.create(null);
    this.rawMessageCount = 0;
  }

  start() {
    if (this.starting || this.connected || this.ws) return;
    this.starting = true;

    const apiKey = process.env.AISSTREAM_API_KEY;
    if (!apiKey) {
      this.starting = false;
      this.lastError = "AISSTREAM_API_KEY is not configured on the server.";
      console.warn("[AIS] " + this.lastError);
      return;
    }

    try {
      // permessage-deflate: required by AISStream docs.
      this.ws = new WebSocket(AISSTREAM_URL, { perMessageDeflate: true });

      this.ws.on("open", () => {
        this.connected = true;
        this.starting = false;
        this.reconnectAttempts = 0;
        this.lastError = null;
        console.log("[AIS] Connected to AISStream.");

        const subscription = this._buildSubscription(apiKey);

        try {
          this.ws.send(JSON.stringify(subscription));
          // Log a redacted view of the payload for diagnosis.
          console.log(
            "[AIS] Subscription sent:",
            JSON.stringify({
              ...subscription,
              APIKey: "***redacted***",
            }),
          );
        } catch (err) {
          console.error("[AIS] Failed to send subscription:", err.message);
        }
      });

      this.ws.on("message", (raw) => {
        this.lastMessageAt = Date.now();
        this.rawMessageCount += 1;
        this._handleMessage(raw);
      });

      this.ws.on("close", (code, reason) => {
        this.connected = false;
        this.starting = false;
        this.ws = null;
        console.warn(
          `[AIS] Connection closed (${code}) ${reason?.toString?.() || ""}`,
        );
        this._scheduleReconnect();
      });

      this.ws.on("error", (err) => {
        this.lastError = err.message;
        console.error("[AIS] WebSocket error:", err.message);
      });
    } catch (err) {
      this.starting = false;
      this.lastError = err.message;
      console.error("[AIS] Failed to start:", err.message);
      this._scheduleReconnect();
    }

    if (!this.pruneTimer) {
      this.pruneTimer = setInterval(() => this._prune(), 60 * 1000);
      if (this.pruneTimer.unref) this.pruneTimer.unref();
    }
  }

  stop() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close(1000, "server shutdown");
      } catch {}
      this.ws = null;
    }
    this.connected = false;
  }

  /**
   * Build the subscription payload.
   * Converts internal [lat, lon] bounds to AISStream's [lon, lat] order.
   */
  _buildSubscription(apiKey) {
    const latLonBounds = this._readBoundsLatLon();
    // Swap lat/lon → lon/lat.
    const lonLatBounds = [
      [latLonBounds[0][1], latLonBounds[0][0]],
      [latLonBounds[1][1], latLonBounds[1][0]],
    ];

    return {
      APIKey: apiKey,
      BoundingBoxes: [lonLatBounds],
      FilterMessageTypes: [
        "PositionReport",
        "ExtendedClassBPositionReport",
        "StandardClassBPositionReport",
        "ShipStaticData",
      ],
    };
  }

  _readBoundsLatLon() {
    const envBounds = process.env.AISSTREAM_BOUNDS;
    if (!envBounds) return DEFAULT_BOUNDS_LATLON;
    try {
      const parsed = JSON.parse(envBounds);
      if (
        Array.isArray(parsed) &&
        parsed.length === 2 &&
        Array.isArray(parsed[0]) &&
        parsed[0].length === 2 &&
        Array.isArray(parsed[1]) &&
        parsed[1].length === 2
      ) {
        return parsed;
      }
    } catch {
      /* fall through */
    }
    return DEFAULT_BOUNDS_LATLON;
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectAttempts += 1;
    const delay = Math.min(
      60000,
      1000 * 2 ** Math.min(this.reconnectAttempts, 6),
    );
    console.log(
      `[AIS] Reconnect in ${delay} ms (attempt ${this.reconnectAttempts}).`,
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.start();
    }, delay);
  }

  _handleMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const type = msg.MessageType || "Unknown";
    this.messageCounters[type] = (this.messageCounters[type] || 0) + 1;

    if (process.env.AIS_DEBUG === "true") {
      console.log(`[AIS][debug] ${type}`, JSON.stringify(msg).slice(0, 260));
    }

    if (CONTROL_TYPES.has(type)) return;

    const meta = msg.MetaData || {};
    const mmsi = meta.MMSI ? String(meta.MMSI) : null;
    if (!mmsi) return;

    if (type === "ShipStaticData") {
      const s = msg.Message?.ShipStaticData || {};
      this.staticData.set(mmsi, {
        name: s.Name ? String(s.Name).trim() : null,
        vesselType: Number.isFinite(s.Type) ? s.Type : null,
        callSign: s.CallSign ? String(s.CallSign).trim() : null,
        destination: s.Destination ? String(s.Destination).trim() : null,
      });
      const existing = this.vessels.get(mmsi);
      if (existing) {
        const sd = this.staticData.get(mmsi);
        existing.name = sd.name || existing.name;
        existing.vesselType = sd.vesselType ?? existing.vesselType;
        existing.callSign = sd.callSign || existing.callSign;
        existing.destination = sd.destination || existing.destination;
      }
      return;
    }

    if (SUPPORTED_POSITION_TYPES.has(type)) {
      const payload =
        msg.Message?.PositionReport ||
        msg.Message?.ExtendedClassBPositionReport ||
        msg.Message?.StandardClassBPositionReport ||
        {};

      const latRaw = Number.isFinite(payload.Latitude)
        ? payload.Latitude
        : meta.latitude;
      const lonRaw = Number.isFinite(payload.Longitude)
        ? payload.Longitude
        : meta.longitude;
      const lat = Number(latRaw);
      const lon = Number(lonRaw);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

      const sd = this.staticData.get(mmsi) || {};
      const vessel = {
        mmsi,
        id: `mmsi:${mmsi}`,
        name: sd.name || (meta.ShipName ? String(meta.ShipName).trim() : null),
        lat,
        lon,
        speed: Number.isFinite(payload.Sog) ? payload.Sog : null,
        course: Number.isFinite(payload.Cog) ? payload.Cog : null,
        heading:
          Number.isFinite(payload.TrueHeading) && payload.TrueHeading !== 511
            ? payload.TrueHeading
            : null,
        vesselType: sd.vesselType ?? null,
        callSign: sd.callSign ?? null,
        destination: sd.destination ?? null,
        timestamp: meta.time_utc
          ? new Date(meta.time_utc).toISOString()
          : new Date().toISOString(),
      };

      this.vessels.set(mmsi, vessel);

      if (this.vessels.size > MAX_VESSELS) {
        const oldest = [...this.vessels.entries()].sort((a, b) =>
          (a[1].timestamp || "").localeCompare(b[1].timestamp || ""),
        )[0];
        if (oldest) this.vessels.delete(oldest[0]);
      }
    }
  }

  _prune() {
    const now = Date.now();
    for (const [mmsi, v] of this.vessels) {
      const age = now - new Date(v.timestamp).getTime();
      if (age > PRUNE_AFTER_MS) this.vessels.delete(mmsi);
    }
  }

  getVessels({ south, west, north, east } = {}) {
    const now = Date.now();
    const hasBounds =
      Number.isFinite(south) &&
      Number.isFinite(west) &&
      Number.isFinite(north) &&
      Number.isFinite(east);

    const out = [];
    for (const v of this.vessels.values()) {
      if (hasBounds) {
        if (v.lat < south || v.lat > north || v.lon < west || v.lon > east)
          continue;
      }
      const age = now - new Date(v.timestamp).getTime();
      out.push({ ...v, stale: age > STALE_AFTER_MS, ageMs: age });
    }
    return out;
  }

  getStatus() {
    return {
      connected: this.connected,
      vesselCount: this.vessels.size,
      staticDataCount: this.staticData.size,
      lastMessageAt: this.lastMessageAt
        ? new Date(this.lastMessageAt).toISOString()
        : null,
      lastError: this.lastError,
      apiKeyConfigured: Boolean(process.env.AISSTREAM_API_KEY),
      rawMessageCount: this.rawMessageCount,
      messageCounters: { ...this.messageCounters },
    };
  }
}

module.exports = new AISStreamService();
