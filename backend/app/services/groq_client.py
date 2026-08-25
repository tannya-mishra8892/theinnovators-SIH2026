from app.config import (
    GROQ_API_KEY,
    GROQ_MODEL,
    USE_DEMO_LLM,
)


# ==================================================
# WEATHERGPT SYSTEM PROMPT
# ==================================================

SYSTEM_PROMPT = """
You are WeatherGPT, an AI weather and disaster-safety
assistant designed for India.

Your job is to explain the weather situation using the
provided structured data and retrieved safety guidance.

IMPORTANT RULES:

1. USE PROVIDED DATA
Only use the supplied weather, risk, inundation,
hazard and retrieved-guidance context for factual claims.

2. NEVER INVENT DATA
Do not invent:
- rainfall values
- weather forecasts
- flood probabilities
- emergency statistics
- government warnings
- locations
- hazard reports
- helpline numbers

3. EXPLAIN RISK
If the user asks why the risk is high, explain the
risk breakdown using:
- rainfall risk
- inundation risk
- lightning risk
- travel risk
- nearby hazards

4. TRAVEL QUESTIONS
If the user asks whether travel is safe, consider:
- overall risk level
- rainfall
- inundation
- travel risk
- nearby hazards

Give a practical recommendation.

5. FLOOD QUESTIONS
For flood/waterlogging questions, use the inundation
assessment and explain:
- inundation level
- rainfall intensity
- known risk-zone status
- nearest risk zone when available

6. HIGH / SEVERE RISK
If risk is HIGH or SEVERE:
- clearly warn the user
- recommend caution
- suggest avoiding unnecessary travel when appropriate
- mention the relevant safety action from the provided
  guidance when available

7. DEMO DATA
If weather source is DEMO or PROTOTYPE, explicitly say
that the information is demo/prototype data and should
not be treated as official live data.

8. LANGUAGE
Match the user's language.

If the user writes:
- Hindi → Hindi
- Hinglish → natural Hinglish
- English → English

Do not unnecessarily translate everything.

9. STYLE
Keep answers:
- concise
- practical
- easy to understand
- conversational

Avoid long technical explanations unless the user asks
for details.

10. SAFETY
WeatherGPT provides decision-support information.
It must not pretend to replace official emergency
authorities or verified government warnings.

11. RAG
Retrieved guidance is supporting safety information.
Use it when relevant.

If no retrieved guidance is relevant, do not pretend
that a guideline exists.
"""


# ==================================================
# DEMO RESPONSE
# ==================================================

def _demo_reply(
    user_message: str,
    context: dict,
) -> str:

    weather = context.get("weather", {})
    risk = context.get("risk", {})
    inundation = context.get("inundation", {})

    level = risk.get(
        "level",
        "UNKNOWN",
    )

    rain = weather.get(
        "rain_mm_1h",
        0,
    )

    condition = weather.get(
        "condition",
        "unclear conditions",
    )

    inundation_level = inundation.get(
        "level",
        "UNKNOWN",
    )

    nearby_hazards = context.get(
        "nearby_hazards",
        0,
    )

    source = weather.get(
        "source",
        "",
    )

    demo_note = ""

    if source != "LIVE_OPENWEATHERMAP":
        demo_note = (
            "\n\n⚠️ Ye information demo/prototype "
            "weather data par based hai."
        )

    # --------------------------------------------------
    # SEVERE
    # --------------------------------------------------

    if level == "SEVERE":
        return (
            f"⚠️ Abhi overall weather risk SEVERE hai. "
            f"Condition: {condition}, rainfall ~{rain} mm/hr "
            f"aur inundation risk {inundation_level} hai. "
            f"Unnecessary travel avoid karo aur "
            f"waterlogged/low-lying areas se door raho."
            f"{demo_note}"
        )

    # --------------------------------------------------
    # HIGH
    # --------------------------------------------------

    if level == "HIGH":
        return (
            f"⚠️ Abhi overall risk HIGH hai. "
            f"Condition {condition}, rainfall ~{rain} mm/hr "
            f"aur inundation risk {inundation_level} hai. "
            f"Travel karna zaroori na ho to avoid karna "
            f"better hai. Nearby reported hazards: "
            f"{nearby_hazards}."
            f"{demo_note}"
        )

    # --------------------------------------------------
    # MODERATE
    # --------------------------------------------------

    if level == "MODERATE":
        return (
            f"⚠️ Current overall risk MODERATE hai. "
            f"Condition: {condition}, rainfall ~{rain} mm/hr "
            f"aur inundation risk {inundation_level} hai. "
            f"Travel karte waqt normal precautions rakho "
            f"aur waterlogged areas avoid karo."
            f"{demo_note}"
        )

    # --------------------------------------------------
    # LOW / UNKNOWN
    # --------------------------------------------------

    return (
        f"Abhi conditions relatively manageable hain — "
        f"{condition}, rainfall ~{rain} mm/hr aur "
        f"overall risk {level}. "
        f"Normal weather precautions follow karo."
        f"{demo_note}"
    )


