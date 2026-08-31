import re


def normalize_query(query: str) -> str:
    """
    Normalize a user search query before retrieval.

    Handles:
    - Lowercasing
    - Price/currency normalization
    - Hyphen normalization
    - Punctuation cleanup
    - Whitespace normalization

    The function intentionally preserves meaningful product words.
    """

    if not isinstance(query, str):
        return ""

    query = query.strip().lower()

    if not query:
        return ""

    # Normalize common currency formats.
    # Examples:
    #   Rs. 2,500 -> 2500
    #   Rs 2,500  -> 2500
    #   रु. 2,500 -> 2500
    #   रु 2500   -> 2500
    query = re.sub(
        r"(?:rs\.?|रु\.?)\s*([\d,]+(?:\.\d+)?)",
        r"\1",
        query,
    )

    # Normalize different dash characters to a normal hyphen.
    query = re.sub(r"[‐-‒–—−]", "-", query)

    # Remove punctuation except hyphens and apostrophes.
    query = re.sub(r"[^\w\s\-']", " ", query, flags=re.UNICODE)

    # Normalize whitespace.
    query = re.sub(r"\s+", " ", query).strip()

    return query


def tokenize(query: str) -> list[str]:
    """
    Normalize and tokenize a search query.
    """

    normalized = normalize_query(query)

    if not normalized:
        return []

    return normalized.split()