import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Compass,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Waves,
  Wind,
  Fuel,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { routeService } from '../../services/routeService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ApiError from '../../components/ApiError';
import StaleBadge from '../../components/StaleBadge';
import { usePendingActions } from '../../context/PendingActionContext';

export default function RoutePlanner({ onRouteGenerated, currentPlan }) {
  const { remember } = usePendingActions();

  const [harbors, setHarbors] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [selectedOrigin, setSelectedOrigin] = useState('mumbai_sassoon_dock');
  const [selectedDestination, setSelectedDestination] = useState('mumbai_pfz_alpha');
  const [cruisingSpeed, setCruisingSpeed] = useState(8.5);
  const [vesselType, setVesselType] = useState('small_motorized');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWaypoints = async () => {
      try {
        const res = await routeService.getWaypoints();
        if (res?.data) {
          setHarbors(res.data.harbors || []);
          setDestinations(res.data.destinations || []);
        }
      } catch (err) {
        console.error('Error loading route waypoints:', err);
      }
    };
    fetchWaypoints();
  }, []);

  const handlePlanRoute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await routeService.planRoute(
        selectedOrigin,
        selectedDestination,
        {
          typeKey: vesselType,
          name:
            vesselType === 'small_motorized'
              ? 'Small Motorized Craft (12m)'
              : 'Traditional Craft (<10m)'
        },
        cruisingSpeed
      );
      if (res?.data && onRouteGenerated) {
        onRouteGenerated(res.data);
      }
    } catch (err) {
      console.error('Error planning route:', err);
      setError(err);
      // Offline: remember intent so the user gets a toast when back online.
      if (err?.offline) remember('Plan route');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handlePlanRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrigin, selectedDestination]);

  const plan = currentPlan;
  const direct = plan?.directBaselineRoute;
  const proposed = plan?.lowerRiskProposedRoute;

  return (
    <div className="space-y-4 text-xs">
      {/* Configuration Controls Card */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-slate-100 text-sm">
              Lower-Risk Route Planning
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <StaleBadge url="/routes/waypoints" params={{}} />
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
              Phase 11 Active
            </span>
          </div>
        </div>

        {/* Origin Harbor Selector */}
        <div className="space-y-1.5">
          <label className="text-slate-400 font-semibold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Departure Port / Harbor:</span>
          </label>
          <select
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-medium focus:outline-none focus:border-cyan-500 transition"
          >
            {harbors.map((h) => (
              <option
                key={h.id}
                value={h.id}
                className="bg-slate-900 text-slate-100"
              >
                {h.name} ({h.state})
              </option>
            ))}
          </select>
        </div>

        {/* Destination PFZ Selector */}
        <div className="space-y-1.5">
          <label className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Destination Ground / PFZ:</span>
          </label>
          <select
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-medium focus:outline-none focus:border-cyan-500 transition"
          >
            {destinations.map((d) => (
              <option
                key={d.id}
                value={d.id}
                className="bg-slate-900 text-slate-100"
              >
                {d.name} &bull; {d.targetSpecies?.join(', ')}
              </option>
            ))}
          </select>
        </div>

        {/* Cruising Speed Slider */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Vessel Cruising Speed:</span>
            <span className="font-mono font-bold text-cyan-400">
              {cruisingSpeed} Knots
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="18"
            step="0.5"
            value={cruisingSpeed}
            onChange={(e) => setCruisingSpeed(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-950"
          />
        </div>

        <button
          onClick={handlePlanRoute}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-ocean-600 hover:from-cyan-500 hover:to-ocean-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-950/50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          <span>Calculate Lower-Risk Trajectory</span>
        </button>

        {/* Offline / error feedback */}
        {error && (
          <ApiError error={error} onRetry={handlePlanRoute} />
        )}
      </div>

      {/* Route Risk Comparison Cards */}
      {plan && (
        <div className="space-y-3">
          <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400 px-1">
            Route Risk & Telemetry Comparison
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Direct Baseline Path Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-rose-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Direct Baseline</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950 border border-rose-800 text-rose-300 font-bold">
                  Score: {direct?.riskScore}/100 ({direct?.riskLevel})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-500 block">Distance:</span>
                  <strong className="text-slate-200">
                    {direct?.totalDistanceNm} NM
                  </strong>{' '}
                  ({direct?.totalDistanceKm} km)
                </div>
                <div>
                  <span className="text-slate-500 block">Est. Time:</span>
                  <strong className="text-slate-200">
                    {direct?.estimatedDurationHours} Hours
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Max Wave:</span>
                  <strong className="text-rose-400">
                    {direct?.maxWaveExposureM} m
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Geofence:</span>
                  <span className="text-rose-400 font-medium">
                    {direct?.hazardBreaches > 0
                      ? `${direct.hazardBreaches} Warning`
                      : 'Clear'}
                  </span>
                </div>
              </div>
            </div>

            {/* Lower-Risk Recommended Route Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-800/80 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Lower-Risk Route</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                  Score: {proposed?.riskScore}/100 ({proposed?.riskLevel})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-500 block">Distance:</span>
                  <strong className="text-slate-200">
                    {proposed?.totalDistanceNm} NM
                  </strong>{' '}
                  (+{proposed?.detourAdditionalNm} NM)
                </div>
                <div>
                  <span className="text-slate-500 block">Est. Time:</span>
                  <strong className="text-slate-200">
                    {proposed?.estimatedDurationHours} Hours
                  </strong>{' '}
                  (+{proposed?.detourAdditionalMinutes}m)
                </div>
                <div>
                  <span className="text-slate-500 block">Max Wave:</span>
                  <strong className="text-emerald-400">
                    {proposed?.maxWaveExposureM} m
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Geofence:</span>
                  <span className="text-emerald-400 font-medium">
                    100% Clear
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Turn by Turn Steerage Directives */}
          {proposed?.turnByTurnDirectives?.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  Turn-by-Turn Waypoint Directives (
                  {proposed.turnByTurnDirectives.length} Legs):
                </span>
              </span>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {proposed.turnByTurnDirectives.map((leg) => (
                  <div
                    key={leg.legIndex}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-200">
                        {leg.instruction}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Leg Distance:{' '}
                        <strong>{leg.distanceNm} NM</strong> (
                        {leg.distanceKm} km) &bull; Est: {leg.estimatedMinutes}{' '}
                        mins
                      </div>
                    </div>
                    <div className="font-mono text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-900/60 px-2 py-0.5 rounded text-[10px]">
                      {leg.bearingDegrees}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Terminology Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-500 leading-relaxed space-y-1">
            <span className="font-bold text-slate-400">
              Scientific Terminology & Disclaimer:
            </span>
            <p>
              ORCA provides{' '}
              <strong>"Lower-risk route recommendations"</strong> based on
              available satellite wave and meteorological forecasts. The
              platform never guarantees safety. The Vessel Master maintains
              sole navigational responsibility.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}