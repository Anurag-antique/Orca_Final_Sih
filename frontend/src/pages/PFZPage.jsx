import React, { useState, useEffect, useMemo } from "react";
import {
  Fish,
  MapPin,
  ShieldCheck,
  RefreshCw,
  Layers,
  Info,
} from "lucide-react";
import { providerService } from "../services/providerService";
import MarineMap from "../features/map/MarineMap";
import LoadingSpinner from "../components/LoadingSpinner";

const SECTORS = [
  { name: "Mumbai Coast", lat: 18.922, lon: 72.8347 },
  { name: "Kochi Harbor", lat: 9.9312, lon: 76.2673 },
  { name: "Chennai Offshore", lat: 13.0827, lon: 80.2707 },
  { name: "Visakhapatnam", lat: 17.6868, lon: 83.2185 },
];

const NA = "—";

// Renders "value unit" or "—" — never a fake fallback.
const show = (value, unit = "") => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    Number.isNaN(value)
  ) {
    return NA;
  }
  return unit ? `${value} ${unit}` : `${value}`;
};

export default function PFZPage() {
  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  const [pfzData, setPfzData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [oceanData, setOceanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapLayers = useMemo(() => {
    if (pfzData?.data?.geojson) return { pfz: pfzData.data.geojson };
    const features = (pfzData?.data?.zones || [])
      .filter((zone) => zone.geometry)
      .map((zone) => ({
        type: "Feature",
        id: zone.id,
        properties: { name: zone.name },
        geometry: zone.geometry,
      }));
    if (!features.length) return null;
    return { pfz: { type: "FeatureCollection", features } };
  }, [pfzData]);

  useEffect(() => {
    let cancelled = false;

    const fetchPFZTelemetry = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pfzRes, wRes, oRes] = await Promise.all([
          // Sector name is REQUIRED so the backend filters correctly.
          providerService.getPFZs(
            selectedSector.lat,
            selectedSector.lon,
            selectedSector.name,
          ),
          providerService.getWeather(
            selectedSector.lat,
            selectedSector.lon,
            selectedSector.name,
          ),
          providerService.getOceanConditions(
            selectedSector.lat,
            selectedSector.lon,
          ),
        ]);
        if (cancelled) return;
        setPfzData(pfzRes);
        setWeatherData(wRes);
        setOceanData(oRes);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Unable to load PFZ data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPFZTelemetry();
    return () => {
      cancelled = true;
    };
  }, [selectedSector]);

  const zones = pfzData?.data?.zones || [];
  const nearest = zones[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            PFZ Intelligence & Pelagic Zones
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Satellite-derived fishing zone advisories for the selected coastal
            sector.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-ocean-400 shrink-0" />
            <span className="text-slate-400">Sector:</span>
            <select
              value={selectedSector.name}
              onChange={(e) => {
                const s = SECTORS.find((sec) => sec.name === e.target.value);
                if (s) setSelectedSector(s);
              }}
              className="bg-transparent font-semibold text-slate-100 focus:outline-none cursor-pointer text-xs"
            >
              {SECTORS.map((sec) => (
                <option
                  key={sec.name}
                  value={sec.name}
                  className="bg-slate-900 text-slate-100"
                >
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setSelectedSector({ ...selectedSector })}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 transition"
            title="Refresh PFZ data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-ocean-400 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-900 bg-amber-950/40 px-4 py-3 text-xs text-amber-200">
          {error}
        </div>
      )}

      {/* Top statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Identified PFZs
          </span>
          <div className="text-2xl font-black text-emerald-400">
            {loading
              ? NA
              : `${zones.length} zone${zones.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Nearest zone distance
          </span>
          <div className="text-2xl font-black text-slate-100">
            {show(nearest?.distanceKm, "km")}
          </div>
          {nearest?.bearingDegrees != null && (
            <p className="text-[10px] text-ocean-400 font-semibold">
              Bearing {nearest.bearingDegrees}°
            </p>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Sea surface temperature
          </span>
          <div className="text-2xl font-black text-tealAccent-400">
            {show(nearest?.seaSurfaceTempC, "°C")}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Sea state at zone
          </span>
          <div className="text-2xl font-black text-amber-400">
            {show(oceanData?.data?.significantWaveHeightM, "m")}
          </div>
          {weatherData?.data?.windSpeedKmh != null && (
            <p className="text-[10px] text-slate-500">
              Wind {weatherData.data.windSpeedKmh} km/h
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Fish className="w-4 h-4 text-emerald-400" />
              <span>Fishing zones — {selectedSector.name}</span>
            </h2>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <LoadingSpinner message="Loading fishing-zone data…" />
            </div>
          ) : zones.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No fishing zone advisories are available for this sector right
              now.
            </div>
          ) : (
            zones.map((zone) => {
              // Determine which detail fields have real values.
              const detailFields = [
                {
                  label: "Sea surface temp",
                  value: zone.seaSurfaceTempC,
                  unit: "°C",
                },
                {
                  label: "Chlorophyll-a",
                  value: zone.chlorophyllConcentrationMgM3,
                  unit: "mg/m³",
                },
                {
                  label: "Thermal gradient",
                  value: zone.thermalGradientCPerKm,
                  unit: "°C/km",
                },
                {
                  label: "Depth range",
                  value: zone.depthRangeMeters,
                  unit: "",
                },
              ].filter(
                (f) =>
                  f.value !== null && f.value !== undefined && f.value !== "",
              );

              const hasSpecies =
                Array.isArray(zone.targetSpecies) &&
                zone.targetSpecies.length > 0;

              return (
                <div
                  key={zone.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      {zone.confidenceRatingPct != null && (
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-semibold">
                          {zone.confidenceRatingPct}% confidence
                        </span>
                      )}
                      <h3 className="text-base font-bold text-white mt-1">
                        {zone.name || "Unnamed zone"}
                      </h3>
                    </div>

                    {(zone.distanceKm != null ||
                      zone.bearingDegrees != null) && (
                      <div className="text-right">
                        <div className="text-xs font-bold text-ocean-400 font-mono">
                          {zone.distanceKm != null
                            ? `${zone.distanceKm} km`
                            : ""}
                          {zone.distanceKm != null &&
                          zone.bearingDegrees != null
                            ? " • "
                            : ""}
                          {zone.bearingDegrees != null
                            ? `${zone.bearingDegrees}°`
                            : ""}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          From coastal baseline
                        </div>
                      </div>
                    )}
                  </div>

                  {detailFields.length > 0 && (
                    <div
                      className="grid gap-2 text-xs"
                      style={{
                        gridTemplateColumns: `repeat(${Math.min(detailFields.length, 4)}, minmax(0, 1fr))`,
                      }}
                    >
                      {detailFields.map((f) => (
                        <div
                          key={f.label}
                          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80"
                        >
                          <span className="text-[10px] text-slate-400">
                            {f.label}
                          </span>
                          <div className="font-bold text-slate-200 mt-0.5">
                            {show(f.value, f.unit)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {hasSpecies && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-slate-300">
                        Target species:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {zone.targetSpecies.map((sp, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs flex items-center gap-1.5 font-medium"
                          >
                            <Fish className="w-3 h-3 text-ocean-400" />
                            <span>{sp}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-tealAccent-400" />
                      <span>Decision support — no catch guarantee.</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-ocean-400" />
              <span>Zone preview</span>
            </h2>
          </div>

          <MarineMap
            layersData={mapLayers}
            selectedSector={selectedSector.name}
            showDemoLayers={false}
            visibleLayers={["pfz"]}
            showOfficialLayers
            height="480px"
            compact={true}
          />

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Info className="w-4 h-4 text-ocean-400" />
              <span>About these advisories</span>
            </div>
            <p className="leading-relaxed">
              Fishing zone advisories correlate satellite sea-surface
              temperature fronts with chlorophyll concentration. They indicate
              likely fish aggregation areas and do not guarantee a catch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
