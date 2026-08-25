import React, { useEffect, useState } from "react";
import { api } from "../api";
import type { EmergencyChecklist } from "../api";

const DISASTER_TYPES = ["flood", "cyclone", "landslide", "lightning"];

export default function EmergencyMode({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState("flood");
  const [data, setData] = useState<EmergencyChecklist | null>(null);

  useEffect(() => {
    api.emergency(type).then(setData).catch(() => setData(null));
  }, [type]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(7,11,20,0.92)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "var(--bg-panel)",
          border: "1px solid var(--accent-red)",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="mono" style={{ color: "var(--accent-red)", fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
            🚨 EMERGENCY MODE
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: 6, color: "var(--text-muted)", padding: "4px 10px" }}
          >
            Close
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {DISASTER_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="mono"
              style={{
                fontSize: 11,
                padding: "6px 12px",
                borderRadius: 6,
                border: `1px solid ${type === t ? "var(--accent-red)" : "var(--line)"}`,
                background: type === t ? "rgba(239,68,68,0.12)" : "transparent",
                color: type === t ? "var(--accent-red)" : "var(--text-muted)",
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {data && (
          <>
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>{data.title}</h2>
            <div className="mono" style={{ fontSize: 10, color: "var(--accent-amber)", marginBottom: 16 }}>
              {data.label}
            </div>

            <h3 style={{ fontSize: 13, color: "var(--accent-green)", marginBottom: 8 }}>DO</h3>
            <ul style={{ margin: "0 0 16px", paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
              {data.dos.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>

            <h3 style={{ fontSize: 13, color: "var(--accent-red)", marginBottom: 8 }}>DON'T</h3>
            <ul style={{ margin: "0 0 16px", paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
              {data.donts.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>

            <h3 style={{ fontSize: 13, color: "var(--accent-cyan)", marginBottom: 8 }}>HELPLINES</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {data.helplines.map((h, i) => (
                <span
                  key={i}
                  className="mono"
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: "var(--bg-panel-raised)",
                    border: "1px solid var(--line)",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
