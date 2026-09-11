const GeofenceService = require('../services/geofence.service');
// GeoJSON datasets for Indian Coastal & Offshore waters (Western & Eastern EEZ)
const getMapLayers = (req, res) => {
  const sector = req.query.sector || "all";

  const layers = {
    metadata: {
      datum: "WGS84",
      projection: "EPSG:4326",
      datasetVersion: "1.0.0-sih-demo",
      generatedAt: new Date().toISOString(),
      isDemoData: true,
      disclaimer:
        "DEMO DATASET - Marine boundaries and PFZs are prototype representations for SIH 2026 decision support demonstration.",
    },

    // 1. Potential Fishing Zones (PFZ)
    pfz: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "pfz_mumbai_01",
          properties: {
            name: "PFZ Sector Alpha - Mumbai Offshore",
            sector: "Mumbai Coast",
            status: "Active",
            confidence: 86,
            recommendation: "Potentially Favourable Fishing Zone",
            sstCelsius: 27.6,
            chlorophyllMgM3: 1.15,
            distanceKm: 16.4,
            bearing: "265° W",
            depthMeters: "35 - 50m",
            validUntil: new Date(Date.now() + 86400000).toISOString(),
            source: "Satellite SST & Chlorophyll-a Composite (Demo)",
            targetSpecies: [
              "Mackerel (Rastrelliger kanagurta)",
              "Sardinella",
              "Carangids",
            ],
            isDemoData: true,
          },
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
          type: "Feature",
          id: "pfz_mumbai_02",
          properties: {
            name: "PFZ Sector Bravo - Alibaug Deeps",
            sector: "Mumbai Coast",
            status: "Active",
            confidence: 79,
            recommendation: "Potentially Favourable Fishing Zone",
            sstCelsius: 27.2,
            chlorophyllMgM3: 0.94,
            distanceKm: 24.1,
            bearing: "220° SW",
            depthMeters: "45 - 65m",
            validUntil: new Date(Date.now() + 86400000).toISOString(),
            source: "Thermal Front & Upwelling Model (Demo)",
            targetSpecies: [
              "Tuna (Thunnus albacares)",
              "Ribbonfish",
              "Anchovy",
            ],
            isDemoData: true,
          },
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
        {
          type: "Feature",
          id: "pfz_kochi_01",
          properties: {
            name: "PFZ Sector Charlie - Kochi Upwelling",
            sector: "Kochi Harbor",
            status: "Active",
            confidence: 88,
            recommendation: "Potentially Favourable Fishing Zone",
            sstCelsius: 28.1,
            chlorophyllMgM3: 1.42,
            distanceKm: 18.8,
            bearing: "280° W",
            depthMeters: "30 - 45m",
            validUntil: new Date(Date.now() + 86400000).toISOString(),
            source: "Coastal Upwelling & Chl-a Index (Demo)",
            targetSpecies: ["Oil Sardine", "Indian Mackerel", "Squid"],
            isDemoData: true,
          },
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
      ],
    },

    // 2. Restricted & Security Zones
    restricted: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "res_naval_01",
          properties: {
            name: "Naval Offshore Exercise & Firing Perimeter",
            category: "Military / Defence Restriction",
            severity: "HIGH_RISK",
            status: "Active Restriction (No Entry)",
            authorizedAuthority: "Indian Navy / Coast Guard",
            advisory:
              "Strict prohibition on commercial and artisanal fishing vessels.",
            isDemoData: true,
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [72.42, 19.12],
                [72.56, 19.14],
                [72.58, 19.04],
                [72.44, 19.02],
                [72.42, 19.12],
              ],
            ],
          },
        },
        {
          type: "Feature",
          id: "res_port_01",
          properties: {
            name: "Mumbai Port Trust Security & Fairway Channel",
            category: "Commercial Shipping Lane & Anchorage",
            severity: "MODERATE_RESTRICTION",
            status: "Vessel Traffic Separation Scheme (TSS)",
            authorizedAuthority: "Directorate General of Shipping / Port Trust",
            advisory:
              "No stationary fishing or drift-netting within navigation channel.",
            isDemoData: true,
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [72.78, 18.96],
                [72.84, 18.97],
                [72.86, 18.88],
                [72.8, 18.87],
                [72.78, 18.96],
              ],
            ],
          },
        },
      ],
    },

    // 3. Marine Protected Areas (MPA)
    protected: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "mpa_coral_01",
          properties: {
            name: "Malvan / Angria Marine Sanctuary Buffer (Demo)",
            category: "Marine Protected Area (MPA)",
            protectionLevel: "Ecologically Sensitive Sanctuary",
            governingLaw: "Wildlife Protection Act / CRZ-I",
            advisory:
              "Trawling and mechanized bottom dredging strictly prohibited to conserve coral reef biodiversity.",
            isDemoData: true,
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [72.64, 18.78],
                [72.74, 18.8],
                [72.76, 18.73],
                [72.66, 18.71],
                [72.64, 18.78],
              ],
            ],
          },
        },
        {
          type: "Feature",
          id: "mpa_turtle_01",
          properties: {
            name: "Olive Ridley Coastal Breeding Conservation Zone",
            category: "Endangered Species Protection",
            protectionLevel: "Seasonal Seasonal Fishing Restriction",
            governingLaw: "State Fisheries Regulation Act",
            advisory:
              "Mandatory Turtle Excluder Devices (TED) required during breeding window.",
            isDemoData: true,
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [76.1, 9.85],
                [76.22, 9.88],
                [76.24, 9.78],
                [76.12, 9.75],
                [76.1, 9.85],
              ],
            ],
          },
        },
      ],
    },

    // 4. Marine Hazards
    hazards: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "haz_reef_01",
          properties: {
            name: "Prongs Reef Submerged Pinnacle Hazard",
            hazardType: "Shallow Submerged Rock / Shoal",
            severity: "CRITICAL_NAVIGATION_HAZARD",
            depthAtLowestTideMeters: "1.2m",
            warning:
              "Severe vessel grounding risk at low tide. Maintain minimum 1.5 NM clearing distance.",
            isDemoData: true,
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [72.805, 18.885],
                [72.825, 18.895],
                [72.835, 18.875],
                [72.812, 18.865],
                [72.805, 18.885],
              ],
            ],
          },
        },
        {
          type: "Feature",
          id: "haz_eddy_01",
          properties: {
            name: "Offshore Rip-Current & Rip-Tide Turbulence Zone",
            hazardType: "Oceanographic Hydrodynamic Hazard",
            severity: "MODERATE_HAZARD",
            currentSpeedKnots: "3.8 kt",
            warning: "Strong surface eddies and cross-seas during ebb tide.",
            isDemoData: true,
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [72.52, 18.98],
                [72.6, 19.01],
                [72.62, 18.94],
                [72.54, 18.92],
                [72.52, 18.98],
              ],
            ],
          },
        },
      ],
    },

    // 5. Ocean Data Buoys (Point Features)
    buoys: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "buoy_ad01",
          properties: {
            name: "INCOIS Ocean Met-Ocean Buoy AD-01",
            stationId: "OMNI-AD01-MUMBAI",
            type: "Moored Met-Ocean Buoy",
            lat: 18.96,
            lon: 72.52,
            sstCelsius: 27.6,
            waveHeightM: 1.85,
            wavePeriodS: 7.4,
            windSpeedKt: 12.8,
            windDirection: "240° WSW",
            airPressureHpa: 1011.2,
            lastTelemetryAt: new Date(Date.now() - 900000).toISOString(),
            status: "Operational",
            isDemoData: true,
          },
          geometry: {
            type: "Point",
            coordinates: [72.52, 18.96],
          },
        },
        {
          type: "Feature",
          id: "buoy_ad02",
          properties: {
            name: "INCOIS Ocean Met-Ocean Buoy AD-02",
            stationId: "OMNI-AD02-KOCHI",
            type: "Moored Met-Ocean Buoy",
            lat: 9.94,
            lon: 75.92,
            sstCelsius: 28.2,
            waveHeightM: 1.6,
            wavePeriodS: 6.8,
            windSpeedKt: 10.4,
            windDirection: "275° W",
            airPressureHpa: 1010.5,
            lastTelemetryAt: new Date(Date.now() - 1200000).toISOString(),
            status: "Operational",
            isDemoData: true,
          },
          geometry: {
            type: "Point",
            coordinates: [75.92, 9.94],
          },
        },
      ],
    },

    // 6. Coastal Landing Centers & Ports
    ports: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "port_sassoon",
          properties: {
            name: "Sassoon Docks Marine Landing Terminal",
            category: "Major Marine Fishery Harbor",
            state: "Maharashtra",
            vesselCapacity: 850,
            facilities: [
              "Fuel Bunkering",
              "Cold Storage (300 MT)",
              "Ice Plants",
              "Auction Hall",
            ],
            coordinates: [72.8256, 18.9142],
            isDemoData: true,
          },
          geometry: {
            type: "Point",
            coordinates: [72.8256, 18.9142],
          },
        },
        {
          type: "Feature",
          id: "port_ferry_wharf",
          properties: {
            name: "Bhaucha Dhakka / Ferry Wharf",
            category: "Deep-Sea Trawler Harbor",
            state: "Maharashtra",
            vesselCapacity: 620,
            facilities: ["Slipway Repair", "Fresh Water", "Fish Auction Yard"],
            coordinates: [72.851, 18.9554],
            isDemoData: true,
          },
          geometry: {
            type: "Point",
            coordinates: [72.851, 18.9554],
          },
        },
        {
          type: "Feature",
          id: "port_kochi_fh",
          properties: {
            name: "Kochi Thoppumpady Fisheries Harbor",
            category: "Major Coastal Harbor",
            state: "Kerala",
            vesselCapacity: 700,
            facilities: [
              "Marine Engine Workshop",
              "Exports Handling",
              "Ice Plant",
            ],
            coordinates: [76.2625, 9.9328],
            isDemoData: true,
          },
          geometry: {
            type: "Point",
            coordinates: [76.2625, 9.9328],
          },
        },
      ],
    },
  };

  // Reuse the exact demonstration boundaries evaluated by the simulator.
  const zones = GeofenceService.getZonesDatabase();
  for (const [key, source] of Object.entries({ protected: 'marineProtectedAreas', restricted: 'restrictedNavalZones', hazards: 'submergedHazards', imbl: 'internationalBoundaries' })) {
    const features = zones[source].map(({ coordinates, lineCoordinates, ...properties }) => ({
      type: 'Feature', id: properties.id,
      properties: { ...properties, isDemoData: true },
      geometry: lineCoordinates
        ? { type: 'LineString', coordinates: lineCoordinates.map(([lat, lon]) => [lon, lat]) }
        : { type: 'Polygon', coordinates: [coordinates.map(([lat, lon]) => [lon, lat])] }
    }));
    layers[key] = { type: 'FeatureCollection', features: [...(layers[key]?.features || []), ...features] };
  }

  return res.status(200).json({
    success: true,
    data: layers,
    message: "Marine GIS layers retrieved successfully",
  });
};

module.exports = {
  getMapLayers,
};
