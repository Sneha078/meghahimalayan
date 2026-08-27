from fastapi import APIRouter, HTTPException, Query

from schemas.sentiment import (
    BatchSentimentRequest,
    BatchSentimentResponse,
    ProductSentimentResponse,
    ReviewSentimentItem,
    SentimentRequest,
    SentimentResponse,
)
from sentiment.engine import analyze_product_reviews, analyze_sentiment

sentiment_router = APIRouter(prefix="/sentiment", tags=["sentiment"])


@sentiment_router.post(
    "/analyze",
    response_model=SentimentResponse,
    summary="Analyze sentiment of a text (POST)",
)
def analyze_sentiment_post(request: SentimentRequest) -> SentimentResponse:
    try:
        result = analyze_sentiment(request.text)
        return SentimentResponse(
            sentiment=result["sentiment"],
            compound=float(result["compound"]),
            positive=float(result["positive"]),
            neutral=float(result["neutral"]),
            negative=float(result["negative"]),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Sentiment analysis failed: {exc}",
        ) from exc


@sentiment_router.get(
    "/analyze",
    response_model=SentimentResponse,
    summary="Analyze sentiment of a text (GET)",
)
def analyze_sentiment_get(
    text: str = Query(..., min_length=1, description="Text to analyze"),
) -> SentimentResponse:
    try:
        result = analyze_sentiment(text)
        return SentimentResponse(
            sentiment=result["sentiment"],
            compound=float(result["compound"]),
            positive=float(result["positive"]),
            neutral=float(result["neutral"]),
            negative=float(result["negative"]),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Sentiment analysis failed: {exc}",
        ) from exc


@sentiment_router.post(
    "/analyze-batch",
    response_model=BatchSentimentResponse,
    summary="Analyze sentiment for multiple texts in batch (POST)",
)
def analyze_batch_post(request: BatchSentimentRequest) -> BatchSentimentResponse:
    try:
        results = []
        for text in request.texts:
            res = analyze_sentiment(text)
            results.append(
                SentimentResponse(
                    sentiment=res["sentiment"],
                    compound=float(res["compound"]),
                    positive=float(res["positive"]),
                    neutral=float(res["neutral"]),
                    negative=float(res["negative"]),
                )
            )
        return BatchSentimentResponse(results=results)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Batch sentiment analysis failed: {exc}",
        ) from exc


@sentiment_router.get(
    "/product/{product_id}",
    response_model=ProductSentimentResponse,
    summary="Analyze all reviews for a product (GET)",
)
def analyze_product_reviews_get(product_id: str) -> ProductSentimentResponse:
    try:
        data = analyze_product_reviews(product_id)
        reviews = [
            ReviewSentimentItem(
                review_id=r.get("review_id"),
                user_name=r.get("user_name"),
                rating=r.get("rating"),
                review_text=r.get("review_text", ""),
                sentiment=r.get("sentiment", "neutral"),
                compound=float(r.get("compound", 0.0)),
                positive=float(r.get("positive", 0.0)),
                neutral=float(r.get("neutral", 0.0)),
                negative=float(r.get("negative", 0.0)),
            )
            for r in data.get("reviews", [])
        ]
        return ProductSentimentResponse(
            product_id=data.get("product_id", product_id),
            total_reviews=data.get("total_reviews", 0),
            positive=data.get("positive", 0),
            neutral=data.get("neutral", 0),
            negative=data.get("negative", 0),
            positive_percentage=float(data.get("positive_percentage", 0.0)),
            neutral_percentage=float(data.get("neutral_percentage", 0.0)),
            negative_percentage=float(data.get("negative_percentage", 0.0)),
            reviews=reviews,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Product review sentiment analysis failed: {exc}",
        ) from exc
