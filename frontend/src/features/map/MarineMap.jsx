import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  Polyline,
  LayersControl,
  useMap,
  useMapEvents,
  CircleMarker,
  Circle,
  WMSTileLayer,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const GIS_LAYERS = [
  ["pfz", "PFZ Pelagic Zones", "#34d399", "#10b981"],
  ["protected", "Marine Protected Areas (MPAs)", "#10b981", "#065f46"],
  ["restricted", "Naval Restricted Zones", "#f43f5e", "#881337"],
  ["hazards", "Submerged Hazards", "#f59e0b", "#f59e0b"],
  ["imbl", "IMBL Border", "#ef4444", "#ef4444"],
];

const INCOIS_WMS = "https://www.incois.gov.in/geoserver";
const OFFICIAL_LAYERS = [
  {
    key: "eez",
    name: "INCOIS EEZ",
    url: `${INCOIS_WMS}/PFZ_EEZ/wms`,
    layers: "PFZ_EEZ:indiaeez",
  },
  {
    key: "sectors",
    name: "INCOIS Sectors",
    url: `${INCOIS_WMS}/PFZ_Sectors/wms`,
    layers: "PFZ_Sectors:sector_new",
  },
  {
    key: "landingCentres",
    name: "INCOIS Landing Centres",
    url: `${INCOIS_WMS}/PFZ_LandingCentres/wms`,
    layers: "PFZ_LandingCentres:LandingCenters_29Apr2024",
  },
  {
    key: "bathymetry",
    name: "INCOIS Bathymetry",
    url: `${INCOIS_WMS}/PFZ_Bathymetry/wms`,
    layers: "PFZ_Bathymetry:bathymetry",
  },
];

const SECTOR_CENTERS = {
  "Mumbai Coast": [18.922, 72.8347],
  "Kochi Harbor": [9.9312, 76.2673],
  "Chennai Offshore": [13.0827, 80.2707],
  Visakhapatnam: [17.6868, 83.2185],
  Porbandar: [21.6417, 69.6293],
};

const createCustomIcon = (colorBg, symbol) =>
  L.divIcon({
    className: "custom-leaflet-icon",
    html: `<div style="background-color:${colorBg};width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.5);font-size:11px;font-weight:bold;color:white;">${symbol}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

const createVesselIcon = (color) =>
  L.divIcon({
    className: "custom-leaflet-vessel",
    html: `<div style="background-color:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.6);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function MapView({
  center,
  simulation,
  layersData,
  onPointSelect,
  onMapPick,
  selectionMode,
  userLocation,
  followUser,
  origin,
  destination,
  routeGeometry,
}) {
  const map = useMap();
  const flewToUserRef = useRef(false);

  useMapEvents({
    click: (event) => {
      const point = event.latlng.wrap();

      // Selection mode: assign origin or destination instead of a weather point.
      if (selectionMode && onMapPick) {
        onMapPick({ lat: point.lat, lon: point.lng, mode: selectionMode });
        return;
      }

      map.flyTo(point, Math.max(map.getZoom(), 11), { duration: 0.45 });
      onPointSelect?.({ lat: point.lat, lon: point.lng });
    },
  });

  // Default sector view (skipped when a stronger signal exists).
  useEffect(() => {
    if (simulation) return;
    if (followUser && userLocation) return;
    map.setView(center, 8);
  }, [map, center, simulation, followUser, userLocation]);

  // Follow user (fires once per watch-start / follow toggle).
  useEffect(() => {
    if (!followUser || !userLocation) {
      flewToUserRef.current = false;
      return;
    }
    if (flewToUserRef.current) return;
    flewToUserRef.current = true;
    map.flyTo(
      [userLocation.lat, userLocation.lon],
      Math.max(map.getZoom(), 12),
      { duration: 0.6 },
    );
  }, [map, followUser, userLocation?.lat, userLocation?.lon]);

  // Simulation (existing behaviour, preserved).
  useEffect(() => {
    map.closePopup();
    if (!simulation) return;
    const position = simulation.vesselPosition;
    const zones = [
      ...simulation.breachedZones,
      ...simulation.warningZones,
      ...simulation.boundaryWarnings,
    ];
    const points = [
      [position.lat, position.lon],
      ...zones.flatMap(
        (zone) => zone.coordinates || zone.lineCoordinates || [],
      ),
    ];
    map.fitBounds(points, {
      padding: [45, 45],
      maxZoom: zones.length ? 10 : 8,
    });
  }, [map, simulation]);

  // Fit to origin + destination + route when present.
  useEffect(() => {
    const points = [];
    if (origin) points.push([origin.lat, origin.lon]);
    if (destination) points.push([destination.lat, destination.lon]);
    if (Array.isArray(routeGeometry) && routeGeometry.length)
      points.push(...routeGeometry);
    if (points.length < 2) return;
    map.fitBounds(points, { padding: [50, 50], maxZoom: 11 });
  }, [
    map,
    origin?.lat,
    origin?.lon,
    destination?.lat,
    destination?.lon,
    routeGeometry,
  ]);

  // Fit to GIS layer collection when there is nothing else to focus on.
  useEffect(() => {
    const collection = layersData?.features ? layersData : layersData?.pfz;
    if (simulation || !collection?.features?.length) return;
    if (origin || destination) return;
    const bounds = L.geoJSON(collection).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.2), { maxZoom: 8 });
  }, [map, layersData, simulation, origin, destination]);

  return null;
}

