import re
from typing import Optional


def normalize_query(query: str) -> str:
    """
    Normalize a user search query before retrieval.

    Handles:
    - Lowercasing
    - Currency/price normalization
    - Comma-separated prices
    - Hyphen normalization
    - Punctuation cleanup
    - Whitespace normalization
    """

    if not isinstance(query, str):
        return ""

    query = query.strip().lower()

    if not query:
        return ""

    # Normalize currency + price.
    # Examples:
    # Rs. 2,500  -> 2500
    # Rs 2500    -> 2500
    # रु. 2,500  -> 2500
    # रु 2500    -> 2500
    def normalize_price(match: re.Match) -> str:
        price = match.group(1)
        return price.replace(",", "")

    query = re.sub(
        r"(?:rs\.?|रु\.?)\s*([\d,]+(?:\.\d+)?)",
        normalize_price,
        query,
    )

    # Normalize different dash characters.
    query = re.sub(r"[‐-‒–—−]", "-", query)

    # Remove punctuation except hyphens and apostrophes.
    query = re.sub(
        r"[^\w\s\-']",
        " ",
        query,
        flags=re.UNICODE,
    )

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


def correct_query(query: str, vocabulary: list[str], threshold: int = 80) -> Optional[str]:
    """
    Attempt to correct misspelled tokens in `query` by matching each token
    against a flat vocabulary of known product terms (brand names, product
    names, category words, etc.).

    Only tokens that do NOT already appear in the vocabulary are corrected;
    correctly-spelled tokens are left untouched.

    Args:
        query:       Raw or pre-normalised query string.
        vocabulary:  List of known lowercase word strings to match against.
        threshold:   Minimum rapidfuzz ratio score to accept a correction.

    Returns:
        Corrected query string, or None if rapidfuzz is not available or the
        query is empty.  The caller should fall back to the original query if
        None is returned.
    """
    try:
        from rapidfuzz import fuzz, process as rf_process
    except ImportError:
        return None

    tokens = tokenize(query)
    if not tokens:
        return None

    vocab_set = set(vocabulary)
    corrected: list[str] = []

    for token in tokens:
        if token in vocab_set:
            # Already a known word — keep as-is.
            corrected.append(token)
            continue

        match = rf_process.extractOne(
            token,
            vocabulary,
            scorer=fuzz.ratio,
            score_cutoff=threshold,
        )
        if match:
            corrected.append(match[0])
        else:
            corrected.append(token)

    return " ".join(corrected)
