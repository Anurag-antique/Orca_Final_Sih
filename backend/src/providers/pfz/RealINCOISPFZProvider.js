const BaseProvider = require("../base/BaseProvider");
const config = require("../../config");
const incoisDataService = require("../../services/incoisDataService");
const MockPFZProvider = require("./MockPFZProvider");

class RealINCOISPFZProvider extends BaseProvider {
  constructor() {
    super(
      "ORCA-INCOIS-PFZ-LiveProvider",
      "POTENTIAL_FISHING_ZONE",
      "1.0.0",
      false,
    );
    this.mockProvider = new MockPFZProvider();
  }

  async getPFZs(location, date = new Date()) {
    const lat = parseFloat(location?.lat) || 18.922;
    const lon = parseFloat(location?.lon) || 72.8347;

    try {
      const params = await incoisDataService.fetchAllParameters(lat, lon);

      if (!params.sst && !params.chlorophyll) {
        throw new Error("No INCOIS parameters available");
      }

      const liveSst = params.sst ? params.sst.value : null;
      const liveChl = params.chlorophyll ? params.chlorophyll.value : null;

      const zones = this._buildZones(lat, lon, liveSst, liveChl);

      const provenance = {
        sst: params.sst
          ? {
              datasetId: params.sst.datasetId,
              timestamp: params.sst.dataTimestamp,
              value: params.sst.value,
              unit: params.sst.unit,
              temporalRange: params.sst.temporalRange,
            }
          : { mode: "unavailable" },
        chlorophyll: params.chlorophyll
          ? {
              datasetId: params.chlorophyll.datasetId,
              timestamp: params.chlorophyll.dataTimestamp,
              value: params.chlorophyll.value,
              unit: params.chlorophyll.unit,
              temporalRange: params.chlorophyll.temporalRange,
            }
          : { mode: "unavailable" },
      };

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
            "INCOIS ERDDAP - NOAA AVHRR SST + Oceansat-2 OCM Chlorophyll (ARCHIVAL)",
          origin: "INCOIS ERDDAP Server (erddap.incois.gov.in)",
          updateFrequency: "Static archive",
          mode: "incois-archive",
          isFallback: false,
          sstMode: params.sst ? "archive" : "unavailable",
          chlorophyllMode: params.chlorophyll ? "archive" : "unavailable",
          thermalGradientMode: "demo",
          provenance,
          note: "INCOIS ERDDAP provides archival data (SST: 2002-2011, CHL: 2011-2020), not real-time.",
        },
      );
    } catch (err) {
      console.warn("[RealINCOISPFZProvider] INCOIS fetch failed:", err.message);

      if (!config.incois.fallbackEnabled) {
        throw err;
      }

      const fallback = await this.mockProvider.getPFZs(location, date);

      if (fallback && fallback.source) {
        fallback.source.mode = "fallback";
        fallback.source.isFallback = true;
        fallback.source.isDemoData = true;
      }

      return fallback;
    }
  }

  _buildZones(lat, lon, liveSst, liveChl) {
    const isKochi = lat < 12.0;
    const fallbackChl = 0.95;

    // Use archival SST or fall back to template values
    const sstMumbai = liveSst != null ? liveSst : 27.6;
    const sstAlibaug = liveSst != null ? liveSst - 0.4 : 27.2;
    const sstKochi = liveSst != null ? liveSst + 0.2 : 28.1;

    const chl = liveChl != null ? liveChl : fallbackChl;

    if (isKochi) {
      return [
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
          seaSurfaceTempC: parseFloat(sstKochi.toFixed(1)),
          chlorophyllConcentrationMgM3: parseFloat(chl.toFixed(2)),
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
      ];
    }

    return [
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
        seaSurfaceTempC: parseFloat(sstMumbai.toFixed(1)),
        chlorophyllConcentrationMgM3: parseFloat(chl.toFixed(2)),
        thermalGradientCPerKm: 0.09,
        targetSpecies: ["Indian Mackerel", "Carangids (Trevally)", "Seer Fish"],
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
        seaSurfaceTempC: parseFloat(sstAlibaug.toFixed(1)),
        chlorophyllConcentrationMgM3: parseFloat(chl.toFixed(2)),
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
  }
}

module.exports = RealINCOISPFZProvider;
