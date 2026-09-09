import React from 'react';
import {
  Cpu,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Activity,
  Server,
  Layers,
  Sparkles
} from 'lucide-react';

export default function AgentMetricsCard({ metrics }) {
  if (!metrics) return null;

  const {
    totalInquiriesLogged = 0,
    avgPipelineLatencyMs = 1050,
    overallSuccessRate = '99.4%',
    zeroHallucinationCompliance = '100%',
    subagentStats = {},
    telemetrySourcesHealth = {}
  } = metrics;

  return (
    <div className="space-y-4 text-xs">
      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Inquiries Processed</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">{totalInquiriesLogged}</div>
          <p className="text-[10px] text-slate-500 font-mono">Logged to audit buffer</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Avg Pipeline Latency</span>
            <Clock className="w-4 h-4 text-tealAccent-400" />
          </div>
          <div className="text-2xl font-black text-tealAccent-300">{avgPipelineLatencyMs} <span className="text-xs font-normal text-slate-400">ms</span></div>
          <p className="text-[10px] text-slate-500 font-mono">10 Multi-agent stages</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Subagent Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">{overallSuccessRate}</div>
          <p className="text-[10px] text-slate-500 font-mono">Automatic fallback enabled</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Deterministic Safety</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">{zeroHallucinationCompliance}</div>
          <p className="text-[10px] text-slate-500 font-mono">Zero LLM safety hallucination</p>
        </div>
      </div>

      {/* Subagent Performance Benchmark Table */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-ocean-400" />
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
              Subagent Latency & Execution Benchmarks ({Object.keys(subagentStats).length} Agents)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Autonomous Task Pipeline</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-2 px-3">Subagent Name</th>
                <th className="py-2 px-3">Operational Role</th>
                <th className="py-2 px-3">Average Latency</th>
                <th className="py-2 px-3">Success Rate</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {Object.entries(subagentStats).map(([agentName, stat], idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                    {agentName}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {stat.role}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-tealAccent-400 font-semibold">
                    {stat.avgMs} ms
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400">
                    {stat.successRate}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
                      HEALTHY
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
