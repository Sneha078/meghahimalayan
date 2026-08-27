"""
Tests for the recommendation engine / service layer.

These tests mock `shared.product_service` so they run without a live
MongoDB connection. They patch the names as imported into
`recommendation.engine` (i.e. `recommendation.engine.get_products_dataframe`
and `recommendation.engine.get_all_reviews`), then construct a fresh
RecommendationEngine() per test so each test gets an isolated index
instead of sharing the module-level singleton.
"""

import pandas as pd
import pytest

import recommendation.engine as engine_module
from recommendation.engine import RecommendationEngine
from recommendation import service


# ============================================================
# FIXTURES
# ============================================================

def make_products_df():
    return pd.DataFrame([
        {
            "product_id": "p1",
            "name": "Ray-Ban Matte Black Polarized",
            "category": "eyeglasses",
            "subcategory": "Sunglasses",
            "brand": "Ray-Ban",
            "gender": "Men",
            "description": "Matte black frame with polarized lenses.",
            "price": 1950,
            "rating": 4.9,
            "image_url": "http://example.com/p1.jpg",
            "tags": "",
            "occasion": "",
            "season": "",
            "attr_str": "",
        },
        {
            "product_id": "p2",
            "name": "Ray-Ban Style Square Sunglasses",
            "category": "eyeglasses",
            "subcategory": "Sunglasses",
            "brand": "Ray-Ban",
            "gender": "Unisex",
            "description": "Classic Ray-Ban square frame for everyday wear.",
            "price": 1750,
            "rating": 4.8,
            "image_url": "http://example.com/p2.jpg",
            "tags": "",
            "occasion": "",
            "season": "",
            "attr_str": "",
        },
        {
            "product_id": "p3",
            "name": "Dior Sauvage Elixir",
            "category": "perfumes",
            "subcategory": "Eau de Parfum",
            "brand": "Dior",
            "gender": "Men",
            "description": "Spicy lavender, cardamom, and sandalwood.",
            "price": 18500,
            "rating": 4.9,
            "image_url": "http://example.com/p3.jpg",
            "tags": "",
            "occasion": "",
            "season": "",
            "attr_str": "",
        },
    ])


def make_reviews():
    return [
        {"user_id": "u1", "product_id": "p1", "rating": 5},
        {"user_id": "u1", "product_id": "p2", "rating": 4},
        {"user_id": "u2", "product_id": "p1", "rating": 4},
        {"user_id": "u2", "product_id": "p3", "rating": 5},
    ]


@pytest.fixture
def engine(monkeypatch):
    """A RecommendationEngine built from fixed, known test data."""
    monkeypatch.setattr(engine_module, "get_products_dataframe", make_products_df)
    monkeypatch.setattr(engine_module, "get_all_reviews", make_reviews)
    return RecommendationEngine()


@pytest.fixture
def empty_engine(monkeypatch):
    """A RecommendationEngine built with no products and no reviews."""
    monkeypatch.setattr(engine_module, "get_products_dataframe", lambda: pd.DataFrame())
    monkeypatch.setattr(engine_module, "get_all_reviews", lambda: [])
    return RecommendationEngine()


# ============================================================
# CONTENT-BASED MODEL
# ============================================================

class TestContentModel:

    def test_builds_tfidf_and_similarity_matrix(self, engine):
        assert engine.tfidf_matrix is not None
        assert engine.content_similarity is not None
        assert engine.content_similarity.shape == (3, 3)

    def test_id_to_index_covers_all_products(self, engine):
        assert set(engine.id_to_index.keys()) == {"p1", "p2", "p3"}

    def test_similar_ray_bans_rank_above_unrelated_perfume(self, engine):
        # p1 and p2 are both Ray-Ban sunglasses; p3 is an unrelated perfume.
        # p2 should be more content-similar to p1 than p3 is.
        idx1 = engine.id_to_index["p1"]
        idx2 = engine.id_to_index["p2"]
        idx3 = engine.id_to_index["p3"]

        sim_p1_p2 = engine.content_similarity[idx1][idx2]
        sim_p1_p3 = engine.content_similarity[idx1][idx3]

        assert sim_p1_p2 > sim_p1_p3

    def test_get_content_similar_products_excludes_self(self, engine):
        results = engine.get_content_similar_products("p1", top_k=5)
        returned_ids = [r["id"] for r in results]
        assert "p1" not in returned_ids

    def test_get_content_similar_products_unknown_id_returns_empty(self, engine):
        assert engine.get_content_similar_products("does-not-exist") == []


