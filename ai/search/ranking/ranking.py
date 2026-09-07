import re
import logging
from rapidfuzz import fuzz

logger = logging.getLogger(__name__)

DEFAULT_BESTSELLER_BOOST = 0.15
DEFAULT_FEATURED_BOOST = 0.10
DEFAULT_RATING_WEIGHT = 0.05
DEFAULT_OUT_OF_STOCK_PENALTY = 0.50

# A product whose RRF score is below this fraction of the top scorer
# is considered noise and dropped from results.
# e.g. top score = 0.032 → cutoff = 0.032 * 0.30 = 0.0096
# Products with score < 0.0096 are not returned.
DEFAULT_RELATIVE_SCORE_CUTOFF = 0.30

# How much to boost a product whose brand or category directly matches
# a query token (exact or near-exact, ratio >= 85).
DEFAULT_BRAND_MATCH_BOOST = 0.20
DEFAULT_CATEGORY_MATCH_BOOST = 0.10


def _query_matches_field(query: str, field_value: str, threshold: int = 85) -> bool:
    """
    Return True if any token in `query` fuzzy-matches any token in
    `field_value` at or above `threshold`.

    Used to detect brand/category relevance for score boosting.
    """
    if not query or not field_value:
        return False

    query_tokens = re.findall(r"\w+", query.lower())
    field_tokens = re.findall(r"\w+", field_value.lower())

    for q_tok in query_tokens:
        for f_tok in field_tokens:
            if fuzz.ratio(q_tok, f_tok) >= threshold:
                return True
    return False


def rank_products(
    products: list[dict],
    rrf_scores: dict[str, float],
    query: str = "",
) -> list[dict]:
    """
    Apply business-level ranking on top of RRF scores.

    RRF determines relevance from retrieval.
    This function adjusts that relevance using:
        - brand/category match boosts (keeps relevant products at top)
        - bestseller / featured boosts
        - rating boost
        - out-of-stock penalty
        - relative score cutoff (drops noise products)

    Args:
        products:   Full product dicts from the DB.
        rrf_scores: {product_id: rrf_score} from fusion step.
        query:      Original search query (used for brand/category boosting).
    """

    if not rrf_scores:
        return []

    ranked = []

    for product in products:
        product_id = product.get("id")

        if not product_id or product_id not in rrf_scores:
            continue

        score = rrf_scores[product_id]

        # ---------------------------------------------------------
        # Brand / category relevance boost
        # ---------------------------------------------------------
        # When the query directly mentions a brand (e.g. "seiko") or
        # category (e.g. "watches"), products matching those fields
        # receive a significant boost so they always outrank noise
        # products that accidentally appear in BM25/semantic results.
        # ---------------------------------------------------------

        if query:
            brand = product.get("brand", "")
            category = product.get("category", "")

            if brand and _query_matches_field(query, brand, threshold=75):
                score += DEFAULT_BRAND_MATCH_BOOST
                logger.debug(
                    "rank_products: brand boost +%.2f for %r (brand=%r, query=%r)",
                    DEFAULT_BRAND_MATCH_BOOST,
                    product.get("name"),
                    brand,
                    query,
                )

            if category and _query_matches_field(query, category, threshold=75):
                score += DEFAULT_CATEGORY_MATCH_BOOST

        # Bestseller boost
        if product.get("isBestSeller", False):
            score += DEFAULT_BESTSELLER_BOOST

        # Featured boost
        if product.get("isFeatured", False):
            score += DEFAULT_FEATURED_BOOST

        # Rating boost
        rating = product.get("ratings", 0) or 0
        try:
            rating = float(rating)
        except (TypeError, ValueError):
            rating = 0
        score += (rating / 5.0) * DEFAULT_RATING_WEIGHT

        # Out-of-stock penalty
        stock = product.get("stock", 0) or 0
        try:
            stock = float(stock)
        except (TypeError, ValueError):
            stock = 0
        if product.get("isOutOfStock", False) or stock <= 0:
            score -= DEFAULT_OUT_OF_STOCK_PENALTY

        item = dict(product)
        item["search_score"] = round(score, 6)
        ranked.append(item)

    ranked.sort(key=lambda p: p["search_score"], reverse=True)

    # ---------------------------------------------------------
    # Relative score cutoff — drop noise products
    # ---------------------------------------------------------
    # Products far below the top scorer are almost certainly noise
    # from BM25/semantic coincidentally matching unrelated content.
    # ---------------------------------------------------------

    if ranked:
        top_score = ranked[0]["search_score"]
        # Only apply cutoff when the top score is meaningfully above zero
        # (avoids cutting all results when everything scores near zero).
        if top_score > 0:
            cutoff = top_score * DEFAULT_RELATIVE_SCORE_CUTOFF
            ranked = [p for p in ranked if p["search_score"] >= cutoff]

    return ranked