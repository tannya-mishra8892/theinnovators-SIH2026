import os
from dotenv import load_dotenv

load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "").strip()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# True whenever we don't have a real key -> tells the frontend/backend
# to clearly label data as DEMO instead of pretending it's live.
USE_DEMO_WEATHER = len(OPENWEATHER_API_KEY) == 0
USE_DEMO_LLM = len(GROQ_API_KEY) == 0
