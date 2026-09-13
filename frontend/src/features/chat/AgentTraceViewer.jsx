import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
  GitBranch,
  FileCode,
  Terminal
} from 'lucide-react';

export default function AgentTraceViewer({ trace = [], totalExecutionTimeMs = 0, evidence = null, plan = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('trace'); // 'trace' | 'dag' | 'evidence'

  if (!trace || trace.length === 0) return null;

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
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden text-xs shadow-lg">
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-900/80 hover:bg-slate-900 transition text-slate-300 border-b border-slate-800/80"
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-tealAccent-400" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-200">
            Agent Orchestrator Execution Trace ({trace.length} Steps)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-tealAccent-300 font-bold">
            {totalExecutionTimeMs}ms
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-ocean-400 font-semibold">
          <span>{isOpen ? 'Close Inspector' : 'Inspect Multi-Agent DAG'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Multi-Tab View */}
      {isOpen && (
        <div className="p-3.5 space-y-3 bg-slate-950">
          {/* Subagent Tab Navigation */}
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('trace')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'trace'
                    ? 'bg-ocean-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                1. Execution Trace ({trace.length})
              </button>

              <button
                onClick={() => setActiveTab('dag')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'dag'
                    ? 'bg-ocean-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                2. Planner DAG ({plan?.tasks?.length || 5} Tasks)
              </button>

              <button
                onClick={() => setActiveTab('evidence')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'evidence'
                    ? 'bg-ocean-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                3. Aggregated Evidence
              </button>
            </div>

            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
              Orchestrator
            </span>
          </div>

          {/* TAB 1: Step-by-Step Execution Trace Timeline */}
          {activeTab === 'trace' && (
            <div className="space-y-2 pt-1 max-h-96 overflow-y-auto pr-1">
              {trace.map((step) => {
                const badgeStyle = agentBadges[step.agent] || 'bg-slate-900 border-slate-800 text-slate-300';
                return (
                  <div
                    key={step.step}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-200 shrink-0 mt-0.5">
                      {step.step}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                            {step.agent}
                          </span>
                          {step.role && (
                            <span className="text-[10px] text-slate-400 hidden sm:inline truncate max-w-[200px]">
                              {step.role}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-tealAccent-400 font-semibold">
                          {step.durationMs}ms
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        {step.action}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Planner DAG Visualization */}
          {activeTab === 'dag' && (
            <div className="space-y-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>DAG Execution Plan: {plan?.planId || 'plan_active'}</span>
                  <span className="text-ocean-400 font-mono">Intent: {plan?.intent || 'SAFETY_INQUIRY'}</span>
                </div>
                <p className="text-slate-400">
                  Target Sector: <strong>{plan?.sector || 'Mumbai Coast'}</strong> &bull; Parallel Execution Mode: <strong>Concurrent Async Workers</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {plan?.tasks?.map((task) => (
                  <div
                    key={task.taskId}
                    className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 uppercase tracking-wide text-[11px]">
                        {task.domain} Task
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-ocean-950 border border-ocean-800 text-ocean-300">
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{task.description}</p>
                  </div>
                )) || (
                  <div className="p-4 text-slate-500 text-center col-span-2">
                    Planner DAG scheduled standard 5 worker tasks concurrently.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Normalized Sensor Evidence Payload */}
          {activeTab === 'evidence' && (
            <div className="space-y-2 pt-1">
              <div className="text-[11px] text-slate-400">
                Normalized evidence context generated by AggregatorAgent for the Deterministic Risk Engine:
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-72 leading-relaxed">
                {JSON.stringify(evidence, null, 2)}
              </pre>
            </div>
          )}

          {/* Golden Rule Footer */}
          <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-tealAccent-400" />
              <span>AI Orchestrates &bull; Data Provides Evidence &bull; Rules Calculate Risk &bull; AI Explains Result</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
