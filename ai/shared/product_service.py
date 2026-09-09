"""
Product data access layer.
"""

from typing import Optional
import re

import pandas as pd
from bson import ObjectId

from database.connection import products_collection


def _stringify_id(value) -> str:
    if value is None:
        return ""
    return str(value)


def _get_image_url(product: dict) -> str:
    images = product.get("image") or []
    if not images:
        return ""
    first_image = images[0]
    if isinstance(first_image, dict):
        return first_image.get("url", "") or ""
    return ""


def _product_to_dict(product: dict) -> dict:
    return {
        "id": _stringify_id(product.get("_id")),
        "name": product.get("name", ""),
        "slug": product.get("slug", ""),
        "description": product.get("description", ""),
        "category": product.get("category", ""),
        "brand": product.get("brand", ""),
        "subcategory": product.get("subcategory", ""),
        "gender": product.get("gender", "Unisex"),
        "price": product.get("price", 0),
        "discountPrice": product.get("discountPrice"),
        "rating": product.get("ratings", 0),
        "image_url": _get_image_url(product),
        "images": product.get("image", []) or [],
        "isFeatured": product.get("isFeatured", False),
        "isBestSeller": product.get("isBestSeller", False),
        "isNewArrival": product.get("isNewArrival", False),
        "stock": product.get("stock", 0),
        "isOutOfStock": product.get("isOutOfStock", False),
        "frameShape": product.get("frameShape", ""),
        "frameMaterial": product.get("frameMaterial", ""),
        "frameColor": product.get("frameColor", ""),
        "lensType": product.get("lensType", ""),
        "watchType": product.get("watchType", ""),
        "dialColor": product.get("dialColor", ""),
        "strapMaterial": product.get("strapMaterial", ""),
        "caseSize": product.get("caseSize", ""),
        "movementType": product.get("movementType", ""),
        "waterResistance": product.get("waterResistance", ""),
        "fragranceFamily": product.get("fragranceFamily", ""),
        "fragranceType": product.get("fragranceType", ""),
        "volume": product.get("volume", ""),
    }


def _review_to_dict(review: dict, product_id: str) -> dict:
    return {
        "id": _stringify_id(review.get("_id")),
        "product_id": str(product_id),
        "user_id": _stringify_id(review.get("user")),
        "user_name": review.get("name", ""),
        "rating": review.get("rating", 0),
        "review_text": review.get("comment", ""),
        "created_at": review.get("createdAt"),
        "updated_at": review.get("updatedAt"),
    }


def get_all_products() -> list[dict]:
    products = products_collection.find({})
    return [_product_to_dict(product) for product in products]


def get_product(product_id: str) -> Optional[dict]:
    if not ObjectId.is_valid(product_id):
        return None
    product = products_collection.find_one({"_id": ObjectId(product_id)})
    if product is None:
        return None
    return _product_to_dict(product)


def get_products_by_category(category: str) -> list[dict]:
    products = products_collection.find({"category": category})
    return [_product_to_dict(product) for product in products]


def get_products_by_ids(product_ids: list[str]) -> list[dict]:
    if not product_ids:
        return []
    valid_ids = [ObjectId(pid) for pid in product_ids if ObjectId.is_valid(pid)]
    if not valid_ids:
        return []
    products = products_collection.find({"_id": {"$in": valid_ids}})
    return [_product_to_dict(product) for product in products]


def get_reviews_for_product(product_id: str) -> list[dict]:
    if not ObjectId.is_valid(product_id):
        return []
    product = products_collection.find_one({"_id": ObjectId(product_id)}, {"reviews": 1})
    if not product:
        return []
    reviews = product.get("reviews", []) or []
    return [_review_to_dict(review, product_id) for review in reviews]


def get_all_reviews() -> list[dict]:
    products = products_collection.find({}, {"_id": 1, "reviews": 1})
    all_reviews = []
    for product in products:
        product_id = _stringify_id(product.get("_id"))
        reviews = product.get("reviews", []) or []
        for review in reviews:
            all_reviews.append(_review_to_dict(review, product_id))
    return all_reviews


def filter_products(
    category: Optional[str] = None,
    max_price: Optional[float] = None,
    min_price: Optional[float] = None,
    gender: Optional[str] = None,
    color: Optional[str] = None,
) -> list[dict]:
    query = {}
    if category:
        query["category"] = {"$regex": f"^{category}$", "$options": "i"}
    price_filter = {}
    if min_price is not None:
        price_filter["$gte"] = min_price
    if max_price is not None:
        price_filter["$lte"] = max_price
    if price_filter:
        query["price"] = price_filter
    if gender:
        query["gender"] = {"$in": [gender, "Unisex"]}
    if color:
        # Match against dialColor (watches) and frameColor (eyeglasses).
        # Perfumes have no colour field so this naturally returns nothing
        # for perfumes when a colour is requested, which is correct.
        color_regex = {"$regex": color, "$options": "i"}
        query["$or"] = [
            {"dialColor": color_regex},
            {"frameColor": color_regex},
        ]
    products = products_collection.find(query)
    return [_product_to_dict(product) for product in products]


def get_products_dataframe() -> pd.DataFrame:
    products = get_all_products()
    if not products:
        return pd.DataFrame()

    df = pd.DataFrame(products)

    df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0)
    df["rating"] = pd.to_numeric(df["rating"], errors="coerce").fillna(0)
    df["product_id"] = df["id"].astype(str)
    df["image"] = df["image_url"].fillna("").astype(str)

    attribute_columns = [
        "frameShape",
        "frameMaterial",
        "frameColor",
        "lensType",
        "watchType",
        "dialColor",
        "strapMaterial",
        "caseSize",
        "movementType",
        "waterResistance",
        "fragranceFamily",
        "fragranceType",
        "volume",
    ]

    for column in attribute_columns:
        if column not in df.columns:
            df[column] = ""
        df[column] = df[column].fillna("").astype(str)

    df["attr_str"] = (
        df[attribute_columns].apply(
            lambda row: " ".join(value for value in row if value),
            axis=1,
        )
    )

    return df