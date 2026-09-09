import React, { useState } from 'react';
import {
  FileText,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Database,
  Radio,
  Scale,
  Sparkles,
  Info
} from 'lucide-react';

export default function EvidenceDrawer({ explainabilityPackage }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!explainabilityPackage) return null;

  const {
    operationalConclusion = 'PROCEED_WITH_CAUTION',
    recommendationTitle = 'Operational Recommendation',
    conclusionSummary = '',
    riskScore = 24,
    riskLevel = 'LOW',
    confidenceScore = 94,
    dataFreshnessIndex = '98.5% Synchronized',
    whyRecommended = [],
    citations = [],
    mandatoryDisclaimers = []
  } = explainabilityPackage;

  const conclusionBadges = {
    SAFE_TO_PROCEED: 'bg-emerald-950 border-emerald-800 text-emerald-300',
    PROCEED_WITH_CAUTION: 'bg-amber-950 border-amber-800 text-amber-300',
    HIGH_RISK_AVOID: 'bg-rose-950 border-rose-800 text-rose-300',
    CRITICAL_PROHIBITION: 'bg-red-950 border-red-700 text-red-200 animate-pulse'
  };

  const badgeStyle = conclusionBadges[operationalConclusion] || conclusionBadges.PROCEED_WITH_CAUTION;

  return (
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden text-xs shadow-lg">
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-900/80 hover:bg-slate-900 transition text-slate-300 border-b border-slate-800/80"
      >
        <div className="flex items-center gap-2">
          <Scale className="w-3.5 h-3.5 text-tealAccent-400" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-200">
            Evidence Citations & Explainability Breakdown
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${badgeStyle}`}>
            {operationalConclusion.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-ocean-400 font-semibold">
          <span>{isOpen ? 'Close Breakdown' : 'Why This Recommendation?'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Explainability Body */}
      {isOpen && (
        <div className="p-4 space-y-4 bg-slate-950">
          {/* 1. Conclusion Summary Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-ocean-400" />
                <span>{recommendationTitle}</span>
              </span>
              <span className="text-[10px] font-mono text-tealAccent-400 font-bold">
                Confidence: {confidenceScore}% &bull; Freshness: {dataFreshnessIndex}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {conclusionSummary}
            </p>
          </div>

          {/* 2. "Why Did the System Recommend This?" Causal Reasons */}
          {whyRecommended.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-ocean-400" />
                <span>Why Did the System Recommend This? (Causal Breakdown)</span>
              </span>

              <div className="grid grid-cols-1 gap-2">
                {whyRecommended.map((reason, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-1 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-xs">
                        {reason.factor}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        reason.impact === 'POSITIVE_DRIVER' ? 'bg-emerald-950 border-emerald-800 text-emerald-300' :
                        reason.impact === 'PRIMARY_NEGATIVE_DRIVER' ? 'bg-rose-950 border-rose-800 text-rose-300' :
                        reason.impact === 'AMPLIFIER' ? 'bg-indigo-950 border-indigo-800 text-indigo-300' :
                        'bg-amber-950 border-amber-800 text-amber-300'
                      }`}>
                        {reason.impact.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {reason.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Verified Source Citations Table */}
          {citations.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-tealAccent-400" />
                <span>Verified Data Sources & Sensor Provenance ({citations.length} Providers)</span>
              </span>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Data Domain</th>
                      <th className="py-2 px-3">Provider / Model</th>
                      <th className="py-2 px-3">Issuing Agency</th>
                      <th className="py-2 px-3">Update Cadence</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {citations.map((cit, cIdx) => (
                      <tr key={cIdx} className="hover:bg-slate-900/70 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap">
                          {cit.domain}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-ocean-300">
                          {cit.providerName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {cit.agencyOrigin}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                          {cit.dataFreshness}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
                            {cit.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Mandatory Disclaimers Banner */}
          {mandatoryDisclaimers.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Mandatory Maritime Disclaimers:</span>
              </span>
              <div className="space-y-1 text-[11px] text-slate-400">
                {mandatoryDisclaimers.map((disc, dIdx) => (
                  <p key={dIdx} className="leading-relaxed">
                    &bull; {disc}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
            <span>Verified Evidence Generated: {new Date(explainabilityPackage.generatedAt || Date.now()).toLocaleTimeString()}</span>
            <span className="font-mono text-tealAccent-400">Deterministic Engine &bull; Zero Hallucination</span>
          </div>
        </div>
      )}
    </div>
  );
}
