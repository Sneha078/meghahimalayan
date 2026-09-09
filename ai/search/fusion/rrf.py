DEFAULT_K = 60


def reciprocal_rank_fusion(
    result_lists: list[list[tuple[str, float]]],
    k: int = DEFAULT_K,
) -> list[tuple[str, float]]:
    """
    Combine ranked result lists using Reciprocal Rank Fusion.

    Each result list contains:
        [(product_id, score), ...]

    The original retrieval score is not used directly.
    Only the rank of each product contributes to the RRF score.

    RRF score:
        1 / (k + rank)

    where rank starts at 1.
    """

    scores: dict[str, float] = {}

    for results in result_lists:
        for rank, (product_id, _) in enumerate(results, start=1):
            scores[product_id] = scores.get(product_id, 0.0) + (
                1.0 / (k + rank)
            )

    fused_results = sorted(
        scores.items(),
        key=lambda item: item[1],
        reverse=True,
    )

    return fused_results