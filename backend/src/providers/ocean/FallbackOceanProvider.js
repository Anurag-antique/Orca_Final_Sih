const BaseProvider = require('../base/BaseProvider');
const RealOpenMeteoOceanProvider = require('./RealOpenMeteoOceanProvider');
const MockOceanProvider = require('./MockOceanProvider');

class FallbackOceanProvider extends BaseProvider {
  constructor() {
    super('Resilient-OceanProvider-Orchestrator', 'OCEANOGRAPHY', '1.0.0', false);
    this.primaryProvider = new RealOpenMeteoOceanProvider();
    this.fallbackProvider = new MockOceanProvider();
  }

  async getOceanConditions(location, datetime = new Date()) {
    try {
      // 1. Try Primary Real Open-Meteo Marine API
      const result = await this.primaryProvider.getOceanConditions(location, datetime);
      return result;
    } catch (primaryError) {
      console.warn(`[OceanProvider Fallback Triggered] ${primaryError.message}. Switching to Mock Oceanographic Model.`);
      
      // 2. Seamlessly Fallback to Mock Provider
      const fallbackResult = await this.fallbackProvider.getOceanConditions(location, datetime);
      
      fallbackResult.source.isFallback = true;
      fallbackResult.source.fallbackReason = primaryError.message;
      fallbackResult.source.dataset = `${fallbackResult.source.dataset} (Fallback Active)`;
      return fallbackResult;
    }
  }
}

module.exports = FallbackOceanProvider;
