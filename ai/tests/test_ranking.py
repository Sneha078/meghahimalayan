from search.ranking.ranking import rank_products


def test_ranking_returns_products():
    products = [
        {
            "id": "p1",
            "name": "Seiko Watch",
            "ratings": 4.5,
            "stock": 10,
        }
    ]

    rrf_scores = {
        "p1": 0.03,
    }

    results = rank_products(products, rrf_scores)

    assert len(results) == 1
    assert results[0]["id"] == "p1"
    assert "search_score" in results[0]


def test_bestseller_gets_boost():
    products = [
        {
            "id": "p1",
            "ratings": 4,
            "stock": 10,
            "isBestSeller": True,
        },
        {
            "id": "p2",
            "ratings": 4,
            "stock": 10,
            "isBestSeller": False,
        },
    ]

    rrf_scores = {
        "p1": 0.03,
        "p2": 0.03,
    }

    results = rank_products(products, rrf_scores)

    assert results[0]["id"] == "p1"


def test_out_of_stock_is_penalized():
    products = [
        {
            "id": "p1",
            "ratings": 4,
            "stock": 0,
        },
        {
            "id": "p2",
            "ratings": 4,
            "stock": 10,
        },
    ]

    rrf_scores = {
        "p1": 0.03,
        "p2": 0.03,
    }

    results = rank_products(products, rrf_scores)

    assert results[0]["id"] == "p2"


def test_unknown_products_are_ignored():
    products = [
        {
            "id": "p1",
            "ratings": 4,
            "stock": 10,
        }
    ]

    rrf_scores = {
        "p1": 0.03,
        "p2": 0.05,
    }

    results = rank_products(products, rrf_scores)

    assert len(results) == 1
    assert results[0]["id"] == "p1"