function BaseTiles() {
  const key = import.meta.env.VITE_CARTO_API_KEY?.trim();
  const [failed, setFailed] = useState(false);
  const carto = key && !failed;
  return (
    <TileLayer
      key={carto ? "carto-dark" : "osm-dark"}
      url={
        carto
          ? `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`
          : "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      }
      maxZoom={19}
      className={!carto ? "map-tiles-dark" : ""}
      attribution={
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' +
        (carto
          ? ' &copy; <a href="https://carto.com/attributions">CARTO</a>'
          : "")
      }
      eventHandlers={{
        tileerror: () => {
          if (carto) setFailed(true);
        },
      }}
    />
  );
}

function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() =>
      map.invalidateSize({ pan: false }),
    );
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function bindMetadata(feature, layer) {
  const content = document.createElement("div");
  for (const [key, value] of Object.entries(feature.properties || {})) {
    const row = document.createElement(key === "name" ? "strong" : "div");
    row.textContent = `${key.replace(/([A-Z])/g, " $1")}: ${Array.isArray(value) ? value.join(", ") : value}`;
    content.appendChild(row);
  }
  layer.bindPopup(content, { maxHeight: 240 });
}

/* ------------------------------------------------------------------ */
/*  Public component                                                   */
/* ------------------------------------------------------------------ */

