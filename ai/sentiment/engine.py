"""
Sentiment analysis engine using VADER (Valence Aware Dictionary and
sEntiment Reasoner). Well suited for short, informal review text.
"""

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from shared.product_service import get_reviews_for_product

_analyzer = SentimentIntensityAnalyzer()

POSITIVE_THRESHOLD = 0.05
NEGATIVE_THRESHOLD = -0.05


def analyze_sentiment(text: str) -> dict:
    """
    Analyze the sentiment of a piece of text (e.g. a product review).

    Returns a dict with:
        sentiment: "positive" | "neutral" | "negative"
        compound, positive, neutral, negative scores
    """
    scores = _analyzer.polarity_scores(text or "")

    compound = scores["compound"]

    if compound >= POSITIVE_THRESHOLD:
        sentiment = "positive"
    elif compound <= NEGATIVE_THRESHOLD:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    return {
        "sentiment": sentiment,
        "compound": compound,
        "positive": scores["pos"],
        "neutral": scores["neu"],
        "negative": scores["neg"],
    }


def analyze_product_reviews(product_id: str) -> dict:
    """Analyze all reviews for a product."""

    reviews = get_reviews_for_product(product_id)
    results = []
    for review in reviews:
        sentiment = analyze_sentiment(review["review_text"])

        results.append({
            "review_id": review["id"],
            "user_name": review["user_name"],
            "rating": review["rating"],
            "review_text": review["review_text"],  # fixed: was "review_txt"
            **sentiment,
        })

    total = len(results)
    if total == 0:
        return {
            "product_id": product_id,
            "total_reviews": 0,
            "positive": 0,
            "negative": 0,
            "neutral": 0,
            "reviews": [],
        }

    positive = sum(r["sentiment"] == "positive" for r in results)
    neutral = sum(r["sentiment"] == "neutral" for r in results)
    negative = sum(r["sentiment"] == "negative" for r in results)

    return {
        "product_id": product_id,
        "total_reviews": total,
        "positive": positive,
        "neutral": neutral,
        "negative": negative,
        "positive_percentage": round(positive / total * 100, 2),
        "neutral_percentage": round(neutral / total * 100, 2),
        "negative_percentage": round(negative / total * 100, 2),
        "reviews": results,
    }