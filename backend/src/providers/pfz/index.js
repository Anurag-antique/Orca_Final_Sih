// const MockPFZProvider = require('./MockPFZProvider');

// const activePFZProvider = new MockPFZProvider();

// module.exports = {
//   activePFZProvider,
//   MockPFZProvider
// };

const MockPFZProvider = require("./MockPFZProvider");
const RealPFZProvider = require("./RealPFZProvider");
const RealINCOISPFZProvider = require("./RealINCOISPFZProvider");

// const activePFZProvider = new RealPFZProvider();
const activePFZProvider = new RealINCOISPFZProvider();

module.exports = {
  activePFZProvider,
  MockPFZProvider,
  RealPFZProvider,
  RealINCOISPFZProvider,
};
