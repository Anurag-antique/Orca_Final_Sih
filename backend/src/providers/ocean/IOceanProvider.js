class IOceanProvider {
  async getOceanConditions(location, datetime) {
    throw new Error('Method getOceanConditions(location, datetime) must be implemented.');
  }
}

module.exports = IOceanProvider;
