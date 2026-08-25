import React from "react";

export default function Header({ locationName, demoMode }: { locationName: string; demoMode: boolean }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        borderBottom: "1px solid var(--line)",
        background: "rgba(16,24,40,0.6)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-amber))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            color: "#0a0f1a",
            fontFamily: "var(--font-mono)",
          }}
        >
          W
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: 0.3 }}>WEATHERGPT</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1.5, textTransform: "uppercase" }}>
            AI Weather &amp; Disaster Intelligence · SIH26068
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
          📍 {locationName}
        </div>
        {demoMode && (
          <div
            className="mono"
            style={{
              fontSize: 10,
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid var(--accent-amber)",
              color: "var(--accent-amber)",
              letterSpacing: 0.5,
            }}
          >
            DEMO MODE
          </div>
        )}
      </div>
    </header>
  );
}
