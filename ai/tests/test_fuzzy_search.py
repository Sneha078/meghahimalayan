from search.retrieval.fuzzy_search import search_fuzzy
from shared import product_service


def test_fuzzy_search_returns_results():
    products = product_service.get_all_products()

    print("\nPRODUCT COUNT:", len(products))

    seiko_products = [
        p for p in products
        if "seiko" in str(p.get("brand", "")).lower()
        or "seiko" in str(p.get("name", "")).lower()
    ]

    print("SEIKO PRODUCTS:", seiko_products)

    results = search_fuzzy("seko", top_k=5)

    print("FUZZY RESULT:", results)

    assert isinstance(results, list)
    assert len(results) > 0