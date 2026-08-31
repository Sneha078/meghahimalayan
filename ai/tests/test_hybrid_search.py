
"""
Tests for the hybrid product search pipeline.

These tests use the products available through the real product_service.
They verify that the hybrid search can handle:
    - brand/product typos
    - natural-language queries
    - empty queries
    - result limits
"""

from search.hybrid_search import hybrid_search


def print_results(title: str, results: list[dict]) -> None:
    """Print search results in a readable format."""
    print(f"\n=== {title} ===")

    for i, product in enumerate(results, start=1):
        print(
            f"{i}. {product.get('name')}"
            f" | Brand: {product.get('brand')}"
            f" | Score: {product.get('search_score')}"
        )


def test_hybrid_rayban_typo():
    """
    A misspelled Ray-Ban query should still return a Ray-Ban product.

    Example:
        "rabann glasses"
        -> Ray-Ban eyeglasses
    """
    results = hybrid_search(
        "rabann glasses",
        top_k=5,
    )

    assert results
    assert len(results) <= 5

    print_results(
        "RAY-BAN HYBRID SEARCH RESULTS",
        results,
    )

    assert any(
        product.get("brand") == "Ray-Ban"
        for product in results
    ), (
        "Expected a Ray-Ban product in the hybrid search results. "
        f"Got: {[p.get('name') for p in results]}"
    )


def test_hybrid_dior_typo():
    """
    A misspelled Dior perfume query should return a Dior product.

    Example:
        "dio perfam"
        -> Dior perfume
    """
    results = hybrid_search(
        "dio perfam",
        top_k=5,
    )

    assert results
    assert len(results) <= 5

    print_results(
        "DIOR HYBRID SEARCH RESULTS",
        results,
    )

    assert any(
        product.get("brand") == "Dior"
        for product in results
    ), (
        "Expected a Dior product in the hybrid search results. "
        f"Got: {[p.get('name') for p in results]}"
    )


def test_hybrid_result_limit():
    """Hybrid search should respect the requested top_k limit."""
    results = hybrid_search(
        "watch",
        top_k=3,
    )

    assert len(results) <= 3


def test_hybrid_empty_query():
    """An empty query should return an empty result list."""
    assert hybrid_search("") == []
    assert hybrid_search("   ") == []


def test_hybrid_returns_product_data():
    """
    Hybrid search should return product dictionaries containing
    basic product information.
    """
    results = hybrid_search(
        "perfume",
        top_k=5,
    )

    assert results

    for product in results:
        assert isinstance(product, dict)
        assert product.get("id")
        assert product.get("name")
        assert product.get("brand") is not None

