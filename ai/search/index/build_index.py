"""
BM25 index for keyword-based product search.

Builds a BM25Okapi corpus from all products in MongoDB, using the same
`build_product_text()` tokenisation as the FAISS semantic index so both
retrieval paths operate on consistent document representations.

The index is built once at startup (lazy, on first use) and can be
explicitly rebuilt after product data changes by calling `rebuild()`.

Usage:
    from search.index.build_index import get_bm25_index

    idx = get_bm25_index()
    results = idx.search("seiko silver chronograph", top_k=10)
"""

import re
import logging
from threading import Lock
from typing import Optional

from rank_bm25 import BM25Okapi

from shared import product_service
from shared.utils import build_product_text

logger = logging.getLogger(__name__)

# ── Tokeniser ─────────────────────────────────────────────────────────────────

# Simple whitespace + punctuation tokeniser.  Keeps hyphens inside words
# (e.g. "ray-ban" stays one token) but strips surrounding punctuation.
_TOKEN_RE = re.compile(r"[^\w\-]+")


def tokenize(text: str) -> list[str]:
    """
    Lowercase and split text into BM25 tokens.

    - Converts to lowercase
    - Splits on whitespace and punctuation (hyphens inside words preserved)
    - Drops empty tokens and single-character noise tokens
    """
    tokens = _TOKEN_RE.split(text.lower().strip())
    return [t for t in tokens if len(t) > 1]


# ── Index wrapper ─────────────────────────────────────────────────────────────

class BM25Index:
    """
    Wraps BM25Okapi with product ID mapping and a clean search interface.

    Attributes:
        _bm25         BM25Okapi instance (None until built)
        _product_ids  Parallel list mapping corpus position → product id
        _products     Full product dicts for returning results directly
    """

    def __init__(self) -> None:
        self._bm25: Optional[BM25Okapi] = None
        self._product_ids: list[str] = []
        self._products: list[dict] = []
        self._lock = Lock()

    # ── Build ──────────────────────────────────────────────────────────────

    def build(self, products: Optional[list[dict]] = None) -> None:
        """
        Build (or rebuild) the BM25 corpus from product data.

        Args:
            products: Optional pre-loaded product list.  If None, loads
                      from MongoDB via product_service.
        """
        if products is None:
            products = product_service.get_all_products()

        if not products:
            logger.warning("BM25Index.build(): no products found — index is empty.")
            self._bm25 = None
            self._product_ids = []
            self._products = []
            return

        corpus_tokens: list[list[str]] = []
        product_ids: list[str] = []
        product_list: list[dict] = []

        for product in products:
            text = build_product_text(product)
            tokens = tokenize(text)

            # BM25 degrades on empty token lists; skip products with no
            # usable text rather than poisoning the corpus with empty docs.
            if not tokens:
                logger.debug(
                    "BM25Index.build(): skipping product %s — no tokens",
                    product.get("id", "unknown"),
                )
                continue

            corpus_tokens.append(tokens)
            product_ids.append(str(product["id"]))
            product_list.append(product)

        with self._lock:
            self._bm25 = BM25Okapi(corpus_tokens)
            self._product_ids = product_ids
            self._products = product_list

        logger.info(
            "BM25Index built: %d products indexed.",
            len(product_ids),
        )

    # ── Search ─────────────────────────────────────────────────────────────

    def search(
        self,
        query: str,
        top_k: int = 10,
    ) -> list[dict]:
        """
        Search the BM25 index for products matching `query`.

        Returns a list of product dicts (same shape as product_service
        returns) enriched with a `bm25_score` float, sorted by score
        descending.  Returns an empty list if the index has not been built
        or the query produces no tokens.

        Args:
            query:  Natural language or keyword search string.
            top_k:  Maximum number of results to return.
        """
        with self._lock:
            bm25 = self._bm25
            product_ids = self._product_ids
            products = self._products

        if bm25 is None or not products:
            logger.warning("BM25Index.search(): index not built — returning [].")
            return []

        query_tokens = tokenize(query)
        if not query_tokens:
            return []

        scores: list[float] = bm25.get_scores(query_tokens).tolist()

        # Pair each product with its score, filter zero-score hits, sort
        scored = [
            (products[i], scores[i])
            for i in range(len(products))
            if scores[i] > 0.0
        ]
        scored.sort(key=lambda x: x[1], reverse=True)

        results = []
        for product, score in scored[:top_k]:
            item = dict(product)
            item["bm25_score"] = round(score, 4)
            results.append(item)

        return results

    # ── Convenience ────────────────────────────────────────────────────────

    @property
    def is_built(self) -> bool:
        """True if the index has been built and contains at least one document."""
        return self._bm25 is not None and len(self._product_ids) > 0

    @property
    def size(self) -> int:
        """Number of documents in the index."""
        return len(self._product_ids)


# ── Singleton ─────────────────────────────────────────────────────────────────

_index: Optional[BM25Index] = None
_init_lock = Lock()


def get_bm25_index() -> BM25Index:
    """
    Return the shared BM25Index, building it lazily on first call.

    Thread-safe: concurrent first calls both wait on _init_lock; only
    one will build the index and the other will reuse it.
    """
    global _index

    if _index is not None and _index.is_built:
        return _index

    with _init_lock:
        # Double-checked locking — another thread may have built it
        # while we were waiting on the lock.
        if _index is None or not _index.is_built:
            _index = BM25Index()
            _index.build()

    return _index


def rebuild() -> BM25Index:
    """
    Force a full rebuild of the BM25 index from current MongoDB data.

    Call this after adding / updating products so search results stay
    fresh without restarting the server.

    Returns the rebuilt index instance.
    """
    global _index

    logger.info("BM25Index: rebuilding index...")

    new_index = BM25Index()
    new_index.build()

    with _init_lock:
        _index = new_index

    logger.info("BM25Index: rebuild complete (%d products).", new_index.size)
    return _index
