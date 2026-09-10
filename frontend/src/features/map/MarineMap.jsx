import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  Polyline,
  LayersControl,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Compass,
  Anchor,
  AlertTriangle,
  ShieldCheck,
  Fish,
  Layers,
} from "lucide-react";

const SECTOR_CENTERS = {
  "Mumbai Coast": [18.922, 72.8347],
  "Kochi Harbor": [9.9312, 76.2673],
  "Chennai Offshore": [13.0827, 80.2707],
  Visakhapatnam: [17.6868, 83.2185],
  Porbandar: [21.6417, 69.6293],
};

const createCustomIcon = (colorBg, symbol) => {
  return L.divIcon({
    className: "custom-leaflet-icon",
    html: `<div style="background-color: ${colorBg}; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5); font-size: 11px; font-weight: bold; color: white;">${symbol}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

export default function MarineMap({
  layersData,
  selectedSector = "Mumbai Coast",
  onSelectSector,
  height = "500px",
  compact = false,
  routePlan = null,
}) {
  const center =
    SECTOR_CENTERS[selectedSector] || SECTOR_CENTERS["Mumbai Coast"];

  const getStyleForLayer = (feature) => {
    const layerType = feature.properties?.layerType;
    if (layerType === "MPA") {
      return {
        color: "#10b981",
        weight: 2,
        fillOpacity: 0.25,
        fillColor: "#059669",
      };
    }
    if (layerType === "RESTRICTED") {
      return {
        color: "#f43f5e",
        weight: 2,
        fillOpacity: 0.3,
        fillColor: "#e11d48",
        dashArray: "4, 4",
      };
    }
    if (layerType === "HAZARD") {
      return {
        color: "#f59e0b",
        weight: 2,
        fillOpacity: 0.35,
        fillColor: "#d97706",
      };
    }
    if (layerType === "PFZ") {
      return {
        color: "#06b6d4",
        weight: 2,
        fillOpacity: 0.3,
        fillColor: "#0891b2",
      };
    }
    return { color: "#38bdf8", weight: 2, fillOpacity: 0.2 };
  };

  const onEachFeature = (feature, layer) => {
    const p = feature.properties || {};
    layer.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 160px;">
        <strong style="font-size: 13px; color: #0369a1;">${p.name || "Marine Zone"}</strong><br/>
        <span style="color: #64748b; font-size: 11px;">Type: ${p.layerType || "Feature"}</span><br/>
        <div style="margin-top: 4px; font-size: 11px;">${p.advisory || p.description || ""}</div>
      </div>
    `);
  };

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-slate-800"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={compact ? 9 : 8}
        style={{ height: "100%", width: "100%", background: "#020617" }}
        zoomControl={!compact}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="CartoDB Dark Matter">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url={`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${import.meta.env.VITE_CARTO_API_KEY}`}
            />{" "}
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Dynamic GeoJSON Layers */}
        {layersData?.features && (
          <GeoJSON
            key={`${selectedSector}_${layersData.features.length}`}
            data={layersData}
            style={getStyleForLayer}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Route Planning Polyline Overlays (Phase 11) */}
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
                <strong style="color: #0891b2;">
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

        {/* Waypoint Markers for Route */}
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
