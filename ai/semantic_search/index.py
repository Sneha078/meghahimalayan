"""
FAISS index management.

FAISS is used ONLY as a vector similarity index. MongoDB (via
product_service) remains the source of truth for actual product data -
this module just maps vector positions back to product IDs so the caller
can re-fetch full product details from product_service.
"""

import faiss
import numpy as np


class ProductVectorIndex:
    """
    Wraps a FAISS IndexFlatIP (inner product) index. Since embeddings are
    normalized, inner product similarity is equivalent to cosine similarity.
    """

    def __init__(self, dimension: int):
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)
        self.id_map: list[str] = []  # position in index -> product_id

    def build(self, embeddings: np.ndarray, product_ids: list[str]) -> None:
        """Build the index from scratch given embeddings and matching product IDs."""
        if len(embeddings) != len(product_ids):
            raise ValueError(
                f"embeddings/product_ids length mismatch: "
                f"{len(embeddings)} embeddings vs {len(product_ids)} ids"
            )

        # FAISS requires float32, C-contiguous arrays. generate_embeddings()
        # already returns this, but enforce it here so build() is safe to
        # call directly (e.g. from tests or future scripts) without relying
        # on the caller to have done it upstream.
        embeddings = np.ascontiguousarray(embeddings, dtype="float32")

        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(embeddings)
        self.id_map = list(product_ids)

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> list[tuple[str, float]]:
        """
        Search the index with a single query embedding.
        Returns a list of (product_id, similarity_score) tuples.
        """
        if self.index.ntotal == 0:
            return []

        query = np.ascontiguousarray(
            np.expand_dims(query_embedding, axis=0), dtype="float32"
        )
        scores, indices = self.index.search(query, min(top_k, self.index.ntotal))

        results = []
        for idx, score in zip(indices[0], scores[0]):
            if idx == -1:
                continue
            results.append((self.id_map[idx], float(score)))
        return results

    @property
    def is_built(self) -> bool:
        return self.index.ntotal > 0