"""
Test suite for the semantic search engine.

Covers three modules:
    - semantic_search.embeddings   (generate_embedding / generate_embeddings)
    - semantic_search.index        (ProductVectorIndex, backed by real FAISS)
    - semantic_search.engine       (build_index / get_index / search_products)

product_service and the SentenceTransformer model are mocked throughout so
these tests run without a live MongoDB connection or a downloaded model.
FAISS itself is exercised for real in TestProductVectorIndex since it's a
lightweight, deterministic, in-memory dependency.

Run with:
    pytest test_semantic_search.py -v
"""

from unittest.mock import MagicMock, patch

import numpy as np
import pytest


# ============================================================
# Fixtures: fake products matching the product_service schema
# ============================================================

@pytest.fixture
def fake_products():
    return [
        {
            "id": "64f000000000000000000001",
            "name": "Aviator Sunglasses",
            "category": "eyeglasses",
            "brand": "SkyView",
            "frameShape": "Aviator",
            "frameMaterial": "Metal",
            "price": 49.99,
        },
        {
            "id": "64f000000000000000000002",
            "name": "Ocean Breeze Eau de Parfum",
            "category": "perfume",
            "brand": "Coastal",
            "fragranceFamily": "Fresh",
            "fragranceType": "Eau de Parfum",
            "price": 89.99,
        },
        {
            "id": "64f000000000000000000003",
            "name": "Classic Automatic Watch",
            "category": "watches",
            "brand": "Timekeeper",
            "watchType": "Automatic",
            "movementType": "Automatic",
            "price": 199.99,
        },
    ]


def _fake_embeddings(n: int, dim: int = 384, seed: int = 0) -> np.ndarray:
    """Deterministic, L2-normalized fake embeddings for testing."""
    rng = np.random.default_rng(seed)
    vecs = rng.random((n, dim)).astype("float32")
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    return (vecs / norms).astype("float32")


# ============================================================
# embeddings.py
# ============================================================

