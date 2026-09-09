const GEOFENCE_DATABASE = {
  marineProtectedAreas: [
    {
      id: 'mpa_malvan',
      name: 'Malvan Marine Sanctuary',
      state: 'Maharashtra',
      type: 'MARINE_PROTECTED_AREA',
      severity: 'CRITICAL_LEGAL',
      coordinates: [
        [15.9800, 73.4000],
        [16.1200, 73.4000],
        [16.1200, 73.5500],
        [15.9800, 73.5500],
        [15.9800, 73.4000]
      ],
      bufferKm: 10.0,
      description: 'Coral reef ecosystem & marine turtle nesting zone. Commercial trawling prohibited.',
      penalty: 'Punishable under Wildlife Protection Act 1972 (Imprisonment up to 7 years + fine).'
    },
    {
      id: 'mpa_gulf_of_mannar',
      name: 'Gulf of Mannar Marine National Park',
      state: 'Tamil Nadu',
      type: 'MARINE_PROTECTED_AREA',
      severity: 'CRITICAL_LEGAL',
      coordinates: [
        [8.7500, 78.1000],
        [9.2500, 78.9000],
        [9.1000, 79.2000],
        [8.6000, 78.4000],
        [8.7500, 78.1000]
      ],
      bufferKm: 10.0,
      description: 'Dugong habitat & coral reef biosphere reserve. Strict no-trawl zone.',
      penalty: 'Vessel seizure and cancellation of state fishing license.'
    },
    {
      id: 'mpa_gulf_of_kutch',
      name: 'Marine National Park, Gulf of Kutch',
      state: 'Gujarat',
      type: 'MARINE_PROTECTED_AREA',
      severity: 'CRITICAL_LEGAL',
      coordinates: [
        [22.4000, 69.1000],
        [22.7500, 69.8000],
        [22.5500, 70.0500],
        [22.2500, 69.3000],
        [22.4000, 69.1000]
      ],
      bufferKm: 10.0,
      description: 'Mangrove and coral eco-sensitive perimeter. Mechanized fishing prohibited.',
      penalty: 'Heavy statutory fines and vessel impoundment.'
    }
  ],

  restrictedNavalZones: [
    {
      id: 'nav_mumbai_firing',
      name: 'INS Trata Naval Firing Perimeter',
      state: 'Maharashtra Offshore',
      type: 'RESTRICTED_MILITARY',
      severity: 'LIFE_SAFETY_CRITICAL',
      coordinates: [
        [18.7000, 72.4000],
        [18.9500, 72.4000],
        [18.9500, 72.6500],
        [18.7000, 72.6500],
        [18.7000, 72.4000]
      ],
      bufferKm: 12.0,
      description: 'Active Indian Navy surface gunnery & live missile firing exercise zone.',
      penalty: 'Severe life hazard from live munitions. Immediate evasive heading required.'
    },
    {
      id: 'nav_kochi_exercise',
      name: 'Southern Naval Command Submarine Transit Channel',
      state: 'Kerala Offshore',
      type: 'RESTRICTED_MILITARY',
      severity: 'LIFE_SAFETY_CRITICAL',
      coordinates: [
        [9.8000, 75.9000],
        [10.0500, 75.9000],
        [10.0500, 76.1500],
        [9.8000, 76.1500],
        [9.8000, 75.9000]
      ],
      bufferKm: 10.0,
      description: 'Naval submarine approach corridor. Surface navigation restricted.',
      penalty: 'Collision hazard with submerged naval vessels.'
    }
  ],

  submergedHazards: [
    {
      id: 'haz_angria_bank',
      name: 'Angria Bank Submerged Coral Atoll & Shallow Shoal',
      state: 'Arabian Sea (105 km offshore)',
      type: 'SUBMERGED_REEF_HAZARD',
      severity: 'VESSEL_GROUNDING_HAZARD',
      coordinates: [
        [16.5000, 71.9500],
        [16.8000, 71.9500],
        [16.8000, 72.2500],
        [16.5000, 72.2500],
        [16.5000, 71.9500]
      ],
      bufferKm: 8.0,
      minDepthMeters: 9.0,
      description: 'Submerged plateau rising rapidly from 400m depths to 9m shallow pinnacle. Extreme grounding hazard for deep-draft vessels.',
      penalty: 'Severe vessel hull breach and stranding.'
    }
  ],

  internationalBoundaries: [
    {
      id: 'imbl_sir_creek',
      name: 'India-Pakistan International Maritime Boundary Line (Sir Creek)',
      state: 'Gujarat / Northern Arabian Sea',
      type: 'INTERNATIONAL_BORDER',
      severity: 'BORDER_SECURITY_CRITICAL',
      lineCoordinates: [
        [23.6000, 68.0000],
        [23.3000, 67.5000],
        [22.8000, 66.8000]
      ],
      bufferKm: 20.0,
      description: 'International Maritime Boundary Line (IMBL). Crossing into foreign EEZ is strictly prohibited.',
      penalty: 'Apprehension by foreign maritime security agencies and confiscation of vessel.'
    },
    {
      id: 'imbl_palk_strait',
      name: 'India-Sri Lanka International Maritime Boundary Line (Palk Strait)',
      state: 'Tamil Nadu / Palk Bay',
      type: 'INTERNATIONAL_BORDER',
      severity: 'BORDER_SECURITY_CRITICAL',
      lineCoordinates: [
        [10.0800, 79.8500],
        [9.5000, 79.5500],
        [9.1000, 79.3500]
      ],
      bufferKm: 15.0,
      description: 'IMBL boundary under 1974 bilateral maritime agreement. High surveillance perimeter.',
      penalty: 'Apprehension by Sri Lankan Navy for unauthorized border transgression.'
    }
  ]
};

