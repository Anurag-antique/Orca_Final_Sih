const FallbackOceanProvider = require('./FallbackOceanProvider');
const MockOceanProvider = require('./MockOceanProvider');
const RealOpenMeteoOceanProvider = require('./RealOpenMeteoOceanProvider');

const activeOceanProvider = new FallbackOceanProvider();

module.exports = {
  activeOceanProvider,
  FallbackOceanProvider,
  MockOceanProvider,
  RealOpenMeteoOceanProvider
};
