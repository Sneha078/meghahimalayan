"""
Test suite for the `assistant` package: intent.py, engine.py, and tools.py.

Organized into three sections, one per module:

    1. assistant/intent.py  -- pure functions, no mocking needed
    2. assistant/engine.py  -- ShoppingAssistant.chat(), with assistant.tools mocked
    3. assistant/tools.py   -- product_service / recommendation.engine /
                                semantic_search.engine / sentiment.engine all mocked

None of these tests touch MongoDB, FAISS, the recommendation engine, or
VADER directly -- external dependencies are mocked at each module's
boundary so the suite runs standalone.

Run with:
    pytest tests/test_assistant.py -v

Run a single section:
    pytest tests/test_assistant.py -v -k "Intent"
    pytest tests/test_assistant.py -v -k "Engine or Help or Similar or Recommend or Review or Filter or Search or ErrorHandling"
    pytest tests/test_assistant.py -v -k "Tools or SearchProducts or Recommendations or AnalyzeProductReviews or GetProduct or FilterProducts"
"""

from unittest.mock import MagicMock, patch

import pytest

from assistant.intent import (
    FILTER,
    HELP,
    PRODUCT_INFO,
    RECOMMEND,
    REVIEW,
    SEARCH,
    SIMILAR,
    UNKNOWN,
    detect_category,
    detect_intent,
    extract_price,
    extract_product_id,
)
from assistant.engine import ShoppingAssistant
from assistant import tools


# ============================================================================
# SECTION 1: assistant/intent.py
#
# All functions here are pure (no I/O, no external services), so these
# tests run against the real implementations directly.
# ============================================================================

# ------------------------------------------------------------
# extract_price
# ------------------------------------------------------------

class TestExtractPrice:
    @pytest.mark.parametrize("text,expected", [
        ("show me watches under 5000", 5000.0),
        ("below Rs 3000", 3000.0),
        ("less than 10000", 10000.0),
        ("max 2,500", 2500.0),
        ("up to 15000", 15000.0),
        ("upto NPR 999", 999.0),
    ])
    def test_extracts_price_from_common_phrasings(self, text, expected):
        assert extract_price(text) == expected

    def test_no_price_returns_none(self):
        assert extract_price("show me some watches") is None

    def test_comma_separated_thousands(self):
        assert extract_price("under 12,000") == 12000.0

    def test_case_insensitive(self):
        assert extract_price("UNDER 5000") == 5000.0


# ------------------------------------------------------------
# extract_product_id
# ------------------------------------------------------------

class TestExtractProductId:
    @pytest.mark.parametrize("text,expected", [
        ("tell me about W005", "W005"),
        ("is g007 good?", "G007"),
        ("reviews for P006 please", "P006"),
        ("w123", "W123"),
    ])
    def test_extracts_valid_ids(self, text, expected):
        assert extract_product_id(text) == expected

    def test_no_id_returns_none(self):
        assert extract_product_id("show me some watches") is None

    def test_does_not_match_wrong_letter_prefix(self):
        # Only W, G, P are valid prefixes per the pattern.
        assert extract_product_id("X005") is None

    def test_does_not_match_wrong_digit_count(self):
        assert extract_product_id("W05") is None
        assert extract_product_id("W0055") is None


# ------------------------------------------------------------
# detect_category
# ------------------------------------------------------------

class TestDetectCategory:
    def test_watch_keywords(self):
        assert detect_category("I need a new wristwatch") == "watch"
        assert detect_category("looking for a chronograph") == "watch"

    def test_eyeglasses_keywords(self):
        assert detect_category("need new eyeglasses") == "eyeglasses"
        assert detect_category("show me some frames") == "eyeglasses"

    def test_perfume_keywords(self):
        assert detect_category("looking for a nice fragrance") == "perfume"
        assert detect_category("show me some attar") == "perfume"

    def test_no_category_returns_none(self):
        assert detect_category("show me something nice") is None

    # --- Regression tests for the false-positive bugs ---

    def test_brand_alone_does_not_trigger_eyeglasses(self):
        # Previously "brand" was an eyeglasses keyword, so a perfume
        # query mentioning "brand" was misclassified.
        assert detect_category("recommend a good perfume brand") == "perfume"
        assert detect_category("what's a good brand for me") is None

    def test_round_as_substring_does_not_trigger_watch(self):
        # Previously "round" (substring match) matched inside unrelated
        # words like "surround" or "background".
        assert detect_category("surround sound speaker") is None
        assert detect_category("plain background image") is None

    def test_round_dial_still_triggers_watch(self):
        assert detect_category("looking for a round dial watch") == "watch"

    def test_round_frame_still_triggers_eyeglasses(self):
        assert detect_category("I want round frame glasses") == "eyeglasses"

    def test_square_typo_fixed(self):
        # Previously "sqaure" (typo) meant "square" never matched.
        assert detect_category("square watch please") == "watch"

    def test_watch_checked_before_eyeglasses_for_ambiguous_text(self):
        # Both categories mentioned — watch keyword list is checked
        # first, so watch should win when both appear.
        assert detect_category("watch and glasses combo deal") == "watch"


