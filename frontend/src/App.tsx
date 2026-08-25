import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import Header from "./components/Header";
import WeatherCard from "./components/WeatherCard";
import RiskScoreCard from "./components/RiskScoreCard";
import ThreatMap from "./components/ThreatMap";
import IntelligenceCard from "./components/IntelligenceCard";
import ChatPanel from "./components/ChatPanel";
import AlertsPanel from "./components/AlertsPanel";
import EmergencyMode from "./components/EmergencyMode";
import HazardReportForm from "./components/HazardReportForm";
import SimulatorPanel from "./components/SimulatorPanel";

import { api } from "./api";

import type {
  RiskResponse,
  AlertsResponse,
  FloodZone,
  Hazard,
} from "./api";


const DEFAULT_LAT = 28.9845;
const DEFAULT_LON = 77.7064;


export default function App() {

  const [coords, setCoords] = useState({
    lat: DEFAULT_LAT,
    lon: DEFAULT_LON,
  });


  const [locationName, setLocationName] =
    useState("Detecting location...");


  const [riskData, setRiskData] =
    useState<RiskResponse | null>(null);


  const [alertsData, setAlertsData] =
    useState<AlertsResponse | null>(null);


  const [zones, setZones] =
    useState<FloodZone[]>([]);


  const [hazards, setHazards] =
    useState<Hazard[]>([]);


  const [emergencyOpen, setEmergencyOpen] =
    useState(false);


  const [demoMode, setDemoMode] =
    useState(false);


  const [refreshing, setRefreshing] =
    useState(false);


  const [apiError, setApiError] =
    useState<string | null>(null);


  // --------------------------------------------------
  // REFRESH ALL DASHBOARD DATA
  // --------------------------------------------------

  const refresh = useCallback(async () => {

    if (refreshing) return;

    setRefreshing(true);
    setApiError(null);

    try {

      console.log(
        "🔄 Refreshing WeatherGPT:",
        coords.lat,
        coords.lon
      );


      const [
        risk,
        alerts,
        hz,
      ] = await Promise.all([

        api.risk(
          coords.lat,
          coords.lon
        ),

        api.alerts(
          coords.lat,
          coords.lon,
          locationName
        ),

        api.hazards(),

      ]);


      setRiskData(risk);
      setAlertsData(alerts);
      setHazards(hz);


      setDemoMode(
        risk.weather.source !==
        "LIVE_OPENWEATHERMAP"
      );


      if (
        risk.risk.level ===
        "SEVERE"
      ) {
        setEmergencyOpen(true);
      }


    } catch (error) {

      console.error(
        "❌ WeatherGPT refresh failed:",
        error
      );


      setApiError(
        "Unable to load live weather data. Please check that the backend is running."
      );


    } finally {

      setRefreshing(false);

    }

  }, [
    coords,
    locationName,
    refreshing,
  ]);


  // --------------------------------------------------
  // LOAD FLOOD ZONES
  // --------------------------------------------------

  useEffect(() => {

    api.zones()
      .then((z) => {

        setZones(z.zones);

      })
      .catch((error) => {

        console.error(
          "❌ Failed to load flood zones:",
          error
        );

        setZones([]);

      });

  }, []);


  // --------------------------------------------------
  // REFRESH WHEN LOCATION CHANGES
  // --------------------------------------------------

  useEffect(() => {

    refresh();


    const interval =
      setInterval(() => {
        refresh();
      }, 60000);


    return () => {
      clearInterval(interval);
    };

  }, [refresh]);


  // --------------------------------------------------
  // GPS LOCATION
  // --------------------------------------------------

  useEffect(() => {

    if (!navigator.geolocation) {

      console.warn(
        "❌ Geolocation is not supported."
      );


      setLocationName(
        `${DEFAULT_LAT.toFixed(4)}, ${DEFAULT_LON.toFixed(4)}`
      );

      return;
    }


    console.log(
      "📍 Requesting GPS location..."
    );


    navigator.geolocation.getCurrentPosition(

      async (pos) => {

        const latitude =
          pos.coords.latitude;

        const longitude =
          pos.coords.longitude;


        console.log(
          "✅ GPS:",
          latitude,
          longitude
        );


        console.log(
          "📍 Accuracy:",
          pos.coords.accuracy,
          "meters"
        );


        setCoords({
          lat: latitude,
          lon: longitude,
        });


        try {

          const location =
            await api.location(
              latitude,
              longitude
            );


          console.log(
            "📍 Location:",
            location
          );


          if (
            location.city &&
            location.state
          ) {

            setLocationName(
              `${location.city}, ${location.state}`
            );

          } else if (
            location.display_name
          ) {

            setLocationName(
              location.display_name
            );

          } else {

            setLocationName(
              `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            );

          }


        } catch (error) {

          console.error(
            "❌ Reverse geocoding failed:",
            error
          );


          setLocationName(
            `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          );

        }

      },


      (error) => {

        console.error(
          "❌ GPS error:",
          error
        );


        console.log(
          "⚠️ Using default coordinates:",
          DEFAULT_LAT,
          DEFAULT_LON
        );


        setCoords({
          lat: DEFAULT_LAT,
          lon: DEFAULT_LON,
        });


        setLocationName(
          `${DEFAULT_LAT.toFixed(4)}, ${DEFAULT_LON.toFixed(4)}`
        );

      },


      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }

    );

  }, []);


  return (

    <div
      style={{
        minHeight: "100vh",
      }}
    >

      {/* --------------------------------------------------
          RESPONSIVE STYLES
      -------------------------------------------------- */}

      <style>{`

        .weather-dashboard-grid {
          grid-template-columns:
            minmax(260px, 300px)
            minmax(0, 1fr)
            minmax(280px, 340px);
        }


        @media (max-width: 1100px) {

          .weather-dashboard-grid {
            grid-template-columns:
              minmax(0, 1fr)
              minmax(0, 1fr) !important;
          }

        }


        @media (max-width: 700px) {

          .weather-dashboard-grid {
            grid-template-columns:
              minmax(0, 1fr) !important;

            padding-left: 12px !important;
            padding-right: 12px !important;
          }


          .weather-header {
            padding: 12px 14px !important;
            flex-wrap: wrap;
            gap: 10px;
          }


          .weather-location {
            font-size: 10px !important;
          }

        }

      `}</style>


      {/* --------------------------------------------------
          HEADER
      -------------------------------------------------- */}

      <Header
        locationName={locationName}
        demoMode={demoMode}
      />


      {/* --------------------------------------------------
          API ERROR
      -------------------------------------------------- */}

      {apiError && (

        <div
          style={{
            maxWidth: 1400,
            margin: "12px auto 0",
            padding: "0 24px",
          }}
        >

          <div
            style={{
              border:
                "1px solid var(--accent-red)",

              background:
                "rgba(239,68,68,0.08)",

              color:
                "var(--accent-red)",

              borderRadius: 8,

              padding:
                "10px 14px",

              fontSize: 12,

              display: "flex",

              justifyContent:
                "space-between",

              alignItems: "center",

              gap: 12,
            }}
          >

            <span>
              {apiError}
            </span>


            <button
              onClick={refresh}
              disabled={refreshing}
              style={{
                background:
                  "transparent",

                border:
                  "1px solid var(--accent-red)",

                color:
                  "var(--accent-red)",

                borderRadius: 5,

                padding:
                  "5px 10px",

                fontSize: 11,
              }}
            >
              {refreshing
                ? "Retrying..."
                : "Retry"}
            </button>

          </div>

        </div>

      )}


      {/* --------------------------------------------------
          DASHBOARD
      -------------------------------------------------- */}

      <div
        className="weather-dashboard-grid"
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding:
            "20px 24px 60px",
          display: "grid",
          gap: 20,
        }}
      >


        {/* ==================================================
            LEFT COLUMN
        ================================================== */}

        <div
          style={{
            display: "flex",
            flexDirection:
              "column",
            gap: 20,
          }}
        >

          <WeatherCard
            weather={
              riskData?.weather ??
              null
            }
          />


          <RiskScoreCard
            data={riskData}
          />

        </div>


        {/* ==================================================
            CENTER COLUMN
        ================================================== */}

        <div
          style={{
            display: "flex",
            flexDirection:
              "column",
            gap: 20,
          }}
        >

          <ThreatMap
            lat={coords.lat}
            lon={coords.lon}
            zones={zones}
            hazards={hazards}
          />


          {/* PHASE 8 — INTELLIGENCE */}

          <IntelligenceCard
            lat={coords.lat}
            lon={coords.lon}
          />


          <ChatPanel
            lat={coords.lat}
            lon={coords.lon}
          />


          <SimulatorPanel
            lat={coords.lat}
            lon={coords.lon}
          />

        </div>


        {/* ==================================================
            RIGHT COLUMN
        ================================================== */}

        <div
          style={{
            display: "flex",
            flexDirection:
              "column",
            gap: 20,
          }}
        >

          <AlertsPanel
            data={alertsData}
          />


          <HazardReportForm
            lat={coords.lat}
            lon={coords.lon}
            onReported={refresh}
          />


          <button
            onClick={() =>
              setEmergencyOpen(true)
            }
            style={{
              background:
                "linear-gradient(135deg, #EF4444, #DC2626)",

              border: "none",

              borderRadius: 10,

              padding: 16,

              color: "white",

              fontWeight: 700,

              fontSize: 14,

              letterSpacing: 0.5,

              cursor: "pointer",
            }}
          >
            🚨 OPEN EMERGENCY MODE
          </button>

        </div>

      </div>


      {/* --------------------------------------------------
          REFRESH INDICATOR
      -------------------------------------------------- */}

      {refreshing && (

        <div
          style={{
            position: "fixed",

            right: 16,

            bottom: 16,

            zIndex: 900,

            background:
              "var(--bg-panel)",

            border:
              "1px solid var(--accent-cyan)",

            color:
              "var(--accent-cyan)",

            borderRadius: 8,

            padding:
              "8px 12px",

            fontSize: 11,

            fontFamily:
              "var(--font-mono)",
          }}
        >
          ↻ Updating weather...
        </div>

      )}


      {/* --------------------------------------------------
          EMERGENCY MODE
      -------------------------------------------------- */}

      {emergencyOpen && (

        <EmergencyMode
          onClose={() =>
            setEmergencyOpen(false)
          }
        />

      )}

    </div>
  );
}