class TestEmbeddings:
    @patch("semantic_search.embeddings.SentenceTransformer")
    def test_get_model_is_lazy_and_cached(self, mock_st_cls):
        import semantic_search.embeddings as embeddings_mod
        embeddings_mod._model = None  # reset module-level cache

        mock_st_cls.return_value = MagicMock()

        model1 = embeddings_mod.get_model()
        model2 = embeddings_mod.get_model()

        mock_st_cls.assert_called_once_with(embeddings_mod.MODEL_NAME)
        assert model1 is model2  # cached, not reloaded

    @patch("semantic_search.embeddings.SentenceTransformer")
    def test_generate_embeddings_normalizes_and_returns_float32(self, mock_st_cls):
        import semantic_search.embeddings as embeddings_mod
        embeddings_mod._model = None

        mock_model = MagicMock()
        mock_model.encode.return_value = _fake_embeddings(2, dim=4)
        mock_st_cls.return_value = mock_model

        result = embeddings_mod.generate_embeddings(["a fresh scent", "a metal frame"])

        mock_model.encode.assert_called_once_with(
            ["a fresh scent", "a metal frame"],
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        assert result.dtype == np.float32
        assert result.shape == (2, 4)

    @patch("semantic_search.embeddings.SentenceTransformer")
    def test_generate_embedding_single_text(self, mock_st_cls):
        import semantic_search.embeddings as embeddings_mod
        embeddings_mod._model = None

        mock_model = MagicMock()
        mock_model.encode.return_value = _fake_embeddings(1, dim=4)
        mock_st_cls.return_value = mock_model

        vec = embeddings_mod.generate_embedding("summer perfume")

        assert vec.shape == (4,)
        assert vec.dtype == np.float32

    @patch("semantic_search.embeddings.SentenceTransformer")
    def test_generate_embeddings_empty_list_returns_shaped_empty_array(self, mock_st_cls):
        # Regression test: model.encode([]) behavior varies across
        # sentence-transformers versions (some return shape (0,) instead
        # of (0, dim)), which breaks downstream code expecting 2D output.
        # generate_embeddings() should short-circuit before ever calling
        # the model.
        import semantic_search.embeddings as embeddings_mod
        embeddings_mod._model = None

        mock_model = MagicMock()
        mock_st_cls.return_value = mock_model

        result = embeddings_mod.generate_embeddings([])

        mock_model.encode.assert_not_called()
        assert result.shape == (0, embeddings_mod.EMBEDDING_DIMENSION)
        assert result.dtype == np.float32

    def test_embedding_dimension_matches_model_output_shape(self):
        # Guards against EMBEDDING_DIMENSION silently drifting out of sync
        # with the actual model, since ProductVectorIndex is built using
        # this constant rather than inspecting a real embedding.
        import semantic_search.embeddings as embeddings_mod

        assert embeddings_mod.EMBEDDING_DIMENSION == 384


# ============================================================
# index.py  (real FAISS, no mocking needed — fast & deterministic)
# ============================================================

class TestProductVectorIndex:
    def test_empty_index_is_not_built(self):
        from semantic_search.index import ProductVectorIndex

        index = ProductVectorIndex(dimension=8)
        assert index.is_built is False
        assert index.search(np.zeros(8, dtype="float32")) == []

    def test_build_and_search_returns_matches(self):
        from semantic_search.index import ProductVectorIndex

        dim = 8
        embeddings = _fake_embeddings(3, dim=dim)
        product_ids = ["p1", "p2", "p3"]

        index = ProductVectorIndex(dimension=dim)
        index.build(embeddings, product_ids)

        assert index.is_built is True

        # Querying with p1's own vector should return p1 as the top match
        # with a similarity score very close to 1.0 (normalized vectors).
        results = index.search(embeddings[0], top_k=3)

        assert len(results) == 3
        top_id, top_score = results[0]
        assert top_id == "p1"
        assert top_score == pytest.approx(1.0, abs=1e-4)

    def test_search_respects_top_k(self):
        from semantic_search.index import ProductVectorIndex

        dim = 8
        embeddings = _fake_embeddings(5, dim=dim)
        index = ProductVectorIndex(dimension=dim)
        index.build(embeddings, ["p1", "p2", "p3", "p4", "p5"])

        results = index.search(embeddings[0], top_k=2)
        assert len(results) == 2

    def test_top_k_larger_than_index_size_is_clamped(self):
        from semantic_search.index import ProductVectorIndex

        dim = 8
        embeddings = _fake_embeddings(2, dim=dim)
        index = ProductVectorIndex(dimension=dim)
        index.build(embeddings, ["p1", "p2"])

        # Requesting more results than exist should not error
        results = index.search(embeddings[0], top_k=50)
        assert len(results) == 2

    def test_rebuild_replaces_previous_index(self):
        from semantic_search.index import ProductVectorIndex

        dim = 8
        index = ProductVectorIndex(dimension=dim)
        index.build(_fake_embeddings(3, dim=dim, seed=1), ["a", "b", "c"])
        assert index.index.ntotal == 3

        index.build(_fake_embeddings(2, dim=dim, seed=2), ["x", "y"])
        assert index.index.ntotal == 2
        assert index.id_map == ["x", "y"]

    def test_build_raises_on_more_embeddings_than_ids(self):
        from semantic_search.index import ProductVectorIndex

        dim = 8
        index = ProductVectorIndex(dimension=dim)
        embeddings = _fake_embeddings(3, dim=dim)  # 3 vectors

        with pytest.raises(ValueError, match="length mismatch"):
            index.build(embeddings, ["p1", "p2"])  # only 2 ids

        # Index should remain unbuilt/untouched after a failed build.
        assert index.is_built is False

    def test_build_raises_on_more_ids_than_embeddings(self):
        from semantic_search.index import ProductVectorIndex

        dim = 8
        index = ProductVectorIndex(dimension=dim)
        embeddings = _fake_embeddings(2, dim=dim)  # 2 vectors

        with pytest.raises(ValueError, match="length mismatch"):
            index.build(embeddings, ["p1", "p2", "p3"])  # 3 ids

    def test_build_coerces_non_contiguous_and_wrong_dtype_input(self):
        # Simulates a caller passing float64 or a sliced/non-contiguous
        # array (e.g. embeddings[::2]) instead of the float32 output
        # generate_embeddings() normally produces. build() should coerce
        # rather than let FAISS raise an opaque C++ assertion error.
        from semantic_search.index import ProductVectorIndex

        dim = 8
        raw = _fake_embeddings(4, dim=dim).astype("float64")  # wrong dtype
        non_contiguous = raw[::2]  # non-contiguous view, 2 rows

        index = ProductVectorIndex(dimension=dim)
        index.build(non_contiguous, ["p1", "p2"])

        assert index.is_built is True
        assert index.index.ntotal == 2

        results = index.search(non_contiguous[0].astype("float32"), top_k=1)
        assert results[0][0] == "p1"


# ============================================================
# semantic_search.py  (product_service + embeddings mocked)
# ============================================================

class TestConstants:
    def test_search_module_reuses_embeddings_dimension_constant(self):
        # Regression test: EMBEDDING_DIMENSION used to be duplicated in
        # both embeddings.py and search.py. If the model ever changes,
        # only embeddings.py needs to be updated — this test fails loudly
        # if the two constants ever get out of sync again (e.g. someone
        # re-adds a hardcoded copy in search.py).
        import semantic_search.embeddings as embeddings_mod
        import semantic_search.engine as engine_mod

        assert engine_mod.EMBEDDING_DIMENSION == embeddings_mod.EMBEDDING_DIMENSION


class TestBuildAndGetIndex:
    def setup_method(self):
        # Reset the module-level singleton before every test so tests
        # don't leak state into one another.
        import semantic_search.engine as engine_mod
        engine_mod._index = None

    @patch("semantic_search.engine.generate_embeddings")
    @patch("semantic_search.engine.product_service")
    def test_build_index_uses_provided_products_when_given(
        self, mock_service, mock_gen_embeddings, fake_products
    ):
        import semantic_search.engine as engine_mod

        mock_gen_embeddings.return_value = _fake_embeddings(len(fake_products))

        engine_mod.build_index(products=fake_products)

        # Should NOT hit product_service.get_all_products() when products
        # are explicitly passed in.
        mock_service.get_all_products.assert_not_called()
        mock_gen_embeddings.assert_called_once()

    @patch("semantic_search.engine.generate_embeddings")
    @patch("semantic_search.engine.product_service")
    def test_build_index_fetches_all_products_by_default(
        self, mock_service, mock_gen_embeddings, fake_products
    ):
        import semantic_search.engine as engine_mod

        mock_service.get_all_products.return_value = fake_products
        mock_gen_embeddings.return_value = _fake_embeddings(len(fake_products))

        index = engine_mod.build_index()

        mock_service.get_all_products.assert_called_once()
        assert index.is_built is True
        assert index.id_map == [p["id"] for p in fake_products]

    @patch("semantic_search.engine.generate_embeddings")
    @patch("semantic_search.engine.product_service")
    def test_build_index_handles_empty_product_list(
        self, mock_service, mock_gen_embeddings
    ):
        import semantic_search.engine as engine_mod

        mock_service.get_all_products.return_value = []

        index = engine_mod.build_index()

        mock_gen_embeddings.assert_not_called()
        assert index.is_built is False

    @patch("semantic_search.engine.generate_embeddings")
    @patch("semantic_search.engine.product_service")
    def test_get_index_builds_lazily_once(
        self, mock_service, mock_gen_embeddings, fake_products
    ):
        import semantic_search.engine as engine_mod

        mock_service.get_all_products.return_value = fake_products
        mock_gen_embeddings.return_value = _fake_embeddings(len(fake_products))

        index1 = engine_mod.get_index()
        index2 = engine_mod.get_index()

        # get_all_products should only be hit once — second get_index()
        # call should reuse the cached module-level index.
        mock_service.get_all_products.assert_called_once()
        assert index1 is index2


class TestSearchProducts:
    def setup_method(self):
        import semantic_search.engine as engine_mod
        engine_mod._index = None

    @patch("semantic_search.engine.generate_embedding")
    @patch("semantic_search.engine.generate_embeddings")
    @patch("semantic_search.engine.product_service")
    def test_search_returns_empty_list_when_index_not_built(
        self, mock_service, mock_gen_embeddings, mock_gen_embedding
    ):
        import semantic_search.engine as engine_mod

        mock_service.get_all_products.return_value = []

        results = engine_mod.search_products("fresh summer scent")

        assert results == []
        mock_gen_embedding.assert_not_called()

    @patch("semantic_search.engine.generate_embedding")
    @patch("semantic_search.engine.generate_embeddings")
    @patch("semantic_search.engine.product_service")
    def test_search_returns_products_sorted_by_similarity(
        self, mock_service, mock_gen_embeddings, mock_gen_embedding, fake_products
    ):
        import semantic_search.engine as engine_mod

        build_embeddings = _fake_embeddings(len(fake_products))
        mock_service.get_all_products.return_value = fake_products
        mock_gen_embeddings.return_value = build_embeddings
        engine_mod.build_index()

        # Query vector identical to product 2's embedding -> product 2
        # should be the top FAISS match.
        mock_gen_embedding.return_value = build_embeddings[1]

        # get_products_by_ids returns results in a DIFFERENT order than
        # requested, mimicking Mongo's non-guaranteed $in ordering.
        by_id = {p["id"]: p for p in fake_products}
        mock_service.get_products_by_ids.side_effect = (
            lambda ids: [by_id[i] for i in reversed(ids)]
        )

        results = engine_mod.search_products("ocean breeze fresh perfume", top_k=3)

        assert len(results) == 3
        # Despite get_products_by_ids returning them reversed, the top
        # result must be the highest-similarity product (id ...002).
        assert results[0]["id"] == "64f000000000000000000002"
        assert results[0]["similarity_score"] == pytest.approx(1.0, abs=1e-4)
        # Scores should be non-increasing.
        scores = [r["similarity_score"] for r in results]
        assert scores == sorted(scores, reverse=True)

    @patch("semantic_search.engine.generate_embedding")
    @patch("semantic_search.engine.generate_embeddings")
    @patch("semantic_search.engine.product_service")
    def test_search_respects_top_k_param(
        self, mock_service, mock_gen_embeddings, mock_gen_embedding, fake_products
    ):
        import semantic_search.engine as engine_mod

        build_embeddings = _fake_embeddings(len(fake_products))
        mock_service.get_all_products.return_value = fake_products
        mock_gen_embeddings.return_value = build_embeddings
        engine_mod.build_index()

        mock_gen_embedding.return_value = build_embeddings[0]
        mock_service.get_products_by_ids.side_effect = (
            lambda ids: [p for p in fake_products if p["id"] in ids]
        )

        results = engine_mod.search_products("aviator sunglasses", top_k=1)

        assert len(results) == 1


if __name__ == "__main__":
    import sys
    sys.exit(pytest.main([__file__, "-v"]))