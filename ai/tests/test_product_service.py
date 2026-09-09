"""
Tests for shared/product_service.py.

These tests mock `database.connection.products_collection` (patched as
imported into `shared.product_service`) so they run without a live
MongoDB connection.
"""

import pandas as pd
import pytest
from bson import ObjectId
import re

import shared.product_service as product_service


# ============================================================
# FAKE MONGO COLLECTION
# ============================================================

class FakeCursor:
    def __init__(self, docs):
        self._docs = docs

    def __iter__(self):
        return iter(self._docs)


class FakeProductsCollection:
    def __init__(self, docs):
        self.docs = docs

    def find(self, query=None, projection=None):
        query = query or {}
        results = self.docs

        if "_id" in query:
            id_query = query["_id"]
            if isinstance(id_query, dict) and "$in" in id_query:
                wanted = set(id_query["$in"])
                results = [p for p in results if p["_id"] in wanted]
            else:
                results = [p for p in results if p["_id"] == id_query]

        if "category" in query:
            cat_q = query["category"]
            if isinstance(cat_q, dict) and "$regex" in cat_q:
                flags = re.IGNORECASE if cat_q.get("$options") == "i" else 0
                pattern = re.compile(cat_q["$regex"], flags)
                results = [p for p in results if pattern.match(p.get("category", ""))]
            else:
                results = [p for p in results if p.get("category") == cat_q]
            

        if "gender" in query:
            g = query["gender"]
            if isinstance(g, dict) and "$in" in g:
                wanted = set(g["$in"])
                results = [p for p in results if p.get("gender") in wanted]

        if "price" in query:
            price_q = query["price"]

            def ok(p):
                price = p.get("price", 0)
                if "$gte" in price_q and price < price_q["$gte"]:
                    return False
                if "$lte" in price_q and price > price_q["$lte"]:
                    return False
                return True

            results = [p for p in results if ok(p)]

        return FakeCursor(results)

    def find_one(self, query=None, projection=None):
        docs = list(self.find(query, projection))
        return docs[0] if docs else None


# ============================================================
# FIXTURES
# ============================================================

def make_docs():
    return [
        {
            "_id": ObjectId(),
            "name": "Ray-Ban Matte Black Polarized",
            "slug": "ray-ban-matte-black",
            "description": "Classic Ray-Ban matte black frame.",
            "category": "eyeglasses",
            "brand": "Ray-Ban",
            "subcategory": "Sunglasses",
            "gender": "Men",
            "price": 1950,
            "discountPrice": 1650,
            "ratings": 4.9,
            "image": [{"public_id": "x", "url": "http://example.com/p1.jpg"}],
            "isFeatured": True,
            "isBestSeller": True,
            "isNewArrival": False,
            "stock": 18,
            "isOutOfStock": False,
            "frameShape": "Square",
            "frameMaterial": "Acetate",
            "frameColor": "Matte Black",
            "lensType": "Polarized UV400",
            "reviews": [
                {"_id": ObjectId(), "user": ObjectId(), "name": "Sneha",
                 "rating": 5, "comment": "Great glasses",
                 "createdAt": None, "updatedAt": None},
            ],
        },
        {
            # NOTE: no fragranceFamily/fragranceType/volume keys at all --
            # this is the case that must NOT crash get_products_dataframe().
            "_id": ObjectId(),
            "name": "Dior Sauvage Elixir",
            "slug": "dior-sauvage-elixir",
            "description": "Spicy lavender and sandalwood.",
            "category": "perfumes",
            "brand": "Dior",
            "subcategory": "Eau de Parfum",
            "gender": "Men",
            "price": 18500,
            "discountPrice": 15999,
            "ratings": 4.9,
            "image": [{"public_id": "x", "url": "http://example.com/p2.jpg"}],
            "isFeatured": True,
            "isBestSeller": True,
            "isNewArrival": False,
            "stock": 14,
            "isOutOfStock": False,
            "reviews": [],
        },
        {
            "_id": ObjectId(),
            "name": "Casio Edifice Chronograph",
            "slug": "casio-edifice-chronograph",
            "description": "Casio Edifice premium chronograph.",
            "category": "watches",
            "brand": "Casio",
            "subcategory": "Chronograph",
            "gender": "Unisex",
            "price": 10500,
            "discountPrice": None,
            "ratings": 4.9,
            "image": [],  # no images at all -- must not crash
            "isFeatured": True,
            "isBestSeller": True,
            "isNewArrival": False,
            "stock": 8,
            "isOutOfStock": False,
            "watchType": "Chronograph",
            "dialColor": "Black / Silver",
            "strapMaterial": "Stainless Steel",
            "caseSize": "44mm",
            "movementType": "Quartz Chronograph",
            "waterResistance": "100m",
            "reviews": [
                {"_id": ObjectId(), "user": ObjectId(), "name": "Bibek",
                 "rating": 4, "comment": "Solid watch",
                 "createdAt": None, "updatedAt": None},
            ],
        },
    ]


