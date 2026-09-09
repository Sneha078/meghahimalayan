import pytest
from database.connection import get_db, products_collection

pytestmark = pytest.mark.integration


def test_database_connection():
    db = get_db()
    result = db.command("ping")
    assert result["ok"] == 1


def test_products_exist():
    count = products_collection.count_documents({})
    assert count > 0


def test_product_structure():
    product = products_collection.find_one({})
    assert product is not None

    required_fields = ["name", "category", "brand", "price", "stock"]
    for field in required_fields:
        assert field in product