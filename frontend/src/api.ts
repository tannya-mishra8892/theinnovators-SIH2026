const BASE = "/api";

export interface Weather {
  source: string;
  label: string;
  lat: number;
  lon: number;
  timestamp: string;
  temp: number;
  rain_mm_1h: number;
  humidity: number;
  wind_kmh: number;
  visibility_km: number;
  condition: string;
}

export interface Inundation {
  label: string;
  score: number;
  level: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  nearest_zone: string | null;
  nearest_zone_distance_km: number | null;
  inside_known_risk_zone: boolean;
  rainfall_intensity: string;
  explanation: string;
}

export interface RiskScore {
  label: string;
  overall_score: number;
  level: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  breakdown: {
    rainfall_risk: number;
    inundation_risk: number;
    lightning_risk: number;
    travel_risk: number;
  };
  weights_used: Record<string, number>;
}

export interface RiskResponse {
  weather: Weather;
  inundation: Inundation;
  risk: RiskScore;
  nearby_hazard_reports: number;
}

export interface Alert {
  title: string;
  threat: string;
  location: string;
  time: string;
  severity: string;
  recommended_action: string;
}

export interface AlertsResponse {
  alert_level: string;
  risk_score: number;
  alerts: Alert[];
}

export interface Hazard {
  id: string;
  lat: number;
  lon: number;
  category: string;
  description: string;
  reporter_id: string;
  timestamp: string;
  status: "REPORTED" | "VERIFIED";
}

export interface FloodZone {
  id: string;
  name: string;
  lat: number;
  lon: number;
  radius_km: number;
  base_risk: string;
  note: string;
}

export interface EmergencyChecklist {
  label: string;
  disaster_type: string;
  title: string;
  dos: string[];
  donts: string[];
  helplines: string[];
}

export interface ChatResponse {
  reply: string;
  context_used: any;
}

export interface SimulationResponse {
  label: string;
  rainfall_increase_pct: number;
  current: {
    rain_mm_1h: number;
    inundation: Inundation;
    affected_zones: number;
  };
  scenario: {
    rain_mm_1h: number;
    inundation: Inundation;
    affected_zones: number;
  };
}

export interface LocationResponse {
  lat: number;
  lon: number;
  city: string;
  district: string;
  state: string;
  country: string;
  display_name: string;
}


// --------------------------------------------------
// PHASE 8 — INTELLIGENCE TYPES
// --------------------------------------------------

export interface AlertPriority {
  priority: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  priority_score: number;
  color: string;
  recommended_action: string;
  risk_level: string;
  rainfall_intensity: string;
  nearby_hazards: number;
  explanation: string;
}

export interface IntelligenceSummary {
  alert_engine: string;
  status: string;
  priority: AlertPriority;
  inundation_level: string;
  inundation_score: number;
}

export interface IntelligenceResponse {
  status: string;

  location: {
    lat: number;
    lon: number;
  };

  weather: Weather;

  inundation: Inundation;

  risk: RiskScore;

  nearby_hazards: number;

  intelligence: IntelligenceSummary;
}


// --------------------------------------------------
// GET
// --------------------------------------------------

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);

  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status}`);
  }

  return res.json();
}


// --------------------------------------------------
// POST
// --------------------------------------------------

async function post<T>(
  path: string,
  body: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status}`);
  }

  return res.json();
}


// --------------------------------------------------
// API
// --------------------------------------------------

export const api = {

  weather: (
    lat: number,
    lon: number
  ) =>
    get<Weather>(
      `/weather?lat=${lat}&lon=${lon}`
    ),


  risk: (
    lat: number,
    lon: number
  ) =>
    get<RiskResponse>(
      `/risk?lat=${lat}&lon=${lon}`
    ),


  alerts: (
    lat: number,
    lon: number,
    locationName = "Selected Location"
  ) =>
    get<AlertsResponse>(
      `/alerts?lat=${lat}&lon=${lon}&location_name=${encodeURIComponent(
        locationName
      )}`
    ),


  hazards: () =>
    get<Hazard[]>(
      `/hazards`
    ),


  reportHazard: (h: {
    lat: number;
    lon: number;
    category: string;
    description: string;
  }) =>
    post<Hazard>(
      `/hazards`,
      h
    ),


  zones: () =>
    get<{
      _label: string;
      zones: FloodZone[];
    }>(
      `/zones`
    ),


  emergency: (
    disasterType: string
  ) =>
    get<EmergencyChecklist>(
      `/emergency?disaster_type=${encodeURIComponent(
        disasterType
      )}`
    ),


  chat: (
    message: string,
    lat: number,
    lon: number
  ) =>
    post<ChatResponse>(
      `/chat`,
      {
        message,
        lat,
        lon,
      }
    ),


  simulation: (
    lat: number,
    lon: number,
    pct: number
  ) =>
    get<SimulationResponse>(
      `/simulation?lat=${lat}&lon=${lon}&rainfall_increase_pct=${pct}`
    ),


  location: (
    lat: number,
    lon: number
  ) =>
    get<LocationResponse>(
      `/location?lat=${lat}&lon=${lon}`
    ),


  // ------------------------------------------------
  // PHASE 8 — ALERT INTELLIGENCE
  // ------------------------------------------------

  intelligence: (
    lat: number,
    lon: number
  ) =>
    get<IntelligenceResponse>(
      `/intelligence?lat=${lat}&lon=${lon}`
    ),
};