const { activeOceanProvider } = require('../providers/ocean');

class OceanService {
  constructor(provider = activeOceanProvider) {
    this.provider = provider;
  }

  async getOceanConditions(location, datetime) {
    return await this.provider.getOceanConditions(location, datetime);
  }
}

module.exports = new OceanService();
