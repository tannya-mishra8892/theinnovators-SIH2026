import json
import math
import os


DATA_DIR = os.path.join(
    os.path.dirname(__file__),
    "..",
    "data",
)


with open(
    os.path.join(DATA_DIR, "flood_zones.json"),
    encoding="utf-8",
) as f:
    FLOOD_ZONES = json.load(f)["zones"]


# ==================================================
# HAVERSINE DISTANCE
# ==================================================

def _haversine_km(
    lat1,
    lon1,
    lat2,
    lon2,
):
    R = 6371

    p1 = math.radians(lat1)
    p2 = math.radians(lat2)

    dphi = math.radians(
        lat2 - lat1
    )

    dlambda = math.radians(
        lon2 - lon1
    )

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(p1)
        * math.cos(p2)
        * math.sin(dlambda / 2) ** 2
    )

    return (
        2
        * R
        * math.asin(math.sqrt(a))
    )


# ==================================================
# RAINFALL CLASSIFICATION
# ==================================================

def rainfall_intensity_level(
    rain_mm_1h: float,
) -> str:

    """
    Prototype hourly rainfall classification.

    NOTE:
    This is an approximate prototype classification,
    not an official IMD warning classification.
    """

    if rain_mm_1h <= 0.2:
        return "NONE"

    if rain_mm_1h < 2.5:
        return "LIGHT"

    if rain_mm_1h < 7.5:
        return "MODERATE"

    if rain_mm_1h < 15:
        return "HEAVY"

    return "SEVERE"


# ==================================================
# NEAREST FLOOD ZONE
# ==================================================

def nearest_flood_zone(
    lat: float,
    lon: float,
):

    best = None
    best_dist = None

    for zone in FLOOD_ZONES:

        distance = _haversine_km(
            lat,
            lon,
            zone["lat"],
            zone["lon"],
        )

        if (
            best_dist is None
            or distance < best_dist
        ):
            best_dist = distance
            best = zone

    inside = (
        best is not None
        and best_dist <= best["radius_km"]
    )

    return (
        best,
        best_dist,
        inside,
    )


# ==================================================
# INUNDATION RISK
# ==================================================

def inundation_risk(
    lat: float,
    lon: float,
    rain_mm_1h: float,
) -> dict:

    zone, dist_km, inside = (
        nearest_flood_zone(
            lat,
            lon,
        )
    )

    intensity = (
        rainfall_intensity_level(
            rain_mm_1h
        )
    )

    base_risk = (
        zone.get("base_risk", "low")
        if zone
        else "low"
    )

    base_score = {
        "low": 15,
        "moderate": 40,
        "high": 65,
    }.get(
        base_risk,
        15,
    )

    intensity_bump = {
        "NONE": 0,
        "LIGHT": 5,
        "MODERATE": 15,
        "HEAVY": 30,
        "SEVERE": 45,
    }[intensity]

    raw_score = (
        base_score
        + intensity_bump
    )

    if not inside:
        raw_score = max(
            0,
            raw_score - 25,
        )

    score = min(
        100,
        raw_score,
    )

    # --------------------------------------------------
    # LEVEL
    # --------------------------------------------------

    if score >= 70:
        level = "SEVERE"

    elif score >= 45:
        level = "HIGH"

    elif score >= 20:
        level = "MODERATE"

    else:
        level = "LOW"

    # --------------------------------------------------
    # EXPLANATION
    # --------------------------------------------------

    zone_name = (
        zone["name"]
        if zone
        else None
    )

    if zone:
        zone_description = (
            f"nearest known flood zone is "
            f"'{zone_name}' at approximately "
            f"{dist_km:.2f} km"
        )
    else:
        zone_description = (
            "no known flood zone was found"
        )

    location_status = (
        "inside the known risk zone"
        if inside
        else "outside the known risk zone"
    )

    explanation = (
        f"Inundation risk is {level}. "
        f"Rainfall intensity is {intensity.lower()} "
        f"at approximately {rain_mm_1h} mm/hr. "
        f"The location is {location_status}; "
        f"{zone_description}."
    )

    # --------------------------------------------------
    # FACTORS
    # --------------------------------------------------

    factors = []

    if rain_mm_1h > 0:
        factors.append(
            {
                "factor": "Rainfall",
                "value": rain_mm_1h,
                "unit": "mm/hr",
                "impact": intensity,
            }
        )

    if zone:
        factors.append(
            {
                "factor": "Flood Zone",
                "value": zone_name,
                "unit": "",
                "impact": base_risk.upper(),
            }
        )

    factors.append(
        {
            "factor": "Zone Proximity",
            "value": (
                round(dist_km, 2)
                if dist_km is not None
                else None
            ),
            "unit": "km",
            "impact": (
                "INSIDE"
                if inside
                else "OUTSIDE"
            ),
        }
    )

    return {
        "label": (
            "PROTOTYPE INUNDATION RISK — "
            "rule-based on mock zone data, "
            "not trained ML / real DEM"
        ),
        "score": round(
            score,
            1,
        ),
        "level": level,
        "nearest_zone": zone_name,
        "nearest_zone_distance_km": (
            round(
                dist_km,
                2,
            )
            if dist_km is not None
            else None
        ),
        "inside_known_risk_zone": inside,
        "rainfall_intensity": intensity,
        "explanation": explanation,
        "factors": factors,
    }


# ==================================================
# PERSONAL WEATHER RISK
# ==================================================

