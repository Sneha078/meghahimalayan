
"""
Intent detection for the AI shopping assistant.
 
This module does not use an external LLM or API.
It identifies common shopping intents using lightweight
keyword and pattern matching.
 
Performance note: all regex patterns are compiled once at import time
(module load) rather than re-passed as raw strings to re.search() on
every call. Python's `re` module does internally cache compiled patterns
(~512 entries by default), so this wasn't a correctness bug, but
precompiling removes the cache-lookup step entirely and makes the intent
of each pattern explicit at a glance.
"""
 
import re
from typing import Optional
 
# Supported assistant intents
SEARCH = "search"
RECOMMEND = "recommend"
SIMILAR = "similar"
REVIEW = "review"
FILTER = "filter"
PRODUCT_INFO = "product_info"
HELP = "help"
UNKNOWN = "unknown"
 
 
# ============================================================
# Precompiled patterns
# ============================================================
 
_PRICE_PATTERNS = [
    re.compile(
        r"(?:under|below|less than|max(?:imum)?|upto|up to)\s*"
        r"(?:rs\.?|npr\.?|रु\.?)?\s*([\d,]+)"
    ),
    re.compile(r"(?:rs\.?|npr\.?|रु\.?)\s*([\d,]+)"),
]
 
_PRODUCT_ID_PATTERN = re.compile(r"\b([WGP]\d{3})\b")
 
_GREETING_PATTERN = re.compile(r"\b(hello|hi|hey)\b")
 
# Category keywords. Short/generic words that could false-positive as a
# substring of an unrelated word (e.g. "round" inside "surround") use
# _word_in_text(), which enforces word boundaries via regex \b.
_WATCH_KEYWORDS = [
    "watch", "watches", "wristwatch", "timepiece", "chronograph",
    "round watch", "round dial", "square watch",
]
_EYEGLASSES_KEYWORDS = [
    "glass", "glasses", "eyeglass", "eyeglasses", "spectacle",
    "spectacles", "frame", "frames", "rounded-frame", "squared frame", "round frame",
]
_PERFUME_KEYWORDS = [
    "perfume", "perfumes", "fragrance", "fragrances", "attar", "ittar",
]
 
_REVIEW_PHRASES = [
    "review", "reviews", "what do people say", "customer feedback",
    "customer reviews", "is it good", "is this good",
    "what are people saying",
]
_SIMILAR_PHRASES = [
    "similar to", "similar products", "like this", "like this one",
    "something similar", "products like",
]
_RECOMMEND_PHRASES = [
    "recommend", "recommendation", "recommendations", "suggest",
    "suggestion", "what should i buy", "what should i get",
    "best for me", "what do you recommend",
]
_FILTER_PHRASES = [
    "under", "below", "less than", "upto", "up to", "between",
    "within my budget", "cheap", "affordable",
]
_SEARCH_WORDS = [
    "find", "search", "looking for", "show me", "want", "need",
    "looking", "give me",
]
 
 
def _word_in_text(word: str, text: str) -> bool:
    """
    Word-boundary substring check. Prevents false positives like the
    keyword "round" matching inside "surround" or "background".
    """
    return re.search(rf"\b{re.escape(word)}\b", text) is not None
 
 
def _any_phrase_in(phrases: list[str], text: str) -> bool:
    """Plain substring check for multi-word phrases (safe: phrases are
    specific enough that partial-word collision isn't a real risk)."""
    return any(phrase in text for phrase in phrases)
 
 
def _first_phrase_position(phrases: list[str], text: str) -> Optional[int]:
    """
    Return the index of the earliest-occurring phrase from `phrases`
    within `text`, or None if none of them appear.
    """
    positions = [text.find(phrase) for phrase in phrases if phrase in text]
    return min(positions) if positions else None
 
 
# ============================================================
# Extraction helpers
# ============================================================
 
def extract_price(text: str) -> Optional[float]:
    """
    Extract a price from natural language.
 
    Examples:
        "under 5000"
        "below Rs 3000"
        "less than 10000"
    """
    text_lower = text.lower()
 
    for pattern in _PRICE_PATTERNS:
        match = pattern.search(text_lower)
 
        if match:
            value = match.group(1).replace(",", "")
 
            try:
                return float(value)
            except ValueError:
                pass
 
    return None
 
 
def extract_product_id(text: str) -> Optional[str]:
    """
    Extract product IDs such as:
 
        W005
        G007
        P006
    """
    match = _PRODUCT_ID_PATTERN.search(text.upper())
 
    if match:
        return match.group(1)
 
    return None
 
 
def detect_category(text: str) -> Optional[str]:
    """
    Detect the product category from the user's message.
 
    Uses word-boundary matching for short/ambiguous keywords (e.g.
    "round" only counts inside phrases like "round watch" or "round
    frame", never as a bare substring of an unrelated word), and no
    longer treats generic words like "brand" as category-specific.
    """
    text = text.lower()
 
    if any(_word_in_text(word, text) for word in _WATCH_KEYWORDS):
        return "watches"
 
    if any(_word_in_text(word, text) for word in _EYEGLASSES_KEYWORDS):
        return "eyeglasses"
 
    if any(_word_in_text(word, text) for word in _PERFUME_KEYWORDS):
        return "perfumes"
 
    return None
 
 
def detect_intent(text: str) -> str:
    """
    Determine the user's primary shopping intent.
    """
    if not text or not text.strip():
        return UNKNOWN
 
    text_lower = text.lower()
 
    # Help / greeting.
    #
    # FIX: this previously read
    #     or "what can you do"
    # (missing "in text_lower"), and a bare non-empty string literal is
    # always truthy in Python -- so the whole condition was always True
    # and detect_intent() returned HELP for every non-empty message.
    #
    # _GREETING_PATTERN already matches "hi"/"hello"/"hey" with proper
    # \b word boundaries, so there's no need for a separate plain
    # substring check on "hi" (which would incorrectly match inside
    # words like "this" or "chip").
    if (
        _GREETING_PATTERN.search(text_lower)
        or "help" in text_lower
        or "what can you do" in text_lower
    ):
        return HELP
 
    # Review / sentiment-related requests
    if _any_phrase_in(_REVIEW_PHRASES, text_lower):
        return REVIEW
 
    # SIMILAR and RECOMMEND are equal priority: whichever phrase
    # actually occurs first in the message wins, rather than one
    # category always beating the other regardless of wording.
    # e.g. "recommend something similar to W005" -> RECOMMEND
    #      "something similar to this, any recommendations?" -> SIMILAR
    similar_pos = _first_phrase_position(_SIMILAR_PHRASES, text_lower)
    recommend_pos = _first_phrase_position(_RECOMMEND_PHRASES, text_lower)
 
    if similar_pos is not None or recommend_pos is not None:
        if recommend_pos is not None and (
            similar_pos is None or recommend_pos <= similar_pos
        ):
            return RECOMMEND
        return SIMILAR
 
    # Filtering
    if _any_phrase_in(_FILTER_PHRASES, text_lower):
        return FILTER
 
    # General product search
    if _any_phrase_in(_SEARCH_WORDS, text_lower):
        return SEARCH
 
    # Product information
    if extract_product_id(text):
        return PRODUCT_INFO
 
    return SEARCH
 