// Haversine Distance Helper in Kilometers
const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Compute Bearing in Degrees
const calculateBearingDegrees = (lat1, lon1, lat2, lon2) => {
  const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return Math.round((brng + 360) % 360);
};

// Ray-Casting Algorithm for Point-in-Polygon Check
const isPointInPolygon = (lat, lon, polygonCoords) => {
  let inside = false;
  for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
    const xi = polygonCoords[i][1], yi = polygonCoords[i][0];
    const xj = polygonCoords[j][1], yj = polygonCoords[j][0];

    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Closest Point on Segment
const getClosestPointOnSegment = (pLat, pLon, aLat, aLon, bLat, bLon) => {
  const dx = bLon - aLon;
  const dy = bLat - aLat;

  if (dx === 0 && dy === 0) {
    return [aLat, aLon];
  }

  const t = Math.max(0, Math.min(1, ((pLon - aLon) * dx + (pLat - aLat) * dy) / (dx * dx + dy * dy)));
  return [aLat + t * dy, aLon + t * dx];
};

// Accurate Distance from Point to Polygon Edges
const getDistanceToPolygon = (lat, lon, polygonCoords) => {
  let minDistance = Infinity;
  let nearestPoint = polygonCoords[0];

  for (let i = 0; i < polygonCoords.length - 1; i++) {
    const p1 = polygonCoords[i];
    const p2 = polygonCoords[i + 1];
    const closest = getClosestPointOnSegment(lat, lon, p1[0], p1[1], p2[0], p2[1]);
    const d = calculateHaversineKm(lat, lon, closest[0], closest[1]);
    if (d < minDistance) {
      minDistance = d;
      nearestPoint = closest;
    }
  }

  const bearing = calculateBearingDegrees(lat, lon, nearestPoint[0], nearestPoint[1]);
  return { distanceKm: parseFloat(minDistance.toFixed(2)), bearing };
};

class GeofenceService {
  static getZonesDatabase() {
    return GEOFENCE_DATABASE;
  }

  static checkLocation({ lat, lon, vesselHeading = 0, vesselSpeedKnots = 8.0 }) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Valid lat and lon coordinates are required');
    }

    const breachedZones = [];
    const warningZones = [];

    const allPolygons = [
      ...GEOFENCE_DATABASE.marineProtectedAreas,
      ...GEOFENCE_DATABASE.restrictedNavalZones,
      ...GEOFENCE_DATABASE.submergedHazards
    ];

    // 1. Audit Polygon Zones
    for (const zone of allPolygons) {
      const isInside = isPointInPolygon(latitude, longitude, zone.coordinates);
      const { distanceKm, bearing } = getDistanceToPolygon(latitude, longitude, zone.coordinates);

      if (isInside) {
        breachedZones.push({
          ...zone,
          status: 'ACTIVE_BREACH',
          distanceKm: 0,
          bearingDegrees: 0,
          advisory: `CRITICAL ALERT: Vessel is currently INSIDE ${zone.name}. Alter course immediately.`
        });
      } else if (distanceKm <= zone.bufferKm) {
        warningZones.push({
          ...zone,
          status: 'PROXIMITY_WARNING',
          distanceKm,
          bearingDegrees: bearing,
          advisory: `PROXIMITY NOTICE: ${zone.name} is ${distanceKm} km away (Bearing ${bearing}°). Maintain minimum ${zone.bufferKm} km safety clearance.`
        });
      }
    }

    // 2. Audit International Maritime Boundaries (IMBL)
    const boundaryWarnings = [];
    for (const border of GEOFENCE_DATABASE.internationalBoundaries) {
      let minBorderDist = Infinity;
      let nearestCoord = border.lineCoordinates[0];

      for (let i = 0; i < border.lineCoordinates.length - 1; i++) {
        const p1 = border.lineCoordinates[i];
        const p2 = border.lineCoordinates[i + 1];
        const closest = getClosestPointOnSegment(latitude, longitude, p1[0], p1[1], p2[0], p2[1]);
        const d = calculateHaversineKm(latitude, longitude, closest[0], closest[1]);
        if (d < minBorderDist) {
          minBorderDist = d;
          nearestCoord = closest;
        }
      }

      const bearing = calculateBearingDegrees(latitude, longitude, nearestCoord[0], nearestCoord[1]);
      const distFormatted = parseFloat(minBorderDist.toFixed(2));

      if (distFormatted <= border.bufferKm) {
        boundaryWarnings.push({
          ...border,
          distanceKm: distFormatted,
          bearingDegrees: bearing,
          advisory: `BORDER ALERT: Vessel is ${distFormatted} km from the ${border.name}. Risk of international border breach.`
        });
      }
    }

    // 3. Overall Geofence Status Determination
    let status = 'CLEAR_SAFE';
    let alertLevel = 'LOW';
    let statusDescription = 'Vessel is in unrestricted waters. Clear of MPAs, naval firing zones, and international borders.';

    if (breachedZones.length > 0) {
      status = 'CRITICAL_BREACH';
      alertLevel = 'CRITICAL';
      statusDescription = `ILLEGAL ENTRY DETECTED: Vessel is currently inside ${breachedZones.map(z => z.name).join(', ')}.`;
    } else if (boundaryWarnings.length > 0) {
      status = 'BORDER_BUFFER_WARNING';
      alertLevel = 'HIGH';
      statusDescription = `BORDER PROXIMITY WARNING: Approaching ${boundaryWarnings[0].name} (${boundaryWarnings[0].distanceKm} km).`;
    } else if (warningZones.length > 0) {
      status = 'PROXIMITY_WARNING';
      alertLevel = 'MODERATE';
      statusDescription = `ZONE PROXIMITY: Operating within safety buffer of ${warningZones[0].name} (${warningZones[0].distanceKm} km).`;
    }

    // 4. Steerage Corrections
    const navigationAdvice = [];
    if (status === 'CRITICAL_BREACH') {
      navigationAdvice.push('Execute immediate 180° turn toward open territorial waters.', 'Cease all fishing, trawling, or anchoring activity immediately.');
    } else if (status === 'BORDER_BUFFER_WARNING') {
      navigationAdvice.push('Alter heading immediately to steer parallel to coast.', 'Do not drift past the international maritime line.');
    } else if (status === 'PROXIMITY_WARNING') {
      navigationAdvice.push('Maintain lookout and verify navigational waypoints.', 'Ensure safe clearance from restricted perimeter.');
    } else {
      navigationAdvice.push('Standard navigational course clear. Maintain continuous GPS tracking.');
    }

    return {
      status,
      alertLevel,
      statusDescription,
      vesselPosition: { lat: latitude, lon: longitude, vesselHeading, vesselSpeedKnots },
      breachedZones,
      warningZones,
      boundaryWarnings,
      navigationAdvice,
      distanceToTerritorialLimitKm: 22.2,
      evaluatedAt: new Date().toISOString()
    };
  }
}

module.exports = GeofenceService;
