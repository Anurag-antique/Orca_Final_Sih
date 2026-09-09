class IAdvisoryProvider {
  async getAdvisories(location) {
    throw new Error('Method getAdvisories(location) must be implemented.');
  }
}

module.exports = IAdvisoryProvider;
