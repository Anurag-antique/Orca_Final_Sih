const thresholds = require('../thresholds');

class WaveRule {
  static evaluate(waveHeightM, wavePeriodSec = 7.0, swellHeightM = 0) {
    const wave = parseFloat(waveHeightM) || 0;
    const period = parseFloat(wavePeriodSec) || 7.0;

    let subScore = 12;
    let severity = 'LOW';
    let advisory = 'Calm to slight sea state (<1.5m). Safe operating conditions.';

    const steepnessFactor = period < 5.5 ? 1.15 : 1.0;
    const effectiveWave = wave * steepnessFactor;

    if (effectiveWave >= thresholds.WAVE.CRITICAL_MIN) {
      // > 3.5 m: Critical
      subScore = 100;
      severity = 'CRITICAL';
      advisory = 'Phenomenal / very rough seas (>3.5m). Extreme vessel destruction and grounding risk.';
    } else if (effectiveWave >= thresholds.WAVE.MODERATE_MAX) {
      // 2.5 - 3.5 m: High
      const ratio = (effectiveWave - 2.5) / (3.5 - 2.5);
      subScore = Math.round(72 + ratio * 16); // 72 - 88
      severity = 'HIGH';
      advisory = 'High rough waves (2.5 - 3.5m). Mechanized trawlers cautioned; small craft strictly prohibited.';
    } else if (effectiveWave >= thresholds.WAVE.LOW_MAX) {
      // 1.5 - 2.5 m: Moderate
      const ratio = (effectiveWave - 1.5) / (2.5 - 1.5);
      subScore = Math.round(48 + ratio * 18); // 48 - 66
      severity = 'MODERATE';
      advisory = 'Moderate swell (1.5 - 2.5m). Deck washing and roll instability in small craft.';
    } else {
      // < 1.5 m: Low
      const ratio = effectiveWave / 1.5;
      subScore = Math.round(8 + ratio * 18); // 8 - 26
      severity = 'LOW';
    }

    return {
      ruleId: 'RULE_WAVE_HYDRODYNAMICS',
      factor: 'Significant Wave & Swell Height',
      measuredValue: `${wave.toFixed(2)} m (Period: ${period.toFixed(1)}s)`,
      subScore,
      weight: thresholds.WEIGHTS.WAVE,
      severity,
      advisory
    };
  }
}

module.exports = WaveRule;
