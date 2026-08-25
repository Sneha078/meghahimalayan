"""
Sentence embedding generation using a lightweight Sentence Transformer model.
"""

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIMENSION = 384  # all-MiniLM-L6-v2 output size

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    """Lazily load the sentence transformer model (loaded once, reused)."""
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def generate_embeddings(texts: list[str]) -> np.ndarray:
    """
    Generate normalized embeddings for a list of texts.
    Normalization allows using inner product for cosine similarity in FAISS.
    """
    if not texts:
        # Keep the shape 2D and consistent with a real encode() call so
        # callers can safely do len(embeddings) / embeddings.shape[1]
        # without special-casing the empty case themselves.
        return np.empty((0, EMBEDDING_DIMENSION), dtype="float32")

    model = get_model()
    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return embeddings.astype("float32")


def generate_embedding(text: str) -> np.ndarray:
    """Generate a normalized embedding for a single text/query."""
    return generate_embeddings([text])[0]