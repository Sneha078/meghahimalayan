"""
Hybrid Product Recommendation Engine.

Content-Based:
    TF-IDF + Cosine Similarity

Collaborative:
    User-product ratings from embedded MongoDB reviews

Hybrid:
    60% Content-Based
    40% Collaborative

MongoDB access is handled ONLY through product_service.py.
"""

from typing import List, Dict, Any, Optional

import pandas as pd
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from shared.product_service import (
    get_products_dataframe,
    get_all_reviews,
)

from shared.utils import safe_round


# ============================================================
# CONFIGURATION
# ============================================================

CONTENT_WEIGHT = 0.60
COLLABORATIVE_WEIGHT = 0.40


# ============================================================
# RECOMMENDATION ENGINE
# ============================================================

class RecommendationEngine:

    def __init__(self):

        self.df = pd.DataFrame()

        # Content-based
        self.vectorizer = None
        self.tfidf_matrix = None
        self.content_similarity = None

        # Collaborative
        self.user_item_matrix = pd.DataFrame()
        self.collaborative_similarity = None
        self.collaborative_product_ids = []

        # Mapping
        self.id_to_index: Dict[str, int] = {}

        self.build_index()

    # ========================================================
    # BUILD INDEX
    # ========================================================

    def build_index(self):

        self.build_content_model()

        self.build_collaborative_model()

    # ========================================================
    # CONTENT-BASED MODEL
    # ========================================================

    def build_content_model(self):

        self.df = get_products_dataframe()

        if self.df.empty:

            self.id_to_index = {}

            self.vectorizer = None
            self.tfidf_matrix = None
            self.content_similarity = None

            return

        text_columns = [
            "name",
            "category",
            "subcategory",
            "brand",
            "gender",
            "description",
            "tags",
            "occasion",
            "season",
            "attr_str",
        ]

        for column in text_columns:

            if column not in self.df.columns:

                self.df[column] = ""

            self.df[column] = (
                self.df[column]
                .fillna("")
                .astype(str)
            )

        # ----------------------------------------------------
        # Build product text
        # ----------------------------------------------------

        self.df["combined_features"] = (
            self.df["name"]
            + " "
            + self.df["category"]
            + " "
            + self.df["subcategory"]
            + " "
            + self.df["brand"]
            + " "
            + self.df["gender"]
            + " "
            + self.df["description"]
            + " "
            + self.df["tags"]
            + " "
            + self.df["occasion"]
            + " "
            + self.df["season"]
            + " "
            + self.df["attr_str"]
        )

        # ----------------------------------------------------
        # TF-IDF
        # ----------------------------------------------------

        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            min_df=1,
        )

        self.tfidf_matrix = (
            self.vectorizer.fit_transform(
                self.df["combined_features"]
            )
        )

        # ----------------------------------------------------
        # Cosine similarity
        # ----------------------------------------------------

        self.content_similarity = cosine_similarity(
            self.tfidf_matrix
        )

        # ----------------------------------------------------
        # Product ID mapping
        # ----------------------------------------------------

        self.id_to_index = {
            str(product_id): index
            for index, product_id
            in enumerate(
                self.df["product_id"]
            )
        }

    # ========================================================
    # COLLABORATIVE FILTERING
    # ========================================================

    def build_collaborative_model(self):

        reviews = get_all_reviews()

        if not reviews:

            self.user_item_matrix = pd.DataFrame()
            self.collaborative_similarity = None
            self.collaborative_product_ids = []

            return

        review_df = pd.DataFrame(reviews)

        if review_df.empty:

            self.user_item_matrix = pd.DataFrame()
            self.collaborative_similarity = None

            return

        required_columns = [
            "user_id",
            "product_id",
            "rating",
        ]

        for column in required_columns:

            if column not in review_df.columns:

                self.user_item_matrix = pd.DataFrame()
                self.collaborative_similarity = None

                return

        # ----------------------------------------------------
        # Clean ratings
        # ----------------------------------------------------

        review_df["rating"] = pd.to_numeric(
            review_df["rating"],
            errors="coerce",
        )

        review_df = review_df.dropna(
            subset=[
                "user_id",
                "product_id",
                "rating",
            ]
        )

        if review_df.empty:

            self.user_item_matrix = pd.DataFrame()
            self.collaborative_similarity = None

            return

        # ----------------------------------------------------
        # User × Product matrix
        # ----------------------------------------------------

        self.user_item_matrix = (
            review_df.pivot_table(
                index="user_id",
                columns="product_id",
                values="rating",
                aggfunc="mean",
            )
        )

        if self.user_item_matrix.empty:

            self.collaborative_similarity = None

            return

        self.collaborative_product_ids = [
            str(product_id)
            for product_id
            in self.user_item_matrix.columns
        ]

        # ----------------------------------------------------
        # Item-item similarity
        # ----------------------------------------------------

        rating_matrix = (
            self.user_item_matrix
            .fillna(0)
        )

        self.collaborative_similarity = (
            cosine_similarity(
                rating_matrix.T
            )
        )

    # ========================================================
    # CONTENT SIMILARITY
    # ========================================================

    def get_content_similar_products(
        self,
        product_id: str,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:

        product_id = str(product_id)

        if (
            self.content_similarity is None
            or product_id not in self.id_to_index
        ):
            return []

        index = self.id_to_index[
            product_id
        ]

        scores = list(
            enumerate(
                self.content_similarity[index]
            )
        )

        scores.sort(
            key=lambda item: item[1],
            reverse=True,
        )

        scores = [
            item
            for item in scores
            if item[0] != index
        ]

        scores = scores[:top_k]

        return self._format_results(
            scores,
            score_name="content_score",
        )

    # ========================================================
    # COLLABORATIVE SCORES
    # ========================================================

    def get_collaborative_scores(
        self,
        product_id: str,
    ) -> Dict[str, float]:

        if (
            self.collaborative_similarity is None
            or self.user_item_matrix.empty
        ):
            return {}

        product_id = str(product_id)

        if (
            product_id
            not in self.collaborative_product_ids
        ):
            return {}

        product_index = (
            self.collaborative_product_ids
            .index(product_id)
        )

        scores = {}

        for index, other_product in enumerate(
            self.collaborative_product_ids
        ):

            if other_product == product_id:
                continue

            score = (
                self.collaborative_similarity[
                    product_index
                ][index]
            )

            scores[other_product] = float(
                score
            )

        return scores

    # ========================================================
    # HYBRID SIMILAR PRODUCTS
    # ========================================================

    def get_similar_products(
        self,
        product_id: str,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:

        product_id = str(product_id)

        if self.df.empty:

            self.build_index()

        if (
            self.content_similarity is None
            or product_id not in self.id_to_index
        ):
            return []

        index = self.id_to_index[
            product_id
        ]

        collaborative_scores = (
            self.get_collaborative_scores(
                product_id
            )
        )

        results = []

        # ----------------------------------------------------
        # Calculate hybrid score
        # ----------------------------------------------------

        for other_index in range(
            len(self.df)
        ):

            other_id = str(
                self.df.iloc[
                    other_index
                ]["product_id"]
            )

            if other_id == product_id:
                continue

            content_score = float(
                self.content_similarity[
                    index
                ][other_index]
            )

            collaborative_score = (
                collaborative_scores.get(
                    other_id,
                    0.0,
                )
            )

            hybrid_score = (
                CONTENT_WEIGHT
                * content_score
                +
                COLLABORATIVE_WEIGHT
                * collaborative_score
            )

            results.append(
                {
                    "id": other_id,
                    "product_id": other_id,

                    "content_score": safe_round(
                        content_score
                    ),

                    "collaborative_score": safe_round(
                        collaborative_score
                    ),

                    "score": safe_round(
                        hybrid_score
                    ),

                    "recommendation_type": "hybrid",
                }
            )

        results.sort(
            key=lambda item: item["score"],
            reverse=True,
        )

        return self._attach_product_details(
            results[:top_k]
        )

    # ========================================================
    # PERSONALIZED RECOMMENDATIONS
    # ========================================================

    def get_recommendations_for_user(
        self,
        viewed_product_ids: Optional[
            List[str]
        ] = None,
        user_id: Optional[str] = None,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:

        viewed_product_ids = [
            str(product_id)
            for product_id
            in (viewed_product_ids or [])
        ]

        # ----------------------------------------------------
        # Collaborative scores
        # ----------------------------------------------------

        collaborative_scores = {}

        if (
            user_id
            and not self.user_item_matrix.empty
            and user_id in self.user_item_matrix.index
        ):

            user_ratings = (
                self.user_item_matrix
                .loc[user_id]
                .dropna()
            )

            for rated_product, rating in (
                user_ratings.items()
            ):

                similar_products = (
                    self.get_collaborative_scores(
                        str(rated_product)
                    )
                )

                for product_id, similarity in (
                    similar_products.items()
                ):

                    if (
                        product_id
                        in viewed_product_ids
                    ):
                        continue

                    score = (
                        similarity
                        * float(rating)
                    )

                    collaborative_scores[
                        product_id
                    ] = (
                        collaborative_scores.get(
                            product_id,
                            0.0,
                        )
                        + score
                    )

        # ----------------------------------------------------
        # Content scores
        # ----------------------------------------------------

        content_scores = {}

        for viewed_id in viewed_product_ids:

            if (
                viewed_id
                not in self.id_to_index
            ):
                continue

            index = self.id_to_index[
                viewed_id
            ]

            for other_index in range(
                len(self.df)
            ):

                other_id = str(
                    self.df.iloc[
                        other_index
                    ]["product_id"]
                )

                if (
                    other_id
                    in viewed_product_ids
                ):
                    continue

                score = float(
                    self.content_similarity[
                        index
                    ][other_index]
                )

                content_scores[
                    other_id
                ] = max(
                    content_scores.get(
                        other_id,
                        0.0,
                    ),
                    score,
                )

        # ----------------------------------------------------
        # Combine
        # ----------------------------------------------------

        all_product_ids = (
            set(content_scores)
            |
            set(collaborative_scores)
        )

        results = []

        for product_id in all_product_ids:

            content_score = (
                content_scores.get(
                    product_id,
                    0.0,
                )
            )

            collaborative_score = (
                collaborative_scores.get(
                    product_id,
                    0.0,
                )
            )

            hybrid_score = (
                CONTENT_WEIGHT
                * content_score
                +
                COLLABORATIVE_WEIGHT
                * collaborative_score
            )

            results.append(
                {
                    "id": product_id,
                    "product_id": product_id,

                    "content_score": safe_round(
                        content_score
                    ),

                    "collaborative_score": safe_round(
                        collaborative_score
                    ),

                    "score": safe_round(
                        hybrid_score
                    ),

                    "recommendation_type": "hybrid",
                }
            )

        # ----------------------------------------------------
        # Cold start
        # ----------------------------------------------------

        if not results:

            results = self._popular_products(
                top_k=top_k
            )

        results.sort(
            key=lambda item: item["score"],
            reverse=True,
        )

        return self._attach_product_details(
            results[:top_k]
        )

    # ========================================================
    # POPULAR PRODUCTS
    # ========================================================

    def _popular_products(
        self,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:

        if self.df.empty:
            return []

        df = self.df.copy()

        df["rating"] = pd.to_numeric(
            df["rating"],
            errors="coerce",
        ).fillna(0)

        # Rating + review count would be better
        # later if you expose numOfReviews.
        df = df.sort_values(
            "rating",
            ascending=False,
        )

        results = []

        for _, row in df.head(
            top_k
        ).iterrows():

            product_id = str(
                row["product_id"]
            )

            rating = float(
                row["rating"]
            )

            results.append(
                {
                    "id": product_id,
                    "product_id": product_id,

                    "content_score": 0.0,

                    "collaborative_score": 0.0,

                    "score": safe_round(
                        rating / 5
                    ),

                    "recommendation_type":
                        "popular",
                }
            )

        return results

    # ========================================================
    # FORMAT RESULTS
    # ========================================================

    def _format_results(
        self,
        scored_indices,
        score_name="score",
    ):

        results = []

        for index, score in scored_indices:

            row = self.df.iloc[index]

            results.append(
                {
                    "id": str(
                        row["product_id"]
                    ),

                    "product_id": str(
                        row["product_id"]
                    ),

                    "name": str(
                        row["name"]
                    ),

                    "category": str(
                        row["category"]
                    ),

                    "brand": str(
                        row["brand"]
                    ),

                    "price": float(
                        row["price"]
                    ),

                    "rating": float(
                        row["rating"]
                    ),

                    score_name: safe_round(
                        score
                    ),

                    "score": safe_round(
                        score
                    ),

                    "image": str(
                        row.get(
                            "image_url",
                            ""
                        )
                    ),

                    "description": str(
                        row["description"]
                    ),
                }
            )

        return results

    # ========================================================
    # ATTACH PRODUCT DETAILS
    # ========================================================

    def _attach_product_details(
        self,
        results,
    ):

        if not results:
            return []

        product_lookup = {
            str(row["product_id"]): row
            for _, row
            in self.df.iterrows()
        }

        formatted = []

        for result in results:

            product_id = str(
                result["product_id"]
            )

            row = product_lookup.get(
                product_id
            )

            if row is None:
                continue

            item = dict(result)

            item.update(
                {
                    "name": str(
                        row["name"]
                    ),

                    "category": str(
                        row["category"]
                    ),

                    "subcategory": str(
                        row.get(
                            "subcategory",
                            ""
                        )
                    ),

                    "brand": str(
                        row["brand"]
                    ),

                    "price": float(
                        row["price"]
                    ),

                    "rating": float(
                        row["rating"]
                    ),

                    "image": str(
                        row.get(
                            "image_url",
                            ""
                        )
                    ),

                    "description": str(
                        row["description"]
                    ),
                }
            )

            formatted.append(item)

        return formatted


# ============================================================
# SHARED ENGINE INSTANCE
# ============================================================

recommendation_engine = RecommendationEngine()