const thresholds = require('../thresholds');

class VisibilityRule {
  static evaluate(visibilityKm = 10.0, precipitationMm = 0) {
    const vis = parseFloat(visibilityKm) || 10.0;
    const rain = parseFloat(precipitationMm) || 0;

    let subScore = 10;
    let severity = 'LOW';
    let advisory = 'Good visibility (> 6 km). Normal visual coastal navigation possible.';

    if (vis < thresholds.VISIBILITY.POOR_KM || rain > 15.0) {
      subScore = 80;
      severity = 'HIGH';
      advisory = 'Heavy torrential rain / thick sea mist. Collision risk elevated. Use radar/GPS and foghorn.';
    } else if (vis < thresholds.VISIBILITY.MODERATE_KM || rain > 3.0) {
      subScore = 45;
      severity = 'MODERATE';
      advisory = 'Reduced visibility in coastal haze/rain showers. Maintain sharp lookout.';
    }

    return {
      ruleId: 'RULE_VISIBILITY_RAIN',
      factor: 'Atmospheric Visibility & Precipitation',
      measuredValue: `${vis.toFixed(1)} km (Rain: ${rain.toFixed(1)} mm)`,
      subScore,
      weight: thresholds.WEIGHTS.VISIBILITY,
      severity,
      advisory
    };
  }
}

module.exports = VisibilityRule;
