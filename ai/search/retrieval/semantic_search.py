from semantic_search.engine import search_products

DEFAULT_TOP_K = 10

def search_semantic(
    query: str,
    top_k: int = DEFAULT_TOP_K,

) -> list[tuple[str, float]]:
    """ Search products using the existing MiniLM + FAISS semantic search engine.

    Returns: 
        List of (product_id, similarity_score) tuples ordered by relevance.
    """

    if not query or not query.strip():
        return []

    results = search_products(
        query=query,
        top_k=top_k,
    )

    return [
        (
            product["id"],
            float(product["similarity_score"]),
        )
        for product in results
        if product.get("id")
    ]