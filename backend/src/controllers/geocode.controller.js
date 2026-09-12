const nominatimService = require("../services/nominatimService");

/**
 * GET /api/geocode/search?q=...&limit=...
 */
const search = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    if (!q || String(q).trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query "q" must contain at least 2 characters.',
        results: [],
      });
    }

    const results = await nominatimService.search(q, { limit });

    return res.status(200).json({ success: true, results });
  } catch (error) {
    // Preserve transport errors so the frontend can show a real error state.
    if (error.status === 429 || error.status === 403) {
      return res.status(503).json({
        success: false,
        message:
          "Geocoding service is temporarily rate-limited. Please retry shortly.",
        results: [],
      });
    }
    return next(error);
  }
};

/**
 * GET /api/geocode/reverse?lat=&lon=
 */
const reverse = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    const latN = Number(lat);
    const lonN = Number(lon);
    if (!Number.isFinite(latN) || !Number.isFinite(lonN)) {
      return res.status(400).json({
        success: false,
        message: 'Valid "lat" and "lon" query parameters are required.',
        result: null,
      });
    }

    const result = await nominatimService.reverse(latN, lonN);
    return res.status(200).json({ success: true, result });
  } catch (error) {
    if (error.status === 429 || error.status === 403) {
      return res.status(503).json({
        success: false,
        message:
          "Geocoding service is temporarily rate-limited. Please retry shortly.",
        result: null,
      });
    }
    return next(error);
  }
};

module.exports = { search, reverse };
