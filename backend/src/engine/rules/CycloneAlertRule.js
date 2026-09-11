const thresholds = require('../thresholds');

class CycloneAlertRule {
  static evaluate(cycloneAlert, advisoryList = []) {
    // Trust the provider's explicit `active` boolean rather than substring-matching
    // `category` — categories like "NO_CYCLONE_THREAT" contain the substring
    // "CYCLONE" and were previously false-triggering a CRITICAL override on
    // every request, even with calm conditions and no real cyclone.
    const isCycloneActive = !!(cycloneAlert && cycloneAlert.active === true);
    const hasHighWaveAlert = advisoryList.some(a => a.severity === 'WARNING' || a.severity === 'CRITICAL');

    let subScore = 0;
    let severity = 'LOW';
    let advisory = 'No active IMD / INCOIS cyclone or storm surge advisories.';
    let isOverrideTrigger = false;

    if (isCycloneActive) {
      subScore = 100;
      severity = 'CRITICAL';
      isOverrideTrigger = true;
      advisory = `CRITICAL CYCLONE ALERT: ${cycloneAlert.message || 'Severe cyclonic storm system active. Total ban on sea venturing.'}`;
    } else if (hasHighWaveAlert) {
      subScore = 65;
      severity = 'HIGH';
      advisory = 'Official Marine Warning issued by INCOIS/IMD for high swell waves.';
    }

    return {
      ruleId: 'RULE_CYCLONE_OFFICIAL_ALERTS',
      factor: 'Official IMD / INCOIS Storm Alerts',
      measuredValue: isCycloneActive ? 'ACTIVE CYCLONE' : hasHighWaveAlert ? 'HIGH WAVE WARNING' : 'CLEAR',
      subScore,
      weight: thresholds.WEIGHTS.CYCLONE,
      severity,
      isOverrideTrigger,
      advisory
    };
  }
}

module.exports = CycloneAlertRule;
