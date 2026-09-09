const BaseAgent = require('../BaseAgent');
const pfzService = require('../../services/pfz.service');

class PFZWorker extends BaseAgent {
  constructor() {
    super('PFZWorker', 'Satellite PFZ & Pelagic Habitat Worker');
  }

  async execute({ location }) {
    const res = await pfzService.getPFZs(location);
    return res;
  }
}

module.exports = PFZWorker;
