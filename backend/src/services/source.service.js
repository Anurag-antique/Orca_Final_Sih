const { providerManager } = require('../providers');

class SourceService {
  getDataSources() {
    const providers = providerManager.getRegisteredProvidersInfo();
    return {
      success: true,
      registeredProvidersCount: providers.length,
      allHealthy: providers.every(p => p.status === 'HEALTHY'),
      providers,
      disclaimer: 'Prototype provider layer for Smart India Hackathon 2026. Mock and real satellite models adhere to identical API contracts.',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SourceService();
