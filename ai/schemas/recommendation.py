# schemas/recommendation.py
from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    product_id: str = Field(..., description="ID of the product to find similar items for")
    top_n: int = Field(5, ge=1, le=20, description="Number of recommendations to return")


class RecommendedProduct(BaseModel):
    id: str  # MongoDB ObjectId string — never an int
    name: str
    category: str
    brand: str | None = None
    description: str | None = None
    price: float
    gender: str | None = None
    tags: list[str] = []
    occasion: list[str] = []
    season: list[str] = []
    rating: float | None = None
    image_url: str | None = None
    similarity_score: float = 0.0


class RecommendationResponse(BaseModel):
    product_id: str
    recommendations: list[RecommendedProduct]


class UserRecommendationRequest(BaseModel):
    user_id: str | None = Field(None, description="Optional user ID to base collaborative recommendations on")
    viewed_product_ids: list[str] = Field(default_factory=list, description="List of previously viewed product IDs")
    top_n: int = Field(5, ge=1, le=20, description="Number of recommendations to return")


class UserRecommendationResponse(BaseModel):
    recommendations: list[RecommendedProduct]


class RebuildIndexResponse(BaseModel):
    success: bool
    message: str