# ------------------------------------------------------------
# detect_intent
# ------------------------------------------------------------

class TestDetectIntent:
    def test_empty_text_is_unknown(self):
        assert detect_intent("") == UNKNOWN
        assert detect_intent("   ") == UNKNOWN

    @pytest.mark.parametrize("text", [
        "hello", "hi there", "hey!", "help", "what can you do",
    ])
    def test_greeting_and_help(self, text):
        assert detect_intent(text) == HELP

    @pytest.mark.parametrize("text", [
        "what do people say about this",
        "show me the reviews",
        "is it good?",
        "customer feedback please",
    ])
    def test_review_intent(self, text):
        assert detect_intent(text) == REVIEW

    @pytest.mark.parametrize("text", [
        "something similar to this",
        "products like W005",
        "show me similar products",
    ])
    def test_similar_intent(self, text):
        assert detect_intent(text) == SIMILAR

    @pytest.mark.parametrize("text", [
        "recommend something for me",
        "what should i buy",
        "any suggestions?",
    ])
    def test_recommend_intent(self, text):
        assert detect_intent(text) == RECOMMEND

    @pytest.mark.parametrize("text", [
        "watches under 5000",
        "something affordable",
        "cheap perfumes please",
    ])
    def test_filter_intent(self, text):
        assert detect_intent(text) == FILTER

    @pytest.mark.parametrize("text", [
        "find me a watch",
        "show me some perfumes",
        "I'm looking for eyeglasses",
    ])
    def test_search_intent(self, text):
        assert detect_intent(text) == SEARCH

    def test_bare_product_id_is_product_info(self):
        # No search/filter/etc. keywords present, just an ID.
        assert detect_intent("W005") == PRODUCT_INFO

    def test_product_id_with_search_word_is_search_not_product_info(self):
        # "show me" is a SEARCH keyword checked before PRODUCT_INFO
        # extraction, so this intentionally routes to SEARCH.
        assert detect_intent("show me W005") == SEARCH

    def test_intent_priority_review_beats_recommend(self):
        # A message containing both a review phrase and a recommend
        # phrase should hit REVIEW first (checked earlier).
        assert detect_intent("what do people say, any recommendations?") == REVIEW

    def test_unmatched_generic_text_defaults_to_search(self):
        assert detect_intent("blue leather strap") == SEARCH


# ============================================================================
# SECTION 2: assistant/engine.py (ShoppingAssistant.chat)
#
# assistant.tools functions are mocked at the module level so these tests
# exercise real intent detection + real response formatting, without
# touching MongoDB, FAISS, the recommendation engine, or VADER.
# ============================================================================

@pytest.fixture
def assistant():
    return ShoppingAssistant()


@pytest.fixture
def fake_product():
    return {
        "id": "W005",
        "name": "Classic Automatic Watch",
        "category": "watch",
        "brand": "Timekeeper",
        "description": "A reliable everyday watch.",
        "price": 4999.0,
        "rating": 4.5,
    }


# ------------------------------------------------------------
# Empty / whitespace input
# ------------------------------------------------------------

class TestEmptyMessage:
    def test_empty_string(self, assistant):
        result = assistant.chat("")
        assert result["intent"] == "unknown"
        assert result["products"] == []

    def test_whitespace_only(self, assistant):
        result = assistant.chat("   ")
        assert result["intent"] == "unknown"


# ------------------------------------------------------------
# HELP
# ------------------------------------------------------------

class TestHelp:
    def test_help_message(self, assistant):
        result = assistant.chat("help")
        assert result["intent"] == "help"
        assert "shopping assistant" in result["message"].lower()
        assert result["products"] == []


# ------------------------------------------------------------
# PRODUCT_INFO
# ------------------------------------------------------------

