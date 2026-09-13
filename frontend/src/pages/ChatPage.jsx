import React from 'react';
import {
  Bot,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  Compass,
  Fish,
  AlertTriangle,
  HelpCircle,
  FileText
} from 'lucide-react';
import ChatWindow from '../features/chat/ChatWindow';

export default function ChatPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              AI Marine Assistant
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium">
              Phase 6 Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Agentic multi-agent natural language intelligence for fishing safety and oceanographic inquiries
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Model: <strong>ORCA Multi-Agent Orchestrator</strong></span>
        </div>
      </div>

      {/* Main Grid: Chat Window + Side Operational Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Full Chat Window Component */}
        <div className="lg:col-span-8">
          <ChatWindow />
        </div>

        {/* Right 4 Cols: System Architecture & Safety Protocols */}
        <div className="lg:col-span-4 space-y-4">
          {/* Architecture Card */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200">
              <Cpu className="w-4 h-4 text-ocean-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Agentic Decision Hierarchy
              </h3>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-bold text-ocean-400">1. AI Orchestrates</div>
                <p className="text-[11px] text-slate-400">Decomposes inquiries across weather, ocean, and PFZ specialists.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-bold text-tealAccent-400">2. Data Provides Evidence</div>
                <p className="text-[11px] text-slate-400">Fetches verified Open-Meteo and INCOIS satellite telemetry.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-bold text-amber-400">3. Rules Calculate Risk</div>
                <p className="text-[11px] text-slate-400">Deterministic thresholds assess safety score (0-100).</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-bold text-purple-400">4. AI Explains Result</div>
                <p className="text-[11px] text-slate-400">Translates complex oceanography into actionable guidance.</p>
              </div>
            </div>
          </div>

          {/* Safety Threshold Reference Card */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200">
              <ShieldCheck className="w-4 h-4 text-tealAccent-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Operational Safety Thresholds
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
                <span>Low Risk (&lt; 35):</span>
                <span className="font-semibold font-mono">Wave &lt; 1.5m &bull; Wind &lt; 20 km/h</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300">
                <span>Moderate (35-70):</span>
                <span className="font-semibold font-mono">Wave 1.5-2.2m &bull; Wind 20-35 km/h</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300">
                <span>High Risk (&gt; 70):</span>
                <span className="font-semibold font-mono">Wave &gt; 2.2m &bull; Wind &gt; 35 km/h</span>
              </div>
            </div>
          </div>

          {/* SIH Hackathon Notice */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-300">Hackathon Reviewer Note:</div>
            <p>
              Inspect the <strong>"Agentic Thought & Execution Trace"</strong> dropdown in any AI response to view real-time latency, subagent roles, and the verified evidence payload.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
