import React, { useState, useEffect } from 'react';
import {
  Database,
  Radio,
  CloudSun,
  Waves,
  Compass,
  BellRing,
  MapPin,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight
} from 'lucide-react';
import { providerService } from '../services/providerService';
import LoadingSpinner from '../components/LoadingSpinner';

const SECTORS = [
  { name: 'Mumbai Coast', lat: 18.9220, lon: 72.8347, state: 'Maharashtra' },
  { name: 'Kochi Harbor', lat: 9.9312, lon: 76.2673, state: 'Kerala' },
  { name: 'Chennai Offshore', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
  { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185, state: 'Andhra Pradesh' },
];

export default function DataSourcesPage() {
  const [sourcesInfo, setSourcesInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  const [activeQueryDomain, setActiveQueryDomain] = useState('weather');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  const loadSources = async () => {
    setLoading(true);
    try {
      const res = await providerService.getDataSources();
      setSourcesInfo(res);
    } catch (err) {
      console.error('Error fetching data sources catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const runSampleQuery = async (domain = activeQueryDomain, sector = selectedSector) => {
    setQueryLoading(true);
    try {
      let res;
      if (domain === 'weather') {
        res = await providerService.getWeather(sector.lat, sector.lon, sector.name);
      } else if (domain === 'ocean') {
        res = await providerService.getOceanConditions(sector.lat, sector.lon);
      } else if (domain === 'pfz') {
        res = await providerService.getPFZs(sector.lat, sector.lon);
      } else if (domain === 'advisory') {
        res = await providerService.getAdvisories(sector.lat, sector.lon);
      } else if (domain === 'geospatial') {
        res = await providerService.getGeospatialZones(sector.lat, sector.lon);
      }
      setQueryResult(res);
    } catch (err) {
      setQueryResult({ error: err.message || 'Query failed' });
    } finally {
      setQueryLoading(false);
    }
  };

  useEffect(() => {
    runSampleQuery(activeQueryDomain, selectedSector);
  }, [activeQueryDomain, selectedSector]);

  const providerIcons = {
    weather: CloudSun,
    ocean: Waves,
    pfz: Compass,
    advisory: BellRing,
    geospatial: MapPin
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Data Provider Architecture</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium">
              Phase 4 Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Decoupled data provider contracts, abstraction layers, and fallback registries
          </p>
        </div>

        <button
          onClick={loadSources}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-ocean-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Providers</span>
        </button>
      </div>

      {/* Provider Architecture Schematic Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-navy-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-ocean-400" />
            <h2 className="font-bold text-slate-100 text-sm">Provider Decoupling Pipeline</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Strict Interface Compliance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-mono text-ocean-400 font-bold">Layer 1</span>
            <div className="font-bold text-slate-200">UI / Dashboard</div>
            <p className="text-[10px] text-slate-500">React Frontend Components</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-mono text-ocean-400 font-bold">Layer 2</span>
            <div className="font-bold text-slate-200">Backend Services</div>
            <p className="text-[10px] text-slate-500">Business Logic & Verification</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-mono text-ocean-400 font-bold">Layer 3</span>
            <div className="font-bold text-slate-200">Provider Interface</div>
            <p className="text-[10px] text-slate-500">IWeather, IOcean, IPFZs</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-mono text-tealAccent-400 font-bold">Layer 4</span>
            <div className="font-bold text-slate-200">Mock / Real Satellite</div>
            <p className="text-[10px] text-slate-500">INCOIS, IMD, Sentinel-3</p>
          </div>
        </div>
      </div>

      {/* 5 Registered Provider Cards */}
      <div>
        <h3 className="font-bold text-slate-200 text-sm mb-3">Registered Data Providers ({sourcesInfo?.registeredProvidersCount || 5})</h3>
        
        {loading && !sourcesInfo ? (
          <div className="h-40 flex items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <LoadingSpinner message="Querying provider registry..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sourcesInfo?.providers?.map((provider) => {
              const IconComponent = providerIcons[provider.domain] || Database;
              return (
                <div
                  key={provider.domain}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-ocean-950 border border-ocean-800 text-ocean-400">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wide">
                          {provider.domain} Provider
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500">v{provider.version}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-semibold">
                      {provider.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="text-slate-200 font-mono text-[11px] truncate">
                      {provider.name}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>Mode: <strong className="text-amber-400 font-mono">{provider.isMock ? 'Mock Model (Demo)' : 'Live Feed'}</strong></span>
                      <span>Latency: <strong className="text-tealAccent-400 font-mono">{provider.latencyMs}ms</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Provider Query Sandbox */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-tealAccent-400" />
            <h3 className="font-bold text-slate-100 text-sm">Provider Query Sandbox</h3>
          </div>

          {/* Sector Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Target Sector:</span>
            <select
              value={selectedSector.name}
              onChange={(e) => {
                const sec = SECTORS.find((s) => s.name === e.target.value) || SECTORS[0];
                setSelectedSector(sec);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-medium focus:outline-none"
            >
              {SECTORS.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Domain Tabs */}
        <div className="flex flex-wrap gap-2">
          {['weather', 'ocean', 'pfz', 'advisory', 'geospatial'].map((domain) => (
            <button
              key={domain}
              onClick={() => setActiveQueryDomain(domain)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                activeQueryDomain === domain
                  ? 'bg-ocean-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {domain} Provider
            </button>
          ))}
        </div>

        {/* Query Response Viewer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Query Payload & Evidence Audit:</span>
            {queryResult?.source && (
              <span className="font-mono text-[11px] text-ocean-300">
                Dataset: {queryResult.source.dataset}
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs text-slate-300 overflow-x-auto max-h-[340px]">
            {queryLoading ? (
              <div className="py-8 flex items-center justify-center">
                <LoadingSpinner size="sm" message="Executing provider retrieval..." />
              </div>
            ) : (
              <pre className="leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(queryResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
