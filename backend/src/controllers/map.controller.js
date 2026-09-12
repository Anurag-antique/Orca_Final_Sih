const GeofenceService = require("../services/geofence.service");

// Marine GIS layers endpoint.
//
// Layer sources:
//   protected / restricted / hazards / imbl  → GeofenceService registry (real reference geometry)
//   pfz                                     → served via /api/providers/pfz (see frontend providerService)
//   buoys / ports                           → no live source configured yet
//
// No fabricated features are returned. Layers without a live source expose
// `available: false` and a `reason` so the client can render a "no live data" state.

const getMapLayers = (req, res) => {
  const sector = req.query.sector || "all";

  const layers = {
    metadata: {
      datum: "WGS84",
      projection: "EPSG:4326",
      generatedAt: new Date().toISOString(),
      disclaimer:
        "Boundaries are reference geometries from the ORCA geofence registry. " +
        "Verify with the relevant authority before operational use.",
      sourceRegistry: "GeofenceService.getZonesDatabase()",
      requestedSector: sector,
    },

    // --- Layers without a live server-side source ---------------------------
    pfz: {
      type: "FeatureCollection",
      features: [],
      available: false,
      reason:
        "PFZ data is served via /api/providers/pfz. The frontend fetches it through providerService.getPFZs().",
    },
    buoys: {
      type: "FeatureCollection",
      features: [],
      available: false,
      reason:
        "No live ocean-buoy source is configured. INCOIS met-ocean buoy telemetry is not yet wired.",
    },
    ports: {
      type: "FeatureCollection",
      features: [],
      available: false,
      reason:
        "No live ports/landing-centres source is configured. INCOIS landing centres are available as an official WMS layer in the map UI.",
    },

    // --- Layers sourced from GeofenceService (populated below) --------------
    protected: { type: "FeatureCollection", features: [] },
    restricted: { type: "FeatureCollection", features: [] },
    hazards: { type: "FeatureCollection", features: [] },
    imbl: { type: "FeatureCollection", features: [] },
  };

  const zones = GeofenceService.getZonesDatabase();

  const layerMap = {
    protected: "marineProtectedAreas",
    restricted: "restrictedNavalZones",
    hazards: "submergedHazards",
    imbl: "internationalBoundaries",
  };

  for (const [key, sourceKey] of Object.entries(layerMap)) {
    const arr = Array.isArray(zones?.[sourceKey]) ? zones[sourceKey] : [];
    const features = arr
      .filter((z) => z && (z.coordinates || z.lineCoordinates))
      .map(({ coordinates, lineCoordinates, ...properties }) => ({
        type: "Feature",
        id: properties.id,
        properties,
        geometry: lineCoordinates
          ? {
              type: "LineString",
              coordinates: lineCoordinates.map(([lat, lon]) => [lon, lat]),
            }
          : {
              type: "Polygon",
              coordinates: [coordinates.map(([lat, lon]) => [lon, lat])],
            },
      }));

    layers[key] = { type: "FeatureCollection", features };
  }

  return res.status(200).json({
    success: true,
    data: layers,
    message: "Marine GIS layers retrieved successfully",
  });
};

module.exports = { getMapLayers };
