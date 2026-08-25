import React from "react";
import Panel from "./Panel";
import type { Weather } from "../api";

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </div>

      <div
        className="mono"
        style={{
          fontSize: 20,
          fontWeight: 600,
        }}
      >
        {value}

        <span
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            marginLeft: 3,
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

export default function WeatherCard({
  weather,
}: {
  weather: Weather | null;
}) {
  if (!weather) {
    return (
      <Panel
        title="Current Conditions"
        eyebrow="Live Readout"
      >
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          Loading weather data…
        </div>
      </Panel>
    );
  }

  const isLive =
    weather.source ===
    "LIVE_OPENWEATHERMAP";

  return (
    <Panel
      title="Current Conditions"
      eyebrow={
        isLive
          ? "Live Readout"
          : "Demo Readout"
      }
      right={
        <span
          className="mono"
          style={{
            fontSize: 10,
            padding: "3px 7px",
            borderRadius: 4,
            border: `1px solid ${isLive
                ? "var(--accent-green)"
                : "var(--accent-amber)"
              }`,
            color: isLive
              ? "var(--accent-green)"
              : "var(--accent-amber)",
          }}
        >
          {isLive ? "LIVE" : "DEMO"}
        </span>
      }
    >
      <div
        style={{
          fontSize: 15,
          marginBottom: 16,
          color:
            "var(--text-primary)",
          fontWeight: 500,
        }}
      >
        {weather.condition}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: 16,
        }}
      >
        <Stat
          label="Temp"
          value={Number(
            weather.temp
          ).toFixed(1)}
          unit="°C"
        />

        <Stat
          label="Rainfall"
          value={Number(
            weather.rain_mm_1h
          ).toFixed(1)}
          unit="mm/hr"
        />

        <Stat
          label="Humidity"
          value={Math.round(
            weather.humidity
          )}
          unit="%"
        />

        <Stat
          label="Wind"
          value={Number(
            weather.wind_kmh
          ).toFixed(1)}
          unit="km/h"
        />

        <Stat
          label="Visibility"
          value={Number(
            weather.visibility_km
          ).toFixed(1)}
          unit="km"
        />
      </div>

      <div
        className="mono"
        style={{
          marginTop: 14,
          fontSize: 9,
          color: "var(--text-dim)",
        }}
      >
        Updated:{" "}
        {weather.timestamp
          ? new Date(
            weather.timestamp
          ).toLocaleTimeString()
          : "N/A"}
      </div>
    </Panel>
  );
}