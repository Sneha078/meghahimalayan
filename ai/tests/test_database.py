from database.connection import (
    db,
    products_collection,
)


def test_database_connection():
    # Ping MongoDB
    result = db.command("ping")

    assert result["ok"] == 1

    print("\nMongoDB connection successful!")


def test_products_exist():
    count = products_collection.count_documents({})

    print(f"\nProducts in database: {count}")

    assert count > 0


def test_product_structure():
    product = products_collection.find_one({})

    assert product is not None

    required_fields = [
        "name",
        "category",
        "brand",
        "price",
        "stock",
    ]

    for field in required_fields:
        assert field in product

    print("\nProduct structure is valid.")