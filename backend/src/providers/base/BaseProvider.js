class BaseProvider {
  constructor(name, providerType, version = '1.0.0', isMock = true) {
    this.name = name;
    this.providerType = providerType;
    this.version = version;
    this.isMock = isMock;
    this.status = 'HEALTHY';
  }

  standardizeResponse(data, sourceMetadata = {}) {
    return {
      success: true,
      provider: {
        name: this.name,
        type: this.providerType,
        version: this.version,
        isMock: this.isMock,
        status: this.status
      },
      source: {
        dataset: sourceMetadata.dataset || 'Proto-Synthetic Dataset',
        origin: sourceMetadata.origin || 'ORCA Prototype Provider Layer',
        accuracyEstimate: sourceMetadata.accuracyEstimate || 'Prototype Standard',
        updateFrequency: sourceMetadata.updateFrequency || 'Hourly',
        isDemoData: this.isMock,
        disclaimer: 'Data generated for SIH 2026 decision support prototype demonstration.'
      },
      timestamp: new Date().toISOString(),
      data
    };
  }

  handleError(error, context = '') {
    console.error(`[Provider Error: ${this.name}] in ${context}:`, error);
    return {
      success: false,
      provider: {
        name: this.name,
        type: this.providerType,
        isMock: this.isMock,
        status: 'DEGRADED'
      },
      error: error.message || 'Provider retrieval failed',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BaseProvider;
