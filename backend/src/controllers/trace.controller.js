const TraceService = require('../services/trace.service');

const getTraces = (req, res, next) => {
  try {
    const { sector, language, status, search, limit } = req.query;
    const traces = TraceService.getTraces({ sector, language, status, search, limit });

    return res.status(200).json({
      success: true,
      count: traces.length,
      data: traces
    });
  } catch (error) {
    next(error);
  }
};

const getTraceById = (req, res, next) => {
  try {
    const trace = TraceService.getTraceById(req.params.id);
    if (!trace) {
      return res.status(404).json({
        success: false,
        message: 'Trace record not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: trace
    });
  } catch (error) {
    next(error);
  }
};

const getMetrics = (req, res, next) => {
  try {
    const metrics = TraceService.getPerformanceMetrics();
    return res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

const exportAuditLog = (req, res, next) => {
  try {
    const auditLog = TraceService.exportFullAuditLog();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=orca_compliance_audit_log_${Date.now()}.json`);
    return res.status(200).send(JSON.stringify(auditLog, null, 2));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTraces,
  getTraceById,
  getMetrics,
  exportAuditLog
};