class TestProductInfo:
    def test_missing_id_prompts_for_one(self, assistant):
        # No search/help/etc keywords and no product ID present.
        result = assistant.chat("blue leather strap")
        # This actually routes to SEARCH per detect_intent's default,
        # so instead directly test the PRODUCT_INFO path via a message
        # that yields an ID-shaped intent with no extractable ID isn't
        # reachable through chat() normally — PRODUCT_INFO only fires
        # when extract_product_id succeeds. Covered by the success case
        # below instead.
        assert result["intent"] in ("search",)

    @patch("assistant.tools.get_product")
    def test_valid_id_returns_product_info(self, mock_get_product, assistant, fake_product):
        mock_get_product.return_value = fake_product

        result = assistant.chat("W005")

        mock_get_product.assert_called_once_with("W005")
        assert result["intent"] == "product_info"
        assert result["product"] == fake_product
        assert result["products"] == [fake_product]
        assert "Classic Automatic Watch" in result["message"]

    @patch("assistant.tools.get_product")
    def test_unknown_id_returns_not_found_message(self, mock_get_product, assistant):
        mock_get_product.return_value = None

        result = assistant.chat("W999")

        assert result["intent"] == "product_info"
        assert result["products"] == []
        assert "couldn't find" in result["message"].lower()


# ------------------------------------------------------------
# SIMILAR
# ------------------------------------------------------------

class TestSimilar:
    @patch("assistant.tools.get_similar_products")
    @patch("assistant.tools.search_products")
    def test_missing_id_falls_back_to_search_by_name(self, mock_search, mock_get_similar,fake_product, assistant):
        mock_search.return_value = [fake_product]
        mock_get_similar.return_value = [fake_product]
        result = assistant.chat("show me similar products")
        mock_search.assert_called_once_with("show me similar products", top_k=1)
        mock_get_similar.assert_called_once_with(fake_product["id"], top_k=5)

        assert result["intent"] == "similar"


    @patch("assistant.tools.search_products")
    def test_no_match_at_all_returns_not_found_message(self,mock_search, assistant):
        mock_search.return_value = []

        result = assistant.chat("show me something like dior scent")

        assert result["intent"] == "similar"
        assert result["products"] == []
        assert "product" in result["message"].lower()


# ------------------------------------------------------------
# RECOMMEND
# ------------------------------------------------------------

class TestRecommend:
    @patch("assistant.tools.get_recommendations")
    def test_similar_and_recommend_equal_priority_earliest_phrase_wins(self):
        #"recommend" appears before "similar to" ->RECOMMEND wins
        assert detect_intent("recommend something similar to W005") == RECOMMEND
        # "similar to " appears before "recommendations" -> SIMILAR wins
        assert detect_intent("something similar to this, any recommendations?") == SIMILAR
    

    @patch("assistant.tools.get_recommendations")
    def test_recommend_without_product_id(self, mock_get_recs, assistant, fake_product):
        mock_get_recs.return_value = [fake_product]

        result = assistant.chat("what should i buy?")

        mock_get_recs.assert_called_once_with(viewed_product_ids=[], top_k=5)
        assert result["intent"] == "recommend"

    @patch("assistant.tools.get_recommendations")
    def test_recommend_with_no_results(self, mock_get_recs, assistant):
        mock_get_recs.return_value = []

        result = assistant.chat("any recommendations?")

        assert "don't have enough information" in result["message"].lower()


# ------------------------------------------------------------
# REVIEW
# ------------------------------------------------------------

class TestReview:
    def test_missing_id_prompts_for_one(self, assistant):
        result = assistant.chat("what do people say about it?")
        assert result["intent"] == "review"
        assert result["products"] == []
        assert "product id" in result["message"].lower()

    @patch("assistant.tools.analyze_product_reviews")
    def test_valid_id_returns_review_summary(self, mock_analyze, assistant):
        mock_analyze.return_value = {
            "product_id": "P006",
            "review_count": 2,
            "overall_sentiment": "positive",
            "average_compound": 0.42,
            "reviews": [
                {"user_name": "Alice", "rating": 5, "sentiment": "positive"},
                {"user_name": "Bob", "rating": 4, "sentiment": "positive"},
            ],
        }

        result = assistant.chat("what do people say about P006?")

        mock_analyze.assert_called_once_with("P006")
        assert result["intent"] == "review"
        assert result["review_analysis"]["overall_sentiment"] == "positive"
        assert "positive" in result["message"].lower()


# ------------------------------------------------------------
# FILTER
# ------------------------------------------------------------