# ============================================================
# COLLABORATIVE MODEL
# ============================================================

class TestCollaborativeModel:

    def test_builds_user_item_matrix(self, engine):
        assert not engine.user_item_matrix.empty
        assert set(engine.user_item_matrix.index) == {"u1", "u2"}

    def test_collaborative_scores_symmetric(self, engine):
        scores_from_p1 = engine.get_collaborative_scores("p1")
        scores_from_p2 = engine.get_collaborative_scores("p2")
        assert scores_from_p1["p2"] == pytest.approx(scores_from_p2["p1"])

    def test_collaborative_scores_unknown_product_returns_empty(self, engine):
        assert engine.get_collaborative_scores("does-not-exist") == {}

    def test_no_reviews_disables_collaborative_model(self, monkeypatch):
        monkeypatch.setattr(engine_module, "get_products_dataframe", make_products_df)
        monkeypatch.setattr(engine_module, "get_all_reviews", lambda: [])
        eng = RecommendationEngine()

        assert eng.collaborative_similarity is None
        assert eng.get_collaborative_scores("p1") == {}


# ============================================================
# HYBRID SIMILAR PRODUCTS
# ============================================================

class TestHybridSimilarProducts:

    def test_returns_results_sorted_by_score_desc(self, engine):
        results = engine.get_similar_products("p1", top_k=5)
        scores = [r["score"] for r in results]
        assert scores == sorted(scores, reverse=True)

    def test_excludes_queried_product(self, engine):
        results = engine.get_similar_products("p1", top_k=5)
        returned_ids = [r["id"] for r in results]
        assert "p1" not in returned_ids

    def test_respects_top_k(self, engine):
        results = engine.get_similar_products("p1", top_k=1)
        assert len(results) == 1

    def test_unknown_product_id_returns_empty(self, engine):
        assert engine.get_similar_products("does-not-exist") == []

    def test_result_shape_has_expected_fields(self, engine):
        results = engine.get_similar_products("p1", top_k=5)
        assert results, "expected at least one recommendation"
        expected_fields = {
            "id", "product_id", "content_score", "collaborative_score",
            "score", "recommendation_type", "name", "category",
            "subcategory", "brand", "price", "rating", "image", "description",
        }
        assert expected_fields.issubset(results[0].keys())

    def test_hybrid_score_is_weighted_combination(self, engine):
        results = engine.get_similar_products("p1", top_k=5)
        for r in results:
            expected = round(0.60 * r["content_score"] + 0.40 * r["collaborative_score"], 4)
            assert r["score"] == pytest.approx(expected, abs=1e-3)


# ============================================================
# PERSONALIZED RECOMMENDATIONS
# ============================================================

