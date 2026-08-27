import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.recommendation import recommendation_router
from routes.semantic_search import semantic_search_router
from routes.sentiment import sentiment_router
from routes.assistant import assistant_router

app = FastAPI(
    title="AI E-commerce",
    description="Recommendation, Semantic Search, Sentiment Analysis, and Assistant services for E-commerce",
    version="1.0.0",
)

# Comma-separated list of allowed origins, e.g.
#   ALLOWED_ORIGINS="http://localhost:5173,https://megahimalayan.com"
# Falls back to localhost dev origins if unset.
_default_origins = "http://localhost:3000,http://localhost:5173"
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendation_router)
app.include_router(semantic_search_router)
app.include_router(sentiment_router)
app.include_router(assistant_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "service": "ai-ecom-service",
        "endpoints": [
            "/recommendation/similar",
            "/recommendation/for-user",
            "/search",
            "/sentiment/analyze",
            "/sentiment/analyze-batch",
            "/assistant/chat",
        ],
    }