"""
Semantic product search engine.

Builds searchable text documents from product data, embeds them with a
Sentence Transformer, indexes them in FAISS, and lets users search with
natural-language queries (e.g. "fresh perfume for summer") without needing
exact product keywords.

MongoDB (via product_service) remains the source of truth for product
data - FAISS only stores vectors + product ID mappings, never the full
product database.
"""

from typing import Optional

from semantic_search.embeddings import (
    EMBEDDING_DIMENSION,
    generate_embedding,
    generate_embeddings,
)
from semantic_search.index import ProductVectorIndex
from shared import product_service
from shared.utils import build_product_text

DEFAULT_TOP_K = 5

_index: Optional[ProductVectorIndex] = None


def build_index(products: Optional[list[dict]] = None) -> ProductVectorIndex:
    """
    Build (or rebuild) the FAISS index from current product data.
    Call this once at startup, and again whenever product data changes.
    """
    global _index

    all_products = products if products is not None else product_service.get_all_products()

    texts = [build_product_text(p) for p in all_products]
    product_ids = [p["id"] for p in all_products]

    embeddings = generate_embeddings(texts) if texts else None

    _index = ProductVectorIndex(dimension=EMBEDDING_DIMENSION)
    if embeddings is not None and len(embeddings) > 0:
        _index.build(embeddings, product_ids)

    return _index


def get_index() -> ProductVectorIndex:
    """Return the current index, building it lazily on first use if needed."""
    global _index
    if _index is None:
        build_index()
    return _index


def search_products(query: str, top_k: int = DEFAULT_TOP_K) -> list[dict]:
    """
    Search products using a natural-language query.
    Returns matching products with similarity scores, sorted by relevance.
    """
    index = get_index()
    if not index.is_built:
        return []

    query_embedding = generate_embedding(query)
    matches = index.search(query_embedding, top_k=top_k)

    if not matches:
        return []

    product_ids = [pid for pid, _ in matches]
    scores_by_id = {pid: score for pid, score in matches}

    products = product_service.get_products_by_ids(product_ids)

    results = []
    for product in products:
        item = dict(product)
        item["similarity_score"] = round(scores_by_id[product["id"]], 4)
        results.append(item)

    results.sort(key=lambda p: p["similarity_score"], reverse=True)
    return results