class TestPersonalizedRecommendations:

    def test_known_user_gets_recommendations_excluding_own_rated_items(self, engine):
        # u1 rated p1 and p2 — recommendations for u1 should favor p3,
        # and should not just be p1/p2 fed back to them by the collaborative
        # pass (the content pass has no viewed_product_ids to exclude
        # collaborative-sourced items, so we only assert p3 shows up).
        results = engine.get_recommendations_for_user(user_id="u1", top_k=5)
        returned_ids = [r["id"] for r in results]
        assert "p3" in returned_ids

    def test_viewed_products_excluded_from_content_recommendations(self, engine):
        results = engine.get_recommendations_for_user(
            viewed_product_ids=["p1"], top_k=5
        )
        returned_ids = [r["id"] for r in results]
        assert "p1" not in returned_ids

    def test_unknown_user_falls_back_to_content_or_popular(self, engine):
        results = engine.get_recommendations_for_user(
            user_id="unknown-user", viewed_product_ids=["p1"], top_k=5
        )
        assert results  # should not error out, should return something

    def test_no_user_no_viewed_returns_popular(self, engine):
        results = engine.get_recommendations_for_user(top_k=5)
        assert results
        assert all(r["recommendation_type"] == "popular" for r in results)

    def test_popular_fallback_sorted_by_rating_desc(self, engine):
        results = engine.get_recommendations_for_user(top_k=5)
        scores = [r["score"] for r in results]
        assert scores == sorted(scores, reverse=True)

    @pytest.mark.xfail(
        reason=(
            "Known bug: collaborative_score in get_recommendations_for_user is "
            "sum(similarity * rating) across all of a user's rated items, so it "
            "is NOT bounded to [0, 1] like it is in get_similar_products. This "
            "pushes the hybrid 'score' above 1 for users with several ratings, "
            "inconsistent with every other endpoint's score range."
        ),
        strict=False,
    )
    def test_hybrid_score_for_user_recommendations_stays_bounded(self, engine):
        results = engine.get_recommendations_for_user(user_id="u1", top_k=5)
        for r in results:
            assert 0.0 <= r["score"] <= 1.0

    @pytest.mark.xfail(
        reason=(
            "Known bug: the popular-products cold-start fallback does not "
            "filter out viewed_product_ids, so a user can be recommended "
            "something they already viewed if no content/collaborative "
            "signal was found for their viewed items."
        ),
        strict=False,
    )
    def test_popular_fallback_excludes_viewed_products(self, engine):
        # If a user has viewed every product in the (small) catalog, both
        # content_scores and collaborative_scores end up empty -- there's
        # nothing left to score that isn't already excluded -- so the code
        # falls back to _popular_products(). That fallback ranks by rating
        # alone and does NOT filter out viewed_product_ids, so it currently
        # recommends products the user has already viewed.
        results = engine.get_recommendations_for_user(
            viewed_product_ids=["p1", "p2", "p3"], top_k=5
        )
        returned_ids = [r["id"] for r in results]
        assert not set(returned_ids) & {"p1", "p2", "p3"}


# ============================================================
# EMPTY DATABASE / EDGE CASES
# ============================================================

class TestEmptyDatabase:

    def test_empty_products_produces_no_similarity_matrix(self, empty_engine):
        assert empty_engine.content_similarity is None
        assert empty_engine.tfidf_matrix is None

    def test_get_similar_products_returns_empty_list(self, empty_engine):
        assert empty_engine.get_similar_products("anything") == []

    def test_get_recommendations_for_user_returns_empty_list(self, empty_engine):
        # No products at all means even the popular-products cold-start
        # fallback has nothing to return.
        assert empty_engine.get_recommendations_for_user(top_k=5) == []


# ============================================================
# SERVICE LAYER
# ============================================================

class TestServiceLayer:

    def test_rebuild_recommendation_index_uses_patched_data(self, monkeypatch):
        monkeypatch.setattr(engine_module, "get_products_dataframe", make_products_df)
        monkeypatch.setattr(engine_module, "get_all_reviews", make_reviews)

        result = service.rebuild_recommendation_index()

        assert result == {
            "success": True,
            "message": "Recommendation index rebuilt successfully.",
        }
        # the shared singleton should now reflect the patched data
        assert "p1" in service.recommendation_engine.id_to_index

    def test_get_similar_products_delegates_to_engine(self, monkeypatch):
        monkeypatch.setattr(engine_module, "get_products_dataframe", make_products_df)
        monkeypatch.setattr(engine_module, "get_all_reviews", make_reviews)
        service.rebuild_recommendation_index()

        results = service.get_similar_products("p1", top_k=2)
        assert len(results) <= 2
        assert all(r["id"] != "p1" for r in results)

    def test_get_user_recommendations_delegates_to_engine(self, monkeypatch):
        monkeypatch.setattr(engine_module, "get_products_dataframe", make_products_df)
        monkeypatch.setattr(engine_module, "get_all_reviews", make_reviews)
        service.rebuild_recommendation_index()

        results = service.get_user_recommendations(user_id="u1", top_k=2)
        assert len(results) <= 2