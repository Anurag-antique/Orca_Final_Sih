const BaseProvider = require("../base/BaseProvider");
const IGeospatialProvider = require("./IGeospatialProvider");
const GeofenceService = require("../../services/geofence.service");

/**
 * Real geospatial provider.
 *
 * Reference geometry (MPAs, naval zones, submerged hazards, IMBL) comes from
 * GeofenceService.getZonesDatabase() — the authoritative registry used by
 * the rest of the ORCA engine.
 *
 * All proximity distances are computed on demand from the query coordinates,
 * not returned from a lookup table.
 */
class RealGeospatialProvider extends BaseProvider {
  constructor() {
    super("Real-Geofence-RegistryProvider", "GEOSPATIAL_ZONES", "1.0.0", false);
  }

  async getGeospatialZones(location) {
    try {
      const lat = parseFloat(location?.lat);
      const lon = parseFloat(location?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        const err = new Error(
          "Geospatial lookup requires valid lat/lon coordinates.",
        );
        err.code = "INVALID_LOCATION";
        throw err;
      }

      const result = GeofenceService.checkLocation({ lat, lon });

      const zones = {
        // Status / alert level / description are computed by the service.
        status: result.status,
        alertLevel: result.alertLevel,
        statusDescription: result.statusDescription,

        // Legal constants (not fabricated — these are fixed by UNCLOS).
        eezBoundary: {
          distanceToTerritorialLimitKm: result.distanceToTerritorialLimitKm, // 22.2 km = 12 NM
        },

        // Proximity lists — only populated when the point is inside the buffer.
        restrictedZonesNearby: result.warningZones
          .filter((z) => z.type === "RESTRICTED_MILITARY")
          .map((z) => ({
            id: z.id,
            name: z.name,
            distanceKm: z.distanceKm,
            bearingDegrees: z.bearingDegrees,
            severity: z.severity,
            advisory: z.advisory,
          })),

        marineProtectedAreasNearby: result.warningZones
          .filter((z) => z.type === "MARINE_PROTECTED_AREA")
          .map((z) => ({
            id: z.id,
            name: z.name,
            distanceKm: z.distanceKm,
            bearingDegrees: z.bearingDegrees,
            severity: z.severity,
            advisory: z.advisory,
          })),

        hazardZonesNearby: result.warningZones
          .filter((z) => z.type === "SUBMERGED_REEF_HAZARD")
          .map((z) => ({
            id: z.id,
            name: z.name,
            distanceKm: z.distanceKm,
            bearingDegrees: z.bearingDegrees,
            severity: z.severity,
            advisory: z.advisory,
          })),

        breachedZones: result.breachedZones.map((z) => ({
          id: z.id,
          name: z.name,
          type: z.type,
          severity: z.severity,
          advisory: z.advisory,
        })),

        boundaryWarnings: result.boundaryWarnings.map((z) => ({
          id: z.id,
          name: z.name,
          distanceKm: z.distanceKm,
          bearingDegrees: z.bearingDegrees,
          severity: z.severity,
          advisory: z.advisory,
        })),
      };

      return this.standardizeResponse(
        { queryLocation: { lat, lon }, zones },
        {
          dataset: "ORCA Geofence Registry (MPAs, Naval Zones, Hazards, IMBL)",
          origin: "GeofenceService — Indian maritime reference geometry",
          updateFrequency:
            "Updated with Notice to Mariners / statutory amendments",
        },
      );
    } catch (err) {
      return this.handleError(err, "getGeospatialZones");
    }
  }
}

module.exports = RealGeospatialProvider;
