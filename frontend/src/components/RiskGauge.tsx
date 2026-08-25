import React from "react";
import type { RiskScore } from "../api";

const LEVEL_COLOR: Record<string, string> = {
  LOW: "var(--accent-green)",
  MODERATE: "var(--accent-amber)",
  HIGH: "#FB923C",
  SEVERE: "var(--accent-red)",
};

export default function RiskGauge({ risk }: { risk: RiskScore }) {
  const color = LEVEL_COLOR[risk.level] || "var(--accent-cyan)";
  const pct = risk.overall_score;
  const circumference = 2 * Math.PI * 80;
  const dash = (pct / 100) * circumference;

  return (
    <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto" }}>
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="radarFade" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor={color} stopOpacity="0" />
            <stop offset="100%" stopColor={color} stopOpacity="0.15" />
          </radialGradient>
        </defs>

        {/* concentric radar rings */}
        {[80, 58, 36].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="var(--line)" strokeWidth="1" />
        ))}

        {/* rotating sweep */}
        <g style={{ transformOrigin: "100px 100px", animation: "sweep 4s linear infinite" }}>
          <path d="M 100 100 L 100 20 A 80 80 0 0 1 154 46 Z" fill="url(#radarFade)" />
        </g>

        {/* score ring */}
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 100 100)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="mono" style={{ fontSize: 42, fontWeight: 700, color, lineHeight: 1 }}>
          {Math.round(pct)}
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
          / 100
        </div>
        <div
          className="mono"
          style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color, letterSpacing: 1.5 }}
        >
          {risk.level}
        </div>
      </div>

      <style>{`
        @keyframes sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
