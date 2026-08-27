"""
Test suite for all FastAPI route endpoints in ai/routes/.
"""

from unittest.mock import MagicMock, patch
import pandas as pd
import pytest

# Mock mongo/db calls before initializing RecommendationEngine / main
with patch("shared.product_service.get_products_dataframe", return_value=pd.DataFrame()), \
     patch("shared.product_service.get_all_reviews", return_value=[]):
    from fastapi.testclient import TestClient
    from main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "ai-ecom-service"
    assert "/assistant/chat" in data["endpoints"]


# ============================================================
# RECOMMENDATION ROUTES
# ============================================================

@patch("routes.recommendation.get_similar_products")
def test_recommendation_similar_post(mock_similar):
    mock_similar.return_value = [
        {
            "id": "p1",
            "name": "Classic Watch",
            "category": "watches",
            "price": 4500.0,
            "similarity_score": 0.88,
        }
    ]
    response = client.post("/recommendation/similar", json={"product_id": "p1", "top_n": 5})
    assert response.status_code == 200
    data = response.json()
    assert data["product_id"] == "p1"
    assert len(data["recommendations"]) == 1
    assert data["recommendations"][0]["name"] == "Classic Watch"
    assert data["recommendations"][0]["similarity_score"] == 0.88


@patch("routes.recommendation.get_similar_products")
def test_recommendation_similar_get(mock_similar):
    mock_similar.return_value = [
        {
            "id": "p2",
            "name": "Aviator Sunglasses",
            "category": "eyeglasses",
            "price": 2500.0,
            "score": 0.92,
        }
    ]
    response = client.get("/recommendation/similar?product_id=p2&top_n=3")
    assert response.status_code == 200
    data = response.json()
    assert data["product_id"] == "p2"
    assert len(data["recommendations"]) == 1
    assert data["recommendations"][0]["similarity_score"] == 0.92


@patch("routes.recommendation.get_user_recommendations")
def test_recommendation_for_user(mock_user_rec):
    mock_user_rec.return_value = [
        {
            "id": "p3",
            "name": "Dior Sauvage",
            "category": "perfumes",
            "price": 8000.0,
            "score": 0.95,
        }
    ]
    response = client.post(
        "/recommendation/for-user",
        json={"user_id": "u123", "viewed_product_ids": ["p1"], "top_n": 4},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["recommendations"]) == 1
    assert data["recommendations"][0]["name"] == "Dior Sauvage"


@patch("routes.recommendation.rebuild_recommendation_index")
def test_recommendation_rebuild_index(mock_rebuild):
    mock_rebuild.return_value = {"success": True, "message": "Rebuilt"}
    response = client.post("/recommendation/rebuild-index")
    assert response.status_code == 200
    assert response.json()["success"] is True


# ============================================================
# SEMANTIC SEARCH ROUTES
# ============================================================

@patch("routes.semantic_search.search_products")
def test_semantic_search_post(mock_search):
    mock_search.return_value = [
        {
            "id": "p1",
            "name": "Luxury Chronograph",
            "category": "watches",
            "price": 12000.0,
            "similarity_score": 0.89,
        }
    ]
    response = client.post("/search", json={"query": "luxury watch", "top_k": 5})
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "luxury watch"
    assert len(data["results"]) == 1
    assert data["results"][0]["name"] == "Luxury Chronograph"


@patch("routes.semantic_search.search_products")
def test_semantic_search_get(mock_search):
    mock_search.return_value = [
        {
            "id": "p2",
            "name": "Polarized Glasses",
            "category": "eyeglasses",
            "price": 3000.0,
            "similarity_score": 0.82,
        }
    ]
    response = client.get("/search?q=sunglasses&top_k=2")
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "sunglasses"
    assert len(data["results"]) == 1


# ============================================================
# SENTIMENT ROUTES
# ============================================================

def test_sentiment_analyze_post():
    response = client.post("/sentiment/analyze", json={"text": "This watch is awesome and great quality!"})
    assert response.status_code == 200
    data = response.json()
    assert data["sentiment"] == "positive"
    assert data["compound"] > 0


def test_sentiment_analyze_batch_post():
    response = client.post(
        "/sentiment/analyze-batch",
        json={"texts": ["Great item!", "Horrible and broken."]},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 2
    assert data["results"][0]["sentiment"] == "positive"
    assert data["results"][1]["sentiment"] == "negative"


@patch("routes.sentiment.analyze_product_reviews")
def test_sentiment_product_get(mock_reviews):
    mock_reviews.return_value = {
        "product_id": "p10",
        "total_reviews": 2,
        "positive": 2,
        "neutral": 0,
        "negative": 0,
        "positive_percentage": 100.0,
        "neutral_percentage": 0.0,
        "negative_percentage": 0.0,
        "reviews": [
            {
                "review_id": "r1",
                "user_name": "John",
                "rating": 5,
                "review_text": "Loved it!",
                "sentiment": "positive",
                "compound": 0.6,
                "pos": 0.5,
                "neu": 0.5,
                "neg": 0.0,
            }
        ],
    }
    response = client.get("/sentiment/product/p10")
    assert response.status_code == 200
    data = response.json()
    assert data["total_reviews"] == 2
    assert data["positive_percentage"] == 100.0


# ============================================================
# ASSISTANT ROUTES
# ============================================================

@patch("routes.assistant.assistant.chat")
def test_assistant_chat_post(mock_chat):
    mock_chat.return_value = {
        "message": "Here are some watches for you",
        "intent": "search",
        "products": [
            {
                "id": "w1",
                "name": "Seiko Automatic",
                "category": "watches",
                "price": 15000.0,
            }
        ],
    }
    response = client.post("/assistant/chat", json={"query": "show me seiko watches"})
    assert response.status_code == 200
    data = response.json()
    assert data["response"] == "Here are some watches for you"
    assert data["intent"] == "search"
    assert len(data["products"]) == 1
    assert data["products"][0]["name"] == "Seiko Automatic"


@patch("routes.assistant.assistant.chat")
def test_assistant_chat_get(mock_chat):
    mock_chat.return_value = {
        "message": "Found products",
        "intent": "filter",
        "products": [],
    }
    response = client.get("/assistant/chat?query=watches under 5000")
    assert response.status_code == 200
    data = response.json()
    assert data["response"] == "Found products"


def test_assistant_help():
    response = client.get("/assistant/help")
    assert response.status_code == 200
    data = response.json()
    assert "help_text" in data
    assert "example_queries" in data
