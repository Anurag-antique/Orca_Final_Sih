import React from "react";
import { Cpu, ShieldCheck, Globe } from "lucide-react";
import ChatWindow from "../features/chat/ChatWindow";
import { useLanguage } from "../context/LanguageContext";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "ml", label: "മലയാളം (Malayalam)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
];

function LanguagePicker() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
      <Globe className="w-3.5 h-3.5 text-ocean-400 shrink-0" />
      <span className="text-slate-400 hidden sm:inline">Language:</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-transparent font-semibold text-slate-100 focus:outline-none cursor-pointer text-xs"
      >
        {LANGUAGES.map((l) => (
          <option
            key={l.code}
            value={l.code}
            className="bg-slate-900 text-slate-100"
          >
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            AI Marine Assistant
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ask about fishing safety, oceanographic conditions, and route
            guidance in your language.
          </p>
        </div>

        <LanguagePicker />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ChatWindow />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200">
              <Cpu className="w-4 h-4 text-ocean-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                How answers are produced
              </h3>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-bold text-ocean-400">
                  1. The assistant understands your question
                </div>
                <p className="text-[11px] text-slate-400">
                  It splits it into weather, ocean, and fishing-zone parts.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-bold text-tealAccent-400">
                  2. Live data is retrieved
                </div>
                <p className="text-[11px] text-slate-400">
                  Current Open-Meteo weather and INCOIS satellite advisories.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-bold text-amber-400">
                  3. Safety is scored
                </div>
                <p className="text-[11px] text-slate-400">
                  Deterministic rules assign a 0–100 risk score.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-bold text-purple-400">
                  4. The result is explained
                </div>
                <p className="text-[11px] text-slate-400">
                  Plain-language guidance you can act on.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200">
              <ShieldCheck className="w-4 h-4 text-tealAccent-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Safety thresholds
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
                <span>Low risk (&lt; 35):</span>
                <span className="font-semibold font-mono">
                  Wave &lt; 1.5 m &bull; Wind &lt; 20 km/h
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300">
                <span>Moderate (35–70):</span>
                <span className="font-semibold font-mono">
                  Wave 1.5–2.2 m &bull; Wind 20–35 km/h
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300">
                <span>High risk (&gt; 70):</span>
                <span className="font-semibold font-mono">
                  Wave &gt; 2.2 m &bull; Wind &gt; 35 km/h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
