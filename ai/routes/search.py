from fastapi import APIRouter, Query
import logging

from search.query.preprocessing import normalize_query, correct_query, tokenize
from search.query.autocomplete import Autocomplete
from search.retrieval.keyword_search import search_keywords
from search.retrieval.semantic_search import search_semantic
from search.retrieval.fuzzy_search import search_fuzzy
from search.fusion.rrf import reciprocal_rank_fusion
from search.ranking.ranking import rank_products
from shared import product_service
from shared.utils import build_product_text

logger = logging.getLogger(__name__)

search_router = APIRouter(
    prefix="/search",
    tags=["Search"],
)

autocomplete_engine = Autocomplete()


@search_router.get("/autocomplete")
def autocomplete(
    q: str = Query("", min_length=0),
):
    """
    Fast autocomplete endpoint.

    Uses prefix matching only.
    Does not run BM25, semantic search, or RRF.
    """

    suggestions = autocomplete_engine.search(
        q,
        limit=8,
    )

    return {
        "success": True,
        "query": q,
        "suggestions": suggestions,
    }


@search_router.get("")
def search(
    q: str = Query(..., min_length=1),
    top_k: int = Query(20, ge=1, le=50),
):
    """
    Hybrid product search.

    Pipeline:
        preprocessing + query correction
        -> BM25 + semantic (on corrected query)
        -> fuzzy (on raw query, always runs)
        -> RRF
        -> business ranking with brand/category boosts
        -> relative score cutoff to drop noise
    """

    query = normalize_query(q)

    if not query:
        return {
            "success": True,
            "query": q,
            "results": [],
            "count": 0,
        }

    # ---------------------------------------------------------
    # Query correction — snap typos to known product vocab
    # ---------------------------------------------------------
    products_all = product_service.get_all_products()

    vocabulary: set[str] = set()
    for product in products_all:
        text = build_product_text(product)
        for token in tokenize(normalize_query(text)):
            if len(token) > 1:
                vocabulary.add(token)

    corrected_query = correct_query(query, list(vocabulary), threshold=80) or query

    if corrected_query != query:
        logger.debug("search route: query corrected %r → %r", query, corrected_query)

    # 1. BM25 keyword search (corrected query)
    keyword_results = search_keywords(
        corrected_query,
        top_k=top_k,
    )

    # 2. Semantic search (corrected query)
    semantic_results = search_semantic(
        corrected_query,
        top_k=top_k,
    )

    # 3. Fuzzy search (raw query — handles typos natively, always runs)
    fuzzy_results = search_fuzzy(
        query,
        top_k=top_k,
    )

    # 4. RRF
    fused_results = reciprocal_rank_fusion(
        [keyword_results, semantic_results, fuzzy_results],
    )

    if not fused_results:
        return {
            "success": True,
            "query": q,
            "results": [],
            "count": 0,
        }

    # 5. Convert RRF output into dictionary
    rrf_scores = dict(fused_results)

    # 6. Fetch complete product documents
    products = product_service.get_products_by_ids(list(rrf_scores.keys()))

    # 7. Apply business ranking with brand/category boosts + noise cutoff
    ranked_products = rank_products(
        products,
        rrf_scores,
        query=query,
    )

    return {
        "success": True,
        "query": q,
        "results": ranked_products[:top_k],
        "count": len(ranked_products),
    }