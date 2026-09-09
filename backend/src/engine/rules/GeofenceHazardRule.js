const thresholds = require('../thresholds');

class GeofenceHazardRule {
  static evaluate(geospatialData = {}) {
    const restrictedNearby = geospatialData.restrictedZonesNearby || [];
    const hazardsNearby = geospatialData.hazardZonesNearby || [];

    let subScore = 10;
    let severity = 'LOW';
    let advisory = 'Clear of known submerged pinnacles, firing perimeters, and boundary buffers.';

    const closestHazard = hazardsNearby[0];
    const closestRestricted = restrictedNearby[0];

    if (closestHazard && closestHazard.distanceKm < 5.0) {
      subScore = 75;
      severity = 'HIGH';
      advisory = `Proximity hazard: ${closestHazard.name} is ${closestHazard.distanceKm} km away. Shallow water vessel grounding hazard.`;
    } else if (closestRestricted && closestRestricted.distanceKm < 10.0) {
      subScore = 55;
      severity = 'MODERATE';
      advisory = `Proximity notice: ${closestRestricted.name} is within ${closestRestricted.distanceKm} km. Do not enter military exercise zone.`;
    }

    return {
      ruleId: 'RULE_GEOFENCE_PROXIMITY_HAZARD',
      factor: 'Proximity to Navigation Hazards / Boundaries',
      measuredValue: closestHazard ? `${closestHazard.distanceKm} km to ${closestHazard.name}` : 'Clear (> 10 km)',
      subScore,
      weight: thresholds.WEIGHTS.GEOFENCE_HAZARD,
      severity,
      advisory
    };
  }
}

module.exports = GeofenceHazardRule;