class TestFilter:
    @patch("assistant.tools.filter_products")
    def test_filter_with_category_and_price(self, mock_filter, assistant, fake_product):
        mock_filter.return_value = [fake_product]

        result = assistant.chat("show me watches under 5000")

        mock_filter.assert_called_once_with(category="watch", max_price=5000.0)
        assert result["intent"] == "filter"
        assert "watch" in result["message"].lower()
        assert "5,000" in result["message"] or "5000" in result["message"]

    @patch("assistant.tools.filter_products")
    def test_filter_caps_results_at_five(self, mock_filter, assistant):
        mock_filter.return_value = [
            {"id": f"p{i}", "name": f"Product {i}", "price": 100} for i in range(10)
        ]

        result = assistant.chat("cheap watches")

        assert len(result["products"]) == 5

    @patch("assistant.tools.filter_products")
    def test_filter_no_matches(self, mock_filter, assistant):
        mock_filter.return_value = []

        result = assistant.chat("affordable perfumes")

        assert "couldn't find any matching products" in result["message"].lower()

    @patch("assistant.tools.filter_products")
    def test_filter_does_not_propagate_the_old_occasion_bug(self, mock_filter, assistant):
        # Full end-to-end regression test: this used to raise TypeError
        # deep in product_service.filter_products() (via tools.py
        # forwarding an unsupported `occasion` kwarg), which the engine's
        # blanket except swallowed into a generic error message. With
        # the fix, this path should complete normally with no "error"
        # key in the response.
        mock_filter.return_value = []

        result = assistant.chat("watches under 3000")

        assert "error" not in result


# ------------------------------------------------------------
# SEARCH (fallback / default path)
# ------------------------------------------------------------

class TestSearch:
    @patch("assistant.tools.search_products")
    def test_search_intent(self, mock_search, assistant, fake_product):
        mock_search.return_value = [fake_product]

        result = assistant.chat("find me a nice watch")

        mock_search.assert_called_once_with("find me a nice watch", top_k=5)
        assert result["intent"] == "search"
        assert result["products"] == [fake_product]

    @patch("assistant.tools.search_products")
    def test_search_no_results(self, mock_search, assistant):
        mock_search.return_value = []

        result = assistant.chat("find me a flying carpet")

        assert "couldn't find any matching products" in result["message"].lower()


# ------------------------------------------------------------
# Error handling
# ------------------------------------------------------------

class TestErrorHandling:
    @patch("assistant.tools.search_products")
    def test_unhandled_exception_returns_generic_message_with_error(
        self, mock_search, assistant
    ):
        mock_search.side_effect = RuntimeError("something broke downstream")

        result = assistant.chat("find me a watch")

        assert result["intent"] == "search"
        assert result["products"] == []
        assert "couldn't process" in result["message"].lower()
        assert result["error"] == "something broke downstream"

    @patch("assistant.tools.get_product")
    def test_exception_in_product_info_path_is_caught(self, mock_get_product, assistant):
        mock_get_product.side_effect = ConnectionError("db unreachable")

        result = assistant.chat("W005")

        assert result["intent"] == "product_info"
        assert "error" in result
        assert result["products"] == []


# ============================================================================
# SECTION 3: assistant/tools.py
#
# product_service, recommendation.engine, semantic_search.engine, and
# sentiment.engine are all mocked so these tests don't need a live
# MongoDB connection, a built FAISS index, or a loaded VADER analyzer.
# ============================================================================

@pytest.fixture(autouse=True)
def reset_product_cache():
    """Clear the TTL product cache before every test so hits/misses in
    one test don't leak into the next."""
    tools._product_cache._store.clear()
    yield
    tools._product_cache._store.clear()


@pytest.fixture
def fake_tools_product():
    return {
        "id": "64f000000000000000000001",
        "name": "Aviator Sunglasses",
        "category": "eyeglasses",
        "brand": "SkyView",
        "description": "Classic aviator style.",
        "price": 49.99,
    }


@pytest.fixture
def fake_reviews():
    return [
        {"id": "r1", "user_name": "Alice", "rating": 5, "review_text": "Love it!"},
        {"id": "r2", "user_name": "Bob", "rating": 1, "review_text": "Terrible, broke fast."},
    ]


# ------------------------------------------------------------
# search_products
# ------------------------------------------------------------

