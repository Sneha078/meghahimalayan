from search.fusion.rrf import reciprocal_rank_fusion


def test_rrf_combines_results():
    bm25 = [
        ("p1", 10.0),
        ("p2", 8.0),
        ("p3", 6.0),
    ]

    semantic = [
        ("p2", 0.95),
        ("p1", 0.90),
        ("p4", 0.85),
    ]

    results = reciprocal_rank_fusion(
        [bm25, semantic]
    )

    assert isinstance(results, list)
    assert len(results) == 4


def test_rrf_rewards_products_in_both_lists():
    bm25 = [
        ("p1", 10.0),
        ("p2", 8.0),
    ]

    semantic = [
        ("p2", 0.95),
        ("p3", 0.90),
    ]

    results = reciprocal_rank_fusion(
        [bm25, semantic]
    )

    assert results[0][0] == "p2"


def test_rrf_result_format():
    results = reciprocal_rank_fusion(
        [[("p1", 10.0)]]
    )

    product_id, score = results[0]

    assert isinstance(product_id, str)
    assert isinstance(score, float)