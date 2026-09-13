import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ExternalLink,
  MapPin,
  Crosshair,
  Search,
  Loader2,
  X,
  AlertCircle,
  Route as RouteIcon,
} from "lucide-react";
import WeatherSafety from "../features/map/WeatherSafety";
import MarineMap from "../features/map/MarineMap";
import { providerService } from "../services/providerService";
import { vesselService } from "../services/vesselService";
import { maritimeRoutingService } from "../services/maritimeRoutingService";
import useGeolocation from "../hooks/useGeolocation";
import useDebouncedSearch from "../hooks/useDebouncedSearch";

const formatAdvisoryDate = (value) => {
  const match = /^(\d{4})-(\d{3})$/.exec(value || "");
  if (!match) return value || "current";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(Number(match[1]), 0, Number(match[2]))));
};

/* -------- Location search field (same as Batch 1) -------- */
function LocationSearchField({
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  accent = "sky",
}) {
  const [open, setOpen] = useState(false);
  const { results, loading, error } = useDebouncedSearch(value);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const ring =
    accent === "emerald"
      ? "focus-within:border-emerald-700 focus-within:ring-emerald-900"
      : accent === "rose"
        ? "focus-within:border-rose-700 focus-within:ring-rose-900"
        : "focus-within:border-sky-700 focus-within:ring-sky-900";

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 transition focus-within:ring-2 ${ring}`}
      >
        <Search className="h-4 w-4 text-slate-500 shrink-0" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
        />
        {loading && (
          <Loader2 className="h-3.5 w-3.5 text-slate-500 animate-spin" />
        )}
        {value && !loading && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="text-slate-500 hover:text-slate-300"
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (results.length > 0 || error) && (
        <ul className="absolute z-[500] mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
          {error && (
            <li className="px-3 py-2 text-xs text-amber-300">
              <AlertCircle className="inline h-3 w-3 mr-1" />
              {error}
            </li>
          )}
          {results.map((r) => (
            <li key={r.id || `${r.lat},${r.lon}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect({
                    lat: r.lat,
                    lon: r.lon,
                    name: r.displayName || r.name,
                  });
                  onChange(r.name || r.displayName || "");
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-800"
              >
                <div className="font-medium truncate">
                  {r.name || r.displayName}
                </div>
                {r.displayName && r.name && (
                  <div className="text-[11px] text-slate-500 truncate">
                    {r.displayName}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
export default function MapPage() {
  const [selectedSector, setSelectedSector] = useState("Mumbai Coast");
  const [point, setPoint] = useState(null);
  const [reading, setReading] = useState(null);
  const [pfz, setPfz] = useState(null);
  const [pfzError, setPfzError] = useState("");
  const [pfzLoading, setPfzLoading] = useState(true);

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState(null);
  const [followUser, setFollowUser] = useState(false);

  // Route + vessels (Phase 1)
  const [route, setRoute] = useState(null); // { geometry, distanceNm, provider }
  const [routeError, setRouteError] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [vessels, setVessels] = useState([]);
  const [vesselsStatus, setVesselsStatus] = useState({
    connected: false,
    count: 0,
  });

  const {
    position: userLocation,
    status: geoStatus,
    error: geoError,
    start: startGeolocation,
    stop: stopGeolocation,
  } = useGeolocation({
    watch: true,
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 5000,
  });

  useEffect(() => {
    if (geoStatus === "active" && userLocation && !origin) {
      setOrigin({
        lat: userLocation.lat,
        lon: userLocation.lon,
        name: "Current location",
      });
      setOriginQuery("Current location");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoStatus, userLocation?.lat, userLocation?.lon]);

  const mapLayers = useMemo(() => {
    if (pfz?.data?.geojson) return { pfz: pfz.data.geojson };
    if (pfz?.data?.zones?.length) {
      return {
        pfz: {
          type: "FeatureCollection",
          features: pfz.data.zones
            .filter((z) => z.geometry)
            .map((z) => ({
              type: "Feature",
              id: z.id,
              properties: {
                name: z.name,
                confidence: z.confidenceRatingPct,
                recommendation: z.recommendationLabel,
              },
              geometry: z.geometry,
            })),
        },
      };
    }
    return null;
  }, [pfz]);

  /* ---- PFZ ---- */
  useEffect(() => {
    let cancelled = false;
    setPfzLoading(true);
    setPfzError("");
    providerService
      .getPFZs(undefined, undefined, selectedSector)
      .then((result) => {
        if (!cancelled) setPfz(result);
      })
      .catch((error) => {
        if (!cancelled) {
          setPfz(null);
          setPfzError(error.message || "Official INCOIS PFZ data unavailable.");
        }
      })
      .finally(() => {
        if (!cancelled) setPfzLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSector]);

  /* ---- Live vessels (10 s poll, aborted on unmount / tab hidden) ---- */
  useEffect(() => {
    let cancelled = false;
    let controller = new AbortController();
    let timer = null;

    const tick = async () => {
      if (document.hidden) return;
      controller.abort();
      controller = new AbortController();
      try {
        const res = await vesselService.list(null, {
          signal: controller.signal,
        });
        if (cancelled) return;
        setVessels(Array.isArray(res?.vessels) ? res.vessels : []);
        setVesselsStatus({
          connected: !!res?.connected,
          count: res?.count || 0,
        });
      } catch (err) {
        if (cancelled || err?.message === "canceled" || err?.status === 0)
          return;
        setVessels([]);
        setVesselsStatus({
          connected: false,
          count: 0,
          error: err?.message || "Vessel feed unavailable",
        });
      }
    };

    tick();
    timer = setInterval(tick, 10000);

    return () => {
      cancelled = true;
      controller.abort();
      if (timer) clearInterval(timer);
    };
  }, []);

  /* ---- Route: recompute when origin or destination change ---- */
  useEffect(() => {
    if (!origin || !destination) {
      setRoute(null);
      setRouteError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const timer = setTimeout(async () => {
      setRouteLoading(true);
      setRouteError(null);
      try {
        const res = await maritimeRoutingService.computeRoute(
          { origin, destination },
          { signal: controller.signal },
        );
        if (cancelled) return;
        setRoute(res?.route || null);
      } catch (err) {
        if (cancelled || err?.message === "canceled" || err?.status === 0)
          return;
        setRoute(null);
        setRouteError(err?.message || "Unable to calculate a marine route.");
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    }, 400); // small debounce to avoid hammering when user clicks map twice

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [origin?.lat, origin?.lon, destination?.lat, destination?.lon]);

  const changeSector = (sector) => {
    setSelectedSector(sector);
    setPoint(null);
    setReading(null);
  };

  const handleUseMyLocation = useCallback(() => {
    setFollowUser(true);
    startGeolocation();
  }, [startGeolocation]);

  const handleMapPick = useCallback(({ lat, lon, mode }) => {
    if (mode === "origin") {
      setOrigin({ lat, lon, name: `${lat.toFixed(4)}, ${lon.toFixed(4)}` });
      setOriginQuery(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } else if (mode === "destination") {
      setDestination({
        lat,
        lon,
        name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      });
      setDestinationQuery(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }
    setSelectionMode(null);
  }, []);

  return (
    <div className="marine-map-page space-y-6">
      <div className="marine-map-header flex flex-col justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Marine GIS & Geofencing Command Center
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium">
              Live weather & ocean safety
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Live weather and ocean conditions for the point you select on the
            map
          </p>
        </div>

        <div className="marine-map-controls flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-ocean-400 shrink-0" />
            <span className="text-slate-400">Sector:</span>
            <select
              value={selectedSector}
              onChange={(e) => changeSector(e.target.value)}
              className="min-w-0 bg-transparent font-semibold text-slate-100 focus:outline-none cursor-pointer"
            >
              <option
                value="Mumbai Coast"
                className="bg-slate-900 text-slate-100"
              >
                Arabian Sea / Mumbai Coast
              </option>
              <option
                value="Kochi Harbor"
                className="bg-slate-900 text-slate-100"
              >
                Arabian Sea / Kochi Harbor
              </option>
              <option
                value="Chennai Offshore"
                className="bg-slate-900 text-slate-100"
              >
                Bay of Bengal / Chennai Coast
              </option>
              <option
                value="Visakhapatnam"
                className="bg-slate-900 text-slate-100"
              >
                Bay of Bengal / Visakhapatnam
              </option>
              <option value="Porbandar" className="bg-slate-900 text-slate-100">
                Gujarat / Porbandar & Kutch
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Vessel feed status pill */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded-full border px-2 py-1 ${
            vesselsStatus.connected
              ? "border-emerald-800 bg-emerald-950 text-emerald-200"
              : "border-amber-800 bg-amber-950 text-amber-200"
          }`}
        >
          {vesselsStatus.connected
            ? `Live vessel feed · ${vesselsStatus.count} vessels`
            : vesselsStatus.error
              ? `Vessel feed unavailable — ${vesselsStatus.error}`
              : "Vessel feed connecting…"}
        </span>
      </div>

      {/* Origin / Destination planner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-100">
            Plan a marine route
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-800 bg-sky-950/50 px-3 py-1.5 text-xs font-medium text-sky-200 hover:bg-sky-900/60 transition"
            >
              <Crosshair className="h-3.5 w-3.5" /> Use my current location
            </button>
            {followUser && geoStatus === "active" && (
              <button
                type="button"
                onClick={() => {
                  setFollowUser(false);
                  stopGeolocation();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition"
              >
                Stop following
              </button>
            )}
          </div>
        </div>

        {(geoError || (geoStatus !== "idle" && geoStatus !== "active")) && (
          <div
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
              geoStatus === "active"
                ? "border-emerald-900 bg-emerald-950/40 text-emerald-200"
                : "border-amber-900 bg-amber-950/40 text-amber-200"
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              {geoStatus === "prompting" && "Requesting location permission…"}
              {geoStatus === "denied" &&
                "Location permission denied. Please search or click the map to choose a location."}
              {geoStatus === "unavailable" &&
                "Location unavailable. You can still search or click the map."}
              {geoStatus === "timeout" &&
                "Location request timed out. Try again or select on the map."}
              {geoStatus === "unsupported" &&
                "This browser does not support geolocation."}
              {geoStatus === "insecure" &&
                "Location requires HTTPS. Use manual search instead."}
              {geoStatus === "active" &&
                userLocation &&
                `Live location active (±${Math.round(userLocation.accuracy || 0)} m)`}
              {geoError && geoStatus !== "active" && ` — ${geoError}`}
            </span>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <LocationSearchField
              label="Origin"
              value={originQuery}
              onChange={setOriginQuery}
              onSelect={(loc) => setOrigin(loc)}
              placeholder="Search origin or use current location"
              accent="emerald"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectionMode("origin")}
                className={`text-xs rounded-md border px-2 py-1 transition ${
                  selectionMode === "origin"
                    ? "border-emerald-700 bg-emerald-950/60 text-emerald-200"
                    : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {selectionMode === "origin"
                  ? "Click the map…"
                  : "Select on map"}
              </button>
              {origin && (
                <button
                  type="button"
                  onClick={() => {
                    setOrigin(null);
                    setOriginQuery("");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <LocationSearchField
              label="Destination"
              value={destinationQuery}
              onChange={setDestinationQuery}
              onSelect={(loc) => setDestination(loc)}
              placeholder="Search destination or select on map"
              accent="rose"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectionMode("destination")}
                className={`text-xs rounded-md border px-2 py-1 transition ${
                  selectionMode === "destination"
                    ? "border-rose-700 bg-rose-950/60 text-rose-200"
                    : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {selectionMode === "destination"
                  ? "Click the map…"
                  : "Select on map"}
              </button>
              {destination && (
                <button
                  type="button"
                  onClick={() => {
                    setDestination(null);
                    setDestinationQuery("");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Route status */}
        {origin && destination && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
              routeLoading
                ? "border-slate-700 text-slate-300"
                : routeError
                  ? "border-amber-900 bg-amber-950/40 text-amber-200"
                  : route
                    ? "border-emerald-900 bg-emerald-950/40 text-emerald-200"
                    : "border-slate-700 text-slate-400"
            }`}
          >
            <RouteIcon className="h-3.5 w-3.5 shrink-0" />
            {routeLoading && "Calculating maritime route…"}
            {!routeLoading && routeError && `Route unavailable: ${routeError}`}
            {!routeLoading && !routeError && route && (
              <>
                Marine route ready — {route.distanceNm} NM. Provider:{" "}
                {route.provider}.
              </>
            )}
            {!routeLoading &&
              !routeError &&
              !route &&
              "Waiting for a valid maritime route…"}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-sky-900/80 bg-sky-950/30 px-4 py-3 text-xs text-sky-100">
        <span className="font-semibold">Live data mode.</span> Official INCOIS
        overlays are available from the public WebGIS.{" "}
        <a
          className="inline-flex items-center gap-1 underline text-sky-300"
          href="https://incois.gov.in/geoportal/MFASPFZ/index.html"
          target="_blank"
          rel="noreferrer"
        >
          INCOIS PFZ WebGIS <ExternalLink className="h-3 w-3" />
        </a>
        .
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded-full border px-2 py-1 ${
            pfzLoading
              ? "border-slate-700 text-slate-400"
              : pfzError
                ? "border-amber-800 bg-amber-950 text-amber-200"
                : pfz?.source?.isFallback
                  ? "border-yellow-800 bg-yellow-950 text-yellow-200"
                  : "border-emerald-800 bg-emerald-950 text-emerald-200"
          }`}
        >
          {pfzLoading
            ? "Loading INCOIS PFZ…"
            : pfzError
              ? "Official INCOIS PFZ unavailable"
              : pfz?.source?.isFallback
                ? "INCOIS PFZ fallback"
                : `INCOIS PFZ live · ${pfz?.data?.zoneCount || 0} lines · advisory ${formatAdvisoryDate(pfz?.source?.advisoryDate)}`}
        </span>
        {pfzError && (
          <span className="text-slate-400">
            No PFZ geometry shown. ({pfzError})
          </span>
        )}
      </div>

      <div className="marine-map-grid grid gap-6">
        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950">
            <MarineMap
              layersData={mapLayers}
              onPointSelect={setPoint}
              safety={reading}
              selectedSector={selectedSector}
              showDemoLayers={false}
              visibleLayers={["pfz"]}
              showOfficialLayers
              height="clamp(420px, 68vh, 680px)"
              userLocation={userLocation}
              origin={origin}
              destination={destination}
              selectionMode={selectionMode}
              onMapPick={handleMapPick}
              followUser={followUser}
              vessels={vessels}
              routeGeometry={route?.geometry || null}
              routeError={routeError}
            />
          </div>
          <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-400">
            Click the map to request live weather and ocean conditions. The
            dotted circle is a weather-risk reading, not a navigational
            boundary.
          </p>
        </div>
        <div className="min-w-0 space-y-4">
          <WeatherSafety
            point={point}
            sector={selectedSector}
            reading={reading}
            onReading={setReading}
          />
        </div>
      </div>
    </div>
  );
}
