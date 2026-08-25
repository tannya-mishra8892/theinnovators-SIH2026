import React from "react";
import Panel from "./Panel";
import type { AlertsResponse } from "../api";

const SEV_COLOR: Record<string, string> = {
  INFO: "var(--accent-cyan)",
  WATCH: "var(--accent-amber)",
  WARNING: "#FB923C",
  SEVERE: "var(--accent-red)",
};

export default function AlertsPanel({ data }: { data: AlertsResponse | null }) {
  if (!data) {
    return (
      <Panel title="Active Alerts" eyebrow="Warnings">
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
      </Panel>
    );
  }

  return (
    <Panel title="Active Alerts" eyebrow={`Level: ${data.alert_level}`}>
      {data.alerts.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No active alerts for this location right now.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.alerts.map((a, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${SEV_COLOR[a.severity] || "var(--line)"}`,
                borderRadius: 8,
                padding: 12,
                background: "var(--bg-panel-raised)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <strong style={{ fontSize: 13 }}>{a.title}</strong>
                <span
                  className="mono"
                  style={{ fontSize: 10, color: SEV_COLOR[a.severity] || "var(--text-muted)", fontWeight: 700 }}
                >
                  {a.severity}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.recommended_action}</div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
