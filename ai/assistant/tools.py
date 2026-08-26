"""
Tools used by the AI shopping assistant.
"""

import logging
import time
from threading import Lock
from typing import Any

from shared import product_service

logger = logging.getLogger(__name__)


class _TTLCache:
    def __init__(self, maxsize: int = 256, ttl_seconds: float = 30.0):
        self._store: dict[Any, tuple[Any, float]] = {}
        self._maxsize = maxsize
        self._ttl = ttl_seconds
        self._lock = Lock()

    def get(self, key: Any):
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.monotonic() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: Any, value: Any) -> None:
        with self._lock:
            if key not in self._store and len(self._store) >= self._maxsize:
                oldest_key = next(iter(self._store))
                del self._store[oldest_key]
            self._store[key] = (value, time.monotonic() + self._ttl)


_product_cache = _TTLCache(maxsize=500, ttl_seconds=30.0)


def search_products(query: str, top_k: int = 5) -> list[dict[str, Any]]:
    try:
        from semantic_search.engine import search_products as semantic_search
        return semantic_search(query, top_k=top_k)
    except Exception:
        logger.warning(
            "Semantic search unavailable, falling back to substring search",
            exc_info=True,
        )
        products = product_service.get_all_products()
        print({p["category"] for p in products})
        query_lower = query.lower()
        matches = []
        for product in products:
            searchable = " ".join([
                str(product.get("name", "")),
                str(product.get("category", "")),
                str(product.get("brand", "")),
                str(product.get("description", "")),
            ]).lower()
            if any(word in searchable for word in query_lower.split()):
                matches.append(product)
            if len(matches) >= top_k:
                break
        return matches


def get_recommendations(
    product_id: str | None = None,
    viewed_product_ids: list[str] | None = None,
    user_id: str | None = None,
    top_k: int = 5,
) -> list[dict[str, Any]]:
    """
    Get product recommendations using the existing recommendation engine.

    NOTE: this previously accepted `user_name` and forwarded it as-is to
    RecommendationEngine.get_recommendations_for_user(), which does not
    declare that parameter (it declares `user_id`) -- every call without
    a product_id raised TypeError. `user_id` here should be the MongoDB
    user _id string (as stored on embedded reviews), not a display name;
    the collaborative-filtering matrix is keyed by that id, so a display
    name would never match anything even if it didn't crash.
    """
    from recommendation.engine import recommendation_engine

    if product_id:
        return recommendation_engine.get_similar_products(
            product_id,
            top_k=top_k,
        )

    return recommendation_engine.get_recommendations_for_user(
        viewed_product_ids=viewed_product_ids or [],
        user_id=user_id,
        top_k=top_k,
    )


def get_similar_products(product_id: str, top_k: int = 5) -> list[dict[str, Any]]:
    from recommendation.engine import recommendation_engine
    return recommendation_engine.get_similar_products(product_id, top_k=top_k)


def analyze_product_reviews(product_id: str) -> dict[str, Any]:
    from sentiment.engine import analyze_sentiment

    reviews = product_service.get_reviews_for_product(product_id)

    if not reviews:
        return {
            "product_id": product_id,
            "review_count": 0,
            "overall_sentiment": "unknown",
            "reviews": [],
        }

    analyzed_reviews = []
    compound_scores = []

    for review in reviews:
        result = analyze_sentiment(review["review_text"])
        compound_scores.append(result["compound"])
        analyzed_reviews.append({
            "review_id": review["id"],
            "user_name": review["user_name"],
            "rating": review["rating"],
            "review_text": review["review_text"],
            "sentiment": result["sentiment"],
            "compound": result["compound"],
        })

    average_score = sum(compound_scores) / len(compound_scores)

    if average_score >= 0.05:
        overall = "positive"
    elif average_score <= -0.05:
        overall = "negative"
    else:
        overall = "neutral"

    return {
        "product_id": product_id,
        "review_count": len(reviews),
        "overall_sentiment": overall,
        "average_compound": round(average_score, 4),
        "reviews": analyzed_reviews,
    }


def get_product(product_id: str) -> dict[str, Any] | None:
    cached = _product_cache.get(product_id)
    if cached is not None:
        return cached

    product = product_service.get_product(product_id)

    if product is not None:
        _product_cache.set(product_id, product)

    return product


def filter_products(
    category: str | None = None,
    max_price: float | None = None,
    min_price: float | None = None,
    gender: str | None = None,
) -> list[dict[str, Any]]:
    return product_service.filter_products(
        category=category,
        max_price=max_price,
        min_price=min_price,
        gender=gender,
    )