"""
Fuzzy product search.

Provides typo-tolerant matching for product brands and product names.

Examples:
    "rabann glasses" -> Ray-Ban eyeglasses
    "dio perfam"     -> Dior perfume

The search is token-aware so generic words such as "glasses" do not
overpower a distinctive misspelled brand such as "rabann".
"""

from rapidfuzz import fuzz, process

from search.query.preprocessing import normalize_query, tokenize
from shared import product_service


DEFAULT_TOP_K = 5
DEFAULT_THRESHOLD = 70


# -------------------------------------------------------------------
# Generic product/category words
# -------------------------------------------------------------------
# These words are useful, but they are not distinctive enough to
# determine the product by themselves.
#
# They receive a lower weight during fuzzy scoring.
# -------------------------------------------------------------------

GENERIC_TOKENS = {
    "glasses",
    "eyeglasses",
    "sunglasses",
    "frames",
    "frame",
    "watch",
    "watches",
    "perfume",
    "perfumes",
    "parfum",
    "fragrance",
    "wallet",
    "wallets",
    "bag",
    "bags",
    "shoe",
    "shoes",
    "men",
    "women",
    "male",
    "female",
    "classic",
    "premium",
    "new",
    "style",
}


# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

def _tokenize_text(value: str) -> list[str]:
    """Normalize and tokenize a text value."""
    normalized = normalize_query(value)

    if not normalized:
        return []

    return [
        token
        for token in tokenize(normalized)
        if token
    ]


def _best_token_score(
    query_token: str,
    candidate_tokens: list[str],
) -> float:
    """
    Return the best fuzzy score between one query token and
    candidate tokens.
    """

    if not candidate_tokens:
        return 0.0

    matches = process.extract(
        query_token,
        candidate_tokens,
        scorer=fuzz.ratio,
        limit=1,
        score_cutoff=0,
    )

    if not matches:
        return 0.0

    return float(matches[0][1])


def _token_weight(token: str) -> float:
    """
    Assign importance to a query token.

    Distinctive tokens receive full weight.
    Generic category tokens receive lower weight.
    """

    if token in GENERIC_TOKENS:
        return 0.35

    return 1.0


# -------------------------------------------------------------------
# Main fuzzy search
# -------------------------------------------------------------------

