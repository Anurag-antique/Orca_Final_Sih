import React, { useState, useEffect } from 'react';
import {
  Waves,
  MapPin,
  ShieldCheck,
  Wind,
  Compass,
  AlertTriangle,
  Bot,
  Layers,
  ArrowUpRight,
  Maximize2,
  RefreshCw,
  Radio,
  Sparkles,
  Sliders,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { mapService } from '../services/mapService';
import { useAuth } from '../hooks/useAuth';
import MarineMap from '../features/map/MarineMap';
import RiskAuditViewer from '../features/risk/RiskAuditViewer';
import StaleBadge from '../components/StaleBadge';
import ApiError from '../components/ApiError';

export default function DashboardPage({ apiStatus }) {
  const { user } = useAuth();
  const [selectedSector, setSelectedSector] = useState(
    user?.preferredSector?.includes('Kochi') ? 'Kochi Harbor' : 'Mumbai Coast'
  );
  const [telemetry, setTelemetry] = useState(null);
  const [mapLayers, setMapLayers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRiskModal, setShowRiskModal] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, mapRes] = await Promise.all([
        dashboardService.getSummary(selectedSector),
        mapService.getLayers(selectedSector)
      ]);
      if (dashRes?.data) setTelemetry(dashRes.data);
      if (mapRes?.data) setMapLayers(mapRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSector]);

  return (
    <div className="space-y-6">
      {/* Top Bar with Sector Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight">Marine Operations Dashboard</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium">
              Phase 8 Risk Engine
            </span>
            <StaleBadge
              url={`/dashboard?sector=${encodeURIComponent(selectedSector)}`}
            />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-agent telemetry aggregation and situational awareness
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-ocean-400 shrink-0" />
            <span className="text-slate-400">Sector:</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-transparent font-semibold text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="Mumbai Coast" className="bg-slate-900 text-slate-100">Arabian Sea / Mumbai Coast</option>
              <option value="Kochi Harbor" className="bg-slate-900 text-slate-100">Arabian Sea / Kochi Harbor</option>
              <option value="Chennai Offshore" className="bg-slate-900 text-slate-100">Bay of Bengal / Chennai Coast</option>
              <option value="Visakhapatnam" className="bg-slate-900 text-slate-100">Bay of Bengal / Visakhapatnam</option>
            </select>
          </div>

          <button
            onClick={fetchDashboardData}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 transition"
            title="Refresh Dashboard Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-ocean-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <ApiError error={error} onRetry={fetchDashboardData} />}

      {/* Main Telemetry 4-Card Grid with Deterministic Engine Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Risk Assessment Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Risk Assessment
            </span>
            <button
              onClick={() => setShowRiskModal(true)}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-tealAccent-400 border border-slate-700 transition"
            >
              Inspect Rules &rarr;
            </button>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${
                telemetry?.riskAssessment?.riskLevel === 'CRITICAL'
                  ? 'text-red-400'
                  : telemetry?.riskAssessment?.riskLevel === 'HIGH'
                  ? 'text-rose-400'
                  : telemetry?.riskAssessment?.riskLevel === 'MODERATE'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {telemetry?.riskAssessment?.riskScore || 24}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
              <span className={`text-xs font-bold uppercase ml-1 ${
                telemetry?.riskAssessment?.riskLevel === 'CRITICAL' ? 'text-red-400' :
                telemetry?.riskAssessment?.riskLevel === 'HIGH' ? 'text-rose-400' :
                telemetry?.riskAssessment?.riskLevel === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                ({telemetry?.riskAssessment?.riskLevel || 'LOW'})
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2">
              {telemetry?.riskAssessment?.primaryFactors?.join(' • ') || 'Calm sea swell • Moderate breeze'}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>Confidence: {telemetry?.riskAssessment?.confidenceScore || 94}%</span>
            <span>Deterministic Engine</span>
          </div>
        </div>

        {/* 2. Weather & Wind Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Weather & Wind
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
              telemetry?.weather?.isFallback
                ? 'bg-amber-950 border-amber-800 text-amber-300'
                : 'bg-teal-950 border-teal-800 text-teal-300'
            }`}>
              {telemetry?.weather?.isFallback ? 'Fallback Model' : 'Live Open-Meteo'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-100">
                {telemetry?.weather?.windSpeedKmh || 18.2} <span className="text-sm font-normal text-slate-400">km/h</span>
              </span>
              <span className="text-xs text-ocean-400 font-semibold">
                {telemetry?.weather?.windDirection || 'WSW (245°)'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
              <span>Temp: <strong className="text-slate-200">{telemetry?.weather?.temperatureC || 28.5}°C</strong></span>
              <span>Vis: <strong className="text-slate-200">{telemetry?.weather?.visibilityKm || 10} km</strong></span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>Cyclone: {telemetry?.weather?.cycloneAlert || 'None'}</span>
            <span className="truncate max-w-[110px]" title={telemetry?.weather?.sourceOrigin}>
              {telemetry?.weather?.isFallback ? 'Mock Model' : 'Live Feed'}
            </span>
          </div>
        </div>

        {/* 3. Ocean & Waves Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ocean & Waves
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
              telemetry?.ocean?.isFallback
                ? 'bg-amber-950 border-amber-800 text-amber-300'
                : 'bg-teal-950 border-teal-800 text-teal-300'
            }`}>
              {telemetry?.ocean?.isFallback ? 'INCOIS Model' : 'Live CMEMS'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-tealAccent-400">
                {telemetry?.ocean?.significantWaveHeightM || 1.8} <span className="text-sm font-normal text-slate-400">m</span>
              </span>
              <span className="text-xs text-slate-400">
                Period: {telemetry?.ocean?.wavePeriodSec || 7.2}s
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
              <span>SST: <strong className="text-slate-200">{telemetry?.ocean?.sstCelsius || 27.8}°C</strong></span>
              <span>Chl-a: <strong className="text-slate-200">{telemetry?.ocean?.chlorophyllMgM3 || 0.95} mg/m³</strong></span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>Tide: {telemetry?.ocean?.tideStatus || 'Ebb Tide'}</span>
            <span>Current: {telemetry?.ocean?.currentSpeedMps || 0.42} m/s</span>
          </div>
        </div>

        {/* 4. PFZ Intelligence Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              PFZ Intelligence
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-semibold">
              Satellite Advisory
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-400">
                {telemetry?.pfz?.nearestZoneDistanceKm || 16.2} <span className="text-sm font-normal text-slate-400">km</span>
              </span>
              <span className="text-xs text-slate-400">
                Bearing: {telemetry?.pfz?.bearingDegrees || 265}°
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 truncate" title={telemetry?.pfz?.targetSpecies?.join(', ')}>
              Species: <strong className="text-slate-200">{telemetry?.pfz?.targetSpecies?.join(', ') || 'Mackerel, Tuna'}</strong>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>Thermal Front: Detected</span>
            <Link to="/pfz" className="text-ocean-400 hover:text-ocean-300 font-semibold">
              View All &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Embedded Deterministic Risk Audit Viewer Card */}
      {telemetry?.riskAssessment && (
        <RiskAuditViewer riskAssessment={telemetry.riskAssessment} />
      )}

      {/* Active Alerts Banner */}
      {telemetry?.alerts && telemetry.alerts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/70 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-200">{telemetry.alerts[0].title}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300">
                {telemetry.alerts[0].agency || 'INCOIS Marine Advisory'}
              </span>
            </div>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              {telemetry.alerts[0].description}
            </p>
          </div>
        </div>
      )}

      {/* Central Interactive Grid: Live MarineMap + AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-ocean-400" />
              <h2 className="font-bold text-slate-100 text-sm">Interactive Marine GIS Map</h2>
              <StaleBadge
                url={`/map/layers?sector=${encodeURIComponent(selectedSector)}`}
              />
            </div>
            <Link
              to="/map"
              className="inline-flex items-center gap-1.5 text-xs text-ocean-400 hover:text-ocean-300 font-medium transition"
            >
              <span>Full Screen GIS Center</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </Link>
          </div>

          <MarineMap
            layersData={mapLayers}
            selectedSector={selectedSector}
            onSelectSector={setSelectedSector}
            height="460px"
            compact={true}
          />
        </div>

        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-tealAccent-400" />
                <h2 className="font-bold text-slate-100">AI Marine Assistant</h2>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-300">
                Phase 6 & 7
              </span>
            </div>

            <div className="mt-5 space-y-3.5">
              <p className="text-xs text-slate-400 leading-relaxed">
                Autonomous orchestrator executing multi-agent task decomposition across weather, ocean, and advisory models:
              </p>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between hover:border-slate-700 transition cursor-default">
                  <span>💬 <em>"Is it safe to go fishing tomorrow morning?"</em></span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between hover:border-slate-700 transition cursor-default">
                  <span>💬 <em>"Where is the nearest potentially favourable fishing zone?"</em></span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between hover:border-slate-700 transition cursor-default">
                  <span>💬 <em>"Show a lower-risk navigation route."</em></span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
            Deterministic Engine: AI orchestrates &bull; Data provides evidence &bull; Rules calculate risk &bull; AI explains.
          </div>
        </div>
      </div>

      {/* Risk Modal */}
      {showRiskModal && telemetry?.riskAssessment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 relative">
            <button
              onClick={() => setShowRiskModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-white mb-3">Risk Assessment Rules</h3>
            <RiskAuditViewer riskAssessment={telemetry.riskAssessment} />
          </div>
        </div>
      )}
    </div>
  );
}