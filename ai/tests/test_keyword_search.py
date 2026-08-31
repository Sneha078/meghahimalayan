from search.retrieval.keyword_search import search_keywords

def test_keywords_search_returns_results():
    results = search_keywords("seiko silver chronograph",top_k=5)

    assert isinstance(results, list)
    assert len(results) > 0

def test_keyword_search_result_format():
    results = search_keywords("seiko watch", top_k=5)

    assert len(results) > 0

    product_id, score = results[0]

    assert isinstance(product_id, str)
    assert isinstance(score, float)

def test_keywords_search_empty_query():
    results = search_keywords("", top_k=5)



    assert results == []