def search_fuzzy(
    query: str,
    top_k: int = DEFAULT_TOP_K,
    threshold: int = DEFAULT_THRESHOLD,
) -> list[tuple[str, float]]:
    """
    Fuzzy product search with token-level typo tolerance.

    Each query token is compared against:
        - product brand tokens
        - product name tokens

    The final product score combines the best matches from each query
    token.

    Examples:

        "rabann glasses"
            -> Ray-Ban eyeglasses

        "dio perfam"
            -> Dior perfume

    Returns:
        List of (product_id, fuzzy_score) tuples ordered by score.
    """

    normalized_query = normalize_query(query)

    if not normalized_query:
        return []

    query_tokens = _tokenize_text(normalized_query)

    if not query_tokens:
        return []

    products = product_service.get_all_products()

    if not products:
        return []

    # ---------------------------------------------------------------
    # Prepare product token data
    # ---------------------------------------------------------------

    product_data: dict[str, dict] = {}

    all_brand_tokens: list[str] = []
    all_name_tokens: list[str] = []

    for product in products:

        product_id = product.get("id")

        if not product_id:
            continue

        brand = str(product.get("brand", ""))
        name = str(product.get("name", ""))

        brand_tokens = _tokenize_text(brand)
        name_tokens = _tokenize_text(name)

        product_data[product_id] = {
            "brand": brand_tokens,
            "name": name_tokens,
        }

        all_brand_tokens.extend(brand_tokens)
        all_name_tokens.extend(name_tokens)

    if not product_data:
        return []

    # ---------------------------------------------------------------
    # Build best token matches
    # ---------------------------------------------------------------
    #
    # For each query token:
    #
    #   "rabann"
    #
    # should discover:
    #
    #   "ray-ban" -> ~76.9
    #
    # For:
    #
    #   "perfam"
    #
    # should discover:
    #
    #   "perfume" -> ~76.9
    #
    # ---------------------------------------------------------------

    token_matches: dict[str, list[tuple[str, float, str]]] = {}

    for query_token in query_tokens:

        matches: list[tuple[str, float, str]] = []

        # -----------------------------------------------------------
        # Brand candidates
        # -----------------------------------------------------------

        brand_results = process.extract(
            query_token,
            all_brand_tokens,
            scorer=fuzz.ratio,
            limit=max(top_k * 10, 20),
            score_cutoff=threshold,
        )

        for candidate, score, _ in brand_results:
            matches.append(
                (
                    str(candidate),
                    float(score),
                    "brand",
                )
            )

        # -----------------------------------------------------------
        # Name candidates
        # -----------------------------------------------------------

        name_results = process.extract(
            query_token,
            all_name_tokens,
            scorer=fuzz.ratio,
            limit=max(top_k * 10, 20),
            score_cutoff=threshold,
        )

        for candidate, score, _ in name_results:
            matches.append(
                (
                    str(candidate),
                    float(score),
                    "name",
                )
            )

        token_matches[query_token] = matches

    # ---------------------------------------------------------------
    # Score products
    # ---------------------------------------------------------------

    best_by_product: dict[str, float] = {}

    for product_id, data in product_data.items():

        brand_tokens = data["brand"]
        name_tokens = data["name"]

        total_score = 0.0
        total_weight = 0.0

        strong_matches = 0

        for query_token in query_tokens:

            weight = _token_weight(query_token)

            # -------------------------------------------------------
            # Best match against brand
            # -------------------------------------------------------

            brand_score = _best_token_score(
                query_token,
                brand_tokens,
            )

            # -------------------------------------------------------
            # Best match against product name
            # -------------------------------------------------------

            name_score = _best_token_score(
                query_token,
                name_tokens,
            )

            # -------------------------------------------------------
            # Prefer brand matches when they are distinctive.
            #
            # Example:
            #     rabann -> ray-ban
            #
            # This is much more important than:
            #     glasses -> eyeglasses
            # -------------------------------------------------------

            best_score = max(
                brand_score,
                name_score,
            )

            if best_score < threshold:
                continue

            # Track strong matches separately.
            if best_score >= 75:
                strong_matches += 1

            total_score += best_score * weight
            total_weight += weight

        if total_weight == 0:
            continue

        average_score = total_score / total_weight

        # -----------------------------------------------------------
        # Require at least one meaningful match.
        # -----------------------------------------------------------

        if strong_matches == 0:
            continue

        # -----------------------------------------------------------
        # Multi-token bonus.
        #
        # "rabann glasses"
        #
        # should score higher than a product matching only
        # "glasses".
        # -----------------------------------------------------------

        matched_tokens = 0

        for query_token in query_tokens:

            brand_score = _best_token_score(
                query_token,
                brand_tokens,
            )

            name_score = _best_token_score(
                query_token,
                name_tokens,
            )

            if max(brand_score, name_score) >= threshold:
                matched_tokens += 1

        if matched_tokens > 1:
            average_score += 8.0

        # -----------------------------------------------------------
        # Brand-match bonus.
        #
        # This is particularly useful for:
        #
        #   rabann -> Ray-Ban
        #   dio    -> Dior
        # -----------------------------------------------------------

        best_brand_score = 0.0

        for query_token in query_tokens:

            score = _best_token_score(
                query_token,
                brand_tokens,
            )

            best_brand_score = max(
                best_brand_score,
                score,
            )

        if best_brand_score >= 75:
            average_score += 10.0

        best_by_product[product_id] = average_score

    # ---------------------------------------------------------------
    # Sort results
    # ---------------------------------------------------------------

    results = sorted(
        best_by_product.items(),
        key=lambda item: item[1],
        reverse=True,
    )

    return [
        (product_id, round(score, 4))
        for product_id, score in results[:top_k]
    ]