from fastapi import APIRouter, HTTPException, Query

from assistant.engine import assistant
from assistant.response import format_help
from schemas.assistant import AssistantProduct, AssistantRequest, AssistantResponse

assistant_router = APIRouter(prefix="/assistant", tags=["assistant"])


def _to_assistant_product(p: dict) -> AssistantProduct:
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

    score = None
    for key in ("similarity_score", "score"):
        if p.get(key) is not None:
            try:
                score = round(float(p[key]), 4)
                break
            except (ValueError, TypeError):
                pass

    return AssistantProduct(
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
        similarity_score=score,
    )


@assistant_router.post(
    "/chat",
    response_model=AssistantResponse,
    summary="Chat with AI shopping assistant (POST)",
)
def chat_post(request: AssistantRequest) -> AssistantResponse:
    prompt = (request.query or request.message or "").strip()
    if not prompt:
        raise HTTPException(
            status_code=400,
            detail="Prompt text ('query' or 'message') cannot be empty.",
        )

    try:
        result = assistant.chat(prompt)
        text_response = result.get("message") or result.get("response") or ""
        products = [_to_assistant_product(p) for p in result.get("products", [])]
        recommended_products = [
            _to_assistant_product(p) for p in result.get("recommended_products", [])
        ]
        constraints = result.get("constraints") or {}
        review_analysis = result.get("review_analysis")

        return AssistantResponse(
            response=text_response,
            message=text_response,
            intent=result.get("intent"),
            products=products,
            recommended_products=recommended_products,
            constraints=constraints,
            review_analysis=review_analysis,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Assistant chat processing failed: {exc}",
        ) from exc


@assistant_router.get(
    "/chat",
    response_model=AssistantResponse,
    summary="Chat with AI shopping assistant (GET)",
)
def chat_get(
    query: str | None = Query(None, description="Customer request query"),
    message: str | None = Query(None, description="Alternative query message"),
    q: str | None = Query(None, description="Short query parameter"),
) -> AssistantResponse:
    prompt = (query or message or q or "").strip()
    if not prompt:
        raise HTTPException(
            status_code=400,
            detail="Query parameter 'query', 'message', or 'q' is required and cannot be empty.",
        )

    req = AssistantRequest(query=prompt)
    return chat_post(req)


@assistant_router.get(
    "/help",
    summary="Get shopping assistant capabilities and usage guide",
)
def help_get():
    return {
        "help_text": format_help(),
        "example_queries": [
            "Show me watches under 5000",
            "Find fresh summer perfume",
            "Similar to W005",
            "Reviews for Ray-Ban sunglasses",
            "Recommend sunglasses for oval face",
            "What can you do?",
        ],
    }