@pytest.fixture
def docs():
    return make_docs()


@pytest.fixture
def fake_collection(monkeypatch, docs):
    collection = FakeProductsCollection(docs)
    monkeypatch.setattr(product_service, "products_collection", collection)
    return collection


# ============================================================
# REGRESSION: get_products_dataframe must not crash
# ============================================================

class TestGetProductsDataframe:

    def test_does_not_raise(self, fake_collection):
        """
        Regression test for a bug where attribute_columns listed
        'fragnanceFamily'/'fragnanceType' (typo) instead of
        'fragranceFamily'/'fragranceType', and the fallback branch for a
        genuinely-missing column tried to read df[column] before it had
        been created -- both of which raised KeyError on every call.
        """
        df = product_service.get_products_dataframe()
        assert isinstance(df, pd.DataFrame)
        assert not df.empty

    def test_missing_fragrance_fields_default_to_empty_string(self, fake_collection):
        # The Dior doc in make_docs() has no fragranceFamily/fragranceType/volume
        df = product_service.get_products_dataframe()
        dior_row = df[df["name"] == "Dior Sauvage Elixir"].iloc[0]
        assert dior_row["fragranceFamily"] == ""
        assert dior_row["fragranceType"] == ""
        assert dior_row["volume"] == ""

    def test_attr_str_combines_present_attributes(self, fake_collection):
        df = product_service.get_products_dataframe()
        rayban_row = df[df["name"] == "Ray-Ban Matte Black Polarized"].iloc[0]
        for expected in ["Square", "Acetate", "Matte Black", "Polarized UV400"]:
            assert expected in rayban_row["attr_str"]

    def test_attr_str_has_no_stray_extra_whitespace_from_empties(self, fake_collection):
        df = product_service.get_products_dataframe()
        dior_row = df[df["name"] == "Dior Sauvage Elixir"].iloc[0]
        # perfume-only doc has none of the eyeglasses/watch attributes either,
        # so attr_str should just be empty, not a string of stray spaces
        assert dior_row["attr_str"] == ""

    def test_product_id_is_string(self, fake_collection):
        df = product_service.get_products_dataframe()
        assert df["product_id"].apply(lambda v: isinstance(v, str)).all()

    def test_price_and_rating_are_numeric(self, fake_collection):
        df = product_service.get_products_dataframe()
        assert pd.api.types.is_numeric_dtype(df["price"])
        assert pd.api.types.is_numeric_dtype(df["rating"])

    def test_missing_discount_price_does_not_crash(self, fake_collection):
        # Casio doc has discountPrice=None
        df = product_service.get_products_dataframe()
        assert df is not None

    def test_empty_collection_returns_empty_dataframe(self, monkeypatch):
        monkeypatch.setattr(product_service, "products_collection", FakeProductsCollection([]))
        df = product_service.get_products_dataframe()
        assert df.empty


# ============================================================
# FIELD MAPPING (MongoDB schema -> AI normalized schema)
# ============================================================

