const MockGeospatialProvider = require('./MockGeospatialProvider');

const activeGeospatialProvider = new MockGeospatialProvider();

module.exports = {
  activeGeospatialProvider,
  MockGeospatialProvider
};
