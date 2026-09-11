const GeofenceService = require('../services/geofence.service');
// GeoJSON datasets for Indian Coastal & Offshore waters (Western & Eastern EEZ)
const getMapLayers = (req, res) => {
  const sector = req.query.sector || 'all';

  const layers = {
    metadata: {
      datum: 'WGS84',
      projection: 'EPSG:4326',
      datasetVersion: '1.0.0-sih-demo',
      generatedAt: new Date().toISOString(),
      isDemoData: true,
      disclaimer: 'DEMO DATASET - Marine boundaries and PFZs are prototype representations for SIH 2026 decision support demonstration.'
    },

    // 1. Potential Fishing Zones (PFZ)
    pfz: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'pfz_mumbai_01',
          properties: {
            name: 'PFZ Sector Alpha - Mumbai Offshore',
            sector: 'Mumbai Coast',
            status: 'Active',
            confidence: 86,
            recommendation: 'Potentially Favourable Fishing Zone',
            sstCelsius: 27.6,
            chlorophyllMgM3: 1.15,
            distanceKm: 16.4,
            bearing: '265° W',
            depthMeters: '35 - 50m',
            validUntil: new Date(Date.now() + 86400000).toISOString(),
            source: 'Satellite SST & Chlorophyll-a Composite (Demo)',
            targetSpecies: ['Mackerel (Rastrelliger kanagurta)', 'Sardinella', 'Carangids'],
            isDemoData: true
          },
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
          type: 'Feature',
          id: 'pfz_mumbai_02',
          properties: {
            name: 'PFZ Sector Bravo - Alibaug Deeps',
            sector: 'Mumbai Coast',
            status: 'Active',
            confidence: 79,
            recommendation: 'Potentially Favourable Fishing Zone',
            sstCelsius: 27.2,
            chlorophyllMgM3: 0.94,
            distanceKm: 24.1,
            bearing: '220° SW',
            depthMeters: '45 - 65m',
            validUntil: new Date(Date.now() + 86400000).toISOString(),
            source: 'Thermal Front & Upwelling Model (Demo)',
            targetSpecies: ['Tuna (Thunnus albacares)', 'Ribbonfish', 'Anchovy'],
            isDemoData: true
          },
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
        },
        {
          type: 'Feature',
          id: 'pfz_kochi_01',
          properties: {
            name: 'PFZ Sector Charlie - Kochi Upwelling',
            sector: 'Kochi Harbor',
            status: 'Active',
            confidence: 88,
            recommendation: 'Potentially Favourable Fishing Zone',
            sstCelsius: 28.1,
            chlorophyllMgM3: 1.42,
            distanceKm: 18.8,
            bearing: '280° W',
            depthMeters: '30 - 45m',
            validUntil: new Date(Date.now() + 86400000).toISOString(),
            source: 'Coastal Upwelling & Chl-a Index (Demo)',
            targetSpecies: ['Oil Sardine', 'Indian Mackerel', 'Squid'],
            isDemoData: true
          },
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
      ]
    },

    // 2. Restricted & Security Zones
    restricted: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'res_naval_01',
          properties: {
            name: 'Naval Offshore Exercise & Firing Perimeter',
            category: 'Military / Defence Restriction',
            severity: 'HIGH_RISK',
            status: 'Active Restriction (No Entry)',
            authorizedAuthority: 'Indian Navy / Coast Guard',
            advisory: 'Strict prohibition on commercial and artisanal fishing vessels.',
            isDemoData: true
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.4200, 19.1200],
              [72.5600, 19.1400],
              [72.5800, 19.0400],
              [72.4400, 19.0200],
              [72.4200, 19.1200]
            ]]
          }
        },
        {
          type: 'Feature',
          id: 'res_port_01',
          properties: {
            name: 'Mumbai Port Trust Security & Fairway Channel',
            category: 'Commercial Shipping Lane & Anchorage',
            severity: 'MODERATE_RESTRICTION',
            status: 'Vessel Traffic Separation Scheme (TSS)',
            authorizedAuthority: 'Directorate General of Shipping / Port Trust',
            advisory: 'No stationary fishing or drift-netting within navigation channel.',
            isDemoData: true
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.7800, 18.9600],
              [72.8400, 18.9700],
              [72.8600, 18.8800],
              [72.8000, 18.8700],
              [72.7800, 18.9600]
            ]]
          }
        }
      ]
    },

    // 3. Marine Protected Areas (MPA)
    protected: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'mpa_coral_01',
          properties: {
            name: 'Malvan / Angria Marine Sanctuary Buffer (Demo)',
            category: 'Marine Protected Area (MPA)',
            protectionLevel: 'Ecologically Sensitive Sanctuary',
            governingLaw: 'Wildlife Protection Act / CRZ-I',
            advisory: 'Trawling and mechanized bottom dredging strictly prohibited to conserve coral reef biodiversity.',
            isDemoData: true
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.6400, 18.7800],
              [72.7400, 18.8000],
              [72.7600, 18.7300],
              [72.6600, 18.7100],
              [72.6400, 18.7800]
            ]]
          }
        },
        {
          type: 'Feature',
          id: 'mpa_turtle_01',
          properties: {
            name: 'Olive Ridley Coastal Breeding Conservation Zone',
            category: 'Endangered Species Protection',
            protectionLevel: 'Seasonal Seasonal Fishing Restriction',
            governingLaw: 'State Fisheries Regulation Act',
            advisory: 'Mandatory Turtle Excluder Devices (TED) required during breeding window.',
            isDemoData: true
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [76.1000, 9.8500],
              [76.2200, 9.8800],
              [76.2400, 9.7800],
              [76.1200, 9.7500],
              [76.1000, 9.8500]
            ]]
          }
        }
      ]
    },

    // 4. Marine Hazards
    hazards: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'haz_reef_01',
          properties: {
            name: 'Prongs Reef Submerged Pinnacle Hazard',
            hazardType: 'Shallow Submerged Rock / Shoal',
            severity: 'CRITICAL_NAVIGATION_HAZARD',
            depthAtLowestTideMeters: '1.2m',
            warning: 'Severe vessel grounding risk at low tide. Maintain minimum 1.5 NM clearing distance.',
            isDemoData: true
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.8050, 18.8850],
              [72.8250, 18.8950],
              [72.8350, 18.8750],
              [72.8120, 18.8650],
              [72.8050, 18.8850]
            ]]
          }
        },
        {
          type: 'Feature',
          id: 'haz_eddy_01',
          properties: {
            name: 'Offshore Rip-Current & Rip-Tide Turbulence Zone',
            hazardType: 'Oceanographic Hydrodynamic Hazard',
            severity: 'MODERATE_HAZARD',
            currentSpeedKnots: '3.8 kt',
            warning: 'Strong surface eddies and cross-seas during ebb tide.',
            isDemoData: true
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.5200, 18.9800],
              [72.6000, 19.0100],
              [72.6200, 18.9400],
              [72.5400, 18.9200],
              [72.5200, 18.9800]
            ]]
          }
        }
      ]
    },

    // 5. Ocean Data Buoys (Point Features)
    buoys: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'buoy_ad01',
          properties: {
            name: 'INCOIS Ocean Met-Ocean Buoy AD-01',
            stationId: 'OMNI-AD01-MUMBAI',
            type: 'Moored Met-Ocean Buoy',
            lat: 18.9600,
            lon: 72.5200,
            sstCelsius: 27.6,
            waveHeightM: 1.85,
            wavePeriodS: 7.4,
            windSpeedKt: 12.8,
            windDirection: '240° WSW',
            airPressureHpa: 1011.2,
            lastTelemetryAt: new Date(Date.now() - 900000).toISOString(),
            status: 'Operational',
            isDemoData: true
          },
          geometry: {
            type: 'Point',
            coordinates: [72.5200, 18.9600]
          }
        },
        {
          type: 'Feature',
          id: 'buoy_ad02',
          properties: {
            name: 'INCOIS Ocean Met-Ocean Buoy AD-02',
            stationId: 'OMNI-AD02-KOCHI',
            type: 'Moored Met-Ocean Buoy',
            lat: 9.9400,
            lon: 75.9200,
            sstCelsius: 28.2,
            waveHeightM: 1.6,
            wavePeriodS: 6.8,
            windSpeedKt: 10.4,
            windDirection: '275° W',
            airPressureHpa: 1010.5,
            lastTelemetryAt: new Date(Date.now() - 1200000).toISOString(),
            status: 'Operational',
            isDemoData: true
          },
          geometry: {
            type: 'Point',
            coordinates: [75.9200, 9.9400]
          }
        }
      ]
    },

    // 6. Coastal Landing Centers & Ports
    ports: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'port_sassoon',
          properties: {
            name: 'Sassoon Docks Marine Landing Terminal',
            category: 'Major Marine Fishery Harbor',
            state: 'Maharashtra',
            vesselCapacity: 850,
            facilities: ['Fuel Bunkering', 'Cold Storage (300 MT)', 'Ice Plants', 'Auction Hall'],
            coordinates: [72.8256, 18.9142],
            isDemoData: true
          },
          geometry: {
            type: 'Point',
            coordinates: [72.8256, 18.9142]
          }
        },
        {
          type: 'Feature',
          id: 'port_ferry_wharf',
          properties: {
            name: 'Bhaucha Dhakka / Ferry Wharf',
            category: 'Deep-Sea Trawler Harbor',
            state: 'Maharashtra',
            vesselCapacity: 620,
            facilities: ['Slipway Repair', 'Fresh Water', 'Fish Auction Yard'],
            coordinates: [72.8510, 18.9554],
            isDemoData: true
          },
          geometry: {
            type: 'Point',
            coordinates: [72.8510, 18.9554]
          }
        },
        {
          type: 'Feature',
          id: 'port_kochi_fh',
          properties: {
            name: 'Kochi Thoppumpady Fisheries Harbor',
            category: 'Major Coastal Harbor',
            state: 'Kerala',
            vesselCapacity: 700,
            facilities: ['Marine Engine Workshop', 'Exports Handling', 'Ice Plant'],
            coordinates: [76.2625, 9.9328],
            isDemoData: true
          },
          geometry: {
            type: 'Point',
            coordinates: [76.2625, 9.9328]
          }
        }
      ]
    }
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
    message: 'Marine GIS layers retrieved successfully'
  });
};

module.exports = {
  getMapLayers
};
