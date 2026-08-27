# schemas/semantic_search.py
from pydantic import BaseModel, Field


class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language search query")
    top_k: int = Field(5, ge=1, le=20, description="Number of results to return")


class SearchResultProduct(BaseModel):
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


class SemanticSearchResponse(BaseModel):
    query: str
    results: list[SearchResultProduct]


class RebuildSearchIndexResponse(BaseModel):
    success: bool
    message: str