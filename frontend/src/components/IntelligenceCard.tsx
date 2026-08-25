import React, { useEffect, useState } from "react";

import { api } from "../api";

import type {
  IntelligenceResponse,
} from "../api";


interface IntelligenceCardProps {
  lat: number;
  lon: number;
}


export default function IntelligenceCard({
  lat,
  lon,
}: IntelligenceCardProps) {

  const [data, setData] =
    useState<IntelligenceResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  const loadIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);

      const result =
        await api.intelligence(
          lat,
          lon
        );

      setData(result);

    } catch (err) {

      console.error(
        "Intelligence API failed:",
        err
      );

      setError(
        "Unable to load intelligence data."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {

    loadIntelligence();

    const interval =
      setInterval(
        loadIntelligence,
        60000
      );

    return () => {
      clearInterval(interval);
    };

  }, [lat, lon]);


  if (loading) {
    return (
      <div
        style={{
          background: "var(--bg-panel)",
          border:
            "1px solid var(--border-color)",
          borderRadius: 12,
          padding: 20,
          color:
            "var(--text-secondary)",
          fontSize: 12,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          🧠 WEATHER INTELLIGENCE
        </div>

        Analysing current conditions...
      </div>
    );
  }


  if (error) {
    return (
      <div
        style={{
          background: "var(--bg-panel)",
          border:
            "1px solid var(--accent-red)",
          borderRadius: 12,
          padding: 20,
          color:
            "var(--accent-red)",
          fontSize: 12,
        }}
      >
        ⚠️ {error}
      </div>
    );
  }


  if (!data) {
    return null;
  }


  const priority =
    data.intelligence.priority;


  const priorityIcon =
    priority.priority === "CRITICAL"
      ? "🚨"
      : priority.priority === "HIGH"
      ? "⚠️"
      : priority.priority === "MODERATE"
      ? "🟡"
      : "🟢";


  return (
    <div
      style={{
        background:
          "var(--bg-panel)",
        border:
          "1px solid var(--border-color)",
        borderRadius: 12,
        padding: 20,
        boxShadow:
          "0 8px 30px rgba(0,0,0,0.18)",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >

        <div>

          <div
            style={{
              fontSize: 11,
              letterSpacing: 1.2,
              fontWeight: 800,
              color:
                "var(--accent-cyan)",
            }}
          >
            🧠 WEATHER INTELLIGENCE
          </div>

          <div
            style={{
              fontSize: 10,
              marginTop: 4,
              color:
                "var(--text-secondary)",
            }}
          >
            Automated risk & alert analysis
          </div>

        </div>


        <div
          style={{
            fontSize: 10,
            padding: "5px 8px",
            borderRadius: 6,
            border:
              "1px solid var(--accent-cyan)",
            color:
              "var(--accent-cyan)",
          }}
        >
          ACTIVE
        </div>

      </div>


      {/* ALERT PRIORITY */}

      <div
        style={{
          border:
            `1px solid ${priority.color}`,
          borderRadius: 10,
          padding: 16,
          marginBottom: 16,
          background:
            "rgba(255,255,255,0.02)",
        }}
      >

        <div
          style={{
            fontSize: 11,
            color:
              "var(--text-secondary)",
            marginBottom: 7,
          }}
        >
          ALERT PRIORITY
        </div>


        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >

          <span
            style={{
              fontSize: 24,
            }}
          >
            {priorityIcon}
          </span>


          <span
            style={{
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: 1,
              color:
                priority.color,
            }}
          >
            {priority.priority}
          </span>


          <span
            style={{
              marginLeft: "auto",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {priority.priority_score}/100
          </span>

        </div>

      </div>


      {/* METRICS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr 1fr",
          gap: 10,
          marginBottom: 16,
        }}
      >

        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background:
              "rgba(255,255,255,0.03)",
          }}
        >

          <div
            style={{
              fontSize: 9,
              color:
                "var(--text-secondary)",
            }}
          >
            RISK
          </div>

          <div
            style={{
              marginTop: 5,
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            {data.risk.level}
          </div>

        </div>


        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background:
              "rgba(255,255,255,0.03)",
          }}
        >

          <div
            style={{
              fontSize: 9,
              color:
                "var(--text-secondary)",
            }}
          >
            RAIN
          </div>

          <div
            style={{
              marginTop: 5,
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            {data.weather.rain_mm_1h}
            mm/h
          </div>

        </div>


        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background:
              "rgba(255,255,255,0.03)",
          }}
        >

          <div
            style={{
              fontSize: 9,
              color:
                "var(--text-secondary)",
            }}
          >
            HAZARDS
          </div>

          <div
            style={{
              marginTop: 5,
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            {data.nearby_hazards}
          </div>

        </div>

      </div>


      {/* RECOMMENDED ACTION */}

      <div
        style={{
          borderRadius: 9,
          padding: 13,
          background:
            "rgba(255,255,255,0.04)",
          marginBottom: 12,
        }}
      >

        <div
          style={{
            fontSize: 9,
            color:
              "var(--text-secondary)",
            marginBottom: 5,
          }}
        >
          RECOMMENDED ACTION
        </div>

        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.5,
          }}
        >
          {priority.recommended_action}
        </div>

      </div>


      {/* EXPLANATION */}

      <div
        style={{
          fontSize: 11,
          lineHeight: 1.55,
          color:
            "var(--text-secondary)",
        }}
      >
        {priority.explanation}
      </div>


      {/* FOOTER */}

      <div
        style={{
          marginTop: 14,
          paddingTop: 10,
          borderTop:
            "1px solid var(--border-color)",
          fontSize: 9,
          color:
            "var(--text-secondary)",
        }}
      >
        {data.intelligence.alert_engine}
      </div>

    </div>
  );
}