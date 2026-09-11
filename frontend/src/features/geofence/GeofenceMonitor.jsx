import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Compass,
  MapPin,
  Play,
  RotateCcw,
  CheckCircle2,
  Anchor,
  Flame,
  Scale,
  Navigation
} from 'lucide-react';
import { geofenceService } from '../../services/geofenceService';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function GeofenceMonitor({ onLocationChange, onSimulation }) {
  const request = useRef(0);
  const [geofenceState, setGeofenceState] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState('CLEAR');

  const runSimulation = async (scenario, moveMap = true) => {
    const id = ++request.current;
    setActiveScenario(scenario);
    setLoading(true);
    setError('');
    try {
      const res = await geofenceService.simulateScenario(scenario);
      if (id !== request.current) return;
      if (res?.data) {
        setGeofenceState(res.data);
        if (moveMap) onSimulation?.(res.data);
        if (onLocationChange && res.data.vesselPosition) {
          onLocationChange(res.data.vesselPosition);
        }
      }
    } catch (err) {
      if (id !== request.current) return;
      setError(err.message || 'Simulation failed. Try again.');
      setGeofenceState(null);
      if (moveMap) onSimulation?.(null);
    } finally {
      if (id === request.current) setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation('CLEAR', false);
    return () => { request.current++; };
  }, []);

  const statusStyles = {
    CLEAR_SAFE: {
      badge: 'bg-emerald-950 border-emerald-800 text-emerald-300',
      icon: ShieldCheck,
      title: 'CLEAR (Safe Navigational Waters)',
      border: 'border-emerald-800/80'
    },
    PROXIMITY_WARNING: {
      badge: 'bg-amber-950 border-amber-800 text-amber-300',
      icon: AlertTriangle,
      title: 'ZONE PROXIMITY WARNING',
      border: 'border-amber-800/80'
    },
    BORDER_BUFFER_WARNING: {
      badge: 'bg-orange-950 border-orange-800 text-orange-300',
      icon: AlertTriangle,
      title: 'INTERNATIONAL BORDER (IMBL) WARNING',
      border: 'border-orange-800/80'
    },
    CRITICAL_BREACH: {
      badge: 'bg-red-950 border-red-700 text-red-200 animate-pulse',
      icon: ShieldAlert,
      title: 'CRITICAL ZONE BREACH DETECTED',
      border: 'border-red-700'
    }
  };

  const currentStyle = statusStyles[geofenceState?.status] || statusStyles.CLEAR_SAFE;
  const StatusIcon = currentStyle.icon;

  return (
    <div className={`p-5 rounded-2xl bg-slate-900/90 border ${currentStyle.border} space-y-4 shadow-xl text-xs`}>
      <p className="text-slate-400">Static demo boundaries · simulated vessel</p>
      {error && <p role="alert" className="text-rose-300">{error}</p>}
      {/* Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${currentStyle.badge}`}>
            <StatusIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm">{!geofenceState ? (loading ? 'Checking position…' : 'STATUS UNAVAILABLE') : currentStyle.title}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${currentStyle.badge}`}>
                {geofenceState?.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {geofenceState?.statusDescription || 'Real-time Ray-Casting Point-in-Polygon Geofence Auditor'}
            </p>
          </div>
        </div>

        {loading && <LoadingSpinner size="sm" />}
      </div>

      {/* 1-Click Interactive Breach Simulation Buttons (Crucial for SIH Hackathon Judges) */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
          SIH Live Simulation Trigger (1-Click Demonstration):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => runSimulation('MALVAN_MPA_BREACH')}
            className={`p-2.5 rounded-xl border text-left transition ${
              activeScenario === 'MALVAN_MPA_BREACH'
                ? 'bg-rose-950/80 border-rose-600 text-rose-200 font-bold shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-rose-800'
            }`}
          >
            <div className="text-[10px] uppercase text-rose-400 font-mono">1. MPA Breach</div>
            <div className="text-xs truncate">Malvan Sanctuary</div>
          </button>

          <button
            onClick={() => runSimulation('NAVAL_FIRING_WARNING')}
            className={`p-2.5 rounded-xl border text-left transition ${
              activeScenario === 'NAVAL_FIRING_WARNING'
                ? 'bg-amber-950/80 border-amber-600 text-amber-200 font-bold shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-800'
            }`}
          >
            <div className="text-[10px] uppercase text-amber-400 font-mono">2. Naval Zone</div>
            <div className="text-xs truncate">INS Trata Range</div>
          </button>

          <button
            onClick={() => runSimulation('SIR_CREEK_IMBL_WARNING')}
            className={`p-2.5 rounded-xl border text-left transition ${
              activeScenario === 'SIR_CREEK_IMBL_WARNING'
                ? 'bg-orange-950/80 border-orange-600 text-orange-200 font-bold shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-orange-800'
            }`}
          >
            <div className="text-[10px] uppercase text-orange-400 font-mono">3. IMBL Border</div>
            <div className="text-xs truncate">Sir Creek Buffer</div>
          </button>

          <button
            onClick={() => runSimulation('CLEAR')}
            className={`p-2.5 rounded-xl border text-left transition ${
              activeScenario === 'CLEAR'
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200 font-bold shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-emerald-800'
            }`}
          >
            <div className="text-[10px] uppercase text-emerald-400 font-mono">4. Normal Sea</div>
            <div className="text-xs truncate">Clear Waters</div>
          </button>
        </div>
      </div>

      {/* Active Breach Details */}
      {geofenceState?.breachedZones?.length > 0 && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 space-y-2">
          <div className="flex items-center gap-2 text-red-300 font-bold text-xs">
            <Flame className="w-4 h-4 text-red-400" />
            <span>Active Unauthorized Polygon Transgression:</span>
          </div>
          {geofenceState.breachedZones.map((z, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-red-900/60 space-y-1">
              <div className="font-bold text-slate-100">{z.name} ({z.state})</div>
              <p className="text-[11px] text-slate-300">{z.description}</p>
              <div className="text-[10px] font-mono text-rose-400 flex items-center gap-1 mt-1">
                <Scale className="w-3.5 h-3.5" />
                <span>Statutory Penalty: {z.penalty}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning Zones Details */}
      {geofenceState?.warningZones?.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Nearby Restricted Zones Within Safety Buffer:</span>
          </div>
          {geofenceState.warningZones.map((z, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-amber-900/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100">{z.name}</span>
                <span className="text-[10px] font-mono font-bold text-amber-400">
                  {z.distanceKm} km away (Bearing {z.bearingDegrees}°)
                </span>
              </div>
              <p className="text-[11px] text-slate-300">{z.advisory}</p>
            </div>
          ))}
        </div>
      )}

      {/* Boundary Warnings Details */}
      {geofenceState?.boundaryWarnings?.length > 0 && (
        <div className="p-3.5 rounded-xl bg-orange-950/40 border border-orange-800/80 space-y-2">
          <div className="flex items-center gap-2 text-orange-300 font-bold text-xs">
            <Compass className="w-4 h-4 text-orange-400" />
            <span>International Maritime Boundary Line (IMBL) Alert:</span>
          </div>
          {geofenceState.boundaryWarnings.map((b, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-orange-900/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100">{b.name}</span>
                <span className="text-[10px] font-mono font-bold text-orange-400">
                  {b.distanceKm} km to Border Line
                </span>
              </div>
              <p className="text-[11px] text-slate-300">{b.advisory}</p>
              <div className="text-[10px] font-mono text-orange-400">
                Penalty: {b.penalty}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Steerage Corrections */}
      {geofenceState?.navigationAdvice?.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-ocean-400" />
            <span>Recommended Course Steerage:</span>
          </span>
          <ul className="space-y-0.5 text-[11px] text-slate-300 pl-4 list-disc">
            {geofenceState.navigationAdvice.map((adv, idx) => (
              <li key={idx}>{adv}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
