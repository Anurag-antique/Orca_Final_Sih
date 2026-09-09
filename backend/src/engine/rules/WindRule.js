const thresholds = require('../thresholds');

class WindRule {
  static evaluate(windSpeedKmh, windGustsKmh = 0) {
    const speed = parseFloat(windSpeedKmh) || 0;
    const gusts = parseFloat(windGustsKmh) || speed * 1.25;
    const effectiveSpeed = Math.max(speed, gusts * 0.85);

    let subScore = 15;
    let severity = 'LOW';
    let advisory = 'Light to moderate wind speed. Safe for normal navigation.';

    if (effectiveSpeed >= thresholds.WIND.CRITICAL_MIN) {
      subScore = 95;
      severity = 'CRITICAL';
      advisory = 'Gale force / violent storm winds (>50 km/h). Severe capsize hazard. Total ban on departure.';
    } else if (effectiveSpeed >= thresholds.WIND.MODERATE_MAX) {
      // 35 - 50 km/h: High
      const ratio = (effectiveSpeed - 35.0) / (50.0 - 35.0);
      subScore = Math.round(70 + ratio * 15); // 70 - 85
      severity = 'HIGH';
      advisory = 'Strong squally winds (35-50 km/h). Rough sea chop. Small craft advised not to venture offshore.';
    } else if (effectiveSpeed >= thresholds.WIND.LOW_MAX) {
      // 20 - 35 km/h: Moderate
      const ratio = (effectiveSpeed - 20.0) / (35.0 - 20.0);
      subScore = Math.round(45 + ratio * 20); // 45 - 65
      severity = 'MODERATE';
      advisory = 'Moderate onshore/offshore breeze (20-35 km/h). Traditional craft should exercise caution.';
    } else {
      // < 20 km/h: Low
      const ratio = effectiveSpeed / 20.0;
      subScore = Math.round(10 + ratio * 15); // 10 - 25
      severity = 'LOW';
    }

    return {
      ruleId: 'RULE_WIND_SPEED',
      factor: 'Wind Speed & Gusts',
      measuredValue: `${speed.toFixed(1)} km/h (Gusts: ${gusts.toFixed(1)} km/h)`,
      subScore,
      weight: thresholds.WEIGHTS.WIND,
      severity,
      advisory
    };
  }
}

module.exports = WindRule;
