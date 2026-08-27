"""
Recommendation service layer.

The API routes should call this service instead of
accessing RecommendationEngine directly.
"""

from recommendation.engine import recommendation_engine


def get_similar_products(
    product_id: str,
    top_k: int = 5,
):
    """
    Return hybrid recommendations for a product.
    """

    return recommendation_engine.get_similar_products(
        product_id=product_id,
        top_k=top_k,
    )


def get_user_recommendations(
    user_id: str | None = None,
    viewed_product_ids: list[str] | None = None,
    top_k: int = 5,
):
    """
    Return personalized hybrid recommendations.
    """

    return recommendation_engine.get_recommendations_for_user(
        user_id=user_id,
        viewed_product_ids=viewed_product_ids,
        top_k=top_k,
    )


def rebuild_recommendation_index():
    """
    Rebuild the recommendation models.

    Useful after:
    - adding products
    - significant review updates
    - scheduled model refresh
    """

    recommendation_engine.build_index()

    return {
        "success": True,
        "message": "Recommendation index rebuilt successfully.",
    }