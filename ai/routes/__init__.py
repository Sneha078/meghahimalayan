from routes.assistant import assistant_router
from routes.recommendation import recommendation_router
from routes.semantic_search import semantic_search_router
from routes.sentiment import sentiment_router

__all__ = [
    "recommendation_router",
    "semantic_search_router",
    "sentiment_router",
    "assistant_router",
]
