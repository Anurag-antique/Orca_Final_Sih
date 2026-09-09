const BaseAgent = require('../BaseAgent');
const oceanService = require('../../services/ocean.service');

class OceanWorker extends BaseAgent {
  constructor() {
    super('OceanWorker', 'Oceanographic & Wave Hydrodynamics Worker');
  }

  async execute({ location }) {
    const res = await oceanService.getOceanConditions(location);
    return res;
  }
}

module.exports = OceanWorker;
