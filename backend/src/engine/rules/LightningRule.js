const thresholds = require('../thresholds');

class LightningRule {
  static evaluate(lightningRisk = 'LOW') {
    const risk = (lightningRisk || 'LOW').toUpperCase();

    let subScore = 10;
    let severity = 'LOW';
    let advisory = 'Minimal convective electrical thunderstorm activity.';

    if (risk === 'HIGH' || risk === 'SEVERE') {
      subScore = 85;
      severity = 'HIGH';
      advisory = 'Severe oceanic lightning detected. Open deck electrocution and mast strike hazard.';
    } else if (risk === 'MODERATE') {
      subScore = 45;
      severity = 'MODERATE';
      advisory = 'Isolated convective lightning cells. Maintain distance from metal rigging.';
    }

    return {
      ruleId: 'RULE_LIGHTNING_RISK',
      factor: 'Convective Lightning Potential',
      measuredValue: risk,
      subScore,
      weight: thresholds.WEIGHTS.LIGHTNING,
      severity,
      advisory
    };
  }
}

module.exports = LightningRule;
