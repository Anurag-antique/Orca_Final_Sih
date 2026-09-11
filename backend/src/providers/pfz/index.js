const MockPFZProvider = require('./MockPFZProvider');
const RealINCOISPFZProvider = require('./RealINCOISPFZProvider');

const activePFZProvider = new RealINCOISPFZProvider();

module.exports = {
  activePFZProvider,
  MockPFZProvider,
  RealINCOISPFZProvider
};
