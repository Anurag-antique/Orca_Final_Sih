const BaseProvider = require("../base/BaseProvider");
const IPFZsProvider = require("./IPFZsProvider");

class MockPFZProvider extends BaseProvider {
  constructor() {
    super(
      "Mock-INCOIS-PFZ-AdvisoryProvider",
      "POTENTIAL_FISHING_ZONE",
      "1.0.0",
      true,
    );
  }

  async getPFZs(location, date = new Date()) {
    try {
      const lat = parseFloat(location?.lat) || 18.922;
      const lon = parseFloat(location?.lon) || 72.8347;

      const isKochi = lat < 12.0;

      const zones = isKochi
        ? [
            {
              id: "pfz_kerala_south_01",
              name: "Kochi Offshore Upwelling Zone Charlie",
              centerLat: 9.96,
              centerLon: 76.04,
              distanceKm: 18.4,
              bearingDegrees: 275,
              bearingCardinal: "W",
              confidenceRatingPct: 88,
              recommendationLabel: "Potentially Favourable Fishing Zone",
              seaSurfaceTempC: 28.1,
              chlorophyllConcentrationMgM3: 1.42,
              thermalGradientCPerKm: 0.12,
              targetSpecies: [
                "Oil Sardine (Sardinella longiceps)",
                "Indian Mackerel",
                "Squid (Loligo duvauceli)",
              ],
              depthRangeMeters: "30 - 48m",
              validUntil: new Date(Date.now() + 86400000).toISOString(),
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [75.98, 9.98],
                    [76.08, 10.02],
                    [76.12, 9.92],
                    [76.01, 9.88],
                    [75.98, 9.98],
                  ],
                ],
              },
            },
          ]
        : [
            {
              id: "pfz_mumbai_west_01",
              name: "Mumbai High Thermal Gradient Alpha",
              centerLat: 18.91,
              centerLon: 72.64,
              distanceKm: 16.2,
              bearingDegrees: 265,
              bearingCardinal: "W",
              confidenceRatingPct: 86,
              recommendationLabel: "Potentially Favourable Fishing Zone",
              seaSurfaceTempC: 27.6,
              chlorophyllConcentrationMgM3: 1.15,
              thermalGradientCPerKm: 0.09,
              targetSpecies: [
                "Indian Mackerel",
                "Carangids (Trevally)",
                "Seer Fish",
              ],
              depthRangeMeters: "35 - 52m",
              validUntil: new Date(Date.now() + 86400000).toISOString(),
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [72.58, 18.95],
                    [72.69, 18.98],
                    [72.72, 18.89],
                    [72.61, 18.85],
                    [72.58, 18.95],
                  ],
                ],
              },
            },
            {
              id: "pfz_alibaug_deeps_02",
              name: "Alibaug Continental Slope Zone Bravo",
              centerLat: 18.69,
              centerLon: 72.57,
              distanceKm: 23.8,
              bearingDegrees: 220,
              bearingCardinal: "SW",
              confidenceRatingPct: 79,
              recommendationLabel: "Potentially Favourable Fishing Zone",
              seaSurfaceTempC: 27.2,
              chlorophyllConcentrationMgM3: 0.94,
              thermalGradientCPerKm: 0.08,
              targetSpecies: ["Yellowfin Tuna", "Ribbonfish", "Anchovies"],
              depthRangeMeters: "45 - 65m",
              validUntil: new Date(Date.now() + 86400000).toISOString(),
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [72.5, 18.72],
                    [72.62, 18.76],
                    [72.65, 18.66],
                    [72.52, 18.62],
                    [72.5, 18.72],
                  ],
                ],
              },
            },
          ];

      return this.standardizeResponse(
        {
          queryLocation: { lat, lon },
          queryDate: new Date(date).toISOString(),
          zoneCount: zones.length,
          nearestZone: zones[0] || null,
          zones,
        },
        {
          dataset:
            "INCOIS Satellite Integrated PFZ Advisory & NOAA OceanColor Composite",
          origin: "Earth Observation Satellite (Oceansat / Sentinel-3 SLSTR)",
          updateFrequency: "Daily (Composite at 06:00 IST)",
        },
      );
    } catch (err) {
      return this.handleError(err, "getPFZs");
    }
  }
}

module.exports = MockPFZProvider;
