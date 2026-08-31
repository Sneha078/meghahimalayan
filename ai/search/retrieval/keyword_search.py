from search.index.build_index import get_bm25_index
from search.query.preprocessing import normalize_query


DEFAULT_TOP_K = 10


def search_keywords(
    query: str,
    top_k: int = DEFAULT_TOP_K,
) -> list[tuple[str, float]]:
    """
    Search products using BM25 keyword retrieval.

    Returns:
        List of (product_id, bm25_score) tuples ordered by relevance.
    """

    normalized_query = normalize_query(query)

    if not normalized_query:
        return []

    index = get_bm25_index()

    if not index.is_built:
        return []

    results = index.search(normalized_query, top_k=top_k)

    return [
        (result["id"], float(result["bm25_score"]))
        for result in results
        if result.get("id")
    ]