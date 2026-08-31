from search.retrieval.semantic_search import search_semantic

def test_semantic_search_returns_results():
    results = search_semantic(
        "fresh summer fragrance",
        top_k=5
    )

    assert isinstance(results, list)
    assert len(results) > 0

def test_semantic_search_result_format():
    results = search_semantic(
        "silver chronograph watch",
        top_k=5
    )

    assert len(results) > 0
    product_id, score = results[0]

    assert isinstance(product_id, str)
    assert isinstance(score, float)

def test_rabann_glasses_semantic_search():
    results = semantic_search("rabann glasses", top_k=5)

    print("\n=== Semantic Search Results ===")

    for i, result in enumerate(results, start=1):
        print(
            f"{i}. {result['name']} "
            f"| Brand: {result['brand']} "
            f"| Score: {result['similarity_score']}"
        )

    assert len(results) == 5
def test_semantic_search_empty_query():
    results = search_semantic("", top_k=5)

    assert results == []