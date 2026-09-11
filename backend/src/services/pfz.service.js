const { activePFZProvider, MockPFZProvider } = require('../providers/pfz');

class PFZService {
  constructor(provider = activePFZProvider) {
    this.provider = provider;
    this.fallback = new MockPFZProvider();
  }

  async getPFZs(location, date) {
    try {
      return await this.provider.getPFZs(location, date);
    } catch (err) {
      console.warn(`[PFZService] Live INCOIS PFZ failed (${err.message}), using fallback data`);
      const result = await this.fallback.getPFZs(location, date);
      result.source = {
        ...result.source,
        isFallback: true,
        liveError: err.message,
        notice: 'Live INCOIS PFZ advisory unavailable — showing demonstration zones. Verify with INCOIS WebGIS before departure.'
      };
      return result;
    }
  }
}

module.exports = new PFZService();