export default function MarineMap({
  /* existing */
  layersData,
  selectedSector = "Mumbai Coast",
  onSelectSector,
  height = "500px",
  compact = false,
  routePlan = null,
  simulation = null,
  onPointSelect,
  safety = null,
  showDemoLayers = true,
  visibleLayers = GIS_LAYERS.map(([key]) => key),
  showOfficialLayers = false,

  /* new (Phase 1) */
  userLocation = null, // { lat, lon, accuracy?, timestamp? }
  origin = null, // { lat, lon, name? }
  destination = null, // { lat, lon, name? }
  vessels = [], // [{ id, mmsi, name, lat, lon, speed, course, heading, vesselType, timestamp }]
  selectionMode = null, // null | 'origin' | 'destination'
  onMapPick = null, // ({ lat, lon, mode }) => void
  followUser = false, // boolean
  routeGeometry = null, // [[lat, lon], ...]  — Leaflet order
  routeError = null, // string | null
}) {
  // When following the user, prefer user location as map center.
  const center =
    (followUser && userLocation
      ? [userLocation.lat, userLocation.lon]
      : null) ||
    SECTOR_CENTERS[selectedSector] ||
    SECTOR_CENTERS["Mumbai Coast"];

  const getStyleForLayer = (feature) => {
    const layerType = feature.properties?.layerType;
    if (layerType === "MPA")
      return {
        color: "#10b981",
        weight: 2,
        fillOpacity: 0.25,
        fillColor: "#059669",
      };
    if (layerType === "RESTRICTED")
      return {
        color: "#f43f5e",
        weight: 2,
        fillOpacity: 0.3,
        fillColor: "#e11d48",
        dashArray: "4, 4",
      };
    if (layerType === "HAZARD")
      return {
        color: "#f59e0b",
        weight: 2,
        fillOpacity: 0.35,
        fillColor: "#d97706",
      };
    if (layerType === "PFZ")
      return {
        color: "#06b6d4",
        weight: 2,
        fillOpacity: 0.3,
        fillColor: "#0891b2",
      };
    return { color: "#38bdf8", weight: 2, fillOpacity: 0.2 };
  };

  const onEachFeature = (feature, layer) => {
    const p = feature.properties || {};
    layer.bindPopup(`
      <div style="font-family:sans-serif;font-size:12px;color:#0f172a;min-width:160px;">
        <strong style="font-size:13px;color:#0369a1;">${p.name || "Marine Zone"}</strong><br/>
        <span style="color:#64748b;font-size:11px;">Type: ${p.layerType || "Feature"}</span>
        <div style="margin-top:4px;font-size:11px;">${p.advisory || p.description || ""}</div>
      </div>
    `);
  };

  // Vessels as a single GeoJSON source for performance (spec §23).
  const vesselsGeoJSON = useMemo(() => {
    const safe = (vessels || []).filter(
      (v) => Number.isFinite(v.lat) && Number.isFinite(v.lon),
    );
    return {
      type: "FeatureCollection",
      features: safe.map((v) => ({
        type: "Feature",
        id: v.id || v.mmsi,
        properties: {
          name: v.name || (v.mmsi ? `MMSI ${v.mmsi}` : "Unknown vessel"),
          mmsi: v.mmsi || null,
          speed: Number.isFinite(v.speed) ? v.speed : null,
          course: Number.isFinite(v.course) ? v.course : null,
          heading: Number.isFinite(v.heading) ? v.heading : null,
          vesselType: v.vesselType || null,
          timestamp: v.timestamp || null,
        },
        geometry: { type: "Point", coordinates: [v.lon, v.lat] },
      })),
    };
  }, [vessels]);

  const vesselStyle = (feature) => {
    const t = String(feature.properties?.vesselType || "").toLowerCase();
    let color = "#94a3b8";
    if (t.includes("cargo")) color = "#f59e0b";
    else if (t.includes("tanker")) color = "#ef4444";
    else if (t.includes("passenger")) color = "#22d3ee";
    else if (t.includes("fishing")) color = "#34d399";
    else if (t.includes("tug") || t.includes("pilot")) color = "#a78bfa";
    return { color, fillColor: color, fillOpacity: 0.95, weight: 2, radius: 6 };
  };

  return (
    <div
      className="relative isolate min-w-0 w-full rounded-2xl overflow-hidden border border-slate-800"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={compact ? 9 : 8}
        style={{ height: "100%", width: "100%", background: "#020617" }}
        zoomControl={!compact}
      >
        <MapView
          center={center}
          simulation={simulation}
          layersData={layersData}
          onPointSelect={onPointSelect}
          onMapPick={onMapPick}
          selectionMode={selectionMode}
          userLocation={userLocation}
          followUser={followUser}
          origin={origin}
          destination={destination}
          routeGeometry={routeGeometry}
        />
        <ResizeMap />
        <BaseTiles />

        {visibleLayers.length > 0 && (
          <LayersControl position="topright">
            {GIS_LAYERS.filter(([key]) => visibleLayers.includes(key)).map(
              ([key, name, color, fillColor]) => (
                <LayersControl.Overlay checked name={name} key={key}>
                  <GeoJSON
                    key={JSON.stringify(layersData?.[key] || null)}
                    data={
                      layersData?.[key] || {
                        type: "FeatureCollection",
                        features: [],
                      }
                    }
                    style={(feature) => ({
                      color,
                      fillColor,
                      fillOpacity: ["protected", "restricted"].includes(key)
                        ? 0.8
                        : 1,
                      weight:
                        simulation &&
                        [
                          ...simulation.breachedZones,
                          ...simulation.warningZones,
                          ...simulation.boundaryWarnings,
                        ].some((zone) => zone.id === feature.id)
                          ? 6
                          : 2,
                      dashArray: key === "imbl" ? "8 6" : undefined,
                    })}
                    pointToLayer={(feature, latlng) =>
                      L.circleMarker(latlng, {
                        color,
                        fillColor,
                        fillOpacity: 0.8,
                        radius: 7,
                      })
                    }
                    onEachFeature={bindMetadata}
                  />
                </LayersControl.Overlay>
              ),
            )}

            {showOfficialLayers &&
              OFFICIAL_LAYERS.map((layer) => (
                <LayersControl.Overlay
                  checked={false}
                  name={layer.name}
                  key={layer.key}
                >
                  <WMSTileLayer
                    url={layer.url}
                    layers={layer.layers}
                    format="image/png"
                    transparent
                    version="1.1.1"
                    opacity={0.8}
                    attribution="INCOIS"
                  />
                </LayersControl.Overlay>
              ))}

            {vesselsGeoJSON.features.length > 0 && (
              <LayersControl.Overlay
                checked
                name={`Live vessels (${vesselsGeoJSON.features.length})`}
              >
                <GeoJSON
                  data={vesselsGeoJSON}
                  pointToLayer={(f, latlng) =>
                    L.circleMarker(latlng, vesselStyle(f))
                  }
                  onEachFeature={(feature, layer) => {
                    const p = feature.properties || {};
                    const ts = p.timestamp
                      ? new Date(p.timestamp).toLocaleTimeString()
                      : "—";
                    layer.bindPopup(`
                    <div style="font-family:sans-serif;font-size:12px;color:#0f172a;min-width:180px;">
                      <strong style="font-size:13px;color:#0369a1;">${p.name || "Unknown vessel"}</strong><br/>
                      ${p.mmsi ? `<span style="color:#64748b;font-size:11px;">MMSI ${p.mmsi}</span><br/>` : ""}
                      ${p.vesselType ? `<span style="color:#64748b;font-size:11px;">${p.vesselType}</span><br/>` : ""}
                      ${p.speed != null ? `Speed: ${p.speed} kn<br/>` : ""}
                      ${p.course != null ? `Course: ${p.course}°<br/>` : ""}
                      ${p.heading != null ? `Heading: ${p.heading}°<br/>` : ""}
                      <span style="color:#64748b;font-size:10px;">Last update: ${ts}</span>
                    </div>
                  `);
                  }}
                />
              </LayersControl.Overlay>
            )}
          </LayersControl>
        )}

        {/* Dynamic PFZ layer (existing) */}
        {layersData?.features && (
          <GeoJSON
            key={`${selectedSector}_${layersData.features.length}`}
            data={layersData}
            style={getStyleForLayer}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Simulation vessel (existing, only when showDemoLayers) */}
        {showDemoLayers && simulation?.vesselPosition && (
          <Marker
            position={[
              simulation.vesselPosition.lat,
              simulation.vesselPosition.lon,
            ]}
            icon={createCustomIcon("#0f172a", "S")}
          >
            <Popup>
              Simulated vessel: {simulation.status.replaceAll("_", " ")}
              <br />
              {simulation.vesselPosition.lat}, {simulation.vesselPosition.lon}
            </Popup>
          </Marker>
        )}

        {/* Weather safety circle (existing) */}
        {safety?.point && (
          <CircleMarker
            center={[safety.point.lat, safety.point.lon]}
            radius={18}
            pathOptions={{
              color: safety.color || "#64748b",
              fillColor: safety.color || "#64748b",
              fillOpacity: 0.45,
              weight: 4,
              dashArray: "3 4",
            }}
          >
            <Popup>
              Weather safety:{" "}
              {safety.risk
                ? safety.risk.riskLevel === "LOW"
                  ? "LOW"
                  : safety.risk.riskLevel === "MODERATE"
                    ? "MODERATE"
                    : "CRITICAL"
                : safety.error
                  ? "Unavailable"
                  : "Loading"}
              <br />
              {safety.risk && (
                <>
                  Air temperature:{" "}
                  {safety.weather.data.temperatureC == null
                    ? "Unavailable"
                    : `${safety.weather.data.temperatureC}°C`}
                  <br />
                  Wind: {safety.weather.data.windSpeedKmh} km/h · Waves:{" "}
                  {safety.ocean.data.significantWaveHeightM} m
                </>
              )}
            </Popup>
          </CircleMarker>
        )}

        {/* -------------------- Phase 1 additions -------------------- */}

        {/* User's live location: accuracy ring + dot */}
        {userLocation && (
          <>
            {Number.isFinite(userLocation.accuracy) &&
              userLocation.accuracy > 0 && (
                <Circle
                  center={[userLocation.lat, userLocation.lon]}
                  radius={userLocation.accuracy}
                  pathOptions={{
                    color: "#38bdf8",
                    weight: 1,
                    fillColor: "#38bdf8",
                    fillOpacity: 0.12,
                  }}
                />
              )}
            <CircleMarker
              center={[userLocation.lat, userLocation.lon]}
              radius={7}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: "#0ea5e9",
                fillOpacity: 1,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "sans-serif", fontSize: 12 }}>
                  <strong>Your current location</strong>
                  <br />
                  {userLocation.lat.toFixed(5)}, {userLocation.lon.toFixed(5)}
                  {Number.isFinite(userLocation.accuracy) && (
                    <>
                      <br />
                      <span style={{ color: "#64748b", fontSize: 11 }}>
                        ±{Math.round(userLocation.accuracy)} m
                      </span>
                    </>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* Origin marker */}
        {origin && (
          <Marker
            position={[origin.lat, origin.lon]}
            icon={createCustomIcon("#10b981", "A")}
          >
            <Popup>
              <div style={{ fontFamily: "sans-serif", fontSize: 12 }}>
                <strong>Origin</strong>
                <br />
                {origin.name ||
                  `${origin.lat.toFixed(4)}, ${origin.lon.toFixed(4)}`}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker
            position={[destination.lat, destination.lon]}
            icon={createCustomIcon("#ef4444", "B")}
          >
            <Popup>
              <div style={{ fontFamily: "sans-serif", fontSize: 12 }}>
                <strong>Destination</strong>
                <br />
                {destination.name ||
                  `${destination.lat.toFixed(4)}, ${destination.lon.toFixed(4)}`}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Real maritime route */}
        {Array.isArray(routeGeometry) && routeGeometry.length > 1 && (
          <Polyline
            positions={routeGeometry}
            pathOptions={{ color: "#06b6d4", weight: 4, opacity: 0.95 }}
          >
            <Popup>
              <div style={{ fontFamily: "sans-serif", fontSize: 12 }}>
                <strong style={{ color: "#0891b2" }}>Maritime route</strong>
              </div>
            </Popup>
          </Polyline>
        )}

        {routeError && (
          <CircleMarker
            center={destination ? [destination.lat, destination.lon] : center}
            radius={1}
            pathOptions={{ opacity: 0, fillOpacity: 0 }}
          >
            <Popup autoPan={false}>{routeError}</Popup>
          </CircleMarker>
        )}

        {/* -------------------- End Phase 1 -------------------- */}

        {/* Existing route plan overlays (Phase 11) */}
        {routePlan?.directBaselineRoute?.coordinates && (
          <Polyline
            positions={routePlan.directBaselineRoute.coordinates}
            pathOptions={{
              color: "#f43f5e",
              weight: 3,
              dashArray: "6, 8",
              opacity: 0.8,
            }}
          >
            <Popup>
              <div className="text-xs text-slate-900 font-sans">
                <strong>Direct Baseline Path (Unoptimized)</strong>
                <br />
                Distance: {routePlan.directBaselineRoute.totalDistanceNm} NM
                <br />
                Risk Score: {routePlan.directBaselineRoute.riskScore}/100
              </div>
            </Popup>
          </Polyline>
        )}

        {routePlan?.lowerRiskProposedRoute?.coordinates && (
          <Polyline
            positions={routePlan.lowerRiskProposedRoute.coordinates}
            pathOptions={{ color: "#06b6d4", weight: 4, opacity: 0.95 }}
          >
            <Popup>
              <div className="text-xs text-slate-900 font-sans">
                <strong style={{ color: "#0891b2" }}>
                  Lower-Risk Route Recommendation
                </strong>
                <br />
                Distance: {routePlan.lowerRiskProposedRoute.totalDistanceNm} NM
                <br />
                Risk Score: {routePlan.lowerRiskProposedRoute.riskScore}/100
                <br />
                Geofence: 100% Clear
              </div>
            </Popup>
          </Polyline>
        )}

        {routePlan?.origin?.coordinates && (
          <Marker
            position={routePlan.origin.coordinates}
            icon={createCustomIcon("#10b981", "⚓")}
          >
            <Popup>
              <div className="text-xs text-slate-900 font-sans font-bold">
                Departure: {routePlan.origin.name}
              </div>
            </Popup>
          </Marker>
        )}

        {routePlan?.destination?.coordinates && (
          <Marker
            position={routePlan.destination.coordinates}
            icon={createCustomIcon("#06b6d4", "🎯")}
          >
            <Popup>
              <div className="text-xs text-slate-900 font-sans font-bold">
                Destination: {routePlan.destination.name}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
