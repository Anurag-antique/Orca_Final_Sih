const MockAdvisoryProvider = require('./MockAdvisoryProvider');

const activeAdvisoryProvider = new MockAdvisoryProvider();

module.exports = {
  activeAdvisoryProvider,
  MockAdvisoryProvider
};
