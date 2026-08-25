# WeatherGPT — AI Weather & Disaster Intelligence Platform

**SIH26068** (Conversational AI for Weather Forecasting, Alerts & Climate Information)
integrated with **SIH26071** (AI/ML-Based Heavy Rainfall Early Warning & Inundation Prediction)

> "From Weather Prediction to Personal Safety Decisions."

This is a **working, runnable MVP prototype** — not a mockup. Every screen is wired to a real
backend, every number on screen comes from an actual API call. Where a real government/live
data source isn't available (DEM data, IMD radar feeds, trained ML models), the system uses
**clearly labelled demo/prototype data** so the whole app still runs end-to-end — this is the
honest scoping approach the brief itself asks for.

---

## 1. What's actually implemented vs. prototype vs. future

| Status | Feature |
|---|---|
| ✅ **Fully working** | Conversational chat (RAG + LLM), Personal Risk Score, Live weather readout, Interactive threat map (live radar tiles), Alerts, Emergency Mode, Community hazard reporting + auto-verification, What-If simulator |
| 🟡 **Working prototype (rule-based, clearly labelled)** | Inundation/waterlogging risk (rule engine standing in for a DEM+XGBoost pipeline), Route safety comparison |
| 🎙️ **Functional, browser-native** | Multilingual voice input/output (Web Speech API — works today, no API key needed) |
| 🔜 **Architected, not built** | Real DEM/drainage ingestion, trained ML inundation model, auto-generated route checkpoints via a routing API, native mobile app, offline service-worker caching |

This mirrors the brief's own instruction: **core features fully working, advanced features
functional where practical, future features clearly labelled** — not a pile of disconnected
demos, and not fake claims of accuracy or live official data.

---

## 2. Architecture

```
┌─────────────────────────┐      ┌──────────────────────────────────────┐
│   React + TS Frontend    │      │           FastAPI Backend              │
│   (Vite, Leaflet map)    │◄────►│                                        │
│                           │ /api │  weather → risk → inundation → RAG    │
│  Dashboard · Chat · Map   │      │  → Groq LLM → response                │
│  Alerts · Emergency Mode  │      │                                        │
│  Hazard Reports · What-If │      │  JSON-backed storage (hazards.json)   │
└─────────────────────────┘      └──────────────────────────────────────┘
                                              │
                       ┌──────────────────────┼──────────────────────┐
                       ▼                      ▼                      ▼
              OpenWeatherMap API      RainViewer (live radar)   Groq LLM API
              (demo fallback)         (free, no key needed)     (demo fallback)
```

**AI response pipeline** (Module 13/14, simplified):
`User query → Weather service → Risk engine → Inundation engine → Hazard lookup → RAG retrieval → Groq LLM → Grounded response`

---

## 3. Tech Stack

- **Frontend:** React 18 + TypeScript + Vite, Leaflet/react-leaflet for maps
- **Backend:** Python 3.11+, FastAPI, httpx
- **LLM:** Groq (`llama-3.3-70b-versatile`) — fast + generous free tier, swap easily for Gemini/OpenAI by editing `app/services/groq_client.py`
- **RAG:** Lightweight keyword-overlap retrieval over a small curated knowledge base (`app/data/knowledge_base.json`) — swap for FAISS/Chroma + embeddings if you scale the knowledge base up
- **Storage:** JSON files (hackathon-appropriate; swap for PostgreSQL/Supabase for production — schema notes below)
- **Maps:** Leaflet with CARTO dark tiles + RainViewer live radar tiles (free, no key)

---

## 4. Setup Instructions

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill in keys, or leave blank for demo mode
uvicorn app.main:app --reload --port 8000
```
Visit `http://localhost:8000/docs` for interactive API docs.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:5173`. The Vite dev server proxies `/api/*` to the backend on port 8000.

### Getting API keys (both optional — app runs in demo mode without them)
- **OpenWeatherMap** (free): https://home.openweathermap.org/api_keys → `OPENWEATHER_API_KEY`
- **Groq** (free): https://console.groq.com/keys → `GROQ_API_KEY`

Without keys, every response is clearly labelled `DEMO_DATA` / `demo mode` in the UI and API —
the app never pretends demo data is live.

---

## 5. API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/weather` | GET | Current conditions for lat/lon |
| `/api/risk` | GET | Full risk bundle: weather + inundation + personal risk score |
| `/api/inundation` | GET | Waterlogging risk for a location |
| `/api/chat` | POST | Conversational AI (RAG + LLM grounded response) |
| `/api/hazards` | GET/POST | List / report community hazards |
| `/api/alerts` | GET | Active alerts for a location |
| `/api/emergency` | GET | Static verified disaster checklist |
| `/api/emergency/all` | GET | Full checklist bundle for offline caching |
| `/api/simulation` | GET | What-If rainfall scenario analysis |
| `/api/zones` | GET | Flood-prone zone data for the map |
| `/api/routes/compare` | POST | Compare two routes' weather/hazard risk |

Full request/response schemas: `http://localhost:8000/docs`

---

## 6. Database schema (for the production PostgreSQL upgrade)

The prototype uses JSON files for hackathon speed. Suggested schema for a real deployment:

```sql
users(id, name, phone, preferred_language, home_lat, home_lon)
locations(id, name, lat, lon, city, district, state)
weather_observations(id, lat, lon, temp, rain_mm, humidity, wind_kmh, source, recorded_at)
risk_scores(id, user_id, location_id, overall_score, breakdown_json, computed_at)
hazard_reports(id, reporter_id, lat, lon, category, description, status, created_at)
alerts(id, location_id, severity, title, recommended_action, created_at)
flood_zones(id, name, lat, lon, radius_km, base_risk, source)
rag_documents(id, topic, text, embedding vector)  -- with pgvector extension
```

---

## 7. Known Limitations (be upfront with judges)

- Inundation prediction is a **transparent rule-based prototype**, not a trained XGBoost/Random
  Forest model — no labelled historical waterlogging dataset was available for training in the
  hackathon timeframe. The architecture (feature inputs, API contract) is designed so a trained
  model can be dropped in without changing the frontend.
- Flood zones are **representative/demo data**, not derived from official DEM + drainage survey data.
- Route optimizer takes checkpoints as input rather than auto-generating them from source→destination —
  wiring in OSRM/Mapbox Directions API is the next step.
- Voice assistant uses the browser's built-in Web Speech API (works today, zero cost) rather than
  Bhashini — swapping in Bhashini for better Indian-language/dialect coverage is straightforward
  future work.

---

## 8. SIH Demo Flow (suggested)

1. Open dashboard → show live weather + Personal Risk Score for current location.
2. Ask the chatbot: *"Kal 5 baje ghar jaana safe hai?"* → watch it pull weather + risk + RAG
   guidance into one grounded answer.
3. Drag the What-If slider to +30% rainfall → show affected zones jump.
4. Report a hazard on the map → show it appear as a pin; report it again from a "different user"
   angle conceptually → show it flip to VERIFIED.
5. Trigger Emergency Mode → show the offline-cacheable Do's/Don'ts + helplines.

**Core innovation to emphasize:** existing weather apps tell you *what* the weather is —
WeatherGPT tells you what it *means for you* and *what to do next*.