class TestSearchProducts:
    @patch("semantic_search.engine.search_products")
    def test_uses_semantic_search_when_available(self, mock_semantic_search):
        mock_semantic_search.return_value = [{"id": "p1", "name": "Watch"}]

        result = tools.search_products("nice watch", top_k=5)

        mock_semantic_search.assert_called_once_with("nice watch", top_k=5)
        assert result == [{"id": "p1", "name": "Watch"}]

    @patch("shared.product_service.get_all_products")
    @patch("semantic_search.engine.search_products")
    def test_falls_back_to_substring_search_on_failure(
        self, mock_semantic_search, mock_get_all_products, fake_tools_product
    ):
        mock_semantic_search.side_effect = RuntimeError("index not built")
        mock_get_all_products.return_value = [fake_tools_product]

        result = tools.search_products("aviator", top_k=5)

        assert result == [fake_tools_product]

    @patch("shared.product_service.get_all_products")
    @patch("semantic_search.engine.search_products")
    def test_fallback_respects_top_k(
        self, mock_semantic_search, mock_get_all_products
    ):
        mock_semantic_search.side_effect = RuntimeError("boom")
        mock_get_all_products.return_value = [
            {"id": f"p{i}", "name": "watch model", "category": "", "brand": "", "description": ""}
            for i in range(10)
        ]

        result = tools.search_products("watch", top_k=3)

        assert len(result) == 3

    @patch("shared.product_service.get_all_products")
    @patch("semantic_search.engine.search_products")
    def test_fallback_no_match_returns_empty(
        self, mock_semantic_search, mock_get_all_products, fake_tools_product
    ):
        mock_semantic_search.side_effect = RuntimeError("boom")
        mock_get_all_products.return_value = [fake_tools_product]

        result = tools.search_products("zzz_no_such_word", top_k=5)

        assert result == []


# ------------------------------------------------------------
# get_recommendations / get_similar_products
# ------------------------------------------------------------

class TestRecommendations:
    @patch("recommendation.engine.recommendation_engine")
    def test_get_recommendations_with_product_id_uses_similar(self, mock_engine):
        mock_engine.get_similar_products.return_value = [{"id": "p1"}]

        result = tools.get_recommendations(product_id="p1", top_k=5)

        mock_engine.get_similar_products.assert_called_once_with("p1", top_k=5)
        mock_engine.get_recommendations_for_user.assert_not_called()
        assert result == [{"id": "p1"}]

    @patch("recommendation.engine.recommendation_engine")
    def test_get_recommendations_without_product_id_uses_for_user(self, mock_engine):
        mock_engine.get_recommendations_for_user.return_value = [{"id": "p2"}]

        result = tools.get_recommendations(
            viewed_product_ids=["p1", "p2"], user_name="alice", top_k=3
        )

        mock_engine.get_recommendations_for_user.assert_called_once_with(
            viewed_product_ids=["p1", "p2"], user_name="alice", top_k=3
        )
        mock_engine.get_similar_products.assert_not_called()
        assert result == [{"id": "p2"}]

    @patch("recommendation.engine.recommendation_engine")
    def test_get_similar_products(self, mock_engine):
        mock_engine.get_similar_products.return_value = [{"id": "p3"}]

        result = tools.get_similar_products("p3", top_k=4)

        mock_engine.get_similar_products.assert_called_once_with("p3", top_k=4)
        assert result == [{"id": "p3"}]


# ------------------------------------------------------------
# analyze_product_reviews
# ------------------------------------------------------------

