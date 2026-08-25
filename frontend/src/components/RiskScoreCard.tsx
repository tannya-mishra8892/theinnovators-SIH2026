import React from "react";
import Panel from "./Panel";
import RiskGauge from "./RiskGauge";
import type { RiskResponse } from "../api";

const ROW_LABELS: Record<string, string> = {
  rainfall_risk: "Rainfall Risk",
  inundation_risk: "Inundation Risk",
  lightning_risk: "Lightning Risk",
  travel_risk: "Travel Risk",
};

function Bar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "var(--accent-red)" : value >= 40 ? "var(--accent-amber)" : "var(--accent-cyan)";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="mono" style={{ color }}>{Math.round(value)}%</span>
      </div>
      <div style={{ height: 5, background: "var(--bg-panel-raised)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

export default function RiskScoreCard({ data }: { data: RiskResponse | null }) {
  if (!data) {
    return (
      <Panel title="Your Weather Safety Score" eyebrow="Personal Risk">
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
      </Panel>
    );
  }

  return (
    <Panel title="Your Weather Safety Score" eyebrow="Personal Risk · Rule-Based">
      <RiskGauge risk={data.risk} />
      <div style={{ marginTop: 18 }}>
        {Object.entries(data.risk.breakdown).map(([key, value]) => (
          <Bar key={key} label={ROW_LABELS[key] || key} value={value} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 12, lineHeight: 1.5 }}>
        {data.risk.label}
      </p>
    </Panel>
  );
}