class TestProductToDict:

    def test_ratings_field_mapped_to_rating(self, fake_collection, docs):
        result = product_service._product_to_dict(docs[0])
        assert result["rating"] == docs[0]["ratings"]

    def test_image_url_extracted_from_first_image(self, fake_collection, docs):
        result = product_service._product_to_dict(docs[0])
        assert result["image_url"] == docs[0]["image"][0]["url"]

    def test_image_url_empty_when_no_images(self, fake_collection, docs):
        # third doc has image: []
        result = product_service._product_to_dict(docs[2])
        assert result["image_url"] == ""

    def test_id_stringified(self, fake_collection, docs):
        result = product_service._product_to_dict(docs[0])
        assert result["id"] == str(docs[0]["_id"])
        assert isinstance(result["id"], str)

    def test_gender_defaults_to_unisex(self, fake_collection):
        doc = {"_id": ObjectId(), "name": "No Gender Product"}
        result = product_service._product_to_dict(doc)
        assert result["gender"] == "Unisex"


# ============================================================
# REVIEWS
# ============================================================

class TestReviews:

    def test_get_all_reviews_flattens_embedded_reviews(self, fake_collection):
        reviews = product_service.get_all_reviews()
        assert len(reviews) == 2  # one on Ray-Ban, one on Casio, none on Dior

    def test_review_field_mapping(self, fake_collection, docs):
        rayban_doc = docs[0]
        result = product_service._review_to_dict(
            rayban_doc["reviews"][0], str(rayban_doc["_id"])
        )
        assert result["user_id"] == str(rayban_doc["reviews"][0]["user"])
        assert result["user_name"] == "Sneha"
        assert result["review_text"] == "Great glasses"
        assert result["rating"] == 5

    def test_get_reviews_for_product_invalid_id_returns_empty(self, fake_collection):
        assert product_service.get_reviews_for_product("not-a-valid-objectid") == []

    def test_get_reviews_for_product_valid_id(self, fake_collection, docs):
        rayban_id = str(docs[0]["_id"])
        reviews = product_service.get_reviews_for_product(rayban_id)
        assert len(reviews) == 1
        assert reviews[0]["user_name"] == "Sneha"

    def test_get_all_reviews_empty_collection(self, monkeypatch):
        monkeypatch.setattr(product_service, "products_collection", FakeProductsCollection([]))
        assert product_service.get_all_reviews() == []


# ============================================================
# LOOKUPS AND FILTERS
# ============================================================

class TestLookupsAndFilters:

    def test_get_product_by_valid_id(self, fake_collection, docs):
        pid = str(docs[0]["_id"])
        result = product_service.get_product(pid)
        assert result is not None
        assert result["name"] == "Ray-Ban Matte Black Polarized"

    def test_get_product_invalid_id_returns_none(self, fake_collection):
        assert product_service.get_product("not-a-valid-objectid") is None

    def test_get_product_not_found_returns_none(self, fake_collection):
        assert product_service.get_product(str(ObjectId())) is None

    def test_get_products_by_category(self, fake_collection):
        results = product_service.get_products_by_category("watches")
        assert len(results) == 1
        assert results[0]["name"] == "Casio Edifice Chronograph"

    def test_get_products_by_ids_filters_invalid_ids(self, fake_collection, docs):
        valid_id = str(docs[0]["_id"])
        results = product_service.get_products_by_ids([valid_id, "garbage-id"])
        assert len(results) == 1

    def test_get_products_by_ids_empty_list(self, fake_collection):
        assert product_service.get_products_by_ids([]) == []

    def test_filter_products_by_price_range(self, fake_collection):
        results = product_service.filter_products(min_price=2000, max_price=15000)
        names = [r["name"] for r in results]
        assert "Casio Edifice Chronograph" in names
        assert "Ray-Ban Matte Black Polarized" not in names  # price 1950 < 2000
        assert "Dior Sauvage Elixir" not in names  # price 18500 > 15000

    def test_filter_products_by_gender_includes_unisex(self, fake_collection):
        # Casio is Unisex; filtering for "Men" should still include it
        results = product_service.filter_products(gender="Men")
        names = {r["name"] for r in results}
        assert "Casio Edifice Chronograph" in names
        assert "Ray-Ban Matte Black Polarized" in names

    def test_filter_products_by_category(self, fake_collection):
        results = product_service.filter_products(category="perfumes")
        assert len(results) == 1
        assert results[0]["name"] == "Dior Sauvage Elixir"