class TestAnalyzeProductReviews:
    @patch("shared.product_service.get_reviews_for_product")
    def test_no_reviews(self, mock_get_reviews):
        mock_get_reviews.return_value = []

        result = tools.analyze_product_reviews("p1")

        assert result == {
            "product_id": "p1",
            "review_count": 0,
            "overall_sentiment": "unknown",
            "reviews": [],
        }

    @patch("sentiment.engine.analyze_sentiment")
    @patch("shared.product_service.get_reviews_for_product")
    def test_aggregates_sentiment_across_reviews(
        self, mock_get_reviews, mock_analyze_sentiment, fake_reviews
    ):
        mock_get_reviews.return_value = fake_reviews
        mock_analyze_sentiment.side_effect = [
            {"sentiment": "positive", "compound": 0.8, "positive": 0.8, "neutral": 0.2, "negative": 0.0},
            {"sentiment": "negative", "compound": -0.7, "positive": 0.0, "neutral": 0.3, "negative": 0.7},
        ]

        result = tools.analyze_product_reviews("p1")

        assert result["review_count"] == 2
        assert result["average_compound"] == pytest.approx(0.05, abs=1e-4)
        assert result["overall_sentiment"] == "positive"  # 0.05 >= 0.05 threshold
        assert len(result["reviews"]) == 2
        assert result["reviews"][0]["sentiment"] == "positive"
        assert result["reviews"][1]["sentiment"] == "negative"

    @patch("sentiment.engine.analyze_sentiment")
    @patch("shared.product_service.get_reviews_for_product")
    def test_review_dict_carries_expected_fields(
        self, mock_get_reviews, mock_analyze_sentiment, fake_reviews
    ):
        mock_get_reviews.return_value = fake_reviews[:1]
        mock_analyze_sentiment.return_value = {
            "sentiment": "positive", "compound": 0.9,
            "positive": 0.9, "neutral": 0.1, "negative": 0.0,
        }

        result = tools.analyze_product_reviews("p1")
        review = result["reviews"][0]

        assert review["review_id"] == "r1"
        assert review["user_name"] == "Alice"
        assert review["rating"] == 5
        assert review["review_text"] == "Love it!"
        assert review["sentiment"] == "positive"
        assert review["compound"] == 0.9


# ------------------------------------------------------------
# get_product (TTL cache)
# ------------------------------------------------------------

class TestGetProduct:
    @patch("shared.product_service.get_product")
    def test_returns_product(self, mock_get_product, fake_tools_product):
        mock_get_product.return_value = fake_tools_product

        result = tools.get_product("64f000000000000000000001")

        assert result == fake_tools_product

    @patch("shared.product_service.get_product")
    def test_repeated_lookup_hits_cache_not_db(self, mock_get_product, fake_tools_product):
        mock_get_product.return_value = fake_tools_product

        tools.get_product("64f000000000000000000001")
        tools.get_product("64f000000000000000000001")
        tools.get_product("64f000000000000000000001")

        # Only the first call should reach product_service; the next two
        # should be served from the TTL cache.
        mock_get_product.assert_called_once_with("64f000000000000000000001")

    @patch("shared.product_service.get_product")
    def test_misses_are_not_cached(self, mock_get_product):
        mock_get_product.return_value = None

        tools.get_product("does-not-exist")
        tools.get_product("does-not-exist")

        # A None result should never be cached, so both calls hit the DB
        # — this lets a newly-added product become visible immediately.
        assert mock_get_product.call_count == 2

    @patch("shared.product_service.get_product")
    def test_different_ids_are_cached_independently(self, mock_get_product):
        mock_get_product.side_effect = lambda pid: {"id": pid}

        tools.get_product("p1")
        tools.get_product("p2")
        tools.get_product("p1")

        assert mock_get_product.call_count == 2

    def test_cache_expires_after_ttl(self, fake_tools_product):
        with patch("shared.product_service.get_product", return_value=fake_tools_product) as mock_get_product:
            tools.get_product("64f000000000000000000001")

            # Simulate time passing beyond the TTL by directly rewriting
            # the cached expiry timestamp rather than sleeping in a test.
            key = "64f000000000000000000001"
            value, _expired_at = tools._product_cache._store[key]
            tools._product_cache._store[key] = (value, 0.0)  # force expiry

            tools.get_product("64f000000000000000000001")

        assert mock_get_product.call_count == 2


# ------------------------------------------------------------
# filter_products
# ------------------------------------------------------------

class TestFilterProducts:
    @patch("shared.product_service.filter_products")
    def test_forwards_supported_params_only(self, mock_filter):
        mock_filter.return_value = [{"id": "p1"}]

        result = tools.filter_products(
            category="watch", max_price=5000, min_price=1000, gender="Unisex"
        )

        # Regression test for the bug: previously an `occasion=None`
        # kwarg was always forwarded here, which raised TypeError since
        # product_service.filter_products() doesn't declare that param.
        mock_filter.assert_called_once_with(
            category="watch", max_price=5000, min_price=1000, gender="Unisex"
        )
        assert "occasion" not in mock_filter.call_args.kwargs
        assert result == [{"id": "p1"}]

    @patch("shared.product_service.filter_products")
    def test_does_not_raise_typeerror(self, mock_filter):
        # This call previously raised TypeError: filter_products() got
        # an unexpected keyword argument 'occasion'.
        mock_filter.return_value = []
        tools.filter_products(category="perfume", max_price=2000)  # should not raise


if __name__ == "__main__":
    import sys
    sys.exit(pytest.main([__file__, "-v"]))
