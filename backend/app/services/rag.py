import json
import os
import re
import unicodedata


# ==================================================
# KNOWLEDGE BASE
# ==================================================

DATA_DIR = os.path.join(
    os.path.dirname(__file__),
    "..",
    "data",
)

KNOWLEDGE_FILE = os.path.join(
    DATA_DIR,
    "knowledge_base.json",
)


with open(
    KNOWLEDGE_FILE,
    "r",
    encoding="utf-8",
) as f:
    DOCS = json.load(f)


# ==================================================
# TEXT NORMALIZATION
# ==================================================

def _normalize(text: str) -> str:

    if not text:
        return ""

    text = unicodedata.normalize(
        "NFKC",
        str(text),
    )

    text = text.lower()

    # Common Hinglish / Hindi query normalization
    replacements = {
        "baarish": "rain",
        "barish": "rain",
        "barsaat": "rain",
        "paani": "water",
        "pani": "water",
        "baadh": "flood",
        "baad": "flood",
        "flooding": "flood",
        "jalbharav": "waterlogging",
        "jal bharav": "waterlogging",
        "bijli": "electric",
        "aandhi": "storm",
        "toofan": "storm",
        "yatra": "travel",
        "safar": "travel",
        "jaana": "travel",
        "jana": "travel",
        "surakshit": "safe",
        "suraksha": "safety",
        "khatra": "risk",
        "jokhim": "risk",
        "baarish": "rain",
    }

    for old, new in replacements.items():
        text = text.replace(
            old,
            f" {new} ",
        )

    return text


# ==================================================
# TOKENIZATION
# ==================================================

def _tokenize(text: str):

    normalized = _normalize(text)

    return set(
        re.findall(
            r"[a-z0-9]+",
            normalized,
        )
    )


# ==================================================
# PREPARE DOCUMENT TOKENS
# ==================================================

DOC_TOKENS = []

for doc in DOCS:

    combined_text = (
        f"{doc.get('topic', '')} "
        f"{doc.get('text', '')}"
    )

    tokens = _tokenize(
        combined_text
    )

    DOC_TOKENS.append(
        (
            doc,
            tokens,
        )
    )


# ==================================================
# QUERY EXPANSION
# ==================================================

KEYWORD_GROUPS = {

    "rain": {
        "rain",
        "rainfall",
        "heavy",
        "precipitation",
        "baarish",
        "barish",
        "barsaat",
    },

    "flood": {
        "flood",
        "flooding",
        "inundation",
        "waterlogging",
        "baadh",
        "jalbharav",
        "water",
    },

    "travel": {
        "travel",
        "road",
        "journey",
        "drive",
        "commute",
        "safar",
        "jana",
        "jaana",
    },

    "lightning": {
        "lightning",
        "thunder",
        "thunderstorm",
        "bijli",
    },

    "landslide": {
        "landslide",
        "slope",
        "mountain",
        "hill",
        "pahad",
    },

    "cyclone": {
        "cyclone",
        "storm",
        "toofan",
        "aandhi",
    },

    "safety": {
        "safe",
        "safety",
        "danger",
        "risk",
        "precaution",
        "suraksha",
        "surakshit",
        "khatra",
        "jokhim",
    },
}


def _expand_query_tokens(
    query_tokens,
):

    expanded = set(query_tokens)

    for group in KEYWORD_GROUPS.values():

        if query_tokens.intersection(group):

            expanded.update(group)

    return expanded


# ==================================================
# RETRIEVAL
# ==================================================

def retrieve(
    query: str,
    top_k: int = 3,
):

    if not query or not query.strip():
        return []

    query_tokens = _tokenize(query)

    if not query_tokens:
        return []

    expanded_tokens = _expand_query_tokens(
        query_tokens
    )

    scored = []

    for doc, doc_tokens in DOC_TOKENS:

        direct_overlap = len(
            query_tokens & doc_tokens
        )

        expanded_overlap = len(
            expanded_tokens & doc_tokens
        )

        # Direct query matches receive more importance.
        score = (
            direct_overlap * 3
            + expanded_overlap
        )

        if score > 0:

            scored.append(
                (
                    score,
                    direct_overlap,
                    doc,
                )
            )

    # Highest relevance first
    scored.sort(
        key=lambda item: (
            item[0],
            item[1],
        ),
        reverse=True,
    )

    return [
        doc
        for _, _, doc in scored[:top_k]
    ]