require("dotenv").config();

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  apiVersion: "v1.0.0",

  jwtSecret:
    process.env.JWT_SECRET || "orca_marine_jwt_default_secret_key_2026",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  databaseUrl: process.env.DATABASE_URL,

  pfz: {
    timeoutMs: parseInt(process.env.PFZ_TIMEOUT_MS, 10) || 4000,
    sstSource: process.env.PFZ_SST_SOURCE || "open-meteo",
    chlorophyllSource: process.env.PFZ_CHLOROPHYLL_SOURCE || "baseline",
    fallbackEnabled: process.env.PFZ_FALLBACK_ENABLED !== "false",
  },

  incois: {
    baseUrl:
      process.env.INCOIS_ERDDAP_URL || "https://erddap.incois.gov.in/erddap",
    timeoutMs: parseInt(process.env.INCOIS_TIMEOUT_MS, 10) || 4000,
    fallbackEnabled: process.env.INCOIS_FALLBACK_ENABLED !== "false",
  },

  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",

  // Phase 1 — Nominatim geocoding proxy
  nominatim: {
    baseUrl:
      process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org",
    userAgent:
      process.env.NOMINATIM_USER_AGENT ||
      "ORCA-Marine-App/1.0 (https://github.com/Krushnakedar/Orca_Final_Sih)",
    email: process.env.NOMINATIM_EMAIL || "",
  },

  // Phase 1 — AISStream live vessel feed (backend-only, no VITE_ prefix)
  aisStream: {
    apiKey: process.env.AISSTREAM_API_KEY || null,
    // [[south, west], [north, east]]  default = Indian EEZ
    bounds: (() => {
      const raw = process.env.AISSTREAM_BOUNDS;
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.length === 2 &&
          Array.isArray(parsed[0]) &&
          parsed[0].length === 2 &&
          Array.isArray(parsed[1]) &&
          parsed[1].length === 2
        )
          return parsed;
      } catch {
        /* fall through */
      }
      return null;
    })(),
  },
};
