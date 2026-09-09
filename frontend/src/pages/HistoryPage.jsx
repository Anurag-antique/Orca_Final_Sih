import React, { useState, useEffect } from 'react';
import {
  History,
  Activity,
  Cpu,
  Download,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Sliders
} from 'lucide-react';
import { traceService } from '../services/traceService';
import AgentMetricsCard from '../features/admin/AgentMetricsCard';
import TraceTimeline from '../features/admin/TraceTimeline';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HistoryPage() {
  const [traces, setTraces] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [traceRes, metricRes] = await Promise.all([
        traceService.getTraces({
          sector: selectedSector !== 'All' ? selectedSector : undefined,
          language: selectedLanguage !== 'ALL' ? selectedLanguage : undefined,
          search: searchQuery || undefined
        }),
        traceService.getMetrics()
      ]);
      if (traceRes?.data) {
        setTraces(traceRes.data);
        if (!selectedTrace && traceRes.data.length > 0) {
          setSelectedTrace(traceRes.data[0]);
        }
      }
      if (metricRes?.data) {
        setMetrics(metricRes.data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedSector, selectedLanguage]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Admin & Agent Trace Visualizer
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 font-medium">
              Phase 14 Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time execution telemetry, subagent performance benchmarks, and regulatory compliance audit logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 1-Click Export Audit Log JSON */}
          <a
            href={traceService.getExportUrl()}
            download
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-ocean-400" />
            <span>Export Audit Log (JSON)</span>
          </a>

          <button
            onClick={fetchHistory}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 transition"
            title="Refresh Trace Stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-ocean-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Performance KPI Cards & Subagent Benchmarks */}
      <AgentMetricsCard metrics={metrics} />

      {/* Main Grid: Trace Log Table (7 Cols) + Selected Trace Timeline Visualizer (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Trace History Log Table */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search & Filter Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search traces by query text or ID..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-ocean-500"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-xs transition"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-2">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="All">All Sectors</option>
                <option value="Mumbai Coast">Mumbai Coast</option>
                <option value="Kochi Harbor">Kochi Harbor</option>
                <option value="Chennai Offshore">Chennai Offshore</option>
                <option value="Visakhapatnam">Visakhapatnam</option>
              </select>

              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Languages</option>
                <option value="en">English (EN)</option>
                <option value="hi">Hindi (HI)</option>
                <option value="mr">Marathi (MR)</option>
              </select>
            </div>
          </div>

          {/* Trace Records Table */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Trace ID</th>
                    <th className="py-2.5 px-3">User Query</th>
                    <th className="py-2.5 px-3">Sector</th>
                    <th className="py-2.5 px-3">Lang</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Risk</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans text-[11px]">
                  {traces.map((t) => {
                    const isSelected = selectedTrace?.traceId === t.traceId;
                    return (
                      <tr
                        key={t.traceId}
                        onClick={() => setSelectedTrace(t)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-ocean-950/60 border-l-2 border-ocean-500' : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 truncate max-w-[90px]">
                          {t.traceId}
                        </td>
                        <td className="py-2.5 px-3 text-slate-200 font-medium truncate max-w-[170px]">
                          {t.query}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                          {t.sector}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-cyan-400 uppercase">
                          {t.language}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-tealAccent-400 font-semibold whitespace-nowrap">
                          {t.overallDurationMs} ms
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                            t.riskCalculated?.level === 'CRITICAL' ? 'bg-red-950 border-red-800 text-red-300' :
                            t.riskCalculated?.level === 'HIGH' ? 'bg-rose-950 border-rose-800 text-rose-300' :
                            t.riskCalculated?.level === 'MODERATE' ? 'bg-amber-950 border-amber-800 text-amber-300' :
                            'bg-emerald-950 border-emerald-800 text-emerald-300'
                          }`}>
                            {t.riskCalculated?.score}/100
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTrace(t);
                            }}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
                            title="Inspect Timeline"
                          >
                            <Eye className="w-3.5 h-3.5 text-ocean-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Selected Trace Timeline Visualizer */}
        <div className="lg:col-span-5 space-y-4">
          <TraceTimeline trace={selectedTrace} />
        </div>
      </div>
    </div>
  );
}