# ==================================================
# GROQ AI RESPONSE
# ==================================================

async def generate_chat_response(
    user_message: str,
    context: dict,
    retrieved_docs: list,
) -> str:

    # --------------------------------------------------
    # DEMO MODE
    # --------------------------------------------------

    if USE_DEMO_LLM:
        return _demo_reply(
            user_message,
            context,
        )

    # --------------------------------------------------
    # API KEY CHECK
    # --------------------------------------------------

    if not GROQ_API_KEY:
        return _demo_reply(
            user_message,
            context,
        )

    try:

        from groq import AsyncGroq

        client = AsyncGroq(
            api_key=GROQ_API_KEY,
        )

        weather = context.get(
            "weather",
            {},
        )

        risk = context.get(
            "risk",
            {},
        )

        inundation = context.get(
            "inundation",
            {},
        )

        nearby_hazards = context.get(
            "nearby_hazards",
            0,
        )

        # --------------------------------------------------
        # RISK BREAKDOWN
        # --------------------------------------------------

        breakdown = risk.get(
            "breakdown",
            {},
        )

        # --------------------------------------------------
        # RETRIEVED GUIDANCE
        # --------------------------------------------------

        if retrieved_docs:

            guidance_lines = []

            for doc in retrieved_docs:

                topic = doc.get(
                    "topic",
                    "Safety Guidance",
                )

                text = doc.get(
                    "text",
                    "",
                )

                guidance_lines.append(
                    f"- [{topic}] {text}"
                )

            guidance_block = "\n".join(
                guidance_lines
            )

        else:

            guidance_block = (
                "No directly relevant "
                "guidance was retrieved."
            )

        # --------------------------------------------------
        # STRUCTURED CONTEXT
        # --------------------------------------------------

        context_block = f"""
CURRENT WEATHER
---------------
Source: {weather.get("source", "UNKNOWN")}
Condition: {weather.get("condition", "UNKNOWN")}
Temperature: {weather.get("temp", "UNKNOWN")} °C
Rainfall: {weather.get("rain_mm_1h", "UNKNOWN")} mm/hr
Humidity: {weather.get("humidity", "UNKNOWN")} %
Wind: {weather.get("wind_kmh", "UNKNOWN")} km/h
Visibility: {weather.get("visibility_km", "UNKNOWN")} km


PERSONAL RISK
-------------
Overall Score: {risk.get("overall_score", "UNKNOWN")}/100
Level: {risk.get("level", "UNKNOWN")}
Label: {risk.get("label", "UNKNOWN")}

Risk Breakdown:
- Rainfall Risk: {breakdown.get("rainfall_risk", "UNKNOWN")}
- Inundation Risk: {breakdown.get("inundation_risk", "UNKNOWN")}
- Lightning Risk: {breakdown.get("lightning_risk", "UNKNOWN")}
- Travel Risk: {breakdown.get("travel_risk", "UNKNOWN")}


INUNDATION
----------
Level: {inundation.get("level", "UNKNOWN")}
Score: {inundation.get("score", "UNKNOWN")}
Rainfall Intensity: {inundation.get("rainfall_intensity", "UNKNOWN")}
Nearest Risk Zone: {inundation.get("nearest_zone", "UNKNOWN")}
Distance: {inundation.get("nearest_zone_distance_km", "UNKNOWN")} km
Inside Known Risk Zone: {inundation.get("inside_known_risk_zone", "UNKNOWN")}
Explanation: {inundation.get("explanation", "UNKNOWN")}


COMMUNITY HAZARDS
-----------------
Nearby hazards within approximately 2 km:
{nearby_hazards}


RETRIEVED SAFETY GUIDANCE
-------------------------
{guidance_block}
"""

        # --------------------------------------------------
        # GROQ REQUEST
        # --------------------------------------------------

        completion = await client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": (
                        f"WEATHERGPT CONTEXT:\n"
                        f"{context_block}\n\n"
                        f"USER QUESTION:\n"
                        f"{user_message}"
                    ),
                },
            ],
            temperature=0.3,
            max_tokens=500,
        )

        answer = (
            completion
            .choices[0]
            .message
            .content
        )

        if not answer:
            return _demo_reply(
                user_message,
                context,
            )

        return answer.strip()

    except Exception as error:

        print(
            "❌ Groq AI error:",
            repr(error),
        )

        return _demo_reply(
            user_message,
            context,
        )