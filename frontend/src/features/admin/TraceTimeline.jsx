import React from 'react';
import {
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

export default function TraceTimeline({ trace }) {
  if (!trace) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 space-y-2 text-xs">
        <Cpu className="w-8 h-8 mx-auto text-slate-600" />
        <p className="font-semibold text-slate-400">Select a trace record from the log table</p>
        <p className="text-[11px]">Inspect real-time subagent task decomposition and latency metrics.</p>
      </div>
    );
  }

  const agentBadges = {
    IntentAgent: 'bg-indigo-950 border-indigo-800 text-indigo-300',
    PlannerAgent: 'bg-blue-950 border-blue-800 text-blue-300',
    WeatherWorker: 'bg-sky-950 border-sky-800 text-sky-300',
    OceanWorker: 'bg-teal-950 border-teal-800 text-teal-300',
    PFZWorker: 'bg-emerald-950 border-emerald-800 text-emerald-300',
    AdvisoryWorker: 'bg-amber-950 border-amber-800 text-amber-300',
    GeofenceWorker: 'bg-orange-950 border-orange-800 text-orange-300',
    AggregatorAgent: 'bg-cyan-950 border-cyan-800 text-cyan-300',
    RiskAssessmentEngine: 'bg-rose-950 border-rose-800 text-rose-300',
    ExplainerAgent: 'bg-purple-950 border-purple-800 text-purple-300',
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl text-xs">
      {/* Trace Overview Header */}
      <div className="pb-3 border-b border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 text-sm">Trace: {trace.traceId}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
              {trace.status}
            </span>
          </div>
          <span className="text-[11px] font-mono text-tealAccent-400 font-bold">
            {trace.overallDurationMs} ms
          </span>
        </div>

        <p className="text-slate-200 font-medium text-xs">
          Query: <em className="text-ocean-300">"{trace.query}"</em>
        </p>

        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
          <span>Sector: <strong className="text-slate-300">{trace.sector}</strong></span>
          <span>Language: <strong className="text-slate-300">{trace.language?.toUpperCase()}</strong></span>
          <span>Risk: <strong className="text-slate-300">{trace.riskCalculated?.level} ({trace.riskCalculated?.score}/100)</strong></span>
          <span>Time: <strong className="text-slate-300">{new Date(trace.timestamp).toLocaleTimeString()}</strong></span>
        </div>
      </div>

      {/* 10-Step Multi-Agent Execution Timeline */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
          Subagent Task Decomposition Timeline ({trace.steps?.length || 10} Steps):
        </span>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {trace.steps?.map((step) => {
            const badge = agentBadges[step.agent] || 'bg-slate-900 border-slate-800 text-slate-300';
            return (
              <div
                key={step.step}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3 hover:border-slate-700 transition"
              >
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0 mt-0.5">
                  {step.step}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badge}`}>
                      {step.agent}
                    </span>
                    <span className="text-[10px] font-mono text-tealAccent-400 font-semibold">
                      {step.durationMs} ms
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug font-sans">
                    {step.action}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-tealAccent-400" />
          <span>SIH 2026 Audit Trail Compliance</span>
        </span>
        <span className="font-mono text-slate-400">Zero Hallucination</span>
      </div>
    </div>
  );
}
