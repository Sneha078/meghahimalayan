from fastapi import APIRouter, HTTPException, Query

from schemas.semantic_search import (
    RebuildSearchIndexResponse,
    SearchResultProduct,
    SemanticSearchRequest,
    SemanticSearchResponse,
)
from semantic_search.engine import build_index, search_products

semantic_search_router = APIRouter(tags=["semantic_search"])


def _to_search_result_product(p: dict) -> SearchResultProduct:
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
    for key in ("similarity_score", "score"):
        if p.get(key) is not None:
            try:
                score = float(p[key])
                break
            except (ValueError, TypeError):
                pass

    return SearchResultProduct(
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


@semantic_search_router.post(
    "/search",
    response_model=SemanticSearchResponse,
    summary="Natural language semantic search (POST)",
)
def search_post(request: SemanticSearchRequest) -> SemanticSearchResponse:
    try:
        raw_products = search_products(
            query=request.query,
            top_k=request.top_k,
        )
        results = [_to_search_result_product(p) for p in raw_products]
        return SemanticSearchResponse(
            query=request.query,
            results=results,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Semantic search failed: {exc}",
        ) from exc


@semantic_search_router.get(
    "/search",
    response_model=SemanticSearchResponse,
    summary="Natural language semantic search (GET)",
)
def search_get(
    query: str | None = Query(None, description="Natural language search query"),
    q: str | None = Query(None, description="Alternative short query parameter"),
    top_k: int = Query(5, ge=1, le=20, description="Number of results to return"),
) -> SemanticSearchResponse:
    search_query = query or q
    if not search_query or not search_query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query parameter 'query' or 'q' is required and cannot be empty.",
        )

    try:
        raw_products = search_products(
            query=search_query,
            top_k=top_k,
        )
        results = [_to_search_result_product(p) for p in raw_products]
        return SemanticSearchResponse(
            query=search_query,
            results=results,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Semantic search failed: {exc}",
        ) from exc


@semantic_search_router.post(
    "/search/rebuild-index",
    response_model=RebuildSearchIndexResponse,
    summary="Rebuild FAISS vector index for semantic search",
)
def rebuild_search_index() -> RebuildSearchIndexResponse:
    try:
        build_index()
        return RebuildSearchIndexResponse(
            success=True,
            message="Semantic search FAISS index rebuilt successfully.",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to rebuild search index: {exc}",
        ) from exc