def personal_risk_score(
    weather: dict,
    inundation: dict,
    lightning_prob: float = 0.0,
    hazard_count: int = 0,
) -> dict:

    """
    Transparent weighted risk formula.

    This is a prototype rule-based score,
    NOT an ML prediction.
    """

    rain_mm = weather.get(
        "rain_mm_1h",
        0.0,
    )

    # --------------------------------------------------
    # INDIVIDUAL COMPONENTS
    # --------------------------------------------------

    rainfall_risk = min(
        100,
        rain_mm * 6,
    )

    inundation_component = min(
        100,
        inundation.get(
            "score",
            0,
        ),
    )

    lightning_risk = min(
        100,
        lightning_prob * 100,
    )

    travel_risk = min(
        100,
        (
            inundation_component * 0.6
            + hazard_count * 8
            + rain_mm * 2
        ),
    )

    # --------------------------------------------------
    # WEIGHTS
    # --------------------------------------------------

    weights = {
        "rainfall": 0.30,
        "inundation": 0.30,
        "lightning": 0.15,
        "travel": 0.25,
    }

    # --------------------------------------------------
    # WEIGHTED SCORE
    # --------------------------------------------------

    rainfall_contribution = (
        rainfall_risk
        * weights["rainfall"]
    )

    inundation_contribution = (
        inundation_component
        * weights["inundation"]
    )

    lightning_contribution = (
        lightning_risk
        * weights["lightning"]
    )

    travel_contribution = (
        travel_risk
        * weights["travel"]
    )

    overall = (
        rainfall_contribution
        + inundation_contribution
        + lightning_contribution
        + travel_contribution
    )

    overall = round(
        min(100, overall),
        1,
    )

    # --------------------------------------------------
    # OVERALL LEVEL
    # --------------------------------------------------

    if overall >= 75:
        level = "SEVERE"

    elif overall >= 50:
        level = "HIGH"

    elif overall >= 25:
        level = "MODERATE"

    else:
        level = "LOW"

    # --------------------------------------------------
    # CONTRIBUTIONS
    # --------------------------------------------------

    contributions = {
        "rainfall": round(
            rainfall_contribution,
            1,
        ),
        "inundation": round(
            inundation_contribution,
            1,
        ),
        "lightning": round(
            lightning_contribution,
            1,
        ),
        "travel": round(
            travel_contribution,
            1,
        ),
    }

    # --------------------------------------------------
    # EXPLAINABLE FACTORS
    # --------------------------------------------------

    factor_list = [
        {
            "factor": "Rainfall",
            "score": round(
                rainfall_risk,
                1,
            ),
            "weight": weights["rainfall"],
            "contribution": round(
                rainfall_contribution,
                1,
            ),
            "value": rain_mm,
            "unit": "mm/hr",
        },
        {
            "factor": "Inundation",
            "score": round(
                inundation_component,
                1,
            ),
            "weight": weights["inundation"],
            "contribution": round(
                inundation_contribution,
                1,
            ),
            "value": inundation.get(
                "level",
                "UNKNOWN",
            ),
            "unit": "",
        },
        {
            "factor": "Lightning",
            "score": round(
                lightning_risk,
                1,
            ),
            "weight": weights["lightning"],
            "contribution": round(
                lightning_contribution,
                1,
            ),
            "value": round(
                lightning_prob * 100,
                1,
            ),
            "unit": "%",
        },
        {
            "factor": "Travel",
            "score": round(
                travel_risk,
                1,
            ),
            "weight": weights["travel"],
            "contribution": round(
                travel_contribution,
                1,
            ),
            "value": hazard_count,
            "unit": "nearby hazards",
        },
    ]

    # --------------------------------------------------
    # TOP CONTRIBUTING FACTOR
    # --------------------------------------------------

    top_factor = max(
        factor_list,
        key=lambda item: item[
            "contribution"
        ],
    )

    # --------------------------------------------------
    # HUMAN READABLE EXPLANATION
    # --------------------------------------------------

    explanation = (
        f"Overall weather safety risk is "
        f"{level} at {overall}/100. "
        f"The largest contributing factor is "
        f"{top_factor['factor']} "
        f"({top_factor['contribution']} weighted points). "
        f"Rainfall contributes "
        f"{rainfall_contribution:.1f}, "
        f"inundation contributes "
        f"{inundation_contribution:.1f}, "
        f"lightning contributes "
        f"{lightning_contribution:.1f}, "
        f"and travel contributes "
        f"{travel_contribution:.1f}."
    )

    # --------------------------------------------------
    # RECOMMENDED ACTION
    # --------------------------------------------------

    if level == "SEVERE":

        recommended_action = (
            "Avoid unnecessary travel, stay away from "
            "flood-prone or waterlogged areas, and "
            "follow verified local emergency guidance."
        )

    elif level == "HIGH":

        recommended_action = (
            "Use caution, avoid known waterlogged areas, "
            "and reconsider non-essential travel."
        )

    elif level == "MODERATE":

        recommended_action = (
            "Stay alert to changing weather conditions "
            "and take normal travel precautions."
        )

    else:

        recommended_action = (
            "Conditions currently indicate relatively "
            "low risk. Continue normal weather precautions."
        )

    return {
        "label": (
            "RULE-BASED RISK SCORE "
            "(transparent weighted formula, "
            "not an ML prediction)"
        ),

        "overall_score": overall,

        "level": level,

        "breakdown": {
            "rainfall_risk": round(
                rainfall_risk,
                1,
            ),
            "inundation_risk": round(
                inundation_component,
                1,
            ),
            "lightning_risk": round(
                lightning_risk,
                1,
            ),
            "travel_risk": round(
                travel_risk,
                1,
            ),
        },

        "weights_used": weights,

        "contributions": contributions,

        "factors": factor_list,

        "top_risk_factor": {
            "factor": top_factor["factor"],
            "contribution": top_factor[
                "contribution"
            ],
        },

        "explanation": explanation,

        "recommended_action": recommended_action,
    }