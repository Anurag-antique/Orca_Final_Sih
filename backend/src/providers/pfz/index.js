const MockPFZProvider = require('./MockPFZProvider');

const activePFZProvider = new MockPFZProvider();

module.exports = {
  activePFZProvider,
  MockPFZProvider
};
