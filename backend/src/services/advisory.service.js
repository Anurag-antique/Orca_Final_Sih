const { activeAdvisoryProvider } = require('../providers/advisory');

class AdvisoryService {
  constructor(provider = activeAdvisoryProvider) {
    this.provider = provider;
  }

  async getAdvisories(location) {
    return await this.provider.getAdvisories(location);
  }
}

module.exports = new AdvisoryService();
