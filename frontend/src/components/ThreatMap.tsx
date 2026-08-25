import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import Panel from "./Panel";
import type { FloodZone, Hazard } from "../api";

const ZONE_COLOR: Record<string, string> = {
  low: "#4ADE80",
  moderate: "#F5A623",
  high: "#EF4444",
};

const HAZARD_ICON: Record<string, string> = {
  waterlogging: "💧",
  fallen_tree: "🌳",
  road_blockage: "🚧",
  electric_wire: "⚡",
  landslide: "⛰️",
};

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lon], map.getZoom());
  }, [lat, lon, map]);

  return null;
}

export default function ThreatMap({
  lat,
  lon,
  zones,
  hazards,
  onMapClick,
}: {
  lat: number;
  lon: number;
  zones: FloodZone[];
  hazards: Hazard[];
  onMapClick?: (lat: number, lon: number) => void;
}) {
  const [showRadar, setShowRadar] = useState(true);
  const [showFlood, setShowFlood] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [radarUrl, setRadarUrl] = useState<string | null>(null);

  useEffect(() => {
    // RainViewer public API — free live radar tiles
    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("RainViewer request failed");
        }
        return response.json();
      })
      .then((data) => {
        const frames = data?.radar?.past;

        if (frames?.length) {
          const latest = frames[frames.length - 1];

          setRadarUrl(
            `${data.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`
          );
        }
      })
      .catch(() => {
        setRadarUrl(null);
      });
  }, []);

  return (
    <Panel
      title="Live Threat Map"
      eyebrow="Radar · Flood Zones · Hazards"
      right={
        <div style={{ display: "flex", gap: 6 }}>
          {[
            {
              key: "radar",
              label: "Radar",
              active: showRadar,
              toggle: () => setShowRadar((value) => !value),
            },
            {
              key: "flood",
              label: "Flood",
              active: showFlood,
              toggle: () => setShowFlood((value) => !value),
            },
            {
              key: "hazards",
              label: "Hazards",
              active: showHazards,
              toggle: () => setShowHazards((value) => !value),
            },
          ].map((button) => (
            <button
              key={button.key}
              onClick={button.toggle}
              className="mono"
              style={{
                fontSize: 10,
                padding: "4px 8px",
                borderRadius: 4,
                border: `1px solid ${button.active ? "var(--accent-cyan)" : "var(--line)"
                  }`,
                background: button.active
                  ? "rgba(45,212,191,0.1)"
                  : "transparent",
                color: button.active
                  ? "var(--accent-cyan)"
                  : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              {button.label}
            </button>
          ))}
        </div>
      }
    >
      <div
        style={{
          height: 420,
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--line)",
        }}
      >
        <MapContainer
          center={[lat, lon]}
          zoom={13}
          minZoom={5}
          maxZoom={18}
          style={{
            height: "100%",
            width: "100%",
          }}
        >
          {/* Base map */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CARTO"
            maxZoom={19}
          />

          {/* RainViewer Radar */}
          {showRadar && radarUrl && (
            <TileLayer
              url={radarUrl}
              opacity={0.35}
              maxNativeZoom={7}
              maxZoom={18}
            />
          )}

          {/* Flood Risk Zones */}
          {showFlood &&
            zones.map((zone) => (
              <Circle
                key={zone.id}
                center={[zone.lat, zone.lon]}
                radius={zone.radius_km * 1000}
                pathOptions={{
                  color: ZONE_COLOR[zone.base_risk] || "#888",
                  fillColor: ZONE_COLOR[zone.base_risk] || "#888",
                  fillOpacity: 0.15,
                  weight: 1.5,
                }}
              >
                <Popup>
                  <strong>{zone.name}</strong>
                  <br />
                  Risk: {zone.base_risk.toUpperCase()}
                  <br />
                  {zone.note}
                </Popup>
              </Circle>
            ))}

          {/* Community Hazard Reports */}
          {showHazards &&
            hazards.map((hazard) => (
              <CircleMarker
                key={hazard.id}
                center={[hazard.lat, hazard.lon]}
                radius={7}
                pathOptions={{
                  color:
                    hazard.status === "VERIFIED"
                      ? "#EF4444"
                      : "#F5A623",
                  fillColor:
                    hazard.status === "VERIFIED"
                      ? "#EF4444"
                      : "#F5A623",
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              >
                <Popup>
                  <div>
                    <strong>
                      {HAZARD_ICON[hazard.category] || "⚠️"}{" "}
                      {hazard.category.replace("_", " ")}
                    </strong>
                    <br />
                    Status: {hazard.status}
                    <br />
                    {hazard.description || "No description provided."}
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {/* Current User Location */}
          <CircleMarker
            center={[lat, lon]}
            radius={7}
            pathOptions={{
              color: "#2DD4BF",
              fillColor: "#2DD4BF",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <strong>Your Current Location</strong>
              <br />
              Latitude: {lat.toFixed(4)}
              <br />
              Longitude: {lon.toFixed(4)}
            </Popup>
          </CircleMarker>

          {/* Keep map centered on current location */}
          <Recenter lat={lat} lon={lon} />
        </MapContainer>
      </div>

      <p
        style={{
          fontSize: 10,
          color: "var(--text-dim)",
          marginTop: 8,
        }}
      >
        Flood zones are prototype/representative data. Radar tiles via
        RainViewer (live, public).
      </p>
    </Panel>
  );
}