import React, { useState } from "react";
import Panel from "./Panel";
import { api } from "../api";

const CATEGORIES = [
  { key: "waterlogging", label: "💧 Waterlogging" },
  { key: "fallen_tree", label: "🌳 Fallen Tree" },
  { key: "road_blockage", label: "🚧 Road Blockage" },
  { key: "electric_wire", label: "⚡ Electric Wire" },
  { key: "landslide", label: "⛰️ Landslide" },
];

export default function HazardReportForm({
  lat,
  lon,
  onReported,
}: {
  lat: number;
  lon: number;
  onReported: () => void;
}) {
  const [category, setCategory] = useState("waterlogging");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await api.reportHazard({ lat, lon, category, description });
      setConfirmed(true);
      setDescription("");
      onReported();
      setTimeout(() => setConfirmed(false), 2500);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Panel title="Report a Hazard" eyebrow="Community Ground Truth">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 6,
              border: `1px solid ${category === c.key ? "var(--accent-cyan)" : "var(--line)"}`,
              background: category === c.key ? "rgba(45,212,191,0.1)" : "transparent",
              color: category === c.key ? "var(--accent-cyan)" : "var(--text-muted)",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional: short description of what you're seeing"
        rows={2}
        style={{
          width: "100%",
          background: "var(--bg-panel-raised)",
          border: "1px solid var(--line)",
          borderRadius: 6,
          padding: "10px 12px",
          color: "var(--text-primary)",
          fontSize: 13,
          fontFamily: "var(--font-display)",
          resize: "vertical",
          marginBottom: 10,
        }}
      />
      <button
        onClick={submit}
        disabled={submitting}
        style={{
          width: "100%",
          background: confirmed ? "var(--accent-green)" : "var(--accent-amber)",
          border: "none",
          borderRadius: 6,
          padding: "10px",
          color: "#0a0f1a",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        {confirmed ? "✓ Reported — pinned on map" : submitting ? "Reporting…" : "Report at my current location"}
      </button>
      <p style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 8 }}>
        Reports become VERIFIED automatically once 2+ nearby users report the same hazard within 6 hours.
      </p>
    </Panel>
  );
}
