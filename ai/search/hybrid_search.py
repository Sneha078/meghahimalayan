import logging

from search.retrieval.keyword_search import search_keywords
from search.retrieval.semantic_search import search_semantic
from search.retrieval.fuzzy_search import search_fuzzy

from search.fusion.rrf import reciprocal_rank_fusion
from search.ranking.ranking import rank_products
from search.query.preprocessing import normalize_query, tokenize, correct_query

from shared import product_service
from shared.utils import build_product_text

logger = logging.getLogger(__name__)

DEFAULT_TOP_K = 5
DEFAULT_RETRIEVAL_K = 10
DEFAULT_RRF_K = 60


def _build_vocabulary(products: list[dict]) -> list[str]:
    """
    Build a flat vocabulary list of all meaningful tokens from the product
    corpus (brand names, product name words, category words, etc.).

    Used by `correct_query` to snap misspelled query tokens to known terms.
    """
    vocab: set[str] = set()
    for product in products:
        text = build_product_text(product)
        for token in tokenize(normalize_query(text)):
            if len(token) > 1:
                vocab.add(token)
    return list(vocab)


def hybrid_search(
    query: str,
    top_k: int = DEFAULT_TOP_K,
    retrieval_k: int = DEFAULT_RETRIEVAL_K,
    rrf_k: int = DEFAULT_RRF_K,
) -> list[dict]:
    """
    Hybrid product search pipeline.

    Retrieval stages:
        - BM25 keyword search
        - Semantic search
        - Fuzzy search  (typo-tolerant, token-level)

    Query correction:
        - Misspelled query tokens are snapped to the nearest known product
          vocabulary term before being passed to BM25 and semantic search.
          Fuzzy search handles typos internally, so it always uses the raw query.

    Fusion:
        - Reciprocal Rank Fusion

    Ranking:
        - Business-level product ranking

    Returns:
        Top-k ranked product dictionaries.
    """

    if not query or not query.strip():
        return []

    # ---------------------------------------------------------
    # 0. Load products once — reused for vocab + ranking
    # ---------------------------------------------------------

    products = product_service.get_all_products()

    # ---------------------------------------------------------
    # 1. Build corrected query for BM25 + semantic paths
    # ---------------------------------------------------------

    vocabulary = _build_vocabulary(products)
    corrected_query = correct_query(query, vocabulary, threshold=80) or query

    if corrected_query != query:
        logger.debug(
            "hybrid_search: query corrected %r → %r",
            query,
            corrected_query,
        )

    # ---------------------------------------------------------
    # 2. Retrieve candidates
    # ---------------------------------------------------------

    # BM25 and semantic use the corrected query so typos don't kill recall.
    # Fuzzy search uses the raw query — it handles typos natively.
    keyword_results = search_keywords(
        corrected_query,
        top_k=retrieval_k,
    )

    semantic_results = search_semantic(
        query,
        top_k=retrieval_k,
    )

    fuzzy_results = search_fuzzy(
        query,
        top_k=retrieval_k,
    )

    # ---------------------------------------------------------
    # 3. Fuse retrieval results using RRF
    # ---------------------------------------------------------

    fused_results = reciprocal_rank_fusion(
        [
            keyword_results,
            semantic_results,
            fuzzy_results,
        ],
        k=rrf_k,
    )

    if not fused_results:
        return []

    # ---------------------------------------------------------
    # 4. Convert RRF results to dictionary
    # ---------------------------------------------------------

    rrf_scores = dict(fused_results)

    # ---------------------------------------------------------
    # 5. Apply business-level ranking
    # ---------------------------------------------------------

    ranked_products = rank_products(
        products=products,
        rrf_scores=rrf_scores,
        query=query,
    )

    # ---------------------------------------------------------
    # 6. Return top-k
    # ---------------------------------------------------------

    return ranked_products[:top_k]
