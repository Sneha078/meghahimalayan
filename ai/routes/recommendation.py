from fastapi import APIRouter, HTTPException, Query

from recommendation.service import (
    get_similar_products,
    get_user_recommendations,
    rebuild_recommendation_index,
)
from schemas.recommendation import (
    RebuildIndexResponse,
    RecommendationRequest,
    RecommendationResponse,
    RecommendedProduct,
    UserRecommendationRequest,
    UserRecommendationResponse,
)

recommendation_router = APIRouter(prefix="/recommendation", tags=["recommendation"])


def _to_recommended_product(p: dict) -> RecommendedProduct:
    tags = p.get("tags") or []
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]

    occasion = p.get("occasion") or []
    if isinstance(occasion, str):
        occasion = [o.strip() for o in occasion.split(",") if o.strip()]

    season = p.get("season") or []
    if isinstance(season, str):
        season = [s.strip() for s in season.split(",") if s.strip()]

    rating = p.get("rating")
    if rating is not None:
        try:
            rating = float(rating)
        except (ValueError, TypeError):
            rating = None

    price = 0.0
    try:
        price = float(p.get("price") or 0.0)
    except (ValueError, TypeError):
        price = 0.0

    score = 0.0
    for key in ("similarity_score", "score", "content_score", "collaborative_score"):
        if p.get(key) is not None:
            try:
                score = float(p[key])
                break
            except (ValueError, TypeError):
                pass

    return RecommendedProduct(
        id=str(p.get("id") or p.get("product_id") or ""),
        name=str(p.get("name") or ""),
        category=str(p.get("category") or ""),
        brand=p.get("brand") or None,
        description=p.get("description") or None,
        price=price,
        gender=p.get("gender") or None,
        tags=tags,
        occasion=occasion,
        season=season,
        rating=rating,
        image_url=p.get("image_url") or p.get("image") or None,
        similarity_score=round(score, 4),
    )


@recommendation_router.post(
    "/similar",
    response_model=RecommendationResponse,
    summary="Get similar products by product ID (POST)",
)
def get_similar_products_post(request: RecommendationRequest) -> RecommendationResponse:
    try:
        raw_products = get_similar_products(
            product_id=request.product_id,
            top_k=request.top_n,
        )
        recommendations = [_to_recommended_product(p) for p in raw_products]
        return RecommendationResponse(
            product_id=request.product_id,
            recommendations=recommendations,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate recommendations: {exc}",
        ) from exc


@recommendation_router.get(
    "/similar",
    response_model=RecommendationResponse,
    summary="Get similar products by product ID (GET)",
)
def get_similar_products_get(
    product_id: str = Query(..., description="ID of the product"),
    top_n: int = Query(5, ge=1, le=20, description="Number of recommendations"),
) -> RecommendationResponse:
    try:
        raw_products = get_similar_products(
            product_id=product_id,
            top_k=top_n,
        )
        recommendations = [_to_recommended_product(p) for p in raw_products]
        return RecommendationResponse(
            product_id=product_id,
            recommendations=recommendations,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate recommendations: {exc}",
        ) from exc


@recommendation_router.get(
    "/similar/{product_id}",
    response_model=RecommendationResponse,
    summary="Get similar products by path parameter (GET)",
)
def get_similar_products_by_path(
    product_id: str,
    top_n: int = Query(5, ge=1, le=20, description="Number of recommendations"),
) -> RecommendationResponse:
    return get_similar_products_get(product_id=product_id, top_n=top_n)


@recommendation_router.post(
    "/for-user",
    response_model=UserRecommendationResponse,
    summary="Get personalized recommendations for a user (POST)",
)
def get_user_recommendations_post(
    request: UserRecommendationRequest,
) -> UserRecommendationResponse:
    try:
        raw_products = get_user_recommendations(
            user_id=request.user_id,
            viewed_product_ids=request.viewed_product_ids,
            top_k=request.top_n,
        )
        recommendations = [_to_recommended_product(p) for p in raw_products]
        return UserRecommendationResponse(recommendations=recommendations)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate user recommendations: {exc}",
        ) from exc


@recommendation_router.get(
    "/for-user",
    response_model=UserRecommendationResponse,
    summary="Get personalized recommendations for a user (GET)",
)
def get_user_recommendations_get(
    user_id: str | None = Query(None, description="Optional user ID"),
    top_n: int = Query(5, ge=1, le=20, description="Number of recommendations"),
) -> UserRecommendationResponse:
    try:
        raw_products = get_user_recommendations(
            user_id=user_id,
            viewed_product_ids=[],
            top_k=top_n,
        )
        recommendations = [_to_recommended_product(p) for p in raw_products]
        return UserRecommendationResponse(recommendations=recommendations)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate user recommendations: {exc}",
        ) from exc


@recommendation_router.post(
    "/rebuild-index",
    response_model=RebuildIndexResponse,
    summary="Rebuild the recommendation models and index",
)
def rebuild_index() -> RebuildIndexResponse:
    try:
        result = rebuild_recommendation_index()
        return RebuildIndexResponse(
            success=result.get("success", True),
            message=result.get("message", "Recommendation index rebuilt successfully."),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to rebuild recommendation index: {exc}",
        ) from exc
