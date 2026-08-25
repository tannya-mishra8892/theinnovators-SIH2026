import React from "react";
import Panel from "./Panel";
import type { RiskResponse } from "../api";

function getLevelColor(level: string) {
    switch (level) {
        case "SEVERE":
            return "var(--accent-red)";
        case "HIGH":
            return "#FB923C";
        case "MODERATE":
            return "var(--accent-amber)";
        default:
            return "var(--accent-green)";
    }
}

function ExplainRow({
    label,
    value,
    weight,
}: {
    label: string;
    value: number;
    weight: number;
}) {
    const color =
        value >= 70
            ? "var(--accent-red)"
            : value >= 40
                ? "var(--accent-amber)"
                : "var(--accent-cyan)";

    return (
        <div
            style={{
                padding: "10px 0",
                borderBottom: "1px solid var(--line)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                }}
            >
                <span
                    style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                    }}
                >
                    {label}
                </span>

                <span
                    className="mono"
                    style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color,
                    }}
                >
                    {Math.round(value)}%
                </span>
            </div>

            <div
                style={{
                    height: 5,
                    background: "var(--bg-panel-raised)",
                    borderRadius: 3,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: `${Math.min(100, Math.max(0, value))}%`,
                        height: "100%",
                        background: color,
                        transition: "width 0.6s ease",
                    }}
                />
            </div>

            <div
                className="mono"
                style={{
                    fontSize: 9,
                    color: "var(--text-dim)",
                    marginTop: 5,
                }}
            >
                Contribution weight: {Math.round(weight * 100)}%
            </div>
        </div>
    );
}

export default function RiskExplanationPanel({
    data,
}: {
    data: RiskResponse | null;
}) {
    if (!data) {
        return (
            <Panel
                title="Why This Risk Score?"
                eyebrow="Explainable AI"
            >
                <div
                    style={{
                        color: "var(--text-muted)",
                        fontSize: 13,
                    }}
                >
                    Waiting for risk data…
                </div>
            </Panel>
        );
    }

    const { risk, inundation, weather } = data;

    const levelColor = getLevelColor(risk.level);

    return (
        <Panel
            title="Why This Risk Score?"
            eyebrow="Explainable AI · Transparent Decision"
        >
            {/* Overall explanation */}
            <div
                style={{
                    border: `1px solid ${levelColor}`,
                    background:
                        risk.level === "SEVERE" || risk.level === "HIGH"
                            ? "rgba(239,68,68,0.07)"
                            : "var(--bg-panel-raised)",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 14,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                    }}
                >
                    <span
                        className="mono"
                        style={{
                            fontSize: 10,
                            color: "var(--text-muted)",
                            letterSpacing: 1,
                        }}
                    >
                        CURRENT ASSESSMENT
                    </span>

                    <span
                        className="mono"
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: levelColor,
                        }}
                    >
                        {risk.level}
                    </span>
                </div>

                <div
                    style={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "var(--text-primary)",
                    }}
                >
                    {inundation.explanation}
                </div>
            </div>

            {/* Main factors */}
            <div
                className="mono"
                style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    letterSpacing: 1.2,
                    marginBottom: 4,
                }}
            >
                RISK FACTORS
            </div>

            <ExplainRow
                label="Rainfall Risk"
                value={risk.breakdown.rainfall_risk}
                weight={risk.weights_used.rainfall ?? 0.3}
            />

            <ExplainRow
                label="Inundation Risk"
                value={risk.breakdown.inundation_risk}
                weight={risk.weights_used.inundation ?? 0.3}
            />

            <ExplainRow
                label="Lightning Risk"
                value={risk.breakdown.lightning_risk}
                weight={risk.weights_used.lightning ?? 0.15}
            />

            <ExplainRow
                label="Travel Risk"
                value={risk.breakdown.travel_risk}
                weight={risk.weights_used.travel ?? 0.25}
            />

            {/* Current conditions */}
            <div
                style={{
                    marginTop: 14,
                    padding: 12,
                    background: "var(--bg-panel-raised)",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                }}
            >
                <div
                    className="mono"
                    style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        letterSpacing: 1,
                        marginBottom: 8,
                    }}
                >
                    DATA USED
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: 10,
                                color: "var(--text-dim)",
                            }}
                        >
                            WEATHER
                        </div>

                        <div
                            style={{
                                fontSize: 12,
                                marginTop: 2,
                            }}
                        >
                            {weather.condition}
                        </div>
                    </div>

                    <div>
                        <div
                            style={{
                                fontSize: 10,
                                color: "var(--text-dim)",
                            }}
                        >
                            RAINFALL
                        </div>

                        <div
                            className="mono"
                            style={{
                                fontSize: 12,
                                marginTop: 2,
                            }}
                        >
                            {weather.rain_mm_1h} mm/hr
                        </div>
                    </div>

                    <div>
                        <div
                            style={{
                                fontSize: 10,
                                color: "var(--text-dim)",
                            }}
                        >
                            FLOOD ZONE
                        </div>

                        <div
                            style={{
                                fontSize: 12,
                                marginTop: 2,
                            }}
                        >
                            {inundation.nearest_zone || "No known zone"}
                        </div>
                    </div>

                    <div>
                        <div
                            style={{
                                fontSize: 10,
                                color: "var(--text-dim)",
                            }}
                        >
                            ZONE STATUS
                        </div>

                        <div
                            className="mono"
                            style={{
                                fontSize: 12,
                                marginTop: 2,
                                color: inundation.inside_known_risk_zone
                                    ? "var(--accent-red)"
                                    : "var(--accent-green)",
                            }}
                        >
                            {inundation.inside_known_risk_zone
                                ? "INSIDE RISK ZONE"
                                : "OUTSIDE KNOWN ZONE"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transparency note */}
            <div
                style={{
                    marginTop: 12,
                    fontSize: 10,
                    lineHeight: 1.5,
                    color: "var(--text-dim)",
                }}
            >
                ℹ️ This explanation uses WeatherGPT's transparent
                rule-based risk formula. It is designed to show
                <strong> why </strong>
                the score changed rather than hiding the decision
                behind a black-box prediction.
            </div>
        </Panel>
    );
}