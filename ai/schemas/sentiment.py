# schemas/sentiment.py
from pydantic import BaseModel, Field


class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Review or text to analyze")


class SentimentResponse(BaseModel):
    sentiment: str
    compound: float
    positive: float
    neutral: float
    negative: float


class BatchSentimentRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, description="List of texts to analyze")


class BatchSentimentResponse(BaseModel):
    results: list[SentimentResponse]


class ReviewSentimentItem(BaseModel):
    review_id: str | None = None
    user_name: str | None = None
    rating: float | int | None = None
    review_text: str
    sentiment: str
    compound: float
    positive: float
    neutral: float
    negative: float


class ProductSentimentResponse(BaseModel):
    product_id: str
    total_reviews: int
    positive: int
    neutral: int
    negative: int
    positive_percentage: float = 0.0
    neutral_percentage: float = 0.0
    negative_percentage: float = 0.0
    reviews: list[ReviewSentimentItem] = []