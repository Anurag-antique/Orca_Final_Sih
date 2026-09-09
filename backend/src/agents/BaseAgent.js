class BaseAgent {
  constructor(name, role, version = '1.0.0') {
    this.name = name;
    this.role = role;
    this.version = version;
  }

  async run(context) {
    const startTime = Date.now();
    try {
      const result = await this.execute(context);
      const durationMs = Date.now() - startTime;
      return {
        success: true,
        agent: this.name,
        role: this.role,
        durationMs,
        timestamp: new Date().toISOString(),
        output: result
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error(`[Agent Failure: ${this.name}]`, error);
      return {
        success: false,
        agent: this.name,
        role: this.role,
        durationMs,
        timestamp: new Date().toISOString(),
        error: error.message || 'Agent execution failed',
        output: null
      };
    }
  }

  async execute(context) {
    throw new Error(`execute(context) must be implemented by ${this.name}`);
  }
}

module.exports = BaseAgent;
