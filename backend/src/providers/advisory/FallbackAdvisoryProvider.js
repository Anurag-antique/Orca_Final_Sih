const BaseProvider = require('../base/BaseProvider');
const RealAdvisoryProvider = require('./RealAdvisoryProvider');
const MockAdvisoryProvider = require('./MockAdvisoryProvider');

class FallbackAdvisoryProvider extends BaseProvider {
  constructor() {
    super('Resilient-AdvisoryProvider-Orchestrator', 'MARINE_ADVISORY', '1.0.0', false);
    this.primaryProvider = new RealAdvisoryProvider();
    this.fallbackProvider = new MockAdvisoryProvider();
  }

  async getAdvisories(location) {
    try {
      // 1. Try Primary Real-Time NDMA Sachet & Live Telemetry Provider
      const result = await this.primaryProvider.getAdvisories(location);
      if (!result.success && !result.data) {
        throw new Error(result.error || 'Live advisory retrieval failed');
      }
      return result;
    } catch (primaryError) {
      console.warn(
        `[AdvisoryProvider Fallback Triggered] ${primaryError.message}. Switching to Calibrated Baseline Advisory Bulletins.`
      );

      // 2. Seamlessly Fallback to Mock / Baseline Provider
      const fallbackResult = await this.fallbackProvider.getAdvisories(location);

      fallbackResult.source = {
        ...fallbackResult.source,
        isFallback: true,
        fallbackReason: primaryError.message,
        dataset: `${fallbackResult.source.dataset} (Fallback Active)`
      };

      return fallbackResult;
    }
  }
}

module.exports = FallbackAdvisoryProvider;
