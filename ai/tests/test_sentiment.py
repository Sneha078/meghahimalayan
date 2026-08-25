"""
Test suite for the sentiment analysis engine.

analyze_sentiment() is tested against the real VADER analyzer, since it's
a lightweight, deterministic, rule-based lexicon with no model download —
there's no benefit to mocking it and doing so would hide real threshold
behavior.

analyze_product_reviews() mocks shared.product_service.get_reviews_for_product
so these tests don't require a live MongoDB connection.

Run with:
    pytest test_sentiment.py -v
"""

from unittest.mock import patch

import pytest

from sentiment.engine import (
    NEGATIVE_THRESHOLD,
    POSITIVE_THRESHOLD,
    analyze_product_reviews,
    analyze_sentiment,
)


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture
def fake_reviews():
    return [
        {
            "id": "r1",
            "user_name": "Alice",
            "rating": 5,
            "review_text": "I absolutely love these sunglasses, best purchase ever!",
        },
        {
            "id": "r2",
            "user_name": "Bob",
            "rating": 1,
            "review_text": "Terrible quality, broke after one day. Very disappointed.",
        },
        {
            "id": "r3",
            "user_name": "Carla",
            "rating": 3,
            "review_text": "It's a watch. It tells time.",
        },
    ]


# ============================================================
# analyze_sentiment
# ============================================================

class TestAnalyzeSentiment:
    def test_clearly_positive_text(self):
        result = analyze_sentiment("This is absolutely wonderful, I love it!")

        assert result["sentiment"] == "positive"
        assert result["compound"] >= POSITIVE_THRESHOLD
        assert result["positive"] > 0

    def test_clearly_negative_text(self):
        result = analyze_sentiment("This is terrible and awful, I hate it.")

        assert result["sentiment"] == "negative"
        assert result["compound"] <= NEGATIVE_THRESHOLD
        assert result["negative"] > 0

    def test_neutral_factual_text(self):
        result = analyze_sentiment("The package arrived on Tuesday.")

        assert result["sentiment"] == "neutral"
        assert NEGATIVE_THRESHOLD < result["compound"] < POSITIVE_THRESHOLD

    def test_empty_string_is_neutral(self):
        result = analyze_sentiment("")

        assert result["sentiment"] == "neutral"
        assert result["compound"] == 0.0

    def test_none_input_does_not_raise(self):
        # analyze_sentiment guards with `text or ""`, so None must not
        # blow up on _analyzer.polarity_scores(None).
        result = analyze_sentiment(None)

        assert result["sentiment"] == "neutral"
        assert result["compound"] == 0.0

    def test_return_shape_has_all_expected_keys(self):
        result = analyze_sentiment("Pretty good overall.")

        assert set(result.keys()) == {
            "sentiment", "compound", "positive", "neutral", "negative",
        }

    @patch("sentiment.engine._analyzer")
    def test_compound_exactly_at_positive_threshold_is_positive(self, mock_analyzer):
        # Boundary check: compound == POSITIVE_THRESHOLD should classify
        # as "positive" since the comparison is >=, not >.
        mock_analyzer.polarity_scores.return_value = {
            "compound": POSITIVE_THRESHOLD,
            "pos": 0.2, "neu": 0.8, "neg": 0.0,
        }

        result = analyze_sentiment("some text")
        assert result["sentiment"] == "positive"

    @patch("sentiment.engine._analyzer")
    def test_compound_exactly_at_negative_threshold_is_negative(self, mock_analyzer):
        # Boundary check: compound == NEGATIVE_THRESHOLD should classify
        # as "negative" since the comparison is <=, not <.
        mock_analyzer.polarity_scores.return_value = {
            "compound": NEGATIVE_THRESHOLD,
            "pos": 0.0, "neu": 0.8, "neg": 0.2,
        }

        result = analyze_sentiment("some text")
        assert result["sentiment"] == "negative"

    @patch("sentiment.engine._analyzer")
    def test_compound_just_inside_neutral_band(self, mock_analyzer):
        mock_analyzer.polarity_scores.return_value = {
            "compound": 0.0,
            "pos": 0.1, "neu": 0.9, "neg": 0.0,
        }

        result = analyze_sentiment("some text")
        assert result["sentiment"] == "neutral"


# ============================================================
# analyze_product_reviews
# ============================================================

class TestAnalyzeProductReviews:
    @patch("sentiment.engine.get_reviews_for_product")
    def test_no_reviews_returns_zeroed_summary(self, mock_get_reviews):
        mock_get_reviews.return_value = []

        result = analyze_product_reviews("64f000000000000000000001")

        assert result == {
            "product_id": "64f000000000000000000001",
            "total_reviews": 0,
            "positive": 0,
            "negative": 0,
            "neutral": 0,
            "reviews": [],
        }
        # No percentage_* keys when there are no reviews to divide by.
        assert "positive_percentage" not in result

    @patch("sentiment.engine.get_reviews_for_product")
    def test_uses_review_text_key_without_raising(self, mock_get_reviews, fake_reviews):
        # Regression test for the review_txt -> review_text bug: reviews
        # only carry a "review_text" key (matching product_service's
        # _review_to_dict), never "review_txt". This must not KeyError.
        mock_get_reviews.return_value = fake_reviews

        result = analyze_product_reviews("64f000000000000000000001")

        assert result["total_reviews"] == 3
        returned_texts = [r["review_text"] for r in result["reviews"]]
        assert returned_texts == [r["review_text"] for r in fake_reviews]

    @patch("sentiment.engine.get_reviews_for_product")
    def test_counts_and_percentages_are_consistent(self, mock_get_reviews, fake_reviews):
        mock_get_reviews.return_value = fake_reviews

        result = analyze_product_reviews("64f000000000000000000001")

        assert result["positive"] + result["neutral"] + result["negative"] == 3
        pct_sum = (
            result["positive_percentage"]
            + result["neutral_percentage"]
            + result["negative_percentage"]
        )
        assert pct_sum == pytest.approx(100.0, abs=0.02)

        # The known-positive/negative reviews in the fixture should land
        # in the expected buckets.
        assert result["positive"] >= 1
        assert result["negative"] >= 1

    @patch("sentiment.engine.get_reviews_for_product")
    def test_review_result_includes_original_fields_plus_sentiment(
        self, mock_get_reviews, fake_reviews
    ):
        mock_get_reviews.return_value = fake_reviews[:1]

        result = analyze_product_reviews("64f000000000000000000001")
        review = result["reviews"][0]

        assert review["review_id"] == "r1"
        assert review["user_name"] == "Alice"
        assert review["rating"] == 5
        assert review["review_text"] == fake_reviews[0]["review_text"]
        assert review["sentiment"] in {"positive", "neutral", "negative"}
        assert "compound" in review

    @patch("sentiment.engine.get_reviews_for_product")
    def test_passes_product_id_through_to_get_reviews_for_product(
        self, mock_get_reviews
    ):
        mock_get_reviews.return_value = []

        analyze_product_reviews("some-product-id")

        mock_get_reviews.assert_called_once_with("some-product-id")


if __name__ == "__main__":
    import sys
    sys.exit(pytest.main([__file__, "-v"]))