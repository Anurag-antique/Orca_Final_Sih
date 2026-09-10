const { activePFZProvider } = require("../providers/pfz");

class PFZService {
  constructor(provider = activePFZProvider) {
    this.provider = provider;
  }

  async getPFZs(location, date) {
    return await this.provider.getPFZs(location, date);
  }
}

module.exports = new PFZService();
