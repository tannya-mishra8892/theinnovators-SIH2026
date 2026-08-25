import React from "react";

export default function Panel({
  title,
  eyebrow,
  children,
  right,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        padding: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          {eyebrow && (
            <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1.5, textTransform: "uppercase" }}>
              {eyebrow}
            </div>
          )}
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: "2px 0 0", color: "var(--text-primary)" }}>{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
