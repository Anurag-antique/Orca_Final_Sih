const FallbackAdvisoryProvider = require('./FallbackAdvisoryProvider');
const RealAdvisoryProvider = require('./RealAdvisoryProvider');
const MockAdvisoryProvider = require('./MockAdvisoryProvider');

const activeAdvisoryProvider = new FallbackAdvisoryProvider();

module.exports = {
  activeAdvisoryProvider,
  FallbackAdvisoryProvider,
  RealAdvisoryProvider,
  MockAdvisoryProvider
};
