const RealGeospatialProvider = require("./RealGeospatialProvider");
const MockGeospatialProvider = require("./MockGeospatialProvider");

// Runtime selection: use the real provider by default.
// The mock is retained only for offline unit tests.
const useMock = process.env.GEOSPATIAL_USE_MOCK === "true";

const activeGeospatialProvider = useMock
  ? new MockGeospatialProvider()
  : new RealGeospatialProvider();

module.exports = {
  activeGeospatialProvider,
  RealGeospatialProvider,
  MockGeospatialProvider,
};
