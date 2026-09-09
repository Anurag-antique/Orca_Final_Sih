const BaseProvider = require('../base/BaseProvider');
const IGeospatialProvider = require('./IGeospatialProvider');

class MockGeospatialProvider extends BaseProvider {
  constructor() {
    super('Mock-NHO-GIS-BoundaryProvider', 'GEOSPATIAL_ZONES', '1.0.0', true);
  }

  async getGeospatialZones(location) {
    try {
      const lat = parseFloat(location?.lat) || 18.9220;
      const lon = parseFloat(location?.lon) || 72.8347;

      const zones = {
        eezBoundary: {
          state: 'India (Western Exclusive Economic Zone)',
          distanceToTerritorialLimitKm: 22.2, // 12 NM
          distanceToContiguousLimitKm: 44.4,  // 24 NM
          distanceToEEZLimitKm: 370.4,        // 200 NM
        },
        restrictedZonesNearby: [
          {
            id: 'res_naval_01',
            name: 'Naval Offshore Exercise & Firing Perimeter',
            distanceKm: 18.5,
            severity: 'PROHIBITED',
            advisory: 'No entry for commercial or fishing vessels without naval clearance.'
          }
        ],
        marineProtectedAreasNearby: [
          {
            id: 'mpa_coral_01',
            name: 'Malvan / Angria Marine Sanctuary Buffer',
            distanceKm: 28.4,
            protectionStatus: 'Ecologically Sensitive Habitat (Coral Reef)',
            advisory: 'Strict ban on mechanized bottom trawling and coral damage.'
          }
        ],
        hazardZonesNearby: [
          {
            id: 'haz_reef_01',
            name: 'Prongs Reef Submerged Pinnacle Hazard',
            distanceKm: 8.2,
            severity: 'DANGEROUS_SHALLOW',
            depthLowTideM: 1.2,
            warning: 'Severe vessel grounding risk at low tide.'
          }
        ]
      };

      return this.standardizeResponse({
        queryLocation: { lat, lon },
        zones
      }, {
        dataset: 'National Hydrographic Office (NHO) Maritime Boundaries & Marine Protected Area Registry',
        origin: 'Ministry of Environment, Forest and Climate Change (MoEFCC) / Naval Hydrography',
        updateFrequency: 'Monthly / Notice to Mariners'
      });
    } catch (err) {
      return this.handleError(err, 'getGeospatialZones');
    }
  }
}

module.exports = MockGeospatialProvider;
