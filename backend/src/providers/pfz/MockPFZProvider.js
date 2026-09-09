const BaseProvider = require('../base/BaseProvider');
const IPFZsProvider = require('./IPFZsProvider');

class MockPFZProvider extends BaseProvider {
  constructor() {
    super('Mock-INCOIS-PFZ-AdvisoryProvider', 'POTENTIAL_FISHING_ZONE', '1.0.0', true);
  }

  async getPFZs(location, date = new Date()) {
    try {
      const lat = parseFloat(location?.lat) || 18.9220;
      const lon = parseFloat(location?.lon) || 72.8347;

      const isKochi = lat < 12.0;

      const zones = isKochi ? [
        {
          id: 'pfz_kerala_south_01',
          name: 'Kochi Offshore Upwelling Zone Charlie',
          centerLat: 9.9600,
          centerLon: 76.0400,
          distanceKm: 18.4,
          bearingDegrees: 275,
          bearingCardinal: 'W',
          confidenceRatingPct: 88,
          recommendationLabel: 'Potentially Favourable Fishing Zone',
          seaSurfaceTempC: 28.1,
          chlorophyllConcentrationMgM3: 1.42,
          thermalGradientCPerKm: 0.12,
          targetSpecies: ['Oil Sardine (Sardinella longiceps)', 'Indian Mackerel', 'Squid (Loligo duvauceli)'],
          depthRangeMeters: '30 - 48m',
          validUntil: new Date(Date.now() + 86400000).toISOString(),
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [75.9800, 9.9800],
              [76.0800, 10.0200],
              [76.1200, 9.9200],
              [76.0100, 9.8800],
              [75.9800, 9.9800]
            ]]
          }
        }
      ] : [
        {
          id: 'pfz_mumbai_west_01',
          name: 'Mumbai High Thermal Gradient Alpha',
          centerLat: 18.9100,
          centerLon: 72.6400,
          distanceKm: 16.2,
          bearingDegrees: 265,
          bearingCardinal: 'W',
          confidenceRatingPct: 86,
          recommendationLabel: 'Potentially Favourable Fishing Zone',
          seaSurfaceTempC: 27.6,
          chlorophyllConcentrationMgM3: 1.15,
          thermalGradientCPerKm: 0.09,
          targetSpecies: ['Indian Mackerel', 'Carangids (Trevally)', 'Seer Fish'],
          depthRangeMeters: '35 - 52m',
          validUntil: new Date(Date.now() + 86400000).toISOString(),
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.5800, 18.9500],
              [72.6900, 18.9800],
              [72.7200, 18.8900],
              [72.6100, 18.8500],
              [72.5800, 18.9500]
            ]]
          }
        },
        {
          id: 'pfz_alibaug_deeps_02',
          name: 'Alibaug Continental Slope Zone Bravo',
          centerLat: 18.6900,
          centerLon: 72.5700,
          distanceKm: 23.8,
          bearingDegrees: 220,
          bearingCardinal: 'SW',
          confidenceRatingPct: 79,
          recommendationLabel: 'Potentially Favourable Fishing Zone',
          seaSurfaceTempC: 27.2,
          chlorophyllConcentrationMgM3: 0.94,
          thermalGradientCPerKm: 0.08,
          targetSpecies: ['Yellowfin Tuna', 'Ribbonfish', 'Anchovies'],
          depthRangeMeters: '45 - 65m',
          validUntil: new Date(Date.now() + 86400000).toISOString(),
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.5000, 18.7200],
              [72.6200, 18.7600],
              [72.6500, 18.6600],
              [72.5200, 18.6200],
              [72.5000, 18.7200]
            ]]
          }
        }
      ];

      return this.standardizeResponse({
        queryLocation: { lat, lon },
        queryDate: new Date(date).toISOString(),
        zoneCount: zones.length,
        nearestZone: zones[0] || null,
        zones
      }, {
        dataset: 'INCOIS Satellite Integrated PFZ Advisory & NOAA OceanColor Composite',
        origin: 'Earth Observation Satellite (Oceansat / Sentinel-3 SLSTR)',
        updateFrequency: 'Daily (Composite at 06:00 IST)'
      });
    } catch (err) {
      return this.handleError(err, 'getPFZs');
    }
  }
}

module.exports = MockPFZProvider;
