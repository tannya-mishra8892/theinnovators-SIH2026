from typing import Dict, Any, List


def calculate_alert_priority(
    risk_level: str,
    risk_score: float,
    rainfall_intensity: str,
    hazard_count: int = 0,
) -> Dict[str, Any]:
    """
    Phase 8 — Alert Intelligence Engine

    Converts WeatherGPT's existing risk information into
    a clear alert priority and recommended response.
    """

    level = str(risk_level or "LOW").upper()
    intensity = str(rainfall_intensity or "NONE").upper()

    score = float(risk_score or 0)

    hazard_bonus = min(hazard_count * 5, 20)

    priority_score = min(
        100,
        score
        + hazard_bonus
    )

    if level == "SEVERE" or priority_score >= 75:
        priority = "CRITICAL"
        action = "AVOID TRAVEL AND MOVE TO A SAFE LOCATION"
        color = "RED"

    elif level == "HIGH" or priority_score >= 50:
        priority = "HIGH"
        action = "AVOID LOW-LYING AND WATERLOGGED AREAS"
        color = "ORANGE"

    elif level == "MODERATE" or priority_score >= 25:
        priority = "MODERATE"
        action = "STAY ALERT AND MONITOR WEATHER UPDATES"
        color = "YELLOW"

    else:
        priority = "LOW"
        action = "NORMAL PRECAUTIONS"
        color = "GREEN"

    return {
        "priority": priority,
        "priority_score": round(priority_score, 1),
        "color": color,
        "recommended_action": action,
        "risk_level": level,
        "rainfall_intensity": intensity,
        "nearby_hazards": hazard_count,
        "explanation": (
            f"Alert priority is {priority} based on "
            f"{level.lower()} overall risk, "
            f"{intensity.lower()} rainfall intensity, "
            f"and {hazard_count} nearby hazard report(s)."
        ),
    }


def build_alert_summary(
    risk: Dict[str, Any],
    inundation: Dict[str, Any],
    hazard_count: int = 0,
) -> Dict[str, Any]:
    """
    Creates a single machine-readable alert intelligence summary.
    """

    risk_level = risk.get("level", "LOW")
    risk_score = risk.get("overall_score", 0)

    rainfall_intensity = inundation.get(
        "rainfall_intensity",
        "NONE",
    )

    priority = calculate_alert_priority(
        risk_level=risk_level,
        risk_score=risk_score,
        rainfall_intensity=rainfall_intensity,
        hazard_count=hazard_count,
    )

    return {
        "alert_engine": "WeatherGPT Alert Intelligence Engine",
        "status": "ACTIVE",
        "priority": priority,
        "inundation_level": inundation.get(
            "level",
            "LOW",
        ),
        "inundation_score": inundation.get(
            "score",
            0,
        ),
    }