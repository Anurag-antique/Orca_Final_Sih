import React from "react";
import {
  BellRing,
  ShieldAlert,
  Radio,
  AlertTriangle,
  Info,
  RefreshCw,
  Info
} from 'lucide-react';
import AlertFeed from '../features/alerts/AlertFeed';
import StaleBadge from '../components/StaleBadge';

export default function AlertsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    streamOk,
    refresh,
    markRead,
  } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Safety Alerts & Emergency Operations Center
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                streamOk
                  ? "bg-emerald-950 border-emerald-800 text-emerald-300"
                  : "bg-slate-900 border-slate-700 text-slate-400"
              }`}
            >
              {streamOk ? "Live stream active" : "Live stream reconnecting"}
            </span>
            <StaleBadge url="/alerts" params={{ sector: 'all', status: 'ACTIVE' }} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time alerts generated from live weather, ocean, geofence, and
            advisory rules
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <div className="text-xs font-mono text-slate-400">
            Unread: <strong className="text-slate-200">{unreadCount}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: notifications feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-200">
                <BellRing className="h-4 w-4 text-rose-400" />
                <h2 className="text-sm font-semibold">Active notifications</h2>
              </div>
              <span className="text-[11px] text-slate-500">
                {notifications.length} total
              </span>
            </div>

            {loading && notifications.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                <Loader2 className="inline h-4 w-4 animate-spin mr-1" /> Loading
                notifications…
              </div>
            )}

            {error && !loading && (
              <div className="p-6 text-xs text-amber-300">{error}</div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="p-10 text-center text-sm text-slate-500">
                No active alerts.
              </div>
            )}

            {notifications.length > 0 && (
              <ul className="divide-y divide-slate-900">
                {notifications.map((n) => {
                  const meta = SEVERITY_META[n.severity] || SEVERITY_META.INFO;
                  const { Icon } = meta;
                  return (
                    <li
                      key={n.id}
                      className={`px-4 py-3 flex items-start gap-3 ${n.read ? "opacity-70" : ""}`}
                    >
                      <span
                        className={`inline-flex items-center justify-center rounded-lg border p-2 ${meta.bg}`}
                      >
                        <Icon className={`h-4 w-4 ${meta.color}`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-100">
                            {n.title}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            {meta.label}
                          </span>
                          {n.sector && (
                            <span className="text-[10px] text-slate-500">
                              {n.sector}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500">
                          <span>{formatTime(n.created_at)}</span>
                          {n.type && <span>· {n.type}</span>}
                        </div>
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markRead(n.id)}
                          className="text-[11px] text-sky-400 hover:text-sky-300 shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right: reference panels — static legal / operational data */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Maritime Emergency Response Tiers
              </h3>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 space-y-1">
                <div className="font-bold text-red-300">
                  Tier 1: Red Alert / Emergency
                </div>
                <p className="text-[11px] text-slate-400">
                  Total sea venturing ban. All vessels moored. Hoist Warning
                  Signal 4.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-1">
                <div className="font-bold text-amber-300">
                  Tier 2: Orange Warning
                </div>
                <p className="text-[11px] text-slate-400">
                  Squally sea chop (&gt; 2.5m waves). Small artisanal craft
                  abort departure.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-yellow-950/40 border border-yellow-800/60 space-y-1">
                <div className="font-bold text-yellow-300">
                  Tier 3: Yellow Watch
                </div>
                <p className="text-[11px] text-slate-400">
                  Developing thunderstorm cells or high tidal surge. Maintain
                  VHF watch.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/60 space-y-1">
                <div className="font-bold text-sky-300">
                  Tier 4: Coastal Advisory
                </div>
                <p className="text-[11px] text-slate-400">
                  Normal operations with seasonal current cautions.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200">
              <Radio className="w-4 h-4 text-tealAccent-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Emergency Distress Frequencies
              </h3>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">
                  VHF International Distress:
                </span>
                <span className="font-bold font-mono text-slate-200">
                  Channel 16 (156.8 MHz)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Coast Guard MRCC Mumbai:</span>
                <span className="font-bold font-mono text-slate-200">
                  1554 / +91-22-24388065
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">INCOIS Coastal Helpline:</span>
                <span className="font-bold font-mono text-slate-200">
                  +91-40-23895000
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
