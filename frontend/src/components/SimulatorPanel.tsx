import React, { useState } from "react";
import Panel from "./Panel";
import { api } from "../api";
import type { SimulationResponse } from "../api";

export default function SimulatorPanel({ lat, lon }: { lat: number; lon: number }) {
  const [pct, setPct] = useState(30);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(value: number) {
    setPct(value);
    setLoading(true);
    try {
      const res = await api.simulation(lat, lon, value);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="What-If Disaster Simulator" eyebrow="Scenario Analysis · Not a Forecast">
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
          <span style={{ color: "var(--text-muted)" }}>Rainfall Increase</span>
          <span className="mono" style={{ color: "var(--accent-amber)" }}>+{pct}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={50}
          step={10}
          value={pct}
          onChange={(e) => run(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--accent-amber)" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-dim)" }}>
          <span>0%</span>
          <span>+10%</span>
          <span>+20%</span>
          <span>+30%</span>
          <span>+40%</span>
          <span>+50%</span>
        </div>
      </div>

      {loading && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Recalculating scenario…</div>}

      {result && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "var(--bg-panel-raised)", border: "1px solid var(--line)", borderRadius: 8, padding: 12 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>CURRENT</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>{result.current.affected_zones}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>affected zones</div>
            <div style={{ fontSize: 11, marginTop: 6, color: "var(--text-dim)" }}>
              {result.current.rain_mm_1h}mm/hr · {result.current.inundation.level}
            </div>
          </div>
          <div style={{ background: "var(--bg-panel-raised)", border: "1px solid var(--accent-amber)", borderRadius: 8, padding: 12 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--accent-amber)", marginBottom: 6 }}>+{pct}% RAINFALL</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--accent-amber)" }}>
              {result.scenario.affected_zones}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>affected zones</div>
            <div style={{ fontSize: 11, marginTop: 6, color: "var(--text-dim)" }}>
              {result.scenario.rain_mm_1h}mm/hr · {result.scenario.inundation.level}
            </div>
          </div>
        </div>
      )}
      <p style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 10 }}>{result?.label}</p>
    </Panel>
  );
}
