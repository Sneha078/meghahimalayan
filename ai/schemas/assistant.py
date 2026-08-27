# schemas/assistant.py
from pydantic import BaseModel, Field, model_validator


class AssistantRequest(BaseModel):
    query: str | None = Field(None, description="Customer's natural language request")
    message: str | None = Field(None, description="Alternative field for customer message")

    @model_validator(mode="after")
    def check_query_or_message(self):
        text = self.query or self.message
        if not text or not text.strip():
            raise ValueError("Either 'query' or 'message' must be provided and non-empty.")
        if not self.query and self.message:
            self.query = self.message
        return self


class AssistantProduct(BaseModel):
    id: str  # MongoDB ObjectId string (or "W005"-style product code) — never an int
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
    similarity_score: float | None = None


class AssistantResponse(BaseModel):
    response: str
    message: str | None = None
    intent: str | None = None
    products: list[AssistantProduct] = []
    recommended_products: list[AssistantProduct] = []
    constraints: dict = {}
    review_analysis: dict | None = None