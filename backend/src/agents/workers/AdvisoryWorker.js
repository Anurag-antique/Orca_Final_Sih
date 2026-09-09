const BaseAgent = require('../BaseAgent');
const advisoryService = require('../../services/advisory.service');

class AdvisoryWorker extends BaseAgent {
  constructor() {
    super('AdvisoryWorker', 'Marine Safety Advisory & Bulletins Worker');
  }

  async execute({ location }) {
    const res = await advisoryService.getAdvisories(location);
    return res;
  }
}

module.exports = AdvisoryWorker;
